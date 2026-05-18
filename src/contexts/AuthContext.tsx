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
        } catch (err) {
          // Token fetch failed (network etc.) — fall back to email-only check.
          // Surface as warn so monitoring catches sustained Identity Toolkit
          // outages instead of silent degradation. See ADR-016 §R10.
          console.warn('[auth] token refresh failed; falling back to allowlist', err)
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
