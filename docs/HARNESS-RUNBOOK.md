# Harness Runbook — AdSmart

How to operate the multi-agent harness installed in Fase 0a. This is the canonical reference for working a sprint end-to-end.

**Philosophy** (Martin Fowler, abr/2026): *"Harness engineering = everything in an AI agent except the model itself — a system of controls that gives genuine confidence in what agents produce."*

Full taxonomy + sources: [docs/research/09-harness-engineering.md](research/09-harness-engineering.md).

---

## Anatomy

### Agents (`.claude/agents/`)

| Agent | Role | Tools | Restriction |
|---|---|---|---|
| `orchestrator` | Coordinates the sprint, spawns the others, never edits code | `Agent, Read, Grep, Glob, TodoWrite, Bash` | Cannot `Edit`/`Write` source |
| `researcher` | Discovery: repo + Context7 + web | `Read, Grep, Glob, WebSearch, WebFetch, mcp Context7/Firebase` | Read-only |
| `planner` | Atomic task decomposition → CONTRACT.md draft | `Read, Grep, Glob, TodoWrite, Write` | Write only inside `docs/specs/` |
| `implementer` | Writes code against locked CONTRACT | `Read, Edit, Write, Grep, Glob, Bash, TodoWrite` | **No `Agent`** — cannot spawn |
| `validator` | Binary scoring per CONTRACT item | `Read, Grep, Glob, Bash` | **No `Edit`/`Write`** — cannot fix |
| `debugger` | Root-cause on FAIL → fix plan | `Read, Grep, Glob, Bash, TodoWrite` | **No `Edit`/`Write`** — only diagnoses |

Each subagent runs in a **fresh 200k context**: it sees only the prompt the Orchestrator sends. This isolation is intentional — it prevents Implementer from rationalizing scope creep and prevents Validator from being polluted by Implementer's reasoning.

### Artifacts (`docs/specs/{sprint-id}-{name}/`)

| File | Type | Owner | Read by |
|---|---|---|---|
| `SPEC.md` | Feedforward (guide) | Human + Orchestrator | All agents |
| `CONTRACT.md` | Negotiated baseline | Planner → Implementer/Validator lock | Implementer + Validator |
| `PROGRESS.md` | Persistent memory | Every agent appends | Bootstrap script (next session) |
| `EVALUATION.md` | Sensor feedback | Validator | Orchestrator + Debugger |

Templates live in [`docs/specs/_templates/`](specs/_templates/). Run `scripts/harness/new-sprint.sh` to instantiate.

### Scripts (`scripts/harness/`)

| Script | Purpose |
|---|---|
| `bootstrap-session.sh` | Print compact state at session start (git + sprint + memory) |
| `update-progress.sh "<note>"` | Append timestamped note to current sprint's PROGRESS.md |
| `new-sprint.sh <id> <name>` | Scaffold a new sprint folder with all 4 templates |

---

## Typical sprint flow

### 0. Bootstrap

Every fresh Claude Code session starts with:

```bash
bash scripts/harness/bootstrap-session.sh
```

Output (< 5k tokens) covers: branch, last commits, working tree, current sprint header, last PROGRESS section, memory index. The agent reads this and aligns without redoing discovery.

### 1. Create the sprint

```bash
bash scripts/harness/new-sprint.sh 1 design-system
# → creates docs/specs/1-design-system/{SPEC,CONTRACT,PROGRESS,EVALUATION}.md
```

Human fills `SPEC.md` with Outcomes, Scope (in/out), Constraints. Leave `Prior decisions` empty if research is needed.

### 2. Research (if needed)

The Orchestrator agent spawns 2–4 Researcher subagents in **parallel** (all in one message). Each gets a distinct topic from the SPEC. Each returns a short sourced report. Orchestrator integrates findings into SPEC's `Prior decisions`.

Manual invocation example:

```
Agent({ subagent_type: "researcher", prompt: "Investigate Tailwind v4 migration patterns in Vite monorepos. Confirm @theme directive syntax for 2026. Return < 800 words with sources." })
```

### 3. Plan

Spawn `planner`. It reads the enriched SPEC and produces a draft `CONTRACT.md` with atomic 2–4h tasks + dependency waves.

### 4. Negotiate contract

Spawn `implementer` (fresh context) → ask: "What will you actually deliver from this CONTRACT? Confirm or revise the list."

Spawn `validator` (fresh context) → ask: "Does the implementer's list cover 100% of SPEC outcomes without scope creep?"

