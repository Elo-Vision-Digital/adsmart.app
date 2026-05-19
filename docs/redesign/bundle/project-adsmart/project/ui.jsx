// ui.jsx — Base UI primitives for AdSmart (Apple-style)
// Button, Input, Select, Card, Avatar, Badge, Chip, Segmented, Toggle,
// Sheet, ListRow, TopBar, BottomNav, ScreenScroll.

const adsmartStyles = {
  // Button base
  btnBase: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 'var(--r-md)', padding: '0 16px',
    fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
    transition: 'transform .15s cubic-bezier(.2,.9,.3,1.2), background .15s, color .15s, border-color .15s, opacity .15s',
    userSelect: 'none', whiteSpace: 'nowrap',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Button — primary / secondary / ghost / pill
// ────────────────────────────────────────────────────────────────────────────
function Button({
  children, variant = 'primary', size = 'md', icon, iconRight,
  full = false, onClick, type, disabled = false, style = {},
}) {
  const sizing = {
    sm: { height: 32, padding: '0 12px', fontSize: 13, radius: 8 },
    md: { height: 44, padding: '0 16px', fontSize: 15, radius: 12 },
    lg: { height: 52, padding: '0 22px', fontSize: 16, radius: 14 },
  }[size];

  const variants = {
    primary: {
      background: 'var(--accent)', color: 'var(--accent-fg)',
      border: '1px solid var(--accent)',
    },
    secondary: {
      background: 'var(--bg-elev)', color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent', color: 'var(--text)',
      border: '1px solid transparent',
    },
    outline: {
      background: 'transparent', color: 'var(--text)',
      border: '1px solid var(--border-strong)',
    },
  };

  return (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...adsmartStyles.btnBase,
        height: sizing.height,
        padding: sizing.padding,
        fontSize: sizing.fontSize,
        borderRadius: sizing.radius,
        width: full ? '100%' : undefined,
        opacity: disabled ? 0.4 : 1,
        ...variants[variant],
        ...style,
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={(e) => e.currentTarget.style.transform = ''}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Input — label ABOVE, no glued icons. Optional leading symbol with breathing
// room. Clean focus ring. (Solves the user's pain point.)
// ────────────────────────────────────────────────────────────────────────────
function Field({ label, hint, error, children, action }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || action) && (
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          fontSize: 13, fontWeight: 600, color: 'var(--text)',
          letterSpacing: '-0.005em', paddingLeft: 2,
        }}>
          <span>{label}</span>
          {action}
        </div>
      )}
      {children}
      {(hint || error) && (
        <span style={{
          fontSize: 12, color: error ? 'var(--danger)' : 'var(--text-2)',
          paddingLeft: 2,
        }}>{error || hint}</span>
      )}
    </label>
  );
}

function Input({ leading, value, placeholder, type = 'text', onChange, disabled, style = {}, readOnly }) {
  const [focus, setFocus] = React.useState(false);
  // Static mocks omit onChange; React warns unless readOnly is set
  const ro = readOnly !== undefined ? readOnly : (value !== undefined && !onChange);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'var(--bg-elev)',
      border: `1px solid ${focus ? 'var(--text)' : 'var(--border)'}`,
      borderRadius: 12, height: 48,
      paddingLeft: leading ? 14 : 16, paddingRight: 16,
      gap: 12,
      transition: 'border-color .15s, background .15s',
      ...style,
    }}>
      {leading && (
        <span style={{ color: 'var(--text-3)', display: 'flex' }}>
          {leading}
        </span>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        readOnly={ro}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: 0, outline: 'none', background: 'transparent',
          fontSize: 15, color: 'var(--text)', minWidth: 0,
          letterSpacing: '-0.005em',
        }}
      />
    </div>
  );
}

// Select — uses a native button + chevron with breathing room (no glued icons)
function Select({ value, options, onChange, leading }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center',
      background: 'var(--bg-elev)',
      border: `1px solid ${focus ? 'var(--text)' : 'var(--border)'}`,
      borderRadius: 12, height: 48,
      paddingLeft: leading ? 14 : 16, paddingRight: 14,
      gap: 12,
      transition: 'border-color .15s',
    }}>
      {leading && <span style={{ color: 'var(--text-3)', display: 'flex' }}>{leading}</span>}
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, border: 0, outline: 'none', background: 'transparent',
          fontSize: 15, color: 'var(--text)', appearance: 'none',
          paddingRight: 24,
          backgroundImage: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--text-2)', pointerEvents: 'none', display: 'flex',
      }}>
        <IconChevD s={16} />
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Avatar
// ────────────────────────────────────────────────────────────────────────────
function Avatar({ initials = 'ER', size = 32, src }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--bg-elev-2)', color: 'var(--text)',
      border: '1px solid var(--border)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600, letterSpacing: '-0.01em',
      backgroundImage: src ? `url(${src})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {!src && initials}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Badge / Chip
// ────────────────────────────────────────────────────────────────────────────
function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: 'var(--bg-elev-2)', fg: 'var(--text-2)' },
    success: { bg: 'var(--success-bg)', fg: 'var(--success)' },
    warning: { bg: 'var(--warning-bg)', fg: 'var(--warning)' },
    danger:  { bg: 'var(--danger-bg)',  fg: 'var(--danger)'  },
    ink:     { bg: 'var(--accent)',     fg: 'var(--accent-fg)' },
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 999,
      background: tones.bg, color: tones.fg,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.01em',
      lineHeight: 1.2,
    }}>{children}</span>
  );
}

function Chip({ children, active = false, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 14px', borderRadius: 999,
      background: active ? 'var(--accent)' : 'var(--bg-elev)',
      color: active ? 'var(--accent-fg)' : 'var(--text)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      fontSize: 13, fontWeight: 500,
      transition: 'all .15s',
    }}>
      {icon}
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Segmented (iOS-style)
// ────────────────────────────────────────────────────────────────────────────
function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3, gap: 2,
      background: 'var(--bg-inset)', borderRadius: 10,
    }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange && onChange(o.value)} style={{
          padding: '7px 14px', borderRadius: 8,
          background: value === o.value ? 'var(--bg)' : 'transparent',
          color: 'var(--text)',
          fontSize: 13, fontWeight: value === o.value ? 600 : 500,
          boxShadow: value === o.value ? 'var(--shadow-1)' : 'none',
          transition: 'background .15s',
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Toggle (iOS switch)
// ────────────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange && onChange(!on)} style={{
      width: 51, height: 31, borderRadius: 999,
      background: on ? '#34C759' : 'var(--border-strong)',
      position: 'relative', padding: 0, transition: 'background .2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2,
        width: 27, height: 27, borderRadius: '50%', background: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2), 0 1px 1px rgba(0,0,0,0.05)',
        transition: 'left .2s cubic-bezier(.2,.9,.3,1.2)',
      }} />
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Radio
// ────────────────────────────────────────────────────────────────────────────
function Radio({ checked, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12,
      background: checked ? 'var(--bg-elev)' : 'transparent',
      border: `1px solid ${checked ? 'var(--text)' : 'var(--border)'}`,
      flex: 1, transition: 'all .15s',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: `1.5px solid ${checked ? 'var(--text)' : 'var(--border-strong)'}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {checked && <span style={{
          width: 9, height: 9, borderRadius: '50%', background: 'var(--text)',
        }} />}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ListRow — iOS list item
