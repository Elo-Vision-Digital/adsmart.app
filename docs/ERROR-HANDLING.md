# Error handling

How AdSmart surfaces, logs, and recovers from errors. Covers Cloud Functions, the React frontend, and security event logging.

## Cloud Functions errors

All callable functions throw `HttpsError` from `firebase-functions/v2/https`. Never throw plain `Error` from a callable — the Firebase SDK serializes `HttpsError` as a typed error on the client; plain errors get masked as `internal`.

### HttpsError codes used

| Code | When to use | Example in repo |
|---|---|---|
| `unauthenticated` | Caller is not signed in (`!request.auth`) | `functions/src/googleAdsOAuth.ts:51` |
| `invalid-argument` | Required input is missing or malformed | `functions/src/googleAdsOAuth.ts:119` |
| `permission-denied` | Authenticated but not authorized (e.g. state mismatch, non-admin) | `functions/src/googleAdsOAuth.ts:143` |
| `deadline-exceeded` | Time-bound operation expired (e.g. OAuth state TTL) | `functions/src/googleAdsOAuth.ts:148` |
| `failed-precondition` | State on server makes the call invalid (insufficient balance, missing record) | wallet flows |
| `resource-exhausted` | Rate-limit hit | rate-limiter wrappers |
| `internal` | Unexpected — log and return generic message; do NOT leak internals | catch-all in catch blocks |

### Error boundary pattern in callables

Every callable that does multi-step work follows this shape:

```ts
export const myCallable = onCall({ secrets: [...] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }
  try {
    // happy path
  } catch (error) {
    if (error instanceof HttpsError) {
      // explicit error already shaped — re-throw as-is so the client gets the typed code
      throw error
    }
    // unexpected — log internally, return generic
    console.error('myCallable failed', error)
    throw new HttpsError('internal', 'Erro interno')
  }
})
```

The `instanceof HttpsError` re-throw is **load-bearing**. Without it, deliberate `permission-denied` / `invalid-argument` errors would be swallowed and re-emitted as `internal`, masking the real cause for clients (and breaking client-side error UX). Reference: `functions/src/googleAdsOAuthV2.ts:262`, `functions/src/metaAdsOAuth.ts:154`, `functions/src/adminWalletManager.ts:344`.

### Multi-read callables: labelled `Promise.allSettled` over `Promise.all`

When a callable orchestrates several independent reads (typical for analytics endpoints), prefer `Promise.allSettled` over labelled queries instead of `Promise.all`. `Promise.all` collapses any rejection into a single opaque `INTERNAL` — Cloud Logging often shows `details: ''` for missing-index errors, which makes the failing read invisible.

Canonical example: [`getDashboardMetrics`](../functions/src/getDashboardMetrics.ts) runs 7 reads (`Q1_allCreditsTotal_agg` … `Q7_adAccountsSnap`) via `Promise.allSettled`, logs `[dashboard:fail:Q<n>]` with `error.code` / `message` / `details` / `stackHead` for each rejection, and throws `HttpsError('internal', 'Dashboard query failures: Q<n>[, Q<m>...]')` so the failing labels reach the client message directly. The same pattern applies to any callable that fans out 3+ reads where one missing index would otherwise be undebuggable from logs alone. See the 2026-05-01 entry in [CHANGES.md](CHANGES.md) for the original incident (Subprojeto 2 Task 18).

### What to log vs surface

- **Log** (server-side via `console.error` and/or `securityLogger`): the full error object, stack, all context (userId, action, payload digest).
- **Surface** (to the client via `HttpsError.message`): a user-facing message. Never include stack, internal IDs, secret refs, or third-party API responses verbatim.

## Security event logging

All security-relevant events go through `securityLogger.logEvent` (`functions/src/securityLogger.ts`). The logger writes to a Firestore collection and is the source of truth for audit.

```ts
await securityLogger.logEvent(
  SecurityEventType.RATE_LIMIT_EXCEEDED,
  identifier,        // userId or IP
  { actionName, threshold }, // structured details
  SecuritySeverity.WARNING
)
```

### Event types (enum `SecurityEventType`)

`LOGIN_SUCCESS`, `LOGIN_FAILED`, `RECAPTCHA_SUCCESS`, `RECAPTCHA_FAILED`, `RATE_LIMIT_EXCEEDED`, `SUSPICIOUS_ACTIVITY`, `PASSWORD_RESET_REQUEST`, `ACCOUNT_LOCKED`, `UNAUTHORIZED_ACCESS`, `BACKUP_STARTED`, `BACKUP_COMPLETED`, `BACKUP_FAILED`, `BACKUP_CLEANUP`, `BACKUP_RESTORED`, `USER_DELETION` (added in ADR-020 — emitted by `deleteUserData` after the cascade delete completes).

### Severity levels (enum `SecuritySeverity`)

| Level | Use for | Example |
|---|---|---|
| `INFO` | Routine events worth audit (LOGIN_SUCCESS) | Successful sign-in |
| `WARNING` | Anomalous but expected (RATE_LIMIT_EXCEEDED, RECAPTCHA_FAILED) | Rate limit hit |
| `ERROR` | Operation failed unexpectedly | Backup job failed |
| `CRITICAL` | Active security incident | Pattern of UNAUTHORIZED_ACCESS detected |

### Re-entrancy guard

`securityLogger.logEvent` skips its `checkSuspiciousPatterns` call when the incoming event is itself `SUSPICIOUS_ACTIVITY` — without this guard the pattern detector would re-emit and infinite-loop. See Phase 3 entry in `docs/CHANGES.md`. **Do not remove this guard.**

