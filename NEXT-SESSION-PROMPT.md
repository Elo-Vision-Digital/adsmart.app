# Prompt de continuidade — próxima sessão AdSmart

> Copie o bloco abaixo e cole como primeira mensagem na próxima sessão. Dá contexto completo em uma única passada sem precisar gastar tokens explorando o repo.

---

```
Continuação de trabalho no AdSmart — preciso retomar exatamente de onde paramos.

## Onde estamos AGORA

- **Repo:** `/Users/eduardorodrigues/Downloads/Meus Projetos/adsmart-app`
- **Branch atual:** `fix/readme-agents-looker-cleanup`
- **PR aberto não-mergeado:** PR #10 (hotfix README+AGENTS+skill) — base `develop`
- **Último PR mergeado:** PR #9 (Sprint 0.5 cleanup-legacy completo) → develop
- **Último commit local:** `f670303` (skill negotiate-contract Passo 1 pre-flight)

## O que acabamos de fazer (contexto resumido)

Sprint 0.5 (cleanup-legacy) inteira foi shipada via 4 microsprints + 1 closing:
- 0.5.1 Asaas → Stripe FUTURE §8 (`15160d7`)
- 0.5.2 SuitPay cleanup, fields legacy mantidos `.optional()` por retro-compat (`8b02480`)
- 0.5.3 Looker/Data Studio cleanup, ADR-022 render in-app (`1581235`)
- 0.5.4 MetaReviewDemo dev-only flag (`612eb02`)
- Closing EVALUATION+CHANGES (`bf4ce50`)

Depois auditoria revelou 2 hits Looker que escaparam: `README.md:3` e `AGENTS.md:7` (descrições no presente). Hotfix PR #10 abriu com:
1. Fix README + AGENTS (factual histórica preservada)
2. Update da skill `negotiate-contract` adicionando Passo 1 obrigatório de pre-flight repo-wide com checklist root-level (README, AGENTS, CLAUDE, package.json, .github/, .claude/) — pra que esse gap nunca mais aconteça.

## PRÓXIMO PASSO concreto (após você mergear PR #10)

**Fase 1 — Design System (DS-1)**, 7 microsprints, 1 PR final. Conforme roadmap em [docs/redesign/EXECUTION-CHECKLIST.md](docs/redesign/EXECUTION-CHECKLIST.md) e princípios em [docs/redesign/FEATURES-INVENTORY.md § Princípios](docs/redesign/FEATURES-INVENTORY.md).

ADR governante: **ADR-027** em `docs/Decisions.md` (Tailwind v4 + Apple SF Pro + tokens semânticos). Research: `docs/research/03-frontend-stack.md`.

Tarefas planejadas (a serem decompostas no SPEC/CONTRACT):
1. Upgrade React 18.3 → 19 (Actions, `use`, ref as prop)
2. Upgrade Tailwind 3 → v4 (`@theme`, `@utility`, oklch colors)
3. Fonte Apple SF Pro instalada + carregada
4. Tokens semânticos (colors, spacing, typography) em `src/index.css` via `@theme`
5. shadcn primitives migrados pra v4 syntax
6. Dark mode redesenhado (data-theme via ThemeContext já existe — ajustar tokens)
7. Verificação visual com `chrome-devtools-mcp` (tirar screenshots antes/depois das telas existentes)
8. Update `src/AGENTS.md` "current vs target stack" (target vira current)

## PIPELINE OBRIGATÓRIO (sempre seguir, sem exceção)

### Ciclo macro por SPRINT

```
1. SCAFFOLD     → bash scripts/harness/new-sprint.sh {id} {name}
                  cria docs/specs/{id}-{name}/ com 4 artefatos template
                  (SPEC.md, CONTRACT.md, PROGRESS.md, EVALUATION.md)

2. RESEARCH     → Spawn researcher agents EM PARALELO (Context7 + WebSearch + repo grep)
                  para validar API 2026 atual de cada lib/pattern.
                  Output: docs/research/{NN}-{topic}.md com fontes citadas.

3. SPEC         → Preencher SPEC.md (Outcomes + Task breakdown + Prior decisions + Constraints)
                  Base: research findings + roadmap.

4. CONTRACT     → Implementer propõe items atômicos (2-4h cada) com acceptance tests
                  computacionais. Status: draft.
                  Skill: negotiate-contract (lembrar Passo 1 pre-flight!)

5. NEGOTIATE    → Validator agent revisa CONTRACT draft.
                  Iterar até PASS em todos os items.
                  Lock CONTRACT (status: locked).

6. APPROVAL     → PAUSA OBRIGATÓRIA: AskUserQuestion antes de qualquer Edit/Write.
                  User aprova explicitamente o CONTRACT locked.

7. WAVES        → Por microsprint:
                  a. Implementer faz Edit/Write conforme CONTRACT
                  b. Sensores computacionais (typecheck + test + lint + hooks)
                  c. Validator agent (multi-process) faz verdict PASS/FAIL
                  d. Se FAIL: fix → re-sensor → re-validator
                  e. Commit (mensagem via /tmp/commit-X.txt por causa do hook)
                  f. PAUSA + AskUserQuestion antes da próxima microsprint

8. CLOSING      → EVALUATION.md verdict: pass
                  PROGRESS.md status: complete + closed date
                  CHANGES.md entry [YYYY-MM-DD] cobrindo todos os commits
                  Update MEMORY.md se necessário