If validator disagrees, send dissent to implementer for one more pass. Then lock: set `status: locked` in CONTRACT frontmatter and commit.

### 5. Execute

Orchestrator groups CONTRACT items into **waves** by dependency. Independent items go in the same wave. For each wave, spawn one Implementer per item, all in parallel:

```
Agent({ subagent_type: "implementer", prompt: "Execute CONTRACT items #1 and #2 in docs/specs/1-design-system/CONTRACT.md. SPEC is at .../SPEC.md. Branch is feat/-design-system. Commit per item." })
Agent({ subagent_type: "implementer", prompt: "Execute CONTRACT item #3 — independent of #1, #2." })
```

After each wave: run sensors locally (`bun run lint && bun run typecheck && bun run test`). Append progress to `PROGRESS.md`.

### 6. Validate

Spawn `validator` (fresh context):

```
Agent({ subagent_type: "validator", prompt: "Validate sprint 1-design-system. CONTRACT at docs/specs/1-design-system/CONTRACT.md. Branch HEAD is <hash>. Score each item PASS/FAIL with evidence. Write EVALUATION.md." })
```

- If `verdict: pass` → ship.
- If `verdict: fail` → spawn `debugger`.

### 7. Debug (only on FAIL)

```
Agent({ subagent_type: "debugger", prompt: "EVALUATION at docs/specs/1-design-system/EVALUATION.md says FAIL on items #3, #5. Diagnose root cause + fix plan." })
```

Debugger writes the fix plan into PROGRESS.md. Orchestrator then loops back to step 5 with a wave that contains ONLY the fix tasks.

### 8. Ship

When `EVALUATION.md` says PASS:

1. Append final entry to PROGRESS.md (status: done)
2. `git push` (if not pushed)
3. `gh pr create --base develop --head feat/...`
4. Hand to human reviewer

---

## Hard rules (boundaries)

1. **Orchestrator never edits source.** Coordination only.
2. **Implementer never spawns subagents.** Its tool list excludes `Agent`. If it needs research mid-execution, it stops and tells Orchestrator.
3. **Validator never edits source.** Its tool list excludes `Edit`/`Write`. Binary score, no patches.
4. **Debugger never edits source.** Diagnoses + fix plan only. Implementer applies the plan.
5. **CONTRACT is locked.** Once `status: locked`, only Orchestrator can re-negotiate (via Implementer + Validator dissent). Implementer cannot widen scope mid-execution.
6. **Acceptance tests are commands.** Every CONTRACT item has a verification command (`bun run …`, `grep -q …`). No "looks good".
7. **Score is binary.** PASS or FAIL per item. "Mostly working" = FAIL.
8. **Update PROGRESS.md before compacting.** Persistence between sessions depends on this. Bootstrap script will lead the next session into PROGRESS first.

---

## Failure modes & escalation

| Symptom | Diagnosis | Escalate to |
|---|---|---|
| Validator FAILs on the same item twice in a row | CONTRACT item is ambiguous OR root cause is conceptual | Human (re-negotiate SPEC or CONTRACT) |
| Implementer cannot satisfy an item without scope creep | Plan is wrong | Orchestrator → re-plan that one item |
| Acceptance test passes but Validator inferential check FAILs | Convention drift caught by reading code | Implementer fixes per Validator's note; re-run wave |
| Sensors red but no diff seems wrong | Likely upstream regression (not this sprint) | Investigate `git log --first-parent`; if regression is unrelated, fix in a different branch |
| Multiple agents in same session | Confusion: which is the Orchestrator? | Always invoke via `Agent(subagent_type=…)`; never role-play in main context |

---

## When NOT to use the full harness

Trivial work (typo fix, one-line comment update, single-doc edit) does not need the full ceremony. Use it for:

- Multi-file features (refactors, new schemas, new flows)
- Anything touching > 1 layer (frontend + functions + rules)
- Anything that survives more than one session

For trivial work, just edit, run sensors, commit.

---

## Maintenance

When templates need updating, edit `docs/specs/_templates/{SPEC,CONTRACT,PROGRESS,EVALUATION}.md`. New sprints picked up the change automatically; in-flight sprints keep their already-instantiated files.

When agent prompts need updating, edit `.claude/agents/{name}.md`. The next `Agent` call uses the updated prompt.

---

## References

- [docs/research/09-harness-engineering.md](research/09-harness-engineering.md) — full taxonomy + sources
- [Martin Fowler — Harness engineering](https://martinfowler.com/articles/harness-engineering.html)
- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [docs//](/) — phase-by-phase plan that uses this harness
