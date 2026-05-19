---
sprint-id: "0b"
name: "foundation-tooling"
started: "2026-05-19"
status: in-progress
current-step: implement
---

# Sprint 0b — foundation-tooling — PROGRESS

> Memory artifact. Bootstrap script lê este arquivo PRIMEIRO ao iniciar nova session.

## Status

| Field | Value |
|---|---|
| Branch | `feat/redesign-foundation-tooling` |
| Base | `develop` (Fases -1 e 0a já mergeadas) |
| Last commit | _pending — Wave 1 a commitar_ |
| Tests | `cd packages/shared && bun run test` → 195/195 verde ✅ |
| Build | `bun run typecheck` → verde ✅ |
| Blockers | nenhum |

## Sessions log

### 2026-05-19 — Session 1: setup + planejamento

- [x] PRs #3 e #4 mergeados em develop (Fase -1 + Fase 0a closed)
- [x] Branches `feat/redesign-foundation-schemas` e `feat/redesign-foundation-harness` deletadas (local + remoto) com autorização do usuário
- [x] Branch nova criada: `feat/redesign-foundation-tooling`
- [x] Baseline check: confirmado `AGENTS.md`, `CLAUDE.md`, `src/AGENTS.md`, `functions/AGENTS.md` existem (atualizar); `packages/shared/AGENTS.md` e `scripts/hooks/` inexistem (criar)
- [x] Scope confirmado contra `EXECUTION-CHECKLIST.md:204-281` — 33 artefatos + 1 update settings.json + 1 smoke = 35 items
- [x] Estratégia confirmada com usuário: 1 sprint + 4 waves internas + validator+sensores em cada wave
- [x] `bash scripts/harness/new-sprint.sh 0b foundation-tooling` rodado — scaffold criado
- [x] SPEC.md preenchido (outcomes, scope in/out, constraints, prior decisions, task breakdown 4 waves, verification criteria)
- [x] CONTRACT.md preenchido com 37 items distribuídos em 5 waves; `status: locked`
- [x] **Wave 1 entregue** (5 itens): src/AGENTS.md (current vs target + i18n), functions/AGENTS.md (Idempotência + Structured logging com code samples), packages/shared/AGENTS.md (criado, 4-step flow + Zod 4 idioms + strict subsets), AGENTS.md root (sub-AGENTS links + Current/Target stack + 16 princípios + Sprint workflow), CLAUDE.md root (refs para redesign/, research/, specs/, HARNESS-RUNBOOK)
- [x] **Wave 1 sensores**: 5/5 grep acceptance tests PASS, typecheck exit 0, test packages/shared 195/195 ✅
- [x] **Wave 1 validator**: agent PASS com evidências linha-por-linha (sem issues)
- [ ] Próximo: Wave 2 (7 skills novas)

## Decisions taken

- **Hooks NOVOS vão em `scripts/hooks/`** (pasta nova, não em `scripts/firebase/`) — convenção do checklist linha 255. Razão: separa hooks de "harness/redesign" dos hooks Firebase legados, sem refactor.
- **`functions/AGENTS.md` já existia** (checklist dizia "criar"): tratar como update enriquecendo seções "Idempotência" e "Structured logging". Razão: arquivo robusto (154 linhas), não vale reescrever; apenas complementar.
- **Validator agent ao fim de cada wave**: confirmação inferencial via Agent(validator, ...) antes de commit. Razão: usuário pediu explicitamente; e dogfood do harness.
- **CONTRACT lock direto** (sem ciclo Implementer↔Validator de negociação): o escopo veio da EXECUTION-CHECKLIST (já validado no plano mestre) + confirmação explícita do usuário. Razão: o ciclo de negociação é para escopo ambíguo; aqui o escopo é explícito.
- **Estimativa 3 dias** (mais ajustado que os 3-5 do checklist): 35 items, mas a maioria é `.md` curto + bash script pequeno. Razão: experiência da Fase 0a (19 itens em 1 sessão).

## Blockers / risks

- Nenhum blocker.
- **Risk**: escopo de 35 itens pode escapar para "alucinar". Mitigação: cada wave fecha com validator agent + sensores antes de seguir; CONTRACT é a fonte da verdade.
- **Risk**: false-positive do hook `check-rules-tested.sh` em comandos bash complexos (já documentado). Mitigação: comandos simples; smoke test Wave 4 pode considerar matcher mais preciso para o novo `check-no-hardcoded-literal.sh`.

## Tests/build status

```text
cd packages/shared && bun run test    →  195/195 verde (baseline pós-merge develop) ✅
bun run typecheck                      →  verde ✅
bun run lint                           →  pendente (verificar após Wave 1)
```

## Next steps

1. Wave 1: atualizar 3 sub-AGENTS (`src/`, `functions/`, `packages/shared/`) + 2 root docs (`AGENTS.md`, `CLAUDE.md`)
2. Validator agent verifica Wave 1
3. Sensores: typecheck + test + lint
4. Commit Wave 1
5. Repetir para Waves 2, 3, 4
6. EVALUATION.md verdict pass + push + PR para develop
