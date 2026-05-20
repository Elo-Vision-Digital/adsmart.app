import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const TransactionTypeSchema = z.enum(['credit', 'debit'])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const TransactionStatusSchema = z.enum(['pending', 'completed', 'failed'])
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>

// Provider que originou a transação. `admin` é o atual (addUserCredits).
// `stripe` será adicionado quando FUTURE §8 entrar. `legacy` cobre
// transações pré-redesign (SuitPay removido em ADR-021).
export const TransactionProviderSchema = z.enum(['admin', 'stripe', 'legacy'])
export type TransactionProvider = z.infer<typeof TransactionProviderSchema>

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
  amount: z.number().int().nonnegative(),
  description: z.string(),
  status: TransactionStatusSchema,
  createdAt: zTimestamp(),
  completedAt: zTimestamp().optional(),

  reportId: z.string().optional(),
  paymentId: z.string().optional(),

  adminAction: z.boolean().optional(),
  adminEmail: z.string().optional(),
  adminReason: z.string().optional(),
  adminIP: z.string().optional(),

  // PIX payer metadata — kept on the schema for legacy transactions written
  // by the pre-ADR-021 SuitPay flow. Será removido na Fase 0.5 do roadmap
  // junto com o cleanup textual (sem usuários em prod, sem migration).
  payerName: z.string().optional(),
  payerCpf: z.string().optional(),

  // === Campos novos do redesign (FOUND-1) ===
  // Provider — `admin` para entradas via addUserCredits (atual); `stripe`
  // quando FUTURE §8 entrar; `legacy` para histórico anterior.
  provider: TransactionProviderSchema.optional(),
  // Idempotência: clientRequestId aceito pela callable (UUID v4 do cliente).
  // Permite o cliente retentar com segurança.
  clientRequestId: z.string().min(1).max(64).optional(),
  // Stripe IDs (FUTURE §8) — preparados desde já no schema mas sem código
  // de pagamento ativo neste roadmap.
  stripePaymentIntentId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeChargeId: z.string().optional(),
})
export type Transaction = z.infer<typeof TransactionSchema>
