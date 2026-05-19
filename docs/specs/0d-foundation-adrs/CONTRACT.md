---
sprint-id: "0d"
name: "foundation-adrs"
negotiated-on: "2026-05-19"
parties:
  implementer: "main session (Claude Opus 4.7) + 2 wave validator passes + 1 final"
  validator: ".claude/agents/validator.md (multi-process, fresh context per wave)"
status: locked
---

# Sprint 0d — foundation-adrs — CONTRACT

> Locked. Validator bate item-a-item após cada wave + ao fim da sprint.

## Items (Implementer commits to delivering)

Cada ADR deve ter: `## ADR-NNN: Title`, `**Date:** 2026-05-19`, `**Status:**` (Accepted ou Planned), `**Decision:**`, `**Rationale:**`, `**Trade-offs:**` (opcional mas recomendado), separador `---` no fim. Append-only ao final de `docs/Decisions.md`.

### Wave 1 — ADRs de domínio (6 items)

| # | Item | Status alvo | Acceptance test |
|---|---|---|---|
| 1 | ADR-022: Render in-app substitui Google Data Studio | Planned (Fase 3.5) | `grep -q '^## ADR-022:' docs/Decisions.md && grep -A1 '^## ADR-022:' docs/Decisions.md \| grep -q 'Data Studio\|Looker'` |
| 2 | ADR-023: Sistema de Créditos (1 cr = R$5, 1 plataforma = 1 cr) | Planned (Fase 3.5) | `grep -q '^## ADR-023:' docs/Decisions.md && grep -A20 '^## ADR-023:' \| grep -q 'R\$5\|crédito'` |
| 3 | ADR-024: LLM combo Anthropic + DeepSeek | Planned (Fase 3.5) | `grep -q '^## ADR-024:' docs/Decisions.md && grep -A20 '^## ADR-024:' \| grep -q 'Anthropic.*DeepSeek\|research/02'` |
| 4 | ADR-025: Share-link via UUID v4 + snapshot | Planned (Fase 3.5) | `grep -q '^## ADR-025:' docs/Decisions.md && grep -A20 '^## ADR-025:' \| grep -q 'UUID\|research/04'` |
| 5 | ADR-026: Playwright em Cloud Function para PDF | Planned (Fase 3.5) | `grep -q '^## ADR-026:' docs/Decisions.md && grep -A20 '^## ADR-026:' \| grep -q 'Playwright\|research/05'` |
| 6 | ADR-027: Tailwind v4 + Apple SF Pro como design system | Planned (Fase 1) | `grep -q '^## ADR-027:' docs/Decisions.md && grep -A20 '^## ADR-027:' \| grep -q 'Tailwind v4\|SF Pro'` |

### Wave 2 — ADRs de Harness Engineering (6 items)

| # | Item | Status alvo | Acceptance test |
|---|---|---|---|
| 7 | ADR-028: Adotar Harness Engineering (Fowler taxonomy) | Accepted | `grep -q '^## ADR-028:' docs/Decisions.md && grep -A20 '^## ADR-028:' \| grep -q 'Harness\|Fowler\|research/09'` |
| 8 | ADR-029: Multi-process agents (Implementer ≠ Validator) | Accepted | `grep -q '^## ADR-029:' docs/Decisions.md && grep -A20 '^## ADR-029:' \| grep -q 'Implementer\|Validator'` |
| 9 | ADR-030: Contracts negotiation antes da execução | Accepted | `grep -q '^## ADR-030:' docs/Decisions.md && grep -A20 '^## ADR-030:' \| grep -q 'CONTRACT'` |
| 10 | ADR-031: Progress files + Bootstrap script | Accepted | `grep -q '^## ADR-031:' docs/Decisions.md && grep -A20 '^## ADR-031:' \| grep -q 'PROGRESS\|bootstrap'` |
| 11 | ADR-032: Sensor enforcement via hooks (score binário) | Accepted | `grep -q '^## ADR-032:' docs/Decisions.md && grep -A20 '^## ADR-032:' \| grep -q 'hooks\|sensor'` |
| 12 | ADR-033: Estrutura de specs por sprint | Accepted | `grep -q '^## ADR-033:' docs/Decisions.md && grep -A20 '^## ADR-033:' \| grep -q 'SPEC\|CONTRACT\|EVALUATION'` |

### Wave 3 — Validação final (2 items)

| # | Item | Depende de | Acceptance test |
|---|---|---|---|
| 13 | Zero regressão: `cd packages/shared && bun run test` 195/195; typecheck verde; lint 0 errors; zero `.ts`/`.tsx` modificado | 1-12 | sensores + `git diff --stat $(git merge-base HEAD origin/develop) HEAD -- '*.ts' '*.tsx' \| wc -l` retorna só linha total |
| 14 | EVALUATION.md `verdict: pass` | 13 | `grep -q 'verdict: pass' docs/specs/0d-foundation-adrs/EVALUATION.md` |

## Out of scope (explicit)

- [ ] Cleanup textual em docs/UI (Asaas/SuitPay/Data Studio) → **Fase 0.5**
- [ ] Implementar features mencionadas (LLM combo real, credits, share link, PDF, etc.) → **Fases 3.5+**
- [ ] Refactor de ADRs existentes (ADR-001 a ADR-021)
- [ ] Atualizar `docs/research/*` (research já publicada)
- [ ] Mudanças em código TS/TSX
- [ ] Mudanças em `firestore.rules`/indexes

## Sensors a rodar

### Computacionais (bloqueantes ao fim de cada wave)

- [ ] `grep -cE '^## ADR-0(2[2-9]|3[0-3]):' docs/Decisions.md` — número esperado por wave (W1: 6 / W2: 12 total)
- [ ] `cd packages/shared && bun run test` — 195/195 verde (Wave 3)
- [ ] `bun run typecheck` — verde (Wave 3)
- [ ] `bun run lint` — 0 errors (Wave 3)
- [ ] Pre-commit hooks via `git commit` — passam (cada wave)

### Inferenciais (ao fim de cada wave)

- [ ] `Agent(validator, "verificar Wave N: cada ADR-NNN tem Context+Decision+Rationale+Trade-offs+Status; cross-link com research/* válido; tom conciso (15-30 linhas); não duplica conteúdo de research/memórias")` retorna PASS antes de seguir.

## Sign-off

- [ ] Implementer assinou — 2 commits (1 por wave) pushed + 1 closing commit
- [ ] Validator assinou (2 passes intermediários + 1 final) — EVALUATION.md `verdict: pass`
- [ ] Human revisou — PR aberto e mergeado em develop
