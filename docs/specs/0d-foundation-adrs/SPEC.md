---
sprint-id: "0d"
name: "foundation-adrs"
status: contract
depends-on: ["-1", "0a", "0b", "0c"]
est-days: 1
references:
  - docs/redesign/EXECUTION-CHECKLIST.md
  - docs/research/01-firebase-stack.md
  - docs/research/02-llm-strategy.md
  - docs/research/03-frontend-stack.md
  - docs/research/04-share-link-patterns.md
  - docs/research/05-pdf-generation.md
  - docs/research/09-harness-engineering.md
---

# Sprint 0d — foundation-adrs — SPEC

> Publicação de 12 ADRs registrando decisões arquiteturais críticas do redesign roadmap em `docs/Decisions.md`. Quarta dogfood do harness (após 0a, 0b, 0c).

## Outcomes

- [ ] **12 ADRs novos publicados** em `docs/Decisions.md` (ADR-022 a ADR-033), seguindo o padrão estabelecido (`## ADR-NNN: Title` + `**Date**` + `**Status**` + Decision + Rationale + Trade-offs).
- [ ] **6 ADRs de domínio** (ADR-022 a ADR-027):
  - ADR-022: Render in-app substitui Google Data Studio
  - ADR-023: Sistema de Créditos (1 cr = R$5, 1 plataforma = 1 cr, sem subscription inicial)
  - ADR-024: LLM combo Anthropic + DeepSeek com roteamento por tarefa
  - ADR-025: Share-link público via UUID v4 + snapshot em subcoleção
  - ADR-026: Playwright em Cloud Function para Export PDF
  - ADR-027: Tailwind v4 + Apple SF Pro como design system
- [ ] **6 ADRs de Harness Engineering** (ADR-028 a ADR-033):
  - ADR-028: Adotar Harness Engineering (Fowler taxonomy)
  - ADR-029: Multi-process agents (Implementer ≠ Validator)
  - ADR-030: Contracts negotiation antes da execução
  - ADR-031: Progress files + Bootstrap script (memory entre sessions)
  - ADR-032: Sensor enforcement via hooks bloqueantes (score binário)
  - ADR-033: Estrutura de specs por sprint
- [ ] **Cada ADR** tem: Context · Decision · Consequences (Trade-offs) · Status (Accepted/Planned/Deferred) + cross-link com `docs/research/*.md` correspondente quando aplicável.
- [ ] **Zero regressão** nos sensores (test 195/195, typecheck verde, lint 0 errors).
- [ ] **Dogfood**: a própria sprint executa via harness (sprint folder, 2 waves, validator+sensores).

## Scope

### In

- Criar 12 ADRs novos (ADR-022 a ADR-033) em `docs/Decisions.md`, append-only no fim do arquivo.
- Cada ADR segue padrão do repo (linha 7-25 de Decisions.md como referência).
- Cross-link com `docs/research/*.md` quando research fundamenta a decisão.
- Cross-link com memórias (em `~/.claude/projects/.../memory/`) quando o ADR corresponde a uma memória existente — referência via texto descritivo, não link clicável (memórias são state local).

### Out

- **Cleanup textual em docs/UI mencionando legacy** → Fase 0.5
- **Implementar features mencionadas nos ADRs** (LLM combo real, credits system, Playwright PDF, etc.) → Fases 3.5+
- **Refactor de ADRs existentes** (ADR-001 a ADR-021): manter como estão, apenas append.
- **Mudanças em código TS/TSX da app** — esta sprint é apenas `docs/Decisions.md`
- **Mudanças em `firestore.rules`/indexes**
- **Atualizar `docs/research/*`** — research já foi publicada em fases anteriores; ADRs apenas referenciam.

## Constraints

| Tipo | Restrição |
|---|---|
| Formato | Cada ADR: `## ADR-NNN: Title` + `**Date:** YYYY-MM-DD` + `**Status:** Accepted | Planned | Deferred` + Decision + Rationale + Trade-offs (quando aplicável). Separador `---` entre ADRs. |
| Status correto | "Accepted" se decidido + applicável já; "Planned" se decisão tomada mas implementação futura; "Deferred" se postponed; "Superseded by ADR-NNN" se substituído. |
| Cross-link | Toda decisão fundamentada em research cita o arquivo: ex. `See docs/research/02-llm-strategy.md`. |
| Não duplicar conteúdo | ADR é a DECISÃO + razão sucinta; detalhes implementação vivem nos arquivos relevantes (memórias, research, código). |
| Não temos usuários em prod | irrelevante para esta sprint (só docs) |
| Zero regressão | sensores existentes continuam verdes |

