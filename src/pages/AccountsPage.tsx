import { AdAccountSchema } from '@adsmart/shared'
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { AlertCircle, ArrowLeft, Database, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import {
  type AccountOption,
  AccountSelectionModal,
  type BusinessManagerGroup,
} from '@/components/ui/AccountSelectionModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast, useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { db, functions } from '@/firebase/config'
import { zodConverter } from '@/schemas/firestore-converter'
import { oauthService } from '@/services/oauthServices'
import type { AdAccount } from '@/types'
import { addMockAccounts } from '@/utils/mockAccounts'

// Componente para ícone do Google Ads
const GoogleAdsIcon = () => (
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
)

// Componente para ícone do Meta Ads
const MetaAdsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient
        id="meta-gradient-accounts"
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
      fill="url(#meta-gradient-accounts)"
    />
  </svg>
)

interface OAuthData {
  success: boolean
  accountsAvailable: AccountOption[]
  businessManagers?: BusinessManagerGroup[]
  mainAccount: {
    name: string
    email?: string
  }
  temporaryToken: string
}

export function AccountsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [connectingMeta, setConnectingMeta] = useState(false)
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [oauthData, setOauthData] = useState<OAuthData | null>(null)
  const [oauthPlatform, setOauthPlatform] = useState<'google_ads' | 'meta_ads'>('meta_ads')
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (!user) return

    const accountsRef = collection(db, 'users', user.uid, 'adAccounts').withConverter(
      zodConverter(AdAccountSchema, 'AdAccount')
    )
    const q = query(accountsRef, where('isActive', '==', true))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map((doc) => doc.data()))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Processar dados OAuth vindos do callback
  useEffect(() => {
    if (location.state?.oauthData && location.state?.platform) {
      const data = location.state.oauthData as OAuthData
      const platform = location.state.platform as 'google_ads' | 'meta_ads'

      // Limpar o state para evitar reprocessamento
      window.history.replaceState({}, document.title)

      // Mostrar modal de seleção
      setOauthData(data)
      setOauthPlatform(platform)
      setShowAccountSelection(true)
    }

    // Mostrar erro se houver
    if (location.state?.error) {
      showToast({
        message: location.state.error,
        type: 'error',
      })
      window.history.replaceState({}, document.title)
    }

    // Mostrar mensagem de sucesso se houver
    if (location.state?.success && location.state?.message) {
      showToast({
        message: location.state.message,
        type: 'success',
      })
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true)

      // Obter URL de autorização OAuth
      const authUrl = await oauthService.getGoogleAdsAuthUrl()

      // Redirecionar para o Google OAuth
      if (authUrl && authUrl !== '#') {
        window.location.href = authUrl
      }
    } catch (error: any) {
      console.error('Erro ao conectar Google Ads:', error)
      showToast({
        message: error.message || t('accountsPage.error.connectGoogle'),
        type: 'error',
      })
    } finally {
      setConnectingGoogle(false)
    }
  }

  const handleConnectMeta = async () => {
    try {
      setConnectingMeta(true)

      // Obter URL de autorização OAuth
      const authUrl = await oauthService.getMetaAdsAuthUrl()

      // Redirecionar para o Meta OAuth
      if (authUrl && authUrl !== '#') {
        window.location.href = authUrl
      }
    } catch (error: any) {
      console.error('Erro ao conectar Meta Ads:', error)
      showToast({
        message: error.message || t('accountsPage.error.connectMeta'),
        type: 'error',
      })
    } finally {
      setConnectingMeta(false)
    }
  }

  const handleRemoveAccount = async (accountId: string) => {
    if (!user) return

    if (confirm(t('accountsPage.confirmRemove'))) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'adAccounts', accountId))
      } catch (error) {
        console.error('Erro ao remover conta:', error)
      }
    }
  }

  const handleAddMockAccounts = async () => {
    if (!user) return
    try {
      await addMockAccounts(user.uid)
      showToast({
        message: t('accountsPage.mockAccountsAdded'),
        type: 'success',
      })
    } catch (error) {
      console.error('Erro ao adicionar contas mock:', error)
    }
  }

  const handleAccountSelection = async (selectedAccountIds: string[]) => {
    if (!oauthData || !user) return

    try {
      // Confirmar seleção de contas
      const functionName =
        oauthPlatform === 'google_ads'
          ? 'confirmGoogleAdsAccountSelection'
          : 'confirmMetaAdsAccountSelection'

      const confirmSelection = httpsCallable<
        { temporaryToken: string; selectedAccountIds: string[] },
        { success: boolean }
      >(functions, functionName)

      await confirmSelection({
        temporaryToken: oauthData.temporaryToken,
        selectedAccountIds,
      })

      // Fechar modal e mostrar sucesso
      setShowAccountSelection(false)
      setOauthData(null)

      const platformName = oauthPlatform === 'google_ads' ? 'Google Ads' : 'Meta Ads'

      showToast({
        message: t('accountsPage.accountsConnectedSuccess', {
          count: selectedAccountIds.length,
          platform: platformName,
        }),
        type: 'success',
      })
    } catch (error: any) {
      console.error('Erro ao confirmar seleção:', error)
      showToast({
        message: error.message || t('accountsPage.error.saveAccounts'),
        type: 'error',
      })
    }
  }

  const googleAccounts = accounts.filter((acc) => acc.platform === 'google_ads')
  const metaAccounts = accounts.filter((acc) => acc.platform === 'meta_ads')

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Container principal com overflow-x-hidden para prevenir scroll horizontal */}
        <div className="w-full overflow-x-hidden">
          <div className="px-4 py-4 md:p-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                    className="mb-4 -ml-2 md:ml-0"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    <span className="text-sm md:text-base">
                      {t('accountsPage.backToDashboard')}
                    </span>
                  </Button>

                  {process.env.NODE_ENV === 'development' && accounts.length === 0 && (
                    <Button
                      variant="outline"
                      onClick={handleAddMockAccounts}
                      className="mb-4"
                      size="sm"
                    >
                      <Database className="mr-2 h-4 w-4" />
                      <span className="hidden md:inline">{t('accountsPage.addDemoAccounts')}</span>
                      <span className="md:hidden">{t('accountsPage.demo')}</span>
                    </Button>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('accountsPage.title')}
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
                  {t('accountsPage.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Google Ads */}
                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700 w-full">
                  <CardHeader className="px-4 md:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <GoogleAdsIcon />
                          <span className="truncate">Google Ads</span>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {googleAccounts.length}{' '}
                          {googleAccounts.length === 1
                            ? t('accountsPage.accountConnected')
                            : t('accountsPage.accountsConnectedPlural')}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleConnectGoogle}
                        size="sm"
                        className="flex-shrink-0"
                        disabled={connectingGoogle}
                      >
                        {connectingGoogle ? (
                          <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-1 md:mr-2" />
                        )}
                        {t('accountsPage.connect')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6">
                    {loading ? (
                      <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                    ) : googleAccounts.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <p className="text-sm md:text-base">
                          {t('accountsPage.noAccountsConnected')}
                        </p>
                        <p className="text-xs md:text-sm mt-2">
                          {t('accountsPage.connectGoogleToStart')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {googleAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {account.accountName}
                              </p>
                              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="truncate">
                                  {account.email || account.accountId}
                                </span>
                                {account.lastSyncAt && (
                                  <span className="truncate">
                                    <span className="hidden md:inline">
                                      {t('accountsPage.synced')}:{' '}
                                    </span>
                                    {(() => {
                                      try {
                                        const date = (account.lastSyncAt as any).toDate
                                          ? (account.lastSyncAt as any).toDate()
                                          : new Date(account.lastSyncAt as any)
                                        return date.toLocaleDateString(t('common.locale'))
                                      } catch {
                                        return t('common.general.recently')
                                      }
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button variant="ghost" size="sm" disabled className="p-1.5 md:p-2">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAccount(account.id)}
                                className="p-1.5 md:p-2"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Meta Ads */}
                <Card className="bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700 w-full">
                  <CardHeader className="px-4 md:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                          <MetaAdsIcon />
                          <span className="truncate">Meta Ads</span>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {metaAccounts.length}{' '}
                          {metaAccounts.length === 1
                            ? t('accountsPage.accountConnected')
                            : t('accountsPage.accountsConnectedPlural')}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={handleConnectMeta}
                        size="sm"
                        className="flex-shrink-0"
                        disabled={connectingMeta}
                      >
                        {connectingMeta ? (
                          <Loader2 className="w-4 h-4 mr-1 md:mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-1 md:mr-2" />
                        )}
                        {t('accountsPage.connect')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6">
                    {loading ? (
                      <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                    ) : metaAccounts.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <p className="text-sm md:text-base">
                          {t('accountsPage.noAccountsConnected')}
                        </p>
                        <p className="text-xs md:text-sm mt-2">
                          {t('accountsPage.connectMetaToStart')}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {metaAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {account.accountName}
                              </p>
                              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="truncate">
                                  {account.email || account.accountId}
                                </span>
                                {account.lastSyncAt && (
                                  <span className="truncate">
                                    <span className="hidden md:inline">
                                      {t('accountsPage.synced')}:{' '}
                                    </span>
                                    {(() => {
                                      try {
                                        const date = (account.lastSyncAt as any).toDate
                                          ? (account.lastSyncAt as any).toDate()
                                          : new Date(account.lastSyncAt as any)
                                        return date.toLocaleDateString(t('common.locale'))
                                      } catch {
                                        return t('common.general.recently')
                                      }
                                    })()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button variant="ghost" size="sm" disabled className="p-1.5 md:p-2">
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAccount(account.id)}
                                className="p-1.5 md:p-2"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-4 md:mt-6 bg-[#FAFAFA] dark:bg-gray-800 border-[#EDEDED] dark:border-gray-700 w-full">
                <CardHeader className="px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <span>{t('accountsPage.importantInfo.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                    {t('accountsPage.importantInfo.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Contas */}
      {oauthData && (
        <AccountSelectionModal
          open={showAccountSelection}
          onOpenChange={setShowAccountSelection}
          platform={oauthPlatform}
          accounts={oauthData.accountsAvailable}
          businessManagers={oauthData.businessManagers}
          mainAccountName={oauthData.mainAccount.name}
          mainAccountEmail={oauthData.mainAccount.email}
          onConfirm={handleAccountSelection}
        />
      )}

      {/* Toasts */}
      {toasts.map(({ id, props }) => (
        <Toast key={id} {...props} onClose={() => removeToast(id)} />
      ))}
    </MainLayout>
  )
}
