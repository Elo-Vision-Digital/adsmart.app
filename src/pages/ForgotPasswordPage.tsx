import { sendPasswordResetEmail } from 'firebase/auth'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
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
      setSent(true)
    } catch (err) {
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

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="absolute top-8 right-8">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-[420px]">
          <div className="lg:hidden mb-8 flex justify-center">
            <img
              src="https://i.imgur.com/T6AehDg.png"
              alt="adsmart"
              className="h-12 object-contain"
            />
          </div>

          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.button.back')}
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              {t('forgotPasswordPage.title')}
            </h2>
            <p className="text-gray-500 text-sm">{t('forgotPasswordPage.subtitle')}</p>
          </div>

          <div className="relative">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="p-4 bg-green-50/50 border border-green-200 rounded-lg flex flex-col items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                  <p className="text-green-700 font-medium">{t('forgotPasswordPage.success')}</p>
                </div>
                <Link
                  to="/login"
                  className="inline-block w-full h-11 leading-[44px] bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all active:scale-[0.98]"
                >
                  {t('forgotPasswordPage.backToLogin')}
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50/50 border border-red-100 rounded-lg text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('common.form.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black focus:bg-white transition-all"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-sm mt-4"
                >
                  {loading ? t('forgotPasswordPage.sending') : t('forgotPasswordPage.button')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
