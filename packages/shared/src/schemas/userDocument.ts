import * as z from 'zod'
import { zTimestamp } from '../firestore'
import { DocumentTypeSchema } from './user'

// `userDocuments/{normalizedDocument}` is the global uniqueness index for
// CPF/CNPJ across all users (ADR-012). Doc id is the digits-only document
// number; the document body records who owns the reservation. Reads are
// owner-only via firestore.rules; writes happen only inside the
// reserveUserDocument callable transaction.
export const UserDocumentSchema = z.object({
  id: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, 'userDocument id must be 11 (CPF) or 14 (CNPJ) digits'),
  userId: z.string().min(1),
  documentType: DocumentTypeSchema,
  createdAt: zTimestamp(),
})
export type UserDocument = z.infer<typeof UserDocumentSchema>

// Callable input — client may send the document formatted ("123.456.789-09")
// or stripped ("12345678909"). The callable normalizes and validates check
// digits server-side, so we keep the wire contract permissive on shape but
// strict on type discrimination.
export const ReserveUserDocumentInputSchema = z.object({
  documentType: DocumentTypeSchema,
  documentNumber: z.string().min(11).max(20),
})
export type ReserveUserDocumentInput = z.infer<typeof ReserveUserDocumentInputSchema>

export const ReserveUserDocumentOutputSchema = z.object({
  success: z.literal(true),
  documentType: DocumentTypeSchema,
  documentNumber: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, 'documentNumber must be normalized digits-only'),
})
export type ReserveUserDocumentOutput = z.infer<typeof ReserveUserDocumentOutputSchema>
