import { useState } from 'react'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Loader2, Building, User, ChevronDown, ChevronRight, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface AccountSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: 'google_ads' | 'meta_ads'
  accounts: AccountOption[]
  businessManagers?: BusinessManagerGroup[]  // Nova prop para BMs organizadas
  mainAccountName: string
  mainAccountEmail?: string
  onConfirm: (selectedAccounts: string[]) => Promise<void>
}

export function AccountSelectionModal({
  open,
  onOpenChange,
  platform,
  accounts,
  businessManagers,
  mainAccountName,
  mainAccountEmail,
  onConfirm
}: AccountSelectionModalProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedBMs, setExpandedBMs] = useState<string[]>(['personal']) // Expandir "Contas Pessoais" por padrão

  const handleToggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const handleToggleAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(accounts.map(acc => acc.id))
    }
  }

  const handleToggleBM = (bmId: string) => {
    setExpandedBMs(prev =>
      prev.includes(bmId)
        ? prev.filter(id => id !== bmId)
        : [...prev, bmId]
    )
  }

  const handleToggleBMAccounts = (bmAccounts: AccountOption[]) => {
    const bmAccountIds = bmAccounts.map(acc => acc.id)
    const allSelected = bmAccountIds.every(id => selectedAccounts.includes(id))
    
    if (allSelected) {
      setSelectedAccounts(prev => prev.filter(id => !bmAccountIds.includes(id)))
    } else {
      setSelectedAccounts(prev => [...new Set([...prev, ...bmAccountIds])])
    }
  }

  const handleConfirm = async () => {
    if (selectedAccounts.length === 0) return
    
    setLoading(true)
    try {
      await onConfirm(selectedAccounts)
      onOpenChange(false)
    } catch (error) {
      console.error('Erro ao salvar contas:', error)
    } finally {
      setLoading(false)
    }
  }

  const platformIcon = platform === 'google_ads' ? (
    <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="m57.193 15.502c-7.021-4.054-15.985-1.653-20.039 5.37l-25.162 43.583c-6.494 11.247 3.912 24.878 16.501 21.504 3.785-1.014 6.948-3.442 8.907-6.835l25.162-43.583c4.045-7.005 1.636-15.994-5.369-20.039z" fill="#fabc04"/>
      <path d="m88.038 64.455-25.163-43.583c-1.959-3.393-5.123-5.821-8.907-6.835-12.593-3.375-22.991 10.262-16.501 21.504l25.163 43.583c4.053 7.019 13.015 9.425 20.039 5.37 7.004-4.045 9.413-13.034 5.369-20.039z" fill="#3c8bd9"/>
      <path d="m38.865 67.993c-2.098-7.831-10.134-12.472-17.966-10.373-12.593 3.374-14.78 20.383-3.538 26.874 11.216 6.475 24.897-3.84 21.504-16.501z" fill="#34a852"/>
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="meta-gradient-selection" x1="5.3" x2="506.8" y1="255.9" y2="255.9" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0064e0"/>
          <stop offset=".1" stopColor="#0075f0"/>
          <stop offset=".8" stopColor="#007df6"/>
          <stop offset="1" stopColor="#0082fc"/>
        </linearGradient>
      </defs>
      <path d="m149.4 89.4c-81.6 0-144.1 106.2-144.1 218.5 0 70.3 34 114.7 91 114.7 41 0 70.5-19.3 123-111 0 0 21.9-38.6 36.9-65.2l31.2-52.8c26.5-40.9 48.4-61.3 74.4-61.3 54 0 97.2 79.5 97.2 177.2 0 37.2-12.2 58.8-37.5 58.8-24.2 0-35.8-16-81.8-90l-42.3 36.9c47.9 80.2 74.6 107.4 123 107.4 55.5 0 86.4-45.1 86.4-116.9 0-117.7-63.9-216.5-141.6-216.5-41.1 0-73.3 31-102.4 70.3l-32.3 47.4c-31.9 49-51.3 79.7-51.3 79.7-42.5 66.7-57.2 81.6-80.9 81.6-24.4 0-38.8-21.4-38.8-59.5 0-81.6 40.7-165 89.2-165z" fill="url(#meta-gradient-selection)"/>
    </svg>
  )

  // Função melhorada para obter o texto do header
  const getHeaderText = () => {
    if (platform === 'google_ads') {
      return {
        icon: <User className="w-4 h-4 text-gray-500" />,
        label: 'Conta Google:',
        value: mainAccountName,
        email: mainAccountEmail
      }
    } else {
      // Para Meta Ads, sempre mostrar o email como principal
      return {
        icon: <Mail className="w-4 h-4 text-gray-500" />,
        label: 'Conta Facebook:',
        value: mainAccountEmail || mainAccountName, // Priorizar email
        email: null // Não mostrar email duplicado se já estiver no value
      }
    }
  }

  const headerInfo = getHeaderText()

  // Renderizar contas organizadas por BM se disponível
  const renderBusinessManagerGroups = () => {
    if (!businessManagers || businessManagers.length === 0) {
      return renderFlatAccountList()
    }

    return businessManagers.map((bm) => {
      const isExpanded = expandedBMs.includes(bm.id)
      const bmAccountIds = bm.accounts.map(acc => acc.id)
      const selectedCount = bmAccountIds.filter(id => selectedAccounts.includes(id)).length
      const allSelected = selectedCount === bm.accounts.length && bm.accounts.length > 0

      return (
        <div key={bm.id} className="mb-4">
          {/* BM Header */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg mb-2">
            <button
              onClick={() => handleToggleBM(bm.id)}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
              aria-label={isExpanded ? "Recolher" : "Expandir"}
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
              {selectedCount}/{bm.accounts.length} selecionada{selectedCount !== 1 ? 's' : ''}
            </span>
            {bm.accounts.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => handleToggleBMAccounts(bm.accounts)}
                aria-label={`Selecionar todas as contas de ${bm.name}`}
              />
            )}
          </div>

          {/* BM Accounts */}
          {isExpanded && bm.accounts.length > 0 && (
            <div className="ml-6 space-y-2">
              {bm.accounts.map((account) => (
                <div 
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    selectedAccounts.includes(account.id) 
                      ? "border-primary bg-primary/5 dark:bg-primary/10" 
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                    <label 
                      htmlFor={account.id} 
                      className="block cursor-pointer"
                    >
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
          
          {/* Mensagem se BM não tem contas */}
          {isExpanded && bm.accounts.length === 0 && (
            <div className="ml-6 p-3 text-sm text-gray-500 dark:text-gray-400 italic">
              Nenhuma conta de anúncios ativa neste Business Manager
            </div>
          )}
        </div>
      )
    })
  }

  // Renderizar lista plana de contas (fallback)
  const renderFlatAccountList = () => {
    return accounts.map((account) => (
      <div 
        key={account.id}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
          selectedAccounts.includes(account.id) 
            ? "border-primary bg-primary/5 dark:bg-primary/10" 
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
          <label 
            htmlFor={account.id} 
            className="block cursor-pointer"
          >
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {account.name}
            </p>
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
                {platformIcon}
                <h2 className="text-xl font-semibold">
                  Selecionar Contas de Anúncios
                </h2>
              </DialogPrimitive.Title>

              <div id="dialog-description" className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  {headerInfo.icon}
                  <span className="text-gray-600 dark:text-gray-400">
                    {headerInfo.label}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {headerInfo.value}
                  </span>
                </div>
                {headerInfo.email && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {headerInfo.email}
                  </p>
                )}
              </div>
            </div>
            
            {/* Account List */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{scrollbarWidth: 'thin'}}>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma conta de anúncios encontrada.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select All */}
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

                  {/* Render accounts */}
                  {businessManagers ? renderBusinessManagerGroups() : renderFlatAccountList()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAccounts.length} de {accounts.length} conta{accounts.length !== 1 ? 's' : ''} selecionada{selectedAccounts.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirm}
                    disabled={selectedAccounts.length === 0 || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Confirmar Seleção'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}