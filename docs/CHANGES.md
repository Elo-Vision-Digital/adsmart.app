# Changes

Append-only log of significant changes. Most recent at the top. Each entry uses the parseable header `## [YYYY-MM-DD] — Title` for tooling/lint.

Format conventions:
- One section per logical change set (a phase, a migration, an incident, a major decision).
- Use bullet points for individual changes; group by area when long (Frontend / Functions / Rules / Docs).
- Reference commit SHAs or PR numbers when relevant.
- Do NOT edit past entries. If a past claim is wrong, add a new dated entry that supersedes it (and link back).

---

## [2026-04-26] — Refactor Phase C6.3: Zod schema for `userWallet`

Fourth commit of Phase C6. Migrates the `users/{uid}/wallet/current` single-document subcollection to the Zod-driven `FirestoreDataConverter` foundation.

- **New module:** [src/schemas/userWallet.ts](../src/schemas/userWallet.ts) — `UserWalletSchema` plus `z.infer`-derived `UserWallet` type.
- **Schema vs prior interface — drift corrected:**
  - `userId` **dropped**. The path (`users/{uid}/wallet/current`) already encodes ownership; none of the three writers ([useWallet.ts](../src/hooks/useWallet.ts), [adminWalletManager.ts](../functions/src/adminWalletManager.ts), [suitpayWebhook.ts](../functions/src/suitpayWebhook.ts)) ever set the field. Same drift class as `AdAccount` (C6.1).
  - `balance` **tightened to `z.number().int().nonnegative()`**. DATA-MODEL declares "BRL centavos (integer) ≥ 0", but the prior interface accepted `number` (would silently allow floats and negatives).
  - `currency` **tightened to `z.literal('BRL')`**. All three writers hardcode `'BRL'`; loosen if multi-currency support is ever added.
  - `updatedAt` **migrated to `zTimestamp()`** (was bare `Date`). The three writers use a mix of `new Date()` (client SDK), `admin.firestore.Timestamp.now()`, and `serverTimestamp()` — reads always come back as `Timestamp` and are normalized to `Date` by the converter.
- **`src/types/index.ts`:** the hand-written `UserWallet` interface is gone; the file reexports the schema-derived type.
- **Consumer refactored** to use `.withConverter(zodConverter(UserWalletSchema, 'UserWallet'))`:
  - [src/hooks/useWallet.ts](../src/hooks/useWallet.ts) — local `interface Wallet` (which duplicated `UserWallet` minus `userId`) removed; all three `walletRef` constructions (`onSnapshot` observer at line 44, `addCredits` at 104, `debitAmount` at 140) wrapped with the converter. The bootstrap path now writes `{ id: 'current', ... }` to satisfy the schema id field.
- **Functions:** intentionally untouched. Admin SDK does not use `FirestoreDataConverter`; runtime validation runs only at the client boundary. Functions continue to write directly via Admin SDK.
- **DATA-MODEL.md:** entry rewritten to mark `balance` as `integer`, `currency` as a literal, and reference the schema as source of truth. Explicit note added that ownership lives in the path (no `userId` field on the doc).

Verification: `bun run typecheck` ✓, `bun run build` ✓ (1.19 MB JS / 320 KB gz — no regression vs C6.2).

---

## [2026-04-26] — Refactor Phase C6.2: Zod schema for `campaigns`

Third commit of Phase C6. Migrates the `users/{uid}/campaigns/{id}` subcollection (the only live "Campaign" surface) to the Zod-driven `FirestoreDataConverter` foundation.

- **New module:** [src/schemas/campaign.ts](../src/schemas/campaign.ts) — `CampaignSchema` (reuses `AdPlatformSchema` from `adAccount.ts`) plus `z.infer`-derived `Campaign` type.
- **Schema vs prior interface — drift corrected:**
  - `status` **loosened to `z.string()`**. The prior interface declared `'active' | 'paused' | 'ended'`, but Functions write `campaign.status.toLowerCase()` directly from upstream APIs (Google Ads emits `enabled/paused/removed/...`; Meta emits `active/paused/archived/with_issues/...`). Tightening to a real enum is deferred until a production sync surfaces the full value set — preventing the same class of drift bug that motivated this whole refactor (e.g., `facebook_ads` vs `meta_ads`).
  - `objective` **added** as `z.string().optional()`. [metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts) writes it for Meta campaigns; the prior interface omitted it entirely.
  - `lastSyncAt` **migrated to `zTimestamp()`** (was bare `Date`). Functions write `serverTimestamp()`; reads come back as Firestore `Timestamp` and are normalized to `Date` by the converter.
  - `budget/spend/impressions/clicks` **kept optional** (no `.default(0)`) — distinguishing "field absent" from "synced and zero" matters for any future reporting layer.
