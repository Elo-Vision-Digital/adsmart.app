import * as z from 'zod'

const MAX_RANGE_DAYS = 365

export const GetDashboardMetricsInputSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
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
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    days: z.number().int().nonnegative(),
  }),
  revenue: z.object({
    realCents: z.number().int().nonnegative(),
    creditsCents: z.number().int().nonnegative(),
    sparkline: z.array(
      z.object({
        date: z.string(),
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
        date: z.string(),
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
  generatedAt: z.string().datetime(),
})
export type GetDashboardMetricsOutput = z.infer<typeof GetDashboardMetricsOutputSchema>

export const DASHBOARD_METRICS_MAX_RANGE_DAYS = MAX_RANGE_DAYS
