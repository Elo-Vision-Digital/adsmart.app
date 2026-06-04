import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  ArrowLeft,
  Building,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  Plus,
  User,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/contexts/LanguageContext'
import { useProjects } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

export const COMMON_TIMEZONES = [
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
]

export interface AccountOption {
  id: string
  name: string
  email?: string
  type?: string
  currency?: string
  businessManager?: string
  businessManagerId?: string
}

export interface BusinessManagerGroup {
  id: string
  name: string
  accounts: AccountOption[]
}

export interface SelectedAccountDetail {
  accountId: string
  timezone: string
  projectId: string
}

interface AccountSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: 'google_ads' | 'meta_ads'
  accounts: AccountOption[]
  businessManagers?: BusinessManagerGroup[]
  mainAccountName: string
  mainAccountEmail?: string
  onConfirm: (accountsWithDetails: SelectedAccountDetail[]) => Promise<void>
}

export function AccountSelectionModal({
  open,
  onOpenChange,
  platform,
  accounts,
  businessManagers,
  mainAccountName,
  mainAccountEmail,
  onConfirm,
}: AccountSelectionModalProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [accountConfigs, setAccountConfigs] = useState<
    Record<string, { timezone: string; projectId: string }>
  >({})

  const [loading, setLoading] = useState(false)
  const [expandedBMs, setExpandedBMs] = useState<string[]>(['personal'])

  const { projects, loading: loadingProjects, createProject } = useProjects()
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  useMemo(() => {
    if (open) {
      setStep('select')
      setSelectedAccounts([])
      setAccountConfigs({})
      setIsCreatingProject(false)
      setNewProjectName('')
    }
  }, [open])

  const handleToggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) => {
      const isSelected = prev.includes(accountId)
      if (isSelected) {
        const next = prev.filter((id) => id !== accountId)
        const nextConfigs = { ...accountConfigs }
        delete nextConfigs[accountId]
        setAccountConfigs(nextConfigs)
        return next
      } else {
        const defaultTimezone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
        const defaultProjectId = projects.length > 0 ? projects[0].id : ''
        setAccountConfigs((curr) => ({
          ...curr,
          [accountId]: { timezone: defaultTimezone, projectId: defaultProjectId },
        }))
        return [...prev, accountId]
      }
    })
  }

  const handleToggleAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([])
      setAccountConfigs({})
    } else {
      const allIds = accounts.map((acc) => acc.id)
      setSelectedAccounts(allIds)

      const defaultTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
      const defaultProjectId = projects.length > 0 ? projects[0].id : ''
      const newConfigs: Record<string, { timezone: string; projectId: string }> = {}
      allIds.forEach((id) => {
        newConfigs[id] = { timezone: defaultTimezone, projectId: defaultProjectId }
      })
      setAccountConfigs(newConfigs)
    }
  }

  const handleToggleBM = (bmId: string) => {
    setExpandedBMs((prev) =>
      prev.includes(bmId) ? prev.filter((id) => id !== bmId) : [...prev, bmId]
    )
  }

  const handleToggleBMAccounts = (bmAccounts: AccountOption[]) => {
    const bmAccountIds = bmAccounts.map((acc) => acc.id)
    const allSelected = bmAccountIds.every((id) => selectedAccounts.includes(id))

    if (allSelected) {
      setSelectedAccounts((prev) => prev.filter((id) => !bmAccountIds.includes(id)))
      const nextConfigs = { ...accountConfigs }
      bmAccountIds.forEach((id) => {
        delete nextConfigs[id]
      })
      setAccountConfigs(nextConfigs)
    } else {
      setSelectedAccounts((prev) => [...new Set([...prev, ...bmAccountIds])])

      const defaultTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
      const defaultProjectId = projects.length > 0 ? projects[0].id : ''
      const nextConfigs = { ...accountConfigs }
      bmAccountIds.forEach((id) => {
        if (!nextConfigs[id]) {
          nextConfigs[id] = { timezone: defaultTimezone, projectId: defaultProjectId }
        }
      })
      setAccountConfigs(nextConfigs)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    setCreatingProject(true)
    try {
      const projectId = await createProject({
        name: newProjectName.trim(),
        initials: newProjectName.trim().substring(0, 2).toUpperCase(),
        color: '#1A73E8',
      })
      // Set the newly created project for all currently selected accounts without a project
      setAccountConfigs((curr) => {
        const next = { ...curr }
        Object.keys(next).forEach((accountId) => {
          if (!next[accountId].projectId) {
            next[accountId].projectId = projectId
          }
        })
        return next
      })
      setIsCreatingProject(false)
      setNewProjectName('')
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setCreatingProject(false)
    }
  }

  const handleConfirm = async () => {
    if (step === 'select') {
      setStep('configure')
      return
    }

    if (selectedAccounts.length === 0) return

    setLoading(true)
    try {
      const details: SelectedAccountDetail[] = selectedAccounts.map((id) => ({
        accountId: id,
        timezone: accountConfigs[id]?.timezone || 'America/Sao_Paulo',
        projectId: accountConfigs[id]?.projectId || '',
      }))
      await onConfirm(details)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  const isConfigValid = selectedAccounts.every((id) => accountConfigs[id]?.projectId)

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
            id="meta-gradient-selection"
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
          fill="url(#meta-gradient-selection)"
        />
      </svg>
    )

  const headerInfo =
    platform === 'google_ads'
      ? {
          icon: <User className="w-4 h-4 text-gray-500" />,
          label: t('accountSelectionModal.googleAccount'),
          value: mainAccountName,
          email: mainAccountEmail,
        }
      : {
          icon: <Mail className="w-4 h-4 text-gray-500" />,
          label: t('accountSelectionModal.metaAccount'),
          value: mainAccountEmail || mainAccountName,
          email: null,
        }

  const renderBusinessManagerGroups = () => {
    if (!businessManagers || businessManagers.length === 0) {
      return renderFlatAccountList()
    }

    return businessManagers.map((bm) => {
      const isExpanded = expandedBMs.includes(bm.id)
      const bmAccountIds = bm.accounts.map((acc) => acc.id)
      const selectedCount = bmAccountIds.filter((id) => selectedAccounts.includes(id)).length
      const allSelected = selectedCount === bm.accounts.length && bm.accounts.length > 0

      return (
        <div key={bm.id} className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg mb-2">
            <button
              onClick={() => handleToggleBM(bm.id)}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label={isExpanded ? 'Recolher' : 'Expandir'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <Building className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm flex-1">{bm.name}</span>
            <span className="text-xs text-gray-500">
              {selectedCount}/{bm.accounts.length} {t('accountSelectionModal.selected')}
            </span>
            {bm.accounts.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => handleToggleBMAccounts(bm.accounts)}
                aria-label={`Selecionar todas as contas de ${bm.name}`}
              />
            )}
          </div>

          {isExpanded && bm.accounts.length > 0 && (
            <div className="ml-6 space-y-2">
              {bm.accounts.map((account) => (
                <div
                  key={account.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                    selectedAccounts.includes(account.id)
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                  onClick={() => handleToggleAccount(account.id)}
                >
                  <Checkbox
                    id={account.id}
                    checked={selectedAccounts.includes(account.id)}
                    onCheckedChange={() => handleToggleAccount(account.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={account.id} className="block cursor-pointer">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {account.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {account.id && <span>ID: {account.id}</span>}
                        {account.currency && <span>• {account.currency}</span>}
                        {account.type && <span>• {account.type}</span>}
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isExpanded && bm.accounts.length === 0 && (
            <div className="ml-6 p-3 text-sm text-gray-500 dark:text-gray-400 italic">
              {t('accountSelectionModal.noActiveAccounts')}
            </div>
          )}
        </div>
      )
    })
  }

  const renderFlatAccountList = () => {
    return accounts.map((account) => (
      <div
        key={account.id}
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
          selectedAccounts.includes(account.id)
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        )}
        onClick={() => handleToggleAccount(account.id)}
      >
        <Checkbox
          id={account.id}
          checked={selectedAccounts.includes(account.id)}
          onCheckedChange={() => handleToggleAccount(account.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <label htmlFor={account.id} className="block cursor-pointer">
            <p className="font-medium text-gray-900 dark:text-white truncate">{account.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {account.id && <span>ID: {account.id}</span>}
              {account.currency && <span>• {account.currency}</span>}
              {account.type && <span>• {account.type}</span>}
              {account.businessManager && <span>• {account.businessManager}</span>}
            </div>
          </label>
        </div>
      </div>
    ))
  }

  const renderConfigureAccounts = () => {
    const selectedAccsData = accounts.filter((a) => selectedAccounts.includes(a.id))
    return (
      <div className="space-y-4">
        {isCreatingProject && (
          <div className="p-4 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-slate-800/50 mb-4">
            <h4 className="text-sm font-semibold mb-2">
              {t('accountSelectionModal.createProject')}
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder={t('accountSelectionModal.projectNamePlaceholder')}
                className="flex-1 h-9 px-3 rounded-lg border border-[var(--border)] text-sm bg-[var(--bg)]"
              />
              <Button
                onClick={handleCreateProject}
                disabled={creatingProject || !newProjectName.trim()}
              >
                {creatingProject ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t('accountSelectionModal.create')
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingProject(false)}>
                {t('accountSelectionModal.cancel')}
              </Button>
            </div>
          </div>
        )}

        {selectedAccsData.map((acc) => (
          <div
            key={acc.id}
            className="p-4 rounded-xl border border-[var(--border)] bg-gray-50 dark:bg-slate-800/30"
          >
            <div className="mb-3">
              <p className="font-medium text-gray-900 dark:text-white">{acc.name}</p>
              <p className="text-xs text-gray-500">ID: {acc.id}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('accountSelectionModal.timezone')}
                </label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] text-sm bg-[var(--bg)]"
                  value={accountConfigs[acc.id]?.timezone || 'America/Sao_Paulo'}
                  onChange={(e) =>
                    setAccountConfigs((curr) => ({
                      ...curr,
                      [acc.id]: { ...curr[acc.id], timezone: e.target.value },
                    }))
                  }
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>{t('accountSelectionModal.project')}</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(true)}
                    className="text-primary flex items-center hover:underline"
                  >
                    <Plus size={12} className="mr-0.5" /> {t('accountSelectionModal.newProject')}
                  </button>
                </label>
                <select
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] text-sm bg-[var(--bg)]"
                  value={accountConfigs[acc.id]?.projectId || ''}
                  onChange={(e) =>
                    setAccountConfigs((curr) => ({
                      ...curr,
                      [acc.id]: { ...curr[acc.id], projectId: e.target.value },
                    }))
                  }
                >
                  <option value="" disabled>
                    {t('accountSelectionModal.selectProject')}
                  </option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] max-w-[700px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="dialog-description"
        >
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>

              <DialogPrimitive.Title className="flex items-center gap-3 mb-4">
                {step === 'configure' && (
                  <button
                    onClick={() => setStep('select')}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                {platformIcon}
                <div className="text-xl font-semibold">
                  {step === 'select'
                    ? t('accountSelectionModal.stepAccounts')
                    : t('accountSelectionModal.stepConfigure')}
                </div>
              </DialogPrimitive.Title>

              <div id="dialog-description" className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  {headerInfo.icon}
                  <span className="text-gray-600 dark:text-gray-400">{headerInfo.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {headerInfo.value}
                  </span>
                </div>
                {headerInfo.email && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">{headerInfo.email}</p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin' }}>
              {step === 'select' ? (
                accounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma conta de anúncios encontrada.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg mb-3">
                      <Checkbox
                        id="select-all"
                        checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                        onCheckedChange={handleToggleAll}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        Selecionar todas ({accounts.length})
                      </label>
                    </div>

                    {businessManagers ? renderBusinessManagerGroups() : renderFlatAccountList()}
                  </div>
                )
              ) : loadingProjects ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-gray-500">Carregando projetos...</p>
                </div>
              ) : (
                renderConfigureAccounts()
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAccounts.length} / {accounts.length}{' '}
                  {t('accountSelectionModal.selected')}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                    {t('accountSelectionModal.cancel')}
                  </Button>
                  {step === 'select' ? (
                    <Button onClick={handleConfirm} disabled={selectedAccounts.length === 0}>
                      {t('accountSelectionModal.continue')}
                    </Button>
                  ) : (
                    <Button onClick={handleConfirm} disabled={loading || !isConfigValid}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        t('accountSelectionModal.confirm')
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
