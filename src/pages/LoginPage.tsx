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
              <>
                Entre na <span className="font-bold">ads</span>mart
              </>
            ) : (
              <>
                Crie sua conta <span className="font-bold">ads</span>mart
              </>
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
              {t('common.warning.rateLimitRemaining').replace(
                '{attempts}',
                loginRateLimit.remainingAttempts.toString()
              )}
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 27 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 14C0 6.5561 6.0561 0.5 13.5 0.5C16.5064 0.5 19.3519 1.46724 21.7291 3.2972L18.5919 7.3724C17.1221 6.24097 15.3613 5.64286 13.5 5.64286C8.89187 5.64286 5.14286 9.39187 5.14286 14C5.14286 18.6081 8.89187 22.3571 13.5 22.3571C17.2115 22.3571 20.3655 19.9255 21.4524 16.5714H13.5V11.4286H27V14C27 21.4439 20.9439 27.5 13.5 27.5C6.0561 27.5 0 21.4439 0 14Z"
                  fill="black"
                />
              </svg>
              {t('common.button.loginWithGoogle')}
            </button>

            <button
              onClick={handleFacebookSignIn}
              disabled={loading || loginRateLimit.isBlocked}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#A7A8AE] hover:bg-[#919298] text-white rounded transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                width="12"
                height="20"
                viewBox="0 0 15 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.64738 27.8633V15.2167H13.8906L14.5272 10.2867H9.64738V7.13954C9.64738 5.71262 10.042 4.74019 12.0905 4.74019L14.699 4.73912V0.329495C14.2479 0.270874 12.6994 0.136475 10.8972 0.136475C7.13383 0.136475 4.55737 2.43359 4.55737 6.65127V10.2867H0.30127V15.2167H4.55737V27.8633H9.64738Z"
                  fill="black"
                />
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
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                  onClick={() => {
                    setIsLogin(false)
                    setError('')
                  }}
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
                  onClick={() => {
                    setIsLogin(true)
                    setError('')
                  }}
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
