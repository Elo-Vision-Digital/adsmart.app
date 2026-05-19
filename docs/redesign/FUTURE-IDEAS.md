# AdSmart — Future Ideas (Postponed)

Banco de features e direções já consideradas, mas que **NÃO** entram no roadmap inicial.

**Roadmap inicial** (escopo único atual): ver [FEATURES-INVENTORY.md](./FEATURES-INVENTORY.md) — apenas redesign + refatoração de fluxos existentes.

## Origem destas ideias
- Bundle Claude Design extraído em `docs/redesign/bundle/project-adsmart/`
- Chats com Claude Design (`chats/chat1.md` e `chats/chat2.md`)
- Conversas iniciais com Claude Code

## Decisão (2026-05-18)
Roadmap inicial foca **APENAS** em redesign + refatoração do que já existe. Tudo abaixo entra em roadmaps futuros, depois de priorização explícita.

---

## 1. Assinatura Premium R$ 197/mês

**Origem**: `screens-subscription.jsx`, `chat1.md` post-Onda 2.

**Dependência crítica**: requer §8 (Stripe Integration) implementado.

**Resumo**:
- Preço: R$ 197/mês
- Pagamento: **Stripe Checkout EXTERNO** (`checkout.stripe.com` + redirect back) — via §8
- Inclui subsídio mensal de créditos (quantidade a definir após calcular custos)
- Stripe Customer Portal para gestão (cancelar, atualizar método)
- Webhook `checkout.session.completed` ativa assinatura; idempotência via `event.id`

**Features Premium-only** (referência):
- Análise IA de campanhas
- Briefings automáticos para criativos
- Insights detalhados de público
- Comparação com biblioteca de anúncios
- Ideias de criativos com IA + prompts
- Insights de engajamento e branding
- Wizard de novas campanhas
- Alertas semanais por email
- Suporte Prioritário
- Geração ilimitada (vs. limitada por créditos no Free)

**Dependências para implementar depois**:
- Stripe Billing + Subscriptions + Webhook handler
- Schema `subscription` em `packages/shared/src/schemas/`
- Callables: `createStripeSubscription`, `cancelStripeSubscription`, `stripeWebhook`
- Gating de features por `user.subscription.status === 'active'`
- Definir política de rollover de créditos não-usados
- Definir bônus de boas-vindas (cred. inicial pra Free)

---

## 2. AI Hub — 7 telas

**Origem**: `screens-ai.jsx`, `screens-ai-ops.jsx`, `chat1.md` turno 4 ("Inteligência IA · Hub & Análises" e "Operações").

### 2.1 AI Hub (entrada)
- Hero "Analisar minha conta em 30s"
- 6 cards de capacidades + insights recentes inline

### 2.2 AI Análise de Campanha
- Score circular (ex: 7.2/10)
- 3 indicadores: Saúde / Entrega / Eficiência
- "O que funciona × pontos de atenção"
- Diagnóstico "por que não está entregando" com 3 causas raiz
- Plano de ação com toggles "Aplicar sugestão"
- Suporta `platform: 'meta' | 'google'`

### 2.3 AI Criativos & Ideias
- Ranking de criativos (top / OK / fadiga) com CTR
- PromptCards reutilizáveis: título + prompt + botões Gerar/Copiar
- Atalhos para Nano Banana, ChatGPT, Midjourney (imagem) / ChatGPT, Claude (texto)

### 2.4 AI Público / Audience Insights
- Persona principal com descrição completa
- Composição demográfica + comportamentos
- 3 novos públicos sugeridos com impacto previsto
- Botão "Criar público"

### 2.5 AI Engajamento
- Tabs Engajar / Entreter / Influenciar / Monetizar
- Padrões dominantes por tab
- Para campanhas SEM foco em conversão direta

### 2.6 AI Biblioteca de Anúncios
- Comparação side-by-side: Seu × Líder rodando há +90d
- 4 diferenças-chave + 3 ações para replicar
- Depende de **Meta Ad Library API**

