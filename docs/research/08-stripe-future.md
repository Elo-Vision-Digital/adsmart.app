# Research — Stripe Integration (PARA QUANDO FUTURE §8 RODAR)

**Validado em**: 2026-05-19
**Fontes**: WebSearch — Stripe Pix Brazil 2026, webhook signature verification
**Aplicação**: NÃO entra no roadmap inicial — registrado para quando FUTURE §8 entrar (junto com primeiras features novas / IA)

**Razão deste research existir**: usuário pediu validação Context7/internet de **todas** as decisões. Stripe está em FUTURE mas a abordagem deve estar validada agora para não retrabalhar depois.

---

## 1. Pix no Brasil via Stripe — confirmado disponível (2026)

### Status atual
- Pix é **suportado oficialmente** pela Stripe no Brasil
- Disponível via:
  - **Payment Element** (embedded)
  - **Checkout Session** (hosted)
  - **Payment Links**
- **IOF (Imposto sobre Operações Financeiras)**: Stripe handle automaticamente se for Checkout/Element; se for API user direto, dev precisa mostrar disclosure

### Elegibilidade
- Conta Stripe BR ativa
- KYC com CNPJ (para PJ) ou CPF (para PF — verificar limites)
- Pix habilitado no Stripe Dashboard (pode requerer aprovação adicional)

### Implicação para AdSmart
- Conta Stripe BR precisa ser criada/configurada quando FUTURE §8 entrar
- Disclosure de IOF: Stripe Element handle automaticamente — sem trabalho extra

---

## 2. Decisão arquitetural: Embedded (créditos avulsos) vs Hosted (subscription)

Confirmação do que já estava no roadmap inicial (FUTURE §8):

### Compra avulsa de créditos → **Payment Element EMBEDDED**
- UX: "Pagamento dentro do site · sem redirecionamento"
- Pix + Cartão na mesma UI
- Stripe Elements style (Apple-style fica natural)
- Implementação: `@stripe/stripe-js` + `@stripe/react-stripe-js`

### Subscription Premium → **Checkout Session HOSTED**
- UX: redirect para `checkout.stripe.com`, paga, volta
- Razão: Subscription tem complexidade extra (trial, proration, billing portal, manage payment methods) — Stripe Hosted handle tudo
- Customer Portal: redirect para `billing.stripe.com/p/login/...` quando user quer cancelar/atualizar

**Confirmado pelo research**: ambas opções suportam Pix. Decisão original do roadmap está correta.

---

## 3. Webhook signature verification — obrigatório

### Pattern oficial Stripe
```ts
import Stripe from 'stripe'
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const stripeSecret = defineSecret('STRIPE_SECRET_KEY')
const webhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET')

export const stripeWebhook = onRequest({
  secrets: [stripeSecret, webhookSecret],
}, async (req, res) => {
  const stripe = new Stripe(stripeSecret.value())
  const signature = req.headers['stripe-signature'] as string

  let event: Stripe.Event
  try {
    // CRÍTICO: usar raw body, não req.body parsed
    event = stripe.webhooks.constructEvent(
      req.rawBody,                  // ← raw body, não JSON.parse
      signature,
      webhookSecret.value()
    )
  } catch (err) {
    logger.error('Webhook signature verification failed', { err })
    return res.status(400).send('Invalid signature')
  }

  // Idempotência: event.id como key
  const eventRef = db.collection('processedWebhooks').doc(event.id)
  const eventDoc = await eventRef.get()
  if (eventDoc.exists) {
    return res.status(200).send('Already processed')  // skip duplicates
  }

  await db.runTransaction(async (tx) => {
    tx.set(eventRef, { processedAt: FieldValue.serverTimestamp(), type: event.type })
    // ... handle event
  })

  res.status(200).send('OK')
})
```

### Eventos cobertos
| Evento | Quando | Ação |
|---|---|---|
| `payment_intent.succeeded` | Pix confirmado / Cartão capturado (compra avulsa) | Adicionar créditos ao usuário |
| `checkout.session.completed` | Subscription Premium criada via Checkout hosted | Ativar subscription |
| `customer.subscription.deleted` | Cancelamento Premium | Desativar Premium gating |
| `customer.subscription.updated` | Status mudou (trial → active, active → past_due) | Atualizar estado local |
| `invoice.payment_succeeded` | Renovação mensal Premium paga | Renovar créditos mensais (subsídio) |
| `invoice.payment_failed` | Falha pagamento renovação | Marcar Premium em risco, enviar email |

---

## 4. Schema additions (a criar quando FUTURE §8 rodar)

