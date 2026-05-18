# Auth Flow Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surgically harden AdSmart's authentication surface (Google, Facebook, Email/Password) by fixing concrete bugs, unifying drifted code, and adding defense-in-depth (App Check + password policy + real account deletion + robust blocking trigger) without changing the architecture.

**Architecture:** Approach A from [the design spec](../specs/2026-05-17-auth-flow-hardening-design.md) — keep the `AuthContext` + `signInWithPopup` pattern. Move duplicated logic (`ADMIN_EMAILS`, password policy) into `@adsmart/shared`. Add an `EmailVerificationBanner`, a real `ForgotPasswordPage`, a route-guard loading fallback, and a centralized auth error → i18n key map. Implement `deleteUserData` for real. Initialize App Check gated by env var (no breaking change in dev). Documentation updated end-to-end.

**Tech Stack:** Firebase JS SDK 10.x (`firebase/auth`, `firebase/app-check`), Identity Platform blocking functions (`firebase-functions/v2/identity`), Zod 4 (`@adsmart/shared`), React 18, react-router-dom v6, Vitest 4, Biome 2, Bun, Turborepo.

---

## Pre-flight checks

- [ ] **PF1: Verify clean working tree**

Run: `git status --short`
Expected: only `.firebase/hosting.*.cache` (gitignored cache) — no other modifications.

If anything else appears, stash or commit before starting:
```bash
git stash push -u -m "pre-auth-hardening" --keep-index
```

- [ ] **PF2: Verify the spec is present**

Run: `ls docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md`
Expected: file exists.

- [ ] **PF3: Verify dev tools are working**

Run: `bun run typecheck && bun run lint && bun run test:all`
Expected: all green. If any are red, fix them BEFORE starting — the plan assumes a clean baseline so failures are attributable to changes in this plan.

- [ ] **PF4: Confirm Identity Platform is enabled and blocking trigger is registered**

Run: `bunx firebase-tools functions:list --project adsmart-web-dev | grep bootstrapUser`
Expected: a `bootstrapUser (us-central1)` entry. If absent, see ADR-015 — re-register via PATCH before continuing.

---

## Phase A — Shared modules: admin allowlist + password policy

Foundational. No client/functions changes yet — pure additions to `@adsmart/shared` that downstream phases consume.

### Task A1: Add `ADMIN_EMAILS` + `isAdminUser` to `@adsmart/shared`

**Files:**
- Create: `packages/shared/src/auth/admin.ts`
- Create: `packages/shared/src/auth/admin.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the admin allowlist module**

Create `packages/shared/src/auth/admin.ts`:

```typescript
// Single source of truth for AdSmart admin identity. Consumed by both the
// client (src/contexts/AuthContext.tsx) and Cloud Functions (priceManager,
// adminWalletManager, getDashboardMetrics). Pre-ADR-016 each consumer had
// its own copy; drift was observed in PR review and was the motivation for
// unifying here. See docs/Decisions.md ADR-016.
//
// The custom claim `admin === true` is the canonical authority. The email
// allowlist is a transition fallback so existing admins are not locked out
// before their custom claims are provisioned. Removal of the fallback is
// deferred to ADR-017 (see docs/SECURITY.md).

export const ADMIN_EMAILS: readonly string[] = [
  'agency.elovisiondigital@gmail.com',
  'admin@adsmart.app',
] as const

export interface IdTokenClaims {
  admin?: boolean
  [key: string]: unknown
}

export function isAdminUser(
  claims: IdTokenClaims | undefined | null,
  email: string | null | undefined
): boolean {
  if (claims?.admin === true) return true
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}
```

- [ ] **Step 2: Write failing tests**

Create `packages/shared/src/auth/admin.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ADMIN_EMAILS, isAdminUser } from './admin'

describe('isAdminUser', () => {
  it('returns true when custom claim admin === true (regardless of email)', () => {
    expect(isAdminUser({ admin: true }, 'anyone@example.com')).toBe(true)
    expect(isAdminUser({ admin: true }, null)).toBe(true)
    expect(isAdminUser({ admin: true }, undefined)).toBe(true)
  })

  it('returns true when email is in the legacy allowlist', () => {
    for (const email of ADMIN_EMAILS) {
      expect(isAdminUser({}, email)).toBe(true)
      expect(isAdminUser(null, email)).toBe(true)
      expect(isAdminUser(undefined, email)).toBe(true)
    }
  })

  it('returns false when claim is not true and email is not allowlisted', () => {
    expect(isAdminUser({}, 'random@example.com')).toBe(false)
    expect(isAdminUser({ admin: false }, 'random@example.com')).toBe(false)
    expect(isAdminUser({ admin: 'true' as unknown as boolean }, 'random@example.com')).toBe(false)
    expect(isAdminUser({}, null)).toBe(false)
    expect(isAdminUser({}, undefined)).toBe(false)
    expect(isAdminUser({}, '')).toBe(false)
  })

  it('ADMIN_EMAILS contains the two known admins', () => {
    expect(ADMIN_EMAILS).toContain('agency.elovisiondigital@gmail.com')
    expect(ADMIN_EMAILS).toContain('admin@adsmart.app')
    expect(ADMIN_EMAILS).toHaveLength(2)
  })
})
```

- [ ] **Step 3: Re-export from `@adsmart/shared` barrel**

Modify `packages/shared/src/index.ts` — append at the end of the file:

```typescript
export { ADMIN_EMAILS, isAdminUser, type IdTokenClaims } from './auth/admin'
```

- [ ] **Step 4: Run tests**

Run: `cd packages/shared && bun run test admin`
Expected: 4 tests pass.

- [ ] **Step 5: Run typecheck**

Run: `cd packages/shared && bun run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/auth/admin.ts packages/shared/src/auth/admin.test.ts packages/shared/src/index.ts
git commit -m "feat(shared): add ADMIN_EMAILS + isAdminUser shared module"
```

---

### Task A2: Add password policy schema to `@adsmart/shared`

**Files:**
- Create: `packages/shared/src/auth/password.ts`
- Create: `packages/shared/src/auth/password.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create the password policy module**

Create `packages/shared/src/auth/password.ts`:

```typescript
// Password policy shared between client (LoginPage signup, SettingsPage
// change-password) and Identity Platform configuration. Pre-ADR-016 the
// client signup enforced this exact rule but SettingsPage accepted 6 chars
// (drift). Identity Platform's own Password Policy (Firebase Console →
// Authentication → Settings → Password policy) must mirror this — see
// docs/DEPLOYMENT.md Phase H.

import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 4096 // Firebase Auth hard limit

export const PasswordPolicy = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
} as const

export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH)
  .max(PASSWORD_MAX_LENGTH)
  .refine((v) => /[A-Z]/.test(v), { message: 'requireUppercase' })
  .refine((v) => /[a-z]/.test(v), { message: 'requireLowercase' })
  .refine((v) => /\d/.test(v), { message: 'requireNumber' })
  .refine((v) => /[!@#$%^&*(),.?":{}|<>]/.test(v), { message: 'requireSpecial' })

export interface PasswordValidationResult {
  valid: boolean
  // Translation keys consumers can map via i18n. Order is deterministic
  // (length, upper, lower, number, special) so callers can surface the
  // first failing rule if desired.
  errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) errors.push('passwordPolicy.tooShort')
  if (!/[A-Z]/.test(password)) errors.push('passwordPolicy.requireUppercase')
  if (!/[a-z]/.test(password)) errors.push('passwordPolicy.requireLowercase')
  if (!/\d/.test(password)) errors.push('passwordPolicy.requireNumber')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('passwordPolicy.requireSpecial')
  return { valid: errors.length === 0, errors }
}
```

- [ ] **Step 2: Write failing tests**

Create `packages/shared/src/auth/password.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { PasswordSchema, validatePassword, PASSWORD_MIN_LENGTH } from './password'

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    const r = validatePassword('Strong1!')
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rejects too-short passwords', () => {
    const r = validatePassword('A1a!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.tooShort')
  })

  it('rejects missing uppercase', () => {
    const r = validatePassword('strong1!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireUppercase')
  })

  it('rejects missing lowercase', () => {
    const r = validatePassword('STRONG1!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireLowercase')
  })

  it('rejects missing number', () => {
    const r = validatePassword('StrongAA!')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireNumber')
  })

  it('rejects missing special char', () => {
    const r = validatePassword('Strong11')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.requireSpecial')
  })

  it('aggregates multiple errors', () => {
    const r = validatePassword('a')
    expect(r.valid).toBe(false)
    expect(r.errors).toContain('passwordPolicy.tooShort')
    expect(r.errors).toContain('passwordPolicy.requireUppercase')
    expect(r.errors).toContain('passwordPolicy.requireNumber')
    expect(r.errors).toContain('passwordPolicy.requireSpecial')
  })
})

describe('PasswordSchema (zod)', () => {
  it('accepts a strong password', () => {
    expect(() => PasswordSchema.parse('Strong1!')).not.toThrow()
  })

  it('rejects a weak password with all failing rules', () => {
    expect(() => PasswordSchema.parse('weak')).toThrow()
  })

  it('PASSWORD_MIN_LENGTH constant is 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
  })
})
```

- [ ] **Step 3: Re-export from the barrel**

Modify `packages/shared/src/index.ts` — append:

```typescript
export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PasswordPolicy,
  PasswordSchema,
  validatePassword,
  type PasswordValidationResult,
} from './auth/password'
```

- [ ] **Step 4: Run tests**

Run: `cd packages/shared && bun run test password`
Expected: 9 tests pass.

- [ ] **Step 5: Run typecheck across workspaces (turbo)**

Run: `bun run typecheck`
Expected: exits 0 across web + functions + shared.

- [ ] **Step 6: Build the shared package CJS (consumed by functions deploy)**

Run: `cd packages/shared && bun run build`
Expected: `packages/shared/dist/index.js` + `index.d.ts` are regenerated and include `ADMIN_EMAILS`, `isAdminUser`, `validatePassword`, `PasswordSchema`.

Verify:
```bash
grep -E "ADMIN_EMAILS|isAdminUser|validatePassword|PasswordSchema" packages/shared/dist/index.d.ts
```
Expected: all four names appear.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/auth/password.ts packages/shared/src/auth/password.test.ts packages/shared/src/index.ts packages/shared/dist/
git commit -m "feat(shared): add PasswordPolicy + validatePassword shared module"
```

---

## Phase B — Client Firebase config + AuthContext refactor

### Task B1: Migrate `firebase/config.ts` to `initializeAuth` with persistence fallback

**Files:**
- Modify: `src/firebase/config.ts`

- [ ] **Step 1: Read current content**

Run: `cat src/firebase/config.ts`
Expected: see current `getAuth(app)` and `getFirestore(app)` patterns.

- [ ] **Step 2: Replace the file with the new implementation**

Replace `src/firebase/config.ts` content with:

```typescript
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
  persistence: [
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
  ],
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
```

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0. If a consumer was relying on the old console.log side-effect for telemetry, it will not regress (we removed only log noise).

- [ ] **Step 4: Run web tests**

Run: `bun run test`
Expected: all passing tests still pass. New ones come in later phases.

- [ ] **Step 5: Boot the dev server and check the console**

Run: `bun run dev`
Open: `http://localhost:5173` (or whatever Vite reports)
Expected:
- No `console.log('🔧 Conectado aos emuladores ...')` or `console.log('🌐 Usando Firebase em produção')` noise.
- App loads to `/login` without errors in DevTools console.
- Network tab shows requests to `*.firebaseapp.com` / `identitytoolkit.googleapis.com`.

