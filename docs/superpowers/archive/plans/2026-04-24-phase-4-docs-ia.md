# Phase 4 — Docs/IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the complete documentation layer (AGENTS.md, CLAUDE.md, README.md, 12 docs/ files, 2 sub-AGENTS.md files) so AI agents and human engineers have a full behaviour contract before Phase 2 upgrades.

**Architecture:** Pure documentation phase — no code changes. Every file is written from scratch based on the current codebase state. `docs/SECURITY.md` already exists from Phase 3 and must NOT be overwritten. All docs must reflect the code as-is, not as it will be after Phase 2.

**Tech Stack:** Markdown only. No new dependencies. All paths verified against current repo structure (branch `migrate`).

---

## File Map

**Create:**
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/DATA-MODEL.md`
- `docs/DOMAIN.md`
- `docs/API-CONTRACTS.md`
- `docs/OAUTH.md`
- `docs/PAYMENTS.md`
- `docs/ENVIRONMENT.md`
- `docs/TESTING.md`
- `docs/DEPLOYMENT.md`
- `docs/I18N.md`
- `docs/Decisions.md`
- `docs/QA-CHECKLIST.md`
- `docs/CHANGES.md`
- `src/AGENTS.md`
- `functions/AGENTS.md`

**Do NOT touch:** `docs/SECURITY.md` (already exists from Phase 3)

---

## Task 1: README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README.md**

```markdown
# AdSmart

SaaS platform for advertising management dashboards. Connects Google Ads and Meta Ads accounts, generates Looker Studio report links, and manages user wallet balance for pay-per-report billing.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 (CSS variable tokens) + shadcn/ui |
| Routing | react-router-dom v6 |
| Auth / DB | Firebase (Auth + Firestore) |
| Functions | Firebase Cloud Functions v2 (Node 22) |
| Tooling | Biome (lint+format), lefthook (git hooks), Vitest |

## Prerequisites

- Node 22
- Firebase CLI: `npm install -g firebase-tools`
- Java 11+ (for Firebase emulators)

## Setup

```bash
# Clone and install root deps
npm install

# Install functions deps
cd functions && npm install && cd ..

# Copy env template
cp .env.example .env
# Fill VITE_* values from Firebase console → Project settings → Your apps → Web app
```

## Environment variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for full reference. Minimum for local dev:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_FIREBASE_EMULATOR=true
VITE_RECAPTCHA_SITE_KEY=...
```

## Scripts

### Frontend (root)

| Command | Action |
|---|---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | TypeScript compile + Vite build |
| `npm run lint` | Biome check (all files) |
| `npm run lint:fix` | Biome check with auto-fix |
| `npm run format` | Biome format (write) |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Vitest run (all suites) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage report |

### Functions (`cd functions`)

| Command | Action |
|---|---|
| `npm run build` | `tsc` compile to `lib/` |
| `npm run build:watch` | Incremental watch |
| `npm run lint` | ESLint (non-blocking until Phase 2) |
| `npm test` | Vitest run |
| `npm run serve` | Build + start functions emulator only |
| `npm run deploy` | `firebase deploy --only functions` |

## Local development with emulators

```bash
# Terminal 1 — start all emulators
firebase emulators:start

# Terminal 2 — start frontend
npm run dev
```

Emulator ports: Auth 9099, Firestore 8080, Functions 5001, Hosting 5002, UI 4000.

Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` to connect the frontend to the emulators.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Architecture overview

- **Frontend** (SPA): React app served via Firebase Hosting. Communicates with Firestore directly for reads and calls Cloud Functions for writes that require server-side logic (wallet, OAuth, reCAPTCHA).
- **Cloud Functions**: All sensitive operations live here — OAuth token exchange, wallet mutations, admin actions, rate limiting, security logging.
- **Firestore**: Single database. Security rules enforce ownership and prevent client writes to sensitive subcollections (`wallet`, `transactions`, `rateLimits`).

See [AGENTS.md](AGENTS.md) for the full agent-oriented overview.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, scripts, and architecture overview"
```

---

## Task 2: AGENTS.md (root)

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write AGENTS.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs(agents): add root AGENTS.md with stack table, read-first map, and conventions"
```

---

## Task 3: CLAUDE.md (root)

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
# CLAUDE.md — AdSmart

This file supplements AGENTS.md with Claude Code-specific guidance and inline design system reference.

Read [AGENTS.md](AGENTS.md) first. This file adds what's unique to Claude Code sessions.

## Stack (quick reference)

React 18 · TypeScript · Vite · Tailwind 3 · shadcn/ui · react-router-dom v6 · Firebase SDK 10 · framer-motion 12 · Biome · Vitest · Firebase Functions v2 (Node 22) · firebase-admin 12

## Design system

### Typography

- **Font family**: Montserrat (400, 500, 600, 700) loaded from `@fontsource/montserrat`
- **Base**: `font-sans` in Tailwind → `Montserrat, system-ui, sans-serif`
- **Scale**: Use standard Tailwind text-xs through text-4xl; no custom size tokens

### Color tokens (CSS variables)

All colors use CSS variables defined in `src/index.css`. Use Tailwind utility names, not raw hex values.

| Token | Light | Dark | Tailwind class |
|---|---|---|---|
| `--background` | `#FFFFFF` | `#000000` | `bg-background` |
| `--surface` | `#FAFAFA` | `#0A0A0A` | `bg-surface` |
| `--text` | `#000000` | `#FFFFFF` | `text-foreground` |
| `--border` | `#E5E5E5` | `#1A1A1A` | `border-border` |
| `--muted` | `#666666` | `#999999` | `text-muted` |
| `--muted-foreground` | `#999999` | `#666666` | `text-muted-foreground` |
| `--primary` | `#000000` | `#FFFFFF` | `text-primary` / `bg-primary` |

Theme switching: `data-theme="dark"` on `<html>` (managed by `ThemeContext`).

### shadcn/ui components in use

| Component | File |
|---|---|
| Button | `src/components/ui/button.tsx` |
| Card | `src/components/ui/card.tsx` |
| Checkbox | `src/components/ui/checkbox.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |
| Input | `src/components/ui/input.tsx` |
| Label | `src/components/ui/label.tsx` |
| Toast | `src/components/ui/toast.tsx` |

When adding new UI, prefer extending existing components. Do not install new Radix primitives without checking if the pattern already exists.

### Animations

Framer Motion is loaded as `framer-motion` (import from `framer-motion`). Custom Tailwind animations: `animate-slide-in`, `animate-slide-out`, `animate-fade-in-up`, `animate-fade-in`.

## Contexts

| Context | Hook | Provides |
|---|---|---|
| `AuthContext` | `useAuth()` | `user`, `loading`, `isAdmin`, sign-in/out methods |
| `LanguageContext` | `useLanguage()` | `language`, `setLanguage`, `t(key)` |
| `ThemeContext` | `useTheme()` | `theme`, `toggleTheme` |

Provider nesting order in `App.tsx`: `LanguageProvider → ThemeProvider → AuthProvider`.

## Route guard components

- `PrivateRoute` (`src/components/PrivateRoute.tsx`): redirects unauthenticated users to `/login`.
- `AdminRoute` (`src/components/AdminRoute.tsx`): redirects non-admins to `/dashboard`. Wraps `PrivateRoute` logic internally.

## Testing in Claude sessions

```bash
# Run all web tests
npm test

# Run all functions tests (from functions/)
cd functions && npm test

# Run with coverage
npm run test:coverage
```

Tests live in `*.test.tsx` / `*.test.ts` next to the files they test (web) or in `functions/test/` (functions).

## Biome linter notes

- Biome replaces ESLint + Prettier in the frontend.
- Pre-commit hook runs `biome check --staged`.
- Common traps: `noAssignInExpressions` (no chained assignment `a = b = c`), `noConsole` (warn level).
- Fix automatically: `npm run lint:fix`.

## Memory system

This project has a memory system at `.claude/projects/.../memory/`. Key memories:
- `admin_claim_policy.md` — admin access uses custom claims + email fallback
- `firebase_secrets.md` — all secrets via `defineSecret` from `functions/src/config/index.ts`
- `suitpay_deprecated.md` — do NOT harden SuitPay; Asaas replaces it
- `phase_ordering.md` — Phase 1 → 3 → 4 → 2

## What changed in Phase 3 (security baseline)

Before Phase 2 upgrades, these security fixes are in place:
- Firestore rules: `wallet`/`transactions` write-blocked client-side; `rateLimits` write-only via Admin SDK
- CSP/HSTS/COOP/CORP headers in `firebase.json`
- GTM moved to `src/lib/gtm.ts` (no inline script)
- AdminRoute guards `/admin` with custom claim check
- All secrets via `defineSecret` (no `process.env.XXX_SECRET`)
- securityLogger re-entrancy guard prevents infinite loops on SUSPICIOUS_ACTIVITY events
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add CLAUDE.md with design system, contexts, and Claude-specific guidance"
```

---

## Task 4: docs/DATA-MODEL.md

**Files:**
- Create: `docs/DATA-MODEL.md`

- [ ] **Step 1: Write docs/DATA-MODEL.md**