## Frontend errors

The React app does not currently use a top-level React error boundary component. Errors propagate to:

1. **Component-local try/catch** in async handlers (e.g. form submits, OAuth redirects).
2. **Toast** via `src/components/ui/toast.tsx` — surface a user-friendly message.
3. **Console** for the developer.

When calling Cloud Functions from the client, always check the typed error code:

```ts
try {
  await callable(payload)
} catch (e) {
  const code = (e as { code?: string }).code
  if (code === 'permission-denied') { /* show "you can't do this" */ }
  else if (code === 'resource-exhausted') { /* show "slow down" */ }
  else { /* generic */ }
}
```

## Firebase Auth errors → i18n keys (ADR-020)

Single source of truth: [`src/lib/auth/errorMessages.ts`](../src/lib/auth/errorMessages.ts). Every caller of `signInWith*`, `signUp`, `linkWithCredential`, `reauthenticateWithCredential`, `updatePassword`, `sendPasswordResetEmail`, `sendEmailVerification` must wrap the error in `authErrorToTKey(err)` and pass through `t(...)`. No bespoke per-page mapping. Use the `isAuthError(err)` type guard from `src/lib/auth/errors.ts` to distinguish Firebase errors from local `Error` throws (see "Catch pattern" below).

| Firebase code | i18n key | UX rationale |
|---|---|---|
| `auth/invalid-credential` | `loginPage.error.invalidCredentials` | Modern combined code |
| `auth/wrong-password` | `loginPage.error.invalidCredentials` | Legacy code, same UX |
| `auth/user-not-found` | `loginPage.error.invalidCredentials` | Collapsed to prevent enumeration |
| `auth/invalid-login-credentials` | `loginPage.error.invalidCredentials` | Same |
| `auth/email-already-in-use` | `loginPage.error.emailInUse` | Signup-only |
| `auth/weak-password` | `common.validation.weakPassword` | Backstop if Identity Platform policy disagrees with client |
| `auth/invalid-email` | `common.validation.invalidEmail` | Format error |
| `auth/too-many-requests` | `common.error.tooManyAttempts` | Firebase server-side throttle |
| `auth/popup-blocked` | `loginPage.error.popupBlocked` | Browser blocked the OAuth popup |
| `auth/popup-closed-by-user` | `loginPage.error.popupClosed` | User dismissed |
| `auth/cancelled-popup-request` | `loginPage.error.popupClosed` | Concurrent popup attempt — same UX as closed |
| `auth/network-request-failed` | `common.error.network` | Offline or DNS failure |
| `auth/account-exists-with-different-credential` | `loginPage.error.accountConflict` | Provider linking conflict |
| `auth/credential-already-in-use` | `loginPage.error.credentialInUse` | Same email linked to another uid |
| `auth/requires-recent-login` | `common.error.requiresReauth` | reauthenticateWithCredential needed |
| **unknown** | `common.error.generic` | Last-resort catch-all |

**Privacy collapse** (intentional): `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential`, and `auth/invalid-login-credentials` all surface the same message to prevent account enumeration via differential error messages.

**Note:** `auth/firebase-app-check-token-is-invalid` is NOT mapped — App Check was removed by [ADR-019](Decisions.md#adr-019-remove-firebase-app-check--aes-256-gcm-for-oauth-tokens-at-rest). If App Check is ever re-introduced, add it then.

**Note:** `auth/provider-already-linked` is NOT currently mapped. Falls through to `common.error.generic`. Tracked as a deferred follow-up in ADR-020 — add to the map if reported in the wild.

### Catch pattern for handlers that mix local Error throws + Firebase Auth calls

`LoginPage.handleSubmit` and `SettingsPage.handleChangePassword` `throw new Error(t('<translated key>'))` for pre-validation failures (password mismatch, required-field empty, policy violation). Those local errors carry the i18n-resolved message in `err.message` — passing them through `authErrorToTKey` would mask the real message as `common.error.generic` (which surfaces as "Erro ao processar solicitação"). Use this split pattern instead:

```ts
} catch (err) {
  if (isAuthError(err)) {
    setError(t(authErrorToTKey(err)))         // Firebase auth/* code
  } else if (err instanceof Error && err.message) {
    setError(err.message)                       // local pre-validation throw — already translated
  } else {
    setError(t('common.error.generic'))          // unknown
  }
}
```

This bug was caught in browser validation post-Approach-A and fixed in commit `f0fc264` — see ADR-020 "Post-validation fix".

### When to add a top-level error boundary

The current codebase doesn't ship one — adding it is appropriate when:
- A render-time crash in one route should not white-screen the whole app.
- We start collecting client-side error telemetry (Sentry or similar).

If/when added, place at the App.tsx provider chain level and document here.

## Rate limiting as preventive error handling

Sensitive functions call `checkRateLimit(userId, actionName)` BEFORE doing work (`functions/src/rateLimiter.ts`). The rate-limiter throws `HttpsError('resource-exhausted')` when over threshold. This pattern prevents server-side errors from cascading into resource exhaustion.

See [SECURITY.md](SECURITY.md) for the rate-limit policy table.

## Cross-references

- [SECURITY.md](SECURITY.md) — security rules, secrets, admin claim, threat model.
- [API-CONTRACTS.md](API-CONTRACTS.md) — request/response shapes per callable.
- [TESTING.md](TESTING.md) — how to test error paths.
- [CHANGES.md](CHANGES.md) — Phase 3 entry documents the OAuth error-code re-throw and `securityLogger` re-entrancy guard.
