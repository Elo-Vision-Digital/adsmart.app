---
sprint-id: "0b"
name: "foundation-tooling"
status: contract
depends-on: ["-1", "0a"]
est-days: 3
references:
  - docs//
  - docs/research/09-harness-engineering.md
  - docs/specs/0a-foundation-harness/EVALUATION.md
---

# Sprint 0b — foundation-tooling — SPEC

> Feedforward artifact. Sprint que completa a camada de tooling IA-coded em cima do harness multi-process da Fase 0a.

## Outcomes

- [ ] **3 sub-AGENTS.md** atualizados/criados (`src/AGENTS.md` update, `functions/AGENTS.md` update — já existia, `packages/shared/AGENTS.md` criar) cobrindo padrões da pasta com convenções concretas
- [ ] **2 root docs** atualizados (`AGENTS.md` com stack table + princípios; `CLAUDE.md` com quick references atualizadas)
- [ ] **7 skills novas** em `.claude/skills/` (-screen, new-zod-schema, new-report-business-type, verify-i18n, validate-llm-call, negotiate-contract, bootstrap-fresh-session) — cada uma com `SKILL.md` próprio e `description` que dispara via auto-invoke
- [ ] **13 slash commands novos** em `.claude/commands/` (8 workflow harness + 5 workflow domínio) — cada um com frontmatter `description` + corpo de instruções concretas
- [ ] **8 hooks PreToolUse** em `scripts/hooks/` (pasta nova) — sensores bloqueantes para hardcoded literals, schemas sem test, LLM sem logger estruturado, rules sem default deny, contract ausente, progress não atualizado, sensores não passados, implementer vs validator
- [ ] **`.claude/settings.json`** atualizado referenciando os 8 hooks novos via `matcher` + `if` apropriados
- [ ] **Smoke test** documentado: criar sprint dummy + percorrer `/new-sprint → /plan-sprint → /negotiate-contract` (sem executar até o fim)
- [ ] **Zero regressão**: sensores existentes (test 195/195 + typecheck + build + lint) continuam verdes
- [ ] **Dogfood**: a própria Fase 0b é executada usando os artefatos do harness (sprint folder via `new-sprint.sh`, validator+sensores ao fim de cada wave, PROGRESS atualizado, EVALUATION com verdict pass)

## Scope

### In

- Atualizar/criar 3 sub-AGENTS.md por área + 2 root docs (AGENTS + CLAUDE)
- Criar 7 skills (cada um pasta própria com `SKILL.md`)
- Criar 13 commands (cada um arquivo `.md` próprio)
- Criar 8 hooks shell scripts em `scripts/hooks/`
- Atualizar `.claude/settings.json` (PreToolUse novos hooks)
- Smoke test do fluxo `/new-sprint → /plan-sprint → /negotiate-contract`

### Out

Tudo que parece relacionado mas NÃO faz parte:

- **Memória cleanup + criação** (deletar/atualizar/criar memórias em `.claude/projects/.../memory/`) → **Fase 0c**
- **ADRs publicados** (Harness, Multi-process, Stack 2026, etc.) → **Fase 0d**
- **Refactor de agents legados** (`firestore-*`, `functions-security-reviewer`) — fora  (coexistem)
- **Refactor de hooks legados** (`check-no-process-env-secret.sh` etc.) — mantém em `scripts/firebase/` por compatibilidade, novos vão em `scripts/hooks/`
- **Substituir lefthook pre-commit/pre-push** — fora; lefthook continua para typecheck/biome
- **Mudanças em código TS/TSX da app** — esta sprint é tooling/infra (`.md` + `.sh` + `.json`)
- **Implementar conteúdo real de skills/commands que invocam LLM em produção** — escopo é criar os arquivos com prompts/instruções; execução real só após Fase 0c+
- **Mudanças em `firestore.rules` ou `firestore.indexes.json`**

## Constraints

| Tipo | Restrição |
|---|---|
| Stack | Claude Code subagent format (`name`, `description`, `tools`, `model: sonnet` opcional). Skills: pasta com `SKILL.md` + `description`. Hooks: bash com `set -euo pipefail`, exit 0 = OK, exit non-zero = block, stderr = razão. |
| Idiomas dos docs | Mix PT-BR/EN seguindo convenção do repo (frontmatter EN, narrativa PT-BR aceitável quando técnica). |
| Path discipline | Hooks NOVOS vão em `scripts/hooks/` (pasta nova). Existentes ficam em `scripts/firebase/` (sem refactor). |
| Segurança | Hooks não devem ter side-effects (read-only do filesystem). Devem ser determinísticos. |
| Não temos usuários em prod | refactor destrutivo permitido (irrelevante para esta sprint — só infra) |
| Zero regressão | sensores existentes (test 195/195, typecheck, lint) continuam verdes |
| No hardcoded literals | nenhum hook hardcodar paths absolutos da máquina — usar `$CLAUDE_PROJECT_DIR` |

