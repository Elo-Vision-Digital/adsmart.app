# AdSmart — Current State Audit

**Levantamento formal** do estado do projeto antes do redesign. Esse documento é a base contra a qual o roadmap inicial (ver [FEATURES-INVENTORY.md](./FEATURES-INVENTORY.md)) opera.

**Snapshot date**: 2026-05-18
**Branch**: `develop`

---

## 1. Rotas (src/App.tsx)

### Autenticadas (PrivateRoute)
| Rota | Componente | Arquivo |
|---|---|---|
| `/dashboard` | `Dashboard` | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) (360 LOC) |
| `/reports` | `ReportsPage` | [src/pages/ReportsPage.tsx](src/pages/ReportsPage.tsx) (325 LOC) |
| `/templates` | `TemplatesPage` | [src/pages/TemplatesPage.tsx](src/pages/TemplatesPage.tsx) (147 LOC) |
| `/generate-report` | `GenerateReportPage` | [src/pages/GenerateReportPage.tsx](src/pages/GenerateReportPage.tsx) (535 LOC) |
| `/report-success` | `ReportSuccessPage` | [src/pages/ReportSuccessPage.tsx](src/pages/ReportSuccessPage.tsx) (253 LOC) |
| `/accounts` | `AccountsPage` | [src/pages/AccountsPage.tsx](src/pages/AccountsPage.tsx) (532 LOC) |
| `/transactions` | `TransactionsPage` | [src/pages/TransactionsPage.tsx](src/pages/TransactionsPage.tsx) (197 LOC) |
| `/payment-success` | `PaymentSuccessPage` | [src/pages/PaymentSuccessPage.tsx](src/pages/PaymentSuccessPage.tsx) (100 LOC) |
| `/settings` | `SettingsPage` | [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx) (697 LOC) |
| `/privacy/delete-data` | `DeleteDataPage` | [src/pages/DeleteDataPage.tsx](src/pages/DeleteDataPage.tsx) (134 LOC) |
| `/meta-review-demo` | `MetaReviewDemo` | [src/pages/MetaReviewDemo.tsx](src/pages/MetaReviewDemo.tsx) (376 LOC) — *temporário até aprovação Meta* |

### Callbacks OAuth (não autenticadas, mas com state)
| Rota | Componente |
|---|---|
| `/auth/google-ads/callback` | `OAuthCallbackPage` |
| `/auth/meta-ads/callback` | `OAuthCallbackPage` |

### Auth (públicas)
| Rota | Componente |
|---|---|
| `/login` | `LoginPage` (365 LOC) |
| `/forgot-password` | `ForgotPasswordPage` (112 LOC) |

### Públicas
| Rota | Componente |
|---|---|
| `/` | `HomePage` (972 LOC) |
| `/privacy` | `PrivacyPolicyPage` (239 LOC) |
| `/terms` | `TermsOfServicePage` (256 LOC) |

### Admin (AdminRoute)
| Rota | Componente |
|---|---|
| `/admin/dashboard` | `AdminDashboardPage` (lazy) |
| `/admin/prices` | `PricesConfigPage` |
| `/admin/wallet` | `WalletAdminPage` |

---

## 2. Cloud Functions Callables (functions/src/)

Todas em Functions v2, região `us-central1` (default), Node 22.

### Auth & user lifecycle
| Callable | Arquivo | Tipo | Propósito |
|---|---|---|---|
| `bootstrapUser` | [bootstrapUser.ts](functions/src/bootstrapUser.ts) | `beforeUserCreated` (Auth blocking trigger) | Seed inicial de `users/{uid}` + `users/{uid}/wallet/current` |
| `reserveUserDocument` | [reserveUserDocument.ts](functions/src/reserveUserDocument.ts) | `onCall` | Reserva atômica de CPF/CNPJ (ADR-012) |
| `deleteUserData` | [deleteUserData.ts](functions/src/deleteUserData.ts) | `onCall` | LGPD — remoção completa |