```markdown
# Data Model

Firestore database for project `adsmart-app`. All monetary values are in **BRL centavos** (integer). All timestamps are Firestore `Timestamp` objects.

## Collection index

| Collection | Purpose | Access |
|---|---|---|
| `users/{uid}` | User profile | Owner only |
| `users/{uid}/wallet/current` | Prepaid balance | Admin SDK only (write) |
| `users/{uid}/transactions/{txId}` | Balance history | Admin SDK only (write) |
| `users/{uid}/oauth_tokens/google_ads` | Encrypted Google Ads tokens | Admin SDK only (write) |
| `users/{uid}/adAccounts/{id}` | Connected ad accounts | Owner (write via Function) |
| `campaigns/{id}` | Ad campaign records | Owner only |
| `reports/{id}` | Generated report records | Owner only |
| `productPrices/{id}` | Product pricing config | Authenticated read; Function write |
| `reportTemplates/{id}` | Looker Studio template configs | Authenticated read; Admin SDK write |
| `systemConfig/{id}` | Global system settings | Authenticated read; Admin SDK write |
| `activityLogs/{id}` | Immutable audit trail | Owner read; Owner create only |
| `rateLimits/{userId}` | Rate-limit counters | Owner read; Admin SDK write only |
| `securityLogs/{id}` | Security events | Admin SDK only |
| `backupMetadata/{id}` | Backup job records | Admin SDK only |
| `oauth_states/{stateId}` | CSRF state tokens (ephemeral) | Admin SDK only |
| `temporary_oauth_tokens/{id}` | Tokens pending account selection (30-min TTL) | Admin SDK only |
| `adminActivity/{email_date}` | Daily admin action tracking | Admin SDK only |
| `webhook_logs/{id}` | SuitPay webhook payloads (deprecated) | Admin SDK only |
| `pendingPayments/{id}` | PIX payments awaiting confirmation (deprecated) | Admin SDK only |
| `payments/{id}` | Confirmed payments (deprecated) | Admin SDK only |
| `orphan_payments/{id}` | Payments without matching user (deprecated) | Admin SDK only |

Collections marked **(deprecated)** belong to the SuitPay integration being replaced by Asaas.

---

## users/{uid}

Profile document created on first sign-in.

```
{
  email: string,         // immutable after creation
  createdAt: Timestamp,  // immutable after creation
  displayName?: string,
  photoURL?: string
}
```

Rules: owner read/create/update. `email` and `createdAt` cannot be changed after creation. Delete blocked (only Cloud Function can delete via Admin SDK).

---

## users/{uid}/wallet/current

Single document per user. Written only by `adminWalletManager.addUserCredits` and report-generation functions via Admin SDK.

```
{
  balance: number,       // BRL centavos, >= 0
  currency: "BRL",
  updatedAt: Timestamp
}
```

Client rule: `allow write: if false` (enforced by subcollection rule for `wallet`).

---

## users/{uid}/transactions/{txId}

Append-only ledger. Written only by Cloud Functions.

```
{
  type: "credit" | "debit",
  amount: number,           // BRL centavos, positive
  description: string,
  status: "pending" | "completed" | "failed",
  createdAt: Timestamp,
  adminAction?: boolean,
  adminEmail?: string,
  adminReason?: string,
  adminIP?: string
}
```

---

## users/{uid}/oauth_tokens/google_ads

Stores base64-encoded (not truly encrypted — see TODO in `googleAdsOAuthV2.ts`) OAuth tokens.

```
{
  accessToken: string,   // base64 encoded
  refreshToken: string,  // base64 encoded
  expiresAt: number,     // Unix ms
  scope: string,
  updatedAt: Timestamp
}
```

---

## users/{uid}/adAccounts/{platform_accountId}

One document per connected ad account. Platform prefix in document ID (e.g., `google_ads_1234567890`).

```
{
  platform: "google_ads" | "meta_ads",
  accountId: string,
  accountName: string,
  email: string,
  currency: string,
  timezone?: string,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastSyncAt: Timestamp
}
```

---

## campaigns/{campaignId}

```
{
  userId: string,
  name: string,
  budget: number,        // BRL centavos, >= 0
  status: "draft" | "active" | "paused" | "ended",
  createdAt: Timestamp   // immutable
}
```

Rule: owner only. Created with `status: "draft"`. Only owner can delete when `status === "draft"`. `userId` and `createdAt` are immutable.

---

## reports/{reportId}

```
{
  userId: string,
  type: string,
  createdAt: Timestamp,
  // additional report-specific fields
}
```

Rule: owner only. Delete blocked.

---

## productPrices/{priceId}

Managed by `priceManager` functions. Document ID matches product type.

```
{
  id: string,
  name: string,
  description: string,
  price: number,            // BRL (float, display only — billing uses centavos)
  category: "google" | "meta",
  type: "lancamento" | "negocio_local",
  isActive: boolean,
  updatedAt: Timestamp,
  updatedBy: string
}
```

Known IDs: `google_lancamento`, `google_negocio_local`, `meta_lancamento`, `meta_negocio_local`.

---

## rateLimits/{userId}

Document ID format: `{userId}_{actionName}` (e.g., `abc123_recaptcha_verify`).

```
{
  attempts: number,
  firstAttempt: Timestamp,
  lastAttempt: Timestamp,
  blocked: boolean
}
```

Written only by `checkRateLimit()` via Admin SDK. Client `allow write: if false`.

---

## oauth_states/{stateId}

CSRF protection for OAuth flows. Created by auth-URL-generation functions; deleted after callback validation.

```
{
  userId: string,
  expiresAt: Timestamp,
  isLocalEnv: boolean,
  createdAt: Timestamp
}
```

Expiry: 10 minutes. Checked and deleted in `handleGoogleAdsCallbackWithSelection` / `handleMetaAdsCallbackWithSelection`.

---

## temporary_oauth_tokens/{tokenId}

Holds OAuth credentials while the user selects which ad accounts to connect. TTL: 30 minutes.

```
{
  userId: string,
  accessToken: string,
  refreshToken?: string,  // Google only
  expiresAt: Timestamp,   // 30 min from creation
  scope: string,
  tokenType?: string,     // Meta only
  createdAt: Timestamp
}
```

Deleted by `confirmGoogleAdsAccountSelection` / `confirmMetaAdsAccountSelection` after successful account save.

---

## adminActivity/{adminEmail_date}

Daily admin action log. Document ID: `{adminEmail}_{YYYY-MM-DD}`.

```
{
  date: string,          // "YYYY-MM-DD"
  adminEmail: string,
  totalAmount: number,   // BRL centavos sum for the day
  transactionCount: number,
  transactions: Array<{
    targetEmail: string,
    amount: number,
    timestamp: Timestamp
  }>
}
```

Limits enforced: max R$ 5.000 / day, max 50 transactions / day per admin.
```

- [ ] **Step 2: Commit**

```bash
git add docs/DATA-MODEL.md
git commit -m "docs: add DATA-MODEL.md with all Firestore collections and schema"
```

---

## Task 5: docs/DOMAIN.md

**Files:**
- Create: `docs/DOMAIN.md`

- [ ] **Step 1: Write docs/DOMAIN.md**

