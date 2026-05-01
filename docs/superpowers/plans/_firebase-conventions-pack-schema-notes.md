# Schema Notes for Firebase Conventions Pack

Generated: 2026-05-01 by Task 0 of the implementation plan.
This file is consumed by Tasks 14 (hooks) and 15 (MDC rules).
Will be deleted at the end of Task 17.

Sources:
- Claude Code hooks: https://code.claude.com/docs/en/hooks (redirected from docs.claude.com/en/docs/claude-code/hooks)
- Cursor MDC rules: https://cursor.com/docs/context/rules (redirected from docs.cursor.com/context/rules)

---

## Claude Code hooks schema (`.claude/settings.json`)

The `hooks` block sits at the **root** of any of:
- `~/.claude/settings.json` (user)
- `.claude/settings.json` (project, checked-in)
- `.claude/settings.local.json` (project, gitignored)

It is a peer of `permissions`, `enabledPlugins`, etc. Inside `hooks`, each event name (e.g. `PreToolUse`) maps to an **array of matcher groups**, and each matcher group has a `matcher` plus an inner `hooks` array of handlers.

### Top-level shape

```jsonc
{
  "permissions": { /* ... */ },
  "enabledPlugins": { /* ... */ },
  "hooks": {
    "PreToolUse": [ /* matcher groups */ ],
    "PostToolUse": [ /* matcher groups */ ],
    "UserPromptSubmit": [ /* matcher groups */ ],
    "SessionStart": [ /* matcher groups */ ]
    // ... other events
  }
}
```

### Matcher group shape (same for all events)

```jsonc
{
  "matcher": "Edit|Write",          // see "Matcher syntax" below
  "hooks": [
    {
      "type": "command",            // currently the only documented type
      "command": "path/to/script.sh",
      "if": "Edit(src/**/*.ts)",    // OPTIONAL — permission-rule narrowing
      "timeout": 600,               // OPTIONAL seconds
      "statusMessage": "..."        // OPTIONAL
    }
  ]
}
```

### PreToolUse / PostToolUse entry shape

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "if": "Edit(packages/shared/src/schemas/**/*.ts)|Write(packages/shared/src/schemas/**/*.ts)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/schema-guard.sh"
          }
        ]
      }
    ]
  }
}
```

`PostToolUse` uses the exact same shape — only the event name changes.

### UserPromptSubmit entry shape

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",   // empty/"*"/omitted = match every prompt
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/inject-context.sh"
          }
        ]
      }
    ]
  }
}
```

For `UserPromptSubmit` the `matcher` field is rarely useful (no tool name or file path to match on); leave it `""`.

### Matcher syntax

The `matcher` field is evaluated in three modes based on its content:

| Pattern | Evaluated As | Example |
|---------|--------------|---------|
| `"*"`, `""`, or omitted | Match all | Fires every time |
| Only `[A-Za-z0-9_|]` | Exact name or `\|`-separated list | `"Bash"`, `"Edit\|Write"` |
| Anything else | JavaScript regex | `"^Notebook"`, `"mcp__.*"` |

**Tool events** (`PreToolUse`, `PostToolUse`) match `tool_name`.

**Other events** match different fields:
- `SessionStart`: `"startup" | "resume" | "clear" | "compact"`
- `FileChanged`: literal filenames only (no regex/glob)

### Combining tool name + path/command — use the `if` field

To match BOTH a tool AND a file path or command pattern in one hook, use `matcher` for the tool name and `if` for the inner constraint. The `if` field uses **permission-rule syntax** (the same syntax allowed in `permissions`), NOT raw globs:

- File-path narrowing: `"if": "Edit(src/**/*.ts)|Write(src/**/*.ts)"`
- Bash-command narrowing: `"if": "Bash(git push *)"` or `"if": "Bash(rm -rf *)"`

The `if` field is **only evaluated on tool events**. The hook only spawns when both `matcher` and `if` succeed.

### Hook script contract

#### Stdin (JSON)

The script receives a single JSON object on stdin. Common keys (all events):
- `session_id`
- `transcript_path`
- `cwd`
- `hook_event_name`
- `permission_mode`

Event-specific keys:
- `PreToolUse` / `PostToolUse`: `tool_name`, `tool_input` (object whose shape depends on the tool — `tool_input.command` for Bash, `tool_input.file_path` + `tool_input.new_string` / `tool_input.content` for Edit/Write)
- `UserPromptSubmit`: `prompt`

Read with `jq`:
```bash
PROMPT=$(jq -r '.prompt' < /dev/stdin)
FILE_PATH=$(jq -r '.tool_input.file_path' < /dev/stdin)
COMMAND=$(jq -r '.tool_input.command' < /dev/stdin)
```

#### Exit codes

| Exit code | Meaning |
|-----------|---------|
| `0` | Success. Stdout is parsed as JSON output (see below). If not JSON, stdout becomes added context (on `SessionStart`/`UserPromptSubmit`/`UserPromptExpansion`) or debug log otherwise. |
| `2` | Blocking error. Stderr is shown to Claude/user. Tool call is blocked, prompt rejected. Stdout/JSON ignored. |
| anything else | Non-blocking error. First stderr line shown in transcript; full stderr in debug log. Execution continues. |

#### Stdout JSON output (on exit 0)

For `PreToolUse`, the recommended pattern is to print JSON like:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Schema drift: edit packages/shared/src/schemas/ first",
    "additionalContext": "optional extra string"
  }
}
```

`permissionDecision` ∈ `{"allow", "deny", "ask", "defer"}`. For `PostToolUse` and `Stop` events, use top-level `{"decision": "block", "reason": "..."}` instead of `hookSpecificOutput`.

For `UserPromptSubmit`, `additionalContext` inside `hookSpecificOutput` is appended to the prompt context.

### Concrete examples (3)

#### (a) PreToolUse — Edit/Write on a path glob

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "if": "Edit(src/**/*.ts)|Write(src/**/*.ts)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-ts.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/validate-ts.sh`:
```bash
#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path' < /dev/stdin)
if ! tsc --noEmit "$FILE_PATH"; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"TypeScript error"}}'
fi
exit 0
```

