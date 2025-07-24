import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase/config'
import ReCAPTCHA from 'react-google-recaptcha'
import { validatePassword } from '@/utils/validation'
import { useRateLimit } from '@/hooks/useRateLimit'
import { sanitizeEmail, sanitizeInput } from '@/utils/sanitize'
import { getDevConfig } from '@/utils/development'


export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signInWithGoogle, signInWithFacebook, signInWithEmail } = useAuth()
  const navigate = useNavigate()
  const devConfig = getDevConfig()

  // Rate limiting
  const loginRateLimit = useRateLimit({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  })

  // TEMPORÁRIO: Verificar se é o usuário de teste
  const isTestUser = email.toLowerCase().trim() === 'review.user@adsmart.app'
  const skipRecaptcha = devConfig.skipRecaptcha || isTestUser

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Verificar rate limit
    if (!loginRateLimit.checkLimit()) {
      setError(loginRateLimit.message)
      setLoading(false)
      return
    }

    // Sanitizar inputs
    const sanitizedEmail = sanitizeEmail(email)
    const sanitizedName = name ? sanitizeInput(name) : ''

    try {
      if (isLogin) {
        // Verificar ReCAPTCHA no login - apenas se não for desenvolvimento ou usuário de teste
        if (!skipRecaptcha && !recaptchaValue) {
          throw new Error('Por favor, complete o ReCAPTCHA')
        }
        
        // Passa o token do ReCAPTCHA para validação (ou 'test-user' se for usuário de teste)
        await signInWithEmail(
          sanitizedEmail, 
          password, 
          skipRecaptcha ? (isTestUser ? 'test-user' : devConfig.devRecaptchaToken) : (recaptchaValue || undefined)
        )
      } else {
        // Verificar ReCAPTCHA no registro também
        if (!skipRecaptcha && !recaptchaValue) {
          throw new Error('Por favor, complete o ReCAPTCHA')
        }

        // Validar senha no registro
        const passwordErrors = validatePassword(password)
        if (passwordErrors.length > 0) {
          setError(passwordErrors.join('. '))
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem')
        }

        if (!sanitizedName.trim()) {
          throw new Error('Nome é obrigatório')
        }

        await createUserWithEmailAndPassword(auth, sanitizedEmail, password)
      }
      navigate('/dashboard')
    } catch (error: any) {
      let errorMessage = 'Erro ao processar solicitação'
      
      // Mensagens de erro mais amigáveis
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta'
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      
      // Verificar rate limit também para login social
      if (!loginRateLimit.checkLimit()) {
        setError(loginRateLimit.message)
        return
      }

      await signInWithGoogle()
      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login com Google')
    }
  }

  const handleFacebookSignIn = async () => {
    try {
      setError('')
      
      // Verificar rate limit também para login social
      if (!loginRateLimit.checkLimit()) {
        setError(loginRateLimit.message)
        return
      }

      await signInWithFacebook()
      navigate('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Erro ao fazer login com Facebook')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-[30px]">
      <div className="w-full max-w-[480px]">
        {/* Header com logo */}
        <div className="text-center mb-0">
          <img 
            src="https://i.imgur.com/T6AehDg.png" 
            alt="adsmart" 
            className="h-16 mx-auto mb-6 object-contain"
          />
          <h1 className="text-[40px] font-normal mb-[10px] text-black">
            Entre na <span className="font-bold">ads</span>mart
          </h1>
          <p className="text-base text-gray-600 mb-[15px]">
            Por favor preencha os detalhes abaixo
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          {/* Aviso de desenvolvimento */}
          {devConfig.skipRecaptcha && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-600 text-sm">
              {devConfig.devWarningMessage}
            </div>
          )}

          {/* Aviso para usuário de teste */}
          {isTestUser && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">
              Conta de teste identificada - ReCAPTCHA desabilitado
            </div>
          )}

          {/* Rate limit warning */}
          {loginRateLimit.isBlocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {loginRateLimit.message}
            </div>
          )}

          {loginRateLimit.remainingAttempts < 3 && !loginRateLimit.isBlocked && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              Atenção: Você tem apenas {loginRateLimit.remainingAttempts} tentativas restantes.
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading || loginRateLimit.isBlocked}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#A7A8AE] hover:bg-[#919298] text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="20" height="20" viewBox="0 0 27 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 14C0 6.5561 6.0561 0.5 13.5 0.5C16.5064 0.5 19.3519 1.46724 21.7291 3.2972L18.5919 7.3724C17.1221 6.24097 15.3613 5.64286 13.5 5.64286C8.89187 5.64286 5.14286 9.39187 5.14286 14C5.14286 18.6081 8.89187 22.3571 13.5 22.3571C17.2115 22.3571 20.3655 19.9255 21.4524 16.5714H13.5V11.4286H27V14C27 21.4439 20.9439 27.5 13.5 27.5C6.0561 27.5 0 21.4439 0 14Z" fill="black"/>
              </svg>
              Entrar com Google
            </button>
            
            <button 
              onClick={handleFacebookSignIn}
              disabled={loading || loginRateLimit.isBlocked}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#A7A8AE] hover:bg-[#919298] text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="12" height="20" viewBox="0 0 15 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.64738 27.8633V15.2167H13.8906L14.5272 10.2867H9.64738V7.13954C9.64738 5.71262 10.042 4.74019 12.0905 4.74019L14.699 4.73912V0.329495C14.2479 0.270874 12.6994 0.136475 10.8972 0.136475C7.13383 0.136475 4.55737 2.43359 4.55737 6.65127V10.2867H0.30127V15.2167H4.55737V27.8633H9.64738Z" fill="black"/>
              </svg>
              Entrar com Facebook
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Digite seu nome *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0181F2] focus:ring-1 focus:ring-[#0181F2]"
                  required={!isLogin}
                  disabled={loading || loginRateLimit.isBlocked}
                  maxLength={100}
                />
                
                {/* Indicador de força da senha durante registro */}
                {!isLogin && password && (
                  <div className="text-xs text-gray-600">
                    <p>A senha deve conter:</p>
                    <ul className="mt-1 space-y-1">
                      <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Mínimo 8 caracteres
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Uma letra maiúscula
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Uma letra minúscula
                      </li>
                      <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Um número
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ Um caractere especial
                      </li>
                    </ul>
                  </div>
                )}
              </>
            )}

            <input
              type="email"
              placeholder="Digite seu email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0181F2] focus:ring-1 focus:ring-[#0181F2]"
              required
              disabled={loading || loginRateLimit.isBlocked}
              maxLength={255}
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite a sua senha *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 pr-12 border border-gray-200 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0181F2] focus:ring-1 focus:ring-[#0181F2]"
                required
                disabled={loading || loginRateLimit.isBlocked}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading || loginRateLimit.isBlocked}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  )}
                </svg>
              </button>
            </div>

            {!isLogin && (
              <input
                type="password"
                placeholder="Digite a sua senha novamente *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-4 border border-gray-200 rounded text-sm text-black placeholder-gray-400 focus:outline-none focus:border-[#0181F2] focus:ring-1 focus:ring-[#0181F2]"
                required={!isLogin}
                disabled={loading || loginRateLimit.isBlocked}
                maxLength={128}
              />
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0181F2] focus:ring-[#0181F2]"
                  disabled={loading || loginRateLimit.isBlocked}
                />
                <span className="text-sm text-gray-700">Lembrar-me</span>
              </label>
              
              {isLogin && (
                <Link to="/forgot-password" className="text-sm text-[#0181F2] hover:underline">
                  Esqueci minha senha
                </Link>
              )}
            </div>

            {/* ReCAPTCHA - Para login e registro (desabilitado para usuário de teste) */}
            {!skipRecaptcha && (
              <div className="flex justify-center py-4">
                <ReCAPTCHA
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LdqBIArAAAAAKUy6KnIxkzAXKsZrAgEjtfgcWjk"}
                  onChange={(value) => setRecaptchaValue(value)}
                  onExpired={() => setRecaptchaValue(null)}
                  size="normal"
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!skipRecaptcha && !recaptchaValue) || loginRateLimit.isBlocked}
              className="w-full h-11 bg-black text-white rounded text-base font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Registrar')}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            {isLogin ? (
              <>
                Não tem uma conta?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setError('')
                    setRecaptchaValue(null)
                  }}
                  className="text-black font-semibold hover:underline"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  Inscreva-se
                </button>
              </>
            ) : (
              <>
                Já possui uma conta?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setError('')
                    setRecaptchaValue(null)
                  }}
                  className="text-black font-semibold hover:underline"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  Fazer login
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer Links */}
        <div className="flex items-center justify-center gap-6 mt-8 mb-[30px] text-sm">
          <Link to="/terms" className="text-gray-600 hover:text-gray-900 hover:underline">
            Termos de Uso
          </Link>
          <span className="text-gray-400">•</span>
          <Link to="/privacy" className="text-gray-600 hover:text-gray-900 hover:underline">
            Políticas de Privacidade
          </Link>
        </div>
      </div>
    </div>
  )
}