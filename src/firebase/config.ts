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

// App Check (reCAPTCHA Enterprise) — gated by VITE_APPCHECK_SITE_KEY.
// Without a site key set, App Check is NOT initialized at all (no silent
// fallback). Identity Toolkit enforcement starts in monitor mode in the
// Firebase Console; see docs/DEPLOYMENT.md Phase H for the rollout plan.
//
// Dev: set `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in DevTools BEFORE
// the page initializes Firebase, then copy the debug token printed in the
// console into Firebase Console → App Check → Debug tokens. Validated
// against /firebase/firebase-js-sdk via Context7 (2026-05-17).
const appCheckSiteKey = import.meta.env.VITE_APPCHECK_SITE_KEY
if (appCheckSiteKey && typeof window !== 'undefined') {
  if (import.meta.env.DEV) {
    ;(
      self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }
    ).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  // Dynamic import keeps the App Check chunk out of the initial bundle
  // when the env var is unset (most dev environments today).
  void import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  })
}

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
