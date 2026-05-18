import * as z from 'zod';
export declare const CampaignSchema: z.ZodObject<{
    id: z.ZodString;
    accountId: z.ZodString;
    platform: z.ZodEnum<{
        google_ads: "google_ads";
        meta_ads: "meta_ads";
    }>;
    campaignId: z.ZodString;
    campaignName: z.ZodString;
    status: z.ZodString;
    budget: z.ZodOptional<z.ZodNumber>;
    spend: z.ZodOptional<z.ZodNumber>;
    impressions: z.ZodOptional<z.ZodNumber>;
    clicks: z.ZodOptional<z.ZodNumber>;
    objective: z.ZodOptional<z.ZodString>;
    lastSyncAt: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>;
}, z.core.$strip>;
export type Campaign = z.infer<typeof CampaignSchema>;
//# sourceMappingURL=campaign.d.ts.map