# Firebase Conventions Pack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Firebase Conventions Pack defined in [docs/superpowers/specs/2026-05-01-firebase-conventions-design.md](../specs/2026-05-01-firebase-conventions-design.md) — 4 slash commands, 3 agents, 6 hooks, 7 Cursor rules, 6 helper scripts/text files in `scripts/firebase/`, plus documentation updates. Move AdSmart's Firebase conventions from passive documentation to active enforcement.

**Architecture:** Each artifact is a self-contained file (Markdown for commands/agents, MDC for Cursor rules, JSON edit for hooks, shell scripts for helpers). Plan validates schema compatibility (hooks + MDC) FIRST with trivial echo examples before writing the real ones. Tasks are ordered by dependency: scripts → agents → commands → settings.json hooks (which invoke the scripts) → Cursor rules → docs. Each task produces one logical commit.

**Tech Stack:** Bash + jq for hook helpers (no new deps). Markdown frontmatter for commands/agents. JSON for `.claude/settings.json`. MDC for Cursor rules. `@firebase/rules-unit-testing` (already in devDeps) + `firebase emulators:exec` for `test-rules.sh`. Hooks follow Claude Code's documented hooks schema.

**Pre-existing assets verified:**
- `functions/test/firestore-rules.test.ts` exists → `test-rules.sh` works out-of-the-box
- `@firebase/rules-unit-testing@5.0.0` is in `functions/package.json` devDeps
- `bun run test` works in `functions/` (uses Vitest)
- `.claude/settings.json` exists with permissions block; needs `hooks` block added
- `.cursor/settings.json` exists; `.cursor/rules/` directory does NOT exist yet

---

## Task 0: Pre-flight schema discovery

**Goal:** before writing 6 hooks and 7 MDC files, verify the EXACT schema each runtime expects. This prevents writing 13 files with the wrong format.

**Files:**
- Read: official Claude Code hooks documentation (web)
- Read: Cursor rules documentation (web) — for `.mdc` format

- [ ] **Step 0.1: Fetch Claude Code hooks schema reference**

Run: `WebFetch url=https://docs.claude.com/en/docs/claude-code/hooks prompt="Show the exact JSON schema for hooks in settings.json: PreToolUse, PostToolUse, UserPromptSubmit. Include matcher syntax and how command stdin/stdout/exit-code work."`

Save key findings inline in a working note. Confirmed:
- The hook schema's exact JSON shape (object keys, nesting under `hooks` block)
- How `matcher` works (regex on tool name? path? command?)
- Stdin contract (JSON tool input passed to script)
- Exit code contract (0 = allow, 2 = block; stderr shown to user)

- [ ] **Step 0.2: Fetch Cursor rules MDC reference**

Run: `WebFetch url=https://docs.cursor.com/context/rules prompt="Show the exact MDC frontmatter format for project rules: name, description, globs, alwaysApply, applyType. Include a minimal working example."`

Confirmed:
- MDC frontmatter keys (`description`, `globs`, `alwaysApply` or `applyType`)
- File location convention (`.cursor/rules/*.mdc` or `.cursorrules`?)
- How globs activate the rule

- [ ] **Step 0.3: Write a trivial smoke hook to validate**

Create `scripts/firebase/_smoke-hook.sh`:

```bash
#!/usr/bin/env bash
# Trivial PreToolUse hook for schema validation.
# Reads JSON from stdin, prints to stderr, exits 0.
set -euo pipefail
input=$(cat)
echo "[smoke-hook] Received input: $(echo "$input" | head -c 200)..." >&2
exit 0
```

`chmod +x scripts/firebase/_smoke-hook.sh`

- [ ] **Step 0.4: Add the smoke hook to `.claude/settings.json` temporarily**

Read current `.claude/settings.json`. Add minimal hooks block (exact shape per Step 0.1 findings). Example shape (will be adjusted per actual schema):

```jsonc
{
  "permissions": { /* existing */ },
  "enabledPlugins": { /* existing */ },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bash scripts/firebase/_smoke-hook.sh" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 0.5: Trigger the hook by creating a throwaway file**

Create a throwaway file via Edit/Write tool (e.g., create `scripts/firebase/.smoke-test.txt` with content "test"). Verify the hook fires (output should appear in Claude Code's hook output panel, or stderr should reach Claude). Delete the throwaway file.

- [ ] **Step 0.6: Write a trivial smoke MDC to validate Cursor schema**

Create `.cursor/rules/_smoke.mdc`:

```mdc
---
description: Smoke test rule for schema validation
globs: ["**/*.smoke-test.tmp"]
alwaysApply: false
---

If a file matches the glob, this rule was loaded correctly. Delete this rule
once schema is confirmed.
```

Open Cursor on a file matching the glob (e.g., create `foo.smoke-test.tmp`) and verify the rule appears in Cursor's rule context panel.

- [ ] **Step 0.7: Document confirmed schema shapes**

Create a working note `docs/superpowers/plans/_firebase-conventions-pack-schema-notes.md` with the confirmed JSON/MDC shapes. This is the source-of-truth for the rest of the plan. Will be deleted at the end (Task 9).

- [ ] **Step 0.8: Remove smoke artifacts**

Delete `.cursor/rules/_smoke.mdc`, `scripts/firebase/_smoke-hook.sh`, the temporary `hooks` block in `.claude/settings.json` (or leave it but with no hooks listed — final form comes in Task 6).

- [ ] **Step 0.9: Commit schema notes**

```bash
git add docs/superpowers/plans/_firebase-conventions-pack-schema-notes.md
git commit -m "chore(plans): add schema-validation notes for hooks + MDC"
```

---

## Task 1: scripts/firebase/test-rules.sh

**Files:**
- Create: `scripts/firebase/test-rules.sh`

- [ ] **Step 1.1: Write the script**

```bash
#!/usr/bin/env bash
# Runs Firestore rules unit tests inside the emulator and stamps
# .firebase/rules-last-tested.txt on success. Stamp is consumed by
# the rules-no-direct-deploy hook to gate `firebase deploy --only firestore:rules`.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Pre-condition: rules unit test file must exist
if ! ls functions/test/firestore-rules*.test.ts >/dev/null 2>&1; then
  echo "❌ No firestore-rules*.test.ts in functions/test/" >&2
  echo "   Create one before running this script." >&2
  exit 1
fi

# Pre-condition: @firebase/rules-unit-testing must be installed
if ! grep -q '@firebase/rules-unit-testing' functions/package.json; then
  echo "❌ @firebase/rules-unit-testing missing in functions/package.json" >&2
  echo "   Install: cd functions && bun add -d @firebase/rules-unit-testing" >&2
  exit 1
fi

# Run rules tests inside the firestore emulator
bunx firebase emulators:exec --only firestore --project demo-adsmart \
  "cd functions && bunx vitest run firestore-rules"

# Stamp success — consumed by check-rules-tested.sh hook helper
mkdir -p .firebase
date -u +%s > .firebase/rules-last-tested.txt
echo "✓ Rules tested at $(date -u). Stamp written to .firebase/rules-last-tested.txt"
```

`chmod +x scripts/firebase/test-rules.sh`

- [ ] **Step 1.2: Add `.firebase/rules-last-tested.txt` to .gitignore**

Read current `.gitignore`. Append (if not already there):

```
# Local timestamp stamp written by scripts/firebase/test-rules.sh
.firebase/rules-last-tested.txt
```

- [ ] **Step 1.3: Smoke test — run the script and verify the stamp appears**

Run: `bash scripts/firebase/test-rules.sh`
Expected: emulator starts, vitest runs `firestore-rules.test.ts`, exits 0, stamp file appears at `.firebase/rules-last-tested.txt` containing a Unix timestamp.

If the emulator port (8080) is already in use, kill conflicting process first.

- [ ] **Step 1.4: Commit**

```bash
git add scripts/firebase/test-rules.sh .gitignore
git commit -m "chore(scripts): add firestore rules test wrapper for hook gating"
```

---

## Task 2: scripts/firebase/check-no-process-env-secret.sh

**Files:**
- Create: `scripts/firebase/check-no-process-env-secret.sh`

- [ ] **Step 2.1: Write the helper**

```bash
#!/usr/bin/env bash
# PreToolUse hook helper. Reads tool input JSON on stdin.
# Blocks Edit/Write in functions/src/ if it introduces process.env.XXX_SECRET.
# Exit 2 = block; stderr message shown to Claude.
set -euo pipefail

input=$(cat)

# Extract content from Edit (new_string) or Write (content)
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

# Narrow regex (R8): only _SECRET suffix. _KEY/_TOKEN can be public values
# (FIREBASE_API_KEY, RECAPTCHA_SITE_KEY, GTM_TOKEN).
if echo "$content" | grep -qE 'process\.env\.[A-Z_]+_SECRET\b'; then
  cat >&2 <<'EOF'
❌ Blocked: process.env.<NAME>_SECRET detected in functions/src/.

AdSmart uses defineSecret for ALL secrets in Cloud Functions.

Do this instead:
  1. Add to functions/src/config/index.ts:
     export const mySecret = defineSecret('MY_SECRET')
  2. Import in the function: import { mySecret } from './config'
  3. Pass via onCall options: { secrets: [mySecret] }
  4. Use in body: mySecret.value()

Refs:
  - functions/src/config/index.ts (existing examples)
  - docs/SECURITY.md
  - https://firebase.google.com/docs/functions/config-env
EOF
  exit 2
fi

exit 0
```

`chmod +x scripts/firebase/check-no-process-env-secret.sh`

- [ ] **Step 2.2: Write a tiny test script to verify the helper**

Create a one-shot test (run inline, don't commit):

```bash
# Should exit 0 (no match)
echo '{"tool_input":{"new_string":"const x = process.env.NODE_ENV"}}' \
  | bash scripts/firebase/check-no-process-env-secret.sh
echo "Exit: $?"

# Should exit 2 (match)
echo '{"tool_input":{"new_string":"const x = process.env.STRIPE_SECRET"}}' \
  | bash scripts/firebase/check-no-process-env-secret.sh
echo "Exit: $?"

