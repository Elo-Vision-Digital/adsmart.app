import { FirebaseError } from 'firebase/app'

export function isAuthError(err: unknown): err is FirebaseError {
  return err instanceof FirebaseError && err.code.startsWith('auth/')
}

export function isFirebaseError(err: unknown): err is FirebaseError {
  return err instanceof FirebaseError
}
