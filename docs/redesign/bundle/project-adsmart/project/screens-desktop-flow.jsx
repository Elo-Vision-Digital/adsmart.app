// screens-desktop-flow.jsx — Wave 2 desktop screens
// Generate report, Generating (loading), Pix payment.

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Generate report (Step 3 of the report flow)
// ────────────────────────────────────────────────────────────────────────────
function DesktopGenerate({ dark, template, onBack }) {
  const t = template || { tag: 'Google Ads', icon: <IconGoogle s={14} />, title: 'Lançamento', credits: 2, kind: 'growth' };

  return (
    <DesktopShell dark={dark} active="templates">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1180, margin: '0 auto' }}>
        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          {[
            { n: 1, label: 'Plataforma', done: true },
            { n: 2, label: 'Template', done: true },
            { n: 3, label: 'Pagamento', active: true },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: s.active ? 'var(--accent)' : s.done ? 'var(--success-bg)' : 'var(--bg-elev)',
                  color: s.active ? 'var(--accent-fg)' : s.done ? 'var(--success)' : 'var(--text-2)',
                  border: (s.active || s.done) ? '0' : '1px solid var(--border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}>{s.done ? <IconCheck s={12} sw={2.8} /> : s.n}</span>
                <span className="t-small" style={{
                  fontWeight: s.active ? 600 : 500,
                  color: (s.active || s.done) ? 'var(--text)' : 'var(--text-2)',
                }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <span style={{ width: 28, height: 1, background: 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>

        <button onClick={onBack} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
          marginBottom: 16, marginLeft: -4,
        }}>
          <IconChevL s={16} /> Trocar template
        </button>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Gerar relatório
          </h1>
          <p className="t-body text-2" style={{ marginTop: 8, maxWidth: 540 }}>
            Configure os detalhes — usaremos os créditos da sua conta para gerar.
          </p>
        </div>

        {/* Two-col: form + summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* FORM */}
          <div style={{ display: 'grid', gap: 18 }}>
            {/* Account */}
            <section style={{
              padding: 24, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>Conta de anúncios</div>
                <div className="t-small text-2" style={{ marginTop: 3 }}>Selecione a conta para analisar.</div>
              </div>
              <div style={{
                padding: '20px 18px', borderRadius: 14,
                background: 'var(--bg)', border: '1px dashed var(--border-strong)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--bg-elev)', border: '1px solid var(--border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-2)', marginBottom: 10,
                }}><IconLink s={20} /></div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma conta {t.tag} conectada</div>
                <p className="t-small text-2" style={{ marginTop: 4, marginBottom: 12 }}>
                  Conecte uma conta ou continue em modo demo
                </p>
                <Button variant="secondary" size="sm" icon={<IconPlus s={14} sw={2.2} />}>Conectar conta</Button>
              </div>
              <div style={{
                marginTop: 14, padding: 12, borderRadius: 10,
                background: 'var(--warning-bg)', border: '1px solid var(--border)',
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <div style={{ color: 'var(--warning)', flexShrink: 0 }}><IconWarning s={16} /></div>
                <div className="t-small" style={{ flex: 1 }}>
                  Modo demo ativo. Conecte sua conta na versão final para dados reais.
                </div>
              </div>
            </section>

            {/* Period */}
            <section style={{
              padding: 24, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>Período de análise</div>
                <div className="t-small text-2" style={{ marginTop: 3 }}>Defina o intervalo dos dados do relatório.</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <Field label="Data inicial">
                  <Input value="18/04/2026" leading={<IconCalendar s={16} />} />
                </Field>
                <Field label="Data final">
                  <Input value="18/05/2026" leading={<IconCalendar s={16} />} />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip>Últimos 7 dias</Chip>
                <Chip active>Últimos 30 dias</Chip>
                <Chip>Este mês</Chip>
                <Chip>Mês passado</Chip>
                <Chip>90 dias</Chip>
              </div>
            </section>

            {/* Name */}
            <section style={{
              padding: 24, borderRadius: 18,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 650 }}>Nome do relatório</div>
                <div className="t-small text-2" style={{ marginTop: 3 }}>Opcional — usado para encontrar depois.</div>
              </div>
              <Field>
                <Input placeholder={`${t.tag} - ${t.title} - 18/05/2026`} leading={<IconDoc s={16} />} />
              </Field>
            </section>
          </div>

          {/* SUMMARY (sticky) */}
          <aside style={{
            position: 'sticky', top: 16, alignSelf: 'flex-start',
            padding: 0, borderRadius: 22, overflow: 'hidden',
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            {/* Template card */}
            <div style={{
              padding: 18,
              background: 'var(--bg-elev-2)',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{t.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Template selecionado
                </div>
                <div style={{ fontSize: 14, fontWeight: 650, marginTop: 2 }}>{t.tag} · {t.title}</div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div style={{ padding: 18 }}>
              <div className="t-micro text-2" style={{ marginBottom: 12 }}>Resumo do pedido</div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingBottom: 12, borderBottom: '1px solid var(--separator)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-2)' }}>Custo do relatório</span>
                <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconSparkle s={13} /> {t.credits} créditos
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                paddingTop: 12, fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-2)' }}>Período</span>
                <span style={{ fontWeight: 600 }}>30 dias</span>
              </div>

              {/* Balance */}
              <div style={{
                marginTop: 14, padding: 14, borderRadius: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="t-small text-2">Créditos disponíveis</span>
                  <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.018em' }}>200</span>
                </div>
                <div style={{
                  marginTop: 10, padding: 10, borderRadius: 8,
                  background: 'var(--bg-elev-2)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span className="t-small" style={{ fontWeight: 600 }}>Após geração</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{200 - t.credits} créditos</span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Badge tone="success"><IconCheck s={10} sw={2.8} /> Saldo suficiente</Badge>
                </div>
              </div>

              {/* CTA */}
              <Button variant="primary" size="lg" full icon={<IconSparkle s={16} />}
                      style={{ marginTop: 16 }}>
                Gerar relatório
              </Button>
              <p className="t-small text-3" style={{ textAlign: 'center', marginTop: 10 }}>
                {t.credits} créditos serão debitados ao confirmar
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Generating (loading state)
// ────────────────────────────────────────────────────────────────────────────
function DesktopGenerating({ dark, progress = 64 }) {
  const stages = [
    { l: 'Conectando à conta',          done: true },
    { l: 'Coletando dados (30 dias)',   done: true },
    { l: 'Calculando métricas',         done: false, active: true },
    { l: 'Gerando insights',            done: false },
    { l: 'Renderizando dashboard',      done: false },
  ];

  return (
    <DesktopShell dark={dark} active="reports">
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px', minHeight: 'calc(100vh - 78px)',
      }}>
        <div style={{
          maxWidth: 640, width: '100%',
          padding: 36, borderRadius: 24,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          {/* Animated ring */}
          <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 28 }}>
            <svg viewBox="0 0 180 180" width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="90" cy="90" r="78" fill="none" stroke="var(--chart-4)" strokeWidth="8" />
              <circle cx="90" cy="90" r="78" fill="none" stroke="var(--chart-1)" strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*78}`}
                      strokeDashoffset={`${2*Math.PI*78 * (1 - progress/100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset .4s ease' }} />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column',
            }}>
              <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.025em' }}>{progress}%</span>
              <span className="t-small text-2" style={{ marginTop: 2 }}>processando</span>
            </div>
          </div>

          <AIBadge>Gerando seu relatório</AIBadge>
          <h2 style={{
            fontSize: 28, fontWeight: 700, letterSpacing: '-0.022em', lineHeight: 1.1,
            marginTop: 14, marginBottom: 8,
          }}>
            Construindo sua análise
          </h2>
          <p className="t-body text-2" style={{ maxWidth: 360 }}>
            Estamos coletando os dados e calculando as métricas. Costuma levar menos de 1 minuto.
          </p>

          {/* Stages */}
          <div style={{
            width: '100%', marginTop: 28,
            padding: '6px 18px', borderRadius: 14,
            background: 'var(--bg)', border: '1px solid var(--border)',
            textAlign: 'left',
          }}>
            {stages.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: s.done ? 'var(--success-bg)' : s.active ? 'var(--bg-elev)' : 'transparent',
                  border: s.done ? 'none' : `1.5px solid ${s.active ? 'var(--text)' : 'var(--border-strong)'}`,
                  color: 'var(--success)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {s.done && <IconCheck s={12} sw={2.8} />}
                  {s.active && (
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--text)', animation: 'dgpulse 1s infinite',
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
            marginTop: 22, padding: '10px 18px',
            fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
          }}>Cancelar geração</button>
        </div>
      </div>
      <style>{`@keyframes dgpulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
    </DesktopShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Pix (buy credits)
// ────────────────────────────────────────────────────────────────────────────
function DesktopPix({ dark }) {
  const [pack, setPack] = React.useState(25);
  const packages = [
    { credits: 5,   price: 25,   bonus: 0 },
    { credits: 10,  price: 50,   bonus: 0 },
    { credits: 25,  price: 125,  bonus: 2 },
    { credits: 50,  price: 250,  bonus: 5 },
    { credits: 100, price: 500,  bonus: 15 },
  ];
  const selected = packages.find(p => p.credits === pack) || packages[2];
  const totalCredits = selected.credits + selected.bonus;

  return (
    <DesktopShell dark={dark} active="transactions">
      <div style={{ padding: '36px 32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Comprar créditos
          </h1>
          <p className="t-body text-2" style={{ marginTop: 8 }}>
            Pagamento via Pix processado pela Stripe — créditos liberados em segundos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* LEFT — packages */}
          <div style={{ display: 'grid', gap: 12 }}>
            <div className="t-micro text-2">Escolha um pacote</div>
            {packages.map(p => (
              <button key={p.credits} onClick={() => setPack(p.credits)} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 16, alignItems: 'center',
                padding: '18px 20px', borderRadius: 16, textAlign: 'left',
                background: pack === p.credits ? 'var(--bg-elev)' : 'transparent',
                border: `1px solid ${pack === p.credits ? 'var(--text)' : 'var(--border)'}`,
                transition: 'all .15s', width: '100%',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: `1.5px solid ${pack === p.credits ? 'var(--text)' : 'var(--border-strong)'}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {pack === p.credits && <span style={{
                    width: 12, height: 12, borderRadius: '50%', background: 'var(--text)',
                  }} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em' }}>
                      {p.credits} créditos
                    </span>
                    {p.bonus > 0 && <Badge tone="success">+{p.bonus} bônus</Badge>}
                  </div>
                  <div className="t-small text-2" style={{ marginTop: 3 }}>
                    Gera {Math.floor(p.credits / 2)} relatórios Lançamento ou {p.credits} de Negócios Locais
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>
                    R$ {p.price.toFixed(2).replace('.', ',')}
                  </div>
                  <div className="t-small text-3" style={{ marginTop: 2 }}>
                    R$ {(p.price / (p.credits + p.bonus)).toFixed(2).replace('.', ',')}/crédito
                  </div>
                </div>
                {p.credits === 100 && <Badge tone="ink">Melhor valor</Badge>}
                {p.credits !== 100 && <span style={{ width: 80 }} />}
              </button>
            ))}
          </div>

          {/* RIGHT — Pix QR + summary */}
          <aside style={{
            position: 'sticky', top: 16, alignSelf: 'flex-start',
            padding: 24, borderRadius: 22,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div className="t-micro text-2" style={{ marginBottom: 12 }}>Resumo do pedido</div>
            <div style={{
              padding: 16, borderRadius: 14,
              background: 'var(--bg)', border: '1px solid var(--border)',
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingBottom: 12, borderBottom: '1px solid var(--separator)',
              }}>
                <span className="t-small text-2">Você compra</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{totalCredits} créditos</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                paddingTop: 12,
              }}>
                <span className="t-small text-2">Total</span>
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em' }}>
                  R$ {selected.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* QR */}
            <div style={{
              padding: 16, borderRadius: 14,
              background: 'var(--bg)', border: '1px solid var(--border)',
              textAlign: 'center', marginBottom: 12,
            }}>
              <div style={{
                display: 'inline-block', padding: 12, borderRadius: 12,
                background: '#fff', boxShadow: 'var(--shadow-1)', marginBottom: 12,
              }}>
                <PixQR size={160} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Escaneie com seu banco</div>
              <p className="t-small text-2" style={{ marginTop: 4 }}>ou copie o código abaixo</p>
            </div>

            {/* Copy code */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              marginBottom: 14,
            }}>
              <div className="t-mono" style={{
                fontSize: 11, color: 'var(--text-2)',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>00020126580014BR.GOV.BCB.PIX0136a1...</div>
              <Button variant="secondary" size="sm">Copiar</Button>
            </div>

            {/* Status */}
            <div style={{
              padding: 12, borderRadius: 12,
              background: 'var(--warning-bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
                <svg viewBox="0 0 28 28" width="28" height="28" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="14" cy="14" r="11" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <circle cx="14" cy="14" r="11" fill="none" stroke="var(--warning)" strokeWidth="2.5"
                          strokeDasharray={2*Math.PI*11} strokeDashoffset={2*Math.PI*11 * 0.35} strokeLinecap="round" />
                </svg>
              </div>
              <div className="t-small" style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>Aguardando pagamento</div>
                <div style={{ color: 'var(--text-2)', marginTop: 2 }}>Expira em 09:42</div>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 14, color: 'var(--text-3)',
            }}>
              <IconLock s={12} />
              <span className="t-small">Pagamento processado pela Stripe</span>
            </div>
          </aside>
        </div>
      </div>
    </DesktopShell>
  );
}

Object.assign(window, { DesktopGenerate, DesktopGenerating, DesktopPix });
