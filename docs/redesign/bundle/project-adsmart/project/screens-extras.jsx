// screens-extras.jsx — Dashboard variations, Report detail, Loading, Payment
// (Pix + Card), and Generate report success.

// ────────────────────────────────────────────────────────────────────────────
// DASHBOARD V2 — Data-rich, populated with metrics
// ────────────────────────────────────────────────────────────────────────────
function ScreenDashboardV2({ dark, onTab, onNav }) {
  return (
    <ScreenShell dark={dark} active="home" onTab={onTab}>
      <div style={{ padding: '18px 18px 8px' }}>
        <span className="t-small text-2">Olá, Eduardo · maio/2026</span>
        <h1 style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.022em',
          color: 'var(--text)', marginTop: 4, lineHeight: 1.12,
        }}>
          Performance do mês
        </h1>
      </div>

      {/* Hero chart card */}
      <div style={{ padding: '0 18px 20px' }}>
        <div style={{
          padding: 18, borderRadius: 22,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div className="t-small text-2">Investimento total</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>R$</span>
                <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1 }}>48.290</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
                            color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>
                <IconArrowUp s={12} sw={2.5} /> +18,2% vs. mês passado
              </div>
            </div>
            <Segmented value="30d" options={[
              { value: '7d',  label: '7d' },
              { value: '30d', label: '30d' },
              { value: '90d', label: '90d' },
            ]} />
          </div>
          <div style={{ marginTop: 12 }}>
            <AreaChart data={[18,22,19,28,26,32,29,35,32,38,42,40,46,48,52,49,56,60,58,64,68,66,72]} height={130} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            paddingTop: 4, color: 'var(--text-3)', fontSize: 10, fontWeight: 500,
          }}>
            <span>1 mai</span><span>8 mai</span><span>15 mai</span><span>22 mai</span><span>hoje</span>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ padding: '0 18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Impressões" value="2,4M" delta="+12%" icon={<IconReport s={14} />}
                  data={[10,14,12,18,15,22,19,28,26,32]} />
        <StatCard label="Cliques" value="38,2K" delta="+8,5%" icon={<IconCheck s={14} />}
                  data={[5,8,7,10,9,14,12,18,16,22]} />
        <StatCard label="Conversões" value="1.840" delta="+24%" icon={<IconTrendUp s={14} />}
                  data={[3,5,4,7,6,9,8,12,11,16]} />
        <StatCard label="ROAS" value="4,2x" delta="-2,1%" deltaPos={false} icon={<IconSparkle s={14} />}
                  data={[8,7,9,7,8,6,7,5,6,4]} />
      </div>

      {/* Platform split */}
      <SectionHead title="Por plataforma" sub="Distribuição do investimento" />
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: 18, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <Donut size={104} stroke={14}
            segments={[
              { v: 62, c: 'var(--chart-1)' },
              { v: 38, c: 'var(--chart-3)' },
            ]}
            center={
              <>
                <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--text)' }}>R$ 48K</span>
                <span className="t-small text-2" style={{ marginTop: -2 }}>total</span>
              </>
            }
          />
          <div style={{ flex: 1, display: 'grid', gap: 12 }}>
            {[
              { icon: <IconGoogle s={18} />, name: 'Google Ads', value: 'R$ 29.940', pct: '62%', color: 'var(--chart-1)' },
              { icon: <IconMeta s={18} />,   name: 'Meta Ads',   value: 'R$ 18.350', pct: '38%', color: 'var(--chart-3)' },
            ].map(p => (
              <div key={p.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                  {p.icon}
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{p.pct}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', marginTop: 3, paddingLeft: 16 }}>
                  {p.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <SectionHead
        title="Relatórios recentes"
        action={<button onClick={() => onTab && onTab('reports')} style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', gap: 2,
        }}>Ver tudo <IconChevR s={14} /></button>}
      />
      <div style={{ padding: '0 18px 28px' }}>
        <div style={{
          borderRadius: 18, background: 'var(--bg-elev)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {[
            { plat: <IconGoogle s={18} />, name: 'Lançamento · Maio', date: '15/05/2026', tone: 'success', status: 'Concluído' },
            { plat: <IconMeta s={18} />,   name: 'Negócios Locais',   date: '12/05/2026', tone: 'success', status: 'Concluído' },
            { plat: <IconGoogle s={18} />, name: 'Black Friday Q1',   date: '08/05/2026', tone: 'success', status: 'Concluído' },
          ].map((r, i, arr) => (
            <React.Fragment key={i}>
              <button onClick={() => onNav && onNav('report-detail')} style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'transparent',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{r.plat}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div className="t-small text-2">{r.date}</div>
                </div>
                <Badge tone={r.tone}>{r.status}</Badge>
                <IconChevR s={16} />
              </button>
              {i < arr.length - 1 && <div className="hairline" style={{ marginLeft: 66 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DASHBOARD V3 — Editorial / focused on a single hero metric
// ────────────────────────────────────────────────────────────────────────────
function ScreenDashboardV3({ dark, onTab, onNav }) {
  return (
    <ScreenShell dark={dark} active="home" onTab={onTab}>
      {/* Editorial header */}
      <div style={{ padding: '22px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
          <span style={{ width: 4, height: 4, borderRadius: 99, background: 'var(--success)' }} />
          <span className="t-small" style={{ fontWeight: 600 }}>AO VIVO · Atualizado agora</span>
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1,
          color: 'var(--text)', marginTop: 10,
        }}>
          Retorno sobre o<br/>investimento (ROAS)
        </h1>
      </div>

      {/* Hero giant number */}
      <div style={{ padding: '18px 18px 24px' }}>
        <div style={{
          padding: '28px 22px',
          borderRadius: 24,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -60, top: -60,
            width: 240, height: 240, borderRadius: '50%',
            border: '1px solid currentColor', opacity: 0.08,
          }} />
          <div style={{
            position: 'absolute', right: -30, top: -30,
            width: 180, height: 180, borderRadius: '50%',
            border: '1px solid currentColor', opacity: 0.12,
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--accent-fg) 14%, transparent)',
              fontSize: 11, fontWeight: 600,
            }}>
              <IconArrowUp s={11} sw={2.5} /> +0,8x esta semana
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 14 }}>
              <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.9 }}>4,2</span>
              <span style={{ fontSize: 28, fontWeight: 600, opacity: 0.6 }}>x</span>
            </div>
            <p style={{ fontSize: 13, marginTop: 12, opacity: 0.65, maxWidth: 230 }}>
              Para cada R$ 1 investido, você gerou R$ 4,20 em receita atribuível.
            </p>
            <div style={{ marginTop: 18, opacity: 0.95 }}>
              <svg viewBox="0 0 280 60" width="100%" height="60" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,40 C30,32 50,38 80,24 C110,12 140,18 170,14 C200,10 230,6 280,4 L280,60 L0,60 Z" fill="url(#hg)" />
                <path d="M0,40 C30,32 50,38 80,24 C110,12 140,18 170,14 C200,10 230,6 280,4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs as horizontal scroll */}
      <div style={{
        display: 'flex', gap: 10, padding: '0 18px 24px',
        overflowX: 'auto',
      }}>
        {[
          { l: 'CPA médio',     v: 'R$ 24,80', d: '-12%', pos: true },
          { l: 'CTR',           v: '3,4%',     d: '+0,5pp', pos: true },
          { l: 'Conversões',    v: '1.840',    d: '+24%', pos: true },
          { l: 'CPC',           v: 'R$ 1,28',  d: '+4%', pos: false },
        ].map((k, i) => (
          <div key={i} style={{
            flexShrink: 0, width: 140,
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div className="t-small text-2">{k.l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 4 }}>{k.v}</div>
            <div style={{
              fontSize: 11, fontWeight: 600, marginTop: 6,
              color: k.pos ? 'var(--success)' : 'var(--danger)',
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              {k.pos ? <IconArrowUp s={11} sw={2.5} /> : <IconArrowDown s={11} sw={2.5} />}
              {k.d}
            </div>
          </div>
        ))}
      </div>

      {/* AI insight */}
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          padding: 16, borderRadius: 18,
          background: 'var(--success-bg)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: 'var(--success)' }}><IconSparkle s={16} /></div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.01em', textTransform: 'uppercase' }}>
              Insight automático
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text)', marginTop: 8, lineHeight: 1.45, fontWeight: 500 }}>
            Sua campanha <strong>"Lançamento · Maio"</strong> está com ROAS 2,3x acima da média.
            Considere aumentar o orçamento em 30%.
          </p>
          <button style={{
            marginTop: 12, padding: '8px 14px', borderRadius: 999,
            background: 'var(--text)', color: 'var(--bg)',
            fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Ver detalhes <IconChevR s={12} sw={2.5} />
          </button>
        </div>
      </div>

      {/* Top campaigns */}
      <SectionHead title="Top campanhas" sub="Por receita atribuída" />
      <div style={{ padding: '0 18px 28px', display: 'grid', gap: 8 }}>
        {[
          { rank: 1, name: 'Lançamento · Maio',     plat: <IconGoogle s={14} />, val: 'R$ 12.4K', roas: '6,8x' },
          { rank: 2, name: 'Black Friday Q1',       plat: <IconMeta s={14} />,   val: 'R$ 9.2K',  roas: '4,9x' },
          { rank: 3, name: 'Negócios Locais SP',    plat: <IconGoogle s={14} />, val: 'R$ 7.1K',  roas: '4,2x' },
        ].map(c => (
          <div key={c.rank} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--text-2)',
            }}>{c.rank}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {c.plat}
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
              </div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>ROAS {c.roas}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em' }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// REPORT DETAIL — full dashboard of a generated report
// ────────────────────────────────────────────────────────────────────────────
function ScreenReportDetail({ dark, onTab, onBack }) {
  return (
    <ScreenShell dark={dark} active="reports" onTab={onTab} back onBack={onBack}>
      {/* Title block */}
      <div style={{ padding: '8px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', marginBottom: 6 }}>
          <IconGoogle s={14} />
          <span className="t-small" style={{ fontWeight: 600 }}>Google Ads · Lançamento</span>
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.022em',
          color: 'var(--text)', lineHeight: 1.12,
        }}>
          Lançamento · Maio 2026
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Badge tone="success"><IconCheck s={11} sw={2.5} /> Concluído</Badge>
          <span className="t-small text-2">18/04 — 18/05/2026 · 30 dias</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button variant="primary" size="sm" icon={<IconArrowDown s={14} sw={2.2} />}>Exportar PDF</Button>
          <Button variant="secondary" size="sm" icon={<IconRefresh s={14} />}>Atualizar</Button>
          <Button variant="secondary" size="sm" style={{ width: 36, padding: 0 }}><IconMore s={16} /></Button>
        </div>
      </div>

      {/* Big chart */}
      <div style={{ padding: '0 18px 20px' }}>
        <div style={{
          padding: 16, borderRadius: 20,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="t-small text-2">Receita atribuída</div>
              <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>R$ 124.380</div>
            </div>
            <Badge tone="success"><IconArrowUp s={11} sw={2.5} /> +32%</Badge>
          </div>
          <div style={{ marginTop: 14 }}>
            <AreaChart data={[24,28,22,32,38,30,42,48,40,52,58,50,62,68,64,72,78,74,82,88,86,92,98]} height={140} />
          </div>
        </div>
      </div>

      {/* KPI grid (6 cards) */}
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          borderRadius: 20, overflow: 'hidden',
          border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: 'var(--border)',
          gap: 1,
        }}>
          {[
            { l: 'Investido',    v: 'R$ 29.940',  d: '+18%', pos: true },
            { l: 'Receita',      v: 'R$ 124.380', d: '+32%', pos: true },
            { l: 'Impressões',   v: '2.4M',       d: '+12%', pos: true },
            { l: 'Cliques',      v: '38.2K',      d: '+8%',  pos: true },
            { l: 'CTR',          v: '3,4%',       d: '+0,5pp', pos: true },
            { l: 'ROAS',         v: '4,2x',       d: '+0,8x', pos: true },
            { l: 'Conversões',   v: '1.840',      d: '+24%', pos: true },
            { l: 'CPA',          v: 'R$ 24,80',   d: '-12%', pos: true },
          ].map((k, i) => (
            <div key={i} style={{ padding: 14, background: 'var(--bg-elev)' }}>
              <div className="t-small text-2">{k.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 4 }}>{k.v}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 4,
                color: k.pos ? 'var(--success)' : 'var(--danger)',
                display: 'inline-flex', alignItems: 'center', gap: 2,
              }}>
                {k.pos ? <IconArrowUp s={10} sw={2.5} /> : <IconArrowDown s={10} sw={2.5} />}
                {k.d}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown by campaign */}
      <SectionHead title="Campanhas" sub="Performance individual" />
      <div style={{ padding: '0 18px 22px', display: 'grid', gap: 10 }}>
        {[
          { name: 'Search · Brand',     spend: 'R$ 8.4K',  conv: 624, roas: '6,8x' },
          { name: 'Performance Max',    spend: 'R$ 12.2K', conv: 812, roas: '4,1x' },
          { name: 'Display · Remktg',   spend: 'R$ 4.8K',  conv: 248, roas: '3,2x' },
          { name: 'YouTube · Awareness',spend: 'R$ 4.5K',  conv: 156, roas: '2,4x' },
        ].map((c, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
              <Badge tone="neutral">{c.roas}</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div className="t-small text-3">Investido</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{c.spend}</div>
              </div>
              <div>
                <div className="t-small text-3">Conversões</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{c.conv}</div>
              </div>
              <div style={{ flex: 1, maxWidth: 90 }}>
                <Sparkline w={90} h={28} data={[4,6,5,8,7,11,9,14,12,16]} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optimization suggestions */}
      <SectionHead title="Sugestões" sub="Otimizações recomendadas" />
      <div style={{ padding: '0 18px 32px', display: 'grid', gap: 10 }}>
        {[
          { t: 'Aumentar orçamento em Search · Brand', sub: 'ROAS 6,8x acima da média da conta', tone: 'success' },
          { t: 'Pausar criativo "v3-banner"', sub: 'CTR 60% abaixo da campanha', tone: 'warning' },
          { t: 'Testar novo público em PMax', sub: 'Saturação detectada após 21d', tone: 'neutral' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `var(--${s.tone}-bg)`, color: `var(--${s.tone === 'neutral' ? 'text-2' : s.tone})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconSparkle s={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{s.t}</div>
              <div className="t-small text-2" style={{ marginTop: 3 }}>{s.sub}</div>
            </div>
            <IconChevR s={16} />
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// LOADING — Generating report (multi-stage progress)
// ────────────────────────────────────────────────────────────────────────────
function ScreenGenerating({ dark, onTab, progress = 64 }) {
  const stages = [
    { l: 'Conectando à conta',          done: true },
    { l: 'Coletando dados (30 dias)',   done: true },
    { l: 'Calculando métricas',         done: false, active: true },
    { l: 'Gerando insights',            done: false },
    { l: 'Renderizando dashboard',      done: false },
  ];

  return (
    <ScreenShell dark={dark} active="reports" onTab={onTab} hideNav>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 24px 24px', textAlign: 'center', minHeight: '100%',
      }}>
        {/* Animated rings */}
        <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 24 }}>
          <svg viewBox="0 0 140 140" width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--chart-4)" strokeWidth="8" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--chart-1)" strokeWidth="8"
                    strokeDasharray={`${2*Math.PI*60}`}
                    strokeDashoffset={`${2*Math.PI*60 * (1 - progress/100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset .4s ease' }} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
          }}>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em' }}>{progress}%</span>
            <span className="t-small text-2">processando</span>
          </div>
        </div>

        <h2 className="t-h1" style={{ marginBottom: 6 }}>Gerando seu relatório</h2>
        <p className="t-body text-2" style={{ maxWidth: 280 }}>
          Estamos analisando seus dados. Isso costuma levar menos de 1 minuto.
        </p>

        {/* Stages */}
        <div style={{
          width: '100%', marginTop: 28,
          padding: 16, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          textAlign: 'left',
        }}>
          {stages.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 0',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: s.done ? 'var(--success-bg)' : s.active ? 'var(--bg)' : 'transparent',
                border: s.done ? 'none' : `1.5px solid ${s.active ? 'var(--text)' : 'var(--border-strong)'}`,
                color: 'var(--success)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {s.done && <IconCheck s={12} sw={2.8} />}
                {s.active && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--text)', animation: 'pulse 1s infinite',
                  }} />
                )}
              </div>
              <span style={{
                fontSize: 14, fontWeight: s.active ? 600 : 500,
                color: s.done || s.active ? 'var(--text)' : 'var(--text-3)',
                flex: 1,
              }}>{s.l}</span>
            </div>
          ))}
        </div>

        <button style={{
          marginTop: 28, padding: '10px 18px',
          fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
        }}>Cancelar</button>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SKELETON dashboard (initial load)
// ────────────────────────────────────────────────────────────────────────────
function ScreenLoadingDashboard({ dark, onTab }) {
  const sk = (style) => (
    <div style={{
      background: 'linear-gradient(90deg, var(--bg-elev) 0%, var(--bg-elev-2) 50%, var(--bg-elev) 100%)',
      backgroundSize: '200% 100%',
      animation: 'sk 1.5s infinite ease-in-out',
      borderRadius: 10, ...style,
    }} />
  );
  return (
    <ScreenShell dark={dark} active="home" onTab={onTab}>
      <div style={{ padding: '20px 18px 0' }}>
        {sk({ height: 14, width: 100, borderRadius: 6 })}
        <div style={{ height: 10 }} />
        {sk({ height: 28, width: '85%' })}
        <div style={{ height: 6 }} />
        {sk({ height: 28, width: '60%' })}
      </div>
      <div style={{ height: 24 }} />
      <div style={{ padding: '0 18px' }}>
        {sk({ height: 150, borderRadius: 22 })}
      </div>
      <div style={{ height: 16 }} />
      <div style={{ padding: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {sk({ height: 90, borderRadius: 14 })}
        {sk({ height: 90, borderRadius: 14 })}
        {sk({ height: 90, borderRadius: 14 })}
        {sk({ height: 90, borderRadius: 14 })}
      </div>
      <div style={{ height: 24 }} />
      <div style={{ padding: '0 18px' }}>
        {sk({ height: 18, width: 140, marginBottom: 16 })}
        {sk({ height: 70, borderRadius: 14, marginBottom: 8 })}
        {sk({ height: 70, borderRadius: 14, marginBottom: 8 })}
        {sk({ height: 70, borderRadius: 14 })}
      </div>
      <style>{`@keyframes sk { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PIX — purchase credits (Stripe-processed)
// ────────────────────────────────────────────────────────────────────────────
function ScreenPix({ dark, onTab, onBack }) {
  const [pack, setPack] = React.useState(10);
  const packages = [
    { credits: 5,   price: 25,   bonus: 0 },
    { credits: 10,  price: 50,   bonus: 0 },
    { credits: 25,  price: 125,  bonus: 2 },
    { credits: 50,  price: 250,  bonus: 5 },
    { credits: 100, price: 500,  bonus: 15 },
  ];
  const selected = packages.find(p => p.credits === pack) || packages[1];
  const totalCredits = selected.credits + selected.bonus;

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack} hideNav>
      <ScreenTitle title="Comprar créditos" sub="Pagamento via Pix · processado pela Stripe" />

      {/* Package selector */}
      <div style={{ padding: '0 18px 18px' }}>
        <div className="t-small" style={{ fontWeight: 600, marginBottom: 8, paddingLeft: 2 }}>Pacote</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {packages.map(p => (
            <button key={p.credits} onClick={() => setPack(p.credits)} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14, textAlign: 'left',
              background: pack === p.credits ? 'var(--bg-elev)' : 'transparent',
              border: `1px solid ${pack === p.credits ? 'var(--text)' : 'var(--border)'}`,
              transition: 'all .15s', width: '100%',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `1.5px solid ${pack === p.credits ? 'var(--text)' : 'var(--border-strong)'}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {pack === p.credits && <span style={{
                  width: 11, height: 11, borderRadius: '50%', background: 'var(--text)',
                }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em' }}>{p.credits} créditos</span>
                  {p.bonus > 0 && <Badge tone="success">+{p.bonus} bônus</Badge>}
                </div>
                <div className="t-small text-2" style={{ marginTop: 2 }}>
                  R$ {p.price.toFixed(2).replace('.', ',')} · gera {Math.floor(p.credits / 2)} relatórios Lançamento
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary card */}
      <div style={{ padding: '0 18px 18px' }}>
        <div style={{
          padding: 16, borderRadius: 16,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            paddingBottom: 12, borderBottom: '1px solid var(--separator)',
          }}>
            <span className="t-small text-2">Você compra</span>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>{totalCredits} créditos</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            paddingTop: 12,
          }}>
            <span className="t-small text-2">Valor</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>R$ {selected.price.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>

      {/* QR code */}
      <div style={{ padding: '0 18px 18px' }}>
        <div style={{
          padding: 24, borderRadius: 22,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', padding: 16, borderRadius: 16,
            background: '#fff', boxShadow: 'var(--shadow-1)',
          }}>
            <PixQR size={160} />
          </div>
          <p className="t-small text-2" style={{ marginTop: 14, maxWidth: 260, marginInline: 'auto' }}>
            Escaneie com o app do seu banco ou copie o código Pix abaixo
          </p>
        </div>
      </div>

      {/* Copy code */}
      <div style={{ padding: '0 18px 18px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-small text-2">Pix Copia e Cola</div>
            <div className="t-mono" style={{
              fontSize: 12, marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>00020126580014BR.GOV.BCB.PIX0136a1b2c3d4-...</div>
          </div>
          <Button variant="primary" size="sm">Copiar</Button>
        </div>
      </div>

      {/* Timer + status */}
      <div style={{ padding: '0 18px 28px' }}>
        <div style={{
          padding: 14, borderRadius: 14,
          background: 'var(--warning-bg)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--warning)" strokeWidth="3"
                      strokeDasharray={2*Math.PI*15} strokeDashoffset={2*Math.PI*15 * 0.35} strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Aguardando pagamento</div>
            <div className="t-small text-2">Código expira em 09:42 · processado pela Stripe</div>
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// Simple QR-looking SVG (fake — decorative)
function PixQR({ size = 160 }) {
  const cells = 21;
  const cs = size / cells;
  const seed = 7;
  const rng = (i, j) => ((i*31 + j*17 + seed) * 2654435761 >>> 0) % 100;
  const corner = (cx, cy) => (
    <g>
      <rect x={cx} y={cy} width={7*cs} height={7*cs} fill="#000" />
      <rect x={cx + cs} y={cy + cs} width={5*cs} height={5*cs} fill="#fff" />
      <rect x={cx + 2*cs} y={cy + 2*cs} width={3*cs} height={3*cs} fill="#000" />
    </g>
  );
  const dots = [];
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if ((i < 8 && j < 8) || (i < 8 && j > 12) || (i > 12 && j < 8)) continue;
      if (rng(i, j) > 55) dots.push(<rect key={`${i}-${j}`} x={i*cs} y={j*cs} width={cs} height={cs} fill="#000" />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="#fff" />
      {dots}
      {corner(0, 0)}
      {corner(0, (cells - 7) * cs)}
      {corner((cells - 7) * cs, 0)}
      <rect x={size/2 - 16} y={size/2 - 16} width={32} height={32} rx={8} fill="#fff" />
      <rect x={size/2 - 12} y={size/2 - 12} width={24} height={24} rx={6} fill="#1D1D1F" />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="-apple-system, system-ui">a</text>
    </svg>
  );
}

Object.assign(window, {
  ScreenDashboardV2, ScreenDashboardV3, ScreenReportDetail,
  ScreenGenerating, ScreenLoadingDashboard,
  ScreenPix, PixQR,
});
