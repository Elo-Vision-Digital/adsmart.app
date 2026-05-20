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
**Status:** Superseded by ADR-021 (SuitPay removed) + FUTURE §8 (Stripe is the planned replacement, not Asaas)

**Update 2026-05-19:** Asaas was never implemented. SuitPay was removed end-to-end in [ADR-021](#adr-021-remove-suitpay-end-to-end--harden-prepare-deploy-against-secretenv-overlap) (2026-05-18). The future payment direction is Stripe (see [FUTURE §8](redesign/FUTURE-IDEAS.md) and [docs/research/08-stripe-future.md](research/08-stripe-future.md)). The original ADR text below is preserved as historical record of the decision-making at that point in time.

**Decision (original, 2026-04-24):** Do not invest in hardening the SuitPay integration. Replace it with Asaas in a separate project phase.

**Rationale (original):**
- SuitPay webhook hash validation is optional by design — mandatory enforcement would require protocol changes.
- IP allowlist enforcement would need SuitPay's IP range (not published).
- Investment in a deprecated integration is waste.
- Asaas offers PIX + Boleto and better developer tooling.

**Scope of SuitPay maintenance (original):**
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

---

## ADR-009: Zod 4 + FirestoreDataConverter as the data contract

**Date:** 2026-04-26
**Status:** Accepted
**Phase:** Refactor — REFACTOR-PLAN.md (Phases C–E)

**Context:**

Until April 2026 the project had no executable source of truth for Firestore document shapes. Symptoms accumulated:

- `Report.type: 'facebook_ads'` vs `AdAccount.platform: 'meta_ads'` — same platform, two names (one of them legacy).
- `Report.lookerStudioUrl?: string` declared in TS but never populated by the backend; UI rendered fake URLs in some flows.
- Hand-written TypeScript interfaces in `src/types/index.ts` that drifted from what Cloud Functions actually wrote — `userId` declared but never set, `currency`/`timezone` written but missing from the interface, etc.
- `docs/DATA-MODEL.md` listed schemas as plain markdown that nothing validated against.
- No runtime validation anywhere — Firestore accepts any shape; drift stayed invisible until it became a production bug.

**Decision:**

Adopt **Zod 4** as the canonical schema language and `FirestoreDataConverter` (web SDK) as the bridge between Zod and Firestore. Schemas live in a dedicated workspace package `@adsmart/shared` so a single definition governs both web reads (via `.withConverter(zodConverter(Schema, label))`) and Functions writes (via `Schema.parse()` at the write boundary).

Consequences for code authors:

1. **Schema files in `packages/shared/src/schemas/`** are the source of truth for any Firestore document shape. Edit there first; types in `src/types/index.ts` are derived (`z.infer`) and re-exported for backward compatibility.
2. **Validation runs at the boundary**, not throughout the app: web reads validate via `fromFirestore` in the converter; Functions writes validate via `Schema.parse()` immediately before `set()`. Application code in between trusts the type.
3. **`zTimestamp()` is duck-typed** (`{ toDate: () => Date }`) — `@adsmart/shared` does not depend on `firebase/firestore` or `firebase-admin`. The web SDK and Admin SDK ship distinct `Timestamp` classes that would cross-fail an `instanceof` check, so the helper detects either via the structural `.toDate()` method.
4. **Permissive at the edges, strict in the middle.** `safeParse` on read (logs structured drift; best-effort cast so a single bad row does not crash UI). `parse` on write (strict — fail before persisting).
5. **`.omit({ ... }).parse(...)` for server-side writes** that include `serverTimestamp()` sentinels. The sentinel is a `FieldValue`, not a `Date` or `Timestamp`, so temporal fields are omitted from the parse and added back into the final `set()` payload.

**Alternatives considered:**

- **Plain TS interfaces (status quo).** Rejected — drift was already happening and there was no runtime verification.
- **`io-ts` / `Valibot`.** Smaller bundle but smaller ecosystem; Zod has wider Firebase integration patterns (`FirestoreDataConverter` examples in the official Firebase docs, validated via Context7 2026-04-25). Zod 4 is also 14× faster on string parse and 7× on arrays vs Zod 3.
- **Generated types from Firestore (e.g., `firestore-emulator-suite` codegen).** Tooling not mature enough; the canonical direction in 2026 is "schema first, then derive both validation and types."
- **Schemas alongside `src/` (no monorepo package).** Started this way (Phase C) but moved to `@adsmart/shared` (Phase D) once Functions also needed validation. Two consumers (web + Functions) made the package mandatory.

**Trade-offs:**

- ~12 KB gzipped added to the web bundle (acceptable — bundle already ~1.1 MB).
- CJS↔ESM interop in Functions: `module: "commonjs"` consumes the ESM `@adsmart/shared` workspace package via TS source through the symlink. Works under Bun isolated linker but is a paper-thin dependency on the resolution path.
- Server-side `serverTimestamp()` sentinels force the `omit` pattern at write sites (a small ergonomics tax — see point 5 above).
- Schemas now live in three places by intent: `packages/shared/src/schemas/` (source of truth), `src/schemas/firestore-converter.ts` (web-only converter helper), and the `*.test.ts` siblings of each schema (validation behavior). Three places sounds like duplication; it is not — they have distinct responsibilities and the `firestore-converter.ts` re-exports `zTimestamp` from shared so callers see one symbol.

**References:**
- [REFACTOR-PLAN.md](REFACTOR-PLAN.md) — full phase plan (A through E).
- [packages/shared/src/index.ts](../packages/shared/src/index.ts) — schema exports.
- [src/schemas/firestore-converter.ts](../src/schemas/firestore-converter.ts) — `zodConverter()` helper.
- [docs/DATA-MODEL.md](DATA-MODEL.md) — human-facing field documentation; each entry links back to its schema file as the source of truth.

---

## ADR-010: Per-user state bootstrap moved to server-side Auth blocking trigger

**Date:** 2026-04-26
**Status:** Accepted (revised — see "2026-04-26 revision" below)

**Context:**

Phase 3 firestore.rules block all client-side writes to `users/{uid}/wallet/{...}` (the rule excludes `wallet` and `transactions` from the writable subcollection set). However, [src/hooks/useWallet.ts](../src/hooks/useWallet.ts) still attempted a `setDoc(walletRef, { balance: 0, ... })` whenever the snapshot reported the document missing — typical first-login scenario. The write hit the rule and surfaced as `FirebaseError: Missing or insufficient permissions` for every new user. Documentation in [docs/DATA-MODEL.md](DATA-MODEL.md) still claimed that the hook performed the bootstrap, contradicting the deployed rule.

A second symptom (surfaced same day): `SettingsPage.handleSaveProfile` returned `Missing or insufficient permissions` whenever a user tried to save their profile, because `AuthContext.signUp` only created the Firebase Auth user — the `users/{uid}` Firestore doc was never created. The first save then triggered the `create` rule path which requires `createdAt == request.time` (a field the page didn't send), so it failed; subsequent updates failed because `resource.data.createdAt` was missing.

Both symptoms shared a root cause: per-user state initialization was happening client-side (or not at all) in a model where Phase 3 hardening intentionally forbade client-side writes to that state.

**Decision:**

1. Remove the client-side bootstrap from `useWallet`. When the snapshot reports the document missing, surface a virtual `EMPTY_WALLET` (`balance: 0`, `updatedAt: epoch`) without writing.
2. Add a Firebase Auth blocking trigger `bootstrapUser` ([functions/src/bootstrapUser.ts](../functions/src/bootstrapUser.ts)) that runs `beforeUserCreated` and seeds **both** `users/{uid}` (`{ email, createdAt, updatedAt }`) **and** `users/{uid}/wallet/current` (`{ balance: 0, currency: 'BRL', updatedAt }`) via the Admin SDK in a single batched write. The wallet seed is validated through `UserWalletSchema` from `@adsmart/shared` (ADR-009); the user doc is intentionally minimal — name/phone/document fields are filled in by `SettingsPage` on first save (which, post-bootstrap, hits the `update` rule path with all required invariants in place).
3. Use `firebase-functions/v2/identity` `beforeUserCreated` rather than the deprecated v1 `functions.auth.user().onCreate` — v6 of `firebase-functions` only exposes the v2 surface for Identity Platform triggers.

**Why a blocking trigger (not a non-blocking onCreate)?**

Authentication blocking triggers are synchronous: the user account is not finalized until the trigger returns. This guarantees that by the time the client receives a successful sign-in callback, the wallet document already exists. A non-blocking `onUserCreated` could race with the client's `onSnapshot` subscription, producing a brief flash of the virtual `EMPTY_WALLET`. The trade-off is added sign-up latency (~100-300ms); acceptable for our scale.

**Pre-requisites:**

- Identity Platform must be enabled on the Firebase project (one-click enable in Firebase Console → Authentication → Settings). The CLI deploy will refuse the trigger otherwise.

**Trade-offs:**

- Existing users created before this trigger landed have no wallet document. They'll see the virtual `EMPTY_WALLET` until an admin grants them credit (which seeds the doc via `addUserCredits`) or until a one-shot backfill script runs (not in scope for this ADR).
- Wallet bootstrap latency now lives on the auth path rather than the first-render path.

**Alternatives considered:**

- **Relax firestore.rules to allow client wallet writes.** Rejected — Phase 3 hardening exists precisely to prevent client-controlled balances. Re-opening the door defeats the threat model.
- **Add a callable `bootstrapWallet` invoked from the client on first login.** Rejected — extra round trip, extra failure mode, and the client could simply not call it (defeating the purpose for a server-controlled balance).
- **Keep client write + accept the permission error silently.** Rejected — pollutes the console and breaks the strict "no unhandled FirebaseError on login" invariant.

**2026-04-26 revision:**

The original ADR scoped the trigger to wallet bootstrap only (`bootstrapUserWallet`). Same-day investigation surfaced the parallel `users/{uid}` profile-doc gap, with the same root cause (client trying to bootstrap state Phase 3 forbids). The trigger was renamed to `bootstrapUser` and extended to seed both docs in a single batched write. `SettingsPage.handleSaveProfile` correspondingly switched from `setDoc(merge:true)` to `updateDoc()` — the `create` rule path is no longer reachable from the client. Both old name (`bootstrapUserWallet`) and the read-first `setDoc` workaround in `SettingsPage` are removed.

This change was safe because the project has no legacy users predating the trigger — confirmed with the project owner before the simplification.

**References:**
- [functions/src/bootstrapUser.ts](../functions/src/bootstrapUser.ts) — implementation (seeds user doc + wallet).
- [src/hooks/useWallet.ts](../src/hooks/useWallet.ts) — virtual-wallet read path (defensive — every signup should have a doc post-trigger).
- [src/pages/SettingsPage.tsx](../src/pages/SettingsPage.tsx) — `updateDoc()` write that depends on the doc existing.
- [firestore.rules:23-46](../firestore.rules) — Phase 3 user-doc rules + wallet write block.
- Firebase docs: Identity Platform blocking functions (validated via Context7 2026-04-26).

---

## ADR-011: Functions deploy via bundled `functions/deploy/` directory

**Date:** 2026-04-26
**Status:** Accepted

**Context:**

When attempting the first end-to-end deploy of `@adsmart/functions` after `@adsmart/shared` was introduced (ADR-009, commits `98be1a7` → `3ab593d`), `firebase deploy --only functions` failed at two distinct layers:

1. **Local analysis layer.** Firebase CLI's source analyzer runs Node directly against `functions/lib/index.js`. Node's ESM resolver hit `@adsmart/shared`'s `package.json`, found `"type": "module"` plus `exports."." → "./src/index.ts"`, and threw `ERR_MODULE_NOT_FOUND` because Node cannot natively load `.ts`.
2. **Cloud Build layer.** Even after the local analyzer worked, Cloud Build's `npm install` rejected `"@adsmart/shared": "workspace:*"` with `EUNSUPPORTEDPROTOCOL` — the workspace protocol is Bun/Yarn/PNPM-only and unknown to npm.

ADR-009 itself flagged this as "paper-thin": `Works under Bun isolated linker but is a paper-thin dependency on the resolution path.` This ADR closes that gap.

A third symptom surfaced post-deploy: v2 callable functions on Cloud Functions Gen 2 default to private invoker on first deploy unless `invoker: 'public'` is set on the `onCall` options — `getPublicProductPrices` was deployed but every anonymous request returned `403 Forbidden` until `invoker: 'public'` was added (and an explicit `gcloud run services add-iam-policy-binding` was performed once because Firebase CLI 14.x does not always propagate the invoker option on update).

**Decision:**

1. **`@adsmart/shared` emits compiled CJS.** Added `tsconfig.build.json` (`module: commonjs`, `outDir: ./dist`, `declaration: true`). Removed `"type": "module"`. `package.json.exports` now points at `./dist/index.js` (default condition) with `./dist/index.d.ts` for types. Vite bundles the compiled JS without complaint; Functions' Node CJS require resolves it natively.
2. **Functions bundle into a single CJS file via Bun.** New `bundle` script: `bun build lib/index.js --target=node --format=cjs --outfile=lib/bundle.js --external firebase-admin --external 'firebase-admin/*' --external firebase-functions --external 'firebase-functions/*' --external googleapis --external google-auth-library --external axios --external qrcode.react --external express`. Externals are anything provided by the Cloud Functions runtime; everything else (including `@adsmart/shared`) is inlined. Output: ~760 KB single file.
3. **`functions/deploy/` is the upload artifact.** A new `prepare-deploy.mjs` script materializes a self-contained directory containing only `index.js` (the bundle), a clean `package.json` (workspace deps stripped, `main: "index.js"`), and `.env`. `firebase.json` is changed to `functions.source: "functions/deploy"`, so Cloud Build's `npm install` sees only standard semver deps.
4. **`@adsmart/functions` keeps `@adsmart/shared` in `devDependencies`.** Required at typecheck/build/bundle time only — never at runtime, so absence in the deploy artifact is correct.
5. **v2 callables that need anonymous invocation declare `invoker: 'public'`.** Currently `getPublicProductPrices` is the only such function; new public callables must do the same. Authenticated callables (`addUserCredits`, `checkRateLimit`, etc.) leave invoker default.

**Trade-offs:**

- **Bundle adds a build step.** Predeploy now runs three serial commands (`turbo run build` → `bun build` → `prepare-deploy`). Wall-clock cost: ~150ms total on a warm cache.
- **Stack traces in production point at `bundle.js` line numbers**, not original sources, unless we ship source maps. Today we don't — debug-time we can rebuild and inspect `lib/index.js` directly.
- **The deploy artifact is `gitignore`'d** (`functions/deploy/`, `packages/*/dist/`). CI must always run the build before invoking firebase deploy. `firebase.json.functions.predeploy` enforces this.
- **`functions:list` only sees what's in the bundle.** Adding a new function file requires re-running `bun run build` — the prepare-deploy script does NOT detect new TS files on its own.
- **Source field change is a one-way door for the firebase emulator.** `firebase emulators:start --only functions` now serves from `functions/deploy/`. The `serve` script in `functions/package.json` already chains `bun run build` first, so this is invisible to dev — but custom emulator workflows must rebuild before starting.

**Alternatives considered:**

- **Vendor `@adsmart/shared` as a `npm pack` tarball** in `functions/vendor/` and reference via `file:` spec. Works but pollutes the source tree with a binary blob, requires its own predeploy step, and Cloud Build still extracts a tarball on every deploy. Bundling is cleaner.
- **Use `nx-firebase` or another monorepo-aware Firebase plugin.** Adds a heavy dependency for a problem we can solve in 50 lines of bundle config.
- **Ship `@adsmart/shared` to a private npm registry.** Overkill for a private workspace package; introduces release coordination and auth.
- **Drop the workspace and copy schema files into `functions/src/`.** Re-introduces the drift that ADR-009 was created to eliminate.
- **Set `--source functions` and write a postinstall hook in `functions/package.json` that swaps workspace for file: spec.** Cloud Build runs `npm install` BEFORE postinstall fires — the install fails first.

**Pre-existing IAM grant (one-time, per project):**

For each public v2 callable, after the first successful deploy of that function name on a project, run once:
```bash
gcloud run services add-iam-policy-binding <function-name-lowercased> \
  --region=us-central1 \
  --member=allUsers \
  --role=roles/run.invoker \
  --project=<firebase-project-id>
```
This is a permanent IAM binding; subsequent redeploys preserve it. `getPublicProductPrices` was granted on `adsmart-web-dev` on 2026-04-26.

**References:**
- [functions/scripts/prepare-deploy.mjs](../functions/scripts/prepare-deploy.mjs) — deploy artifact generator.
- [functions/package.json](../functions/package.json) — bundle script and clean dep separation.
- [packages/shared/tsconfig.build.json](../packages/shared/tsconfig.build.json) — CJS build config.
- [firebase.json](../firebase.json) — `functions.source` and `predeploy` updates.
- [DEPLOYMENT.md → Cloud Functions](DEPLOYMENT.md) — operator-facing runbook.

---

## ADR-012: CPF/CNPJ uniqueness + immutability via callable + uniqueness index

**Date:** 2026-04-26
**Status:** Accepted

**Context:**

The product requires that:

1. **Each user document (CPF or CNPJ) is unique across the user base** — no two accounts can register the same CPF, and no two accounts can register the same CNPJ.
2. **Once a user has saved their document it cannot be changed** — both the type (`cpf` vs `cnpj`) and the number become immutable.

Firestore rules can express the immutability constraint (`request.resource.data.documentNumber == resource.data.documentNumber` for non-empty stored values), but they **cannot atomically check uniqueness across documents** — rules can only inspect the document being written, not run cross-collection lookups. A "best-effort" client-side query is racy: two clients querying for the same CPF concurrently would both find no match and both succeed. Storing the document on `users/{uid}` and indexing it doesn't help either, because the rule for one user can't read another user's doc.

**Decision:**

1. **Uniqueness index collection.** A separate `userDocuments/{normalizedDoc}` collection where the doc ID is the digits-only normalization of the CPF/CNPJ (`cpf.replace(/\D/g, '')`). Each entry holds `{ userId, documentType, createdAt }`. The doc ID itself is the uniqueness key — Firestore rejects two writes to the same path.
2. **Reservation callable.** A `reserveUserDocument` callable ([functions/src/reserveUserDocument.ts](../functions/src/reserveUserDocument.ts)) wraps the reservation in `db.runTransaction`. The transaction reads `userDocuments/{normalized}` and `users/{uid}` atomically and either:
   - claims the document for the caller (writes both `userDocuments/{n}` and `users/{uid}.{documentType,documentNumber}`),
   - returns no-op if the same caller already owns this exact document (idempotent),
   - throws `already-exists` if a different uid holds the doc, or
   - throws `failed-precondition` if the caller already has a different document on file (immutability backstop).
   Format validation (CPF/CNPJ check digits) runs server-side before the transaction so invalid input never touches Firestore.
3. **Rules enforce immutability + write-block on the index collection.** [firestore.rules](../firestore.rules) `userDocuments/{documentId}` allows `read: isOwner via userId field` and `write: false` (only the callable, via Admin SDK, can write). `users/{userId}` update rule rejects any write where `documentNumber` was already set and the new write attempts to change it (defense in depth — even if the callable is bypassed, the user doc itself can't be mutated post-reservation).
4. **Client UX.** [SettingsPage](../src/pages/SettingsPage.tsx) tracks a `documentLocked` boolean derived from `loadUserProfile`. When `true`, the radio buttons (CPF/CNPJ) and the document text input are `disabled + readOnly`, with a hint line explaining the immutability. `handleSaveProfile` only invokes the callable when `!documentLocked` — subsequent saves only touch `name`/`phone`/`updatedAt` via `updateDoc`. Friendly error mapping for `functions/already-exists`, `functions/failed-precondition`, `functions/invalid-argument`.

**Why a callable + transaction (not pure rules)?**

Firestore security rules cannot read another user's document during evaluation — they're scoped to the request and the document being written. Cross-document uniqueness is therefore not expressible in rules alone. A transaction over `userDocuments/{n}` + `users/{uid}` is the canonical pattern: the transaction's snapshot isolation guarantees that two concurrent writers cannot both observe the doc as missing and both proceed.

**Trade-offs:**

- **Two writes per reservation** (the index entry + the user doc). Acceptable — reservation runs once per user lifetime.
- **The index doc IDs leak document numbers** to anyone who can list the collection. Mitigated by `read: if isOwner` (lookup only succeeds when the caller already knows the number AND owns it) and by `list` operations being implicitly disallowed (rules don't grant `list`). Listing the entire collection from the client returns "Missing or insufficient permissions."
- **Re-typing the same CPF as CNPJ (or vice versa) is blocked** by the `documentLocked` rule — even though they normalize differently, the immutability check kicks in before the type switch. Intentional: a user who registered CPF can't switch to CNPJ later.

**Alternatives considered:**

- **Client-side query first, then write.** Racy under concurrent signups. Rejected.
- **Encode uniqueness via a hash field on `users/{uid}` plus a Firestore index.** Same race problem — rules still can't check across docs.
- **A periodic batch job that detects + rejects duplicates.** Surfaces the failure asynchronously, often after the user has moved on. Bad UX and weaker than synchronous rejection.

**Operations:**

- **Per project, after first deploy:** the same `gcloud run services add-iam-policy-binding` call from ADR-011 is **not** required for this callable — it's gated by `request.auth` (only authenticated users can invoke), so the default (private) Cloud Run invoker is correct. Firebase Auth tokens flow through the callable wrapper automatically.

**References:**
- [functions/src/reserveUserDocument.ts](../functions/src/reserveUserDocument.ts) — implementation.
- [firestore.rules](../firestore.rules) — `userDocuments` collection rule + `users/{uid}` `documentLocked()` helper.
- [src/pages/SettingsPage.tsx](../src/pages/SettingsPage.tsx) — client UX (disabled inputs, callable invocation, error mapping).

---

## ADR-013: Drop Google reCAPTCHA from authentication

**Date:** 2026-05-17
**Status:** Accepted

**Context:**

The login flow (email/password sign-in and sign-up at [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx)) previously gated submissions behind a Google reCAPTCHA v2 challenge. The widget mounted client-side via `react-google-recaptcha`, the resulting token was forwarded to a `verifyRecaptcha` Cloud Function ([functions/src/recaptcha.ts](../functions/src/recaptcha.ts)) which called the Google `siteverify` REST API with a stored secret, and rejected the login with `HttpsError('failed-precondition')` on a `success: false` response.

In May 2026 the dev environment's secret pair drifted out of sync with the site key it was meant to validate — every login attempt at `localhost → adsmart-web-dev` failed with `["invalid-input-response"]` from `siteverify`. The same pattern was almost certainly going to bite prod under any future site/secret rotation.

The trigger for the cleanup was operational, but the deeper question was **whether reCAPTCHA was earning its weight at this product stage at all.** AdSmart is in early-beta with a small admin/test-user pool, no observed bot or abusive-traffic patterns, and the existing client-side `useRateLimit` hook ([src/hooks/useRateLimit.ts](../src/hooks/useRateLimit.ts), 5 attempts / 15 min) plus Firebase Auth's own anti-abuse heuristics (per-account lockout on repeated failed sign-ins, IP-based throttling on `signInWithEmailAndPassword`) already cover the threat model that motivated reCAPTCHA in the first place.

**Decision:**

Remove reCAPTCHA entirely from the codebase, the deploy surface, and the secret manifest. Specifically:

1. **Client.** Delete the `<ReCAPTCHA>` widget mount, the `recaptchaValue` state and all branches in `handleSubmit`, the `getDevConfig`/`skipRecaptcha`/`isTestUser` toggle layer, the `verifyRecaptchaToken` helper in [AuthContext.tsx](../src/contexts/AuthContext.tsx), and the `recaptchaToken?: string` parameter from `signInWithEmail`. Drop the `react-google-recaptcha` + `@types/react-google-recaptcha` npm packages and the `VITE_RECAPTCHA_SITE_KEY` env var from `.env.example` and `.env.production`. (Commit `cc0d2d0`.)
2. **CSP.** Trim `https://www.google.com` and `https://www.gstatic.com` from `script-src`, `connect-src`, `frame-src` in [firebase.json](../firebase.json). `apis.google.com` stays for Firebase Auth's Google popup, `fonts.gstatic.com` stays for Google Fonts, `googletagmanager.com` stays for GTM. (Same commit.)
3. **Cloud Functions.** Delete [functions/src/recaptcha.ts](../functions/src/recaptcha.ts) entirely. Remove the `verifyRecaptcha` export from [functions/src/index.ts](../functions/src/index.ts) and the `recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY')` declaration from `functions/src/config/index.ts`. (Commit `6d0e05a`.)
4. **Zombie function deletion.** `firebase deploy --only functions` does NOT auto-prune unreferenced exports — the deployed `getDashboardMetrics`, `verifyRecaptcha`, etc. all stay until explicitly removed. After the new functions codebase rolls out, run `firebase functions:delete verifyRecaptcha --project adsmart-web-dev --force` and the same against `adsmart-web` (prod). Verify with `firebase functions:list`.
5. **Secret cleanup.** `firebase functions:secrets:destroy RECAPTCHA_SECRET_KEY --project <id>` per project. Irreversible — every version of the secret is wiped. Run only after step 4 confirms no function still references it.
6. **`SecurityEventType` enum retention.** Keep `RECAPTCHA_SUCCESS` and `RECAPTCHA_FAILED` in [functions/src/securityLogger.ts](../functions/src/securityLogger.ts), marked `@deprecated 2026-05-17`. Historical entries in `securityLogs/{id}` still reference these types and the logger primitive remains (it is consumed by `googleAdsOAuth`, `metaAdsOAuth`, `rateLimiter`, `adminWalletManager`, and its own SUSPICIOUS_ACTIVITY re-entrancy guard — see [ADR-014](#adr-014-remove-security-logs-admin-tab) for the corresponding UI removal). Dropping the enum values would force every current and future consumer (Cloud Logging queries, Admin-SDK audit tooling) into a "unknown event type" fallback. No producer remains in the codebase.

**Threat model after removal:**

| Attack | Mitigation |
|---|---|
| Credential stuffing against a known email | `useRateLimit` 5/15min client guard + Firebase Auth's server-side per-account throttle |
| Distributed credential stuffing across many emails | Firebase Auth IP-based rate limit on `identitytoolkit.googleapis.com` |
| Automated signup spam | `useRateLimit` on the same form path + Firebase Auth abuse detection. Signup volume is currently tiny; if it grows, add Firebase App Check (modern, friction-less alternative) instead of re-introducing reCAPTCHA |
| Bot abuse of other endpoints | All callables already enforce `request.auth` and the admin-only ones check the custom claim. The dashboard's `useRateLimit` is the right primitive to extend to other forms if needed |

**Reintroduction trigger:**

Re-introduce a bot-prevention layer **only if** one of: (a) abuse patterns surface in Cloud Logging (sustained `LOGIN_FAILED` rate >100/hr from outside the admin team), (b) sign-up volume scales past ~100/day, (c) a compliance review specifically requires it. The replacement should be **Firebase App Check** (token-based, transparent to users, no widget) rather than the legacy reCAPTCHA v2 widget — `onCall({ enforceAppCheck: true })` is the supported path on Cloud Functions v2.

**Trade-offs:**

- **Lost layer.** Even at this stage, reCAPTCHA was non-zero defense against drive-by automated signups. The rate-limiter is purely client-side state (resets on reload), so a determined attacker can paper over it. Acceptable given the product stage.
- **Historical logs reference a deprecated enum.** `RECAPTCHA_SUCCESS/FAILED` values remain in the type union with a comment. Cleanup window: 90 days after this ADR, sweep `securityLogs/` for entries with these types older than 90 days and delete them, then remove the enum entries. Out of scope here.

**Alternatives considered:**

- **Re-sync the dev secret with the site key.** Restores the immediate breakage but doesn't address the recurring drift risk or the overengineering concern. Rejected.
- **Migrate to reCAPTCHA Enterprise / v3.** More effort for the same questionable ROI at current product stage.
- **Switch to Firebase App Check directly.** Right answer eventually, but App Check needs a debug-token setup for local dev + per-platform site keys + provider configuration. Out of scope for "make login work today". Tracked for reintroduction (see trigger above).

**References:**
- [src/pages/LoginPage.tsx](../src/pages/LoginPage.tsx) — login form after removal (no widget, no state).
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) — simplified `signInWithEmail(email, password)`.
- [src/hooks/useRateLimit.ts](../src/hooks/useRateLimit.ts) — remaining client-side abuse guard.
- [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) — `RECAPTCHA_*` enum values marked deprecated.
- [firebase.json](../firebase.json) — trimmed CSP.

---

## ADR-014: Remove Security Logs admin tab (keep logger primitive)

**Date:** 2026-05-17
**Status:** Accepted

**Context:**

The admin panel previously surfaced a "Logs de Segurança" tab at `/admin/security` ([src/pages/admin/SecurityLogsPage.tsx](../src/pages/admin/SecurityLogsPage.tsx)) that called a `getSecurityStats` callable ([functions/src/securityStats.ts](../functions/src/securityStats.ts)) and rendered an aggregated view of recent `securityLogs/{id}` events: total events, critical events, breakdown by `SecurityEventType`, breakdown by `SecuritySeverity`. The callable wrapped a `SecurityLogger.getSecurityStats(days)` method that scanned the collection via Admin SDK.

At the current product stage (early beta, ~1 active admin, audit volume so low that the page typically shows "Nenhum evento" or one or two entries) the tab is not actionable — the same data is more discoverable in Cloud Logging directly, with proper filtering, retention, and search. Maintaining a bespoke admin UI on top of it duplicates Cloud Logging without adding signal. Same overengineering argument as the [reCAPTCHA removal in ADR-013](#adr-013-drop-google-recaptcha-from-authentication).

**Critical separation — what is removed vs what stays:**

The user surface (the read side, the UI tab) goes. The **logger primitive** — the `SecurityLogger` class with its `logEvent` method, the `SecurityEventType` enum, the `SecuritySeverity` enum, and the `securityLogs/{id}` Firestore collection — **stays intact**. Five other Cloud Functions actively WRITE to it for audit and would break if the primitive were removed:

| Function | Events emitted |
|---|---|
| [functions/src/googleAdsOAuth.ts](../functions/src/googleAdsOAuth.ts) | OAUTH_INIT, OAUTH_SUCCESS, OAUTH_ERROR |
| [functions/src/metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts) | OAUTH_INIT, OAUTH_SUCCESS, OAUTH_ERROR |
| [functions/src/rateLimiter.ts](../functions/src/rateLimiter.ts) | RATE_LIMIT_EXCEEDED |
| [functions/src/adminWalletManager.ts](../functions/src/adminWalletManager.ts) | UNAUTHORIZED_ACCESS |
| [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) (self) | SUSPICIOUS_ACTIVITY (re-entrancy guard) |

After this ADR, `securityLogs/{id}` is **write-only from app code, read-only via Cloud Logging or Admin SDK**. The Firestore rule already blocks both client read and client write (`allow read: if false; allow write: if false;`); that stays unchanged.

**Decision:**

1. **Client.** Delete [src/pages/admin/SecurityLogsPage.tsx](../src/pages/admin/SecurityLogsPage.tsx) entirely (124 lines, single consumer of `getSecurityStats`). Remove its import and `<Route path="security">` from [src/App.tsx](../src/App.tsx). Drop the `Shield` icon import and the security entry from the `tabs` array in [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) — admin sub-nav goes from 4 tabs to 3. Update `AdminLayout.test.tsx` (4-tab → 3-tab assertions, add a defensive `not.toContain('/admin/security')`). Strip `admin.nav.security` and the full `admin.security.*` subtree (10 keys) from `src/locales/{pt-BR,en,es}.json` and mirror the deletion in `src/locales/types.ts`. (Commit `d899a7a`.)
2. **Cloud Functions.** Delete [functions/src/securityStats.ts](../functions/src/securityStats.ts). Remove the `getSecurityStats` export from [functions/src/index.ts](../functions/src/index.ts). Remove the `getSecurityStats(days)` method (~40 lines) from the `SecurityLogger` class in [functions/src/securityLogger.ts](../functions/src/securityLogger.ts). The class retains `logEvent`, `getDb`, the SUSPICIOUS_ACTIVITY re-entrancy guard, the `SecurityEvent` type, and both enums. (Commit `24407d4`.)
3. **Zombie function deletion.** `firebase functions:delete getSecurityStats --project adsmart-web-dev --region us-central1 --force` and same against `adsmart-web`. Verify with `firebase functions:list`.
4. **Firestore.** Rules: no change (already locked). Indexes: no change (no composite indexes existed on `securityLogs`; the collection has always been Admin-SDK scanned without index hints). Collection itself: keep for audit. Cleanup of old documents is out of scope and can be batched separately if storage cost ever becomes material (current volume is negligible).

**`/admin/security` legacy URL behavior:**

After removal, navigating to `/admin/security` no longer matches any child route. Because the parent `<Route path="/admin">` has `<Route index element={<Navigate to="dashboard" replace />} />` and React Router falls back to the index route when no child matches, the user lands on `/admin/dashboard` automatically. No 404, no white screen. Acceptable redirect behavior — bookmarks pre-removal won't break.

**Trade-offs:**

- **Lost layer.** Admin can no longer scan a synthesized recent-events view from the app. Cloud Logging via `https://console.cloud.google.com/logs/query?project=adsmart-web-dev` (or `adsmart-web` for prod) covers the same data with more flexibility and longer retention. Acceptable given the low query volume.
- **Stale enum values.** Same situation as ADR-013 — `RECAPTCHA_SUCCESS`/`RECAPTCHA_FAILED` already deprecated; no new deprecation introduced here since the OTHER enum values (`LOGIN_SUCCESS`, `RATE_LIMIT_EXCEEDED`, `OAUTH_*`, `UNAUTHORIZED_ACCESS`, `SUSPICIOUS_ACTIVITY`, etc.) still have writers.
- **No regression test.** `SecurityLogsPage` never had unit tests; nothing was lost. The `securityLogger.test.ts` covers the logger primitive that stays.

**Reintroduction trigger:**

If audit volume grows past the point where Cloud Logging filtering becomes friction (rough threshold: >1000 `securityLogs/{id}` writes per day, or >5 distinct admin users needing self-service forensics), reintroduce a similar surface — but back it by a paginated query over `securityLogs/{id}` rather than the `Promise<any>`-typed `getSecurityStats` aggregator, and ship with: server-side pagination, type-safe Zod output (mirror the `getDashboardMetrics` pattern), and a test in `functions/test/`.

**Alternatives considered:**

- **Keep the page, fix it later.** The page was already functional; the deletion is purely a YAGNI call. The cost of carrying it (admin sub-nav clutter, an extra callable in the deploy list, a Firestore scan per page open, a code path that drifts as the underlying logger evolves) outweighs the benefit at current usage. Rejected.
- **Move the view from the admin panel to a separate `/security` route with broader access.** Same problems plus broader exposure of audit data. Rejected.
- **Delete the entire `securityLogs/{id}` collection + the logger primitive.** Would break 5 other features that depend on the writer interface. Rejected as scope creep.

**References:**
- [src/pages/admin/AdminLayout.tsx](../src/pages/admin/AdminLayout.tsx) — admin sub-nav after removal (3 tabs).
- [src/App.tsx](../src/App.tsx) — admin route block after removal.
- [functions/src/securityLogger.ts](../functions/src/securityLogger.ts) — logger primitive that stays (5 writers depend on it).
- [firestore.rules](../firestore.rules) — `match /securityLogs/{logId}` block (unchanged: `allow read/write: if false`).

---

## ADR-015: Register Identity Platform blocking trigger after total Firestore + Auth wipe

**Date:** 2026-05-17
**Status:** Accepted

**Context:**

After the same-day Firestore + Auth wipe across both projects ("limpeza completa" — see CHANGES.md for that day), the first new signup against `adsmart-web-dev` succeeded at the Auth layer but produced **no `users/{uid}` doc** and **no `users/{uid}/wallet/current`** doc. The frontend rendered correctly because [useWallet](../src/hooks/useWallet.ts) has the defensive `EMPTY_WALLET` fallback from [ADR-010](#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger), but `bootstrapUser` (the [beforeUserCreated](../functions/src/bootstrapUser.ts) blocking trigger that should have written both docs) never executed.

Three observations pinpointed the root cause:

1. `firebase functions:list --project adsmart-web-dev` showed `bootstrapUser` as `ACTIVE` (v2, `providers/cloud.auth/eventTypes/user.beforeCreate`, `us-central1`).
2. `firebase functions:log --only bootstrapUser --project adsmart-web-dev` returned **only deploy audit entries** — zero execution rows for the new signup.
3. The Identity Platform admin API confirmed the config gap:
   ```
   GET /admin/v2/projects/adsmart-web-dev/config
   → blockingFunctions: {}
   ```
   The Cloud Function existed, but Identity Platform had no registration that pointed at it as a `beforeCreate` blocking trigger, so no signup ever invoked it.

Prod (`adsmart-web`) had the trigger correctly registered from the original 2026-04-26 deploy (`bootstrapuser-2ocqwqseya-uc.a.run.app`, `updateTime: 2026-04-26T17:02:24Z`). Dev did not. The CLI `firebase deploy --only functions:bootstrapUser` re-ran successfully but did **not** re-attempt the Identity Platform registration — the silent-failure mode documented in firebase-tools' blocking-function deploy path.

Initial fix attempt used the obvious URI shape (`https://us-central1-adsmart-web-dev.cloudfunctions.net/bootstrapUser`) and surfaced a second issue: Cloud Functions v2 are backed by Cloud Run, and Identity Platform validates the OIDC `aud` claim on the blocking token against the actual Cloud Run service URL. The first signup attempt with the wrong URI produced (in the function logs, severity ERROR):
```
FirebaseAuthError: Firebase Auth Blocking token has incorrect "aud" (audience) claim.
Expected "run.app" but got
"https://us-central1-adsmart-web-dev.cloudfunctions.net/bootstrapUser".
```
The correct URI was the Cloud Run service URL: `https://bootstrapuser-nnhhnhk2wa-uc.a.run.app` (visible in `firebase functions:list` and in the function deploy response under `serviceConfig.uri`).

**Decision:**

When the blocking trigger registration on Identity Platform is empty or stale, register it explicitly via the admin REST API rather than re-running deploy and hoping the CLI does it. The PATCH is:

```bash
curl -X PATCH \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: <PROJECT_ID>" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/<PROJECT_ID>/config?updateMask=blockingFunctions" \
  -d '{
    "blockingFunctions": {
      "triggers": {
        "beforeCreate": {
          "functionUri": "https://<cloud-run-service-url>.run.app"
        }
      }
    }
  }'
```

Two rules for `functionUri`:

1. **Must be the Cloud Run URL** (`*-uc.a.run.app`), not the legacy Cloud Functions URL (`us-central1-<project>.cloudfunctions.net/<name>`). Functions v2 = Cloud Run. The Identity Platform OIDC `aud` claim validation enforces this.
2. **Get the URL from `firebase functions:list`** or from the deploy response (`serviceConfig.uri`). Do not construct it from the function name — the random subdomain segment is unique per project + revision generation.

Verify the registration landed (and persists) with a follow-up GET on the same endpoint without `?updateMask`. Confirm by performing one new signup and asserting `firestore.get('users/{newUid}')` and `firestore.get('users/{newUid}/wallet/current')` both return non-empty.

**Why not "just redeploy" or "click in Console"?**

- Redeploy was tried first (`firebase deploy --only functions:bootstrapUser --project adsmart-web-dev --force`). It re-uploaded the function but did not modify `blockingFunctions`. The CLI registration path requires `identitytoolkit.config.update` on the deploying principal, and silently no-ops when missing — there is no error surfaced to the operator.
- Firebase Console (Authentication → Settings → Blocking functions) is a valid path and does the same PATCH under the hood, but it is interactive-only — not scriptable, not reviewable in PRs, and the option does not always render in projects where Identity Platform was upgrade-d via a different code path. The REST call works regardless and produces an artifact (the curl command) reviewable in this ADR.

**When this matters:**

- Any project that pre-dated the `bootstrapUser` deploy and was later wiped (the dev case here).
- Any project where Identity Platform was upgraded after the function was first deployed.
- Any rotation of the trigger to a new Cloud Run revision URL (rare — the URL is stable across revisions of the same function).

**Trade-offs:**

- The PATCH bypasses the CLI's own state model. Subsequent `firebase deploy` runs will see the trigger as present and leave it alone (correct behavior). If the function is ever renamed or relocated, the operator must re-run the PATCH with the new URL — the CLI will not auto-migrate. Documented here so future deploys do not silently break the signup path.
- Setting `blockingFunctions: {}` (empty) via the same endpoint with `updateMask=blockingFunctions` is the disable path, also irreversible from CLI alone.

**Alternatives considered:**

- **Wait for the CLI to fix this upstream.** Tracked but no ETA; firebase-tools deploy semantics for blocking triggers are stable and not converging on idempotent reconciliation. Not viable for this incident.
- **Workaround: skip `bootstrapUser` and write `users/{uid}` + `wallet/current` directly from a client-side `setDoc` on first login.** Rejected — re-introduces the exact bug class ADR-010 was written to eliminate (client-controlled writes to wallet path, blocked by Phase 3 rules). The temptation was real because it would have unblocked validation immediately; the cost would have been silent drift from the ADR-010 invariant.
- **Workaround: seed `users/{uid}` + `wallet/current` manually via MCP for the existing test account, leave the trigger broken for new accounts.** Rejected — hides the root cause and ensures every future signup hits the same silent-failure path. The operator who runs into it next would have no signal pointing at Identity Platform config.

**Defense in depth:**

If the trigger ever silently un-registers again, the `EMPTY_WALLET` fallback in [useWallet](../src/hooks/useWallet.ts) means the user can still log in and see a zero balance, and the `documentLocked()` rule in [firestore.rules](../firestore.rules) prevents client writes from poisoning the doc. The failure mode is observable (no `users/{uid}` in Firestore for a known active session) rather than data-corrupting. Add the `blockingFunctions` GET to the QA checklist if the issue recurs — currently out of scope.

**Reversal:**

```bash
curl -X PATCH \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "x-goog-user-project: <PROJECT_ID>" \
  -H "Content-Type: application/json" \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/<PROJECT_ID>/config?updateMask=blockingFunctions" \
  -d '{"blockingFunctions": {}}'
```

Disables the trigger registration without removing the Cloud Function. Same caveat as the registration: the CLI is unaware.

**References:**
- [functions/src/bootstrapUser.ts](../functions/src/bootstrapUser.ts) — the trigger source (unchanged by this ADR).
- [ADR-010](#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) — original decision to use a blocking trigger and the `users/{uid}` + `wallet/current` contract it enforces.
- [src/hooks/useWallet.ts](../src/hooks/useWallet.ts) — defensive `EMPTY_WALLET` that masked the failure (intentional — supports first-render before snapshot).
- Identity Platform docs: [Blocking functions](https://cloud.google.com/identity-platform/docs/blocking-functions). The OIDC `aud` claim validation rule is documented here.
- Google Cloud docs: [Functions v2 = Cloud Run](https://cloud.google.com/functions/docs/concepts/version-comparison). The `*-uc.a.run.app` URL pattern follows from this.


## ADR-016: Centralize ADMIN_EMAILS + ProductPrice schema in @adsmart/shared; migrate priceManager to v2

**Date:** 2026-05-17
**Status:** Accepted

**Decision:** Remove the 5 hand-maintained copies of `ADMIN_EMAILS` (4 in `functions/src/`, 1 in `src/contexts/AuthContext.tsx`) and route all admin authority checks through `isAdminUser` exported from `@adsmart/shared/auth/admin`. Lift the `productPrices/{id}` shape from inline `interface` declarations (in `priceManager.ts`, `getPublicProductPrices.ts`, `useProductPrices.ts`, `PricesConfigPage.tsx`) into a canonical `ProductPriceSchema` (Zod) under `packages/shared/src/schemas/productPrice.ts` with `DEFAULT_PRODUCT_PRICES` co-located. Migrate `priceManager.ts` from Firebase Functions v1 (`functions.https.onCall`) to v2 (`onCall` from `firebase-functions/v2/https`) with explicit `region`, Zod input validation, and shared `isAdminUser` admin gate.

**Rationale:**

- **AI-codability:** this repo is largely AI-coded. Five independent definitions of `ADMIN_EMAILS` and four of `ProductPrice` create exactly the kind of silent drift where one model edit only touches three of the five copies. The whole point of `@adsmart/shared` (ADR-009) is to be the one place that an agent must read first. Having drifted copies poisons that contract.
- **v1 → v2 alignment:** every other callable in `functions/src/` already uses v2. `priceManager.ts` was the lone v1 hold-out, which meant it could not declare `secrets:[...]`, `region`, or `enforceAppCheck` — making future hardening structurally impossible without a migration.
- **Zod inputs are the contract:** `getDashboardMetrics` is the canonical pattern (input + output schemas in `@adsmart/shared`, `safeParse` on entry, structured `HttpsError` on failure). `updateProductPrices` now follows the same shape via `UpdateProductPricesInputSchema`.
- **Server-controlled audit fields:** `updatedAt` and `updatedBy` are now stamped server-side and excluded from `UpdateProductPriceInputSchema`. A misbehaving client cannot backdate a price change or attribute it to another admin.

**Trade-offs:**

- One more file in `@adsmart/shared` to keep in sync with Firestore reality (mitigated by the `schema-edited-reminder` PostToolUse hook that already exists for this directory).
- `getProductPrices` output is no longer strictly Zod-validated on the way out of the function — only the input of `updateProductPrices` is. That's a deliberate scoping decision: validation cost on a large catalog read is non-trivial, and the schema serves as the type contract via `z.infer<typeof ProductPriceSchema>`. Future ADR can add output-side parsing if drift is observed.
- `enforceAppCheck` is NOT enabled on the migrated callables. The web app does not yet initialize App Check (no `initializeAppCheck(...)` call exists in `src/firebase/`). Turning it on now would break the admin UI immediately. Tracked separately — see ADR-017.

**Migration shape:**

- `@adsmart/shared` now exports `isAdminUser` (already present) + new `ProductPriceSchema`, `UpdateProductPriceInputSchema`, `UpdateProductPricesInputSchema`, `DEFAULT_PRODUCT_PRICES`, and the `ProductPriceCategory`/`ProductPriceType` enums.
- `functions/src/priceManager.ts`, `adminWalletManager.ts`, `getDashboardMetrics.ts`, `backupScheduler.ts` and `src/contexts/AuthContext.tsx` now import `isAdminUser` from `@adsmart/shared` instead of declaring their own constants.
- `src/hooks/useProductPrices.ts` and `src/pages/admin/PricesConfigPage.tsx` import `ProductPrice` from `@adsmart/shared` instead of redefining the interface locally.

**References:**

- [packages/shared/src/auth/admin.ts](../packages/shared/src/auth/admin.ts) — the single source of truth that pre-existed the ADR but was not adopted.
- [packages/shared/src/schemas/productPrice.ts](../packages/shared/src/schemas/productPrice.ts) — new canonical schema for `productPrices/{id}`.
- [functions/src/priceManager.ts](../functions/src/priceManager.ts) — migrated from v1 to v2 in the same change.
- [ADR-009](#adr-009-zod-schemas-in-adsmartshared-as-single-source-of-truth) — the umbrella rule this ADR enforces against drift.
- Firebase docs: [Cloud Functions v2 callable options](https://firebase.google.com/docs/functions/callable). Required reading before touching `priceManager.ts` further.

---

## ADR-017: Google Ads developer token rotation + future App Check enforcement

**Date:** 2026-05-17
**Status:** Accepted (rotation pending operator action)

**Decision:** Remove the hardcoded Google Ads developer token from both `functions/src/googleAdsOAuthV2.ts` and `functions/src/googleAdsOAuth.ts` (legacy v1), and bind it via `defineSecret('GOOGLE_ADS_DEVELOPER_TOKEN')` in `functions/src/config/index.ts`. The literal value (`wRhu9OHLIWdbht2HY3B9yw`) is present in git history (commits `9a59d2bf`, `f63daec9`, `1b795e88`, `36db3ce0`, `ae0f9511`, `fde9ded8` and possibly more); per Google Ads API security guidance, **the operator must rotate the token at the provider**, not just remove it from the source. Until rotation, the leaked token remains usable by anyone with read access to the repository or any clone.

**Operator action required (out of band):**

1. Sign in to the Google Ads manager account used when applying for the API.
2. Navigate to **Tools & Settings → API Center**.
3. Open the **Developer token** dropdown and click **Reset token**. The old token stops working immediately.
4. Provision the new token into Secret Manager for both projects:
   ```bash
   echo "<new-token>" | bunx firebase-tools functions:secrets:set GOOGLE_ADS_DEVELOPER_TOKEN --project adsmart-web
   echo "<new-token>" | bunx firebase-tools functions:secrets:set GOOGLE_ADS_DEVELOPER_TOKEN --project adsmart-web-dev
   ```
5. Redeploy the Google Ads OAuth functions so the new secret binding takes effect:
   ```bash
   bunx firebase-tools deploy --only functions:handleGoogleAdsCallbackWithSelection,functions:confirmGoogleAdsAccountSelection --project <target>
   ```

Until step 4 lands, `getDeveloperToken()` throws `failed-precondition` and Google Ads sync will fail with a clear error rather than silently using a placeholder.

**Rationale:**

- **Source as canonical:** continuing to ship the literal token, even via a `||` fallback, normalizes the practice of committing secrets. The pre-commit hook `secrets-no-process-env` already exists for `*_SECRET`-suffixed names; this ADR closes the equivalent gap for tokens.
- **Rotation > rewriting history:** rewriting git history to remove the leak is destructive (breaks every clone/fork) and incomplete (caches in CI logs, forks, mirrors). The Google Ads API treats the developer token as a credential; the only durable fix is to invalidate it at the provider.
- **App Check deferred, not forgotten:** the audit ([ADR-016 above](#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2)) flagged the absence of `enforceAppCheck: true` on all callables. Enabling it requires `initializeAppCheck()` in the web bootstrap (`src/firebase/config.ts`) plus reCAPTCHA Enterprise key provisioning. Both are coordinated changes touching prod traffic and belong in their own ADR once App Check is initialized in the web app.

**Trade-offs:**

- Until the operator rotates, the leaked token is still valid. There is no code-only fix for this; flagging it explicitly in the ADR is the load-bearing artifact.
- Hardening the v1 OAuth handlers (`functions/src/googleAdsOAuth.ts`) was deliberately not done in this change beyond removing the token literal — those handlers are scheduled for removal once v2 stabilizes (see exports in `functions/src/index.ts` lines 27–31).

**References:**

- [functions/src/config/index.ts](../functions/src/config/index.ts) — declares `googleAdsDeveloperToken` via `defineSecret`.
- [functions/src/googleAdsOAuthV2.ts](../functions/src/googleAdsOAuthV2.ts) — both callables now declare the secret in `options.secrets`.
- Google Ads API: [Reset developer token](https://developers.google.com/google-ads/api/docs/best-practices/security#secure_developer_tokens). The reset procedure cited in the operator action section.
- [ADR-016](#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) — sibling ADR for the v1→v2 migration that landed in the same change.

---

## ADR-018: Schemas for User, UserDocument, OAuthState, TemporaryOAuthToken and RateLimit

**Date:** 2026-05-17
**Status:** Accepted

**Decision:** Lift the inline shapes for `users/{uid}`, `userDocuments/{normalized}`, `oauth_states/{stateId}`, `temporary_oauth_tokens/{tokenId}` and `rateLimits/{userId_action}` into canonical Zod schemas under `packages/shared/src/schemas/`. Migrate `reserveUserDocument` to validate its input via `ReserveUserDocumentInputSchema` and declare its output type via `ReserveUserDocumentOutputSchema` (both exported from `@adsmart/shared`). Modernize existing schemas to Zod 4 idioms — `z.string().datetime()` → `z.iso.datetime()`, `z.string().url()` → `z.url()`, `z.string()` for email fields → `z.email()`. Add `UserClientUpdateSchema` (strict object) to encode at the schema layer what `firestore.rules` already enforces: clients may not write `email`, `createdAt`, `documentType`, or `documentNumber` through `updateDoc`.

**Rationale:**

- **Closes the gap the Sprint 2 audit flagged.** The pre-audit state had 10 Firestore collections without canonical Zod schemas, including `users/{uid}` — the most central entity. Hand-maintained `interface` declarations in `src/types/index.ts:User` had drifted (claimed `displayName` and `photoURL` were Firestore fields when both actually live on Firebase Auth). In an AI-coded repo, that kind of drift compounds: the next agent reads the type, writes code against the wrong shape, and the bug ships.
- **`UserClientUpdateSchema` makes the immutability rule legible at the type layer.** Today the rule lives in `firestore.rules` as `documentLocked()` plus a chain of `request.resource.data.X == resource.data.X` checks. Future code that builds an update payload against `Partial<User>` would type-check but get rejected at write time. With `UserClientUpdateSchema` as the contract, the same intent fails at compile time on the wrong shape.
- **Schemas for OAuth state cement an existing security boundary.** `temporary_oauth_tokens` carries raw provider credentials. Having the shape documented and validated in `@adsmart/shared` (with an explicit "never expose to client API" comment) makes it much harder for a future agent to accidentally return one through a callable response.
- **Zod 4 modernization is a no-op behaviour-wise but a clarity win.** The deprecated method forms (`z.string().email()`, `z.string().url()`, `z.string().datetime()`) still work — but Zod 4's top-level format functions (`z.email()`, `z.url()`, `z.iso.datetime()`) are the documented idiom, less verbose, and tree-shakable. All 94 schema tests pass unchanged through the migration. Verified via Context7 (`/websites/zod_dev_v4`) before shipping.
- **`bootstrapUser` deliberately does NOT validate against `UserSchema`.** The trigger writes a bootstrap subset (`{ email, createdAt, updatedAt }`) where `email` can be empty for OAuth-only signups that didn't surface one. Enforcing `z.email()` there would break the ADR-010 invariant ("`users/{uid}` exists after every signup"). The schema validation seam is `SettingsPage` (via `UserClientUpdateSchema`) and `reserveUserDocument` (via `ReserveUserDocumentInputSchema`), where the doc gets enriched.

**Migration shape:**

- New files (all under `packages/shared/src/schemas/`):
  - `user.ts` — `UserSchema`, `UserClientUpdateSchema`, `DocumentTypeSchema` + matching test file.
  - `userDocument.ts` — `UserDocumentSchema`, `ReserveUserDocumentInputSchema`, `ReserveUserDocumentOutputSchema` + tests.
  - `oauthState.ts` — `OAuthStateSchema`, `TemporaryOAuthTokenSchema`, `OAuthPlatformSchema` + tests.
  - `rateLimit.ts` — `RateLimitSchema` + tests.
- `packages/shared/src/index.ts` exports all 14 new symbols.
- `functions/src/reserveUserDocument.ts` swaps its inline `ReserveRequest`/`ReserveResponse` interfaces + manual `typeof` checks for `safeParse(ReserveUserDocumentInputSchema)` + typed output via `Promise<ReserveUserDocumentOutput>`. Also picks up explicit `region: config.project.region`.
- `functions/src/bootstrapUser.ts` adds a JSDoc paragraph explaining why it does NOT validate against `UserSchema` (to preserve ADR-010) and warns to logs when email is missing on signup.
- `src/types/index.ts` re-exports `User`, `DocumentType`, `UserClientUpdate` from `@adsmart/shared`; the local `interface User` (with stale `displayName`/`photoURL` fields) is deleted. No consumers of `User` from `@/types` exist today, so the deletion is risk-free; the re-export is added so future consumers go through the canonical path.
- Existing schemas modernized: `dashboardMetrics.ts` (3 sites), `report.ts` (1), `adAccount.ts` (1).

**Trade-offs:**

- `OAuthStateSchema` and `TemporaryOAuthTokenSchema` exist in `@adsmart/shared` even though no client code reads them. That's deliberate: the schema is the contract for the server-only writers in `googleAdsOAuth*.ts` / `metaAdsOAuth*.ts`. Future hardening (e.g., switching Base64 token "encryption" for real AES-256-GCM — pending ADR) will want a single place to express the shape that comes out of decryption.
- `UserClientUpdateSchema` is `.strict()`, which means any extra field rejects the parse. This is intentional but tightens the contract: a future client that wants to add `preferences: { ... }` to the same document needs to add the field to the schema first. The alternative — `.passthrough()` — would silently accept anything and re-introduce the drift this ADR was written to close.
- The migration deliberately stops short of validating the **bootstrap** write via `UserSchema`; see rationale bullet above. The cost is one un-validated path; the benefit is preserving ADR-010's invariant.

**References:**

- [packages/shared/src/schemas/user.ts](../packages/shared/src/schemas/user.ts) — canonical profile schema.
- [packages/shared/src/schemas/userDocument.ts](../packages/shared/src/schemas/userDocument.ts) — uniqueness index + reserveUserDocument I/O.
- [packages/shared/src/schemas/oauthState.ts](../packages/shared/src/schemas/oauthState.ts) — CSRF state + sensitive temp token.
- [packages/shared/src/schemas/rateLimit.ts](../packages/shared/src/schemas/rateLimit.ts) — rateLimiter counter.
- [ADR-009](#adr-009-zod-schemas-in-adsmartshared-as-single-source-of-truth) — the umbrella rule this ADR fulfils for the remaining 5 collections.
- [ADR-010](#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) — invariant that constrains how `bootstrapUser` validates.
- [ADR-012](#adr-012-cpfcnpj-uniqueness--immutability-via-callable--uniqueness-index) — original reservation flow; this ADR upgrades its I/O contract.
- [ADR-016](#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) — sibling ADR that did the same lift for `productPrices` and `ADMIN_EMAILS`.
- Zod v4 changelog (`/websites/zod_dev_v4` via Context7): [Top-level string format validators](https://zod.dev/v4/changelog?id=adds-zcore). Justification for the `z.iso.datetime()` / `z.email()` migration.

---

## ADR-019: Remove Firebase App Check + AES-256-GCM for OAuth tokens at rest

**Date:** 2026-05-17
**Status:** Accepted

**Decision:** Two changes that close the two real risks the post-Sprint-2 audit flagged:

1. **Remove Firebase App Check end-to-end.** The previous scaffold in `src/firebase/config.ts` initialized `ReCaptchaEnterpriseProvider` gated by `VITE_APPCHECK_SITE_KEY`, but the env var was never set in any environment and no callable ever opted into `enforceAppCheck: true`. The block was dead code in practice. The same reasoning that retired the reCAPTCHA login widget (ADR-013) applies here: token-based attestation is the right answer eventually, but provisioning a reCAPTCHA Enterprise key + per-environment site keys + a debug-token loop for local dev is meaningful operational overhead, and the product is not yet at a scale where bot abuse is the live risk. Defense in depth comes from Firebase Auth + per-action `checkRateLimit` + Firestore rules instead.
2. **Replace the Base64-encoded "encryption" of OAuth tokens with real AES-256-GCM.** The previous `encryptTokens` functions inlined in `googleAdsOAuth.ts`, `googleAdsOAuthV2.ts`, `metaAdsOAuth.ts` and `metaAdsOAuthV2.ts` did `Buffer.from(plaintext).toString('base64')` — any reader of the Firestore database could decode tokens trivially. Replace with AES-256-GCM via Node's `node:crypto`, key derived via `scryptSync` from the `ENCRYPTION_KEY` secret, random 12-byte IV per encryption call, 16-byte auth tag, and a versioned wire format (`{ v: 1, iv, tag, ct }`) on Firestore so future schemes can coexist with v1 records without an offline migration.

The crypto implementation lives in a new shared module `functions/src/lib/oauthCrypto.ts` — `encryptString`, `decryptField`, `detectAndDecrypt` (backward-compat with legacy Base64), and an `isEncryptedField` type guard. The four OAuth files (V1 + V2 × Google + Meta) delete their local `encryptTokens`/`decryptTokens` and import from this module. Each callable that touches OAuth tokens binds the `encryptionKey` secret in its options.

**Rationale — App Check removal:**

- **Dead-but-loud code is worse than no code.** A scaffold with one configuration knob missing reads as "almost ready" to future agents, who waste cycles trying to flip the knob; meanwhile the actual security posture is the same as having no App Check at all. Removing the scaffold makes the posture honest.
- **Same trade-off as ADR-013.** Anti-bot defenses bought via a third-party provider come with provisioning friction, local-dev friction, and bundle bloat. Firebase Auth's own abuse heuristics + the rate-limiter we already operate give us a "good enough" baseline with zero ops cost.
- **Re-introduction is cheap.** When/if abuse patterns surface, the v9 SDK code that registers a provider is a 10-line addition. Re-introducing it should be its own ADR triggered by a metric, not standing inventory.
- **Honest correction of prior ADRs.** ADR-016 and ADR-017 stated "App Check is NOT initialized in the web client" — that was incorrect: the scaffold WAS initialized but never activated. Both prior ADRs are amended to point at this one rather than rewritten in place, per the docs-as-append-only convention.

**Rationale — AES-256-GCM choice:**

- **Firebase docs explicit recommendation.** "For applications storing tokens for many users, encrypting them at rest is recommended" and "for agent applications that are less security sensitive, keeping credentials in local, encrypted storage" with a key in Secret Manager is documented as a viable option. Confirmed via `firebase__developerknowledge_answer_query` 2026-05-17.
- **Node `node:crypto` is the canonical primitive.** The AEAD pattern `createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 })` + `getAuthTag` / `setAuthTag` is the documented Node.js path. Validated against `/websites/nodejs_latest-v22_x_api` via Context7 2026-05-17.
- **scrypt for key derivation.** `crypto.scryptSync(secret, salt, 32)` is the NIST SP 800-132 KDF appropriate when the input is a secret string (not a high-entropy random buffer). The salt is a fixed project-scoped constant because the secret itself is per-environment and high-entropy; per-record salts would buy nothing and break determinism for key equality across encryption calls.
- **KMS overkill at this scale.** Cloud KMS envelope encryption becomes necessary when the use case demands FedRAMP / HIPAA / PCI compliance, CMEK integration, or HSM-backed keys. None apply to AdSmart at the current pre-payment-launch stage (Stripe planned in FUTURE §8).
- **Versioned wire format is the rotation hedge.** `{ v: 1, ... }` lets a future ADR introduce v2 without an offline migration: `decryptField` branches on `v`, both versions coexist on disk during the window.

**Rationale — backward-compat strategy (read-path migration):**

- **Zero-disruption is the Firebase-recommended path** for credentials at rest: pre-Sprint-3 tokens are still valid; they're just stored in a weaker shape. Forcing every user to re-authenticate would dump them into the OAuth provider's consent screen for no reason they could understand.
- **`detectAndDecrypt` is the seam.** It accepts both a v1 `EncryptedField` and a legacy Base64 string, returning the plaintext either way. Callers in `getValidTokens` (both V1 OAuth files) follow the read with an opportunistic write: if the source field was a string, re-encrypt with AES-GCM. The legacy population on disk shrinks naturally to zero without a one-shot script.
- **One-shot migration was rejected** because it requires a separate run-and-pray script touching live data outside the normal request path, with no way to observe failures inline.

**Rationale — shared module vs four copies:**

- Pre-Sprint-3 already had 4 duplicate copies of `encryptTokens`/`decryptTokens` (V1 + V2 × Google + Meta) with subtle differences. Replacing each one with its own AES implementation would have re-encoded the same duplication. The shared `functions/src/lib/oauthCrypto.ts` is the same architectural move ADR-016 made for `ADMIN_EMAILS` and ADR-018 made for User schemas.

**Trade-offs:**

- **App Check removal is irreversible at the Console layer** only if someone went into the Firebase Console and enabled enforcement. Verified that this was never done (the `VITE_APPCHECK_SITE_KEY` env var was never set, so the SDK never even loaded the App Check chunk).
- **Opportunistic migration adds one extra Firestore write** for each legacy token on its first read post-deploy. Acceptable at current user count.
- **`scrypt` is synchronous and CPU-bound.** Called once per cold start (the derived key is cached). The blocking cost is ~30 ms with default `N=16384` parameters; warm calls are zero-cost.

**ENCRYPTION_KEY rotation procedure** (operator action, out of band):

```bash
firebase functions:secrets:set ENCRYPTION_KEY --project adsmart-web
firebase functions:secrets:set ENCRYPTION_KEY --project adsmart-web-dev

firebase deploy --only \
  functions:confirmGoogleAdsAccountSelection,\
functions:confirmMetaAdsAccountSelection,\
functions:getGoogleAdsCampaigns,\
functions:getMetaAdsCampaigns \
  --project <target>
```

After rotation, existing v1 records written with the OLD key fail to decrypt. The mitigation depends on the rotation reason: if rotating proactively, pre-rotation re-encrypt all live tokens via an admin script. If rotating because of a leak, the leaked tokens are already compromised and forcing re-auth at the next request is the right outcome.

**Migration shape:**

- New file: [functions/src/lib/oauthCrypto.ts](../functions/src/lib/oauthCrypto.ts) + co-located [oauthCrypto.test.ts](../functions/src/lib/oauthCrypto.test.ts) (19 tests covering round-trip, tampering detection, version handling, backward compat, input validation).
- Removed from `src/firebase/config.ts`: the entire App Check init block.
- Removed from `.env.example`: `VITE_APPCHECK_SITE_KEY`.
- Removed from `src/lib/auth/errorMessages.ts`: the `'auth/firebase-app-check-token-is-invalid'` error code mapping.
- 4 files refactored to import from `oauthCrypto`: [googleAdsOAuthV2.ts](../functions/src/googleAdsOAuthV2.ts), [googleAdsOAuth.ts](../functions/src/googleAdsOAuth.ts), [metaAdsOAuthV2.ts](../functions/src/metaAdsOAuthV2.ts), [metaAdsOAuth.ts](../functions/src/metaAdsOAuth.ts). Each callable that touches OAuth tokens binds `encryptionKey` in `options.secrets`.

**References:**

- [functions/src/lib/oauthCrypto.ts](../functions/src/lib/oauthCrypto.ts) — single source of truth for OAuth token encryption.
- [ADR-013](#adr-013-drop-google-recaptcha-from-authentication) — same shape as the App Check removal here.
- [ADR-016](#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) — referenced and partially corrected here.
- [ADR-017](#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement) — referenced and partially obsoleted here (the "future App Check enforcement" subgoal is removed; the Google Ads token rotation subgoal stands).
- Node.js v22 `node:crypto` docs (`/websites/nodejs_latest-v22_x_api` via Context7): `createCipheriv`, `scryptSync`, `randomBytes`, AEAD pattern.
- Firebase developer knowledge (`firebase__developerknowledge_answer_query` 2026-05-17): "encrypting [tokens] at rest is recommended", local symmetric encryption with key in Secret Manager is documented as a viable option for non-FedRAMP-class workloads.

---

## ADR-020: Auth flow hardening 2026-05 (Approach A — surgical refactor)

**Date:** 2026-05-18
**Status:** Accepted (code shipped on `develop`; some operator follow-ups deferred — see "Not done" below)

**Context:**

The authentication surface (Google / Facebook / Email-Password sign-in, sign-up, password change, password reset, email verification, account deletion, route guards, admin gating, blocking trigger) had accumulated drift and latent bugs since Phase 3 landed and through ADRs 013–019. A code-level audit (see [docs/superpowers/archive/specs/2026-05-17-auth-flow-hardening-design.md](./superpowers/archive/specs/2026-05-17-auth-flow-hardening-design.md) §1) identified twelve concrete problems:

1. `LoginPage.handleSubmit` called `createUserWithEmailAndPassword(auth, ...)` directly, bypassing the `signUp` method exposed by `AuthContext` — meaning the Context's `signUp` was dead code, and any future change to the signup flow (e.g., post-signup hooks, telemetry) wouldn't reach this path.
2. Password policy was inconsistent: `LoginPage` enforced 8 chars + complexity (`src/utils/validation.ts`), `SettingsPage` change-password enforced 6 chars (local inline check). Two surfaces, two rules.
3. `getIdTokenResult()` in `AuthContext.onAuthStateChanged` was called WITHOUT `forceRefresh: true`. Custom claims provisioned server-side (e.g., `setCustomUserClaims(uid, { admin: true })`) only appeared after the 1-hour token TTL or sign-out/sign-in. Operationally annoying — new admins needed manual re-auth.
4. `signInWithFacebook` did not request the `email` scope (commented out). The blocking trigger then received `event.data?.email === undefined` for some Facebook users, and the OLD `bootstrapUser` wrote `email: ''` into `users/{uid}`, which violates the `isValidEmail()` rule on any subsequent `users/{uid}` create path.
5. `signInWithFacebook` had `console.log` + `console.error` calls printing `user.email` and `error.credential` — PII leak in the browser console (and in any log aggregator that scraped console).
6. `signIn` was a dead-code alias of `signInWithEmail` in `AuthContextType` — both pointed to the same `signInWithEmailAndPassword` call. Cognitive load with zero benefit.
7. `PrivateRoute` and `AdminRoute` did not honor `loading` from the Context. They appeared to work only because `AuthProvider` rendered `{!loading && children}`, an implicit coupling. Any route guard placed outside the provider would have broken silently.
8. `Link to="/forgot-password"` existed in `LoginPage` but the route was not registered in `App.tsx`. Clicking it produced a blank page.
9. `deleteUserData` Cloud Function was a stub returning `{ success: true, message: 'Função de deleção ainda não implementada completamente' }` — an LGPD/GDPR risk. The `DeleteDataPage` then deleted the user's Firestore doc + Auth user from the client, leaving wallet, transactions, oauth connections, and the `userDocuments` index entry orphaned.
10. `ADMIN_EMAILS` was duplicated in 4 files (`src/contexts/AuthContext.tsx` + 3 Cloud Functions). [ADR-016](#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) partially addressed this for `priceManager`, but `getDashboardMetrics.ts` and `adminWalletManager.ts` still had their own copies, and `AuthContext` still hard-coded the array client-side.
11. `firebase/config.ts` used `getAuth(app)` (the simple default). Without an explicit persistence chain, Safari ITP and embedded-iframe scenarios silently downgraded to in-memory storage, breaking "lembrar-me".
12. `Cross-Origin-Opener-Policy: same-origin` in `firebase.json` is incompatible with `signInWithPopup`'s `window.opener.postMessage` closing handshake. Validated via Context7 against `/firebase/firebase-js-sdk` — the doc explicitly recommends `same-origin-allow-popups` for projects using popup OAuth.

**Decision:**

A single coordinated refactor (**Approach A — surgical**) addresses all twelve points without changing the architectural shape (the `AuthProvider` + `signInWithPopup` model remains). Approaches B (extract Auth Service into `src/services/auth/`) and C (force `signInWithRedirect` + MFA TOTP for admins) were considered and rejected — see §7 of the design spec.

**Implementation summary (26 commits between `f5d5710` and `f0fc264` on `develop`):**

| Phase | Files | Outcome |
|---|---|---|
| **A — Shared modules** | `packages/shared/src/auth/admin.ts`, `password.ts` + co-located tests | `ADMIN_EMAILS` + `isAdminUser(claims, email)` from one place; `PasswordPolicy` (zod) + `validatePassword(pwd): {valid, errors}` with i18n-key error array (`passwordPolicy.tooShort`, etc.) |
| **B — Client config + Context** | `src/firebase/config.ts`, `src/contexts/AuthContext.tsx`, `src/lib/auth/{errors,errorMessages}.ts` | `initializeAuth` with explicit `[indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]` fallback + `browserPopupRedirectResolver`. `AuthContext` removes `signIn` alias, uses shared `isAdminUser`, adds `refreshAuthState(user)` helper (calls `getIdToken(true)` + `user.reload()`) after every sign-in/sign-up, drops PII console.log from Facebook handler, passes `forceRefresh: true` to `getIdTokenResult`, adds explicit OAuth scopes (Google: `profile`+`email`+`prompt: 'select_account'`; Facebook: `email`+`public_profile`), removes the `{!loading && children}` gate. New `errors.ts` exposes `isAuthError(err): err is FirebaseError`; `errorMessages.ts` maps 16 auth codes to i18n keys with privacy collapse (`auth/invalid-credential` = `auth/wrong-password` = `auth/user-not-found` → `loginPage.error.invalidCredentials`). |
| **C — Route guards + banner** | `src/components/{AuthLoadingFallback,PrivateRoute,AdminRoute,EmailVerificationBanner}.tsx` + tests | Guards honor `loading` and render `<AuthLoadingFallback />` (centered `Loader2` with `aria-label="Carregando"`) until ready. `Navigate` uses `replace` to avoid history pollution. New non-blocking `EmailVerificationBanner` mounted as the first child of `<main>` in `MainLayout` — appears only for `hasPasswordProvider && !user.emailVerified`; resend button calls `sendEmailVerification(user)`. 5 i18n keys added under `common.emailVerification.*` in pt-BR / en / es. |
| **D — Pages refactor** | `src/pages/{LoginPage,ForgotPasswordPage,SettingsPage,DeleteDataPage}.tsx`, `src/utils/validation.ts`, locales | LoginPage calls `signUp` from Context, uses shared `validatePassword`, uses `authErrorToTKey` for error mapping. New `ForgotPasswordPage` at `/forgot-password` using `sendPasswordResetEmail(auth, email, { url: \`${origin}/login\` })` — privacy collapse (`auth/user-not-found` also surfaces success). SettingsPage change-password uses shared policy and `authErrorToTKey`. `src/utils/validation.ts` becomes a thin re-export shim over `@adsmart/shared/auth/password`. `validation.test.ts` deleted (legacy `string[]` shape; coverage preserved by `packages/shared/src/auth/password.test.ts`). 12 new locale keys: 3 in `common.error` (`network`, `requiresReauth`, `appCheckFailed`), 4 in `loginPage.error` (`popupBlocked`, `popupClosed`, `accountConflict`, `credentialInUse`), 5 in `passwordPolicy.*` root block. New `forgotPasswordPage` namespace with 6 keys. |
| **E — Functions hardening** | `functions/src/{bootstrapUser,securityLogger,deleteUserData,getDashboardMetrics,priceManager,adminWalletManager}.ts` | `bootstrapUser` resolves email via fallback: `event.data.email → providerData[*].email → null`. If no email found, `users/{uid}` is created WITHOUT the email field (no more `email: ''`). Structured Cloud Logging telemetry: `console.log(JSON.stringify({ event: 'bootstrapUser.success', uid, email_present, providers }))`. `USER_DELETION` added to `SecurityEventType` enum. `deleteUserData` real: cascade delete 5 subcollections (`wallet`, `transactions`, `oauthConnections`, `reports`, `activityLogs`) in batches of 400, drops `userDocuments/{normalizedDocId}` if present (ADR-012), deletes `users/{uid}`, deletes Firebase Auth user, logs `USER_DELETION` via `securityLogger`. Rate-limited 1×/hour via `checkRateLimit(uid, 'deleteUserData', 1, 60)`. `DeleteDataPage` requires typing the user's own email (case-insensitive) to enable the button; signs out + navigates to `/login` after success. Three functions (`getDashboardMetrics`, `priceManager`, `adminWalletManager`) now import `isAdminUser` from `@adsmart/shared` — local `ADMIN_EMAILS` arrays removed. |
| **F — Hosting** | `firebase.json` | `Cross-Origin-Opener-Policy` changed from `same-origin` to `same-origin-allow-popups`. `Cross-Origin-Resource-Policy: same-origin` unchanged. |
| **Post-validation fix** | `src/pages/{LoginPage,SettingsPage}.tsx`, locales | Browser smoke test via Playwright + Chrome DevTools detected: (a) catch handlers routed pre-validation `throw new Error(<translated message>)` through `authErrorToTKey`, which returned `common.error.generic` for any non-FirebaseError — users saw "Erro ao processar solicitação" instead of the actual policy violation list; (b) `common.validation.minimumCharacters` was hard-coded "Mínimo 6 caracteres" — stale. Fixed in commit `f0fc264`. |

**App Check note.** Task B2 of the plan originally added a gated App Check initialization (`initializeAppCheck` with `ReCaptchaEnterpriseProvider` behind `VITE_APPCHECK_SITE_KEY`). [ADR-019](#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest) — landed in parallel — removed App Check entirely. Commit `78d6e3b` therefore landed as a no-op (the code was reverted as part of ADR-019). The `'auth/firebase-app-check-token-is-invalid' → 'common.error.appCheckFailed'` mapping in `src/lib/auth/errorMessages.ts` was likewise removed by ADR-019. The remaining auth-error map (15 codes) is unchanged.

**Browser validation (Playwright + Chrome DevTools):**

Smoke-tested end-to-end on `localhost:5173` against `adsmart-web-dev`:

- `/login` renders, `/forgot-password` link works.
- ForgotPasswordPage: submitting with a known-bad email shows the privacy-collapsed success message; network shows `sendOobCode → 400` but UI shows "Email enviado...".
- Signup with `weak` password shows the 4-line policy violation list in pt-BR (from `passwordPolicy.*` keys).
- Signup with `Strong1!` creates the user; network shows `signUp → token (×2 force refresh) → lookup` then redirect to `/dashboard`. Firestore `users/{uid}` + `wallet/current` both seeded by `bootstrapUser` (verified by reading the wallet balance R$ 0,00 from the dashboard).
- `EmailVerificationBanner` visible on `/dashboard` and `/settings` (the test user signed up with email and is unverified).
- `/admin` (non-admin user) redirects to `/dashboard` via `AdminRoute`.
- `AuthLoadingFallback` (spinner with `aria-label="Carregando"`) captured during a manual reload by a `MutationObserver` init script.
- Sign-out simulated by clearing IndexedDB + reloading. `/settings` → `/login` (via `<Navigate replace>` in `PrivateRoute`).
- DeleteDataPage UI rendered with email-typed confirmation gate; delete button correctly `disabled` until the user types their own email. (Actual delete click blocked by the safety classifier — irreversible destructive action without explicit per-action authorization. Server-side handler tested separately via `bun run test:all` plus the typecheck/build chain.)

**Trade-offs:**

- **COOP downgrade** (F1) weakens cross-origin isolation. Acceptable — AdSmart doesn't use SharedArrayBuffer or cross-origin-restricted APIs. The alternative (Approach C: `signInWithRedirect`) hurts UX and adds `getRedirectResult` timing complexity. Future option: Identity Platform custom auth domain would let us restore `same-origin`.
- **Force token refresh on every sign-in** adds ~100–200ms one-time latency per session. Acceptable for correctness — custom admin claims now appear without a manual sign-out/sign-in cycle.
- **Two forced refreshes per sign-in.** The in-method `refreshAuthState` AND the listener's `getIdTokenResult(true)` both round-trip to Identity Toolkit. Three reqs per sign-in (signIn → token → lookup → token). Correct, but chatty. Optimization deferred — perf footprint negligible at current scale.
- **Email-less users.** Facebook accounts that withhold email even with the scope land in Firestore with `users/{uid}` missing the email field. `SettingsPage.loadUserProfile` falls back to `user.displayName` for the form. Alternative was rejecting the signup outright — too aggressive for a B2B SaaS where the user can fill email post-signup.
- **`auth/wrong-password` privacy collapse downgrade.** Pre-refactor, `SettingsPage` change-password showed "Senha atual incorreta" for wrong current password. Post-refactor, the shared map collapses this to "Credenciais inválidas" (matching the LoginPage signin flow). Defensible — same privacy invariant — but UX regression at the change-password screen. Tracked.
- **`auth/provider-already-linked` falls through to `common.error.generic`.** This code was hand-mapped pre-refactor to "Esta conta já tem senha cadastrada". Post-refactor, it's not in `AUTH_ERROR_KEY_MAP`, so unknown OAuth-only users trying to set an initial password might see a generic message. Low-frequency path (one-time only); add to the map if reported in the wild.
- **Public pages flash** (B4 reviewer issue #1). With `AuthProvider` no longer gating children on `loading`, public pages (`/`, `/login`, `/privacy`, `/terms`) render once with `user: null, loading: true` before the first `onAuthStateChanged` callback fires. `HomePage` reads `user` to decide CTA targets — a returning logged-in user briefly sees "Entrar" before it flips to "Dashboard". Acceptable for now; mitigation would be wrapping public-content with an inline loading hint or skeleton.

**Alternatives considered:**

- **Approach B — Extract Auth Service** into `src/services/auth/AuthService.ts`, leaving the Context thin. Rejected: YAGNI for a single auth context, no parallel non-React consumer.
- **Approach C — `signInWithRedirect` + MFA TOTP for admins.** Compatible with COOP `same-origin` and adds real MFA. Rejected: large scope (recovery codes UI, admin reset tooling), questionable ROI at current scale (~2 admins, no observed targeted attacks). Deferred to a future ADR when justified.

**Not done (deferred follow-ups):**

- **`HomePage` flash** (B4 reviewer issue #1). Documented above as a known trade-off. Future fix would wrap public-page CTAs with a tiny skeleton or render `user` via `useDeferredValue`.
- **`useMemo` on `AuthContext.value`.** Code reviewer flagged in B4 as Minor. The value object is recreated each render, but consumers using individual property destructuring don't re-render unnecessarily. Acceptable until React 19 / Compiler is on by default.
- **`useReducer` for AuthContext state.** Three pieces of coupled state (`user`, `loading`, `isAdmin`); idiomatic React 18 in 2026 would use `useReducer`. Scope creep relative to this refactor — kept `useState` to match pre-existing shape.
- **`vi.mock('@/firebase/config')` in `src/test/setup.ts`** is a pragmatic workaround. The real fix is Vitest `resolve.conditions: ['browser']` or only importing `firebase/auth` via dynamic import — both attempted, both blocked by Vite's `node_modules` externalize. Mock is the lowest-cost solution; tests that need real Firebase override with their own `vi.mock`. Tech debt tracked.
- **`useTransition` for sign-in actions.** React 18+ `startTransition` would keep the UI responsive during the OAuth round-trip. Out of scope for this refactor.
- **Playwright e2e tests for the auth flows.** Repo has `@playwright/mcp` installed; this refactor did manual browser validation via DevTools + Playwright MCP but did not commit a recorded test. Tracked as follow-up.
- **`onCall` migration for `deleteUserData`.** The function uses v2 `onCall`, but the existing `enforceAppCheck: true` flag was removed by ADR-019. Future App Check rollout — if ever — would re-add it; tracked as part of ADR-017's "future App Check enforcement" subgoal (now obsolete per ADR-019).
- **Operator step — provision custom admin claims for the existing email allowlist.** Per [docs/SECURITY.md Admin access](SECURITY.md#admin-access), the email allowlist is a transition fallback. Removal is deferred until all current admins have custom claims provisioned. The shared `isAdminUser(claims, email)` keeps both paths working until then.
- **Operator step — set `passwordPolicy` in Identity Platform Console** to mirror the shared policy (min 8, complexity). The client + server agreement is currently soft; Identity Platform's own policy would be defense-in-depth.

**References:**

- [docs/superpowers/archive/specs/2026-05-17-auth-flow-hardening-design.md](./superpowers/archive/specs/2026-05-17-auth-flow-hardening-design.md) — design + alternatives matrix.
- [docs/superpowers/archive/plans/2026-05-17-auth-flow-hardening-plan.md](./superpowers/archive/plans/2026-05-17-auth-flow-hardening-plan.md) — implementation plan.
- [docs/superpowers/archive/notes/2026-05-17-auth-flow-hardening-execution-log.md](./superpowers/archive/notes/2026-05-17-auth-flow-hardening-execution-log.md) — live execution log with all per-task commit SHAs and the E5 scope-creep amend lesson.
- [packages/shared/src/auth/admin.ts](../packages/shared/src/auth/admin.ts) + [password.ts](../packages/shared/src/auth/password.ts) — single source of truth for admin allowlist and password policy.
- [src/lib/auth/errors.ts](../src/lib/auth/errors.ts) + [errorMessages.ts](../src/lib/auth/errorMessages.ts) — `isAuthError` type guard and `authErrorToTKey` Firebase Auth code → i18n key map.
- [src/firebase/config.ts](../src/firebase/config.ts) — `initializeAuth` with explicit persistence + popupRedirectResolver.
- [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) — `refreshAuthState` + scopes + `prompt: 'select_account'` + `getIdTokenResult(true)`.
- [src/components/AuthLoadingFallback.tsx](../src/components/AuthLoadingFallback.tsx), [EmailVerificationBanner.tsx](../src/components/EmailVerificationBanner.tsx), [PrivateRoute.tsx](../src/components/PrivateRoute.tsx), [AdminRoute.tsx](../src/components/AdminRoute.tsx).
- [src/pages/ForgotPasswordPage.tsx](../src/pages/ForgotPasswordPage.tsx), [LoginPage.tsx](../src/pages/LoginPage.tsx), [SettingsPage.tsx](../src/pages/SettingsPage.tsx), [DeleteDataPage.tsx](../src/pages/DeleteDataPage.tsx).
- [functions/src/bootstrapUser.ts](../functions/src/bootstrapUser.ts), [deleteUserData.ts](../functions/src/deleteUserData.ts), [securityLogger.ts](../functions/src/securityLogger.ts) (`USER_DELETION` enum).
- [firebase.json](../firebase.json) — `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- [ADR-010](#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) — `bootstrapUser` blocking trigger this ADR hardened.
- [ADR-012](#adr-012-cpfcnpj-uniqueness--immutability-via-callable--uniqueness-index) — `userDocuments` cleanup logic in `deleteUserData`.
- [ADR-013](#adr-013-drop-google-recaptcha-from-authentication) — context for why the threat model shifted toward Firebase Auth + App Check (later removed by ADR-019).
- [ADR-015](#adr-015-register-identity-platform-blocking-trigger-after-total-firestore--auth-wipe) — runbook for trigger registration; relied on here for the `bootstrapUser` operational guarantee.
- [ADR-016](#adr-016-centralize-admin_emails--productprice-schema-in-adsmartshared-migrate-pricemanager-to-v2) — the prior partial unification of `ADMIN_EMAILS`; this ADR completes it for the two remaining callables.
- [ADR-019](#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest) — landed in parallel; superseded Task B2 of this work's plan.
- Context7: `/firebase/firebase-js-sdk` — `initializeAuth`, persistence array, `setCustomParameters`, COOP/popup recommendation (queried 2026-05-17).

---

## ADR-021: Remove SuitPay end-to-end + harden prepare-deploy against secret/env overlap

**Date:** 2026-05-18
**Status:** Accepted (dev shipped; prod pending operator authorization)

**Decision:** Delete SuitPay completely from the codebase and from deployed Cloud Functions in `adsmart-web-dev`. The deletion covers:

- 2 source files: `functions/src/suitpayPayment.ts`, `functions/src/suitpayWebhook.ts`
- 3 callables removed from `functions/src/index.ts` exports: `suitpayWebhook`, `createPixPayment`, `checkPaymentStatus`
- 2 secrets removed from `functions/src/config/index.ts`: `defineSecret('SUITPAY_CLIENT_ID')`, `defineSecret('SUITPAY_CLIENT_SECRET')`
- `config.suitpay` block + the now-orphaned `getWebhookUrl` and `getRedirectUrl` helpers (only used by SuitPay) removed from the same file
- 2 plain-text values purged from `functions/.env`: `SUITPAY_CLIENT_ID=zennytecnologiagmailcom_*`, `SUITPAY_CLIENT_SECRET=7ff0...` (they were leaking into the Cloud Run service spec as non-secret env vars)
- `GOOGLE_ADS_DEVELOPER_TOKEN=wRhu...` also purged from `functions/.env` (same reason — should have been only in Secret Manager since ADR-017)
- 2 UI files deleted: `src/components/ui/PixPaymentModal.tsx`, `src/services/paymentService.ts`
- 1 UI file rewritten as maintenance-notice placeholder: `src/components/ui/AddCreditsModal.tsx` (3 callers depend on it — Header, MobileHeader, TemplatesPage)
- 3 Cloud Run services deleted in `adsmart-web-dev` via `firebase functions:delete`: `suitpayWebhook`, `createPixPayment`, `checkPaymentStatus`

Additionally, `functions/scripts/prepare-deploy.mjs` is **hardened** to filter `.env` keys that match any `defineSecret(...)` declaration in `config/index.ts` before writing `functions/deploy/.env`. This prevents the exact failure mode that surfaced during Sprint 3 (`Secret environment variable overlaps non secret environment variable: X`) from recurring even if a future `.env` accidentally re-introduces a secret-shadow.

**Rationale:**

- **SuitPay was already deprecated** (see prior memory `suitpay_deprecated.md`); the code stayed live "until Asaas lands". Two consecutive sprints (1 and 3) ran into SuitPay-related deploy/security incidents because the dead code carried real `defineSecret` bindings and real env vars. Keeping the deprecated layer increased the blast radius of every unrelated change.
- **Zero production users.** `adsmart.app` domain is not pointed yet; the app is still in development. The window for "delete cleanly" is now; once users transact, the cost of removing payment paths rises.
- **The env-var overlap was the proximate cause of the Sprint 3 deploy failure.** Sprint 3 (ADR-019) needed `confirmGoogleAdsAccountSelection` to be redeployed with `encryptionKey` bound, but the Cloud Run service spec for that callable had inherited `GOOGLE_ADS_DEVELOPER_TOKEN` (and `SUITPAY_CLIENT_ID` + `SUITPAY_CLIENT_SECRET`) as plain env vars from a much older deploy when those values were in `functions/.env` and not in Secret Manager. `firebase deploy` could not reconcile (HTTP 400 `Secret environment variable overlaps non secret environment variable`), and `gcloud run services update --remove-env-vars` failed because Firebase CLI 14+ had garbage-collected the source image (default cleanup policy: 1 day). The only recovery left was `firebase functions:delete` + `firebase deploy`, which is what was done.
- **Hardening `prepare-deploy.mjs` is the durable fix.** Without it, a future `functions/.env` edit that accidentally drops a `*_SECRET` or `*_TOKEN` line would re-introduce the same trap. The hardening reads `config/index.ts`, regex-extracts every `defineSecret('NAME')` declaration, and refuses to propagate any `NAME=...` line from `functions/.env` to `functions/deploy/.env`. Pre-existing failures in Cloud Run service specs are not auto-cleaned (those need `functions:delete`), but no new ones can be introduced.
- **`AddCreditsModal` rewritten, not deleted**, because the "add credits" feature is permanent — only the payment backend changed. Three call sites depend on the component; replacing them all with conditional rendering would add coupling for no benefit. The maintenance notice is the honest UX: "Pagamento indisponível no momento — estamos migrando o sistema. Entre em contato com o suporte se precisar de créditos urgentemente."

**Trade-offs:**

- **Production cleanup deferred.** Cloud Run services `suitpayWebhook`, `createPixPayment`, `checkPaymentStatus` still exist in `adsmart-web` (the prod project). They are not reachable from the production UI (UI was updated) and they have no traffic (no users). They will be deleted on the next prod deploy + explicit `functions:delete` once the operator authorizes a prod deploy.
- **`Transaction.payerName` / `payerCpf` / `paymentId` kept in the schema** as optional fields. Historical SuitPay transactions wrote those fields, and the schema must still parse them. When the next payment provider lands (Stripe planned via FUTURE §8), these fields will be re-evaluated — Stripe uses Customer + PaymentIntent IDs which may map differently.
- **`functions/deploy/.env` filter is one-way.** It strips secret-shadow keys but does not warn the source `.env` is contaminated; it only warns at build time. Pre-commit hook could add the same scan in the future; out of scope for this ADR.

**Operator follow-ups:**

1. **Prod cleanup (when ready):**
   ```bash
   firebase functions:delete suitpayWebhook createPixPayment checkPaymentStatus --project adsmart-web --region us-central1 --force
   firebase deploy --only functions --project adsmart-web
   ```
   The deploy will also bring the Sprint 1 / Sprint 2 / Sprint 3 + ADR-020 codebase changes to prod (AES-256-GCM for OAuth, all the schema work, etc).
2. **Decide on payment provider timeline (Stripe, FUTURE §8).** `AddCreditsModal` placeholder is acceptable temporarily; users will see "payment in maintenance".

**Lessons learned (codified into memory):**

- New memory: [[firebase_deploy_env_overlap_trap]] — the exact failure mode + canonical recovery.
- New memory: [[firebase_deploy_workflow_rules]] — hard rules for any firebase deploy operation, built from the incidents that produced this ADR.
- Memory: `suitpay_deprecated` was deleted in Fase 0c (2026-05-19) as redundant — this ADR + `docs/PAYMENTS.md` are the authoritative sources. The next payment provider (Stripe, FUTURE §8) will have its own memory when implementation starts.

**References:**

- [functions/src/lib/oauthCrypto.ts](../functions/src/lib/oauthCrypto.ts) — the encryption module Sprint 3 introduced; sets the bar for "what an integration handling sensitive tokens should look like" (relevant when Stripe lands — FUTURE §8).
- [functions/src/adminWalletManager.ts](../functions/src/adminWalletManager.ts) — reference for atomic wallet credit transaction; mirror this shape for the next payment provider (Stripe, FUTURE §8).
- [functions/scripts/prepare-deploy.mjs](../functions/scripts/prepare-deploy.mjs) — hardened to filter secret-shadow keys before deploy bundle is materialized.
- [ADR-017](#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement) — token-rotation procedure cited by the deploy hardening above.
- [ADR-019](#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest) — the parallel ADR whose deploy this one unblocked.
- Firebase developer knowledge (queried 2026-05-18): "After removing function exports from `index.ts` and running `firebase deploy` without the `--only` flag, Firebase will implicitly delete the now-orphaned Cloud Functions."
- Cloud Run docs (queried 2026-05-18, via Firebase developer-knowledge MCP search): `gcloud run services update --remove-env-vars` for selective env var removal; this command was attempted and failed due to image garbage collection, leading to the `functions:delete` path.

---

## ADR-022: Render in-app substitui Google Data Studio

**Date:** 2026-05-19
**Status:** Planned (Fase 3.5)

**Decision:** O fluxo de geração de relatório (FLOW-3) renderiza dashboards diretamente no AdSmart (componente in-app + Cloud Function para sintetizar dados) em vez de redirecionar para Google Data Studio / Looker Studio.

**Rationale:**

- Looker Studio adiciona uma camada externa: o usuário sai do AdSmart, perde brand presence, e a experiência de exportação (PDF, share link) fica fora do nosso controle.
- Migração do Google Marketing Platform para Google Cloud com mudanças repetidas em pricing/branding do Looker Studio aumenta risco de dependência.
- A unique value do AdSmart é a síntese LLM (insights, recomendações) — entregar isso embedded com o dashboard reforça o produto; redirecionar dilui.
- Custo de implementação: charts + tabelas in-app são commodity (Recharts/visx); a complexidade está nos dados, não no rendering.

**Trade-offs:**

- Precisa manter o componente de charts no app (vs delegar para Looker).
- Performance: charts pesados em mobile precisam de cuidado com bundle size + lazy loading.
- Templates do Looker Studio já existentes precisam ser re-implementados.

**References:**

- See `docs/redesign/FEATURES-INVENTORY.md` § FLOW-3
- See memory `report_flow_v2` (planned)
- Replaces the legacy "redirect to Looker" flow currently in `src/pages/TemplatesPage.tsx` + `src/pages/GenerateReportPage.tsx`

---

## ADR-023: Sistema de Créditos (1 cr = R$5, 1 plataforma = 1 cr)

**Date:** 2026-05-19
**Status:** Planned (Fase 3.5)

**Decision:** Pricing model é **prepaid credits**, não subscription nem pay-per-report. Cada crédito = R$5,00. Geração de relatório custa 1 crédito por plataforma (single = 1 cr, Google + Meta = 2 cr).

**Rationale:**

- Agências de marketing têm uso irregular: alguns meses geram 30 relatórios, outros 3. Subscription gera friction (paga sem usar) ou caro demais (planos altos para ocasionalmente usar).
- Pay-per-report (charge na hora) é UX pesada: fluxo de cobrança em cada geração quebra o flow.
- Prepaid credits combina previsibilidade (top-up R$50 = 10 créditos = 5-10 relatórios) com UX leve (saldo no header, geração sem fricção quando há saldo).
- 1 cr = R$5 dá target margin razoável considerando custo LLM (Anthropic + DeepSeek) + custos de infraestrutura por relatório.

**Trade-offs:**

- Precisa de wallet management server-side (já existe — `adminWalletManager.ts`).
- Top-up implica integração de pagamento (Stripe, FUTURE §8 — vide ADR-021 que removeu SuitPay).
- Não suporta enterprise subscription se quisermos no futuro — pode coexistir adicionando esse modelo depois.

**References:**

- See `docs/redesign/FEATURES-INVENTORY.md` § MN-1
- See memory `credits_system` (planned)
- Schemas já existem: `packages/shared/src/schemas/userWallet.ts`, `transaction.ts`
- Reference pattern: `functions/src/adminWalletManager.ts` (transação atômica wallet + transactions)

---

## ADR-024: LLM combo Anthropic + DeepSeek com roteamento por tarefa

**Date:** 2026-05-19
**Status:** Planned (Fase 3.5)

**Decision:** Stack LLM é **dois provedores combinados**: Anthropic Claude (primary, quality-first) + DeepSeek (fallback, cost-first), com roteamento per-call baseado na tarefa.

**Rationale:**

- Single-provider Anthropic seria 3-5× mais caro em escala (background classification de business types, embeddings, etc. são alto volume).
- Single-provider DeepSeek degrada qualidade dos relatórios user-visible (que é onde o cliente paga o crédito).
- Combo permite cada modelo fazer o que faz melhor: Anthropic para síntese e relatório final; DeepSeek para classificação prévia, embeddings, batch jobs.
- Roteamento per-call (não global) significa que uma callable `generateReport` pode chamar ambos no mesmo request — Anthropic para o passo de síntese, DeepSeek para pré-classificação do tipo de negócio.

**Trade-offs:**

- Duas API keys + dois SDKs para manter.
- Lógica de routing precisa estar clara (documentado no callable / na memory `llm_combo_strategy`).
- Observability harder: precisa logar `modelId` em cada call para attribution de custo + qualidade (vide hook `check-llm-call-via-logger.sh` Fase 0b).

**References:**

- See `docs/research/02-llm-strategy.md` (fundamentação completa do combo)
- See memory `llm_combo_strategy` (planned)
- Secrets reservados: `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` em memory `firebase_secrets` (planned)
- Hook `check-llm-call-via-logger.sh` (Fase 0b) bloqueia callable LLM sem `logger.info` estruturado com modelId/tokensIn/tokensOut

---

## ADR-025: Share-link público via UUID v4 + snapshot em subcoleção

**Date:** 2026-05-19
**Status:** Planned (Fase 3.5)

**Decision:** Shareable report URLs usam **UUID v4 token + Firestore public collection com snapshot data**. URL shape: `https://adsmart.app/r/{uuid-v4}`. Coleção: `publicReportShares/{token}`. Public, no auth required.

**Rationale:**

- Alternativas avaliadas (`docs/research/04-share-link-patterns.md`):
  - Signed URLs from Cloud Storage → abstração errada (data, não files).
  - Auth-gated com magic-link → friction (recipients precisam registrar/login).
  - Live-data share (read direto de `reports/{id}`) → permission complexity + data drift após o report original.
  - **UUID + snapshot** venceu em: (a) zero friction para recipients, (b) data fidelity over time, (c) rules simples, (d) revogação fácil.
- UUID v4 tem ~122 bits de entropy — unguessable na prática.
- Snapshot data é imutável; mesmo se o report original mudar/for deletado, o share continua válido com os dados originais.
- Firestore rule: `allow read: if true;` no path do token; `allow write: if false;` (apenas server via callable).

**Trade-offs:**

- Storage cost: cada share guarda um snapshot completo. Mitigado por TTL ou compactação.
- Revogação requer flag `revoked: true` no doc (não pode "esquecer" um token uma vez emitido).
- Schema já existe: `packages/shared/src/schemas/publicReportShare.ts` (Fase -1).

**References:**

- See `docs/research/04-share-link-patterns.md` (análise full)
- See memory `share_link_pattern` (planned)
- Schema: `packages/shared/src/schemas/publicReportShare.ts`
- Princípio 10 (default deny + server-side write only) aplica

---

## ADR-026: Playwright em Cloud Function para Export PDF

**Date:** 2026-05-19
**Status:** Planned (Fase 3.5)

**Decision:** Export PDF do relatório roda **Playwright headless dentro de Cloud Function v2** (não client-side jsPDF/react-pdf).

**Rationale:**

- jsPDF não renderiza charts reais (só shapes básicos); react-pdf força redesenhar todo o layout.
- Playwright reutiliza o HTML/CSS que o usuário vê — pixel-perfect parity entre web e PDF.
- Client-side libs adicionam 200-500KB ao bundle do web para operação rara.
- Server-side render não depende de browser/zoom/fonts do usuário (consistência).
- Cold-start mitigado: aceitar 5-10s na primeira exportação (raro), warming para casos críticos.

**Trade-offs:**

- Cloud Function precisa ~512MB-1GiB memory + 30-60s timeout.
- Custo: Playwright em CF é mais caro que client-side ($0.01-0.05 por export estimado).
- Volume: dezenas de exports/dia justificam; centenas/segundo não.

**References:**

- See `docs/research/05-pdf-generation.md` (comparação detalhada)
- See memory `playwright_pdf` (planned)
- Storage: PDFs em Cloud Storage `reportPdfs/{userId}/{reportId}-{timestamp}.pdf`
- Alternativa de render: navegar à URL do `share_link_pattern` (ADR-025) — simplifica auth

---

## ADR-027: Tailwind v4 + Apple SF Pro como design system

**Date:** 2026-05-19
**Status:** Planned (Fase 1)

**Decision:** Design system DS-1 da AdSmart usa **Tailwind v4** (CSS-first config via `@theme`/`@utility`) + **Apple SF Pro** (typography) + tokens semânticos + primitives novos.

**Rationale:**

- Tailwind v4 (lançado 2026) tem CSS-first config: tokens e utilities ficam em CSS puro via `@theme` em vez de `tailwind.config.js`. Reduz boilerplate + ferramentas externas (PostCSS auto-included).
- SF Pro variable font: leveza visual + alta legibilidade + alinhamento com estética mobile-first iOS-like que AdSmart quer projetar. Licenciamento Apple permite uso em web.
- Tokens semânticos (`bg-surface-2`, `text-foreground`) em vez de cores hardcoded permitem dark mode + temas sem refactor por componente.
- Primitives novos (shadcn-like mas refinados para AdSmart) substituem progressivamente os componentes shadcn diretos onde a estética não combina.

**Trade-offs:**

- Migration cost de Tailwind 3.x → v4: PostCSS plugins, build pipeline, syntax changes (`@apply` semantics diferentes). Aceitável: ferramenta de migration auto cobre 80%.
- SF Pro license restrita a contexto Apple: precisa hostar self ou via Apple Fonts Service. Aceitável.
- Refactor visual de telas existentes (Fase 3) consome tempo significativo.

**References:**

- See `docs/research/03-frontend-stack.md` (Tailwind v4 + React 19 migration plan)
- See `docs/UI-DESIGN.md` (sistema visual da AdSmart)
- See `docs/redesign/FEATURES-INVENTORY.md` § DS-1
- Skill `redesign-screen` (Fase 0b) automatiza refactor de tela a tela
- Princípio: não preempt Tailwind v4 syntax antes de Fase 1 mergear — `src/AGENTS.md` § Current vs target stack documenta

---

## ADR-028: Adotar Harness Engineering (Fowler taxonomy)

**Date:** 2026-05-19
**Status:** Accepted (Fase 0a — implementado)

**Decision:** O ciclo de desenvolvimento do AdSmart adota **Harness Engineering** (Martin Fowler, abr/2026) como padrão de trabalho com agentes IA: **Guides** (feedforward, antes da execução) + **Sensors** (feedback, depois da execução), com separação computacional/inferencial.

**Rationale:**

- O AdSmart é desenvolvido por uma pessoa coordenando múltiplos agentes IA. Sem disciplina, isso degrada rapidamente para "código bonito que não passa em produção" (loop infinito de retrabalho).
- Harness Engineering dá vocabulário e estrutura: SPEC + CONTRACT são guides feedforward; lint + typecheck + tests + validator agent são sensors feedback.
- Score binário (passou/não passou) elimina o cinza "85% pronto" que normalmente vira tech debt.
- Separação computacional/inferencial mapeia direto para as ferramentas: sensors computacionais (hooks bash, lefthook, vitest) cobrem o determinístico; sensors inferenciais (validator agent) cobrem coerência semântica.

**Trade-offs:**

- Overhead inicial de criar SPEC + CONTRACT + EVALUATION per sprint. Aceitável: a Fase 0a/0b/0c mostraram que ~30min de setup poupa horas de retrabalho.
- Curva de aprendizado para entender o vocabulário (Implementer, Validator, contract, wave, sensor).
- Para mudanças triviais (single-line bugfix) o overhead é desproporcional — usar judgement.

**References:**

- See `docs/research/09-harness-engineering.md` (research completa, fundamentação Fowler + GSD + Anthropic Agent SDK)
- See `docs/HARNESS-RUNBOOK.md` (workflow canônico de sprint)
- See memory `harness_pattern` (active)
- Implementado nas Fases 0a (harness + 6 agents), 0b (skills + commands + hooks), 0c (memory cleanup)

---

## ADR-029: Multi-process agents (Implementer ≠ Validator)

**Date:** 2026-05-19
**Status:** Accepted (Fase 0a — implementado)

**Decision:** O agente que faz `Edit/Write` (Implementer) **não pode** ser o agente que verifica o output (Validator). Enforcement é mecânico via campo `tools:` no frontmatter de `.claude/agents/*.md` — Validator não tem permissões de `Edit` nem `Write`.

**Rationale:**

- Bias do auto-julgamento é irreduzível: o mesmo agente que escreveu o código racionaliza decisões para PASS quando avalia. Padrão consistente em research/09 (Fowler + GSD framework + Anthropic Agent SDK).
- Enforcement no nível do tooling (não no prompt) é mais robusto: prompts podem ser ignorados sob pressão; tool absence não.
- Fresh 200k context per Agent invocation isola o validator do reasoning artifacts do implementer.
- Forçar o validator a ler arquivos + sensor outputs (em vez de aceitar narrativa) gera evidência citável.

**Trade-offs:**

- 6 agents em `.claude/agents/` (orchestrator, researcher, planner, implementer, validator, debugger) adicionam complexidade conceitual.
- Custo: cada Agent invocation é uma chamada LLM separada (~$0.50-2 por validator pass em sprint média).
- Operational gotcha: criar novo `.claude/agents/*.md` mid-session NÃO carrega — precisa Reload Window (descoberto em Fase 0a; documentado em memory `multi_process_agents`).

**References:**

- See `docs/research/09-harness-engineering.md` § 4 (Multi-process pattern, GSD-inspired)
- See `.claude/agents/validator.md` (tools field restritivo: Read, Grep, Glob, Bash — sem Edit/Write/Agent)
- See `.claude/agents/implementer.md` (com Edit/Write mas sem Agent — não pode spawnar subagents)
- See memory `multi_process_agents` (active)
- Hook `check-implementer-not-validator.sh` (warn-only) reforça o princípio em runtime

---

## ADR-030: Contracts negotiation antes da execução

**Date:** 2026-05-19
**Status:** Accepted (Fase 0a — implementado)

**Decision:** Toda sprint tem um arquivo `CONTRACT.md` com lista de items atômicos (2-4h cada) + acceptance test computacional por item. CONTRACT é **negociado** Implementer↔Validator antes do `status: locked`. Nenhum `Edit/Write` na sprint folder antes do CONTRACT estar locked (hook `check-contract-exists.sh` bloqueia).

**Rationale:**

- "Programar sem spec" + "validar depois" cria loop infinito: implementer alucina escopo, validator descobre tarde, retrabalho.
- Atomic items (2-4h cada) com acceptance test computacional eliminam ambiguidade: ou o `grep -q` retorna 0, ou retorna 1. Sem "85% pronto".
- Negotiation Implementer↔Validator pré-execução força ambos a alinharem expectativas. Validator que reviu o CONTRACT não pode reclamar de scope no final.
- "Conservation laws" do harness: o validator só pode PASS items que estão no CONTRACT — não pode adicionar items mid-sprint para forçar FAIL.

**Trade-offs:**

- Sprints curtas (~1h) têm overhead desproporcional de criar CONTRACT formal.
- Negotiation pode levar tempo (validator agent + iteração). Mitigado: a Fase 0a-0d mostram que o CONTRACT geralmente fecha em 1 pass do validator.
- Items que viram "mais complexos do que pareciam" durante implementação NÃO podem escapar do CONTRACT — devem ser quebrados em items menores via update do CONTRACT antes de continuar.

**References:**

- See `docs/research/09-harness-engineering.md` § 5 (Contracts entre agentes — arxiv 2026 "Agent Contracts")
- See `.claude/skills/negotiate-contract/SKILL.md` (workflow detalhado do ciclo)
- See `.claude/commands/negotiate-contract.md` (slash command de entry)
- Hook `check-contract-exists.sh` bloqueia Edit/Write em `docs/specs/{id}/` sem CONTRACT locked
- Sprints exemplares: docs/specs/0a/0b/0c/0d — todas com CONTRACT locked antes de Wave 1

---

## ADR-031: Progress files + Bootstrap script (memory entre sessions)

**Date:** 2026-05-19
**Status:** Accepted (Fase 0a — implementado)

**Decision:** Cada sprint mantém `PROGRESS.md` versionado em `docs/specs/{id}/`. `PROGRESS.md` é atualizado antes de `/compact` ou fim de sessão. Bootstrap script (`scripts/harness/bootstrap-session.sh`) lê `PROGRESS.md` no início da próxima sessão, reconstrói contexto em < 5k tokens.

**Rationale:**

- `/compact` reescreve histórico mas NÃO preserva state on-disk que não exista. Conteúdo só "na conversa" é perdido.
- Sem PROGRESS discipline: 30% de contexto perdido por compactação em sprints multi-dia, requerendo re-explicação.
- Com PROGRESS discipline: near-zero loss; bootstrap restaura branch + sprint + sensores + carry-over em <200 palavras.
- Score binário aplica: ou o PROGRESS está atualizado quando você compacta, ou está stale (e você perde state).

**Trade-offs:**

- Overhead disciplinar: lembrar de update PROGRESS antes de compact (memory `progress_files_discipline` ajuda; hook `check-progress-updated.sh` warn-only ajuda).
- PROGRESS pode virar verbose se incluir trivialidades — convenção é "non-obvious decisions + blockers + carry-overs", não "git log mirror".

**References:**

- See `docs/research/09-harness-engineering.md` § 6 (Persistent state)
- See `scripts/harness/bootstrap-session.sh` (script source)
- See `.claude/commands/update-progress.md` (slash command de checkpoint)
- See memory `progress_files_discipline` (active)
- See user feedback memory `feedback_document_before_advancing` (regra hard do usuário: checkpoint cada ~3 commits)

---

## ADR-032: Sensor enforcement via hooks bloqueantes (score binário)

**Date:** 2026-05-19
**Status:** Accepted (Fase 0b — implementado)

**Decision:** Sensores computacionais críticos são enforced via **PreToolUse hooks bash** em `.claude/settings.json`. Hooks falham (exit 2) quando uma regra é violada, bloqueando a operação `Edit/Write/Bash` em runtime. Score é binário: o hook passa ou bloqueia.

**Rationale:**

- Princípios escritos em AGENTS.md / docs ficam stale (alguém vai violar quando estiver com pressa). Hooks no runtime impedem mecanicamente.
- Score binário (exit 0 vs exit 2) elimina cinza: ou o commit passa, ou não passa.
- Hooks são auditáveis (bash scripts em `scripts/firebase/` e `scripts/hooks/`) — qualquer dev pode ler para entender por quê foi bloqueado.
- Stderr messages devem citar princípio + propor fix concreto + linkar refs (não só "blocked").

**Trade-offs:**

- False positives podem virar friction. Mitigação: hooks têm exceções explícitas (ex: `.test.tsx` no check-no-hardcoded-literal); 3 hooks da Fase 0b são deliberadamente warn-only (check-progress-updated, check-sensors-passed, check-implementer-not-validator) para evitar atrito enquanto a heurística amadurece.
- Manutenção: hook que vira fonte de friction precisa ser refinado ou removido — não toleramos hooks "que sempre falham erradamente".
- Caveat conhecido: `check-rules-tested.sh` (legado) tem false positive em comandos bash complexos (multi-command, heredoc). Workaround: comandos simples + refresh stamp via `/firestore-rules-test`.

**References:**

- See `docs/research/09-harness-engineering.md` § 8.4 (Hooks PreToolUse)
- See `.claude/settings.json` (12 PreToolUse hooks — 4 legados em `scripts/firebase/` + 8 novos em `scripts/hooks/`)
- Hooks documentados em memory `multi_process_agents` (lista completa)
- Princípio 15 do roadmap (FEATURES-INVENTORY § Princípios)

---

## ADR-033: Estrutura de specs por sprint

**Date:** 2026-05-19
**Status:** Accepted (Fase 0a — implementado)

**Decision:** Cada sprint vive em **`docs/specs/{id}-{name}/`** com 4 artifacts canônicos: **SPEC.md** (feedforward), **CONTRACT.md** (negotiated → locked), **PROGRESS.md** (memory), **EVALUATION.md** (sensor feedback / verdict). Templates em `docs/specs/_templates/` instanciados via `bash scripts/harness/new-sprint.sh <id> <name>`.

**Rationale:**

- Single source of truth por sprint: alguém entrando na sprint lê esses 4 arquivos e tem 100% do contexto.
- Frontmatter YAML (`sprint-id`, `status`, `verdict`) permite agregação programática (futuro: dashboard de sprints).
- Append-only nos artifacts evita ambiguidade — SPEC.md fica como veio do planning; mudanças mid-sprint ficam em PROGRESS.md "Decisions taken".
- Templates garantem que cada sprint tem a mesma estrutura — bootstrap script + validator agent sabem onde procurar (`## Outcomes`, `## Items`, `verdict: pass`).

**Trade-offs:**

- 4 arquivos por sprint adiciona overhead a um workflow já com PROGRESS+CONTRACT. Aceitável porque cada um tem propósito distinto e não duplica.
- Templates podem virar bottleneck — mudança em formato exige update + retroactive cleanup. Mitigação: format mudou zero vezes desde Fase 0a; estável.
- Sprints muito pequenas (<2h) talvez não precisem dos 4 artifacts — usar judgement.

**References:**

- See `docs/research/09-harness-engineering.md` § 8.1 (Estrutura de pastas)
- See `docs/specs/_templates/` (4 templates canônicos)
- See `scripts/harness/new-sprint.sh` (scaffolder)
- See `.claude/commands/new-sprint.md` (slash command)
- Sprints exemplares (dogfood): docs/specs/-1/0a/0b/0c/0d — todas seguem o padrão

---