- **Two-worlds finding:** A top-level `campaigns/{id}` collection is defined in [firestore.rules:49-65](../firestore.rules) (with required fields `userId, name, budget, status` and status enum `draft|active|paused|ended`), documented in [DATA-MODEL.md](DATA-MODEL.md), and listed in [backupScheduler.ts:28](../functions/src/backupScheduler.ts). **Zero application code reads or writes it** — leftover from an earlier "user-created campaign drafts" design abandoned for the synced-from-platform model. Cleanup (rule + DATA-MODEL + backup config) tracked as a follow-up to Phase D in [REFACTOR-PLAN.md](REFACTOR-PLAN.md), pending production-data verification via `gcloud firestore`.
- **`src/types/index.ts`:** the hand-written `Campaign` interface is gone; the file reexports the schema-derived type.
- **Consumer refactored** to use `.withConverter(zodConverter(CampaignSchema, 'Campaign'))`:
  - [src/pages/GenerateReportPage.tsx:92-99](../src/pages/GenerateReportPage.tsx) — manual `as Campaign` cast removed.
- **`src/utils/mockCampaigns.ts`:** no changes — existing `status` strings (`active|paused|ended`) remain valid under permissive `z.string()`.
- **DATA-MODEL.md:** entry rewritten to document the live subcollection schema; legacy top-level collection moved to a "_dead code — pending removal_" section with explicit reference to the cleanup task.

Verification: `bun run typecheck` ✓, `bun run build` ✓ (1.18 MB JS / 321 KB gz — no regression vs C6.1).

---

## [2026-04-25] — Refactor Phase C6.1: Zod schema for `adAccounts`

Second commit of Phase C6 (one schema per commit). Migrates the `adAccounts` subcollection to the Zod-driven `FirestoreDataConverter` foundation introduced in commit `365c44e`.

- **New module:** [src/schemas/adAccount.ts](../src/schemas/adAccount.ts) — `AdPlatformSchema`, `AdAccountSchema`, plus `z.infer`-derived types.
- **Schema vs prior interface — drift corrected:**
  - `userId` **dropped**. The Firestore path (`users/{uid}/adAccounts/{id}`) already encodes ownership; the redundant field was a fiction added by `as AdAccount` casts at call sites. Functions writes never set it.
  - `currency` **added (required)** — Functions always write it ([metaAdsOAuthV2.ts](../functions/src/metaAdsOAuthV2.ts), [googleAdsOAuthV2.ts](../functions/src/googleAdsOAuthV2.ts)) but the prior interface omitted it.
  - `timezone` **added (optional)** — same reason; written when the platform exposes it.
- **`src/types/index.ts`:** the hand-written `AdAccount` interface is gone; the file reexports the schema-derived type.
- **Consumers refactored** to use `.withConverter(zodConverter(AdAccountSchema, 'AdAccount'))`:
  - [src/pages/AccountsPage.tsx](../src/pages/AccountsPage.tsx)
  - [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)
  - [src/pages/GenerateReportPage.tsx](../src/pages/GenerateReportPage.tsx)
- **`src/utils/mockAccounts.ts`:** seed objects now satisfy the new schema (`currency: 'BRL'` added; redundant `userId` field dropped from inserts).
- **DATA-MODEL.md:** no edits — the doc was already aligned with the new schema (it had `currency` and `timezone` documented; the TS interface was the side that drifted).

Verification: `bun run typecheck` ✓, `bun run build` ✓, `bun run test` ✓ (31/31), Biome ✓ (only pre-existing a11y warnings remain).

---

## [2026-04-25] — Refactor Phase C (pilot): Zod 4 + FirestoreDataConverter for `reports`

First commit of Phase C from [REFACTOR-PLAN.md](REFACTOR-PLAN.md). Establishes the schema-as-code foundation; the `Report` collection is the pilot. Remaining schemas (AdAccount, Campaign, Wallet, Transaction, ReportTemplate) ship in subsequent C6 commits.

