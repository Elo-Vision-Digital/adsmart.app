import { isAuthError } from './errors'

// Single source of truth for mapping Firebase Auth error codes to i18n keys.
// Resolved with t() by the caller. Privacy note: auth/user-not-found and
// auth/wrong-password and auth/invalid-credential all map to the SAME
// generic key ('invalidCredentials') — this prevents user enumeration via
// differential error messages. See docs/ERROR-HANDLING.md.

export const AUTH_ERROR_KEY_MAP: Record<string, string> = {
  // Sign-in failures (collapsed for privacy)
  'auth/invalid-credential': 'loginPage.error.invalidCredentials',
  'auth/wrong-password': 'loginPage.error.invalidCredentials',
  'auth/user-not-found': 'loginPage.error.invalidCredentials',
  'auth/invalid-login-credentials': 'loginPage.error.invalidCredentials',

  // Sign-up failures
  'auth/email-already-in-use': 'loginPage.error.emailInUse',
  'auth/weak-password': 'common.validation.weakPassword',
  'auth/invalid-email': 'common.validation.invalidEmail',

  // Rate limiting / abuse signals
  'auth/too-many-requests': 'common.error.tooManyAttempts',

  // Popup OAuth failures
  'auth/popup-blocked': 'loginPage.error.popupBlocked',
  'auth/popup-closed-by-user': 'loginPage.error.popupClosed',
  'auth/cancelled-popup-request': 'loginPage.error.popupClosed',

  // Network
  'auth/network-request-failed': 'common.error.network',

  // Account linking conflicts
  'auth/account-exists-with-different-credential': 'loginPage.error.accountConflict',
  'auth/credential-already-in-use': 'loginPage.error.credentialInUse',

  // Re-auth required
  'auth/requires-recent-login': 'common.error.requiresReauth',

  // App Check rejection
  'auth/firebase-app-check-token-is-invalid': 'common.error.appCheckFailed',
}

export function authErrorToTKey(err: unknown): string {
  if (isAuthError(err) && err.code in AUTH_ERROR_KEY_MAP) {
    return AUTH_ERROR_KEY_MAP[err.code]
  }
  return 'common.error.generic'
}
