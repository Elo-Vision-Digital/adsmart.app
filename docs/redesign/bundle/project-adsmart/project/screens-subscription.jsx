// screens-subscription.jsx — Plano Premium (R$ 197/mês via Stripe)
// Unlocks the AI ecosystem. Mobile + desktop versions.

// ────────────────────────────────────────────────────────────────────────────
// Shared content data
// ────────────────────────────────────────────────────────────────────────────
const PREMIUM_FEATURES = [
  { icon: 'IconTrendUp',  title: 'Análise completa de campanhas',     sub: 'Diagnóstico de saúde, entrega e eficiência com plano de ação' },
  { icon: 'IconSparkle',  title: 'Ideias de criativos com IA',         sub: 'Prompts prontos para Nano Banana, ChatGPT, Midjourney' },
  { icon: 'IconUser',     title: 'Insights de público em profundidade',sub: 'Persona detalhada + novos públicos sugeridos por LTV' },
  { icon: 'IconReport',   title: 'Comparação com biblioteca de anúncios', sub: 'Veja o que líderes do seu segmento rodam há +90 dias' },
  { icon: 'IconDoc',      title: 'Briefings automáticos para criativos',sub: 'Detecta fadiga e prepara briefing pronto para envio' },
  { icon: 'IconBell',     title: 'Insights de engajamento e branding', sub: 'Para campanhas sem foco em conversão direta' },
  { icon: 'IconCheck',    title: 'Wizard de novas campanhas',          sub: 'Pipeline completo: ângulo, público, criativos, copy' },
  { icon: 'IconRefresh',  title: 'Alertas semanais por email',          sub: 'Sumário do que mudou e o que fazer essa semana' },
];

function PremiumFeatureIcon({ name }) {
  const map = {
    IconTrendUp, IconSparkle, IconUser, IconReport,
    IconDoc, IconBell, IconCheck, IconRefresh,
  };
  const C = map[name] || IconSparkle;
  return <C s={18} />;
}

