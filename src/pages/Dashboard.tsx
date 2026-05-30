import { AdAccountSchema } from '@adsmart/shared'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import {
  ChevronRight as IconChevR,
  FileText as IconDoc,
  Link2 as IconLink,
  Plus as IconPlus,
  Sparkles as IconSparkle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { AddCreditsModal } from '@/components/ui/AddCreditsModal'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/firebase/config'
import { useReports } from '@/hooks/useReports'
import { useWallet } from '@/hooks/useWallet'
import { zodConverter } from '@/schemas/firestore-converter'
import type { AdAccount } from '@/types'

const GoogleAdsIcon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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

const MetaAdsIcon = ({ s = 24 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient
        id="meta-gradient"
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
      fill="url(#meta-gradient)"
    />
  </svg>
)

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { reports, loading: reportsLoading } = useReports()
  const [connections, setConnections] = useState<AdAccount[]>([])
  const { balance } = useWallet()
  const [showAddCredits, setShowAddCredits] = useState(false)

  // Fetch contas conectadas
  useEffect(() => {
    if (!user) return

    const accountsRef = collection(db, 'users', user.uid, 'adAccounts').withConverter(
      zodConverter(AdAccountSchema, 'AdAccount')
    )
    const q = query(accountsRef, where('isActive', '==', true))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConnections(snapshot.docs.map((doc) => doc.data()))
    })

    return () => unsubscribe()
  }, [user])

  const recentReports = reports.slice(0, 3)

  // Google vs Meta connections count
  const googleAccounts = connections.filter((c) => c.platform === 'google_ads').length
  const metaAccounts = connections.filter((c) => c.platform === 'meta_ads').length

  return (
    <MainLayout>
      <div style={{ padding: '32px 32px 40px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 24 }}>
          <span className="t-small text-2">
            Bom dia, {user?.displayName?.split(' ')[0] || 'Usuário'}
          </span>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: '-0.028em',
              marginTop: 6,
              lineHeight: 1.05,
            }}
          >
            Vamos gerar seu próximo relatório?
          </h1>
        </div>

        {/* Hero balance card */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 22,
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -60,
              top: -60,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--chart-3) 0%, transparent 65%)',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div>
              <span
                className="t-micro text-2"
                style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                Créditos disponíveis
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  marginTop: 6,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: 'var(--text)',
                }}
              >
                <span style={{ fontSize: 56, lineHeight: 1 }}>{balance}</span>
                <span style={{ fontSize: 22, color: 'var(--text-2)' }}>créditos</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowAddCredits(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: 'var(--text)',
                  color: 'var(--bg)',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <IconPlus size={16} strokeWidth={2.2} /> Comprar créditos
              </button>
              <button
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <IconSparkle size={16} /> Plano premium
              </button>
            </div>
          </div>
        </div>

        {/* Quick metrics row — Relatórios + Integrações */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
          {[
            {
              label: 'Relatórios',
              value: reports.length,
              sub: 'este mês',
              icon: <IconDoc size={18} />,
            },
            {
              label: 'Integrações',
              value: connections.length,
              sub: 'conectadas',
              icon: <IconLink size={18} />,
            },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                padding: 20,
                borderRadius: 16,
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-2)' }}
              >
                {m.icon}
                <span className="t-small">{m.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: 1,
                  }}
                >
                  {m.value}
                </span>
                <span className="t-small text-3">{m.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Two-col: Meus relatórios + Integrações */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 22 }}>
          {/* Meus relatórios */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.01em' }}>
                Meus relatórios
              </div>
              <button
                onClick={() => navigate('/reports')}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                Ver tudo <IconChevR size={14} />
              </button>
            </div>

            {reportsLoading || recentReports.length === 0 ? (
              <div
                style={{
                  padding: '48px 28px',
                  borderRadius: 18,
                  background: 'var(--bg-elev)',
                  border: '1px dashed var(--border-strong)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'var(--bg-elev-2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-2)',
                    marginBottom: 16,
                  }}
                >
                  <IconDoc size={26} />
                </div>
                <p style={{ fontSize: 17, fontWeight: 650, color: 'var(--text)' }}>
                  Nenhum relatório ainda
                </p>
                <p className="t-small text-2" style={{ marginTop: 6, marginBottom: 20 }}>
                  Conecte uma plataforma e aguarde seus relatórios.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/report-success?id=${report.id}`)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 16,
                      background: 'var(--bg-elev)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconDoc size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                        {report.name}
                      </h3>
                      <div className="t-small text-2">
                        {report.createdAt.toLocaleDateString('pt-BR')} •{' '}
                        {report.type === 'google_ads' ? 'Google Ads' : 'Meta Ads'}
                      </div>
                    </div>
                    <IconChevR size={18} style={{ color: 'var(--text-3)' }} />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Integrações */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.01em' }}>
                Integrações
              </div>
              <button
                onClick={() => navigate('/accounts')}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                Gerenciar <IconChevR size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { name: 'Google Ads', icon: <GoogleAdsIcon s={26} />, count: googleAccounts },
                { name: 'Meta Ads', icon: <MetaAdsIcon s={26} />, count: metaAccounts },
              ].map((it) => (
                <div
                  key={it.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 16,
                    background: 'var(--bg-elev)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {it.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 650 }}>{it.name}</div>
                    <div className="t-small text-2">{it.count} contas conectadas</div>
                  </div>
                  <button
                    onClick={() => navigate('/accounts')}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 999,
                      border: '1px solid var(--border-strong)',
                      background: 'transparent',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    {it.count > 0 ? 'Gerenciar' : 'Conectar'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <AddCreditsModal open={showAddCredits} onOpenChange={setShowAddCredits} />
    </MainLayout>
  )
}
