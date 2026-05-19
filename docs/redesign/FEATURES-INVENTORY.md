# AdSmart Redesign — Roadmap Inicial

**Status**: documento de revisão, fonte da verdade do escopo inicial.

**Escopo único deste roadmap**: redesign visual + refatoração de fluxos **que já existem hoje**. Não inclui features novas isoladas (AI Hub, Wizard, Subscription, etc.) — ver [FUTURE-IDEAS.md](./FUTURE-IDEAS.md).

**Estado atual do projeto**: ver [CURRENT-STATE-AUDIT.md](./CURRENT-STATE-AUDIT.md).

**⚠️ Lembrete sobre Stripe** (decisão 2026-05-18): a integração real de pagamento (Stripe Payment Element + Stripe Billing) **NÃO entra neste roadmap**. Será implementada **junto com as primeiras features novas** (provavelmente AI Hub ou Wizard) — ver [FUTURE-IDEAS.md §1 e §8](./FUTURE-IDEAS.md). Razão: a Subscription Premium e o gateway de billing acoplam tecnicamente com as features de IA. Neste roadmap, créditos só são adicionados via admin (`addUserCredits` callable existente), e o `BuyCreditsModal` mantém visual Apple-style mas com mensagem "Em breve".

---

## Princípios do projeto (regras invioláveis)

1. **Context7 antes de propor**: nenhuma lib, padrão ou refatoração entra no roadmap sem consulta a documentação atual via Context7 + WebSearch (regra do usuário).
2. **Schemas + API Contracts são source of truth**: toda mudança passa primeiro por `packages/shared/src/schemas/` e por um contrato declarado em `docs/API-CONTRACTS.md`. Zod v4 + `z.infer<typeof>` para types (ADR-009 mantido).
3. **Camada IA-coded antes de código de produto**: AGENTS/CLAUDE/docs/skills/sub-agents/hooks atualizados ANTES do primeiro PR de produto.
4. **Fases não convergentes**: cada fase é mergeable independentemente. Sem deadlocks cruzados.
5. **Mobile-first**: design e implementação começam no mobile e escalam para desktop com os mesmos tokens.
6. **Sem usuários em produção**: não há migração de dados necessária; refactors podem ser destrutivos onde fizer sentido.
7. **i18n nas 3 línguas**: TODA string nova vai em `src/locales/{pt-BR,en,es}.json`. Zero literal hardcoded em JSX/TSX. Hook `check-no-hardcoded-literal.sh` bloqueia commit.
8. **Dev-only flags**: rotas/funcionalidades de teste (ex: `/meta-review-demo`) APENAS em `import.meta.env.MODE === 'development'` — nunca em produção.
9. **Toda callable nova segue padrões**: `firebase-functions/logger` estruturado · idempotência via `processedRequests/{id}` ou `event.id` · `checkRateLimit` · exponential backoff para chamadas externas · Zod validation no input.
10. **Toda nova coleção Firestore tem rule explícita**: default deny + permissions específicas. Cliente nunca escreve em `reports/*`, `transactions/*`, `wallet/*`, `publicReportShares/*` — sempre via callable.
11. **Sem hardcoded**: zero env-specific literals · zero credenciais em código · secrets via `defineSecret` em `functions/src/config/index.ts` (hook bloqueia `process.env.X_SECRET`).
12. **Toda mudança em `firestore.rules` testada antes do deploy** (hook `check-rules-tested.sh` bloqueia se não rodou test).
13. **Multi-process agents** (Harness Engineering): Implementer e Validator em subagents/sessions separados com missões isoladas. Nenhum agente julga seu próprio output. Validator não tem permissão de `Edit/Write`. Detalhes: [research/09-harness-engineering.md §4](../research/09-harness-engineering.md).
14. **Contracts antes da execução**: toda task tem `CONTRACT.md` negociado Implementer↔Validator **antes** de qualquer linha de código. Hook `check-contract-exists.sh` bloqueia `Edit/Write` em sprint sem contract.
15. **Score binário de sensors**: sensors computacionais (lint, type-check, tests, rules-test, build) bloqueiam via hook. Não há "tá bom o suficiente" — passou ou não passou. Sensors inferenciais (review agent) usados seletivamente em pontos críticos.
16. **Progress files persistidos**: cada sprint mantém `PROGRESS.md` versionado em `docs/specs/{sprint}/`. Bootstrap script (`scripts/bootstrap-session.sh`) reconstrói contexto compacto (< 5k tokens) em novas sessions sem desperdiçar tokens descobrindo.

---

## Ordem de execução

