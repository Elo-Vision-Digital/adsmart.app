---
sprint-id: "0d"
name: "foundation-adrs"
started: "2026-05-19"
status: done
current-step: ship
---

# Sprint 0d — foundation-adrs — PROGRESS

> Memory artifact. Bootstrap lê este primeiro.

## Status

| Field | Value |
|---|---|
| Branch | `feat/redesign-foundation-adrs` (stacked on `feat/redesign-foundation-memory` aguardando merge PR #6) |
| Base | `feat/redesign-foundation-memory` (será retargetado para `develop` após merge do PR #6) |
| Last commit | _pending — Wave 1 a commitar_ |
| Tests | `cd packages/shared && bun run test` → 195/195 ✅ (baseline pós-merges anteriores) |
| Build | `bun run typecheck` → verde ✅ |
| Blockers | nenhum |

## Sessions log

### 2026-05-19 — Session 1: setup + planejamento

- [x] PR #6 (Fase 0c foundation-memory) aberto (mergeado posteriormente)
- [x] Branch nova `feat/redesign-foundation-adrs` stacked sobre `feat/redesign-foundation-memory`
- [x] Sprint folder scaffolded via `bash scripts/harness/new-sprint.sh 0d foundation-adrs`
- [x] Inspeção do padrão de ADRs existentes (ADR-001 a ADR-021): `## ADR-NNN: Title` + `**Date**` + `**Status**` + Decision + Rationale + Trade-offs
- [x] Escopo confirmado contra `EXECUTION-CHECKLIST.md:327-358`: 12 ADRs novos (ADR-022 a ADR-033) em 2 grupos (domínio + harness)
- [x] SPEC.md preenchido + CONTRACT.md `status: locked`
- [ ] Próximo: Wave 1 (ADR-022 a ADR-027 — domínio) → validator → commit → Wave 2 (ADR-028 a ADR-033 — harness)

## Decisions taken

- **Numeração**: último ADR existente é ADR-021. Novos ADRs vão de ADR-022 a ADR-033 (12 total).
- **Status alvo**: ADRs de domínio = `Planned` (feature ainda não implementada, Fase 3.5 ou Fase 1); ADRs de harness = `Accepted` (já implementado nas Fases 0a/0b/0c).
- **Tom**: cada ADR 15-30 linhas — decisão clara, razão concisa, trade-offs honestos. Sem prosa decorativa.
- **Cross-links**: cada ADR de domínio (LLM, share link, PDF, etc.) referência `docs/research/NN-*.md` correspondente. ADRs de harness referenciam research/09.
- **Stacked branch**: sobre `feat/redesign-foundation-memory` para não bloquear; retargeta para `develop` após merge do PR #6.

## Blockers / risks

- Nenhum blocker.
- **Risk**: conflito de merge em `EXECUTION-CHECKLIST.md` ao retargetar. Mitigação: trivial — ambos editam a tabela Status Geral, resolução manual rápida.

## Tests/build status

```text
cd packages/shared && bun run test    →  195/195 ✅
bun run typecheck                      →  verde ✅
bun run lint                           →  0 errors ✅
```

## Next steps

1. Wave 1: 6 ADRs de domínio (ADR-022 a ADR-027)
2. Validator Wave 1 + commit
3. Wave 2: 6 ADRs de harness (ADR-028 a ADR-033)
4. Validator Wave 2 + commit
5. EVALUATION verdict pass + EXECUTION-CHECKLIST + CHANGES.md
6. Push + PR para develop (ou para feat/redesign-foundation-memory inicialmente)
