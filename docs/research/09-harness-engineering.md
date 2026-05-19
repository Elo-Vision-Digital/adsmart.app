# Research — Harness Engineering (Próxima fase além de SDD)

**Validado em**: 2026-05-19
**Fontes**: Martin Fowler + Birgitta Boeckeler (ThoughtWorks, abr/2026), Anthropic blog posts (2026), GSD Framework, Claude Agent SDK docs, WebSearch
**Aplicação**: refinamento de toda a Fase 0 (harness IA-coded) — princípios 13-16 + expansão de FOUND-3

---

## 1. Definição canônica (Martin Fowler)

> **"Harness engineering = everything in an AI agent except the model itself."**
>
> **"A system of controls that gives us genuine confidence in what agents produce."**
>
> — Martin Fowler & Birgitta Boeckeler, ThoughtWorks, abril 2026

A taxonomia introduzida por eles em [martinfowler.com/articles/harness-engineering.html](https://martinfowler.com/articles/harness-engineering.html) **já é padrão de indústria em maio/2026**.

---

## 2. Taxonomia: Guides vs Sensors

### Guides (Feedforward — antes da execução)
Restringem e direcionam o agente **antes** dele agir.

| Guide | Propósito |
|---|---|
| AGENTS.md / CLAUDE.md | Convenções, padrões, restrições |
| Bootstrap scripts | Reconstruir contexto em nova sessão |
| Architecture specifications | Estrutura permitida do código |
| Schemas (Zod, OpenAPI) | Contratos de dados |
| Specs versionadas | O que tem que ser feito |
| Skills `.claude/skills/*` | Workflows pré-empacotados |
| Slash commands | Operações canônicas |

### Sensors (Feedback — depois da execução)
Observam e validam o **output** do agente.

| Sensor | Tipo | Quando roda |
|---|---|---|
| Linter (Biome) | Computacional | Pre-commit + CI |
| Type checker (tsc) | Computacional | Pre-commit + CI |
| Test runner (Vitest) | Computacional | Pre-commit + CI |
| Firestore Rules tests | Computacional | Pre-deploy |
| Build verification | Computacional | Pre-PR |
| Code review agent | Inferencial | Pre-merge |
| Architecture fitness tests | Computacional | CI nightly |
| Validator subagent | Inferencial | Pós-implementação, antes do commit |

---

## 3. Controles: Computacionais vs Inferenciais

Fowler distingue:

| Tipo | Velocidade | Confiabilidade | Custo | Usar em |
|---|---|---|---|---|
| **Computacional** | ms–s | Determinístico (0/1) | Quase zero | Toda mudança (loop tight) |
| **Inferencial** | s–min | Não-determinístico (probabilístico) | LLM cost | Seletivamente (caro) |

**Princípio**: nunca confie só em inferencial. Combine:
1. Sensors computacionais correm em TODA mudança (gate barato).
2. Sensors inferenciais correm em pontos críticos (review, security, semantic check).

### O que falha quando harness é fraco (do paper Fowler)

| Categoria | Detecção atual |
|---|---|
| **Estrutural** (duplicação, complexity) | Capturada por sensors computacionais |
| **Semântica** (testes redundantes, brute-force) | Parcialmente capturada por inferencial (caro) |
| **Conceitual** (root cause errado, feature desnecessária, instrução mal interpretada) | **RARAMENTE capturada — exige julgamento humano** |

**Implicação para AdSmart**: ainda precisamos humano no loop nas decisões conceituais. Harness não substitui isso; reduz o ônus em estrutural/semântico para o humano focar em conceitual.

---

## 4. Multi-Agent Pattern (GSD-inspired)

### Arquitetura validada
Framework **GSD (Get Shit Done)** — open-source, 59.6k stars em 4 meses, em produção. Estrutura canônica que serve de referência:

```
Architect / Orchestrator (root)
│
├── PHASE 1: PLAN
│   ├── Researcher subagent × 4 (parallel) — investigam stack, features, architecture, pitfalls
│   └── Planner subagent → cria atomic tasks
│       └── Checker subagent valida plan → loop até passar
│
├── PHASE 2: EXECUTE
│   └── Executor subagent × N (parallel waves baseado em dependency graph)
│       Cada um com 200k tokens fresh context
│
└── PHASE 3: VERIFY
    └── Verifier subagent + Debugger subagent → diagnose + fix plan
```

### Características críticas

1. **Cada subagent = fresh 200k context** — não polui o orchestrator
2. **Subagents isolados** — Implementer não vê histórico do Validator
3. **Waves**: tasks independentes rodam em paralelo; dependentes esperam
4. **State files persistentes** sobrevivem sessions:
   - `PROJECT.md` — visão
   - `REQUIREMENTS.md` — escopo
   - `ROADMAP.md` — onde vai
   - `STATE.md` — onde está agora
   - `CONTEXT.md` — decisões da fase atual

### Por que **processos separados** (não só roles num mesmo processo)

Do vídeo + Anthropic Trends Report 2026:
- Quando agente recebe uma missão (ex: "implementar"), ele faz **tudo** para cumprir — inclusive deletar testes que atrapalham
- Mesmo agente julgando si mesmo: viés inevitável
- **Solução**: missões em processos separados
  - Implementer só tem permissão e contexto para implementar
  - Validator só tem permissão para validar (sem escrever código)
  - Score binário (passou/não passou) — sem "está bom o suficiente"

---

## 5. Contracts entre agentes

### Pattern (do vídeo + arxiv 2026 "Agent Contracts")
1. **Pre-execution**: Implementer recebe spec + cria **lista** do que vai fazer
2. **Negotiation**: Validator olha lista vs spec → confirma alinhamento
3. **Lock**: contrato fica gravado como artefato (`contract.md` em `docs/specs/{sprint}/`)
4. **Execution**: Implementer trabalha contra o contract
5. **Validation**: Validator bate **item-a-item** do contract
6. **Score**: binário por item; falha em qualquer item → loop de correção

### Por que contracts evitam loop infinito
- Validator sem contract começa a sugerir coisas não-pedidas → Implementer entra em scope creep → nunca termina
- Validator COM contract sabe **exatamente** o que validar — nada além disso

### Conservation laws
Do paper [Agent Contracts arxiv 2026](https://arxiv.org/pdf/2601.08815):
- Budgets delegados respeitam constraints do parent
- Hierarchical coordination via contract delegation
- Recursivo: orchestrator → planner → executor → validator

---

## 6. Persistent state — Progress files e Bootstrap

### Padrão atual (Spring AI + agentmemory + MEM)
> "Keep context less than 40%. When approaching threshold, update progress.md, then restart session so next one loads from this file."

### Estrutura mínima recomendada
```
docs/specs/{sprint-name}/
├── SPEC.md         — outcomes, scope, constraints (feedforward)
├── CONTRACT.md     — lista negociada Implementer×Validator
├── PROGRESS.md     — log do que foi feito + estado atual (memory)
└── EVALUATION.md   — output do Validator com score (sensor feedback)
```

### Bootstrap script — `scripts/bootstrap-session.sh`
Quando agente novo começa:
1. Carrega `docs/specs/{current-sprint}/PROGRESS.md` PRIMEIRO
2. Carrega `AGENTS.md` + `CLAUDE.md` (guides)
3. Carrega memory `.claude/projects/.../memory/MEMORY.md`
4. Roda `git status` + `git log -5` para contexto
5. Saída: contexto compacto (< 5k tokens) em vez de o agente descobrir tudo do zero

### Regra crítica
**Sempre atualizar `PROGRESS.md` ANTES de compactar contexto.** A próxima sessão depende disso para não regredir.

---

## 7. Claude Agent SDK — features que viabilizam tudo isso

O projeto AdSmart já usa Claude Code, que **expõe o harness completo via Agent SDK**.

### Subagents (já temos parcialmente)
- Spawnar via `Agent` tool (precisa estar em `allowedTools`)
- Cada subagent: **fresh context window** isolado
- Subagents podem rodar **concorrentes**
- Já temos: `feature-dev:code-architect`, `feature-dev:code-explorer`, `feature-dev:code-reviewer`, `pr-review-toolkit:*`

### Hooks PreToolUse/PostToolUse
- **PreToolUse**: validar/bloquear/transformar/append context **antes** da tool rodar
- **PostToolUse**: logar/run linter **depois** da tool rodar
- Já temos: `check-no-secret-in-env-example.sh`, `check-no-process-env-secret.sh`, `check-no-client-wallet-write.sh`, `check-rules-tested.sh`

### Permissions (`allowedTools`)
- Controla quais tools cada subagent pode usar
- Implementer pode `Edit/Write` mas Validator NÃO pode (só `Read/Bash` para testes)
- Já temos parcialmente: permissions em `.claude/settings.local.json`

### Memory + skills + slash commands
- Já temos: estrutura de skills em `.claude/skills/`, slash commands, memory

### O que falta no projeto

| Component | Estado | Falta |
|---|---|---|
| Subagents Implementer/Validator com missões isoladas | ❌ | Criar `.claude/agents/implementer.md` + `validator.md` |
| Contract pattern | ❌ | Template `CONTRACT.md` por sprint + slash command `/negotiate-contract` |
| Progress files por sprint | ❌ | Template `PROGRESS.md` + slash command `/update-progress` |
| Bootstrap script | ❌ | `scripts/bootstrap-session.sh` |
| Score binário de sensors | Parcial | Hooks já bloqueiam, mas não há "score" agregado |
| Validator em processo separado | ❌ | Validator hoje roda no mesmo contexto do reviewer |
| State files persistentes (PROJECT.md / STATE.md) | Parcial | Temos memory + docs/, mas sem state per-sprint |

---

## 8. Aplicação concreta na AdSmart

### 8.1 Estrutura de pastas a criar na Fase 0

```
.claude/
├── agents/                        ← criar
│   ├── orchestrator.md            ← arquiteto da fase/sprint
│   ├── researcher.md              ← parallel discovery (4× max)
│   ├── planner.md                 ← gera atomic tasks
│   ├── implementer.md             ← escreve código contra CONTRACT
│   ├── validator.md               ← bate item-a-item, score binário
│   └── debugger.md                ← diagnose failures, gera fix plan
├── settings.json                  ← já existe
├── skills/                        ← já existe (expandir)
└── projects/.../memory/           ← já existe (atualizar)

docs/specs/                        ← criar estrutura
└── {sprint-id}-{name}/
    ├── SPEC.md                    ← outcomes, scope, constraints
    ├── CONTRACT.md                ← negociada Implementer↔Validator
    ├── PROGRESS.md                ← log + estado (persistido entre sessions)
    └── EVALUATION.md              ← Validator output + score binário

scripts/
├── bootstrap-session.sh           ← criar — restaura contexto
├── update-progress.sh             ← criar — append em PROGRESS.md
└── firebase/...                   ← já existe
```

### 8.2 Workflow padrão para uma feature/sprint

```
1. /new-sprint <name>
   → cria docs/specs/{id}-{name}/
   → SPEC.md gerada via Orchestrator
   → user revisa + aprova

2. /research-sprint <id>
   → Orchestrator spawna 4× Researcher subagents (parallel)
   → cada um investiga: stack, padrões no repo, integrações, pitfalls
   → output em SPEC.md (adiciona "Prior decisions")

3. /plan-sprint <id>
   → Planner subagent cria atomic tasks (2-3 por subplan)
   → Checker subagent valida plan
   → loop até passar
   → output: tasks em CONTRACT.md

4. /negotiate-contract <id>
   → Implementer (fresh context) lê SPEC + propõe lista
   → Validator (fresh context) lê SPEC + lista
   → confronta: cobre 100% do scope? sem scope creep?
   → output assinado: CONTRACT.md final

5. /execute-sprint <id>
   → Orchestrator divide tasks em WAVES (dependency graph)
   → spawna Executors paralelos por wave
   → cada Executor em fresh 200k context
   → após cada task: commit + update PROGRESS.md

6. /validate-sprint <id>
   → Validator (fresh context) bate CONTRACT item-a-item
   → roda sensors computacionais (lint, type-check, tests)
   → score binário por item
   → output: EVALUATION.md

7. Se EVALUATION falha:
   → Debugger subagent diagnose
   → gera fix plan
   → volta para /execute-sprint com fix tasks

8. Se EVALUATION passa:
   → human aprova
   → /ship-sprint <id> (PR + docs update + memory update)
```

### 8.3 Princípios a adicionar no FEATURES-INVENTORY.md

- **Princípio 13 — Multi-process agents**: Implementer e Validator em sessões/subagents separados com missões isoladas. Nenhum agente julga seu próprio output.
- **Princípio 14 — Contracts before execution**: toda task tem `CONTRACT.md` negociado Implementer↔Validator ANTES de qualquer linha de código.
- **Princípio 15 — Score binário de sensors**: sensors computacionais (lint, type-check, tests) bloqueiam via hook. Não há "tá bom o suficiente" — passou ou não passou.
- **Princípio 16 — Progress files persistidos**: cada sprint mantém `PROGRESS.md` versionado em `docs/specs/{sprint}/`. Bootstrap script reconstrói contexto novo de session.

### 8.4 Hooks PreToolUse novos

- `check-contract-exists.sh` — bloqueia `Edit/Write` em sprint sem `CONTRACT.md`
- `check-progress-updated.sh` — bloqueia commit sem update em `PROGRESS.md` da sprint
- `check-sensors-passed.sh` — bloqueia PR sem score binário positivo do Validator
- `check-implementer-not-validator.sh` — bloqueia mesmo agente fazer Edit e depois Validate

### 8.5 ADRs a publicar

- **ADR-NNN**: Adotar Harness Engineering (Fowler taxonomy: guides + sensors)
- **ADR-NNN**: Multi-process agents (Implementer ≠ Validator, fresh context per subagent)
- **ADR-NNN**: Contracts negotiation before execution (CONTRACT.md per sprint)
- **ADR-NNN**: Progress files persistidos + Bootstrap script (memory between sessions)
- **ADR-NNN**: Sensor enforcement via hooks bloqueantes (score binário)

---

## 9. Roadmap de adoção (faseado)

**Fase 0a — Foundation harness** (junto com Fase 0 do roadmap geral)
- Estrutura `.claude/agents/` (Implementer, Validator, Orchestrator, Researcher, Planner, Debugger)
- Templates `docs/specs/{sprint}/SPEC.md`, `CONTRACT.md`, `PROGRESS.md`, `EVALUATION.md`
- Bootstrap script `scripts/bootstrap-session.sh`
- 4 hooks novos
- 5 ADRs publicados

**Fase 0b — Primeira sprint usando harness** (Fase -1 schemas será a primeira)
- Dogfooding — usar todo workflow do §8.2 na primeira sprint real
- Coletar métricas: tokens gastos, tempo, taxa de re-loop
- Iterar se necessário

**Fase 0c — Estabilização**
- Refinar templates com base no aprendizado da Fase 0b
- Documentar lessons learned em `docs/HARNESS-RUNBOOK.md`

---

## 10. Trade-offs aceitos

| Trade-off | Aceito porque |
|---|---|
| **Mais tokens gastos** (cada subagent fresh context) | 10× menos retrabalho compensa custo (GSD reporta dados) |
| **Mais arquivos por sprint** (SPEC/CONTRACT/PROGRESS/EVALUATION) | Memory + auditabilidade + handoff entre sessions |
| **Mais complexidade no início** | Compounding gain conforme features crescem |
| **Orquestração via slash commands** | Trade-off vs liberdade — vale para zero entropia |

---

## 11. Sources

- [Martin Fowler — Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) ⭐
- [Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Anthropic — Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [Anthropic — Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents)
- [Anthropic — 2026 Agentic Coding Trends Report (PDF)](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)
- [GSD Framework — github.com/gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done/) ⭐ 59.6k stars
- [GSD User Guide](https://github.com/gsd-build/get-shit-done/blob/main/docs/USER-GUIDE.md)
- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Claude Code Hooks Mastery (Disler)](https://github.com/disler/claude-code-hooks-mastery)
- [awesome-harness-engineering (GitHub)](https://github.com/ai-boost/awesome-harness-engineering)
- [Agent Contracts paper arxiv 2026](https://arxiv.org/pdf/2601.08815)
- [Progress.md: Mastering AI Agent Memory & Avoiding Code Slop](https://www.theaistack.dev/p/agent-memory)
- [Inside Claude Code architecture](https://www.penligent.ai/hackinglabs/inside-claude-code-the-architecture-behind-tools-memory-hooks-and-mcp/)
- [AddyOsmani — Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/)
