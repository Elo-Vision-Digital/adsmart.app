---
sprint-id: "0b"
name: "foundation-tooling"
validated-on: "2026-05-19"
validator: ".claude/agents/validator.md (multi-process, 4 passes intermediários + 1 final)"
verdict: pass
---

# Sprint 0b — foundation-tooling — EVALUATION

> Sensor feedback. Score binário por item do CONTRACT. Segunda dogfood do harness (após Fase 0a).

## Verdict

**PASS** ✅

Todos os 36 items entregáveis do CONTRACT atendidos com evidência computacional + inferencial. Item 37 (este próprio arquivo com `verdict: pass`) é circular — depende deste write para fechar. Zero regressão. Scope discipline mantida (zero `.ts`/`.tsx` da app tocado).

## Score por item do CONTRACT

### Wave 1 — Sub-AGENTS + root docs (5 itens)

| # | Item | Score | Evidência |
|---|---|---|---|
| 1 | `src/AGENTS.md` cobre React 19 + Tailwind v4 + i18n 3 idiomas | ✅ PASS | bloco "Current vs target stack" linha 7 + seção "i18n is mandatory" linha 11 com aviso explícito sobre não preempt Fase 1 |
| 2 | `functions/AGENTS.md` adiciona seções Idempotência + Structured logging | ✅ PASS | `## Idempotência` linha 145 + `## Structured logging` linha 173, ambas com code samples concretos |
| 3 | `packages/shared/AGENTS.md` criado (z.infer + co-located test) | ✅ PASS | arquivo novo, 154 linhas; z.infer linhas 59/156; co-located linhas 88/95/153; 4-step flow linha 88; What NOT to do |
| 4 | `AGENTS.md` root com stack table (Tailwind v4) + princípios | ✅ PASS | Tailwind v4 linha 49 (tabela Target); `## Princípios do projeto` linha 57 linkando FEATURES-INVENTORY; sub-AGENTS links linhas 10-15 |
| 5 | `CLAUDE.md` root com refs para HARNESS-RUNBOOK + docs/specs/ | ✅ PASS | HARNESS-RUNBOOK linha 14; `docs/specs/` linha 13; refs antigos preservados |

### Wave 2 — Skills novas (7 itens)

| # | Item | Score | Evidência |
|---|---|---|---|
| 6 | `.claude/skills/redesign-screen/SKILL.md` | ✅ PASS | frontmatter name+description; corpo 6 passos com bash; anti-patterns; refs |
| 7 | `.claude/skills/new-zod-schema/SKILL.md` | ✅ PASS | code TS template + Zod 4 idioms + test template; refs `packages/shared/AGENTS.md` |
| 8 | `.claude/skills/new-report-business-type/SKILL.md` | ✅ PASS | 8 passos cobrindo schema + config + Looker + i18n + E2E + docs |
| 9 | `.claude/skills/verify-i18n/SKILL.md` | ✅ PASS | 6 passos com `jq -r 'paths(scalars)'` + diff + órfãs + report table |
| 10 | `.claude/skills/validate-llm-call/SKILL.md` | ✅ PASS | checklist 7-item binário + code samples + verdict table |
| 11 | `.claude/skills/negotiate-contract/SKILL.md` | ✅ PASS | 6 passos cobrindo Implementer↔Validator loop com `Agent(validator,...)` |
| 12 | `.claude/skills/bootstrap-fresh-session/SKILL.md` | ✅ PASS | 4 passos + format `<200 palavras` + outputs preferred/anti-patterns |

### Wave 3 — Slash commands (13 itens)

