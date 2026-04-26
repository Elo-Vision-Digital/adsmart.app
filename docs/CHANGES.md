# Changes

Append-only log of significant changes. Most recent at the top. Each entry uses the parseable header `## [YYYY-MM-DD] — Title` for tooling/lint.

Format conventions:
- One section per logical change set (a phase, a migration, an incident, a major decision).
- Use bullet points for individual changes; group by area when long (Frontend / Functions / Rules / Docs).
- Reference commit SHAs or PR numbers when relevant.
- Do NOT edit past entries. If a past claim is wrong, add a new dated entry that supersedes it (and link back).

---

## [2026-04-26] — Refactor Phase D6: Turbo task graph for `@adsmart/shared`

Closes Phase D. Wires the Turborepo task graph so cache invalidation propagates correctly across the new shared package.

- **[turbo.json](../turbo.json) updates:**
  - `typecheck` now declares `dependsOn: ['^typecheck']` — shared types are checked before consumers' typecheck.
  - `test` now declares `dependsOn: ['^typecheck']` — runtime tests in web/functions wait for shared types to validate.
  - `build` now also declares `^typecheck` alongside `^build` — keeps build hermetic when a schema change should propagate.
- **No `^build` dependency added for shared.** `@adsmart/shared` has no build step (exports TS source directly via the `exports` field). Adding `^build` would create an empty circular invalidation; the typecheck dependency already covers the cache invalidation case.
- **Verification:** `bunx turbo run typecheck` orchestrates all 3 packages successfully. `bunx turbo run test` runs web (38/38) and shared (40/40) green; functions has the pre-existing emulator-dependent failures and is unrelated to this change.

This closes Phase D entirely. Phase E (tooling — `docs-lint`, ADR, lefthook step) remains.

---

## [2026-04-26] — Refactor Phase D5: Functions validate writes via `@adsmart/shared`

Second slice of Phase D — wires Cloud Functions to the shared schemas and validates write payloads at the Firestore boundary.

- **Dependencies:** [functions/package.json](../functions/package.json) gains `@adsmart/shared: workspace:*` and `zod: ^4.3.6`. The symlink resolved cleanly at `functions/node_modules/@adsmart/shared`.
- **CJS ↔ ESM interop confirmed.** Functions builds with `module: "commonjs"` and `target: "es2017"`; `@adsmart/shared` is `type: "module"` exporting TS source. The CJS `require()` of an ESM workspace package works under the `bun install` resolution path because TS sees the source files directly through the symlink (`module: "esnext"` + `moduleResolution: "node"` resolves the index types). Build + typecheck both green.
- **`Schema.omit(...).parse(...)` pattern adopted** at all server-side write sites where a schema exists. The `omit` is necessary because `admin.firestore.FieldValue.serverTimestamp()` is a sentinel — not a Date or Timestamp — and the schema's `zTimestamp()` would reject it. The pattern: omit the temporal fields from the parse, then spread the validated payload into the final `set()` together with the sentinels.
- **Hardened sites:**
  - [functions/src/adminWalletManager.ts](../functions/src/adminWalletManager.ts) — `TransactionSchema` (admin-credit ledger entry) + `UserWalletSchema` (balance update). Local `interface Transaction` removed (became unused).
  - [functions/src/googleAdsOAuth.ts](../functions/src/googleAdsOAuth.ts) — `CampaignSchema` (Google Ads campaign cache after OAuth fetch).
  - [functions/src/metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts) — `CampaignSchema` (Meta Ads campaign cache, with the optional `objective` field).
  - [functions/src/googleAdsOAuthV2.ts](../functions/src/googleAdsOAuthV2.ts) — `AdAccountSchema` (account selection callback).
  - [functions/src/metaAdsOAuthV2.ts](../functions/src/metaAdsOAuthV2.ts) — `AdAccountSchema` (account selection callback).
- **Reports skipped: no Function-side write exists.** Reports are currently created from the browser via [GenerateReportPage.tsx](../src/pages/GenerateReportPage.tsx); the planned server-side report-generation pipeline isn't built yet. When it lands, the parse pattern slots in directly.
- **SuitPay skipped intentionally.** [memory/suitpay_deprecated.md](../.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/suitpay_deprecated.md) — Asaas migration is on the roadmap; hardening these flows is work that will be discarded. The two SuitPay files ([suitpayWebhook.ts](../functions/src/suitpayWebhook.ts), [suitpayPayment.ts](../functions/src/suitpayPayment.ts)) remain as-is.

