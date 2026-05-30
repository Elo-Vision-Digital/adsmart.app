---
sprint-id: "0a"
name: "foundation-harness"
status: implementing
depends-on: ["-1"]
est-days: 1
references:
  - docs/research/09-harness-engineering.md
  - docs//
---

# Sprint 0a — Foundation Harness — SPEC

> Instala a infraestrutura de Harness Engineering em AdSmart: 6 agents multi-process + 4 templates de sprint + 3 scripts de coordenação + runbook. Base para todas as fases seguintes .

## Outcomes

- [x] **6 agents** em `.claude/agents/` com personalidades, tools restritas e responsabilidades isoladas:
  - orchestrator (coordena, não edita)
  - researcher (descoberta paralela, read-only)
  - planner (atomic tasks → CONTRACT)
  - implementer (escreve código contra CONTRACT, sem `Agent`)
  - validator (score binário, sem `Edit`/`Write`)
  - debugger (root-cause + fix plan, sem `Edit`/`Write`)
- [x] **4 templates** em `docs/specs/_templates/` instanciáveis por sprint: SPEC, CONTRACT, PROGRESS, EVALUATION
- [x] **3 scripts** em `scripts/harness/`: `bootstrap-session.sh`, `update-progress.sh`, `new-sprint.sh`
- [x] **HARNESS-RUNBOOK.md** documenta o workflow end-to-end com exemplos concretos
- [x] **Dogfood**: este próprio Sprint 0a tem `SPEC.md` + `PROGRESS.md` + `CONTRACT.md` preenchidos usando os templates novos
- [x] Sensors existentes (lint/type/test/build) verdes em todos os pacotes — zero regressão

## Scope

### In

- Estrutura de pastas: `.claude/agents/`, `docs/specs/_templates/`, `docs/specs/0a-foundation-harness/`, `scripts/harness/`
- 6 arquivos `.md` em `.claude/agents/` com frontmatter (`name`, `description`, `tools`, `model`) + corpo
- 4 arquivos template em `docs/specs/_templates/` (Markdown + YAML frontmatter com placeholders `{ID}`, `{NAME}`, `{YYYY-MM-DD}`)
- 3 scripts Bash com `set -euo pipefail`, sem hardcoded paths, idempotentes
- `docs/HARNESS-RUNBOOK.md` cobrindo anatomia + fluxo + boundaries + failure modes
- 3 arquivos preenchidos para esta sprint (SPEC, PROGRESS, CONTRACT) — dogfood

### Out

Deixado para fases posteriores (não confundir com esta sprint):

- **Skills novas em `.claude/skills/`** → Fase 0b (`-screen`, `new-zod-schema`, etc.)
- **Slash commands em `.claude/commands/`** → Fase 0b (`/new-sprint`, `/research-sprint`, etc.)
- **Hooks PreToolUse novos em `scripts/firebase/` ou similares** → Fase 0b (`check-no-hardcoded-literal.sh`, `check-contract-exists.sh`, etc.)
- **Atualização de sub-AGENTS.md por área** → Fase 0b
- **Memory cleanup + criação** → Fase 0c
- **ADRs publicados** → Fase 0d
- **Conexão real ao MCP de Vercel/Notion/etc.** — fora do escopo, já existe
- **Refactor de `feature-dev:*` agents existentes** — esses são plugins externos; não conflitam com os novos

## Constraints

| Tipo | Restrição |
|---|---|
| Stack | Bash (zsh-compatible), Markdown, YAML frontmatter; nada que precise instalar novas deps |
| Compat | Convenções existentes em `.claude/agents/*.md` (firestore-query-reviewer etc.) devem ser seguidas: frontmatter `name/description/tools/model` |
| Segurança | Scripts não devem ler ou escrever segredos; não devem executar comandos destrutivos |
| Sem hardcoded | Paths via `$(git rev-parse --show-toplevel)` ou `$CLAUDE_PROJECT_DIR`; nada literal específico à máquina de Eduardo |
| Sem comentários decorativos | Conforme `feedback_no_hardcoded_no_unnecessary_comments.md` |
| Sem usuários em prod | Refactor estrutural permitido (não há regressão funcional para nenhum usuário existente) |

## Prior decisions

Vindas da pesquisa Fase -2 e :

- **Multi-process agents** (Researcher 09 §4): Implementer ≠ Validator, contextos isolados. Cada Agent call inicia com fresh 200k. Razão: agentes julgando o próprio output têm viés inevitável; processos separados eliminam.
- **Contracts negotiated before execution** (Researcher 09 §5): SPEC define escopo, CONTRACT é a lista item-a-item que Implementer compromete a entregar. Locked antes da execução. Validator bate item-a-item. Razão: previne scope creep e loops infinitos.
- **Score binário** (Researcher 09 §3): PASS/FAIL por item. Sem "85% done", sem "minor issues". Razão: ambiguidade gera retrabalho; binário força decisão.
- **Persistent state via PROGRESS.md** (Researcher 09 §6): atualizar antes de compactar contexto. Bootstrap script lê primeiro. Razão: sessões longas excedem context window; o disco é a memória durável.
- **Tools allocation por agent**: Orchestrator tem `Agent` mas não `Edit/Write`. Implementer tem `Edit/Write` mas não `Agent`. Validator e Debugger têm `Read/Bash` mas não `Edit/Write`. Researcher é read-only. Planner pode `Write` mas só em `docs/specs/`. Razão: restrição mecânica > confiança em prompt.
- **Convenção `frontmatter` de agents do repo**: `name, description, tools (comma list), model`. Já estabelecida em `firestore-query-reviewer.md`, `firestore-rules-reviewer.md`, `functions-security-reviewer.md`. Mantida.
- **Subfolder `scripts/harness/`**: análogo a `scripts/firebase/` existente. Organização por propósito. Razão: separa concerns + facilita PreToolUse hooks por path em fases futuras.

