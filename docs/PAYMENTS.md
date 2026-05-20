# Payments

> **Status (2026-05-19):** SuitPay was REMOVED end-to-end in [ADR-021](Decisions.md#adr-021-remove-suitpay-end-to-end--harden-prepare-deploy-against-secretenv-overlap). No payment backend is currently wired. `AddCreditsModal` shows a maintenance notice. **Stripe is the planned replacement (FUTURE §8 — see [docs/research/08-stripe-future.md](research/08-stripe-future.md))**. An earlier deferred ADR (ADR-003) considered a different replacement that was never implemented; Stripe supersedes that direction.

---

## Current state

- ✅ **Wallet primitives** (`users/{uid}/wallet/current`, `users/{uid}/transactions/{txId}`) are intact and validated by `UserWalletSchema` and `TransactionSchema` in `@adsmart/shared`.
- ✅ **Admin credit grants** still work via `addUserCredits` callable (`functions/src/adminWalletManager.ts`) — the canonical reference for "atomic Firestore transaction over wallet + transactions". Mirror this shape when Stripe lands (FUTURE §8).
- ❌ **User-facing payment** (card, PIX via Stripe BR, etc) has no backend. UI surfaces a maintenance-notice modal.

## SuitPay (removed)

Removed on 2026-05-18 (ADR-021). Why and how documented in the ADR. No restoration path — when payment functionality returns, it returns as Stripe (FUTURE §8), not as SuitPay.

What was deleted:
- Cloud Functions: `suitpayWebhook`, `createPixPayment`, `checkPaymentStatus` (deleted from `adsmart-web-dev`; pending deletion from `adsmart-web`)
- Secrets: `SUITPAY_CLIENT_ID`, `SUITPAY_CLIENT_SECRET` (no longer declared via `defineSecret`)
- Source files: `functions/src/suitpayPayment.ts`, `functions/src/suitpayWebhook.ts`
- UI: `src/components/ui/PixPaymentModal.tsx`, `src/services/paymentService.ts`
- `config.suitpay` block + `getWebhookUrl` / `getRedirectUrl` helpers in `functions/src/config/index.ts`

What was preserved (intentional):
- `Transaction.payerName`, `Transaction.payerCpf`, `Transaction.paymentId` — historical SuitPay transactions still parse; these fields stay optional and may be repurposed (or deprecated) when the new payment provider lands.
- `AddCreditsModal` — kept as a maintenance-notice placeholder. 3 callers depend on it (Header, MobileHeader, TemplatesPage); restoring takes one component edit when Stripe ships (FUTURE §8).

## Stripe (planned — FUTURE §8)

When Stripe integration lands ([FUTURE §8](redesign/FUTURE-IDEAS.md), backed by [research/08-stripe-future.md](research/08-stripe-future.md)):

1. **Do not bring back `SUITPAY_*` secrets** — Stripe uses its own credentials (declare via `defineSecret('STRIPE_SECRET_KEY')` and `defineSecret('STRIPE_WEBHOOK_SECRET')` in `functions/src/config/index.ts`).
2. **Stripe handles tokenization** server-side via PaymentIntents + Customer — no raw card data crosses the boundary. The AES-256-GCM module at `functions/src/lib/oauthCrypto.ts` (ADR-019) stays scoped to OAuth tokens at rest, not payment data.
3. **Mirror `adminWalletManager.addUserCredits`** for the credit-wallet transaction shape: read `wallet/current` + read transaction-existence guard inside a `runTransaction`, then write the credit transaction + update the wallet balance atomically.
4. **Restore `AddCreditsModal`** with a Stripe Checkout (or Payment Element) flow — amount input + redirect/embed. The 3 call sites do not need to change.
5. **Reuse `useWallet` hook** in the frontend — no changes needed; it reads `users/{uid}/wallet/current` via Firestore snapshot.

> **Historical note:** ADR-003 (2026-04-24, Deferred) initially planned a different SuitPay replacement that was never implemented; Stripe (FUTURE §8) is now the planned direction (recorded in `docs/research/08-stripe-future.md` 2026-05-19). ADR-003 stays as historical record.

## Wallet credit paths

Credits enter the wallet through one canonical path today:

- **Admin grant** — [`addUserCredits`](../functions/src/adminWalletManager.ts) (admin-only callable, validated via `isAdminUser` from `@adsmart/shared`). Used for manual adjustments, refunds, onboarding.

Debits happen when a report is generated (deduct report cost from wallet balance). The `Transaction` schema's `type: 'debit'` + `reportId` fields encode this.

## Implementation reference

For any new payment writer:

- Schema: `TransactionSchema.omit({ id: true }).parse(...)` — validate before persisting.
- Wallet update: `UserWalletSchema.omit({ id: true }).parse(...)` — same.
- Firestore transaction order: read all docs first, then write. See `adminWalletManager.ts` lines ~239-274 for the canonical shape.
- Server timestamps: `admin.firestore.Timestamp.now()` or `FieldValue.serverTimestamp()` — never `new Date()` raw.
- Security: declare any external API secret via `defineSecret`, bind on the function via `options.secrets: [...]`, never via `process.env`.

## Operator: SuitPay prod cleanup pending

The 3 Cloud Run services (`suitpayWebhook`, `createPixPayment`, `checkPaymentStatus`) still exist in `adsmart-web` (production). They have no traffic (UI updated, domain not pointed yet). To remove:

```bash
firebase functions:delete suitpayWebhook createPixPayment checkPaymentStatus --project adsmart-web --region us-central1 --force
firebase deploy --only functions --project adsmart-web
```

The deploy in the second step also brings ADR-016, ADR-017, ADR-018, ADR-019, and ADR-021 codebase changes to prod (AES-256-GCM for OAuth tokens, schemas in `@adsmart/shared`, etc).
