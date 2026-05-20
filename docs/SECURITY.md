# Security

## Pending credential rotation

The following secrets appeared in git history in `.backups/.env.backup_*`
files (committed August 2025) plus the Google Ads developer token literal
(`wRhu9OHLIWdbht2HY3B9yw`) committed in 6+ pre-ADR-017 commits. The repo
is private and single-user, so rotation was deferred — but it must happen
before the repo is ever shared, made public, or connected to any external
CI/service.

Rotation checklist:

- [ ] Firebase API keys (console: Project settings → General → Web API key)
- [ ] **Google Ads developer token** (Google Ads → Tools & Settings → API Center → Reset token) — see [ADR-017](Decisions.md#adr-017-google-ads-developer-token-rotation--future-app-check-enforcement) for the full procedure. Removing the literal from source (Sprint 1) does NOT invalidate the leaked value — only the provider reset does.
- [ ] Google Ads OAuth Client Secret (Google Cloud Console → OAuth 2.0 Client)
- [ ] Meta Ads App Secret (developers.facebook.com → App → Settings → Advanced → Reset)
- [x] SuitPay client ID + client secret — REMOVED in ADR-021 (2026-05-18); Stripe replacement (FUTURE §8) will define its own secret slots when implemented
- [ ] Any ENCRYPTION_KEY used for local data encryption (if in use)

After rotation, set new values via:

```bash
firebase functions:secrets:set GOOGLE_ADS_DEVELOPER_TOKEN
firebase functions:secrets:set GOOGLE_ADS_CLIENT_SECRET
firebase functions:secrets:set META_ADS_APP_SECRET
firebase functions:secrets:set SUITPAY_CLIENT_ID
firebase functions:secrets:set SUITPAY_CLIENT_SECRET
```

Then redeploy the affected functions so the new secret bindings take effect.

> reCAPTCHA was removed 2026-05-17 — see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication). No reCAPTCHA secret to rotate.

## Admin access (post-ADR-016)

Admin authority comes from a single source: `isAdminUser(claims, email)`
exported from [packages/shared/src/auth/admin.ts](../packages/shared/src/auth/admin.ts) and re-exported via
`@adsmart/shared`. Both `AdminRoute` (client) and every admin-only Cloud
Function (`getDashboardMetrics`, `addUserCredits`, `updateProductPrices`,
`initializeDefaultPrices`, `getProductPrices`, `restoreBackup`) call this
single helper.

Custom claim `admin === true` is authoritative; an email allowlist
(`ADMIN_EMAILS` in `packages/shared/src/auth/admin.ts`) remains as a
transition fallback so existing admins are not locked out. The allowlist
will be removed once all existing admins have been migrated to custom
claims.

Pre-ADR-016, five hand-maintained copies of `ADMIN_EMAILS` lived across
the codebase (4 in `functions/src/`, 1 in `src/contexts/AuthContext.tsx`).
They were consolidated and the duplicates were deleted — do not
reintroduce. The audit grep for `const ADMIN_EMAILS\b` must return zero
matches outside `packages/shared/src/auth/admin.ts`.

## App Check — NOT used (ADR-019)

Firebase App Check is **not** in use anywhere in AdSmart. The pre-Sprint-3
scaffold in `src/firebase/config.ts` was removed in ADR-019 because no
environment ever set `VITE_APPCHECK_SITE_KEY` and no callable ever set
`enforceAppCheck: true`. The same reasoning as ADR-013 (drop reCAPTCHA from
auth) applies: token-based attestation is the right answer when bot abuse
becomes a measurable problem; pre-launch with negligible signup volume, the
provisioning overhead is not justified.

Defense in depth comes from four layers instead:

- **Firebase Auth required** on every callable (`request.auth` check).
- **Per-action rate limiting** via `checkRateLimit(uid, action)` on
  sensitive paths.
- **Per-day admin transaction caps** in `adminWalletManager`
  (`MAX_DAILY_AMOUNT_PER_ADMIN`, `MAX_TRANSACTIONS_PER_DAY`).
- **Firestore rules** as the last line of defense — all sensitive
  collections are write-blocked client-side; only Admin SDK can write.

Re-introduce App Check **only if** abuse patterns surface in Cloud
Logging (sustained `LOGIN_FAILED` rate >100/hr from outside the admin
team) or signup volume scales past ~100/day. Trigger a new ADR rather
than re-enabling silently.

## OAuth token encryption at rest (ADR-019)

OAuth access and refresh tokens stored at
`users/{uid}/oauth_tokens/{google_ads,meta_ads}` are encrypted with
**AES-256-GCM** authenticated encryption before being written to
Firestore. The implementation lives in
[functions/src/lib/oauthCrypto.ts](../functions/src/lib/oauthCrypto.ts)
and is the single source of truth — never re-implement encryption inline
in OAuth callbacks.

**Cryptographic parameters** (validated via Context7 against `node:crypto`
docs and Firebase developer knowledge MCP 2026-05-17):

- Algorithm: AES-256-GCM (`createCipheriv('aes-256-gcm', ...)`).
- Key: 32 bytes derived from the `ENCRYPTION_KEY` secret via
  `scryptSync(secret, 'adsmart-oauth-v1', 32)`. Cached at module scope.
