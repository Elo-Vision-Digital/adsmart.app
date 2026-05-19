// screens-account.jsx — Transações, Configurações, Gerar Relatório

// ────────────────────────────────────────────────────────────────────────────
// TRANSAÇÕES
// ────────────────────────────────────────────────────────────────────────────
function ScreenTransactions({ dark, onTab, onBack }) {
  const credits = 200;
  const txs = [
    { id: 1, kind: 'credit', label: 'Créditos adicionados · bônus de boas-vindas', sub: '18/05/2026 · 01:47', amount: '+200 créditos', status: 'Concluída' },
    { id: 2, kind: 'debit',  label: 'Relatório Lançamento · Maio (Google Ads)',       sub: '15/05/2026 · 14:22', amount: '−2 créditos',   status: 'Concluída' },
    { id: 3, kind: 'debit',  label: 'Relatório Negócios Locais SP (Google Ads)',         sub: '12/05/2026 · 10:18', amount: '−1 crédito',    status: 'Concluída' },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <ScreenTitle title="Créditos" sub="Acompanhe seu saldo e histórico" />

      {/* Balance hero */}
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: '24px 22px',
          borderRadius: 22,
          background: 'var(--accent)', color: 'var(--accent-fg)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -40, top: -40,
            width: 150, height: 150, borderRadius: '50%',
            border: '1px solid currentColor', opacity: 0.08,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: -10, top: -10,
            width: 90, height: 90, borderRadius: '50%',
            border: '1px solid currentColor', opacity: 0.14,
            pointerEvents: 'none',
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Créditos disponíveis
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 50, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{credits}</span>
            <span style={{ fontSize: 18, opacity: 0.7 }}>créditos</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.6 }}>
            1 crédito = R$ 5,00 · equivale a R$ {credits * 5}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
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
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Segmented */}
      <div style={{ padding: '0 18px 14px' }}>
        <Segmented
          value="all"
          options={[
            { value: 'all',    label: 'Tudo' },
            { value: 'credit', label: 'Entradas' },
            { value: 'debit',  label: 'Saídas' },
          ]}
        />
      </div>

      {/* Transactions list */}
      <SectionHead title="Transações recentes" sub="Últimas 10 movimentações" />
      <div style={{ padding: '0 18px 28px' }}>
        <div style={{
          borderRadius: 18, background: 'var(--bg-elev)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {txs.map((tx, i) => (
            <React.Fragment key={tx.id}>
              <div style={{
                display: 'flex', gap: 14, padding: '16px 16px',
                alignItems: 'center',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
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
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{tx.label}</div>
                  <div className="t-small text-2" style={{ marginTop: 2 }}>{tx.sub}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: tx.kind === 'credit' ? 'var(--success)' : 'var(--text)',
                  }}>{tx.amount}</div>
                  <div className="t-small text-2" style={{ marginTop: 2 }}>{tx.status}</div>
                </div>
              </div>
              {i < txs.length - 1 && <div className="hairline" style={{ marginLeft: 68 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Empty hint */}
        <div style={{
          marginTop: 14, padding: 14, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px dashed var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ color: 'var(--text-3)' }}><IconInbox s={20} /></div>
          <div className="t-small text-2">
            Quando você gerar relatórios, as cobranças aparecerão aqui.
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÕES
// ────────────────────────────────────────────────────────────────────────────
function ScreenSettings({ dark, onTab, onBack, onToggleTheme }) {
  const [docType, setDocType] = React.useState('cpf');
  const [lang, setLang] = React.useState('pt');

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <ScreenTitle title="Configurações" sub="Gerencie sua conta e preferências" />

      {/* Profile header */}
      <div style={{
        margin: '0 18px 22px', padding: '18px 18px',
        borderRadius: 18, background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <Avatar size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 650 }}>Eduardo Rodrigues</div>
          <div className="t-small text-2" style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>eduardoteishoku@gmail.com</div>
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--bg)', border: '1px solid var(--border)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconChevR s={16} />
        </button>
      </div>

      {/* Section: Personal info */}
      <SectionHead title="Informações pessoais" sub="Necessárias para depósitos" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 14 }}>
        <Field label="Nome completo">
          <Input value="Eduardo Rodrigues" leading={<IconUser s={16} />} />
        </Field>
        <Field label="Email" hint="O email não pode ser alterado">
          <Input value="eduardoteishoku@gmail.com" leading={<IconMail s={16} />} readOnly />
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
        <Button variant="primary" size="lg" full>Salvar alterações</Button>
      </div>

      {/* Section: Security */}
      <SectionHead title="Segurança" sub="Mantenha sua conta protegida" />
      <div style={{ padding: '0 18px 24px', display: 'grid', gap: 14 }}>
        <Field label="Senha atual">
          <Input type="password" placeholder="••••••••" leading={<IconLock s={16} />} />
        </Field>
        <Field label="Nova senha" hint="Mín. 8 caracteres, maiúscula, número e especial">
          <Input type="password" placeholder="Nova senha" leading={<IconLock s={16} />} />
        </Field>
        <Field label="Confirmar nova senha">
          <Input type="password" placeholder="Confirme" leading={<IconLock s={16} />} />
        </Field>
        <Button variant="primary" size="lg" full>Alterar senha</Button>
      </div>

      {/* Section: Preferences */}
      <SectionHead title="Preferências" />
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          borderRadius: 18, background: 'var(--bg-elev)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
          }}>
            <div style={{ color: 'var(--text-2)' }}><IconGlobe s={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Idioma</div>
              <div className="t-small text-2">Português (Brasil)</div>
            </div>
            <div style={{ width: 130 }}>
              <Select
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'pt', label: 'Português' },
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                ]}
              />
            </div>
          </div>
          <div className="hairline" style={{ marginLeft: 50 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
          }}>
            <div style={{ color: 'var(--text-2)' }}>
              {dark ? <IconMoon s={20} /> : <IconSun s={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Modo escuro</div>
              <div className="t-small text-2">Tema da interface</div>
            </div>
            <Toggle on={dark} onChange={onToggleTheme} />
          </div>
          <div className="hairline" style={{ marginLeft: 50 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
          }}>
            <div style={{ color: 'var(--text-2)' }}><IconBell s={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Notificações</div>
              <div className="t-small text-2">Alertas de relatórios e cobranças</div>
            </div>
            <Toggle on={true} />
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 18px 32px' }}>
        <button style={{
          width: '100%', height: 48, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          color: 'var(--danger)', fontSize: 15, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <IconLogout s={17} /> Sair da conta
        </button>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// GERAR RELATÓRIO — multi-step
// ────────────────────────────────────────────────────────────────────────────
function ScreenGenerate({ dark, onTab, onBack, template }) {
  const [step, setStep] = React.useState(1);
  const t = template || { tag: 'Google Ads', icon: <IconGoogle s={14} />, title: 'Lançamento', credits: 2 };

  return (
    <ScreenShell dark={dark} active="reports" onTab={onTab} back onBack={onBack}>
      <ScreenTitle title="Gerar relatório" sub={`Configure os detalhes do template ${t.title}`} />

      {/* Stepper */}
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 14, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          {[
            { n: 1, label: 'Dados' },
            { n: 2, label: 'Pagamento' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step >= s.n ? 'var(--accent)' : 'var(--bg-elev-2)',
                  color: step >= s.n ? 'var(--accent-fg)' : 'var(--text-2)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  border: step >= s.n ? '0' : '1px solid var(--border)',
                }}>{step > s.n ? <IconCheck s={14} sw={2.5} /> : s.n}</div>
                <span style={{
                  fontSize: 13, fontWeight: step === s.n ? 600 : 500,
                  color: step >= s.n ? 'var(--text)' : 'var(--text-2)',
                }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Template summary */}
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 14, borderRadius: 14,
          background: 'var(--bg-elev-2)', border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: 'var(--bg)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{t.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 650 }}>{t.tag} · {t.title}</div>
            <div className="t-small text-2">Template selecionado</div>
          </div>
          <Badge tone="ink"><IconSparkle s={11} /> {t.credits} créd.</Badge>
        </div>
      </div>

      {step === 1 && (
        <>
          {/* Account */}
          <SectionHead title="Conta de anúncios" sub="Selecione a conta para analisar" />
          <div style={{ padding: '0 18px 22px' }}>
            <div style={{
              padding: '20px 16px', borderRadius: 16,
              background: 'var(--bg-elev)', border: '1px dashed var(--border-strong)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--bg)', border: '1px solid var(--border)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)', marginBottom: 10,
              }}><IconLink s={20} /></div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Nenhuma conta {t.tag} conectada
              </div>
              <p className="t-small text-2" style={{ marginTop: 4, marginBottom: 12 }}>
                Conecte uma conta ou continue em modo demo
              </p>
              <Button variant="secondary" size="sm" icon={<IconPlus s={14} sw={2.2} />}>
                Conectar conta
              </Button>
            </div>

            <div style={{
              marginTop: 12, padding: 12, borderRadius: 12,
              background: 'var(--warning-bg)', border: '1px solid var(--border)',
              display: 'flex', gap: 10,
            }}>
              <div style={{ color: 'var(--warning)', flexShrink: 0 }}><IconWarning s={16} /></div>
              <div className="t-small" style={{ color: 'var(--text)' }}>
                Modo demo ativo. Conecte sua conta na versão final para dados reais.
              </div>
            </div>
          </div>

          {/* Date range */}
          <SectionHead title="Período" sub="Intervalo dos dados" />
          <div style={{
            padding: '0 18px 22px', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: 10,
          }}>
            <Field label="Data inicial">
              <Input value="18/04/2026" leading={<IconCalendar s={16} />} />
            </Field>
            <Field label="Data final">
              <Input value="18/05/2026" leading={<IconCalendar s={16} />} />
            </Field>
          </div>

          {/* Quick period chips */}
          <div style={{
            display: 'flex', gap: 8, padding: '0 18px 22px',
            overflowX: 'auto',
          }}>
            <Chip>Últimos 7 dias</Chip>
            <Chip active>Últimos 30 dias</Chip>
            <Chip>Este mês</Chip>
            <Chip>Mês passado</Chip>
            <Chip>90 dias</Chip>
          </div>

          {/* Name */}
          <SectionHead title="Nome do relatório" sub="Opcional — para identificá-lo depois" />
          <div style={{ padding: '0 18px 24px' }}>
            <Input placeholder={`${t.tag} - ${t.title} - 18/05/2026`}
                   leading={<IconDoc s={16} />} />
          </div>

          {/* CTA */}
          <div style={{
            position: 'sticky', bottom: 0,
            padding: '14px 18px 18px',
            background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--separator)',
          }}>
            <Button variant="primary" size="lg" full iconRight={<IconChevR s={18} />}
                    onClick={() => setStep(2)}>
              Continuar para pagamento
            </Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <SectionHead title="Resumo" sub="Revise antes de confirmar" />
          <div style={{ padding: '0 18px 22px' }}>
            <div style={{
              borderRadius: 16, background: 'var(--bg-elev)',
              border: '1px solid var(--border)', overflow: 'hidden',
            }}>
              {[
                { l: 'Template', v: `${t.tag} · ${t.title}` },
                { l: 'Período', v: '18/04 — 18/05/2026' },
                { l: 'Conta', v: 'Demo · sem conexão' },
              ].map((r, i, arr) => (
                <React.Fragment key={r.l}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px',
                  }}>
                    <span className="t-small text-2">{r.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{r.v}</span>
                  </div>
                  {i < arr.length - 1 && <div className="hairline" style={{ marginLeft: 16 }} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <SectionHead title="Pagamento" sub="Créditos serão debitados automaticamente" />
          <div style={{ padding: '0 18px 22px' }}>
            <div style={{
              padding: 16, borderRadius: 16,
              background: 'var(--bg-elev)', border: '1px solid var(--border)',
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: 14, borderBottom: '1px solid var(--separator)',
              }}>
                <div>
                  <div className="t-small text-2">Créditos disponíveis</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>200</span>
                    <span className="t-small text-2" style={{ fontWeight: 600 }}>créditos</span>
                  </div>
                </div>
                <Badge tone="success">Saldo suficiente</Badge>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: 14,
              }}>
                <div className="t-small text-2">Custo do relatório</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <IconSparkle s={14} /> {t.credits} créditos
                </div>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 10, padding: 12, borderRadius: 10,
                background: 'var(--bg-elev-2)',
              }}>
                <span className="t-small" style={{ fontWeight: 600 }}>Após geração</span>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{200 - t.credits} créditos</span>
              </div>
            </div>
          </div>

          <div style={{
            position: 'sticky', bottom: 0,
            padding: '14px 18px 18px', display: 'flex', gap: 10,
            background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--separator)',
          }}>
            <Button variant="secondary" size="lg" onClick={() => setStep(1)} style={{ flex: '0 0 auto' }}>
              <IconChevL s={18} />
            </Button>
            <Button variant="primary" size="lg" full icon={<IconCheck s={18} sw={2.2} />}>
              Confirmar e gerar
            </Button>
          </div>
        </>
      )}
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MAIS — "more" sheet (Configurações, Carteira, Suporte, Segurança, etc.)
// ────────────────────────────────────────────────────────────────────────────
function ScreenMore({ dark, onTab, onNav, onToggleTheme }) {
  const items = [
    { id: 'ai-hub',       icon: <IconSparkle s={20} />, title: 'Inteligência IA',   sub: 'Análise, criativos, público e mais', badge: 'Premium' },
    { id: 'subscription', icon: <IconShield s={20} />,  title: 'Plano Premium',     sub: 'Libere toda análise IA por R$ 197/mês' },
    { id: 'transactions', icon: <IconWallet s={20} />,  title: 'Créditos',           sub: '200 créditos disponíveis' },
    { id: 'integrations', icon: <IconPlug s={20} />,    title: 'Integrações',        sub: 'Google Ads · Meta Ads' },
    { id: 'settings',     icon: <IconSettings s={20}/>, title: 'Configurações',      sub: 'Perfil e segurança' },
    { id: 'security',     icon: <IconShield s={20} />,  title: 'Segurança',          sub: 'Sessões e 2FA' },
    { id: 'support',      icon: <IconHeadset s={20} />, title: 'Suporte',            sub: 'Fale com a gente' },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab}>
      <ScreenTitle title="Mais" sub="Atalhos e configurações da conta" />

      {/* Profile */}
      <div style={{ padding: '0 18px 22px' }}>
        <button onClick={() => onNav && onNav('settings')} style={{
          width: '100%', textAlign: 'left',
          padding: 16, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Avatar size={50} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 650 }}>Eduardo Rodrigues</div>
            <div className="t-small text-2" style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>eduardoteishoku@gmail.com</div>
          </div>
          <IconChevR s={18} />
        </button>
      </div>

      <div style={{ padding: '0 18px 14px' }}>
        <div style={{
          borderRadius: 18, background: 'var(--bg-elev)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {items.map((it, i) => (
            <React.Fragment key={it.id}>
              <button onClick={() => onNav && onNav(it.id)} style={{
                width: '100%', textAlign: 'left',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'transparent',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text)', flexShrink: 0,
                }}>{it.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{it.title}</span>
                    {it.badge && <Badge tone="ink">{it.badge}</Badge>}
                  </div>
                  <div className="t-small text-2">{it.sub}</div>
                </div>
                <IconChevR s={18} />
              </button>
              {i < items.length - 1 && <div className="hairline" style={{ marginLeft: 66 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Theme + Lang quick */}
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          borderRadius: 18, background: 'var(--bg-elev)',
          border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', flexShrink: 0,
            }}>{dark ? <IconMoon s={18} /> : <IconSun s={18} />}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500 }}>Modo escuro</div>
              <div className="t-small text-2">Tema da interface</div>
            </div>
            <Toggle on={dark} onChange={onToggleTheme} />
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '0 18px 32px' }}>
        <button style={{
          width: '100%', height: 48, borderRadius: 14,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          color: 'var(--danger)', fontSize: 15, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <IconLogout s={17} /> Sair da conta
        </button>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <img src={dark ? 'assets/logo-branco.png' : 'assets/logo-preto.png'}
               alt="adsmart" style={{ height: 16, opacity: 0.4 }} />
          <div className="t-small text-3" style={{ marginTop: 6 }}>
            v2.0 · Desenvolvido por Zen Technology
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}

Object.assign(window, {
  ScreenTransactions, ScreenSettings, ScreenGenerate, ScreenMore,
});
