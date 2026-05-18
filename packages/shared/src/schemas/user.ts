import * as z from 'zod'
import { zTimestamp } from '../firestore'

// Canonical shape for `users/{uid}` documents. The doc is seeded server-side
// by the bootstrapUser blocking trigger (ADR-010) with `{ email, createdAt,
// updatedAt }`, then progressively enriched: SettingsPage writes `name` and
// `phone`, and reserveUserDocument (ADR-012) atomically writes
// `documentType` + `documentNumber` once, after which firestore.rules block
// any change to those two fields via `documentLocked()`.
//
// All client-controllable fields are optional here because the doc is
// observed mid-fill across the UI flow (right after signup it only has the
// three bootstrap fields). `email` and `createdAt` are immutable per the
// rules; `displayName`/`photoURL` live on Firebase Auth and are intentionally
// NOT mirrored into Firestore (they were a stale field in src/types).

export const DocumentTypeSchema = z.enum(['cpf', 'cnpj'])
export type DocumentType = z.infer<typeof DocumentTypeSchema>

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(8).max(20).optional(),
  documentType: DocumentTypeSchema.optional(),
  // Normalized (digits-only) CPF/CNPJ as stored by reserveUserDocument.
  // Length is enforced in conjunction with documentType, not here, because
  // reserveUserDocument runs full check-digit validation server-side.
  documentNumber: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, 'documentNumber must be 11 digits (CPF) or 14 digits (CNPJ)')
    .optional(),
  createdAt: zTimestamp(),
  updatedAt: zTimestamp(),
})
export type User = z.infer<typeof UserSchema>

// Shape clients can send through `updateDoc(users/{uid}, ...)`. firestore.rules
// reject any payload that mutates `email`, `createdAt`, or — once set —
// `documentType`/`documentNumber`. So at the API edge we only ever accept
// these fields. The CPF/CNPJ reservation goes through reserveUserDocument
// (see ReserveUserDocumentInputSchema in ./userDocument.ts), not here.
export const UserClientUpdateSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    phone: z.string().min(8).max(20).optional(),
    updatedAt: zTimestamp().optional(),
  })
  .strict()
export type UserClientUpdate = z.infer<typeof UserClientUpdateSchema>
