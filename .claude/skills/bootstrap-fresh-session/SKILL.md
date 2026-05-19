---
name: bootstrap-fresh-session
description: Restaura contexto AdSmart em uma sessão fresca (pós-compactação, novo `claude --resume`, ou primeira sessão do dia). Use quando o usuário pedir "retoma onde parou", "compactei o chat", "qual o estado atual?", ou no início de uma nova sessão. Roda `scripts/harness/bootstrap-session.sh`, sintetiza output em <200 palavras (branch + sprint + sensores + blockers), aponta a próxima ação concreta.
---

# Bootstrap fresh session — AdSmart context restoration

Esta skill substitui o procedimento manual de "descobrir o estado do repo" no início de cada sessão. Centraliza:

- `git status` + branch + last commits
- Sprint atual (SPEC/PROGRESS/CONTRACT/EVALUATION headers)
- Sensors recentes (test/typecheck/lint)
- Carry-overs de sessão anterior (`## ⚠️ Carry-over` blocks em PROGRESS.md)
- Memory index relevante

## When to invoke

Auto-invoke quando:
- Primeira mensagem da sessão depois de `/compact` ou `claude --resume`
- O usuário disser "retoma", "estado atual", "onde paramos", "vamos prosseguir"
- Após `Reload Window` do VS Code extension host

NÃO use para: research aprofundado (use `researcher` agent), implementação (use `implementer` agent).

## Workflow

### Passo 1 — Rodar bootstrap script

```bash
bash scripts/harness/bootstrap-session.sh
```

Output cobre:
- Repo path
- Branch atual + last 5 commits
- Working tree status
- Sprint folder atual com SPEC header, PROGRESS status, CONTRACT status, EVALUATION verdict
- Memory index (`MEMORY.md`)

### Passo 2 — Sintetizar em <200 palavras

Formato recomendado para apresentar ao usuário:

```markdown
**Branch**: `feat/...` (N commits ahead of develop, working tree clean)
**Sprint atual**: `docs/specs/{id}-{name}/` — status: {in-progress | done-pending-verify | shipped}
**Próximo passo**: {extraído de PROGRESS.md § Next steps}
**Sensores** (último run): test {X/Y}, typecheck {verde|red}, lint {0 errors|Z errors}
**Carry-over**: {se PROGRESS.md tem bloco "## ⚠️ Carry-over", citá-lo}
**Blockers**: {nenhum | lista de PROGRESS.md § Blockers}
```

### Passo 3 — Se há carry-over, executar primeira ação

Se PROGRESS.md tem `## ⚠️ Carry-over para próxima sessão`, ler com atenção e executar o "1. primeira ação" descrita. Não pular.

### Passo 4 — Listar próximos passos

Apresentar 2-3 opções de continuação ao usuário:
1. Continuar item N da sprint atual
2. Validar wave que ficou pendente
3. Começar próxima sprint (se a atual está done)

Não decidir sozinho — perguntar ao usuário.

## Outputs anti-patterns

- ❌ Despejar o output bruto do `bootstrap-session.sh` no chat (gasta tokens)
- ❌ Pular o carry-over (perde contexto explícito da sessão anterior)
- ❌ Começar a editar sem confirmar com usuário qual o próximo passo

## Outputs preferred

- ✅ < 200 palavras de resumo
- ✅ Próxima ação concreta (não "vamos continuar")
- ✅ Cita os arquivos onde a info veio (PROGRESS.md, EVALUATION.md, ...)

## Referências

- [scripts/harness/bootstrap-session.sh](scripts/harness/bootstrap-session.sh) — script source
- [docs/HARNESS-RUNBOOK.md § Hard rules](docs/HARNESS-RUNBOOK.md) — regras de PROGRESS persistence
- Memory file system em `.claude/projects/.../memory/`