#### (b) PreToolUse — Bash command regex

```jsonc
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/block-rm.sh`:
```bash
#!/bin/bash
COMMAND=$(jq -r '.tool_input.command' < /dev/stdin)
if echo "$COMMAND" | grep -qE '^rm\s+-rf'; then
  jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"rm -rf is not allowed"}}'
fi
exit 0
```

#### (c) UserPromptSubmit

```jsonc
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/inject-context.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/inject-context.sh`:
```bash
#!/bin/bash
PROMPT=$(jq -r '.prompt' < /dev/stdin)
CWD=$(jq -r '.cwd' < /dev/stdin)
BRANCH=$(cd "$CWD" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
jq -n --arg branch "$BRANCH" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:"Current branch: \($branch)"}}'
exit 0
```

### Path globs vs tool name matchers — summary

- **Tool name** lives in `matcher` (string regex / `|`-list / `*`).
- **File path / Bash command** lives in `if` and uses **permission-rule syntax** (`Edit(glob)`, `Write(glob)`, `Bash(pattern)`), NOT a separate `path_glob` or `command_regex` field.
- For `FileChanged` events (different from `PreToolUse`), `matcher` itself takes literal filenames `".envrc|.env"` — no globs.

---

## Cursor MDC rules schema (`.cursor/rules/*.mdc`)

Cursor MDC files are markdown with YAML frontmatter. Three frontmatter keys, all behaviorally meaningful — there is **no** `applyType` or `name` key.

### Frontmatter keys

| Key | Required? | Type | Purpose |
|---|---|---|---|
| `alwaysApply` | yes | boolean | If `true`, rule injected into every chat regardless of file context. |
| `description` | optional | string | Free-text agent-readable summary. When set with `alwaysApply: false` and no `globs`, the agent decides whether to pull the rule based on this description ("Agent Requested" mode). |
| `globs` | optional | string (comma-separated) | When present with `alwaysApply: false`, the rule auto-attaches whenever a file matching any of the globs is in context. |

`globs` is a **comma-separated string**, NOT a YAML list, NOT a JSON array:

```yaml
globs: src/components/**/*.tsx, src/utils/**/*.ts
```

### Activation matrix

Cursor's injection logic depends on the combination of frontmatter values:

| `alwaysApply` | `description` | `globs` | Mode | Behavior |
|---|---|---|---|---|
| `true` | — | — | **Always** | Included in every chat session. |
| `false` | — | provided | **Auto Attached** | Included whenever a file matching `globs` is in context. |
| `false` | provided | omitted | **Agent Requested** | Agent reads `description` and pulls the rule when it judges relevant. |
| `false` | omitted | omitted | **Manual** | Only included when explicitly `@`-mentioned in chat. |

Rule activation is therefore driven by **`globs` for path-scoped rules** and **`description` for semantically-scoped rules**. There is no `name` field — Cursor uses the filename (`.cursor/rules/<name>.mdc`) as the identifier.

### Concrete example

`.cursor/rules/react-components.mdc`:

```mdc
---
description: React component conventions for src/components
globs: src/components/**/*.tsx
alwaysApply: false
---

- Use named exports exclusively.
- Co-locate styles in separate `.module.css` files.
- Keep components under 200 lines.
```

For an "Always Apply" rule (e.g. project-wide stack reminder):

```mdc
---
description: AdSmart stack baseline reminders
alwaysApply: true
---

- Firestore writes touching wallet/transactions go through Cloud Functions, never client.
- Schemas live in `packages/shared/src/schemas/` — edit there first.
```

For an "Agent Requested" rule (no `globs`, has `description`):

```mdc
---
description: How to add a new composite Firestore index
alwaysApply: false
---

- Edit firestore.indexes.json, deploy with `firebase deploy --only firestore:indexes --project <env>`.
- Builds are async; query stays red 1-3 min until status flips to Enabled.
```

---

## Open questions

1. **`UserPromptSubmit` `matcher` semantics** — The docs say tool events match `tool_name`, but for `UserPromptSubmit` the matcher field is undocumented. Empirically `""` (match-all) is the safe default and matches every example. The controller should default to `"matcher": ""` for `UserPromptSubmit` hooks unless a clear sub-type emerges later.

2. **Permission-rule syntax for `if`** — The docs show `Edit(src/**/*.ts)|Write(src/**/*.ts)` and `Bash(git *)` but don't enumerate the full grammar. For Task 14 we should stick to the demonstrated forms: `<ToolName>(<glob-or-pattern>)` joined with `|`. If a hook needs more nuance (e.g. negation), the controller should fall back to in-script logic instead of trying clever `if` strings.

3. **Cursor "Manual" rules and `@`-mention name** — Without a `name` frontmatter key, the assumption is that the filename (sans `.mdc`) is the `@`-mention token. This is consistent with the docs but not explicitly stated. Task 15 should pick filenames that read well when `@`-mentioned (e.g. `firebase-secrets.mdc` → `@firebase-secrets`).

4. **Multi-glob `if` for Edit + Write** — In example (a) we used `Edit(...)|Write(...)` to cover both tools at once. The matcher already restricts to `Edit|Write`, so the `if` arms are needed because the permission-rule syntax binds the glob to a specific tool. Cleaner alternative: split into two matcher groups, one per tool. Task 14 should use whichever reads better in context — both work.
