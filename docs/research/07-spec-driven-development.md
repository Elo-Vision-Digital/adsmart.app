# Research — Spec-Driven Development (Harness IA-coded moderno)

**Validado em**: 2026-05-19
**Fontes**: WebSearch — SDD com AI agents 2026, GitHub Spec Kit, AWS Kiro, CLAUDE.md patterns
**Aplicação**: Fase 0  (harness/docs/skills/agents/hooks)

---

## 1. Conceito validado (2026)

> **"The spec is the prompt"** — frase recorrente nos guias 2026 de SDD com AI agents.

**Definição operacional**: Spec-Driven Development é uma metodologia onde **especificações versionadas e estruturadas — não código — são source of truth**, e o código é gerado/mantido contra essas specs por humanos + AI agents.

### O que o projeto AdSmart já tem (parcialmente SDD)
- [AGENTS.md](AGENTS.md) — convenções gerais
- [CLAUDE.md](CLAUDE.md) — guidance Claude-specific
- [docs/Decisions.md](docs/Decisions.md) — ADRs (decisions versionadas)
- Skills em `.claude/skills/`
- Hooks em `.claude/settings.json`
- Memória em `.claude/projects/.../memory/`

**Veredito**: já temos os ossos de SDD. Precisa expandir + estruturar melhor para suportar features novas sem alucinação.

---

## 2. 6 elementos canônicos de uma boa spec (consenso 2026)

Toda spec moderna define:

1. **Outcomes** — o que o usuário/sistema vai conseguir fazer ao final
2. **Scope boundaries** — o que ENTRA e o que NÃO ENTRA (explícito)
3. **Constraints** — limites técnicos, de negócio, de tempo
4. **Prior decisions** — ADRs ou contexto que já está decidido (link para Decisions.md)
5. **Task breakdown** — decomposição em sub-tarefas executáveis
6. **Verification criteria** — como saber que tá pronto (testes, smoke checks, métricas)

### Aplicação  AdSmart
- Cada **fase**  = uma spec
- Cada **feature** dentro de uma fase = sub-spec (em `docs/specs/{fase}/{feature}.md`)
- Cada **callable novo** = mini-spec antes de implementar
- Verification = `docs/QA-CHECKLIST.md` + testes Vitest + smoke manual

---

## 3. Patterns multi-agent (2026)

### Padrão Coordinator + Implementor + Verifier
GitHub Spec Kit + AWS Kiro + Claude Code convergem para este padrão:

- **Coordinator** (orchestrator): lê a spec, divide em tasks, dispara sub-agents
- **Implementor**: executa uma task isolada (escreve código)
- **Verifier**: revisa o output do Implementor contra a spec

### Já temos no projeto
- `feature-dev:code-architect` (Coordinator analog)
- `feature-dev:code-explorer` (research)
- `feature-dev:code-reviewer` (Verifier analog)
- `feature-dev:feature-dev` (orchestrator full flow)

**Recomendação**: manter estrutura atual + adicionar sub-agents específicos para domínios novos:
- `ai-feature-implementer` — futuro AI Hub (FUTURE §2)
- `payment-stripe-implementer` — futuro Stripe (FUTURE §8)
- `share-link-implementer` — share-link público (SHARE-* )

---

## 4. Resultados mensuráveis (GitHub Spec Kit)

> "GitHub reports that teams using Spec Kit on internal projects ship features with **roughly an order-of-magnitude fewer 'regenerate from scratch' cycles** than ad-hoc prompting."

**Tradução prática**: investir em specs detalhadas **antes** do código compensa 10× em retrabalho evitado. Isso justifica a Fase 0  (atualizar harness/docs antes de qualquer código de produto).

---

## 5. Recomendações concretas para Fase 0 

### 5.1 Estrutura de docs a criar/atualizar

