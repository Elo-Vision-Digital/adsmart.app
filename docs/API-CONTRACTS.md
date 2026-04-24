# API Contracts

All Cloud Functions exported from `functions/src/index.ts`. Region: `us-central1`.

Callable functions use Firebase `httpsCallable` on the client. The framework wraps the call in `{ data: <input> }` and returns `{ data: <output> }`.

---

## verifyRecaptcha

**File:** `functions/src/recaptcha.ts`  
**Trigger:** `onCall`  
**Auth required:** No (anonymous allowed)  
**Secrets:** `recaptchaSecretKey`  
**Rate limit:** 10 attempts / 5 minutes per userId (or `"anonymous"` if unauthenticated)

**Input:**
```typescript
{ token: string }
```

**Output (success):**
```typescript
{
  success: true,
  score: number,    // 0.0 – 1.0
  action: string
}
```

**Errors:**
- `invalid-argument` — token missing
- `internal` — reCAPTCHA API call failed
- `resource-exhausted` — rate limit exceeded

---

## checkRateLimit

**File:** `functions/src/rateLimiter.ts`  
**Trigger:** Utility (not directly exported as HTTP callable)  
**Called by:** Other functions internally

**Signature:**
```typescript
checkRateLimit(
  userId: string,
  action: string,
  maxAttempts?: number,  // default 5
  windowMinutes?: number // default 15
): Promise<boolean>
```

Throws `resource-exhausted` if blocked. Returns `true` if allowed.

---

## getProductPrices

**File:** `functions/src/priceManager.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** Yes

**Input:** `{}` (none)

**Output:**
```typescript
{
  success: true,
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,      // BRL float (display only)
    category: "google" | "meta",
    type: "lancamento" | "negocio_local",
    isActive: boolean,
    updatedAt: string,  // ISO date string
    updatedBy: string
  }>
}
```

---

## updateProductPrices

**File:** `functions/src/priceManager.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** Yes + admin check

**Input:**
```typescript
{
  prices: Array<{
    id: string,
    price: number,
    isActive?: boolean
  }>
}
```

**Output:**
```typescript
{ success: true, updatedCount: number }
```

---

## initializeDefaultPrices

**File:** `functions/src/priceManager.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Idempotent. Seeds the four default product price documents if they don't exist.

**Output:** `{ success: true, message: string }`

---

## getPublicProductPrices

**File:** `functions/src/getPublicProductPrices.ts`  
**Trigger:** `onCall` (firebase-functions v1 style)  
**Auth required:** No

Returns only `isActive: true` prices.

**Output:**
```typescript
{
  success: true,
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,
    category: string,
    type: string
  }>
}
```

---

## handleGoogleAdsCallbackWithSelection

**File:** `functions/src/googleAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `googleAdsClientSecret`

Step 1 of Google Ads OAuth V2. Validates state token (CSRF), exchanges auth code for tokens, lists accessible ad accounts, stores temporary token.

**Input:**
```typescript
{ code: string, state: string }
```

**Output (success):**
```typescript
{
  success: true,
  accountsAvailable: Array<{
    id: string,
    name: string,
    currency: string,
    type: string,
    email: string
  }>,
  mainAccount: { name: string, email: string },
  temporaryToken: string   // use in confirmGoogleAdsAccountSelection
}
```

**Errors:**
- `unauthenticated` — not signed in
- `invalid-argument` — code/state missing or state not found in Firestore
- `permission-denied` — state belongs to different user
- `deadline-exceeded` — state expired (> 10 min)
- `internal` — token exchange or API failure

---

## confirmGoogleAdsAccountSelection

