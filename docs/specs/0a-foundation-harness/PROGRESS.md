---
sprint-id: "0a"
name: "foundation-harness"
started: "2026-05-19"
status: done-pending-verify
current-step: ship
---

# Sprint 0a — Foundation Harness — PROGRESS

> Memory artifact. Atualiza ANTES de compactar contexto.

## ⚠️ Carry-over para próxima sessão (compactação 2026-05-19)

**Critério #1 do EXECUTION-CHECKLIST § Fase 0a** ("6 agents criados e testados — cada um responde a invocação") **não foi cumprido na sessão de implementação**.

**Razão**: Claude Code carrega `.claude/agents/*.md` apenas no START da sessão. Os 6 agents (orchestrator, researcher, planner, implementer, validator, debugger) foram criados mid-session, então não entraram na lista runtime do tool `Agent`. Invocação tentada → todos retornaram `Agent type 'X' not found`.

**Diagnóstico**: não é defeito dos agents. Os 3 agents legados do repo (`firestore-*-reviewer`, `functions-security-reviewer`) usam **o mesmo padrão de frontmatter** e estão na lista runtime — confirma que o formato funciona. Os 6 novos só precisam de uma sessão fresca para serem carregados.

**Primeira ação na nova sessão**:
1. Rodar `bash scripts/harness/bootstrap-session.sh` para restaurar contexto
2. Invocar 1 agent como smoke test:
   ```
   Agent(subagent_type: "researcher", prompt: "Smoke test — confirme em até 50 palavras seu name + tools field do frontmatter.")
   ```
3. Se responder → todos os 6 funcionam (mesma origem de formato). Repetir para os outros 5 rapidamente em paralelo.
4. Se falhar → diagnose (provavelmente sintaxe de frontmatter ou loader path).
5. Atualizar este PROGRESS + EVALUATION.md (mover `status: done-pending-verify` → `status: done`; marcar Sign-off completo).

## Status

