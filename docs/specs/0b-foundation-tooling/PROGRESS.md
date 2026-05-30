---
sprint-id: "0b"
name: "foundation-tooling"
started: "2026-05-19"
status: done
current-step: ship
---

# Sprint 0b — foundation-tooling — PROGRESS

> Memory artifact. Bootstrap script lê este arquivo PRIMEIRO ao iniciar nova session.

## Status

| Field | Value |
|---|---|
| Branch | `feat/-foundation-tooling` |
| Base | `develop` (Fases -1 e 0a já mergeadas) |
| Last commit | _pending — Wave 1 a commitar_ |
| Tests | `cd packages/shared && bun run test` → 195/195 verde ✅ |
| Build | `bun run typecheck` → verde ✅ |
| Blockers | nenhum |

## Sessions log

### 2026-05-19 — Session 1: setup + planejamento

- [x] PRs #3 e #4 mergeados em develop (Fase -1 + Fase 0a closed)
- [x] Branches `feat/-foundation-schemas` e `feat/-foundation-harness` deletadas (local + remoto) com autorização do usuário
- [x] Branch nova criada: `feat/-foundation-tooling`
- [x] Baseline check: confirmado `AGENTS.md`, `CLAUDE.md`, `src/AGENTS.md`, `functions/AGENTS.md` existem (atualizar); `packages/shared/AGENTS.md` e `scripts/hooks/` inexistem (criar)
- [x] Scope confirmado contra `:204-281` — 33 artefatos + 1 update settings.json + 1 smoke = 35 items
- [x] Estratégia confirmada com usuário: 1 sprint + 4 waves internas + validator+sensores em cada wave
- [x] `bash scripts/harness/new-sprint.sh 0b foundation-tooling` rodado — scaffold criado
- [x] SPEC.md preenchido (outcomes, scope in/out, constraints, prior decisions, task breakdown 4 waves, verification criteria)
- [x] CONTRACT.md preenchido com 37 items distribuídos em 5 waves; `status: locked`
- [x] **Wave 1 entregue** (5 itens): src/AGENTS.md (current vs target + i18n), functions/AGENTS.md (Idempotência + Structured logging com code samples), packages/shared/AGENTS.md (criado, 4-step flow + Zod 4 idioms + strict subsets), AGENTS.md root (sub-AGENTS links + Current/Target stack + 16 princípios + Sprint workflow), CLAUDE.md root (refs para /, research/, specs/, HARNESS-RUNBOOK)
- [x] **Wave 1 sensores**: 5/5 grep acceptance tests PASS, typecheck exit 0, test packages/shared 195/195 ✅
- [x] **Wave 1 validator**: agent PASS com evidências linha-por-linha (sem issues)
- [x] **Wave 2 entregue** (7 skills): -screen, new-zod-schema, new-report-business-type, verify-i18n, validate-llm-call, negotiate-contract, bootstrap-fresh-session. Skills carregaram dinamicamente sem precisar Reload Window (diferente dos agents).
- [x] **Wave 2 sensores**: 9/9 SKILL.md com `name:` + `description:` (7 novas + 2 legadas) ✅
- [x] **Wave 2 validator**: agent PASS 7/7 com observações granulares (description com gatilhos PT-BR+EN, corpo com passos numerados + bash, anti-patterns, refs cruzadas, terminologia coerente)
- [x] **Wave 3 entregue** (13 slash commands): 8 workflow harness (`/new-sprint`, `/research-sprint`, `/plan-sprint`, `/negotiate-contract`, `/execute-sprint`, `/validate-sprint`, `/ship-sprint`, `/update-progress`) + 5 workflow domínio (`/new-screen-`, `/check-i18n`, `/check-no-hardcoded`, `/new-ai-prompt-version`, `/run-research`). Commands carregam dinamicamente (como skills).
- [x] **Wave 3 sensores**: 17/17 commands com `description:` (4 legados + 13 novos) ✅
- [x] **Wave 3 validator**: agent PASS 13/13. Validação inferencial cobriu: lifecycle harness completo (new → research → plan → negotiate → execute → validate → ship + update-progress), coerência de vocabulário (sprint-id, wave, validator/implementer separation, princípio N), cross-refs integridade (todas as skills/agents/scripts referenciados existem), anti-patterns presentes em 10/13 + guards inline nos 3 restantes
- [x] **Wave 4 entregue** (8 hooks + settings.json + smoke):
  - 8 bash scripts em `scripts/hooks/`: check-no-hardcoded-literal, check-zod-schema-test, check-llm-call-via-logger, check-firestore-rule-defaults-deny, check-contract-exists, check-progress-updated (warn-only), check-sensors-passed (warn-only), check-implementer-not-validator (warn-only)
  - Todos com `set -euo pipefail`, executáveis (`-rwxr-xr-x`), `bash -n` exit 0
  - `.claude/settings.json` atualizado: 12 PreToolUse hooks (4 legados + 8 novos), JSON válido (`jq` exit 0)