# Should exit 0 (false positive guard — _KEY is allowed)
echo '{"tool_input":{"new_string":"const x = process.env.FIREBASE_API_KEY"}}' \
  | bash scripts/firebase/check-no-process-env-secret.sh
echo "Exit: $?"
```

Expected: 0, 2, 0.

- [ ] **Step 2.3: Commit**

```bash
git add scripts/firebase/check-no-process-env-secret.sh
git commit -m "chore(scripts): add PreToolUse hook for process.env.X_SECRET in functions"
```

---

## Task 3: scripts/firebase/check-no-client-wallet-write.sh

**Files:**
- Create: `scripts/firebase/check-no-client-wallet-write.sh`

- [ ] **Step 3.1: Write the helper**

```bash
#!/usr/bin/env bash
# PreToolUse hook helper. Reads tool input JSON on stdin.
# Blocks Edit/Write in src/ if it introduces a client-side setDoc to
# wallet/current or transactions/. Phase 3 firestore.rules rejects these
# at runtime (see firestore.rules:51-58 and ADR-010); this hook surfaces
# the failure at dev-time instead.
set -euo pipefail

input=$(cat)
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

# Pattern A: string-path setDoc
patternA='setDoc\([^)]*['"'"'"][^'"'"'"]*\b(wallet/current|transactions/)'
# Pattern B: modular SDK doc(db, ..., 'wallet', 'current')
patternB='setDoc\(\s*doc\([^)]*['"'"'"]wallet['"'"'"][[:space:]]*,[[:space:]]*['"'"'"]current['"'"'"]'
# Pattern C: modular SDK doc(db, ..., 'transactions', ...)
patternC='setDoc\(\s*doc\([^)]*['"'"'"]transactions['"'"'"][[:space:]]*,'

if echo "$content" | grep -qE "$patternA" \
  || echo "$content" | grep -qE "$patternB" \
  || echo "$content" | grep -qE "$patternC"; then
  cat >&2 <<'EOF'
❌ Blocked: client-side setDoc on wallet/current or transactions/.

Phase 3 firestore.rules reject these writes at runtime
(firestore.rules:51-58 and ADR-010).

Wallet and transactions are write-only via Cloud Functions (Admin SDK).

Use instead:
  - For users/{uid} name/phone: updateDoc (allowed by rules)
  - For wallet credit/debit: call a callable function (e.g., admin path
    via adminWalletManager, or a new callable using defineSecret + transaction)
  - For transactions: callable that writes via Admin SDK

Refs:
  - docs/Decisions.md → ADR-010 (per-user state bootstrap)
  - firestore.rules
EOF
  exit 2
fi

exit 0
```

`chmod +x scripts/firebase/check-no-client-wallet-write.sh`

- [ ] **Step 3.2: Test the regex patterns**

Inline test:

```bash
# String-path — should block
echo '{"tool_input":{"new_string":"await setDoc(doc(db, '\''users/X/wallet/current'\''), data)"}}' \
  | bash scripts/firebase/check-no-client-wallet-write.sh
echo "Exit: $?  (expect 2)"

# Modular SDK wallet/current — should block
echo '{"tool_input":{"new_string":"await setDoc(doc(db, '\''users'\'', uid, '\''wallet'\'', '\''current'\''), data)"}}' \
  | bash scripts/firebase/check-no-client-wallet-write.sh
echo "Exit: $?  (expect 2)"

# Modular SDK transactions — should block
echo '{"tool_input":{"new_string":"await setDoc(doc(db, '\''users'\'', uid, '\''transactions'\'', txId), data)"}}' \
  | bash scripts/firebase/check-no-client-wallet-write.sh
echo "Exit: $?  (expect 2)"

# updateDoc on users/{uid} — should allow
echo '{"tool_input":{"new_string":"await updateDoc(doc(db, '\''users'\'', uid), {name})"}}' \
  | bash scripts/firebase/check-no-client-wallet-write.sh
echo "Exit: $?  (expect 0)"
```

Expected exit codes: 2, 2, 2, 0.

- [ ] **Step 3.3: Commit**

```bash
git add scripts/firebase/check-no-client-wallet-write.sh
git commit -m "chore(scripts): add PreToolUse hook for client wallet/transactions writes"
```

---

## Task 4: scripts/firebase/check-rules-tested.sh

**Files:**
- Create: `scripts/firebase/check-rules-tested.sh`

- [ ] **Step 4.1: Write the helper**

```bash
#!/usr/bin/env bash
# PreToolUse hook helper for Bash tool calls matching `firebase deploy --only firestore:rules`.
# Blocks if .firebase/rules-last-tested.txt is missing or >10 min old.
# Skips when invoked indirectly via safe-deploy.sh (which sets ADSMART_SAFE_DEPLOY=1).
set -euo pipefail

# Skip when invoked via safe-deploy.sh wrapper (it already validated)
if [ "${ADSMART_SAFE_DEPLOY:-}" = "1" ]; then
  exit 0
fi

stamp=".firebase/rules-last-tested.txt"

if [ ! -f "$stamp" ]; then
  cat >&2 <<'EOF'
❌ Blocked: `firebase deploy --only firestore:rules` without prior rules test.

Run first:  /firestore-rules-test
(Or: bash scripts/firebase/test-rules.sh)

This hook exists because deploying untested rules has bricked production
in the past. The test stamps a timestamp; this hook reads it.
EOF
  exit 2
fi

ts=$(cat "$stamp")
now=$(date -u +%s)
diff=$((now - ts))

if [ $diff -gt 600 ]; then
  age_min=$((diff / 60))
  cat >&2 <<EOF
❌ Blocked: rules test stamp is stale ($age_min min ago, max 10 min).

Re-run /firestore-rules-test before deploying.
EOF
  exit 2
fi

exit 0
```

`chmod +x scripts/firebase/check-rules-tested.sh`

- [ ] **Step 4.2: Test the helper**

```bash
# No stamp — should block
rm -f .firebase/rules-last-tested.txt
bash scripts/firebase/check-rules-tested.sh
echo "Exit: $?  (expect 2)"

# Fresh stamp — should allow
mkdir -p .firebase && date -u +%s > .firebase/rules-last-tested.txt
bash scripts/firebase/check-rules-tested.sh
echo "Exit: $?  (expect 0)"

# Stale stamp (1 hour ago) — should block
echo "$(($(date -u +%s) - 3700))" > .firebase/rules-last-tested.txt
bash scripts/firebase/check-rules-tested.sh
echo "Exit: $?  (expect 2)"

# Bypass via env var — should allow even with stale/missing stamp
rm -f .firebase/rules-last-tested.txt
ADSMART_SAFE_DEPLOY=1 bash scripts/firebase/check-rules-tested.sh
echo "Exit: $?  (expect 0)"
```

Expected: 2, 0, 2, 0.

- [ ] **Step 4.3: Commit**

```bash
git add scripts/firebase/check-rules-tested.sh
git commit -m "chore(scripts): add PreToolUse hook gating firebase deploy of rules"
```

---

## Task 5: scripts/firebase/safe-deploy.sh

**Files:**
- Create: `scripts/firebase/safe-deploy.sh`

- [ ] **Step 5.1: Write the wrapper**

```bash
#!/usr/bin/env bash
# Safe Firebase deploy wrapper. Confirms target (dev/prod), validates that
# rules are tested if deploying rules, sets ADSMART_SAFE_DEPLOY=1 to bypass
# the rules-tested hook (we already validated), and polls index status if
# deploying indexes. Used by the /firebase-deploy slash command.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

usage() {
  cat <<EOF
Usage: $0 <dev|prod> <only-flags>

  <only-flags> is a comma-separated subset of: rules, indexes, functions, hosting

Examples:
  $0 dev rules
  $0 prod indexes,functions
EOF
  exit 1
}

[ $# -lt 2 ] && usage
target=$1
only=$2

case "$target" in
  dev)  project="adsmart-web-dev" ;;
  prod) project="adsmart-web-prod" ;;
  *)    usage ;;
esac

# Prod confirm gate
if [ "$target" = "prod" ]; then
  echo "⚠️  About to deploy [$only] to PRODUCTION ($project)."
  printf "    Type 'prod' to confirm: "
  read -r confirm
  if [ "$confirm" != "prod" ]; then
    echo "Aborted."
    exit 1
  fi
fi

# Pre-check: rules must be tested if deploying rules
if [[ ",$only," == *",rules,"* ]]; then
  if [ ! -f .firebase/rules-last-tested.txt ]; then
    echo "❌ rules not tested. Run /firestore-rules-test first." >&2
    exit 1
  fi
  ts=$(cat .firebase/rules-last-tested.txt)
  now=$(date -u +%s)
  diff=$((now - ts))
  if [ $diff -gt 600 ]; then
    echo "❌ rules test stale ($((diff / 60)) min ago). Re-run /firestore-rules-test." >&2
    exit 1
  fi
fi

# Bypass the rules-tested PreToolUse hook (we validated above)
export ADSMART_SAFE_DEPLOY=1

echo "→ bunx firebase deploy --only $only --project $project"
bunx firebase deploy --only "$only" --project "$project"

