// screens-report-start.jsx — Step 0 of report generation: choose platform first.
// Mobile + Desktop versions. User picks Google Ads / Meta Ads, then proceeds
// to templates filtered by that platform.

// ────────────────────────────────────────────────────────────────────────────
// MOBILE — Select platform
// ────────────────────────────────────────────────────────────────────────────
function ScreenReportStart({ dark, onTab, onBack, onSelectPlatform }) {
  const platforms = [
    {
      id: 'google',
      icon: <IconGoogle s={36} />,
      name: 'Google Ads',
      sub: 'Search, Performance Max, Display, YouTube',
      available: true,
      templates: 2,
    },
    {
      id: 'meta',
      icon: <IconMeta s={36} />,
      name: 'Meta Ads',
      sub: 'Facebook, Instagram, Stories, Reels',
      available: true,
      templates: 2,
    },
  ];

  const soon = [
    { id: 'instagram', name: 'Instagram Ads', sub: 'Em breve' },
    { id: 'tiktok',   name: 'TikTok Ads',   sub: 'Em breve' },
    { id: 'linkedin', name: 'LinkedIn Ads', sub: 'Em breve' },
  ];

  return (
    <ScreenShell dark={dark} active="reports" onTab={onTab} back onBack={onBack}>
      <div style={{ padding: '8px 18px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', marginBottom: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--accent)', color: 'var(--accent-fg)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
          }}>1</span>
          <span className="t-small" style={{ fontWeight: 600 }}>Passo 1 de 3</span>
          <span className="t-small text-3">·</span>
          <span className="t-small text-3">Plataforma → Template → Pagamento</span>
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--text)', lineHeight: 1.1,
        }}>
          Para qual<br/>plataforma?
        </h1>
        <p className="t-body text-2" style={{ marginTop: 8 }}>
          Escolha de onde vêm os dados do seu relatório.
        </p>
      </div>

      {/* Big platform cards */}
      <div style={{ padding: '20px 18px 12px', display: 'grid', gap: 12 }}>
        {platforms.map(p => (
          <button key={p.id} onClick={() => onSelectPlatform && onSelectPlatform(p.id)} style={{
            display: 'flex', flexDirection: 'column',
            padding: 0, borderRadius: 22, overflow: 'hidden',
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            textAlign: 'left', width: '100%',
            transition: 'transform .15s, border-color .15s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.985)'}
          onMouseUp={(e) => e.currentTarget.style.transform = ''}
          onMouseLeave={(e) => e.currentTarget.style.transform = ''}
          >
            {/* Hero band */}
            <div style={{
              padding: '24px 22px',
              background: 'var(--bg-elev-2)',
              borderBottom: '1px solid var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', right: -40, bottom: -40,
                opacity: 0.1, transform: 'scale(2.4)',
                transformOrigin: 'bottom right',
              }}>{p.icon}</div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.018em' }}>{p.name}</div>
                  <div className="t-small text-2" style={{ marginTop: 2 }}>{p.sub}</div>
                </div>
              </div>
            </div>
            {/* Footer row */}
            <div style={{
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)' }}>
                <IconTemplate s={14} />
                <span className="t-small" style={{ fontWeight: 600 }}>{p.templates} templates disponíveis</span>
              </div>
              <IconChevR s={18} />
            </div>
          </button>
        ))}
      </div>

      {/* Coming soon */}
      <SectionHead title="Em breve" />
      <div style={{ padding: '0 18px 22px', display: 'grid', gap: 8 }}>
        {soon.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--bg-elev)', border: '1px dashed var(--border)',
            opacity: 0.55,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
              flexShrink: 0,
            }}>{s.name.split(' ')[0].slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
              <div className="t-small text-3">{s.sub}</div>
            </div>
            <Badge tone="neutral">Em breve</Badge>
          </div>
        ))}
      </div>

      {/* Help footer */}
      <div style={{ padding: '0 18px 28px' }}>
        <div style={{
          padding: 14, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: 'var(--text-2)', flexShrink: 0, paddingTop: 1 }}>
            <IconSparkle s={16} />
          </div>
          <div className="t-small" style={{ color: 'var(--text-2)', lineHeight: 1.4 }}>
            Você pode escolher uma plataforma para cada relatório. No próximo passo verá os templates disponíveis para a plataforma escolhida.
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Select platform
// ────────────────────────────────────────────────────────────────────────────
function DesktopReportStart({ dark, onSelectPlatform }) {
  const platforms = [
    {
      id: 'google',
      icon: <IconGoogle s={48} />,
      name: 'Google Ads',
      sub: 'Search, Performance Max, Display, YouTube',
      features: ['Análise de conversões e ROI', 'Performance por localização', 'Comparativo de períodos', 'Insights automáticos'],
      templates: 2,
    },
    {
      id: 'meta',
      icon: <IconMeta s={48} />,
      name: 'Meta Ads',
      sub: 'Facebook, Instagram, Stories, Reels',
      features: ['Análise de público-alvo', 'Performance por formato', 'Funil de conversão', 'Análise demográfica'],
      templates: 2,
    },
  ];

  const soon = [
    { id: 'instagram', name: 'Instagram Ads', sub: 'Q3 2026' },
    { id: 'tiktok',    name: 'TikTok Ads',    sub: 'Q3 2026' },
    { id: 'linkedin',  name: 'LinkedIn Ads',  sub: 'Q3 2026' },
    { id: 'youtube',   name: 'YouTube Ads',   sub: 'Q4 2026' },
  ];

  return (
    <DesktopShell dark={dark} active="reports">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1080, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', marginBottom: 12 }}>
            {[
              { n: 1, label: 'Plataforma', active: true },
              { n: 2, label: 'Template' },
              { n: 3, label: 'Pagamento' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: s.active ? 'var(--accent)' : 'var(--bg-elev)',
                    color: s.active ? 'var(--accent-fg)' : 'var(--text-2)',
                    border: s.active ? '0' : '1px solid var(--border)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{s.n}</span>
                  <span className="t-small" style={{
                    fontWeight: s.active ? 600 : 500,
                    color: s.active ? 'var(--text)' : 'var(--text-2)',
                  }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <span style={{ width: 24, height: 1, background: 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Para qual plataforma?
          </h1>
          <p className="t-body text-2" style={{ marginTop: 8, maxWidth: 540 }}>
            Escolha de onde vêm os dados. No próximo passo você verá os templates disponíveis.
          </p>
        </div>

        {/* Big platform cards — 2 cols */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 32 }}>
          {platforms.map(p => (
            <button key={p.id} onClick={() => onSelectPlatform && onSelectPlatform(p.id)} style={{
              padding: 0, borderRadius: 22, overflow: 'hidden',
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
              textAlign: 'left', cursor: 'pointer',
              transition: 'transform .15s, border-color .15s, box-shadow .15s',
              display: 'flex', flexDirection: 'column',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = '';
            }}
            >
              {/* Hero */}
              <div style={{
                padding: '32px 28px',
                background: 'var(--bg-elev-2)',
                borderBottom: '1px solid var(--border)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', right: -30, bottom: -50,
                  opacity: 0.08, transform: 'scale(3.5)',
                  transformOrigin: 'bottom right',
                }}>{p.icon}</div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{p.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{p.name}</div>
                    <div className="t-small text-2" style={{ marginTop: 4 }}>{p.sub}</div>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="t-micro text-2" style={{ marginBottom: 10 }}>O que está disponível</div>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginBottom: 18 }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-2)' }}><IconCheck s={14} sw={2.2} /></span>
                      <span className="t-small">{f}</span>
                    </li>
                  ))}
                </ul>
                <div style={{
                  marginTop: 'auto', paddingTop: 16,
                  borderTop: '1px solid var(--separator)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span className="t-small text-2">
                    <IconTemplate s={13} /> {p.templates} templates
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 14, fontWeight: 650,
                  }}>
                    Escolher <IconChevR s={16} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Coming soon strip */}
        <div style={{
          padding: 18, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px dashed var(--border-strong)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <IconSparkle s={16} />
            <div className="t-micro" style={{ color: 'var(--text)' }}>Roadmap</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {soon.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 12, borderRadius: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--text-2)',
                  flexShrink: 0,
                }}>{s.name.split(' ')[0].slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div className="t-small text-3">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, { ScreenReportStart, DesktopReportStart });
