import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '@/firebase/config'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithEmail: (email: string, password: string, recaptchaToken?: string) => Promise<void>
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

// Lista de emails de administradores
const ADMIN_EMAILS = [
  'agency.elovisiondigital@gmail.com',
  'admin@adsmart.app',
]

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email || '') : false)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Função para verificar o ReCAPTCHA
  const verifyRecaptchaToken = async (token: string) => {
    try {
      const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha')
      const result = await verifyRecaptcha({ token })
      return result.data
    } catch (error) {
      console.error('Erro ao verificar ReCAPTCHA:', error)
      throw new Error('Falha na verificação de segurança')
    }
  }

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithEmail = async (email: string, password: string, recaptchaToken?: string) => {
    // Verificar se é o usuário de teste
    const isTestUser = email.toLowerCase().trim() === 'review.user@adsmart.app'
    
    // Só verificar reCAPTCHA se não for desenvolvimento, usuário de teste ou token especial
    if (recaptchaToken && recaptchaToken !== 'local-dev' && recaptchaToken !== 'test-user' && !isTestUser) {
      await verifyRecaptchaToken(recaptchaToken)
    }
    
    if (recaptchaToken === 'local-dev') {
      console.log('🔧 Modo desenvolvimento: Login sem reCAPTCHA')
    }
    
    if (isTestUser || recaptchaToken === 'test-user') {
      console.log('🧪 Usuário de teste: Login sem verificação reCAPTCHA')
    }
    
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signInWithFacebook = async () => {
    try {
      console.log('🔍 Iniciando login com Facebook...')
      
      const provider = new FacebookAuthProvider()
      
      // REMOVIDO: Não solicitar email por enquanto
      // provider.addScope('email')
      // provider.addScope('public_profile')
      
      console.log('📱 Provider configurado, abrindo popup...')
      
      const result = await signInWithPopup(auth, provider)
      
      console.log('✅ Login com Facebook bem-sucedido!', {
        user: result.user.email,
        providerId: result.providerId,
        additionalUserInfo: result.user.providerData
      })
      
    } catch (error: any) {
      console.error('❌ Erro no login com Facebook:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential
      })
      
      // Re-throw para ser tratado no componente
      throw error
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const value = {
    user,
    loading,
    isAdmin,
    signIn,
    signInWithEmail,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}