```
Fase -2  ✓ COMPLETA — Pesquisa Context7 + WebSearch
         Saída: 8 docs/research/*.md validando libs/patterns

Fase -1  Schemas + API Contracts refactor (source of truth)
         Saída: packages/shared/src/schemas/ atualizado + docs/API-CONTRACTS.md

Fase 0   Harness/docs/skills update (camada IA-coded)
         Saída: AGENTS/CLAUDE/sub-AGENTS atualizados, skills/hooks novos,
                docs/specs/ por fase, memória limpa, ADRs publicados

Fase 0.5 Cleanup Asaas/SuitPay + Data Studio removal
         (texto, comentários, memórias — sem nova integração)

Fase 1   Design System (Tailwind v4 + tokens + tipografia SF Pro + primitives)

Fase 2   Layout global (BottomNav · Sidebar · TopBar)

Fase 3   Refactor tela a tela (UI puro, preserva funcionalidade)

Fase 3.5 Novo fluxo de relatório (6 passos) — refactor profundo

Fase 4   Validação funcional end-to-end (OAuth + relatório + wallet)
```

A integração Stripe entra **depois** deste roadmap, na primeira onda de features novas (ver [FUTURE-IDEAS.md §8](./FUTURE-IDEAS.md)).

### Status atual (2026-05-19)
- **Fase -2**: completa ([docs/research/](../research/) com 8 documentos validados)
- **Fase -1**: a iniciar (após sua aprovação dos docs desta sessão)
- Demais fases: pending

---

## Sumário por categoria

| Cat. | Itens | O que é |
|---|---|---|
| FOUNDATION | 4 | Fase -1 (schemas) + Fase 0 (harness) + research + ADRs novos |
| MN | 1 | Modelo de negócio: créditos (1 cr = R$5 · 1 plataforma = 1 cr) |
| DS | 1 | Design System (Tailwind v4 + SF Pro + tokens) |
| NAV | 3 | Bottom Nav · Sidebar · TopBar |
| REF | 9 | Refactor de telas CORE existentes |
| FLOW | 6 | Passos do novo fluxo de geração de relatório |
| SHARE | 3 | Share-link público (página + config visibilidade + snapshot) |
| INF | 3 | Infra: LLM combo · refresh strategy · render in-app + PDF |
| CLEAN | 5 | Remoções obrigatórias (Data Studio, Asaas/SuitPay menções, etc.) |
| MOD | 1 | BuyCreditsModal (stub visual — Stripe é FUTURE) |
| VAL | 4 | Validação funcional pós-redesign |
| GATE | 3 | Decisões abertas (1 fechada via Fase -2) |
| **Total** | **43** | |

---

## FOUNDATION — Camada de fundação (Fases -1 e 0) — 4 itens

> Saída da Fase -2 (pesquisa) — base sólida antes de qualquer código de produto. Referência: [docs/research/07-spec-driven-development.md](../research/07-spec-driven-development.md).

### FOUND-1. Schemas refactor + criação (Fase -1)
- **Refatorar** em `packages/shared/src/schemas/`:
  - `transaction` — remover `payerName/payerCpf` (legacy SuitPay); padronizar enums para créditos
  - `userWallet` — remover/padronizar `currency: 'BRL'` → "credits"
  - `report` — remover `lookerStudioUrl` + `templateId`; adicionar `platforms[]` + `businessType`
  - `productPrice` — limpar referências a Asaas; adicionar `creditsPerReport` config
- **Criar**:
  - `businessType` — enum Lançamento/Local/Perpétuo/E-commerce/Distribuição/Remarketing/Branding
  - `publicReportShare` — id, reportId, ownerId, visibleMetrics[], visibleSections[], snapshot, viewCount, revokedAt
  - `aiReportInsight` — output estruturado da LLM (sections, metrics, recommendations) — ver [research/02](../research/02-llm-strategy.md)
  - `processedRequest` — idempotency keys para callables mutativos
  - `llmCall` — observabilidade (write-only Admin SDK)
- **Cada schema = 1 PR atômico com testes Vitest**

### FOUND-2. API Contracts (`docs/API-CONTRACTS.md`)
Documentar com signature + auth + side-effects:
- **Callables existentes a refatorar**: `addUserCredits` (manter), `getPublicProductPrices` (atualizar payload), `oauth*` (validar — ver [research/06](../research/06-oauth-platforms.md))
- **Callables novos**:
  - `createReport(input)` — substitui `addDoc('reports')` direto do cliente
  - `refreshReport(reportId)` — manual com cooldown (INF-2)
  - `createReportShare(reportId, visibleMetrics, visibleSections)` — SHARE-2
  - `revokeReportShare(shareId)`
  - `listReportShares(reportId?)`
  - `recordShareView(shareId)` — increment viewCount com rate limit
  - `exportReportPDF(reportId)` — Playwright em CF (ver [research/05](../research/05-pdf-generation.md))
  - `analyzeReportData(reportId)` — LLM call interna (ver [research/02](../research/02-llm-strategy.md))
- **Function agendada**: `refreshActiveReports` — `onSchedule('every X')` (ver [research/01](../research/01-firebase-stack.md))

### FOUND-3. Harness IA-coded (Fase 0)
Detalhes em [research/07-spec-driven-development.md](../research/07-spec-driven-development.md) e [research/09-harness-engineering.md](../research/09-harness-engineering.md).

