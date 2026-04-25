# Data Model

Firestore database for project `adsmart-app`. All monetary values are in **BRL centavos** (integer). All timestamps are Firestore `Timestamp` objects.

## Collection index

| Collection | Purpose | Access |
|---|---|---|
| `users/{uid}` | User profile | Owner only |
| `users/{uid}/wallet/current` | Prepaid balance | Admin SDK only (write) |
| `users/{uid}/transactions/{txId}` | Balance history | Admin SDK only (write) |
| `users/{uid}/oauth_tokens/google_ads` | Encrypted Google Ads tokens | Admin SDK only (write) |
| `users/{uid}/adAccounts/{id}` | Connected ad accounts | Owner (write via Function) |
| `campaigns/{id}` | Ad campaign records | Owner only |
| `reports/{id}` | Generated report records | Owner only |
| `productPrices/{id}` | Product pricing config | Authenticated read; Function write |
| `reportTemplates/{id}` | Looker Studio template configs | Authenticated read; Admin SDK write |
| `systemConfig/{id}` | Global system settings | Authenticated read; Admin SDK write |
| `activityLogs/{id}` | Immutable audit trail | Owner read; Owner create only |
| `rateLimits/{userId}` | Rate-limit counters | Owner read; Admin SDK write only |
| `securityLogs/{id}` | Security events | Admin SDK only |
| `backupMetadata/{id}` | Backup job records | Admin SDK only |
| `oauth_states/{stateId}` | CSRF state tokens (ephemeral) | Admin SDK only |
| `temporary_oauth_tokens/{id}` | Tokens pending account selection (30-min TTL) | Admin SDK only |
| `adminActivity/{email_date}` | Daily admin action tracking | Admin SDK only |
| `webhook_logs/{id}` | SuitPay webhook payloads (deprecated) | Admin SDK only |
| `pendingPayments/{id}` | PIX payments awaiting confirmation (deprecated) | Admin SDK only |
| `payments/{id}` | Confirmed payments (deprecated) | Admin SDK only |
| `orphan_payments/{id}` | Payments without matching user (deprecated) | Admin SDK only |

Collections marked **(deprecated)** belong to the SuitPay integration being replaced by Asaas.

---

## users/{uid}

Profile document created on first sign-in.

```
{
  email: string,         // immutable after creation
  createdAt: Timestamp,  // immutable after creation
  displayName?: string,
  photoURL?: string
}
```

Rules: owner read/create/update. `email` and `createdAt` cannot be changed after creation. Delete blocked (only Cloud Function can delete via Admin SDK).

---

## users/{uid}/wallet/current

Single document per user. Written only by `adminWalletManager.addUserCredits` and report-generation functions via Admin SDK.

```
{
  balance: number,       // BRL centavos, >= 0
  currency: "BRL",
  updatedAt: Timestamp
}
```

Client rule: `allow write: if false` (enforced by subcollection rule for `wallet`).

---

## users/{uid}/transactions/{txId}

Append-only ledger. Written only by Cloud Functions.

```
{
  type: "credit" | "debit",
  amount: number,           // BRL centavos, positive
  description: string,
  status: "pending" | "completed" | "failed",
  createdAt: Timestamp,
  adminAction?: boolean,
  adminEmail?: string,
  adminReason?: string,
  adminIP?: string
}
```

---

## users/{uid}/oauth_tokens/google_ads

Stores base64-encoded (not truly encrypted — see TODO in `googleAdsOAuthV2.ts`) OAuth tokens.

```
{
  accessToken: string,   // base64 encoded
  refreshToken: string,  // base64 encoded
  expiresAt: number,     // Unix ms
  scope: string,
  updatedAt: Timestamp
}
```

---

## users/{uid}/adAccounts/{platform_accountId}

One document per connected ad account. Platform prefix in document ID (e.g., `google_ads_1234567890`).