# Poll index status when deploying indexes
if [[ ",$only," == *",indexes,"* ]]; then
  echo "→ Polling indexes until all Enabled (max 5 min, sleep 30s)..."
  attempts=0
  max_attempts=10
  while [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    sleep 30
    # Use firestore:indexes to fetch current status
    if bunx firebase firestore:indexes --project "$project" 2>/dev/null \
        | grep -q '"state": "CREATING"'; then
      echo "  [$attempts/$max_attempts] still building..."
    else
      echo "  [$attempts/$max_attempts] all indexes Enabled."
      break
    fi
  done
fi

echo "✓ Deploy complete."
```

`chmod +x scripts/firebase/safe-deploy.sh`

- [ ] **Step 5.2: Smoke test argument parsing (dry — no actual deploy)**

```bash
# Should print usage and exit 1
bash scripts/firebase/safe-deploy.sh
echo "Exit: $?  (expect 1)"

bash scripts/firebase/safe-deploy.sh dev
echo "Exit: $?  (expect 1)"

# Should fail at usage with bad target
bash scripts/firebase/safe-deploy.sh staging rules
echo "Exit: $?  (expect 1)"
```

(Don't run with valid args — that would actually deploy.)

- [ ] **Step 5.3: Commit**

```bash
git add scripts/firebase/safe-deploy.sh
git commit -m "chore(scripts): add safe-deploy wrapper with prod gate + index polling"
```

---

## Task 6: scripts/firebase/context-snippet.txt

**Files:**
- Create: `scripts/firebase/context-snippet.txt`

- [ ] **Step 6.1: Write the snippet**

```text
🔥 AdSmart Firebase context (auto-injected when prompt mentions deploy/rules/callable/process.env)

Stack: Functions v2 (firebase-functions/v2/https + identity) · Admin SDK 12.7
       · Firebase JS SDK 10 · Region us-central1 (default)

Conventions you MUST follow:
  • Secrets: defineSecret in functions/src/config/index.ts. NEVER process.env.X_SECRET.
  • Auth: custom claim `admin === true` OR ADMIN_EMAILS allowlist.
  • Schemas: Zod-first via @adsmart/shared (ADR-009). Types via z.infer.
  • Server timestamps: admin.firestore.Timestamp.now(), never Date.now().
  • Server-side state: bootstrapUser (Auth blocking trigger) seeds users/{uid}
    and users/{uid}/wallet/current. Client must use updateDoc, never setDoc on
    wallet or transactions paths.

Phase 3 baseline (DO NOT relax):
  • wallet/transactions: client write blocked by rules.
  • rateLimits/securityLogs/backupMetadata: write-only via Admin SDK.
  • userDocuments: CPF/CNPJ uniqueness index, write-only via reserveUserDocument.

For live operations (queries/logs/rules deploy/secrets/Auth):
  → use the firebase-operations skill.

For new artifacts:
  → /functions-new-callable    (security-aligned scaffold)
  → /firestore-new-query       (composite index + selectivity check)
  → /firestore-rules-test      (emulator + vitest)
  → /firebase-deploy           (multi-target safe deploy)

References: AGENTS.md · CLAUDE.md · docs/SECURITY.md · docs/Decisions.md (ADR-009/010/012)
```

- [ ] **Step 6.2: Commit**

```bash
git add scripts/firebase/context-snippet.txt
git commit -m "chore(scripts): add UserPromptSubmit context snippet for Firebase work"
```

---

## Task 7: .claude/agents/firestore-rules-reviewer.md

**Files:**
- Create: `.claude/agents/firestore-rules-reviewer.md`

- [ ] **Step 7.1: Verify .claude/agents/ directory existence**

```bash
mkdir -p .claude/agents
```

- [ ] **Step 7.2: Write the agent**

```markdown
---
name: firestore-rules-reviewer
description: Use this agent when reviewing changes to firestore.rules or before deploying rules to dev/prod. Validates against AdSmart's Phase 3 security baseline AND Firebase best practices. Can also run rules unit tests on demand.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a Firestore Security Rules reviewer for AdSmart.

## When to invoke

- Before deploying `firestore.rules` to dev or prod
- After any edit to `firestore.rules` or `functions/test/firestore-rules*.test.ts`
- When the user asks for a rules security review
- Suggested by the `rules-edited-reminder` PostToolUse hook

## Checklist (run all and report)

### 1. Deny by default

Every collection declared has explicit `allow read/write: if false` OR a rule with auth check. There is no open `match /{document=**}` pattern. Any collection NOT declared is implicitly denied — confirm this is intentional.

### 2. Immutability helpers

Critical fields (email, createdAt, userId, documentNumber, documentType) use `unchanged()` or the project's `documentLocked()` helper (see firestore.rules:25-32) in update rules.

Check that update rules verify:
- `request.resource.data.email == resource.data.email` (or via helper)
- `request.resource.data.createdAt == resource.data.createdAt`
- `!documentLocked()` for users where applicable
- `request.resource.data.userId == resource.data.userId` for owned documents

### 3. Owner-only creates

Collections owned by users have `request.resource.data.userId == request.auth.uid` validation in create rules. Examples: campaigns, reports, activityLogs.

### 4. Phase 3 invariants (MUST hold)

| Path | Read | Write |
|---|---|---|
| `users/{uid}/wallet/**` | owner | DENY (Admin SDK only) |
| `users/{uid}/transactions/**` | owner | DENY (Admin SDK only) |
| `rateLimits/{userId}` | owner | DENY |
| `securityLogs/{logId}` | DENY | DENY |
| `backupMetadata/{backupId}` | DENY | DENY |
| `userDocuments/{documentId}` | owner-by-userId-field | DENY |
| `productPrices/**` | authenticated | DENY |
| `systemConfig/**` | authenticated | DENY |

If any of these is relaxed in the diff, FAIL the review and demand justification + ADR.

### 5. Required-fields validation

Creates use `keys().hasAll([...])` for mandatory fields. The list matches what `bootstrapUser` (auth blocking trigger) and Cloud Functions actually write.

### 6. No open `allow`

Zero occurrences of `allow read, write` without conditions. Zero occurrences of `allow ...: if true`.

### 7. Run rules tests if asked

If the user requests, or before deploy: `bash scripts/firebase/test-rules.sh`. Report PASS/FAIL with the failing test names if any.

## Output format

Always return:

```
VERDICT: PASS | FAIL | NEEDS_REVIEW

Phase 3 invariants: [confirm each table row, or list violations]

Issues:
  - <file>:<line> — <description> — <severity: blocker|major|minor>

Suggestions (non-blocking):
  - <pattern improvement with reference>

Test result (if run): PASS | FAIL <count>/<total>
```

## What NOT to do

- Don't propose new collections without the user asking — that's a design decision belonging to a feature spec.
- Don't relax existing immutability without explicit user-supplied justification AND a corresponding ADR update plan.
- Don't deploy. This agent reviews only.

## References

- `firestore.rules`
- `docs/SECURITY.md`
- `docs/Decisions.md` (ADR-010 wallet bootstrap, ADR-012 CPF/CNPJ uniqueness)
- Firebase docs: rules-conditions, rules-structure, test-rules-emulator
```

- [ ] **Step 7.3: Commit**

```bash
git add .claude/agents/firestore-rules-reviewer.md
git commit -m "feat(claude): add firestore-rules-reviewer agent"
```

---

## Task 8: .claude/agents/functions-security-reviewer.md

**Files:**
- Create: `.claude/agents/functions-security-reviewer.md`

- [ ] **Step 8.1: Write the agent**

```markdown
---
name: functions-security-reviewer
description: Use this agent after substantive changes to a Cloud Function (new function, security guard changes, secret usage, blocking trigger). Validates against AdSmart's actual patterns in reserveUserDocument.ts, getDashboardMetrics.ts, bootstrapUser.ts.
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a Cloud Functions security reviewer for AdSmart. Your reviews are
calibrated against the project's REAL patterns, not generic Firebase advice.

## When to invoke

- After creating a new Cloud Function in `functions/src/`
- After changing security guards (auth check, App Check, rate limit, security log)
- After changing how secrets are imported/used
- After modifying a blocking trigger (`bootstrapUser`)
- Suggested by the user when reviewing pre-merge

## Checklist

### MANDATORY

#### Secrets

- Zero occurrences of `process.env.[A-Z_]+_SECRET` in `functions/src/`.
- All secrets declared via `defineSecret('NAME')` in `functions/src/config/index.ts`.
- Secrets passed via `secrets: [...]` in `onCall` options when used.
- `process.env` use for NON-secret config (project ID, region, OAuth client IDs, redirect URIs) is OK and EXPECTED — see `config/index.ts`.

#### HttpsError codes

For each `throw` in callable code:
- `unauthenticated` — when `request.auth` is missing.
- `invalid-argument` — input validation failed (preferred: Zod safeParse with `parsed.error.issues[0]?.message`).
- `failed-precondition` — business rule violation (e.g., immutable field already set).
- `already-exists` — uniqueness conflict (e.g., CPF/CNPJ already reserved).
- `permission-denied` — authenticated but unauthorized (e.g., non-admin calling admin function).

Throwing plain `Error` from a callable is a **blocker** — must be `HttpsError`.

#### Server timestamps

`createdAt` / `updatedAt` use `admin.firestore.Timestamp.now()` or `FieldValue.serverTimestamp()`. **Never** `Date.now()` or `new Date()` for stored timestamps.

#### Idempotency in blocking triggers

`beforeUserCreated` and any other blocking trigger must be idempotent. Pattern: `set(ref, data, { merge: true })` — see `bootstrapUser.ts:35-44`. If two firings would duplicate state, fail the review.

### CONDITIONAL

#### Rate limiting

`await checkRateLimit(uid, '<action>')` is required ONLY when the function:
- Performs user-triggered writes, OR
- Consumes expensive resources (OAuth calls, report generation, payment intent)

NOT required for:
- Read-only admin queries (`getDashboardMetrics`, `getSecurityStats`)
- Blocking triggers (`bootstrapUser`) — Auth already rate-limits

#### Security logging

`securityLogger.logEvent(SecurityEventType.X, uid, details, severity)` is required for:
- Auth events (sign-in failures, password changes, account linking)
- Payment events (creation, capture, refund)
- Admin actions (credit wallet, change role)
- Document reservation (CPF/CNPJ)
- OAuth token storage

NOT required for read-only queries.

### INFORMATIVE

#### Region

Templates new functions OMIT `region` from `onCall` options — project uses default `us-central1` (see `functions/src/config/index.ts:33`). If a new function sets a different region, it's an architectural decision worth flagging in the review.

#### Admin guard

Admin-only functions use the canonical pattern:

```ts
function assertAdmin(auth: CallableRequest['auth']) {
  if (!auth) throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  const email = typeof auth.token.email === 'string' ? auth.token.email : ''
  const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(email)
  if (!isAdmin) throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
}
```

(See `getDashboardMetrics.ts:14-23`.)

### ADVISORY (suggest, don't block)

#### App Check

App Check is **not** currently enabled in AdSmart (no `initializeAppCheck` in client). Do **not** require `enforceAppCheck: true`. For functions with high abuse risk (public writes, OAuth callbacks, payment intents), SUGGEST evaluating App Check adoption per the Firebase docs' monitor-then-enforce guidance, with a pointer to `docs/SECURITY.md`.

## Output format

```
VERDICT: PASS | FAIL | NEEDS_REVIEW

Mandatory checks:
  - Secrets: PASS | FAIL <details>
  - HttpsError codes: PASS | FAIL <list>
  - Server timestamps: PASS | FAIL <list>
  - Idempotency (if blocking trigger): PASS | FAIL | N/A

Conditional checks:
  - Rate limiting: REQUIRED+PRESENT | REQUIRED+MISSING | NOT-NEEDED
  - Security logging: REQUIRED+PRESENT | REQUIRED+MISSING | NOT-NEEDED

Informative:
  - Region: <us-central1 (default) | other-region with reasoning>
  - Admin guard: <correct | missing | unusual>

Advisory:
  - App Check: <suggestion or N/A>

Suggestions: <non-blocking improvements>
```

## References

- `functions/src/reserveUserDocument.ts` — canonical callable with transaction
- `functions/src/getDashboardMetrics.ts` — admin read-only, Zod input
- `functions/src/bootstrapUser.ts` — idempotent blocking trigger
- `functions/src/config/index.ts` — defineSecret declarations
- AGENTS.md — conventions
- CLAUDE.md — Firebase Conventions Pack section
```

- [ ] **Step 8.2: Commit**

```bash
git add .claude/agents/functions-security-reviewer.md
git commit -m "feat(claude): add functions-security-reviewer agent"
```

---

## Task 9: .claude/agents/firestore-query-reviewer.md

**Files:**
- Create: `.claude/agents/firestore-query-reviewer.md`

- [ ] **Step 9.1: Write the agent**

```markdown
---
name: firestore-query-reviewer
description: Use this agent when adding a new Firestore query with where + orderBy or two range filters on different fields. Verifies composite index exists in firestore.indexes.json and is optimally ordered (equalities-first, selectivity-decreasing).
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a Firestore query reviewer for AdSmart. Your job is to ensure
new queries have correct, optimally-ordered composite indexes committed
to `firestore.indexes.json`.

## When invoke is needed

A query needs a composite index when ANY:
- 1+ `where(...)` + `orderBy(...)` on a different field
- 2+ range/inequality filters on different fields
- 1+ `where(...)` + `array-contains` / `array-contains-any` on a different field

A query does NOT need a composite index when:
- A single `where(...)` equality with no `orderBy` (or `orderBy` on the same field)
- A single `where` inequality with `orderBy` on the same field
- Pure `getDoc()` or single-document `where('__name__', '==', id)`

## Checklist

### 1. Find the new/changed queries

Grep `src/**/*.ts*` and `functions/src/**/*.ts` for the query patterns. Identify each by:
- Collection name (`db.collection('X')` or `db.collectionGroup('X')`)
- Query scope: `COLLECTION` (specific path) vs `COLLECTION_GROUP` (cross-parent)
- All `where(...)` clauses (field, operator)
- `orderBy(...)` field + direction

### 2. Match against firestore.indexes.json

For each query that needs an index, verify a matching entry in `firestore.indexes.json`:
- `collectionGroup` field matches the collection name
- `queryScope` matches (`COLLECTION` vs `COLLECTION_GROUP`)
- Fields list contains all `where` fields + the `orderBy` field
- `order` direction on the orderBy field matches the query's direction

### 3. Optimal field ordering

Per Firebase docs:

1. **Equality fields** (`==`, `in`) come FIRST, ordered by selectivity (highest selectivity first — i.e., the field that filters out the most documents).
2. **Range/inequality fields** (`<`, `>`, `<=`, `>=`) come AFTER equalities, ordered by decreasing selectivity.
3. The **orderBy** field's direction must match the index direction (ASC/DESC).

Bad index: `[range, equality, orderBy]` — Firestore can't use the leading range to short-circuit.
Good index: `[equality1, equality2, range, orderBy]`.

### 4. Index merging opportunity

If the codebase has multiple queries that share an equality + orderBy on the same field, Firestore can merge indexes. Suggest the optimization (cite Firebase docs' "Use index merging" section). Often you can REPLACE several large composite indexes with smaller ones that index merging combines automatically.

### 5. Both deploy targets

Remind: indexes must be deployed to BOTH `adsmart-web-dev` AND `adsmart-web-prod` (use `/firebase-deploy` or `safe-deploy.sh`). Index build is async, 1-3 min.

## Output format

```
VERDICT: PASS | FAIL

Queries reviewed:
  - <file>:<line> — collectionGroup="<name>" scope=<COLLECTION|COLLECTION_GROUP>
    where: [<list>]
    orderBy: <field> <ASC|DESC>
    Index status: EXISTS | MISSING | SUBOPTIMAL
    Recommended entry (if MISSING/SUBOPTIMAL): <JSON snippet>

Suggested optimizations (non-blocking):
  - <index merging opportunity if any>

Deploy plan:
  - Targets: dev + prod
  - Command: `bash scripts/firebase/safe-deploy.sh dev indexes`
            then `bash scripts/firebase/safe-deploy.sh prod indexes`
  - ETA: 1-3 min per index build (poll `firestore_list_indexes` MCP or run /firebase-deploy)
```

## References

- `firestore.indexes.json`
- `docs/DEPLOYMENT.md` → "Firestore rules and indexes"
- `CLAUDE.md` → "Adding Firestore queries"
- Firebase docs: query-data/index-overview, multiple-range-fields
```

- [ ] **Step 9.2: Commit**

```bash
git add .claude/agents/firestore-query-reviewer.md
git commit -m "feat(claude): add firestore-query-reviewer agent"
```

---

## Task 10: .claude/commands/firestore-rules-test.md

**Files:**
- Create: `.claude/commands/firestore-rules-test.md`

- [ ] **Step 10.1: Verify .claude/commands/ directory existence**

```bash
mkdir -p .claude/commands
```

- [ ] **Step 10.2: Write the command**

````markdown
---
description: Run Firestore rules unit tests in the emulator and stamp the result
model: sonnet
---

Você está rodando os testes unitários das regras Firestore antes de um deploy. Esse command é a pré-condição para `/firebase-deploy` quando o deploy inclui `rules`.

## Passos

1. **Verifique pré-condições**:
   - Existe arquivo `functions/test/firestore-rules*.test.ts`? Se não, peça ao usuário para criar antes.
   - `@firebase/rules-unit-testing` está em `functions/package.json` devDependencies? Se não, sugira `cd functions && bun add -d @firebase/rules-unit-testing`.

2. **Rode o script wrapper**:

```bash
bash scripts/firebase/test-rules.sh
```

Esse script roda `firebase emulators:exec --only firestore --project demo-adsmart "cd functions && bunx vitest run firestore-rules"` e, em sucesso, stampa `.firebase/rules-last-tested.txt`.

3. **Reporte ao usuário**:
   - Se PASS: confirmar quantos testes passaram + timestamp do stamp.
   - Se FAIL: mostrar os testes que falharam + sugerir invocar o agent `firestore-rules-reviewer` para diagnóstico.
   - Bloquear deploy se FAIL.

## Notas

- O stamp em `.firebase/rules-last-tested.txt` é consumido pelo hook `rules-no-direct-deploy` e pelo `safe-deploy.sh`. Stamp expira em 10 minutos — re-rode se o deploy não acontecer rapidamente após o teste.
- Stamp está em `.gitignore` (é local-only).
- Para rodar em watch durante desenvolvimento: `cd functions && bun run test:watch -- firestore-rules`. Esse modo NÃO stampa — use o command para o stamp.

## Referências

- `scripts/firebase/test-rules.sh` (implementação)
- `functions/test/firestore-rules.test.ts` (test suite)
- `firestore.rules` (sob teste)
- Firebase docs: test-rules-emulator
````

- [ ] **Step 10.3: Commit**

```bash
git add .claude/commands/firestore-rules-test.md
git commit -m "feat(claude): add /firestore-rules-test command"
```

---

## Task 11: .claude/commands/firestore-new-query.md

**Files:**
- Create: `.claude/commands/firestore-new-query.md`

- [ ] **Step 11.1: Write the command**

````markdown
---
description: Add Firestore query + composite index following Firebase best practices
argument-hint: [optional collection name]
model: sonnet
---

Você está ajudando o usuário a adicionar uma nova query Firestore ao AdSmart, garantindo que o composite index correspondente exista em `firestore.indexes.json` com a ordem otimizada.

## Passos

### 1. Coleta de inputs (uma pergunta por vez)

Pergunte ao usuário:

1. **Coleção**: nome (ex: `transactions`, `users`, `reports`).
2. **Escopo**: `COLLECTION` (path específico tipo `users/X/transactions`) ou `COLLECTION_GROUP` (cross-parent tipo `db.collectionGroup('transactions')`).
3. **`where(...)` filters**: cada um — campo, operador (`==`, `in`, `<`, `>`, `<=`, `>=`, `array-contains`, `array-contains-any`), tipo do valor.
4. **`orderBy(...)` field e direção** (ASC/DESC).
5. **Onde a query roda**: client (`src/**`) ou server (`functions/src/**`)?

### 2. Decida se composite index é necessário

Index obrigatório quando ANY:
- 1+ `where` + `orderBy` em campo diferente.
- 2+ range/inequality filters em campos diferentes.
- 1+ `where` + `array-contains` em campos diferentes.

Se NÃO precisa de index → vá para o passo 4.
Se precisa → passo 3.

### 3. Adicione o composite index

Leia o `firestore.indexes.json` atual. Construa a entry seguindo as boas práticas (Firebase docs):

1. **Equality fields** (`==`, `in`) PRIMEIRO, ordenadas por seletividade decrescente (mais restritivo primeiro).
2. **Range/inequality fields** depois, também por seletividade decrescente.
3. **`orderBy` field** ao final (ou na posição forçada pela inequality, conforme Firebase docs).
4. Direction (`ASCENDING`/`DESCENDING`) match com a direção do orderBy.

Mostre a entry proposta ao usuário. **Pergunte se confirma**. Em sucesso, escreva no `firestore.indexes.json`.

Exemplo:

```json
{
  "collectionGroup": "transactions",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### 4. Escreva a query

Padrões canônicos:

**Client (Firestore JS v10 modular SDK):**

```ts
import { collection, collectionGroup, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const q = query(
  collectionGroup(db, 'transactions'),
  where('type', '==', 'credit'),
  where('status', '==', 'completed'),
  orderBy('createdAt', 'desc')
)
const snap = await getDocs(q)
```

**Server (firebase-admin):**

```ts
import * as admin from 'firebase-admin'
const db = admin.firestore()

const snap = await db
  .collectionGroup('transactions')
  .where('type', '==', 'credit')
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
  .get()
```

Mostre o code ao usuário, peça confirmação.

### 5. Deploy do index (se foi adicionado)

```bash
bash scripts/firebase/safe-deploy.sh dev indexes
bash scripts/firebase/safe-deploy.sh prod indexes
```

Lembrete: index build é async (1-3 min). Query fica vermelha (`FAILED_PRECONDITION`) até `Enabled`. O safe-deploy faz polling automático.

### 6. Test + log

- Adicione um teste Vitest co-located com o arquivo da query.
- Adicione entry datada em `docs/CHANGES.md`:

```markdown
### 2026-MM-DD — feat(firestore): new query <collection> with composite index

Added query <description> in <file>. New composite index in `firestore.indexes.json`
deployed to dev + prod targets.
```

### 7. Sugira invocar o `firestore-query-reviewer` agent

Depois de tudo pronto, peça ao usuário para invocar `firestore-query-reviewer` agent para validar a ordem de seletividade e verificar oportunidades de index merging.

## Referências

- `docs/DEPLOYMENT.md` → "Firestore rules and indexes"
- `CLAUDE.md` → "Adding Firestore queries"
- `firestore.indexes.json` (entries existentes para alinhamento de estilo)
- Firebase docs: query-data/index-overview, multiple-range-fields
````

- [ ] **Step 11.2: Commit**

```bash
git add .claude/commands/firestore-new-query.md
git commit -m "feat(claude): add /firestore-new-query command"
```

---

## Task 12: .claude/commands/functions-new-callable.md

**Files:**
- Create: `.claude/commands/functions-new-callable.md`

- [ ] **Step 12.1: Write the command**

````markdown
---
description: Scaffold Cloud Function v2 callable matching AdSmart's real patterns
argument-hint: [optional function name]
model: sonnet
---

Você está criando uma nova Cloud Function v2 callable seguindo o padrão real do AdSmart (verificado contra `reserveUserDocument.ts`, `getDashboardMetrics.ts`).

## Passos

### 1. Coleta (uma pergunta por vez)

1. **Nome da function** (camelCase, ex: `myCallable`).
2. **Tipo**:
   - `read-only` (consulta sem write) — exemplo: getDashboardMetrics
   - `write user-triggered` — exemplo: reserveUserDocument
   - `admin-only` — exemplo: addUserCredits
   - `blocking trigger` — `beforeUserCreated` ou `beforeUserSignedIn`
3. **Input shape** (campos + tipos) — vamos criar um Zod schema em `@adsmart/shared`.
4. **Output shape** — também via Zod.
5. **Secrets externos**? (ex: API key de OAuth provider). Cite `defineSecret` em `config/index.ts` se sim.
6. **Sensibilidade**: precisa rate limit? security log? (use o checklist condicional abaixo)

### 2. Adicione o schema em @adsmart/shared

Crie/edite `packages/shared/src/schemas/<name>.ts`:

```ts
import { z } from 'zod'

export const MyCallableInputSchema = z.object({
  // campos validados
})

export type MyCallableInput = z.infer<typeof MyCallableInputSchema>

export const MyCallableOutputSchema = z.object({
  // shape do retorno
})

export type MyCallableOutput = z.infer<typeof MyCallableOutputSchema>
```

Re-export em `packages/shared/src/index.ts`. Adicione test co-located.

### 3. Crie o arquivo da function

`functions/src/<name>.ts`:

```ts
import * as admin from 'firebase-admin'
import { type CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  MyCallableInputSchema,
  type MyCallableOutput,
} from '@adsmart/shared'
// ⬇ se usa secret externo:
// import { mySecret } from './config'
// ⬇ se sensível/write:
// import { checkRateLimit } from './rateLimiter'
// import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

// ⬇ admin-only? use o helper canônico
// const ADMIN_EMAILS = ['agency.elovisiondigital@gmail.com', 'admin@adsmart.app']
// function assertAdmin(auth: CallableRequest['auth']) {
//   if (!auth) throw new HttpsError('unauthenticated', 'Usuário não autenticado')
//   const email = typeof auth.token.email === 'string' ? auth.token.email : ''
//   const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(email)
//   if (!isAdmin) throw new HttpsError('permission-denied', 'Acesso restrito a administradores')
// }

export const myCallable = onCall<unknown, Promise<MyCallableOutput>>(
  // Options bloco — omitir totalmente se não há necessidade especial.
  // Use:
  //   { memory: '512MiB' }    se a function processa volume
  //   { secrets: [mySecret] } se importa secret via defineSecret
  // NÃO setar `region` — projeto usa default us-central1.
  // NÃO setar `enforceAppCheck` — App Check ainda não inicializado no client (R10).
  async (request) => {
    // 1. Auth guard (sempre)
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }
    const uid = request.auth.uid

    // ⬇ admin-only? chame o helper:
    // assertAdmin(request.auth)

    // 2. Input validation via Zod (sempre)
    const parsed = MyCallableInputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const input = parsed.data

    // 3. Rate limit (CONDICIONAL — apenas para writes user-triggered ou consumo custoso)
    // await checkRateLimit(uid, 'myCallable')

    // 4. Lógica
    const db = admin.firestore()

    // Para writes atômicos multi-doc → use runTransaction (ver reserveUserDocument):
    // await db.runTransaction(async (tx) => { ... tx.get/tx.set/tx.update ... })

    // Para conflitos: throw new HttpsError('already-exists', '...')
    // Para regra de negócio: throw new HttpsError('failed-precondition', '...')

    // 5. Security log (CONDICIONAL — apenas eventos sensíveis: auth, payments, admin actions)
    // await securityLogger.logEvent(
    //   SecurityEventType.X,
    //   uid,
    //   { /* details */ },
    //   SecuritySeverity.INFO,
    // )

    // 6. Return tipado
    const out: MyCallableOutput = { /* ... */ }
    return out
  },
)
```

### 4. Export em `functions/src/index.ts`

Adicione a linha de export:

```ts
export { myCallable } from './myCallable'
```

### 5. Teste

Crie `functions/test/<name>.test.ts`. Padrão:

```ts
import { describe, it, expect } from 'vitest'
// importar o setup test helper apropriado
```

(Veja `functions/test/getDashboardMetrics.test.ts` para o pattern atual.)

### 6. Verificação final + checklist

- [ ] Sem `process.env.X_SECRET` no arquivo (será bloqueado pelo hook).
- [ ] Todos `throw` são `HttpsError` com code apropriado.
- [ ] `createdAt`/`updatedAt` via `admin.firestore.Timestamp.now()`, nunca `Date.now()`.
- [ ] Input validation via Zod do `@adsmart/shared` (não inline).
- [ ] Rate limit + security log presentes apenas se a function for sensível/write.
- [ ] Sem `region` na onCall options.
- [ ] Sem `enforceAppCheck` (a menos que time decida adotar App Check no futuro).

### 7. Sugira o reviewer

Após criar tudo, peça ao usuário para invocar o `functions-security-reviewer` agent para validar end-to-end.

### 8. Build + deploy

```bash
cd functions && bun run build
bash scripts/firebase/safe-deploy.sh dev functions
```

## Referências

- `functions/src/reserveUserDocument.ts` — write atômico canônico
- `functions/src/getDashboardMetrics.ts` — admin read-only com Zod
- `functions/src/bootstrapUser.ts` — blocking trigger idempotente
- `functions/src/config/index.ts` — defineSecret declarations
- `AGENTS.md`, `CLAUDE.md`
- App Check status: NÃO adotado ainda — ver `docs/SECURITY.md` quando o time decidir
````

- [ ] **Step 12.2: Commit**

```bash
git add .claude/commands/functions-new-callable.md
git commit -m "feat(claude): add /functions-new-callable command"
```

---

## Task 13: .claude/commands/firebase-deploy.md

**Files:**
- Create: `.claude/commands/firebase-deploy.md`

- [ ] **Step 13.1: Write the command**

````markdown
---
description: Safe multi-target Firebase deploy with confirmation gates
argument-hint: [target] [only-flags]
model: sonnet
---

Você está executando um deploy seguro para Firebase. Esse command é o ponto único de entrada para deploys — usa o wrapper `safe-deploy.sh` que tem prompts de confirmação.

## Passos

### 1. Coleta

Se o usuário não passou args inline, pergunte:

1. **Target**: `dev` (`adsmart-web-dev`) ou `prod` (`adsmart-web-prod`)?
2. **O que deployar** (comma-separated, qualquer subset de): `rules`, `indexes`, `functions`, `hosting`?

### 2. Pré-condições (se inclui `rules`)

Verifique se `.firebase/rules-last-tested.txt` existe e é < 10 min. Se não:

> "Rules não testadas (ou stamp vencido). Vou rodar `/firestore-rules-test` antes."

Invoque `/firestore-rules-test`. Se falhar, **aborte** o deploy.

### 3. Pré-condições (se inclui `indexes`)

Mostre ao usuário o diff entre `firestore.indexes.json` local e o último deployado (use `firestore_list_indexes` MCP ou `firebase firestore:indexes --project ...`). Peça confirmação.

### 4. Confirmação prod

Se target = `prod`, mostre WARNING explícito antes de continuar:

> ⚠️  Você vai fazer deploy de [<list>] para PRODUÇÃO (adsmart-web-prod). Confirma? (sim/não)

### 5. Execute

```bash
bash scripts/firebase/safe-deploy.sh <target> <only,only,only>
```

O wrapper:
- Pede prompt stdin "type 'prod' to confirm" se prod (extra layer).
- Bypassa o hook `rules-no-direct-deploy` via env var (já validamos).
- Roda `firebase deploy`.
- Polla index status até `Enabled` (5 min máx).

### 6. Reporte

Após sucesso:

- Lista o que foi deployado.
- Se inclui rules: mostra o resumo do `firestore.rules` aplicado.
- Se inclui indexes: confirma todos `Enabled`.
- Se inclui functions: lembra de monitorar logs (`firebase functions:log` ou MCP `functions_get_logs`).
- Adicione entry datada em `docs/CHANGES.md` se for prod.

### 7. Em caso de falha

- Mostre stderr completo.
- Sugira:
  - Se rules: invocar `firestore-rules-reviewer` agent.
  - Se indexes: verificar build status no Console; index pode estar `CREATING`.
  - Se functions: rodar `cd functions && bun run build` para ver erro local.

## Notas

- Nunca pular o wrapper. `firebase deploy --only firestore:rules` direto é bloqueado pelo hook `rules-no-direct-deploy` (a menos que `ADSMART_SAFE_DEPLOY=1` esteja setado, que só o wrapper seta).
- Para deploy de hosting estático sem nenhum dos outros: `bash scripts/firebase/safe-deploy.sh <target> hosting`.
- Para deploy completo: `bash scripts/firebase/safe-deploy.sh prod rules,indexes,functions,hosting` (warning: longo).

## Referências

- `scripts/firebase/safe-deploy.sh` (implementação)
- `docs/DEPLOYMENT.md`
- `firebase.json`, `.firebaserc`
````

- [ ] **Step 13.2: Commit**

```bash
git add .claude/commands/firebase-deploy.md
git commit -m "feat(claude): add /firebase-deploy command"
```

---

## Task 14: Wire 6 hooks into `.claude/settings.json`

**Files:**
- Modify: `.claude/settings.json`

- [ ] **Step 14.1: Read current settings.json**

```bash
cat .claude/settings.json
```

Confirm structure: top-level keys are `permissions` and `enabledPlugins`. There's no `hooks` key yet.

- [ ] **Step 14.2: Add the hooks block (use schema confirmed in Task 0)**

The exact field names depend on what Task 0 confirmed. The expected shape (per Claude Code docs):

```jsonc
{
  "permissions": { /* unchanged */ },
  "enabledPlugins": { /* unchanged */ },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/firebase/check-no-process-env-secret.sh"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/firebase/check-no-client-wallet-write.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/firebase/check-rules-tested.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'jq -r \".tool_input.file_path\" | grep -q \"^firestore.rules$\" && echo \"firestore.rules editada. Próximos passos: /firestore-rules-test → firestore-rules-reviewer agent → /firebase-deploy.\" || true'"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'jq -r \".tool_input.file_path\" | grep -q \"^packages/shared/src/schemas/\" && echo \"Schema editado. CLAUDE.md exige: teste co-located + DATA-MODEL.md + entry em CHANGES.md. ADR-009.\" || true'"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash -c 'read -r prompt; if echo \"$prompt\" | grep -qiE \"(deploy|firestore\\.rules|cloud function|callable|firebase-admin|process\\.env)\"; then cat scripts/firebase/context-snippet.txt; fi'"
          }
        ]
      }
    ]
  }
}
```

**Important nuances** (verify against Task 0 findings):

- The PreToolUse helpers (`check-no-*`) read JSON tool input on stdin. The hook config above passes the input via Claude Code's stdin contract.
- For PostToolUse, the file_path filter is done inside the hook command (since the matcher might not support glob). Adjust if Task 0 found native glob support — then use `path_glob` in matcher.
- For Bash matcher, the helper `check-rules-tested.sh` must inspect the command. It currently checks env var `ADSMART_SAFE_DEPLOY`; adjust if needed to also inspect `tool_input.command` regex match.

If Task 0 found that the matcher supports `command_regex` natively, the Bash hook should be:

```jsonc
{
  "matcher": { "tool": "Bash", "command_regex": "firebase\\s+deploy.*firestore:rules" },
  ...
}
```

If only the `tool` part is matchable, the helper script needs to inspect the command on its own:

```bash
# In check-rules-tested.sh, add at top:
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // ""')
if ! echo "$cmd" | grep -qE 'firebase\s+deploy.*firestore:rules'; then
  exit 0  # Not our target — pass
