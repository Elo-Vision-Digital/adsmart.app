# Cloud Functions — Agent Guide

Read [../AGENTS.md](../AGENTS.md) for the project-wide overview. This file covers functions-specific conventions.

## Directory structure

```
functions/
  src/
    config/
      index.ts          # All defineSecret handles (googleAdsClientSecret, metaAdsAppSecret, recaptchaSecretKey, encryptionKey)
    index.ts            # Exports all functions; Firebase Admin init
    rateLimiter.ts      # checkRateLimit() utility
    securityLogger.ts   # SecurityLogger class, SecurityEventType, SecuritySeverity enums
    bootstrapUser.ts    # beforeUserCreated blocking trigger — seeds users/{uid} + wallet/current (ADR-010)
    reserveUserDocument.ts  # reserveUserDocument (onCall) — CPF/CNPJ uniqueness + immutability (ADR-012)
    recaptcha.ts        # verifyRecaptcha (onCall)
    adminWalletManager.ts  # addUserCredits (onCall, admin-only)
    googleAdsOAuth.ts   # V1 deprecated: getGoogleAdsAuthUrl, getGoogleAdsCampaigns
    googleAdsOAuthV2.ts # V2: handleGoogleAdsCallbackWithSelection, confirmGoogleAdsAccountSelection
    metaAdsOAuth.ts     # V1 deprecated: getMetaAdsAuthUrl, getMetaAdsCampaigns
    metaAdsOAuthV2.ts   # V2: handleMetaAdsCallbackWithSelection, confirmMetaAdsAccountSelection
    priceManager.ts     # getProductPrices, updateProductPrices, initializeDefaultPrices
    getPublicProductPrices.ts  # getPublicProductPrices (no auth required, invoker:'public')
    securityStats.ts    # getSecurityStats (admin-only)
    getDashboardMetrics.ts  # getDashboardMetrics (admin-only) — powers /admin/dashboard
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
export const encryptionKey = defineSecret('ENCRYPTION_KEY')  // declared; tokens currently base64 (real crypto pending)
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

## Idempotência

Toda callable que muda estado externo (cobrança, webhook, OAuth callback, criação de relatório) DEVE ser idempotente. Padrões aceitos:

1. **`processedRequests/{requestId}` collection** — cliente envia `requestId` (UUID v4), callable abre transação, lê `processedRequests/{requestId}`. Se já existir, retorna o output cacheado. Senão, executa + grava resultado dentro da transação.
2. **`event.id`** (triggers Pub/Sub, Firestore, webhook): use `event.id` como chave em `processedRequests/`. Firebase entrega o mesmo `event.id` no retry.

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'

export const charge = onCall(async (request) => {
  const { requestId, amount } = request.data
  if (!requestId) throw new HttpsError('invalid-argument', 'requestId required')

  const db = admin.firestore()
  const ref = db.collection('processedRequests').doc(requestId)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (snap.exists) return snap.data()!.result
    const result = await doCharge(amount)
    tx.set(ref, { result, processedAt: admin.firestore.FieldValue.serverTimestamp() })
    return result
  })
})
```

Schema em `packages/shared/src/schemas/processedRequest.ts`. TTL de cleanup em `firestore.indexes.json` (futuro). Cliente pode retentar com o mesmo `requestId` sem cobrar duas vezes.

## Structured logging

Use `logger` de `firebase-functions/v2` (NÃO `console.log`). Cada log tem `severity` + structured fields para indexar no Cloud Logging.

```typescript
import { logger } from 'firebase-functions/v2'

logger.info('charge_started', {
  userId,
  requestId,
  amountCents: amount,
  region: 'us-central1',
})

try {
  // ...
} catch (err: any) {
  logger.error('charge_failed', {
    userId,
    requestId,
    error: err.message,
    code: err.code,
  })
  throw err
}
```

Convenções:
- **event name** como `snake_case` no primeiro arg (ex: `charge_started`, `oauth_token_refreshed`).
- **structured fields** no segundo arg. Sempre inclua `userId` quando aplicável.
- **NÃO logar secrets** (tokens, senhas, payloads de cartão).
- **NÃO logar PII** sem necessidade (CPF/CNPJ vão em log apenas em incidente).

Chamadas LLM têm regra adicional: o hook `check-llm-call-via-logger.sh` (Fase 0b) bloqueia callable LLM sem `logger.info` estruturado com `modelId`, `tokensIn`, `tokensOut`, `latencyMs`.

## Testing

Tests are in `functions/test/`. They hit real emulators — no mocks. See `docs/TESTING.md`.

To run:
```bash
# Start emulators first
bunx firebase emulators:start --only firestore,auth

# Then in another terminal, from functions/
bun run test
```
