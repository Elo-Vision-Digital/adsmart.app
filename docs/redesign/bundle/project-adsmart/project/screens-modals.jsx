// screens-modals.jsx — In-app credits purchase modal
// Mobile bottom sheet · Desktop centered dialog. No external Stripe checkout.

const CREDIT_PACKAGES = [
  { credits: 5,   price: 25,   bonus: 0 },
  { credits: 10,  price: 50,   bonus: 0 },
  { credits: 25,  price: 125,  bonus: 2 },
  { credits: 50,  price: 250,  bonus: 5,  popular: true },
  { credits: 100, price: 500,  bonus: 15, bestValue: true },
];

// ────────────────────────────────────────────────────────────────────────────
// BuyCreditsModal — content only (no overlay/positioning)
// ────────────────────────────────────────────────────────────────────────────
function BuyCreditsModal({ variant = 'sheet', onClose }) {
  const [pack, setPack] = React.useState(25);
  const [method, setMethod] = React.useState('pix');
  const selected = CREDIT_PACKAGES.find(p => p.credits === pack) || CREDIT_PACKAGES[2];
  const totalCredits = selected.credits + selected.bonus;
  const isSheet = variant === 'sheet';

  return (
    <div style={{
      background: 'var(--bg)',
      borderRadius: isSheet ? '24px 24px 0 0' : 24,
      width: '100%',
      maxHeight: isSheet ? '90vh' : 'none',
      display: 'flex', flexDirection: 'column',
      boxShadow: 'var(--shadow-3)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: isSheet ? '14px 18px 12px' : '20px 24px 16px',
        borderBottom: '1px solid var(--separator)',
        display: 'flex', flexDirection: 'column', gap: isSheet ? 8 : 0,
        position: 'relative',
      }}>
        {isSheet && (
          <div style={{
            width: 36, height: 4, borderRadius: 99,
            background: 'var(--border-strong)',
            margin: '0 auto 6px',
          }} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: isSheet ? 17 : 20, fontWeight: 700, letterSpacing: '-0.018em' }}>
              Comprar créditos
            </div>
            <div className="t-small text-2" style={{ marginTop: 2 }}>
              Pagamento dentro do site · Stripe
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', flexShrink: 0,
          }}>
            <IconClose s={16} sw={2} />
          </button>
        </div>
      </div>

      {/* Body (scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isSheet ? '14px 18px 14px' : '20px 24px 20px' }}>
        <div className="t-micro text-2" style={{ marginBottom: 10 }}>Pacote</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {CREDIT_PACKAGES.map(p => {
            const active = pack === p.credits;
            return (
              <button key={p.credits} onClick={() => setPack(p.credits)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                background: active ? 'var(--bg-elev)' : 'transparent',
                border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                transition: 'all .15s', width: '100%',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `1.5px solid ${active ? 'var(--text)' : 'var(--border-strong)'}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {active && <span style={{
                    width: 10, height: 10, borderRadius: '50%', background: 'var(--text)',
                  }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {p.credits} créditos
                    </span>
                    {p.bonus > 0 && <Badge tone="success">+{p.bonus} bônus</Badge>}
                    {p.bestValue && <Badge tone="ink">Melhor valor</Badge>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em' }}>
                    R$ {p.price.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Payment method tabs */}
        <div className="t-micro text-2" style={{ marginBottom: 10 }}>Forma de pagamento</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'pix',  label: 'Pix',     sub: 'Instantâneo' },
            { id: 'card', label: 'Cartão',  sub: 'Crédito · Stripe' },
          ].map(m => {
            const active = method === m.id;
            return (
              <button key={m.id} onClick={() => setMethod(m.id)} style={{
                padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                background: active ? 'var(--bg-elev)' : 'transparent',
                border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                transition: 'all .15s',
              }}>
                <div style={{ fontSize: 13, fontWeight: 650 }}>{m.label}</div>
                <div className="t-small text-2" style={{ marginTop: 2 }}>{m.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Method content */}
        {method === 'pix' ? (
          <div style={{
            padding: 16, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'flex', gap: 14, alignItems: 'center',
          }}>
            <div style={{
              padding: 8, borderRadius: 10,
              background: '#fff', boxShadow: 'var(--shadow-1)',
              flexShrink: 0,
            }}>
              <PixQR size={96} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 4 }}>
                Escaneie ou copie o código
              </div>
              <div className="t-mono" style={{
                fontSize: 10, color: 'var(--text-2)',
                padding: '6px 8px', borderRadius: 8,
                background: 'var(--bg)', border: '1px solid var(--border)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                marginBottom: 8,
              }}>00020126580014BR.GOV.BCB...</div>
              <Button variant="secondary" size="sm" full>Copiar código</Button>
            </div>
          </div>
        ) : (
          // Stripe Elements-style embedded form (mock)
          <div style={{
            padding: 16, borderRadius: 14,
            background: 'var(--bg-elev)', border: '1px solid var(--border)',
            display: 'grid', gap: 10,
          }}>
            <Field label="Número do cartão">
              <Input placeholder="1234 1234 1234 1234" leading={<IconCard s={16} />} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Validade">
                <Input placeholder="MM/AA" />
              </Field>
              <Field label="CVC">
                <Input placeholder="•••" leading={<IconLock s={16} />} />
              </Field>
            </div>
            <Field label="Nome no cartão">
              <Input placeholder="Como aparece no cartão" />
            </Field>
            <div className="t-small text-3" style={{
              display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              marginTop: 4,
            }}>
              <IconLock s={11} /> Powered by Stripe · seus dados nunca passam pelo nosso servidor
            </div>
          </div>
        )}
      </div>

      {/* Footer (sticky CTA) */}
      <div style={{
        padding: isSheet ? '14px 18px 22px' : '18px 24px 22px',
        borderTop: '1px solid var(--separator)',
        background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-elev)', border: '1px solid var(--border)',
          marginBottom: 12,
        }}>
          <div>
            <div className="t-small text-2">Total</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500, marginTop: 2 }}>
              {totalCredits} créditos
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em' }}>
            R$ {selected.price.toFixed(2).replace('.', ',')}
          </div>
        </div>
        <Button variant="primary" size="lg" full
                icon={method === 'pix' ? <IconCheck s={16} sw={2.2} /> : <IconLock s={16} />}>
          {method === 'pix' ? 'Confirmar e pagar com Pix' : `Pagar R$ ${selected.price.toFixed(2).replace('.', ',')}`}
        </Button>
        <p className="t-small text-3" style={{ textAlign: 'center', marginTop: 8 }}>
          Pagamento processado pela Stripe · sem redirecionamento
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MOBILE — Credits screen WITH modal pulled up (canvas frame)
// ────────────────────────────────────────────────────────────────────────────
function MobileCreditsWithModal({ dark }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ScreenTransactions dark={dark} onTab={() => {}} onBack={() => {}} />
      {/* Scrim */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 90,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
      }} />
      {/* Sheet */}
      <div className={`adsmart-scope ${dark ? 'theme-dark' : 'theme-light'}`} style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 100,
        maxHeight: '85%', display: 'flex',
      }}>
        <BuyCreditsModal variant="sheet" />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DESKTOP — Credits screen WITH modal centered (canvas frame)
// ────────────────────────────────────────────────────────────────────────────
function DesktopCreditsWithModal({ dark }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <DesktopTransactions dark={dark} />
      {/* Scrim */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 90,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div className={`adsmart-scope ${dark ? 'theme-dark' : 'theme-light'}`} style={{
          width: 520, maxHeight: '88%', display: 'flex',
        }}>
          <BuyCreditsModal variant="dialog" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  BuyCreditsModal, MobileCreditsWithModal, DesktopCreditsWithModal, CREDIT_PACKAGES,
});