## Prior decisions

Decisões já tomadas em fases anteriores que esta sprint herda:

- **Multi-process harness** (Fase 0a): Implementer ≠ Validator, fresh 200k context, tools restritas via frontmatter (`docs/research/09-harness-engineering.md` §4).
- **Sub-AGENTS por área** (research/09 §5): cada pasta declara suas convenções, root AGENTS.md aponta para elas com thin redirect.
- **Hooks PreToolUse como sensores computacionais bloqueantes** (research/09 §6): bash scripts simples, exit code = decisão.
- **Skills com auto-invoke** (`description` triggera baseado em contexto, sem invocação explícita do usuário).
- **Slash commands organizados por workflow**: harness (sprint lifecycle) vs domínio (refactor screen, i18n, etc.).
- **Convenção frontmatter do repo**: `name`, `description`, `tools (comma list)`, `model` — confirmado em `firestore-query-reviewer.md` (legado) e nos 6 agents da Fase 0a.
- **`HARNESS-RUNBOOK.md` é canônico** para o fluxo de sprint — não duplicar conteúdo nos commands; commands referenciam runbook.
- **Lessons learned da Fase 0a** (EVALUATION § Notas):
  - hook `check-rules-tested.sh` tem false positives em bash multi-command — considerar matcher mais preciso nos novos hooks
  - bootstrap output é compacto (< 60 linhas) — manter padrão nos novos commands
  - Reload Window é mandatório após criar novos agents — documentar no RUNBOOK (já capturado em PROGRESS da Fase 0a)

## Task breakdown

4 waves. Cada wave fecha com validator agent + sensores antes de seguir.

### Wave 1 — Sub-AGENTS por área + root docs (5 itens, ~4h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | Atualizar `src/AGENTS.md` (React 19, Tailwind v4, i18n 3 idiomas, primitives novos) | — | `grep -q "Tailwind v4" src/AGENTS.md`, validator inferencial confirma coverage |
| 2 | Atualizar `functions/AGENTS.md` adicionando seções "Idempotência" e "Structured logging via logger.info" | — | `grep -q "## Idempotência\|## Structured logging" functions/AGENTS.md` |
| 3 | Criar `packages/shared/AGENTS.md` (schemas Zod source of truth, padrão `z.infer<typeof X>`, sem `interface` separado, test co-located obrigatório) | — | `test -f packages/shared/AGENTS.md && grep -q "z.infer" packages/shared/AGENTS.md` |
| 4 | Atualizar `AGENTS.md` root (stack table Tailwind v4 + SF Pro + Anthropic + DeepSeek + Playwright PDF + princípios 1-16) | — | `grep -q "## Stack table\|### Princípios" AGENTS.md` |
| 5 | Atualizar `CLAUDE.md` root (quick references com links para `/`, `research/`, `specs/`, `HARNESS-RUNBOOK.md`) | 4 | `grep -q "HARNESS-RUNBOOK\|docs/specs/" CLAUDE.md` |

### Wave 2 — Skills novas (7 itens, ~5h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 6 | `.claude/skills/-screen/SKILL.md` — workflow refactor tela DS-1 | — | `test -f .claude/skills/-screen/SKILL.md && grep -qE "^name:|^description:" .claude/skills/-screen/SKILL.md` |
| 7 | `.claude/skills/new-zod-schema/SKILL.md` — schema novo com test (template + comando) | — | idem para new-zod-schema |
| 8 | `.claude/skills/new-report-business-type/SKILL.md` — adicionar tipo em FLOW-3 | — | idem |
| 9 | `.claude/skills/verify-i18n/SKILL.md` — validar 3 idiomas em diff | — | idem |
| 10 | `.claude/skills/validate-llm-call/SKILL.md` — validar callable LLM contra INF-1 | — | idem |
| 11 | `.claude/skills/negotiate-contract/SKILL.md` — workflow contract Implementer↔Validator | — | idem |
| 12 | `.claude/skills/bootstrap-fresh-session/SKILL.md` — invoca bootstrap script + sintetiza estado | — | idem |

