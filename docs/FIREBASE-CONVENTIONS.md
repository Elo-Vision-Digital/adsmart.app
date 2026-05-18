# Firebase Conventions Pack — AdSmart

Enforcement tooling for AdSmart's Firebase conventions. Loaded on demand by AI agents touching Firebase code.

The pack turns AdSmart's Firebase conventions from passive docs into active tooling. Spec: [docs/superpowers/archive/specs/2026-05-01-firebase-conventions-design.md](superpowers/archive/specs/2026-05-01-firebase-conventions-design.md). Plan: [docs/superpowers/archive/plans/2026-05-01-firebase-conventions-pack-plan.md](superpowers/archive/plans/2026-05-01-firebase-conventions-pack-plan.md).

## Slash commands (in `.claude/commands/`)

| Command | Purpose |
|---|---|
| `/firestore-rules-test` | Run rules unit tests in emulator + stamp `.firebase/rules-last-tested.txt` |
| `/firestore-new-query` | Add Firestore query + composite index with optimal selectivity ordering |
| `/functions-new-callable` | Scaffold Cloud Function v2 callable matching real project patterns |
| `/firebase-deploy` | Multi-target safe deploy (`dev`/`prod`) with confirmation gates |

## Agents (in `.claude/agents/`)

| Agent | Use when |
|---|---|
| `firestore-rules-reviewer` | Reviewing `firestore.rules` changes or before deploy |
| `functions-security-reviewer` | After substantive changes to a Cloud Function |
| `firestore-query-reviewer` | After adding a new query — verify index ordering |

## Hooks (in `.claude/settings.json`)

3 PreToolUse (block):
- `secrets-no-process-env` — blocks `process.env.X_SECRET` in `functions/src/`
- `wallet-no-client-write` — blocks client-side `setDoc` on wallet/transactions paths
- `rules-no-direct-deploy` — blocks `firebase deploy --only firestore:rules` without a fresh test stamp

2 PostToolUse (warn):
- `rules-edited-reminder` — after `firestore.rules` edit, lists next steps
- `schema-edited-reminder` — after `packages/shared/src/schemas/` edit, lists 4-step flow

1 UserPromptSubmit (inject):
- `firebase-context-injector` — injects `scripts/firebase/context-snippet.txt` when prompt mentions deploy/rules/callable

## Cursor mirror (in `.cursor/rules/`)

7 MDC rules mirror the same conventions for Cursor users: `firebase-secrets`, `firestore-schemas`, `firestore-rules`, `firestore-indexes`, `functions-callable`, `wallet-immutability`, `payments-asaas`.

## Helper scripts (in `scripts/firebase/`)

- `test-rules.sh` — emulator + Vitest + stamp
- `safe-deploy.sh` — wrapper with prod gate + index polling
- `check-no-process-env-secret.sh`, `check-no-client-wallet-write.sh`, `check-rules-tested.sh` — PreToolUse hook helpers
- `inject-firebase-context.sh` — UserPromptSubmit hook helper that emits the snippet via JSON additionalContext
- `context-snippet.txt` — text injected when the inject helper matches keywords