9. PR           → git push -u origin {branch}
                  gh pr create --base develop --title "..." --body "..."
                  PAUSA aguardando user mergear
```

### Princípios invioláveis (sempre ativos)

1. **i18n nas 3 línguas** (pt-BR + en + es) — hook `check-no-hardcoded-literal.sh` bloqueia hardcode em JSX/TSX
2. **Cliente NÃO escreve** wallet/transactions — só backend via Admin SDK
3. **Schemas Zod source of truth** (`packages/shared/src/schemas/`) com test co-located
4. **Multi-process agents**: Implementer ≠ Validator (princípio 13)
5. **Pre-flight repo-wide grep** em sprints de cleanup textual (skill negotiate-contract Passo 1)
6. **Context7 + research** antes de propor qualquer lib/pattern (não chutar API)
7. **chrome-devtools-mcp** para validação visual em fases UI
8. **Pausa + aprovação explícita** entre microsprints (não autoavançar)
9. **NÃO há usuários em prod** — refactors destrutivos permitidos
10. **Zero hardcoded literal** + zero unnecessary comment (hard rule, 2026-05-18)

### Anti-patterns (NÃO fazer)

- ❌ Começar implementação sem SPEC + CONTRACT locked
- ❌ Validator e Implementer no mesmo agent
- ❌ Skip pre-flight repo-wide em sprint de cleanup (lição PR #10)
- ❌ Commit sem rodar sensores antes
- ❌ Múltiplas microsprints sem pausa de aprovação
- ❌ Inventar APIs sem Context7 verificar
- ❌ Reescrever ADR Accepted (só Update note + cross-refs)
- ❌ Skip `--no-verify` ou outros bypass de hook
- ❌ Force push em develop/main

## Comandos para retomar contexto rápido

```bash
cd "/Users/eduardorodrigues/Downloads/Meus Projetos/adsmart-app"
git status
git log --oneline -10
gh pr list --state open
cat docs/redesign/EXECUTION-CHECKLIST.md | head -80   # roadmap completo
cat docs/specs/0.5-cleanup-legacy/EVALUATION.md       # verdict pass última sprint
cat docs/CHANGES.md | head -50                         # changelog recente
bash scripts/harness/bootstrap-session.sh              # se existir, sintetiza estado
```

## Memória do projeto (referências)

- **CLAUDE.md** raiz — guidance Claude Code específico
- **AGENTS.md** raiz — visão geral do projeto (atualizado em PR #10)
- **docs/HARNESS-RUNBOOK.md** — lifecycle de sprint (SPEC→CONTRACT→waves→EVALUATION)
- **docs/Decisions.md** — todos os ADRs (33 publicados; ADR-022 a 033 são do redesign)
- **docs/CHANGES.md** — changelog completo (entrada [2026-05-23] é a Sprint 0.5)
- **docs/specs/** — uma pasta por sprint com seus 4 artefatos
- **.claude/skills/** — skills auto-invocáveis (negotiate-contract foi atualizada agora)
- **.claude/agents/** — definições dos agents Implementer/Validator/Researcher/Planner/Orchestrator/Debugger
- **.claude/projects/.../memory/MEMORY.md** — auto-memória do user (persistente entre sessões)

## Stack atual (a ser modificada em Fase 1)

- React 18.3, TypeScript, Vite, Tailwind 3.x, shadcn/ui, Firebase (Auth + Firestore + Functions v2 Node 22), Bun + Turborepo, Biome, Vitest
- Monorepo: `src/` (web), `functions/` (Cloud Functions), `packages/shared/` (schemas Zod)
- Tests passando: 195/195 em packages/shared
- Branch base de novas sprints: `develop` (que tem todos os merges das fases 0a-0.5)

## Convenções de commit (lição aprendida)

Hook `check-rules-tested.sh` dá false positive em commit multi-command + heredoc. Workaround estabelecido: salvar mensagem em `/tmp/commit-X.txt` e usar `git commit -F /tmp/commit-X.txt`.

## O que você deve fazer ao começar

1. Confirmar comigo se PR #10 já foi mergeado (eu vou te avisar quando mergear)
2. Se sim: `git checkout develop && git pull` e começar a Fase 1
3. Antes de qualquer Edit/Write: criar `docs/specs/1-design-system-ds1/` via `bash scripts/harness/new-sprint.sh 1 design-system-ds1`
4. Disparar **researcher agents em paralelo** para validar API 2026 atual de:
   - React 19 (compiler, Actions, useFormStatus, use(), ref as prop)
   - Tailwind v4 (@theme, @utility, oklch, container queries, CSS-first config)
   - Apple SF Pro (licenciamento + estratégia de loading — system font fallback?)
5. Com research em mãos, preencher SPEC.md + propor CONTRACT.md draft
6. Negociar CONTRACT com validator agent (skill `negotiate-contract` Passo 1-7)
7. Lockar CONTRACT e começar Wave 1 com aprovação explícita minha

NÃO comece a implementar sem primeiro: research → SPEC → CONTRACT locked → minha aprovação explícita.

Use o pipeline obrigatório acima do início ao fim, sem pular etapas.
```

---

## Como usar este arquivo

1. Abrir nova sessão Claude Code no repo
2. Copiar todo o bloco entre as triplas crases acima
3. Colar como primeira mensagem
4. Aguardar Claude confirmar entendimento + perguntar se PR #10 foi mergeado

Atualize este arquivo se quiser mudar o ponto de retomada ou adicionar mais contexto recente.
