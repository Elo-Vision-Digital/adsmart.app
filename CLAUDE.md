# CLAUDE.md — AdSmart

Claude Code-specific guidance. Tool-agnostic project rules live in [AGENTS.md](AGENTS.md) — read it first.

## Quick references

- Design system → [docs/UI-DESIGN.md](docs/UI-DESIGN.md)
- Firebase Conventions Pack (slash commands, agents, hooks, cursor mirror) → [docs/FIREBASE-CONVENTIONS.md](docs/FIREBASE-CONVENTIONS.md)
- Decision history → [docs/Decisions.md](docs/Decisions.md)
- **Redesign roadmap** → [docs/redesign/EXECUTION-CHECKLIST.md](docs/redesign/EXECUTION-CHECKLIST.md) (status geral + tasks por fase)
- **Project principles** → [docs/redesign/FEATURES-INVENTORY.md § Princípios](docs/redesign/FEATURES-INVENTORY.md#princípios-do-projeto-regras-invioláveis) (16 invioláveis)
- **Research notes** → [docs/research/](docs/research/) (decisões fundamentadas: 01-firebase-stack, 02-llm-strategy, 03-frontend-stack, 09-harness-engineering, etc.)
- **Sprint specs** → [docs/specs/](docs/specs/) (uma pasta por sprint com SPEC + CONTRACT + PROGRESS + EVALUATION)
- **Harness workflow** → [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md) (sprint lifecycle, agents multi-process, sensors)

## Contexts

| Context | Hook | Provides |
|---|---|---|
| `AuthContext` | `useAuth()` | `user`, `loading`, `isAdmin`, sign-in/out methods |
| `LanguageContext` | `useLanguage()` | `language`, `setLanguage`, `t(key)` |
| `ThemeContext` | `useTheme()` | `theme`, `toggleTheme` |

Provider nesting order in `App.tsx`: `LanguageProvider → ThemeProvider → AuthProvider`.

## Testing in Claude sessions

```bash
bun run test              # web
cd functions && bun run test
bun run test:all          # all workspaces via Turbo
bun run test:coverage     # web with coverage
```

Tests live in `*.test.tsx` / `*.test.ts` next to the files they test (web) or in `functions/test/` (functions).

## Biome linter notes

- Biome replaces ESLint + Prettier in the frontend.
- Pre-commit hook runs `biome check --staged`.
- Common traps: `noAssignInExpressions` (no chained assignment `a = b = c`), `noConsole` (warn level).
- Fix automatically: `bun run lint:fix`.

## Code review router

| Situation | Use |
|---|---|
| Reviewing a real GitHub PR (already pushed) | `/code-review` slash command |
| Local working tree, before push | `superpowers:requesting-code-review` skill |
| Inside a `feature-dev:feature-dev` flow | `feature-dev:code-reviewer` agent |

Default for local changes: `superpowers:requesting-code-review`. After push: `/code-review`.

## Skills available

- `firebase-operations` — operating Firebase live (queries, logs, rules, secrets, Auth). Documents when to use MCP vs `bunx firebase-tools` vs editing local files.
- `docs-lint` — audit documentation drift before a release. Checks stale commands, broken links, orphan docs, undated CHANGES entries, contradictions vs AGENTS.md.

## Memory system

Project memories at `.claude/projects/.../memory/`. Key entries:

- `admin_claim_policy.md` — custom claims authoritative, email fallback
- `firebase_secrets.md` — all secrets via `defineSecret` in `functions/src/config/index.ts`
- ~~`suitpay_deprecated.md`~~ — DELETED in Fase 0c (ADR-021 removed SuitPay; Stripe is the planned replacement via FUTURE §8). History preserved in ADR-021 + `docs/CHANGES.md`.
- `firebase_deploy_workflow_rules.md` — hard rules from real deploy incidents

`MEMORY.md` indexes the full set; consult it when continuing prior work.
