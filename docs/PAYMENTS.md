# Payments

## Current state

The payment system is in transition. SuitPay is being replaced by Asaas. **Do not add features or harden SuitPay.** Only keep it functional.

---

## SuitPay (deprecated)

⚠ **Being replaced by Asaas. No new investment. Keep alive until Asaas ships.**

### PIX payment flow

1. Client calls `createPixPayment({ amount, description })`.
2. Function creates a PIX charge via SuitPay API, stores a `pendingPayments/{id}` doc.
3. Returns QR code data + transaction ID to client.
4. Client shows QR code in `PixPaymentModal`.
5. User pays via PIX in their bank app.
6. SuitPay POSTs to `suitpayWebhook` endpoint.
7. Webhook function updates payment status, credits wallet balance.

### Webhook security (minimal)

The webhook validates a signature header but the validation is not enforced as a hard block (SuitPay is being removed). The payload log is limited to `user-agent`, `x-forwarded-for`, `content-type` headers only (no full request body).

### Firestore collections used

- `pendingPayments/{id}` — payment waiting for confirmation
- `payments/{id}` — confirmed payment records
- `orphan_payments/{id}` — payments that arrived but matched no user
- `webhook_logs/{id}` — incoming webhook audit log (headers subset only)

### Known limitations

- Hash validation is not mandatory (SuitPay is being removed anyway)
- IP allowlist is not enforced
- `deleteUserData` does not clean up payment collections yet

---

## Asaas (future — Phase 5+)

Asaas will replace SuitPay for PIX and potentially Boleto payments. This migration is NOT part of the current modernization plan (Phases 1–4). It is separate work.

When Asaas lands, the SuitPay collections and functions should be deleted:
- `functions/src/suitpayPayment.ts`
- `functions/src/suitpayWebhook.ts`
- Firestore collections: `pendingPayments`, `payments`, `orphan_payments`, `webhook_logs`

---

## Wallet credit paths

Credits can enter the wallet in two ways:

1. **Payment confirmed** — `suitpayWebhook` credits the wallet after a confirmed PIX (will be replaced by Asaas webhook).
2. **Admin grant** — `addUserCredits` (admin only) via `adminWalletManager.ts`. Used for manual adjustments, refunds, onboarding.

Debits happen when a report is generated (deduct report cost from wallet balance).
