---
description: Invoca validator agent em processo separado para avaliar a sprint inteira ou uma wave específica. Score binário PASS/FAIL por item do CONTRACT, com evidência citada.
argument-hint: <sprint-id> [wave-N]
---

Você vai disparar o validator agent multi-process.

## Args

- `<sprint-id>`: ID da sprint.
- `[wave-N]` (opcional): se especificado, valida só essa wave; senão, valida tudo.

## Passos

### 1. Confirmar escopo

Se sem `wave-N`, validator avalia o EVALUATION.md final + cada item do CONTRACT.md.

Se com `wave-N`, validator avalia apenas itens da Wave N.

### 2. Invocar validator

```
Agent(
  subagent_type: "validator",
  prompt: "
  Avalie a sprint <id> (Wave <N> se especificada).

  **Contrato**: docs/specs/<id>-*/CONTRACT.md
  **Progress**: docs/specs/<id>-*/PROGRESS.md
  **Outcome esperado**: docs/specs/<id>-*/SPEC.md § Outcomes

  Para cada item do CONTRACT (ou apenas da Wave N):
  1. Rode o acceptance test computacional (Bash).
  2. Leia o arquivo modificado (inferencial) — coerência com o item.
  3. Verifique escopo (não vazou para Out of scope).

  Score binário PASS/FAIL por item. Cite arquivo:linha como evidência.
  Não edite nada (você não tem Edit/Write). Retorne em até 400 palavras com a tabela.
  "
)
```

### 3. Se PASS — registrar EVALUATION

Se sprint inteira:
- Editar `docs/specs/<id>-*/EVALUATION.md`
- Frontmatter `verdict: pass`
- Preencher tabela de itens com evidências do validator
- Sign-off Validator marcado

Se só wave:
- Update `PROGRESS.md` com "Wave N validator PASS"
- Seguir para próxima wave

### 4. Se FAIL — fix list

- Validator retorna lista de itens com FAIL + razão
- Não tente corrigir você mesmo neste momento se for muita coisa
- Decidir: corrigir agora (continuar implementação) ou disparar debugger agent para root-cause

```
Agent(
  subagent_type: "debugger",
  prompt: "Validator falhou nos itens X, Y, Z. Razões: <citado>. Investigue root-cause sem editar código. Produza fix plan."
)
```

### 5. Após fix list

Re-invocar `/validate-sprint <id>` (ou apenas a wave) até PASS.

## Anti-patterns

- ❌ Implementer agir como validator (princípio 13)
- ❌ Validator com Edit/Write (não deve poder corrigir, só julgar)
- ❌ Marcar `verdict: pass` sem rodar acceptance tests reais

## Referências

- [.claude/agents/validator.md](.claude/agents/validator.md)
- [.claude/agents/debugger.md](.claude/agents/debugger.md)
- [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md) § Sensors
