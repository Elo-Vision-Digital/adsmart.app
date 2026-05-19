// screens-main.jsx — Dashboard, Integrações, Templates, Relatórios
// Mobile-first layouts. Apple-styled. Pulls primitives from ui.jsx + icons.jsx.

// ────────────────────────────────────────────────────────────────────────────
// Small shared building blocks
// ────────────────────────────────────────────────────────────────────────────
function SectionHead({ title, action, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 18px', marginBottom: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h2 className="t-h2" style={{ color: 'var(--text)' }}>{title}</h2>
        {sub && <span className="t-small text-2">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

function ScreenTitle({ title, sub }) {
  return (
    <div style={{ padding: '8px 18px 20px' }}>
      <h1 className="t-display" style={{ color: 'var(--text)' }}>{title}</h1>
      {sub && <p className="t-body text-2" style={{ marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

// Tiny inline sparkline (B&W in light, cyan in dark via --chart-1)
function Sparkline({ data = [4,7,5,9,6,12,8,14,11,16,13,18], h = 36, w = 88 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const path = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke="var(--chart-1)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Donut for the dashboard hero
function DonutHero({ pct = 62, size = 120, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--chart-4)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--chart-1)" strokeWidth={stroke}
              strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset .6s ease' }} />
    </svg>
  );
}

// Bar chart (mini)
function MiniBars({ data = [3,5,2,7,4,8,6,10,5,9,7,11], h = 56 }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: h }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${(v/max)*100}%`,
          background: i === data.length - 1 ? 'var(--chart-1)' : 'var(--chart-3)',
          borderRadius: 3,
        }} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Hero stat card — used on Dashboard
// ────────────────────────────────────────────────────────────────────────────
function HeroBalance({ credits = 200, onDeposit }) {
  return (
    <div style={{
      margin: '0 18px 24px', padding: '22px 22px 20px',
      borderRadius: 22,
      background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', right: -40, top: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--chart-3) 0%, transparent 65%)',
        opacity: 0.5, pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative' }}>
        <span className="t-micro text-2">Créditos disponíveis</span>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4,
          fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)',
        }}>
          <span style={{ fontSize: 42, lineHeight: 1 }}>{credits}</span>
          <span style={{ fontSize: 18, color: 'var(--text-2)' }}>créditos</span>
        </div>
        <div className="t-small text-3" style={{ marginTop: 6 }}>
          1 crédito = R$ 5,00 · R$ {credits * 5} em saldo
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
          <Button variant="primary" icon={<IconPlus s={16} sw={2.2} />} onClick={onDeposit}>
            Comprar créditos
          </Button>
          <Button variant="secondary" icon={<IconSparkle s={16} />}>
            Plano premium
          </Button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DASHBOARD — home screen
// ────────────────────────────────────────────────────────────────────────────
function ScreenDashboard({ dark, onTab, onNav }) {
  return (
    <ScreenShell dark={dark} active="home" onTab={onTab}>
      {/* Greeting */}
      <div style={{ padding: '20px 18px 0' }}>
        <span className="t-small text-2">Bom dia, Eduardo</span>
        <h1 style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--text)', marginTop: 4, lineHeight: 1.1,
        }}>
          Vamos gerar<br/>seu próximo relatório?
        </h1>
      </div>

      <div style={{ height: 24 }} />
      <HeroBalance onDeposit={() => onNav && onNav('transactions')} />

      {/* Quick metrics row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        padding: '0 18px', marginBottom: 28,
      }}>
        {[
          { label: 'Relatórios', value: '0', sub: 'este mês', icon: <IconDoc s={16} /> },
          { label: 'Integrações', value: '0', sub: 'conectadas', icon: <IconLink s={16} /> },
        ].map((m) => (
          <div key={m.label} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)' }}>
              {m.icon}
              <span className="t-small">{m.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{m.value}</span>
              <span className="t-small text-3">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Meus relatórios */}
      <SectionHead
        title="Meus relatórios"
        action={<button onClick={() => onTab && onTab('reports')} style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', gap: 2,
        }}>Ver tudo <IconChevR s={14} /></button>}
      />
      <div style={{ padding: '0 18px 28px' }}>
        <div style={{
          padding: '32px 20px', borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px dashed var(--border-strong)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--bg-elev-2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', marginBottom: 12,
          }}>
            <IconDoc s={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            Nenhum relatório ainda
          </p>
          <p className="t-small text-2" style={{ marginTop: 4, marginBottom: 16 }}>
            Crie seu primeiro relatório a partir de um template
          </p>
          <Button variant="primary" size="sm" icon={<IconPlus s={14} sw={2.2} />}
                  onClick={() => onTab && onTab('templates')}>
            Criar relatório
          </Button>
        </div>
      </div>

      {/* Integrações compact */}
      <SectionHead
        title="Integrações"
        action={<button onClick={() => onNav && onNav('integrations')} style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', gap: 2,
        }}>Gerenciar <IconChevR s={14} /></button>}
      />
      <div style={{ padding: '0 18px 28px', display: 'grid', gap: 10 }}>
        {[
          { name: 'Google Ads', icon: <IconGoogle s={22} />, count: 0 },
          { name: 'Meta Ads',   icon: <IconMeta s={22} />,   count: 0 },
        ].map(it => (
          <div key={it.name} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{it.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{it.name}</div>
              <div className="t-small text-2">{it.count} contas conectadas</div>
            </div>
            <button style={{
              padding: '8px 14px', borderRadius: 999,
              border: '1px solid var(--border-strong)',
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
            }}>Conectar</button>
          </div>
        ))}
      </div>

      {/* Templates horizontal scroll */}
      <SectionHead
        title="Templates"
        sub="Escolha um modelo para começar"
        action={<button onClick={() => onTab && onTab('templates')} style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
        }}>Ver tudo</button>}
      />
      <div style={{
        display: 'flex', gap: 12, padding: '0 18px 16px',
        overflowX: 'auto', scrollSnapType: 'x mandatory',
      }}>
        {[
          { tag: 'Google Ads', title: 'Lançamento',      credits: 2, icon: <IconGoogle s={16} />, kind: 'growth' },
          { tag: 'Meta Ads',   title: 'Lançamento',      credits: 2, icon: <IconMeta s={16} />,   kind: 'audience' },
          { tag: 'Google Ads', title: 'Negócios Locais',  credits: 1, icon: <IconGoogle s={16} />, kind: 'geo' },
        ].map((t, i) => (
          <div key={i} style={{
            width: 220, flexShrink: 0, scrollSnapAlign: 'start',
            borderRadius: 18, overflow: 'hidden',
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{
              height: 124, background: 'var(--bg-elev-2)',
              position: 'relative', overflow: 'hidden',
            }}>
              <LaptopMock kind={t.kind} />
              <div style={{
                position: 'absolute', top: 10, left: 10,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 8px 4px 6px', borderRadius: 999,
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 11, fontWeight: 600,
              }}>
                {t.icon} {t.tag}
              </div>
              <div style={{
                position: 'absolute', top: 10, right: 10,
                padding: '4px 9px', borderRadius: 999,
                background: 'var(--accent)', color: 'var(--accent-fg)',
                fontSize: 11, fontWeight: 700, letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
              }}>{t.credits} créd.</div>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
                {t.title}
              </div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>
                Análise de campanhas
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 24 }} />
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// INTEGRAÇÕES
// ────────────────────────────────────────────────────────────────────────────
function ScreenIntegrations({ dark, onTab, onBack }) {
  const platforms = [
    { name: 'Google Ads', icon: <IconGoogle s={26} />, connected: 0, color: '#4285F4' },
    { name: 'Meta Ads',   icon: <IconMeta s={26} />,   connected: 0, color: '#0866FF' },
  ];
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <ScreenTitle
        title="Integrações"
        sub="Conecte suas contas do Google Ads e Meta Ads para gerar relatórios"
      />

      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 14 }}>
        {platforms.map(p => (
          <div key={p.name} style={{
            padding: 18, borderRadius: 18,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--bg)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{p.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>{p.name}</div>
                <div className="t-small text-2">{p.connected} contas conectadas</div>
              </div>
              <Badge tone="neutral">Não conectado</Badge>
            </div>

            <div style={{
              padding: '20px 16px', borderRadius: 14,
              background: 'var(--bg)', border: '1px dashed var(--border-strong)',
              textAlign: 'center', marginBottom: 12,
            }}>
              <p className="t-small text-2">Nenhuma conta conectada</p>
            </div>

            <Button variant="primary" full icon={<IconLink s={16} />}>
              Conectar {p.name}
            </Button>
          </div>
        ))}

        {/* Info card */}
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'var(--warning-bg)',
          border: '1px solid var(--border)',
          display: 'flex', gap: 12,
        }}>
          <div style={{ color: 'var(--warning)', flexShrink: 0, paddingTop: 1 }}>
            <IconShield s={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              Conexões seguras com OAuth2
            </div>
            <p className="t-small text-2" style={{ marginTop: 4 }}>
              Não armazenamos suas senhas. Você pode revogar o acesso a qualquer momento.
            </p>
          </div>
        </div>

        <button style={{
          padding: 14, borderRadius: 14,
          background: 'transparent', border: '1px dashed var(--border-strong)',
          color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <IconSparkle s={16} />
          Adicionar Contas Demo
        </button>

        {/* Coming soon */}
        <div style={{ marginTop: 18 }}>
          <div className="t-micro text-2" style={{ marginBottom: 10, paddingLeft: 2 }}>Em breve</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { name: 'Instagram Ads',  abbr: 'IG', eta: 'Q3 2026' },
              { name: 'TikTok Ads',     abbr: 'TT', eta: 'Q3 2026' },
              { name: 'LinkedIn Ads',   abbr: 'IN', eta: 'Q4 2026' },
            ].map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--bg-elev)', border: '1px dashed var(--border)',
                opacity: 0.62,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                  flexShrink: 0,
                }}>{s.abbr}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  <div className="t-small text-3">{s.eta}</div>
                </div>
                <Badge tone="neutral">Em breve</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TEMPLATES
// ────────────────────────────────────────────────────────────────────────────
function ScreenTemplates({ dark, onTab, onTemplate, onBack, platform }) {
  const [filter, setFilter] = React.useState(platform || 'all');
  React.useEffect(() => { if (platform) setFilter(platform); }, [platform]);
  const items = [
    { id: 1, plat: 'google', tag: 'Google Ads', icon: <IconGoogle s={14} />, kind: 'growth',
      title: 'Lançamento', credits: 2, features: ['Análise de conversões e ROI', 'Métricas de engajamento detalhadas', 'Comparativo de períodos', 'Insights automáticos'] },
    { id: 2, plat: 'meta', tag: 'Meta Ads', icon: <IconMeta s={14} />, kind: 'audience',
      title: 'Lançamento', credits: 2, features: ['Análise de público-alvo', 'Performance por formato', 'Funil de conversão', 'Otimizações sugeridas'] },
    { id: 3, plat: 'google', tag: 'Google Ads', icon: <IconGoogle s={14} />, kind: 'geo',
      title: 'Negócios Locais', credits: 1, features: ['Análise geográfica', 'Performance por localização', 'Horários de pico', 'ROI por região'] },
    { id: 4, plat: 'meta', tag: 'Meta Ads', icon: <IconMeta s={14} />, kind: 'funnel',
      title: 'Negócios Locais', credits: 1, features: ['Alcance por região', 'Engajamento local', 'Análise demográfica', 'Custo por lead local'] },
  ];
  const filtered = items.filter(i => filter === 'all' || i.plat === filter);

  return (
    <ScreenShell dark={dark} active="templates" onTab={onTab} back={!!platform} onBack={onBack}>
      <div style={{ padding: '8px 18px 8px' }}>
        {platform && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', marginBottom: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--accent)', color: 'var(--accent-fg)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>2</span>
            <span className="t-small" style={{ fontWeight: 600 }}>Passo 2 de 3</span>
            <span className="t-small text-3">·</span>
            <span className="t-small text-3">{platform === 'google' ? 'Google Ads' : 'Meta Ads'}</span>
          </div>
        )}
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--text)', lineHeight: 1.1,
        }}>{platform ? 'Escolha um template' : 'Templates'}</h1>
        <p className="t-body text-2" style={{ marginTop: 8 }}>
          {platform ? `Modelos disponíveis para ${platform === 'google' ? 'Google Ads' : 'Meta Ads'}.` : 'Escolha o modelo ideal para suas análises'}
        </p>
      </div>

      {/* Filter chips — hidden when platform is locked from previous step */}
      {!platform && (
        <div style={{
          display: 'flex', gap: 8, padding: '18px 18px 18px',
          overflowX: 'auto',
        }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>Todos</Chip>
          <Chip active={filter === 'google'} onClick={() => setFilter('google')}
                icon={<IconGoogle s={14} />}>Google Ads</Chip>
          <Chip active={filter === 'meta'} onClick={() => setFilter('meta')}
                icon={<IconMeta s={14} />}>Meta Ads</Chip>
        </div>
      )}
      {platform && <div style={{ height: 18 }} />}

      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 14 }}>
        {filtered.map(t => (
          <button key={t.id} onClick={() => onTemplate && onTemplate(t)} style={{
            padding: 0, textAlign: 'left',
            borderRadius: 20, overflow: 'hidden',
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'block', width: '100%',
          }}>
            <div style={{
              height: 168, background: 'var(--bg-elev-2)',
              position: 'relative', overflow: 'hidden',
            }}>
              <LaptopMock kind={t.kind} />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 10px 5px 8px', borderRadius: 999,
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 11, fontWeight: 600,
              }}>{t.icon} {t.tag}</div>
              <div style={{
                position: 'absolute', top: 12, right: 12,
                padding: '5px 10px', borderRadius: 999,
                background: 'var(--accent)', color: 'var(--accent-fg)',
                fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>{t.credits} créd.</div>
            </div>
            <div style={{ padding: '16px 18px 18px' }}>
              <div style={{ fontSize: 17, fontWeight: 650, letterSpacing: '-0.015em' }}>
                {t.title}
              </div>
              <div className="t-small text-2" style={{ marginTop: 3, marginBottom: 12 }}>
                Dashboard para campanhas
              </div>
              <ul style={{ listStyle: 'none', display: 'grid', gap: 6, marginBottom: 14 }}>
                {t.features.slice(0, 3).map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-2)' }}><IconCheck s={14} sw={2.2} /></span>
                    <span className="t-small text-2">{f}</span>
                  </li>
                ))}
              </ul>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Usar este template</span>
                <IconChevR s={16} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// RELATÓRIOS
// ────────────────────────────────────────────────────────────────────────────
function ScreenReports({ dark, onTab }) {
  const [sort, setSort] = React.useState('recent');
  const [platform, setPlatform] = React.useState('all');

  return (
    <ScreenShell dark={dark} active="reports" onTab={onTab}>
      <ScreenTitle
        title="Meus Relatórios"
        sub="Gerencie e acesse todos os seus relatórios gerados"
      />

      {/* Search */}
      <div style={{ padding: '0 18px 14px' }}>
        <Input leading={<IconSearch s={16} />} placeholder="Buscar por nome ou conta…" />
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gap: 10, padding: '0 18px 14px', gridTemplateColumns: '1fr 1fr' }}>
        <Select
          value={platform}
          onChange={setPlatform}
          options={[
            { value: 'all',    label: 'Todas plataformas' },
            { value: 'google', label: 'Google Ads' },
            { value: 'meta',   label: 'Meta Ads' },
          ]}
        />
        <Select
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Mais recentes' },
            { value: 'old',    label: 'Mais antigos' },
            { value: 'name',   label: 'Por nome' },
          ]}
        />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        padding: '0 18px 18px',
      }}>
        {[
          { label: 'Google', value: '0', icon: <IconGoogle s={14} /> },
          { label: 'Meta',   value: '0', icon: <IconMeta s={14} /> },
          { label: 'Mês',    value: '0', icon: <IconCalendar s={14} /> },
        ].map((s) => (
          <div key={s.label} style={{
            padding: 12, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
              {s.icon}
              <span className="t-small">{s.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Total + create CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px 14px',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Total: 0 relatórios</div>
          <div className="t-small text-2">Você ainda não criou nenhum</div>
        </div>
        <Button variant="primary" size="sm" icon={<IconPlus s={14} sw={2.2} />}>
          Criar novo
        </Button>
      </div>

      {/* Empty state */}
      <div style={{ padding: '0 18px 28px' }}>
        <div style={{
          padding: '40px 20px', borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'var(--bg-elev-2)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', marginBottom: 14,
          }}>
            <IconDoc s={28} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 650 }}>Nenhum relatório encontrado</div>
          <p className="t-small text-2" style={{ marginTop: 6 }}>
            Tente ajustar os filtros ou criar um novo relatório
          </p>
        </div>
      </div>
    </ScreenShell>
  );
}

Object.assign(window, {
  ScreenDashboard, ScreenIntegrations, ScreenTemplates, ScreenReports,
  Sparkline, DonutHero, MiniBars, ScreenTitle, SectionHead,
});