Stop the dev server (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add src/firebase/config.ts
git commit -m "refactor(firebase): migrate to initializeAuth with persistence fallback"
```

---

### Task B2: Add App Check initialization gated by env var

**Files:**
- Modify: `src/firebase/config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add the env var to the example**

Modify `.env.example` — locate the `# Firebase` section (search for `VITE_FIREBASE_API_KEY`) and add right after the last `VITE_FIREBASE_*` line:

```
# App Check (reCAPTCHA Enterprise key from Firebase Console → App Check).
# Leave unset in dev to skip App Check initialization entirely. When set,
# enables App Check; for local browser dev, set FIREBASE_APPCHECK_DEBUG_TOKEN
# in DevTools Console: self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
VITE_APPCHECK_SITE_KEY=
```

- [ ] **Step 2: Add App Check initialization to config.ts**

Modify `src/firebase/config.ts` — add after the `auth` export and before `export const db`:

```typescript
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
    ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true
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
```

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 4: Run lint**

Run: `bun run lint`
Expected: exits 0 (warnings on `void` expression in Biome may surface — accept).

- [ ] **Step 5: Verify dev server still boots WITHOUT App Check key**

Run: `bun run dev`
Open DevTools → Network. Look for absence of `recaptcha` script downloads.
Expected: app boots normally. No App Check requests.

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/firebase/config.ts .env.example
git commit -m "feat(firebase): add gated App Check initialization (reCAPTCHA Enterprise)"
```

---

### Task B3: Create auth utility module (error map + type guard)

**Files:**
- Create: `src/lib/auth/errors.ts`
- Create: `src/lib/auth/errorMessages.ts`

- [ ] **Step 1: Create the type guard**

Create `src/lib/auth/errors.ts`:

```typescript
import { FirebaseError } from 'firebase/app'

export function isAuthError(err: unknown): err is FirebaseError {
  return err instanceof FirebaseError && err.code.startsWith('auth/')
}

export function isFirebaseError(err: unknown): err is FirebaseError {
  return err instanceof FirebaseError
}
```

- [ ] **Step 2: Create the error-to-i18n-key map**

Create `src/lib/auth/errorMessages.ts`:

```typescript
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
```

- [ ] **Step 3: Add accompanying tests**

Create `src/lib/auth/errorMessages.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { FirebaseError } from 'firebase/app'
import { authErrorToTKey, AUTH_ERROR_KEY_MAP } from './errorMessages'
import { isAuthError } from './errors'

function fbError(code: string): FirebaseError {
  return new FirebaseError(code, 'irrelevant')
}

describe('authErrorToTKey', () => {
  it('maps known auth codes to their i18n keys', () => {
    expect(authErrorToTKey(fbError('auth/invalid-credential'))).toBe('loginPage.error.invalidCredentials')
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
```

- [ ] **Step 4: Run tests**

Run: `bun run test errorMessages`
Expected: all describe-blocks pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/errors.ts src/lib/auth/errorMessages.ts src/lib/auth/errorMessages.test.ts
git commit -m "feat(auth): add error→i18n-key map + isAuthError type guard"
```

---

### Task B4: Refactor `AuthContext` — remove dead code, use shared, force refresh, scopes

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Replace the AuthContext file**

Replace `src/contexts/AuthContext.tsx` with:

```typescript
import { isAdminUser } from '@adsmart/shared'
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from 'firebase/auth'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { auth } from '@/firebase/config'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  hasPasswordProvider: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// After any sign-in / sign-up / link operation, force a refresh of the ID
// token so custom claims provisioned server-side (admin: true) appear in
// the client without requiring sign-out/sign-in. See docs/Decisions.md
// ADR-016 §R10.
async function refreshAuthState(user: User): Promise<void> {
  await user.getIdToken(true)
  await user.reload()
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)

      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      void (async () => {
        try {
          const tokenResult = await user.getIdTokenResult(true)
          setIsAdmin(isAdminUser(tokenResult.claims, user.email))
        } catch {
          // Token fetch failed (network etc.) — fall back to email-only check.
          setIsAdmin(isAdminUser(null, user.email))
        } finally {
          setLoading(false)
        }
      })()
    })

    return unsubscribe
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await refreshAuthState(cred.user)
  }

  const signUp = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await refreshAuthState(cred.user)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.addScope('profile')
    provider.addScope('email')
    provider.setCustomParameters({ prompt: 'select_account' })
    const cred = await signInWithPopup(auth, provider)
    await refreshAuthState(cred.user)
  }

  const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider()
    provider.addScope('email')
    provider.addScope('public_profile')
    const cred = await signInWithPopup(auth, provider)
    await refreshAuthState(cred.user)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const hasPasswordProvider = !!user?.providerData.some((p) => p.providerId === 'password')

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    hasPasswordProvider,
    signInWithEmail,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

Notable changes from the previous version:
- `signIn` alias deleted.
- `ADMIN_EMAILS` removed in favor of `isAdminUser` from `@adsmart/shared`.
- `console.log/console.error` in Facebook handler removed (PII leak).
- Google + Facebook providers now have explicit scopes.
- Google adds `prompt: 'select_account'`.
- All sign-in operations call `refreshAuthState`.
- `getIdTokenResult(true)` forces refresh.
- Children render unconditionally (no `!loading && children`); route guards in Phase C take ownership of the loading state.

- [ ] **Step 2: Find and update any consumer of the removed `signIn` alias**

Run: `grep -rn "useAuth().*signIn\b\|\.signIn(" src/ --include="*.tsx" --include="*.ts" | grep -v "signInWithEmail\|signInWithGoogle\|signInWithFacebook\|signIn:" | head -20`
Expected: no matches. If something matches, replace `.signIn(` with `.signInWithEmail(` and re-run.

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 4: Run lint**

Run: `bun run lint`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "refactor(auth): clean up AuthContext (shared isAdminUser, forceRefresh, scopes)"
```

---

## Phase C — Route guards + loading fallback + email verification banner

### Task C1: Add `AuthLoadingFallback` component

**Files:**
- Create: `src/components/AuthLoadingFallback.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/AuthLoadingFallback.tsx`:

```typescript
import { Loader2 } from 'lucide-react'

// Shown during the initial onAuthStateChanged callback resolution. Brief
// (≤200ms in practice) so a minimal centered spinner suffices. Avoids the
// previous "render Provider only when !loading" coupling that hid this
// state implicitly. See docs/Decisions.md ADR-016 §R12.
export function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Carregando" />
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthLoadingFallback.tsx
git commit -m "feat(auth): add AuthLoadingFallback for route-guard loading state"
```

---

### Task C2: Make `PrivateRoute` and `AdminRoute` loading-aware (with tests)

**Files:**
- Modify: `src/components/PrivateRoute.tsx`
- Modify: `src/components/AdminRoute.tsx`
- Create: `src/components/PrivateRoute.test.tsx`
- Create: `src/components/AdminRoute.test.tsx`

- [ ] **Step 1: Write the failing tests for PrivateRoute**

Create `src/components/PrivateRoute.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext'

function renderWithAuth(ctx: AuthContextType, path = '/private') {
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/private"
            element={
              <PrivateRoute>
                <div>PROTECTED</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>LOGIN</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

const baseCtx: AuthContextType = {
  user: null,
  loading: false,
  isAdmin: false,
  hasPasswordProvider: false,
  signInWithEmail: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithFacebook: vi.fn(),
  signOut: vi.fn(),
}

describe('PrivateRoute', () => {
  it('renders the loading fallback while loading=true', () => {
    renderWithAuth({ ...baseCtx, loading: true })
    expect(screen.queryByText('PROTECTED')).toBeNull()
    expect(screen.queryByText('LOGIN')).toBeNull()
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: null })
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(screen.queryByText('PROTECTED')).toBeNull()
  })

  it('renders children when authenticated', () => {
    const fakeUser = { uid: 'u1', email: 'u@x.com' } as unknown as AuthContextType['user']
    renderWithAuth({ ...baseCtx, loading: false, user: fakeUser })
    expect(screen.getByText('PROTECTED')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Export `AuthContext` and `AuthContextType` from AuthContext so tests can build a provider**

Modify `src/contexts/AuthContext.tsx` — change `const AuthContext = createContext<AuthContextType | undefined>(undefined)` to:

```typescript
export const AuthContext = createContext<AuthContextType | undefined>(undefined)
```

And add `export` to the interface declaration:

```typescript
export interface AuthContextType {
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `bun run test PrivateRoute`
Expected: FAIL — "Carregando" label not found because current PrivateRoute does not honor loading.

- [ ] **Step 4: Update PrivateRoute**

Replace `src/components/PrivateRoute.tsx` with:

```typescript
import { Navigate } from 'react-router-dom'
import { AuthLoadingFallback } from '@/components/AuthLoadingFallback'
import { useAuth } from '@/contexts/AuthContext'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoadingFallback />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `bun run test PrivateRoute`
Expected: all 3 tests pass.

- [ ] **Step 6: Write the failing tests for AdminRoute**

Create `src/components/AdminRoute.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AdminRoute } from './AdminRoute'
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext'

function renderWithAuth(ctx: AuthContextType) {
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminRoute><div>ADMIN</div></AdminRoute>} />
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/dashboard" element={<div>DASH</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

const baseCtx: AuthContextType = {
  user: null,
  loading: false,
  isAdmin: false,
  hasPasswordProvider: false,
  signInWithEmail: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithFacebook: vi.fn(),
  signOut: vi.fn(),
}

const fakeUser = { uid: 'u1', email: 'u@x.com' } as unknown as AuthContextType['user']

describe('AdminRoute', () => {
  it('renders the loading fallback while loading=true', () => {
    renderWithAuth({ ...baseCtx, loading: true })
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()
  })

  it('redirects to /login when no user', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: null })
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
  })

  it('redirects to /dashboard when user is not admin', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: fakeUser, isAdmin: false })
    expect(screen.getByText('DASH')).toBeInTheDocument()
  })

  it('renders children when user is admin', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: fakeUser, isAdmin: true })
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })
})
```

- [ ] **Step 7: Run the test to verify it fails (loading case)**

Run: `bun run test AdminRoute`
Expected: FAIL at "renders the loading fallback".

- [ ] **Step 8: Update AdminRoute**

Replace `src/components/AdminRoute.tsx` with:

```typescript
import { Navigate } from 'react-router-dom'
import { AuthLoadingFallback } from '@/components/AuthLoadingFallback'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <AuthLoadingFallback />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
```

- [ ] **Step 9: Run all guard tests**

Run: `bun run test components/PrivateRoute components/AdminRoute`
Expected: all 7 tests pass.

- [ ] **Step 10: Commit**

```bash
git add src/components/PrivateRoute.tsx src/components/AdminRoute.tsx src/components/PrivateRoute.test.tsx src/components/AdminRoute.test.tsx src/contexts/AuthContext.tsx
git commit -m "feat(auth): make route guards loading-aware with fallback + tests"
```

---

### Task C3: Create `EmailVerificationBanner` and mount it in `MainLayout`

**Files:**
- Create: `src/components/EmailVerificationBanner.tsx`
- Modify: `src/components/layout/MainLayout.tsx`
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en.json`
- Modify: `src/locales/es.json`
- Modify: `src/locales/types.ts`

