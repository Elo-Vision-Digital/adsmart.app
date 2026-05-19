// screens-desktop.jsx — Desktop layouts (Sidebar + main content)
// Resolution: 1280x820 frames. Same design language as mobile.

// ────────────────────────────────────────────────────────────────────────────
// DesktopShell — Sidebar nav + top bar + scrollable content
// ────────────────────────────────────────────────────────────────────────────
function DesktopSidebar({ active = 'home', dark }) {
  const items = [
    { id: 'home',         icon: IconHome,     label: 'Início' },
    { id: 'reports',      icon: IconReport,   label: 'Relatórios' },
    { id: 'templates',    icon: IconTemplate, label: 'Templates' },
    { id: 'integrations', icon: IconPlug,     label: 'Integrações' },
    { id: 'transactions', icon: IconWallet,   label: 'Créditos' },
  ];
  const ai = [
    { id: 'ai-hub',       icon: IconSparkle,  label: 'Inteligência IA',  badge: 'Premium' },
    { id: 'subscription', icon: IconShield,   label: 'Plano Premium' },
  ];
  const secondary = [
    { id: 'settings', icon: IconSettings, label: 'Configurações' },
    { id: 'support',  icon: IconHeadset,  label: 'Suporte' },
  ];

  return (
    <aside style={{
      width: 248, flexShrink: 0,
      borderRight: '1px solid var(--separator)',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
    }}>
      <div style={{ padding: '6px 10px 22px' }}>
        <img src={dark ? 'assets/logo-branco.png' : 'assets/logo-preto.png'}
             alt="adsmart" style={{ height: 22, display: 'block' }} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
        {items.map(it => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, textAlign: 'left',
              background: isActive ? 'var(--bg-elev)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
            }}>
              <Icon s={18} sw={isActive ? 2 : 1.8} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {isActive && <span style={{
                width: 6, height: 6, borderRadius: '50%', background: 'var(--text)',
              }} />}
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: '0 12px 6px',
        fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>Premium</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
        {ai.map(it => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, textAlign: 'left',
              background: isActive ? 'var(--bg-elev)' : 'transparent',
              color: isActive ? 'var(--text)' : 'var(--text-2)',
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              border: isActive ? '1px solid var(--border)' : '1px solid transparent',
            }}>
              <Icon s={18} sw={isActive ? 2 : 1.8} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 999,
                  background: 'var(--accent)', color: 'var(--accent-fg)',
                  letterSpacing: '0.02em',
                }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="hairline" style={{ marginInline: 12, marginBottom: 14 }} />

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {secondary.map(it => {
          const Icon = it.icon;
          return (
            <button key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10, textAlign: 'left',
              color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
              background: 'transparent',
            }}>
              <Icon s={18} sw={1.8} />
              <span>{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* User card */}
      <div style={{
        padding: 10, borderRadius: 14,
        background: 'var(--bg-elev)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Avatar size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Eduardo Rodrigues</div>
          <div className="t-small text-2" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>eduardoteishoku@gmail.com</div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: 8, color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><IconChevR s={14} /></button>
      </div>
    </aside>
  );
}

function DesktopTopBar({ dark, title }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 28px',
      borderBottom: '1px solid var(--separator)',
      background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ flex: 1, maxWidth: 380 }}>
        <Input leading={<IconSearch s={15} />} placeholder="Buscar relatórios, contas, campanhas…" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text)',
        }}><IconBell s={18} /></button>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', borderRadius: 999,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <IconWallet s={15} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>R$ 1.000,00</span>
          <span style={{ width: 1, height: 14, background: 'var(--border-strong)', margin: '0 2px' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>+ Depositar</span>
        </button>
      </div>
    </header>
  );
}