**3a — Estrutura de agents** (multi-process, padrão GSD)
Em `.claude/agents/` (criar):
- `orchestrator.md` — arquiteto da sprint/fase, divide em tasks, spawna subagents
- `researcher.md` — discovery paralelo (até 4 em paralelo, fresh 200k context each)
- `planner.md` — gera atomic tasks (2-3 por subplan) com dependency graph
- `implementer.md` — escreve código contra CONTRACT (permissions: Edit/Write/Bash, NÃO Agent)
- `validator.md` — bate CONTRACT item-a-item, score binário (permissions: Read/Bash apenas — NÃO pode editar)
- `debugger.md` — diagnose failures + gera fix plan quando Validator reprova

**3b — Estrutura de specs por sprint**
Em `docs/specs/{sprint-id}-{name}/` (criar):
- `SPEC.md` — outcomes, scope boundaries, constraints, prior decisions, task breakdown, verification criteria
- `CONTRACT.md` — lista negociada Implementer↔Validator antes de execução
- `PROGRESS.md` — log do que foi feito + estado atual (persiste entre sessions)
- `EVALUATION.md` — output do Validator com score binário por item

**3c — Bootstrap + persistência**
- `scripts/bootstrap-session.sh` — restaura contexto novo session (< 5k tokens):
  - lê `docs/specs/{current-sprint}/PROGRESS.md` primeiro
  - lê AGENTS.md + CLAUDE.md
  - lê memory `.claude/projects/.../memory/MEMORY.md`
  - roda `git status` + `git log -5`
- `scripts/update-progress.sh` — append log em `PROGRESS.md` da sprint
- Regra: **sempre atualizar PROGRESS.md ANTES de compactar contexto**

**3d — Sub-AGENTS.md por área** (já planejado)
- `src/AGENTS.md` (frontend), `functions/AGENTS.md` (criar), `packages/shared/AGENTS.md` (criar)

**3e — Skills novas** em `.claude/skills/`
- `redesign-screen` — workflow refactor tela seguindo DS-1
- `new-zod-schema` — schema novo com test
- `new-report-business-type` — adicionar tipo em FLOW-3
- `verify-i18n` — validar 3 idiomas
- `validate-llm-call` — validar callable LLM contra INF-1
- `negotiate-contract` — workflow contract Implementer↔Validator
- `bootstrap-fresh-session` — invoca bootstrap script + sintetiza estado

**3f — Slash commands**
- `/new-sprint <name>` — cria `docs/specs/{id}-{name}/` com templates
- `/research-sprint <id>` — spawna Researchers paralelos
- `/plan-sprint <id>` — Planner + Checker loop
- `/negotiate-contract <id>` — Implementer + Validator alinham scope
- `/execute-sprint <id>` — Orchestrator dispara Executors em waves
- `/validate-sprint <id>` — Validator em processo separado
- `/ship-sprint <id>` — PR + docs update + memory update
- `/new-screen-redesign <name>` — refactor tela DS-1
- `/check-i18n` — validar 3 idiomas em diff
- `/check-no-hardcoded` — detectar literals hardcoded
- `/new-ai-prompt-version <name>` — versionar prompt INF-1
- `/run-research <topic>` — disparar Context7 + WebSearch
- `/update-progress` — append em PROGRESS.md da sprint atual

**3g — Hooks PreToolUse novos** (sensors bloqueantes)
Sensors computacionais que travam ação errada:
- `check-no-hardcoded-literal.sh` — bloqueia strings em JSX/TSX (força i18n)
- `check-zod-schema-test.sh` — bloqueia commit de schema sem test
- `check-llm-call-via-logger.sh` — bloqueia chamada LLM sem `logger.info` estruturado
- `check-firestore-rule-defaults-deny.sh` — bloqueia rule sem default deny explícito
- `check-contract-exists.sh` — bloqueia `Edit/Write` em sprint sem `CONTRACT.md`
- `check-progress-updated.sh` — bloqueia commit sem update em `PROGRESS.md` da sprint
- `check-sensors-passed.sh` — bloqueia PR sem score binário positivo
- `check-implementer-not-validator.sh` — bloqueia mesmo agente fazer Edit e Validate

**3h — Memória .claude/projects/.../memory** (limpa + atualiza + cria)
- Deletar: `suitpay_deprecated.md`
- Atualizar: `firebase_secrets.md` (adicionar ANTHROPIC_API_KEY, DEEPSEEK_API_KEY), `admin_overhaul_roadmap.md` (cross-link)
- Criar: `llm_combo_strategy.md`, `report_flow_v2.md`, `credits_system.md`, `share_link_pattern.md`, `playwright_pdf.md`, `oauth_mfa_google.md`, `i18n_three_langs.md`, `harness_pattern.md`, `progress_files_discipline.md`, `multi_process_agents.md`

### FOUND-4. ADRs a publicar (Fase 0)

