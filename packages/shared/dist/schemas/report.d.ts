import * as z from 'zod';
export declare const ReportTypeSchema: z.ZodEnum<{
    google_ads: "google_ads";
    meta_ads: "meta_ads";
}>;
export type ReportType = z.infer<typeof ReportTypeSchema>;
export declare const ReportStatusSchema: z.ZodEnum<{
    pending: "pending";
    processing: "processing";
    completed: "completed";
    failed: "failed";
}>;
export type ReportStatus = z.infer<typeof ReportStatusSchema>;
export declare const DateRangeSchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
}, z.core.$strip>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export declare const ReportSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<{
        google_ads: "google_ads";
        meta_ads: "meta_ads";
    }>;
    templateId: z.ZodString;
    name: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        processing: "processing";
        completed: "completed";
        failed: "failed";
    }>;
    campaignIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allCampaigns: z.ZodDefault<z.ZodBoolean>;
    dateRange: z.ZodDefault<z.ZodObject<{
        startDate: z.ZodString;
        endDate: z.ZodString;
    }, z.core.$strip>>;
    lookerStudioUrl: z.ZodOptional<z.ZodString>;
    cost: z.ZodDefault<z.ZodNumber>;
    paidAt: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>>;
    createdAt: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Report = z.infer<typeof ReportSchema>;
//# sourceMappingURL=report.d.ts.map