| # | Item | Score | Evidência |
|---|---|---|---|
| 13 | `/new-sprint <id> <name>` | ✅ PASS | argument-hint + bash de verify branch + invoca new-sprint.sh + próximos passos |
| 14 | `/research-sprint <id>` | ✅ PASS | spawna `Agent(researcher,...)` paralelo + síntese + update SPEC |
| 15 | `/plan-sprint <id>` | ✅ PASS | guard de SPEC preenchido + invoca planner agent |
| 16 | `/negotiate-contract <id>` | ✅ PASS | usa skill negotiate-contract + atalho direto via validator |
| 17 | `/execute-sprint <id>` | ✅ PASS | sequential vs parallel strategy + orchestrator/implementer dispatch |
| 18 | `/validate-sprint <id> [wave-N]` | ✅ PASS | validator multi-process + EVALUATION update + debugger fallback |
| 19 | `/ship-sprint <id>` | ✅ PASS | push + `gh pr create` template + CHANGES.md + EXECUTION-CHECKLIST |
| 20 | `/update-progress "<nota>"` | ✅ PASS | minimal (single script call) + when/when-not guidance |
| 21 | `/new-screen-redesign <PageName>` | ✅ PASS | defer para skill redesign-screen + DS-1 gate |
| 22 | `/check-i18n` | ✅ PASS | 5 comandos bash concretos (jq + diff + grep) |
| 23 | `/check-no-hardcoded [path]` | ✅ PASS | 4 grep patterns + falsos-positivos documentados |
| 24 | `/new-ai-prompt-version <name>` | ✅ PASS | convenção versionada imutável + caller migration + logger tracing |
| 25 | `/run-research <topic>` | ✅ PASS | researcher agent + template de nota em docs/research/ |

### Wave 4 — Hooks + settings.json + smoke (10 itens)

| # | Item | Score | Evidência |
|---|---|---|---|
| 26 | `scripts/hooks/check-no-hardcoded-literal.sh` | ✅ PASS | `-rwxr-xr-x`; `bash -n` exit 0; `set -euo pipefail`; lê stdin via jq; detecta texto JSX + atributos; stderr cita Princípio 7 |
| 27 | `scripts/hooks/check-zod-schema-test.sh` | ✅ PASS | derive test_path; exempções (`.test.ts`, converter, index); stderr cita ADR-009 |
| 28 | `scripts/hooks/check-llm-call-via-logger.sh` | ✅ PASS | detecta Anthropic/DeepSeek/OpenAI + checa logger.info + modelId + tokens; stderr cita INF-1 |
| 29 | `scripts/hooks/check-firestore-rule-defaults-deny.sh` | ✅ PASS | detecta match block sem default deny; stderr cita Princípio 10 |
| 30 | `scripts/hooks/check-contract-exists.sh` | ✅ PASS | exempta SPEC/CONTRACT/PROGRESS/EVALUATION + `_templates/`; verifica `status: locked` |
| 31 | `scripts/hooks/check-progress-updated.sh` | ✅ PASS | warn-only (documentado inline); detecta git commit + checa PROGRESS recente |
| 32 | `scripts/hooks/check-sensors-passed.sh` | ✅ PASS | warn-only; detecta gh pr create + git push; checa lefthook-cache mtime |
| 33 | `scripts/hooks/check-implementer-not-validator.sh` | ✅ PASS | warn-only; detecta EVALUATION verdict pass + session marker; cita Princípio 13 |
| 34 | `.claude/settings.json` referenciando os 8 hooks | ✅ PASS | `jq '.hooks.PreToolUse \| length'` = 12 (4 legados + 8 novos); JSON válido; paths `scripts/hooks/`; matchers + ifs corretos |
| 35 | Smoke test em PROGRESS.md | ✅ PASS | seção `## Smoke test do fluxo harness` com 4 passos documentados (new-sprint → plan-sprint → negotiate-contract + hook integration) |

### Wave 5 — Validação final

| # | Item | Score | Evidência |
|---|---|---|---|
| 36 | Zero regressão (test 195/195 + typecheck + lint) | ✅ PASS | `cd packages/shared && bun run test` → 195 passed (195); `bun run typecheck` exit 0; `bun run lint` 0 errors (112 warnings pre-existing); zero `.ts`/`.tsx` da app modificado |
| 37 | `EVALUATION.md` verdict: pass | ✅ PASS | este próprio arquivo |

## Computational sensors output