## Prior decisions

- **Append-only** em `docs/Decisions.md`: nunca editar ADRs passados (linha 8 do arquivo "Append-only log of significant changes"). Se uma decisão antiga estiver obsoleta, marcar como "Superseded by ADR-NNN" + criar ADR novo.
- **Numeração sequencial**: último ADR no repo é ADR-021. Novos vão de ADR-022 a ADR-033.
- **Source of truth** para cada decisão já existe em outros artifacts (research/, memórias, FEATURES-INVENTORY). ADR é o "registro permanente público" da decisão.
- **Cross-link com memórias**: ADRs sobre features `status: planned` (LLM, credits, share link, PDF) DEVEM cross-link com a memória correspondente (referência textual, ex: "See memory `llm_combo_strategy`").
- **2 waves**: Wave 1 = ADRs de domínio (022-027); Wave 2 = ADRs de Harness Engineering (028-033). Validator ao fim de cada.
- **Tom**: cada ADR é tão curto quanto possível (15-30 linhas). Decisão clara, razão concisa, trade-offs honestos. Sem prosa decorativa.

## Task breakdown

2 waves + validação final.

### Wave 1 — ADRs de domínio (6 items, ~2h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | ADR-022 (Render in-app substitui Data Studio) | — | grep encontra `^## ADR-022:` em Decisions.md |
| 2 | ADR-023 (Sistema de Créditos) | — | grep `^## ADR-023:` |
| 3 | ADR-024 (LLM combo) | — | grep `^## ADR-024:` + ref a research/02 |
| 4 | ADR-025 (Share-link) | — | grep `^## ADR-025:` + ref a research/04 |
| 5 | ADR-026 (Playwright PDF) | — | grep `^## ADR-026:` + ref a research/05 |
| 6 | ADR-027 (Tailwind v4 + SF Pro) | — | grep `^## ADR-027:` + ref a research/03 |

### Wave 2 — ADRs de Harness (6 items, ~2h)

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 7 | ADR-028 (Harness Engineering) | — | grep `^## ADR-028:` + ref a research/09 |
| 8 | ADR-029 (Multi-process agents) | — | grep `^## ADR-029:` |
| 9 | ADR-030 (Contracts negotiation) | — | grep `^## ADR-030:` |
| 10 | ADR-031 (Progress files + bootstrap) | — | grep `^## ADR-031:` |
| 11 | ADR-032 (Sensor enforcement via hooks) | — | grep `^## ADR-032:` |
| 12 | ADR-033 (Estrutura de specs por sprint) | — | grep `^## ADR-033:` |

### Wave 3 — Validação final

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 13 | Zero regressão | 1-12 | test 195/195; typecheck verde; lint 0 errors |
| 14 | EVALUATION verdict pass | 13 | `grep -q 'verdict: pass' EVALUATION.md` |

## Verification criteria

| Outcome | Sensor | Comando |
|---|---|---|
| 12 ADRs novos | Computacional | `grep -cE '^## ADR-0(2[2-9]\|3[0-3]):' docs/Decisions.md` → 12 |
| Padrão correto | Computacional | cada ADR tem `**Date:**` + `**Status:**` |
| Cross-links | Inferencial | `Agent(validator, "verificar cada ADR cita research/* quando aplicável")` |
| Zero regressão | Computacional | test + typecheck + lint |

## References

- `docs/redesign/EXECUTION-CHECKLIST.md` § FASE 0d (linha 327-358)
- `docs/Decisions.md` (ADR-001 a ADR-021 como referência de padrão)
- `docs/research/01-firebase-stack.md` (fundamenta ADR-022)
- `docs/research/02-llm-strategy.md` (fundamenta ADR-024)
- `docs/research/03-frontend-stack.md` (fundamenta ADR-027)
- `docs/research/04-share-link-patterns.md` (fundamenta ADR-025)
- `docs/research/05-pdf-generation.md` (fundamenta ADR-026)
- `docs/research/09-harness-engineering.md` (fundamenta ADR-028 a ADR-033)
- Memórias relevantes: `llm_combo_strategy`, `credits_system`, `share_link_pattern`, `playwright_pdf`, `harness_pattern`, `multi_process_agents`, `progress_files_discipline`
