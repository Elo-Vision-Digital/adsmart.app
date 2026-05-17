import * as z from 'zod'
import { zTimestamp } from '../firestore'

export const ReportTypeSchema = z.enum(['google_ads', 'meta_ads'])
export type ReportType = z.infer<typeof ReportTypeSchema>

export const ReportStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'])
export type ReportStatus = z.infer<typeof ReportStatusSchema>

export const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
})
export type DateRange = z.infer<typeof DateRangeSchema>

export const ReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: ReportTypeSchema,
  templateId: z.string(),
  name: z.string(),
  status: ReportStatusSchema,
  campaignIds: z.array(z.string()).optional(),
  allCampaigns: z.boolean().default(false),
  dateRange: DateRangeSchema.default({ startDate: '', endDate: '' }),
  lookerStudioUrl: z.string().url().optional(),
  cost: z.number().int().nonnegative().default(0),
  paidAt: zTimestamp().optional(),
  createdAt: zTimestamp(),
  completedAt: zTimestamp().optional(),
  error: z.string().optional(),
})
export type Report = z.infer<typeof ReportSchema>
