# Security

## Pending credential rotation

The following secrets appeared in git history in `.backups/.env.backup_*`
files (committed August 2025). The repo is private and single-user, so
rotation was deferred — but it should happen before the repo is ever
shared, made public, or connected to any external CI/service.

Rotation checklist:

- [ ] Firebase API keys (console: Project settings → General → Web API key)
- [ ] Google Ads OAuth Client Secret (Google Cloud Console → OAuth 2.0 Client)
- [ ] Meta Ads App Secret (developers.facebook.com → App → Settings → Advanced → Reset)
- [ ] SuitPay client ID + client secret (SuitPay dashboard) — will be moot once Asaas migration completes
- [ ] Any ENCRYPTION_KEY used for local data encryption (if in use)

After rotation, set new values via:

```bash
firebase functions:secrets:set GOOGLE_ADS_CLIENT_SECRET
firebase functions:secrets:set META_ADS_APP_SECRET
```

> reCAPTCHA was removed 2026-05-17 — see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication). No reCAPTCHA secret to rotate.

## Admin access

Admin access is granted via a custom claim on the Firebase Auth user,
not by email allowlist. `AdminRoute` (client) reads `token.admin === true`
and the Cloud Functions check the same claim before executing privileged
operations.

A legacy email allowlist (`ADMIN_EMAILS` in `src/contexts/AuthContext.tsx`)
remains active as a fallback so existing admins are not locked out. The
client evaluates `isAdmin` as `custom claim === true || email in allowlist`.
The allowlist will be removed once all existing admins have been migrated
to custom claims.

### Granting admin to a user

Requires the Admin SDK (e.g. a one-off Node script run from a machine with
your service account credentials, OR the Firebase CLI's functions shell):

```javascript
const admin = require('firebase-admin')
admin.initializeApp()
await admin.auth().setCustomUserClaims(uid, { admin: true })
// The user must sign out and sign back in for the claim to take effect
// in their client token.
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

## Security headers

Firebase Hosting responds with:
- HSTS (2 years, preload)
- CSP allowlisting Firebase, Google Fonts, Meta Graph, and Google Tag
  Manager (reCAPTCHA hosts were removed from `script-src`/`connect-src`/
  `frame-src` on 2026-05-17 — see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication))
- COOP + CORP same-origin (cross-origin isolation)
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy

See `firebase.json` for the full list.
