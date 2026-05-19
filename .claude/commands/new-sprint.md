---
description: Cria uma nova sprint via scripts/harness/new-sprint.sh — scaffolds docs/specs/{id}-{name}/ com SPEC + CONTRACT + PROGRESS + EVALUATION templates instanciados
argument-hint: <id> <name>
---

Você vai criar uma nova sprint no harness AdSmart usando o script canônico.

## Args

- `<id>`: ID da sprint (ex: `0c`, `1`, `2.5`). Sem espaços.
- `<name>`: kebab-case (ex: `memory-cleanup`, `design-system`).

Se faltar arg, perguntar antes de prosseguir.

## Passos

### 1. Verificar branch

```bash
git status --short
git branch --show-current
```

Confirmar que está em `develop` ou em branch limpa. Se working tree sujo, pedir confirmação.

### 2. Rodar script

```bash
bash scripts/harness/new-sprint.sh <id> <name>
```

O script:
- Cria `docs/specs/<id>-<name>/`
- Copia SPEC.md, CONTRACT.md, PROGRESS.md, EVALUATION.md dos templates `docs/specs/_templates/`
- Substitui `{ID}` → `<id>`, `{NAME}` → `<name>`, `{YYYY-MM-DD}` → data atual
- Imprime "Sprint scaffold created: docs/specs/<id>-<name>"

### 3. Branch nova (se ainda não existe)

```bash
git checkout -b feat/sprint-<id>-<name>
```

### 4. Preencher SPEC

Próximo passo concreto: abrir `docs/specs/<id>-<name>/SPEC.md` e preencher:
- `## Outcomes` — lista do que vai ser verdade ao fim da sprint
- `## Scope` — In (o que entra) e Out (o que NÃO entra)
- `## Constraints` — restrições de stack/perf/segurança/i18n
- `## Prior decisions` — ADRs e research relevantes
- `## Task breakdown` — decomposição em tasks atômicas (2-4h cada)
- `## Verification criteria` — sensors computacionais + inferenciais

### 5. Próximo

Após SPEC preenchido, usar `/negotiate-contract <id>` para fechar CONTRACT.

## Referências

- [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md)
- [scripts/harness/new-sprint.sh](scripts/harness/new-sprint.sh)