### Wave 3 — Slash commands (13 itens, ~6h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 13 | `.claude/commands/new-sprint.md` (`/new-sprint <name>`) | — | `test -f .claude/commands/new-sprint.md && grep -q "^description:" .claude/commands/new-sprint.md` |
| 14 | `.claude/commands/research-sprint.md` | — | idem |
| 15 | `.claude/commands/plan-sprint.md` | — | idem |
| 16 | `.claude/commands/negotiate-contract.md` | — | idem |
| 17 | `.claude/commands/execute-sprint.md` | — | idem |
| 18 | `.claude/commands/validate-sprint.md` | — | idem |
| 19 | `.claude/commands/ship-sprint.md` | — | idem |
| 20 | `.claude/commands/update-progress.md` | — | idem |
| 21 | `.claude/commands/new-screen-.md` | — | idem |
| 22 | `.claude/commands/check-i18n.md` | — | idem |
| 23 | `.claude/commands/check-no-hardcoded.md` | — | idem |
| 24 | `.claude/commands/new-ai-prompt-version.md` | — | idem |
| 25 | `.claude/commands/run-research.md` | — | idem |

### Wave 4 — Hooks + settings.json + smoke (10 itens, ~5h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 26 | `scripts/hooks/check-no-hardcoded-literal.sh` (executável, `set -euo pipefail`) | — | `test -x scripts/hooks/check-no-hardcoded-literal.sh && bash -n scripts/hooks/check-no-hardcoded-literal.sh` |
| 27 | `scripts/hooks/check-zod-schema-test.sh` | — | idem |
| 28 | `scripts/hooks/check-llm-call-via-logger.sh` | — | idem |
| 29 | `scripts/hooks/check-firestore-rule-defaults-deny.sh` | — | idem |
| 30 | `scripts/hooks/check-contract-exists.sh` | — | idem |
| 31 | `scripts/hooks/check-progress-updated.sh` | — | idem |
| 32 | `scripts/hooks/check-sensors-passed.sh` | — | idem |
| 33 | `scripts/hooks/check-implementer-not-validator.sh` | — | idem |
| 34 | Atualizar `.claude/settings.json` referenciando os 8 hooks com matchers apropriados | 26-33 | JSON parse válido + grep dos 8 nomes |
| 35 | Smoke test documentado em PROGRESS.md (sprint dummy + `/new-sprint → /plan-sprint → /negotiate-contract`) | 13-20 | passagem documentada em `PROGRESS.md` (não precisa executar, apenas demonstrar que a sequência é coerente) |

## Verification criteria

| Outcome | Sensor | Comando / Subagent |
|---|---|---|
| 3 sub-AGENTS | Computacional | `for f in src/AGENTS.md functions/AGENTS.md packages/shared/AGENTS.md; do test -f "$f"; done` |
| 2 root docs | Computacional | `grep -q "Tailwind v4" AGENTS.md && grep -q "HARNESS-RUNBOOK" CLAUDE.md` |
| 7 skills | Computacional | `[ "$(ls -1d .claude/skills/*/ \| wc -l)" -ge 9 ]` (7 novas + 2 legadas) |
| 13 commands | Computacional | `[ "$(ls -1 .claude/commands/*.md \| wc -l)" -ge 17 ]` (13 novos + 4 legados) |
| 8 hooks | Computacional | `[ "$(ls -1 scripts/hooks/check-*.sh \| wc -l)" -eq 8 ]` + cada `bash -n` retorna 0 |
| settings.json | Computacional | `jq '.hooks.PreToolUse \| length' .claude/settings.json` ≥ 12 (4 antigos + 8 novos) |
| Smoke test | Inferencial | `Agent(validator, "verifique se o fluxo descrito em PROGRESS.md é coerente com os comandos criados")` |
| Zero regressão | Computacional | `cd packages/shared && bun run test` → 195/195; `bun run typecheck` → exit 0; `bun run lint` → 0 errors |
| Cada wave fecha com validator | Inferencial | `Agent(validator, "check wave N")` retorna PASS antes de seguir |

## References

- `docs//` § FASE 0b (linha 204-281)
- `docs/research/09-harness-engineering.md` § 5 (sub-AGENTS) e § 6 (hooks)
- `docs/HARNESS-RUNBOOK.md` (workflow canônico das sprints)
- `docs/specs/0a-foundation-harness/EVALUATION.md` (lessons learned do dogfood)
