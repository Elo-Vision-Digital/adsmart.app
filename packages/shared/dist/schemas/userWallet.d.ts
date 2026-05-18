import * as z from 'zod';
export declare const UserWalletSchema: z.ZodObject<{
    id: z.ZodString;
    balance: z.ZodNumber;
    currency: z.ZodLiteral<"BRL">;
    updatedAt: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>;
}, z.core.$strip>;
export type UserWallet = z.infer<typeof UserWalletSchema>;
//# sourceMappingURL=userWallet.d.ts.map