import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { AdAccount } from '@/types'

interface ConnectedAccountsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: 'google_ads' | 'meta_ads'
  accounts: AdAccount[]
  onDisconnectAccount: (accountId: string) => Promise<void>
}

export function ConnectedAccountsModal({
  open,
  onOpenChange,
  platform,
  accounts,
  onDisconnectAccount,
}: ConnectedAccountsModalProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.accountId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingId(accountId)
    try {
      await onDisconnectAccount(accountId)
    } finally {
      setDisconnectingId(null)
    }
  }

  const platformIcon =
    platform === 'google_ads' ? (
      <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path
          d="m57.193 15.502c-7.021-4.054-15.985-1.653-20.039 5.37l-25.162 43.583c-6.494 11.247 3.912 24.878 16.501 21.504 3.785-1.014 6.948-3.442 8.907-6.835l25.162-43.583c4.045-7.005 1.636-15.994-5.369-20.039z"
          fill="#fabc04"
        />
        <path
          d="m88.038 64.455-25.163-43.583c-1.959-3.393-5.123-5.821-8.907-6.835-12.593-3.375-22.991 10.262-16.501 21.504l25.163 43.583c4.053 7.019 13.015 9.425 20.039 5.37 7.004-4.045 9.413-13.034 5.369-20.039z"
          fill="#3c8bd9"
        />
        <path
          d="m38.865 67.993c-2.098-7.831-10.134-12.472-17.966-10.373-12.593 3.374-14.78 20.383-3.538 26.874 11.216 6.475 24.897-3.84 21.504-16.501z"
          fill="#34a852"
        />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient
            id="meta-gradient-connected"
            x1="5.3"
            x2="506.8"
            y1="255.9"
            y2="255.9"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#0064e0" />
            <stop offset=".1" stopColor="#0075f0" />
            <stop offset=".8" stopColor="#007df6" />
            <stop offset="1" stopColor="#0082fc" />
          </linearGradient>
        </defs>
        <path
          d="m149.4 89.4c-81.6 0-144.1 106.2-144.1 218.5 0 70.3 34 114.7 91 114.7 41 0 70.5-19.3 123-111 0 0 21.9-38.6 36.9-65.2l31.2-52.8c26.5-40.9 48.4-61.3 74.4-61.3 54 0 97.2 79.5 97.2 177.2 0 37.2-12.2 58.8-37.5 58.8-24.2 0-35.8-16-81.8-90l-42.3 36.9c47.9 80.2 74.6 107.4 123 107.4 55.5 0 86.4-45.1 86.4-116.9 0-117.7-63.9-216.5-141.6-216.5-41.1 0-73.3 31-102.4 70.3l-32.3 47.4c-31.9 49-51.3 79.7-51.3 79.7-42.5 66.7-57.2 81.6-80.9 81.6-24.4 0-38.8-21.4-38.8-59.5 0-81.6 40.7-165 89.2-165z"
          fill="url(#meta-gradient-connected)"
        />
      </svg>
    )

  const platformName = platform === 'google_ads' ? 'Google Ads' : 'Meta Ads'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] max-w-[600px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="dialog-description"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]">
            <div className="px-6 pt-6 pb-4 border-b border-[var(--separator)]">
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>

              <DialogPrimitive.Title className="flex items-center gap-3 mb-1">
                {platformIcon}
                <div className="text-xl font-semibold">
                  {t('connectedAccountsModal.title')} - {platformName}
                </div>
              </DialogPrimitive.Title>
              <div id="dialog-description" className="text-sm text-[var(--text-3)] ml-9">
                {accounts.length} {t('accountSelectionModal.selected').toLowerCase()}
              </div>
            </div>

            <div className="p-4 border-b border-[var(--separator)] bg-[var(--bg-elev-2)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-3)]" />
                <input
                  type="text"
                  placeholder={t('connectedAccountsModal.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex flex-col gap-2">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between gap-3 bg-[var(--bg)] border border-[var(--border)] px-4 py-3.5 rounded-[14px]"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-[650] text-[var(--text)] truncate">
                            {account.accountName}
                          </div>
                          <div className="text-[12px] font-medium text-[var(--text-3)] truncate mt-0.5">
                            ID: {account.accountId}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        title={t('connectedAccountsModal.disconnectTooltip')}
                        onClick={() => handleDisconnect(account.id)}
                        disabled={disconnectingId === account.id}
                        className="p-2 text-[var(--text-3)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[var(--text-3)] text-sm">
                    Nenhuma conta encontrada com esse termo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