```
docs/
├── AGENTS.md (root)              — atualizar com nova stack table
├── CLAUDE.md                     — atualizar com novas conventions
├── API-CONTRACTS.md              — refactor completo (lista todas callables + signatures)
├── DATA-MODEL.md                 — refactor completo (Firestore tree atualizada)
├── DOMAIN.md                     — refactor completo (créditos, relatórios, share-link)
├── ARCHITECTURE.md (criar)       — visão high-level + diagramas
├── Decisions.md                  — atualizar com ADRs novos 
├── SECURITY.md                   — atualizar com padrões share-link público
├── TESTING.md (refresh)          — patterns Vitest + Firestore rules tests
├── DEPLOYMENT.md (refresh)       — patterns Cloud Functions v2 deploy
├── QA-CHECKLIST.md               — refresh com VAL-1 a VAL-4
├── INTEGRATIONS.md (cleanup)     — remover Asaas/SuitPay, mencionar Stripe como FUTURE
├── PAYMENTS.md                   — refactor: créditos + Stripe FUTURE
├── i18n.md (criar)               — convenções de tradução
├── specs/
│   ├── 0-foundation.md           — Fase 0 spec
│   ├── 1-design-system.md        — Fase 1 spec
│   ├── 2-layout.md               — Fase 2 spec
│   ├── 3-refactor-screens.md     — Fase 3 spec
│   ├── 3.5-new-report-flow.md    — Fase 3.5 spec (a maior)
│   └── 4-validation.md           — Fase 4 spec
├── research/                     — saída desta sessão (8 docs)
└── /
    ├── 
    ├── 
    └── 
```

### 5.2 Sub-AGENTS.md por área

```
src/AGENTS.md                     — frontend conventions específicas
functions/AGENTS.md (criar)       — backend Functions v2 conventions
packages/shared/AGENTS.md (criar) — schemas + types source of truth
```

Cada sub-AGENTS.md herda do root + adiciona regras locais (paths, padrões, tools específicas).

### 5.3 Skills novas (.claude/skills/)

Existentes: `firebase-deploy-recovery`, `dev-environment-diagnose`, `firebase-deploy`, `firestore-rules-test`, `firestore-new-query`, `functions-new-callable`.

Adicionar:
- `-screen` — workflow para refatorar uma tela (DS-1 tokens + visual Apple)
- `new-zod-schema` — criar schema novo em `packages/shared/src/schemas/` com test
- `new-report-business-type` — adicionar novo tipo de negócio em FLOW-3 (quando precisar)
- `verify-i18n` — checar que strings novas estão nos 3 idiomas
- `validate-llm-call` — validar que callable nova com LLM segue patterns do INF-1

### 5.4 Slash commands novos

Existentes: `/functions-new-callable`, `/firestore-new-query`, `/firestore-rules-test`, `/firebase-deploy`.

Adicionar:
- `/new-screen- <name>` — refactor de uma tela existente seguindo DS-1
- `/check-i18n` — validar i18n completo (3 idiomas) em diff
- `/check-no-hardcoded` — detectar literals hardcoded
- `/new-ai-prompt-version <name>` — versionar novo prompt do INF-1
- `/run-research <topic>` — disparar pesquisa Context7 + WebSearch num tópico

### 5.5 Hooks PreToolUse novos

Existentes (já efetivos):
- `check-no-secret-in-env-example.sh`
- `check-no-process-env-secret.sh`
- `check-no-client-wallet-write.sh`
- `check-rules-tested.sh`

Adicionar:
- `check-no-hardcoded-literal.sh` — bloqueia strings literais em JSX/TSX (forçar i18n)
- `check-zod-schema-test.sh` — bloqueia commit de schema sem test correspondente
- `check-llm-call-via-logger.sh` — bloqueia chamada LLM sem `logger.info` estruturado
- `check-firestore-rule-defaults-deny.sh` — bloqueia rule nova que abre coleção sem default deny explícito

### 5.6 Atualizar memória (.claude/projects/.../memory/)

**Deletar**:
- `suitpay_deprecated.md` ✓ (já decidido)

**Atualizar**:
- `firebase_secrets.md` — adicionar `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`
- `admin_overhaul_roadmap.md` — referenciar este  (cross-link)

