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

`LOGIN_SUCCESS`, `LOGIN_FAILED`, `RECAPTCHA_SUCCESS`, `RECAPTCHA_FAILED`, `RATE_LIMIT_EXCEEDED`, `SUSPICIOUS_ACTIVITY`, `PASSWORD_RESET_REQUEST`, `ACCOUNT_LOCKED`, `UNAUTHORIZED_ACCESS`, `BACKUP_STARTED`, `BACKUP_COMPLETED`, `BACKUP_FAILED`, `BACKUP_CLEANUP`, `BACKUP_RESTORED`.

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
