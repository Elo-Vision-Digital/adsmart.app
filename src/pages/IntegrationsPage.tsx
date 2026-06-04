import { AdAccountSchema } from '@adsmart/shared'
import { collection, doc, onSnapshot, query, where, writeBatch } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { Bell, CheckCircle2, Loader2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import {
  type AccountOption,
  AccountSelectionModal,
  type BusinessManagerGroup,
} from '@/components/ui/AccountSelectionModal'
import { Toast, useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { db, functions } from '@/firebase/config'
import { zodConverter } from '@/schemas/firestore-converter'
import { oauthService } from '@/services/oauthServices'
import type { AdAccount } from '@/types'

const GoogleAdsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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

const MetaAdsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient
        id="meta-gradient-ints"
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
      fill="url(#meta-gradient-ints)"
    />
  </svg>
)

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#ffffff"
      d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"
    />
    <path
      fill="#ff0050"
      d="M381,102.39A122.18,122.18,0,0,1,327.13,22.17,121.18,121.18,0,0,1,325.27,0H237.23V278.2a74.62,74.62,0,1,1-52.23-71.18V188.31A162.55,162.55,0,1,0,325.27,349.38V209.91A210.06,210.06,0,0,0,448,249.16v-88A121.43,121.43,0,0,1,381,102.39Z"
      style={{ mixBlendMode: 'screen' }}
    />
    <path
      fill="#00f2fe"
      d="M448,209.91v88A210.06,210.06,0,0,1,325.27,258.66V349.38A162.55,162.55,0,1,1,185,188.31V96.79a250.31,250.31,0,0,0-22.45-1A251,251,0,0,0,0,349.38a250,250,0,0,0,325.27,240.23V258.66A210.06,210.06,0,0,0,448,249.16Z"
      style={{ mixBlendMode: 'screen' }}
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

export function IntegrationsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [accounts, setAccounts] = useState<AdAccount[]>([])

  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [connectingMeta, setConnectingMeta] = useState(false)
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [oauthData, setOauthData] = useState<OAuthData | null>(null)
  const [oauthPlatform, setOauthPlatform] = useState<'google_ads' | 'meta_ads'>('meta_ads')
  const [preConnectPlatform, setPreConnectPlatform] = useState<'google_ads' | 'meta_ads' | null>(
    null
  )
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (!user) return

    const accountsRef = collection(db, 'users', user.uid, 'adAccounts').withConverter(
      zodConverter(AdAccountSchema, 'AdAccount')
    )
    const q = query(accountsRef, where('isActive', '==', true))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map((doc) => doc.data()))
    })

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_CALLBACK') {
        const payload = event.data.payload
        if (payload.oauthData && payload.platform) {
          setOauthData(payload.oauthData)
          setOauthPlatform(payload.platform)
          setShowAccountSelection(true)
        } else if (payload.error) {
          showToast({ message: payload.error, type: 'error' })
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [showToast])

  useEffect(() => {
    if (location.state?.oauthData && location.state?.platform) {
      const data = location.state.oauthData as OAuthData
      const platform = location.state.platform as 'google_ads' | 'meta_ads'

      setOauthData(data)
      setOauthPlatform(platform)
      setShowAccountSelection(true)

      // Clear state properly using React Router
      navigate(location.pathname, { replace: true, state: {} })
      return
    }

    if (location.state?.error) {
      showToast({ message: location.state.error, type: 'error' })
      navigate(location.pathname, { replace: true, state: {} })
      return
    }

    if (location.state?.success && location.state?.message) {
      showToast({ message: location.state.message, type: 'success' })
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate, showToast])

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true)
      const authUrl = await oauthService.getGoogleAdsAuthUrl()
      if (authUrl && authUrl !== '#') {
        window.open(authUrl, 'OAuthPopup', 'width=600,height=700,left=200,top=100')
      }
    } catch (error: any) {
      showToast({
        message: error.message || t('accountsPage.error.connectGoogle'),
        type: 'error',
      })
    } finally {
      setConnectingGoogle(false)
      setPreConnectPlatform(null)
    }
  }

  const handleConnectMeta = async () => {
    try {
      setConnectingMeta(true)
      const authUrl = await oauthService.getMetaAdsAuthUrl()
      if (authUrl && authUrl !== '#') {
        window.open(authUrl, 'OAuthPopup', 'width=600,height=700,left=200,top=100')
      }
    } catch (error: any) {
      showToast({
        message: error.message || t('accountsPage.error.connectMeta'),
        type: 'error',
      })
    } finally {
      setConnectingMeta(false)
      setPreConnectPlatform(null)
    }
  }

  const handleDisconnectPlatform = async (platform: 'google_ads' | 'meta_ads') => {
    if (!user) return
    const platformAccounts = accounts.filter((a) => a.platform === platform)

    if (
      confirm(
        `Tem certeza que deseja desconectar a plataforma? Isso removerá as ${platformAccounts.length} contas vinculadas.`
      )
    ) {
      try {
        const batch = writeBatch(db)
        platformAccounts.forEach((acc) => {
          const ref = doc(db, 'users', user.uid, 'adAccounts', acc.id)
          batch.delete(ref)
        })
        await batch.commit()
        showToast({ message: 'Plataforma desconectada com sucesso.', type: 'success' })
      } catch (error: any) {
        showToast({ message: error.message || 'Erro ao desconectar plataforma.', type: 'error' })
      }
    }
  }

  const handleAccountSelection = async (
    accountsWithDetails: { accountId: string; timezone: string; projectId: string }[]
  ) => {
    if (!oauthData || !user) return

    try {
      const functionName =
        oauthPlatform === 'google_ads'
          ? 'confirmGoogleAdsAccountSelection'
          : 'confirmMetaAdsAccountSelection'

      const confirmSelection = httpsCallable<
        {
          temporaryToken: string
          accountsWithDetails: { accountId: string; timezone: string; projectId: string }[]
        },
        { success: boolean }
      >(functions, functionName)

      await confirmSelection({
        temporaryToken: oauthData.temporaryToken,
        accountsWithDetails,
      })

      setShowAccountSelection(false)
      setOauthData(null)

      const platformName = oauthPlatform === 'google_ads' ? 'Google Ads' : 'Meta Ads'
      showToast({
        message: t('accountsPage.accountsConnectedSuccess', {
          count: accountsWithDetails.length,
          platform: platformName,
        }),
        type: 'success',
      })
    } catch (error: any) {
      showToast({
        message: error.message || t('accountsPage.error.saveAccounts'),
        type: 'error',
      })
    }
  }

  const googleAccounts = accounts.filter((a) => a.platform === 'google_ads')
  const metaAccounts = accounts.filter((a) => a.platform === 'meta_ads')

  const connectedPlatformsCount =
    (googleAccounts.length > 0 ? 1 : 0) + (metaAccounts.length > 0 ? 1 : 0)

  return (
    <MainLayout>
      <div className="w-full px-4 py-8 md:px-8 max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-7 gap-6">
          <div>
            <h1 className="text-[36px] font-bold tracking-[-0.025em] leading-[1.05] text-[var(--text)]">
              Integrações
            </h1>
            <p className="text-[15px] text-[var(--text-2)] mt-2 max-w-[680px] leading-[1.5]">
              Conecte as suas plataformas à AdSmart.
            </p>
          </div>
        </div>

        {/* Status Strip */}
        <div className="flex items-center gap-4 mb-8 p-1.5 bg-[var(--bg-elev)] border border-[var(--separator)] rounded-2xl w-fit">
          <div className="px-5 py-2 flex items-center gap-2.5 border-r border-[var(--separator)]">
            <span className="text-[18px] font-bold text-[var(--text)]">
              {connectedPlatformsCount}
            </span>
            <span className="text-[13px] font-medium text-[var(--text-3)]">
              Plataformas conectadas
            </span>
          </div>
          <div className="px-5 py-2 flex items-center gap-2.5">
            <span className="text-[18px] font-bold text-[var(--text)]">{accounts.length}</span>
            <span className="text-[13px] font-medium text-[var(--text-3)]">Contas vinculadas</span>
          </div>
        </div>

        {/* Integrações Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
          {/* Card Google Ads */}
          <div className="rounded-[22px] bg-[var(--bg-elev)] border border-[var(--border)] overflow-hidden flex flex-col p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <GoogleAdsIcon size={28} />
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-bold tracking-[-0.01em] text-[var(--text)]">
                    Google Ads
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreConnectPlatform('google_ads')}
                    className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[12px] font-semibold hover:bg-[var(--bg-elev-2)] transition-colors"
                  >
                    Conectar
                  </button>
                </div>
              </div>
              {googleAccounts.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--success-bg)] border border-[var(--success)] border-opacity-20 text-[var(--success)] text-[12px] font-bold tracking-wide flex-shrink-0">
                  <CheckCircle2 size={13} strokeWidth={3} /> Conectada
                </span>
              )}
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">
              {googleAccounts.length} CONTAS VINCULADAS
            </div>

            {googleAccounts.length > 0 ? (
              <div className="flex flex-col gap-2 mb-6">
                {googleAccounts.slice(0, 2).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-3 bg-[var(--bg)] border border-[var(--border)] px-4 py-3.5 rounded-[14px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                      <div className="text-[13.5px] font-[650] text-[var(--text)] truncate">
                        {account.accountName}
                      </div>
                    </div>
                    <div className="text-[13.5px] font-medium text-[var(--text-3)] truncate">
                      {account.accountId}
                    </div>
                  </div>
                ))}
                {googleAccounts.length > 2 && (
                  <div className="text-[13px] font-medium text-[var(--text-3)] mt-2 ml-1">
                    +{googleAccounts.length - 2} outra conta
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 h-[54px] flex items-center">
                <p className="text-[14px] text-[var(--text-3)]">
                  Nenhuma conta vinculada no momento.
                </p>
              </div>
            )}

            <div className="mt-auto flex items-center justify-end pt-5 border-t border-[var(--separator)]">
              <button
                type="button"
                onClick={() => handleDisconnectPlatform('google_ads')}
                className="text-[13px] font-semibold text-[var(--danger)] hover:opacity-80 transition-opacity"
              >
                Desconectar plataforma
              </button>
            </div>
          </div>

          {/* Card Meta Ads */}
          <div className="rounded-[22px] bg-[var(--bg-elev)] border border-[var(--border)] overflow-hidden flex flex-col p-6">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <MetaAdsIcon size={28} />
                </div>
                <div className="flex items-center gap-3">
                  <h3 className="text-[18px] font-bold tracking-[-0.01em] text-[var(--text)]">
                    Meta Ads
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPreConnectPlatform('meta_ads')}
                    className="h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[12px] font-semibold hover:bg-[var(--bg-elev-2)] transition-colors"
                  >
                    Conectar
                  </button>
                </div>
              </div>
              {metaAccounts.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--success-bg)] border border-[var(--success)] border-opacity-20 text-[var(--success)] text-[12px] font-bold tracking-wide flex-shrink-0">
                  <CheckCircle2 size={13} strokeWidth={3} /> Conectada
                </span>
              )}
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)] mb-3">
              {metaAccounts.length} CONTAS VINCULADAS
            </div>

            {metaAccounts.length > 0 ? (
              <div className="flex flex-col gap-2 mb-6">
                {metaAccounts.slice(0, 2).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between gap-3 bg-[var(--bg)] border border-[var(--border)] px-4 py-3.5 rounded-[14px]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                      <div className="text-[13.5px] font-[650] text-[var(--text)] truncate">
                        {account.accountName}
                      </div>
                    </div>
                    <div className="text-[13.5px] font-medium text-[var(--text-3)] truncate">
                      {account.accountId}
                    </div>
                  </div>
                ))}
                {metaAccounts.length > 2 && (
                  <div className="text-[13px] font-medium text-[var(--text-3)] mt-2 ml-1">
                    +{metaAccounts.length - 2} outra conta
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 h-[54px] flex items-center">
                <p className="text-[14px] text-[var(--text-3)]">
                  Nenhuma conta vinculada no momento.
                </p>
              </div>
            )}

            <div className="mt-auto flex items-center justify-end pt-5 border-t border-[var(--separator)]">
              <button
                type="button"
                onClick={() => handleDisconnectPlatform('meta_ads')}
                className="text-[13px] font-semibold text-[var(--danger)] hover:opacity-80 transition-opacity"
              >
                Desconectar plataforma
              </button>
            </div>
          </div>

          {/* Card TikTok Ads (Coming soon) */}
          <div className="rounded-[22px] bg-[var(--bg)] border border-dashed border-[var(--border-strong)] overflow-hidden flex flex-col p-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-2xl bg-[var(--bg-elev)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-sm opacity-80">
                  <TikTokIcon size={26} />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold tracking-[-0.01em] text-[var(--text)]">
                    TikTok Ads
                  </h3>
                  <p className="text-[13px] text-[var(--text-3)] mt-1.5 font-medium">
                    In-Feed • TopView • Spark Ads
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--bg-elev-2)] text-[var(--text-2)] text-[12px] font-bold tracking-wide flex-shrink-0">
                Em breve
              </span>
            </div>

            <div className="text-[14px] text-[var(--text-2)] leading-[1.6] mb-8 mt-2 max-w-[420px]">
              Em breve você vai conectar suas campanhas do TikTok Ads e receber os mesmos relatórios
              e insights de IA, lado a lado com Meta e Google.
            </div>

            <div className="mt-auto">
              <button
                type="button"
                className="w-full h-11 border border-[var(--border-strong)] rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold text-[var(--text-2)] hover:bg-[var(--bg-elev)] hover:text-[var(--text)] transition-colors"
              >
                <Bell size={16} strokeWidth={2.5} /> Avise-me quando chegar
              </button>
            </div>
          </div>
        </div>

        {/* Security Info Bottom */}
        <div className="mt-12 p-6 bg-[var(--bg-elev)] border border-[var(--separator)] rounded-[22px] flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <div className="w-12 h-12 rounded-[14px] bg-[var(--bg)] border border-[var(--separator)] shadow-sm flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-[var(--text-2)]" />
          </div>
          <div className="text-[14.5px] text-[var(--text-2)] leading-[1.6]">
            <strong className="text-[var(--text)]">Seus dados estão seguros.</strong> Usamos OAuth2
            com escopo somente de leitura — suas senhas nunca passam pelos nossos servidores. Você
            pode revogar o acesso a qualquer momento, aqui ou direto no Google e na Meta.
          </div>
        </div>
      </div>

      {/* Modal de Pré-conexão */}
      {preConnectPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg)] w-full max-w-md rounded-2xl p-6 shadow-xl border border-[var(--border)]">
            <h2 className="text-xl font-bold mb-4">Conectar plataforma</h2>
            <ul className="space-y-3 mb-6 text-sm text-[var(--text-2)]">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-[var(--success)] shrink-0 mt-0.5" />
                <span>Uma janela popup será aberta para autenticação segura no provedor.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-[var(--success)] shrink-0 mt-0.5" />
                <span>Somente leitura: nunca solicitamos acesso de edição das suas campanhas.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="text-[var(--success)] shrink-0 mt-0.5" />
                <span>Nós não armazenamos as suas senhas.</span>
              </li>
            </ul>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreConnectPlatform(null)}
                className="px-4 py-2 font-semibold text-sm border border-[var(--border)] rounded-xl hover:bg-[var(--bg-elev)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (preConnectPlatform === 'google_ads') handleConnectGoogle()
                  else handleConnectMeta()
                }}
                disabled={connectingGoogle || connectingMeta}
                className="px-4 py-2 font-semibold text-sm bg-[var(--text)] text-[var(--bg)] rounded-xl hover:opacity-90 flex items-center gap-2"
              >
                {(connectingGoogle || connectingMeta) && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Contas (Existente para o fluxo OAuth) */}
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