**Criar**:
- `llm_combo_strategy.md` — Anthropic + DeepSeek, roteamento por tarefa (resumo do 02-llm-strategy.md)
- `report_flow_v2.md` — novo fluxo 6 passos (resumo do FLOW-1 a 6)
- `credits_system.md` — 1 crédito = R$5, 1 relatório = 1 crédito por plataforma, sem subscription no inicial
- `share_link_pattern.md` — UUID v4 + Firestore public coleção + snapshot (resumo do 04-share-link-patterns.md)
- `playwright_pdf.md` — Playwright em CF para Export PDF (resumo do 05-pdf-generation.md)
- `oauth_mfa_google.md` — Google Ads MFA mudança 21/abr/2026
- `i18n_three_langs.md` — toda string em pt-BR/en/es

---

## 6. Boas práticas anti-alucinação (consenso 2026)

### Da pesquisa
1. **Specs detalhadas com 6 elementos** acima reduz alucinação
2. **Verifier separado** do Implementor (não mesmo agente que escreveu) — segunda opinião
3. **Schemas Zod como contracts** — output validado antes de aceitar
4. **Testes Vitest determinísticos** — verifier roda + olho humano olha resultado
5. **Hooks deterministas** bloqueando padrões ruins (não dependem do agente)
6. **Memória com 'why' explícito** — agente entende motivo da regra, não só a regra

### Aplicação 
- TODA Fase tem spec própria seguindo 6 elementos
- TODO PR passa por verifier (subagente `pr-review-toolkit:code-reviewer`)
- Schemas Zod source of truth obrigatórios (já é regra — ADR-009)
- Hooks bloqueando padrões críticos (lista acima)
- Memória atualizada após cada decisão importante

---

## 7. Plano da Fase 0

### Sub-fases ordenadas

**0a — Snapshot atual** ✓ (já feito em [](..//))

**0b — Pesquisa** ✓ (esta sessão — 8 docs em `docs/research/`)

**0c — Schemas refactor + criação** (`packages/shared/src/schemas/`)
- Refatorar: `transaction`, `userWallet`, `report`, `productPrice`
- Criar: `businessType`, `publicReportShare`, `aiReportInsight`, `processedRequest`, `llmCall`
- 1 PR por schema (atomic), com tests

**0d — API Contracts doc** (`docs/API-CONTRACTS.md` refactor completo)
- Lista todas callables existentes + novas
- Signature + auth + side-effects de cada
- Marca quais entram em quais fases

**0e — Docs principais** (refactor com cleanup Asaas/SuitPay)
- AGENTS.md, CLAUDE.md, DOMAIN.md, DATA-MODEL.md, INTEGRATIONS.md, PAYMENTS.md, SECURITY.md

**0f — Specs por fase** (`docs/specs/{N}-{name}.md`)
- 1 spec por fase 

**0g — Skills + slash commands + hooks** novos
- Implementar lista da seção 5.3, 5.4, 5.5

**0h — Memória cleanup + criação**
- Lista da seção 5.6

**0i — ADRs novos**
- ADR-NNN Render in-app substitui Data Studio
- ADR-NNN Sistema de créditos (1cr = R$5, 1 relat = 1cr por plataforma)
- ADR-NNN LLM combo Anthropic + DeepSeek roteamento
- ADR-NNN Share-link público via UUID v4 + snapshot

### Critério de aceite da Fase 0
- Toda documentação refletindo decisões deste 
- Todo schema novo criado e testado
- API contract com 100% callables documentadas
- Skills/slash/hooks instalados e testados
- Memory limpa (Asaas/SuitPay out) + atualizada
- ADRs publicados

---

## 8. Sources

- [Spec-Driven Development with AI Coding Agents (Medium, May 2026)](https://medium.com/predict/spec-driven-development-with-ai-coding-agents-the-definitive-guide-453fba1baf39)
- [Spec-Driven Development Definitive 2026 Guide (BCMS)](https://thebcms.com/blog/spec-driven-development)
- [GitHub Spec-Kit](https://www.marktechpost.com/2026/05/08/meet-github-spec-kit-an-open-source-toolkit-for-spec-driven-development-with-ai-coding-agents/)
- [Spec-Driven Development with AI: Complete Guide (2026)](https://prommer.net/en/tech/guides/spec-driven-development/)
- [From Vibe Coding to Spec-Driven Development](https://towardsdatascience.com/from-vibe-coding-to-spec-driven-development/)