function DesktopShell({ dark, active, children }) {
  return (
    <div className={`adsmart-scope ${dark ? 'theme-dark' : 'theme-light'}`} style={{
      width: '100%', height: '100%', display: 'flex',
      background: 'var(--bg)', overflow: 'hidden',
    }}>
      <DesktopSidebar active={active} dark={dark} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DesktopTopBar dark={dark} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Dashboard
// ────────────────────────────────────────────────────────────────────────────
function DesktopDashboard({ dark }) {
  return (
    <DesktopShell dark={dark} active="home">
      <div style={{ padding: '28px 32px 32px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <span className="t-small text-2">Olá, Eduardo · maio/2026</span>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.1 }}>
              Performance do mês
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Segmented value="30d" options={[
              { value: '7d',  label: 'Últimos 7 dias' },
              { value: '30d', label: '30 dias' },
              { value: '90d', label: '90 dias' },
            ]} />
            <Button variant="primary" icon={<IconPlus s={16} sw={2.2} />}>Criar relatório</Button>
          </div>
        </div>

        {/* KPI grid 4 wide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
          <StatCard label="Investimento total" value="R$ 48.290" delta="+18,2%" icon={<IconWallet s={14} />}
                    data={[18,22,19,28,26,32,29,35,32,38,42]} />
          <StatCard label="Receita atribuída" value="R$ 203.840" delta="+32%" icon={<IconTrendUp s={14} />}
                    data={[20,25,22,32,30,38,36,46,42,52,60]} />
          <StatCard label="Conversões" value="1.840" delta="+24%" icon={<IconCheck s={14} />}
                    data={[8,11,9,14,12,18,16,22,20,28]} />
          <StatCard label="ROAS médio" value="4,2x" delta="+0,8x" icon={<IconSparkle s={14} />}
                    data={[12,14,16,15,18,20,19,22]} />
        </div>

        {/* Main row: chart + side panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 18 }}>
          {/* Big chart */}
          <div style={{
            padding: 22, borderRadius: 18,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div className="t-small text-2">Investimento vs. Receita</div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>R$ 203.840</div>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--chart-1)' }} />
                  <span className="t-small">Receita</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--chart-3)' }} />
                  <span className="t-small">Investimento</span>
                </div>
              </div>
            </div>
            <AreaChart
              data={[24,28,22,32,38,30,42,48,40,52,58,50,62,68,64,72,78,74,82,88,86,92,98,94,102,108]}
              height={240}
            />
          </div>

          {/* Side: Platform split */}
          <div style={{
            padding: 22, borderRadius: 18,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 15, fontWeight: 650 }}>Por plataforma</div>
            <div className="t-small text-2">Distribuição do investimento</div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
              <Donut size={140} stroke={18}
                segments={[
                  { v: 62, c: 'var(--chart-1)' },
                  { v: 38, c: 'var(--chart-3)' },
                ]}
                center={
                  <>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em' }}>R$ 48K</span>
                    <span className="t-small text-2">total</span>
                  </>
                }
              />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { icon: <IconGoogle s={16} />, n: 'Google Ads', v: 'R$ 29.940', p: '62%', c: 'var(--chart-1)' },
                { icon: <IconMeta s={16} />,   n: 'Meta Ads',   v: 'R$ 18.350', p: '38%', c: 'var(--chart-3)' },
              ].map(p => (
                <div key={p.n} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, background: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: p.c }} />
                  {p.icon}
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.n}</span>
                  <span className="t-small text-2">{p.p}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{p.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reports table */}
        <div style={{
          padding: 22, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 650 }}>Relatórios recentes</div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>12 relatórios gerados este mês</div>
            </div>
            <Button variant="ghost" size="sm" iconRight={<IconChevR s={14} />}>Ver tudo</Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Relatório', 'Plataforma', 'Período', 'Receita', 'ROAS', 'Status', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 12px',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--separator)',
                      textAlign: i === 6 ? 'right' : 'left',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { n: 'Lançamento · Maio',     p: <IconGoogle s={14} />, pn: 'Google Ads', d: '18/04 — 18/05', r: 'R$ 124.380', roas: '4,2x' },
                  { n: 'Negócios Locais SP',    p: <IconGoogle s={14} />, pn: 'Google Ads', d: '01/05 — 15/05', r: 'R$ 38.220',  roas: '4,2x' },
                  { n: 'Black Friday · Q1',     p: <IconMeta s={14} />,   pn: 'Meta Ads',   d: '10/04 — 10/05', r: 'R$ 92.140',  roas: '4,9x' },
                  { n: 'Awareness · YouTube',   p: <IconGoogle s={14} />, pn: 'Google Ads', d: '01/05 — 18/05', r: 'R$ 28.420',  roas: '2,4x' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '14px 12px', fontSize: 14, fontWeight: 600 }}>{r.n}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
                        {r.p} {r.pn}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: 13, color: 'var(--text-2)' }}>{r.d}</td>
                    <td style={{ padding: '14px 12px', fontSize: 13, fontWeight: 600 }}>{r.r}</td>
                    <td style={{ padding: '14px 12px' }}><Badge tone="neutral">{r.roas}</Badge></td>
                    <td style={{ padding: '14px 12px' }}><Badge tone="success"><IconCheck s={10} sw={2.8} /> Concluído</Badge></td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      <button style={{
                        width: 32, height: 32, borderRadius: 8, color: 'var(--text-2)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}><IconChevR s={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Report Detail
// ────────────────────────────────────────────────────────────────────────────
function DesktopReportDetail({ dark }) {
  return (
    <DesktopShell dark={dark} active="reports">
      <div style={{ padding: '28px 32px 40px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Breadcrumb + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', marginBottom: 8 }}>
              <button style={{ fontSize: 13, color: 'var(--text-2)' }}>Relatórios</button>
              <IconChevR s={12} />
              <button style={{ fontSize: 13, color: 'var(--text-2)' }}>Google Ads</button>
              <IconChevR s={12} />
              <span style={{ fontSize: 13, color: 'var(--text)' }}>Lançamento · Maio</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Lançamento · Maio 2026
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <Badge tone="success"><IconCheck s={11} sw={2.5} /> Concluído</Badge>
              <span className="t-small text-2">18/04 — 18/05/2026 · 30 dias</span>
              <span className="t-small text-2">·</span>
              <span className="t-small text-2">Conta: campanhas-2026@adsmart</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<IconRefresh s={16} />}>Atualizar</Button>
            <Button variant="secondary" icon={<IconArrowDown s={16} sw={2.2} />}>Exportar PDF</Button>
            <Button variant="primary" icon={<IconSparkle s={16} />}>Análise IA</Button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 18 }}>
          {[
            { l: 'Investido',  v: 'R$ 29.940',  d: '+18%', pos: true },
            { l: 'Receita',    v: 'R$ 124.380', d: '+32%', pos: true },
            { l: 'ROAS',       v: '4,2x',       d: '+0,8x', pos: true },
            { l: 'Conversões', v: '1.840',      d: '+24%', pos: true },
            { l: 'CPA médio',  v: 'R$ 24,80',   d: '-12%', pos: true },
            { l: 'CTR',        v: '3,4%',       d: '+0,5pp', pos: true },
          ].map((k, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 14,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div className="t-small text-2">{k.l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>{k.v}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 6,
                color: k.pos ? 'var(--success)' : 'var(--danger)',
                display: 'inline-flex', alignItems: 'center', gap: 2,
              }}>
                {k.pos ? <IconArrowUp s={10} sw={2.5} /> : <IconArrowDown s={10} sw={2.5} />}
                {k.d}
              </div>
            </div>
          ))}
        </div>

        {/* Main row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14, marginBottom: 18 }}>
          <div style={{
            padding: 22, borderRadius: 18,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 650 }}>Performance ao longo do tempo</div>
                <div className="t-small text-2" style={{ marginTop: 2 }}>Receita vs. investimento</div>
              </div>
              <Segmented value="day" options={[
                { value: 'day',   label: 'Dia' },
                { value: 'week',  label: 'Semana' },
                { value: 'month', label: 'Mês' },
              ]} />
            </div>
            <AreaChart data={[24,28,22,32,38,30,42,48,40,52,58,50,62,68,64,72,78,74,82,88,86,92,98]} height={260} />
          </div>

          <div style={{
            padding: 22, borderRadius: 18,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 4 }}>Funil de conversão</div>
            <div className="t-small text-2" style={{ marginBottom: 18 }}>De impressão a venda</div>

            {[
              { l: 'Impressões', v: '2.4M',  pct: 1.0 },
              { l: 'Cliques',    v: '38.2K', pct: 0.65 },
              { l: 'Adicionar carrinho', v: '12.4K', pct: 0.35 },
              { l: 'Checkout',   v: '4.2K',  pct: 0.18 },
              { l: 'Conversões', v: '1.840', pct: 0.08 },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{f.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{f.v}</span>
                </div>
                <div style={{
                  height: 8, borderRadius: 4,
                  background: 'var(--bg)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${f.pct * 100}%`,
                    background: 'var(--chart-1)',
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaigns table + insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
          <div style={{
            padding: 22, borderRadius: 18,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 16 }}>Campanhas</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Campanha', 'Tipo', 'Investido', 'Conversões', 'ROAS', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '8px 10px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--separator)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { n: 'Search · Brand',         t: 'Search',  s: 'R$ 8.4K',  c: '624', r: '6,8x' },
                  { n: 'Performance Max',         t: 'PMax',    s: 'R$ 12.2K', c: '812', r: '4,1x' },
                  { n: 'Display · Remarketing',   t: 'Display', s: 'R$ 4.8K',  c: '248', r: '3,2x' },
                  { n: 'YouTube · Awareness',     t: 'Video',   s: 'R$ 4.5K',  c: '156', r: '2,4x' },
                ].map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '12px 10px', fontSize: 13, fontWeight: 600 }}>{c.n}</td>
                    <td style={{ padding: '12px 10px', fontSize: 13, color: 'var(--text-2)' }}>{c.t}</td>
                    <td style={{ padding: '12px 10px', fontSize: 13 }}>{c.s}</td>
                    <td style={{ padding: '12px 10px', fontSize: 13 }}>{c.c}</td>
                    <td style={{ padding: '12px 10px' }}><Badge tone="neutral">{c.r}</Badge></td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button style={{ color: 'var(--text-2)' }}><IconChevR s={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{
              padding: 18, borderRadius: 18,
              background: 'var(--success-bg)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IconSparkle s={16} />
                <span className="t-micro">Insight</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                Search · Brand está com ROAS 60% acima da média. Aumente o orçamento em 30%.
              </p>
              <Button variant="primary" size="sm" style={{ marginTop: 12 }}>Aplicar sugestão</Button>
            </div>
            <div style={{
              padding: 18, borderRadius: 18,
              background: 'var(--warning-bg)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IconWarning s={16} />
                <span className="t-micro">Atenção</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
                Display · Remarketing teve queda de 18% em CTR. Verifique criativos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Templates
// ────────────────────────────────────────────────────────────────────────────
function DesktopTemplates({ dark, platform, onBack, onSelectTemplate }) {
  const tpls = [
    { plat: 'google', icon: <IconGoogle s={14} />, tag: 'Google Ads', t: 'Lançamento',     credits: 2, kind: 'growth',   f: ['Análise de conversões e ROI', 'Métricas de engajamento', 'Comparativo de períodos', 'Insights automáticos'] },
    { plat: 'meta',   icon: <IconMeta s={14} />,   tag: 'Meta Ads',   t: 'Lançamento',     credits: 2, kind: 'audience', f: ['Análise de público-alvo', 'Performance por formato', 'Funil de conversão', 'Otimizações sugeridas'] },
    { plat: 'google', icon: <IconGoogle s={14} />, tag: 'Google Ads', t: 'Negócios Locais', credits: 1, kind: 'geo',      f: ['Análise geográfica', 'Performance por localização', 'Horários de pico', 'ROI por região'] },
    { plat: 'meta',   icon: <IconMeta s={14} />,   tag: 'Meta Ads',   t: 'Negócios Locais', credits: 1, kind: 'funnel',   f: ['Alcance por região', 'Engajamento local', 'Análise demográfica', 'Custo por lead local'] },
  ];
  const filtered = platform ? tpls.filter(t => t.plat === platform) : tpls;

  return (
    <DesktopShell dark={dark} active="templates">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Header with optional step indicator */}
        <div style={{ marginBottom: 24 }}>
          {platform && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                {[
                  { n: 1, label: 'Plataforma', done: true },
                  { n: 2, label: 'Template', active: true },
                  { n: 3, label: 'Pagamento' },
                ].map((s, i, arr) => (
                  <React.Fragment key={s.n}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: s.active ? 'var(--accent)' : s.done ? 'var(--success-bg)' : 'var(--bg-elev)',
                        color: s.active ? 'var(--accent-fg)' : s.done ? 'var(--success)' : 'var(--text-2)',
                        border: (s.active || s.done) ? '0' : '1px solid var(--border)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                      }}>{s.done ? <IconCheck s={12} sw={2.8} /> : s.n}</span>
                      <span className="t-small" style={{
                        fontWeight: s.active ? 600 : 500,
                        color: (s.active || s.done) ? 'var(--text)' : 'var(--text-2)',
                      }}>{s.label}</span>
                    </div>
                    {i < arr.length - 1 && <span style={{ width: 24, height: 1, background: 'var(--border)' }} />}
                  </React.Fragment>
                ))}
              </div>
              <button onClick={onBack} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
                marginBottom: 16, marginLeft: -4,
              }}>
                <IconChevL s={16} /> Trocar plataforma
              </button>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {platform && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 11px', borderRadius: 999,
                  background: 'var(--bg-elev)', border: '1px solid var(--border)',
                  fontSize: 12, fontWeight: 650, marginBottom: 10,
                }}>
                  {platform === 'google' ? <IconGoogle s={14} /> : <IconMeta s={14} />}
                  {platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                </div>
              )}
              <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                {platform ? 'Escolha um template' : 'Templates de relatório'}
              </h1>
              <p className="t-body text-2" style={{ marginTop: 8 }}>
                {platform
                  ? `Modelos disponíveis para ${platform === 'google' ? 'Google Ads' : 'Meta Ads'}. Pague apenas pelo que gerar.`
                  : 'Escolha o modelo ideal — pague apenas pelo que gerar.'}
              </p>
            </div>
            {!platform && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Chip active>Todos</Chip>
                <Chip icon={<IconGoogle s={14} />}>Google Ads</Chip>
                <Chip icon={<IconMeta s={14} />}>Meta Ads</Chip>
              </div>
            )}
          </div>
        </div>

        {/* Grid — vertical cards: image on top, content below.
            3 columns when platform shows fewer cards is too sparse, so use
            responsive layout: 2 cards = 2 cols (centered), 4 cards = 3 cols + wrap */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: filtered.length <= 2
            ? 'repeat(2, minmax(0, 1fr))'
            : 'repeat(3, minmax(0, 1fr))',
          gap: 18,
        }}>
          {filtered.map((t, i) => (
            <div key={i}
              role="button" tabIndex={0}
              onClick={() => onSelectTemplate && onSelectTemplate(t)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectTemplate && onSelectTemplate(t); } }}
              style={{
                padding: 0, borderRadius: 22, overflow: 'hidden',
                background: 'var(--bg-elev)', border: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                textAlign: 'left', cursor: 'pointer',
                transition: 'transform .15s, border-color .15s, box-shadow .15s',
              }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
            >
              {/* Image on TOP */}
              <div style={{
                position: 'relative', overflow: 'hidden',
                background: 'var(--bg-elev-2)',
                borderBottom: '1px solid var(--border)',
                aspectRatio: '16 / 9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LaptopMock kind={t.kind} />
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px 5px 8px', borderRadius: 999,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  fontSize: 11, fontWeight: 600,
                }}>{t.icon} {t.tag}</div>
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  padding: '5px 11px', borderRadius: 999,
                  background: 'var(--accent)', color: 'var(--accent-fg)',
                  fontSize: 13, fontWeight: 700,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}><IconSparkle s={12} /> {t.credits} créd.</div>
              </div>

              {/* Content BELOW */}
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 650, letterSpacing: '-0.015em' }}>{t.t}</div>
                <div className="t-small text-2" style={{ marginTop: 4 }}>
                  Dashboard para campanhas de {t.t.toLowerCase()}
                </div>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginTop: 16, marginBottom: 18 }}>
                  {t.f.map((feat, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--text-2)', marginTop: 2 }}><IconCheck s={14} sw={2.2} /></span>
                      <span className="t-small text-2">{feat}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 'auto' }}>
                  <Button variant="primary" full iconRight={<IconChevR s={16} />}>Usar este template</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works strip — only show when no platform locked (browsing mode) */}
        {!platform && (
          <div style={{
            marginTop: 32,
            padding: '18px 22px', borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 18,
          }}>
            {[
              { n: 1, l: 'Escolha a plataforma' },
              { n: 2, l: 'Selecione o template' },
              { n: 3, l: 'Defina o período' },
              { n: 4, l: 'Pague por uso' },
              { n: 5, l: 'Receba em minutos' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>{s.n}</div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.l}</span>
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--separator)' }} />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </DesktopShell>
  );
}

Object.assign(window, {
  DesktopDashboard, DesktopReportDetail, DesktopTemplates,
  DesktopShell, DesktopSidebar, DesktopTopBar,
});
