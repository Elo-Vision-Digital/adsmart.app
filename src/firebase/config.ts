import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

// Web app's Firebase configuration. All values come from build-time env
// vars in .env.production / .env.development; never inline.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

// Auth persistence fallback chain (validated via Context7 against
// /firebase/firebase-js-sdk 2026-05-17). IndexedDB is the most robust
// option for privacy-mode browsers; localStorage is the historical default;
// sessionStorage is the Safari ITP-friendly fallback; if all of those are
// blocked, the SDK falls back to in-memory and the user is signed out on
// tab close. browserPopupRedirectResolver wires the popup OAuth flow.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
})

export const db = getFirestore(app)
export const functions = getFunctions(app, 'us-central1')

const shouldUseEmulator =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

if (shouldUseEmulator && typeof window !== 'undefined') {
  if (!window.__FIREBASE_EMULATOR_CONNECTED__) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectFunctionsEmulator(functions, '127.0.0.1', 5001)
    window.__FIREBASE_EMULATOR_CONNECTED__ = true
  }
}

declare global {
  interface Window {
    __FIREBASE_EMULATOR_CONNECTED__?: boolean
  }
}

export default app