```markdown
# Domain Rules

Business logic that is not obvious from reading the code. Read before modifying wallet, billing, campaigns, or OAuth flows.

## Currency

**All monetary values stored in BRL centavos (integer).** Never store floats for money.

- `balance: 1000` = R$ 10,00
- `amount: 500` = R$ 5,00
- Convert for display: `(amount / 100).toFixed(2)`

`productPrices` documents have a `price: number` (float) field used for display only — do not use it for arithmetic. The actual debit amount in transactions is always in centavos.

## Wallet

A user's wallet lives at `users/{uid}/wallet/current`. It is a single document with a `balance` field.

- Balance can reach zero but never go negative.
- All balance mutations happen inside Firestore transactions to prevent race conditions.
- Only Cloud Functions (Admin SDK) write to wallet — clients cannot.
- Adding credits: `adminWalletManager.addUserCredits` (admin only).
- Deducting credits: report-generation functions (not yet implemented as of Phase 3).

## Reports

Reports are generated via Looker Studio template links stored in `reportTemplates`. Generating a report:

1. User selects a template and an ad account.
2. The report function deducts the price (centavos) from `users/{uid}/wallet/current`.
3. A `reports/{id}` document is created with the Looker Studio URL.
4. The transaction is logged in `users/{uid}/transactions/{id}`.

Reports cannot be deleted (immutable after creation).

## Campaigns

- Campaigns start with `status: "draft"`.
- Only `draft` campaigns can be deleted.
- `userId` and `createdAt` are immutable — they cannot be changed after creation.
- `budget` is in BRL centavos.

## Admin access

Two-path check (OR logic):

1. Firebase custom claim: `token.admin === true` — authoritative path for new admins.
2. Email allowlist: `ADMIN_EMAILS` in `AuthContext.tsx` — legacy fallback for two existing admins.

To grant admin to a new user: `admin.auth().setCustomUserClaims(uid, { admin: true })`. User must re-login for claim to propagate to the token. See `docs/SECURITY.md`.

Admin limits in `adminWalletManager.ts`:
- Max R$ 1.000 per single transaction
- Max R$ 5.000 per admin per day
- Max 50 transactions per admin per day
- Reason field mandatory (min 10 characters)

## Rate limiting

`checkRateLimit(userId, actionName, maxAttempts?, windowMinutes?)` defaults to 5 attempts per 15 minutes.

When the limit is exceeded:
- `rateLimits/{userId_actionName}.blocked` is set to `true`.
- A `SecurityEventType.RATE_LIMIT_EXCEEDED` event is logged to `securityLogs`.
- The function throws `HttpsError('resource-exhausted', ...)`.
- The block lasts until the window expires (resets automatically on next call after window).

## OAuth flow (high-level)

See `docs/OAUTH.md` for the full flow.

Both Google Ads V2 and Meta Ads V2 use a two-step flow:

1. **Step 1** (`handleXxxCallbackWithSelection`): Exchange auth code → fetch accessible accounts → store tokens temporarily → return account list to client.
2. **Step 2** (`confirmXxxAccountSelection`): Client selects accounts → function saves encrypted tokens + account documents → deletes temporary token.

OAuth V1 (`googleAdsOAuth.ts`, `metaAdsOAuth.ts`) is deprecated but kept functional. Do not route new work through V1.

## i18n

Three languages: `pt` (default, pt-BR), `en`, `es`.

`t(key)` resolves dot-notation keys against the active locale JSON. If a key is missing in the active locale, it falls through to `pt` then to the raw key string. See `docs/I18N.md`.

## Product categories

| category | type | Description |
|---|---|---|
| google | lancamento | Google Ads - Launch campaign dashboard |
| google | negocio_local | Google Ads - Local business dashboard |
| meta | lancamento | Meta Ads - Launch campaign dashboard |
| meta | negocio_local | Meta Ads - Local business dashboard |

## SuitPay (deprecated)

SuitPay is being replaced by Asaas. Do not add new features or harden SuitPay. The `suitpayPayment.ts` and `suitpayWebhook.ts` functions are kept alive only to avoid breaking existing flows until the Asaas migration ships. See `docs/PAYMENTS.md`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/DOMAIN.md
git commit -m "docs: add DOMAIN.md with currency, wallet, admin, and rate-limit rules"
```

---

## Task 6: docs/API-CONTRACTS.md

**Files:**
- Create: `docs/API-CONTRACTS.md`

- [ ] **Step 1: Write docs/API-CONTRACTS.md**

```markdown
# API Contracts

All Cloud Functions exported from `functions/src/index.ts`. Region: `us-central1`.

Callable functions use Firebase `httpsCallable` on the client. The framework wraps the call in `{ data: <input> }` and returns `{ data: <output> }`.

---

## verifyRecaptcha

**File:** `functions/src/recaptcha.ts`  
**Trigger:** `onCall`  
**Auth required:** No (anonymous allowed)  
**Secrets:** `recaptchaSecretKey`  
**Rate limit:** 10 attempts / 5 minutes per userId (or `"anonymous"` if unauthenticated)

**Input:**
```typescript
{ token: string }
```

**Output (success):**
```typescript
{
  success: true,
  score: number,    // 0.0 – 1.0
  action: string
}
```

**Errors:**
- `invalid-argument` — token missing
- `internal` — reCAPTCHA API call failed
- `resource-exhausted` — rate limit exceeded

---

## checkRateLimit

**File:** `functions/src/rateLimiter.ts`  
**Trigger:** Utility (not directly exported as HTTP callable)  
**Called by:** Other functions internally

**Signature:**
```typescript
checkRateLimit(
  userId: string,
  action: string,
  maxAttempts?: number,  // default 5
  windowMinutes?: number // default 15
): Promise<boolean>
```

Throws `resource-exhausted` if blocked. Returns `true` if allowed.

---

## getProductPrices

**File:** `functions/src/priceManager.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** Yes

**Input:** `{}` (none)

**Output:**
```typescript
{
  success: true,
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,      // BRL float (display only)
    category: "google" | "meta",
    type: "lancamento" | "negocio_local",
    isActive: boolean,
    updatedAt: string,  // ISO date string
    updatedBy: string
  }>
}
```

---

## updateProductPrices

**File:** `functions/src/priceManager.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** Yes + admin check

**Input:**
```typescript
{
  prices: Array<{
    id: string,
    price: number,
    isActive?: boolean
  }>
}
```

**Output:**
```typescript
{ success: true, updatedCount: number }
```

---

## initializeDefaultPrices

**File:** `functions/src/priceManager.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Idempotent. Seeds the four default product price documents if they don't exist.

**Output:** `{ success: true, message: string }`

---

## getPublicProductPrices

**File:** `functions/src/getPublicProductPrices.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** No

Returns only `isActive: true` prices.

**Output:**
```typescript
{
  success: true,
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,
    category: string,
    type: string
  }>
}
```

---

## handleGoogleAdsCallbackWithSelection

**File:** `functions/src/googleAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `googleAdsClientSecret`

Step 1 of Google Ads OAuth V2. Validates state token (CSRF), exchanges auth code for tokens, lists accessible ad accounts, stores temporary token.

**Input:**
```typescript
{ code: string, state: string }
```

**Output (success):**
```typescript
{
  success: true,
  accountsAvailable: Array<{
    id: string,
    name: string,
    currency: string,
    type: string,
    email: string
  }>,
  mainAccount: { name: string, email: string },
  temporaryToken: string   // use in confirmGoogleAdsAccountSelection
}
```

**Errors:**
- `unauthenticated` — not signed in
- `invalid-argument` — code/state missing or state not found in Firestore
- `permission-denied` — state belongs to different user
- `deadline-exceeded` — state expired (> 10 min)
- `internal` — token exchange or API failure

---

## confirmGoogleAdsAccountSelection

**File:** `functions/src/googleAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `googleAdsClientSecret`

Step 2 of Google Ads OAuth V2. Saves selected accounts + encrypted tokens, deletes temporary token.

**Input:**
```typescript
{
  temporaryToken: string,
  selectedAccountIds: string[]
}
```

**Output:**
```typescript
{ success: true, accountsConnected: number }
```

**Errors:**
- `unauthenticated`, `invalid-argument` — same guards as step 1
- `not-found` — temporary token expired or not found
- `permission-denied` — token belongs to different user
- `deadline-exceeded` — 30-minute temporary token expired

---

## handleMetaAdsCallbackWithSelection

**File:** `functions/src/metaAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `metaAdsAppSecret`

Same two-step pattern as Google Ads. Step 1. Exchanges code for Meta long-lived token, lists Business ad accounts.

**Input:** `{ code: string, state: string }`

**Output:**
```typescript
{
  success: true,
  accountsAvailable: Array<{
    id: string,
    name: string,
    currency: string,
    accountStatus: number,
    businessName?: string
  }>,
  mainAccount: { name: string, email: string },
  temporaryToken: string
}
```

---

## confirmMetaAdsAccountSelection

**File:** `functions/src/metaAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `metaAdsAppSecret`

Step 2 of Meta Ads OAuth V2.

**Input:** `{ temporaryToken: string, selectedAccountIds: string[] }`

**Output:** `{ success: true, accountsConnected: number }`

---

## addUserCredits

**File:** `functions/src/adminWalletManager.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Adds BRL centavos credits to any user's wallet. Admin-only.

**Input:**
```typescript
{
  targetEmail: string,
  amount: number,    // BRL centavos, positive integer, max 100000 (R$1000)
  reason: string     // min 10 chars
}
```

**Output:**
```typescript
{
  success: true,
  message: string,
  amountAdded: number,
  targetUserId: string,
  timestamp: string,
  adminLimits: {
    dailyTotalAfter: number,  // BRL float
    dailyCountAfter: number,
    maxDailyAmount: number,   // 5000 (R$5000)
    maxDailyTransactions: number  // 50
  }
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — bad email, non-positive amount, amount > 100000, reason < 10 chars
- `resource-exhausted` — daily limits exceeded
- `not-found` — target email not in Firebase Auth

---

## deleteUserData

**File:** `functions/src/deleteUserData.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes

**Status:** Placeholder implementation. Logs deletion intent but does not yet delete all subcollections. Full implementation deferred.

**Input:** `{}` (none — deletes data for the calling user)

---

## getSecurityStats

**File:** `functions/src/securityStats.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Returns aggregated security event counts from `securityLogs`.

---

## suitpayWebhook (deprecated)

**File:** `functions/src/suitpayWebhook.ts`  
**Trigger:** `onRequest` (HTTP POST)  
**Path:** `/suitpayWebhook`  

**⚠ Deprecated.** Will be removed with Asaas migration. Do not modify except for minimum maintenance.

Receives SuitPay payment status webhooks. Validates request, updates payment status in Firestore, credits wallet on confirmed payment.

---

## createPixPayment (deprecated)

**File:** `functions/src/suitpayPayment.ts`  
**Trigger:** `onCall`  

**⚠ Deprecated.** Creates a PIX payment request via SuitPay API.

---

## checkPaymentStatus (deprecated)

**File:** `functions/src/suitpayPayment.ts`  
**Trigger:** `onCall`  

**⚠ Deprecated.** Polls SuitPay for payment status by payment ID.

---

## getGoogleAdsAuthUrl (V1 — deprecated)

**File:** `functions/src/googleAdsOAuth.ts`  
**Status:** V1 deprecated. Use V2 flow (`handleGoogleAdsCallbackWithSelection`).

## getGoogleAdsCampaigns (V1 — deprecated)

**File:** `functions/src/googleAdsOAuth.ts`

## getMetaAdsAuthUrl (V1 — deprecated)

**File:** `functions/src/metaAdsOAuth.ts`

## getMetaAdsCampaigns (V1 — deprecated)

**File:** `functions/src/metaAdsOAuth.ts`
```