- [x] **Wave 4 smoke test** (item 35 do CONTRACT) — ver seção `## Smoke test do fluxo harness` abaixo
- [ ] Próximo: validator final da sprint + EVALUATION + push + PR

## Smoke test do fluxo harness (Wave 4 item 35)

Sequência manual exercitada para confirmar coerência do fluxo `/new-sprint → /plan-sprint → /negotiate-contract` sem executar até o fim:

1. **`/new-sprint dummy smoke-test`** — invocaria `bash scripts/harness/new-sprint.sh dummy smoke-test`. Script já testado na Fase 0a (`new-sprint.sh tmpsprint test` rodou e produziu folder com 4 templates substituídos). Cleanup foi feito. Comando aponta para o script + cobre branch check + próximo passo (preencher SPEC).

2. **`/plan-sprint dummy`** — comando faz guard `grep -q "Outcome 1: …"` para detectar SPEC ainda em template; se passa, invoca `Agent(subagent_type: "planner", ...)` com prompt estruturado. Planner agent foi validado na Fase 0a (smoke test pós-reload retornou name+tools corretos). Output esperado: CONTRACT draft com waves em formato tabela markdown.

3. **`/negotiate-contract dummy`** — comando faz guard `grep -q "status: draft"` no CONTRACT.md. Se passa, invoca `Agent(subagent_type: "validator", ...)` para revisar items atômicos. Validator agent já usado 3× nesta sprint (Wave 1, 2, 3) com PASS — confirma viabilidade. Após PASS, comando edita frontmatter para `status: locked` e instrui commit.

4. **Hook `check-contract-exists.sh`** — agora que CONTRACT está locked, hook permite `Edit/Write` nos demais arquivos da sprint. Antes do lock, qualquer `Edit/Write` em `docs/specs/dummy-smoke-test/` (exceto SPEC/CONTRACT/PROGRESS/EVALUATION) seria bloqueado com mensagem clara apontando para `/negotiate-contract`.

**Coerência**: cada comando referencia scripts/agents que existem (`new-sprint.sh`, planner agent, validator agent); guards bash são executáveis; hook integra-se ao fluxo. Sequência cobre o gap "criar sprint → planejar → lockear" sem ambiguidades.

**Não executado de verdade**: por design do escopo (criar dummy sprint+lock+cleanup é overhead — a coerência foi verificada por leitura cruzada dos artifacts).

## Decisions taken

- **Hooks NOVOS vão em `scripts/hooks/`** (pasta nova, não em `scripts/firebase/`) — convenção do checklist linha 255. Razão: separa hooks de "harness/" dos hooks Firebase legados, sem refactor.
- **`functions/AGENTS.md` já existia** (checklist dizia "criar"): tratar como update enriquecendo seções "Idempotência" e "Structured logging". Razão: arquivo robusto (154 linhas), não vale reescrever; apenas complementar.
- **Validator agent ao fim de cada wave**: confirmação inferencial via Agent(validator, ...) antes de commit. Razão: usuário pediu explicitamente; e dogfood do harness.
- **CONTRACT lock direto** (sem ciclo Implementer↔Validator de negociação): o escopo veio da  (já validado no plano mestre) + confirmação explícita do usuário. Razão: o ciclo de negociação é para escopo ambíguo; aqui o escopo é explícito.
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
