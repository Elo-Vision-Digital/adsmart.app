// All shared Firestore document types flow from @adsmart/shared (ADR-009 +
// ADR-018). Re-exported here so `import type { ... } from '@/types'` callers
// keep working without each file having to import from the workspace package.
//
// Note: `User.displayName` / `User.photoURL` are NOT part of the Firestore
// shape — they live on Firebase Auth (`user.displayName`, `user.photoURL`)
// and were stale local fields prior to ADR-018.
export type {
  AdAccount,
  Campaign,
  DocumentType,
  Report,
  Transaction,
  User,
  UserClientUpdate,
  UserWallet,
} from '@adsmart/shared'

// See docs/DATA-MODEL.md for the dead-code note and the post-Phase-D cleanup task.