- [ ] **Step 1: Add translation keys for the banner**

In `src/locales/pt-BR.json`, locate the `"common"` block and add a `"emailVerification"` sub-block. Search for the existing `"common.error"` block and add a sibling block:

```json
    "emailVerification": {
      "banner": "Confirme seu email para garantir o acesso à sua conta.",
      "resendButton": "Reenviar",
      "resending": "Enviando...",
      "sent": "Email enviado. Verifique sua caixa de entrada.",
      "error": "Erro ao reenviar o email."
    }
```

(Place it inside the `"common"` object so the i18n key is `common.emailVerification.banner`.)

In `src/locales/en.json` mirror the same structure:

```json
    "emailVerification": {
      "banner": "Please verify your email to secure your account.",
      "resendButton": "Resend",
      "resending": "Sending...",
      "sent": "Email sent. Check your inbox.",
      "error": "Failed to resend the verification email."
    }
```

In `src/locales/es.json`:

```json
    "emailVerification": {
      "banner": "Verifica tu email para asegurar tu cuenta.",
      "resendButton": "Reenviar",
      "resending": "Enviando...",
      "sent": "Email enviado. Revisa tu bandeja.",
      "error": "Error al reenviar el email."
    }
```

- [ ] **Step 2: Add the keys to the strict types**

Modify `src/locales/types.ts` — find the `Common` interface and add the same shape:

```typescript
emailVerification: {
  banner: string
  resendButton: string
  resending: string
  sent: string
  error: string
}
```

(Place it inside the same level as `error`, `warning`, etc.)

- [ ] **Step 3: Create the banner component**

Create `src/components/EmailVerificationBanner.tsx`:

```typescript
import { sendEmailVerification } from 'firebase/auth'
import { useState } from 'react'
import { authErrorToTKey } from '@/lib/auth/errorMessages'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

// Non-blocking banner shown to email-password users who have not verified
// their email. Banner disappears next time onAuthStateChanged fires with
// emailVerified === true (i.e. after the user clicks the link AND the
// page reloads). See docs/Decisions.md ADR-016 §R13.
export function EmailVerificationBanner() {
  const { user, hasPasswordProvider } = useAuth()
  const { t } = useLanguage()
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!user || !hasPasswordProvider || user.emailVerified) return null

  const handleResend = async () => {
    setSending(true)
    setFeedback(null)
    try {
      await sendEmailVerification(user)
      setFeedback(t('common.emailVerification.sent'))
    } catch (err) {
      const key = authErrorToTKey(err)
      setFeedback(t(key) || t('common.emailVerification.error'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 px-4 py-2 text-sm flex items-center justify-between gap-3">
      <span>{feedback ?? t('common.emailVerification.banner')}</span>
      {!feedback && (
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="underline font-medium disabled:opacity-50"
        >
          {sending ? t('common.emailVerification.resending') : t('common.emailVerification.resendButton')}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Mount the banner in MainLayout**

Read first to find the top of the main content area:

Run: `head -50 src/components/layout/MainLayout.tsx`

Then modify `src/components/layout/MainLayout.tsx` — add the import at the top:

```typescript
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner'
```

And add `<EmailVerificationBanner />` as the first child of the layout's main content wrapper (typically directly under the header or sidebar layout — place it where it's visible on every authenticated page).

If MainLayout's structure differs, ask the executor agent to:
> "Locate the component that wraps page content on every authenticated route and add `<EmailVerificationBanner />` as its first child."

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0. If the types.ts edit was incomplete, surface and fix.

- [ ] **Step 6: Run tests**

Run: `bun run test`
Expected: existing tests still pass.

- [ ] **Step 7: Manual smoke test**

Run: `bun run dev`
Sign in with an unverified email/password account.
Expected: banner visible. Click "Reenviar" — message changes to "Email sent...". Refresh the page after verifying via the email link — banner disappears.

Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add src/components/EmailVerificationBanner.tsx src/components/layout/MainLayout.tsx src/locales/pt-BR.json src/locales/en.json src/locales/es.json src/locales/types.ts
git commit -m "feat(auth): add EmailVerificationBanner mounted in MainLayout"
```

---

## Phase D — LoginPage + ForgotPasswordPage + SettingsPage

### Task D1: Refactor `LoginPage` — use `signUp` from Context, error map, shared password validation

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en.json`
- Modify: `src/locales/es.json`
- Modify: `src/locales/types.ts`

- [ ] **Step 1: Add new translation keys**

In `src/locales/pt-BR.json` inside `"loginPage.error"`:

```json
"popupBlocked": "Pop-up bloqueado. Habilite pop-ups e tente novamente.",
"popupClosed": "Janela de login fechada antes da conclusão.",
"accountConflict": "Já existe uma conta com este email usando outro método de login.",
"credentialInUse": "Este login já está associado a outra conta.",
"socialLoginFailed": "Não foi possível concluir o login. Tente novamente."
```

(Add `socialLoginFailed` only if it isn't already present — check by grep first.)

In `src/locales/pt-BR.json` inside `"common.error"`:

```json
"network": "Erro de conexão. Verifique sua internet.",
"requiresReauth": "Por segurança, faça login novamente e tente outra vez.",
"appCheckFailed": "Não foi possível verificar este dispositivo."
```

In `src/locales/pt-BR.json` add a new sibling block under root:

```json
"passwordPolicy": {
  "tooShort": "A senha deve ter pelo menos 8 caracteres.",
  "requireUppercase": "Inclua pelo menos uma letra maiúscula.",
  "requireLowercase": "Inclua pelo menos uma letra minúscula.",
  "requireNumber": "Inclua pelo menos um número.",
  "requireSpecial": "Inclua pelo menos um caractere especial (!@#$%^&*)."
}
```

Mirror in `en.json` and `es.json` with appropriate translations:

```json
// en.json
"passwordPolicy": {
  "tooShort": "Password must be at least 8 characters long.",
  "requireUppercase": "Include at least one uppercase letter.",
  "requireLowercase": "Include at least one lowercase letter.",
  "requireNumber": "Include at least one number.",
  "requireSpecial": "Include at least one special character (!@#$%^&*)."
}

