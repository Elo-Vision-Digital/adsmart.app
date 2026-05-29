import {
  ChevronRight,
  FileText,
  Folder,
  HeadphonesIcon,
  Home,
  Inbox,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export function Sidebar() {
  const location = useLocation()
  const { user, signOut, isAdmin } = useAuth()
  const { theme } = useTheme()

  const items = [
    { id: '/dashboard', icon: Home, label: 'Início' },
    { id: '/reports', icon: FileText, label: 'Relatórios' },
    { id: '/accounts', icon: Folder, label: 'Projetos' },
    { id: '/transactions', icon: Wallet, label: 'Créditos' },
  ]

  const ai = [
    { id: '/ai-hub', icon: Sparkles, label: 'AdSmart AI', badge: 'Em breve' },
    { id: '/chatsmart', icon: Inbox, label: 'ChatSmart AI', badge: 'Em breve' },
    { id: '/limits', icon: TrendingUp, label: 'Limites de uso', badge: 'Em breve' },
    { id: '/subscription', icon: Shield, label: 'Plano Premium', badge: 'Em breve' },
  ]

  const secondary = [
    { id: '/settings', icon: Settings, label: 'Configurações' },
    { id: '/support', icon: HeadphonesIcon, label: 'Suporte' },
  ]

  if (isAdmin) {
    secondary.push({ id: '/admin', icon: Shield, label: 'Administração' })
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        borderRight: '1px solid var(--separator)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        height: '100%',
      }}
      className="hidden md:flex"
    >
      <div style={{ padding: '6px 10px 22px' }}>
        <img
          src={
            theme === 'dark' ? 'https://i.imgur.com/CPDcfYm.png' : 'https://i.imgur.com/T6AehDg.png'
          }
          alt="adsmart"
          style={{ height: 22, display: 'block' }}
        />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
        {items.map((it) => {
          const Icon = it.icon
          const active = isActive(it.id)
          return (
            <Link
              key={it.id}
              to={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                textAlign: 'left',
                background: active ? 'var(--bg-elev)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-2)',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                border: active ? '1px solid var(--border)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {active && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--text)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div
        style={{
          padding: '0 12px 6px',
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-3)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        Premium
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
        {ai.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                textAlign: 'left',
                background: 'transparent',
                color: 'var(--text-3)',
                fontSize: 14,
                fontWeight: 500,
                border: '1px solid transparent',
                cursor: 'not-allowed',
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {it.label}
              </span>
              {it.badge && (
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: 999,
                    background: 'var(--bg-elev-2)',
                    color: 'var(--text-2)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.badge}
                </span>
              )}
            </div>
          )
        })}
      </nav>

      <div className="hairline" style={{ marginInline: 12, marginBottom: 14 }} />

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {secondary.map((it) => {
          const Icon = it.icon
          return (
            <Link
              key={it.id}
              to={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                textAlign: 'left',
                color: 'var(--text-2)',
                fontSize: 14,
                fontWeight: 500,
                background: 'transparent',
              }}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{it.label}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* User card */}
      <div
        style={{
          padding: 10,
          borderRadius: 14,
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 20,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-elev-2)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyItems: 'center',
          }}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ margin: 'auto', fontWeight: 'bold' }}>
              {user?.displayName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.displayName || 'Usuário'}
          </div>
          <div
            className="t-small text-2"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.email}
          </div>
        </div>
        <button
          onClick={() => signOut()}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            color: 'var(--text-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </aside>
  )
}
