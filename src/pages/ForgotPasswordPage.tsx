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