- [ ] **Step 2: Commit**

```bash
git add docs/API-CONTRACTS.md
git commit -m "docs: add API-CONTRACTS.md with all Cloud Function signatures and error codes"
```

---

## Task 7: docs/OAUTH.md

**Files:**
- Create: `docs/OAUTH.md`

- [ ] **Step 1: Write docs/OAUTH.md**

```markdown
# OAuth Integration

Google Ads V2 and Meta Ads V2 use a two-step account-selection flow. V1 functions are deprecated.

## Google Ads V2 flow

### Prerequisites

- `GOOGLE_ADS_CLIENT_ID` (env var in `.env` and as `process.env` in functions)
- `googleAdsClientSecret` (Secret Manager via `defineSecret`)
- `GOOGLE_ADS_DEVELOPER_TOKEN` (env var in functions)
- OAuth redirect URIs registered in Google Cloud Console:
  - Production: `https://adsmart.app/auth/google-ads/callback`
  - Development: `http://localhost:5173/auth/google-ads/callback`

### Step-by-step

1. **Client** calls `getGoogleAdsAuthUrl` (V1 — still used for URL generation) or builds the auth URL manually with scopes:
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/adwords`

2. **Function** (`getGoogleAdsAuthUrl`) generates a `state` UUID, stores it in `oauth_states/{state}` with a 10-minute expiry and `isLocalEnv` flag, returns the Google OAuth URL to the client.

3. **User** approves on Google's consent screen. Google redirects to `/auth/google-ads/callback?code=...&state=...`.

4. **Client** (`OAuthCallbackPage`) reads the code and state from the URL, calls `handleGoogleAdsCallbackWithSelection({ code, state })`.

5. **Function** (`handleGoogleAdsCallbackWithSelection`):
   - Validates state exists in `oauth_states` and belongs to the calling user (CSRF check).
   - Validates state has not expired.
   - Deletes the used state document.
   - Determines redirect URI from `stateData.isLocalEnv` (not from the runtime environment, to match what was registered during URL generation).
   - POSTs to `https://oauth2.googleapis.com/token` to exchange code for tokens.
   - GETs `https://www.googleapis.com/oauth2/v2/userinfo` for display info.
   - Calls Google Ads API v17 `customers:listAccessibleCustomers` → filters out test and manager accounts.
   - Stores access + refresh tokens in `temporary_oauth_tokens/{id}` (30-min TTL).
   - Returns account list + `temporaryToken` to client.

6. **Client** shows account selection UI. User selects one or more accounts. Client calls `confirmGoogleAdsAccountSelection({ temporaryToken, selectedAccountIds })`.

7. **Function** (`confirmGoogleAdsAccountSelection`):
   - Validates temporary token belongs to caller and is not expired.
   - Fetches full account details from Google Ads API for each selected account.
   - Base64-encodes tokens (⚠ not real encryption — TODO for a future phase).
   - Batch-writes to Firestore:
     - `users/{uid}/oauth_tokens/google_ads` — encoded tokens
     - `users/{uid}/adAccounts/google_ads_{customerId}` — one doc per account
   - Deletes `temporary_oauth_tokens/{id}`.
   - Returns `{ success: true, accountsConnected: N }`.

### Error handling

`handleGoogleAdsCallbackWithSelection` preserves semantic `HttpsError` codes thrown inside the try block (CSRF check, expiry, etc.) by re-throwing `instanceof HttpsError` before the generic error logger. This ensures the client can distinguish CSRF failures (`invalid-argument`, `permission-denied`, `deadline-exceeded`) from true server errors (`internal`).

### Token storage note

Tokens are stored base64-encoded, not encrypted. A real encryption step using `crypto` is stubbed in `encryptTokens()` in `googleAdsOAuthV2.ts`. This is a known gap to address before Phase 2.

---

## Meta Ads V2 flow

### Prerequisites

- `META_ADS_APP_ID` (env var)
- `metaAdsAppSecret` (Secret Manager via `defineSecret`)
- OAuth redirect URIs in Meta App Dashboard:
  - Production: `https://adsmart.app/auth/meta-ads/callback`
  - Development: `http://localhost:5173/auth/meta-ads/callback`

### Step-by-step

Mirrors the Google Ads V2 flow with these differences:

- Meta uses a short-lived token → long-lived token exchange (no refresh token; Meta tokens last ~60 days).
- Step 5 calls `https://graph.facebook.com/v19.0/oauth/access_token` for token exchange, then `https://graph.facebook.com/v18.0/me/adaccounts` to list Business ad accounts.
- `temporary_oauth_tokens` for Meta stores `tokenType` and no `refreshToken`.
- Step 7 stores `users/{uid}/oauth_tokens/meta_ads` and `users/{uid}/adAccounts/meta_ads_{accountId}`.

### CSRF state

Same pattern as Google: `oauth_states/{stateId}` with `userId`, `expiresAt` (10 min), `isLocalEnv`.

---

## V1 functions (deprecated)

`googleAdsOAuth.ts` and `metaAdsOAuth.ts` export:
- `getGoogleAdsAuthUrl` / `getMetaAdsAuthUrl` — still called by the client to generate the auth URL
- `getGoogleAdsCampaigns` / `getMetaAdsCampaigns` — campaign list helpers
- `handleGoogleAdsCallback_DEPRECATED` / `handleMetaAdsCallback_DEPRECATED` — NOT exported (commented out in `index.ts`)

The V1 callback handlers are intentionally not exported. The auth URL generators are kept because they still perform the `oauth_states` creation step that V2 depends on.

---

## Client-side OAuth service

`src/services/oauthServices.ts` wraps the callable function calls. Use these wrappers rather than calling `httpsCallable` directly in components.
```

- [ ] **Step 2: Commit**

```bash
git add docs/OAUTH.md
git commit -m "docs: add OAUTH.md with Google Ads V2 and Meta Ads V2 complete flow"
```

---

## Task 8: docs/PAYMENTS.md

**Files:**
- Create: `docs/PAYMENTS.md`

- [ ] **Step 1: Write docs/PAYMENTS.md**

```markdown
# Payments

## Current state

The payment system is in transition. SuitPay is being replaced by Asaas. **Do not add features or harden SuitPay.** Only keep it functional.

---

## SuitPay (deprecated)

⚠ **Being replaced by Asaas. No new investment. Keep alive until Asaas ships.**

### PIX payment flow

1. Client calls `createPixPayment({ amount, description })`.
2. Function creates a PIX charge via SuitPay API, stores a `pendingPayments/{id}` doc.
3. Returns QR code data + transaction ID to client.
4. Client shows QR code in `PixPaymentModal`.
5. User pays via PIX in their bank app.
6. SuitPay POSTs to `suitpayWebhook` endpoint.
7. Webhook function updates payment status, credits wallet balance.

### Webhook security (minimal)

The webhook validates a signature header but the validation is not enforced as a hard block (SuitPay is being removed). The payload log is limited to `user-agent`, `x-forwarded-for`, `content-type` headers only (no full request body).

### Firestore collections used

- `pendingPayments/{id}` — payment waiting for confirmation
- `payments/{id}` — confirmed payment records
- `orphan_payments/{id}` — payments that arrived but matched no user
- `webhook_logs/{id}` — incoming webhook audit log (headers subset only)

### Known limitations

- Hash validation is not mandatory (SuitPay is being removed anyway)
- IP allowlist is not enforced
- `deleteUserData` does not clean up payment collections yet

---

## Asaas (future — Phase 5+)

Asaas will replace SuitPay for PIX and potentially Boleto payments. This migration is NOT part of the current modernization plan (Phases 1–4). It is separate work.

When Asaas lands, the SuitPay collections and functions should be deleted:
- `functions/src/suitpayPayment.ts`
- `functions/src/suitpayWebhook.ts`
- Firestore collections: `pendingPayments`, `payments`, `orphan_payments`, `webhook_logs`

---

## Wallet credit paths

Credits can enter the wallet in two ways:

1. **Payment confirmed** — `suitpayWebhook` credits the wallet after a confirmed PIX (will be replaced by Asaas webhook).
2. **Admin grant** — `addUserCredits` (admin only) via `adminWalletManager.ts`. Used for manual adjustments, refunds, onboarding.

Debits happen when a report is generated (deduct report cost from wallet balance).
```

- [ ] **Step 2: Commit**

```bash
git add docs/PAYMENTS.md
git commit -m "docs: add PAYMENTS.md documenting deprecated SuitPay and Asaas migration path"
```

---

## Task 9: docs/ENVIRONMENT.md

**Files:**
- Create: `docs/ENVIRONMENT.md`

- [ ] **Step 1: Write docs/ENVIRONMENT.md**

```markdown
# Environment

