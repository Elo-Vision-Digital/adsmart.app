import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const UserWalletSchema = z.object({
  id: z.string(),
  balance: z.number().int().nonnegative(),
  currency: z.literal('BRL'),
  updatedAt: zTimestamp(),
})
export type UserWallet = z.infer<typeof UserWalletSchema>
