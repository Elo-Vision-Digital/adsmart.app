---
description: Append uma nota timestamped na sprint atual's PROGRESS.md. Use entre checkpoints de implementação ou antes de compactar contexto.
argument-hint: <nota curta>
---

Você vai append uma nota em PROGRESS.md.

## Args

- `<nota>`: texto curto (1-3 frases) descrevendo o checkpoint.

## Passos

### 1. Sprint atual

```bash
bash scripts/harness/update-progress.sh "<nota>"
```

O script:
- Detecta a sprint atual (folder mais recente em `docs/specs/` que não é `_templates/`)
- Append timestamped section em `PROGRESS.md`:

```markdown
### YYYY-MM-DD HH:MM — <nota curta>
```

### 2. Quando usar

- A cada ~3 commits durante implementação (regra `feedback_document_before_advancing`)
- Antes de `/compact` (carry-over)
- Quando descobrir um blocker
- Quando uma decisão não-óbvia é tomada
- Quando uma wave fecha

### 3. Quando NÃO usar

- A cada linha de código (overhead)
- Conteúdo trivial ("rodei lint")
- Conteúdo derivável do git log

### 4. Conteúdo desejado

Notas úteis:
- "Decidi padrão X em vez de Y porque Z" (decisão não-óbvia)
- "Bloqueado no item N — esperando confirmação do usuário sobre A" (blocker)
- "Wave 2 fechada — validator PASS — próximo: Wave 3"
- "Sensors rodaram: test 195/195, typecheck verde, lint 0 errors"

Notas inúteis:
- "Adicionei arquivo X" (já está no git log)
- "Funciona" (sem evidência)

## Referências

- [scripts/harness/update-progress.sh](scripts/harness/update-progress.sh)
- Memory: `feedback_document_before_advancing` (checkpoint cada ~3 commits)
