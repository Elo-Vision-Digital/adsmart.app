---
sprint-id: "0b"
name: "foundation-tooling"
negotiated-on: "2026-05-19"
parties:
  implementer: "main session (Claude Opus 4.7) + 4 wave validator passes"
  validator: ".claude/agents/validator.md (multi-process, fresh context per wave)"
status: locked
---

# Sprint 0b — foundation-tooling — CONTRACT

> Locked. Validator bate item-a-item após cada wave + ao fim da sprint.

## Items (Implementer commits to delivering)

### Wave 1 — Sub-AGENTS + root docs (5 itens)

| # | Item | Acceptance test |
|---|---|---|
| 1 | Atualizar `src/AGENTS.md` cobrindo React 19, Tailwind v4, i18n 3 idiomas, primitives novos | `grep -q "React 19\|Tailwind v4" src/AGENTS.md && grep -q "i18n\|3 idiomas\|3 languages" src/AGENTS.md` |
| 2 | Atualizar `functions/AGENTS.md` adicionando seções "Idempotência" e "Structured logging" | `grep -qE "^## Idempot" functions/AGENTS.md && grep -qE "^## Structured logging\|^### Structured logging" functions/AGENTS.md` |
| 3 | Criar `packages/shared/AGENTS.md` (schemas Zod source of truth, padrão `z.infer`, test co-located obrigatório) | `test -f packages/shared/AGENTS.md && grep -q "z.infer" packages/shared/AGENTS.md && grep -q "co-located\|colocated\|next to" packages/shared/AGENTS.md` |
| 4 | Atualizar `AGENTS.md` root com stack table (Tailwind v4 + SF Pro + Anthropic + DeepSeek + Playwright PDF) + princípios | `grep -q "Tailwind v4" AGENTS.md && grep -qE "## Stack\|## Princ" AGENTS.md` |
| 5 | Atualizar `CLAUDE.md` root com quick references para `/`, `research/`, `specs/`, `HARNESS-RUNBOOK.md` | `grep -q "HARNESS-RUNBOOK\|docs/specs/" CLAUDE.md` |

### Wave 2 — Skills novas (7 itens)

| # | Item | Acceptance test |
|---|---|---|
| 6 | `.claude/skills/-screen/SKILL.md` com frontmatter `name` + `description` + corpo de instruções | `test -f .claude/skills/-screen/SKILL.md && grep -qE "^name:" .claude/skills/-screen/SKILL.md && grep -qE "^description:" .claude/skills/-screen/SKILL.md` |
| 7 | `.claude/skills/new-zod-schema/SKILL.md` idem | idem para new-zod-schema |
| 8 | `.claude/skills/new-report-business-type/SKILL.md` idem | idem |
| 9 | `.claude/skills/verify-i18n/SKILL.md` idem | idem |
| 10 | `.claude/skills/validate-llm-call/SKILL.md` idem | idem |
| 11 | `.claude/skills/negotiate-contract/SKILL.md` idem | idem |
| 12 | `.claude/skills/bootstrap-fresh-session/SKILL.md` idem | idem |

### Wave 3 — Slash commands (13 itens)

| # | Item | Acceptance test |
|---|---|---|
| 13 | `.claude/commands/new-sprint.md` com frontmatter `description` + corpo executável | `test -f .claude/commands/new-sprint.md && grep -qE "^description:" .claude/commands/new-sprint.md` |
| 14 | `.claude/commands/research-sprint.md` idem | idem |
| 15 | `.claude/commands/plan-sprint.md` idem | idem |
| 16 | `.claude/commands/negotiate-contract.md` idem | idem |
| 17 | `.claude/commands/execute-sprint.md` idem | idem |
| 18 | `.claude/commands/validate-sprint.md` idem | idem |
| 19 | `.claude/commands/ship-sprint.md` idem | idem |
| 20 | `.claude/commands/update-progress.md` idem | idem |
| 21 | `.claude/commands/new-screen-.md` idem | idem |
| 22 | `.claude/commands/check-i18n.md` idem | idem |
| 23 | `.claude/commands/check-no-hardcoded.md` idem | idem |
| 24 | `.claude/commands/new-ai-prompt-version.md` idem | idem |
| 25 | `.claude/commands/run-research.md` idem | idem |