Verification: `cd functions && bun run typecheck` ✓, `bun run build` ✓; `bun run test` (web) ✓ (38/38), `cd packages/shared && bun run test` ✓ (40/40). Functions test suite has pre-existing failures unrelated to this change (Firestore emulator not running) — confirmed by stashing this change and re-running: same 22-failed/6-passed/16-skipped baseline as before D5.

D6 (Turbo task graph) remains, then Phase D closes.

---

## [2026-04-26] — Refactor Phase D1–D4: schemas moved to `@adsmart/shared`

First slice of Phase D from [REFACTOR-PLAN.md](REFACTOR-PLAN.md). Establishes the shared workspace package and migrates web consumers; functions integration (D5) and Turbo wiring (D6) ship in subsequent commits.

- **New package** [packages/shared/](../packages/shared/) (`@adsmart/shared`, `workspace:*`):
  - `package.json` exports `./src/index.ts` directly — no build step. Web (Vite) and shared (TS) both resolve TS source; functions will compile via its own tsc (D5).
  - Standalone `tsconfig.json` — no `extends`, because web and functions have incompatible compilation targets (ESNext bundler vs CJS es2017). The shared package targets ES2022 / ESNext (the lowest common denominator that doesn't sacrifice modern features both consumers can handle).
  - Local `vitest.config.ts` with `environment: 'node'` so the schema tests don't pull happy-dom.
- **Workspaces** expanded in [root package.json](../package.json) from `[".", "functions"]` to `[".", "functions", "packages/*"]`. `bun install` resolved the symlink at `node_modules/@adsmart/shared`.
- **`zTimestamp()` made SDK-agnostic.** The previous web-only implementation used `value instanceof Timestamp` (web SDK). Replaced with a structural duck-type check (`'toDate' in value && typeof value.toDate === 'function'`) so it works under both `firebase/firestore` (web) and `firebase-admin/firestore` (Functions) — those ship distinct `Timestamp` classes that would cross-fail an `instanceof` check.
- **`firestore-converter.ts` stays web-only.** It depends on `FirestoreDataConverter`/`QueryDocumentSnapshot` types from the web SDK; functions don't use it (Admin SDK has no equivalent). The file now just re-exports `zTimestamp` from `@adsmart/shared` so existing `import { zTimestamp } from '@/schemas/firestore-converter'` callers keep working.
- **Schemas moved via `git mv`** (preserving history) from `src/schemas/` to `packages/shared/src/schemas/`: `report.ts`, `adAccount.ts`, `campaign.ts`, `userWallet.ts`, `transaction.ts` — and their `*.test.ts` siblings. Each schema's `import { zTimestamp } from './firestore-converter'` rewritten to `from '../firestore'`.
- **Schema tests use a local `fakeTimestamp` helper** in [test-helpers.ts](../packages/shared/src/schemas/test-helpers.ts) (`{ toDate: () => Date }` duck-type) instead of `Timestamp.fromDate()` from `firebase/firestore`, keeping `@adsmart/shared` free of any Firebase dependency.
- **Web imports rewritten** in 6 files (`types/index.ts`, `hooks/useReports.ts`, `hooks/useWallet.ts`, `pages/AccountsPage.tsx`, `pages/Dashboard.tsx`, `pages/GenerateReportPage.tsx`) from `@/schemas/{name}` to `@adsmart/shared`.
- **Test counts after move:**
  - Web: 38 (was 78 before the schemas moved out — the 40 schema tests now run from shared).
  - Shared: 40 — all passing.
  - Total still 78, just split across two packages.

Verification: `bun run typecheck` ✓ (root and `packages/shared`), `bun run build` ✓, `bun run test` ✓ (38/38), `cd packages/shared && bun run test` ✓ (40/40).

D5 (Functions write-side validation) and D6 (Turbo task graph) remain.

---

## [2026-04-26] — Refactor Phase C7: Vitest tests for all Zod schemas

Closes Phase C of [REFACTOR-PLAN.md](REFACTOR-PLAN.md). Six new test files in `src/schemas/` exercise every schema introduced during C2–C6 plus the converter helper.

- **Convention decision:** tests are **co-located** alongside the schema they cover (`src/schemas/report.test.ts`, etc.), matching the existing project convention documented in [docs/TESTING.md](TESTING.md) — *not* in a `src/schemas/__tests__/` subfolder as the original REFACTOR-PLAN draft suggested. The plan was updated to reflect the resolved convention.
- **New files:**
  - [src/schemas/firestore-converter.test.ts](../src/schemas/firestore-converter.test.ts) — `zTimestamp()` (Timestamp/Date round-trip, rejection of arbitrary values), `zodConverter.fromFirestore` (valid parse, structured `console.error` + best-effort cast on mismatch), `zodConverter.toFirestore` (strict `parse`, `id` stripping).
  - [src/schemas/report.test.ts](../src/schemas/report.test.ts) — happy path, defaults for `cost` and `allCampaigns`, missing-field rejection (`userId`), invalid platform literal (`tiktok_ads`), non-integer cost rejection, Timestamp normalization. `ReportTypeSchema` regression test: rejects the legacy `facebook_ads` value (paranoia after the Phase B migration).
  - [src/schemas/adAccount.test.ts](../src/schemas/adAccount.test.ts) — happy path, optional fields (`email/timezone/lastSyncAt`), missing-`currency` regression test (was added in C6.1), invalid platform, Timestamp normalization on multiple date fields.
  - [src/schemas/campaign.test.ts](../src/schemas/campaign.test.ts) — Google + Meta variants (covering the optional `objective` field), permissive status string accepting upstream values (`enabled/paused/removed/archived/with_issues`), all-optional metric fields, negative-metric rejection.
  - [src/schemas/userWallet.test.ts](../src/schemas/userWallet.test.ts) — non-integer / negative-balance rejection, non-`BRL` currency rejection (literal enforcement), Timestamp normalization.
  - [src/schemas/transaction.test.ts](../src/schemas/transaction.test.ts) — minimal valid transaction, admin-credit variant (admin metadata), SuitPay PIX variant (payer metadata + `completedAt`), debit with `reportId`, all required-field and enum validations.
- **Test counts:** 78 total (was 31), all passing. Run with `bun run test`.

Verification: `bun run test` ✓ (78/78), `bun run typecheck` ✓, `bun run build` ✓.

This closes Phase C entirely. Phase D (move schemas to `packages/shared`) and Phase E (tooling — `docs-lint`, ADR, lefthook step) remain.

---

## [2026-04-26] — Refactor Phase C6.5: `ReportTemplate` is dead code

Sixth and final commit of Phase C6. Mapping revealed that the `reportTemplates/{id}` Firestore collection — referenced in [firestore.rules:88-91](../firestore.rules), [DATA-MODEL.md](DATA-MODEL.md), and the `ReportTemplate` interface in [src/types/index.ts](../src/types/index.ts) — has **zero readers and zero writers across the entire codebase**. Templates are served from a hardcoded array (`availableTemplates`) in [src/components/templates/templateData.ts](../src/components/templates/templateData.ts), with a wholly different shape (`TemplateData` — `id, platform, category, type, imageUrl, features`; no `name/description/lookerStudioTemplateId/isActive/createdAt`).

Same dead-code class as the top-level `campaigns/{id}` collection identified in C6.2: a feature planned but never built, with the design pivoting to a hardcoded list. No Zod schema is being created (a schema validates live data; an empty collection with no consumers would rot immediately).

- **[src/types/index.ts](../src/types/index.ts):** the unused `interface ReportTemplate` has been removed entirely (zero consumers). A short comment replaces it pointing to this CHANGES entry and the dead-code note in DATA-MODEL.
- **[docs/DATA-MODEL.md](DATA-MODEL.md):**
  - Collection index entry for `reportTemplates/{id}` retitled to `_Dead code_ — see note below`.
  - Schema section rewritten as a `_(dead code — pending removal)_` block, mirroring the format used for top-level `campaigns/{id}`.
  - In the `reports/{reportId}` section, the FK comment for `templateId` was corrected: it points to the hardcoded `templateData.ts` array, **not** to a Firestore collection.
- **firestore.rules and backupScheduler:** intentionally untouched. Cleanup of all dead-code collections (`campaigns/{id}` from C6.2 + `reportTemplates/{id}` from C6.5) is grouped as a single follow-up task post-Phase D, pending production-data verification via `gcloud firestore`.

Verification: `bun run typecheck` ✓, `bun run build` ✓ (no regression — the removed interface had no consumers).

This closes Phase C6. Phase C7 (Vitest tests for the schemas) and Phase D (move schemas to `packages/shared`) are next.

---

## [2026-04-26] — Refactor Phase C6.4: Zod schema for `transactions`

Fifth commit of Phase C6. Migrates the `users/{uid}/transactions/{id}` subcollection (the prepaid-wallet ledger) to the Zod-driven `FirestoreDataConverter` foundation.

- **New module:** [src/schemas/transaction.ts](../src/schemas/transaction.ts) — `TransactionSchema`, `TransactionTypeSchema` (`'credit' | 'debit'`), `TransactionStatusSchema` (`'pending' | 'completed' | 'failed'`), plus `z.infer`-derived types.
- **Schema vs prior interface — drift corrected:**
  - `userId` **dropped**. Path encodes ownership; none of the four writers ever set it. Same drift class as `AdAccount` (C6.1) and `UserWallet` (C6.3).
  - `reference?` (a generic optional cross-ref) **dropped — never written**. Replaced with two semantic optionals: `reportId?` (set by [useWallet.debitAmount](../src/hooks/useWallet.ts) when a debit pays for a generated report) and `paymentId?` (set by [suitpayWebhook.ts](../functions/src/suitpayWebhook.ts) and [suitpayPayment.ts](../functions/src/suitpayPayment.ts) for PIX credits).
  - `amount` **tightened to `z.number().int().nonnegative()`** (DATA-MODEL declared "BRL centavos integer >= 0"; the prior interface accepted floats and negatives).
  - `createdAt` **migrated to `zTimestamp()`**. The four writers use a mix of `new Date()`, `admin.firestore.Timestamp.now()`, and `serverTimestamp()`; reads always come back as `Timestamp` and are normalized to `Date`.
  - `completedAt` **added** as `zTimestamp().optional()` — written by both SuitPay flows when a `pending` transaction flips to `completed`.
  - **Admin metadata added** as optionals: `adminAction`, `adminEmail`, `adminReason`, `adminIP` — written by [adminWalletManager.ts](../functions/src/adminWalletManager.ts) when an admin manually credits a user.
  - **SuitPay payer metadata added** as optionals: `payerName`, `payerCpf` (CPF is partially masked at the source — first 3 digits + `***`). Deprecated; will be removed when Asaas replaces SuitPay.
- **`src/types/index.ts`:** the hand-written `Transaction` interface is gone; the file reexports the schema-derived type.
- **Consumer refactored** to use `.withConverter(zodConverter(TransactionSchema, 'Transaction'))`:
  - [src/hooks/useWallet.ts](../src/hooks/useWallet.ts) — local `interface Transaction` removed; the real-time observer at line 64 wrapped with the converter.
- **Dead client-write paths flagged** but not removed: [useWallet.addCredits](../src/hooks/useWallet.ts) and [useWallet.debitAmount](../src/hooks/useWallet.ts) write transactions via the client SDK, but [firestore.rules:39-45](../firestore.rules) (Phase 3 baseline) blocks client writes to the `transactions` subcollection. Both `addDoc` calls are now annotated with `Omit<Transaction, 'id'>` for type safety and tagged with a `NOTE` comment. Migrating these flows to a callable function is tracked as a follow-up — out of scope for the schema commit.
- **Deferred UI cleanup:** [TransactionsPage.tsx:107-153](../src/pages/TransactionsPage.tsx) has defensive `createdAt` parsing (`Date | Timestamp | { seconds }`) that can be simplified to a single `.toLocaleString()` call now that the converter normalizes to `Date`. Left untouched in this commit to keep the diff focused; tracked as a TODO in REFACTOR-PLAN.
- **DATA-MODEL.md:** entry rewritten to reflect the full schema (cross-refs, admin metadata, SuitPay payer metadata) and to call out that client writes are blocked by Firestore rules.

Verification: `bun run typecheck` ✓, `bun run build` ✓ (1.19 MB JS / 320 KB gz — no regression vs C6.3).

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
