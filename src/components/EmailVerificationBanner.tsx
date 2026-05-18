import { sendEmailVerification } from 'firebase/auth'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { authErrorToTKey } from '@/lib/auth/errorMessages'

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
          {sending
            ? t('common.emailVerification.resending')
            : t('common.emailVerification.resendButton')}
        </button>
      )}
    </div>
  )
}