## Task breakdown

Wave 1 (independentes — paralelizáveis):

| # | Task | Acceptance |
|---|---|---|
| 1 | `.claude/agents/orchestrator.md` | grep frontmatter `name: orchestrator`, `tools` contém `Agent` |
| 2 | `.claude/agents/researcher.md` | grep frontmatter, `tools` contém `WebSearch` e Context7 MCP |
| 3 | `.claude/agents/planner.md` | grep frontmatter, `tools` contém `Write` mas não `Agent` |
| 4 | `.claude/agents/implementer.md` | grep frontmatter, `tools` contém `Edit, Write` mas NÃO `Agent` |
| 5 | `.claude/agents/validator.md` | grep frontmatter, `tools` NÃO contém `Edit` nem `Write` |
| 6 | `.claude/agents/debugger.md` | grep frontmatter, `tools` NÃO contém `Edit` nem `Write` |
| 7 | `docs/specs/_templates/SPEC.md` | `head -1` retorna `---`, body tem `## Outcomes` |
| 8 | `docs/specs/_templates/CONTRACT.md` | grep `## Items`, frontmatter tem `status: draft` |
| 9 | `docs/specs/_templates/PROGRESS.md` | grep `## Sessions log`, frontmatter tem `started:` |
| 10 | `docs/specs/_templates/EVALUATION.md` | grep `## Verdict`, frontmatter tem `verdict: pending` |

Wave 2 (depende dos templates):

| # | Task | Depende de | Acceptance |
|---|---|---|---|
| 11 | `scripts/harness/bootstrap-session.sh` (executável) | — | `chmod +x` ok, `bash -n` ok, dry run não falha |
| 12 | `scripts/harness/update-progress.sh` | — | `bash -n` ok, falha com exit 1 se sem arg |
| 13 | `scripts/harness/new-sprint.sh` | 7,8,9,10 | `bash scripts/harness/new-sprint.sh tmp-test test && rm -rf docs/specs/tmp-test-test` ok |
| 14 | `docs/HARNESS-RUNBOOK.md` | 1-10 | grep `## Anatomy`, `## Typical sprint flow`, `## Hard rules` |

Wave 3 (depende de templates + scripts):

| # | Task | Depende de | Acceptance |
|---|---|---|---|
| 15 | `docs/specs/0a-foundation-harness/SPEC.md` (preenchido) | 7 | YAML válido, Outcomes não placeholder |
| 16 | `docs/specs/0a-foundation-harness/PROGRESS.md` (preenchido) | 9 | YAML válido, sessão registrada |
| 17 | `docs/specs/0a-foundation-harness/CONTRACT.md` (preenchido + locked) | 8,15 | `status: locked`, items casam com tasks |

Wave 4 (validação final):

| # | Task | Depende de | Acceptance |
|---|---|---|---|
| 18 | Sensors regressão zero | 1-17 | `bun run lint`, `bun run typecheck`, `bun run test --filter=@adsmart/shared` verdes |
| 19 | EVALUATION.md PASS | 1-18 | `verdict: pass` |

## Verification criteria

| Outcome | Sensor | Comando |
|---|---|---|
| 6 agents existem com frontmatter correta | Computacional | `ls .claude/agents/{orchestrator,researcher,planner,implementer,validator,debugger}.md` |
| Implementer não pode spawn Agent | Computacional | `grep -E '^tools:.*Agent' .claude/agents/implementer.md` retorna nada |
| Validator não pode Edit/Write | Computacional | `grep -E '^tools:.*\b(Edit\|Write)\b' .claude/agents/validator.md` retorna nada |
| 4 templates instanciáveis | Computacional | `bash scripts/harness/new-sprint.sh tmp-test test && diff -q ...` |
| Scripts executáveis e válidos | Computacional | `bash -n scripts/harness/*.sh` exit 0 |
| Runbook completo | Inferencial | Validator lê e confere seções obrigatórias |
| Zero regressão | Computacional | `bun run test --filter=@adsmart/shared` ainda 195/195 |

## References

- [docs/research/09-harness-engineering.md](../../research/09-harness-engineering.md)
- [docs// § Fase 0a](../..//)
- [Martin Fowler — Harness engineering](https://martinfowler.com/articles/harness-engineering.html)
- [Claude Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)
