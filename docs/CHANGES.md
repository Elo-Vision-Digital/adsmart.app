# Changes

Append-only log of significant changes. Most recent at the top. Each entry uses the parseable header `## [YYYY-MM-DD] — Title` for tooling/lint.

Format conventions:
- One section per logical change set (a phase, a migration, an incident, a major decision).
- Use bullet points for individual changes; group by area when long (Frontend / Functions / Rules / Docs).
- Reference commit SHAs or PR numbers when relevant.
- Do NOT edit past entries. If a past claim is wrong, add a new dated entry that supersedes it (and link back).

---

## [2026-05-18] — Auth flow hardening: surgical refactor of Google/Facebook/Email-Password flows (ADR-020)

**Status:** Shipped on `develop` in 28 commits (`621bfab` … `957cf11`). Plan executed via `superpowers:subagent-driven-development`. Browser-validated via Playwright + Chrome DevTools end-to-end. Two real bugs detected via browser validation and fixed in commit `f0fc264` (catch handlers + stale i18n key). Decision recorded in [ADR-020](Decisions.md#adr-020-auth-flow-hardening-2026-05-approach-a--surgical-refactor).

**Numbering note:** This work landed first in `Decisions.md` as ADR-020; a parallel chat shipped a SuitPay-removal ADR (entry directly below) and renumbered theirs to ADR-021.

The pre-refactor surface had twelve concrete drift / latent-bug problems documented in [the design spec](superpowers/specs/2026-05-17-auth-flow-hardening-design.md) §1. Chosen response: **Approach A — surgical refactor**. Approaches B (extract `AuthService`) and C (`signInWithRedirect` + MFA TOTP) considered and rejected — see ADR-020.

**Shared modules (single source of truth):**
- `packages/shared/src/auth/admin.ts` — `ADMIN_EMAILS` + `isAdminUser(claims, email)`. Consumed by client `AuthContext` AND 3 Cloud Functions. `const ADMIN_EMAILS\b` now returns zero matches outside `packages/shared`.
- `packages/shared/src/auth/password.ts` — `PasswordPolicy` (8 chars + complexity) + `validatePassword(pwd): { valid, errors[i18n_key] }`. Both `LoginPage` signup AND `SettingsPage` change-password consume it. Pre-refactor: LoginPage 8+complexity / SettingsPage 6 chars (silent drift).

**Frontend:**
- `src/firebase/config.ts` — `getAuth(app)` → `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence], popupRedirectResolver: browserPopupRedirectResolver })`.
- `src/contexts/AuthContext.tsx` — removed `signIn` alias; shared `isAdminUser`; PII `console.log/console.error` removed from Facebook handler; OAuth scopes explicit (Google `profile`+`email`+`prompt: 'select_account'`; Facebook `email`+`public_profile`); `refreshAuthState(user)` (`getIdToken(true)` + `user.reload()`) after every sign-in; `getIdTokenResult(true)` in listener; `{!loading && children}` gate removed.
- `src/lib/auth/{errors,errorMessages}.ts` — `isAuthError` type guard + `AUTH_ERROR_KEY_MAP` (15 codes) + `authErrorToTKey(err)`. Privacy collapse on sign-in errors.
- `src/components/AuthLoadingFallback.tsx` — spinner with `aria-label="Carregando"`.
- `src/components/{PrivateRoute,AdminRoute}.tsx` — honor `loading`, `<Navigate replace>`. New tests (3+4).
- `src/components/EmailVerificationBanner.tsx` — non-blocking yellow banner. 5 i18n keys × 3 locales.
- `src/pages/LoginPage.tsx` — `signUp` via Context, shared `validatePassword`, shared `authErrorToTKey` with split catch pattern.
- `src/pages/ForgotPasswordPage.tsx` — new at `/forgot-password`, privacy collapse.
- `src/pages/SettingsPage.tsx` — change-password uses shared policy (8 chars). Stale `minimumCharacters` placeholder updated.
- `src/pages/DeleteDataPage.tsx` — calls `deleteUserData` callable; email-typed confirmation; `signOut()` + `navigate('/login', { replace: true })`.
- `src/utils/validation.ts` — re-export shim; `validation.test.ts` deleted (coverage in shared).
- 12 new i18n keys across pt-BR / en / es.

**Cloud Functions:**
- `functions/src/bootstrapUser.ts` — email fallback `event.data.email → providerData[*].email → null`. No more `email: ''`. Structured Cloud Logging telemetry.
- `functions/src/securityLogger.ts` — `USER_DELETION` added to `SecurityEventType`.
- `functions/src/deleteUserData.ts` — real cascade delete (5 subcollections × 400-doc batches) + `userDocuments` cleanup + Auth user delete + audit log. Rate-limited 1×/hour.
- `functions/src/{getDashboardMetrics,priceManager,adminWalletManager}.ts` — local `ADMIN_EMAILS` removed.

**Hosting:**
- `firebase.json` — `Cross-Origin-Opener-Policy: same-origin-allow-popups` (was `same-origin`). Required for `signInWithPopup` reliability.

**Test setup:**
- `src/test/setup.ts` — global `vi.mock('@/firebase/config')` because Vitest's happy-dom resolves `@firebase/auth` to its node-esm bundle where `browserPopupRedirectResolver` is a sentinel `Error`. Tests that need real Firebase override locally. Tracked as tech debt.

**Docs (Phase G):**
- `docs/Decisions.md` ADR-020; `docs/SECURITY.md` (Password policy + Auth error messaging + COOP downgrade + admin granting flow without sign-out/in); `docs/QA-CHECKLIST.md` (6 new auth sub-sections); `docs/ERROR-HANDLING.md` (Firebase Auth code → i18n table + split catch pattern); `AGENTS.md` (Conventions + What NOT to do); `CLAUDE.md` ("Auth flow conventions" section); `docs/superpowers/{specs,plans,notes}/2026-05-17-auth-flow-hardening-*.md`.

**Deferred follow-ups (tracked in ADR-020 "Not done"):**
- `HomePage` brief flash on public pages with logged-in user.
- `useMemo` on `AuthContext.value`, `useReducer` for coupled state.
- Vitest config alternative to the `vi.mock` global stub.
- `useTransition` for sign-in actions.
- Playwright e2e test artifact (browser-validated but no `.spec.ts` committed).
- Operator: provision custom admin claims for the email allowlist; mirror shared password policy in Identity Platform Console.
- `auth/provider-already-linked` not in error map.

---

## [2026-05-18] — SuitPay removed end-to-end + prepare-deploy hardened against secret/env overlap (ADR-021)

**Status:** Dev shipped (17 functions deployed, 3 SuitPay deleted, `confirmGoogleAdsAccountSelection` recreated clean). Prod cleanup pending operator authorization. Decision and trade-offs in [ADR-021](Decisions.md#adr-021-remove-suitpay-end-to-end--harden-prepare-deploy-against-secretenv-overlap).

The Sprint 3 deploy of OAuth crypto hardening (ADR-019) ran into a chain of failures rooted in SuitPay's dead-but-live code:

1. **First deploy attempt** of `confirmGoogleAdsAccountSelection` failed with HTTP 400 `Secret environment variable overlaps non secret environment variable: GOOGLE_ADS_DEVELOPER_TOKEN`. The previously-deployed revision had `GOOGLE_ADS_DEVELOPER_TOKEN` registered as a plain env var from a pre-ADR-017 deploy when the value was in `functions/.env`; the new deploy declared the same name as `secretEnvironmentVariables`; Cloud Run rejected the overlap.
2. **`gcloud run services update --remove-env-vars`** as the remediation failed with `Image 'gcf-artifacts/...:version_1' not found` because Firebase CLI 14+ applies a default Artifact Registry cleanup policy (1-day retention). The image needed to materialize a new revision was already garbage-collected.
3. **Even after cleaning `functions/.env`**, deploys kept failing on `In non-interactive mode but have no value for the secret: SUITPAY_CLIENT_ID` because `defineSecret('SUITPAY_*')` was still in `config/index.ts` and dev had never been provisioned with those secrets.

Given zero production users (domain not pointed; still in development), the cleanest path was to delete SuitPay completely rather than provision dummy SuitPay secrets in dev.

**Functions side:**

- Deleted: [functions/src/suitpayPayment.ts](../functions/src/suitpayPayment.ts) (was `createPixPayment`, `checkPaymentStatus`), [functions/src/suitpayWebhook.ts](../functions/src/suitpayWebhook.ts).
- [functions/src/index.ts](../functions/src/index.ts) — 2 export blocks removed; comment block citing ADR-021 added in their place.
- [functions/src/config/index.ts](../functions/src/config/index.ts) — `defineSecret('SUITPAY_CLIENT_ID')` and `defineSecret('SUITPAY_CLIENT_SECRET')` removed, plus the entire `config.suitpay` block and the now-orphaned `getWebhookUrl` / `getRedirectUrl` helpers (only used by SuitPay).
- [functions/.env](../functions/.env) — 3 plain-text values purged: `SUITPAY_CLIENT_ID`, `SUITPAY_CLIENT_SECRET`, and the residual `GOOGLE_ADS_DEVELOPER_TOKEN` (which should have been only in Secret Manager since ADR-017 but had been leaking into Cloud Run service specs).
- [functions/scripts/prepare-deploy.mjs](../functions/scripts/prepare-deploy.mjs) — **hardened** to extract every `defineSecret('NAME')` regex match from `config/index.ts` and filter any matching `NAME=...` line out of `functions/.env` before writing `functions/deploy/.env`. Emits a `console.warn` listing stripped keys.

**Frontend side:**

- Deleted: [src/components/ui/PixPaymentModal.tsx](../src/components/ui/PixPaymentModal.tsx), [src/services/paymentService.ts](../src/services/paymentService.ts).
- Rewritten: [src/components/ui/AddCreditsModal.tsx](../src/components/ui/AddCreditsModal.tsx) — replaced 100+ lines of SuitPay-aware code with a maintenance-notice placeholder. Three callers (Header, MobileHeader, TemplatesPage) still import it; restoring functionality is one component edit once Asaas lands.
- [src/pages/TermsOfServicePage.tsx](../src/pages/TermsOfServicePage.tsx) — "PIX (processado via SuitPay)" → "PIX (em breve)".

**Cloud Run side (dev):**

```bash
firebase functions:delete confirmGoogleAdsAccountSelection suitpayWebhook createPixPayment checkPaymentStatus --project adsmart-web-dev --region us-central1 --force
firebase deploy --only functions --project adsmart-web-dev
```

Result: 4 Cloud Run services deleted (3 SuitPay + 1 with overlap), then 17 functions deployed/created. `confirmGoogleAdsAccountSelection` was recreated fresh with the correct `encryptionKey + googleAdsClientSecret + googleAdsDeveloperToken` secret bindings (no overlap because the new service was created from a clean spec, not updated from a dirty one).

**Cloud Run side (prod) — pending:**

Same sequence needs to run in `adsmart-web` once the operator authorizes. SuitPay services are still deployed there but have zero traffic (no UI calls them after this change; domain not pointed).

**Memory triggers added for future agents:**

- [`firebase_deploy_env_overlap_trap.md`](https://example.com) — the exact failure mode + canonical recovery. Triggers on the error string.
- [`firebase_deploy_workflow_rules.md`](https://example.com) — hard rules built from the incidents (which `.env` is read, when to rebuild, why `gcloud run update` is unsafe, per-action authorization).
- [`suitpay_deprecated.md`](https://example.com) rewritten as `suitpay_removed.md` — points future agents at ADR-021 + Asaas restoration plan.

**Validation:**

- `bun run typecheck` ✅ web, functions, shared.
- `bunx vitest run` ✅ shared (94/94), functions/src/lib (19/19 crypto), web (62/62).
- `biome check` ✅ on every touched file.
- `firebase functions:list --project adsmart-web-dev` ✅ — 17 callables, all v2, no SuitPay.
- Final bundle grep `SUITPAY|suitpay` in `functions/lib/bundle.js` ✅ — 0 matches.

**Files touched:** 11 source changes + 4 doc updates + 3 memory entries.

---

## [2026-05-17] — Sprint 3: Firebase App Check removed end-to-end; AES-256-GCM for OAuth tokens at rest with backward-compat read-path migration

**Status:** Shipped. Code-only change; no Firestore or Auth state touched (legacy Base64-encoded tokens migrate opportunistically on next read — no offline script). Decision and trade-offs documented in [ADR-019](Decisions.md#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest).

Closes the two real security gaps from the post-Sprint-2 audit. **App Check** was a dead scaffold (initialized in code but gated on an env var nobody ever set), and the **OAuth tokens** stored in Firestore at `users/{uid}/oauth_tokens/{google_ads,meta_ads}` used Base64 as "encryption" — any reader of the database could decode them trivially. Both required research before action per the workflow rule: Context7 (`/websites/nodejs_latest-v22_x_api`, `/websites/zod_dev_v4`) and Firebase developer-knowledge MCP confirmed the canonical approach (Node `node:crypto` AES-256-GCM + AEAD + `scryptSync` KDF + Secret Manager key) before any code changed.

**Frontend (App Check removal):**

- [src/firebase/config.ts](../src/firebase/config.ts) — entire `initializeAppCheck` block deleted (was a dynamic import gated on `VITE_APPCHECK_SITE_KEY`, which was never set in any environment). Replaced with a comment block citing ADR-019.
- [.env.example](../.env.example) — `VITE_APPCHECK_SITE_KEY` entry + its 4-line preamble removed.
- [src/lib/auth/errorMessages.ts](../src/lib/auth/errorMessages.ts) — `'auth/firebase-app-check-token-is-invalid'` error code mapping deleted (the Firebase Auth SDK cannot raise it without App Check initialized; mapping was dead code). No `appCheckFailed` translation key has any consumer in `src/locales/`, so no i18n cleanup needed.

**Functions (AES-256-GCM):**

- New: [functions/src/lib/oauthCrypto.ts](../functions/src/lib/oauthCrypto.ts) — exports `encryptString`, `decryptField`, `detectAndDecrypt` (backward-compat with legacy Base64), `isEncryptedField` type guard. AES-256-GCM via `node:crypto`'s `createCipheriv` / `createDecipheriv`, 32-byte key derived from `ENCRYPTION_KEY` secret via `scryptSync`, random 12-byte IV per call, 16-byte auth tag, versioned wire format `{ v: 1, iv, tag, ct }`. The derived key is cached at module scope so cold-start scrypt cost (~30 ms) is paid once.
- New: [functions/src/lib/oauthCrypto.test.ts](../functions/src/lib/oauthCrypto.test.ts) — **19 tests** covering UTF-8 round-trip with realistic OAuth tokens, random-IV uniqueness, tampering detection (ciphertext + auth tag), wrong-key failure, unsupported version, missing fields, empty input rejection, type guard happy + sad paths, legacy Base64 detection in `detectAndDecrypt`. All 19 pass.
- [functions/src/googleAdsOAuthV2.ts](../functions/src/googleAdsOAuthV2.ts) — local `encryptTokens` (Base64) deleted; imports `encryptString` from `./lib/oauthCrypto`. `confirmGoogleAdsAccountSelection` binds `encryptionKey` in `options.secrets` alongside `googleAdsClientSecret` and `googleAdsDeveloperToken`.
- [functions/src/googleAdsOAuth.ts](../functions/src/googleAdsOAuth.ts) (V1, retained) — local `encryptTokens` / `decryptTokens` deleted; imports `encryptString` + `detectAndDecrypt`. `getValidTokens` now uses `detectAndDecrypt` (accepts both v1 EncryptedField and legacy Base64 string), then on the refresh path AES-encrypts the new tokens, and on the non-refresh path opportunistically re-encrypts legacy tokens. `getGoogleAdsCampaigns` binds `encryptionKey` in `options.secrets`.
- [functions/src/metaAdsOAuthV2.ts](../functions/src/metaAdsOAuthV2.ts) — same shape as Google V2.
- [functions/src/metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts) (V1, retained) — same shape as Google V1, minus the refresh-token branch (Meta long-lived tokens don't refresh; they're rotated by user re-consent). Also drops a `export { encryptTokens }` line that existed only to silence the unused-warning.

**Operator follow-ups (out of band, see [ADR-019](Decisions.md#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest) for full procedure):**

1. Provision `ENCRYPTION_KEY` in Secret Manager for both projects if not already set: `firebase functions:secrets:set ENCRYPTION_KEY --project <target>`. Use ≥32 high-entropy bytes (suggestion: `openssl rand -base64 32`).
2. Redeploy the 4 OAuth callables so the new secret binding takes effect: `firebase deploy --only functions:confirmGoogleAdsAccountSelection,functions:confirmMetaAdsAccountSelection,functions:getGoogleAdsCampaigns,functions:getMetaAdsCampaigns --project <target>`.
3. Pre-Sprint-3 tokens in `users/{uid}/oauth_tokens/` continue to work transparently; they migrate to AES-GCM on next read.

**Pre-existing ADR corrections (no rewrite, addendum pattern):**

ADR-016 and ADR-017 both contained the assertion "App Check is NOT initialized in the web client." Investigation during Sprint 3 found this was incorrect — the scaffold WAS initialized in `src/firebase/config.ts`, just never activated because no env var was set. Per the project's docs-as-append-only convention, both ADRs are linked from ADR-019 as the canonical correction rather than rewritten in place.

**Validation:**

- `bun run typecheck` ✅ across web, functions, and shared.
- `bun run test` in `packages/shared` ✅ — 94/94 passing (no schema changes this sprint).
- `bunx vitest run src/lib/` in `functions/` ✅ — **19/19 crypto tests passing**.
- `biome check` clean on every file modified by this change.
- Runtime smoke test via Playwright MCP (dev server on `:5174`): homepage 0 errors, bundle confirmed to no longer reference `firebase/app-check` / `initializeAppCheck` / `ReCaptchaEnterpriseProvider` / `VITE_APPCHECK`.
- Final hygiene grep: `encryptTokens` / `decryptTokens` / `process.env.*_SECRET` / `APPCHECK` — only the intentional ADR-019 history comment in `src/firebase/config.ts:39` remains.

**Files touched:** 12 (1 new crypto module + 1 new test file, 4 OAuth files refactored, 3 web cleanup, 3 docs).

---

## [2026-05-17] — Sprint 2: schemas for User, UserDocument, OAuthState, TemporaryOAuthToken, RateLimit; reserveUserDocument migrated to canonical I/O; Zod 4 modernization

**Status:** Shipped. Code-only refactor; no Firestore or Auth state touched. Decision and trade-offs documented in [ADR-018](Decisions.md#adr-018-schemas-for-user-userdocument-oauthstate-temporaryoauthtoken-and-ratelimit).

Closes the schema gap the Sprint 1 audit identified: 10 Firestore collections were lacking canonical Zod schemas, including `users/{uid}` (the most central entity). This sweep covers the 5 collections whose shapes were demonstrably referenced in shipped code; `adminActivity`, `productPrices` (already done in Sprint 1), `securityLogs`, `backupMetadata` and `users/{uid}/oauth_tokens/google_ads` are deferred to later sprints (the first three because no client code reads them; the last because it ships together with the AES-256-GCM token encryption work tracked in [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement)).

**`@adsmart/shared` (4 new schema files, 14 new exports):**

- [`schemas/user.ts`](../packages/shared/src/schemas/user.ts) — `UserSchema` (canonical profile shape), `UserClientUpdateSchema` (strict subset clients may send through `updateDoc`; rejects email/createdAt/documentType/documentNumber to mirror `firestore.rules`), `DocumentTypeSchema`. Stale `displayName`/`photoURL` fields from the old `src/types/index.ts:User` are NOT in the canonical schema — they live on Firebase Auth.
- [`schemas/userDocument.ts`](../packages/shared/src/schemas/userDocument.ts) — `UserDocumentSchema` (the uniqueness-index document), `ReserveUserDocumentInputSchema` (callable input; accepts formatted or stripped document), `ReserveUserDocumentOutputSchema` (always normalized digits-only).
- [`schemas/oauthState.ts`](../packages/shared/src/schemas/oauthState.ts) — `OAuthStateSchema` (CSRF state, 10-min TTL), `TemporaryOAuthTokenSchema` (raw provider credentials, 30-min TTL, marked as never-to-be-exposed-to-client-API), `OAuthPlatformSchema`.
- [`schemas/rateLimit.ts`](../packages/shared/src/schemas/rateLimit.ts) — `RateLimitSchema`.

Each new schema ships with a co-located `*.test.ts` file. Total test count: 70 → **94 passing** (+24 new).

**Existing schemas modernized to Zod 4 idioms (Context7-verified):**

- [`schemas/dashboardMetrics.ts`](../packages/shared/src/schemas/dashboardMetrics.ts) — `z.string().datetime()` → `z.iso.datetime()` at 3 call sites (input `startDate`, `endDate`; output `generatedAt`).
- [`schemas/report.ts`](../packages/shared/src/schemas/report.ts) — `z.string().url()` → `z.url()` for `lookerStudioUrl`.
- [`schemas/adAccount.ts`](../packages/shared/src/schemas/adAccount.ts) — `z.string().optional()` → `z.email().optional()` for the provider-reported email field.

The method forms remain deprecated-but-functional in Zod 4; switching to the top-level forms is cosmetic (94/94 tests pass unchanged) but standardizes the idiom for new schemas.

**Functions:**

- [`reserveUserDocument.ts`](../functions/src/reserveUserDocument.ts) — inline `ReserveRequest`/`ReserveResponse` interfaces deleted; manual `typeof` validation replaced with `ReserveUserDocumentInputSchema.safeParse(...)`. Return type tightened from `Promise<ReserveResponse>` to `Promise<ReserveUserDocumentOutput>`. Adds explicit `region: config.project.region` to match the v2 conventions adopted in Sprint 1.
- [`bootstrapUser.ts`](../functions/src/bootstrapUser.ts) — comment block expanded to record WHY it does not validate against `UserSchema` (preserving the ADR-010 "doc-exists-after-signup" invariant against OAuth signups with empty email). A `console.warn` is now emitted when email is missing on signup so the operational signal is no longer silent.

**Frontend:**

- [`src/types/index.ts`](../src/types/index.ts) — the local `interface User` (with the stale `displayName`/`photoURL` fields) is deleted. `User`, `DocumentType`, and `UserClientUpdate` are now re-exported from `@adsmart/shared`. No consumers of `User` from `@/types` exist today, so the deletion is risk-free; the re-export is the path future consumers should take.

**Docs:**

- [`docs/DATA-MODEL.md`](DATA-MODEL.md) — `users/{uid}`, `userDocuments/{normalizedDoc}`, `rateLimits/{userId}`, `oauth_states/{stateId}`, and `temporary_oauth_tokens/{tokenId}` all now cite their schema source-of-truth file. The `users/{uid}` section explicitly notes that `displayName`/`photoURL` are NOT mirrored into Firestore (they live on Firebase Auth) and the `temporary_oauth_tokens/{tokenId}` section adds a "MUST NEVER be exposed to client API surface" warning. Several documented-but-missing fields were corrected against the real write shapes (e.g., `oauth_states` was missing `platform`; `temporary_oauth_tokens` listed a `tokenType` field that does not exist in the Google handler write).
- [`docs/Decisions.md`](Decisions.md) — new ADR-018.

**Validation:**

- `bun run typecheck` ✅ across web, functions, and shared.
- `bun run test` in `packages/shared` ✅ — **94/94 passing** (24 new tests).
- `biome check` clean on every file modified by this change.

**Files touched:** 18 (9 schema files + tests, 2 functions, 1 web, 3 docs, plus `packages/shared/src/index.ts` for re-exports).

---

## [2026-05-17] — Single-source-of-truth sweep: ADMIN_EMAILS + ProductPrice consolidation, priceManager v1→v2, Google Ads token decoupled from source

**Status:** Shipped. Code-only refactor; no Firestore or Auth state touched. ADRs [ADR-016](Decisions.md#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) and [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement) document the decision space.

Triggered by a full audit of the schema/API-contract surface (see Decisions for the prioritized findings). Sprint 1 closes the highest-leverage drift sources: hand-maintained `ADMIN_EMAILS` constants in 5 files, the `ProductPrice` interface declared in 4 places, the lone v1 callable in `priceManager.ts`, and a Google Ads developer token committed as a code fallback.

**`@adsmart/shared` (source of truth):**

- New: [`schemas/productPrice.ts`](../packages/shared/src/schemas/productPrice.ts) — `ProductPriceSchema`, `UpdateProductPriceInputSchema`, `UpdateProductPricesInputSchema`, plus `DEFAULT_PRODUCT_PRICES` constant and `ProductPriceCategory`/`ProductPriceType` enums. Co-located test file covers happy/sad paths and the 50-item batch cap.
- Re-exported from `packages/shared/src/index.ts`.

**Functions (`functions/src/`):**

- `priceManager.ts` rewritten end-to-end: now uses `onCall` from `firebase-functions/v2/https` with explicit `region`, `safeParse` against `UpdateProductPricesInputSchema`, `isAdminUser` from `@adsmart/shared`, server-stamped `updatedAt`/`updatedBy` (no longer client-controllable), and structured `HttpsError` instead of generic throws.
- `adminWalletManager.ts`, `getDashboardMetrics.ts`, `backupScheduler.ts` — local `ADMIN_EMAILS` arrays removed; now call `isAdminUser(auth.token, email)`.
- `config/index.ts` — SuitPay secrets restored via `defineSecret` (the empty-stub workaround was actively defeating the secret-binding mechanism); new `googleAdsDeveloperToken` secret declared; `config.googleAds.developerToken` plain-env field deleted.
- `suitpayPayment.ts`, `suitpayWebhook.ts` — `process.env.SUITPAY_CLIENT_SECRET` fallbacks removed, secrets now bound via `options.secrets` on each callable/onRequest; webhook rejects unsigned payloads with 401 instead of accepting "temporarily."
- `googleAdsOAuthV2.ts` — `getDeveloperToken()` reads `googleAdsDeveloperToken.value()` and throws `HttpsError('failed-precondition')` if unset; both Step 1 and Step 2 callables now declare the secret in `options.secrets`.
- `googleAdsOAuth.ts` (legacy v1, still exported) — hardcoded developer token literal removed; comment clarifies the file does not call the Google Ads data API and so does not need the developer token bound.

**Frontend (`src/`):**

- `contexts/AuthContext.tsx` — local `ADMIN_EMAILS` removed; admin check delegates to `isAdminUser(tokenResult.claims, user.email)` from `@adsmart/shared` so server and client share one authority list.
- `hooks/useProductPrices.ts` — `ProductPrice` interface deleted; type re-imported from `@adsmart/shared`; `DEFAULT_PRICES` derived from `DEFAULT_PRODUCT_PRICES`.
- `pages/admin/PricesConfigPage.tsx` — `ProductPrice` interface deleted; type imported from `@adsmart/shared`; the Firestore-serialized `{seconds, nanoseconds}` Timestamp shape is now isolated to a single `SerializedTimestamp` helper.

**Operator follow-ups (NOT in this change — see [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement)):**

1. **Rotate the Google Ads developer token at the Google Ads API Center.** The literal value `wRhu9OHLIWdbht2HY3B9yw` is present in 6+ commits of git history and remains valid until reset at the provider. Removing it from current code does not invalidate it.
2. Provision the new value into Secret Manager for both projects (`functions:secrets:set GOOGLE_ADS_DEVELOPER_TOKEN`).
3. Redeploy `handleGoogleAdsCallbackWithSelection` and `confirmGoogleAdsAccountSelection`.

**Validation:**

- `tsc --noEmit` ✅ across web, functions, and shared.
- `vitest` ✅ in `packages/shared` (70/70 passing, including 6 new tests for `productPrice.ts`).
- Web `vitest` ✅ on the 58 tests unaffected by the pre-existing Firebase Auth init issue in `AdminRoute.test.tsx` (tracked separately; unrelated to this change).
- Functions `vitest` requires emulator startup (security-log re-entrancy tests); the emulator was not started in this sweep — to be exercised in the next deploy cycle via `/firestore-rules-test`.
- `biome check` clean on every file modified by this change.

**Files touched:** 14 (10 functions, 3 web, 2 shared, plus 3 docs).

---

## [2026-05-17] — Full Firestore + Auth + Storage wipe across dev and prod; Identity Platform blocking trigger fix (dev)

**Status:** Shipped. No code changes; this is an operational + infra-config record. Decision documented in [Decisions.md ADR-015](Decisions.md#adr-015-register-identity-platform-blocking-trigger-after-total-firestore--auth-wipe).

After the same-day reCAPTCHA + Security Logs removals (above), the project owner requested a full reset of historical data in both Firebase projects to graduate to a clean state where code + schemas + rules are the only source of truth. There are no production users; the wipe was a low-risk YAGNI cleanup to drop noise (orphan OAuth states, expired webhook logs, stale rate-limit counters, dev test accounts) before formalising the API contract surface.

**Firestore (irreversible — PITR is OFF on both projects, confirmed via `firestore:databases:get`):**

- `bunx firebase-tools firestore:delete --all-collections --recursive --force --project adsmart-web-dev` → wiped `adminActivity, productPrices, rateLimits, securityLogs, users` (5 top-level collections, including all `users/{uid}/wallet/{current,transactions}` subcollections).
- `bunx firebase-tools firestore:delete --all-collections --recursive --force --project adsmart-web` → wiped `adminActivity, backupMetadata, oauth_states, payments, pendingPayments, productPrices, rateLimits, reports, temporary_oauth_tokens, users, webhook_logs` (11 top-level collections, same recursive semantics).
- `firestore:list_collections` confirms `{}` on both projects post-wipe.

**Firebase Auth + Cloud Storage:**

- Auth wipe done by the project owner via Firebase Console (Authentication → Users → Delete account, batched). User initially preserved a small admin set, then re-wiped after the `bootstrapUser` fix landed — see next bullet.
- Storage wipe done by the project owner via Firebase Console on each project's default bucket.

**Functions / Rules / Indexes / Secrets — UNCHANGED.** The wipe was data-only.

- `firebase functions:list` returns the 20 deployed functions on prod (and the same set in dev minus the dev-only deltas), same as before the wipe. No code regression in the codebase or in deployed revisions.
- `firestore.rules` (Phase 3 baseline) and `firestore.indexes.json` (composite indexes for `getDashboardMetrics`) unchanged in source and on the wire.
- Secret Manager: `RECAPTCHA_SECRET_KEY` version 1 destroyed in prod earlier today (see reCAPTCHA entry); no other secret destruction performed. All active secrets (`asaasApiKey`, `metaAdsAppSecret`, `googleAdsClientSecret`, `suitpaySecret`) remain enabled.

**Identity Platform blocking trigger fix (dev):**

First post-wipe signup against `adsmart-web-dev` succeeded at Auth layer (user appeared in IndexedDB) but produced **no `users/{uid}` and no `users/{uid}/wallet/current`** in Firestore — the `bootstrapUser` blocking trigger never executed. Root cause: dev's Identity Platform config had `blockingFunctions: {}` (empty) — the Cloud Function `bootstrapUser` was deployed and ACTIVE, but Identity Platform had no registration pointing at it as a `beforeCreate` trigger. Prod was already correctly registered from the 2026-04-26 deploy (`bootstrapuser-2ocqwqseya-uc.a.run.app`); dev was not. The CLI `firebase deploy --only functions:bootstrapUser --project adsmart-web-dev --force` rebuilt the function but did **not** re-attempt the Identity Platform registration — a silent failure in firebase-tools' blocking-function deploy path.

First attempt to register the trigger used the legacy Cloud Functions URL (`https://us-central1-adsmart-web-dev.cloudfunctions.net/bootstrapUser`) and produced (in function logs at severity ERROR):
```
FirebaseAuthError: Firebase Auth Blocking token has incorrect "aud" (audience) claim.
Expected "run.app" but got
"https://us-central1-adsmart-web-dev.cloudfunctions.net/bootstrapUser".
```
The signup surfaced as Firebase error code `-47` (`auth/internal-error`) on the client. Functions v2 are backed by Cloud Run, and Identity Platform validates the OIDC `aud` claim against the actual Cloud Run service URL.

Fix:

```bash
curl -X PATCH \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: adsmart-web-dev" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/adsmart-web-dev/config?updateMask=blockingFunctions" \
  -d '{
    "blockingFunctions": {
      "triggers": {
        "beforeCreate": {
          "functionUri": "https://bootstrapuser-nnhhnhk2wa-uc.a.run.app"
        }
      }
    }
  }'
```

`functionUri` is the Cloud Run service URL — visible in `firebase functions:list` output or `serviceConfig.uri` from a deploy response. Validated: second signup attempt by the same email created `users/{uid}` and `users/{uid}/wallet/current` correctly (visible via Firebase MCP `firestore_get_document` on both paths immediately after signup). Prod was not modified — its registration was already correct.

**Admin claim setup (dev):**

After the working signup, granted the admin custom claim to the test account via Identity Toolkit REST API (no script, no Admin SDK boilerplate):
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: adsmart-web-dev" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/v1/projects/adsmart-web-dev/accounts:update" \
  -d '{"localId":"<UID>","customAttributes":"{\"admin\":true}"}'
```
Verified via `accounts:lookup` that `customAttributes` returns `{"admin":true}`. ID token refresh required on the client (sign out + sign in) for the claim to land in the active session.

**What was NOT done (deferred / out of scope):**

- Prod re-cadastro to re-validate the trigger end-to-end — deferred. Prod's `blockingFunctions` registration is intact (verified via the same admin API GET), and the owner has not yet attempted a fresh signup. If signup ever fails in prod, the same fix shape applies, with `functionUri: https://bootstrapuser-2ocqwqseya-uc.a.run.app` (the prod Cloud Run URL, stable since 2026-04-26).
- Automated emulator test for the registration. The check could be a single GET in `/firebase-deploy` flow that asserts `blockingFunctions.triggers.beforeCreate.functionUri.endsWith('.run.app')` — tracked as a possible future enhancement to the deploy guard scripts, not in this entry.
- `productPrices` re-seed. Left to organic re-creation by the existing `initializeDefaultPrices` callable, which the admin panel invokes when the collection is missing. No manual seed via MCP or scripts — keeps a single seed path (the callable + admin-only auth check), avoiding seed drift.

**Process notes:**

- Auth wipe and Storage wipe were both performed by the project owner via Firebase Console rather than CLI scripts. This was intentional: those operations are irreversible and benefit from the visual confirmation a Console action provides over a one-shot scripted batch. Documented here so the same split (CLI → Firestore; Console → Auth/Storage) can be reused if the wipe ever repeats.
- The Identity Platform PATCH was used in preference to redeploying or clicking through Firebase Console. The Console path also works (Authentication → Settings → Blocking functions → Save) but produces no reviewable artifact and is silent about the underlying URL it registers. The REST PATCH leaves the exact request body in the operator's history, which is what landed in ADR-015 verbatim.



**Status:** Shipped (client + functions code). Deploy + zombie delete: pending the next deploy step. Decision documented in [Decisions.md ADR-014](Decisions.md#adr-014-remove-security-logs-admin-tab-keep-logger-primitive).

The `/admin/security` tab and its `getSecurityStats` callable were removed. Same overengineering argument as the reCAPTCHA removal earlier this day (ADR-013): at current product stage the admin opens this tab roughly never, Cloud Logging covers the same data with proper filtering and retention, and the bespoke UI was duplicating Cloud Logging without adding signal. Critical distinction enforced in the implementation: the LOGGER primitive (`SecurityLogger` class + `SecurityEventType` + `SecuritySeverity` enums + `securityLogs/{id}` Firestore collection) **stays** — 5 other Cloud Functions write to it for audit (`googleAdsOAuth`, `metaAdsOAuth`, `rateLimiter`, `adminWalletManager`, and the SUSPICIOUS_ACTIVITY re-entrancy guard inside `securityLogger.ts` itself). Removing the logger would have broken all of them.

**Client (commit `d899a7a`):**

- Deleted [src/pages/admin/SecurityLogsPage.tsx](../src/pages/admin/SecurityLogsPage.tsx) (124 lines, single consumer of `getSecurityStats`).
- [src/App.tsx](../src/App.tsx) — dropped `SecurityLogsPage` import + `<Route path="security">` child route. Navigating to `/admin/security` now falls through to the parent's `<Route index element={<Navigate to="dashboard" replace />} />` and lands on `/admin/dashboard` — no 404, bookmarks survive.
- [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) — removed `Shield` icon import (no other consumer) and the security entry from `tabs`. Admin sub-nav goes from 4 tabs to 3.
- [src/pages/admin/AdminLayout.test.tsx](../src/pages/admin/AdminLayout.test.tsx) — adapted to 3-tab world: renamed the first test, dropped the security child route, added a defensive `expect(hrefs).not.toContain('/admin/security')` assertion to catch silent re-introduction.
- [src/locales/pt-BR.json](../src/locales/pt-BR.json), [src/locales/en.json](../src/locales/en.json), [src/locales/es.json](../src/locales/es.json) — removed `admin.nav.security` plus the full `admin.security.*` subtree (10 keys per locale).
- [src/locales/types.ts](../src/locales/types.ts) — removed `nav.security: string` and the `security: {...}` interface block so the `as Translations` casts in `LanguageContext` stay structurally sound.

**Functions (commit `24407d4`):**

- Deleted [functions/src/securityStats.ts](../functions/src/securityStats.ts) (56 lines, the callable that wrapped `SecurityLogger.getSecurityStats()` with an admin gate).
- [functions/src/index.ts](../functions/src/index.ts) — removed `export { getSecurityStats } from './securityStats'`.
- [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) — removed the `getSecurityStats(days)` method (~40 lines, only consumer was `securityStats.ts`). The rest of the class is intact: `logEvent`, `getDb`, SUSPICIOUS_ACTIVITY re-entrancy guard, the `SecurityEvent` type, both enums. Refined the `@deprecated` comment on `RECAPTCHA_SUCCESS`/`RECAPTCHA_FAILED` so it no longer references the now-deleted `SecurityLogsPage`; the new justification is "Cloud Logging / Admin-SDK audit consumers depend on the enum being exhaustive".

**Untouched (verified, not assumed):**

- `firestore.rules` `match /securityLogs/{logId}` block — `allow read/write: if false` stays. Writes from app code go through Admin SDK in the logger; nothing client-side reads.
- `firestore.indexes.json` — zero composite indexes on `securityLogs` existed (the collection was always Admin-SDK scanned), nothing to remove.
- `functions/test/securityLogger.test.ts` — tests the logger primitive that stays.
- All 5 writers (`googleAdsOAuth`, `metaAdsOAuth`, `rateLimiter`, `adminWalletManager`, the logger's own re-entrancy path).
- `securityLogs/{id}` Firestore collection — audit trail intact; cleanup of historical documents is out of scope and can be batched separately if storage cost ever becomes material.

**Deploys + zombie cleanup (pending after this commit):**

- `firebase deploy --only functions --project adsmart-web-dev` will abort with the expected non-interactive warning ("functions found in your project but do not exist in your local source code: getSecurityStats"). Resolve with `firebase functions:delete getSecurityStats --project adsmart-web-dev --region us-central1 --force`, then re-deploy. Same sequence for `--project adsmart-web` after dev validation.
- No Secret Manager cleanup required (no secret declarations were removed).

**Verification:**

- `bun run typecheck` clean across the monorepo.
- `bun run test` 61/61 web tests pass (AdminLayout test adapted to 3 tabs; everything else unchanged).
- `cd functions && bun run typecheck` clean; `bun run build` produces 0.77 MB bundle (was 0.78 MB pre-removal — 10 KB saved from the dead code path, not material).

---

## [2026-05-17] — reCAPTCHA removed end-to-end (login, callable, secret declaration, CSP)

**Status:** Shipped. Decision documented in [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication).

reCAPTCHA gating on the email/password login was removed from the product. Trigger was an `["invalid-input-response"]` failure from Google `siteverify` against `adsmart-web-dev` (the dev secret had drifted out of sync with the site key, blocking every dev login) but the underlying decision was that the layer was overengineering for the current product stage. The remaining anti-abuse posture is the existing client-side `useRateLimit` (5 attempts / 15 min) + Firebase Auth's server-side per-account/IP throttling. The full threat-model after the change and the reintroduction trigger (Firebase App Check, not reCAPTCHA v2) are in the ADR.

**Client (commit `cc0d2d0`):**

- [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx) — deleted `<ReCAPTCHA>` widget, `recaptchaValue` state, the dev/test-user toggle banners, all `skipRecaptcha`/`isTestUser`/`devConfig` branches in `handleSubmit`, and the `setRecaptchaValue(null)` resets in the login/signup toggle. `signInWithEmail` is now called with just `(email, password)`.
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) — deleted the `verifyRecaptchaToken` helper, simplified `signInWithEmail(email, password)` (dropped the 3rd `recaptchaToken?: string` parameter), removed `httpsCallable` + `functions` imports (no other consumer in this file).
- [src/utils/development.ts](../src/utils/development.ts) — deleted entirely. `getDevConfig()` was 100% reCAPTCHA-related; the unused `isDevelopment()` and `isPrivateIP()` helpers had no consumers either.
- [package.json](../package.json) — removed `react-google-recaptcha@^3.1.0` and `@types/react-google-recaptcha@^2.1.9`. `bun install` removed 2 packages.
- [.env.example](../.env.example), [.env.production](../.env.production) — removed `VITE_RECAPTCHA_SITE_KEY` (and its preceding comment block in `.env.example`).
- [firebase.json](../firebase.json) CSP — trimmed `https://www.google.com` and `https://www.gstatic.com` from `script-src`, `connect-src`, `frame-src`. Kept `apis.google.com` (Firebase Auth Google popup), `fonts.gstatic.com` (Google Fonts), `googletagmanager.com` (GTM).

**Functions (commit `6d0e05a`):**

- Deleted `functions/src/recaptcha.ts` (126 lines including a recent uncommitted 2026-05-02 instrumentation patch capturing Google's `errorCodes` in `HttpsError.details`).
- [functions/src/index.ts](../functions/src/index.ts) — removed `export { verifyRecaptcha } from './recaptcha'`.
- `functions/src/config/index.ts` — removed `recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY')`. The other secrets (`encryptionKey`, `googleAdsClientSecret`, `metaAdsAppSecret`) remain.
- [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) — KEPT the `RECAPTCHA_SUCCESS` / `RECAPTCHA_FAILED` enum values with a `@deprecated 2026-05-17` comment. Historical `securityLogs/{id}` entries reference these types; admin `SecurityLogsPage` relies on the enum being exhaustive. No producer remains.
- `axios` (in `functions/package.json`) **not removed** — verified `googleAdsOAuth.ts`, `metaAdsOAuth.ts`, `suitpayPayment.ts`, `googleAdsOAuthV2.ts` all import it.

**Hygiene fix surfaced en route (commit `438449e`):**

- [functions/.gitignore](../functions/.gitignore) had an un-anchored `config/` rule that recursively ignored `functions/src/config/` — making the entire `defineSecret` manifest untracked. Removing the rule and force-adding `functions/src/config/index.ts` brings the canonical secrets manifest into version control for the first time. Public config only — secret VALUES live in Google Secret Manager; the file only references their names via `defineSecret`.

**Deploys + secret cleanup (both environments executed in the same session):**

- **`adsmart-web-dev`** — `firebase deploy --only functions` aborted with the expected non-interactive warning ("functions found in your project but do not exist in your local source code: verifyRecaptcha"). `firebase functions:delete verifyRecaptcha --region us-central1 --force` succeeded. `firebase functions:secrets:destroy RECAPTCHA_SECRET_KEY --force` destroyed version 1 and reported "No active secret versions left. Destroying secret RECAPTCHA_SECRET_KEY". `firebase functions:list` confirms `verifyRecaptcha` no longer present.
- **`adsmart-web`** — same sequence. `functions:delete` succeeded. The follow-up `firebase deploy --only functions` updated all 19 functions successfully **except `handleGoogleAdsCallbackWithSelection`**, which is a pre-existing OAuth callback configuration issue unrelated to reCAPTCHA — its previous revision remains active. `RECAPTCHA_SECRET_KEY@2` was destroyed (no other accessible versions; `firebase functions:secrets:access` confirms `DESTROYED state`). The handleGoogleAdsCallbackWithSelection deploy failure is tracked separately and does not block the reCAPTCHA work.

**Verification:**

- `bun run typecheck` clean across the monorepo.
- `bun run test` 61/61 web tests pass (no reCAPTCHA-specific tests existed).
- `bunx biome check` exits 0 — 6 pre-existing `useButtonType`/`noSvgWithoutTitle` warnings on social-login buttons, zero new warnings, zero errors.
- **Dev end-to-end smoke test (Chrome DevTools MCP):** login page renders without the reCAPTCHA iframe, console is empty, no requests to `google.com/recaptcha` / `gstatic.com/recaptcha`. Manual sign-in with admin email/password succeeded. `/admin/dashboard` rendered all three cards (Receita gerada / Usuários / Top integrações), the DateRangeFilter showed the default 30-day range, sparklines drew via recharts, and `getDashboardMetrics` returned HTTP 200 (4 calls observed — React StrictMode double-invoke + filter callback). Side effect: this validation unblocked Subprojeto 2 Task 18 Step 3, which had been blocked at "smoke test" since 2026-04-27 — the dashboard was likely fine after the index propagation but the reCAPTCHA login error prevented us from reaching it.
- **Prod end-to-end smoke test:** pending the prod hosting deploy (frontend bundle without the reCAPTCHA widget is not yet published). The callable side has been verified live via the dev test pattern; once hosting deploys, the login flow at `https://adsmart.app/login` will mirror dev.

---

## [2026-05-02] — Docs sweep: Subprojeto 2 surface graduated to "shipped" in conventions/docs

Closes the docs-sweep follow-up flagged by the [2026-05-01] Subprojeto 2 Task 18 entry. The dashboard callable + UI surface are now reflected in the conventions docs and per-feature contracts; no code change.

- **[AGENTS.md](../AGENTS.md):** the "Add an admin sub-page" row in the read-first map now points at `AdminLayout.tsx` (tab list) and notes the `React.lazy` pattern from `AdminDashboardPage.tsx` for heavy pages (charts, etc.). New row "Add an admin metrics callable" points at `getDashboardMetrics.ts` as the canonical example (admin gate, Zod input from `@adsmart/shared`, `Promise.allSettled` over labelled reads, BRT-anchored day bucketing).
- **[docs/QA-CHECKLIST.md](QA-CHECKLIST.md):** admin panel section bumped from 3 tabs to 4 tabs (Dashboard / Logs / Prices / Wallet) with `/admin` → `/admin/dashboard` as the new default redirect (spec R9). Added a dedicated "Dashboard tab" subsection with 11 manual QA items covering preset buttons, custom-range dialog, > 365d guard (client + server), card content, sparkline behavior, error-banner retry path, and the console-clean assertion (`error|fail|dashboard|Q[1-7]|FAILED_PRECONDITION|HttpsError|internal`). The pre-existing Security/Prices/Wallet items are preserved verbatim, just regrouped under per-tab headings.
- **[docs/API-CONTRACTS.md](API-CONTRACTS.md):** new `getDashboardMetrics` entry added after `getSecurityStats`. Documents the `onCall({ memory: '512MiB' })` config, admin gate, Zod schemas via `@adsmart/shared`, the `Promise.allSettled` orchestration over Q1–Q7, day-bucketing TZ, the `realCents = max(0, totalCents - grantedCents)` derivation, full input/output shapes, error codes (including the labelled `Dashboard query failures: Q<n>` message), and the required composite indexes / field overrides shipped in [firestore.indexes.json](../firestore.indexes.json).
- **[docs/DEPLOYMENT.md](DEPLOYMENT.md):** "Auth blocking triggers (Identity Platform)" section corrected — three references to the legacy `bootstrapUserWallet` name updated to `bootstrapUser` (renamed in the 2026-04-26 ADR-010 revision when the trigger was extended to seed both `users/{uid}` and `users/{uid}/wallet/current` in a single batched write). The link from `bootstrapUserWallet` to ADR-010's older anchor is replaced with the current anchor (`adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger`). Added a backstop sentence noting that both projects had Identity Platform enabled and the trigger deployed during the 2026-04-26 reconciliation.
- **[docs/ERROR-HANDLING.md](ERROR-HANDLING.md):** new subsection "Multi-read callables: labelled `Promise.allSettled` over `Promise.all`" added after the `instanceof HttpsError` re-throw pattern. Promotes the Subprojeto 2 Task 18 instrumentation (`fb2595e`) from incident-specific to a documented project convention for any callable orchestrating 3+ reads, with `getDashboardMetrics` as the canonical example.

What was deliberately NOT changed:

- **[docs/Decisions.md](Decisions.md):** ADR-010 already reads "Per-user state bootstrap" and the 2026-04-26 revision note already covers the rename. No new ADR for the labelled-allSettled pattern — it's a small convention, not an architectural decision; ERROR-HANDLING.md is the right home.
- **[docs/REFACTOR-PLAN.md](REFACTOR-PLAN.md):** Phases A–E already marked Completed at the header; no Subprojeto 2 content belongs there.
- **[docs/DATA-MODEL.md](DATA-MODEL.md):** dashboard reads from existing collections only; no new collection or shape was introduced. Field-level docs are unchanged.
- **Dead-code cleanup** (top-level `campaigns/{id}` + `reportTemplates/{id}` rules + backupScheduler config). Still pending production-data verification via `gcloud firestore` per the post-Phase-D follow-up. Out of scope for this sweep.

Verification: `bun run typecheck` not required (markdown-only). All updated docs render cleanly under the existing markdown conventions; cross-links resolve. Working tree was clean before the sweep; only docs files plus this CHANGES entry are modified.

---

### 2026-05-01 — feat(claude): Firebase Conventions Pack

Added enforcement tooling that moves AdSmart's Firebase conventions from passive docs to active tooling:

- 4 slash commands in `.claude/commands/` (firestore-rules-test, firestore-new-query, functions-new-callable, firebase-deploy)
- 3 agents in `.claude/agents/` (firestore-rules-reviewer, functions-security-reviewer, firestore-query-reviewer)
- 6 hooks in `.claude/settings.json` (3 PreToolUse blocks, 2 PostToolUse warns, 1 UserPromptSubmit inject)
- 7 Cursor rules in `.cursor/rules/` mirroring the same conventions
- Helper scripts in `scripts/firebase/` (test-rules.sh, safe-deploy.sh, 3 PreToolUse helpers, 1 UserPromptSubmit helper, context-snippet.txt)

Patterns validated against Firebase Functions v2 SDK + Firestore Security Rules + index docs (Context7) AND against actual project code (`reserveUserDocument.ts`, `getDashboardMetrics.ts`, `bootstrapUser.ts`, `config/index.ts`).

Spec: [docs/superpowers/specs/2026-05-01-firebase-conventions-design.md](superpowers/specs/2026-05-01-firebase-conventions-design.md).
Plan: [docs/superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md](superpowers/plans/2026-05-01-firebase-conventions-pack-plan.md).

---

## [2026-05-01] — Subprojeto 2 Task 18 closed: `getDashboardMetrics` 500 INTERNAL resolved (dev + prod deployed)

**Status:** Resolves the "Task 18 Step 3 — outstanding" blocker from the [2026-04-26] WIP entry below. The admin dashboard callable now returns 200 consistently. Function and indexes deployed to **both** `adsmart-web-dev` and `adsmart-web`. UI smoke green in dev (Cowork agent, 5/5 calls 200). UI smoke in prod is **deferred** until the next hosting deploy (see "Prod UI smoke deferred" below — the served prod bundle predates the dashboard route).

**Root cause confirmed**

Two-pronged: (1) `Promise.all` over the 7 reads in [functions/src/getDashboardMetrics.ts](../functions/src/getDashboardMetrics.ts) collapsed all rejections into a single opaque `INTERNAL` — making it impossible to know *which* of Q1–Q7 was failing from Cloud Logging (`details:''` on most rows). (2) The collectionGroup query `adAccounts.where('isActive','==',true)` (Q7) lacked a single-field exemption for `isActive` covering both COLLECTION and COLLECTION_GROUP scopes; the four prior Task 18 deploys (`064476f`, `936c9d1`, `04c3b37`, plus the initial 5-entry deploy) added composite orderings for `transactions` aggregates but missed this one. The instrumentation patch surfaced the real culprit on the next dev smoke.

**Commits this session (on `develop`)**

- `fb2595e` `feat(getDashboardMetrics): label all 7 reads via Promise.allSettled to surface per-query FAILED_PRECONDITION` — replaces `Promise.all` with `Promise.allSettled` over labelled queries Q1_allCreditsTotal_agg, Q2_grantedTotal_agg, Q3_txSnap, Q4_usersInRangeSnap, Q5_totalUsers_agg, Q6_activeTxSnap, Q7_adAccountsSnap. On any rejection, logs `[dashboard:fail:Q<n>]` with `error.code`/`message`/`details`/`stackHead` and throws `HttpsError('internal', 'Dashboard query failures: Q<n>[, Q<m>...]')` so the client message names the failing label(s) directly. Post-processing (revenue/users/integrations/sparklines) reorganized to consume the fulfilled tuple in the same order.
- `6bf62ec` `fix(firestore): add adAccounts.isActive fieldOverride for COLLECTION + COLLECTION_GROUP scopes` — single field-override entry covering ASC/DESC at COLLECTION scope and ASC at COLLECTION_GROUP. Resolves Q7's missing-index FAILED_PRECONDITION.

**Validation evidence**

- `cd functions && bun run typecheck` clean.
- `cd functions && bunx vitest run test/getDashboardMetrics.test.ts` 6/6 green.
- `cd functions && bun run build` produces a 0.78 MB bundle in `functions/deploy/`.
- Dev deploy (`adsmart-web-dev`): both `firestore:indexes` and `functions:getDashboardMetrics` succeeded; `Successful update operation.` for the function.
- Cowork dev smoke at `localhost:5173/admin/dashboard` (admin-logged): **5/5 calls 200** across ranges (load, 30d preset, 7d preset, 7d custom, 365d preset), durations 535–586 ms; response shape matches `GetDashboardMetricsOutputSchema` (revenue.realCents/creditsCents/sparkline, users.newCount/activeCount/totalCount/sparkline, integrations.byPlatform, range.days, generatedAt); console clean of `error|fail|dashboard|Q[1-7]|FAILED_PRECONDITION|HttpsError|internal` (only react-router future-flag warnings); custom-range UI works; `> 365` days client guard surfaces "Período não pode exceder 365 dias" inline in the modal AND the server-side guard in [`GetDashboardMetricsInputSchema.refine(...days <= MAX_RANGE_DAYS)`](../packages/shared/src/schemas/dashboardMetrics.ts#L14) is intact (defense-in-depth).
- Prod deploy (`adsmart-web`): both `firestore:indexes` and `functions:getDashboardMetrics` succeeded; **`Successful create operation.`** for the function (it had never existed in prod before — first time landed). Index propagation observed for ~90 s before declaring done.

**Prod UI smoke deferred**

The hosting bundle currently served at `adsmart-web.web.app` / `adsmart-web.firebaseapp.com` is `bc11f3` from **2025-08-03**. `origin/main` is at `f63daec` "limpeza" from `2026-03-03`. `develop` is **169 commits ahead of `main`**, and the entire admin dashboard refactor (Subprojeto 1+2) lives on `develop`. The `/admin/dashboard` route does not exist in the served bundle, so a UI smoke against either of the prod default URLs would 404. The custom domain `adsmart.app` was unmapped while site work is ongoing. The function and indexes ARE in prod and ready; the UI smoke will happen naturally when `develop` is merged to `main` and CI redeploys hosting (per [docs/DEPLOYMENT.md](DEPLOYMENT.md)). Until then, prod readiness is implied transitively by the dev smoke (same compiled bundle in `functions/deploy/`, same `firestore.indexes.json`).

**What is NOT shipped this session**

- `Promise.allSettled` instrumentation revert. The original plan called for a dedicated `chore(getDashboardMetrics): revert to Promise.all after Q-failures resolved` commit on Task 19. Holding off — the labelled-error pattern is a strict improvement over the silent-collapse anti-pattern of `Promise.all`, and the cost is ~60 lines of bookkeeping. Recommend keeping it. If the user still wants the revert, it lands in a follow-up commit.
- Frontend changes. UI was already complete on `develop` (Tasks 1–17). Only the server-side reads were re-shaped.
- Push to `origin/develop`. The two commits + this CHANGES.md update are local; user-controlled push.

**Cross-references**

- Live blocker entry that this resolves: `[2026-04-26] — Admin dashboard server + foundations landed (Subprojeto 2 — WIP)`, "Task 18 Step 3 — outstanding".
- Adjacent known issue not addressed: `[2026-05-01] — Known issue: verifyRecaptcha returns 500 on fresh login in dev` (out of scope; pre-existing).

---

## [2026-05-01] — Known issue: `verifyRecaptcha` returns 500 on fresh login in dev (out of scope, deferred)

**Status:** Discovered while running the Subprojeto 2 Task 18 dashboard smoke test in a profile-zerado Chrome (no persisted Firebase session). Pre-existing — not introduced by any commit in this session. Tracked here so it gets attacked separately. **No code change shipped for this bug.**

**Symptom**

- Login form (password flow) on `localhost:5173/login` against `adsmart-web-dev`.
- UI banner: "Falha na verificação de segurança".
- Network: `POST .../verifyRecaptcha` → `500 INTERNAL`.
- Console: `FirebaseError: Erro ao verificar ReCAPTCHA` originating at [src/contexts/AuthContext.tsx:93](../src/contexts/AuthContext.tsx#L93).
- Reproducible only on a **fresh** login (no Firebase session cookie). Existing logged-in browsers never hit `verifyRecaptcha` — their session token is reused — so the bug is silent in normal day-to-day use of dev.

**Call chain**

```
LoginPage.handleSubmit               src/pages/LoginPage.tsx:66
  → AuthContext.signInWithEmail      src/contexts/AuthContext.tsx:113
    → AuthContext.verifyRecaptchaToken  src/contexts/AuthContext.tsx:87
      → httpsCallable('verifyRecaptcha')  ← 500 here
        → functions/src/recaptcha.ts:16  (server)
```

Server flow: validate token → `checkRateLimit('anonymous','recaptcha_verify',10,5)` (writes `rateLimits/anonymous_recaptcha_verify` via Admin SDK) → `axios.post('https://www.google.com/recaptcha/api/siteverify', { secret: recaptchaSecretKey.value(), response: token })` → if `success===false` throws `failed-precondition` → `securityLogger.logEvent(RECAPTCHA_SUCCESS, ...)` → return.

**Why the client sees a generic message**

The catch-all in [functions/src/recaptcha.ts:64-84](../functions/src/recaptcha.ts#L64-L84) wraps every non-rate-limit error as `HttpsError('internal', 'Erro ao verificar ReCAPTCHA')`. Same anti-pattern as the dashboard's pre-`fb2595e` `Promise.all` catch-all — silently collapses the real cause. Server `console.error('Erro ao verificar ReCAPTCHA:', error)` carries the truth but it's only visible in Cloud Logging.

**Hypotheses ranked**

1. **(most likely) `RECAPTCHA_SECRET_KEY` secret missing or invalid in `adsmart-web-dev`** — `recaptchaSecretKey.value()` returns wrong/empty value, Google API replies `{success:false, "error-codes":["missing-input-secret"|"invalid-input-secret"]}`, `failed-precondition` is rethrown as `internal`. Defined via `defineSecret` in [functions/src/config/index.ts:23](../functions/src/config/index.ts#L23). The function has been redeployed several times in dev recently (5 rounds during Task 18) — secret must be versioned in Secret Manager and explicitly bound to `verifyRecaptcha`.
2. **`checkRateLimit` Firestore op fails** on `rateLimits/anonymous_recaptcha_verify` (every anonymous login fans into the same doc — contention point).
3. **`axios.post` to `google.com/recaptcha/api/siteverify` times out / network errors** on cold start.
4. **`securityLogger.logEvent(RECAPTCHA_FAILED, ...)` throws inside the catch** — least likely (the logger has internal try/catch at [functions/src/securityLogger.ts:111-115](../functions/src/securityLogger.ts#L111-L115)), and even if it threw, the symptom would be unchanged.

**To resolve (when picked up)**

1. Confirm hypothesis #1: `gcloud secrets versions list RECAPTCHA_SECRET_KEY --project=adsmart-web-dev` (or Firebase Console → Functions → `verifyRecaptcha` → Secrets tab). If missing/empty: `firebase functions:secrets:set RECAPTCHA_SECRET_KEY --project adsmart-web-dev`, then redeploy `verifyRecaptcha`.
2. Repeat the secret check on `adsmart-web` (prod) defensively — no end-user has reported broken login, so prod is probably fine, but worth a 1-min audit.
3. Pull `bunx firebase-tools functions:log --only verifyRecaptcha --project adsmart-web-dev` to read the real `console.error` and confirm hypothesis before changing anything. If the log says `missing-input-secret` / `invalid-input-secret` → hypothesis #1 confirmed. If it says `ECONNRESET` / `ETIMEDOUT` → hypothesis #3. If it's a Firestore error on `rateLimits` → hypothesis #2.
4. **Add labelled-catch instrumentation** to `recaptcha.ts:64-84` in the same shape as the dashboard's `[dashboard:fail:Q<n>]` pattern (commit `fb2595e`): log `error.code` + `error.message` distinctly before re-throwing as `internal`. Same hygiene improvement — never lose visibility on opaque server errors again.

**Out of scope for this session**

This session is Subprojeto 2 Task 18 — dashboard fix only. The `verifyRecaptcha` bug pre-existed (commits `fb2595e` and `6bf62ec` from this session do not touch `recaptcha.ts`, `rateLimiter.ts`, `securityLogger.ts`, `AuthContext.tsx`, `LoginPage.tsx`, nor any Secret Manager binding).

---

## [2026-04-26] — Admin dashboard server + foundations landed (Subprojeto 2 — WIP)

**Status:** Tasks 1-17 of 20 complete + Task 18 (deploy) PARTIAL — dev deploy of indexes and callable landed but smoke test FAILS. The dashboard at localhost → adsmart-web-dev callable returns `INTERNAL` (Cloud Logging shows `9 FAILED_PRECONDITION` with empty `details`). Browser-side investigation via the Cowork agent decoded `create_composite=` URLs from the few errors that DID carry full `details` and identified two missing index orderings; those were also deployed (commit `04c3b37`). User reported the dashboard STILL fails after that deploy. As of session-end 2026-04-27, the issue is unresolved — see "Task 18 Step 3 — outstanding" below for the full state. No prod deploy attempted yet. No docs graduated to "shipped".

**Task 17 verification gate (2026-04-26):** `bun run typecheck` clean across the monorepo. `bun run test` 61/61 web tests pass. `cd packages/shared && bun run test` 49/49 pass. `cd functions && bunx vitest run test/getDashboardMetrics.test.ts` 6/6 pass for the Subprojeto 2 callable. Pre-existing `securityLogger.test.ts` and other emulator-dependent functions tests fail without the Firestore emulator running (documented gating from earlier subprojetos — not regressions introduced by Subprojeto 2). `bun run lint` exits 0 with 4 pre-existing `useExhaustiveDependencies` warnings on `src/pages/admin/{SecurityLogsPage,PricesConfigPage,WalletAdminPage}` from Subprojeto 1; zero new warnings introduced by Subprojeto 2. **`getDashboardMetrics` is exported in `functions/src/index.ts` but NOT yet invoked from the client and NOT yet deployed.** Final docs sweep + AGENTS.md/CLAUDE.md/QA-CHECKLIST.md/DATA-MODEL.md/DEPLOYMENT.md updates land at Task 19 once the feature ships end-to-end.

What's committed so far on `develop`:

- **Deps.** `recharts@^3.8.1`, `react-day-picker@^9.14.0`, `@radix-ui/react-popover@^1.1.15` added to root [package.json](../package.json) (commit `75fbc25`).
- **Shared Zod contracts.** [packages/shared/src/schemas/dashboardMetrics.ts](../packages/shared/src/schemas/dashboardMetrics.ts) defines `GetDashboardMetricsInputSchema` (ISO datetime range, refines: `endDate >= startDate`, ≤ 365 days) and `GetDashboardMetricsOutputSchema` (revenue real/credits + sparkline; users new/active/total + sparkline; integrations.byPlatform `google_ads | meta_ads`). Sparkline `date` fields enforce `YYYY-MM-DD`. Constant `DASHBOARD_METRICS_MAX_RANGE_DAYS = 365` exported. 9 tests (commits `73f96e1`, `198623e`).
- **Pure helpers.** [src/pages/admin/dashboard/getDateRangeFromPreset.ts](../src/pages/admin/dashboard/getDateRangeFromPreset.ts) maps `'today'|'7d'|'30d'|'60d'|'90d'|'180d'|'365d'` to ISO ranges. [formatBRL.ts](../src/pages/admin/dashboard/formatBRL.ts) formats integer cents → `R$ 1.234,56` with `Intl.NumberFormat('pt-BR', { currency: 'BRL' })`. Both fully tested. (commits `1286845`, `5d937cb`).
- **Firestore composite indexes.** Five new entries in [firestore.indexes.json](../firestore.indexes.json) for collectionGroup `transactions` (3 variants — type+status+createdAt, type+status+adminAction+createdAt, createdAt only), collectionGroup `adAccounts` (isActive+platform), and collection `users` (createdAt). **Not yet deployed** — Task 18 deploys to dev then prod (commit `5dad3aa`).
- **Cloud Function `getDashboardMetrics`.** [functions/src/getDashboardMetrics.ts](../functions/src/getDashboardMetrics.ts) — admin-only callable (custom claim OR allowlist). Auth typed via `CallableRequest['auth']`. `onCall({ memory: '512MiB' }, …)`. All 7 reads run via `Promise.all`. Materialized snapshots use `.select(...)` projections. Sparklines bucketed by `America/Sao_Paulo` day-string via a BRT-anchored `enumerateDays` (fix in `7dbc5f2` resolved a UTC/BRT cusp bug that dropped the last day of a UTC-midnight-bounded range). `realCents = max(0, totalCents - grantedCents)` derives real revenue from total minus admin-issued credits — bypasses Firestore's lack of `!=` aggregation operator. 6 tests passing locally (5 auth/validation + 1 emulator-gated payload-shape skip when emulator absent). Exported in [functions/src/index.ts](../functions/src/index.ts) (commits `ae2b494`, `198623e`, `7dbc5f2`).
- **shadcn `<Popover>` + `<Calendar>` wrappers.** [src/components/ui/popover.tsx](../src/components/ui/popover.tsx) is a thin Radix wrapper (`Popover`, `PopoverTrigger`, `PopoverContent` with `Portal` + zoom/fade transitions). [src/components/ui/calendar.tsx](../src/components/ui/calendar.tsx) wraps `react-day-picker@^9.14.0` with v9 API: `locale={ptBR}` from `react-day-picker/locale`, single `Chevron` component (orientation prop) instead of v8's `IconLeft`/`IconRight`, and v9 `classNames` keys (`month_caption`, `month_grid`, `weekdays`/`weekday`/`week`, `day`/`day_button`, `selected`/`today`/`outside`/`disabled`/`range_*`/`hidden`, `button_previous`/`button_next`). Plan's snippet originally used v8 keys; corrected via Context7 lookup before implementation. Both files pass typecheck and Biome with no behavioral tests (pure pass-through to Radix/DayPicker — visual coverage lands with Task 9 onward) (commit `2adf62d`).
- **`DateRangeFilter` component.** [src/pages/admin/dashboard/DateRangeFilter.tsx](../src/pages/admin/dashboard/DateRangeFilter.tsx) renders the seven preset buttons (`today | 7d | 30d | 60d | 90d | 180d | 365d`) plus a `Custom` `<Dialog>` that mounts the `<Calendar mode="range">` for an arbitrary picker. Plan originally typed `selected` / `onSelect` as `any` (drafted against react-day-picker v8); corrected against the installed v9 type surface — `selected?: DateRange | undefined` and `onSelect: OnSelectHandler<DateRange | undefined>`. The local `./getDateRangeFromPreset` already exports its own `DateRange` (`{startDate: string; endDate: string}` ISO), so the v9 type is imported as `DPDateRange` to avoid the name clash. Range cap of `DASHBOARD_METRICS_MAX_RANGE_DAYS` (365) enforced client-side as a defense-in-depth layer over the server validation. Custom range is UTC-normalized (`setUTCHours(0,0,0,0)` start, `setUTCHours(23,59,59,999)` end) before being emitted as ISO strings — matches the existing `getDateRangeFromPreset` helper's TZ semantics. Two unit tests (render-all-presets, emit-on-click) green; dialog interaction is intentionally deferred to the page-level test in Task 13 because Radix portal mounts under jsdom need the full page setup (commit `d23a3ff`).
- **`RevenueCard` component.** [src/pages/admin/dashboard/RevenueCard.tsx](../src/pages/admin/dashboard/RevenueCard.tsx) renders the two BRL totals (real + credits) side-by-side and a `recharts@^3.8.1` `<AreaChart>` sparkline of `realCents` over the range's day buckets. Uses `Intl.NumberFormat('pt-BR', {currency:'BRL'})` via the `formatBRL` helper for both totals and the Tooltip formatter. Gradient fill via `<linearGradient id="revenue-real">` over `hsl(var(--primary))` — token-driven so it switches with light/dark theme. Sparkline plots only `realCents` (not credits); the credits total is shown as a number only — matches spec R1. Two unit tests pass (BRL formatting + zero-data edge case); recharts is mocked via stub components so jsdom doesn't need a real layout engine. Pre-flight verified `recharts@^3.8.1` named exports (`ResponsiveContainer`, `AreaChart`, `Area`, `Tooltip`) and the new wider `Tooltip.formatter` signature `(value, name, item, index, payload)` is structurally compatible with the plan's narrower `(value: number) => …` lambda. No deviations from plan beyond Biome's auto-import-sort (commit `f8f768d`).
- **`UsersCard` component.** [src/pages/admin/dashboard/UsersCard.tsx](../src/pages/admin/dashboard/UsersCard.tsx) is the second card — a 3-column grid of `newCount`/`activeCount`/`totalCount` plus a `recharts` `<AreaChart>` sparkline of `newCount` over the same day buckets. Uses the default `<Tooltip />` (no formatter) since these are integer counts, not currency. Gradient `id="users-new"` (distinct from RevenueCard's `revenue-real` to avoid SVG defs collision when both cards are mounted on the same page in Task 13). Mirrors the RevenueCard pattern exactly — same outer container classes, same `bg-surface border border-border rounded-lg p-6 space-y-4` shell, same `Users` lucide icon, same h3 title pattern. One unit test (renders all three counts) green; recharts mock omits `XAxis`/`YAxis` since the component doesn't import them. No deviations from plan beyond Biome's auto-import-sort (commit `a2902bc`).
- **`IntegrationsCard` component.** [src/pages/admin/dashboard/IntegrationsCard.tsx](../src/pages/admin/dashboard/IntegrationsCard.tsx) is the third card — a vertical list of `{platform → distinctUserCount}` rows plus a horizontal `recharts` `<BarChart layout="vertical">` (axes hidden, solid `hsl(var(--primary))` bars, right-rounded corners via `radius={[0, 4, 4, 0]}`). NOT a sparkline / NOT range-bucketed: per spec R3 the integrations metric is a snapshot, not a time series — distinct active users per platform across the live database state. Empty-state branch: when `byPlatform.length === 0`, renders a `text-muted-foreground` paragraph instead of the chart, satisfied by the second unit test. Two tests pass; recharts mock includes `Cell` defensively even though no per-bar coloring is wired yet. No deviations from plan beyond Biome formatting (commit `f5c074c`).
- **i18n batch — `admin.dashboard.*` + `admin.nav.dashboard`.** [src/locales/pt-BR.json](../src/locales/pt-BR.json), [src/locales/en.json](../src/locales/en.json), [src/locales/es.json](../src/locales/es.json) gain a new `admin.nav.dashboard` (Dashboard / Dashboard / Panel) and a full `admin.dashboard.*` subtree: title, ranges (today + 7/30/60/90/180/365 + custom), revenue (title + real + credits), users (title + new + active + total), integrations (title + empty + platforms.google_ads + platforms.meta_ads), errors (loadFailed + retry + invalidRange + rangeTooLong). The shared `Admin` interface in [src/locales/types.ts](../src/locales/types.ts) was mirrored so the `as Translations` casts in [LanguageContext.tsx](../src/contexts/LanguageContext.tsx) continue to enforce the structural shape — adding the keys to JSON without typing them would silently allow drift between locales. Plan didn't mandate the `types.ts` update but the project convention from Subprojeto 1 (typed `Admin` interface mirroring every namespace) makes it required for type-safety. `bun run typecheck` clean, `bun run test` 61/61 green (commit `bb0ff5c`).
- **`App.tsx` routing — `/admin/dashboard` registered + `/admin` redirect + lazy code-split.** [src/App.tsx](../src/App.tsx) replaces the admin-routes block: index redirect changes from `<Navigate to="security">` to `<Navigate to="dashboard">` (spec R9), a new `path="dashboard"` child route renders `<AdminDashboardPage />`, and the page is loaded via `React.lazy(() => import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))` wrapped in `<Suspense fallback={null}>` — applies the Task-1 code-review carry-over so recharts (3.x) + d3-vendor + redux-toolkit transitive deps ship in their own chunk and don't bloat first paint of the rest of the app. The `.then((m) => ({ default: ... }))` re-shape is required because `AdminDashboardPage` is a NAMED export (not default). Other admin pages (`SecurityLogsPage`, `PricesConfigPage`, `WalletAdminPage`, `AdminLayout`) stay as eager imports — only the dashboard pulls recharts. `Suspense fallback={null}` is intentional: the page already renders its own `DashboardSkeleton` on initial mount, so a Suspense fallback that pulls the skeleton into the main chunk would defeat the code-split. Brief blank during chunk fetch (~50-200ms) is acceptable. **Pre-existing typecheck regression in [`RevenueCard.tsx`](../src/pages/admin/dashboard/RevenueCard.tsx) (Task 10) surfaced during this task's typecheck pass:** recharts 3.x's `Tooltip.formatter` signature is `(value: ValueType | undefined, …) => ReactNode` where `ValueType = number | string | ReadonlyArray<…>`, NOT `(value: number) => string` as the Task-10 plan assumed. TS contravariance rejects the narrower lambda. Fixed in the same task by dropping the annotations and adding a defensive `typeof value === 'number' ? value : 0` coercion in the formatter and `String(label ?? '')` in the labelFormatter — runtime behavior identical because `realCents` is always a number in the series, but the wider type now compiles cleanly. (commits `5be72d0`, `4b52206`).
- **`AdminLayout` adds Dashboard tab.** [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) prepends `{ to: 'dashboard', icon: BarChart3, key: 'dashboard' as const }` as the first entry of the `tabs` array — Dashboard becomes the leftmost tab, ahead of Security / Prices / Wallet, matching spec R9 (dashboard is the new default landing). Surgical edit — only the import line (added `BarChart3`) and the `tabs` const changed; JSX, NavLink classes, heading, and `MainLayout` wrapper untouched. The component already iterated tabs via `tabs.map(...)` so no JSX changes were needed. The companion test [src/pages/admin/AdminLayout.test.tsx](../src/pages/admin/AdminLayout.test.tsx) was rewritten to cover the four-tab world: hrefs include `/admin/dashboard`, the active-route assertion targets `/admin/dashboard`, and the Outlet test still renders the `prices` child as the canonical "active route renders its content" assertion. The `admin.nav.dashboard` i18n key is intentionally NOT added in this commit — Task 16 batches all i18n insertions in one go; the passthrough mock in tests means the rendered fallback is the literal key string for now (commit `abffbd0`).
- **`AdminDashboardPage` + `DashboardSkeleton`.** [src/pages/admin/AdminDashboardPage.tsx](../src/pages/admin/AdminDashboardPage.tsx) wires everything together: title row with `BarChart3` icon + `DateRangeFilter` + a 3-state body (`loading → <DashboardSkeleton />`, `error → red-bordered banner with retry button`, `data → 1/2/3-col responsive grid of RevenueCard + UsersCard + IntegrationsCard`). Default range on mount is `getDateRangeFromPreset('30d')` via lazy `useState` initializer (spec R8). The callable invocation lives in a stable `useCallback([])` `fetchMetrics` and the `useEffect` fires on `[range, fetchMetrics]` so changing the range triggers a refetch automatically. Response is schema-validated client-side via `GetDashboardMetricsOutputSchema.safeParse(result.data)` — defense-in-depth on top of the server's Zod validation, so any contract drift surfaces as the same generic `loadFailed` error. The error banner uses literal Tailwind reds (`border-red-200 / dark:border-red-900 / bg-red-50 / dark:bg-red-900/20 / text-red-700 / dark:text-red-300`) since the design system has no `text-error` token (consistent with how `DateRangeFilter` renders its inline validation messages). The skeleton mirrors the cards' shell (`bg-surface border border-border rounded-lg p-6 space-y-4 animate-pulse`) so the layout doesn't shift when data arrives. Two page-level tests pass: success path (waits for the three card titles) and failure path (waits for the loadFailed banner + retry button). The test mocks `firebase/functions.httpsCallable` to return a function that resolves/rejects based on `callableMock`, mirroring the `HttpsCallableResult` shape (`{ data: {...} }`). Lazy `React.lazy` wrapping of this page is intentionally deferred to Task 15 (routing) per the controller's review carry-over to keep recharts + d3 transitive deps off the first paint of the rest of the app (commit `c2b3b49`).

**Task 18 Step 3 — outstanding (the live blocker):**

Three deploys to `adsmart-web-dev` have happened during Task 18:
- `firestore:indexes` first deploy at session start (Task 18 Step 1) — initial 5 entries.
- `functions:getDashboardMetrics` first deploy (Task 18 Step 2) — function created in us-central1 successfully (Node 22, 512MiB, callable).
- `firestore:indexes` second deploy (commit `064476f`) — replaced two redundant single-field composites with `fieldOverrides` (`transactions.createdAt` ASC+DESC in COLLECTION + COLLECTION_GROUP scopes); this restored the COLLECTION DESC that wallet listeners need (auto-built indexes were silently overridden by the first fieldOverride attempt).
- `firestore:indexes` third deploy (commit `936c9d1`) — added `amount` field to the existing aggregate-target composites because `AggregateField.sum('amount')` requires the indexed field.
- `firestore:indexes` fourth deploy (commit `04c3b37`) — added two NEW composites in the field orderings Firestore's planner actually picks for the aggregate queries: `status+type+createdAt+amount` (Q1) and `adminAction+status+type+createdAt+amount` (Q2). Decoded from `create_composite=` URLs in Cloud Logging by the Cowork browser-side investigation.

After all four index deploys completed and the new indexes finished building (verified Ativado in Firebase Console), the user retested at `localhost:5173/admin/dashboard` and the **callable still returns 500 with `INTERNAL`**. Cloud Logging continues to show `9 FAILED_PRECONDITION` from `AggregateQuery._getResponse` with empty `details: ''` on most errors and full `create_composite=` URLs on others — so an aggregate path is still hitting an unmet index requirement. The investigation has NOT identified which composite is still missing as of session-end 2026-04-27.

Possible causes to investigate next session (none confirmed):
1. Firestore propagation delay across regions for the most recent index — the Console says Ativado but the function may still be hitting a cached node that doesn't see it. Mitigation: wait 10-30 min more and retest; if still broken, force a function cold start by re-deploying it.
2. A third aggregate-query plan path that `create_composite=` decoder hasn't yet captured — the 91 errors in Cloud Logging may include a third URL distinct from T1/T2 that the Cowork investigation didn't surface (it grouped T3/T4 as already-resolved at decode time but didn't enumerate every distinct URL across all error lines).
3. A shape constraint on `AggregateField.sum` indexes that Firestore added in a recent release — `__name__ ASC` is conventionally appended; the deployed composites match this, but there could be a regional or per-DB nuance.
4. A possibility that the function was deployed BEFORE the latest indexes and is using a cached query plan that pre-dates the new indexes; a redeploy of `getDashboardMetrics` (with no code change, or with a small instrumentation patch) would force a cold-start that picks up the latest index registry.

What's still missing before this entry can graduate to "shipped":

- Resolve the dashboard 500 in dev (Task 18 Step 3 above).
- Smoke test custom-range dialog, range > 365d guard, force-error retry — currently dashboard never reaches the data state to even attempt these.
- Deploy indexes + callable to prod (Task 18 Step 4) — blocked on Step 3 OK.
- Final docs sweep — AGENTS.md, CLAUDE.md, QA-CHECKLIST.md, DATA-MODEL.md, DEPLOYMENT.md additions for the new dashboard surface (Task 19), only meaningful after Step 3 OK.
- Memory update (Task 20) — done incrementally during the session; final pass after Step 3 OK.

Plan: [docs/superpowers/plans/2026-04-26-admin-dashboard-plan.md](superpowers/plans/2026-04-26-admin-dashboard-plan.md).
Spec: [docs/superpowers/specs/2026-04-26-admin-dashboard-design.md](superpowers/specs/2026-04-26-admin-dashboard-design.md).

---

## [2026-04-26] — Admin panel IA refactor (Subprojeto 1)

Single-page tabbed `AdminPanel.tsx` (569 lines) replaced by nested routes under a shared `AdminLayout`. Same Cloud Function calls, same UI behavior — IA prep for the four follow-up admin features (dashboard, users, wallet ops, logs UX).

- **`/admin` → nested routes.** [src/App.tsx](../src/App.tsx) declares a parent `<Route path="/admin">` guarded by `AdminRoute` once at the parent level. Children: `index → Navigate to="security"`, `security`, `prices`, `wallet`. Bookmarks at `/admin` keep working via the redirect.
- **Per-page extraction.** New [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) owns the page title, the `NavLink`-based sub-nav, and `<Outlet />`. New [SecurityLogsPage](../src/pages/admin/SecurityLogsPage.tsx), [PricesConfigPage](../src/pages/admin/PricesConfigPage.tsx), [WalletAdminPage](../src/pages/admin/WalletAdminPage.tsx) each own their own state + Firebase callable. Old `AdminPanel.tsx` deleted (`grep` confirmed zero remaining importers).
- **i18n `admin.*` namespace landed in pt-BR/en/es** with a typed [src/locales/types.ts](../src/locales/types.ts) `Admin` interface. Ten sub-page keys + nav + per-page sub-namespaces + shared messages.
- **Cleanup.** The "Debug Info" block (email/UID/provider/displayName) and verbose `console.log('🔍 === DEBUG SECURITY STATS ===')` lines that were diagnostic for Subprojeto 0's CORS/404 incident are removed. `console.error` in catch handlers stays — that's the project convention for failed callables.
- **Test coverage.** New `src/pages/admin/AdminLayout.test.tsx` (3 cases) covers the NavLink hrefs, the `<Outlet />` rendering, and the active `aria-current="page"` attribute. Behaviour-preserving extracts (`SecurityLogsPage`, `PricesConfigPage`, `WalletAdminPage`) are not unit-tested — the underlying functions weren't tested before either, and typecheck plus manual smoke covers the regression surface.
- **Known follow-up.** Biome flags two `useExhaustiveDependencies` warnings on the new pages' `useEffect(() => { void load() }, [])` patterns. Same pattern existed in the old `AdminPanel.tsx`. Suppression comments via `// biome-ignore` aren't being honoured by Biome 2.x in that position; the warnings are non-blocking and will be addressed by a small refactor (move `load` body inline into the effect, or `useCallback` it) in a follow-up commit.
- **No new dependencies, no functions changes, no DB changes.**

Commits: `fbea827` (i18n foundation), `da61594` (AdminLayout), `e264aec` (SecurityLogsPage), `1551a64` (PricesConfigPage + WalletAdminPage), `8980070` (route surgery + delete AdminPanel.tsx).

---

## [2026-04-26] — Production reconciled (Subprojeto 0.5 of admin-panel overhaul)

Sanity diff at end of Subprojeto 0 surfaced that `adsmart-web` (production) was missing two functions present in source: `bootstrapUser` (the ADR-010 auth blocking trigger) and `reserveUserDocument` (the ADR-012 CPF/CNPJ uniqueness callable). Neither had ever been deployed to prod, meaning two security/correctness invariants documented in source were not actually in force in production. Reconciliation landed in two passes.

- **Pass 1 — `reserveUserDocument` cleanly, `bootstrapUser` dormant.** Deploy `bunx firebase-tools deploy --only functions:bootstrapUser,functions:reserveUserDocument --project adsmart-web` succeeded for the callable but failed the Identity Platform wiring step for the trigger: `OPERATION_NOT_ALLOWED : Blocking Functions may only be configured for GCIP projects`. The Cloud Function was created in prod (visible in `firebase functions:list`) but no signup invoked it because the IdP `blockingFunctions.triggers.beforeCreate` config was never updated.
- **Pass 2 — Identity Platform enabled, `bootstrapUser` redeployed and wired.** Project owner enabled Identity Platform on `adsmart-web` via Firebase Console → Authentication → Settings → "User actions" tab (one-time, irreversible). Both blocking-function dropdowns confirmed at `None` (no orphan references — prod was clean since it had never had the pre-rename `bootstrapUserWallet`). Redeploy `bunx firebase-tools deploy --only functions:bootstrapUser --project adsmart-web` succeeded with no IdP error this time. `firebase functions:list --project adsmart-web` confirms `bootstrapUser` is registered with trigger type `providers/cloud.auth/eventTypes/user.beforeCreate` — same shape as dev. Both ADR-010 (server-side user/wallet seeding) and ADR-012 (atomic CPF/CNPJ uniqueness) are now in force in production.
- **Confirmed: prod was empty of users.** Project owner confirmed no production users existed at reconciliation time, eliminating the userDocuments backfill concern entirely (no legacy CPFs to index). The "userDocuments backfill needed for legacy users" risk that this entry originally flagged does not apply.
- **Dev console state worth noting.** The dev (`adsmart-web-dev`) Identity Platform Console showed a "Function Deleted" reference in `beforeCreate` earlier in the session — leftover from the `bootstrapUserWallet` → `bootstrapUser` rename in the morning's commits. The v2-source-defined `bootstrapUser` trigger is correctly wired (verified via `firebase functions:list` showing `providers/cloud.auth/eventTypes/user.beforeCreate`), so the legacy Console UI showing the old reference is cosmetic — it predates the rename and the v2 SDK didn't replace it on the "update" redeploy. If desired, set the dev Console dropdown to `None` and save to clear the stale reference; behavior is unaffected because the actual IdP config already points at the live `bootstrapUser` URL.
- **No data was modified in production.** Only the two function deploys. Existing users (none), transactions, wallets are untouched. Database state across both environments is identical to before this entry except for the new callable and trigger wiring.

---

## [2026-04-26] — Dev environment reconciled (Subprojeto 0 of admin-panel overhaul)

First step of the staged admin-panel overhaul (subprojects 0→5 documented in the conversation). Subprojeto 0 was scoped to **operational reconciliation only** — no front-end or function-source changes — to unblock testing of the four follow-up subprojects in dev.

- **Drift confirmed.** `bunx firebase-tools functions:list --project adsmart-web-dev` showed only 3 of the 21 deployable callables in source: `bootstrapUser`, `getPublicProductPrices`, `reserveUserDocument`. Probe via `curl` returned HTTP 404 on `getSecurityStats`, `getProductPrices`, `addUserCredits` — Chrome was surfacing the missing-function 404s as CORS errors in DevTools, matching the pattern documented in the dev-environment-drift memory.
- **`productPrices` seeded.** Four default documents (`google_lancamento` / `meta_lancamento` at R$10, `google_negocio_local` / `meta_negocio_local` at R$5) inserted via the Firebase MCP plugin against `adsmart-web-dev`'s Firestore. Schema matches [priceManager.ts](../functions/src/priceManager.ts) `DEFAULT_PRICES`.
- **Functions deploy fix: `.env` ↔ `defineSecret` overlap.** First full functions deploy failed for the 8 OAuth callables with `Secret environment variable overlaps non secret environment variable: GOOGLE_ADS_CLIENT_SECRET / META_ADS_APP_SECRET` (Cloud Functions Gen2 rejects a name being declared as both a Secret Manager binding and a plain env var). Root cause: leftover lines in `functions/.env` that pre-dated the migration to `defineSecret`. Fix: removed the two duplicate `*_SECRET` lines from `functions/.env` (gitignored — never in version control). The non-secret OAuth IDs (`GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `META_ADS_APP_ID`, redirect URIs) stay in `.env` because the source reads them via `process.env`.
- **Side benefit of the .env fix.** The two secret values are no longer baked into the deployed Cloud Function runtime environment — they're now **only** in Secret Manager (`defineSecret('GOOGLE_ADS_CLIENT_SECRET')` / `defineSecret('META_ADS_APP_SECRET')`), which is the ADR-011 invariant.
- **Rules + indexes redeployed.** Both already in source; deploy command was needed because dev had drifted. No rule/index content change.
- **Final state.** All 21 deployable callables listed by `firebase functions:list --project adsmart-web-dev` and reachable via `curl` (admin functions return 401 without auth, OAuth functions return 403, public ones 200 — all expected). No orphan `bootstrapUserWallet` (rename was already clean).
- **Production not touched.** A read-only `diff` between dev and prod function lists was performed to surface any drift on prod side; reported separately to project owner — production deploy stays on the CI pipeline as designed.
- **Doc updates.** [DEPLOYMENT.md](DEPLOYMENT.md) gains the "Reconciling dev environment drift" section (diagnose / reconcile / seed `productPrices` / sanity-check parity). The `dev_environment_drift` memory was updated to mark the reconciliation as complete on 2026-04-26 and reference the new procedure.

Required follow-up (out of scope for Subprojeto 0, tracked for the upcoming subprojects):
- Subprojeto 1: refactor the admin panel from 3 tabs to a sidebar + sub-routes (`/admin/dashboard`, `/admin/users`, `/admin/wallet`, `/admin/prices`, `/admin/security`).
- Subprojeto 4: replace the orphan-prone "no UI button to seed prices" workflow with a one-click reseed in the new prices page.

---

## [2026-04-26] — CPF/CNPJ uniqueness + immutability + OAuth-aware password UI (ADR-012)

Three product requirements landed together: documents must be unique across users, documents must be immutable after first save, and OAuth-only accounts (Google/Facebook signups) must use a "create password" flow rather than "change password" until they have an email/password provider attached.

- **Reservation callable.** New [functions/src/reserveUserDocument.ts](../functions/src/reserveUserDocument.ts) — auth-required v2 callable. Validates CPF/CNPJ check digits server-side, then runs a Firestore transaction over `userDocuments/{normalizedDoc}` + `users/{uid}`. Throws `already-exists` (different uid owns the doc), `failed-precondition` (caller already has a different doc), or `invalid-argument` (bad format). Idempotent for repeated reservations of the same number by the same caller.
- **Uniqueness index.** New collection `userDocuments/{normalizedDoc}` where the doc ID is the digits-only normalization of the CPF/CNPJ — write conflicts on the path itself. [firestore.rules](../firestore.rules) `read: if owner via userId field` + `write: if false`. Documented in [DATA-MODEL.md](DATA-MODEL.md) as a top-level collection.
- **Immutability rule.** [firestore.rules](../firestore.rules) `users/{userId}` update rule grew a `documentLocked()` helper that rejects any write attempting to change `documentType` or `documentNumber` after they were set to non-empty values. Defense in depth — even bypassing the callable can't mutate the user doc.
- **SettingsPage UX.** [src/pages/SettingsPage.tsx](../src/pages/SettingsPage.tsx) tracks `documentLocked` from the Firestore snapshot. Locked state disables the CPF/CNPJ radios and the text input (`disabled + readOnly`), shows a hint line "O documento não pode ser alterado após o cadastro." `handleSaveProfile` invokes the callable only on first save; subsequent saves only update `name`/`phone`. Friendly toast mapping for `functions/already-exists` etc.
- **AuthContext exposes `hasPasswordProvider`.** Derived from `user.providerData.some(p => p.providerId === 'password')`. Stays reactive across signups and provider links.
- **Password section becomes create-vs-change.** When `!hasPasswordProvider`, the form drops the `currentPassword` field, the title flips to "Criar senha", the description explains the OAuth context, and `handleChangePassword` uses `linkWithCredential(user, EmailAuthProvider.credential(email, newPassword))`. After successful link the provider data refreshes and the same form auto-converts to the "alterar senha" flow on next render.
- **Doc updates.** New [ADR-012](Decisions.md#adr-012-cpfcnpj-uniqueness--immutability-via-callable--uniqueness-index) covers the reservation pattern + alternatives considered. [DATA-MODEL.md](DATA-MODEL.md) adds the `userDocuments` section + the `documentType`/`documentNumber` immutability paragraph in `users/{uid}`. [CLAUDE.md](../CLAUDE.md) gains "CPF/CNPJ uniqueness + immutability" and "Password vs OAuth providers" sections so future agents don't reintroduce client-side document writes or single-form password handling.

Required deploys: `firebase deploy --only firestore:rules,functions:reserveUserDocument --project adsmart-web-dev`. The callable is auth-only — no `gcloud run services add-iam-policy-binding` needed (private invoker is correct, the Firebase CallableContext propagates the auth token).

---

## [2026-04-26] — bootstrapUserWallet → bootstrapUser: also seed users/{uid}

Same-day extension of [ADR-010](Decisions.md#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) after surfacing a parallel "Missing or insufficient permissions" symptom in [SettingsPage](../src/pages/SettingsPage.tsx) — root cause: `AuthContext.signUp` only created the Firebase Auth user, never the `users/{uid}` doc, so the first profile save fell into the `create` rule path which requires `createdAt == request.time`.

- **Trigger renamed and extended.** [functions/src/bootstrapUserWallet.ts](../functions/src/bootstrapUser.ts) → [functions/src/bootstrapUser.ts](../functions/src/bootstrapUser.ts). Single batched Admin SDK write seeds `users/{uid}` (`email`, `createdAt`, `updatedAt`) AND `users/{uid}/wallet/current` (`balance: 0`, `currency`, `updatedAt`). Wallet still validated through `UserWalletSchema`. User doc intentionally minimal — name/phone/document fields filled in by SettingsPage on first save (now hits the `update` rule path).
- **SettingsPage.handleSaveProfile simplified.** Removed the read-first `setDoc(merge:true)` workaround that had landed earlier today. Now uses `updateDoc({...profile, updatedAt: serverTimestamp()})` directly — `email`/`createdAt` aren't sent so the `update` rule's immutability checks pass trivially. Net delta vs. earlier in the day: -8 lines, -1 round trip.
- **No backfill needed.** Confirmed with project owner: no legacy users predate the trigger. The simplification was safe.
- **Required follow-up: delete the orphan `bootstrapUserWallet` function** in dev (and never deploy it elsewhere) — the rename creates a new function on deploy but leaves the old one running on every signup. Run `bunx firebase functions:delete bootstrapUserWallet --project adsmart-web-dev` once after the new function deploys.
- **Doc updates.** ADR-010 reframed as "per-user state bootstrap" with a 2026-04-26 revision note. [DATA-MODEL.md](DATA-MODEL.md) `users/{uid}` and `users/{uid}/wallet/current` sections rewritten to reflect server-only seeding. [CLAUDE.md](../CLAUDE.md) wallet invariant section expanded into "per-user state bootstrap" covering both docs.

---

## [2026-04-26] — Functions deploy unblocked: bundled artifact + clean dep separation (ADR-011)

Closing the gap that ADR-009 itself flagged as "paper-thin." First end-to-end functions deploy after `@adsmart/shared` was introduced (commits `98be1a7` → `3ab593d` in early April) failed at three layers; resolution required a small architectural change to how functions are packaged for Cloud Build.

- **`@adsmart/shared` now emits CJS to `dist/`.** Added [packages/shared/tsconfig.build.json](../packages/shared/tsconfig.build.json) (`module: commonjs`, `outDir: ./dist`, `declaration: true`). Removed `"type": "module"`. Updated `package.json.exports` to point at `./dist/index.js` (default condition) with `./dist/index.d.ts` for types. Vite still bundles fine; Functions' Node CJS require resolves natively.
- **Functions bundle into a single CJS file via Bun.** New `bundle` script in [functions/package.json](../functions/package.json): `bun build lib/index.js --target=node --format=cjs --outfile=lib/bundle.js --external firebase-admin --external 'firebase-admin/*' --external firebase-functions --external 'firebase-functions/*' --external googleapis --external google-auth-library --external axios --external qrcode.react --external express`. Output: 760 KB single file with `@adsmart/shared` inlined.
- **`functions/deploy/` is the upload artifact.** New [functions/scripts/prepare-deploy.mjs](../functions/scripts/prepare-deploy.mjs) materializes a self-contained deploy directory (only `index.js`, a clean `package.json` with workspace deps stripped, `.env`). [firebase.json](../firebase.json) updated to `functions.source: "functions/deploy"` so Cloud Build's `npm install` only sees standard semver deps. Predeploy now runs via `bunx turbo run build --filter=@adsmart/functions...` for topological build ordering.
- **`@adsmart/functions` keeps `@adsmart/shared` in `devDependencies`.** Required at typecheck/build/bundle time, never at runtime.
- **`getPublicProductPrices` migrated from v1 import to v2 `onCall` with `invoker: 'public'`.** v2 callables default to private invoker, so the first deployed revision returned `403 Forbidden` on every anonymous request. The `invoker: 'public'` option grants `roles/run.invoker` to `allUsers` at deploy time. Firebase CLI 14.x does not always propagate this on update — a one-time `gcloud run services add-iam-policy-binding` is documented in [DEPLOYMENT.md](DEPLOYMENT.md#public-callable-iam-grant-one-time-per-project-per-public-function).
- **`bootstrapUserWallet` deployed as `beforeUserCreated` v2 trigger.** Identity Platform was enabled on `adsmart-web-dev` (one-time prereq for blocking triggers). New signups now seed `users/{uid}/wallet/current` with `balance: 0` server-side via Admin SDK.
- **Doc / convention updates.** Added [ADR-011](Decisions.md#adr-011-functions-deploy-via-bundled-functionsdeploy-directory) covering the bundle rationale, externals list, IAM grant runbook, and alternatives considered. [DEPLOYMENT.md](DEPLOYMENT.md) Cloud Functions section now documents the bundle pipeline + the new "Adding a new function" step about `invoker: 'public'`. Added `packages/*/dist` and `functions/deploy/` to `.gitignore`.

Verified: `bun run build` (web), `bun run typecheck` (turbo, all 3 packages), `bun run test` (web 38/38, shared 40/40). `bunx firebase functions:list --project adsmart-web-dev` now shows both deployed functions.

---

## [2026-04-26] — Login console errors fixed: undeployed callable, missing index, client wallet bootstrap

Three independent post-login console errors on `adsmart-web-dev` traced to one common root: the dev project had drifted from the source tree (no functions deployed, indexes empty, Phase 3 rules vs. legacy client write).

- **Callable `getPublicProductPrices` returned 404** — the entire functions deploy was missing on `adsmart-web-dev` (`firebase functions:list` returned an empty table). The browser surfaced a misleading "CORS error" because Cloud Functions returns plain HTML 404 (no `Access-Control-Allow-Origin`) when the function name does not exist. The `useProductPrices` hook entered its degraded fallback path, logging `FirebaseError: internal`. Fix: redeploy all functions to dev (`bunx firebase deploy --only functions --project adsmart-web-dev` after `cd functions && bun run build`). Validation: `curl https://us-central1-adsmart-web-dev.cloudfunctions.net/getPublicProductPrices` → expect HTTP 200 instead of 404.
- **`useReports` query missing composite index** — [firestore.indexes.json](../firestore.indexes.json) was empty (`"indexes": []`). [src/hooks/useReports.ts](../src/hooks/useReports.ts) executes `where('userId','==',uid) + orderBy('createdAt','desc')` on the `reports` collection; Firestore requires a composite index. Added `{collectionGroup: reports, fields: [userId asc, createdAt desc]}`. Deploy: `bunx firebase deploy --only firestore:indexes --project adsmart-web-dev`. Index build is async — surface remains red for ~1-3 min after deploy.
- **`useWallet` permission denied on first login** — Phase 3 [firestore.rules:39-46](../firestore.rules) blocks client writes to `wallet`/`transactions`, but `useWallet` still ran `setDoc(walletRef, { balance: 0, ... })` whenever the snapshot reported the doc missing. Documentation in [DATA-MODEL.md:67](DATA-MODEL.md) still claimed the hook performed the bootstrap (stale). Resolution per **[ADR-010](Decisions.md#adr-010-wallet-bootstrap-moved-to-server-side-auth-blocking-trigger)**: removed the client write; surface a virtual `EMPTY_WALLET` (`balance: 0`, `updatedAt: epoch`) on missing snapshot; added [functions/src/bootstrapUserWallet.ts](../functions/src/bootstrapUserWallet.ts) — a `beforeUserCreated` Auth blocking trigger that seeds `users/{uid}/wallet/current` via Admin SDK. Pre-req: Identity Platform must be enabled on the Firebase project before deploy (Console → Authentication → Settings).
- **Doc refresh.** Added ADR-010, rewrote the wallet write section in [DATA-MODEL.md](DATA-MODEL.md), updated [CLAUDE.md](../CLAUDE.md) wallet bootstrap memory hint, added `firestore:indexes` deploy reminder to [DEPLOYMENT.md](DEPLOYMENT.md).
- **Memory updated.** Saved a `dev_environment_drift` memory: dev Firebase project is treated as ephemeral and must be redeployed end-to-end before browser-side QA.

Out of scope (intentionally left): the `addCredits`/`debitAmount` paths in `useWallet` are still client writes blocked by Phase 3 rules. Those flows are guarded by the `NOTE` JSDoc and are user-action paths (not first-login), so they don't pollute the post-login console. Migration to a callable lives in the Asaas migration phase (ADR-003).

---

## [2026-04-26] — Refactor Phase E: tooling for continuous drift prevention

Closes the entire REFACTOR-PLAN (Phases A–E). Locks in the schema-as-code contract with documentation, automation, and a published architectural decision.

- **E1 — Docs drift audit.** [DATA-MODEL.md](DATA-MODEL.md) had 5 residual `src/schemas/...` source-of-truth links from before the Phase D move; all rewritten to `packages/shared/src/schemas/...`. [DOMAIN.md](DOMAIN.md) was already aligned (commit `5699aec`). Decision: keep DATA-MODEL.md hand-authored with explicit `.ts` schema links — generating it from Zod (Zod → JSON Schema → Markdown) would add disproportionate tooling for the 5 collections currently documented. Revisit if the schema set grows past ~15.
- **E2 — pre-push validation.** [lefthook.yml](../lefthook.yml) gained a `typecheck-shared` step running `bun run typecheck` from `packages/shared/`, in parallel with the existing `typecheck-web` and `typecheck-functions` steps. Schema-only typecheck completes in ~1s; the cost of catching a broken schema before push is trivial.
- **E3 — ADR published.** [docs/Decisions.md](Decisions.md) gained ADR-009: "Zod 4 + FirestoreDataConverter as the data contract." Documents (a) the symptoms of drift that motivated the refactor, (b) the canonical decision (Zod + `@adsmart/shared` + boundary validation), (c) 5 practical consequences for code authors including the `omit({ ... }).parse(...)` pattern for `serverTimestamp()` writes, (d) alternatives considered (plain TS interfaces, io-ts, Valibot, Firestore codegen), and (e) trade-offs (~12 KB gz, CJS↔ESM interop in Functions, multi-location-by-intent).
- **E4 — Author guidance in CLAUDE.md.** Added an "Editing Firestore document shapes" section: edit `packages/shared/src/schemas/` first; the 4-step follow-up checklist (Vitest case → typecheck via Turbo → update DATA-MODEL → add CHANGES entry) is documented inline. Stack quick reference updated to mention `Zod 4 (@adsmart/shared)`.
- **REFACTOR-PLAN.md** marked **Completed (Phases A–E)** at the header.

This closes the full REFACTOR-PLAN. Total commits since the plan was authored: 11 (one per phase/sub-phase, all on the `migrate` branch). All workspaces typecheck and build green; web+shared 78/78 tests pass.

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