- IV/nonce: 12 random bytes per encryption call (`randomBytes(12)`) —
  never reused with the same key.
- Auth tag: 16 bytes via `getAuthTag()` / `setAuthTag()`.
- Wire format: `{ v: 1, iv: <base64>, tag: <base64>, ct: <base64> }`. The
  `v` field is mandatory; future versions can coexist with v1 on disk.

**Backward-compatibility:** `detectAndDecrypt` accepts both v1 records and
the pre-Sprint-3 legacy Base64-encoded strings. Read paths in
`getValidTokens` (both V1 OAuth files) opportunistically re-encrypt
legacy tokens with AES-GCM on the next refresh write.

**ENCRYPTION_KEY rotation:**

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

After rotation, records written with the OLD key fail to decrypt — see
ADR-019 for the leak vs proactive-rotation playbook.

### Granting admin to a user

Requires the Admin SDK (e.g. a one-off Node script run from a machine with
your service account credentials, OR the Firebase CLI's functions shell):

```javascript
const admin = require('firebase-admin')
admin.initializeApp()
await admin.auth().setCustomUserClaims(uid, { admin: true })
// Post-ADR-020: the next sign-in picks up the claim automatically
// via AuthContext.refreshAuthState (getIdToken(true) + user.reload()).
// No more "sign out + sign back in" required.
```

### Revoking admin

```javascript
await admin.auth().setCustomUserClaims(uid, { admin: false })
// Follow up with admin.auth().revokeRefreshTokens(uid) to force immediate
// re-auth rather than waiting for the 1-hour token TTL.
```

## Firestore rules

Rules enforce per-user ownership on `users/{uid}` and its subcollections
(`wallet`, `transactions`, `oauthConnections`, etc.). Wallet and
transactions are read-only from the client — writes require the Admin
SDK (Cloud Functions).

System collections (`productPrices`, `reportTemplates`, `systemConfig`,
`securityLogs`, `backupMetadata`, `rateLimits`) are write-blocked from
the client.

## Password policy (post-ADR-020)

Single source of truth: [packages/shared/src/auth/password.ts](../packages/shared/src/auth/password.ts), exporting:

- `PasswordPolicy` — `{ minLength: 8, requireUppercase, requireLowercase, requireNumber, requireSpecial }`.
- `PasswordSchema` (Zod) — for server-side `safeParse` if ever needed.
- `validatePassword(pwd): { valid, errors: string[] }` — returns deterministic-ordered i18n keys (`passwordPolicy.tooShort`, `passwordPolicy.requireUppercase`, etc.) for the caller to resolve via `t()`.

Both `LoginPage` (signup) and `SettingsPage` (change-password) consume this helper. Pre-ADR-020 the two paths had drifted (signup enforced 8 chars + complexity; change-password enforced 6 chars only). Do not re-introduce a local validator — extend the shared schema if more rules are needed.

Identity Platform's own password policy in Firebase Console is currently NOT configured to match this; that's a deferred operator step (see ADR-020 "Not done"). When configured, it acts as defense-in-depth in case a client somehow bypasses the local check.

## Auth error messaging (post-ADR-020)

Single source of truth: [src/lib/auth/errorMessages.ts](../src/lib/auth/errorMessages.ts), exporting:

- `AUTH_ERROR_KEY_MAP` — `Record<auth/<code>, i18n_key>` covering 15 Firebase Auth error codes.
- `authErrorToTKey(err: unknown): string` — returns the mapped i18n key when `isAuthError(err)`, else `'common.error.generic'`.

**Privacy collapse** (intentional): `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found`, `auth/invalid-login-credentials` all map to one key (`loginPage.error.invalidCredentials`) to prevent account enumeration via differential error messages.

**Local Error throws** (pre-Firebase validation, e.g. "passwords don't match") carry their already-translated message and must be surfaced via `err.message` — not through `authErrorToTKey` (it would mask the real message as "Erro ao processar solicitação"). See the catch pattern in [LoginPage.handleSubmit](../src/pages/LoginPage.tsx) and [SettingsPage.handleChangePassword](../src/pages/SettingsPage.tsx). This bug was caught in browser validation post-D3 — see ADR-020 "Post-validation fix" and commit `f0fc264`.

The full code→key table is in [docs/ERROR-HANDLING.md](ERROR-HANDLING.md).

## Security headers

Firebase Hosting responds with:
- HSTS (2 years, preload)
- CSP allowlisting Firebase, Google Fonts, Meta Graph, and Google Tag
  Manager (reCAPTCHA hosts were removed from `script-src`/`connect-src`/
  `frame-src` on 2026-05-17 — see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication))
- **COOP: `same-origin-allow-popups`** (changed from `same-origin` on 2026-05-18 to keep `signInWithPopup`'s `window.opener.postMessage` closing handshake working across browsers — see [ADR-020](Decisions.md#adr-020-auth-flow-hardening-2026-05-approach-a--surgical-refactor)).
- **CORP: `same-origin`** (unchanged).
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy

See `firebase.json` for the full list. AdSmart does not use SharedArrayBuffer or any cross-origin-restricted browser API, so the COOP downgrade has no behavior impact today; the trade-off is documented in ADR-020.