**File:** `functions/src/googleAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `googleAdsClientSecret`

Step 2 of Google Ads OAuth V2. Saves selected accounts + encrypted tokens, deletes temporary token.

**Input:**
```typescript
{
  temporaryToken: string,
  selectedAccountIds: string[]
}
```

**Output:**
```typescript
{ success: true, accountsConnected: number }
```

**Errors:**
- `unauthenticated`, `invalid-argument` — same guards as step 1
- `not-found` — temporary token expired or not found
- `permission-denied` — token belongs to different user
- `deadline-exceeded` — 30-minute temporary token expired

---

## handleMetaAdsCallbackWithSelection

**File:** `functions/src/metaAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `metaAdsAppSecret`

Same two-step pattern as Google Ads. Step 1. Exchanges code for Meta long-lived token, lists Business ad accounts.

**Input:** `{ code: string, state: string }`

**Output:**
```typescript
{
  success: true,
  accountsAvailable: Array<{
    id: string,
    name: string,
    currency: string,
    accountStatus: number,
    businessName?: string
  }>,
  mainAccount: { name: string, email: string },
  temporaryToken: string
}
```

---

## confirmMetaAdsAccountSelection

**File:** `functions/src/metaAdsOAuthV2.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes  
**Secrets:** `metaAdsAppSecret`

Step 2 of Meta Ads OAuth V2.

**Input:** `{ temporaryToken: string, selectedAccountIds: string[] }`

**Output:** `{ success: true, accountsConnected: number }`

---

## addUserCredits

**File:** `functions/src/adminWalletManager.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Adds BRL centavos credits to any user's wallet. Admin-only.

**Input:**
```typescript
{
  targetEmail: string,
  amount: number,    // BRL centavos, positive integer, max 100000 (R$1000)
  reason: string     // min 10 chars
}
```

**Output:**
```typescript
{
  success: true,
  message: string,
  amountAdded: number,
  targetUserId: string,
  timestamp: string,
  adminLimits: {
    dailyTotalAfter: number,  // BRL float
    dailyCountAfter: number,
    maxDailyAmount: number,   // 5000 (R$5000)
    maxDailyTransactions: number  // 50
  }
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — bad email, non-positive amount, amount > 100000, reason < 10 chars
- `resource-exhausted` — daily limits exceeded
- `not-found` — target email not in Firebase Auth

---

## deleteUserData

**File:** `functions/src/deleteUserData.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes

**Status:** Placeholder implementation. Logs deletion intent but does not yet delete all subcollections. Full implementation deferred.

**Input:** `{}` (none — deletes data for the calling user)

---

## getSecurityStats

**File:** `functions/src/securityStats.ts`  
**Trigger:** `onCall`  
**Auth required:** Yes + admin check

Returns aggregated security event counts from `securityLogs`.

---

## suitpayWebhook (deprecated)

**File:** `functions/src/suitpayWebhook.ts`  
**Trigger:** `onRequest` (HTTP POST)  
**Path:** `/suitpayWebhook`  

**⚠ Deprecated.** Will be removed with Asaas migration. Do not modify except for minimum maintenance.

Receives SuitPay payment status webhooks. Validates request, updates payment status in Firestore, credits wallet on confirmed payment.

---

## createPixPayment (deprecated)

**File:** `functions/src/suitpayPayment.ts`  
**Trigger:** `onCall`  

**⚠ Deprecated.** Creates a PIX payment request via SuitPay API.

---

## checkPaymentStatus (deprecated)

**File:** `functions/src/suitpayPayment.ts`  
**Trigger:** `onCall`  

**⚠ Deprecated.** Polls SuitPay for payment status by payment ID.

---

## getGoogleAdsAuthUrl (V1 — deprecated)

**File:** `functions/src/googleAdsOAuth.ts`  
**Status:** V1 deprecated. Use V2 flow (`handleGoogleAdsCallbackWithSelection`).

## getGoogleAdsCampaigns (V1 — deprecated)

**File:** `functions/src/googleAdsOAuth.ts`

## getMetaAdsAuthUrl (V1 — deprecated)

**File:** `functions/src/metaAdsOAuth.ts`

## getMetaAdsCampaigns (V1 — deprecated)

**File:** `functions/src/metaAdsOAuth.ts`