### 2.7 AI Briefing — "Precisa solicitar criativos?"
- Veredito (Sim/Parcial/Não) com razões data-driven
- Briefing completo: formato, ângulo, estrutura por segundos, copies, referências
- Export PDF

**Dependências para implementar depois**:
- Provedor de LLM (encaminhamento atual: Anthropic + DeepSeek combo, ver Roadmap inicial GATE)
- Arquitetura RAG vs long-context vs hybrid — a pesquisar via Context7
- APIs externas: Meta Ad Library API, Google Ads Transparency Center (se houver)
- Schemas: `aiInsight` (envelope) + 6 sub-schemas (`aiCampaignAnalysis`, `aiCreativeIdea`, `aiAudienceInsight`, `aiEngagementInsight`, `aiLibraryComparison`, `aiBriefing`)
- Callables: `analyzeCampaign`, `generateCreativePrompts`, `analyzeAudience`, `analyzeEngagement`, `compareWithLibrary`, `generateBriefing`
- Cache de respostas LLM (custo)
- Observabilidade (tokens in/out, latência, custo por feature)

---

## 3. Wizard Nova Campanha — 4 etapas

**Origem**: `screens-ai-ops.jsx` (`ScreenWizardStep1..4`), `chat1.md` turno 4.

### 3.1 Etapa 1 — Objetivo
- 5 radio cards:
  - Vendas / Conversão
  - Captação de leads
  - Reconhecimento / Awareness
  - Engajamento / Comunidade
  - Tráfego para site

### 3.2 Etapa 2 — Sobre o produto
- Nome, descrição, segmento, ticket, dor, diferencial, orçamento (chips R$ 50/100/250/500+)

### 3.3 Etapa 3 — IA processando
- Anel circular + 7 estágios sequenciais

### 3.4 Etapa 4 — Pipeline gerado
- Ângulo da oferta, público sugerido, mecanismo, PromptCards, copies, estratégia por períodos (Dias 1-7 / 8-14 / 15+)

**Dependências para implementar depois**:
- Schema `campaignPipeline` + callable `generateCampaignPipeline`
- Mesma camada de LLM e knowledge base do AI Hub
- Decisão: Wizard fica detrás de paywall Premium?

---

## 4. Plataformas "em breve"

**Origem**: `screens-report-start.jsx`, `chat1.md` turno 7.

UI atual do bundle mostra como "em breve · roadmap":
- TikTok
- LinkedIn
- YouTube
- Instagram (mencionado especificamente no chat1)

**Decisão (2026-05-18)**: nada disso entra na UI inicial. Remover qualquer texto "em breve" da AccountsPage e da tela de Platform Select. Quando uma plataforma realmente for trabalhada, ela entra na UI normal.

**Implementação futura por plataforma** vai precisar:
- OAuth flow específico do provider
- Schema `adAccount` aceitando novo enum
- Mapeamento de métricas equivalentes
- Endpoint de fetch de campanhas

---

## 5. Variações de Dashboard do protótipo (V1/V3)

**Origem**: `screens-extras.jsx` (`ScreenDashboardV2`, `ScreenDashboardV3`).

O bundle entregou 3 variações:
- **V1 Acolhedora** — foco em onboarding e empty state
- **V2 Data-rich** — hero chart + KPIs + donut + lista de relatórios
- **V3 Editorial** — número gigante de ROAS em card de tinta inversa + insight IA + top campanhas

**Decisão (2026-05-18)**: **nenhuma dessas variações entra no roadmap inicial**. O Dashboard inicial vai ser simplificado (apenas relatórios gerados + integrações), conforme requisito do usuário.

Variações ficam aqui como referência visual quando o produto evoluir para mostrar mais dados agregados.

---

## 6. Paridade Mobile/Desktop das Ondas 3 e 4 do Claude Design