**Domínio (decisões de produto/arquitetura)**
- **ADR-NNN** Render in-app substitui Google Data Studio (Looker)
- **ADR-NNN** Sistema de Créditos: 1 crédito = R$5,00 · 1 plataforma selecionada = 1 crédito · sem subscription no inicial
- **ADR-NNN** LLM combo Anthropic + DeepSeek com roteamento por tarefa (ver [research/02](../research/02-llm-strategy.md))
- **ADR-NNN** Share-link público via UUID v4 + snapshot em subcoleção (ver [research/04](../research/04-share-link-patterns.md))
- **ADR-NNN** Playwright em Cloud Function para Export PDF (ver [research/05](../research/05-pdf-generation.md))
- **ADR-NNN** Tailwind v4 + Apple SF Pro como design system (ver [research/03](../research/03-frontend-stack.md))

**Harness Engineering (camada IA-coded)**
- **ADR-NNN** Adotar Harness Engineering — Fowler taxonomy (guides + sensors, computacional + inferencial)
- **ADR-NNN** Multi-process agents — Implementer ≠ Validator com permissions isoladas (Implementer Edit/Write, Validator Read/Bash)
- **ADR-NNN** Contracts negotiation antes da execução — `CONTRACT.md` por sprint, gravado como artefato
- **ADR-NNN** Progress files persistidos + Bootstrap script — memory entre sessions sem desperdiçar tokens
- **ADR-NNN** Sensor enforcement via hooks bloqueantes — score binário, sem "tá bom o suficiente"
- **ADR-NNN** Estrutura de specs por sprint — `docs/specs/{id}/SPEC.md|CONTRACT.md|PROGRESS.md|EVALUATION.md`

---

## GATE — Decisões abertas

### GATE-LLM-COMBO. ✓ FECHADO via Fase -2 (research/02-llm-strategy.md)
- **Modelos validados**:
  - **Sonnet 4.6** ($3/$15 per 1M) — anchor para output user-facing
  - **Haiku 4.5** ($1/$5 per 1M) — classificação, sumarização
  - **DeepSeek V4 Flash** ($0.14/$0.28 per 1M, $0.0028 cached) — parsing/agregação volume
- **Roteamento**: direct calls iniciais (sem AI Gateway/OpenRouter — over-engineering)
- **Cache obrigatório**: Anthropic prompt caching + DeepSeek prefix caching (~98% economia em cached input)
- **Structured output obrigatório**: Zod schema valida response antes de salvar
- **Observabilidade**: schema `llmCalls` + `logger.info` com tokens/custo/latência por chamada
- **Detalhes**: [docs/research/02-llm-strategy.md](../research/02-llm-strategy.md)

### GATE-REFRESH. Intervalo de atualização do relatório
- **Decisão do usuário (2026-05-18)**: híbrido = automático em background + manual via botão, ambos com cooldown
- **A definir**:
  - Intervalo do refresh automático (ex: 30min, 1h, 2h, 6h)
  - Cooldown do botão manual (ex: 5min entre cliques) para evitar spam
- **Critérios**: rate limit das APIs Google/Meta, custo de processamento, freshness de dados, UX

### GATE-REPORT-STRUCTURE. Estrutura padrão por tipo de negócio
- **Tipos definidos pelo usuário**: Lançamento · Negócio Local · Perpétuo (venda direta) · E-commerce · Distribuição de conteúdo · Remarketing · Branding (+ possíveis)
- **A definir colaborativamente** (decisão do usuário em AMB-2):
  - Métricas relevantes por tipo
  - Ordem e prioridade visual
  - Insights automáticos por tipo
  - Como a LLM personaliza output para cada tipo
- **Processo**: eu pesquiso boas práticas via Context7 + WebSearch e proponho; usuário revisa e decide
- **Bloqueia**: Fase 3.5 (novo fluxo)

### GATE-DASHBOARD. Layout do dashboard simplificado
- **Decisão do usuário**: Dashboard mostra apenas "relatórios gerados" + "integrações feitas" (como hoje, **sem seguir o protótipo**)
- **A definir na Fase 3**:
  - Layout exato (lista vs grid de cards)
  - Empty states
  - Ordem de seções
  - Componentes auxiliares (KPIs agregados? Atalhos?)

---

## MN — Modelo de Negócio (1)

### MN-1. Sistema de Créditos substitui valores em BRL
- **Conversão fixa**: 1 crédito = R$ 5,00
- **Custo por relatório**: **1 crédito** (independente do tipo — antes era 2 para Lançamento)
- **Origem dos créditos no roadmap inicial**: **apenas via admin** (`addUserCredits` callable já existente)
  - Compra direta pelo usuário (Stripe Payment Element): postponed → ver [FUTURE-IDEAS §8](./FUTURE-IDEAS.md)
  - Assinatura Premium + subsídio mensal: postponed → ver [FUTURE-IDEAS §1](./FUTURE-IDEAS.md)
