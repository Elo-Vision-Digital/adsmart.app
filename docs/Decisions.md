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
