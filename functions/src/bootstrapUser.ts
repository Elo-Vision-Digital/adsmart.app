import * as admin from 'firebase-admin'
import { UserWalletSchema } from '@adsmart/shared'
import { beforeUserCreated } from 'firebase-functions/v2/identity'

if (!admin.apps.length) {
  admin.initializeApp()
}

// Seeds per-user state forbidden to the client by Phase 3 firestore.rules:
// users/{uid} (profile) and users/{uid}/wallet/current (prepaid balance).
// Runs synchronously before Firebase Auth finalizes the account.
//
// 2026-05-17 (ADR-016): email is now resolved with fallback ordering —
// top-level event.data.email → providerData[*].email → null. Facebook in
// particular sometimes omits the top-level email even when the user granted
// the email scope. If no email is found, users/{uid} is created WITHOUT
// the email field; SettingsPage gates first save until the user fills it.
//
// Validation: wallet shape via UserWalletSchema (@adsmart/shared, ADR-009).
export const bootstrapUser = beforeUserCreated(async (event) => {
  const uid = event.data?.uid
  if (!uid) return

  const email =
    event.data?.email ??
    (event.data?.providerData ?? []).find((p) => Boolean(p.email))?.email ??
    null

  const db = admin.firestore()
  const now = admin.firestore.Timestamp.now()

  const userRef = db.collection('users').doc(uid)
  const walletRef = userRef.collection('wallet').doc('current')

  const wallet = UserWalletSchema.omit({ id: true }).parse({
    balance: 0,
    currency: 'BRL',
    updatedAt: now,
  })

  const userDoc: Record<string, unknown> = {
    createdAt: now,
    updatedAt: now,
  }
  if (email) userDoc.email = email

  const batch = db.batch()
  batch.set(userRef, userDoc, { merge: true })
  batch.set(walletRef, wallet, { merge: true })
  await batch.commit()

  // Structured telemetry for Cloud Logging. Use a stable JSON shape so
  // Logs Explorer can filter by event="bootstrapUser.success".
  console.log(
    JSON.stringify({
      event: 'bootstrapUser.success',
      uid,
      email_present: Boolean(email),
      providers: (event.data?.providerData ?? []).map((p) => p.providerId),
    })
  )
})
