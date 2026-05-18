import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import { checkRateLimit } from './rateLimiter'
import { securityLogger, SecurityEventType, SecuritySeverity } from './securityLogger'

if (!admin.apps.length) {
  admin.initializeApp()
}

const KNOWN_SUBCOLLECTIONS = [
  'wallet',
  'transactions',
  'oauthConnections',
  'reports',
  'activityLogs',
] as const

async function deleteSubcollection(uid: string, name: string): Promise<number> {
  const db = admin.firestore()
  const ref = db.collection('users').doc(uid).collection(name)
  const snapshot = await ref.listDocuments()
  if (snapshot.length === 0) return 0

  let deleted = 0
  for (let i = 0; i < snapshot.length; i += 400) {
    const slice = snapshot.slice(i, i + 400)
    const batch = db.batch()
    slice.forEach((d) => batch.delete(d))
    await batch.commit()
    deleted += slice.length
  }
  return deleted
}

export const deleteUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Usuário não autenticado')
  }
  const uid = request.auth.uid
  const email = request.auth.token.email ?? null

  // 1 attempt per hour per user. checkRateLimit throws
  // HttpsError('resource-exhausted', ...) when blocked — propagate naturally.
  await checkRateLimit(uid, 'deleteUserData', 1, 60)

  const db = admin.firestore()
  const userRef = db.collection('users').doc(uid)

  // 1. Read userDocuments index ref (CPF/CNPJ uniqueness — ADR-012)
  const userSnap = await userRef.get()
  const documentNumber =
    (userSnap.exists ? (userSnap.data()?.documentNumber as string | undefined) : undefined) ?? null
  const normalizedDocId = documentNumber ? documentNumber.replace(/\D/g, '') : null

  // 2. Cascade delete subcollections
  const counts: Record<string, number> = {}
  for (const sub of KNOWN_SUBCOLLECTIONS) {
    counts[sub] = await deleteSubcollection(uid, sub)
  }

  // 3. Delete userDocuments/{normalizedDocId} if present
  if (normalizedDocId) {
    await db
      .collection('userDocuments')
      .doc(normalizedDocId)
      .delete()
      .catch(() => {
        // Tolerate already-missing index entry — idempotent.
      })
  }

  // 4. Delete the user doc itself
  await userRef.delete()

  // 5. Delete the Firebase Auth user (this invalidates the caller's token)
  await admin.auth().deleteUser(uid)

  // 6. Audit log
  await securityLogger.logEvent(
    SecurityEventType.USER_DELETION,
    uid,
    {
      email,
      deletedAt: admin.firestore.Timestamp.now().toMillis(),
      subcollectionCounts: counts,
      hadDocumentIndex: Boolean(normalizedDocId),
    },
    SecuritySeverity.INFO
  )

  return { success: true, deletedAt: Date.now(), counts }
})