// ────────────────────────────────────────────────────────────────────────────
// MOBILE — Subscription
// ────────────────────────────────────────────────────────────────────────────
function ScreenSubscription({ dark, onTab, onBack }) {
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      {/* Hero */}
      <div style={{ padding: '8px 18px 24px' }}>
        <AIBadge size="lg">Plano Premium</AIBadge>
        <h1 style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em',
          color: 'var(--text)', marginTop: 14, lineHeight: 1.08,
        }}>
          Desbloqueie toda<br/>a inteligência da<br/>AdSmart.
        </h1>
        <p className="t-body text-2" style={{ marginTop: 10, maxWidth: 320, lineHeight: 1.45 }}>
          Análises, ideias de criativos, insights de público e briefings automáticos — tudo por uma mensalidade.
        </p>
      </div>

      {/* Premium card */}
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: '24px 22px', borderRadius: 24,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative ring */}
          <div style={{
            position: 'absolute', right: -50, top: -50,
            width: 200, height: 200, borderRadius: '50%',
            border: '1px solid currentColor', opacity: 0.08, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: -20, top: -20,
            width: 130, height: 130, borderRadius: '50%',
            border: '1px solid currentColor', opacity: 0.14, pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'color-mix(in srgb, var(--accent-fg) 16%, transparent)',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            }}>
              <IconSparkle s={11} /> PREMIUM
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
              <span style={{ fontSize: 18, opacity: 0.7 }}>R$</span>
              <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1 }}>197</span>
              <span style={{ fontSize: 18, opacity: 0.7 }}>/mês</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.65, marginTop: 6 }}>
              Cancele a qualquer momento · processado pela Stripe
            </div>
            <button style={{
              marginTop: 22, width: '100%', height: 52, borderRadius: 14,
              background: 'var(--accent-fg)', color: 'var(--accent)',
              fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <IconSparkle s={16} /> Assinar agora
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, opacity: 0.7 }}>
              <IconLock s={12} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>Pagamento seguro via Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <SectionHead title="O que está incluído" sub="Tudo o que a Inteligência AdSmart oferece" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 10 }}>
        {PREMIUM_FEATURES.map((f, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', flexShrink: 0,
            }}>
              <PremiumFeatureIcon name={f.icon} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 650, lineHeight: 1.3 }}>{f.title}</div>
              <div className="t-small text-2" style={{ marginTop: 3, lineHeight: 1.4 }}>{f.sub}</div>
            </div>
            <IconCheck s={16} sw={2.4} />
          </div>
        ))}
      </div>

      {/* Plan comparison */}
      <SectionHead title="Free vs Premium" />
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          borderRadius: 18, overflow: 'hidden',
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          {/* header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr',
            padding: '12px 14px',
            borderBottom: '1px solid var(--separator)',
            background: 'var(--bg-elev-2)',
          }}>
            <div className="t-micro text-2">Funcionalidade</div>
            <div className="t-micro text-2" style={{ textAlign: 'center' }}>Free</div>
            <div className="t-micro text-2" style={{ textAlign: 'center', color: 'var(--text)' }}>Premium</div>
          </div>
          {/* rows */}
          {[
            { l: 'Geração de relatórios',     free: 'Por crédito',      pre: 'Por crédito' },
            { l: 'Compra de créditos',         free: '✓',               pre: '✓' },
            { l: 'Análise IA de campanhas',    free: '×',               pre: '✓' },
            { l: 'Ideias de criativos com IA', free: '×',               pre: '✓' },
            { l: 'Insights de público',        free: '×',               pre: '✓' },
            { l: 'Wizard novas campanhas',     free: '×',               pre: '✓' },
            { l: 'Suporte',                    free: 'Email',           pre: 'Prioritário' },
          ].map((r, i, arr) => (
            <React.Fragment key={i}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr',
                padding: '12px 14px', alignItems: 'center',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.l}</div>
                <div style={{ fontSize: 13, textAlign: 'center', color: r.free === '×' ? 'var(--text-3)' : 'var(--text-2)' }}>
                  {r.free}
                </div>
                <div style={{ fontSize: 13, textAlign: 'center', fontWeight: 600, color: 'var(--text)' }}>{r.pre}</div>
              </div>
              {i < arr.length - 1 && <div className="hairline" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FAQ-ish help */}
      <div style={{ padding: '0 18px 32px' }}>
        <div style={{
          padding: 14, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{ color: 'var(--text-2)', flexShrink: 0 }}><IconHeadset s={18} /></div>
          <div className="t-small text-2" style={{ lineHeight: 1.45, flex: 1 }}>
            Você pode pausar ou cancelar a assinatura a qualquer momento — sem multas. O acesso permanece até o fim do ciclo pago.
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Subscription
// ────────────────────────────────────────────────────────────────────────────
function DesktopSubscription({ dark }) {
  return (
    <DesktopShell dark={dark} active="settings">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1080, margin: '0 auto' }}>
        {/* Hero header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <AIBadge size="lg">Plano Premium</AIBadge>
          <h1 style={{
            fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em',
            color: 'var(--text)', marginTop: 18, lineHeight: 1.05,
          }}>
            Desbloqueie toda a<br/>inteligência da AdSmart.
          </h1>
          <p className="t-body text-2" style={{ marginTop: 14, maxWidth: 580, marginInline: 'auto', lineHeight: 1.45 }}>
            Análises completas de campanhas, ideias de criativos com IA, insights de público
            e briefings automáticos — tudo por uma mensalidade.
          </p>
        </div>

        {/* Two-column hero: pricing card + screenshot */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, marginBottom: 36 }}>
          {/* Pricing card */}
          <div style={{
            padding: '32px 32px',
            borderRadius: 28,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -60, top: -60,
              width: 240, height: 240, borderRadius: '50%',
              border: '1px solid currentColor', opacity: 0.08, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', right: -20, top: -20,
              width: 150, height: 150, borderRadius: '50%',
              border: '1px solid currentColor', opacity: 0.14, pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 999,
                background: 'color-mix(in srgb, var(--accent-fg) 16%, transparent)',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
              }}>
                <IconSparkle s={12} /> PREMIUM · MENSAL
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 22 }}>
                <span style={{ fontSize: 22, opacity: 0.7 }}>R$</span>
                <span style={{ fontSize: 80, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>197</span>
                <span style={{ fontSize: 22, opacity: 0.7 }}>/mês</span>
              </div>
              <div style={{ fontSize: 14, opacity: 0.65, marginTop: 10 }}>
                Cancele a qualquer momento · sem multas
              </div>
              <button style={{
                marginTop: 28, width: '100%', height: 56, borderRadius: 14,
                background: 'var(--accent-fg)', color: 'var(--accent)',
                fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <IconSparkle s={17} /> Assinar agora
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, opacity: 0.7 }}>
                <IconLock s={13} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>Pagamento seguro · processado pela Stripe</span>
              </div>
            </div>
          </div>

          {/* Side preview */}
          <div style={{
            padding: 24, borderRadius: 24,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                O que você desbloqueia
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
                {PREMIUM_FEATURES.slice(0, 6).map((f, i) => (
                  <div key={i} style={{
                    padding: 14, borderRadius: 14,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: 'var(--bg-elev-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10,
                    }}>
                      <PremiumFeatureIcon name={f.icon} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.3 }}>{f.title}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="t-small text-2" style={{
              marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--separator)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <IconCheck s={14} sw={2.5} />
              <span>+ 2 funcionalidades adicionais</span>
            </div>
          </div>
        </div>

        {/* All features list */}
        <div style={{
          padding: 28, borderRadius: 24,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.018em', marginBottom: 18 }}>
            Tudo o que está incluído
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {PREMIUM_FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)', flexShrink: 0,
                }}>
                  <PremiumFeatureIcon name={f.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 650 }}>{f.title}</div>
                  <div className="t-small text-2" style={{ marginTop: 3, lineHeight: 1.4 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison table */}
        <div style={{
          padding: 0, borderRadius: 18, overflow: 'hidden',
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
            padding: '16px 20px',
            borderBottom: '1px solid var(--separator)',
            background: 'var(--bg-elev-2)',
          }}>
            <div className="t-micro text-2">Funcionalidade</div>
            <div className="t-micro text-2" style={{ textAlign: 'center' }}>Free</div>
            <div className="t-micro" style={{ textAlign: 'center', color: 'var(--text)', fontWeight: 700 }}>Premium</div>
          </div>
          {[
            { l: 'Geração de relatórios',     free: 'Por crédito',  pre: 'Por crédito' },
            { l: 'Compra de créditos via Pix', free: '✓',           pre: '✓' },
            { l: 'Análise IA de campanhas',    free: '—',           pre: 'Ilimitada' },
            { l: 'Ideias de criativos com IA', free: '—',           pre: 'Ilimitada' },
            { l: 'Insights detalhados de público', free: '—',       pre: '✓' },
            { l: 'Comparação com biblioteca',  free: '—',           pre: '✓' },
            { l: 'Briefings automáticos',      free: '—',           pre: '✓' },
            { l: 'Wizard de novas campanhas',  free: '—',           pre: '✓' },
            { l: 'Alertas semanais por email', free: '—',           pre: '✓' },
            { l: 'Suporte',                    free: 'Email',        pre: 'Prioritário' },
          ].map((r, i, arr) => (
            <React.Fragment key={i}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                padding: '14px 20px', alignItems: 'center',
              }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{r.l}</div>
                <div style={{ fontSize: 13, textAlign: 'center', color: r.free === '—' ? 'var(--text-3)' : 'var(--text-2)' }}>
                  {r.free}
                </div>
                <div style={{ fontSize: 14, textAlign: 'center', fontWeight: 600, color: 'var(--text)' }}>{r.pre}</div>
              </div>
              {i < arr.length - 1 && <div className="hairline" style={{ marginLeft: 20, marginRight: 20 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, { ScreenSubscription, DesktopSubscription, PREMIUM_FEATURES });
