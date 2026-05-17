import * as admin from 'firebase-admin'

let initialized = false

export function getAdmin() {
  if (!initialized) {
    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'adsmart-test' })
    }
    initialized = true
  }
  return admin
}

export async function clearCollection(collectionPath: string) {
  const a = getAdmin()
  const snap = await a.firestore().collection(collectionPath).get()
  const batch = a.firestore().batch()
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
