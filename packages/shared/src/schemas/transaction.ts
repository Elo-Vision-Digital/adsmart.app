import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const TransactionTypeSchema = z.enum(['credit', 'debit'])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const TransactionStatusSchema = z.enum(['pending', 'completed', 'failed'])
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>

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
  // by the pre-ADR-021 SuitPay flow. Will be re-purposed for Asaas when
  // payment lands again.
  payerName: z.string().optional(),
  payerCpf: z.string().optional(),
})
export type Transaction = z.infer<typeof TransactionSchema>
