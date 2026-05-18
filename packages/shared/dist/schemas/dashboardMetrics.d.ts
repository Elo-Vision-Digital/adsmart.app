import * as z from 'zod';
export declare const GetDashboardMetricsInputSchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
}, z.core.$strip>;
export type GetDashboardMetricsInput = z.infer<typeof GetDashboardMetricsInputSchema>;
export declare const GetDashboardMetricsOutputSchema: z.ZodObject<{
    range: z.ZodObject<{
        startDate: z.ZodString;
        endDate: z.ZodString;
        days: z.ZodNumber;
    }, z.core.$strip>;
    revenue: z.ZodObject<{
        realCents: z.ZodNumber;
        creditsCents: z.ZodNumber;
        sparkline: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            realCents: z.ZodNumber;
            creditsCents: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    users: z.ZodObject<{
        newCount: z.ZodNumber;
        activeCount: z.ZodNumber;
        totalCount: z.ZodNumber;
        sparkline: z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            newCount: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    integrations: z.ZodObject<{
        byPlatform: z.ZodArray<z.ZodObject<{
            platform: z.ZodEnum<{
                google_ads: "google_ads";
                meta_ads: "meta_ads";
            }>;
            distinctUserCount: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    generatedAt: z.ZodString;
}, z.core.$strip>;
export type GetDashboardMetricsOutput = z.infer<typeof GetDashboardMetricsOutputSchema>;
export declare const DASHBOARD_METRICS_MAX_RANGE_DAYS = 365;
//# sourceMappingURL=dashboardMetrics.d.ts.map