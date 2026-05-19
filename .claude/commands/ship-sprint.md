---
description: Fecha uma sprint após verdict pass — push do branch, abre PR para develop, update CHANGES.md, update memory index se necessário
argument-hint: <sprint-id>
---

Você vai fechar uma sprint e abrir PR.

## Args

- `<sprint-id>`: ID da sprint com `verdict: pass` no EVALUATION.

## Pré-requisitos

```bash
grep -q "verdict: pass" docs/specs/<id>-*/EVALUATION.md
grep -q "status: done" docs/specs/<id>-*/PROGRESS.md
```

Se não, parar e avisar (`/validate-sprint <id>` primeiro).

## Passos

### 1. Confirmar working tree limpo

```bash
git status --short
```

Sem unstaged/untracked esperados. Se sujo, perguntar antes de push.

### 2. Push branch

```bash
git push origin $(git branch --show-current)
```

Lefthook pre-push rodará typecheck-web automaticamente.

### 3. Abrir PR para develop

```bash
gh pr create --base develop --title "feat(<sprint-id>): <name from SPEC>" --body "$(cat <<'EOF'
## Resumo

[2-3 bullets do que a sprint entregou — extraído de EVALUATION § Score]

## Sprint artifacts

- SPEC: `docs/specs/<id>-*/SPEC.md`
- CONTRACT: `docs/specs/<id>-*/CONTRACT.md` (status: locked)
- PROGRESS: `docs/specs/<id>-*/PROGRESS.md`
- EVALUATION: `docs/specs/<id>-*/EVALUATION.md` (verdict: pass)

## Sensors

[Output dos sensores finais — test/typecheck/lint/build]

## Test plan

- [ ] Reviewer lê os 4 artifacts da sprint
- [ ] Checar items do CONTRACT contra os arquivos modificados
- [ ] Sensors rodam local (se desejar)
EOF
)"
```

### 4. CHANGES.md

Add entry datada no topo:

```markdown
## [YYYY-MM-DD] — Sprint <id> ([nome]) shipped

- [2-3 bullets do delta]
- PR: https://github.com/Elo-Vision-Digital/adsmart.app/pull/<N>
```

### 5. Memory index (se aplicável)

Se a sprint introduziu padrão recorrente, adicionar entry em `.claude/projects/.../memory/MEMORY.md`. NÃO duplicar conhecimento que já está em docs/ ou em código.

### 6. EXECUTION-CHECKLIST update

Marcar a fase relevante como ✅ COMPLETA em `docs/redesign/EXECUTION-CHECKLIST.md`.

### 7. Commit final dos meta-files

```bash
git add docs/CHANGES.md docs/redesign/EXECUTION-CHECKLIST.md
git commit -m "docs(changes,checklist): ship sprint <id>"
git push
```

### 8. Retornar URL do PR ao usuário

## Anti-patterns

- ❌ Push sem verdict: pass (defeats the harness)
- ❌ Skip CHANGES.md (perde-se contexto histórico)
- ❌ PR sem test plan (reviewer fica perdido)

## Referências

- [docs/CHANGES.md](docs/CHANGES.md) — convenção de entries
- [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md)
