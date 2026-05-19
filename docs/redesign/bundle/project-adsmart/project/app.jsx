// app.jsx — AdSmart Redesign canvas
// Renders all 7 screens in Light + Dark mode inside iOS device frames.
// Each frame is its own interactive instance (tap bottom nav to navigate).

const DEVICE_W = 390;
const DEVICE_H = 820;

// Interactive frame wrapper — manages its own screen state per phone.
function PhoneApp({ dark, startScreen = 'home' }) {
  const [screen, setScreen]   = React.useState(startScreen);
  const [theme, setTheme]     = React.useState(!!dark);
  const [template, setTplt]   = React.useState(null);
  const [reportPlatform, setReportPlatform] = React.useState(null);

  const toggleTheme = () => setTheme(t => !t);

  // Tab bar tap
  const handleTab = (id) => {
    if (id === 'create') { setReportPlatform(null); setScreen('report-start'); return; }
    if (id === 'home')   { setScreen('home'); return; }
    if (id === 'reports')   { setScreen('reports'); return; }
    if (id === 'templates') { setReportPlatform(null); setScreen('report-start'); return; }
    if (id === 'more')      { setScreen('more'); return; }
  };

  const handleNav = (target) => setScreen(target);

  const handleTemplate = (t) => { setTplt(t); setScreen('generate'); };

  const back = () => {
    if (screen === 'generate')    { setScreen('templates'); return; }
    if (screen === 'templates')   { setScreen('report-start'); return; }
    if (screen === 'report-start'){ setScreen('home'); return; }
    if (screen === 'integrations'){ setScreen('more'); return; }
    if (screen === 'settings')    { setScreen('more'); return; }
    if (screen === 'transactions'){ setScreen('more'); return; }
    setScreen('home');
  };

  const screenProps = {
    dark: theme,
    onTab: handleTab,
    onNav: handleNav,
    onBack: back,
    onToggleTheme: toggleTheme,
  };

  let body;
  switch (screen) {
    case 'home':         body = <ScreenDashboard {...screenProps} />; break;
    case 'integrations': body = <ScreenIntegrations {...screenProps} />; break;
    case 'report-start': body = <ScreenReportStart {...screenProps} onSelectPlatform={(p) => { setReportPlatform(p); setScreen('templates'); }} />; break;
    case 'templates':    body = <ScreenTemplates {...screenProps} platform={reportPlatform} onTemplate={handleTemplate} />; break;
    case 'reports':      body = <ScreenReports {...screenProps} />; break;
    case 'transactions': body = <ScreenTransactions {...screenProps} />; break;
    case 'settings':     body = <ScreenSettings {...screenProps} />; break;
    case 'generate':     body = <ScreenGenerate {...screenProps} template={template} />; break;
    case 'more':         body = <ScreenMore {...screenProps} />; break;
    case 'home-v2':      body = <ScreenDashboardV2 {...screenProps} />; break;
    case 'home-v3':      body = <ScreenDashboardV3 {...screenProps} />; break;
    case 'report-detail':body = <ScreenReportDetail {...screenProps} />; break;
    case 'generating':   body = <ScreenGenerating {...screenProps} />; break;
    case 'loading':      body = <ScreenLoadingDashboard {...screenProps} />; break;
    case 'pix':          body = <ScreenPix {...screenProps} />; break;
    case 'subscription': body = <ScreenSubscription {...screenProps} />; break;
    case 'ai-hub':       body = <ScreenAIHub {...screenProps} />; break;
    case 'ai-campaign':  body = <ScreenAICampaign {...screenProps} />; break;
    case 'ai-creative':  body = <ScreenAICreative {...screenProps} />; break;
    case 'ai-audience':  body = <ScreenAIAudience {...screenProps} />; break;
    case 'ai-engagement':body = <ScreenAIEngagement {...screenProps} />; break;
    case 'ai-library':   body = <ScreenAILibrary {...screenProps} />; break;
    case 'ai-briefing':  body = <ScreenAIBriefing {...screenProps} />; break;
    case 'wiz-1':        body = <ScreenWizardStep1 {...screenProps} onNext={() => setScreen('wiz-2')} />; break;
    case 'wiz-2':        body = <ScreenWizardStep2 {...screenProps} onNext={() => setScreen('wiz-3')} />; break;
    case 'wiz-3':        body = <ScreenWizardStep3 {...screenProps} onNext={() => setScreen('wiz-4')} />; break;
    case 'wiz-4':        body = <ScreenWizardStep4 {...screenProps} />; break;
    default:             body = <ScreenDashboard {...screenProps} />;
  }

  return (
    <IOSDevice width={DEVICE_W} height={DEVICE_H} dark={theme}>
      <div style={{ width: '100%', height: '100%', paddingTop: 54 }}>
        {body}
      </div>
    </IOSDevice>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STATIC screens (no interaction) — used to fill the canvas with all 7 views
// ────────────────────────────────────────────────────────────────────────────
function StaticPhone({ dark, screen, template, platform }) {
  const noop = () => {};
  const props = {
    dark,
    onTab: noop, onNav: noop, onBack: noop, onToggleTheme: noop,
    onTemplate: noop, onSelectPlatform: noop, onNext: noop,
    template, platform,
  };
  let body;
  switch (screen) {
    case 'home':         body = <ScreenDashboard {...props} />; break;
    case 'integrations': body = <ScreenIntegrations {...props} />; break;
    case 'report-start': body = <ScreenReportStart {...props} />; break;
    case 'templates':    body = <ScreenTemplates {...props} />; break;
    case 'reports':      body = <ScreenReports {...props} />; break;
    case 'transactions': body = <ScreenTransactions {...props} />; break;
    case 'settings':     body = <ScreenSettings {...props} />; break;
    case 'generate':     body = <ScreenGenerate {...props} />; break;
    case 'more':         body = <ScreenMore {...props} />; break;
    case 'home-v2':      body = <ScreenDashboardV2 {...props} />; break;
    case 'home-v3':      body = <ScreenDashboardV3 {...props} />; break;
    case 'report-detail':body = <ScreenReportDetail {...props} />; break;
    case 'generating':   body = <ScreenGenerating {...props} />; break;
    case 'loading':      body = <ScreenLoadingDashboard {...props} />; break;
    case 'pix':          body = <ScreenPix {...props} />; break;
    case 'subscription': body = <ScreenSubscription {...props} />; break;
    case 'ai-hub':       body = <ScreenAIHub {...props} />; break;
    case 'ai-campaign':  body = <ScreenAICampaign {...props} />; break;
    case 'ai-creative':  body = <ScreenAICreative {...props} />; break;
    case 'ai-audience':  body = <ScreenAIAudience {...props} />; break;
    case 'ai-engagement':body = <ScreenAIEngagement {...props} />; break;
    case 'ai-library':   body = <ScreenAILibrary {...props} />; break;
    case 'ai-briefing':  body = <ScreenAIBriefing {...props} />; break;
    case 'wiz-1':        body = <ScreenWizardStep1 {...props} />; break;
    case 'wiz-2':        body = <ScreenWizardStep2 {...props} />; break;
    case 'wiz-3':        body = <ScreenWizardStep3 {...props} />; break;
    case 'wiz-4':        body = <ScreenWizardStep4 {...props} />; break;
  }
  return (
    <IOSDevice width={DEVICE_W} height={DEVICE_H} dark={dark}>
      <div style={{ width: '100%', height: '100%', paddingTop: 54 }}>
        {body}
      </div>
    </IOSDevice>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SystemSheet — covers tokens & primitives for designer review
// ────────────────────────────────────────────────────────────────────────────
function SystemSheet({ dark }) {
  return (
    <div className={`adsmart-scope ${dark ? 'theme-dark' : 'theme-light'}`} style={{
      width: 720, padding: 32, background: 'var(--bg)',
      borderRadius: 24, border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <div>
        <div className="t-micro text-2">Design System</div>
        <h2 className="t-display" style={{ marginTop: 6 }}>
          {dark ? 'Dark Mode' : 'Light Mode'}
        </h2>
        <p className="t-body text-2" style={{ marginTop: 6, maxWidth: 480 }}>
          {dark
            ? 'Pretos profundos com acento ciano restrito a dados. Inspirado em macOS Sonoma e iOS 18.'
            : 'Estritamente preto e branco, respeitando a paleta atual da marca. Tipografia SF Pro.'}
        </p>
      </div>

      {/* Color tokens */}
      <div>
        <div className="t-h3" style={{ marginBottom: 12 }}>Cores</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          {[
            { name: 'bg',         v: 'var(--bg)' },
            { name: 'bg-elev',    v: 'var(--bg-elev)' },
            { name: 'bg-elev-2',  v: 'var(--bg-elev-2)' },
            { name: 'text',       v: 'var(--text)' },
            { name: 'text-2',     v: 'var(--text-2)' },
            { name: 'accent',     v: 'var(--accent)' },
          ].map(c => (
            <div key={c.name}>
              <div style={{
                aspectRatio: '1', borderRadius: 12, background: c.v,
                border: '1px solid var(--border)',
              }} />
              <div className="t-small" style={{ marginTop: 6, fontWeight: 600 }}>{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <div className="t-h3" style={{ marginBottom: 12 }}>Tipografia · SF Pro</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: 12, borderRadius: 12, background: 'var(--bg-elev)' }}>
            <span className="t-small text-3" style={{ width: 90 }}>display</span>
            <span className="t-display">Vamos gerar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: 12, borderRadius: 12, background: 'var(--bg-elev)' }}>
            <span className="t-small text-3" style={{ width: 90 }}>h1</span>
            <span className="t-h1">Meus Relatórios</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: 12, borderRadius: 12, background: 'var(--bg-elev)' }}>
            <span className="t-small text-3" style={{ width: 90 }}>h2</span>
            <span className="t-h2">Integrações</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: 12, borderRadius: 12, background: 'var(--bg-elev)' }}>
            <span className="t-small text-3" style={{ width: 90 }}>body</span>
            <span className="t-body">Crie relatórios pagando apenas pelo uso.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: 12, borderRadius: 12, background: 'var(--bg-elev)' }}>
            <span className="t-small text-3" style={{ width: 90 }}>small</span>
            <span className="t-small text-2">O email não pode ser alterado</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div>
        <div className="t-h3" style={{ marginBottom: 12 }}>Botões</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button variant="primary">Continuar</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" icon={<IconPlus s={16} sw={2.2} />}>Criar</Button>
          <Button variant="secondary" icon={<IconCheck s={16} />}>Confirmar</Button>
        </div>
      </div>

      {/* Inputs (showing the fix: NO glued icons, label above, breathing room) */}
      <div>
        <div className="t-h3" style={{ marginBottom: 4 }}>Inputs corrigidos</div>
        <p className="t-small text-2" style={{ marginBottom: 12 }}>
          Labels acima, ícones leading com respiro de 14px, foco com borda ink suave.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Nome completo">
            <Input value="Eduardo Rodrigues" leading={<IconUser s={16} />} />
          </Field>
          <Field label="Plataforma">
            <Select value="google" options={[
              { value: 'google', label: 'Google Ads' },
              { value: 'meta',   label: 'Meta Ads' },
            ]} leading={<IconLink s={16} />} />
          </Field>
        </div>
      </div>

      {/* Badges + Toggles */}
      <div>
        <div className="t-h3" style={{ marginBottom: 12 }}>Componentes</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="success">Conectado</Badge>
          <Badge tone="warning">Demo</Badge>
          <Badge tone="ink"><IconSparkle s={11} /> 2 créd.</Badge>
          <Chip>Filtro</Chip>
          <Chip active>Ativo</Chip>
          <Toggle on={true} />
          <Toggle on={false} />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COVER — hero introduction
// ────────────────────────────────────────────────────────────────────────────
function Cover() {
  return (
    <div className="adsmart-scope theme-light" style={{
      width: 720, padding: '48px 40px',
      background: '#FFFFFF',
      borderRadius: 24, border: '1px solid rgba(0,0,0,0.08)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 280, height: 280, borderRadius: '50%',
        background: '#F5F5F7',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: '#FAFAFA',
      }} />
      <div style={{ position: 'relative' }}>
        <img src="assets/logo-preto.png" alt="adsmart" style={{ height: 28 }} />
        <h1 style={{
          fontSize: 56, fontWeight: 800, letterSpacing: '-0.035em',
          color: '#1D1D1F', marginTop: 36, lineHeight: 1.02,
        }}>
          Re-design.<br/>
          <span style={{ color: '#6E6E73' }}>Mobile primeiro,<br/>Apple por dentro.</span>
        </h1>
        <p style={{
          fontSize: 18, color: '#6E6E73', marginTop: 22, lineHeight: 1.5, maxWidth: 520,
        }}>
          7 telas reconstruídas com tipografia SF Pro, paleta estrita preto e branco no light mode,
          e um dark mode com profundidade tonal e acento ciano restrito a dados.
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 36, flexWrap: 'wrap' }}>
          {[
            { n: '7', l: 'telas redesenhadas' },
            { n: '2', l: 'temas (light + dark)' },
            { n: '0', l: 'novas funcionalidades' },
            { n: '∞', l: 'respiro nos inputs' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '14px 18px', borderRadius: 14,
              background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', color: '#1D1D1F' }}>{s.n}</div>
              <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Root
// ────────────────────────────────────────────────────────────────────────────
function App() {
  const tplMeta = { tag: 'Meta Ads', icon: <IconMeta s={14} />, title: 'Lançamento', price: '10,00' };

  return (
    <DesignCanvas>
      <DCSection id="intro" title="AdSmart Redesign" subtitle="Apple-style · mobile first · light + dark">
        <DCArtboard id="cover" label="Cover" width={720} height={520}>
          <Cover />
        </DCArtboard>
        <DCArtboard id="sys-light" label="Sistema · Light" width={720} height={780}>
          <SystemSheet dark={false} />
        </DCArtboard>
        <DCArtboard id="sys-dark" label="Sistema · Dark" width={720} height={780}>
          <SystemSheet dark={true} />
        </DCArtboard>
      </DCSection>

      <DCSection id="prototype" title="Protótipo interativo" subtitle="Toque o bottom nav para navegar entre telas">
        <DCArtboard id="proto-light" label="Light · interativo" width={DEVICE_W} height={DEVICE_H}>
          <PhoneApp dark={false} startScreen="home" />
        </DCArtboard>
        <DCArtboard id="proto-dark" label="Dark · interativo" width={DEVICE_W} height={DEVICE_H}>
          <PhoneApp dark={true} startScreen="home" />
        </DCArtboard>
      </DCSection>

      <DCSection id="light" title="Light Mode" subtitle="Todas as 7 telas — paleta B&W estrita">
        <DCArtboard id="l-home"  label="01 · Dashboard"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="home" /></DCArtboard>
        <DCArtboard id="l-int"   label="02 · Integrações"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="integrations" /></DCArtboard>
        <DCArtboard id="l-tpl"   label="03 · Templates"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="templates" /></DCArtboard>
        <DCArtboard id="l-rep"   label="04 · Relatórios"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="reports" /></DCArtboard>
        <DCArtboard id="l-tx"    label="05 · Carteira"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="transactions" /></DCArtboard>
        <DCArtboard id="l-set"   label="06 · Configurações" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="settings" /></DCArtboard>
        <DCArtboard id="l-gen"   label="07 · Gerar relatório" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="generate" template={tplMeta} /></DCArtboard>
        <DCArtboard id="l-more"  label="08 · Mais"         width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="more" /></DCArtboard>
      </DCSection>

      <DCSection id="dark" title="Dark Mode" subtitle="Pretos profundos, acento ciano restrito a dados">
        <DCArtboard id="d-home"  label="01 · Dashboard"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="home" /></DCArtboard>
        <DCArtboard id="d-int"   label="02 · Integrações"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="integrations" /></DCArtboard>
        <DCArtboard id="d-tpl"   label="03 · Templates"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="templates" /></DCArtboard>
        <DCArtboard id="d-rep"   label="04 · Relatórios"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="reports" /></DCArtboard>
        <DCArtboard id="d-tx"    label="05 · Carteira"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="transactions" /></DCArtboard>
        <DCArtboard id="d-set"   label="06 · Configurações" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="settings" /></DCArtboard>
        <DCArtboard id="d-gen"   label="07 · Gerar relatório" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="generate" template={tplMeta} /></DCArtboard>
        <DCArtboard id="d-more"  label="08 · Mais"         width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="more" /></DCArtboard>
      </DCSection>

      <DCSection id="dashvars" title="Variações de Dashboard" subtitle="V1 acolhedora · V2 data-rich · V3 editorial / hero ROAS">
        <DCArtboard id="dv-v1-l" label="V1 · Acolhedora · Light"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="home" /></DCArtboard>
        <DCArtboard id="dv-v2-l" label="V2 · Data-rich · Light"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="home-v2" /></DCArtboard>
        <DCArtboard id="dv-v3-l" label="V3 · Editorial · Light"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="home-v3" /></DCArtboard>
        <DCArtboard id="dv-v1-d" label="V1 · Acolhedora · Dark"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="home" /></DCArtboard>
        <DCArtboard id="dv-v2-d" label="V2 · Data-rich · Dark"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="home-v2" /></DCArtboard>
        <DCArtboard id="dv-v3-d" label="V3 · Editorial · Dark"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="home-v3" /></DCArtboard>
      </DCSection>

      <DCSection id="report" title="Detalhe do relatório gerado" subtitle="Dashboard completo após geração">
        <DCArtboard id="rep-l" label="Relatório · Light"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="report-detail" /></DCArtboard>
        <DCArtboard id="rep-d" label="Relatório · Dark"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="report-detail" /></DCArtboard>
        <DCArtboard id="rep-i" label="Interativo · Light" width={DEVICE_W} height={DEVICE_H}><PhoneApp dark={false} startScreen="report-detail" /></DCArtboard>
      </DCSection>

      <DCSection id="loading" title="Estados de loading" subtitle="Skeleton inicial · progresso de geração">
        <DCArtboard id="ld-skl"  label="Skeleton · Light"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="loading" /></DCArtboard>
        <DCArtboard id="ld-gen"  label="Gerando · Light"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="generating" /></DCArtboard>
        <DCArtboard id="ld-skd"  label="Skeleton · Dark"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="loading" /></DCArtboard>
        <DCArtboard id="ld-gend" label="Gerando · Dark"       width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="generating" /></DCArtboard>
      </DCSection>

      <DCSection id="payment" title="Pagamento" subtitle="Pix processado pela Stripe · compra de créditos">
        <DCArtboard id="pay-pix-l"  label="Pix · Light"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="pix" /></DCArtboard>
        <DCArtboard id="pay-pix-d"  label="Pix · Dark"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="pix" /></DCArtboard>
      </DCSection>

      <DCSection id="subscription" title="Plano Premium" subtitle="Assinatura R$ 197/mês processada pela Stripe — desbloqueia toda IA">
        <DCArtboard id="sub-mob-l"  label="Assinatura · Light" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="subscription" /></DCArtboard>
        <DCArtboard id="sub-mob-d"  label="Assinatura · Dark"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="subscription" /></DCArtboard>
        <DCArtboard id="sub-dt-l"   label="Assinatura desktop · Light" width={1280} height={1080}><DesktopSubscription dark={false} /></DCArtboard>
        <DCArtboard id="sub-dt-d"   label="Assinatura desktop · Dark"  width={1280} height={1080}><DesktopSubscription dark={true} /></DCArtboard>
      </DCSection>

      <DCSection id="ai-hub-section" title="Inteligência IA · Hub & Análises" subtitle="Hub central + diagnóstico de campanha + criativos + público + engajamento">
        <DCArtboard id="ai-hub-l"      label="Hub IA · Light"             width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-hub" /></DCArtboard>
        <DCArtboard id="ai-camp-l"     label="Análise campanha · Light"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-campaign" /></DCArtboard>
        <DCArtboard id="ai-creat-l"    label="Criativos & ideias · Light" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-creative" /></DCArtboard>
        <DCArtboard id="ai-aud-l"      label="Público · Light"            width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-audience" /></DCArtboard>
        <DCArtboard id="ai-eng-l"      label="Engajamento · Light"        width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-engagement" /></DCArtboard>
        <DCArtboard id="ai-hub-d"      label="Hub IA · Dark"              width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-hub" /></DCArtboard>
        <DCArtboard id="ai-camp-d"     label="Análise campanha · Dark"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-campaign" /></DCArtboard>
        <DCArtboard id="ai-creat-d"    label="Criativos & ideias · Dark"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-creative" /></DCArtboard>
        <DCArtboard id="ai-aud-d"      label="Público · Dark"             width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-audience" /></DCArtboard>
        <DCArtboard id="ai-eng-d"      label="Engajamento · Dark"         width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-engagement" /></DCArtboard>
      </DCSection>

      <DCSection id="ai-ops-section" title="Inteligência IA · Operações" subtitle="Comparar com biblioteca + briefing automático para criativos">
        <DCArtboard id="ai-lib-l"  label="Biblioteca · Light" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-library" /></DCArtboard>
        <DCArtboard id="ai-brf-l"  label="Briefing · Light"   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="ai-briefing" /></DCArtboard>
        <DCArtboard id="ai-lib-d"  label="Biblioteca · Dark"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-library" /></DCArtboard>
        <DCArtboard id="ai-brf-d"  label="Briefing · Dark"    width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="ai-briefing" /></DCArtboard>
      </DCSection>

      <DCSection id="wizard-section" title="Wizard · Nova campanha" subtitle="4 etapas: objetivo → produto → IA processando → pipeline gerado">
        <DCArtboard id="wz-1-l" label="01 · Objetivo · Light"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="wiz-1" /></DCArtboard>
        <DCArtboard id="wz-2-l" label="02 · Produto · Light"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="wiz-2" /></DCArtboard>
        <DCArtboard id="wz-3-l" label="03 · IA processando · Light" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="wiz-3" /></DCArtboard>
        <DCArtboard id="wz-4-l" label="04 · Pipeline · Light"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="wiz-4" /></DCArtboard>
        <DCArtboard id="wz-1-d" label="01 · Objetivo · Dark"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="wiz-1" /></DCArtboard>
        <DCArtboard id="wz-2-d" label="02 · Produto · Dark"       width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="wiz-2" /></DCArtboard>
        <DCArtboard id="wz-3-d" label="03 · IA processando · Dark" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="wiz-3" /></DCArtboard>
        <DCArtboard id="wz-4-d" label="04 · Pipeline · Dark"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="wiz-4" /></DCArtboard>
        <DCArtboard id="wz-interactive" label="Fluxo interativo (toque Continuar)" width={DEVICE_W} height={DEVICE_H}><PhoneApp dark={false} startScreen="wiz-1" /></DCArtboard>
      </DCSection>

      <DCSection id="report-flow" title="Novo fluxo de criação de relatório" subtitle="Plataforma primeiro → templates filtrados → pagamento">
        <DCArtboard id="rf-start-l"   label="01 · Escolha da plataforma · Light" width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="report-start" /></DCArtboard>
        <DCArtboard id="rf-tpl-g-l"   label="02 · Templates Google · Light"     width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="templates" platform="google" /></DCArtboard>
        <DCArtboard id="rf-tpl-m-l"   label="02 · Templates Meta · Light"       width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="templates" platform="meta" /></DCArtboard>
        <DCArtboard id="rf-gen-l"     label="03 · Gerar · Light"                  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={false} screen="generate" template={tplMeta} /></DCArtboard>
        <DCArtboard id="rf-start-d"   label="01 · Escolha da plataforma · Dark"  width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="report-start" /></DCArtboard>
        <DCArtboard id="rf-tpl-g-d"   label="02 · Templates Google · Dark"      width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="templates" platform="google" /></DCArtboard>
        <DCArtboard id="rf-tpl-m-d"   label="02 · Templates Meta · Dark"        width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="templates" platform="meta" /></DCArtboard>
        <DCArtboard id="rf-gen-d"     label="03 · Gerar · Dark"                   width={DEVICE_W} height={DEVICE_H}><StaticPhone dark={true} screen="generate" template={tplMeta} /></DCArtboard>
        <DCArtboard id="rf-interactive" label="Fluxo interativo (toque para navegar)" width={DEVICE_W} height={DEVICE_H}><PhoneApp dark={false} startScreen="report-start" /></DCArtboard>
      </DCSection>

      <DCSection id="desktop" title="Desktop" subtitle="Mesmo sistema, sidebar persistente, 1280px">
        <DCArtboard id="dt-dash-l" label="Dashboard · Light"   width={1280} height={820}><DesktopDashboard dark={false} /></DCArtboard>
        <DCArtboard id="dt-dash-d" label="Dashboard · Dark"    width={1280} height={820}><DesktopDashboard dark={true} /></DCArtboard>
        <DCArtboard id="dt-rep-l"  label="Relatório · Light"   width={1280} height={820}><DesktopReportDetail dark={false} /></DCArtboard>
        <DCArtboard id="dt-rep-d"  label="Relatório · Dark"    width={1280} height={820}><DesktopReportDetail dark={true} /></DCArtboard>
        <DCArtboard id="dt-rs-l"   label="Plataforma · Light"  width={1280} height={820}><DesktopReportStart dark={false} /></DCArtboard>
        <DCArtboard id="dt-rs-d"   label="Plataforma · Dark"   width={1280} height={820}><DesktopReportStart dark={true} /></DCArtboard>
        <DCArtboard id="dt-int-l"  label="Integrações · Light"   width={1280} height={820}><DesktopIntegrations dark={false} /></DCArtboard>
        <DCArtboard id="dt-int-d"  label="Integrações · Dark"    width={1280} height={820}><DesktopIntegrations dark={true} /></DCArtboard>
        <DCArtboard id="dt-repl-l" label="Relatórios (lista) · Light" width={1280} height={1100}><DesktopReports dark={false} /></DCArtboard>
        <DCArtboard id="dt-repl-d" label="Relatórios (lista) · Dark"  width={1280} height={1100}><DesktopReports dark={true} /></DCArtboard>
        <DCArtboard id="dt-repe-l" label="Relatórios (vazio) · Light" width={1280} height={820}><DesktopReports dark={false} empty /></DCArtboard>
        <DCArtboard id="dt-tx-l"   label="Créditos · Light"     width={1280} height={820}><DesktopTransactions dark={false} /></DCArtboard>
        <DCArtboard id="dt-tx-d"   label="Créditos · Dark"      width={1280} height={820}><DesktopTransactions dark={true} /></DCArtboard>
        <DCArtboard id="dt-set-l"  label="Configurações · Light" width={1280} height={1200}><DesktopSettings dark={false} /></DCArtboard>
        <DCArtboard id="dt-set-d"  label="Configurações · Dark"  width={1280} height={1200}><DesktopSettings dark={true} /></DCArtboard>
        <DCArtboard id="dt-gen-l"  label="Gerar relatório · Light" width={1280} height={1100}><DesktopGenerate dark={false} /></DCArtboard>
        <DCArtboard id="dt-gen-d"  label="Gerar relatório · Dark"  width={1280} height={1100}><DesktopGenerate dark={true} /></DCArtboard>
        <DCArtboard id="dt-gening-l" label="Gerando · Light"       width={1280} height={820}><DesktopGenerating dark={false} /></DCArtboard>
        <DCArtboard id="dt-gening-d" label="Gerando · Dark"        width={1280} height={820}><DesktopGenerating dark={true} /></DCArtboard>
        <DCArtboard id="dt-pix-l"  label="Pix · Light"             width={1280} height={920}><DesktopPix dark={false} /></DCArtboard>
        <DCArtboard id="dt-pix-d"  label="Pix · Dark"              width={1280} height={920}><DesktopPix dark={true} /></DCArtboard>
        <DCArtboard id="dt-tpl-l"  label="Templates (cards verticais) · Light"   width={1280} height={820}><DesktopTemplates dark={false} /></DCArtboard>
        <DCArtboard id="dt-tpl-d"  label="Templates (cards verticais) · Dark"    width={1280} height={820}><DesktopTemplates dark={true} /></DCArtboard>
        <DCArtboard id="dt-tplg-l" label="Templates filtrados Google · Light"    width={1280} height={820}><DesktopTemplates dark={false} platform="google" /></DCArtboard>
        <DCArtboard id="dt-tplm-l" label="Templates filtrados Meta · Light"      width={1280} height={820}><DesktopTemplates dark={false} platform="meta" /></DCArtboard>
        <DCArtboard id="dt-tplg-d" label="Templates filtrados Google · Dark"     width={1280} height={820}><DesktopTemplates dark={true} platform="google" /></DCArtboard>
        <DCArtboard id="dt-tplm-d" label="Templates filtrados Meta · Dark"       width={1280} height={820}><DesktopTemplates dark={true} platform="meta" /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
