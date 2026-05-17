/**
 * Lightweight Firestore `Timestamp` stand-in for schema tests.
 *
 * Schemas in @adsmart/shared use a duck-typed `.toDate()` check (see
 * src/firestore.ts), so tests can fake Timestamps without pulling in
 * `firebase/firestore` or `firebase-admin` as a dependency of this package.
 */
export const fakeTimestamp = (iso: string): { toDate: () => Date } => ({
  toDate: () => new Date(iso),
})
