# AGENTS.md — AdSmart Project Guide

This file is the entry point for AI agents and engineers working on AdSmart. Read it before touching any code.

## Project overview

AdSmart is a B2B SaaS platform that helps marketing agencies manage advertising campaigns. Users connect their Google Ads and Meta Ads accounts via OAuth, generate Looker Studio report dashboards, and pay per report using a prepaid wallet system. The platform is Portuguese-first (pt-BR) with en/es support.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend runtime | React | 18.3 |
| Language | TypeScript | 5.x |
| Build tool | Vite | 5.x |
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
| Linter (frontend) | Biome | 1.x |
| Linter (functions) | ESLint 8 (→ ESLint 9 in Phase 2) | 8.x |
| Git hooks | lefthook | — |
| Test framework | Vitest | 2.x |
| CI | GitHub Actions | — |

## Read-first map

| Task type | Read these files first |
|---|---|
| Add a new page | `src/App.tsx`, `src/components/PrivateRoute.tsx`, `src/components/AdminRoute.tsx` |
| Add a Cloud Function | `functions/src/index.ts`, `functions/src/config/index.ts`, `functions/AGENTS.md` |
| Change auth/admin logic | `src/contexts/AuthContext.tsx`, `src/components/AdminRoute.tsx`, `docs/SECURITY.md` |
| Change Firestore rules | `firestore.rules`, `docs/DATA-MODEL.md`, `functions/test/firestore-rules.test.ts` |
| Change wallet / billing | `docs/DOMAIN.md`, `functions/src/adminWalletManager.ts`, `src/hooks/useWallet.ts` |
| Add OAuth provider | `docs/OAUTH.md`, `functions/src/googleAdsOAuthV2.ts`, `src/services/oauthServices.ts` |
| Work on payments | `docs/PAYMENTS.md` — SuitPay is deprecated; read before touching |
| Add a translation key | `docs/I18N.md`, `src/locales/pt-BR.json` (then en.json and es.json) |
| Write tests | `docs/TESTING.md`, `vitest.config.ts` (root + functions/) |
| Deploy | `docs/DEPLOYMENT.md`, `firebase.json`, `.github/workflows/ci.yml` |

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

- **No default exports** except `App.tsx` (required by Vite) and page-level lazy-loaded components.
- **Named exports** everywhere else.
- **Path alias**: `@/` maps to `src/`. Always use `@/` instead of relative imports that go up more than one level.
- **Currency**: All monetary values are stored in **centavos (BRL cents)**. Display as `amount / 100` in the UI.
- **Timestamps**: All Firestore timestamps use `admin.firestore.Timestamp` (server-side) or `serverTimestamp()`.
- **Secrets**: Never use `process.env.XXX_SECRET` in functions. Import from `functions/src/config/index.ts` which uses `defineSecret`. See `docs/SECURITY.md`.
- **Admin check**: Use `token.admin === true || ADMIN_EMAILS.includes(email)` pattern. New admins → custom claims. See `docs/SECURITY.md`.
- **Rate limiting**: All sensitive functions call `checkRateLimit(userId, actionName)` before doing work.
- **Security logging**: Sensitive events use `securityLogger.logEvent(eventType, userId, details, severity)`.

## What NOT to do

- Do not write `process.env.XXX_SECRET` in Cloud Functions — use `defineSecret`.
- Do not invest time in SuitPay hardening — it is deprecated in favour of Asaas (see `docs/PAYMENTS.md`).
- Do not add new routes without adding them to the route table in `src/App.tsx`.
- Do not write raw SQL or use any SQL library — this project is Firestore-only.
- Do not modify `docs/SECURITY.md` without updating the corresponding code.