### OAuth — Google Ads
| Callable | Arquivo | Notas |
|---|---|---|
| `getGoogleAdsAuthUrl` | [googleAdsOAuth.ts](functions/src/googleAdsOAuth.ts) | Gera URL OAuth + state |
| `getGoogleAdsCampaigns` | [googleAdsOAuth.ts](functions/src/googleAdsOAuth.ts) | Lista campanhas da conta |
| `handleGoogleAdsCallbackWithSelection` | [googleAdsOAuthV2.ts](functions/src/googleAdsOAuthV2.ts) | V2 — com seleção de account quando há múltiplos managers |
| `confirmGoogleAdsAccountSelection` | [googleAdsOAuthV2.ts](functions/src/googleAdsOAuthV2.ts) | V2 — confirma a conta escolhida |
| ~~`handleGoogleAdsCallback`~~ | ~~googleAdsOAuth.ts~~ | DEPRECATED — não exportado |

### OAuth — Meta Ads
| Callable | Arquivo | Notas |
|---|---|---|
| `getMetaAdsAuthUrl` | [metaAdsOAuth.ts](functions/src/metaAdsOAuth.ts) | Gera URL OAuth |
| `handleMetaAdsCallback` | [metaAdsOAuth.ts](functions/src/metaAdsOAuth.ts) | (verificar V1 vs V2) |
| `getMetaAdsCampaigns` | [metaAdsOAuth.ts](functions/src/metaAdsOAuth.ts) | Lista campanhas |
| `handleMetaAdsCallbackWithSelection` | [metaAdsOAuthV2.ts](functions/src/metaAdsOAuthV2.ts) | V2 com seleção |
| `confirmMetaAdsAccountSelection` | [metaAdsOAuthV2.ts](functions/src/metaAdsOAuthV2.ts) | V2 confirma seleção |

### Wallet / Pagamento
| Callable | Arquivo | Notas |
|---|---|---|
| `addUserCredits` | [adminWalletManager.ts](functions/src/adminWalletManager.ts) | Admin-only — adicionar créditos manualmente |
| (sem callable de pagamento ativo) | — | **SuitPay removido (ADR-021). Asaas é apenas comentário/plano — não há código de pagamento funcional hoje.** |

### Preços / produtos
| Callable | Arquivo |
|---|---|
| `getProductPrices` | [priceManager.ts](functions/src/priceManager.ts) (admin-only) |
| `updateProductPrices` | [priceManager.ts](functions/src/priceManager.ts) (admin-only) |
| `initializeDefaultPrices` | [priceManager.ts](functions/src/priceManager.ts) |
| `getPublicProductPrices` | [getPublicProductPrices.ts](functions/src/getPublicProductPrices.ts) | `invoker: 'public'` |

### Métricas / admin
| Callable | Arquivo | Notas |
|---|---|---|
| `getDashboardMetrics` | [getDashboardMetrics.ts](functions/src/getDashboardMetrics.ts) | Admin metrics (memória 512MiB) |

### Infraestrutura
| Função | Arquivo | Tipo |
|---|---|---|
| `checkRateLimit` | [rateLimiter.ts](functions/src/rateLimiter.ts) | Helper interno |
| `securityLogger` | [securityLogger.ts](functions/src/securityLogger.ts) | Helper interno |
| `restoreBackup` | [backupScheduler.ts](functions/src/backupScheduler.ts) | Admin-only |

---

## 3. Schemas (packages/shared/src/schemas/)

