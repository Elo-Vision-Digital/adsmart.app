import { AdAccountSchema } from '@adsmart/shared'
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import {
  Check,
  ChevronRight,
  FileText,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
import { useProjects } from '@/hooks/useProjects'
import { zodConverter } from '@/schemas/firestore-converter'
import { oauthService } from '@/services/oauthServices'
import type { AdAccount } from '@/types'

// ────────────────────────────────────────────────────────────────────────────
// Ícones de Plataforma
// ────────────────────────────────────────────────────────────────────────────
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

function PlatformIcon({ plat, size = 14 }: { plat: string; size?: number }) {
  return plat === 'google_ads' || plat === 'google' ? (
    <GoogleAdsIcon size={size} />
  ) : (
    <MetaAdsIcon size={size} />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Mocks Temporários (Projetos e Modal)
// ────────────────────────────────────────────────────────────────────────────
const PROJECT_COLORS = [
  { id: 'slate', hue: 'oklch(0.55 0.02 250)' },
  { id: 'green', hue: 'oklch(0.58 0.12 152)' },
  { id: 'amber', hue: 'oklch(0.70 0.13 75)' },
  { id: 'plum', hue: 'oklch(0.50 0.14 320)' },
  { id: 'cyan', hue: 'oklch(0.62 0.10 220)' },
  { id: 'rose', hue: 'oklch(0.60 0.15 20)' },
]

// Avatar do Projeto
function ProjectAvatar({
  color,
  initials,
  size = 44,
}: {
  color: string
  initials: string
  size?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: color,
        color: '#fff',
        fontSize: size * 0.36,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────
export function ProjectsPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { t } = useLanguage()

  // State principal de Contas do Firestore
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const { projects, createProject } = useProjects()

  // Estados de conexão OAuth
  const [connectingGoogle, setConnectingGoogle] = useState(false)
  const [connectingMeta, setConnectingMeta] = useState(false)
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [oauthData, setOauthData] = useState<OAuthData | null>(null)
  const [oauthPlatform, setOauthPlatform] = useState<'google_ads' | 'meta_ads'>('meta_ads')
  const { toasts, showToast, removeToast } = useToast()

  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColorIndex, setNewProjectColorIndex] = useState(2)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  // Buscar contas do Firestore
  useEffect(() => {
    if (!user) return

    const accountsRef = collection(db, 'users', user.uid, 'adAccounts').withConverter(
      zodConverter(AdAccountSchema, 'AdAccount')
    )
    const q = query(accountsRef, where('isActive', '==', true))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map((doc) => doc.data()))
      setLoadingAccounts(false)
    })

    return () => unsubscribe()
  }, [user])

  // Processar callback OAuth
  useEffect(() => {
    if (location.state?.oauthData && location.state?.platform) {
      const data = location.state.oauthData as OAuthData
      const platform = location.state.platform as 'google_ads' | 'meta_ads'

      window.history.replaceState({}, document.title)
      setOauthData(data)
      setOauthPlatform(platform)
      setShowAccountSelection(true)
    }

    if (location.state?.error) {
      showToast({ message: location.state.error, type: 'error' })
      window.history.replaceState({}, document.title)
    }

    if (location.state?.success && location.state?.message) {
      showToast({ message: location.state.message, type: 'success' })
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true)
      const authUrl = await oauthService.getGoogleAdsAuthUrl()
      if (authUrl && authUrl !== '#') window.location.href = authUrl
    } catch (error: any) {
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
      const authUrl = await oauthService.getMetaAdsAuthUrl()
      if (authUrl && authUrl !== '#') window.location.href = authUrl
    } catch (error: any) {
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

  const handleUpdateAccountProject = async (accountId: string, projectId: string) => {
    if (!user) return
    try {
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'users', user.uid, 'adAccounts', accountId), {
        projectId,
      })
      showToast({ message: t('projectsPage.success.accountAssigned'), type: 'success' })
    } catch (error) {
      console.error('Erro ao atualizar projeto da conta:', error)
      showToast({ message: t('projectsPage.error.assignAccount'), type: 'error' })
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    setIsCreatingProject(true)
    try {
      await createProject({
        name: newProjectName.trim(),
        initials: newProjectName.trim().substring(0, 2).toUpperCase(),
        color: PROJECT_COLORS[newProjectColorIndex].hue,
      })
      setIsNewProjectModalOpen(false)
      setNewProjectName('')
      setNewProjectColorIndex(2)
      showToast({ message: t('projectsPage.success.projectCreated'), type: 'success' })
    } catch (error: any) {
      showToast({ message: error.message || t('projectsPage.error.createProject'), type: 'error' })
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleAccountSelection = async (accountsWithDetails: any[]) => {
    if (!oauthData || !user) return

    try {
      const functionName =
        oauthPlatform === 'google_ads'
          ? 'confirmGoogleAdsAccountSelection'
          : 'confirmMetaAdsAccountSelection'

      const confirmSelection = httpsCallable<
        { temporaryToken: string; accountsWithDetails: any[] },
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

  // Agregações
  const orphans = accounts.filter((a) => !a.projectId)
  const googleCount = accounts.filter((a) => a.platform === 'google_ads').length
  const metaCount = accounts.filter((a) => a.platform === 'meta_ads').length

  const totalAccounts = googleCount + metaCount

  // Empty state principal
  const empty = projects.length === 0 && orphans.length === 0

  return (
    <MainLayout>
      <div className="w-full px-4 py-8 md:px-8 max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-7 gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-[-0.01em]">
              {t('projectsPage.title')}
            </h1>
            <p className="text-[14.5px] text-[var(--text-3)] mt-1.5 leading-relaxed">
              {t('projectsPage.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 h-10 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--bg-elev-2)] transition-colors"
              onClick={() => {
                if (confirm('Conectar Google Ads? Cancelar para Meta Ads.')) {
                  handleConnectGoogle()
                } else {
                  handleConnectMeta()
                }
              }}
              disabled={connectingGoogle || connectingMeta}
            >
              {connectingGoogle || connectingMeta ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Link2 size={15} />
              )}
              {t('projectsPage.connectAccount')}
            </button>
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-[14px] font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{t('projectsPage.newProject')}</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
          {[
            { l: t('projectsPage.statProjects'), v: projects.length, icon: <FileText size={14} /> },
            { l: t('projectsPage.statAccounts'), v: totalAccounts, icon: <Link2 size={14} /> },
            { l: 'Google Ads', v: googleCount, icon: <GoogleAdsIcon size={14} /> },
            { l: 'Meta Ads', v: metaCount, icon: <MetaAdsIcon size={14} /> },
          ].map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-[14px] bg-[var(--bg-elev)] border border-[var(--border)]"
            >
              <div className="flex items-center gap-2 text-[var(--text-2)] mb-1.5">
                {s.icon}
                <span className="text-[13px] font-medium">{s.l}</span>
              </div>
              <div className="text-[26px] font-bold tracking-[-0.02em] text-[var(--text)]">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* Projects section Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-[17px] font-[650] tracking-[-0.01em] text-[var(--text)]">
              {t('projectsPage.yourProjects')}
            </h2>
            <p className="text-[13px] text-[var(--text-2)] mt-0.5">
              {empty ? t('projectsPage.emptySubtitle') : t('projectsPage.subtitleActive')}
            </p>
          </div>
          {!empty && (
            <div className="flex p-1 bg-[var(--bg-elev)] border border-[var(--border)] rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-[var(--bg)] shadow-sm text-[var(--text)] border border-[var(--border)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] border border-transparent'
                }`}
              >
                <LayoutGrid size={14} /> Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-[13px] font-semibold transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-[var(--bg)] shadow-sm text-[var(--text)] border border-[var(--border)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)] border border-transparent'
                }`}
              >
                <List size={14} /> Lista
              </button>
            </div>
          )}
        </div>

        {/* Projects Grid / Empty State */}
        {empty ? (
          <div className="py-12 px-8 rounded-[22px] bg-[var(--bg-elev)] border border-dashed border-[var(--border-strong)] flex flex-col items-center text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] mb-4.5">
              <FileText size={28} />
            </div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[var(--text)] mb-2">
              {t('projectsPage.createFirst')}
            </h2>
            <p className="text-[15px] text-[var(--text-2)] max-w-[460px] leading-relaxed mb-6">
              {t('projectsPage.createDescription')}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 h-11 bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl text-[14px] font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={15} strokeWidth={2.2} /> {t('projectsPage.createProject')}
              </button>
              <button
                type="button"
                onClick={handleConnectMeta}
                className="inline-flex items-center gap-2 px-5 h-11 bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-xl text-[14px] font-semibold hover:bg-[var(--bg-elev-2)] transition-colors"
              >
                <Link2 size={15} /> {t('projectsPage.connectAccount')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
            {projects.map((p) => {
              const projectAccounts = accounts.filter((a) => a.projectId === p.id)
              const pGoogle = projectAccounts.filter((a) => a.platform === 'google_ads').length
              const pMeta = projectAccounts.filter((a) => a.platform === 'meta_ads').length

              const dateVal = p.updatedAt
                ? typeof (p.updatedAt as any).toDate === 'function'
                  ? (p.updatedAt as any).toDate()
                  : typeof (p.updatedAt as any).toMillis === 'function'
                    ? new Date((p.updatedAt as any).toMillis())
                    : new Date(p.updatedAt as any)
                : null

              const dateStr = dateVal ? dateVal.toLocaleDateString() : 'Recente'

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-[18px] bg-[var(--bg-elev)] border border-[var(--border)] flex flex-col gap-3.5 relative"
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-3">
                    <ProjectAvatar color={p.color} initials={p.initials} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-[650] tracking-[-0.005em] truncate text-[var(--text)]">
                        {p.name}
                      </div>
                      <div className="text-[13px] text-[var(--text-3)] mt-0.5">
                        {t('projectsPage.updatedAt')} {dateStr}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-[30px] h-[30px] rounded-[9px] bg-transparent border border-[var(--border)] text-[var(--text-2)] flex items-center justify-center hover:bg-[var(--bg-elev-2)] transition-colors"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Account chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {projectAccounts.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 px-[9px] py-[5px] rounded-full bg-[var(--bg)] border border-[var(--border)] text-[11.5px] font-semibold text-[var(--text-2)] max-w-[200px] truncate"
                      >
                        <PlatformIcon plat={a.platform} size={11} />
                        <span className="truncate">{a.accountName}</span>
                      </span>
                    ))}
                    {projectAccounts.length > 3 && (
                      <span className="px-[9px] py-[5px] rounded-full bg-[var(--bg)] border border-[var(--border)] text-[11.5px] font-semibold text-[var(--text-3)]">
                        +{projectAccounts.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-auto flex items-center gap-3.5 pt-3.5 border-t border-[var(--separator)]">
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon plat="google" size={13} />
                      <span className="text-[13px] font-semibold text-[var(--text)]">
                        {pGoogle}
                      </span>
                      <span className="text-[13px] text-[var(--text-3)]">Google</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon plat="meta" size={13} />
                      <span className="text-[13px] font-semibold text-[var(--text)]">{pMeta}</span>
                      <span className="text-[13px] text-[var(--text-3)]">Meta</span>
                    </div>
                    <div className="flex-1" />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                    >
                      {t('projectsPage.open')} <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* New Project Card */}
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="p-5 rounded-[18px] bg-transparent border border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center gap-2 min-h-[188px] text-center text-[var(--text-2)] hover:bg-[var(--bg-elev)] transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--bg-elev)] border border-[var(--border)] flex items-center justify-center text-[var(--text)]">
                <Plus size={20} strokeWidth={2.2} />
              </div>
              <div className="text-[14.5px] font-[650] text-[var(--text)] mt-1">
                {t('projectsPage.newProject')}
              </div>
              <div className="text-[13px] max-w-[200px] leading-[1.4]">
                {t('projectsPage.newProjectDesc')}
              </div>
            </button>
          </div>
        )}

        {/* Orphan accounts (Contas sem projeto - REAIS) */}
        {orphans.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-[17px] font-[650] tracking-[-0.01em] text-[var(--text)] flex items-center">
                  {t('projectsPage.orphanAccounts')}
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--warning-bg)] text-[var(--warning)] text-[12px] font-bold tracking-[0.01em]">
                    {orphans.length}
                  </span>
                </div>
                <div className="text-[13px] text-[var(--text-2)] mt-0.5">
                  {t('projectsPage.orphanAccountsSubtitle')}
                </div>
              </div>
            </div>

            <div className="rounded-[18px] bg-[var(--bg-elev)] border border-[var(--border)] overflow-hidden mb-8">
              {loadingAccounts ? (
                <div className="p-6 text-center text-[var(--text-3)] flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> {t('projectsPage.loadingAccounts')}
                </div>
              ) : (
                orphans.map((a, i, arr) => (
                  <React.Fragment key={a.id}>
                    <div className="p-3.5 px-5 flex items-center gap-3.5 hover:bg-[var(--bg-elev-2)] transition-colors">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <PlatformIcon plat={a.platform} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-[650] text-[var(--text)] truncate">
                          {a.accountName}
                        </div>
                        <div className="text-[13px] text-[var(--text-3)] mt-0.5 truncate">
                          {a.email || a.accountId}
                        </div>
                      </div>
                      <select
                        className="py-2 pl-3 pr-7 rounded-[10px] bg-[var(--bg)] border border-[var(--border-strong)] text-[13px] font-semibold text-[var(--text)] appearance-none cursor-pointer outline-none focus:border-[var(--accent)]"
                        style={{
                          backgroundImage:
                            'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23999%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 10px center',
                        }}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value === '__new') {
                            setIsNewProjectModalOpen(true)
                            e.target.value = ''
                          } else {
                            handleUpdateAccountProject(a.id, e.target.value)
                          }
                        }}
                      >
                        <option value="" disabled>
                          {t('projectsPage.assignToProject')}
                        </option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                        <option value="__new">+ {t('projectsPage.createProject')}</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(a.id)}
                        className="w-8 h-8 rounded-[9px] bg-transparent border border-[var(--border)] text-[var(--text-2)] flex items-center justify-center hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Desconectar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {i < arr.length - 1 && <div className="h-px bg-[var(--separator)]" />}
                  </React.Fragment>
                ))
              )}
            </div>
          </>
        )}
      </div>

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

      {/* Modal Visual de Novo Projeto (Mock UI) */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--bg)] rounded-[24px] w-full max-w-[500px] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden max-h-[92vh]">
            {/* Header Modal */}
            <div className="px-6 pt-5 pb-4 border-b border-[var(--separator)] flex items-start gap-3.5">
              <ProjectAvatar color={PROJECT_COLORS[2].hue} initials="NP" size={48} />
              <div className="flex-1 min-w-0">
                <div className="text-[20px] font-bold tracking-[-0.018em] text-[var(--text)]">
                  Novo projeto
                </div>
                <div className="text-[13px] text-[var(--text-2)] mt-1 leading-[1.45]">
                  Agrupe contas de Google Ads e Meta Ads que pertencem ao mesmo negócio ou cliente
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="w-8 h-8 rounded-[10px] bg-[var(--bg-elev)] border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] flex-shrink-0 hover:bg-[var(--bg-elev-2)]"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 pt-4 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-[var(--text)] mb-1.5">
                  {t('projectsPage.projectName')}
                </label>
                <input
                  type="text"
                  placeholder={t('projectsPage.projectNamePlaceholder')}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] text-[14px] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="text-[12px] font-semibold text-[var(--text-2)] mt-4.5 mb-2.5 uppercase tracking-wide">
                Cor do projeto
              </div>
              <div className="flex gap-2.5 mb-4.5">
                {PROJECT_COLORS.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewProjectColorIndex(i)}
                    className="w-9 h-9 rounded-[10px] border-none cursor-pointer relative"
                    style={{
                      background: c.hue,
                      boxShadow:
                        i === newProjectColorIndex
                          ? `0 0 0 2px var(--bg), 0 0 0 4px var(--text)`
                          : 'none',
                    }}
                  >
                    {i === newProjectColorIndex && (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <Check size={16} strokeWidth={2.6} />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="w-full py-3 px-3.5 rounded-xl bg-transparent border border-dashed border-[var(--border-strong)] text-[13.5px] font-semibold text-[var(--text-2)] flex items-center justify-center gap-2 hover:bg-[var(--bg-elev)] transition-colors"
              >
                <Plus size={14} strokeWidth={2.2} /> Conectar nova conta agora
              </button>

              <div className="mt-4 p-3 rounded-[10px] bg-[var(--bg-elev-2)] border border-[var(--border)] flex gap-2.5 items-start">
                <Shield size={14} className="text-[var(--text-2)] mt-0.5 flex-shrink-0" />
                <div className="text-[13px] text-[var(--text-2)] leading-[1.45]">
                  Uma conta pode estar em mais de um projeto. Mover entre projetos é instantâneo —
                  não afeta dados nem relatórios anteriores.
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-[var(--separator)] bg-[var(--bg)]/90 backdrop-blur-xl flex items-center gap-2.5">
              <div className="flex-1">
                <div className="text-[13px] text-[var(--text-2)]">Resumo</div>
                <div className="text-[13px] font-semibold mt-0.5 text-[var(--text)]">
                  Novo projeto · 0 contas
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-4 h-10 rounded-xl bg-[var(--bg-elev)] border border-[var(--border)] text-[14px] font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={isCreatingProject || !newProjectName.trim()}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isCreatingProject ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} strokeWidth={2.4} />
                )}{' '}
                {t('projectsPage.createProject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toasts.map(({ id, props }) => (
        <Toast key={id} {...props} onClose={() => removeToast(id)} />
      ))}
    </MainLayout>
  )
}
