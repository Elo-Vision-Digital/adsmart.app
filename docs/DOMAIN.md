# Domain Rules

Business logic that is not obvious from reading the code. Read before modifying wallet, billing, campaigns, or OAuth flows.

## Currency

**All monetary values stored in BRL centavos (integer).** Never store floats for money.

- `balance: 1000` = R$ 10,00
- `amount: 500` = R$ 5,00
- Convert for display: `(amount / 100).toFixed(2)`

`productPrices` documents have a `price: number` (float) field used for display only — do not use it for arithmetic. The actual debit amount in transactions is always in centavos.

## Wallet

A user's wallet lives at `users/{uid}/wallet/current`. It is a single document with a `balance` field.

- Balance can reach zero but never go negative.
- All balance mutations happen inside Firestore transactions to prevent race conditions.
- Only Cloud Functions (Admin SDK) write to wallet — clients cannot.
- Adding credits: `adminWalletManager.addUserCredits` (admin only).
- Deducting credits: report-generation functions (not yet implemented as of Phase 3).

## Reports

Reports are generated via Looker Studio template links served from a hardcoded `availableTemplates` array in [src/components/templates/templateData.ts](../src/components/templates/templateData.ts). (A `reportTemplates/{id}` Firestore collection was originally planned but never built — see the dead-code note in [DATA-MODEL.md](DATA-MODEL.md).) Generating a report:

1. User selects a template and an ad account.
2. The report function deducts the price (centavos) from `users/{uid}/wallet/current`.
3. A `reports/{id}` document is created with the Looker Studio URL.
4. The transaction is logged in `users/{uid}/transactions/{id}`.

Reports cannot be deleted (immutable after creation).

## Campaigns

Live campaigns are cached at `users/{uid}/campaigns/{platform_externalId}` after sync from the upstream Ads platform (Google Ads, Meta Ads). They are read-only from the user's perspective — sync is triggered server-side by `getGoogleAdsCampaigns` / `getMetaAdsCampaigns` callable Functions after OAuth.

- `campaignName`, `budget`, `spend`, `impressions`, `clicks` mirror the upstream platform's values.
- `status` is the lowercased value from the upstream API (Google: `enabled/paused/removed/...`; Meta: `active/paused/archived/with_issues/...`).
- `lastSyncAt` records the most recent server-side sync.

A separate top-level `campaigns/{id}` collection is defined in [firestore.rules](../firestore.rules) but **is not used** — see the dead-code note in [DATA-MODEL.md](DATA-MODEL.md).

## Admin access

Two-path check (OR logic):

1. Firebase custom claim: `token.admin === true` — authoritative path for new admins.
2. Email allowlist: `ADMIN_EMAILS` in `AuthContext.tsx` — legacy fallback for two existing admins.

To grant admin to a new user: `admin.auth().setCustomUserClaims(uid, { admin: true })`. User must re-login for claim to propagate to the token. See `docs/SECURITY.md`.

Admin limits in `adminWalletManager.ts`:
- Max R$ 1.000 per single transaction
- Max R$ 5.000 per admin per day
- Max 50 transactions per admin per day
- Reason field mandatory (min 10 characters)

## Rate limiting

`checkRateLimit(userId, actionName, maxAttempts?, windowMinutes?)` defaults to 5 attempts per 15 minutes.

When the limit is exceeded:
- `rateLimits/{userId_actionName}.blocked` is set to `true`.
- A `SecurityEventType.RATE_LIMIT_EXCEEDED` event is logged to `securityLogs`.
- The function throws `HttpsError('resource-exhausted', ...)`.
- The block lasts until the window expires (resets automatically on next call after window).

## OAuth flow (high-level)

See `docs/OAUTH.md` for the full flow.

Both Google Ads V2 and Meta Ads V2 use a two-step flow:

1. **Step 1** (`handleXxxCallbackWithSelection`): Exchange auth code → fetch accessible accounts → store tokens temporarily → return account list to client.
2. **Step 2** (`confirmXxxAccountSelection`): Client selects accounts → function saves encrypted tokens + account documents → deletes temporary token.

OAuth V1 (`googleAdsOAuth.ts`, `metaAdsOAuth.ts`) is deprecated but kept functional. Do not route new work through V1.

## i18n

Three languages: `pt` (default, pt-BR), `en`, `es`.

`t(key)` resolves dot-notation keys against the active locale JSON. If a key is missing in the active locale, it falls through to `pt` then to the raw key string. See `docs/I18N.md`.

## Product categories

| category | type | Description |
|---|---|---|
| google | lancamento | Google Ads - Launch campaign dashboard |
| google | negocio_local | Google Ads - Local business dashboard |
| meta | lancamento | Meta Ads - Launch campaign dashboard |
| meta | negocio_local | Meta Ads - Local business dashboard |

## SuitPay (deprecated)

SuitPay is being replaced by Asaas. Do not add new features or harden SuitPay. The `suitpayPayment.ts` and `suitpayWebhook.ts` functions are kept alive only to avoid breaking existing flows until the Asaas migration ships. See `docs/PAYMENTS.md`.
