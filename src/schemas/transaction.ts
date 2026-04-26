import * as z from 'zod'
import { zTimestamp } from './firestore-converter'

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

  // SuitPay PIX payer metadata — deprecated, removed when Asaas migration lands.
  payerName: z.string().optional(),
  payerCpf: z.string().optional(),
})
export type Transaction = z.infer<typeof TransactionSchema>
