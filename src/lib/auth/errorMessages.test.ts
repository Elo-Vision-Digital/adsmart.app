import { FirebaseError } from 'firebase/app'
import { describe, expect, it } from 'vitest'
import { AUTH_ERROR_KEY_MAP, authErrorToTKey } from './errorMessages'
import { isAuthError } from './errors'

function fbError(code: string): FirebaseError {
  return new FirebaseError(code, 'irrelevant')
}

describe('authErrorToTKey', () => {
  it('maps known auth codes to their i18n keys', () => {
    expect(authErrorToTKey(fbError('auth/invalid-credential'))).toBe(
      'loginPage.error.invalidCredentials'
    )
    expect(authErrorToTKey(fbError('auth/email-already-in-use'))).toBe('loginPage.error.emailInUse')
    expect(authErrorToTKey(fbError('auth/popup-blocked'))).toBe('loginPage.error.popupBlocked')
  })

  it('collapses user-not-found and wrong-password and invalid-credential into one generic message (privacy)', () => {
    const target = 'loginPage.error.invalidCredentials'
    expect(authErrorToTKey(fbError('auth/invalid-credential'))).toBe(target)
    expect(authErrorToTKey(fbError('auth/wrong-password'))).toBe(target)
    expect(authErrorToTKey(fbError('auth/user-not-found'))).toBe(target)
  })

  it('falls back to common.error.generic for unknown codes', () => {
    expect(authErrorToTKey(fbError('auth/unknown-thing'))).toBe('common.error.generic')
    expect(authErrorToTKey(new Error('not a FirebaseError'))).toBe('common.error.generic')
    expect(authErrorToTKey(null)).toBe('common.error.generic')
    expect(authErrorToTKey('string')).toBe('common.error.generic')
  })
})

describe('isAuthError', () => {
  it('returns true for FirebaseError whose code starts with auth/', () => {
    expect(isAuthError(fbError('auth/invalid-credential'))).toBe(true)
  })

  it('returns false for non-auth FirebaseError', () => {
    expect(isAuthError(fbError('firestore/unavailable'))).toBe(false)
  })

  it('returns false for plain Error / null / strings', () => {
    expect(isAuthError(new Error('boom'))).toBe(false)
    expect(isAuthError(null)).toBe(false)
    expect(isAuthError('boom')).toBe(false)
  })
})

describe('AUTH_ERROR_KEY_MAP', () => {
  it('contains all keys consumers depend on (smoke test)', () => {
    for (const key of [
      'auth/invalid-credential',
      'auth/email-already-in-use',
      'auth/weak-password',
      'auth/too-many-requests',
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/network-request-failed',
      'auth/account-exists-with-different-credential',
      'auth/credential-already-in-use',
      'auth/requires-recent-login',
    ]) {
      expect(AUTH_ERROR_KEY_MAP[key]).toBeDefined()
    }
  })
})
