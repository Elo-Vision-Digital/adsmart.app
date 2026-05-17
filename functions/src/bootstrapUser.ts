import * as admin from 'firebase-admin'
import { UserWalletSchema } from '@adsmart/shared'
import { beforeUserCreated } from 'firebase-functions/v2/identity'

if (!admin.apps.length) {
  admin.initializeApp()
}

// Seeds the per-user state that Phase 3 firestore.rules forbid the client
// from writing: the user profile doc and the prepaid wallet doc. Runs
// synchronously before Firebase Auth finalizes the account, so by the time
// the client sees a successful sign-in both docs exist.
//
// Validation: wallet shape via UserWalletSchema (@adsmart/shared, ADR-009).
// users/{uid} is intentionally minimal — name/phone/document fields are
// filled in by SettingsPage on first save.
export const bootstrapUser = beforeUserCreated(async (event) => {
  const uid = event.data?.uid
  const email = event.data?.email
  if (!uid) return

  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  const userRef = db.collection('users').doc(uid)
  const walletRef = userRef.collection('wallet').doc('current')

  const wallet = UserWalletSchema.omit({ id: true }).parse({
    balance: 0,
    currency: 'BRL',
    updatedAt: now,
  })

  const batch = db.batch()
  batch.set(
    userRef,
    {
      email: email ?? '',
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  )
  batch.set(walletRef, wallet, { merge: true })
  await batch.commit()
})
