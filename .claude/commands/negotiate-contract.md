---
description: Workflow para fechar CONTRACT.md de uma sprint (status draft → locked). Invoca validator agent para revisar items atômicos + acceptance tests + dependências antes do lock.
argument-hint: <sprint-id>
---

Você vai conduzir a negociação Implementer↔Validator do CONTRACT.md.

A skill `.claude/skills/negotiate-contract/SKILL.md` cobre o workflow detalhado — este command é o entry point.

## Args

- `<sprint-id>`: ID da sprint com CONTRACT.md em `status: draft`.

```bash
grep -q "status: draft" docs/specs/<id>-*/CONTRACT.md
```

## Passos

### 1. Invocar skill

Auto-invoke a skill `negotiate-contract` ao detectar este comando. Ela cobre:

- Implementer propõe items
- Validator revisa via Agent
- Iteração até PASS
- Out-of-scope explícito
- Sensors a rodar
- Lock final

### 2. Atalho — validator pass

Se preferir chamar direto:

```
Agent(
  subagent_type: "validator",
  prompt: "Avalie o draft do CONTRACT.md em docs/specs/<id>-*/CONTRACT.md.
  Para cada item, responda:
  1. É atômico (≤ 4h)?
  2. Acceptance test é computacional?
  3. Dependências corretas?
  4. Algum item faltando para os Outcomes do SPEC?
  Score binário por item. Retorne em até 250 palavras."
)
```

### 3. Iterar até PASS

Ajustar items conforme feedback do validator. Re-invocar até PASS.

### 4. Lock

Editar frontmatter de CONTRACT.md:

```yaml
status: locked  # de draft → locked
negotiated-on: "YYYY-MM-DD"
```

Commit:

```bash
git add docs/specs/<id>-*/CONTRACT.md
git commit -m "docs(specs): lock CONTRACT for sprint <id>"
```

### 5. Próximo

Hook `check-contract-exists.sh` (Fase 0b) agora libera `Edit/Write` na sprint. Use `/execute-sprint <id>` para começar implementação.

## Referências

- [.claude/skills/negotiate-contract/SKILL.md](.claude/skills/negotiate-contract/SKILL.md) — workflow completo
- [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md)