```text
bun run test (packages/shared)         →  19 test files, 195/195 passed  ✅
bun run typecheck (web)                 →  tsc --noEmit, exit 0           ✅
bun run lint (Biome)                    →  0 errors (112 warnings pre-existing)  ✅
bash -n scripts/hooks/*.sh             →  exit 0 nos 8                   ✅
chmod +x scripts/hooks/*.sh            →  -rwxr-xr-x nos 8               ✅
jq '.hooks.PreToolUse | length' settings.json  →  12  ✅
jq map(scripts/hooks/) settings.json   →  8 entries com paths corretos   ✅
.claude PreToolUse hooks executados durante a sprint  →  passaram (false-positives conhecidos do check-rules-tested.sh permanecem documentados)  ✅
```

## Inferencial sensors

- **Validator agent (4 passes intermediários por wave + 1 final)**: PASS unânime. Wave 1: 5/5. Wave 2: 7/7 (description PT-BR+EN, anti-patterns, coerência). Wave 3: 13/13 (lifecycle harness completo, cross-refs íntegras, vocabulário coerente). Wave 4: 10/10 (lógica casa com propósito, mensagens stderr úteis, scope discipline mantida).
- **Scope check**: zero `.ts`/`.tsx` da app modificado; tudo em `.claude/`, `docs/specs/0b-foundation-tooling/`, `docs/redesign/` (PROGRESS), `packages/shared/AGENTS.md`, `src/AGENTS.md`, `functions/AGENTS.md`, root `AGENTS.md` + `CLAUDE.md`, `scripts/hooks/`. ✅
- **Cross-refs integridade**: validator confirmou que todos as skills, agents, scripts referenciados nos artifacts existem no disco. Zero arquivo fantasma. ✅

## Fix list

Vazio (verdict: pass).

## Sign-off

- [x] Validator concluiu análise item-a-item (37/37 com escopo correto — item 37 é este próprio write fechando o loop)
- [x] Computational sensors rodados (test, typecheck, lint, bash -n, jq, mtime)
- [x] Inferencial check via validator agent multi-process (4 passes intermediários + 1 final)
- [x] Verdict registrado: PASS
- [x] Zero regressão confirmada
- [ ] Implementer commitou todas as waves (a0be543, 5b13f07, f0728a9 + commit final desta wave)
- [ ] Push + PR aberto para `develop`
- [ ] Human revisou (PR mergeado)

## Notas para próximas sprints (lessons learned do dogfood 2)

- **Skills + commands carregam dinamicamente** — ao contrário de agents (Fase 0a precisou Reload Window). Reduz fricção em sprints futuras que adicionarem novos.
- **Hook `check-rules-tested.sh` (legado) continua com false-positives** em comandos bash complexos. Workaround: comandos simples em sequência, ou refresh stamp via `/firestore-rules-test`. Considerar refinamento do matcher em sprint futura.
- **`/compact` não recarrega `.claude/agents/`** (descoberta Fase 0a — capturada em `HARNESS-RUNBOOK.md` num refinamento futuro).
- **Validator agent 4 passes intermediários** funcionou bem. Cada wave fechada com PASS antes da próxima evitou retrabalho. Tempo total da sprint: ~3-4h efetivas para 37 items.
- **Dogfood validou os 7 skills + 13 commands** — escopo coerente, anti-patterns documentados em todos os artifacts, cross-refs íntegras.
- **Convenção warn-only vs hard-block** em 3 hooks (check-progress-updated, check-sensors-passed, check-implementer-not-validator): decisão pragmática para evitar atrito durante uso real. Documentado inline em cada hook como "troque exit 0 por exit 2 para forçar".

## Para fechar (próximas ações imediatas)

1. Commit final da Wave 4 (hooks + settings.json + smoke + PROGRESS update)
2. Update PROGRESS.md frontmatter: `status: in-progress` → `status: done`
3. Update EXECUTION-CHECKLIST.md: Fase 0b → ✅ COMPLETA
4. Update CHANGES.md com entry datada
5. Push branch `feat/redesign-foundation-tooling`
6. Open PR para `develop`
