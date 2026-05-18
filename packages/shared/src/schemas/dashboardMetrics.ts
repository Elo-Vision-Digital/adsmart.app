import * as z from 'zod'

const MAX_RANGE_DAYS = 365

export const GetDashboardMetricsInputSchema = z
  .object({
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime(),
  })
  .refine((v) => new Date(v.endDate).getTime() >= new Date(v.startDate).getTime(), {
    message: 'endDate must be greater than or equal to startDate',
    path: ['endDate'],
  })
  .refine(
    (v) => {
      const days =
        (new Date(v.endDate).getTime() - new Date(v.startDate).getTime()) / 86_400_000
      return days <= MAX_RANGE_DAYS
    },
    { message: `range exceeds ${MAX_RANGE_DAYS} days`, path: ['endDate'] }
  )
export type GetDashboardMetricsInput = z.infer<typeof GetDashboardMetricsInputSchema>

const PlatformSchema = z.enum(['google_ads', 'meta_ads'])

export const GetDashboardMetricsOutputSchema = z.object({
  range: z.object({
    startDate: z.iso.datetime(),
    endDate: z.iso.datetime(),
    days: z.number().int().nonnegative(),
  }),
  revenue: z.object({
    realCents: z.number().int().nonnegative(),
    creditsCents: z.number().int().nonnegative(),
    sparkline: z.array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
        realCents: z.number().int().nonnegative(),
        creditsCents: z.number().int().nonnegative(),
      })
    ),
  }),
  users: z.object({
    newCount: z.number().int().nonnegative(),
    activeCount: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative(),
    sparkline: z.array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD'),
        newCount: z.number().int().nonnegative(),
      })
    ),
  }),
  integrations: z.object({
    byPlatform: z.array(
      z.object({
        platform: PlatformSchema,
        distinctUserCount: z.number().int().nonnegative(),
      })
    ),
  }),
  generatedAt: z.iso.datetime(),
})
export type GetDashboardMetricsOutput = z.infer<typeof GetDashboardMetricsOutputSchema>

export const DASHBOARD_METRICS_MAX_RANGE_DAYS = MAX_RANGE_DAYS