fi
```

Update the helper accordingly when implementing this step.

- [ ] **Step 14.3: Smoke test each hook**

Trigger each hook manually:

**Test 1 — `secrets-no-process-env` blocks:**

Try to Edit a file in `functions/src/` adding `const x = process.env.STRIPE_SECRET`. Expected: hook blocks with the message from `check-no-process-env-secret.sh`.

**Test 2 — `wallet-no-client-write` blocks:**

Try to Edit a file in `src/` adding `setDoc(doc(db, 'users', uid, 'wallet', 'current'), data)`. Expected: hook blocks.

**Test 3 — `rules-no-direct-deploy` blocks:**

Try Bash `firebase deploy --only firestore:rules --project adsmart-web-dev` without a fresh stamp. Expected: hook blocks (stamp missing).

**Test 4 — `rules-edited-reminder` warns:**

Edit `firestore.rules` (any benign whitespace change). Expected: PostToolUse hook prints reminder message.

**Test 5 — `schema-edited-reminder` warns:**

Edit any file in `packages/shared/src/schemas/`. Expected: PostToolUse hook prints reminder.

**Test 6 — `firebase-context-injector` injects:**

Submit a prompt mentioning "deploy firestore rules". Expected: UserPromptSubmit hook injects the context snippet.

If any test fails, fix the JSON and re-test.

- [ ] **Step 14.4: Commit**

```bash
git add .claude/settings.json
git commit -m "feat(claude): wire 6 hooks for Firebase conventions enforcement"
```

---

## Task 15: 7 Cursor rules in `.cursor/rules/`

**Files:**
- Create: `.cursor/rules/firebase-secrets.mdc`
- Create: `.cursor/rules/firestore-schemas.mdc`
- Create: `.cursor/rules/firestore-rules.mdc`
- Create: `.cursor/rules/firestore-indexes.mdc`
- Create: `.cursor/rules/functions-callable.mdc`
- Create: `.cursor/rules/wallet-immutability.mdc`
- Create: `.cursor/rules/payments-asaas.mdc`

(Use the MDC schema confirmed in Task 0 — keys may be `applyType`, `globs`, `alwaysApply`. Adjust if Cursor's current schema differs.)

- [ ] **Step 15.1: Create `.cursor/rules/` directory**

```bash
mkdir -p .cursor/rules
```

- [ ] **Step 15.2: Write `firebase-secrets.mdc`**

```mdc
---
description: AdSmart secrets management in Cloud Functions
globs: ["functions/**/*.ts"]
alwaysApply: false
---

