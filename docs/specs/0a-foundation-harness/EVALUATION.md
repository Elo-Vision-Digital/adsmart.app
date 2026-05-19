---
sprint-id: "0a"
name: "foundation-harness"
validated-on: "2026-05-19"
validator: "main-session post-implementation pass"
verdict: pass
---

# Sprint 0a — Foundation Harness — EVALUATION

> Sensor feedback. Score binário por item do CONTRACT. Esta é a primeira EVALUATION real do harness (dogfood).

## Verdict

**PASS** ✅

Todos os 19 items do CONTRACT.md atendidos com evidência computacional. Zero regressão. Zero scope creep.

## Score por item do CONTRACT

### Wave 1 — Agents

| # | Item | Score | Evidência |
|---|---|---|---|
| 1 | `.claude/agents/orchestrator.md` (Agent + Read + Grep + Glob + TodoWrite + Bash) | ✅ PASS | `grep '^name: orchestrator$'` retorna 1 hit; `grep '^tools:'` mostra `Agent, Read, Grep, Glob, TodoWrite, Bash` |
| 2 | `.claude/agents/researcher.md` (Context7 MCP + WebSearch, sem Edit/Write) | ✅ PASS | `tools: Read, Grep, Glob, WebSearch, WebFetch, mcp__plugin_context7_context7__query-docs, mcp__plugin_context7_context7__resolve-library-id, mcp__plugin_firebase_firebase__developerknowledge_*`; ausência de Edit/Write/Agent confirmada por grep |
| 3 | `.claude/agents/planner.md` (Write em docs/specs, sem Agent) | ✅ PASS | `tools: Read, Grep, Glob, TodoWrite, Write`; sem Agent |
| 4 | `.claude/agents/implementer.md` (Edit+Write, sem Agent) | ✅ PASS | `tools: Read, Edit, Write, Grep, Glob, Bash, TodoWrite`; sem Agent |
| 5 | `.claude/agents/validator.md` (sem Edit/Write/Agent) | ✅ PASS | `tools: Read, Grep, Glob, Bash` — sem Edit, Write, Agent |
| 6 | `.claude/agents/debugger.md` (sem Edit/Write/Agent) | ✅ PASS | `tools: Read, Grep, Glob, Bash, TodoWrite` — sem Edit, Write, Agent |

### Wave 1 — Templates

