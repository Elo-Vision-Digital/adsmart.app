import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const AdPlatformSchema = z.enum(['google_ads', 'meta_ads'])
export type AdPlatform = z.infer<typeof AdPlatformSchema>

export const AdAccountSchema = z.object({
  id: z.string(),
  platform: AdPlatformSchema,
  accountId: z.string(),
  accountName: z.string(),
  email: z.string().optional(),
  currency: z.string(),
  timezone: z.string().optional(),
  isActive: z.boolean(),
  lastSyncAt: zTimestamp().optional(),
  createdAt: zTimestamp(),
  updatedAt: zTimestamp(),
})
export type AdAccount = z.infer<typeof AdAccountSchema>