# Firebase secrets management (AdSmart)

ALL Cloud Functions secrets go through `defineSecret`. NEVER use `process.env.<NAME>_SECRET`.

## Pattern

```ts
// functions/src/config/index.ts
import { defineSecret } from 'firebase-functions/params'
export const mySecret = defineSecret('MY_SECRET')
```

```ts
// functions/src/myCallable.ts
import { mySecret } from './config'

export const myCallable = onCall({ secrets: [mySecret] }, async (request) => {
  const value = mySecret.value()
  // ...
})
```

## Why

- `defineSecret` integrates with Cloud Secret Manager (auto-rotation, audit log).
- `process.env.X_SECRET` exposes the secret in the deployed bundle source.
- Phase 3 baseline removed all `process.env.*_SECRET` usages — keep them out.

## What's allowed

`process.env` for NON-secret config is fine:
- `process.env.GCLOUD_PROJECT` (project ID)
- `process.env.FUNCTION_REGION` (region)
- `process.env.NODE_ENV`
- `process.env.GOOGLE_ADS_CLIENT_ID` (public OAuth client ID)

See `functions/src/config/index.ts` for the canonical mix.

## References

- `AGENTS.md` → "Conventions"
- `docs/SECURITY.md`
- ADR in `docs/Decisions.md`
```

- [ ] **Step 15.3: Write `firestore-schemas.mdc`**

```mdc
---
description: Zod-first schema source-of-truth (ADR-009)
globs: ["packages/shared/src/schemas/**", "src/types/**", "functions/src/**/*.ts"]
alwaysApply: false
---

