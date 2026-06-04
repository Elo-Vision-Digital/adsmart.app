# AGENTS.md — AdSmart Project Guide

This file is the entry point for AI agents and engineers working on AdSmart. Read it before touching any code.

## Project overview

AdSmart is a B2B SaaS platform that helps marketing agencies manage advertising campaigns. Users connect their Google Ads and Meta Ads accounts via OAuth, generate in-app report dashboards (ADR-022 — render in-app substituiu o legacy Looker Studio embed em Fase 0.5; novo fluxo completo FLOW-3.5 ship em Fase 3.5), and pay per report using a prepaid wallet system. The platform is Portuguese-first (pt-BR) with en/es support.

## Sub-AGENTS.md by area

Each folder declares its own conventions. Read the relevant sub-guide alongside this file:

- [src/AGENTS.md](src/AGENTS.md) — frontend conventions (React, Tailwind, i18n, routing, services)
- [functions/AGENTS.md](functions/AGENTS.md) — Cloud Functions v2 conventions (secrets, idempotência, structured logging, rate limit)
- [packages/shared/AGENTS.md](packages/shared/AGENTS.md) — Zod schemas as source of truth (`z.infer`, co-located tests, strict subsets)

## Stack

**Current** (production code as of 2026-05-19):

| Layer | Technology | Version |
|---|---|---|
| Frontend runtime | React | 18.3 |
| Language | TypeScript | 5.x |
| Build tool | Vite | 7.x |
| Styling | Tailwind CSS | 3.x |
| Component library | shadcn/ui (Radix UI) | — |
| Routing | react-router-dom | 6.23 |
| Animation | framer-motion | 12.x |
| Forms | react-hook-form + zod | 7.x / 3.x |
| Icons | lucide-react | 0.396 |
| i18n | Custom context (JSON files) | — |
| Auth / Firestore | Firebase JS SDK | 10.x |
| Functions runtime | Node | 22 |
| Functions SDK | firebase-functions v2 | 6.4 |
| Admin SDK | firebase-admin | 12.7 |
| Linter (frontend) | Biome | 2.x |
| Linter (functions) | ESLint 8 (→ ESLint 9 in Phase 2) | 8.x |
| Git hooks | lefthook | — |
| Test framework | Vitest | 4.x |
| CI | GitHub Actions | — |

**Target** (after the   — see `docs//`):

| Layer | Target | Lands in |
|---|---|---|
| Frontend runtime | React 19 (Actions, `use`, ref as prop) | Fase 1 |
| Styling | Tailwind v4 (`@theme`, `@utility`, CSS-first config) | Fase 1 |
| Typography | SF Pro (variable) | Fase 1 |
| LLM stack | Anthropic Claude (primary) + DeepSeek (fallback for cost) | Fase 3.5 |
| PDF generation | Playwright headless render | Fase 3.5 |
| Spec-driven development | docs/specs/{id}-{name}/ with SPEC + CONTRACT + PROGRESS + EVALUATION | ✅ Live since Fase 0a |
| Multi-process harness | 6 agents in `.claude/agents/` (orchestrator + researcher + planner + implementer + validator + debugger) | ✅ Live since Fase 0a |

Do not preemptively use target-stack syntax until the relevant phase lands — it would break the current code.

## Princípios do projeto (invioláveis)

