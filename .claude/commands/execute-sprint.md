---
description: Orquestra a implementação de uma sprint. Invoca orchestrator agent para coordenar waves, dispara implementer agents para tasks paralelas, valida ao fim de cada wave.
argument-hint: <sprint-id>
---

Você vai executar uma sprint cujo CONTRACT está locked.

## Args

- `<sprint-id>`: ID da sprint com `status: locked` no CONTRACT.

Verificar:

```bash
grep -q "status: locked" docs/specs/<id>-*/CONTRACT.md
```

Se não, parar e avisar usuário (`/negotiate-contract <id>` primeiro).

## Estratégia

Esta sprint pode ter dezenas de items. O usuário deve confirmar a estratégia ANTES:

- **Sequential by wave** (default) — executa wave 1 completa → validator → wave 2 → … (mais seguro)
- **Parallel by item** (dentro da wave) — dispara N implementers simultâneos em items independentes (mais rápido, exige itens sem shared state)

Pergunte ao usuário se houver waves grandes (>5 items).

## Passos

### 1. Bootstrap

Garantir contexto fresco da sprint:

```bash
bash scripts/harness/bootstrap-session.sh
```

### 2. Identificar Wave atual

Ler CONTRACT.md + PROGRESS.md para identificar a wave que ainda não fechou.

### 3. Para cada item da Wave

Opção A — sequential:
Implementar você mesmo (Edit/Write/Bash), seguindo o acceptance test do item.

Opção B — dispatch:
```
Agent(
  subagent_type: "implementer",
  prompt: "Execute item N do CONTRACT.md da sprint <id>. Acceptance test: <test>. Não vá além do item. Não toque outros arquivos. Retorne após PASS."
)
```

### 4. Acceptance tests ao fim do item

Rodar o teste exato do CONTRACT:

```bash
# Exemplo
bun run test
bun run typecheck
test -f path/to/file
grep -q pattern path/to/file
```

### 5. Validator ao fim da Wave

```
Agent(
  subagent_type: "validator",
  prompt: "Verifique a Wave N da sprint <id>. Itens X-Y. Score binário PASS/FAIL por item, com evidência."
)
```

Se algum FAIL, parar e corrigir antes de seguir.

### 6. Update PROGRESS.md

```bash
bash scripts/harness/update-progress.sh "Wave N entregue + validator PASS"
```

### 7. Commit Wave

```bash
git add <files-da-wave>
git commit -m "..."
```

### 8. Repetir para próximas Waves

### 9. Final — `/ship-sprint <id>`

Quando todas as Waves passaram, usar `/ship-sprint <id>` para fechar.

## Anti-patterns

- ❌ Implementer sem acceptance test fechado (não sabe quando parar)
- ❌ Pular validator ao fim da Wave (defeats the harness)
- ❌ Commit sem update de PROGRESS.md (perde contexto se compactar)

## Referências

- [.claude/agents/orchestrator.md](.claude/agents/orchestrator.md)
- [.claude/agents/implementer.md](.claude/agents/implementer.md)
- [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md)
