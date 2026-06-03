import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { OAuthProviders } from '@/components/auth/OAuthProviders'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRateLimit } from '@/hooks/useRateLimit'
import { authErrorToTKey } from '@/lib/auth/errorMessages'
import { isAuthError } from '@/lib/auth/errors'
import type { LoginFormData, RegisterFormData } from '@/schemas/authSchemas'
import { sanitizeEmail } from '@/utils/sanitize'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
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

  const handleError = (err: unknown) => {
    if (isAuthError(err)) {
      setError(t(authErrorToTKey(err)))
    } else if (err instanceof Error && err.message) {
      setError(err.message)
    } else {
      setError(t('common.error.generic'))
    }
  }

  const handleLoginSubmit = async (data: LoginFormData) => {
    setError('')
    setLoading(true)

    if (!loginRateLimit.checkLimit()) {
      setError(loginRateLimit.message)
      setLoading(false)
      return
    }

    try {
      const sanitizedEmail = sanitizeEmail(data.email)
      await signInWithEmail(sanitizedEmail, data.password)
      navigate('/dashboard')
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setError('')
    setLoading(true)

    if (!loginRateLimit.checkLimit()) {
      setError(loginRateLimit.message)
      setLoading(false)
      return
    }

    try {
      const sanitizedEmail = sanitizeEmail(data.email)
      await signUp(sanitizedEmail, data.password)
      navigate('/dashboard')
    } catch (err) {
      handleError(err)
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
      handleError(err)
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
      handleError(err)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
  }

  return (
    <div className="min-h-screen bg-white flex w-full">
      {/* Left Panel - Branding & Value Prop */}
      <div className="hidden lg:flex flex-1 relative bg-black overflow-hidden flex-col justify-between p-12">
        {/* Minimalist Background Effects (Monochrome) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-white/5 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <img
            src="https://i.imgur.com/T6AehDg.png"
            alt="adsmart"
            className="h-10 object-contain filter invert brightness-0"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6 tracking-tight">
              Acelere as suas
              <br />
              <span className="text-gray-300">campanhas e relatórios</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              Conecte suas contas do Google Ads e Meta Ads em um só lugar. Tenha visão total das
              suas métricas sem planilhas intermináveis.
            </p>

            <div className="space-y-4">
              {[
                'Dashboards em tempo real integrados',
                'Pague apenas pelo que utilizar',
                'Suporte multilíngue (PT, EN, ES)',
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 text-gray-300"
                >
                  <CheckCircle2 className="text-white w-5 h-5 flex-shrink-0" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} AdSmart</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <Link to="/terms" className="hover:text-white transition-colors">
            Termos
          </Link>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <Link to="/privacy" className="hover:text-white transition-colors">
            Privacidade
          </Link>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute top-8 right-8">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <img
              src="https://i.imgur.com/T6AehDg.png"
              alt="adsmart"
              className="h-12 object-contain"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              {isLogin ? t('common.button.login') : t('common.button.signUp')}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin ? t('loginPage.subtitle.login') : t('loginPage.subtitle.signUp')}
            </p>
          </div>

          {loginRateLimit.isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-lg text-red-600 text-sm flex items-start gap-3"
            >
              {loginRateLimit.message}
            </motion.div>
          )}
          {loginRateLimit.remainingAttempts < 3 && !loginRateLimit.isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50/50 border border-amber-100 rounded-lg text-amber-700 text-sm"
            >
              {t('common.warning.rateLimitRemaining').replace(
                '{attempts}',
                loginRateLimit.remainingAttempts.toString()
              )}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <OAuthProviders
            onGoogleSignIn={handleGoogleSignIn}
            onFacebookSignIn={handleFacebookSignIn}
            disabled={loading || loginRateLimit.isBlocked}
          />

          <div className="mt-8 relative">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm
                    onSubmit={handleLoginSubmit}
                    loading={loading}
                    disabled={loginRateLimit.isBlocked}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegisterForm
                    onSubmit={handleRegisterSubmit}
                    loading={loading}
                    disabled={loginRateLimit.isBlocked}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            {isLogin ? (
              <>
                {t('loginPage.message.noAccount')}{' '}
                <button
                  onClick={toggleMode}
                  className="text-black font-semibold hover:text-gray-700 transition-colors"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  {t('common.button.signUp')}
                </button>
              </>
            ) : (
              <>
                {t('loginPage.message.haveAccount')}{' '}
                <button
                  onClick={toggleMode}
                  className="text-black font-semibold hover:text-gray-700 transition-colors"
                  disabled={loading || loginRateLimit.isBlocked}
                >
                  {t('common.button.login')}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