- **Dependency:** `bun add zod` → `zod@4.3.6` (web only). Zod 4 confirmed via Context7 as the current stable; ~12 KB gzipped.
- **New module:** [src/schemas/firestore-converter.ts](../src/schemas/firestore-converter.ts).
  - `zTimestamp()` — Zod schema fragment that pre-processes Firestore `Timestamp` to native `Date`.
  - `zodConverter(schema, label)` — generic builder for `FirestoreDataConverter<T>` (validated current API via Context7 against `firebase-js-sdk`). Read path uses `safeParse` + structured `console.error` and best-effort cast on mismatch (REFACTOR-PLAN risk mitigation: graceful first week). Write path uses strict `parse` so the SDK never persists invalid data.
- **New module:** [src/schemas/report.ts](../src/schemas/report.ts) — `ReportTypeSchema`, `ReportStatusSchema`, `DateRangeSchema`, `ReportSchema`, plus `z.infer` derived types.
- **`src/types/index.ts`:** the hand-written `Report` interface was removed; the file now reexports the schema-derived type so existing `import type { Report } from '@/types'` callers continue to work.
- **`src/hooks/useReports.ts`:** the manual `mapReport` (and the pre-Phase-B `normalizeType`) is gone. The `reports` collection is built once with `.withConverter(zodConverter(ReportSchema, 'Report'))`; `snapshot.docs.map((doc) => doc.data())` now returns validated `Report[]`.

Acceptance check: a malformed Firestore doc no longer silently propagates malformed data to the UI — it logs a structured Zod issue array with the offending doc path.

Verification: `bun run typecheck` ✓, `bun run build` ✓ (1.19 MB bundle, +66 KB vs pre-Zod), `bun run test` ✓ (31/31), Biome ✓.

---

## [2026-04-25] — Refactor Phase B: legacy `facebook_ads` removed

Closes Phase B of [REFACTOR-PLAN.md](REFACTOR-PLAN.md). The defensive `normalizeType` helper added when standardizing the `meta_ads` key (commit `32b5f39`) is no longer necessary.

- **Migration script** (committed earlier as `9dc9334`): `scripts/migrations/2026-04-meta-ads-rename.ts` — firebase-admin BulkWriter, idempotent, defaults to dry-run, requires `--write` to apply. Adds `firebase-admin@12.7.0` + `tsx@4.21.0` as root devDependencies (Bun isolated linker prevents resolving from the `functions` workspace for a root-level script).
- **Dry-run results (2026-04-25):**
  - `adsmart-web-dev`: `facebook_ads=0, meta_ads=0` — dev project has no reports yet.
  - `adsmart-web` (prod): `facebook_ads=0, meta_ads=1` — production is already 100% canonical. The `--write` step was therefore a no-op and was not run; the script remains in-tree for repeatability.
- **Code change:** removed `normalizeType` from [src/hooks/useReports.ts](../src/hooks/useReports.ts). `mapReport` now reads `data.type` directly.
- **Doc:** [docs/DATA-MODEL.md](DATA-MODEL.md) `Legacy note` rewritten to record the observed prod state (zero legacy docs) instead of a "pending" caveat.

Acceptance criterion (`grep -rn "facebook_ads" src/ functions/src/` returns zero) verified ✓.

Verification: `bun run typecheck` ✓, `bun run build` ✓, `bun run test` ✓.

---

## [2026-04-25] — Refactor Phase A: schema-cleanup quick wins

Executes Phase A of [REFACTOR-PLAN.md](REFACTOR-PLAN.md) — removes the remaining mock-data leftovers and fixes one race-condition bug surfaced while reading the related code.