## Frontend env vars (VITE_*)

Defined in `.env` (not committed). Template in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain (`projectId.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID (GTM-PDHQTJP8 is the GTM container) |
| `VITE_FIREBASE_FUNCTIONS_URL` | No | Override for functions URL (default: `https://us-central1-{projectId}.cloudfunctions.net`) |
| `VITE_USE_FIREBASE_EMULATOR` | No | Set to `"true"` to connect to local emulators. Only active in `DEV` mode on `localhost`. |
| `VITE_RECAPTCHA_SITE_KEY` | Yes | reCAPTCHA v3 site key (public) |

All values come from Firebase Console → Project settings → Your apps → Web app config.

## Backend env vars (functions runtime)

These are plain environment variables accessible as `process.env.XXX` in functions.

| Variable | Set via | Description |
|---|---|---|
| `GOOGLE_ADS_CLIENT_ID` | `.env` / Firebase Functions config | Google OAuth client ID |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | `.env` / Firebase Functions config | Google Ads API developer token |
| `META_ADS_APP_ID` | `.env` / Firebase Functions config | Meta App ID (public part) |
| `GOOGLE_ADS_TEST_MODE` | Local only | Set to `"true"` to return mock Google Ads accounts |

## Secrets (Secret Manager via defineSecret)

Secrets are managed by Firebase Secret Manager. They are **not** in `.env`.

| Secret name | `defineSecret` handle | Used in |
|---|---|---|
| `googleAdsClientSecret` | `googleAdsClientSecret` | `googleAdsOAuth.ts`, `googleAdsOAuthV2.ts` |
| `metaAdsAppSecret` | `metaAdsAppSecret` | `metaAdsOAuth.ts`, `metaAdsOAuthV2.ts` |
| `recaptchaSecretKey` | `recaptchaSecretKey` | `recaptcha.ts` |

To set/rotate a secret:
```bash
firebase functions:secrets:set googleAdsClientSecret
# prompted for value
```

Functions declare which secrets they use in the `onCall` options:
```typescript
onCall({ secrets: [googleAdsClientSecret] }, async (request) => { ... })
```

The secret value is read at runtime via `.value()`:
```typescript
const secret = googleAdsClientSecret.value()
```

**Never** read secrets via `process.env.XXX_SECRET` in functions.

## Emulators

Run all emulators locally with:
```bash
firebase emulators:start
```

| Emulator | Port |
|---|---|
| Firebase Auth | 9099 |
| Cloud Functions | 5001 |
| Firestore | 8080 |
| Firebase Hosting | 5002 |
| Emulator UI | 4000 |

The frontend auto-connects to emulators when all three conditions are true:
1. `import.meta.env.DEV` is true (Vite dev server)
2. `window.location.hostname === 'localhost'`
3. `VITE_USE_FIREBASE_EMULATOR === 'true'`

Functions tests (`functions/test/`) always connect to the emulators via `@firebase/rules-unit-testing` (Firestore) and direct Admin SDK (Auth). Set the `FIRESTORE_EMULATOR_HOST` env var or use the test helpers in `functions/test/helpers/firestore.ts`.

## Environments

| Name | Firebase project | Frontend URL |
|---|---|---|
| Production | `adsmart-app` | `https://adsmart.app` |
| Development | Local emulators | `http://localhost:5173` |

There is no staging environment currently. All testing is done locally with emulators.

## Deployment prerequisites

Before deploying to production:

1. All secrets set in Secret Manager (see above).
2. `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_ADS_APP_ID` set as Firebase Functions configuration or runtime env.
3. OAuth redirect URIs registered for production domain.
4. reCAPTCHA domain allowlist includes `adsmart.app`.

See `docs/DEPLOYMENT.md` for the full deploy checklist.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ENVIRONMENT.md
git commit -m "docs: add ENVIRONMENT.md with all env vars, secrets, and emulator config"
```

---

## Task 10: docs/TESTING.md

**Files:**
- Create: `docs/TESTING.md`

- [ ] **Step 1: Write docs/TESTING.md**

```markdown
# Testing

## Framework

Vitest 2.x in both the frontend (root) and Cloud Functions (`functions/`).

## Running tests

```bash
# Frontend
npm test                   # run once
npm run test:watch         # watch mode
npm run test:coverage      # coverage report to coverage/

# Functions
cd functions
npm test
npm run test:watch
npm run test:coverage
```

## Test layout

```
src/
  components/
    AdminRoute.test.tsx     # AdminRoute component
    ...
functions/
  test/
    securityLogger.test.ts
    googleAdsOAuthV2.test.ts
    metaAdsOAuthV2.test.ts
    firestore-rules.test.ts
    rateLimiter.test.ts
    adminWalletManager.test.ts
    helpers/
      firestore.ts          # getAdmin(), clearCollection() helpers
```

Frontend tests co-locate with source files (`*.test.tsx` next to `*.tsx`).

Functions tests live in `functions/test/` because they require emulator setup.

## Emulator requirements for functions tests

Functions tests hit real Firebase emulators:
- Firestore emulator must be running on port 8080 (`FIRESTORE_EMULATOR_HOST=localhost:8080`)
- Auth emulator must be running on port 9099 (`FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`)

Start emulators before running functions tests:
```bash
firebase emulators:start --only firestore,auth
```

Or run functions tests via the serve script which starts emulators automatically:
```bash
# From functions/
npm run serve
# In another terminal:
npm test
```

## Test coverage areas and counts (as of Phase 3)

| File | Tests | Coverage area |
|---|---|---|
| `AdminRoute.test.tsx` | 3 | Unauthenticated redirect, non-admin redirect, admin access |
| `securityLogger.test.ts` | 3 | Re-entrancy guard, normal event write, CRITICAL alert write |
| `googleAdsOAuthV2.test.ts` | ~10 | Auth check, CSRF validation, state expiry, semantic error codes |
| `metaAdsOAuthV2.test.ts` | ~10 | Same as Google Ads V2 |
| `firestore-rules.test.ts` | ~15 | All collection rules: owner-only, wallet/transactions blocked, rateLimits blocked |
| `rateLimiter.test.ts` | ~5 | First attempt, window reset, block after max attempts |
| `adminWalletManager.test.ts` | ~5 | Admin check, input validation, wallet mutation |

Total: 44 functions tests, 31 web tests as of Phase 3.

## Mocking approach

### Frontend tests

Use `vi.spyOn` to mock context hooks:

```typescript
import * as AuthContextModule from '@/contexts/AuthContext'

vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
  user: { uid: 'test-user' } as User,
  isAdmin: true,
  loading: false,
  // ...other fields
})
```

Do not mock Firebase directly — mock the hooks that consume Firebase.

### Functions tests

Functions tests do NOT mock the database — they hit the Firestore emulator with real reads/writes. This prevents the mocked-tests-pass/prod-fails problem.

`functions/test/helpers/firestore.ts` exports:
- `getAdmin()` — returns initialized `firebase-admin` instance pointed at emulators
- `clearCollection(collectionName)` — deletes all docs in a collection (use in `beforeEach`)

## Firestore rules testing

`firestore-rules.test.ts` uses `@firebase/rules-unit-testing`:

```typescript
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'

const testEnv = await initializeTestEnvironment({
  projectId: 'demo-adsmart',
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: 'localhost',
    port: 8080,
  }
})

// Authenticated context
const userCtx = testEnv.authenticatedContext('user-uid')
const db = userCtx.firestore()

await assertSucceeds(db.doc('users/user-uid').get())
await assertFails(db.doc('users/other-uid').get())
```

Always call `testEnv.cleanup()` in `afterAll`.

## Writing new tests

1. **New Cloud Function** → add test file in `functions/test/`. Cover: auth check, input validation, happy path, error path.
2. **New Firestore rule** → add cases to `firestore-rules.test.ts`. Test both `assertSucceeds` and `assertFails`.
3. **New React component** → add `ComponentName.test.tsx` next to the component. Test: renders correctly, interaction (if any), edge cases.

Coverage target: 80%+ in test-covered areas (not project-wide coverage).

## CI

Tests do not run in CI currently (Phase 1 only set up lint + typecheck + build). Adding tests to CI is part of Phase 2 scope.
```

- [ ] **Step 2: Commit**

```bash
git add docs/TESTING.md
git commit -m "docs: add TESTING.md with Vitest setup, emulator requirements, and test patterns"
```

---

## Task 11: docs/DEPLOYMENT.md

**Files:**
- Create: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Write docs/DEPLOYMENT.md**

```markdown
# Deployment

## Overview

AdSmart deploys to Firebase. There are two deployable targets:
- **Hosting** — the React SPA (`dist/`)
- **Functions** — Cloud Functions (`functions/lib/`)

## Production deploy checklist

Before deploying, verify:

- [ ] `npm run build` succeeds (TypeScript + Vite)
- [ ] `cd functions && npm run build` succeeds
- [ ] All secrets set in Secret Manager (`googleAdsClientSecret`, `metaAdsAppSecret`, `recaptchaSecretKey`)
- [ ] `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_ADS_APP_ID` configured in functions environment
- [ ] OAuth redirect URIs updated in Google Cloud Console and Meta App Dashboard if domain changed
- [ ] reCAPTCHA domain allowlist includes `adsmart.app`
- [ ] `npm test` passes (web)
- [ ] `cd functions && npm test` passes

## Deploy commands

```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# Deploy Firestore rules only
firebase deploy --only firestore:rules
```

## Firebase Hosting

Configuration in `firebase.json`:
- Public dir: `dist/`
- SPA rewrite: all routes → `/index.html`
- Security headers on all files: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS`, `COOP`, `CORP`, `CSP`
- Cache-Control: `public, max-age=31536000, immutable` for all static assets (`*.js`, `*.css`, `*.json`)

After `vite build`, deploy with:
```bash
firebase deploy --only hosting
```

## Cloud Functions

Region: `us-central1`. All functions use Firebase Functions v2 (`firebase-functions/v2/https`).

Build before deploy:
```bash
cd functions
npm run build  # outputs to functions/lib/
```

Deploy:
```bash
firebase deploy --only functions
# or from functions/ directory:
npm run deploy
```

### Adding a new function

1. Create `functions/src/myFunction.ts`.
2. Export the function from `functions/src/index.ts`.
3. If the function uses secrets, declare them: `onCall({ secrets: [mySecret] }, ...)`.
4. If the secret is new, create it: `firebase functions:secrets:set mySecret`.
5. Add the secret handle to `functions/src/config/index.ts`.

## Firestore rules

Rules file: `firestore.rules`. Indexes: `firestore.indexes.json`.

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

Test rules locally before deploying — see `docs/TESTING.md`.

## GitHub Actions CI

File: `.github/workflows/ci.yml`

Triggers: push or PR to `main` or `migrate`.

Jobs:
- **Frontend**: `npm ci` → Biome lint → `tsc --noEmit` → `vite build`
- **Functions**: `npm ci` → ESLint (non-blocking, `continue-on-error: true`) → `tsc`

Tests are not in CI yet (to be added in Phase 2).

The functions lint step is non-blocking because ESLint 8 with the legacy `eslint-config-google` generates thousands of pre-existing style violations. Phase 2 will migrate to ESLint 9 flat config and enforce lint in CI.

## Environment secrets in CI

GitHub Actions does not need production secrets to run (lint + typecheck + build only). If tests are added to CI, Firebase emulator setup will be required (see `docs/TESTING.md`).

## Rollback

Firebase Hosting supports instant rollback to a previous release:
```bash
firebase hosting:releases:list
firebase hosting:rollback
```

For function rollbacks, redeploy the previous git tag:
```bash
git checkout <previous-tag>
cd functions && npm run build
firebase deploy --only functions
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add DEPLOYMENT.md with hosting, functions, CI, and rollback procedures"
```

---

## Task 12: docs/I18N.md

**Files:**
- Create: `docs/I18N.md`

- [ ] **Step 1: Write docs/I18N.md**

```markdown
# Internationalization (i18n)

## Languages

| Code | Locale | File |
|---|---|---|
| `pt` | Portuguese (Brazilian) — default | `src/locales/pt-BR.json` |
| `en` | English | `src/locales/en.json` |
| `es` | Spanish | `src/locales/es.json` |

## Architecture

Translations live in JSON files under `src/locales/`. The `LanguageContext` loads them at module import time (not lazy). The context exports a `t(key, params?)` function that resolves dot-notation keys.

Key files:
- `src/locales/pt-BR.json` — authoritative (Portuguese is the source language)
- `src/locales/en.json`
- `src/locales/es.json`
- `src/locales/types.ts` — `Language` type (`"pt" | "en" | "es"`) and `Translations` interface

## Context API

```typescript
import { useLanguage } from '@/contexts/LanguageContext'

const { language, setLanguage, t } = useLanguage()

// Basic translation
t('nav.dashboard')  // → "Dashboard" (or locale equivalent)

// With interpolation
t('wallet.balance', { amount: '10,00' })  // → "Saldo: R$ 10,00"
```

## Key resolution

`t(key)` resolves dot-notation keys. If the key is missing in the active locale, it falls through to `pt` then returns the raw key string (never throws).

## Language persistence

User's language preference is saved to `localStorage` under key `"language"`. On first load, language is inferred from `navigator.language.split('-')[0]` (pt → `pt`, es → `es`, else → `en`).

## Adding a translation key

1. Add the key to `src/locales/pt-BR.json` first (source of truth).
2. Add the equivalent to `src/locales/en.json`.
3. Add the equivalent to `src/locales/es.json`.
4. Update `src/locales/types.ts` if the new key adds a new top-level namespace.

Do not add keys to en.json or es.json without adding them to pt-BR.json first.

## Adding a new language

1. Create `src/locales/{code}.json` as a copy of `pt-BR.json`, translate all values.
2. Add `{code}` to the `Language` type in `src/locales/types.ts`.
3. Import the new JSON in `src/contexts/LanguageContext.tsx` and add it to the `translations` map.
4. Add a language option to `src/components/common/LanguageSelector.tsx`.

## Parameterized strings

Parameters use `{{paramName}}` syntax in JSON values:

```json
{
  "wallet": {
    "creditsAdded": "{{amount}} créditos adicionados com sucesso"
  }
}
```

```typescript
t('wallet.creditsAdded', { amount: '50' })
// → "50 créditos adicionados com sucesso"
```

## What is NOT translated

- Error messages from Cloud Functions (`HttpsError.message`) — these are developer-facing strings in pt-BR
- Console logs
- Firestore field values
- Date formatting uses `Intl.DateTimeFormat` with the current locale — no translation keys needed for dates
```

- [ ] **Step 2: Commit**

```bash
git add docs/I18N.md
git commit -m "docs: add I18N.md with locale structure, Context API, and key conventions"
```

---

## Task 13: docs/Decisions.md

**Files:**
- Create: `docs/Decisions.md`

- [ ] **Step 1: Write docs/Decisions.md**

```markdown
# Architecture Decision Records

Retroactive ADRs documenting key decisions made during the AdSmart modernization project.

---

## ADR-001: Keep Firebase, no migration to Next.js/Prisma

**Date:** 2026-04-24  
**Status:** Accepted

**Decision:** Maintain the current Firebase stack (Firestore + Cloud Functions + Hosting) rather than migrating to a Next.js + Prisma + PostgreSQL stack.

**Rationale:**
- The project is 80% complete with Firebase. A full migration would reset progress.
- Firebase Auth + Firestore rules provide a coherent security model for the existing use cases.
- Cloud Functions v2 covers all backend needs (OAuth, rate limiting, billing).
- The team (solo developer) would spend more time on migration than on features.

**Trade-offs:**
- Firestore's document model is less flexible than SQL for reporting queries.
- No type-safe ORM (Prisma) — Firestore queries are stringly typed.
- Vendor lock-in to Google/Firebase.

---

## ADR-002: Upgrade all dependencies at once (Big Bang)

**Date:** 2026-04-24  
**Status:** Planned (Phase 2)

**Decision:** Bump all major dependencies in a single coordinated effort (React 19, Tailwind 4, Router 7, firebase 11, firebase-admin 13, TS 5.9, motion, zod 4, ESLint 9) rather than incremental individual upgrades.

**Rationale:**
- Incremental upgrades create temporary peer-dependency conflicts (e.g., React 18 + React Router 7).
- One large PR is easier to QA than 7 separate PRs with interdependencies.
- Security baseline (Phase 3) and documentation (Phase 4) are done first, so the upgrade has a safety net.

**Trade-offs:**
- Larger blast radius if something breaks.
- Must do thorough QA after upgrade, especially for Tailwind 4 (visual changes possible).
- Rollback is all-or-nothing rather than per-dependency.

---

## ADR-003: SuitPay → Asaas migration (not in current plan)

**Date:** 2026-04-24  
**Status:** Deferred

**Decision:** Do not invest in hardening the SuitPay integration. Replace it with Asaas in a separate project phase.

**Rationale:**
- SuitPay webhook hash validation is optional by design — mandatory enforcement would require protocol changes.
- IP allowlist enforcement would need SuitPay's IP range (not published).
- Investment in a deprecated integration is waste.
- Asaas offers PIX + Boleto and better developer tooling.

**Scope of SuitPay maintenance:**
- Keep it running (no breaking changes).
- Reduce webhook log payload to non-sensitive headers only (done in Phase 3).
- Add `@deprecated` JSDoc markers (done in Phase 3).

---

## ADR-004: Biome replaces ESLint + Prettier in the frontend

**Date:** 2026-04-24  
**Status:** Accepted

**Decision:** Use Biome as the single formatter + linter for the frontend, replacing ESLint 8 + Prettier. Functions keep ESLint 8 (→ ESLint 9 in Phase 2).

**Rationale:**
- Biome is 50-100x faster than ESLint + Prettier.
- Single tool reduces config complexity.
- Functions use a Node-specific ESLint config with different conventions; mixing them would complicate the Biome config.

**Trade-offs:**
- Biome rule set differs from ESLint/Prettier — some stylistic differences in output.
- Some ESLint plugins have no Biome equivalent yet.
- Functions remain on ESLint until Phase 2 (ESLint 9 flat config migration).

---

## ADR-005: Secrets via defineSecret (Secret Manager)

**Date:** 2026-04-24  
**Status:** Accepted

**Decision:** All Cloud Functions secrets use Firebase Secret Manager via `defineSecret` in `functions/src/config/index.ts`. No `process.env.XXX_SECRET` reads in function code.

**Rationale:**
- Secret Manager integrates with Cloud Functions — secrets are only decrypted for functions that declare them.
- Reduces blast radius: a compromised function can only access its declared secrets.
- Avoids accidentally logging secrets via `process.env` access.

**Migration:** Completed in Phase 3. All OAuth secrets and reCAPTCHA secret moved from `process.env` to `defineSecret`.

---

## ADR-006: Admin access via custom claims + email allowlist fallback

**Date:** 2026-04-24  
**Status:** Accepted (transitional)

**Decision:** Check `token.admin === true || ADMIN_EMAILS.includes(email)` for admin access, rather than pure claims or pure allowlist.

**Rationale:**
- Pure claims would lock out the two existing admins until their claims are set in production.
- The allowlist in `AuthContext.tsx` is a transitional safety net.
- New admins should be granted via `admin.auth().setCustomUserClaims(uid, { admin: true })`.

**Exit condition:** Remove `ADMIN_EMAILS` allowlist once all current admins have custom claims set. See `docs/SECURITY.md`.

---

## ADR-007: Documentation before upgrades (Phase ordering)

**Date:** 2026-04-24  
**Status:** Accepted

**Decision:** Execute phases in order: Phase 1 (cleanup + tests) → Phase 3 (security) → Phase 4 (docs) → Phase 2 (upgrades).

**Rationale:**
- Security gaps are known — fix them before touching the upgrade blast radius.
- Documentation captures the current behavior contract. After upgrades, docs become the regression oracle.
- The test suite (Phase 1) provides a safety net before both security fixes and upgrades.

---

## ADR-008: i18n via JSON files + custom context

**Date:** (original project decision, pre-modernization)  
**Status:** Accepted

**Decision:** Use custom React context with static JSON imports rather than a library like i18next or react-intl.

**Rationale:**
- Zero external dependency.
- Simple `t(key)` API sufficient for the use case.
- JSON files are easy to update and review.

**Trade-offs:**
- No pluralization rules.
- No date/number formatting built-in (use `Intl` directly).
- No lazy loading (all locales bundled, acceptable for 3 small JSON files).
```

- [ ] **Step 2: Commit**

```bash
git add docs/Decisions.md
git commit -m "docs: add Decisions.md with 8 retroactive ADRs"
```

---

## Task 14: docs/QA-CHECKLIST.md and docs/CHANGES.md

**Files:**
- Create: `docs/QA-CHECKLIST.md`
- Create: `docs/CHANGES.md`

- [ ] **Step 1: Write docs/QA-CHECKLIST.md**

```markdown
# QA Checklist — Pre-production deploy

Run this checklist before every production deploy. Check each item manually unless automated.

## Build and CI

- [ ] `npm run build` exits 0 (TypeScript + Vite)
- [ ] `cd functions && npm run build` exits 0
- [ ] `npm run type-check` exits 0
- [ ] `npm run lint` exits 0 (Biome — no errors, only warnings acceptable)
- [ ] `npm test` — all web tests pass
- [ ] `cd functions && npm test` — all functions tests pass
- [ ] GitHub Actions CI is green on the deploy branch

## Authentication

- [ ] Sign in with Google works
- [ ] Sign in with Facebook works
- [ ] Sign in with email/password works
- [ ] reCAPTCHA challenge appears on email sign-in
- [ ] After sign-out, all protected routes redirect to `/login`
- [ ] Admin user (`agency.elovisiondigital@gmail.com`) sees admin panel at `/admin`
- [ ] Non-admin user is redirected from `/admin` to `/dashboard`

## Dashboard

- [ ] Wallet balance displays correctly (R$ format)
- [ ] Ad accounts list loads (Google Ads and Meta Ads)
- [ ] Empty state shown if no accounts connected

## OAuth connections

- [ ] Google Ads OAuth: "Connect" opens Google consent screen
- [ ] Google Ads OAuth: callback page processes without error
- [ ] Google Ads OAuth: account selection modal appears
- [ ] Google Ads OAuth: selecting and confirming accounts saves them
- [ ] Meta Ads OAuth: same flow as Google Ads
- [ ] OAuth error cases: expired state shows appropriate error message

## Reports

- [ ] Report templates load on `/templates`
- [ ] Generating a report deducts balance
- [ ] Report success page shows Looker Studio link

## Payments (SuitPay — deprecated but must not break)

- [ ] PIX QR code modal opens
- [ ] `checkPaymentStatus` returns without 500 error

## Admin panel

- [ ] Admin user can add credits to a user by email
- [ ] Amount validation: > 0, ≤ R$ 1.000
- [ ] Reason validation: ≥ 10 characters
- [ ] Non-admin cannot access `/admin`

## Settings

- [ ] Language switcher cycles through pt / en / es
- [ ] Theme toggle switches dark/light
- [ ] Account deletion request works (or shows appropriate state)

## Security headers (use browser DevTools → Network → response headers)

- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `Content-Security-Policy` header present and contains `default-src 'self'`
- [ ] `Cross-Origin-Opener-Policy: same-origin`
- [ ] `Cross-Origin-Resource-Policy: same-origin`
- [ ] No `X-XSS-Protection` header

## Performance (optional but recommended)

- [ ] Lighthouse performance score ≥ 80 on `/` (cold load)
- [ ] No 404s for static assets in Network tab
- [ ] No console errors on any authenticated page

## i18n

- [ ] All visible UI text appears in Portuguese when language = `pt`
- [ ] Switching to English changes visible text
- [ ] No raw translation keys (e.g., `nav.dashboard`) appear in the UI
```

- [ ] **Step 2: Write docs/CHANGES.md**

```markdown
# Changes

Log of significant changes by date. Most recent first.

---

## 2026-04-24 — Phase 3: Security hardening

- **Firestore rules:** Blocked client writes to `users/.../wallet`, `users/.../transactions`, and `rateLimits`. Wildcard subcollection rule tightened to require named `{subcollection}` segment.
- **Security headers:** Added `Strict-Transport-Security` (HSTS), `Content-Security-Policy` (CSP), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. Removed `X-XSS-Protection`.
- **CSP:** GTM boot script moved from `index.html` inline to `src/lib/gtm.ts` module; GTM/GA domains added to `script-src` and `connect-src`.
- **Secrets:** Migrated `recaptcha.ts`, `googleAdsOAuth*.ts`, `metaAdsOAuth*.ts` from `process.env` to `defineSecret` / Secret Manager.
- **Admin guard:** Added `AdminRoute` component; `/admin` route now requires `token.admin === true || ADMIN_EMAILS.includes(email)`.
- **Auth claims:** `AuthContext.isAdmin` now checks Firebase custom claim `token.admin` via `getIdTokenResult()`, with email allowlist as fallback.
- **securityLogger:** Added re-entrancy guard; `logEvent` no longer calls `checkSuspiciousPatterns` for `SUSPICIOUS_ACTIVITY` events (prevents infinite recursion).
- **OAuth error codes:** `handleGoogleAdsCallbackWithSelection` and `handleMetaAdsCallbackWithSelection` now re-throw `instanceof HttpsError` instead of wrapping them as `internal`.
- **SuitPay:** Marked `@deprecated`, webhook log payload reduced to non-sensitive headers.
- Added `docs/SECURITY.md`.
- Test counts: 44 functions / 31 web (all passing).

---

## 2026-04-24 — Phase 1: Cleanup and foundation

- Removed `.backups/` directory and 8 committed `.env` files.
- Removed `src/pages/_deleted/`, `src/test-translations.ts.bak`.
- Removed `firebase-admin` from root `package.json`.
- Fixed `tsconfig.json`: removed `functions/src/rateLimiter.ts` from frontend include.
- Standardized env var: `VITE_USE_EMULATORS` → `VITE_USE_FIREBASE_EMULATOR`.
- Refactored `LanguageContext.tsx` (1489 lines) into JSON locale files (`src/locales/`).
- Added Biome (frontend lint+format), lefthook (pre-commit + pre-push hooks), GitHub Actions CI.
- Added Vitest with test suites for: Firestore rules, rate limiter, admin wallet manager, Google Ads OAuth V2, Meta Ads OAuth V2, admin guard.
- Initial test count: 28 web / 39+2 skipped functions (skipped tests documented real security bugs, fixed in Phase 3).
```

- [ ] **Step 3: Commit**

```bash
git add docs/QA-CHECKLIST.md docs/CHANGES.md
git commit -m "docs: add QA-CHECKLIST.md and CHANGES.md"
```

---

## Task 15: src/AGENTS.md and functions/AGENTS.md

**Files:**
- Create: `src/AGENTS.md`
- Create: `functions/AGENTS.md`

- [ ] **Step 1: Write src/AGENTS.md**

```markdown
# Frontend — Agent Guide

Read [../AGENTS.md](../AGENTS.md) for the project-wide overview. This file covers frontend-specific conventions.

## Directory structure

```
src/
  components/
    ui/           # shadcn/ui primitives (button, card, dialog, input, …)
    layout/       # Shell components (Header, Sidebar, Footer, MainLayout, …)
    common/       # Shared small components (LanguageSelector, Logo, …)
    templates/    # Report template grid and card
    AdminRoute.tsx
    PrivateRoute.tsx
  contexts/
    AuthContext.tsx      # user, isAdmin, sign-in/out
    LanguageContext.tsx  # language, setLanguage, t()
    ThemeContext.tsx     # theme, toggleTheme
  firebase/
    config.ts           # Firebase app init; emulator connection
  hooks/
    useProductPrices.ts
    useRateLimit.ts
    useWallet.ts
  lib/
    gtm.ts              # GTM boot (initGtm)
    utils.ts            # cn() classname utility
  locales/
    pt-BR.json          # Source language (Portuguese)
    en.json
    es.json
    types.ts            # Language + Translations types
  pages/                # One file per route
  services/
    oauthServices.ts    # httpsCallable wrappers for OAuth functions
    paymentService.ts   # httpsCallable wrappers for payment functions
  config/
    lookerStudioTemplates.ts
  main.tsx              # App entry, initGtm call
  App.tsx               # Router + providers
  index.css             # CSS variables + Tailwind base
```

## Routing conventions

All routes are declared in `src/App.tsx`. Route guards:

- Public route: no wrapper
- Authenticated-only: wrap in `<PrivateRoute>`
- Admin-only: wrap in `<AdminRoute>` (internally also enforces authentication)

```tsx
// Private route
<Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

// Admin route
<Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
```

Do not add authentication logic in page components. Route guards are the single enforcement point.

## Page conventions

Each page in `src/pages/` is a named export:

```tsx
export function MyPage() {
  const { t } = useLanguage()
  return <MainLayout>...</MainLayout>
}
```

Pages use `MainLayout` (desktop sidebar + mobile bottom nav) except for full-screen pages (Login, Landing). No default exports except where required by lazy loading.

## Context consumers

Always consume contexts via their hook:

```tsx
const { user, isAdmin } = useAuth()
const { t, language, setLanguage } = useLanguage()
const { theme, toggleTheme } = useTheme()
```

Never read context directly — always use the hook so the undefined check is centralized.

## Translation keys

Use `t('namespace.key')` pattern. Dot notation for nesting. All keys must exist in `src/locales/pt-BR.json` before using them.

```tsx
<span>{t('wallet.balance')}</span>
```

## Calling Cloud Functions

Use the service layer (`src/services/`) rather than calling `httpsCallable` directly in components. If no wrapper exists, add one.

```tsx
// ✅ Good
import { confirmGoogleAdsSelection } from '@/services/oauthServices'
await confirmGoogleAdsSelection({ temporaryToken, selectedAccountIds })

// ❌ Bad
const fn = httpsCallable(functions, 'confirmGoogleAdsAccountSelection')
await fn({ temporaryToken, selectedAccountIds })
```

## Styling

Use Tailwind utilities. For component variants, use `cva` (class-variance-authority) from `class-variance-authority`. Combine classes with `cn()` from `@/lib/utils`.

Do not write CSS in separate `.css` files (except `src/index.css` for global tokens/reset). Do not use inline `style` objects except for truly dynamic values.

Dark mode: classes under `[data-theme="dark"]` selector via Tailwind config. The `ThemeContext` toggles `data-theme` on `<html>`.
```

- [ ] **Step 2: Write functions/AGENTS.md**

```markdown
# Cloud Functions — Agent Guide

Read [../AGENTS.md](../AGENTS.md) for the project-wide overview. This file covers functions-specific conventions.

## Directory structure

```
functions/
  src/
    config/
      index.ts          # All defineSecret handles (googleAdsClientSecret, metaAdsAppSecret, recaptchaSecretKey)
    index.ts            # Exports all functions; Firebase Admin init
    rateLimiter.ts      # checkRateLimit() utility
    securityLogger.ts   # SecurityLogger class, SecurityEventType, SecuritySeverity enums
    recaptcha.ts        # verifyRecaptcha (onCall)
    adminWalletManager.ts  # addUserCredits (onCall, admin-only)
    googleAdsOAuth.ts   # V1 deprecated: getGoogleAdsAuthUrl, getGoogleAdsCampaigns
    googleAdsOAuthV2.ts # V2: handleGoogleAdsCallbackWithSelection, confirmGoogleAdsAccountSelection
    metaAdsOAuth.ts     # V1 deprecated: getMetaAdsAuthUrl, getMetaAdsCampaigns
    metaAdsOAuthV2.ts   # V2: handleMetaAdsCallbackWithSelection, confirmMetaAdsAccountSelection
    priceManager.ts     # getProductPrices, updateProductPrices, initializeDefaultPrices
    getPublicProductPrices.ts  # getPublicProductPrices (no auth required)
    securityStats.ts    # getSecurityStats (admin-only)
    deleteUserData.ts   # deleteUserData (placeholder)
    suitpayPayment.ts   # @deprecated: createPixPayment, checkPaymentStatus
    suitpayWebhook.ts   # @deprecated: suitpayWebhook (onRequest)
    backupScheduler.ts  # Commented out in index.ts (not deployed)
  test/
    helpers/
      firestore.ts      # getAdmin(), clearCollection()
    *.test.ts           # Test files (all hit emulators, no mocks)
```

## Function triggers

All non-deprecated functions use Firebase Functions v2:

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https'

export const myFunction = onCall({ secrets: [mySecret], region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '...')
  // ...
})
```

Default region is `us-central1`. Do not deploy to other regions without updating the client (`getFunctions(app, 'us-central1')` in `src/firebase/config.ts`).

## Secrets

All secrets are declared in `functions/src/config/index.ts`:

```typescript
import { defineSecret } from 'firebase-functions/params'

