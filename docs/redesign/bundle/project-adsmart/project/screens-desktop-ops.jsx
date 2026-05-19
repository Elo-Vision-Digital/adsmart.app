// screens-desktop-ops.jsx — Wave 1 desktop screens
// Integrations, Reports list, Transactions/Wallet, Settings

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Integrações
// ────────────────────────────────────────────────────────────────────────────
function DesktopIntegrations({ dark }) {
  const platforms = [
    {
      id: 'google',
      icon: <IconGoogle s={36} />,
      name: 'Google Ads',
      sub: 'Search, Performance Max, Display, YouTube Ads',
      connected: 0,
      accountsCount: 0,
    },
    {
      id: 'meta',
      icon: <IconMeta s={36} />,
      name: 'Meta Ads',
      sub: 'Facebook, Instagram, Stories, Reels, Audience Network',
      connected: 0,
      accountsCount: 0,
    },
  ];

  return (
    <DesktopShell dark={dark} active="integrations">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 28,
        }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Integrações
            </h1>
            <p className="t-body text-2" style={{ marginTop: 8, maxWidth: 560 }}>
              Conecte suas contas para gerar relatórios com dados reais. Usamos OAuth2 — nunca pedimos sua senha.
            </p>
          </div>
          <Button variant="secondary" icon={<IconSparkle s={15} />}>Adicionar contas demo</Button>
        </div>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginBottom: 24 }}>
          {platforms.map(p => (
            <div key={p.id} style={{
              padding: 0, borderRadius: 22, overflow: 'hidden',
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              {/* Hero band */}
              <div style={{
                padding: '24px 26px',
                background: 'var(--bg-elev-2)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 18,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em' }}>{p.name}</div>
                  <div className="t-small text-2" style={{ marginTop: 2 }}>{p.sub}</div>
                </div>
                <Badge tone={p.connected > 0 ? 'success' : 'neutral'}>
                  {p.connected > 0 ? 'Conectado' : 'Não conectado'}
                </Badge>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 26px' }}>
                <div style={{
                  padding: '24px 18px', borderRadius: 14,
                  background: 'var(--bg)', border: '1px dashed var(--border-strong)',
                  textAlign: 'center', marginBottom: 16,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--bg-elev)', border: '1px solid var(--border)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-2)', marginBottom: 10,
                  }}><IconLink s={20} /></div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma conta conectada</div>
                  <p className="t-small text-2" style={{ marginTop: 4 }}>
                    Conecte para começar a gerar relatórios
                  </p>
                </div>
                <Button variant="primary" full icon={<IconLink s={16} />}>
                  Conectar {p.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Security info */}
        <div style={{
          padding: 18, borderRadius: 16,
          background: 'var(--warning-bg)', border: '1px solid var(--border)',
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <div style={{ color: 'var(--warning)', flexShrink: 0, paddingTop: 1 }}>
            <IconShield s={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 650, marginBottom: 4 }}>
              Conexões seguras com OAuth2
            </div>
            <p className="t-small text-2" style={{ lineHeight: 1.5 }}>
              Não armazenamos suas senhas. Você pode revogar o acesso a qualquer momento diretamente
              nas configurações do Google ou Meta, ou aqui mesmo na AdSmart.
            </p>
          </div>
          <Button variant="secondary" size="sm" iconRight={<IconChevR s={14} />}>Saber mais</Button>
        </div>

        {/* Coming soon */}
        <div style={{
          marginTop: 20, padding: 22, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px dashed var(--border-strong)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <IconSparkle s={16} />
            <div className="t-micro" style={{ color: 'var(--text)' }}>Em breve · roadmap</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { name: 'Instagram Ads',  abbr: 'IG', eta: 'Q3 2026' },
              { name: 'TikTok Ads',     abbr: 'TT', eta: 'Q3 2026' },
              { name: 'LinkedIn Ads',   abbr: 'IN', eta: 'Q4 2026' },
            ].map(s => (
              <div key={s.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 14, borderRadius: 14,
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--text-2)',
                  flexShrink: 0,
                }}>{s.abbr}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 650 }}>{s.name}</div>
                  <div className="t-small text-3">{s.eta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Meus Relatórios (lista populada para mostrar o estado preenchido)
// ────────────────────────────────────────────────────────────────────────────
function DesktopReports({ dark, empty = false }) {
  const rows = empty ? [] : [
    { n: 'Lançamento · Maio',     p: <IconGoogle s={14} />, pn: 'Google Ads', d: '18/04 — 18/05', r: 'R$ 124.380', roas: '4,2x', status: 'Concluído', cost: '2 créd.' },
    { n: 'Negócios Locais SP',    p: <IconGoogle s={14} />, pn: 'Google Ads', d: '01/05 — 15/05', r: 'R$ 38.220',  roas: '4,2x', status: 'Concluído', cost: '1 créd.' },
    { n: 'Black Friday · Q1',     p: <IconMeta s={14} />,   pn: 'Meta Ads',   d: '10/04 — 10/05', r: 'R$ 92.140',  roas: '4,9x', status: 'Concluído', cost: '2 créd.' },
    { n: 'Awareness · YouTube',   p: <IconGoogle s={14} />, pn: 'Google Ads', d: '01/05 — 18/05', r: 'R$ 28.420',  roas: '2,4x', status: 'Concluído', cost: '2 créd.' },
    { n: 'Engajamento Reels',     p: <IconMeta s={14} />,   pn: 'Meta Ads',   d: '05/05 — 18/05', r: '—',           roas: '—',    status: 'Processando', cost: '1 créd.' },
    { n: 'Lookalike compradores', p: <IconMeta s={14} />,   pn: 'Meta Ads',   d: '20/04 — 18/05', r: 'R$ 64.310',  roas: '3,8x', status: 'Concluído', cost: '2 créd.' },
  ];

  return (
    <DesktopShell dark={dark} active="reports">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Meus relatórios
            </h1>
            <p className="t-body text-2" style={{ marginTop: 8 }}>
              Gerencie e acesse todos os relatórios gerados.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="secondary" icon={<IconDoc s={15} />}>Exportar tudo</Button>
            <Button variant="primary" icon={<IconPlus s={16} sw={2.2} />}>Criar relatório</Button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { l: 'Total',          v: empty ? '0' : '12',   icon: <IconDoc s={14} /> },
            { l: 'Google Ads',     v: empty ? '0' : '7',    icon: <IconGoogle s={14} /> },
            { l: 'Meta Ads',       v: empty ? '0' : '5',    icon: <IconMeta s={14} /> },
            { l: 'Este mês',       v: empty ? '0' : '6',    icon: <IconCalendar s={14} /> },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 16, borderRadius: 14,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                {s.icon}
                <span className="t-small">{s.l}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div style={{
          padding: 14, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr auto', gap: 10,
          marginBottom: 16, alignItems: 'center',
        }}>
          <Input leading={<IconSearch s={15} />} placeholder="Buscar por nome ou conta…" />
          <Select value="all" options={[
            { value: 'all',    label: 'Todas plataformas' },
            { value: 'google', label: 'Google Ads' },
            { value: 'meta',   label: 'Meta Ads' },
          ]} />
          <Select value="recent" options={[
            { value: 'recent', label: 'Mais recentes' },
            { value: 'old',    label: 'Mais antigos' },
            { value: 'name',   label: 'Por nome' },
          ]} />
          <Button variant="secondary" icon={<IconFilter s={14} />} size="md">Mais filtros</Button>
        </div>

        {/* Table or empty */}
        <div style={{
          padding: 0, borderRadius: 18, overflow: 'hidden',
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          {empty ? (
            <div style={{
              padding: '60px 20px', textAlign: 'center',
            }}>
              <div style={{
                width: 68, height: 68, borderRadius: 20,
                background: 'var(--bg-elev-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)', marginBottom: 16,
              }}>
                <IconDoc s={32} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 650 }}>Nenhum relatório encontrado</div>
              <p className="t-small text-2" style={{ marginTop: 6, marginBottom: 18 }}>
                Tente ajustar os filtros ou crie um novo relatório
              </p>
              <Button variant="primary" icon={<IconPlus s={14} sw={2.2} />}>Criar primeiro relatório</Button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  {['Relatório', 'Plataforma', 'Período', 'Receita', 'ROAS', 'Custo', 'Status', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '14px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '1px solid var(--separator)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--separator)' : 0 }}>
                    <td style={{ padding: '14px 14px', fontSize: 14, fontWeight: 600 }}>{r.n}</td>
                    <td style={{ padding: '14px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-2)' }}>
                        {r.p} {r.pn}
                      </span>
                    </td>
                    <td style={{ padding: '14px 14px', fontSize: 13, color: 'var(--text-2)' }}>{r.d}</td>
                    <td style={{ padding: '14px 14px', fontSize: 13, fontWeight: 600 }}>{r.r}</td>
                    <td style={{ padding: '14px 14px' }}><Badge tone="neutral">{r.roas}</Badge></td>
                    <td style={{ padding: '14px 14px', fontSize: 13, color: 'var(--text-2)' }}>{r.cost}</td>
                    <td style={{ padding: '14px 14px' }}>
                      <Badge tone={r.status === 'Concluído' ? 'success' : 'warning'}>
                        {r.status === 'Concluído' ? <IconCheck s={10} sw={2.8} /> : <IconRefresh s={10} sw={2.5} />}
                        {' '}{r.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                      <button style={{
                        width: 32, height: 32, borderRadius: 8, color: 'var(--text-2)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}><IconChevR s={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Carteira (Transactions)
// ────────────────────────────────────────────────────────────────────────────
function DesktopTransactions({ dark }) {
  const txs = [
    { kind: 'credit', label: 'Créditos adicionados · bônus de boas-vindas',
      sub: 'Pacote inicial cortesia', date: '18/05/2026', time: '01:47', amount: '+200 créditos', status: 'Concluída' },
    { kind: 'debit',  label: 'Relatório Lançamento · Maio (Google Ads)',
      sub: 'Template: Lançamento', date: '15/05/2026', time: '14:22', amount: '−2 créditos', status: 'Concluída' },
    { kind: 'debit',  label: 'Relatório Negócios Locais SP (Google Ads)',
      sub: 'Template: Negócios Locais', date: '12/05/2026', time: '10:18', amount: '−1 crédito', status: 'Concluída' },
    { kind: 'debit',  label: 'Relatório Black Friday · Q1 (Meta Ads)',
      sub: 'Template: Lançamento', date: '08/05/2026', time: '16:45', amount: '−2 créditos', status: 'Concluída' },
    { kind: 'debit',  label: 'Relatório Engajamento Reels (Meta Ads)',
      sub: 'Template: Negócios Locais', date: '05/05/2026', time: '09:30', amount: '−1 crédito', status: 'Processando' },
  ];

  return (
    <DesktopShell dark={dark} active="transactions">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Créditos
          </h1>
          <p className="t-body text-2" style={{ marginTop: 8 }}>
            1 crédito = R$ 5,00. Use para gerar relatórios — lançamento custa 2 créditos.
          </p>
        </div>

        {/* Top row: balance hero + summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 22 }}>
          {/* Balance hero */}
          <div style={{
            padding: '28px 28px',
            borderRadius: 22,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -40, top: -40,
              width: 200, height: 200, borderRadius: '50%',
              border: '1px solid currentColor', opacity: 0.08, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', right: -10, top: -10,
              width: 130, height: 130, borderRadius: '50%',
              border: '1px solid currentColor', opacity: 0.14, pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <span className="t-micro" style={{ opacity: 0.7 }}>Créditos disponíveis</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                <span style={{ fontSize: 60, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>200</span>
                <span style={{ fontSize: 22, opacity: 0.65 }}>créditos</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 8, opacity: 0.6 }}>
                Equivale a R$ 1.000,00 · gera até 100 relatórios Lançamento
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button style={{
                  flex: 1, height: 44, borderRadius: 12,
                  background: 'var(--accent-fg)', color: 'var(--accent)',
                  fontSize: 14, fontWeight: 650,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <IconPlus s={16} sw={2.2} /> Comprar créditos
                </button>
                <button style={{
                  flex: 1, height: 44, borderRadius: 12,
                  background: 'color-mix(in srgb, var(--accent-fg) 14%, transparent)',
                  color: 'var(--accent-fg)',
                  border: '1px solid color-mix(in srgb, var(--accent-fg) 22%, transparent)',
                  fontSize: 14, fontWeight: 650,
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                }}>
                  Exportar extrato
                </button>
              </div>
            </div>
          </div>

          {/* Side stats */}
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { l: 'Créditos recebidos (mês)', v: '+200', tone: 'success', icon: <IconArrowDown s={14} sw={2.2} /> },
              { l: 'Créditos gastos (mês)',    v: '−8',    tone: 'neutral', icon: <IconArrowUp s={14} sw={2.2} /> },
              { l: 'Relatórios gerados',       v: '6',     tone: 'neutral', icon: <IconDoc s={14} /> },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 16, borderRadius: 14,
                background: 'var(--bg-elev)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: s.tone === 'success' ? 'var(--success-bg)' : 'var(--bg-elev-2)',
                  color: s.tone === 'success' ? 'var(--success)' : 'var(--text-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="t-small text-2">{s.l}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 2 }}>{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Segmented + transactions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <Segmented value="all" options={[
            { value: 'all',    label: 'Tudo' },
            { value: 'credit', label: 'Entradas' },
            { value: 'debit',  label: 'Saídas' },
          ]} />
          <Button variant="secondary" size="sm" icon={<IconFilter s={14} />}>Filtrar período</Button>
        </div>

        {/* Transactions list */}
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          {txs.map((tx, i) => (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 20px',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: tx.kind === 'credit' ? 'var(--success-bg)' : 'var(--bg-elev-2)',
                  color: tx.kind === 'credit' ? 'var(--success)' : 'var(--text-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {tx.kind === 'credit' ? <IconArrowDown s={18} sw={2.2} /> : <IconArrowUp s={18} sw={2.2} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{tx.label}</div>
                  <div className="t-small text-2" style={{ marginTop: 2 }}>{tx.sub}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <div className="t-small text-2">{tx.date}</div>
                  <div className="t-small text-3" style={{ marginTop: 2 }}>{tx.time}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 140 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: tx.kind === 'credit' ? 'var(--success)' : 'var(--text)',
                  }}>{tx.amount}</div>
                  <div style={{ marginTop: 4 }}>
                    <Badge tone={tx.status === 'Concluída' ? 'success' : 'warning'}>{tx.status}</Badge>
                  </div>
                </div>
              </div>
              {i < txs.length - 1 && <div className="hairline" style={{ marginLeft: 76 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Configurações
// Two-column layout: profile sidebar + main sectioned form
// ────────────────────────────────────────────────────────────────────────────
function DesktopSettings({ dark, onToggleTheme }) {
  const [docType, setDocType]  = React.useState('cpf');
  const [section, setSection]  = React.useState('profile');

  const nav = [
    { id: 'profile',  label: 'Perfil',         icon: <IconUser s={16} /> },
    { id: 'security', label: 'Segurança',      icon: <IconLock s={16} /> },
    { id: 'prefs',    label: 'Preferências',   icon: <IconSettings s={16} /> },
    { id: 'billing',  label: 'Cobrança',       icon: <IconWallet s={16} /> },
    { id: 'notif',    label: 'Notificações',   icon: <IconBell s={16} /> },
  ];

  return (
    <DesktopShell dark={dark} active="settings">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Configurações
          </h1>
          <p className="t-body text-2" style={{ marginTop: 8 }}>
            Gerencie sua conta, segurança e preferências.
          </p>
        </div>

        {/* Two-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
          {/* Inner left nav */}
          <aside style={{
            padding: 14, borderRadius: 16,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            alignSelf: 'flex-start', position: 'sticky', top: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 14px', borderBottom: '1px solid var(--separator)' }}>
              <Avatar size={42} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Eduardo Rodrigues
                </div>
                <div className="t-small text-2" style={{
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>eduardo@adsmart.app</div>
              </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 8 }}>
              {nav.map(n => (
                <button key={n.id} onClick={() => setSection(n.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: section === n.id ? 'var(--bg)' : 'transparent',
                  color: section === n.id ? 'var(--text)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: section === n.id ? 600 : 500,
                  border: section === n.id ? '1px solid var(--border)' : '1px solid transparent',
                  textAlign: 'left',
                }}>
                  {n.icon}
                  <span style={{ flex: 1 }}>{n.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <main style={{ display: 'grid', gap: 18 }}>
            {/* Personal info */}
            <section style={{
              padding: 24, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>Informações pessoais</div>
                <div className="t-small text-2" style={{ marginTop: 4 }}>Necessárias para depósitos e emissão de notas.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Nome completo">
                  <Input value="Eduardo Rodrigues" leading={<IconUser s={16} />} />
                </Field>
                <Field label="Email" hint="O email não pode ser alterado">
                  <Input value="eduardo@adsmart.app" leading={<IconMail s={16} />} readOnly />
                </Field>
                <Field label="Telefone">
                  <Input placeholder="(00) 00000-0000" leading={<IconPhone s={16} />} />
                </Field>
                <Field label="Tipo de documento">
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Radio checked={docType === 'cpf'}  onClick={() => setDocType('cpf')}  label="CPF" />
                    <Radio checked={docType === 'cnpj'} onClick={() => setDocType('cnpj')} label="CNPJ" />
                  </div>
                </Field>
                <Field label={docType === 'cpf' ? 'CPF' : 'CNPJ'}>
                  <Input placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                         leading={<IconCard s={16} />} />
                </Field>
                <Field label="Endereço (opcional)">
                  <Input placeholder="Rua, número, cidade — UF" />
                </Field>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--separator)',
              }}>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="primary">Salvar alterações</Button>
              </div>
            </section>

            {/* Security */}
            <section style={{
              padding: 24, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>Segurança</div>
                <div className="t-small text-2" style={{ marginTop: 4 }}>Mantenha sua conta protegida.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Senha atual">
                  <Input type="password" placeholder="••••••••" leading={<IconLock s={16} />} />
                </Field>
                <div />
                <Field label="Nova senha" hint="Mín. 8 caracteres, maiúscula, número e especial">
                  <Input type="password" placeholder="Nova senha" leading={<IconLock s={16} />} />
                </Field>
                <Field label="Confirmar nova senha">
                  <Input type="password" placeholder="Confirme" leading={<IconLock s={16} />} />
                </Field>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'flex-end', gap: 10,
                marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--separator)',
              }}>
                <Button variant="primary">Alterar senha</Button>
              </div>
            </section>

            {/* Preferences */}
            <section style={{
              padding: 24, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>Preferências</div>
                <div className="t-small text-2" style={{ marginTop: 4 }}>Idioma, tema e notificações.</div>
              </div>

              <div style={{
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid var(--border)',
              }}>
                {[
                  { icon: <IconGlobe s={20} />, l: 'Idioma',          d: 'Português (Brasil)',
                    control: <div style={{ width: 160 }}><Select value="pt" options={[
                      { value: 'pt', label: 'Português' },
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Español' },
                    ]} /></div> },
                  { icon: dark ? <IconMoon s={20} /> : <IconSun s={20} />, l: 'Modo escuro',
                    d: 'Aparência da interface', control: <Toggle on={dark} onChange={onToggleTheme} /> },
                  { icon: <IconBell s={20} />, l: 'Notificações por email',
                    d: 'Alertas de relatórios e cobranças', control: <Toggle on={true} /> },
                  { icon: <IconSparkle s={20} />, l: 'Receber insights da IA',
                    d: 'Sugestões semanais sobre suas campanhas', control: <Toggle on={true} /> },
                ].map((p, i, arr) => (
                  <React.Fragment key={i}>
                    <div style={{
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--bg)',
                    }}>
                      <div style={{ color: 'var(--text-2)', flexShrink: 0 }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.l}</div>
                        <div className="t-small text-2">{p.d}</div>
                      </div>
                      {p.control}
                    </div>
                    {i < arr.length - 1 && <div className="hairline" style={{ marginLeft: 50 }} />}
                  </React.Fragment>
                ))}
              </div>
            </section>

            {/* Danger */}
            <section style={{
              padding: 20, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 650, color: 'var(--danger)' }}>Sair da conta</div>
                <div className="t-small text-2" style={{ marginTop: 2 }}>Encerrar a sessão atual deste dispositivo</div>
              </div>
              <Button variant="secondary" icon={<IconLogout s={15} />}>Sair</Button>
            </section>
          </main>
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, {
  DesktopIntegrations, DesktopReports, DesktopTransactions, DesktopSettings,
});
