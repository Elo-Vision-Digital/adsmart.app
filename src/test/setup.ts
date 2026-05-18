import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Vitest runs `@firebase/auth` in its node-esm bundle, where
// `browserPopupRedirectResolver` is a sentinel error (not a class). That
// crashes `initializeAuth({ popupRedirectResolver })` in
// `src/firebase/config.ts` at module-evaluation time, breaking any test
// that transitively imports `@/firebase/config` (e.g. via AuthContext).
//
// We stub the module globally: tests that need real Firebase behavior
// should override this with `vi.mock` in the test file itself.
vi.mock('@/firebase/config', () => ({
  auth: {},
  db: {},
  functions: {},
  default: {},
}))

afterEach(() => {
  cleanup()
})