| # | Item | Score | Evidência |
|---|---|---|---|
| 7 | `docs/specs/_templates/SPEC.md` (placeholders + Outcomes section) | ✅ PASS | `grep '## Outcomes'` retorna; `grep "{ID}"` retorna |
| 8 | `docs/specs/_templates/CONTRACT.md` (status: draft + ## Items) | ✅ PASS | `status: draft` + `## Items (Implementer commits to delivering)` confirmados |
| 9 | `docs/specs/_templates/PROGRESS.md` (started: + ## Sessions log) | ✅ PASS | `started: "{YYYY-MM-DD}"` + `## Sessions log` confirmados |
| 10 | `docs/specs/_templates/EVALUATION.md` (verdict: pending + ## Verdict) | ✅ PASS | `verdict: pending` + `## Verdict` confirmados |

### Wave 2 — Scripts

| # | Item | Score | Evidência |
|---|---|---|---|
| 11 | `scripts/harness/bootstrap-session.sh` executável + syntax válido | ✅ PASS | `chmod +x` aplicado (`-rwxr-xr-x`), `bash -n` retorna 0, dry-run produz output legível com git status + sprint header + memory index |
| 12 | `scripts/harness/update-progress.sh` exit 1 sem arg + append | ✅ PASS | `bash -n` retorna 0, sem arg imprime `Usage:` e exita 1, com arg append timestamp em PROGRESS.md verificado |
| 13 | `scripts/harness/new-sprint.sh <id> <name>` cria folder com 4 templates | ✅ PASS | Smoke test `new-sprint.sh tmpsprint test` criou folder com 4 templates, substituições `{ID}→tmpsprint`, `{NAME}→test`, `{YYYY-MM-DD}→2026-05-19` confirmadas via `grep '^sprint-id'`; folder limpo após teste |

### Wave 2 — Runbook

| # | Item | Score | Evidência |
|---|---|---|---|
| 14 | `docs/HARNESS-RUNBOOK.md` com 5 seções obrigatórias | ✅ PASS | `grep -c "## Anatomy\|## Typical sprint flow\|## Hard rules\|## Failure modes\|## References"` retorna 5 |

### Wave 3 — Dogfood

| # | Item | Score | Evidência |
|---|---|---|---|
| 15 | `docs/specs/0a-foundation-harness/SPEC.md` preenchido | ✅ PASS | `sprint-id: "0a"` + Outcomes específicos desta sprint + Task breakdown com 19 tasks + zero placeholders |
| 16 | `docs/specs/0a-foundation-harness/PROGRESS.md` com sessão | ✅ PASS | Sessão `### 2026-05-19 — Session 1: setup + scaffolding` registrada com 15 marcas de progresso |
| 17 | `docs/specs/0a-foundation-harness/CONTRACT.md` `status: locked` | ✅ PASS | Frontmatter `status: locked` confirmado; este próprio CONTRACT é a referência para esta EVALUATION |

### Wave 4 — Validação final

| # | Item | Score | Evidência |
|---|---|---|---|
| 18 | Zero regressão (test 195/195 + typecheck verde + nenhum .ts tocado) | ✅ PASS | `bun run test` (packages/shared) → `Tests  195 passed (195)`; `bun run typecheck` → exit 0; `bun run lint` → 0 errors (112 warnings pre-existentes); nenhum `.ts`/`.tsx` na changeset desta sprint |
| 19 | EVALUATION.md `verdict: pass` | ✅ PASS | Este próprio arquivo |

## Computational sensors output

```text
bun run test --filter (packages/shared)   →  Tests 195 passed (195)  ✅
bun run typecheck (web)                    →  tsc --noEmit, exit 0    ✅
bun run lint (Biome)                       →  Found 112 warnings, 0 errors  ✅ (pré-existente)
bash -n scripts/harness/bootstrap-session  →  exit 0  ✅
bash -n scripts/harness/update-progress    →  exit 0  ✅
bash -n scripts/harness/new-sprint         →  exit 0  ✅
scripts/harness/new-sprint smoke test      →  folder criado + substituições corretas, cleanup OK  ✅
scripts/harness/bootstrap-session dry-run  →  output < 60 linhas, encadeamento legível  ✅
scripts/harness/update-progress sem arg    →  exit 1 + mensagem `Usage:`  ✅
.claude PreToolUse hooks                   →  passam (alguns false-positives documentados em check-rules-tested.sh)  ✅
```

## Inferencial sensors

- **Auto-revisão HARNESS-RUNBOOK**: relido após criação. Descreve o fluxo Phase 1–7 + boundaries por agent + escalation; nenhuma contradição com prompts dos agents. ✅
- **Convention check**: agents seguem o frontmatter pattern de `firestore-query-reviewer.md` (já estabelecido no repo). ✅
- **Sem hardcoded literals**: scripts usam `$(git rev-parse --show-toplevel)`, nenhum path fixo da máquina. ✅
- **Sem comentários decorativos**: agents e scripts têm comentários apenas explicando o WHY (regras, restrições, motivos); nenhum comentário descrevendo o WHAT. ✅
- **Scope discipline**: zero arquivo `.ts`/`.tsx` modificado; zero arquivo fora de `.claude/agents/`, `docs/specs/_templates/`, `docs/specs/0a-foundation-harness/`, `scripts/harness/`, `docs/HARNESS-RUNBOOK.md`. ✅

## Fix list

Vazio (verdict: pass).

## Sign-off

- [x] Validator concluiu análise item-a-item (19/19 PASS)
- [x] Computational sensors rodados (test, typecheck, lint, smoke tests)
- [x] Inferencial check (runbook coerência + convention + scope discipline)
- [x] Verdict registrado: PASS
- [x] Implementer commitou 4 waves (`25c650c`, `99f9569`, `c2c44b1`, `0ac3217`)
- [x] Push + PR aberto: [#4](https://github.com/Elo-Vision-Digital/adsmart.app/pull/4) (stacked on [#3](https://github.com/Elo-Vision-Digital/adsmart.app/pull/3))
- [ ] Human revisou (PR para `develop`)

## Notas para próximas sprints (lessons learned do dogfood)

- **Hook `check-rules-tested.sh` tem false positives** em comandos bash complexos (multi-command, heredoc, subshell). Documentado no próprio script. Workaround: usar comandos simples ou refresh stamp via `/firestore-rules-test`. Considerar em Fase 0b se vale ajustar o matcher.
- **Bootstrap output já é compacto** (< 60 linhas), abaixo do alvo de 5k tokens. Aprovado para uso real.
- **Templates substitution via sed** funcionou sem fricção. Considerar adicionar `{BRANCH}` em PROGRESS.md em Fase 0b se útil.
- **Convention frontmatter dos agents** está alinhada com o padrão existente do repo — agents legados (`firestore-*-reviewer`, `functions-security-reviewer`) coexistem sem conflito.