```ts
// packages/shared/src/schemas/subscription.ts
export const SubscriptionStatusSchema = z.enum([
  'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'
])

export const SubscriptionSchema = z.object({
  id: z.string(),                          // Stripe sub_xxx
  userId: z.string(),
  stripeCustomerId: z.string(),
  stripePriceId: z.string(),
  status: SubscriptionStatusSchema,
  currentPeriodStart: zTimestamp(),
  currentPeriodEnd: zTimestamp(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: zTimestamp(),
})

// packages/shared/src/schemas/processedWebhook.ts
export const ProcessedWebhookSchema = z.object({
  id: z.string(),                          // event.id do Stripe
  type: z.string(),                        // event.type
  processedAt: zTimestamp(),
  provider: z.literal('stripe'),
})

// Refactor packages/shared/src/schemas/transaction.ts
// Remover: payerName, payerCpf (legacy SuitPay)
// Adicionar: stripePaymentIntentId, stripeCustomerId, provider: 'stripe' | 'admin'
```

---

## 5. Callables a criar (em `functions/src/payments/`)

| Callable | Tipo | Propósito |
|---|---|---|
| `createStripeCheckoutSession` | onCall | Cria session (Pix ou Cartão) para compra avulsa **OU** subscription |
| `createStripeCustomerPortalSession` | onCall | Redirect para Customer Portal (cancel/upgrade Premium) |
| `stripeWebhook` | onRequest | Endpoint webhook (signature verify + idempotência) |
| `cancelStripeSubscription` | onCall | Cancela imediato ou no fim do período |

**Padrão**:
- Todos usam `defineSecret('STRIPE_SECRET_KEY')`
- Todos com idempotency key (compra avulsa) ou event.id (webhook)
- Todos com `logger.info` estruturado + `checkRateLimit`

---

## 6. Frontend integration (a criar quando FUTURE §8 rodar)

### Compra avulsa — Payment Element embedded
```tsx
// src/components/payments/BuyCreditsPaymentElement.tsx
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export function BuyCreditsForm({ packCredits, packPrice }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    httpsCallable(fn, 'createStripeCheckoutSession')({
      type: 'credits',
      credits: packCredits,
      method: 'payment_element',
    }).then(r => setClientSecret(r.data.clientSecret))
  }, [packCredits])

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: appleAppearance }}>
      <PaymentElement options={{ layout: 'tabs' }} />  {/* Pix + Cartão tabs */}
      <PayButton />
    </Elements>
  )
}
```

### Subscription Premium — Checkout hosted
```tsx
// src/pages/SubscriptionPage.tsx
async function startCheckout() {
  const { url } = await httpsCallable(fn, 'createStripeCheckoutSession')({
    type: 'subscription',
    priceId: PREMIUM_PRICE_ID,
  })
  window.location.href = url  // redirect to checkout.stripe.com
}
```

### Apple-style appearance no Element
```ts
const appleAppearance: StripeElementsOptions['appearance'] = {
  theme: 'flat',
  variables: {
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    fontSizeBase: '15px',
    colorPrimary: '#1D1D1F',
    colorBackground: '#FFFFFF',
    colorText: '#1D1D1F',
    spacingUnit: '4px',
    borderRadius: '12px',
  },
}
```

---

## 7. ADRs a criar quando FUTURE §8 rodar

- **ADR-NNN Stripe é gateway oficial** (substitui menções legacy a Asaas + SuitPay)
- **ADR-NNN Dual flow**: Payment Element embedded para créditos, Checkout hosted para subscription
- **ADR-NNN Webhook idempotency** via `processedWebhooks/{event.id}` + transação Firestore

---

## 8. Memória .claude/.../memory a criar quando FUTURE §8 rodar

- **`stripe_gateway.md`** — Stripe é o gateway oficial; dois fluxos; webhook idempotente
- **`stripe_pix_brazil.md`** — Pix BR disponível via Stripe; tabs Pix+Cartão no Payment Element

---

## 9. Dependências externas para implementar (FUTURE §8)

- Conta Stripe BR ativa + KYC + Pix habilitado
- Domínio confirmado no Stripe (`adsmart.app` registrado para webhooks)
- Webhook endpoint público (Cloud Function `onRequest` deployed)
- Stripe CLI para testes locais (`stripe listen --forward-to localhost:5001/...`)
- Test cards + test Pix QR codes do Stripe sandbox
- Aprovação Pix da conta Stripe BR (pode demorar dias)

---

## 10. Lembrete

Este research **NÃO** é para implementar agora. É para garantir que a abordagem documentada em FUTURE §8 está validada com práticas atuais. Quando FUTURE §8 for executado, voltar aqui + repesquisar (Stripe muda APIs com frequência).

---

## Sources

- [Stripe Pix payments docs](https://docs.stripe.com/payments/pix)
- [How to enable Pix in Brazil (Stripe Help)](https://support.stripe.com/questions/how-to-enable-pix-as-a-payment-method-in-brazil)
- [Accept a one-time Pix payment](https://docs.stripe.com/payments/pix/accept-a-payment)
- [Stripe Webhooks Integration with Signature Verification](https://codehooks.io/docs/examples/webhooks/stripe)
- [Receive Stripe events in webhook endpoint](https://docs.stripe.com/webhooks?locale=en-GB)
- [A guide to Pix payments in Brazil](https://stripe.com/resources/more/pix-replacing-cards-cash-brazil)