| Schema | Arquivo | Propósito |
|---|---|---|
| `User` | [user.ts](packages/shared/src/schemas/user.ts) | Perfil do usuário |
| `UserDocument` | [userDocument.ts](packages/shared/src/schemas/userDocument.ts) | CPF/CNPJ atômico (ADR-012) |
| `UserWallet` | [userWallet.ts](packages/shared/src/schemas/userWallet.ts) | Saldo (campo `currency: 'BRL'` — **vai mudar para créditos**) |
| `Transaction` | [transaction.ts](packages/shared/src/schemas/transaction.ts) | Entradas/saídas — campos `payerName`, `payerCpf` legacy SuitPay |
| `Report` | [report.ts](packages/shared/src/schemas/report.ts) | **Inclui `lookerStudioUrl`** — vai sair com remoção Data Studio |
| `Campaign` | [campaign.ts](packages/shared/src/schemas/campaign.ts) | Campanhas listadas via OAuth |
| `AdAccount` | [adAccount.ts](packages/shared/src/schemas/adAccount.ts) | Contas conectadas Google/Meta |
| `OAuthState` | [oauthState.ts](packages/shared/src/schemas/oauthState.ts) | Estado dos fluxos OAuth |
| `DashboardMetrics` | [dashboardMetrics.ts](packages/shared/src/schemas/dashboardMetrics.ts) | Métricas do admin dashboard |
| `ProductPrice` | [productPrice.ts](packages/shared/src/schemas/productPrice.ts) | Preços dos templates de relatório |
| `RateLimit` | [rateLimit.ts](packages/shared/src/schemas/rateLimit.ts) | Server-side rate limiting |

---

## 4. Fluxos OAuth atuais

### 4.1 Google Ads
1. UI: usuário clica em "Conectar Google Ads" em [AccountsPage](src/pages/AccountsPage.tsx)
2. Callable `getGoogleAdsAuthUrl` retorna URL de autorização + state armazenado em `oauthStates/{uid}`
3. Redirect para Google OAuth
4. Google redireciona para `/auth/google-ads/callback`
5. [OAuthCallbackPage](src/pages/OAuthCallbackPage.tsx) chama `handleGoogleAdsCallbackWithSelection`
6. Se há múltiplos manager accounts: tela de seleção → `confirmGoogleAdsAccountSelection`
7. Conta salva em `users/{uid}/adAccounts/{accountId}`

### 4.2 Meta Ads
- Fluxo similar ao Google, com callables próprios (V2)
- Tem **fluxo demo** para aprovação Meta (`/meta-review-demo`) — temporário

### 4.3 Token storage
- Tokens (access + refresh) armazenados em Firestore com secret encryption
- Refresh lógico nos callables que listam campanhas

---

## 5. Geração de relatório atual (será refatorado em FLOW-* do roadmap)

### Fluxo hoje (2 passos via Looker Studio):
1. **Passo 1 — Template + dados**: usuário em [GenerateReportPage.tsx:535](src/pages/GenerateReportPage.tsx) escolhe:
   - Plataforma (`google_ads` ou `meta_ads`)
   - Conta de anúncio (via dropdown)
   - Campanhas (multi-select ou "todas")
   - Período (dateRange)
   - Template (`templateId` mapeia para `lookerStudioId` em [src/config/lookerStudioTemplates.ts](src/config/lookerStudioTemplates.ts))
2. **Geração**: client-side cria documento em `reports/` com `addDoc` + chama `debitAmount` no wallet hook
3. **Passo 2 — Sucesso**: navega para `/report-success?id=...`
4. **ReportSuccessPage** aguarda `lookerStudioUrl` ser preenchido no documento (presumivelmente por processo backend que clona o template do Looker Studio com filtros aplicados — **não consegui identificar o callable que faz isso**, pode ser job manual ou cron)
5. Usuário clica e o link abre o Looker Studio em nova aba

### Pontos críticos que mudam no roadmap:
- **`Report.lookerStudioUrl`** sai do schema
- **`Report.templateId`** vira `Report.businessType` (tipo de negócio, ver FLOW-3)
- **`src/config/lookerStudioTemplates.ts`** deletado
- **`ReportSuccessPage`** substituída por nova rota `/reports/:id` com render in-app
- **`addDoc` direto do cliente** → vira callable backend (idempotência + validação + chamadas LLM)
- **Currency**: `UserWallet.currency: 'BRL'` → vira `'CREDITS'` (ou simplesmente remove o campo e padroniza créditos)

---

## 6. Wallet / Transactions hoje

### Estado
- Documento `users/{uid}/wallet/current` (criado por `bootstrapUser` Auth blocking)
- Subcoleção `users/{uid}/transactions` (read-only do cliente, write via Admin SDK)