16 princípios definidos em [docs// § Princípios](docs//#princípios-do-projeto-regras-invioláveis). Resumo dos mais frequentes em revisão:

1. **Context7 antes de propor** — toda lib/padrão/refactor consulta documentação atual antes de virar proposta (regra do usuário).
2. **Schemas + API Contracts são source of truth** — `packages/shared/src/schemas/` + `docs/API-CONTRACTS.md` antes de qualquer código de produto.
3. **IA-coded antes de produto** — AGENTS/CLAUDE/sub-AGENTS/skills/commands/hooks atualizados ANTES do primeiro PR de produto.
4. **Mobile-first** — design e código começam no mobile e escalam para desktop com os mesmos tokens.
7. **i18n nas 3 línguas** — toda string nova vai em `pt-BR.json` + `en.json` + `es.json`. Zero literal hardcoded em JSX/TSX (hook bloqueia).
9. **Callable nova segue padrões** — `firebase-functions/logger` estruturado + idempotência via `processedRequests/{id}` ou `event.id` + `checkRateLimit` + Zod no input.
10. **Toda nova coleção Firestore tem rule explícita** — default deny + permissions específicas. Cliente nunca escreve em `reports/*`, `transactions/*`, `wallet/*`, `publicReportShares/*`.
11. **Sem hardcoded** — zero env-specific literals; zero credenciais em código; secrets via `defineSecret` em `functions/src/config/index.ts`.
13. **Multi-process agents** — Implementer e Validator em subagents separados. Validator não tem `Edit/Write`.
14. **Contracts antes da execução** — toda sprint tem `CONTRACT.md` locked antes do primeiro `Edit/Write` (hook `check-contract-exists.sh` bloqueia).
15. **Score binário** — sensors passam ou não passam. Não há "tá bom o suficiente".
16. **Progress persistido** — cada sprint tem `PROGRESS.md` em `docs/specs/{id}-{name}/`. Bootstrap script reconstrói contexto em nova sessão.

## Sprint workflow (harness)

Esta camada está documentada em [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md). Resumo:

1. `bash scripts/harness/new-sprint.sh <id> <name>` cria `docs/specs/{id}-{name}/` com 4 templates.
2. Preencher `SPEC.md` (feedforward: outcomes, scope, constraints, prior decisions, task breakdown).
3. Negociar `CONTRACT.md` (items atômicos com acceptance tests), lock antes da execução.
4. Implementer executa em waves; Validator (subagent separado) verifica ao fim de cada wave.
5. Atualizar `PROGRESS.md` a cada checkpoint (sobrevive a `/compact`).
6. `EVALUATION.md` com `verdict: pass` fecha a sprint.

Sprints fechadas: `docs/specs/-1-foundation-schemas/`, `docs/specs/0a-foundation-harness/`. Em curso: `docs/specs/0b-foundation-tooling/`.

## Read-first map

| Task type | Read these files first |
|---|---|
| Add a new page | `src/App.tsx`, `src/components/PrivateRoute.tsx`, `src/components/AdminRoute.tsx` |
| Add an admin sub-page | `src/pages/admin/AdminLayout.tsx` (tab list), `src/App.tsx` (admin nested routes), `src/locales/pt-BR.json` admin namespace, `src/locales/types.ts` `Admin` interface. Heavy pages (charts, etc.) follow the `React.lazy` pattern in `src/pages/admin/AdminDashboardPage.tsx` to keep transitive deps off first paint. |
| Add an admin metrics callable | `functions/src/getDashboardMetrics.ts` (canonical: admin gate via `isAdminUser` from `@adsmart/shared`, Zod input from `@adsmart/shared`, `Promise.allSettled` over labelled reads, BRT-anchored day bucketing) |
| Add a Cloud Function | `functions/src/index.ts`, `functions/src/config/index.ts`, `functions/AGENTS.md` |
| Add a Cloud Function (callable) | `.claude/commands/functions-new-callable.md` (slash command), `functions/src/reserveUserDocument.ts` or `functions/src/priceManager.ts` (canonical v2 examples — Zod I/O from `@adsmart/shared`, `region` explicit, `isAdminUser` gate when admin-only) |
| Change auth/admin logic | `src/contexts/AuthContext.tsx` (canonical: `refreshAuthState` after every sign-in, `getIdTokenResult(true)`, OAuth scopes + `prompt: 'select_account'`), `src/components/{PrivateRoute,AdminRoute,AuthLoadingFallback,EmailVerificationBanner}.tsx`, `src/lib/auth/{errors,errorMessages}.ts` (single source for `authErrorToTKey` + `isAuthError`), `packages/shared/src/auth/{admin,password}.ts` (single source for `ADMIN_EMAILS` + `isAdminUser` + `validatePassword`), `src/pages/{LoginPage,ForgotPasswordPage,SettingsPage,DeleteDataPage}.tsx`, `docs/SECURITY.md`, `docs/ERROR-HANDLING.md` (auth code→i18n map table). See ADR-020. |
| Change Firestore rules | `firestore.rules`, `docs/DATA-MODEL.md`, `functions/test/firestore-rules.test.ts` |
| Change wallet / billing | `docs/DOMAIN.md`, `functions/src/adminWalletManager.ts`, `src/hooks/useWallet.ts`, `packages/shared/src/schemas/userWallet.ts` + `transaction.ts` |
| Change user profile shape | `packages/shared/src/schemas/user.ts` (source of truth: `UserSchema` + strict `UserClientUpdateSchema`), `functions/src/bootstrapUser.ts`, `functions/src/reserveUserDocument.ts`, `src/pages/SettingsPage.tsx` |
| Add OAuth provider | `docs/OAUTH.md`, `functions/src/googleAdsOAuth.ts`, `src/services/oauthServices.ts`, `packages/shared/src/schemas/oauthState.ts` (state + temp token schemas), `functions/src/lib/oauthCrypto.ts` (AES-256-GCM for tokens at rest — ADR-019) |
| Work on payments | `docs/PAYMENTS.md` — SuitPay was REMOVED in ADR-021 (2026-05-18); Stripe integration is the planned replacement (FUTURE §8 — see `docs/research/08-stripe-future.md`). `AddCreditsModal` is a maintenance-notice placeholder. Reference for atomic wallet credit: `functions/src/adminWalletManager.ts` |
| Add a translation key | `docs/I18N.md`, `src/locales/pt-BR.json` (then en.json and es.json) |
| Write tests | `docs/TESTING.md`, `vitest.config.ts` (root + functions/) |
| Deploy | `docs/DEPLOYMENT.md`, `firebase.json`, `.github/workflows/ci.yml` |
| Run a one-shot data migration | `scripts/migrations/` — follow Admin SDK + BulkWriter pattern; dry-run first, idempotent, `--write` explicit |

## Commit scopes

| Scope | Use for |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `refactor` | Code restructure with no behaviour change |
| `test` | Test-only changes |
| `docs` | Documentation only |
| `security` | Security fixes or hardening |
| `ci` | CI/CD pipeline changes |
| `chore` | Tooling, deps, config |
| `style` | Formatting only (auto-formatted by Biome) |

## Conventions

- **No hardcoded config values.** Anything that varies between environments — OAuth client IDs, redirect URIs, public app IDs, API endpoints that are not protocol-defined, feature flags, project identifiers — flows through `defineString` (non-secret) or `defineSecret` (sensitive) in `functions/src/config/index.ts`. Do NOT inline literals as fallbacks like `process.env.X || 'literal'` and do NOT use a `default:` on `defineString` for production values. The CLI blocks deploy when a param has no value — that is the desired safety: deployment forces every environment to provision the value explicitly. Protocol-level constants (Google OAuth URLs, Meta Graph API host, scope strings, API versions) are NOT config and stay in code. Litmus test (12-factor): *"if this codebase were open-sourced today, would any credential or environment-specific value leak?"* If yes, the value belongs in a param, not in source.
- **No unnecessary comments.** Default: write no comments. Only add one when the WHY is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug, behavior that would surprise a future reader. Do NOT write comments that restate what well-named code already says. Do NOT add decorative banners (`// ============`, ASCII headers, section dividers). Do NOT add narrative comments referencing the current task, ADR number, or PR. Identifiers + docs in `docs/` carry that load.
- **No default exports** except `App.tsx` (required by Vite) and page-level lazy-loaded components.
- **Named exports** everywhere else.
- **Path alias**: `@/` maps to `src/`. Always use `@/` instead of relative imports that go up more than one level.
- **Currency**: All monetary values are stored in **centavos (BRL cents)**. Display as `amount / 100` in the UI.
- **Timestamps**: All Firestore timestamps use `admin.firestore.Timestamp` (server-side) or `serverTimestamp()`.
- **Secrets**: Never use `process.env.XXX_SECRET` in functions. Declare via `defineSecret` in `functions/src/config/index.ts` and bind on each function via `options.secrets: [...]`. See `docs/SECURITY.md`.
- **Non-secret app config**: OAuth client IDs, redirect URIs, public endpoints flow through `defineString('NAME')` in `functions/src/config/index.ts` (no `default:` — see "No hardcoded config values" rule above), read via `.value()`. Do NOT read these from `process.env` directly. `process.env` reads inside `functions/src/` are limited to Cloud Run built-ins (`GCLOUD_PROJECT`, `FUNCTION_REGION`, `FUNCTION_TARGET`, `NODE_ENV`) and test/debug flags (`*_TEST_MODE`). Provision values per-project via `functions/.env` (gitignored), `functions/.env.<project>`, or `firebase functions:params:set`. See [docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md](docs/superpowers/specs/2026-05-18-functions-config-modernization-design.md).
- **Admin check**: Use `isAdminUser(auth.token, email)` imported from `@adsmart/shared` (ADR-016). Custom claim `admin === true` is authoritative; email allowlist is a transition fallback (single source: `packages/shared/src/auth/admin.ts`). Do NOT redeclare `ADMIN_EMAILS` arrays — they were consolidated in ADR-016. Custom claims provisioned via `setCustomUserClaims` appear on the user's next sign-in automatically (ADR-020 — `AuthContext.refreshAuthState` calls `getIdToken(true)` + `user.reload()`).
- **Password policy**: Use `validatePassword(pwd)` from `@adsmart/shared` (returns `{ valid, errors[i18n_key] }`). Single source: `packages/shared/src/auth/password.ts`. Both LoginPage signup and SettingsPage change-password consume it (ADR-020). Do NOT redeclare a local validator.
- **Auth error mapping**: Use `authErrorToTKey(err)` from `src/lib/auth/errorMessages.ts` (returns an i18n key for `t()`). Pattern in catch blocks that mix local `Error` throws + Firebase calls: `if (isAuthError(err)) → t(authErrorToTKey(err))`; else if `err instanceof Error && err.message → err.message`; else fallback to `common.error.generic`. See `docs/ERROR-HANDLING.md` for the full code→key table.
- **Schemas**: `packages/shared/src/schemas/` is the single source of truth for every Firestore document shape AND every callable I/O contract (ADR-009 / ADR-016 / ADR-018). Types via `z.infer`. Do NOT hand-write a parallel `interface` — it will drift.
- **Zod 4 idioms**: top-level format validators — `z.email()`, `z.url()`, `z.iso.datetime()`. NOT the deprecated method forms `z.string().email()`, `z.string().url()`, `z.string().datetime()`. For Firestore timestamps, use `zTimestamp()` from `@adsmart/shared` (duck-typed Admin+Web SDK) — never `z.unknown()`.
- **Schema changes — 4-step flow**: (1) update or add a Vitest case in the matching `*.test.ts` next to the schema; (2) run `cd packages/shared && bun run test` and `bun run typecheck` from the root; (3) update [docs/DATA-MODEL.md](docs/DATA-MODEL.md) — the schema is executable, the markdown must follow; (4) add a dated entry to [docs/CHANGES.md](docs/CHANGES.md). When a doc is partially client-writable, also export a `.strict()` subset (e.g. `UserClientUpdateSchema`) that mirrors `firestore.rules` immutability checks at the type layer.
- **Timestamps in schemas**: use `zTimestamp()` from `@adsmart/shared` (duck-typed, works with both Admin and Web SDK). In server code, write `admin.firestore.Timestamp.now()` or `FieldValue.serverTimestamp()` — never `new Date()` raw.
- **Rate limiting**: All sensitive functions call `checkRateLimit(userId, actionName)` before doing work.
- **Security logging**: Sensitive events use `securityLogger.logEvent(eventType, userId, details, severity)`.
- **Callable v2 baseline**: every new callable uses `onCall` from `firebase-functions/v2/https` with explicit `region`, Zod input via `safeParse`, typed output, and `HttpsError` for failures. `priceManager.ts` and `reserveUserDocument.ts` are the references.

## What NOT to do

- Do not write `process.env.XXX_SECRET` in Cloud Functions — use `defineSecret` and bind via `options.secrets`. Hook `secrets-no-process-env` already blocks this on pre-commit.
- Do not read non-secret app config (OAuth client IDs, redirect URIs, public endpoints) from `process.env` in `functions/src/` — use `defineString` exports from `config/index.ts`. The `functions-security-reviewer` agent flags this.
- Do not hardcode environment-specific values (URLs, IDs, hosts, region-specific endpoints) as literals or as `default:` on `defineString`. The whole point of using params is that deploy fails loud when a value is missing — adding a default circumvents that safety. Protocol constants (Google OAuth URLs, Meta Graph API host, OAuth scopes, API versions) are not config and stay in code.
- Do not add decorative comment banners (`// ===========`, ASCII section dividers, narrative section headers). Do not write comments that restate what well-named code already says. Do not annotate code with the current ADR/task — that belongs in `docs/CHANGES.md` and `docs/Decisions.md`, not in source.
- Do not redeclare `ADMIN_EMAILS` arrays anywhere — use `isAdminUser` from `@adsmart/shared` (ADR-016). Five copies existed pre-ADR-016; do not reintroduce drift.
- Do not redeclare a local `validatePassword` — use the one from `@adsmart/shared` (ADR-020). Two surfaces had drifted (LoginPage 8 chars / SettingsPage 6 chars) — both now share one schema.
- Do not write bespoke `if (error.code === 'auth/...')` chains in catch blocks. Use `authErrorToTKey(err)` from `src/lib/auth/errorMessages.ts` (ADR-020). Privacy-collapsed mappings prevent account enumeration — do not "fix" them by giving each code its own message.
- Do not pass local `Error` instances (e.g., `throw new Error(t('...'))`) through `authErrorToTKey`. That maps them to `common.error.generic` and hides the real message. Use the split pattern documented in `docs/ERROR-HANDLING.md`.
- Do not call `createUserWithEmailAndPassword(auth, ...)` directly from pages. Use `signUp` from `useAuth()` so future Context-level hooks (telemetry, post-signup steps) reach the path (ADR-020).
- Do not hand-write `interface User` / `interface ProductPrice` / etc. — every Firestore document shape is in `packages/shared/src/schemas/`. Import the inferred type. Stale fields (`displayName`, `photoURL` on `User`) live on Firebase Auth, not Firestore.
- Do NOT restore SuitPay (deleted end-to-end in ADR-021 — code, secrets, Cloud Run services, UI). Stripe is the planned replacement (FUTURE §8); build that instead. See [docs/PAYMENTS.md](docs/PAYMENTS.md).
- Before any `firebase deploy`, follow the pre-deploy checklist in the `firebase_deploy_workflow_rules` memory — multiple Sprint 3 deploys failed because the checklist was skipped (.env not rebuilt, secrets not provisioned in target project, etc).
- Never use `gcloud run services update` on a Firebase-managed function. Firebase CLI 14+ garbage-collects images after 1 day; any Cloud Run config change needs the source image to create a new revision. Always use `firebase deploy` or `firebase functions:delete` + redeploy.
- Do not re-introduce Firebase App Check without a new ADR (ADR-019 removed it end-to-end). Defense in depth is Firebase Auth + `checkRateLimit` + Firestore rules.
- Do not re-implement OAuth token encryption inline. Import `encryptString` / `decryptField` / `detectAndDecrypt` from `functions/src/lib/oauthCrypto.ts` (single source of truth, ADR-019). Callables that touch OAuth tokens bind `encryptionKey` in `options.secrets`.
- Do not add new routes without adding them to the route table in `src/App.tsx`.
- Do not write raw SQL or use any SQL library — this project is Firestore-only.
- Do not modify `docs/SECURITY.md` without updating the corresponding code.
- Do not compile the frontend for development using `vite build` (which defaults to production and loads `.env.production`). Always use `bun run build:dev` (which runs `--mode development` and loads `.env.development`) when deploying to the `adsmart-web-dev` environment in CI or locally. Mixed environments corrupt production databases.
