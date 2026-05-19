// screens-ai-ops.jsx — Ad Library compare, Briefing, and new-campaign Wizard

// ────────────────────────────────────────────────────────────────────────────
// AD LIBRARY COMPARE — your ads vs leaders running for a long time
// ────────────────────────────────────────────────────────────────────────────
function ScreenAILibrary({ dark, onTab, onBack }) {
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <AITitle
        overline="Biblioteca de anúncios"
        title="Compare com os líderes"
        sub="Anúncios do seu segmento rodando há +90 dias"
      />

      {/* Segmented selector */}
      <div style={{ padding: '0 18px 16px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        <Chip active>Seu segmento</Chip>
        <Chip>Concorrentes diretos</Chip>
        <Chip>Top global</Chip>
      </div>

      {/* Side-by-side comparison */}
      <SectionHead title="Lado a lado" sub="Seu top criativo vs. líder do segmento" />
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {/* Yours */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{
              aspectRatio: '9/16', background: 'var(--bg-inset)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 90 160" width="100%" height="100%">
                <rect width="90" height="160" fill="var(--chart-3)" opacity="0.3" />
                <circle cx="45" cy="60" r="22" fill="var(--chart-1)" opacity="0.5" />
                <rect x="20" y="100" width="50" height="3" rx="1" fill="var(--text)" opacity="0.4" />
                <rect x="28" y="108" width="34" height="3" rx="1" fill="var(--text)" opacity="0.3" />
                <rect x="30" y="130" width="30" height="10" rx="3" fill="var(--text)" opacity="0.6" />
              </svg>
              <div style={{
                position: 'absolute', top: 8, left: 8,
                padding: '3px 7px', borderRadius: 6,
                background: 'var(--bg)', fontSize: 10, fontWeight: 700,
              }}>SEU</div>
            </div>
            <div style={{ padding: 12 }}>
              <div className="t-small text-2">Antes/Depois</div>
              <div style={{ fontSize: 13, fontWeight: 650, marginTop: 2 }}>CTR 4,2%</div>
              <div className="t-small text-3" style={{ marginTop: 4 }}>Rodando há 18 dias</div>
            </div>
          </div>
          {/* Leader */}
          <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'var(--bg-elev)', border: '1px solid var(--success)',
            position: 'relative',
          }}>
            <div style={{
              aspectRatio: '9/16', background: 'var(--bg-inset)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 90 160" width="100%" height="100%">
                <rect width="90" height="160" fill="var(--text)" opacity="0.15" />
                <rect x="6" y="6" width="78" height="100" rx="4" fill="var(--text)" opacity="0.55" />
                <circle cx="45" cy="42" r="14" fill="var(--bg)" opacity="0.9" />
                <path d="M40 42 L43 48 L52 38" stroke="var(--text)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <rect x="14" y="68" width="62" height="3" rx="1" fill="var(--bg)" opacity="0.9" />
                <rect x="22" y="76" width="46" height="3" rx="1" fill="var(--bg)" opacity="0.7" />
                <rect x="14" y="116" width="62" height="6" rx="2" fill="var(--text)" opacity="0.7" />
                <rect x="14" y="128" width="40" height="3" rx="1" fill="var(--text)" opacity="0.5" />
                <rect x="20" y="144" width="50" height="10" rx="3" fill="var(--chart-1)" />
              </svg>
              <div style={{
                position: 'absolute', top: 8, left: 8,
                padding: '3px 7px', borderRadius: 6,
                background: 'var(--success)', color: 'var(--bg)',
                fontSize: 10, fontWeight: 700,
              }}>LÍDER</div>
            </div>
            <div style={{ padding: 12 }}>
              <div className="t-small text-2">Studio Vela</div>
              <div style={{ fontSize: 13, fontWeight: 650, marginTop: 2 }}>~14× mais reach</div>
              <div className="t-small text-3" style={{ marginTop: 4 }}>Rodando há 142 dias</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key differences */}
      <SectionHead title="Principais diferenças" sub="O que separa o líder do seu" />
      <div style={{ padding: '0 18px 22px', display: 'grid', gap: 10 }}>
        {[
          { d: 'Texto em tela sempre visível', body: 'Líder usa caption embutida; o seu depende de áudio para o gancho', impact: '+CTR' },
          { d: 'Estrutura: gancho → prova → CTA', body: 'Tempo médio do líder: 22s; o seu tem 38s sem ponto de inflexão claro', impact: '+VTR' },
          { d: 'Frame final com produto + preço', body: 'Líder fecha com oferta concreta; o seu termina sem CTA visual', impact: '+CVR' },
          { d: 'Variações testadas (8 versões)', body: 'Líder roda 8 variações simultâneas; você tem 2', impact: 'menos fadiga' },
        ].map((d, i) => (
          <div key={i} style={{
            padding: 14, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 650, flex: 1 }}>{d.d}</div>
              <Badge tone="success">{d.impact}</Badge>
            </div>
            <p className="t-small text-2" style={{ marginTop: 6, lineHeight: 1.4 }}>{d.body}</p>
          </div>
        ))}
      </div>

      {/* How to replicate */}
      <SectionHead title="Como replicar o sucesso" sub="3 ações que você pode aplicar hoje" />
      <div style={{ padding: '0 18px 32px' }}>
        <AICard glow>
          <div style={{ padding: 18 }}>
            <ol style={{ listStyle: 'none', display: 'grid', gap: 14 }}>
              {[
                { t: 'Adicione captions queimadas ao criativo top',  d: 'Você pode fazer isso sem regravar — use o gerador de captions no editor' },
                { t: 'Crie 6 variações do criativo principal',       d: 'Diferentes ganchos nos primeiros 3s, mesma estrutura central' },
                { t: 'Adicione frame final com produto + preço',     d: 'Reaproveite o end-screen padrão do líder como referência' },
              ].map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--accent)', color: 'var(--accent-fg)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i+1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 650 }}>{s.t}</div>
                    <div className="t-small text-2" style={{ marginTop: 3, lineHeight: 1.4 }}>{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
            <Button variant="primary" size="md" full icon={<IconSparkle s={15} />} style={{ marginTop: 16 }}>
              Gerar plano de produção
            </Button>
          </div>
        </AICard>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BRIEFING — "Você precisa solicitar criativos?"
// Detailed message for whoever produces creatives (team, expert, agency)
// ────────────────────────────────────────────────────────────────────────────
function ScreenAIBriefing({ dark, onTab, onBack }) {
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <AITitle
        overline="Briefing automático"
        title="Você precisa solicitar criativos?"
        sub="A IA analisou e prepara o briefing para você"
      />

      {/* Verdict */}
      <div style={{ padding: '0 18px 22px' }}>
        <AICard glow>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'var(--warning-bg)', color: 'var(--warning)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><IconWarning s={22} /></div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Sim, você precisa
                </div>
                <div style={{ fontSize: 16, fontWeight: 650, marginTop: 2 }}>3 novos criativos em até 7 dias</div>
              </div>
            </div>
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'var(--bg)', border: '1px solid var(--border)',
            }}>
              <div className="t-micro text-2" style={{ marginBottom: 8 }}>Por que agora?</div>
              <ul style={{ listStyle: 'none', display: 'grid', gap: 8 }}>
                {[
                  { l: 'CTR caiu 32% em 14 dias',           sub: 'sinal claro de fadiga criativa' },
                  { l: 'Frequência média: 4,8 visualizações', sub: 'acima de 4 já começa a saturar' },
                  { l: '92% do público já viu o criativo v3', sub: 'precisa renovar para reativar entrega' },
                ].map((r, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: 'var(--warning)', flexShrink: 0, paddingTop: 2 }}>
                      <IconArrowDown s={13} sw={2.5} />
                    </span>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.l}</span>
                      <span className="t-small text-2"> · {r.sub}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AICard>
      </div>

      {/* The briefing */}
      <SectionHead title="Briefing detalhado" sub="Pronto para enviar ao seu time" />
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: 0, borderRadius: 18, overflow: 'hidden',
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          {/* Briefing header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--separator)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Briefing #AS-2026-0518
              </div>
              <div style={{ fontSize: 15, fontWeight: 650, marginTop: 2 }}>3 criativos · Meta Ads · Lançamento</div>
            </div>
            <AIBadge>Gerado pela IA</AIBadge>
          </div>

          {/* Body sections */}
          <div style={{ padding: '16px 18px', display: 'grid', gap: 16 }}>
            {[
              { l: 'Formato',     v: 'Vídeo vertical 9:16 · 15s · MP4 1080×1920 · captions queimadas' },
              { l: 'Objetivo',    v: 'Renovar entrega e reverter fadiga · meta de CTR ≥ 3,5%' },
              { l: 'Público',     v: 'Mulheres 28-42, mães, sudeste · interesses em moda sustentável e bem-estar' },
              { l: 'Ângulo principal', v: 'Transformação visual concreta — antes/depois sem narração excessiva' },
            ].map((s, i) => (
              <div key={i}>
                <div className="t-micro text-2" style={{ marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.45 }}>{s.v}</div>
              </div>
            ))}

            {/* Script structure */}
            <div>
              <div className="t-micro text-2" style={{ marginBottom: 8 }}>Estrutura sugerida</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  { t: '0s — 3s', l: 'Gancho',     d: 'Pergunta retórica + visual do problema (zoom rápido)' },
                  { t: '3s — 8s', l: 'Problema',   d: 'Mostre a frustração específica (não genérica)' },
                  { t: '8s — 12s',l: 'Solução',    d: 'Produto sendo usado em contexto real' },
                  { t: '12s — 15s',l: 'CTA',       d: 'Texto em tela: "Toque aqui" + benefício final' },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--text-2)',
                      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                      width: 64, flexShrink: 0,
                    }}>{s.t}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 650 }}>{s.l}</div>
                      <div className="t-small text-2" style={{ marginTop: 2 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy options */}
            <div>
              <div className="t-micro text-2" style={{ marginBottom: 8 }}>Copies sugeridas</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  'Sua rotina pode ser mais leve. ✨ Conheça quem já transformou a manhã sem complicar.',
                  'Cansada do mesmo de sempre? Veja como 1.840 mulheres fizeram diferente esse mês.',
                  'A diferença que cabe em 30 dias. Toque e veja o antes/depois real.',
                ].map((c, i) => (
                  <div key={i} style={{
                    padding: 10, borderRadius: 8,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    fontSize: 13, lineHeight: 1.45,
                  }}>{c}</div>
                ))}
              </div>
            </div>

            {/* References */}
            <div>
              <div className="t-micro text-2" style={{ marginBottom: 8 }}>Referências visuais</div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    width: 64, height: 110, borderRadius: 8,
                    background: 'var(--bg-inset)', border: '1px solid var(--border)',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-3)',
                  }}>
                    <IconReport s={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 18px 32px', display: 'grid', gap: 8 }}>
        <Button variant="primary" size="lg" full icon={<IconMail s={16} />}>
          Enviar para meu time
        </Button>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" full icon={<IconDoc s={15} />}>Exportar PDF</Button>
          <Button variant="secondary" full icon={<IconRefresh s={15} />}>Regerar</Button>
        </div>
      </div>
    </ScreenShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// WIZARD: New campaign — 4 steps
//   1. Brief (objective + segment)
//   2. Product info
//   3. AI processing
//   4. Pipeline output
// ────────────────────────────────────────────────────────────────────────────
function ScreenWizardStep1({ dark, onTab, onBack, onNext }) {
  const [obj, setObj] = React.useState('conversion');
  const objectives = [
    { id: 'conversion',  label: 'Vendas / Conversão',     sub: 'Quero gerar vendas diretas',         icon: <IconTrendUp s={18} /> },
    { id: 'lead',        label: 'Captação de leads',      sub: 'Quero coletar contatos qualificados',icon: <IconUser s={18} /> },
    { id: 'awareness',   label: 'Reconhecimento',         sub: 'Quero que conheçam minha marca',     icon: <IconBell s={18} /> },
    { id: 'engagement',  label: 'Engajamento / Comunidade',sub: 'Quero engajar e nutrir base',       icon: <IconSparkle s={18} /> },
    { id: 'traffic',     label: 'Tráfego para site',      sub: 'Quero visitas no meu site',          icon: <IconLink s={18} /> },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <WizardStepper current={1} total={4} />
      <AITitle
        overline="Nova campanha · etapa 1 de 4"
        title="Qual o seu objetivo?"
        sub="A IA vai montar todo o plano de execução para você"
      />

      <div style={{ padding: '0 18px 22px', display: 'grid', gap: 10 }}>
        {objectives.map(o => (
          <button key={o.id} onClick={() => setObj(o.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: 16, borderRadius: 16, textAlign: 'left',
            background: obj === o.id ? 'var(--bg-elev)' : 'transparent',
            border: `1px solid ${obj === o.id ? 'var(--text)' : 'var(--border)'}`,
            transition: 'all .15s',
            width: '100%',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--bg-elev-2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{o.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 650 }}>{o.label}</div>
              <div className="t-small text-2" style={{ marginTop: 2 }}>{o.sub}</div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `1.5px solid ${obj === o.id ? 'var(--text)' : 'var(--border-strong)'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {obj === o.id && <span style={{
                width: 11, height: 11, borderRadius: '50%', background: 'var(--text)',
              }} />}
            </div>
          </button>
        ))}
      </div>

      <WizardFooter onNext={onNext} canContinue={!!obj} />
    </ScreenShell>
  );
}

function ScreenWizardStep2({ dark, onTab, onBack, onNext }) {
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <WizardStepper current={2} total={4} />
      <AITitle
        overline="Nova campanha · etapa 2 de 4"
        title="Conte sobre seu produto"
        sub="Quanto mais detalhes, melhor o plano gerado"
      />

      <div style={{ padding: '0 18px 22px', display: 'grid', gap: 16 }}>
        <Field label="Nome do produto ou serviço">
          <Input placeholder="Ex: Skincare orgânico Vitaviva" leading={<IconSparkle s={15} />} />
        </Field>

        <Field label="Em uma frase, o que é?">
          <Input placeholder="Ex: Linha de skincare 100% natural para peles sensíveis" />
        </Field>

        <Field label="Segmento" hint="A IA usa para buscar referências da biblioteca">
          <Select
            value="cosmetic"
            onChange={() => {}}
            options={[
              { value: 'cosmetic',  label: 'Cosméticos / Beleza' },
              { value: 'fashion',   label: 'Moda' },
              { value: 'food',      label: 'Alimentação' },
              { value: 'education', label: 'Educação / Cursos' },
              { value: 'service',   label: 'Serviços' },
              { value: 'health',    label: 'Saúde' },
              { value: 'other',     label: 'Outro' },
            ]}
          />
        </Field>

        <Field label="Ticket médio">
          <Input value="R$ 180,00" leading={<IconWallet s={15} />} />
        </Field>

        <Field label="Principal dor que resolve">
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 0,
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '12px 16px',
          }}>
            <textarea
              defaultValue="Mulheres acima de 30 anos com pele sensível que não encontram produtos eficazes sem irritar."
              rows={3}
              style={{
                flex: 1, border: 0, outline: 'none', background: 'transparent',
                resize: 'none', fontSize: 14, color: 'var(--text)', lineHeight: 1.45,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </Field>

        <Field label="Diferencial vs concorrentes">
          <Input placeholder="Ex: Único 100% orgânico com selo X" />
        </Field>

        <Field label="Orçamento diário disponível">
          <div style={{ display: 'flex', gap: 8 }}>
            {['R$ 50', 'R$ 100', 'R$ 250', 'R$ 500+'].map((b, i) => (
              <Chip key={b} active={i === 1}>{b}</Chip>
            ))}
          </div>
        </Field>
      </div>

      <WizardFooter onNext={onNext} canContinue />
    </ScreenShell>
  );
}

function ScreenWizardStep3({ dark, onTab, onBack, onNext }) {
  const stages = [
    { l: 'Analisando seu segmento',                done: true },
    { l: 'Buscando anúncios líderes na biblioteca',done: true },
    { l: 'Identificando ângulos vencedores',       done: false, active: true },
    { l: 'Construindo público-alvo ideal',         done: false },
    { l: 'Gerando ideias de criativos',            done: false },
    { l: 'Escrevendo copies otimizadas',           done: false },
    { l: 'Finalizando plano de execução',          done: false },
  ];

  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} hideNav>
      <WizardStepper current={3} total={4} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 24px 24px', textAlign: 'center',
      }}>
        {/* Animated star cluster */}
        <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 24 }}>
          <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r="68" fill="none" stroke="var(--chart-4)" strokeWidth="6" />
            <circle cx="80" cy="80" r="68" fill="none" stroke="var(--chart-1)" strokeWidth="6"
                    strokeDasharray={2*Math.PI*68}
                    strokeDashoffset={2*Math.PI*68 * 0.62}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset .4s ease' }} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
          }}>
            <IconSparkle s={32} />
            <span style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>38%</span>
            <span className="t-small text-2">construindo</span>
          </div>
        </div>

        <AIBadge size="lg">A IA está trabalhando</AIBadge>
        <h2 className="t-h1" style={{ marginTop: 12, marginBottom: 6 }}>
          Montando seu plano
        </h2>
        <p className="t-body text-2" style={{ maxWidth: 280, marginBottom: 24 }}>
          Estamos analisando o seu segmento e gerando ideias com base no que está funcionando hoje.
        </p>

        <div style={{
          width: '100%',
          padding: 16, borderRadius: 18,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          textAlign: 'left',
        }}>
          {stages.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '7px 0',
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
                    background: 'var(--text)', animation: 'wpulse 1s infinite',
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

        <Button variant="primary" size="lg" full onClick={onNext}
                icon={<IconSparkle s={16} />} style={{ marginTop: 24 }}>
          Ver meu plano gerado
        </Button>
      </div>
      <style>{`@keyframes wpulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
    </ScreenShell>
  );
}

function ScreenWizardStep4({ dark, onTab, onBack }) {
  return (
    <ScreenShell dark={dark} active="more" onTab={onTab} back onBack={onBack}>
      <WizardStepper current={4} total={4} />

      <div style={{ padding: '8px 18px 14px' }}>
        <AIBadge size="lg">Pipeline gerado</AIBadge>
        <h1 style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.022em',
          color: 'var(--text)', marginTop: 12, lineHeight: 1.1,
        }}>
          Seu plano para<br/>Skincare Vitaviva
        </h1>
        <p className="t-body text-2" style={{ marginTop: 8 }}>
          Gerado com base em 84 anúncios líderes do seu segmento
        </p>
      </div>

      {/* Angle */}
      <SectionHead title="Ângulo da oferta" sub="Qual dor priorizar" />
      <div style={{ padding: '0 18px 22px' }}>
        <AICard glow>
          <div style={{ padding: 18 }}>
            <div className="t-micro text-2" style={{ marginBottom: 6 }}>Dor #1 recomendada</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>
              "Cansei de produtos que prometem e irritam"
            </div>
            <p className="t-small text-2" style={{ lineHeight: 1.5 }}>
              82% dos anúncios líderes do segmento atacam essa dor específica. É a porta de entrada mais
              eficiente para pele sensível 30+.
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              <Chip>Frustração com químicos</Chip>
              <Chip>Sensibilidade após 30</Chip>
              <Chip>Busca por natural</Chip>
            </div>
          </div>
        </AICard>
      </div>

      {/* Audience */}
      <SectionHead title="Público-alvo sugerido" />
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: 16, borderRadius: 16,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 10 }}>
            Mulheres 30-45 · Sudeste · interesse em skincare
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Skincare', 'Pele sensível', 'Cosmético natural', 'Bem-estar feminino',
              'Maternidade tardia', 'Yoga'].map(b => <Chip key={b}>{b}</Chip>)}
          </div>
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--separator)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span className="t-small text-2">Alcance estimado</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>~3.2M pessoas</span>
          </div>
        </div>
      </div>

      {/* Mechanism */}
      <SectionHead title="Mecanismo de conversão" sub="Como levar do interesse à compra" />
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: 16, borderRadius: 16,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { n: 1, t: 'Anúncio com gancho na dor',     d: 'Captura quem se identifica' },
              { n: 2, t: 'Landing com prova social',      d: 'Depoimentos reais + selo orgânico' },
              { n: 3, t: 'Oferta de teste 30 dias',       d: 'Reduz fricção de primeira compra' },
              { n: 4, t: 'Remarketing com case real',     d: 'Vídeo de transformação 14d' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: 'var(--accent)', color: 'var(--accent-fg)',
                  fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{s.n}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.t}</div>
                  <div className="t-small text-2">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Creative ideas */}
      <SectionHead title="3 ideias de criativos" sub="Com prompts prontos para gerar" />
      <div style={{ padding: '0 18px 22px', display: 'grid', gap: 12 }}>
        <PromptCard
          title="Anúncio #1 · Antes/depois com depoimento"
          kind="image"
          prompt='Fotografia editorial 9:16, mulher 35 anos com pele radiante, luz natural quente, foco no rosto satisfeito, sem maquiagem, estilo Pinterest minimalista, paleta neutra com toque verde sutil.' />
        <PromptCard
          title="Anúncio #2 · Ingredientes em close"
          kind="image"
          prompt='Macro fotografia 1:1 de gotas de óleo orgânico caindo em pétalas de flor, fundo branco minimalista, luz suave lateral, ultra detalhado, estilo editorial cosmético, 4K.' />
        <PromptCard
          title="Anúncio #3 · Roteiro de vídeo 15s"
          kind="text"
          prompt='Roteiro de 15s para Meta Ads. Persona: mulher 32 anos com pele sensível. Estrutura PASTOR. Gancho em 3s. Tom conversacional, sem jargão. Inclua 2 variações de hook.' />
      </div>

      {/* Copy options */}
      <SectionHead title="5 copies otimizadas" />
      <div style={{ padding: '0 18px 22px' }}>
        <div style={{
          padding: 0, borderRadius: 16, overflow: 'hidden',
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
        }}>
          {[
            'Cansei de irritar a pele com cada novo creme. Aí descobri que era possível diferente. ✨',
            'Skincare 100% natural pra quem já tentou de tudo (e nada funcionou).',
            '30 dias de teste, zero risco. Sua pele sensível merece.',
            'Eu também não acreditava. Até a 3ª semana.',
            'Você + 1.840 mulheres descobrindo skincare que respeita sua pele.',
          ].map((c, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginTop: 2,
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  width: 20, flexShrink: 0,
                }}>0{i+1}</span>
                <span style={{ fontSize: 13, lineHeight: 1.45, flex: 1 }}>{c}</span>
                <button style={{ color: 'var(--text-2)', flexShrink: 0 }}><IconDoc s={14} /></button>
              </div>
              {i < arr.length - 1 && <div className="hairline" style={{ marginLeft: 46 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Test strategy */}
      <SectionHead title="Estratégia de teste" />
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          padding: 16, borderRadius: 16,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          display: 'grid', gap: 10,
        }}>
          {[
            { l: 'Dias 1-7',  d: 'Aprendizado: rode os 3 criativos com mesmo orçamento' },
            { l: 'Dias 8-14', d: 'Concentre verba no top criativo, teste 3 hooks' },
            { l: 'Dias 15+',  d: 'Escala: aumente 20% a cada 3 dias mantendo CPA' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span className="t-mono t-small" style={{ width: 70, color: 'var(--text-2)', fontWeight: 600 }}>{s.l}</span>
              <span style={{ fontSize: 13, flex: 1, lineHeight: 1.4 }}>{s.d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        position: 'sticky', bottom: 0,
        padding: '14px 18px 22px', display: 'flex', gap: 8,
        background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--separator)',
      }}>
        <Button variant="secondary" size="lg" icon={<IconDoc s={15} />}>
          Exportar
        </Button>
        <Button variant="primary" size="lg" full icon={<IconSparkle s={16} />}>
          Criar campanha agora
        </Button>
      </div>
    </ScreenShell>
  );
}

// Step indicator
function WizardStepper({ current, total }) {
  return (
    <div style={{
      display: 'flex', gap: 6, padding: '18px 18px 4px',
    }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i < current ? 'var(--accent)' : 'var(--border)',
          transition: 'background .3s',
        }} />
      ))}
    </div>
  );
}

function WizardFooter({ onNext, canContinue }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0,
      padding: '14px 18px 22px',
      background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--separator)',
    }}>
      <Button variant="primary" size="lg" full
              onClick={onNext}
              disabled={!canContinue}
              iconRight={<IconChevR s={18} />}>
        Continuar
      </Button>
    </div>
  );
}

Object.assign(window, {
  ScreenAILibrary, ScreenAIBriefing,
  ScreenWizardStep1, ScreenWizardStep2, ScreenWizardStep3, ScreenWizardStep4,
  WizardStepper, WizardFooter,
});
