import type {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore'
import type * as z from 'zod'

// Re-export so existing `import { zTimestamp } from '@/schemas/firestore-converter'`
// callers keep working after the move to @adsmart/shared in Phase D.
export { zTimestamp } from '@adsmart/shared'

/**
 * Builds a `FirestoreDataConverter` from a Zod schema.
 *
 * Read path (`fromFirestore`): uses `safeParse` and logs a structured error
 * when validation fails. The malformed doc is still returned (best-effort
 * cast) so the UI doesn't crash on a single bad row — REFACTOR-PLAN.md risk
 * mitigation. Once we're confident in production, this can flip to strict
 * `parse`.
 *
 * Write path (`toFirestore`): strict `parse` — better to fail before writing
 * than to persist invalid data and discover the drift later.
 *
 * The schema is expected to declare `id: z.string()` so `fromFirestore` can
 * inject the snapshot id. Schemas that don't model an id can omit it; the
 * extra property is harmless.
 */
export function zodConverter<T extends { id?: string }>(
  schema: z.ZodType<T>,
  label: string
): FirestoreDataConverter<T> {
  return {
    fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>, options?: SnapshotOptions): T {
      const raw = { id: snapshot.id, ...snapshot.data(options) }
      const result = schema.safeParse(raw)
      if (result.success) return result.data
      console.error(
        `[zodConverter:${label}] schema mismatch on doc ${snapshot.id}`,
        result.error.issues
      )
      return raw as T
    },
    toFirestore(model) {
      const { id: _omit, ...rest } = schema.parse(model) as T & { id?: string }
      return rest as DocumentData
    },
  }
}
