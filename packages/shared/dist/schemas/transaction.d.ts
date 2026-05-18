import * as z from 'zod';
export declare const TransactionTypeSchema: z.ZodEnum<{
    credit: "credit";
    debit: "debit";
}>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export declare const TransactionStatusSchema: z.ZodEnum<{
    pending: "pending";
    completed: "completed";
    failed: "failed";
}>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export declare const TransactionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        credit: "credit";
        debit: "debit";
    }>;
    amount: z.ZodNumber;
    description: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        completed: "completed";
        failed: "failed";
    }>;
    createdAt: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodDate>>;
    reportId: z.ZodOptional<z.ZodString>;
    paymentId: z.ZodOptional<z.ZodString>;
    adminAction: z.ZodOptional<z.ZodBoolean>;
    adminEmail: z.ZodOptional<z.ZodString>;
    adminReason: z.ZodOptional<z.ZodString>;
    adminIP: z.ZodOptional<z.ZodString>;
    payerName: z.ZodOptional<z.ZodString>;
    payerCpf: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Transaction = z.infer<typeof TransactionSchema>;
//# sourceMappingURL=transaction.d.ts.map