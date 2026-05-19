// screens-ai.jsx — AI ecosystem (analyses)
// Hub + Campaign Analysis + Creative Ideas + Audience Insights + Engagement
// Visual signature: subtle gradient borders, sparkle markers, AI badge.

// ────────────────────────────────────────────────────────────────────────────
// Shared AI primitives
// ────────────────────────────────────────────────────────────────────────────
function AIBadge({ size = 'sm', children = 'IA' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: size === 'sm' ? '3px 7px' : '5px 10px',
      borderRadius: 999,
      background: 'var(--bg)',
      color: 'var(--text)',
      border: '1px solid var(--border-strong)',
      fontSize: size === 'sm' ? 10 : 12, fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      lineHeight: 1,
    }}>
      <IconSparkle s={size === 'sm' ? 10 : 12} />
      {children}
    </span>
  );
}

// AI card with hairline gradient stroke (subtle "made by IA" cue)
function AICard({ children, style = {}, glow = false }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 18,
      padding: 1,
      background: 'linear-gradient(135deg, var(--border-strong), var(--border) 30%, var(--border-strong) 70%, var(--border))',
      ...style,
    }}>
      {glow && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 18,
          background: 'radial-gradient(ellipse at top right, var(--chart-1), transparent 60%)',
          opacity: 0.08, pointerEvents: 'none',
        }} />
      )}
      <div style={{
        borderRadius: 17, background: 'var(--bg-elev)',
        position: 'relative', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

// Circular score (0-10)
function AIScore({ value = 7.2, size = 80, label }) {
  const pct = value / 10;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--chart-4)" strokeWidth="5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--chart-1)" strokeWidth="5"
                strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column',
      }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value.toFixed(1)}
        </span>
        {label && <span className="t-small text-3" style={{ marginTop: 2 }}>{label}</span>}
      </div>
    </div>
  );
}

// Diagnostic row (finding with reason + suggestion)
function AIFinding({ tone = 'success', title, body, action }) {
  const tones = {
    success: { icon: <IconCheckCircle s={18} sw={1.8} />, color: 'var(--success)', bg: 'var(--success-bg)' },
    warning: { icon: <IconWarning s={18} sw={1.8} />,     color: 'var(--warning)', bg: 'var(--warning-bg)' },
    danger:  { icon: <IconWarning s={18} sw={1.8} />,     color: 'var(--danger)',  bg: 'var(--danger-bg)' },
    info:    { icon: <IconSparkle s={18} />,              color: 'var(--text)',    bg: 'var(--bg-elev-2)' },
  }[tone];
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '14px 16px',
      borderRadius: 14, background: 'var(--bg-elev)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: tones.bg, color: tones.color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{tones.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.3 }}>{title}</div>
        {body && <p className="t-small text-2" style={{ marginTop: 4, lineHeight: 1.4 }}>{body}</p>}
        {action && <div style={{ marginTop: 10 }}>{action}</div>}
      </div>
    </div>
  );
}

// Prompt card with copy + generate actions
function PromptCard({ title, prompt, kind = 'image' }) {
  const targets = kind === 'image'
    ? [
        { l: 'Nano Banana', short: 'NB' },
        { l: 'ChatGPT',     short: 'CG' },
        { l: 'Midjourney',  short: 'MJ' },
      ]
    : [
        { l: 'ChatGPT', short: 'CG' },
        { l: 'Claude',  short: 'CL' },
      ];
  return (
    <div style={{
      padding: 16, borderRadius: 16,
      background: 'var(--bg-elev)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 650, letterSpacing: '-0.005em' }}>{title}</div>
          <AIBadge>Prompt {kind === 'image' ? 'visual' : 'texto'}</AIBadge>
        </div>
      </div>
      <div style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'var(--bg)', border: '1px solid var(--border)',
        fontSize: 12, fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        color: 'var(--text-2)', lineHeight: 1.45,
        marginBottom: 12, maxHeight: 88, overflow: 'hidden',
        position: 'relative',
      }}>
        {prompt}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
          background: 'linear-gradient(to bottom, transparent, var(--bg))', pointerEvents: 'none',
        }} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Button variant="primary" size="sm" icon={<IconSparkle s={13} />}>Gerar</Button>
        <Button variant="secondary" size="sm">Copiar</Button>
        {targets.map(t => (
          <button key={t.l} title={`Abrir em ${t.l}`} style={{
            height: 32, padding: '0 10px', borderRadius: 8,
            background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
            fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
          }}>{t.l}</button>
        ))}
      </div>
    </div>
  );
}

