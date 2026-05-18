import * as z from 'zod';
export declare const AdPlatformSchema: z.ZodEnum<{
    google_ads: "google_ads";
    meta_ads: "meta_ads";
}>;
export type AdPlatform = z.infer<typeof AdPlatformSchema>;
export declare const AdAccountSchema: z.ZodObject<{
    id: z.ZodString;
    platform: z.ZodEnum<{
        google_ads: "google_ads";
        meta_ads: "meta_ads";
    }>;
    accountId: z.ZodString;
    accountName: z.ZodString;
    email: z.ZodOptional<z.ZodEmail>;
    currency: z.ZodString;
    timezone: z.ZodOptional<z.ZodString>;
    isActive: z.ZodBoolean;
    lastSyncAt: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>>;
    createdAt: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>;
    updatedAt: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>;
}, z.core.$strip>;
export type AdAccount = z.infer<typeof AdAccountSchema>;
//# sourceMappingURL=adAccount.d.ts.map