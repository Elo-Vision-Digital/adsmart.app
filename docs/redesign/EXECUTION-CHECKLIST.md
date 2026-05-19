# AdSmart Redesign — Execution Checklist End-to-End

**Visão única** de tudo que precisa ser feito, agrupado por fase, com checkboxes para tracking. Fonte da verdade operacional.

**Última atualização**: 2026-05-19

---

## Status Geral

| Fase | Descrição | Status | Prioridade |
|---|---|---|---|
| **Fase -2** | Pesquisa Context7 + WebSearch (Harness, LLM, Firebase, etc.) | ✅ **COMPLETA** | — |
| **Fase -1** | Schemas + API Contracts (source of truth) | ✅ **COMPLETA** (PR #3 mergeado em `develop` em 2026-05-19) | 🔴 Crítica |
| **Fase 0a** | Foundation Harness (multi-agents + contracts + bootstrap) | ✅ **COMPLETA** (PR #4 mergeado em `develop` em 2026-05-19) | 🔴 Crítica |
| **Fase 0b** | Sub-AGENTS, skills, slash commands, hooks | ✅ **COMPLETA** (PR #5 mergeado em `develop` em 2026-05-19) | 🔴 Crítica |
| **Fase 0c** | Memória cleanup + criação | ✅ **COMPLETA** (branch `feat/redesign-foundation-memory` — 16 items, verdict pass) | 🟡 Alta |
| **Fase 0d** | ADRs publicados | ⏳ A iniciar | 🟡 Alta |
| **Fase 0.5** | Cleanup textual (Asaas, SuitPay, Data Studio) | ⏳ A iniciar | 🟢 Média |
| **Fase 1** | Design System (Tailwind v4 + SF Pro + tokens + primitives) | ⏳ A iniciar | 🔴 Crítica |
| **Fase 2** | Layout global (BottomNav · Sidebar · TopBar) | ⏳ A iniciar | 🟡 Alta |
| **Fase 3** | Refactor tela a tela (UI puro) | ⏳ A iniciar | 🟡 Alta |
| **Fase 3.5** | Novo fluxo de relatório (6 passos) | ⏳ A iniciar | 🔴 Crítica |
| **Fase 4** | Validação funcional end-to-end | ⏳ A iniciar | 🔴 Crítica |

**Próximo passo recomendado**: revisão + merge do PR Fase 0c (foundation-memory) → disparar **Fase 0d** (ADRs publicados em `docs/Decisions.md`).

---

## 🚦 GATEs abertos (decisões necessárias durante execução)

- [ ] **GATE-REFRESH**: definir intervalo de refresh auto + cooldown manual (Fase 0a)
- [ ] **GATE-REPORT-STRUCTURE**: definir métricas por tipo de negócio (colaborativo — antes da Fase 3.5)
- [ ] **GATE-DASHBOARD**: definir layout do dashboard simplificado (antes da Fase 3)

GATEs fechados:
- ✅ GATE-LLM-COMBO (research/02)

---

## ✅ FASE -2 — Pesquisa Context7 + WebSearch (COMPLETA)

Saídas geradas:
- [x] [docs/research/README.md](../research/README.md) (índice)
- [x] [docs/research/01-firebase-stack.md](../research/01-firebase-stack.md)
- [x] [docs/research/02-llm-strategy.md](../research/02-llm-strategy.md)
- [x] [docs/research/03-frontend-stack.md](../research/03-frontend-stack.md)
- [x] [docs/research/04-share-link-patterns.md](../research/04-share-link-patterns.md)
- [x] [docs/research/05-pdf-generation.md](../research/05-pdf-generation.md)
- [x] [docs/research/06-oauth-platforms.md](../research/06-oauth-platforms.md)
- [x] [docs/research/07-spec-driven-development.md](../research/07-spec-driven-development.md)
- [x] [docs/research/08-stripe-future.md](../research/08-stripe-future.md)
- [x] [docs/research/09-harness-engineering.md](../research/09-harness-engineering.md)

---

## ✅ FASE -1 — Schemas + API Contracts (source of truth) — CONCLUÍDA

**Status**: concluída em **2026-05-19** via PR [#3](https://github.com/Elo-Vision-Digital/adsmart.app/pull/3). Detalhes em [docs/specs/-1-foundation-schemas/PROGRESS.md](../specs/-1-foundation-schemas/PROGRESS.md). 4 commits, 195/195 testes verdes, refactor aditivo (legacy preservado para Fase 0.5).

**Objetivo**: deixar a fonte da verdade preparada **antes** de qualquer código de produto. Toda feature futura herda destes contratos.

**Pré-requisitos**:
- ✅ Fase -2 completa
- ✅ Aprovação dos docs `redesign/` + `research/`

**Estimativa original**: 5-7 dias · **Real**: 1 dia (refactor aditivo, sem migração de dados)

### Tasks

#### Schemas a refatorar em [packages/shared/src/schemas/](packages/shared/src/schemas/)

- [ ] **`transaction.ts`** — remover `payerName`/`payerCpf` (legacy SuitPay); padronizar para créditos; remover currency `BRL`; preparar campos opcionais para futuro Stripe (`stripePaymentIntentId?`) mas sem implementar lógica
- [ ] **`userWallet.ts`** — remover/padronizar `currency: 'BRL'` → padronizar créditos; adicionar `updatedAt` consistente
- [ ] **`report.ts`** — remover `lookerStudioUrl`; remover `templateId`; adicionar `platforms: PlatformSchema[]`, `businessType: BusinessTypeSchema`, `accountIds: Record<Platform, string>`, `campaignIds`, `dateRange`, `cost` (em créditos), `nextRefreshAt`, `lastRefreshedAt`
- [ ] **`productPrice.ts`** — limpar referências a Asaas; padronizar `creditsPerReport: 1`, `pricePerCredit: 5.00`

#### Schemas novos a criar

- [ ] **`businessType.ts`** — enum: Lançamento, Negócio Local, Perpétuo, E-commerce, Distribuição de Conteúdo, Remarketing, Branding (extensível)
- [ ] **`platform.ts`** — enum: `google_ads`, `meta_ads` (extensível para futuras plataformas)
- [ ] **`publicReportShare.ts`** — id, reportId, ownerId, visibleMetrics[], visibleSections[], snapshot, viewCount, revokedAt, expiresAt?
- [ ] **`aiReportInsight.ts`** — output estruturado da LLM (summary, topMetrics, recommendations) — validação Zod do response
- [ ] **`processedRequest.ts`** — idempotency keys para callables mutativos
- [ ] **`llmCall.ts`** — observabilidade (provider, model, task, tokens, cost, latency) write-only Admin SDK
- [ ] **`reportPlatformData.ts`** — dados específicos por plataforma (subcoleção `users/{uid}/reports/{id}/platforms/{platform}`)

#### Testes Vitest

- [ ] Cada schema novo tem `*.test.ts` adjacente
- [ ] Cobertura de parse válido + edge cases + invalid input

#### API Contracts — [docs/API-CONTRACTS.md](../API-CONTRACTS.md) refactor completo

Documentar com signature + auth + side-effects para CADA callable:

**Callables existentes a documentar** (sem mudança funcional):
- [ ] `bootstrapUser`
- [ ] `reserveUserDocument`
- [ ] `deleteUserData`
- [ ] `addUserCredits` (admin)
- [ ] `getProductPrices` (admin)
- [ ] `updateProductPrices` (admin)
- [ ] `getPublicProductPrices`
- [ ] `getGoogleAdsAuthUrl`
- [ ] `handleGoogleAdsCallbackWithSelection`
- [ ] `confirmGoogleAdsAccountSelection`
- [ ] `getGoogleAdsCampaigns`
- [ ] `getMetaAdsAuthUrl`
- [ ] `handleMetaAdsCallback`
- [ ] `getMetaAdsCampaigns`
- [ ] `handleMetaAdsCallbackWithSelection`
- [ ] `confirmMetaAdsAccountSelection`
- [ ] `getDashboardMetrics`
- [ ] `checkRateLimit` (helper)
- [ ] `securityLogger` (helper)
- [ ] `restoreBackup`

**Callables novos a especificar (contratos antes de implementar)**:
- [ ] `createReport(input)` — substitui `addDoc('reports')` cliente · valida + debita + dispara LLM
- [ ] `refreshReport(reportId)` — manual com cooldown
- [ ] `createReportShare(reportId, visibleMetrics, visibleSections)`
- [ ] `revokeReportShare(shareId)`
- [ ] `listReportShares(reportId?)`
- [ ] `recordShareView(shareId)` — rate-limited
- [ ] `exportReportPDF(reportId)` — Playwright em CF
- [ ] `analyzeReportData(reportId, businessType)` — LLM call interna
- [ ] `getAvailableDataPeriods(platform, accountId, campaignIds)` — para FLOW-2 detecção de períodos com dados

**Function agendada**:
- [ ] `refreshActiveReports` — `onSchedule('every X min')` que busca reports com `nextAutoRefreshAt <= now`

#### Data Model doc — [docs/DATA-MODEL.md](../DATA-MODEL.md) refactor

- [ ] Diagrama da estrutura Firestore atualizada
- [ ] Subcoleções de `report.platforms/`
- [ ] Top-level `publicReportShares/`
- [ ] `processedRequests/` para idempotência
- [ ] `llmCalls/` (write-only Admin)
- [ ] Composite indexes necessários listados (para `firestore.indexes.json`)

### Critério de aceite

- [ ] Todos os schemas novos/refatorados em `packages/shared/src/schemas/`
- [ ] `bun run test` passa em `packages/shared`
- [ ] `docs/API-CONTRACTS.md` lista 100% dos callables (existentes + novos especificados)
- [ ] `docs/DATA-MODEL.md` reflete novo modelo
- [ ] Nenhum schema referencia `lookerStudioUrl`, `BRL`, `Asaas`, `SuitPay`
- [ ] Zero `interface Foo` declarado separado de schema Zod (sempre `type Foo = z.infer<typeof FooSchema>`)

---

## ✅ FASE 0a — Foundation Harness (multi-agents + contracts + bootstrap) — CONCLUÍDA

**Status**: concluída em **2026-05-19** (branch `feat/redesign-foundation-harness`). Detalhes em [docs/specs/0a-foundation-harness/PROGRESS.md](../specs/0a-foundation-harness/PROGRESS.md) + EVALUATION `verdict: pass`. Runbook em [docs/HARNESS-RUNBOOK.md](../HARNESS-RUNBOOK.md). 6 agents + 4 templates + 3 scripts + dogfood, zero regressão (test 195/195, typecheck verde).

**Objetivo**: instalar a infraestrutura de Harness Engineering. Sem isso, todas as outras fases sofrem com entropia.

**Pré-requisitos**:
- ✅ Fase -1 completa (schemas existem para os agents trabalharem com)

**Estimativa original**: 3-5 dias · **Real**: 1 dia (escopo bem definido, zero código TS tocado)

**Referência**: [docs/research/09-harness-engineering.md](../research/09-harness-engineering.md)

### Tasks

#### Agents em `.claude/agents/`

- [ ] **`orchestrator.md`** — arquiteto da sprint/fase, divide em tasks, spawna subagents (allowedTools: Agent, Read, TodoWrite, Bash de leitura)
- [ ] **`researcher.md`** — discovery paralelo, fresh 200k context (allowedTools: Read, Grep, Glob, WebSearch, WebFetch, mcp Context7 e Firebase)
- [ ] **`planner.md`** — gera atomic tasks com dependency graph (allowedTools: Read, TodoWrite, Write em `docs/specs/`)
- [ ] **`implementer.md`** — escreve código contra CONTRACT (allowedTools: Edit, Write, Bash para testes/build, **NÃO** Agent — não pode spawnar)
- [ ] **`validator.md`** — bate CONTRACT item-a-item, score binário (allowedTools: Read, Grep, Glob, Bash para rodar testes/lint/type-check, **NÃO** Edit/Write)
- [ ] **`debugger.md`** — diagnose failures + fix plan quando Validator reprova (allowedTools: Read, Bash, TodoWrite)

#### Templates de specs em `docs/specs/`

- [ ] **Template `SPEC.md`** — outcomes, scope boundaries, constraints, prior decisions, task breakdown, verification criteria
- [ ] **Template `CONTRACT.md`** — lista negociada Implementer↔Validator (item-a-item)
- [ ] **Template `PROGRESS.md`** — log do que foi feito + estado atual (sobrevive sessions)
- [ ] **Template `EVALUATION.md`** — output do Validator com score binário por item

#### Scripts

- [ ] **`scripts/bootstrap-session.sh`** — restaura contexto novo session (< 5k tokens):
  - lê `docs/specs/{current-sprint}/PROGRESS.md` primeiro
  - lê `AGENTS.md` + `CLAUDE.md`
  - lê `.claude/projects/.../memory/MEMORY.md`
  - roda `git status` + `git log -5 --oneline`
  - imprime resumo compacto
- [ ] **`scripts/update-progress.sh`** — append em `PROGRESS.md` da sprint atual com timestamp
- [ ] **`scripts/new-sprint.sh <id> <name>`** — cria `docs/specs/{id}-{name}/` com 4 templates

### Critério de aceite

- [ ] 6 agents criados e testados (cada um responde a invocação)
- [ ] Templates funcionais (criar uma sprint dummy de teste)
- [ ] Bootstrap script roda em < 2s e produz output < 5k tokens
- [ ] Documentado em `docs/HARNESS-RUNBOOK.md` (novo) como usar

---

## ✅ FASE 0b — Sub-AGENTS, skills, slash commands, hooks — CONCLUÍDA

**Status**: COMPLETA em 2026-05-19. Branch `feat/redesign-foundation-tooling`. 37 items entregues em 4 waves (validator agent PASS em cada wave). Ver [docs/specs/0b-foundation-tooling/EVALUATION.md](../specs/0b-foundation-tooling/EVALUATION.md) (`verdict: pass`) e [PROGRESS.md](../specs/0b-foundation-tooling/PROGRESS.md).

**Objetivo**: completar a camada de tooling IA-coded com Sub-AGENTS por área + automações.

**Pré-requisitos**:
- ✅ Fase 0a completa (mergeada em 2026-05-19)

**Estimativa**: 3-5 dias

### Tasks

#### Sub-AGENTS.md por área

- [ ] **`src/AGENTS.md`** — atualizar com novos padrões (React 19, Tailwind v4, i18n 3 línguas, primitives novos)
- [ ] **`functions/AGENTS.md`** (criar) — Functions v2 conventions (idempotência, logger, rate limit, defineSecret)
- [ ] **`packages/shared/AGENTS.md`** (criar) — schemas Zod source of truth, padrão `z.infer`, sem `interface` separado

#### Atualizar AGENTS.md + CLAUDE.md root

- [ ] **`AGENTS.md`** — adicionar stack table (Tailwind v4, SF Pro, Anthropic + DeepSeek, Playwright PDF) + princípios 1-16
- [ ] **`CLAUDE.md`** — atualizar quick references (links pra `redesign/`, `research/`, `specs/`)

#### Skills novas em `.claude/skills/`

- [ ] **`redesign-screen`** — workflow refactor tela DS-1
- [ ] **`new-zod-schema`** — schema novo com test (template)
- [ ] **`new-report-business-type`** — adicionar tipo em FLOW-3
- [ ] **`verify-i18n`** — validar 3 idiomas em diff
- [ ] **`validate-llm-call`** — validar callable LLM contra INF-1
- [ ] **`negotiate-contract`** — workflow contract Implementer↔Validator
- [ ] **`bootstrap-fresh-session`** — invoca bootstrap script + sintetiza estado

#### Slash commands em `.claude/commands/`

Workflow harness:
- [ ] **`/new-sprint <name>`** — cria `docs/specs/{id}-{name}/` com 4 templates
- [ ] **`/research-sprint <id>`** — spawna Researchers paralelos
- [ ] **`/plan-sprint <id>`** — Planner + Checker loop
- [ ] **`/negotiate-contract <id>`** — Implementer + Validator alinham scope
- [ ] **`/execute-sprint <id>`** — Orchestrator dispara Executors em waves
- [ ] **`/validate-sprint <id>`** — Validator em processo separado
- [ ] **`/ship-sprint <id>`** — PR + docs update + memory update
- [ ] **`/update-progress`** — append em PROGRESS.md da sprint atual

Workflow domínio:
- [ ] **`/new-screen-redesign <name>`** — refactor tela DS-1
- [ ] **`/check-i18n`** — validar 3 idiomas em diff
- [ ] **`/check-no-hardcoded`** — detectar literals hardcoded
- [ ] **`/new-ai-prompt-version <name>`** — versionar prompt INF-1
- [ ] **`/run-research <topic>`** — Context7 + WebSearch

#### Hooks PreToolUse novos em `scripts/hooks/` (referenciados em `.claude/settings.json`)

Sensors computacionais bloqueantes:
- [ ] **`check-no-hardcoded-literal.sh`** — bloqueia strings em JSX/TSX (força i18n)
- [ ] **`check-zod-schema-test.sh`** — bloqueia commit schema sem test
- [ ] **`check-llm-call-via-logger.sh`** — bloqueia chamada LLM sem `logger.info` estruturado
- [ ] **`check-firestore-rule-defaults-deny.sh`** — bloqueia rule sem default deny
- [ ] **`check-contract-exists.sh`** — bloqueia `Edit/Write` em sprint sem `CONTRACT.md`
- [ ] **`check-progress-updated.sh`** — bloqueia commit sem update em `PROGRESS.md`
- [ ] **`check-sensors-passed.sh`** — bloqueia PR sem score binário positivo
- [ ] **`check-implementer-not-validator.sh`** — bloqueia mesmo agente fazer Edit e Validate

Existentes (manter, validar funcionam):
- [x] `check-no-secret-in-env-example.sh`
- [x] `check-no-process-env-secret.sh`
- [x] `check-no-client-wallet-write.sh`
- [x] `check-rules-tested.sh`

### Critério de aceite

- [ ] 3 sub-AGENTS.md criados/atualizados
- [ ] 7 skills novas em `.claude/skills/`
- [ ] 13 slash commands novos em `.claude/commands/`
- [ ] 8 hooks PreToolUse novos em `scripts/hooks/`
- [ ] `.claude/settings.json` referencia todos os hooks
- [ ] Teste smoke: criar uma "sprint dummy" e percorrer `/new-sprint → /plan-sprint → /negotiate-contract` (sem executar)

---

## ✅ FASE 0c — Memória cleanup + criação — CONCLUÍDA

**Status**: COMPLETA em 2026-05-19. Branch `feat/redesign-foundation-memory`. 16 items entregues em 3 waves (validator agent PASS em cada wave). Memórias vivem em `~/.claude/projects/.../memory/` (state local, fora do repo) — PR contém só artifacts da sprint + CHANGES + EXECUTION-CHECKLIST update. Ver [docs/specs/0c-foundation-memory/EVALUATION.md](../specs/0c-foundation-memory/EVALUATION.md) (`verdict: pass`).

**Objetivo**: limpar memória IA poluída + criar novas memórias com decisões deste roadmap.

**Pré-requisitos**:
- ✅ Fase -2 completa

**Estimativa**: 1 dia

### Tasks

#### Deletar
- [ ] `.claude/projects/.../memory/suitpay_deprecated.md`

#### Atualizar
- [ ] `firebase_secrets.md` — adicionar `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` (não criar nos secrets reais ainda — só documentar)
- [ ] `admin_overhaul_roadmap.md` — cross-link com este roadmap
- [ ] `MEMORY.md` (índice) — remover linha SuitPay + adicionar linhas novas

#### Criar
- [ ] `llm_combo_strategy.md` — Anthropic + DeepSeek, roteamento por tarefa
- [ ] `report_flow_v2.md` — novo fluxo 6 passos
- [ ] `credits_system.md` — 1 crédito = R$5, 1 plataforma = 1 crédito
- [ ] `share_link_pattern.md` — UUID v4 + Firestore public + snapshot
- [ ] `playwright_pdf.md` — Playwright em CF para Export PDF
- [ ] `oauth_mfa_google.md` — Google Ads MFA mudança 21/abr/2026
- [ ] `i18n_three_langs.md` — toda string em pt-BR/en/es
- [ ] `harness_pattern.md` — workflow harness end-to-end
- [ ] `progress_files_discipline.md` — sempre update PROGRESS.md antes de compact
- [ ] `multi_process_agents.md` — Implementer ≠ Validator (permissions separadas)

### Critério de aceite

- [ ] `MEMORY.md` reflete o novo estado
- [ ] Zero referência a "Asaas" ou "SuitPay" em qualquer memória
- [ ] Cada memória nova segue padrão do projeto (frontmatter + body + reason)

---

## 🟡 FASE 0d — ADRs publicados

**Objetivo**: registrar decisões arquiteturais críticas em `docs/Decisions.md`.

**Pré-requisitos**:
- ⏳ Fase 0a completa (Harness ADRs precisam de implementation refs)

**Estimativa**: 1 dia

### Tasks

#### ADRs de domínio
- [ ] **ADR-NNN** Render in-app substitui Google Data Studio
- [ ] **ADR-NNN** Sistema de Créditos (1 cr = R$5, 1 plataforma = 1 cr, sem subscription inicial)
- [ ] **ADR-NNN** LLM combo Anthropic + DeepSeek com roteamento por tarefa
- [ ] **ADR-NNN** Share-link público via UUID v4 + snapshot em subcoleção
- [ ] **ADR-NNN** Playwright em Cloud Function para Export PDF
- [ ] **ADR-NNN** Tailwind v4 + Apple SF Pro como design system

#### ADRs de Harness Engineering
- [ ] **ADR-NNN** Adotar Harness Engineering (Fowler taxonomy)
- [ ] **ADR-NNN** Multi-process agents (Implementer ≠ Validator)
- [ ] **ADR-NNN** Contracts negotiation antes da execução
- [ ] **ADR-NNN** Progress files + Bootstrap script (memory entre sessions)
- [ ] **ADR-NNN** Sensor enforcement via hooks bloqueantes (score binário)
- [ ] **ADR-NNN** Estrutura de specs por sprint

### Critério de aceite

- [ ] 12 ADRs publicados em `docs/Decisions.md`
- [ ] Cada ADR: Context · Decision · Consequences · Status
- [ ] Cross-linked com `docs/research/*.md` correspondentes

---

## 🟢 FASE 0.5 — Cleanup textual (Asaas, SuitPay, Data Studio)

**Objetivo**: remover menções legacy em comentários, docs e código (sem implementar nada novo).

**Pré-requisitos**:
- ⏳ Fase 0d completa (ADRs publicados primeiro)

**Estimativa**: 2-3 dias

### Tasks

#### Asaas — remover menções (não há código ativo)
- [ ] `functions/src/index.ts` — comentário linha 50 ("Asaas migration pendente")
- [ ] `functions/src/getDashboardMetrics.ts` — comentário linha 197
- [ ] `src/components/ui/AddCreditsModal.tsx` — comentário sobre Asaas
- [ ] `packages/shared/src/schemas/transaction.ts` — comentário sobre Asaas
- [ ] `docs/Integrations.md` — remover seção Asaas
- [ ] `docs/PAYMENTS.md` — refactor (mencionar Stripe como FUTURE §8)
- [ ] `docs/API-CONTRACTS.md` — remover linhas Asaas (já será refatorado em Fase -1)
- [ ] `docs/DATA-MODEL.md` — remover linhas Asaas (já será refatorado em Fase -1)
- [ ] `docs/DOMAIN.md` — atualizar
- [ ] `docs/SECURITY.md` — atualizar
- [ ] `docs/CHANGES.md` — adicionar entrada datada
- [ ] `docs/REFACTOR-PLAN.md` — atualizar
- [ ] `docs/FIREBASE-CONVENTIONS.md` — atualizar
- [ ] `docs/index.md` — atualizar
- [ ] `docs/Decisions.md` — ADR-021 referência atualizada (apontar para FUTURE-IDEAS §8)
- [ ] Grep final: `grep -rn "asaas\|Asaas" --include="*.{ts,tsx,md,json}"` → zero ocorrências esperadas

#### SuitPay — cleanup completo
- [ ] `packages/shared/src/schemas/transaction.ts` — remover campos `payerName`, `payerCpf` (já em Fase -1)
- [ ] `docs/Decisions.md` — ADR-021 mantido mas refletindo decisão atual
- [ ] Grep final: `grep -rn "suitpay\|SuitPay" --include="*.{ts,tsx,md,json}"` → zero ocorrências esperadas

#### Google Data Studio / Looker — remoção total
- [ ] `src/config/lookerStudioTemplates.ts` — **deletar arquivo**
- [ ] `src/pages/ReportSuccessPage.tsx` — refactor (deixará de usar Looker)
- [ ] `src/pages/HomePage.tsx` — qualquer menção
- [ ] `packages/shared/src/schemas/report.ts` — remover `lookerStudioUrl` (já em Fase -1)
- [ ] `packages/shared/src/schemas/report.test.ts` — atualizar tests
- [ ] `src/AGENTS.md` — atualizar
- [ ] `docs/Integrations.md` — remover Looker section
- [ ] `docs/QA-CHECKLIST.md` — atualizar
- [ ] `docs/REFACTOR-PLAN.md` — atualizar
- [ ] `docs/DOMAIN.md` — atualizar
- [ ] `docs/DATA-MODEL.md` — atualizar
- [ ] `docs/Decisions.md` — ADR de cleanup
- [ ] `docs/CHANGES.md` — adicionar entrada
- [ ] `docs/changelog/2026-Q1.md` — atualizar
- [ ] Grep final: `grep -rn "looker\|datastudio\|data.studio\|lookerStudio" --include="*.{ts,tsx,md,json}"` → zero ocorrências esperadas

#### MetaReviewDemo — dev-only flag
- [ ] `src/App.tsx` — envolver Route em `{import.meta.env.MODE === 'development' && ...}`
- [ ] Verificar comportamento em build de produção (rota retorna 404)

### Critério de aceite

- [ ] Zero referências a Asaas / SuitPay / Looker / Data Studio no codebase
- [ ] `docs/CHANGES.md` documenta remoção datada
- [ ] Build de produção não tem rota `/meta-review-demo`
- [ ] Memória `suitpay_deprecated.md` deletada (já em Fase 0c)
- [ ] `bun run test:all` passa

---

## 🔴 FASE 1 — Design System

**Objetivo**: trocar fundação visual (Tailwind v3 → v4 + Montserrat → SF Pro + tokens semânticos completos).

**Pré-requisitos**:
- ⏳ Fase 0d completa (ADRs Tailwind v4 + SF Pro publicados)

**Estimativa**: 3-5 dias

**Referência**: [docs/research/03-frontend-stack.md](../research/03-frontend-stack.md)

### Tasks

#### Migração Tailwind v3 → v4

- [ ] Rodar `npx @tailwindcss/upgrade@latest` (ferramenta oficial)
- [ ] Trocar PostCSS plugin → `@tailwindcss/vite` em `vite.config.ts`
- [ ] Remover `@tailwind base/components/utilities` → `@import "tailwindcss"`
- [ ] Migrar `tailwind.config.js` → `@theme` directive em `src/index.css`
- [ ] Audit visual: borders default mudam para `currentColor` — fix onde dependia de `gray-200`
- [ ] Atualizar utility renames: `bg-gradient-to-*` → `bg-linear-to-*`
- [ ] Verificar browser support: Safari 16.4+, Chrome 111+, Firefox 128+

#### Tipografia SF Pro

- [ ] Remover `@fontsource/montserrat/*` de `src/styles/fonts.css`
- [ ] Remover `package.json` dep `@fontsource/montserrat`
- [ ] Adicionar `--font-display` + `--font-mono` no `@theme` (CSS-first)
- [ ] Atualizar `body` em `src/index.css` para nova stack
- [ ] Adicionar utilitários `.t-display / .t-h1 / .t-h2 / .t-h3 / .t-body / .t-small / .t-micro`

#### Tokens semânticos completos

- [ ] Expandir `src/index.css` com tokens do bundle:
  - `--bg`, `--bg-elev`, `--bg-elev-2`, `--bg-inset`, `--scrim`
  - `--text`, `--text-2`, `--text-3`, `--text-on-accent`
  - `--border`, `--border-strong`, `--separator`
  - `--accent`, `--accent-hover`, `--accent-fg`, `--quiet-hover`, `--quiet-press`
  - `--success` (ciano #5EEAD4 só dark), `--warning`, `--danger` (cada um com `-bg`)
  - `--chart-1..4`
  - `--shadow-1..3`
  - `--r-xs..r-pill`
- [ ] Dark mode com pretos tonais (#0A0A0B → #1C1C20) + ciano restrito a data viz

#### Primitives novos em `src/components/ui/`

- [ ] **`Field`** — label flutuante + leading icon com respiro (não grudado)
- [ ] **`Badge`** — variants neutral/success/warning/danger/ink
- [ ] **`Chip`** — selecionável + ícone
- [ ] **`Segmented`** — tabs/segmented control
- [ ] **`Toggle`** — switch iOS-style
- [ ] **`Avatar`** — initials/image + sizes
- [ ] **`Select`** — com leading icon
- [ ] **`SectionHead`** — title + subtitle + action
- [ ] **`ListRow`** — leading + title + subtitle + trailing + chevron

#### Data viz em `src/components/data-viz/` (criar pasta)

- [ ] **`Sparkline`** — linha mini para KPIs
- [ ] **`Donut`** — segmentos + center text
- [ ] **`DonutHero`** — destaque grande
- [ ] **`MiniBars`** — barras mini
- [ ] **`AreaChart`** — chart de área
- [ ] **`BarChart`** — chart de barras
- [ ] **`StatCard`** — KPI completo (label + value + delta + sparkline + icon)

#### Animações

- [ ] Spring transition tokens (`cubic-bezier(.2,.9,.3,1.2)`, 250ms)
- [ ] Utility `.tap` (transform scale 0.97 ativo)
- [ ] Hairlines Apple-style (0.5px @2x)

#### Showcase / Storybook

- [ ] Rota dev-only `/design-system` em `App.tsx` (guarded por `import.meta.env.MODE === 'development'`)
- [ ] Lista todos primitives + tokens + tipografia + data viz em 2 temas

### Critério de aceite

- [ ] Build de produção funciona com Tailwind v4
- [ ] `/design-system` mostra todos primitives nos 2 temas
- [ ] Zero regressão visual em telas existentes (smoke test)
- [ ] `bun run test` passa
- [ ] Bundle size diminuiu (~200KB sem Montserrat)

---

## 🟡 FASE 2 — Layout global

**Objetivo**: trocar shell de navegação sem mexer no conteúdo das páginas.

**Pré-requisitos**:
- ⏳ Fase 1 completa

**Estimativa**: 2-3 dias

### Tasks

- [ ] **`BottomNavigation.tsx`** — 5 abas (Início · Relatórios · `[+]` central · Templates · Mais) + botão `+` elevado
- [ ] **`Sidebar.tsx`** — minimal Apple-style + ícones + atalhos para rotas atuais (sem `em breve`)
- [ ] **`MobileHeader.tsx` / `Header.tsx`** — TopBar com pill de créditos + sparkle + avatar
- [ ] **`MainLayout.tsx`** — ajustar grid 1280 desktop / mobile sticky
- [ ] Menu "Mais" — listar rotas do roadmap atual (sem Premium, sem AI Hub — ficam para FUTURE)

### Critério de aceite

- [ ] Smoke test: navegar entre todas as páginas atuais — não quebra
- [ ] Mobile + desktop layouts funcionam
- [ ] Bottom nav `[+]` central abre o novo fluxo (placeholder por enquanto)

---

## 🟡 FASE 3 — Refactor tela a tela (UI puro)

**Objetivo**: refatorar telas CORE existentes com novo design (preserva funcionalidade).

**Pré-requisitos**:
- ⏳ Fase 2 completa
- ⏳ GATE-DASHBOARD fechado antes de REF-2

**Estimativa**: 10-15 dias (1 PR por tela)

### Tasks (1 PR por item, ordem do mais simples ao mais complexo)

- [ ] **REF-1.1** LoginPage — visual Apple-style
- [ ] **REF-1.2** ForgotPasswordPage — visual Apple-style
- [ ] **REF-7** TransactionsPage → "Créditos" (renomear + tabela em créditos + tabs Todos/Entradas/Saídas + CTA stub)
- [ ] **REF-3** ReportsPage (lista populada + empty state Apple)
- [ ] **REF-4** TemplatesPage → "Tipos de Negócio" (cards verticais com LaptopMock SVG)
- [ ] **REF-6** AccountsPage (visual Apple, **remover "em breve"** Instagram/TikTok/LinkedIn)
- [ ] **REF-8** SettingsPage (sub-nav lateral desktop + 4 seções)
- [ ] **REF-2** Dashboard (após GATE-DASHBOARD fechado) — relatórios + integrações apenas
- [ ] **REF-9** ReportSuccessPage → redireciona para `/reports/:id` (placeholder, render real é Fase 3.5)
- [ ] **MOD-1** AddCreditsModal — visual refactor + mensagem "Em breve · Stripe sendo integrado"

### Critério de aceite por PR

- [ ] Tela renderiza nos 2 temas (light + dark)
- [ ] OAuth + geração de relatório seguem funcionando (smoke manual)
- [ ] Testes unitários verdes
- [ ] Screenshots no PR
- [ ] i18n: todas strings nas 3 línguas (pt-BR/en/es)
- [ ] Sem hardcoded literals em JSX/TSX

---

## 🔴 FASE 3.5 — Novo fluxo de relatório (6 passos)

**Objetivo**: refactor profundo do fluxo de geração — substitui Data Studio por render in-app.

**Pré-requisitos**:
- ⏳ Fase 3 completa (telas auxiliares já refatoradas)
- ⏳ GATE-REPORT-STRUCTURE fechado (métricas por tipo de negócio definidas colaborativamente)
- ⏳ GATE-REFRESH fechado (intervalos auto + cooldown manual)
- ⏳ Schemas LLM + callables `analyzeReportData` implementados

**Estimativa**: 10-15 dias (a fase mais complexa)

### Tasks

#### Backend (callables novos)

- [ ] **`createReport`** — substitui `addDoc('reports')` cliente · valida + debita + dispara LLM
- [ ] **`refreshReport`** — manual com cooldown (rate limit)
- [ ] **`getAvailableDataPeriods`** — para FLOW-2 (detecção automática períodos)
- [ ] **`analyzeReportData`** — LLM combo Anthropic + DeepSeek (INF-1)
- [ ] **`exportReportPDF`** — Playwright em CF (INF-3)
- [ ] **`refreshActiveReports`** — `onSchedule` para auto-refresh (INF-2)
- [ ] **`createReportShare`** — gerar UUID v4 + snapshot
- [ ] **`revokeReportShare`**
- [ ] **`listReportShares`**
- [ ] **`recordShareView`** — rate-limited

#### Frontend (telas + rotas novas)

- [ ] **FLOW-1** `/generate-report/platform` — Passo 1 (seleção plataforma, bloqueio se sem conta conectada)
- [ ] **FLOW-2** `/generate-report/data` — Passo 2 (conta + campanhas + período auto-detectado)
- [ ] **FLOW-3** `/generate-report/type` — Passo 3 (tipo de negócio, 7 opções iniciais)
- [ ] **FLOW-4** `/generate-report/summary` — Passo 4 (resumo + sidebar pegajosa com custo)
- [ ] **FLOW-5** `/generate-report/generating` — Passo 5 (ring 180px + 5 estágios sequenciais)
- [ ] **FLOW-6** `/reports/:id` — Report Detail com tabs por plataforma + ações (Share/PDF/Atualizar)

#### Share-link (SHARE-1/2/3)

- [ ] **SHARE-1** UI de configuração de visibilidade dentro de Report Detail (toggles por seção + métrica)
- [ ] **SHARE-2** Botão "Compartilhar via link" → callable `createReportShare` + copy URL
- [ ] **SHARE-3** Rota pública `/r/:shareId` (sem auth, brand AdSmart no rodapé)
- [ ] **Open Graph** via Hosting rewrites + Cloud Function `renderShareOG` (crawler detection)
- [ ] **App Check** habilitado para reads Firestore do client

#### Wizard state persistence

- [ ] `sessionStorage` para estado do wizard (não localStorage)
- [ ] Resume após OAuth redirect via `?resume=true&step=2`
- [ ] Validation: expira em 30min, reset se sessionStorage vazio

#### Firestore Rules

- [ ] `users/{uid}/reports/{id}` — `get/list` só dono; `create/update/delete` só via callable
- [ ] `users/{uid}/reports/{id}/platforms/{platform}` — idem
- [ ] `publicReportShares/{shareId}` — `get: if !revoked`, `list: false`, writes só via callable
- [ ] `processedRequests/{id}` — só backend escreve

#### Cleanup do antigo fluxo

- [ ] Deletar `src/config/lookerStudioTemplates.ts` (já em Fase 0.5)
- [ ] Refactor `GenerateReportPage.tsx` (existente) — redirect para `/generate-report/platform`
- [ ] Refactor `ReportSuccessPage.tsx` — redirect para `/reports/:id`

### Critério de aceite

- [ ] Fluxo end-to-end funciona: seleção plataforma → conta → período → tipo → resumo → gerando → relatório → share-link
- [ ] LLM gera relatório com métricas adequadas ao tipo de negócio (validado contra GATE-REPORT-STRUCTURE)
- [ ] Share-link público funciona (acessível sem auth, mostra apenas métricas selecionadas)
- [ ] Export PDF funciona (Playwright em CF)
- [ ] Refresh manual funciona com cooldown
- [ ] Refresh automático funciona via scheduled function
- [ ] Zero referência a Looker no código

---

## 🔴 FASE 4 — Validação funcional end-to-end

**Objetivo**: certificar que tudo o que existe + novo continua funcionando.

**Pré-requisitos**:
- ⏳ Fase 3.5 completa

**Estimativa**: 3-5 dias

### Tasks

#### VAL-1 — OAuth Google Ads + Meta Ads

- [ ] Signup → conectar Google Ads → primeira vez (testar MFA após 21/abr/2026)
- [ ] Reconectar conta expirada (reauth)
- [ ] Disconnect → reconectar com manager account diferente
- [ ] Selection flow múltiplos manager accounts (Google)
- [ ] Erro: usuário nega permissão → mensagem clara
- [ ] Erro: redirect_uri inválido → log + mensagem
- [ ] Verificar SDK Google Ads API ≥ v23
- [ ] Mensagens de erro mencionando MFA quando aplicável
- [ ] Signup → conectar Meta → seleção de Business → Ad Account
- [ ] Verificar token type (User vs System User)
- [ ] Refresh proativo antes de expirar (Cloud Function agendada)
- [ ] Disconnect → revoke via Meta API (não só local)
- [ ] Erro: app sem business verification → tratativa
- [ ] Verificar SDK Meta Marketing API ≥ v23

#### VAL-2 — Fluxo end-to-end de geração de relatório

- [ ] Login → selecionar plataforma(s) → conectar conta (se preciso) → escolher campanhas → período com dados → tipo de negócio → confirmar → gerar → ver relatório → compartilhar link → ver página pública → export PDF → atualizar dados manualmente

#### VAL-3 — Wallet/transactions

- [ ] Admin adiciona créditos via `addUserCredits` → saldo atualiza em tempo real
- [ ] Saldo atualizado em tempo real (onSnapshot)
- [ ] Histórico de transações correto
- [ ] Crédito debitado ao gerar relatório (1 por plataforma)

#### VAL-4 — Lista de relatórios + Dashboard

- [ ] Relatório gerado aparece em `/reports`
- [ ] Aparece no Dashboard
- [ ] Integrações aparecem no Dashboard
- [ ] Click em relatório navega para `/reports/:id`

#### Smoke tests adicionais

- [ ] Login funciona
- [ ] Logout funciona
- [ ] Tema light/dark toggle funciona
- [ ] i18n: trocar idioma em Settings reflete em todas strings
- [ ] Sem console errors em prod build
- [ ] `bun run test:all` passa
- [ ] `bun run build` passa
- [ ] Firestore Rules testadas via `/firestore-rules-test`

### Critério de aceite

- [ ] Todos os 4 VALs verdes
- [ ] Smoke tests verdes
- [ ] Zero regressão funcional comparado ao estado atual
- [ ] Documentação `docs/QA-CHECKLIST.md` atualizada com novo checklist

---

## 📚 Recursos / Documentos de referência

### Roadmap & specs
- [FEATURES-INVENTORY.md](./FEATURES-INVENTORY.md) — fonte da verdade do roadmap (43 itens, 12 categorias)
- [CURRENT-STATE-AUDIT.md](./CURRENT-STATE-AUDIT.md) — estado atual do projeto
- [FUTURE-IDEAS.md](./FUTURE-IDEAS.md) — features postponed (9 áreas)

### Research (Fase -2)
- [research/README.md](../research/README.md) — índice
- [research/01-firebase-stack.md](../research/01-firebase-stack.md) — Functions v2 + Firestore + Rules
- [research/02-llm-strategy.md](../research/02-llm-strategy.md) — Anthropic + DeepSeek combo
- [research/03-frontend-stack.md](../research/03-frontend-stack.md) — React 19 + Tailwind v4 + SF Pro + Zod
- [research/04-share-link-patterns.md](../research/04-share-link-patterns.md) — Public Firestore reads
- [research/05-pdf-generation.md](../research/05-pdf-generation.md) — Playwright em CF
- [research/06-oauth-platforms.md](../research/06-oauth-platforms.md) — Google Ads MFA + Meta v23
- [research/07-spec-driven-development.md](../research/07-spec-driven-development.md) — SDD patterns
- [research/08-stripe-future.md](../research/08-stripe-future.md) — Stripe Pix BR (FUTURE §8)
- [research/09-harness-engineering.md](../research/09-harness-engineering.md) — Multi-agent + contracts + progress files

### Bundle Claude Design
- [bundle/project-adsmart/](./bundle/project-adsmart/) — protótipo extraído (37 arquivos)

---

## 🗺️ Glossário rápido

- **Harness** — todo o ambiente em volta do modelo (LLM) que dá controle (guides + sensors + memory)
- **Guide** — controle feedforward (antes da execução): AGENTS.md, schemas, specs
- **Sensor** — controle feedback (depois da execução): linter, test, validator
- **Computational** — sensor determinístico (lint, test, type-check)
- **Inferential** — sensor LLM-based (review agent, semantic check)
- **Contract** — acordo Implementer↔Validator antes da execução
- **Sprint** — unidade de trabalho com SPEC + CONTRACT + PROGRESS + EVALUATION
- **Wave** — grupo de tasks paralelas (sem dependências entre si) dentro de uma sprint
- **Score binário** — passou (1) ou não passou (0); sem "tá bom o suficiente"
- **Multi-process** — Implementer e Validator em subagents/sessions separados com missões isoladas

---

## 🎯 Tempo total estimado

| Fase | Estimativa |
|---|---|
| Fase -1 | 5-7 dias |
| Fase 0a + 0b + 0c + 0d | 8-12 dias |
| Fase 0.5 | 2-3 dias |
| Fase 1 | 3-5 dias |
| Fase 2 | 2-3 dias |
| Fase 3 | 10-15 dias |
| Fase 3.5 | 10-15 dias |
| Fase 4 | 3-5 dias |
| **TOTAL** | **43-65 dias** (~9-13 semanas full-time) |

> Estimativa assume desenvolvimento via Claude Code + workflow harness completo. Tempo escalável conforme número de workflows paralelos.

---

## ✅ Como usar este checklist

1. **Acompanhar progresso**: marque cada checkbox conforme task completa
2. **Iniciar nova fase**: verificar pré-requisitos da fase
3. **Atualizar status**: alterar coluna "Status" no topo
4. **Em caso de blocker**: registrar em `docs/specs/{sprint}/PROGRESS.md`
5. **Mudança de escopo**: atualizar FEATURES-INVENTORY.md primeiro, depois este checklist