- **A1 — `availableTemplates` deduplicated:** [GenerateReportPage.tsx](../src/pages/GenerateReportPage.tsx) no longer carries a hard-coded copy of the templates array. It imports `getTemplateById` from [templateData.ts](../src/components/templates/templateData.ts); template name now resolves via `useProductPrices().getPriceByCategory()` with i18n fallback, mirroring the [TemplateCard](../src/components/templates/TemplateCard.tsx) pattern.
- **A2 — `useProductPrices` degraded mode + race-condition fix:** explicit `console.error('[useProductPrices] preços em modo degradado — usando DEFAULT_PRICES.', err)` in the catch path; `error` propagated and now rendered as an inline warning Card on [GenerateReportPage](../src/pages/GenerateReportPage.tsx) (was previously discarded). `useEffect` now uses the official React 18 `let ignore = false` pattern (validated via Context7 against `reactjs/react.dev` synchronizing-with-effects) to prevent setState on unmounted components and StrictMode double-invocation. Unused `refetch` removed.
- **A3 — `MetaReviewDemo` demo banner:** persistent yellow banner "Demo mode — fictitious data" added at the top of [MetaReviewDemo.tsx](../src/pages/MetaReviewDemo.tsx). Page kept routable (it's needed for Meta App Review) but hard-coded mock values are now visually disclosed.
- **A4 — `mockTemplates.ts` removed:** confirmed orphan via `grep -r mockTemplates src/ functions/src/`; deleted [src/utils/mockTemplates.ts](../src/utils/mockTemplates.ts).
- **Open follow-ups:**
  - shadcn/ui's Radix `toast` was deprecated in Feb/2025 in favour of `sonner` (Context7 confirmation). The current hand-rolled `src/components/ui/toast.tsx` is per-page state, so it can't be triggered from inside hooks. Migration to `sonner` (with global Toaster) recommended as a future task — captured here, not yet in the plan.
  - Phase B (rename migration `facebook_ads → meta_ads` + remove `normalizeType`) still pending.

Verification: `bun run typecheck` ✓, `bun run build` ✓ (1.12 MB bundle, unchanged), `bun run test` ✓ (31/31), Biome ✓ (only pre-existing `<label>` warnings remain).

---

## [2026-04-25] — Phase 5: Bun + Turborepo + multi-environment + auto-deploy

- **Package manager:** npm → Bun 1.3.10. `bunfig.toml` pins `linker = "isolated"` (required for Firebase Functions deploy compat — symlinked deps would break the deploy zip).
- **Workspaces:** Bun-native workspaces, root `@adsmart/web` + `functions/` `@adsmart/functions`.
- **Lockfile:** `package-lock.json` removed (root + functions); `bun.lock` committed.
- **Turborepo 2.x:** added `turbo.json` with `build / lint / typecheck / test / clean / dev` pipeline. CI uses Turbo cache.
- **Two Firebase projects:** `.firebaserc` default flipped to `adsmart-web-dev`; `adsmart-web` is production-only (CI explicit).
- **Auto-deploy:** new `.github/workflows/deploy.yml` — push to `develop` deploys to `adsmart-web-dev`, push to `main` deploys to `adsmart-web`.
- **CI:** rewrote `.github/workflows/ci.yml` for Bun + Turbo + adds `develop` to triggers.
- **Hooks:** `lefthook.yml` migrated `npx → bunx`, `npm run → bun run`.
- **Docs:** updated CLAUDE.md, README.md, docs/ENVIRONMENT.md, docs/DEPLOYMENT.md to reflect Bun.
- **New direct deps required by isolated linker:** `@radix-ui/react-slot` (button.tsx), `@types/node` (vite/vitest config + NodeJS types).
- **Known follow-up (Phase 2 scope):** Functions ESLint 8 still scans `functions/coverage/` artifacts — currently bypassed via `continue-on-error: true`.

---

## [2026-04-24] — Phase 3: Security hardening

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

## [2026-04-24] — Phase 1: Cleanup and foundation

- Removed `.backups/` directory and 8 committed `.env` files.
- Removed `src/pages/_deleted/`, `src/test-translations.ts.bak`.
- Removed `firebase-admin` from root `package.json`.
- Fixed `tsconfig.json`: removed `functions/src/rateLimiter.ts` from frontend include.
- Standardized env var: `VITE_USE_EMULATORS` → `VITE_USE_FIREBASE_EMULATOR`.
- Refactored `LanguageContext.tsx` (1489 lines) into JSON locale files (`src/locales/`).
- Added Biome (frontend lint+format), lefthook (pre-commit + pre-push hooks), GitHub Actions CI.
- Added Vitest with test suites for: Firestore rules, rate limiter, admin wallet manager, Google Ads OAuth V2, Meta Ads OAuth V2, admin guard.
- Initial test count: 28 web / 39+2 skipped functions (skipped tests documented real security bugs, fixed in Phase 3).
