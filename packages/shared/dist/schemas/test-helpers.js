"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fakeTimestamp = void 0;
/**
 * Lightweight Firestore `Timestamp` stand-in for schema tests.
 *
 * Schemas in @adsmart/shared use a duck-typed `.toDate()` check (see
 * src/firestore.ts), so tests can fake Timestamps without pulling in
 * `firebase/firestore` or `firebase-admin` as a dependency of this package.
 */
const fakeTimestamp = (iso) => ({
    toDate: () => new Date(iso),
});
exports.fakeTimestamp = fakeTimestamp;
//# sourceMappingURL=test-helpers.js.map