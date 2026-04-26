import * as z from 'zod'
import { AdPlatformSchema } from './adAccount'
import { zTimestamp } from './firestore-converter'

// Status arrives lowercased from the upstream Ads APIs (Google Ads:
// enabled/paused/removed/...; Meta: active/paused/archived/with_issues/...).
// Kept permissive until a real sync surfaces the full value set; tighten to
// z.enum once mapped.
export const CampaignSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  platform: AdPlatformSchema,
  campaignId: z.string(),
  campaignName: z.string(),
  status: z.string(),
  budget: z.number().nonnegative().optional(),
  spend: z.number().nonnegative().optional(),
  impressions: z.number().int().nonnegative().optional(),
  clicks: z.number().int().nonnegative().optional(),
  objective: z.string().optional(),
  lastSyncAt: zTimestamp(),
})
export type Campaign = z.infer<typeof CampaignSchema>