// Compact title block
function AITitle({ overline, title, sub, score }) {
  return (
    <div style={{ padding: '8px 18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {overline && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <AIBadge>IA</AIBadge>
            <span className="t-small text-2">{overline}</span>
          </div>
        )}
        <h1 style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.022em',
          color: 'var(--text)', lineHeight: 1.1,
        }}>{title}</h1>
        {sub && <p className="t-body text-2" style={{ marginTop: 6, lineHeight: 1.4 }}>{sub}</p>}
      </div>
      {score !== undefined && <AIScore value={score} size={72} label="/ 10" />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AI HUB — central landing page for AI capabilities
// ────────────────────────────────────────────────────────────────────────────
function ScreenAIHub({ dark, onTab, onNav }) {
  const capabilities = [
    { id: 'ai-campaign',  icon: <IconTrendUp s={18} />, title: 'Análise de campanhas',     sub: 'Diagnóstico completo, performance e correções automáticas' },
    { id: 'ai-creative',  icon: <IconSparkle s={18} />,  title: 'Ideias de criativos',      sub: 'Prompts prontos para gerar imagens e vídeos com IA' },
    { id: 'ai-audience',  icon: <IconUser s={18} />,     title: 'Insights de público',      sub: 'Persona detalhada e novos públicos sugeridos' },
    { id: 'ai-library',   icon: <IconReport s={18} />,   title: 'Biblioteca de anúncios',   sub: 'Compare com anúncios líderes do seu segmento' },
    { id: 'ai-briefing',  icon: <IconDoc s={18} />,      title: 'Solicitar criativos',      sub: 'Briefing detalhado para gravar com seu time' },
    { id: 'ai-engagement',icon: <IconBell s={18} />,     title: 'Engajamento e branding',   sub: 'Para campanhas sem foco em conversão direta' },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab}>
      {/* Hero */}
      <div style={{ padding: '18px 18px 0' }}>
        <AIBadge size="lg">Inteligência AdSmart</AIBadge>
        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--text)', marginTop: 12, lineHeight: 1.1,
        }}>
          Sua IA para anúncios<br/>
          <span className="text-2">que entende seu negócio.</span>
        </h1>
      </div>

      {/* Big quick-action card */}
      <div style={{ padding: '20px 18px 24px' }}>
        <div style={{
          padding: '20px 20px', borderRadius: 22,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative sparkles */}
          {[[15, 30, 5], [85, 20, 3], [75, 70, 4], [40, 65, 2.5], [90, 50, 3.5]].map(([x, y, r], i) => (
            <div key={i} style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`,
              width: r * 2, height: r * 2, borderRadius: '50%',
              background: 'currentColor', opacity: 0.3 - i * 0.04,
              pointerEvents: 'none',
            }} />
          ))}
          {/* decorative star */}
          <div style={{ position: 'absolute', right: 18, top: 18, opacity: 0.18 }}>
            <IconSparkle s={64} sw={1.4} />
          </div>
          <div style={{ position: 'relative' }}>
            <div className="t-micro" style={{ opacity: 0.7 }}>Análise completa</div>
            <h2 style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4, lineHeight: 1.15,
              maxWidth: 240,
            }}>
              Analise toda sua conta em 30 segundos.
            </h2>
            <p style={{ fontSize: 13, marginTop: 10, opacity: 0.7, maxWidth: 260 }}>
              Conectamos suas campanhas e devolvemos diagnóstico + plano de ação.
            </p>
            <button style={{
              marginTop: 18, padding: '10px 18px', borderRadius: 999,
              background: 'var(--accent-fg)', color: 'var(--accent)',
              fontSize: 14, fontWeight: 650,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <IconSparkle s={15} />
              Analisar minha conta agora
            </button>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <SectionHead title="O que a IA pode fazer" sub="Toque para abrir cada análise" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 10 }}>
        {capabilities.map((cap, i) => (
          <button key={cap.id} onClick={() => onNav && onNav(cap.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 16px', borderRadius: 16, textAlign: 'left',
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            width: '100%',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{cap.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 650, letterSpacing: '-0.005em' }}>{cap.title}</div>
              <div className="t-small text-2" style={{ marginTop: 2, lineHeight: 1.35 }}>{cap.sub}</div>
            </div>
            <IconChevR s={18} />
          </button>
        ))}
      </div>

      {/* Recent insights */}
      <SectionHead title="Insights recentes" sub="Análises da última semana" />
      <div style={{ padding: '0 18px 32px', display: 'grid', gap: 10 }}>
        {[
          { time: 'há 2 dias', plat: <IconMeta s={14} />, t: 'Lançamento · Maio', insight: 'Criativo v3 está cansado — substituir em até 5 dias' },
          { time: 'há 4 dias', plat: <IconGoogle s={14} />, t: 'Search · Brand',  insight: 'ROAS 6,8x — recomendado aumentar verba em 30%' },
          { time: 'há 6 dias', plat: <IconMeta s={14} />, t: 'Awareness · Q2',   insight: 'Público amplo está se sobrepondo ao remarketing' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-2)', marginBottom: 6 }}>
              {s.plat}
              <span className="t-small" style={{ fontWeight: 600 }}>{s.t}</span>
              <span className="t-small text-3">·</span>
              <span className="t-small text-3">{s.time}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: 'var(--text-2)', marginTop: 2 }}><IconSparkle s={13} /></span>
              <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{s.insight}</span>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CAMPAIGN ANALYSIS — full diagnosis of a single campaign
// ────────────────────────────────────────────────────────────────────────────
function ScreenAICampaign({ dark, onTab, onBack, platform = 'meta' }) {
  const PlatIcon = platform === 'google' ? IconGoogle : IconMeta;
  const platName = platform === 'google' ? 'Google Ads' : 'Meta Ads';

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <AITitle
        overline={<><PlatIcon s={12} /> {platName} · Lançamento · Maio</>}
        title="Diagnóstico da campanha"
        sub="Análise feita há 2 minutos · 30 dias de dados"
        score={7.2}
      />

      {/* Health summary */}
      <div style={{ padding: '0 18px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Saúde',     v: 'Boa', tone: 'success' },
            { l: 'Entrega',   v: 'Parcial', tone: 'warning' },
            { l: 'Eficiência',v: 'Ótima', tone: 'success' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 14,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div className="t-small text-2">{m.l}</div>
              <div style={{ marginTop: 6 }}>
                <Badge tone={m.tone}>{m.v}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's working */}
      <SectionHead title="O que está funcionando" sub="3 acertos detectados" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 10 }}>
        <AIFinding tone="success"
          title="Criativo principal com forte engajamento"
          body="O vídeo de 15s 'Antes/Depois' tem CTR 4,2% (média do segmento: 2,1%). Continue investindo." />
        <AIFinding tone="success"
          title="ROAS acima da média do segmento"
          body="4,2x vs. média de 2,8x para e-commerce de moda. Bom ajuste de público × oferta." />
        <AIFinding tone="success"
          title="Lookalike 1% performando bem"
          body="O lookalike baseado em compradores está convertendo a CPA 28% menor que o público amplo." />
      </div>

      {/* Issues */}
      <SectionHead title="Pontos de atenção" sub="2 sinais de degradação" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 10 }}>
        <AIFinding tone="warning"
          title="Sinais de fadiga criativa em 5 dias"
          body="O criativo v3 (estático) teve queda de 32% no CTR nos últimos 7 dias. Frequência atual: 4,8."
          action={<Button variant="secondary" size="sm" icon={<IconSparkle s={13} />}>Gerar substituto</Button>} />
        <AIFinding tone="warning"
          title="Sobreposição entre conjuntos de anúncio"
          body="Os públicos 'Compradores recentes' e 'Visitantes 30d' têm 38% de sobreposição — você está competindo com você mesmo."
          action={<Button variant="secondary" size="sm">Ver detalhes</Button>} />
      </div>

      {/* Why not delivering */}
      <SectionHead title="Por que não está entregando" sub="Análise da fase de aprendizado" />
      <div style={{ padding: '0 18px 24px' }}>
        <AICard>
          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--warning-bg)', color: 'var(--warning)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconWarning s={18} /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 650 }}>Conjunto de anúncios em "Aprendizado limitado"</div>
                <div className="t-small text-2">{platform === 'google' ? 'Google Ads' : 'Meta'} precisa de mais sinal</div>
              </div>
            </div>
            <p className="t-small text-2" style={{ lineHeight: 1.5, marginBottom: 14 }}>
              O algoritmo está fora da fase de aprendizado completa porque você teve menos de 50 conversões em 7 dias.
              Isso reduz a entrega e infla o CPA. As 3 causas principais:
            </p>
            <ol style={{ listStyle: 'none', display: 'grid', gap: 8, marginLeft: 0 }}>
              {[
                'Orçamento diário baixo para o CPA atual (R$ 35/dia, CPA R$ 28)',
                'Evento de otimização escasso — apenas 12 compras/semana',
                'Janela de atribuição em 1 dia pós-clique limita aprendizado',
              ].map((c, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{i+1}</span>
                  <span className="t-small" style={{ lineHeight: 1.4 }}>{c}</span>
                </li>
              ))}
            </ol>
          </div>
        </AICard>
      </div>

      {/* Action plan */}
      <SectionHead title="Plano de ação" sub="3 mudanças sugeridas" />
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          borderRadius: 18, background: 'var(--bg-elev)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {[
            { t: 'Aumentar orçamento em 40%',          impact: '+R$ 14/dia', delta: '+24% conversões previstas' },
            { t: 'Otimizar para "Adicionar ao carrinho"', impact: 'evento intermediário', delta: 'sai do aprendizado em 5d' },
            { t: 'Substituir criativo v3',              impact: 'fadiga em 5d', delta: '+18% CTR estimado' },
          ].map((a, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0,
                }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.t}</div>
                  <div className="t-small text-2" style={{ marginTop: 2 }}>{a.impact} · {a.delta}</div>
                </div>
                <Toggle on={i < 2} />
              </div>
              {i < arr.length - 1 && <div className="hairline" style={{ marginLeft: 50 }} />}
            </React.Fragment>
          ))}
        </div>
        <Button variant="primary" size="lg" full icon={<IconSparkle s={16} />} style={{ marginTop: 14 }}>
          Aplicar 2 sugestões selecionadas
        </Button>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CREATIVE IDEAS — analyzes current creatives + generates new ideas
// ────────────────────────────────────────────────────────────────────────────
function ScreenAICreative({ dark, onTab, onBack }) {
  const creatives = [
    { rank: 1, name: 'Antes/Depois · vídeo 15s', metric: 'CTR 4,2%',  badge: 'Top', tone: 'success' },
    { rank: 2, name: 'Carrossel produtos · imagem', metric: 'CTR 2,8%',  badge: 'OK',  tone: 'neutral' },
    { rank: 3, name: 'Depoimento cliente · vídeo 30s', metric: 'CTR 2,1%', badge: 'OK', tone: 'neutral' },
    { rank: 4, name: 'Banner promo · estático',    metric: 'CTR 0,8%',  badge: 'Fadiga', tone: 'danger' },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <AITitle
        overline="Análise de criativos"
        title="Criativos & ideias"
        sub="Performance dos seus + prompts para criar novos"
      />

      {/* Current creatives ranking */}
      <SectionHead title="Seus criativos atuais" sub="Ranking dos últimos 30 dias" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 8 }}>
        {creatives.map(c => (
          <div key={c.rank} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 10,
              background: 'var(--bg-inset)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* miniature creative placeholder */}
              <svg width="32" height="32" viewBox="0 0 32 32">
                <rect x="4" y="4" width="24" height="24" rx="3" fill="var(--chart-3)" opacity="0.4" />
                <circle cx="16" cy="14" r="4" fill="var(--chart-1)" opacity="0.6" />
                <rect x="6" y="22" width="20" height="2" rx="1" fill="var(--text-3)" opacity="0.6" />
              </svg>
              {c.rank === 1 && <div style={{
                position: 'absolute', top: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--success)', color: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
              }}>1</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>{c.metric}</div>
            </div>
            <Badge tone={c.tone}>{c.badge}</Badge>
          </div>
        ))}
      </div>

      {/* Why top works */}
      <SectionHead title="Por que o top performa" sub="Insights do criativo #1" />
      <div style={{ padding: '0 18px 24px' }}>
        <AICard glow>
          <div style={{ padding: 18 }}>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 12 }}>
              {[
                { l: 'Gancho nos primeiros 3 segundos',     d: 'Pergunta retórica + zoom no problema visual' },
                { l: 'Transformação visual concreta',        d: 'Comparativo lado-a-lado, sem narração excessiva' },
                { l: 'Prova social autêntica',               d: 'Depoimento real, sem aparência de roteirizado' },
                { l: 'Chamada para ação clara no fim',       d: 'Texto em tela: "Toque aqui" + áudio reforça' },
              ].map((p, i) => (
                <li key={i} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--success)', flexShrink: 0, paddingTop: 2 }}>
                    <IconCheck s={16} sw={2.5} />
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{p.l}</div>
                    <div className="t-small text-2" style={{ marginTop: 2, lineHeight: 1.4 }}>{p.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </AICard>
      </div>

      {/* Generate new ideas */}
      <SectionHead title="Ideias para novos criativos" sub="Prompts prontos para gerar com IA" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 12 }}>
        <PromptCard
          title="Cena: rotina matinal real"
          kind="image"
          prompt='Fotografia editorial, mulher 30 anos em cozinha aconchegante usando o produto, luz natural quente da janela, foco no rosto satisfeito, profundidade rasa, estilo Apple ad, 4K hiperrealista' />
        <PromptCard
          title="Carrossel: 5 problemas resolvidos"
          kind="image"
          prompt='Série de 5 imagens estilo flat illustration moderna mostrando 5 problemas do segmento sendo resolvidos. Paleta minimalista preto e branco com 1 acento de cor. Tipografia bold em cada quadro.' />
        <PromptCard
          title="Vídeo curto: depoimento autêntico"
          kind="text"
          prompt='Roteiro de 30s para depoimento autêntico de cliente. Estrutura: gancho com objeção comum (5s) → relato pessoal específico (15s) → resultado mensurável (8s) → CTA clara (2s). Tom conversacional, sem jargão de marketing.' />
        <PromptCard
          title="Copy: anúncio com prova social"
          kind="text"
          prompt='Escreva 5 variações de copy para Meta Ads (até 125 caracteres) usando o framework PASTOR: Problema, Amplificação, Solução, Transformação, Oferta, Resposta. Segmento: e-commerce de moda feminina sustentável.' />
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// AUDIENCE INSIGHTS — persona + new audience suggestions
// ────────────────────────────────────────────────────────────────────────────
function ScreenAIAudience({ dark, onTab, onBack }) {
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <AITitle
        overline="Análise de público"
        title="Quem realmente compra de você"
        sub="Persona construída a partir de 1.840 conversões"
      />

      {/* Persona card */}
      <div style={{ padding: '0 18px 24px' }}>
        <AICard glow>
          <div style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--chart-3), var(--chart-1))',
              opacity: 0.85, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--bg)', fontSize: 28, fontWeight: 700,
            }}>M</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>Mariana, 34</div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>Persona principal · 62% das conversões</div>
              <p style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5, color: 'var(--text)' }}>
                Mulher 28-42 anos, profissional liberal ou empreendedora, mãe de um filho, mora em capital do sudeste,
                renda familiar acima de R$ 8K. Consome conteúdo no Instagram nos intervalos do trabalho (manhã/almoço/noite),
                compra por impulso quando vê transformação visual concreta. Valoriza praticidade e estética.
              </p>
            </div>
          </div>
        </AICard>
      </div>

      {/* Demographics */}
      <SectionHead title="Composição demográfica" sub="Quem está convertendo" />
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          padding: 18, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'grid', gap: 18,
        }}>
          {[
            { l: 'Gênero',        bars: [{ k: 'Feminino', v: 84 }, { k: 'Masculino', v: 14 }, { k: 'Outro', v: 2 }] },
            { l: 'Faixa etária',  bars: [{ k: '25-34', v: 38 }, { k: '35-44', v: 32 }, { k: '45-54', v: 18 }, { k: '18-24', v: 12 }] },
            { l: 'Localização',   bars: [{ k: 'SP', v: 42 }, { k: 'RJ', v: 18 }, { k: 'MG', v: 12 }, { k: 'Outros', v: 28 }] },
          ].map((g, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 8 }}>{g.l}</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {g.bars.map(b => (
                  <div key={b.k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="t-small" style={{ width: 80, color: 'var(--text-2)' }}>{b.k}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${b.v}%`, background: 'var(--chart-1)', borderRadius: 3 }} />
                    </div>
                    <span className="t-small" style={{ width: 32, textAlign: 'right', fontWeight: 600 }}>{b.v}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Behaviors + interests */}
      <SectionHead title="Comportamentos & interesses" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 10 }}>
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div className="t-micro text-2" style={{ marginBottom: 8 }}>Comportamentos</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Compradores frequentes online', 'Engaja com vídeos curtos', 'Usuários de Stories', 'Compras com cartão',
              'Procura cupom antes de comprar', 'Pesquisa em horário de almoço'].map(b => (
              <Chip key={b}>{b}</Chip>
            ))}
          </div>
        </div>
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div className="t-micro text-2" style={{ marginBottom: 8 }}>Interesses</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Moda sustentável', 'Bem-estar', 'Maternidade', 'Home office',
              'Receitas rápidas', 'Decoração minimalista', 'Yoga', 'Skincare'].map(b => (
              <Chip key={b}>{b}</Chip>
            ))}
          </div>
        </div>
      </div>

      {/* New audience suggestions */}
      <SectionHead title="Novos públicos sugeridos" sub="Onde você ainda não anuncia" />
      <div style={{ padding: '0 18px 32px', display: 'grid', gap: 10 }}>
        {[
          { name: 'Mulheres 35-44 · interesses cruzados',
            why: 'Mesmas características da persona mas faixa etária com menor saturação',
            est: '+R$ 32K alcance estimado', impact: '+18%' },
          { name: 'Lookalike 1% baseado em LTV alto',
            why: 'Construído sobre clientes que compraram 3+ vezes — alta taxa de conversão prevista',
            est: '~480K pessoas similares', impact: '+24%' },
          { name: 'Engajados com criativo top 30d',
            why: 'Custom audience com quem assistiu 75%+ do vídeo "Antes/Depois"',
            est: '~28K pessoas quentes', impact: 'CPA -22%' },
        ].map((a, i) => (
          <div key={i} style={{
            padding: 16, borderRadius: 16,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 650, flex: 1 }}>{a.name}</div>
              <Badge tone="success">{a.impact}</Badge>
            </div>
            <p className="t-small text-2" style={{ marginTop: 6, lineHeight: 1.4 }}>{a.why}</p>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--separator)',
            }}>
              <span className="t-small text-3">{a.est}</span>
              <Button variant="secondary" size="sm" icon={<IconPlus s={13} sw={2.2} />}>Criar público</Button>
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ENGAGEMENT — for non-conversion campaigns
// ────────────────────────────────────────────────────────────────────────────
function ScreenAIEngagement({ dark, onTab, onBack }) {
  const [tab, setTab] = React.useState('engajar');
  const types = [
    { id: 'engajar',     label: 'Engajar' },
    { id: 'entreter',    label: 'Entreter' },
    { id: 'influenciar', label: 'Influenciar' },
    { id: 'monetizar',   label: 'Monetizar' },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <AITitle
        overline="Conteúdo orgânico / engajamento"
        title="Para campanhas que não convertem direto"
        sub="Engajamento, branding e renovação de base"
      />

      {/* Tabs */}
      <div style={{ padding: '0 18px 18px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {types.map(t => (
          <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</Chip>
        ))}
      </div>

      {/* Big insight card */}
      <div style={{ padding: '0 18px 24px' }}>
        <AICard glow>
          <div style={{ padding: 20 }}>
            <div className="t-micro text-2" style={{ marginBottom: 8 }}>Padrão dominante · {tab}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 10 }}>
              {tab === 'engajar' && 'Histórias em primeira pessoa geram 3,2× mais salvamentos'}
              {tab === 'entreter' && 'Sketches com gancho cômico nos primeiros 2s retêm 78%'}
              {tab === 'influenciar' && 'Bastidores autênticos constroem confiança 4× mais rápido'}
              {tab === 'monetizar' && 'Tutoriais com aplicação direta convertem em 14d'}
            </h3>
            <p className="t-small text-2" style={{ lineHeight: 1.5 }}>
              Análise feita sobre 240 anúncios líderes do seu segmento rodando há mais de 90 dias na biblioteca.
              Os formatos que dominam o engajamento orgânico e pago seguem padrões claros.
            </p>
          </div>
        </AICard>
      </div>

      {/* Top patterns */}
      <SectionHead title="O que está funcionando no seu segmento" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 10 }}>
        {[
          { n: 1, t: 'Hook visual nos 2 primeiros segundos', d: 'Sem texto explicativo. Mostre o ponto de chegada antes do começo.' },
          { n: 2, t: 'Cortes secos a cada 3-4 segundos', d: 'Mantém atenção em feeds com scroll rápido. Use até 8 cortes em 30s.' },
          { n: 3, t: 'Legenda sempre visível', d: '85% do consumo é com som desligado. Captions são obrigatórias.' },
          { n: 4, t: 'CTA implícita, não explícita', d: 'Para engajamento, peça reação ("conta nos comentários") em vez de venda.' },
        ].map(p => (
          <div key={p.n} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', gap: 12,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0,
            }}>{p.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.t}</div>
              <div className="t-small text-2" style={{ marginTop: 3, lineHeight: 1.4 }}>{p.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top creators in segment */}
      <SectionHead title="Referências do segmento" sub="Quem está rodando há mais tempo" />
      <div style={{ padding: '0 18px 32px', display: 'grid', gap: 10 }}>
        {[
          { name: 'Studio Vela',     metric: '14 anúncios ativos · há 6 meses', engage: 'Alto', tone: 'success' },
          { name: 'Casa Naturalle',  metric: '8 anúncios ativos · há 4 meses',  engage: 'Médio', tone: 'neutral' },
          { name: 'Olá, Mãe',        metric: '22 anúncios ativos · há 9 meses', engage: 'Alto', tone: 'success' },
        ].map((r, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--bg-inset)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'var(--text-2)',
              border: '1px solid var(--border)', flexShrink: 0,
            }}>{r.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 650 }}>{r.name}</div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>{r.metric}</div>
            </div>
            <Badge tone={r.tone}>{r.engage}</Badge>
            <IconChevR s={16} />
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

Object.assign(window, {
  ScreenAIHub, ScreenAICampaign, ScreenAICreative, ScreenAIAudience, ScreenAIEngagement,
  AIBadge, AICard, AIScore, AIFinding, PromptCard,
});
