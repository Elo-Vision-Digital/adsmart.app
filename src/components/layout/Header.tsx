import { Bell, Moon, Search, Sparkles, Sun } from 'lucide-react'
import { useState } from 'react'
import { LanguageSelector } from '@/components/common/LanguageSelector'
import { AddCreditsModal } from '@/components/ui/AddCreditsModal'
import { useTheme } from '@/contexts/ThemeContext'

export function Header() {
  const [showAddCredits, setShowAddCredits] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 28px',
          borderBottom: '1px solid var(--separator)',
          background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
          backdropFilter: 'saturate(180%) blur(20px)',
          WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
            }}
          >
            <Search size={15} />
          </div>
          <input
            type="text"
            placeholder="Buscar relatórios…"
            style={{
              width: '100%',
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '8px 12px 8px 36px',
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LanguageSelector />

            <button
              onClick={toggleTheme}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--bg-elev)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Bell size={18} />
            </button>
          </div>

          <button
            onClick={() => setShowAddCredits(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 999,
              background: 'var(--bg-elev)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            <Sparkles size={14} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>200 créditos</span>
            <span
              style={{ width: 1, height: 14, background: 'var(--border-strong)', margin: '0 2px' }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-2)',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              +
            </span>
          </button>
        </div>
      </header>

      <AddCreditsModal open={showAddCredits} onOpenChange={setShowAddCredits} />
    </>
  )
}