### Wave 4 — Hooks + settings.json + smoke (10 itens)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 26 | `scripts/hooks/check-no-hardcoded-literal.sh` com `set -euo pipefail`, executável | — | `test -x scripts/hooks/check-no-hardcoded-literal.sh && bash -n scripts/hooks/check-no-hardcoded-literal.sh` |
| 27 | `scripts/hooks/check-zod-schema-test.sh` idem | — | idem |
| 28 | `scripts/hooks/check-llm-call-via-logger.sh` idem | — | idem |
| 29 | `scripts/hooks/check-firestore-rule-defaults-deny.sh` idem | — | idem |
| 30 | `scripts/hooks/check-contract-exists.sh` idem | — | idem |
| 31 | `scripts/hooks/check-progress-updated.sh` idem | — | idem |
| 32 | `scripts/hooks/check-sensors-passed.sh` idem | — | idem |
| 33 | `scripts/hooks/check-implementer-not-validator.sh` idem | — | idem |
| 34 | Atualizar `.claude/settings.json` referenciando os 8 hooks novos | 26-33 | `jq '.hooks.PreToolUse \| length' .claude/settings.json` ≥ 12 e cada nome em `scripts/hooks/` aparece em grep |
| 35 | Smoke test documentado em PROGRESS.md (sprint dummy + `/new-sprint → /plan-sprint → /negotiate-contract`) | 13-20 | seção "## Smoke test" em PROGRESS.md com bullets descrevendo a sequência aplicada |

### Wave 5 — Validação final (depende de tudo acima)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 36 | Zero regressão: `cd packages/shared && bun run test` continua 195/195; `bun run typecheck` verde; `bun run lint` 0 errors | 1-35 | output dos 3 sensores confirma |
| 37 | `docs/specs/0b-foundation-tooling/EVALUATION.md` com `verdict: pass` | 36 | `grep -q 'verdict: pass' docs/specs/0b-foundation-tooling/EVALUATION.md` |

## Out of scope (explicit)

- [ ] Deletar/criar/atualizar memórias em `.claude/projects/.../memory/` — **Fase 0c**
- [ ] Publicar ADRs (Harness, Multi-process, Stack 2026) — **Fase 0d**
- [ ] Refactor de agents legados (`firestore-*`, `functions-security-reviewer`) — fora 
- [ ] Refactor de hooks legados em `scripts/firebase/` — manter por compatibilidade
- [ ] Mudanças em código TS/TSX da app — esta sprint é tooling/infra
- [ ] Conteúdo "rico" das skills/commands que invoca LLM em produção real — escopo é criar os arquivos com instruções/prompts; execução real só após uso de campo
- [ ] Mudanças em `firestore.rules` ou `firestore.indexes.json`
- [ ] Substituir `lefthook` por hooks Claude Code — lefthook continua para typecheck/biome

## Sensors a rodar

### Computacionais (bloqueantes ao fim de cada wave)

- [ ] `bash -n scripts/hooks/*.sh` — sintaxe shell válida (Wave 4)
- [ ] `chmod +x scripts/hooks/*.sh` — executáveis (Wave 4)
- [ ] `jq '.' .claude/settings.json > /dev/null` — JSON válido após update (Wave 4)
- [ ] `cd packages/shared && bun run test` — 195/195 verde (cada wave)
- [ ] `bun run typecheck` — verde (cada wave)
- [ ] `bun run lint` — 0 errors (cada wave; warnings pre-existentes ok)
- [ ] Pre-commit hooks (lefthook) via `git commit` — passam (cada wave)

### Inferenciais (ao fim de cada wave)

- [ ] `Agent(validator, "check Wave N: items X-Y entregues conforme acceptance tests")` retorna PASS antes de seguir próxima wave

## Sign-off

- [ ] Implementer assinou — 4 commits (1 por wave) pushed
- [ ] Validator assinou (4 passes intermediários + 1 final) — EVALUATION.md `verdict: pass`
- [ ] Human revisou — PR aberto e mergeado em develop