### Fluxo de pagamento — **NÃO FUNCIONA HOJE**
- SuitPay foi removido em 2026-05-18 (ADR-021)
- Asaas é apenas planejado (não há código)
- `AddCreditsModal` ([src/components/ui/AddCreditsModal.tsx:57](src/components/ui/AddCreditsModal.tsx)) é stub com mensagem de manutenção
- Único modo de adicionar crédito hoje: admin via `addUserCredits` callable

### Hook do front
- [src/hooks/useWallet.ts](src/hooks/useWallet.ts) — leitura do saldo + transações via `onSnapshot`
- `debitAmount` (local) é chamado quando relatório é gerado para descontar o saldo

### Phase 3 baseline (security)
- Cliente **não escreve** em `wallet/*` nem `transactions/*` (bloqueado por Firestore Rules)
- Server-only writes via Admin SDK

---

## 7. Camada visual atual

### Design tokens
- [src/index.css](src/index.css) — CSS vars: `--background / --surface / --text / --border / --muted / --muted-foreground / --primary`
- Light mode: `#FFFFFF / #FAFAFA / #000000 / #E5E5E5`
- Dark mode (via `data-theme="dark"`): `#000000 / #0A0A0A / #FFFFFF / #1A1A1A`
- **Não tem** os tokens semânticos completos do bundle (text-2/text-3, bg-elev-2, success ciano dark, separator, shadows, raios)

### Tipografia
- **Montserrat** (Google Fonts) via `@fontsource/montserrat`
- Pesos: 400/500/600/700
- **Vai ser substituído** por SF Pro stack (system Apple)

### Tailwind config
- [tailwind.config.js](tailwind.config.js)
- `darkMode: ['class', '[data-theme="dark"]']`
- Animações: slide-in, slide-out, fade-in, fade-in-up
- **Sem** utilitários de escala tipográfica (.t-display etc.)

### Primitives UI já existentes em [src/components/ui/](src/components/ui/)
- `button`, `card`, `input`, `label`, `popover`, `dialog`, `checkbox`, `calendar`, `toast`
- `AccountSelectionModal`, `AddCreditsModal` (stub)
- **Faltam** ~30 primitives do bundle: Field, Badge, Chip, Segmented, Toggle, Avatar, Select com leading, SectionHead, ListRow, data-viz (Sparkline, Donut, etc.)

### Layout
- [src/components/layout/Header.tsx](src/components/layout/Header.tsx)
- [src/components/layout/MobileHeader.tsx](src/components/layout/MobileHeader.tsx)
- [src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)
- [src/components/layout/BottomNavigation.tsx](src/components/layout/BottomNavigation.tsx)
- [src/components/layout/Footer.tsx](src/components/layout/Footer.tsx)
- [src/components/layout/MainLayout.tsx](src/components/layout/MainLayout.tsx)
- [src/components/layout/PageHeader.tsx](src/components/layout/PageHeader.tsx)

### Contexts
- `AuthContext` → `useAuth()` retorna `user`, `loading`, `isAdmin`, sign-in/out methods
- `LanguageContext` → `useLanguage()` retorna `language`, `setLanguage`, `t(key)` (pt-BR / en / es)
- `ThemeContext` → `useTheme()` retorna `theme`, `toggleTheme`

### Provider order ([src/App.tsx](src/App.tsx))
```
LanguageProvider → ThemeProvider → AuthProvider
```

### i18n
- 3 idiomas: [src/locales/pt-BR.json](src/locales/pt-BR.json) · [en.json](src/locales/en.json) · [es.json](src/locales/es.json)
- Tipo central em [src/locales/types.ts](src/locales/types.ts) (`Language = 'pt' | 'en' | 'es'`)

---

## 8. Stack atual

### Front (`/`)
- React 19 + Vite + TypeScript 5
- Tailwind 3 (não 4 ainda) + CSS vars semânticas
- React Router 7
- Firebase JS SDK 10
- Zod via `@adsmart/shared` (ADR-009)
- Biome (substitui ESLint + Prettier)
- Vitest