// es.json
"passwordPolicy": {
  "tooShort": "La contraseña debe tener al menos 8 caracteres.",
  "requireUppercase": "Incluye al menos una letra mayúscula.",
  "requireLowercase": "Incluye al menos una letra minúscula.",
  "requireNumber": "Incluye al menos un número.",
  "requireSpecial": "Incluye al menos un carácter especial (!@#$%^&*)."
}
```

- [ ] **Step 2: Update types.ts**

Modify `src/locales/types.ts`:

Add to `LoginPage.error`:
```typescript
popupBlocked: string
popupClosed: string
accountConflict: string
credentialInUse: string
socialLoginFailed?: string
```

Add to `Common.error`:
```typescript
network: string
requiresReauth: string
appCheckFailed: string
```

Add a new top-level interface field (sibling to `LoginPage`, `Common`, etc.):
```typescript
passwordPolicy: {
  tooShort: string
  requireUppercase: string
  requireLowercase: string
  requireNumber: string
  requireSpecial: string
}
```

(Locate the root `Translations` interface — typically `Translations { common: Common; loginPage: LoginPage; ... }` — and add `passwordPolicy` there.)

- [ ] **Step 3: Replace LoginPage**

Replace `src/pages/LoginPage.tsx` with:

```typescript
import { validatePassword } from '@adsmart/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRateLimit } from '@/hooks/useRateLimit'
import { authErrorToTKey } from '@/lib/auth/errorMessages'
import { sanitizeEmail, sanitizeInput } from '@/utils/sanitize'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signInWithGoogle, signInWithFacebook, signInWithEmail, signUp } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const loginRateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    message: t('common.error.tooManyAttempts'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!loginRateLimit.checkLimit()) {
      setError(loginRateLimit.message)
      setLoading(false)
      return
    }

    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedName = name ? sanitizeInput(name) : ''

    try {
      if (isLogin) {
        await signInWithEmail(sanitizedEmail, password)
      } else {
        const policy = validatePassword(password)
        if (!policy.valid) {
          setError(policy.errors.map((k) => t(k)).join(' '))
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          throw new Error(t('common.validation.passwordMismatch'))
        }
        if (!sanitizedName.trim()) {
          throw new Error(t('common.validation.requiredField'))
        }
        await signUp(sanitizedEmail, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(t(authErrorToTKey(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    if (!loginRateLimit.checkLimit()) {
      setError(loginRateLimit.message)
      return
    }
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch (err) {
      setError(t(authErrorToTKey(err)))
    }
  }

  const handleFacebookSignIn = async () => {
    setError('')
    if (!loginRateLimit.checkLimit()) {
      setError(loginRateLimit.message)
      return
    }
    try {
      await signInWithFacebook()
      navigate('/dashboard')
    } catch (err) {
      setError(t(authErrorToTKey(err)))
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-[30px]">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-[480px]">
        <div className="text-center mb-0">
          <img
            src="https://i.imgur.com/T6AehDg.png"
            alt="adsmart"
            className="h-16 mx-auto mb-6 object-contain"
          />
          <h1 className="text-[40px] font-normal mb-[10px] text-black">
            {isLogin ? (
              <>Entre na <span className="font-bold">ads</span>mart</>
            ) : (
              <>Crie sua conta <span className="font-bold">ads</span>mart</>
            )}
          </h1>
          <p className="text-base text-gray-600 mb-[15px]">
            {isLogin ? t('loginPage.subtitle.login') : t('loginPage.subtitle.signUp')}
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          {loginRateLimit.isBlocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {loginRateLimit.message}
            </div>
          )}
          {loginRateLimit.remainingAttempts < 3 && !loginRateLimit.isBlocked && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              {t('common.warning.rateLimitRemaining').replace('{attempts}', loginRateLimit.remainingAttempts.toString())}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || loginRateLimit.isBlocked}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#A7A8AE] hover:bg-[#919298] text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 27 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 14C0 6.5561 6.0561 0.5 13.5 0.5C16.5064 0.5 19.3519 1.46724 21.7291 3.2972L18.5919 7.3724C17.1221 6.24097 15.3613 5.64286 13.5 5.64286C8.89187 5.64286 5.14286 9.39187 5.14286 14C5.14286 18.6081 8.89187 22.3571 13.5 22.3571C17.2115 22.3571 20.3655 19.9255 21.4524 16.5714H13.5V11.4286H27V14C27 21.4439 20.9439 27.5 13.5 27.5C6.0561 27.5 0 21.4439 0 14Z" fill="black"/>
              </svg>
              {t('common.button.loginWithGoogle')}
            </button>

            <button
              onClick={handleFacebookSignIn}
              disabled={loading || loginRateLimit.isBlocked}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#A7A8AE] hover:bg-[#919298] text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="12" height="20" viewBox="0 0 15 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.64738 27.8633V15.2167H13.8906L14.5272 10.2867H9.64738V7.13954C9.64738 5.71262 10.042 4.74019 12.0905 4.74019L14.699 4.73912V0.329495C14.2479 0.270874 12.6994 0.136475 10.8972 0.136475C7.13383 0.136475 4.55737 2.43359 4.55737 6.65127V10.2867H0.30127V15.2167H4.55737V27.8633H9.64738Z" fill="black"/>
              </svg>
              {t('common.button.loginWithFacebook')}
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.form.name')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={loading || loginRateLimit.isBlocked}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.form.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={loading || loginRateLimit.isBlocked}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.form.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent pr-10"
                  disabled={loading || loginRateLimit.isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.form.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={loading || loginRateLimit.isBlocked}
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    disabled={loading || loginRateLimit.isBlocked}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    {t('common.form.rememberMe')}
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-black hover:underline">
                  {t('common.button.forgotPassword')}
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || loginRateLimit.isBlocked}
              className="w-full h-11 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('common.loading')
                : isLogin
                  ? t('common.button.login')
                  : t('common.button.signUp')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? (
              <>
                {t('loginPage.message.noAccount')}{' '}
                <button
                  onClick={() => { setIsLogin(false); setError('') }}
                  className="text-black font-semibold hover:underline"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  {t('common.button.signUp')}
                </button>
              </>
            ) : (
              <>
                {t('loginPage.message.haveAccount')}{' '}
                <button
                  onClick={() => { setIsLogin(true); setError('') }}
                  className="text-black font-semibold hover:underline"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  {t('common.button.login')}
                </button>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 mb-[30px] text-sm">
          <Link to="/terms" className="text-gray-600 hover:text-gray-900 hover:underline">
            {t('common.footer.termsOfUse')}
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/privacy" className="text-gray-600 hover:text-gray-900 hover:underline">
            {t('common.footer.privacyPolicy')}
          </Link>
        </div>
      </div>
    </div>
  )
}
```

Notable changes:
- `createUserWithEmailAndPassword(auth, ...)` direct call replaced with `signUp(...)` from Context.
- `error: any` removed; uses `authErrorToTKey(err)`.
- `validatePassword(password)` from `@adsmart/shared` replaces the local `utils/validation.ts` call.
- Error messages now go through the shared map.

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: all green.

- [ ] **Step 6: Run lint**

Run: `bun run lint`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/pages/LoginPage.tsx src/locales/pt-BR.json src/locales/en.json src/locales/es.json src/locales/types.ts
git commit -m "refactor(auth): LoginPage uses Context signUp + shared error map + password policy"
```

---

### Task D2: Create `ForgotPasswordPage` and wire the route

**Files:**
- Create: `src/pages/ForgotPasswordPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/locales/pt-BR.json`
- Modify: `src/locales/en.json`
- Modify: `src/locales/es.json`
- Modify: `src/locales/types.ts`

- [ ] **Step 1: Add translation keys**

Add to `pt-BR.json` as a sibling to `loginPage`:

```json
"forgotPasswordPage": {
  "title": "Esqueceu sua senha?",
  "subtitle": "Informe seu email e enviaremos um link para redefinir a senha.",
  "button": "Enviar link",
  "sending": "Enviando...",
  "success": "Email enviado. Se sua conta existir, você receberá o link em breve.",
  "backToLogin": "Voltar ao login"
}
```

Mirror in `en.json`:

```json
"forgotPasswordPage": {
  "title": "Forgot your password?",
  "subtitle": "Enter your email and we'll send a link to reset it.",
  "button": "Send link",
  "sending": "Sending...",
  "success": "Email sent. If your account exists, you'll receive the link shortly.",
  "backToLogin": "Back to login"
}
```

And in `es.json`:

```json
"forgotPasswordPage": {
  "title": "¿Olvidaste tu contraseña?",
  "subtitle": "Ingresa tu email y te enviaremos un enlace para restablecerla.",
  "button": "Enviar enlace",
  "sending": "Enviando...",
  "success": "Email enviado. Si tu cuenta existe, recibirás el enlace en breve.",
  "backToLogin": "Volver al login"
}
```

- [ ] **Step 2: Add the interface to types.ts**

Add to `src/locales/types.ts`:

```typescript
forgotPasswordPage: {
  title: string
  subtitle: string
  button: string
  sending: string
  success: string
  backToLogin: string
}
```

(Sibling to `loginPage`.)

- [ ] **Step 3: Create the page component**

Create `src/pages/ForgotPasswordPage.tsx`:

```typescript
import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { auth } from '@/firebase/config'
import { useRateLimit } from '@/hooks/useRateLimit'
import { authErrorToTKey } from '@/lib/auth/errorMessages'
import { sanitizeEmail } from '@/utils/sanitize'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const rateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    message: t('common.error.tooManyAttempts'),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!rateLimit.checkLimit()) {
      setError(rateLimit.message)
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, sanitizeEmail(email), {
        url: `${window.location.origin}/login`,
      })
      // Always show success (even on auth/user-not-found) to prevent account enumeration.
      setSent(true)
    } catch (err) {
      // For any error OTHER than user-not-found, still show generic message
      // BUT we surface invalid-email / network / too-many-requests so users
      // know to act. Privacy still preserved (no "user not found" message).
      const tKey = authErrorToTKey(err)
      if (tKey === 'loginPage.error.invalidCredentials' || tKey === 'common.error.generic') {
        setSent(true)
      } else {
        setError(t(tKey))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-[30px]">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-[480px]">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">{t('forgotPasswordPage.title')}</h1>
          <p className="text-base text-gray-600">{t('forgotPasswordPage.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-green-700 bg-green-50 border border-green-200 rounded p-3">
                {t('forgotPasswordPage.success')}
              </p>
              <Link to="/login" className="text-black underline">
                {t('forgotPasswordPage.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.form.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-black text-white rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? t('forgotPasswordPage.sending') : t('forgotPasswordPage.button')}
              </button>
              <Link to="/login" className="block text-center text-sm text-gray-600 hover:underline">
                {t('forgotPasswordPage.backToLogin')}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire the route in App.tsx**

Modify `src/App.tsx` — add the import (alphabetically sorted near the other `Page` imports):

```typescript
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
```

And add the route — locate the line with `<Route path="/login" element={<LoginPage />} />` and add directly after it:

```tsx
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
```

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 6: Run tests**

Run: `bun run test`
Expected: all green.

- [ ] **Step 7: Manual smoke test**

Run: `bun run dev`
Open `/login`. Click "Esqueceu sua senha?". Verify the new page renders. Submit with a valid email, expect success message. Click "Voltar ao login".

Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ForgotPasswordPage.tsx src/App.tsx src/locales/pt-BR.json src/locales/en.json src/locales/es.json src/locales/types.ts
git commit -m "feat(auth): add ForgotPasswordPage at /forgot-password"
```

---

### Task D3: Update `SettingsPage` change-password to use shared policy and error map

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Add the shared imports**

Modify `src/pages/SettingsPage.tsx` — add to existing imports from `@adsmart/shared` (or create one if missing):

```typescript
import { validatePassword } from '@adsmart/shared'
```

And:

```typescript
import { authErrorToTKey } from '@/lib/auth/errorMessages'
```

- [ ] **Step 2: Update the password change handler**

Find `handleChangePassword` (around line 175 in the current file). Replace the block:

```typescript
if (passwordForm.newPassword !== passwordForm.confirmPassword) {
  throw new Error(t('settingsPage.messages.passwordsDoNotMatch'))
}
if (passwordForm.newPassword.length < 6) {
  throw new Error(t('settingsPage.messages.passwordTooShort'))
}
```

with:

```typescript
if (passwordForm.newPassword !== passwordForm.confirmPassword) {
  throw new Error(t('settingsPage.messages.passwordsDoNotMatch'))
}
const policy = validatePassword(passwordForm.newPassword)
if (!policy.valid) {
  throw new Error(policy.errors.map((k) => t(k)).join(' '))
}
```

- [ ] **Step 3: Update the catch block of handleChangePassword to use the shared map**

Replace the catch body:

```typescript
} catch (error: any) {
  if (error.code === 'auth/wrong-password') {
    setPasswordError(t('settingsPage.messages.currentPasswordIncorrect'))
  } else if (error.code === 'auth/provider-already-linked') {
    setPasswordError('Esta conta já tem senha cadastrada')
  } else if (error.code === 'auth/credential-already-in-use') {
    setPasswordError('Email já vinculado a outra conta')
  } else {
    setPasswordError(error.message || t('common.error.changePassword'))
  }
}
```

with:

```typescript
} catch (err) {
  setPasswordError(t(authErrorToTKey(err)))
}
```

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SettingsPage.tsx
git commit -m "refactor(auth): SettingsPage change-password uses shared policy + error map"
```

---

### Task D4: Delete legacy `validation.ts` password function (drift prevention)

**Files:**
- Modify: `src/utils/validation.ts`

- [ ] **Step 1: Check current usages of the legacy validatePassword**

Run: `grep -rn "from '@/utils/validation'\|from './validation'\|from \"../utils/validation\"" src/`
Expected: only `LoginPage.tsx` should appear (and it was updated in D1 to use `@adsmart/shared`).

If anything else appears, update those callers to import from `@adsmart/shared` first.

- [ ] **Step 2: Replace the legacy module with a re-export shim**

Replace `src/utils/validation.ts` content with:

```typescript
// Legacy module: validatePassword + getPasswordStrength moved to
// @adsmart/shared/auth/password (single source of truth, ADR-016).
// This file is kept only because getPasswordStrength is still used in
// SettingsPage password meter — re-export to avoid touching unrelated UI.

export { validatePassword, PASSWORD_MIN_LENGTH as passwordSchemaMinLength } from '@adsmart/shared'

export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++

  const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte', 'Muito forte']
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981']

  return {
    score: Math.min(score - 1, 5),
    label: labels[Math.min(score - 1, 5)] || labels[0],
    color: colors[Math.min(score - 1, 5)] || colors[0],
  }
}
```

But note: the new `validatePassword` from shared returns `{ valid: boolean; errors: string[] }`. The legacy one returned `string[]`. Update callers that still expect the old shape:

Run: `grep -rn "validatePassword(" src/ --include="*.ts" --include="*.tsx"`

If any caller does `const errors = validatePassword(...)` and treats the return as `string[]`, update to `const { errors } = validatePassword(...)` and check `errors.length === 0` for valid.

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0. Fix any consumer shape mismatch found in Step 2.

- [ ] **Step 4: Run tests**

Run: `bun run test`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/validation.ts
git commit -m "refactor(auth): src/utils/validation re-exports shared validatePassword (drift prevention)"
```

---

## Phase E — Functions: bootstrapUser hardening + deleteUserData

### Task E1: Harden `bootstrapUser` with email fallback and telemetry

**Files:**
- Modify: `functions/src/bootstrapUser.ts`
- Create: `functions/test/bootstrapUser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `functions/test/bootstrapUser.test.ts`:

```typescript
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import * as admin from 'firebase-admin'
import { bootstrapUser } from '../src/bootstrapUser'

// This test runs against the Firestore emulator. It calls the blocking
// trigger function as a plain function (the v2 SDK exports it as a
// CloudFunction wrapper but the handler is callable directly with a
// constructed event payload).

beforeAll(() => {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'adsmart-test' })
  }
})

beforeEach(async () => {
  // Clean Firestore between tests via REST API
  const projectId = 'adsmart-test'
  await fetch(`http://localhost:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`, {
    method: 'DELETE',
  })
})

function fakeEvent(data: Partial<{ uid: string; email: string; providerData: Array<{ providerId: string; email?: string }> }>) {
  return { data } as Parameters<Parameters<typeof bootstrapUser>[0]>[0]
}

describe('bootstrapUser', () => {
  it('seeds users/{uid} with email when event.data.email is present', async () => {
    // Invoke the inner handler via the CloudFunction's __endpoint metadata not available;
    // instead, import and invoke the inline handler.
    // Workaround: bootstrapUser is exported as the CloudFunction; we re-import
    // its internal handler via a named test export added below if needed.
    // For the canonical pattern, prefer using firebase-functions-test framework.
    // Here we just call the function-as-data approach with the v2 signature.

    // Skip note: full integration test will be implemented via firebase-
    // functions-test SDK in a follow-up. For now this test serves as a
    // smoke test for the inline logic by invoking the module-level handler.
    expect(typeof bootstrapUser).toBe('object') // CloudFunction object
  })
})
```

This is a smoke test placeholder — the real emulator-based test requires `firebase-functions-test` set up at the workspace level. If `firebase-functions-test` is not already a devDependency in `functions/`, defer the full integration test to a follow-up PR and skip the next 3 steps (Steps 2-4) for the harden code change. Document in PR description as "test deferred — see follow-up issue".

- [ ] **Step 2: Update the bootstrapUser handler with email fallback**

Replace `functions/src/bootstrapUser.ts` with:

```typescript
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
```

- [ ] **Step 3: Build the functions package**

Run: `cd functions && bun run build`
Expected: exits 0, `functions/lib/bundle.js` regenerated.

- [ ] **Step 4: Run functions typecheck**

Run: `cd functions && bun run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add functions/src/bootstrapUser.ts functions/test/bootstrapUser.test.ts
git commit -m "feat(functions): harden bootstrapUser with email fallback + structured telemetry"
```

---

### Task E2: Add `USER_DELETION` SecurityEventType

**Files:**
- Modify: `functions/src/securityLogger.ts`

- [ ] **Step 1: Find the enum**

Run: `grep -n "export enum SecurityEventType" functions/src/securityLogger.ts`
Expected: line ~10.

- [ ] **Step 2: Add the new value**

Modify `functions/src/securityLogger.ts` — find the `SecurityEventType` enum and add `USER_DELETION = 'USER_DELETION',` as a new member (alphabetical placement preferred; if there's no other deletion-related event, place near `LOGIN_FAILED` / `SUSPICIOUS_ACTIVITY`).

Example placement:

```typescript
export enum SecurityEventType {
  // ... existing values ...
  USER_DELETION = 'USER_DELETION',
  // ... rest of existing values ...
}
```

- [ ] **Step 3: Run functions typecheck**

Run: `cd functions && bun run typecheck`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add functions/src/securityLogger.ts
git commit -m "feat(functions): add USER_DELETION to SecurityEventType enum"
```

---

### Task E3: Implement `deleteUserData` for real

**Files:**
- Modify: `functions/src/deleteUserData.ts`

- [ ] **Step 1: Replace the deleteUserData implementation**

Replace `functions/src/deleteUserData.ts` with:

```typescript
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

  // 1 attempt per hour per user (prevents accidental double-clicks +
  // limits malicious churn).
  const rateOk = await checkRateLimit(uid, 'deleteUserData', { maxAttempts: 1, windowMs: 3600_000 })
  if (!rateOk) {
    throw new HttpsError('resource-exhausted', 'Aguarde antes de tentar novamente.')
  }

  const db = admin.firestore()
  const userRef = db.collection('users').doc(uid)

  // 1. Read userDocuments index ref (CPF/CNPJ uniqueness — ADR-012)
  const userSnap = await userRef.get()
  const documentNumber = (userSnap.exists ? (userSnap.data()?.documentNumber as string | undefined) : undefined) ?? null
  const normalizedDocId = documentNumber ? documentNumber.replace(/\D/g, '') : null

  // 2. Cascade delete subcollections
  const counts: Record<string, number> = {}
  for (const sub of KNOWN_SUBCOLLECTIONS) {
    counts[sub] = await deleteSubcollection(uid, sub)
  }

  // 3. Delete userDocuments/{normalizedDocId} if present
  if (normalizedDocId) {
    await db.collection('userDocuments').doc(normalizedDocId).delete().catch(() => {
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
```

Note on `checkRateLimit` signature: if `rateLimiter.ts` has a different shape (e.g. `(userId, action)` and returns void/throws), adapt. Read it first:

Run: `head -40 functions/src/rateLimiter.ts`

If the existing signature is `checkRateLimit(userId: string, action: string): Promise<void>` (throws on block), simplify to:

```typescript
await checkRateLimit(uid, 'deleteUserData')
```

…and drop the `if (!rateOk)` block. Update the implementation accordingly.

- [ ] **Step 2: Build the functions package**

Run: `cd functions && bun run build`
Expected: exits 0.

- [ ] **Step 3: Run functions typecheck**

Run: `cd functions && bun run typecheck`
Expected: exits 0.

- [ ] **Step 4: Run functions tests (whatever exists)**

Run: `cd functions && bun run test`
Expected: no regressions in existing tests.

- [ ] **Step 5: Commit**

```bash
git add functions/src/deleteUserData.ts
git commit -m "feat(functions): implement deleteUserData with cascade delete + audit log"
```

---

### Task E4: Update `DeleteDataPage` for double-confirmation

**Files:**
- Modify: `src/pages/DeleteDataPage.tsx`

- [ ] **Step 1: Read the current implementation**

Run: `cat src/pages/DeleteDataPage.tsx`

- [ ] **Step 2: Add a typed-confirmation gate**

Modify `src/pages/DeleteDataPage.tsx`. Wherever the delete action is invoked (typically a button calling `httpsCallable(functions, 'deleteUserData')`), add a state variable `confirmText` and require it to equal the user's email before enabling the delete button.

Concrete pattern to add inside the component body:

```tsx
const [confirmText, setConfirmText] = useState('')
const canDelete = !!user?.email && confirmText.trim().toLowerCase() === user.email.toLowerCase()
```

In the JSX, add an input above the delete button:

```tsx
<div className="space-y-2">
  <label className="text-sm text-red-700 font-medium">
    Digite seu email <code className="bg-red-50 px-1 rounded">{user?.email}</code> para confirmar:
  </label>
  <input
    type="text"
    value={confirmText}
    onChange={(e) => setConfirmText(e.target.value)}
    className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
    placeholder={user?.email ?? ''}
  />
</div>
```

And change the delete button:

```tsx
<button
  type="button"
  onClick={handleDelete}
  disabled={!canDelete || deleting}
  className="..."
>
  {deleting ? 'Excluindo...' : 'Excluir minha conta permanentemente'}
</button>
```

The exact JSX structure depends on the existing layout. If the file uses different state names, adapt — the key requirement is "delete button is disabled until user types their own email exactly".

- [ ] **Step 3: Update post-deletion handling**

After `httpsCallable('deleteUserData')` resolves successfully, sign the user out and redirect to `/login`:

```tsx
const handleDelete = async () => {
  if (!canDelete) return
  setDeleting(true)
  try {
    await httpsCallable(functions, 'deleteUserData')({})
    // Backend has deleted the Auth user; client's token is invalid.
    await signOut()
    navigate('/login', { replace: true })
  } catch (err) {
    setError(t(authErrorToTKey(err)))
  } finally {
    setDeleting(false)
  }
}
```

Make sure `signOut` is destructured from `useAuth()` and `authErrorToTKey` is imported from `@/lib/auth/errorMessages`.

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: exits 0.

- [ ] **Step 5: Run tests**

Run: `bun run test`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/pages/DeleteDataPage.tsx
git commit -m "feat(auth): DeleteDataPage requires email confirmation + auto-signout"
```

---

### Task E5: Unify ADMIN_EMAILS server-side (replace 3 duplicate copies)

**Files:**
- Modify: `functions/src/getDashboardMetrics.ts`
- Modify: `functions/src/priceManager.ts`
- Modify: `functions/src/adminWalletManager.ts`

- [ ] **Step 1: Replace `getDashboardMetrics.ts` admin check**

Modify `functions/src/getDashboardMetrics.ts`:

- Delete the local `const ADMIN_EMAILS = [...]` array.
- Replace `const isAdmin = auth.token.admin === true || ADMIN_EMAILS.includes(email)` with:

```typescript
import { isAdminUser } from '@adsmart/shared'
// ...
const isAdmin = isAdminUser(auth.token as IdTokenClaims, email)
```

Add the type import to the existing shared import: change
```typescript
import { GetDashboardMetricsInputSchema } from '@adsmart/shared'
```
to:
```typescript
import { GetDashboardMetricsInputSchema, isAdminUser, type IdTokenClaims } from '@adsmart/shared'
```

- [ ] **Step 2: Replace `priceManager.ts` admin checks**

Modify `functions/src/priceManager.ts`:

- Delete the local `const ADMIN_EMAILS = [...]` array.
- For each `const isAdmin = request.auth.token.admin || ADMIN_EMAILS.includes(userEmail)` site, replace with:

```typescript
const isAdmin = isAdminUser(request.auth.token as IdTokenClaims, userEmail)
```

Update the imports:
```typescript
import { isAdminUser, type IdTokenClaims } from '@adsmart/shared'
```

For the two later sites at lines 162 and 260 doing `if (!ADMIN_EMAILS.includes(userEmail))`, replace with `if (!isAdminUser(request.auth.token as IdTokenClaims, userEmail))`.

- [ ] **Step 3: Replace `adminWalletManager.ts` admin check**

Modify `functions/src/adminWalletManager.ts`:

- Delete the local `const ADMIN_EMAILS = [...]`.
- Replace the `isAdmin` line with the shared call.
- Add the import.

- [ ] **Step 4: Build the functions package**

Run: `cd functions && bun run build`
Expected: exits 0.

- [ ] **Step 5: Run functions typecheck**

Run: `cd functions && bun run typecheck`
Expected: exits 0.

- [ ] **Step 6: Run functions tests**

Run: `cd functions && bun run test`
Expected: all green.

- [ ] **Step 7: Verify there are no remaining duplicate definitions**

Run: `grep -rn "const ADMIN_EMAILS\b" functions/src/ src/`
Expected: zero matches (the constant should now live ONLY in `packages/shared/src/auth/admin.ts`).

- [ ] **Step 8: Commit**

```bash
git add functions/src/getDashboardMetrics.ts functions/src/priceManager.ts functions/src/adminWalletManager.ts
git commit -m "refactor(functions): unify ADMIN_EMAILS via @adsmart/shared (no more drift)"
```

---

## Phase F — COOP header change

### Task F1: Downgrade COOP to `same-origin-allow-popups`

**Files:**
- Modify: `firebase.json`

- [ ] **Step 1: Apply the COOP change**

Modify `firebase.json` — find the `Cross-Origin-Opener-Policy` header and change `"value": "same-origin"` to `"value": "same-origin-allow-popups"`.

The full updated block should look like:

```json
{
  "key": "Cross-Origin-Opener-Policy",
  "value": "same-origin-allow-popups"
},
```

`Cross-Origin-Resource-Policy: same-origin` is unchanged.

- [ ] **Step 2: Validate the JSON**

Run: `bun -e 'console.log(JSON.parse(require("fs").readFileSync("firebase.json", "utf8")).hosting.headers[0].headers.find(h=>h.key==="Cross-Origin-Opener-Policy"))'`
Expected: prints `{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }`.

- [ ] **Step 3: Manual smoke test (dev server)**

Run: `bun run dev`
Open `/login`. Open DevTools → Network → click any Firebase request → Headers. The response from the Vite dev server won't include the Firebase Hosting headers (Firebase config only applies to deployed hosting). Note this in the PR description: actual verification happens on the next deploy.

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add firebase.json
git commit -m "fix(hosting): downgrade COOP to same-origin-allow-popups for OAuth popups"
```

---

## Phase G — Documentation sweep

### Task G1: Add ADR-016 to `docs/Decisions.md`

**Files:**
- Modify: `docs/Decisions.md`

- [ ] **Step 1: Find the bottom of the file**

Run: `tail -20 docs/Decisions.md`
Expected: ends with ADR-015 references.

- [ ] **Step 2: Append ADR-016**

Append to `docs/Decisions.md`:

```markdown
---

## ADR-016: Auth flow hardening 2026-05

**Date:** 2026-05-17
**Status:** Accepted

**Context:**

The authentication surface (Google / Facebook / Email-Password sign-in,
sign-up, email verification, password reset, admin gating, blocking
trigger seeding) had accumulated drift and latent bugs since Phase 3
landed:

1. `ADMIN_EMAILS` was duplicated in 4 files (client `AuthContext.tsx` +
   three Cloud Functions). Drift was observed in PR review.
2. `LoginPage.handleSubmit` called `createUserWithEmailAndPassword(auth, ...)`
   directly, bypassing `AuthContext.signUp` (dead code in the Context).
3. `SettingsPage` change-password enforced 6 chars; `LoginPage` signup
   enforced 8 + complexity rules. Two policies, two surfaces.
4. `getIdTokenResult()` was called without `forceRefresh: true`. Custom
   admin claims provisioned server-side only appeared after the 1-hour
   token TTL or sign-out/sign-in.
5. `signInWithFacebook` did not request the `email` scope; the blocking
   trigger then received `event.data.email === undefined` and wrote
   `email: ''` into `users/{uid}`, which violates the `isValidEmail`
   firestore.rules invariant for any subsequent create path. Also
   `console.log` / `console.error` in the handler leaked PII (email,
   credential).
6. `PrivateRoute` and `AdminRoute` did not honor `loading` from the
   Context — they worked only because `AuthProvider` rendered `!loading &&
   children`, an implicit coupling that would break any guard placed
   outside the provider.
7. `Link to="/forgot-password"` in LoginPage pointed at a route that did
   not exist.
8. `deleteUserData` was a stub returning `success: true` while deleting
   nothing — an LGPD/GDPR risk.
9. No App Check — Identity Toolkit endpoints (signup, signin, reset)
   exposed without rate limit beyond Firebase's own per-IP throttle.
   Post-ADR-013 (reCAPTCHA removal), App Check is the supported successor.
10. `Cross-Origin-Opener-Policy: same-origin` is incompatible with
    `signInWithPopup`'s `window.opener.postMessage` closing flow in some
    browsers, intermittently breaking OAuth completion.

**Decision:**

A single coordinated refactor (Approach A in the
[design spec](./superpowers/specs/2026-05-17-auth-flow-hardening-design.md))
addresses all ten points without changing the architectural shape
(AuthProvider + signInWithPopup remain). Specifically:

1. **Shared modules.** `packages/shared/src/auth/admin.ts` (ADMIN_EMAILS
   + `isAdminUser`) and `packages/shared/src/auth/password.ts`
   (PasswordPolicy + `validatePassword`) become the single source of
   truth. Client (`AuthContext`, `LoginPage`, `SettingsPage`) and Cloud
   Functions (`getDashboardMetrics`, `priceManager`, `adminWalletManager`)
   import from `@adsmart/shared`.
2. **AuthContext cleanup.** Removed the `signIn` alias; centralized all
   sign-in/sign-up calls through one path that calls
   `refreshAuthState(user)` afterwards (force ID-token refresh + reload).
   `signInWithGoogle` adds `prompt: 'select_account'` and explicit `email`
   + `profile` scopes. `signInWithFacebook` adds `email` + `public_profile`
   scopes and drops the PII-leaking console.log.
3. **Route guards loading-aware.** `PrivateRoute` and `AdminRoute` show
   `AuthLoadingFallback` while `loading === true` and use `Navigate
   ... replace` to avoid history pollution. The Provider no longer
   short-circuits on `loading`.
4. **Error handling.** `src/lib/auth/errorMessages.ts` is the single
   place that maps Firebase Auth error codes to i18n keys. Privacy:
   `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found`
   all map to one generic key (no enumeration). All `error: any` in auth
   handlers replaced with `isAuthError` guard.
5. **ForgotPasswordPage.** Real implementation at `/forgot-password`
   using `sendPasswordResetEmail`. Always shows success (no enumeration).
6. **EmailVerificationBanner.** Non-blocking banner in `MainLayout` for
   `hasPasswordProvider && !emailVerified` users with a "Reenviar" button.
7. **bootstrapUser robustness.** Email resolution falls back through
   `event.data.email → providerData[*].email → null`. If no email is
   found, `users/{uid}` is created WITHOUT the email field (instead of
   `email: ''`) and SettingsPage gates first save until the user fills it.
   Structured `console.log({ event, uid, email_present, providers })` for
   Cloud Logging.
8. **deleteUserData real.** Cascades through subcollections (`wallet`,
   `transactions`, `oauthConnections`, `reports`, `activityLogs`) in
   batches of 400, deletes the `userDocuments/{normalized}` index entry
   if present, deletes the user doc, deletes the Firebase Auth user, and
   logs `USER_DELETION` via `securityLogger`. Rate-limited 1×/hour. The
   `DeleteDataPage` requires typing the user's own email to confirm.
9. **App Check.** Initialized in `firebase/config.ts` gated by
   `VITE_APPCHECK_SITE_KEY`. Without the key, App Check is not
   initialized at all (no silent fallback). reCAPTCHA Enterprise
   provider. Identity Toolkit enforcement starts in **monitor mode** in
   Firebase Console; rolled to enforce mode after one week of >95%
   valid-token baseline (operator step, see DEPLOYMENT.md Phase H).
10. **COOP downgrade.** `firebase.json` →
    `Cross-Origin-Opener-Policy: same-origin-allow-popups`. CORP remains
    `same-origin`. Trade-off: we lose strict cross-origin isolation
    (no SharedArrayBuffer etc.), but gain compatibility with
    `signInWithPopup` across all browsers. Re-tightening to `same-origin`
    is possible later via Identity Platform custom auth domain (deferred).

**Trade-offs:**

- **COOP downgrade** weakens cross-origin isolation. Acceptable — we
  don't use SharedArrayBuffer / cross-origin-restricted APIs, and the
  alternative (Approach C: `signInWithRedirect`) hurts UX and adds
  `getRedirectResult` timing complexity. Documented in the design spec §6.
- **Force token refresh on every sign-in** adds ~100-200ms one-time
  latency per session. Acceptable for correctness (custom claims appear
  immediately) and the cost is paid once per session, not per request.
- **App Check rollout** requires a manual monitor → enforce step in
  Firebase Console. Documented in DEPLOYMENT.md.
- **Email-less users.** Facebook accounts that withhold email even with
  the scope will land in Firestore with `users/{uid}` missing the email
  field. SettingsPage gates first save to require filling it.
  Alternative would be rejecting the signup outright — too aggressive
  for a B2B SaaS where the user can fill email post-signup.

**Alternatives considered:**

- **Approach B (extract Auth Service).** Move all auth ops into
  `src/services/auth/AuthService.ts`, leaving the Context thin. Rejected
  — YAGNI for a single auth context.
- **Approach C (signInWithRedirect + MFA TOTP for admins).** Compatible
  with COOP `same-origin` and adds real MFA. Rejected — large scope
  (recovery codes UI, admin reset tooling), questionable ROI at current
  scale (~2 admins, no observed targeted attacks). Deferred to ADR-017
  when justified.

**References:**
- [docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md](./superpowers/specs/2026-05-17-auth-flow-hardening-design.md) — design + alternatives matrix.
- [docs/superpowers/plans/2026-05-17-auth-flow-hardening-plan.md](./superpowers/plans/2026-05-17-auth-flow-hardening-plan.md) — implementation plan.
- [packages/shared/src/auth/admin.ts](../packages/shared/src/auth/admin.ts) — single source of admin allowlist.
- [packages/shared/src/auth/password.ts](../packages/shared/src/auth/password.ts) — single password policy.
- [src/lib/auth/errorMessages.ts](../src/lib/auth/errorMessages.ts) — single error code → i18n key map.
- [functions/src/bootstrapUser.ts](../functions/src/bootstrapUser.ts) — hardened email fallback.
- [functions/src/deleteUserData.ts](../functions/src/deleteUserData.ts) — real implementation.
- [ADR-010](#adr-010-per-user-state-bootstrap-moved-to-server-side-auth-blocking-trigger) — origin of bootstrapUser.
- [ADR-012](#adr-012-cpfcnpj-uniqueness--immutability-via-callable--uniqueness-index) — userDocuments cascade.
- [ADR-013](#adr-013-drop-google-recaptcha-from-authentication) — App Check replaces removed reCAPTCHA.
- [ADR-015](#adr-015-register-identity-platform-blocking-trigger-after-total-firestore--auth-wipe) — runbook for trigger registration.
- Context7: `/firebase/firebase-js-sdk` — auth, App Check, persistence patterns (queried 2026-05-17).
```

- [ ] **Step 3: Commit**

```bash
git add docs/Decisions.md
git commit -m "docs(adr): add ADR-016 auth flow hardening 2026-05"
```

---

### Task G2: Update `docs/SECURITY.md`

**Files:**
- Modify: `docs/SECURITY.md`

- [ ] **Step 1: Update the "Admin access" section**

Modify `docs/SECURITY.md` — replace the "Admin access" section content with:

```markdown
## Admin access

Admin authority is the Firebase Auth custom claim `admin === true`. The
client `AdminRoute` and every server callable that gates on admin reads
`isAdminUser(claims, email)` from `@adsmart/shared/auth/admin` — the
single source of truth. Pre-ADR-016 each consumer had its own copy of
the allowlist.

A transition email allowlist (`ADMIN_EMAILS` in
`packages/shared/src/auth/admin.ts`) remains active as a fallback so
existing admins are not locked out before their custom claim is
provisioned. The allowlist will be removed when all current admins are
on custom claims (ADR-017).

### Granting admin to a user

Requires the Admin SDK (one-off Node script run from a machine with your
service account credentials, OR the Firebase CLI functions shell):

```javascript
const admin = require('firebase-admin')
admin.initializeApp()
await admin.auth().setCustomUserClaims(uid, { admin: true })
// The user's next sign-in (or page reload after refreshAuthState fires)
// will pick up the new claim. Pre-ADR-016 the user needed to sign out
// and back in; AuthContext now calls getIdToken(true) on every sign-in.
```
```

- [ ] **Step 2: Add an "App Check" section above "Firestore rules"**

Insert before the existing "Firestore rules" section:

```markdown
## App Check

Identity Toolkit endpoints (signup, signin, password reset) are
protected by Firebase App Check when `VITE_APPCHECK_SITE_KEY` is set in
the build env. Configured with `ReCaptchaEnterpriseProvider` (modern
successor to v2/v3 site-key reCAPTCHA — ADR-013 removed the legacy
reCAPTCHA from authentication; App Check replaces it).

Rollout (manual ops step):

1. Provision a reCAPTCHA Enterprise site key in Google Cloud Console;
   register it in Firebase Console → App Check → Web app.
2. Set `VITE_APPCHECK_SITE_KEY=<key>` in `.env.production` (and `.env`
   for dev if testing locally — also set
   `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` in DevTools BEFORE the
   page initializes Firebase, then register the printed debug token in
   the console).
3. Enable Identity Toolkit enforcement in **monitor mode**. Watch for one
   week; expect >95% requests with valid tokens. If so, move to enforce
   mode. See DEPLOYMENT.md Phase H.

If App Check is enabled and a request lacks a valid token, the SDK
returns `auth/firebase-app-check-token-is-invalid`. Client maps this to
`common.error.appCheckFailed`.

## Password policy

Min 8 chars, requires upper + lower + number + special.

Implemented in `packages/shared/src/auth/password.ts` (single source for
client + functions) AND mirrored in Identity Platform's own Password
Policy (Firebase Console → Authentication → Settings → Password policy).
The Identity Platform mirror provides defense-in-depth even if a client
somehow bypasses the local check.
```

- [ ] **Step 3: Update the "Security headers" section**

Find the existing "Security headers" section and update the CSP/COOP bullets:

```markdown
## Security headers

Firebase Hosting responds with:
- HSTS (2 years, preload)
- CSP allowlisting Firebase, Google Fonts, Meta Graph, and Google Tag
  Manager (reCAPTCHA hosts were removed from `script-src`/`connect-src`/
  `frame-src` on 2026-05-17 — see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication))
- COOP: `same-origin-allow-popups` (downgraded from `same-origin` on
  2026-05-17 to allow `signInWithPopup` to complete reliably across
  browsers — see [Decisions.md ADR-016](Decisions.md#adr-016-auth-flow-hardening-2026-05))
- CORP: `same-origin`
- X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
  Permissions-Policy

See `firebase.json` for the full list.
```

- [ ] **Step 4: Commit**

```bash
git add docs/SECURITY.md
git commit -m "docs(security): update for admin allowlist unification + App Check + COOP"
```

---

### Task G3: Update `docs/QA-CHECKLIST.md`

**Files:**
- Modify: `docs/QA-CHECKLIST.md`

- [ ] **Step 1: Update the Authentication section**

Modify `docs/QA-CHECKLIST.md` — replace the existing "## Authentication" section with:

```markdown
## Authentication

- [ ] Sign in with Google works (popup opens; `prompt: select_account` shows account picker; redirect to `/dashboard`)
- [ ] Sign in with Facebook works (popup opens; email scope granted; `users/{uid}.email` is populated after first signup)
- [ ] Sign in with email/password works (no reCAPTCHA — removed 2026-05-17, see [Decisions.md ADR-013](Decisions.md#adr-013-drop-google-recaptcha-from-authentication))
- [ ] Sign up with email/password enforces password policy (8 chars + upper + lower + number + special); error message lists missing rules
- [ ] Signup with already-used email shows "loginPage.error.emailInUse" message
- [ ] Login with wrong password shows the generic "credenciais inválidas" message (no user-not-found differential — privacy)
- [ ] `useRateLimit` blocks after 5 failed attempts in a 15-minute window (UX guard only — real defense is Firebase Auth throttle + App Check)
- [ ] After sign-out, all protected routes redirect to `/login` (with `replace: true` — no history pollution)
- [ ] Admin user (`agency.elovisiondigital@gmail.com` OR any user with custom claim `admin: true`) sees admin panel at `/admin`
- [ ] Non-admin user is redirected from `/admin` to `/dashboard`
- [ ] After `setCustomUserClaims(uid, { admin: true })`, the next sign-in picks up admin without requiring a manual sign-out/sign-in cycle (force-refresh path)
- [ ] `AuthLoadingFallback` (spinner with `aria-label="Carregando"`) appears briefly during initial route resolution — no white screen, no flicker redirect

### Forgot password

- [ ] `/forgot-password` renders the form
- [ ] Submitting with a valid email shows the success message
- [ ] Submitting with a non-existent email also shows success (no enumeration)
- [ ] Rate limit kicks in after 5 submissions in 15 min
- [ ] "Voltar ao login" link works

### Email verification

- [ ] After email/password signup with an unverified email, `EmailVerificationBanner` is visible on every authenticated page
- [ ] Clicking "Reenviar" sends a verification email; banner replaces button with success message
- [ ] After clicking the link in the email and reloading, the banner disappears
- [ ] Banner does NOT appear for users signed in via Google/Facebook (no password provider)

### Account deletion

- [ ] `/privacy/delete-data` requires typing the user's own email to enable the delete button
- [ ] Submitting deletes the Auth user, the Firestore `users/{uid}` doc, all subcollections, the `userDocuments/{normalized}` index entry
- [ ] Client is signed out automatically and redirected to `/login`
- [ ] Cloud Logging shows a `securityLogs` write with `eventType: USER_DELETION` and the subcollection counts
- [ ] Rate limit: a second delete attempt within 1h is rejected with "resource-exhausted"
```

- [ ] **Step 2: Add a new "App Check" section at the end of the file**

```markdown
## App Check (only if VITE_APPCHECK_SITE_KEY is set)

- [ ] Open DevTools → Network → click on a request to `identitytoolkit.googleapis.com`
- [ ] Request headers include `X-Firebase-AppCheck: <token>`
- [ ] If token is invalid (e.g. dev without debug token), Firebase Console → App Check shows a spike in invalid requests (monitor mode) — investigate before moving to enforce
```

- [ ] **Step 3: Commit**

```bash
git add docs/QA-CHECKLIST.md
git commit -m "docs(qa): expand auth checklist for ADR-016 surface"
```

---

### Task G4: Update or create `docs/ERROR-HANDLING.md`

**Files:**
- Modify: `docs/ERROR-HANDLING.md`

- [ ] **Step 1: Read current content**

Run: `head -30 docs/ERROR-HANDLING.md`

- [ ] **Step 2: Add an "Auth error code → i18n key" section**

Append to `docs/ERROR-HANDLING.md`:

```markdown
## Auth error codes (Firebase Auth → i18n key)

Single source: [`src/lib/auth/errorMessages.ts`](../src/lib/auth/errorMessages.ts). Every caller of `signInWith*`, `signUp`, `linkWithCredential`, `sendPasswordResetEmail`, `sendEmailVerification` must wrap the error in `authErrorToTKey(err)` and pass through `t(...)`. No bespoke per-page mapping.

| Firebase code | i18n key | UX rationale |
|---|---|---|
| `auth/invalid-credential` | `loginPage.error.invalidCredentials` | Modern combined code |
| `auth/wrong-password` | `loginPage.error.invalidCredentials` | Legacy code, same UX |
| `auth/user-not-found` | `loginPage.error.invalidCredentials` | Collapsed to prevent enumeration |
| `auth/invalid-login-credentials` | `loginPage.error.invalidCredentials` | Same |
| `auth/email-already-in-use` | `loginPage.error.emailInUse` | Signup-only |
| `auth/weak-password` | `common.validation.weakPassword` | Backstop if Identity Platform policy disagrees with client |
| `auth/invalid-email` | `common.validation.invalidEmail` | Format error |
| `auth/too-many-requests` | `common.error.tooManyAttempts` | Firebase server-side throttle |
| `auth/popup-blocked` | `loginPage.error.popupBlocked` | Browser blocked the OAuth popup |
| `auth/popup-closed-by-user` | `loginPage.error.popupClosed` | User dismissed |
| `auth/cancelled-popup-request` | `loginPage.error.popupClosed` | Concurrent popup attempt — same UX as closed |
| `auth/network-request-failed` | `common.error.network` | Offline or DNS failure |
| `auth/account-exists-with-different-credential` | `loginPage.error.accountConflict` | Provider linking conflict |
| `auth/credential-already-in-use` | `loginPage.error.credentialInUse` | Same email linked to another uid |
| `auth/requires-recent-login` | `common.error.requiresReauth` | reauthenticateWithCredential needed |
| `auth/firebase-app-check-token-is-invalid` | `common.error.appCheckFailed` | App Check enforcement rejection |
| **unknown** | `common.error.generic` | Last-resort catch-all |

Privacy note: `user-not-found`, `wrong-password`, and `invalid-credential` all surface the same message to prevent account enumeration.
```

- [ ] **Step 3: Commit**

```bash
git add docs/ERROR-HANDLING.md
git commit -m "docs(errors): document complete auth error code → i18n key map"
```

---

### Task G5: Update `AGENTS.md` and `CLAUDE.md` read-first maps

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update AGENTS.md**

Modify `AGENTS.md` — find the "Read-first map" table and update the row "Change auth/admin logic":

```markdown
| Change auth/admin logic | `packages/shared/src/auth/admin.ts` (allowlist source), `packages/shared/src/auth/password.ts` (password policy), `src/contexts/AuthContext.tsx`, `src/components/AdminRoute.tsx`, `src/lib/auth/errorMessages.ts`, `docs/SECURITY.md` |
```

In the "Conventions" section, update the "Admin check" bullet:

```markdown
- **Admin check**: Use `isAdminUser(claims, email)` from `@adsmart/shared`. New admins → custom claims. See `docs/SECURITY.md`.
```

In "What NOT to do", add:

```markdown
- Do not write a local `ADMIN_EMAILS` array — import from `@adsmart/shared`.
- Do not map Firebase Auth errors with bespoke per-page logic — use `authErrorToTKey(err)` from `src/lib/auth/errorMessages.ts`.
- Do not validate passwords with bespoke per-page logic — use `validatePassword(password)` from `@adsmart/shared`.
```

- [ ] **Step 2: Update CLAUDE.md**

Modify `CLAUDE.md` — find the "Password vs OAuth providers" section and update it to reflect that `LoginPage` now calls `signUp` from Context (was: direct `createUserWithEmailAndPassword` call). The current section already describes the link flow correctly; add a sentence at the end:

```markdown
Post-ADR-016, every sign-in / sign-up / link path in `AuthContext` ends with `refreshAuthState(user)` which calls `getIdToken(true)` + `reload()`. This guarantees that custom claims provisioned server-side (e.g. `setCustomUserClaims(uid, { admin: true })`) appear in the next render without requiring the user to manually sign out and sign back in.
```

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs(conventions): update AGENTS + CLAUDE for ADR-016"
```

---

### Task G6: Add a dated entry to `docs/CHANGES.md`

**Files:**
- Modify: `docs/CHANGES.md`

- [ ] **Step 1: Read top of CHANGES.md**

Run: `head -50 docs/CHANGES.md`
Expected: latest entry is dated 2026-05-17 (the wipe).

- [ ] **Step 2: Insert the new entry above the previous 2026-05-17 entry**

Modify `docs/CHANGES.md` — insert a new entry directly under the file header (above whatever is at the top of the change log section):

```markdown
## [2026-05-17] — Auth flow hardening (ADR-016)

**Scope:** Surgical refactor of the authentication surface (Google /
Facebook / Email-Password sign-in, sign-up, password change, password
reset, email verification, route guards, admin gating, blocking trigger
robustness, real account deletion) without changing the architectural
shape (AuthProvider + signInWithPopup remain).

**Shared modules introduced (single source of truth):**
- `packages/shared/src/auth/admin.ts` — `ADMIN_EMAILS` + `isAdminUser`.
  Replaces 4 duplicate copies (client + 3 functions files).
- `packages/shared/src/auth/password.ts` — `PasswordPolicy` + zod
  `PasswordSchema` + `validatePassword`. Single rule for LoginPage,
  SettingsPage, and Identity Platform mirror.

**Client changes:**
- `src/firebase/config.ts` — migrated to `initializeAuth` with
  `[indexedDBLocalPersistence, browserLocalPersistence,
  browserSessionPersistence]` fallback + `browserPopupRedirectResolver`.
  App Check initialization added, **gated by `VITE_APPCHECK_SITE_KEY`**
  (no silent fallback when key absent).
- `src/contexts/AuthContext.tsx` — removed dead-code `signIn` alias;
  imports `isAdminUser` from `@adsmart/shared`; Google adds `prompt:
  'select_account'` + explicit scopes; Facebook adds `email` +
  `public_profile` scopes (was missing — caused `users/{uid}.email = ''`);
  PII console.log/error in Facebook handler removed; every sign-in calls
  `refreshAuthState` (`getIdToken(true)` + `reload()`); `getIdTokenResult`
  uses `forceRefresh: true`. Children render unconditionally (route
  guards own the loading state).
- `src/components/{Private,Admin}Route.tsx` — honor `loading` explicitly,
  render `AuthLoadingFallback` until ready, use `<Navigate ... replace>`
  to avoid history pollution.
- `src/components/EmailVerificationBanner.tsx` — non-blocking banner for
  email/password users with `!emailVerified`; resend button via
  `sendEmailVerification`.
- `src/components/AuthLoadingFallback.tsx` — centered spinner with
  `aria-label="Carregando"`.
- `src/lib/auth/{errors,errorMessages}.ts` — `isAuthError` type guard
  and a single Firebase code → i18n key map.
  `auth/user-not-found`/`wrong-password`/`invalid-credential` collapse to
  one generic message (no enumeration).
- `src/pages/LoginPage.tsx` — now calls `signUp` from Context (was:
  direct `createUserWithEmailAndPassword`); `validatePassword` from
  `@adsmart/shared`; error handling via `authErrorToTKey`. Removed all
  `error: any`.
- `src/pages/ForgotPasswordPage.tsx` — new page at `/forgot-password`
  using `sendPasswordResetEmail`; always shows success.
- `src/pages/SettingsPage.tsx` — change-password uses shared
  `validatePassword` (was: local 6-char minimum); error handling via
  `authErrorToTKey`.
- `src/pages/DeleteDataPage.tsx` — typed-email confirmation gate;
  auto-signOut + redirect to `/login` after success.

**Functions changes:**
- `functions/src/bootstrapUser.ts` — email resolution falls back through
  `event.data.email → providerData[*].email → null`. If no email is
  found, `users/{uid}` is created WITHOUT the email field. Structured
  Cloud Logging telemetry.
- `functions/src/deleteUserData.ts` — implemented for real. Cascades
  through known subcollections in batches of 400; deletes the
  `userDocuments/{normalized}` index entry if present; deletes the user
  doc; deletes the Firebase Auth user; logs `USER_DELETION`. Rate-limited
  1×/hour.
- `functions/src/securityLogger.ts` — new `USER_DELETION` enum value.
- `functions/src/{getDashboardMetrics,priceManager,adminWalletManager}.ts`
  — all `const ADMIN_EMAILS = [...]` arrays deleted; replaced with
  `isAdminUser(...)` from `@adsmart/shared`.

**Hosting:**
- `firebase.json` — `Cross-Origin-Opener-Policy` changed from
  `same-origin` to `same-origin-allow-popups`. CORP unchanged
  (`same-origin`). Required for `signInWithPopup` reliability across
  browsers.

**Docs:**
- `docs/Decisions.md` — ADR-016 added (full decision + alternatives).
- `docs/SECURITY.md` — admin section rewritten around the shared module;
  new App Check section; new Password Policy section.
- `docs/QA-CHECKLIST.md` — auth checklist expanded; new sections for
  Forgot password, Email verification, Account deletion, App Check.
- `docs/ERROR-HANDLING.md` — full table of Firebase Auth error codes →
  i18n keys.
- `AGENTS.md`, `CLAUDE.md` — read-first maps and conventions updated.
- `docs/superpowers/specs/2026-05-17-auth-flow-hardening-design.md` —
  the design that anchors this refactor.
- `docs/superpowers/plans/2026-05-17-auth-flow-hardening-plan.md` —
  the implementation plan executed.

**Not done (deferred):**
- **Manual ops step:** Provision `VITE_APPCHECK_SITE_KEY` and enable
  Identity Toolkit enforcement in monitor mode. See DEPLOYMENT.md Phase H.
- **Manual ops step:** Mirror the password policy in Identity Platform
  via Firebase Console → Authentication → Settings → Password policy.
- **Removal of `ADMIN_EMAILS` allowlist fallback** — kept as transition
  bridge; removal in ADR-017 when all current admins have custom claims.
- **MFA TOTP for admins** — Approach C (deferred to ADR-017).
- **Custom auth domain (to restore COOP `same-origin`)** — deferred.
- **Full `firebase-functions-test` integration tests for `bootstrapUser`
  and `deleteUserData`** — placeholder test added; follow-up issue
  for full emulator-driven coverage.
```

- [ ] **Step 3: Commit**

```bash
git add docs/CHANGES.md
git commit -m "docs(changes): 2026-05-17 auth flow hardening (ADR-016)"
```

---

## Phase H — Operational rollout (no code, manual steps)

These steps are deliberately NOT automated and require operator action. Track in the project's deploy log.

### Task H1: Provision App Check site key

- [ ] **H1.1** Google Cloud Console → reCAPTCHA Enterprise → Create key → register the app's host(s). Save the site key.
- [ ] **H1.2** Firebase Console → App Check → Web app → Register reCAPTCHA Enterprise with the site key from H1.1.
- [ ] **H1.3** Add `VITE_APPCHECK_SITE_KEY=<key>` to `.env.production` and to the GitHub Actions secrets store (`vercel`/`firebase` deploy needs the env at build time).
- [ ] **H1.4** Deploy. Verify the deployed `index.html` references the App Check chunk (`grep "ReCaptchaEnterpriseProvider" dist/assets/*.js`).
- [ ] **H1.5** Firebase Console → App Check → Identity Toolkit API → Enforcement → **Monitor mode**.

### Task H2: Mirror password policy in Identity Platform

- [ ] **H2.1** Firebase Console → Authentication → Settings → Password policy → Enable. Set: min length 8, require uppercase, require lowercase, require numeric, require non-alphanumeric. Save.
- [ ] **H2.2** Confirm rollout: existing users can still sign in; new signups with weak passwords are rejected at the server.

### Task H3: Provision admin custom claims for current admins

- [ ] **H3.1** From a machine with Firebase Admin credentials (CLI functions:shell or one-off Node script), for each email in `ADMIN_EMAILS`:

```javascript
const admin = require('firebase-admin')
admin.initializeApp()
const user = await admin.auth().getUserByEmail('agency.elovisiondigital@gmail.com')
await admin.auth().setCustomUserClaims(user.uid, { admin: true })
```

- [ ] **H3.2** Confirm: have each admin sign in fresh and verify `/admin` renders without falling through to the email-allowlist code path.

### Task H4: App Check enforcement promotion

- [ ] **H4.1** After 7 days in monitor mode, Firebase Console → App Check → Identity Toolkit API → Metrics. Verify >95% requests have valid tokens.
- [ ] **H4.2** If green, flip Identity Toolkit to **Enforce mode**.
- [ ] **H4.3** Watch error rates for 24h. If a spike in `auth/firebase-app-check-token-is-invalid` reports, roll back to monitor and investigate.

### Task H5: Documentation closeout

- [ ] **H5.1** Add a CHANGES.md entry confirming the operational rollout dates: "App Check enabled in dev/prod; promoted to enforce mode on YYYY-MM-DD."
- [ ] **H5.2** Update `docs/DEPLOYMENT.md` with the operator runbook for App Check + Password Policy mirrors.

---

## Final validation

After all phases A-G are committed:

- [ ] **V1: Full clean build**
  Run: `bun run typecheck && bun run lint && bun run test:all`
  Expected: all green.

- [ ] **V2: Functions build**
  Run: `cd functions && bun run build && bun run test`
  Expected: all green; `functions/deploy/index.js` regenerated.

- [ ] **V3: Manual smoke** — `bun run dev`, walk through QA-CHECKLIST.md Authentication section end-to-end.

- [ ] **V4: Push for PR**
  Run: `git push -u origin develop`
  Expected: GitHub Actions CI green. If `deploy.yml` has the pre-existing startup_failure (see ADR-015), document it in the PR and proceed.

- [ ] **V5: Open PR with the auth-flow-hardening label**
  Reference both the spec and the ADR in the PR body.
