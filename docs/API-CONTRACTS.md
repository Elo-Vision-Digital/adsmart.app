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
  verified: true
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
**Trigger:** `onCall` (firebase-functions v2, region `us-central1`)
**Auth required:** Yes + admin check (via `isAdminUser` from `@adsmart/shared`)
**Input schema:** none (empty payload)
**Output schema:** `ProductPriceSchema` array from `@adsmart/shared`

**Input:** `{}` (none)

**Output:**
```typescript
{
  success: true,
  prices: Array<ProductPrice>   // see @adsmart/shared/schemas/productPrice
}
```

If the `productPrices` collection is empty, returns `DEFAULT_PRODUCT_PRICES` (sourced from `@adsmart/shared`) with a synthetic `updatedAt`/`updatedBy: 'system'`.

---

## updateProductPrices

**File:** `functions/src/priceManager.ts`
**Trigger:** `onCall` (firebase-functions v2, region `us-central1`)
**Auth required:** Yes + admin check
**Input schema:** `UpdateProductPricesInputSchema` from `@adsmart/shared` (validated via `safeParse`)

**Input:**
```typescript
{
  prices: Array<{
    id: string,
    name: string,
    description: string,
    price: number,            // BRL, will be rounded to 2 decimals server-side
    category: "google" | "meta",
    type: "lancamento" | "negocio_local",
    isActive: boolean,
  }>  // 1..50 items
}
```

Server stamps `updatedAt` (server Timestamp) and `updatedBy` (admin email) — clients cannot set them.

**Output:**
```typescript
{
  success: true,
  message: string,
  updatedAt: string,   // ISO 8601
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — Zod validation failed; first issue message is returned

---

## initializeDefaultPrices

**File:** `functions/src/priceManager.ts`
**Trigger:** `onCall` (firebase-functions v2, region `us-central1`)
**Auth required:** Yes + admin check

Idempotent. Seeds the canonical `DEFAULT_PRODUCT_PRICES` catalog (from `@adsmart/shared`) into `productPrices/{id}`.

**Output:** `{ success: true, message: string, count: number }`

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
**Secrets:** `googleAdsClientSecret`, `googleAdsDeveloperToken`

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
**Secrets:** `googleAdsClientSecret`, `googleAdsDeveloperToken`

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

## getDashboardMetrics

**File:** `functions/src/getDashboardMetrics.ts`
**Trigger:** `onCall({ memory: '512MiB' })`
**Auth required:** Yes + admin check (custom claim `admin === true` OR `ADMIN_EMAILS` allowlist)
**Schemas:** `GetDashboardMetricsInputSchema` / `GetDashboardMetricsOutputSchema` from `@adsmart/shared` (source of truth: [packages/shared/src/schemas/dashboardMetrics.ts](../packages/shared/src/schemas/dashboardMetrics.ts))

Powers `/admin/dashboard`. Runs 7 reads in parallel via `Promise.allSettled` over labelled queries (Q1–Q7). On any rejection, throws `internal` with `Dashboard query failures: Q<n>[, Q<m>...]` so Cloud Logging surfaces which read failed instead of collapsing into an opaque `INTERNAL`. Day buckets for sparklines use `America/Sao_Paulo` via a BRT-anchored `enumerateDays`. `realCents = max(0, totalCents - grantedCents)` derives real revenue (Firestore lacks a `!=` aggregation operator).

**Input:**
```typescript
{
  startDate: string,  // ISO 8601 datetime
  endDate: string     // ISO 8601 datetime; must be >= startDate; range capped at 365 days
}
```

**Output:**
```typescript
{
  range: { startDate: string, endDate: string, days: number },
  revenue: {
    realCents: number,        // integer >= 0 (BRL centavos)
    creditsCents: number,     // integer >= 0 (admin-issued)
    sparkline: Array<{ date: string /* YYYY-MM-DD */, realCents: number, creditsCents: number }>
  },
  users: {
    newCount: number,
    activeCount: number,
    totalCount: number,
    sparkline: Array<{ date: string /* YYYY-MM-DD */, newCount: number }>
  },
  integrations: {
    byPlatform: Array<{ platform: 'google_ads' | 'meta_ads', distinctUserCount: number }>
  },
  generatedAt: string         // ISO 8601 datetime
}
```

**Errors:**
- `unauthenticated` — not signed in
- `permission-denied` — caller is not admin
- `invalid-argument` — bad ISO datetime, `endDate < startDate`, or range > 365 days (server-side guard mirrors the client guard for defense-in-depth)
- `internal` — labelled as `Dashboard query failures: Q<n>[, Q<m>...]` when one or more reads reject (typically a missing composite index or `fieldOverride`); see Cloud Logging for the per-query `[dashboard:fail:Q<n>]` rows

**Required indexes / overrides** (in [firestore.indexes.json](../firestore.indexes.json)):
- `transactions` (collection group) — composite indexes for the aggregate-sum queries (Q1, Q2): `status + type + createdAt + amount` and `adminAction + status + type + createdAt + amount`; field overrides for `createdAt` (ASC + DESC, COLLECTION + COLLECTION_GROUP) and `amount`
- `adAccounts.isActive` — single-field override at COLLECTION (ASC + DESC) and COLLECTION_GROUP (ASC) scopes for Q7
- `users.createdAt` — ASC for Q4 (users-in-range)

---

## Payment callables — removed

SuitPay was removed end-to-end in [ADR-021](Decisions.md#adr-021-remove-suitpay-end-to-end--harden-prepare-deploy-against-secretenv-overlap) (2026-05-18). The callables `suitpayWebhook`, `createPixPayment`, and `checkPaymentStatus` no longer exist. Asaas replacement is planned but not yet wired — see [PAYMENTS.md](PAYMENTS.md).

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