### Backend (`functions/`)
- Functions v2 (`firebase-functions/v2/https` + `identity`)
- Admin SDK 12.7
- Node 22
- Região: `us-central1`
- Secrets via `defineSecret` em [functions/src/config/index.ts](functions/src/config/index.ts)

### Shared (`packages/shared/`)
- Zod schemas (source of truth, ADR-009)
- Types via `z.infer`
- Helpers de auth (admin, password)

### Tooling
- Bun como package manager + runtime de testes/build
- Turborepo (workspaces + cache)
- Lefthook (pre-commit: Biome check, type-check)
- Vitest para testes
- Firebase emulator suite para Firestore Rules tests

### CI/CD
- GitHub Actions
- Deploy: `firebase deploy --only hosting,functions,firestore:rules,firestore:indexes`
- ADR-021 (Phase 3 baseline) força inclusão de rules/indexes no deploy

---

## 9. O que vai ser **removido** no roadmap inicial

| Item | Onde está | Substituído por |
|---|---|---|
| **Google Data Studio** | [src/config/lookerStudioTemplates.ts](src/config/lookerStudioTemplates.ts), `Report.lookerStudioUrl`, ReportSuccessPage | Render in-app (FLOW-6) |
| **Menções a Asaas** (texto, comentários, docs) | Comentários em [functions/src/index.ts](functions/src/index.ts), [getDashboardMetrics.ts](functions/src/getDashboardMetrics.ts), schemas, docs/PAYMENTS.md, docs/API-CONTRACTS.md, docs/DATA-MODEL.md, docs/DOMAIN.md, docs/Integrations.md, docs/SECURITY.md, docs/CHANGES.md, docs/Decisions.md (ADR-021), AddCreditsModal | Referência neutra "payment integration → ver FUTURE-IDEAS §8" (não substitui por gateway real agora — Stripe é FUTURE) |
| **SuitPay** (referências em texto) | Comentários (código já removido), memória `.claude/projects/*/memory/suitpay_deprecated.md`, ADR-021 | (cleanup textual completo) |
| **Boleto** | (verificar — pode não existir mais) | Removido |
| **Página separada de cartão** | (não existe no app atual) | Cartão dentro do BuyCreditsModal (quando Stripe entrar) |
| **Montserrat font** | [src/styles/fonts.css](src/styles/fonts.css), [tailwind.config.js](tailwind.config.js) | SF Pro stack (system Apple) |
| **`UserWallet.currency: 'BRL'`** | [packages/shared/src/schemas/userWallet.ts](packages/shared/src/schemas/userWallet.ts) | Padroniza créditos |
| **`Report.templateId`** | [packages/shared/src/schemas/report.ts](packages/shared/src/schemas/report.ts) | `Report.businessType` |
| **`Report.lookerStudioUrl`** | idem | sai do schema |
| **`Transaction.payerName / payerCpf`** | [packages/shared/src/schemas/transaction.ts](packages/shared/src/schemas/transaction.ts) (legacy SuitPay) | Apenas remove — sem prod data, sem migration |

---

## 10. O que vai ser **refatorado** (não removido)

| Item | Mudança no roadmap inicial |
|---|---|
| Todas as `src/pages/*.tsx` | Visual refactor (DS-1 tokens + tipografia) |
| `Dashboard.tsx` | Simplificar: só relatórios + integrações |
| `GenerateReportPage.tsx` | Quebrar em 6 passos (FLOW-*) |
| `AccountsPage.tsx` | Remover "em breve", visual Apple |
| `TransactionsPage.tsx` | Renomear "Carteira" → "Créditos", tabela em créditos |
| `SettingsPage.tsx` | Sub-nav lateral desktop |
| `BottomNavigation.tsx` | 5 abas + botão `+` central |
| `Sidebar.tsx` | Estilo Apple-minimal |
| `MobileHeader.tsx` / `Header.tsx` | TopBar com pill de créditos |
| `AddCreditsModal.tsx` | **Apenas visual refactor** — Stripe Payment Element entra em FUTURE §8 |
| `index.css` | Adicionar tokens semânticos completos |
| `tailwind.config.js` | SF Pro stack + utilitários de tipo + animações Apple |

