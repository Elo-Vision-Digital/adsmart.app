import { httpsCallable } from 'firebase/functions'
import { Plus, RefreshCw, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { functions } from '@/firebase/config'

interface AddCreditsResponse {
  success?: boolean
  adminLimits?: { dailyTotalAfter: number; maxDailyAmount: number }
}

export function WalletAdminPage() {
  const { t } = useLanguage()
  const [targetEmail, setTargetEmail] = useState('')
  const [amountReais, setAmountReais] = useState('')
  const [reason, setReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    if (!targetEmail || !amountReais || !reason) {
      setMessage(t('admin.messages.fillFields'))
      return
    }
    const amount = Number.parseFloat(amountReais)
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage(t('admin.messages.invalidAmount'))
      return
    }
    if (reason.length < 10) {
      setMessage(t('admin.messages.reasonTooShort'))
      return
    }
    try {
      setAdding(true)
      setMessage('')
      const fn = httpsCallable(functions, 'addUserCredits')
      const result = await fn({
        targetEmail,
        amount: Math.round(amount * 100),
        reason,
      })
      const data = result.data as AddCreditsResponse
      if (data.success && data.adminLimits) {
        setMessage(
          t('admin.messages.creditsAddedToUser', {
            email: targetEmail,
            used: String(data.adminLimits.dailyTotalAfter),
            max: String(data.adminLimits.maxDailyAmount),
          })
        )
        setTargetEmail('')
        setAmountReais('')
        setReason('')
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (err) {
      console.error('[admin] failed to add credits:', err)
      const msg = err instanceof Error ? err.message : t('admin.messages.loadError')
      setMessage(msg)
    } finally {
      setAdding(false)
    }
  }

  const isError = message.toLowerCase().includes('erro') || message.toLowerCase().includes('error')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        {t('admin.wallet.title')}
      </h2>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            isError
              ? 'bg-red-100 text-red-800 border-red-200'
              : 'bg-green-100 text-green-800 border-green-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-2xl">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t('admin.wallet.addCreditsTitle')}
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="targetEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('admin.wallet.targetEmail')}
            </label>
            <input
              id="targetEmail"
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder={t('admin.wallet.targetEmailPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
          </div>

          <div>
            <label
              htmlFor="amountReais"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('admin.wallet.amount')}
            </label>
            <input
              id="amountReais"
              type="number"
              step="0.01"
              min="0"
              value={amountReais}
              onChange={(e) => setAmountReais(e.target.value)}
              placeholder={t('admin.wallet.amountPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.wallet.amountHint')}</p>
          </div>

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('admin.wallet.reason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.wallet.reasonPlaceholder')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('admin.wallet.reasonCounter', { count: String(reason.length) })}
            </p>
          </div>

          <Button
            onClick={submit}
            disabled={adding || !targetEmail || !amountReais || !reason || reason.length < 10}
            className="w-full"
          >
            {adding ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t('admin.wallet.adding')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                {t('admin.wallet.addCredits')}
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            {t('admin.wallet.limits.title')}
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• {t('admin.wallet.limits.addsRealBalance')}</li>
            <li>• {t('admin.wallet.limits.affectsProduction')}</li>
            <li>• {t('admin.wallet.limits.perTx')}</li>
            <li>• {t('admin.wallet.limits.daily')}</li>
            <li>• {t('admin.wallet.limits.txCount')}</li>
            <li>• {t('admin.wallet.limits.reasonRequired')}</li>
            <li>• {t('admin.wallet.limits.loggedWithIp')}</li>
            <li>• {t('admin.wallet.limits.useResponsibly')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
