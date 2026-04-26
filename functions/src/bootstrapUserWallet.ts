import * as admin from 'firebase-admin'
import { UserWalletSchema } from '@adsmart/shared'
import { beforeUserCreated } from 'firebase-functions/v2/identity'

if (!admin.apps.length) {
  admin.initializeApp()
}

// Seeds users/{uid}/wallet/current with balance:0 the moment Firebase Auth
// finalizes a new account. Required because Phase 3 firestore.rules block
// client-side writes to the `wallet` subcollection.
export const bootstrapUserWallet = beforeUserCreated(async (event) => {
  const uid = event.data?.uid
  if (!uid) return

  const walletRef = admin
    .firestore()
    .collection('users')
    .doc(uid)
    .collection('wallet')
    .doc('current')

  const seed = UserWalletSchema.omit({ id: true }).parse({
    balance: 0,
    currency: 'BRL',
    updatedAt: admin.firestore.Timestamp.now(),
  })

  await walletRef.set(seed, { merge: true })
})