---

## 11. O que vai ser **adicionado** ao código (novos artefatos)

### Novos schemas em `packages/shared/src/schemas/`
- `businessType` — enum de tipos de negócio (Lançamento, Local, etc.)
- `publicReportShare` — share-link público
- `reportSection` ou `reportMetric` — estrutura padrão por tipo (decidir depois do GATE-REPORT-STRUCTURE)
- **Schemas de Stripe (`subscription`, `processedWebhook`, refactor de `transaction` e `productPrice`)**: postponed → FUTURE §8

### Novos callables em `functions/src/`
- `createReport` — substitui o `addDoc` direto do cliente, valida + debita + dispara LLM
- `refreshReport` — manual com cooldown (INF-2)
- `createReportShare`, `revokeReportShare`, `listReportShares`
- `exportReportPDF` — server-side (se decidir Puppeteer no backend)
- (Function agendada para refresh automático — INF-2)
- **Callables de Stripe (`createStripeCheckoutSession`, `createStripeSubscription`, `stripeWebhook`, etc.)**: postponed → FUTURE §8

### Novas rotas
- `/r/:shareId` — pública, sem auth (SHARE-3)
- `/reports/:id` — substitui `/report-success` (FLOW-6)
- `/generate-report/step-{1,2,3,4}` — passos do novo fluxo

### Novos componentes em `src/components/`
- Primitives UI faltantes (Field, Badge, Chip, etc.)
- Data viz (Sparkline, Donut, MiniBars, AreaChart, BarChart)
- LaptopMock + variantes? *(provavelmente não — só era visual de Templates, que vira FLOW-3)*

---

## 12. Memórias do agente IA — cleanup necessário

Arquivo: [.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/MEMORY.md](.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/MEMORY.md)

| Memória | Ação |
|---|---|
| `suitpay_deprecated.md` | **DELETAR** completamente (eliminar legacy) |
| `firebase_secrets.md` | Manter (válido) |
| `admin_claim_policy.md` | Manter |
| `phase_ordering.md` | Manter |
| `feedback_consult_context7_before_proposing.md` | Manter (crucial) |
| `feedback_always_update_docs.md` | Manter |
| `admin_overhaul_roadmap.md` | **Atualizar** (Subprojeto 3 mira o redesign) |
| `feedback_document_before_advancing.md` | Manter |
| `feedback_no_hardcoded_no_unnecessary_comments.md` | Manter |
| `firestore_rules_indexes_in_ci.md` | Manter |

**Criar nova memória**:
- `stripe_gateway.md` — Stripe como gateway oficial, dois fluxos (interno/externo), padrões de webhook idempotente

---

## 13. ADRs relevantes ao redesign

| ADR | Estado | Ação |
|---|---|---|
| ADR-009 (Zod schemas como source of truth) | Active | Manter |
| ADR-010 | Active | Manter |
| ADR-012 (CPF/CNPJ uniqueness atômico via `reserveUserDocument`) | Active | Manter |
| ADR-016 (priceManager v2) | Active | Manter |
| ADR-021 (SuitPay removed, payment integration pendente) | Active (sem superseder ainda) | Atualizar texto removendo a menção a "Asaas migration" — apontar para FUTURE-IDEAS §8 quando Stripe entrar |
| ADR-NNN (Render in-app substituindo Data Studio) | **A criar** | Criar na Fase 0.5 |
| ADR-NNN (Sistema de créditos: 1 crédito = R$5, 1 relatório = 1 crédito) | **A criar** | Criar na Fase 0.5 |
| ADR-NNN (Stripe gateway oficial — dual flow Payment Element + Checkout) | **A criar quando FUTURE §8 rodar** | Não neste roadmap |

---

## 14. Como este documento é atualizado

- Cada vez que o estado do repo mudar significativamente (após mergear uma fase do roadmap)
- Nunca refletir intenção — apenas estado **atual e observável** do código/configs
- Mudanças planejadas vão em [FEATURES-INVENTORY.md](./FEATURES-INVENTORY.md), não aqui
