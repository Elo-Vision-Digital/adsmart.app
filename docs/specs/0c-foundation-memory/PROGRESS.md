---
sprint-id: "0c"
name: "foundation-memory"
started: "2026-05-19"
status: in-progress
current-step: implement
---

# Sprint 0c — foundation-memory — PROGRESS

> Memory artifact. Bootstrap script lê este arquivo PRIMEIRO ao iniciar nova session.

## Status

| Field | Value |
|---|---|
| Branch | `feat/redesign-foundation-memory` |
| Base | `develop` (Fases -1, 0a, 0b mergeadas) |
| Last commit | _pending — Wave 1 a commitar_ |
| Tests | `cd packages/shared && bun run test` → 195/195 verde ✅ (pós-merge develop) |
| Build | `bun run typecheck` → verde ✅ |
| Blockers | nenhum |

## Sessions log

### 2026-05-19 — Session 1: setup + planejamento

- [x] PR #5 (Fase 0b) mergeado em develop em `5f00ddf`
- [x] Reload Window — hooks novos da Fase 0b agora ativos (8 PreToolUse extras)
- [x] develop local sync via fast-forward (5 commits)
- [x] Branch `feat/redesign-foundation-tooling` deletada (local + remoto)
- [x] Branch nova: `feat/redesign-foundation-memory`
- [x] Sprint folder scaffolded via `bash scripts/harness/new-sprint.sh 0c foundation-memory`
- [x] Leitura das memórias existentes (10 `.md` + MEMORY.md index)
- [x] Escopo confirmado contra `EXECUTION-CHECKLIST.md:284-322`: 1 delete + 3 updates + 10 creates + MEMORY index = 14 + Wave 3 (validação 2) = 16 items
- [x] Decisões confirmadas (2026-05-19): (a) deletar `suitpay_deprecated.md`; (b) memórias planejadas com `status: planned`; (c) 1 sprint + 2 waves
- [x] SPEC.md preenchido + CONTRACT.md `status: locked`
- [ ] Próximo: Wave 1 (4 items) → validator → commit → Wave 2 (10 items)

## Decisions taken

- **Delete suitpay_deprecated.md** (não arquivar): SuitPay foi removido em ADR-021; manter memória só confunde; histórico em `docs/Decisions.md` + `docs/CHANGES.md`.
- **status: planned** em memórias de features ainda não implementadas: documenta a decisão; atualizar para `active` quando o feature merge.
- **Sub-fases por wave**: W1 cleanup (4) → W2 creates (10) → W3 validação (2). Validator ao fim de W1 e W2.

## Blockers / risks

- Nenhum.
- **Risk**: memórias `status: planned` podem virar tech-debt se features divergirem. Mitigação: link explícito para sprint que vai implementar.
- **Risk**: path da pasta de memórias contém username. Mitigação: hooks usam `$CLAUDE_PROJECT_DIR`.

## Tests/build status

```text
cd packages/shared && bun run test    →  195/195 verde ✅
bun run typecheck                      →  verde ✅
bun run lint                           →  0 errors ✅
```

## Next steps

1. Wave 1: deletar suitpay + atualizar 3 memórias (firebase_secrets, admin_overhaul_roadmap, MEMORY.md)
2. Validator Wave 1 + commit
3. Wave 2: criar 10 memórias novas
4. Validator Wave 2 + commit
5. EVALUATION verdict pass + EXECUTION-CHECKLIST + CHANGES.md
6. Push + PR para develop
