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
| `users/{uid}/campaigns/{id}` | Ads-platform-synced campaigns (cache) | Owner read; Function write (Admin SDK) |
| `campaigns/{id}` | _Dead code_ — see note below | n/a |
| `reports/{id}` | Generated report records | Owner only |
| `productPrices/{id}` | Product pricing config | Authenticated read; Function write |
| `reportTemplates/{id}` | _Dead code_ — see note below | n/a |
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

Single document per user (doc ID is the literal `current`).

```
{
  balance: number,       // BRL centavos, integer, >= 0
  currency: "BRL",       // literal
  updatedAt: Timestamp
}
```

Source of truth: [packages/shared/src/schemas/userWallet.ts](../packages/shared/src/schemas/userWallet.ts) (Zod schema, validated at the Firestore boundary via `FirestoreDataConverter`). The `UserWallet` TypeScript type is derived via `z.infer` and reexported from `src/types/index.ts`.

Client rule: `allow write: if false` (enforced by subcollection rule for `wallet`). Writes are server-only:

- **Bootstrap** (`balance: 0`) — seeded by the [bootstrapUserWallet](../functions/src/bootstrapUserWallet.ts) Auth blocking trigger when a new account is created (`beforeUserCreated`). See [ADR-010](Decisions.md#adr-010-wallet-bootstrap-moved-to-server-side-auth-blocking-trigger) for rationale.
- **Credit / debit** — via Admin SDK in [adminWalletManager](../functions/src/adminWalletManager.ts) and the (deprecated) [suitpayWebhook](../functions/src/suitpayWebhook.ts).

The [useWallet hook](../src/hooks/useWallet.ts) only **reads**. If the snapshot reports the document missing (typical for users created before the trigger existed), the hook surfaces a virtual `EMPTY_WALLET` (`balance: 0`, `updatedAt: epoch`) without writing. Once any server-side write lands (admin credit, payment webhook), the snapshot replaces the virtual wallet with the real one.

Note: ownership is encoded in the path (`users/{uid}/...`); no `userId` field is stored on the doc.

---

## users/{uid}/transactions/{txId}

Append-only ledger. Written only by Cloud Functions (client writes are blocked by [firestore.rules](../firestore.rules) — the subcollection rule excludes `transactions`).

```
{
  type: "credit" | "debit",
  amount: number,           // BRL centavos, integer >= 0
  description: string,
  status: "pending" | "completed" | "failed",
  createdAt: Timestamp,
  completedAt?: Timestamp,  // set by SuitPay flows when status flips to 'completed'

  // Cross-references (optional; mutually exclusive in practice but not enforced)
  reportId?: string,        // debit for a generated report
  paymentId?: string,       // PIX credit (deprecated SuitPay)

  // Admin metadata — set only by adminWalletManager.addUserCredits
  adminAction?: boolean,
  adminEmail?: string,
  adminReason?: string,
  adminIP?: string,

  // SuitPay PIX payer metadata — deprecated, removed when Asaas migration lands
  payerName?: string,
  payerCpf?: string         // CPF is masked: first 3 digits + "***"
}
```

Source of truth: [packages/shared/src/schemas/transaction.ts](../packages/shared/src/schemas/transaction.ts) (Zod schema, validated at the Firestore boundary via `FirestoreDataConverter`). `Transaction`, `TransactionType`, `TransactionStatus` types are derived via `z.infer` and reexported from `src/types/index.ts`.

Note: ownership is encoded in the path; no `userId` field is stored on the doc.

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
  email?: string,
  currency: string,
  timezone?: string,
  isActive: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastSyncAt?: Timestamp
}
```

Source of truth: [packages/shared/src/schemas/adAccount.ts](../packages/shared/src/schemas/adAccount.ts). Ownership is encoded in the path (`users/{uid}/...`); no `userId` field is stored on the doc.

---

## users/{uid}/campaigns/{platform_externalId}

Cache of campaigns synced from external Ads platforms. Document ID format: `{platform}_{externalId}` (e.g., `google_ads_123`, `meta_ads_456`).

```
{
  accountId: string,           // FK → users/{uid}/adAccounts/{id}.accountId
  platform: "google_ads" | "meta_ads",
  campaignId: string,          // external ID from the platform
  campaignName: string,
  status: string,              // lowercased value from upstream API
                               // (Google: enabled/paused/removed/...; Meta: active/paused/archived/with_issues/...)
  budget?: number,
  spend?: number,
  impressions?: number,        // integer
  clicks?: number,             // integer
  objective?: string,          // Meta only — campaign objective
  lastSyncAt: Timestamp        // serverTimestamp() at write
}
```

Source of truth: [packages/shared/src/schemas/campaign.ts](../packages/shared/src/schemas/campaign.ts) (Zod schema, validated at the Firestore boundary via `FirestoreDataConverter`). The `Campaign` TypeScript type is derived via `z.infer` and reexported from `src/types/index.ts` for backward-compatible imports.

Writes: Cloud Functions only (Admin SDK), via `getGoogleAdsCampaigns` / `getMetaAdsCampaigns` callable handlers, after fetching from the upstream platform API. Mock data for dev seeding lives in [src/utils/mockCampaigns.ts](../src/utils/mockCampaigns.ts).

Reads: owner only — used by [GenerateReportPage](../src/pages/GenerateReportPage.tsx) to populate the campaign multi-select.

Subcollection write rule (`/users/{userId}/{subcollection}/{docId=**}`) does not block `campaigns`, so the dev-only mock util can seed via the client SDK as the owner.

---

## campaigns/{campaignId} _(dead code — pending removal)_

A top-level `campaigns/{id}` collection is defined in [firestore.rules:49-65](../firestore.rules) (required fields `userId, name, budget, status` with status enum `draft|active|paused|ended`) and listed in the daily backup config at [functions/src/backupScheduler.ts](../functions/src/backupScheduler.ts). **No application code reads or writes this collection** — it is a leftover from an early design where users would create campaign drafts directly. The live model is the synced `users/{uid}/campaigns/{id}` subcollection above.

Cleanup (rule + DATA-MODEL entry + backup config) is tracked as a follow-up to Phase D in [REFACTOR-PLAN.md](REFACTOR-PLAN.md). Verification of zero documents in production via `gcloud firestore` is a prerequisite before deletion.

```
// Legacy schema documented for reference only:
{
  userId: string,
  name: string,
  budget: number,
  status: "draft" | "active" | "paused" | "ended",
  createdAt: Timestamp
}
```

---

## reports/{reportId}

```
{
  userId: string,
  type: "google_ads" | "meta_ads",
  templateId: string,                 // FK → templateData.ts (hardcoded array, NOT Firestore)
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

Source of truth: [packages/shared/src/schemas/report.ts](../packages/shared/src/schemas/report.ts) (Zod schema, validated at the Firestore boundary via `FirestoreDataConverter`). The `Report` TypeScript type is derived via `z.infer` and reexported from `src/types/index.ts` for backward-compatible imports.

Rule: owner only. Delete blocked.

**Legacy note (resolved 2026-04-25):** the legacy `type: "facebook_ads"` value is no longer present in production. The one-shot migration script `scripts/migrations/2026-04-meta-ads-rename.ts` was executed in dry-run mode against `adsmart-web` on 2026-04-25 and reported 0 docs to rewrite (`facebook_ads=0, meta_ads=1`). The defensive `normalizeType` helper in `useReports()` was removed in the same change.

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

## reportTemplates/{id} _(dead code — pending removal)_

A `reportTemplates/{id}` collection is defined in [firestore.rules:88-91](../firestore.rules) (authenticated read, Admin SDK write) and was originally intended to hold Looker Studio template configs. **No application code reads or writes this collection** — templates are served from a hardcoded array (`availableTemplates`) in [src/components/templates/templateData.ts](../src/components/templates/templateData.ts), with a wholly different shape (`TemplateData` — `id, platform, category, type, imageUrl, features`; no `name/description/lookerStudioTemplateId/isActive/createdAt`).

The unused `ReportTemplate` TypeScript interface was removed from `src/types/index.ts` in C6.5 (zero consumers). Cleanup of the firestore.rules entry is grouped with the top-level `campaigns/{id}` cleanup as a follow-up to Phase D, pending production-data verification via `gcloud firestore`.

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