// ────────────────────────────────────────────────────────────────────────────
function ListRow({ leading, title, subtitle, trailing, onClick, last = false }) {
  return (
    <>
      <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', width: '100%', textAlign: 'left',
        background: 'transparent',
      }}>
        {leading && <span style={{ flexShrink: 0, display: 'flex', color: 'var(--text-2)' }}>{leading}</span>}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{subtitle}</span>}
        </span>
        {trailing}
      </button>
      {!last && <div className="hairline" style={{ marginLeft: 52 }} />}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TopBar — mobile-style, condensed
// ────────────────────────────────────────────────────────────────────────────
function TopBar({ dark, balance = '200', balanceUnit = 'créditos', onAvatar, onBalance, title, back, onBack }) {
  const logoSrc = dark ? 'assets/logo-branco.png' : 'assets/logo-preto.png';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px 12px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--separator)',
      position: 'sticky', top: 0, zIndex: 20,
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    }}>
      {back ? (
        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '6px 8px 6px 4px', margin: '-6px 0 -6px -8px',
          color: 'var(--text)', fontSize: 15, fontWeight: 500,
        }}>
          <IconChevL s={20} />
          <span>Voltar</span>
        </button>
      ) : (
        <img src={logoSrc} alt="adsmart" style={{ height: 22, width: 'auto', display: 'block' }} />
      )}
      {title && <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 16, fontWeight: 600 }}>{title}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBalance} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 999,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <IconSparkle s={14} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>{balance} {balanceUnit}</span>
        </button>
        <button onClick={onAvatar} style={{ display: 'inline-flex' }}>
          <Avatar size={32} />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BottomNav — iOS-style tab bar
// ────────────────────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const tabs = [
    { id: 'home',     label: 'Início',      icon: IconHome },
    { id: 'reports',  label: 'Relatórios',  icon: IconReport },
    { id: 'create',   label: '',            icon: IconPlus, primary: true },
    { id: 'templates',label: 'Templates',   icon: IconTemplate },
    { id: 'more',     label: 'Mais',        icon: IconMore },
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 30,
      background: 'color-mix(in srgb, var(--bg) 80%, transparent)',
      backdropFilter: 'saturate(180%) blur(24px)',
      WebkitBackdropFilter: 'saturate(180%) blur(24px)',
      borderTop: '1px solid var(--separator)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '8px 4px 4px', gap: 0,
      }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = active === t.id;
          if (t.primary) {
            return (
              <button key={t.id} onClick={() => onChange && onChange(t.id)}
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 0 }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: 'var(--accent)', color: 'var(--accent-fg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--shadow-2)',
                  transition: 'transform .15s',
                }}>
                  <Icon s={22} sw={2} />
                </span>
              </button>
            );
          }
          return (
            <button key={t.id} onClick={() => onChange && onChange(t.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '4px 0 2px',
              color: isActive ? 'var(--text)' : 'var(--text-3)',
            }}>
              <Icon s={22} sw={isActive ? 2 : 1.6} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: '0.01em' }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ScreenShell — wraps a screen with topbar + scrollable body + bottomnav
// ────────────────────────────────────────────────────────────────────────────
function ScreenShell({ dark, children, active = 'home', onTab, hideNav, back, onBack, title, balance }) {
  return (
    <div className={`adsmart-scope ${dark ? 'theme-dark' : 'theme-light'}`} style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', overflow: 'hidden',
    }}>
      <TopBar dark={dark} balance={balance} back={back} onBack={onBack} title={title} />
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </div>
      {!hideNav && <BottomNav active={active} onChange={onTab} />}
    </div>
  );
}

Object.assign(window, {
  Button, Field, Input, Select, Avatar, Badge, Chip, Segmented, Toggle, Radio,
  ListRow, TopBar, BottomNav, ScreenShell,
});