export const googleAdsClientSecret = defineSecret('googleAdsClientSecret')
export const metaAdsAppSecret = defineSecret('metaAdsAppSecret')
export const recaptchaSecretKey = defineSecret('recaptchaSecretKey')
```

Every function that uses a secret MUST:

1. Import the handle from `./config`
2. Declare it in the options: `onCall({ secrets: [mySecret] }, ...)`
3. Read the value at runtime: `mySecret.value()`

Never read secrets via `process.env`.

## Authentication pattern

```typescript
if (!request.auth) {
  throw new HttpsError('unauthenticated', 'Usuário não autenticado')
}
const userId = request.auth.uid
const adminEmail = request.auth.token.email || ''
const isAdmin = request.auth.token.admin || ADMIN_EMAILS.includes(adminEmail)
```

## Rate limiting pattern

Call `checkRateLimit` before doing any meaningful work:

```typescript
import { checkRateLimit } from './rateLimiter'

await checkRateLimit(userId, 'my_action_name', 10, 5) // 10 attempts per 5 min
```

The document key in `rateLimits` is `{userId}_{actionName}`.

## Security logging pattern

```typescript
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

await securityLogger.logEvent(
  SecurityEventType.UNAUTHORIZED_ACCESS,
  userId,
  { action: 'my_action', email: adminEmail, ip: request.rawRequest.ip },
  SecuritySeverity.WARNING,
  request.rawRequest  // optional — extracts IP + User-Agent
)
```

**Re-entrancy guard:** `logEvent` does NOT call `checkSuspiciousPatterns` when `eventType === SecurityEventType.SUSPICIOUS_ACTIVITY`. This prevents infinite recursion.

## Error handling pattern

```typescript
try {
  // ... work ...
} catch (error: any) {
  // Re-throw semantic HttpsErrors (CSRF, validation, etc.)
  if (error instanceof HttpsError) {
    throw error
  }
  // Wrap unknown errors as 'internal'
  throw new HttpsError('internal', error.message || 'Erro interno')
}
```

Do not swallow `HttpsError` by wrapping everything in a generic catch. Callers rely on the error code to distinguish CSRF failures from server faults.

## Firebase Admin init pattern

Each file that needs Admin SDK does a lazy init guard:

```typescript
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}
```

This is safe because `index.ts` also calls `admin.initializeApp()` first. The guard prevents double-init in tests where files are imported independently.

## Testing

Tests are in `functions/test/`. They hit real emulators — no mocks. See `docs/TESTING.md`.

To run:
```bash
# Start emulators first
firebase emulators:start --only firestore,auth

# Then in another terminal
npm test
```
```

- [ ] **Step 3: Commit**

```bash
git add src/AGENTS.md functions/AGENTS.md
git commit -m "docs(agents): add src/AGENTS.md and functions/AGENTS.md with sub-agent conventions"
```

---

## Final verification

After all tasks, verify:

- [ ] `ls *.md` shows `README.md`, `AGENTS.md`, `CLAUDE.md`
- [ ] `ls docs/` shows all 13 docs files (including existing `SECURITY.md`)
- [ ] `ls src/AGENTS.md functions/AGENTS.md` — both exist
- [ ] `git log --oneline -20` shows 16 new commits (Tasks 1–15 + plan commit if counted)
- [ ] `npm run build` still passes (no code was changed, just docs added)
- [ ] `cd functions && npm run build` still passes