# Firestore schemas (AdSmart, ADR-009)

`packages/shared/src/schemas/` is the single source of truth for Firestore document shapes. Types are derived via `z.infer`. NEVER hand-write a parallel TypeScript interface.

## Pattern

```ts
// packages/shared/src/schemas/userWallet.ts
import { z } from 'zod'

export const UserWalletSchema = z.object({
  id: z.string().optional(),
  balance: z.number().int().min(0),
  currency: z.literal('BRL'),
  updatedAt: z.unknown(), // Timestamp at runtime
})

export type UserWallet = z.infer<typeof UserWalletSchema>
```

Re-export in `packages/shared/src/index.ts`. Use the schema for validation in callables (`safeParse`); use the inferred type elsewhere.

## After changing a schema

1. Add or update Vitest case in the matching `*.test.ts` (co-located).
2. Run `cd packages/shared && bun run test` and root `bun run typecheck`.
3. Update `docs/DATA-MODEL.md` (markdown follows the schema, not the other way).
4. Add a dated entry in `docs/CHANGES.md` describing the field-level drift.

## References

- `CLAUDE.md` → "Editing Firestore document shapes"
- `docs/Decisions.md` → ADR-009
- `docs/DATA-MODEL.md`
```

- [ ] **Step 15.4: Write `firestore-rules.mdc`**

```mdc
---
description: AdSmart Firestore Security Rules conventions (Phase 3 baseline)
globs: ["firestore.rules"]
alwaysApply: false
---

# Firestore Security Rules (AdSmart, Phase 3)

Rules deny by default. Every collection has explicit allow rules.

## Patterns to use

