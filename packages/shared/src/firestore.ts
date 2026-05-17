import * as z from 'zod'

/**
 * Schema fragment for fields that arrive from Firestore as a `Timestamp` and
 * should be exposed to the application as a native `Date`.
 *
 * Detection is structural (`.toDate()` duck-type) rather than `instanceof
 * Timestamp` so this helper works under both the web SDK (`firebase/firestore`)
 * and the Admin SDK (`firebase-admin/firestore`) — those ship distinct
 * `Timestamp` classes whose values would otherwise cross-fail an `instanceof`
 * check. Native `Date` instances pass through untouched.
 */
type TimestampLike = { toDate: () => Date }

const isTimestampLike = (value: unknown): value is TimestampLike =>
  typeof value === 'object' &&
  value !== null &&
  'toDate' in value &&
  typeof (value as { toDate: unknown }).toDate === 'function'

export const zTimestamp = () =>
  z.preprocess((value) => (isTimestampLike(value) ? value.toDate() : value), z.date())