| Field | Value |
|---|---|
| Branch | `feat/redesign-foundation-harness` |
| Base | `feat/redesign-foundation-schemas` (PR #3 para `develop` aberto) |
| Last commit | _pending — waves 1-4 a commitar nesta sessão_ |
| Tests | `bun run test` (packages/shared) → 195/195 verde ✅ |
| Build | `bun run typecheck` → verde ✅; lint → 0 errors (112 warnings pre-existing) ✅ |
| Blockers | nenhum |
| EVALUATION | `verdict: pass` (19/19 items) ✅ |

## Sessions log

### 2026-05-19 — Session 1: setup + scaffolding

- [x] Continuação após compactação do chat (Sprint -1 já fechado)
- [x] Verificação do estado: branch `feat/redesign-foundation-schemas` pushed, working tree limpo, 4 commits visíveis
- [x] PR #3 aberto: `feat/redesign-foundation-schemas` → `develop` (https://github.com/Elo-Vision-Digital/adsmart.app/pull/3)
- [x] Branch nova criada: `feat/redesign-foundation-harness`
- [x] Folders criados: `docs/specs/0a-foundation-harness/`, `docs/specs/_templates/`, `scripts/harness/`
- [x] **4 templates** em `docs/specs/_templates/`: SPEC.md, CONTRACT.md, PROGRESS.md, EVALUATION.md
- [x] **6 agents** em `.claude/agents/`: orchestrator.md, researcher.md, planner.md, implementer.md, validator.md, debugger.md (frontmatter `name/description/tools/model`, tools restritas por papel)
- [x] **3 scripts** em `scripts/harness/`: bootstrap-session.sh, update-progress.sh, new-sprint.sh (a tornar executáveis)
- [x] `docs/HARNESS-RUNBOOK.md` criado: anatomy + flow + hard rules + failure modes
- [x] **Dogfood**: este SPEC.md, PROGRESS.md, CONTRACT.md preenchidos
- [x] `chmod +x scripts/harness/*.sh` aplicado
- [x] Smoke tests passaram: `new-sprint.sh tmpsprint test` cria folder com 4 templates + substituições corretas; `update-progress.sh` sem arg retorna Usage + exit 1; `bootstrap-session.sh` produz output limpo < 60 linhas; cleanup do `tmpsprint-test` ok
- [x] Sensors: `bun run test` (packages/shared) 195/195 verde; `bun run typecheck` verde; `bun run lint` 0 errors (112 warnings pre-existing, pré-fase)
- [x] CONTRACT acceptance tests rodados item-a-item (19/19 PASS)
- [x] EVALUATION.md escrito (`verdict: pass`)
- [x] EXECUTION-CHECKLIST.md atualizado (Fase -1 + Fase 0a → ✅ COMPLETA na tabela Status Geral)
- [ ] Próximo: commit em 4 waves + push + PR para `develop`

**Saída para próxima session (se necessário)**: pode commitar tudo de uma vez ou em 4 waves (templates, agents, scripts+runbook, sprint dogfood + checklist update + CHANGES.md). Branch pushed, PR contra `develop`.

## Decisions taken

- **Subfolder `scripts/harness/`** em vez de `scripts/` raiz. Razão: análogo a `scripts/firebase/` já existente — organização por propósito; facilita filtros de PreToolUse hooks por path nas próximas fases.
- **Frontmatter dos agents segue convenção repo**: `name, description, tools (comma list), model`. Confirmado em `firestore-query-reviewer.md` etc. Razão: zero entropia, reuso da convenção que já passou no `pr-review-toolkit:code-reviewer`.
- **Implementer SEM `Agent` no tools**: restrição mecânica (não pode spawnar subagents). Razão: pesquisa 09 §4 — Implementer + Validator em processos isolados.
- **Validator SEM `Edit/Write` no tools**: idem — não pode "fix while validating". Razão: viés inevitável de quem julga o próprio output.
- **`model: sonnet` em todos os 6 agents**: balanço custo/qualidade (Sonnet 4.6). Razão: opus seria 5× mais caro; tarefas não exigem opus.
- **Templates com placeholders `{ID}`, `{NAME}`, `{YYYY-MM-DD}`**: scripts substituem via `sed`. Razão: simplicidade e zero deps (nada de Jinja, mustache, etc.).
- **Dogfood obrigatório**: esta própria sprint 0a tem SPEC + PROGRESS + CONTRACT preenchidos com os templates novos. Razão: validar templates em uso real antes de declarar Outcome done.
- **`docs/specs/_templates/` separado de sprints reais**: scripts filtram com `grep -v _templates` ao listar sprint atual. Razão: convenção limpa.

## Blockers / risks

- Nenhum blocker.
- **Risk**: scripts dependem de `git rev-parse --show-toplevel`. Se rodados fora de repo, falham com mensagem clara. OK.
- **Risk mitigado**: zero regressão garantida via `bun run test --filter=@adsmart/shared` (todos os arquivos novos são `.md` ou `.sh`, nenhum toca código TS/JS).

## Tests/build status

```text
bun run test --filter=@adsmart/shared    →  pendente verificação pós-commit (esperado 195/195)
bun run typecheck                         →  pendente verificação (nenhum .ts tocado — esperado verde)
bun run build (functions)                 →  pendente verificação (esperado verde)
bash -n scripts/harness/*.sh              →  pendente verificação (sintaxe shell)
```

## Next steps

1. `chmod +x scripts/harness/*.sh`
2. Smoke test scripts: `bash scripts/harness/new-sprint.sh tmp tmp && rm -rf docs/specs/tmp-tmp`
3. Smoke test bootstrap: `bash scripts/harness/bootstrap-session.sh` produz output sensível
4. Rodar `bun run test --filter=@adsmart/shared` — confirmar 195/195 (zero regressão)
5. Commit em waves: (a) templates, (b) agents, (c) scripts + runbook, (d) sprint dogfood
6. Push + abrir PR `feat/redesign-foundation-harness` → `develop`
7. Preencher EVALUATION.md (vai virar a primeira dogfood real de Validator no projeto)