- **Exibição do saldo**: pill "X créditos" + sparkle no TopBar
- **Tela "Carteira" renomeada para "Créditos"**
- **Tabela de transações em créditos**: `−1 crédito`, `+10 créditos`
  - Entradas (roadmap inicial): "Crédito adicionado · admin" (referencia callable `addUserCredits`)
  - Saídas: "Relatório · {tipo} · {plataforma}"
- **Campo `currency` no schema `UserWallet`** muda de `'BRL'` → padroniza créditos (ou remove o campo)

---

## DS — Design System (1)

### DS-1. Refundação visual completa
- **Tipografia**: SF Pro Display/Text via system stack Apple (substitui Montserrat)
- **Light mode**: estritamente B&W (#FFFFFF / #1D1D1F / #F5F5F7)
- **Dark mode**: pretos tonais profundos (#0A0A0B → #1C1C20) + **um único acento ciano #5EEAD4** restrito a data viz e sucesso
- **7 níveis de tipo**: display 32 · h1 26 · h2 20 · h3 17 · body 15 · small 13 · micro 11
- **Raios**: 6 · 8 · 12 · 16 · 22 · pill 999
- **Transições**: spring `cubic-bezier(.2,.9,.3,1.2)` (250ms) · tap-scale 0.97
- **Hairlines Apple-style**: 0.5px @2x
- **Inputs corrigidos**: labels acima do campo, ícones leading com respiro (não grudados na borda)
- **Tokens semânticos completos**: ver `docs/redesign/bundle/project-adsmart/project/tokens.css` como referência
- **Primitives novas** (criar em `src/components/ui/`): Field, Badge, Chip, Segmented, Toggle, Avatar, Select com leading icon, SectionHead, ListRow
- **Data viz primitives**: Sparkline, Donut, MiniBars, AreaChart, BarChart (em `src/components/data-viz/`)

---

## NAV — Layout/navegação (3)

### NAV-1. Bottom Navigation iOS-style (mobile)
- 5 abas: Início · Relatórios · `[+]` · Templates · Mais
- Botão central `[+]` elevado para ação primária (novo fluxo de relatório passo 1)

### NAV-2. Sidebar minimal (desktop)
- Persistente em 1280px, ícones + atalhos
- Lista todas as rotas do roadmap inicial (sem itens postponed)

### NAV-3. TopBar com pill de créditos
- Pill central "X créditos" + sparkle (substitui pill BRL atual)
- Avatar à direita

---

## REF — Refactor de telas existentes (escopo reduzido)

> Telas que já existem no app E que são CORE do produto. Páginas públicas e auxiliares ficam para FUTURE (decisão do usuário 2026-05-19 — ver FUTURE-IDEAS §9).

**Páginas COBERTAS por este roadmap** (CORE):
- LoginPage, ForgotPasswordPage
- Dashboard
- ReportsPage
- TemplatesPage → "Tipos de Negócio"
- GenerateReportPage → fluxo 6 passos
- AccountsPage (integrações OAuth)
- TransactionsPage → "Créditos"
- SettingsPage
- ReportSuccessPage → vira Report Detail

**Páginas POSTPONED para FUTURE** (decisão do usuário 2026-05-19):
- HomePage (landing pública)
- PrivacyPolicyPage
- TermsOfServicePage
- DeleteDataPage
- EmailVerificationBanner
- MetaReviewDemo (dev-only — guard com `import.meta.env.MODE === 'development'`)
- Admin panel (`/admin/*` tem roadmap próprio — fora deste escopo)

### REF-1. LoginPage / ForgotPasswordPage
- **Atual**: `src/pages/LoginPage.tsx` (365 LOC) · `src/pages/ForgotPasswordPage.tsx` (112 LOC)
- **Mudança**: visual Apple-style apenas

### REF-2. Dashboard (página inicial)
- **Atual**: `src/pages/Dashboard.tsx` (360 LOC)
- **Conteúdo do redesign** (decisão do usuário — **não seguir o protótipo V1/V2/V3**):
  - Lista de **relatórios gerados** (como hoje)
  - Lista de **integrações feitas**
  - Empty state quando não há relatórios nem integrações
- **A detalhar**: ver GATE-DASHBOARD

### REF-3. ReportsPage (lista de relatórios)
- **Atual**: `src/pages/ReportsPage.tsx` (325 LOC)
- **Mudança**: visual + lista populada + estado vazio Apple-style

### REF-4. TemplatesPage → "Tipos de Negócio"
- **Atual**: `src/pages/TemplatesPage.tsx` (147 LOC) + `src/components/templates/TemplateGrid.tsx`
- **Refactor conceitual**: deixa de ser "templates de relatório" e vira **"tipos de negócio"** — agora é o passo 3 do novo fluxo (FLOW-3)
- **Tipos**: Lançamento · Negócio Local · Perpétuo (venda direta) · E-commerce · Distribuição de conteúdo · Remarketing · Branding (+ extensível)
- **Decisão pendente**: a "TemplatesPage" como aba autônoma do menu continua existindo, ou só aparece dentro do fluxo? (ver GATE-DASHBOARD para o impacto no menu)

### REF-5. GenerateReportPage → fluxo de 6 passos
- **Atual**: `src/pages/GenerateReportPage.tsx` (535 LOC, fluxo 2 passos via Data Studio)
- **Refactor total**: ver categoria FLOW abaixo (6 passos novos, render in-app, sem Data Studio)

### REF-6. AccountsPage (Integrações OAuth)
- **Atual**: `src/pages/AccountsPage.tsx` (532 LOC)
- **Mudança**: visual Apple-style
- **Decisão (2026-05-18)**: **remover "Instagram em breve"** e qualquer outro "em breve" (TikTok, LinkedIn, YouTube) — não entra no roadmap inicial

### REF-7. TransactionsPage → "Créditos"
- **Atual**: `src/pages/TransactionsPage.tsx` (197 LOC)
- **Mudanças**:
  - Renomear "Carteira" → "Créditos"
  - Hero card de créditos (saldo atual + equivalente R$)
  - Tabela em créditos (não BRL)
  - Tabs: Todos / Entradas / Saídas
  - CTA "Comprar créditos" abre `BuyCreditsModal` (MOD-1) — **stub no roadmap inicial** (Stripe vem em FUTURE)

### REF-8. SettingsPage
- **Atual**: `src/pages/SettingsPage.tsx` (697 LOC)
- **Refactor de layout**:
  - Sub-nav lateral no desktop
  - 4 seções: Perfil/Conta · Segurança · Preferências · Suporte/Dados

### REF-9. ReportSuccessPage → redireciona para Report Detail
- **Atual**: `src/pages/ReportSuccessPage.tsx` (253 LOC) — confirma criação e mostra link Data Studio
- **Mudança**: deixa de ser página dedicada, vira redirect para nova rota `/reports/:id` (FLOW-6)

---

## FLOW — Novo fluxo de geração de relatório (6 passos)

Refactor profundo do fluxo de `GenerateReportPage`. Substitui Google Data Studio por render in-app.

### FLOW-1. Passo 1 — Seleção de plataforma
- Cards das plataformas suportadas: **Google Ads · Meta Ads**
- **Múltipla seleção**: usuário pode escolher 1 ou mais plataformas (gera 1 relatório com tabs por plataforma)
- **Sem itens "em breve"** (TikTok/LinkedIn/YouTube não entram nesta fase)
- **Custo (decisão do usuário 2026-05-19)**: **1 crédito por plataforma selecionada**.
  - Google Ads só = 1 crédito
  - Meta Ads só = 1 crédito
  - Google + Meta = 2 créditos
  - Escala linearmente quando novas plataformas forem adicionadas (futuro)
- **Bloqueio de seleção sem conta conectada (decisão do usuário 2026-05-19)**:
  - Se usuário não tem nenhuma conta conectada em alguma das plataformas, **a plataforma aparece desabilitada/bloqueada** com CTA "Conectar primeiro"
  - Não permite avançar para Passo 2 com plataformas sem conta

### FLOW-2. Passo 2 — Conta + Campanhas + Período
Para cada plataforma selecionada no passo 1 (todas com conta já conectada — bloqueio no Passo 1):
- **Conta de anúncios**:
  - Dropdown de contas disponíveis na plataforma
  - Usuário pode ter múltiplas contas conectadas — escolhe uma por plataforma
- **Campanhas**: lista de campanhas da conta selecionada, multi-select
- **Período (decisão do usuário 2026-05-19)**: detecção automática
  - Após selecionar plataformas + contas + campanhas, o sistema **automaticamente verifica períodos com dados**
  - UI: date picker mostra apenas dias/meses com dados disponíveis (estados visuais: ativo/desabilitado)
  - Se período inteiro sem dados → mensagem "Não há dados para este período"
  - **Trade-off técnico aceito**: latência extra para fazer call de "metadata de dados disponíveis" via APIs Google/Meta antes de mostrar picker — implementar com loading state explícito

### FLOW-3. Passo 3 — Tipo de negócio
- Cards/radio dos tipos: Lançamento · Negócio Local · Perpétuo (venda direta) · E-commerce · Distribuição de conteúdo · Remarketing · Branding
- A LLM (Anthropic + DeepSeek — ver GATE-LLM-COMBO) usa esta seleção para:
  - Escolher métricas relevantes
  - Personalizar análise textual
  - Filtrar dados que não fazem sentido para o tipo
- **Estrutura padrão por tipo**: ver GATE-REPORT-STRUCTURE (colaborativo)

### FLOW-4. Passo 4 — Resumo + confirmação
- **Layout**: form principal + **sidebar pegajosa lateral** (como no protótipo) com:
  - Resumo do pedido (plataformas, contas, campanhas, período, tipo)
  - Custo em créditos
  - Saldo atual + saldo após geração
  - CTA "Confirmar e gerar"

### FLOW-5. Passo 5 — Tela "Gerando"
- Ring de progresso (180px desktop, menor mobile)
- Estágios sequenciais:
  - Conectando à conta
  - Coletando dados (período selecionado)
  - Calculando métricas
  - Gerando insights (via LLM)
  - Renderizando dashboard
- Estados ✓ feito / ⏺ ativo (animado) / ○ pendente
- Sem possibilidade de cancelar (uma vez confirmado, o crédito é debitado)

### FLOW-6. Passo 6 — Relatório gerado (in-app)
- **Rota nova**: `/reports/:id`
- **Render in-app** (substitui Google Data Studio):
  - Header com badge de status + ações
  - Tabs por plataforma (se múltiplas foram selecionadas no passo 1)
  - Big chart de receita ao longo do tempo
  - KPIs em grid (baseado em GATE-REPORT-STRUCTURE)
  - Breakdown por campanha
  - Insights textuais (gerados pela LLM)
- **Ações disponíveis**:
  - **Compartilhar via link** → abre fluxo SHARE-1
  - **Export PDF** → INF-3
  - **Atualizar** → INF-2 (manual com cooldown)
- **Removido do protótipo**: botão "Análise IA" — não entra agora

---

## SHARE — Compartilhamento público de relatório (3)

### SHARE-1. UI de configuração de visibilidade
- **Onde**: dentro da tela de Report Detail (FLOW-6), antes de gerar o link
- **Como**: toggles por métrica/seção (KPIs, charts, breakdown, insights)
- **Pré-seleção**: tudo visível por padrão; usuário desliga o que não quer expor
- **Confirmação do usuário (AMB-3)**: esta config **entra no escopo inicial**

### SHARE-2. Geração do link público
- Callable `createReportShare(reportId, visibleMetrics[])` retorna `shareId`
- Schema `publicReportShare`: `{ id, reportId, ownerId, visibleMetrics[], createdAt, viewCount, expiresAt? }`
- Link no formato `https://adsmart.app/r/:shareId`
- Sem expiração padrão (a definir se vai ter ou não)
- Usuário pode revogar o link (callable `revokeReportShare`)

### SHARE-3. Página pública `/r/:shareId`
- **Sem autenticação** — qualquer pessoa com o link acessa
- Renderiza apenas as seções marcadas `visibleMetrics`
- Layout isolado (sem chrome do app autenticado: sem sidebar, sem bottom nav, sem botão de comprar créditos)
- **Brand AdSmart no rodapé** ("Gerado pela AdSmart · adsmart.app")
- Open Graph meta tags para preview rico em WhatsApp/Slack/redes
- Rate limit no callable de criação e na rota pública (anti-abuse)

---

## INF — Infra e lógica (3)

### INF-1. LLM combo Anthropic + DeepSeek
- **Direção do usuário**: combo balanceado por custo
- **Onde é usado**:
  - Passo 3 do fluxo: escolha de métricas por tipo de negócio
  - Geração de insights textuais no relatório (FLOW-6)
- **Padrão de roteamento** (a definir na Fase -2):
  - DeepSeek: parsing/agregação/sumarização de dados (alto volume, baixa criticidade)
  - Anthropic: insights user-facing (output que vai para o relatório)
- **Cache**: prompt caching (Anthropic) + prefix caching (DeepSeek) — pesquisa Context7 obrigatória
- **Observabilidade**: logging de tokens in/out, latência, custo por chamada
- **Detalhes finais**: ver GATE-LLM-COMBO

### INF-2. Estratégia de refresh do relatório
- **Decisão do usuário (2026-05-18)**: híbrido
  - **Automático**: refresh em background a cada X tempo (X a definir — ver GATE-REFRESH)
  - **Manual**: botão "Atualizar" no relatório, com cooldown Y (Y a definir — ver GATE-REFRESH)
- **Implementação**:
  - Last-fetched timestamp persistido no relatório
  - Automático: trigger Cloud Function agendada (Cloud Scheduler ou Firestore listener)
  - Manual: callable `refreshReport(reportId)` valida cooldown e re-busca
- **Considerações**: rate limits APIs Google/Meta, custo de processamento, idempotência

### INF-3. Render in-app + Export PDF
- **Render**: React no front, dados do Firestore
- **Export PDF**: a definir na Fase -2 — opções:
  - Server-side: Puppeteer/Playwright em Cloud Function
  - Client-side: react-pdf, html2pdf, jsPDF
  - Trade-off: qualidade vs custo vs latência

---

## CLEAN — Remoções obrigatórias (5)

### CLEAN-1. Google Data Studio — remoção TOTAL
- **Onde está hoje**: provavelmente em `src/pages/GenerateReportPage.tsx` + `src/pages/ReportSuccessPage.tsx` + algum callable de geração de link Data Studio + algum schema com `dataStudioUrl`
- **Ação**: remover endpoints, links, configs, env vars, ícones, docs. Zero referência a "Data Studio" / "looker" no código final
- **Substituição**: render in-app (FLOW-6)

### CLEAN-2. Asaas — limpeza de menções (não há código ativo)
- **Onde está hoje**: apenas comentários em `functions/src/index.ts`, `getDashboardMetrics.ts`, schemas, e ~10 docs (PAYMENTS.md, API-CONTRACTS.md, DATA-MODEL.md, DOMAIN.md, Integrations.md, SECURITY.md, CHANGES.md, Decisions.md, etc.)
- **Confirmado pela auditoria**: **NÃO há SDK Asaas, callables Asaas, webhooks Asaas, env vars Asaas instaladas**. É apenas plano/comentários textuais.
- **Ação**: remover menções a "Asaas" em comentários e docs (faxina de texto, ~30 ocorrências). Substituir por referência neutra ou comentário "payment integration: ver FUTURE-IDEAS.md §8"
- **Não inclui**: implementação de novo gateway (isso é FUTURE)

### CLEAN-3. SuitPay — legacy
- **Ação**: zero referência em código e docs. ADR-021 marcado como Superseded por ADR a ser criado quando Stripe entrar (FUTURE)
- **Memórias**: deletar `.claude/projects/*/memory/suitpay_deprecated.md`
- **`Transaction.payerName / payerCpf`** (legacy SuitPay): remover do schema (sem usuários em prod, não precisa migration)

### CLEAN-4. Boleto
- **Ação**: remover qualquer UI/callable de boleto (já removido no design)

### CLEAN-5. Tela ScreenCard separada
- **Ação**: cartão continua como **opção dentro do BuyCreditsModal** (MOD-1) — não há mais página/tela dedicada

---

## MOD — Modais (1)

### MOD-1. BuyCreditsModal — stub visual no roadmap inicial
- **Origem**: `screens-modals.jsx` no bundle (referência visual)
- **Escopo no roadmap inicial**: **APENAS visual** — pagamento real (Stripe) entra junto com primeiras features novas (ver [FUTURE-IDEAS.md §8](./FUTURE-IDEAS.md))
- **Por que mantemos a UI**: o botão "Comprar créditos" está referenciado em Header, MobileHeader e TemplatesPage. Remover quebraria 3 lugares; é mais simples deixar o modal abrir com mensagem de "Em breve"
- **Variants**: `sheet` (mobile bottom sheet) + `dialog` (desktop centered)
- **Conteúdo no roadmap inicial**:
  - Header Apple-style: "Comprar créditos"
  - Body: mensagem clara — "Estamos integrando o checkout em breve. Por enquanto, peça crédito ao seu administrador."
  - Footer: botão "Entendi" / "Fechar"
- **5 pacotes** (referência para FUTURE — valor fixo: 1 crédito = R$ 5,00):

  | Créditos | Preço | Bônus | Badge |
  |---|---|---|---|
  | 5 | R$ 25 | 0 | — |
  | 10 | R$ 50 | 0 | — |
  | 25 | R$ 125 | +2 | — |
  | 50 | R$ 250 | +5 | popular |
  | 100 | R$ 500 | +15 | **Melhor valor** |

- **Quando Stripe entrar (FUTURE)**: este modal recebe o Payment Element embedded com Pix + Cartão e a tabela de pacotes ativa

---

## VAL — Validação funcional pós-redesign (4)

Validar que tudo o que **já funciona hoje** continua funcionando após o redesign + refactors. Lista de smoke tests obrigatórios antes de considerar o roadmap inicial completo.

### VAL-1. Fluxo OAuth Google Ads + Meta Ads
- Signup → conectar Google Ads → conta listada
- Signup → conectar Meta Ads → conta listada
- Seleção de conta com múltiplos manager accounts
- Refresh token + reauth (token expirado)
- Disconnect (revogar acesso)

### VAL-2. Fluxo end-to-end de geração de relatório
- Login → selecionar plataforma(s) → conectar conta (se preciso) → escolher campanhas → período com dados → tipo de negócio → confirmar → gerar → ver relatório → compartilhar link → ver página pública → export PDF → atualizar dados manualmente

### VAL-3. Wallet/transactions
- Comprar créditos via Pix (modal interno)
- Comprar créditos via Cartão (modal interno)
- Saldo atualizado em tempo real
- Histórico de transações correto
- Crédito debitado ao gerar relatório

### VAL-4. Lista de relatórios + dashboard
- Relatório gerado aparece em `/reports`
- Relatório aparece no Dashboard (REF-2)
- Integrações aparecem no Dashboard
- Click em relatório navega para `/reports/:id`

---

## Como este documento é mantido

- Atualizar quando uma decisão de GATE for fechada
- Adicionar/remover itens conforme novas conversas
- Mover itens para FUTURE-IDEAS.md se decisão for adiar
- Cada fase implementada: marcar como concluída sem perder histórico
