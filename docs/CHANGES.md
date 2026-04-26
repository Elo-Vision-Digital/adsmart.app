# Changes

Append-only log of significant changes. Most recent at the top. Each entry uses the parseable header `## [YYYY-MM-DD] — Title` for tooling/lint.

Format conventions:
- One section per logical change set (a phase, a migration, an incident, a major decision).
- Use bullet points for individual changes; group by area when long (Frontend / Functions / Rules / Docs).
- Reference commit SHAs or PR numbers when relevant.
- Do NOT edit past entries. If a past claim is wrong, add a new dated entry that supersedes it (and link back).

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