- **Helper functions**: `isAuthenticated()`, `isOwner(userId)`, `isValidEmail(email)`, `hasRequiredFields([...])`, `documentLocked()` (immutability for CPF/CNPJ).
- **Owner-only creates**: `request.resource.data.userId == request.auth.uid`.
- **Immutability**: `request.resource.data.<field> == resource.data.<field>` for fields that can't change.
- **Required fields**: `request.resource.data.keys().hasAll(['email', 'createdAt', ...])`.
- **Server-time pinning**: `request.resource.data.createdAt == request.time`.

## Phase 3 invariants (DO NOT relax)

| Path | Read | Write |
|---|---|---|
| `users/{uid}/wallet/**` | owner | DENY (Admin SDK only) |
| `users/{uid}/transactions/**` | owner | DENY |
| `rateLimits/{userId}` | owner | DENY |
| `securityLogs/{logId}` | DENY | DENY |
| `backupMetadata/{backupId}` | DENY | DENY |
| `userDocuments/{documentId}` | owner-by-userId-field | DENY (via reserveUserDocument callable) |

## Test before deploy

ALWAYS run `bash scripts/firebase/test-rules.sh` (or `/firestore-rules-test`) before deploying. Hook `rules-no-direct-deploy` enforces this.

## References

- `docs/SECURITY.md`
- `docs/Decisions.md` → ADR-010, ADR-012
- Firebase docs: rules-conditions
```

- [ ] **Step 15.5: Write `firestore-indexes.mdc`**

```mdc
---
description: Composite index requirements + selectivity ordering (Firebase docs)
globs: ["firestore.indexes.json", "src/**/*.ts", "src/**/*.tsx", "functions/src/**/*.ts"]
alwaysApply: false
---

# Firestore composite indexes (AdSmart)

ANY query with `where + orderBy` on different fields, OR 2+ range filters, REQUIRES a composite index in `firestore.indexes.json`.

## Optimal field ordering (Firebase docs)

1. **Equality fields** (`==`, `in`) FIRST — order by selectivity decreasing.
2. **Range/inequality fields** AFTER equalities — order by selectivity decreasing.
3. **`orderBy` field** at the end (or position dictated by inequality).
4. Direction (`ASC`/`DESC`) matches the orderBy direction.

## Example

Query:

```ts
db.collectionGroup('transactions')
  .where('type', '==', 'credit')
  .where('status', '==', 'completed')
  .orderBy('createdAt', 'desc')
```

Index entry:

```json
{
  "collectionGroup": "transactions",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## Deploy in BOTH targets

```bash
bash scripts/firebase/safe-deploy.sh dev indexes
bash scripts/firebase/safe-deploy.sh prod indexes
```

Index build is async (1-3 min). Query stays red (`FAILED_PRECONDITION`) until `Enabled`.

## Use the slash command

Prefer `/firestore-new-query` — it walks through the decision tree.

## References

- `CLAUDE.md` → "Adding Firestore queries"
- `docs/DEPLOYMENT.md`
- Firebase docs: query-data/index-overview, multiple-range-fields
```

- [ ] **Step 15.6: Write `functions-callable.mdc`**