```
{
  platform: "google_ads" | "meta_ads",
  accountId: string,
  accountName: string,
  email: string,
  currency: string,
  timezone?: string,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastSyncAt: Timestamp
}
```

---

## campaigns/{campaignId}

```
{
  userId: string,
  name: string,
  budget: number,        // BRL centavos, >= 0
  status: "draft" | "active" | "paused" | "ended",
  createdAt: Timestamp   // immutable
}
```

Rule: owner only. Created with `status: "draft"`. Only owner can delete when `status === "draft"`. `userId` and `createdAt` are immutable.

---

## reports/{reportId}

```
{
  userId: string,
  type: "google_ads" | "meta_ads",   // canonical; legacy docs may use "facebook_ads"
  templateId: string,                 // FK → reportTemplates/{id}
  name: string,
  status: "pending" | "processing" | "completed" | "failed",
  campaignIds?: string[],
  allCampaigns: boolean,
  dateRange: { startDate: string, endDate: string },  // ISO 8601
  lookerStudioUrl?: string,           // populated when status === 'completed'
  cost: number,                       // BRL centavos (e.g. 500 = R$ 5,00)
  paidAt?: Timestamp,
  createdAt: Timestamp,
  completedAt?: Timestamp,
  error?: string                      // populated when status === 'failed'
}
```

Source of truth: [src/types/index.ts](../src/types/index.ts) `Report` interface.

Rule: owner only. Delete blocked.

**Legacy note:** docs created before the schema standardization may carry `type: "facebook_ads"`. The web client normalizes this to `"meta_ads"` on read via `useReports()`. A one-shot migration to rewrite those docs is pending.

---

## productPrices/{priceId}

Managed by `priceManager` functions. Document ID matches product type.

```
{
  id: string,
  name: string,
  description: string,
  price: number,            // BRL (float, display only — billing uses centavos)
  category: "google" | "meta",
  type: "lancamento" | "negocio_local",
  isActive: boolean,
  updatedAt: Timestamp,
  updatedBy: string
}
```

Known IDs: `google_lancamento`, `google_negocio_local`, `meta_lancamento`, `meta_negocio_local`.

---

## rateLimits/{userId}

Document ID format: `{userId}_{actionName}` (e.g., `abc123_recaptcha_verify`).

```
{
  attempts: number,
  firstAttempt: Timestamp,
  lastAttempt: Timestamp,
  blocked: boolean
}
```

Written only by `checkRateLimit()` via Admin SDK. Client `allow write: if false`.

---

## oauth_states/{stateId}

CSRF protection for OAuth flows. Created by auth-URL-generation functions; deleted after callback validation.

```
{
  userId: string,
  expiresAt: Timestamp,
  isLocalEnv: boolean,
  createdAt: Timestamp
}
```

Expiry: 10 minutes. Checked and deleted in `handleGoogleAdsCallbackWithSelection` / `handleMetaAdsCallbackWithSelection`.

---

## temporary_oauth_tokens/{tokenId}

Holds OAuth credentials while the user selects which ad accounts to connect. TTL: 30 minutes.

```
{
  userId: string,
  accessToken: string,
  refreshToken?: string,  // Google only
  expiresAt: Timestamp,   // 30 min from creation
  scope: string,
  tokenType?: string,     // Meta only
  createdAt: Timestamp
}
```

Deleted by `confirmGoogleAdsAccountSelection` / `confirmMetaAdsAccountSelection` after successful account save.

---

## adminActivity/{adminEmail_date}

Daily admin action log. Document ID: `{adminEmail}_{YYYY-MM-DD}`.

```
{
  date: string,          // "YYYY-MM-DD"
  adminEmail: string,
  totalAmount: number,   // BRL centavos sum for the day
  transactionCount: number,
  transactions: Array<{
    targetEmail: string,
    amount: number,
    timestamp: Timestamp
  }>
}
```

Limits enforced: max R$ 5.000 / day, max 50 transactions / day per admin.