**Origem**: `chat1.md` turno 8 (assistant) e `chat2.md` (truncado).

O Claude Design entregou as ondas 1+2 desktop, mas as ondas 3 (AI Hub — 7 telas) e 4 (Wizard — 4 telas) ficaram pendentes no desktop por limite de uso.

**Decisão**: estas telas só fazem sentido quando o AI Hub e o Wizard entrarem no roadmap (itens 2 e 3 acima). Quando isso acontecer, voltar ao Claude Design e gerar as variantes desktop antes de implementar.

---

## 7. Outras decisões adiadas

### 7.1 Bônus de boas-vindas (cred. inicial)
- O bundle mostra "Créditos adicionados · bônus de boas-vindas" na tabela de transações
- **Decisão postponed**: política (quantidade, frequência, condições) só será definida quando a assinatura Premium entrar (porque entra no cálculo de custos)

### 7.2 Rollover de créditos da assinatura
- Créditos da assinatura mensal não-usados: expiram no fim do ciclo? Acumulam até X ciclos? Acumulam indefinidamente?
- **Decisão postponed**: junto com a definição da assinatura (item 1)

### 7.3 Integração real com APIs de geração de imagem (Nano Banana, Midjourney)
- No bundle, PromptCards apenas **copiam o prompt** para o provider externo
- Futuro pode integrar geração embedded
- **Decisão postponed**: junto com AI Hub (item 2.3)

---

## 9. Páginas públicas e auxiliares — refactor visual postponed

**Decisão do usuário (2026-05-19)**: tudo que **não é CORE do protótipo** vai para FUTURE.

### Páginas afetadas
- **HomePage** (landing pública `/`) — 972 LOC, contém marketing/copy específica que muda quando features novas entrarem
- **PrivacyPolicyPage** (`/privacy`) — copy legal que pode mudar
- **TermsOfServicePage** (`/terms`) — idem
- **DeleteDataPage** (`/privacy/delete-data`) — fluxo de LGPD
- **EmailVerificationBanner** — componente exibido após signup

### Por que postponed
- O usuário vai definir bastante coisa do futuro da AdSmart antes de mexer nessas páginas
- Mudar copy + visual delas agora resulta em retrabalho quando as features novas chegarem
- Não bloqueiam o CORE (relatórios + integrações + créditos)
- HomePage refactor pode envolver landing inteira (preços, depoimentos, etc.) — escopo grande

### Quando endereçar
Quando o produto estiver estabilizado (após features novas iniciais) e o usuário tiver clareza de:
- Posicionamento de mercado
- Quais features destacar na landing
- Estrutura de preços final (com ou sem Premium)
- Casos de uso e depoimentos reais

### Para este roadmap inicial
- HomePage permanece como está (Montserrat + tokens antigos)
- Privacy/Terms/DeleteData permanecem como estão
- EmailVerificationBanner permanece como está
- **Princípio**: nenhuma dessas é tocada na Fase 1-4 do roadmap inicial

---

## 8. Stripe Integration — gateway de pagamento completo

**Decisão (2026-05-18)**: a integração real de pagamento entra **junto com as primeiras features novas** (provavelmente §2 AI Hub ou §3 Wizard), não no roadmap inicial.

**Razão**: a subscription Premium (§1) e o gateway de billing acoplam tecnicamente com as features de IA — faz sentido implementar uma vez só, no momento que a IA estiver pronta. Implementar Stripe agora apenas para créditos avulsos significa **dois deploys de pagamento**, dobrando trabalho de webhook, idempotência e compliance.

### O que vai entrar quando esta fase rodar

**8.1 Compra avulsa de créditos — Checkout INTERNO (Stripe Payment Element embedded)**
- 2 métodos: Pix + Cartão
- 5 pacotes de crédito (referência do bundle):

  | Créditos | Preço | Bônus | Badge |
  |---|---|---|---|
  | 5 | R$ 25 | 0 | — |
  | 10 | R$ 50 | 0 | — |
  | 25 | R$ 125 | +2 | — |
  | 50 | R$ 250 | +5 | popular |
  | 100 | R$ 500 | +15 | **Melhor valor** |