```mdc
---
description: Cloud Function v2 onCall canonical pattern (AdSmart)
globs: ["functions/src/**/*.ts"]
alwaysApply: false
---

# Cloud Function v2 onCall pattern (AdSmart)

Pattern verified against `reserveUserDocument.ts` and `getDashboardMetrics.ts`.

## Skeleton

```ts
import * as admin from 'firebase-admin'
import { type CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https'
import { MyInputSchema, type MyOutput } from '@adsmart/shared'

if (!admin.apps.length) admin.initializeApp()

export const myCallable = onCall<unknown, Promise<MyOutput>>(
  // Options block — omit entirely if no special needs.
  // Use { memory: '512MiB' } for volume; { secrets: [mySecret] } for secrets.
  // DO NOT set `region` — project uses default us-central1.
  // DO NOT set `enforceAppCheck` — App Check not yet initialized in client.
  async (request) => {
    // 1. Auth (always)
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado')
    }
    const uid = request.auth.uid

    // 2. Zod input validation (always)
    const parsed = MyInputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw new HttpsError('invalid-argument', parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    // 3. Rate limit (CONDITIONAL: only sensitive/write functions)
    // await checkRateLimit(uid, 'myAction')

    // 4. Logic. For atomic multi-doc writes: db.runTransaction(async (tx) => { ... })

    // 5. Security log (CONDITIONAL: auth/payment/admin events)
    // await securityLogger.logEvent(SecurityEventType.X, uid, {...}, SecuritySeverity.INFO)

    // 6. Return typed
    return { /* ... */ }
  },
)
```

## HttpsError codes

- `unauthenticated` — no `request.auth`
- `invalid-argument` — input validation failed
- `failed-precondition` — business rule violation
- `already-exists` — uniqueness conflict
- `permission-denied` — authenticated but not authorized

## Server timestamps

`admin.firestore.Timestamp.now()` or `FieldValue.serverTimestamp()`. Never `Date.now()`.

## Use the slash command

Prefer `/functions-new-callable` — it scaffolds the right pattern based on function type.

## References

- `functions/src/reserveUserDocument.ts`, `getDashboardMetrics.ts`, `bootstrapUser.ts`
- `AGENTS.md`, `CLAUDE.md`
- `docs/SECURITY.md`
```

- [ ] **Step 15.7: Write `wallet-immutability.mdc`**

```mdc
---
description: Wallet/transactions are write-only via Cloud Functions (ADR-010)
globs: ["src/**/*.ts", "src/**/*.tsx"]
alwaysApply: false
---

# Wallet/transactions immutability from client (AdSmart, ADR-010)

Phase 3 firestore.rules REJECT client-side writes to:
- `users/{uid}/wallet/**`
- `users/{uid}/transactions/**`

Wallet is seeded server-side by `bootstrapUser` (Auth blocking trigger). Transactions are written by Cloud Functions using Admin SDK.

## NEVER (will be blocked by hook + rules)

```ts
// ❌ String-path
await setDoc(doc(db, 'users/X/wallet/current'), data)

// ❌ Modular SDK
await setDoc(doc(db, 'users', uid, 'wallet', 'current'), data)
await setDoc(doc(db, 'users', uid, 'transactions', txId), data)
```

## OK

```ts
// ✓ Update name/phone on users/{uid}
await updateDoc(doc(db, 'users', uid), { name, phone, updatedAt })

// ✓ Read wallet
const snap = await getDoc(doc(db, 'users', uid, 'wallet', 'current'))

// ✓ Credit wallet via callable
const fn = httpsCallable(functions, 'addUserCredits')
await fn({ targetUid, amountCents })
```

## References

- `firestore.rules:51-58`
- `docs/Decisions.md` → ADR-010, ADR-012
- `src/hooks/useWallet.ts`
```

- [ ] **Step 15.8: Write `payments-asaas.mdc`**

```mdc
---
description: Payment gateway is Asaas — SuitPay deprecated
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
---

# Payments: Asaas only (SuitPay deprecated)

AdSmart is migrating from SuitPay to Asaas. SuitPay code in `functions/src/suitpay*` and elsewhere is FROZEN — do not extend, do not harden.

## Rules

- New payment features → Asaas integration only.
- Bug reports on SuitPay → triage but no fix unless customer-impacting AND a fix is cheap.
- Don't import from `suitpay*` modules in new code.
- Webhook handlers for SuitPay (`suitpayWebhook`) stay running until cutover, but no new logic.

## Reference

- `docs/PAYMENTS.md` (read before touching anything payment-related)
- `AGENTS.md` → "What NOT to do" (SuitPay)
- Memory: `suitpay_deprecated.md`
```

- [ ] **Step 15.9: Smoke test — open a TypeScript file in Cursor**

Open a file matching one of the globs (e.g., `functions/src/index.ts`) in Cursor. Verify the relevant rules show in Cursor's rules panel (Cursor settings → Rules → "Active for current file").

If a rule isn't showing despite a glob match, double-check the schema against Task 0 findings.

- [ ] **Step 15.10: Commit**

```bash
git add .cursor/rules/
git commit -m "feat(cursor): add 7 Firebase convention rules mirroring Claude commands/agents/hooks"
```

---

## Task 16: Documentation updates

**Files:**
- Modify: `CLAUDE.md` (append section)
- Modify: `AGENTS.md` (1 line in Read-first map)
- Modify: `docs/CHANGES.md` (dated entry)
- Create: memory file `firebase_conventions_pack.md`

- [ ] **Step 16.1: Append section to CLAUDE.md**

Read the current end of `CLAUDE.md`. Append this new section AFTER the existing last section ("Adding Firestore queries"):

```markdown

## Firebase Conventions Pack

The repo ships an enforcement pack that turns AdSmart's Firebase conventions from passive docs into active tooling. Spec: [docs/superpowers/specs/2026-05-01-firebase-conventions-design.md](docs/superpowers/specs/2026-05-01-firebase-conventions-design.md).

### Slash commands (in `.claude/commands/`)

| Command | Purpose |
|---|---|
| `/firestore-rules-test` | Run rules unit tests in emulator + stamp `.firebase/rules-last-tested.txt` |
| `/firestore-new-query` | Add Firestore query + composite index with optimal selectivity ordering |
| `/functions-new-callable` | Scaffold Cloud Function v2 callable matching real project patterns |
| `/firebase-deploy` | Multi-target safe deploy (`dev`/`prod`) with confirmation gates |

### Agents (in `.claude/agents/`)

| Agent | Use when |
|---|---|
| `firestore-rules-reviewer` | Reviewing `firestore.rules` changes or before deploy |
| `functions-security-reviewer` | After substantive changes to a Cloud Function |
| `firestore-query-reviewer` | After adding a new query — verify index ordering |

### Hooks (in `.claude/settings.json`)

3 PreToolUse (block):
- `secrets-no-process-env` — blocks `process.env.X_SECRET` in `functions/src/`
- `wallet-no-client-write` — blocks client-side `setDoc` on wallet/transactions paths
- `rules-no-direct-deploy` — blocks `firebase deploy --only firestore:rules` without a fresh test stamp

2 PostToolUse (warn):
- `rules-edited-reminder` — after `firestore.rules` edit, lists next steps
- `schema-edited-reminder` — after `packages/shared/src/schemas/` edit, lists 4-step flow

1 UserPromptSubmit (inject):
- `firebase-context-injector` — injects `scripts/firebase/context-snippet.txt` when prompt mentions deploy/rules/callable

### Cursor mirror (in `.cursor/rules/`)

7 MDC rules mirror the same conventions for Cursor users: `firebase-secrets`, `firestore-schemas`, `firestore-rules`, `firestore-indexes`, `functions-callable`, `wallet-immutability`, `payments-asaas`.

### Helper scripts (in `scripts/firebase/`)

- `test-rules.sh` — emulator + Vitest + stamp
- `safe-deploy.sh` — wrapper with prod gate + index polling
- `check-no-process-env-secret.sh`, `check-no-client-wallet-write.sh`, `check-rules-tested.sh` — hook helpers
- `context-snippet.txt` — UserPromptSubmit injected text
```

- [ ] **Step 16.2: Add 1 line to AGENTS.md "Read-first map"**

Read AGENTS.md, find the "Read-first map" table. Add after the existing "Add a Cloud Function" row:

```markdown
| Add a Cloud Function (callable) | `.claude/commands/functions-new-callable.md` (slash command), `functions/src/reserveUserDocument.ts` (canonical example) |
```

(Leave the existing row above it intact.)

- [ ] **Step 16.3: Add dated entry to `docs/CHANGES.md`**

Open `docs/CHANGES.md`. Add at the TOP of the changes log (above the most recent entry):

```markdown
### 2026-05-01 — feat(claude): Firebase Conventions Pack

Added enforcement tooling that moves AdSmart's Firebase conventions from passive docs to active tooling:

- 4 slash commands in `.claude/commands/` (firestore-rules-test, firestore-new-query, functions-new-callable, firebase-deploy)
- 3 agents in `.claude/agents/` (firestore-rules-reviewer, functions-security-reviewer, firestore-query-reviewer)
- 6 hooks in `.claude/settings.json` (3 PreToolUse blocks, 2 PostToolUse warns, 1 UserPromptSubmit inject)
- 7 Cursor rules in `.cursor/rules/` mirroring the same conventions
- 6 helper files in `scripts/firebase/`

Patterns validated against Firebase Functions v2 SDK + Firestore Security Rules + index docs (Context7) AND against actual project code (`reserveUserDocument.ts`, `getDashboardMetrics.ts`, `bootstrapUser.ts`, `config/index.ts`).

Spec: [docs/superpowers/specs/2026-05-01-firebase-conventions-design.md](superpowers/specs/2026-05-01-firebase-conventions-design.md).
Plan: [docs/superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md](superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md).
```

- [ ] **Step 16.4: Create memory file**

The memory directory was empty (per earlier exploration). Create the file:

`/Users/eduardorodrigues/.claude/projects/-Users-eduardorodrigues-Downloads--PESSOAL----Meus-Projetos-adsmart-app/memory/firebase_conventions_pack.md`:

```markdown
---
name: Firebase Conventions Pack
description: Where to find the AdSmart Firebase enforcement pack (commands, agents, hooks, Cursor rules) and the spec/plan that defined them.
type: reference
---

The AdSmart project ships an enforcement pack for Firebase conventions in:

- `.claude/commands/` — 4 slash commands: firestore-rules-test, firestore-new-query, functions-new-callable, firebase-deploy
- `.claude/agents/` — 3 agents: firestore-rules-reviewer, functions-security-reviewer, firestore-query-reviewer
- `.claude/settings.json` — 6 hooks (3 PreToolUse block, 2 PostToolUse warn, 1 UserPromptSubmit inject)
- `.cursor/rules/` — 7 MDC rules mirroring same conventions
- `scripts/firebase/` — helper scripts (test-rules.sh, safe-deploy.sh, 3 check-*.sh, context-snippet.txt)

Spec: docs/superpowers/specs/2026-05-01-firebase-conventions-design.md
Plan: docs/superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md

CLAUDE.md has a top-level "Firebase Conventions Pack" section that lists everything with a one-liner per artifact.

Use these instead of reinventing — they were calibrated against the real codebase and Firebase docs.
```

Add a pointer line to the existing `MEMORY.md` index (path: `/Users/eduardorodrigues/.claude/projects/-Users-eduardorodrigues-Downloads--PESSOAL----Meus-Projetos-adsmart-app/memory/MEMORY.md`):

```markdown
- [Firebase Conventions Pack](firebase_conventions_pack.md) — pointer to .claude/commands/agents/hooks + .cursor/rules + scripts/firebase
```

(If `MEMORY.md` doesn't exist, create it with that single line.)

- [ ] **Step 16.5: Commit doc updates**

```bash
git add CLAUDE.md AGENTS.md docs/CHANGES.md
git commit -m "docs: add Firebase Conventions Pack section to CLAUDE.md + AGENTS.md + CHANGES.md"
```

(Memory files are stored outside the repo, so they're not in the git commit.)

---

## Task 17: End-to-end smoke test

**Goal:** Manually verify the pack works in real Claude Code session.

**Files:** none modified — verification only.

- [ ] **Step 17.1: Test the secrets hook end-to-end**

In a real session, ask Claude to add `process.env.STRIPE_SECRET = 'x'` to any file in `functions/src/`. Confirm the hook blocks with the helpful message.

Then ask Claude to add `process.env.FIREBASE_API_KEY = 'public-value'` to the same file — confirm the hook DOES NOT block (false-positive guard).

- [ ] **Step 17.2: Test the wallet hook end-to-end**

Ask Claude to write `await setDoc(doc(db, 'users', uid, 'wallet', 'current'), { balance: 100 })` somewhere in `src/`. Confirm the hook blocks with the helpful message + ADR pointer.

Then ask Claude to write `await updateDoc(doc(db, 'users', uid), { name: 'X' })` — confirm the hook DOES NOT block.

- [ ] **Step 17.3: Test the rules hook end-to-end**

Without running `/firestore-rules-test` first, ask Claude to run `firebase deploy --only firestore:rules --project adsmart-web-dev`. Confirm the hook blocks.

Run `/firestore-rules-test`. Then ask Claude to run the same deploy command. Confirm the hook now allows it (or, if testing without actually deploying, `safe-deploy.sh` will hit the prod gate).

- [ ] **Step 17.4: Test the rules-edited reminder**

Edit `firestore.rules` (any benign whitespace change, then revert). Confirm Claude shows the post-edit reminder text.

- [ ] **Step 17.5: Test the schema-edited reminder**

Edit any file in `packages/shared/src/schemas/` (whitespace, revert). Confirm Claude shows the schema flow reminder.

- [ ] **Step 17.6: Test the context injector**

Submit a prompt: "I want to deploy firestore rules to dev". Confirm the context snippet from `scripts/firebase/context-snippet.txt` is injected into Claude's context.

- [ ] **Step 17.7: Test an agent**

Invoke: `Use the firestore-rules-reviewer agent to review firestore.rules`. Confirm it walks through the checklist and returns a structured verdict.

- [ ] **Step 17.8: Test a slash command**

Run `/firestore-rules-test` in a real session. Confirm the script runs, vitest passes, and `.firebase/rules-last-tested.txt` is created.

- [ ] **Step 17.9: Test a Cursor rule**

Open `functions/src/index.ts` in Cursor. Confirm the `firebase-secrets` and `functions-callable` rules show in Cursor's "active rules" panel.

- [ ] **Step 17.10: Cleanup smoke artifacts**

Delete `docs/superpowers/plans/_firebase-conventions-pack-schema-notes.md` (the working note from Task 0):

```bash
rm docs/superpowers/plans/_firebase-conventions-pack-schema-notes.md
git add -A
git commit -m "chore(plans): remove schema-validation working notes (post-implementation)"
```

- [ ] **Step 17.11: Final summary commit**

If any tweaks were needed during smoke testing, commit them now:

```bash
git status
# If any changes: 
git add -A
git commit -m "fix(claude/cursor): smoke-test adjustments to Firebase Conventions Pack"
```

If all 6 tests above passed without changes, the implementation is complete.

---

## Self-review checklist (run after writing all tasks)

- [ ] Spec coverage: every section of the spec maps to at least one task.
  - Spec §3 R1-R13 → all locked decisions reflected (R3 in Task 10-13, R8 in Task 2, R10/R11 in Task 12, R12 in Task 3, R13 in Tasks 8/12).
  - Spec §4 layout → Tasks 1-6 (scripts), 7-9 (agents), 10-13 (commands), 14 (hooks), 15 (Cursor rules), 16 (docs).
  - Spec §5 commands → Tasks 10-13 (4 commands).
  - Spec §6 hooks → Task 14 (6 hooks wired).
  - Spec §7 agents → Tasks 7-9 (3 agents).
  - Spec §8 Cursor rules → Task 15 (7 rules).
  - Spec §9 scripts → Tasks 1-6 (6 files).
  - Spec §10 testing → Task 17 (smoke tests).
  - Spec §11 docs → Task 16.
  - Spec §12 risks → Task 0 mitigates the schema risk; the App Check roadmap risk is explicitly out of scope.
  - Spec §13 build sequence → matches the task order here.
- [ ] No placeholders ("TBD", "TODO", "implement appropriate", "similar to Task N", etc.). Every step has actual code/commands.
- [ ] Type/method consistency: `_SECRET` regex used same way in Task 2 (helper) and Task 8 (reviewer agent). `documentLocked()` referenced consistently. `safe-deploy.sh` accepts `<dev|prod> <only>` consistently in Tasks 5, 13, 17.
- [ ] Build sequence: scripts (Tasks 1-6) come before settings.json hooks (Task 14) which invoke them. Agents/commands (Tasks 7-13) are independent. Cursor rules (Task 15) and docs (Task 16) at the end. Smoke test (Task 17) last.
- [ ] Each task ends in a commit. Commits are scoped (single concern per commit).
- [ ] No emoji in committed file content (only in shell script user-facing messages where they help readability).

---

**End of plan.** Total: 17 Tasks, ~80 steps, ~14 commits.
