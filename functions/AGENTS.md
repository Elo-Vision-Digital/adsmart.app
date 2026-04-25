# Cloud Functions — Agent Guide

Read [../AGENTS.md](../AGENTS.md) for the project-wide overview. This file covers functions-specific conventions.

## Directory structure

```
functions/
  src/
    config/
      index.ts          # All defineSecret handles (googleAdsClientSecret, metaAdsAppSecret, recaptchaSecretKey)
    index.ts            # Exports all functions; Firebase Admin init
    rateLimiter.ts      # checkRateLimit() utility
    securityLogger.ts   # SecurityLogger class, SecurityEventType, SecuritySeverity enums
    recaptcha.ts        # verifyRecaptcha (onCall)
    adminWalletManager.ts  # addUserCredits (onCall, admin-only)
    googleAdsOAuth.ts   # V1 deprecated: getGoogleAdsAuthUrl, getGoogleAdsCampaigns
    googleAdsOAuthV2.ts # V2: handleGoogleAdsCallbackWithSelection, confirmGoogleAdsAccountSelection
    metaAdsOAuth.ts     # V1 deprecated: getMetaAdsAuthUrl, getMetaAdsCampaigns
    metaAdsOAuthV2.ts   # V2: handleMetaAdsCallbackWithSelection, confirmMetaAdsAccountSelection
    priceManager.ts     # getProductPrices, updateProductPrices, initializeDefaultPrices
    getPublicProductPrices.ts  # getPublicProductPrices (no auth required)
    securityStats.ts    # getSecurityStats (admin-only)
    deleteUserData.ts   # deleteUserData (placeholder)
    suitpayPayment.ts   # @deprecated: createPixPayment, checkPaymentStatus
    suitpayWebhook.ts   # @deprecated: suitpayWebhook (onRequest)
    backupScheduler.ts  # Commented out in index.ts (not deployed)
  test/
    helpers/
      firestore.ts      # getAdmin(), clearCollection()
    *.test.ts           # Test files (all hit emulators, no mocks)
```

## Function triggers

All non-deprecated functions use Firebase Functions v2:

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https'

export const myFunction = onCall({ secrets: [mySecret], region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', '...')
  // ...
})
```

Default region is `us-central1`. Do not deploy to other regions without updating the client (`getFunctions(app, 'us-central1')` in `src/firebase/config.ts`).

## Secrets

All secrets are declared in `functions/src/config/index.ts`:

```typescript
import { defineSecret } from 'firebase-functions/params'

export const googleAdsClientSecret = defineSecret('GOOGLE_ADS_CLIENT_SECRET')
export const metaAdsAppSecret = defineSecret('META_ADS_APP_SECRET')
export const recaptchaSecretKey = defineSecret('RECAPTCHA_SECRET_KEY')
```

Every function that uses a secret MUST:

1. Import the handle from `./config`
2. Declare it in the options: `onCall({ secrets: [mySecret] }, ...)`
3. Read the value at runtime: `mySecret.value()`

Never read secrets via `process.env`.

## Authentication pattern

```typescript
if (!request.auth) {
  throw new HttpsError('unauthenticated', 'Usuário não autenticado')
}
const userId = request.auth.uid
const adminEmail = request.auth.token.email || ''
const isAdmin = request.auth.token.admin || ADMIN_EMAILS.includes(adminEmail)
```

## Rate limiting pattern

Call `checkRateLimit` before doing any meaningful work:

```typescript
import { checkRateLimit } from './rateLimiter'

await checkRateLimit(userId, 'my_action_name', 10, 5) // 10 attempts per 5 min
```

The document key in `rateLimits` is `{userId}_{actionName}`.

## Security logging pattern

```typescript
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

await securityLogger.logEvent(
  SecurityEventType.UNAUTHORIZED_ACCESS,
  userId,
  { action: 'my_action', email: adminEmail, ip: request.rawRequest.ip },
  SecuritySeverity.WARNING,
  request.rawRequest  // optional — extracts IP + User-Agent
)
```

**Re-entrancy guard:** `logEvent` does NOT call `checkSuspiciousPatterns` when `eventType === SecurityEventType.SUSPICIOUS_ACTIVITY`. This prevents infinite recursion.

## Error handling pattern

```typescript
try {
  // ... work ...
} catch (error: any) {
  // Re-throw semantic HttpsErrors (CSRF, validation, etc.)
  if (error instanceof HttpsError) {
    throw error
  }
  // Wrap unknown errors as 'internal'
  throw new HttpsError('internal', error.message || 'Erro interno')
}
```

Do not swallow `HttpsError` by wrapping everything in a generic catch. Callers rely on the error code to distinguish CSRF failures from server faults.

## Firebase Admin init pattern

Each file that needs Admin SDK does a lazy init guard:

```typescript
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp()
}
```

This is safe because `index.ts` also calls `admin.initializeApp()` first. The guard prevents double-init in tests where files are imported independently.

## Testing

Tests are in `functions/test/`. They hit real emulators — no mocks. See `docs/TESTING.md`.

To run:
```bash
# Start emulators first
bunx firebase emulators:start --only firestore,auth

# Then in another terminal, from functions/
bun run test
```