- Sem redirecionamento — "Pagamento dentro do site · Stripe"
- Implementa o `BuyCreditsModal` que hoje é stub (MOD-1 do roadmap inicial)

**8.2 Subscription Premium — Stripe Checkout EXTERNO**
- Stripe Checkout hospedado (`checkout.stripe.com`) + redirect back
- Stripe Billing (recurring) com subsídio mensal de créditos
- Stripe Customer Portal para cancelar/atualizar método de pagamento
- Implementa §1 (Premium R$ 197/mês)

**8.3 Webhook handler unificado**
- Endpoint `stripeWebhook` (onRequest com signature verify)
- Idempotência via `event.id` em coleção `processedWebhooks/`
- Eventos cobertos:
  - `payment_intent.succeeded` → adiciona créditos (compra avulsa)
  - `checkout.session.completed` → ativa subscription (Premium)
  - `customer.subscription.deleted` → desativa subscription
  - `customer.subscription.updated` → atualiza status
  - `invoice.payment_failed` → marca subscription em risco
- Rate limit + log de eventos para observabilidade

**8.4 Schemas + callables novos**
- Schemas: `subscription`, `stripeCustomer`, `processedWebhook`
- Refactor `transaction`: remover legacy `payerName/payerCpf`, adicionar `stripePaymentIntentId`, `stripeCustomerId`, `provider: 'stripe'`
- Refactor `productPrice`: adicionar `stripePriceId`, `stripeProductId`, `type: 'credits' | 'subscription'`
- Refactor `userWallet`: adicionar `subscriptionId?`, `subscriptionStatus?`
- Callables novos: `createStripeCheckoutSession`, `createStripeSubscription`, `cancelStripeSubscription`, `openStripeCustomerPortal`, `stripeWebhook`

**8.5 Secrets a configurar**
- `stripeSecretKey` (test + prod)
- `stripeWebhookSecret` (test + prod)
- `stripePublishableKey` (test + prod) — usado no frontend via Vite env
- Todos via `defineSecret` em `functions/src/config/index.ts`

**8.6 ADRs a criar quando esta fase rodar**
- ADR-NNN "Stripe como gateway oficial — substitui plano Asaas"
- ADR-NNN "Stripe Checkout dual flow: Payment Element embedded para créditos avulsos, Checkout hosted para subscription"

**8.7 Memória do agente IA a criar**
- `stripe_gateway.md` — Stripe é o gateway oficial; dois fluxos; padrões de webhook idempotente
- Atualizar `MEMORY.md` index

### Dependências para implementar

- Stripe account configurada (test + live)
- Pix BR habilitado na conta Stripe BR (verificar elegibilidade da conta — pode requerer KYC/CNPJ)
- Webhook endpoint público acessível (Cloud Function `onRequest`)
- Stripe CLI para testes locais (`stripe listen`)
- Validar via Context7 (na Fase -2 daquele roadmap) as APIs atuais:
  - Stripe Payment Element + Pix BR (2026)
  - Stripe Billing + Customer Portal
  - Idempotência de webhooks

### Por que NÃO entra no roadmap inicial
- Sem usuários em prod hoje → não há urgência de pagamento funcional
- Implementar agora significa refazer tudo quando subscription chegar
- Acoplamento técnico forte com features de IA (paywall, gating, billing por uso)
- Foco do roadmap inicial é **redesign + refactor**, não integração nova

---

## Como esta lista é mantida

- Adicionar entrada aqui quando uma ideia é discutida mas não vai entrar no roadmap atual
- Marcar com data e referência (chat/bundle)
- Remover daqui quando a ideia entrar num roadmap real
- Não é doc oficial do produto — é log de ideias para revisitar
