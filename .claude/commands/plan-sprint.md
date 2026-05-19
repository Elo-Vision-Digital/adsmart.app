---
description: Invoca o planner agent para decompor o SPEC.md em CONTRACT.md draft com items atômicos (2-4h cada), dependências e acceptance tests
argument-hint: <sprint-id>
---

Você vai disparar o planner para uma sprint.

## Args

- `<sprint-id>`: ID da sprint com SPEC.md preenchido (não placeholder).

Verificar SPEC preenchido (não no estado template):

```bash
grep -q "^## Outcomes" docs/specs/<id>-*/SPEC.md
grep -q "Outcome 1: …" docs/specs/<id>-*/SPEC.md && echo "SPEC ainda em template — preencher antes"
```

## Passos

### 1. Ler SPEC

Carregar o SPEC + entender escopo, constraints, prior decisions, task breakdown.

### 2. Invocar planner

```
Agent(
  subagent_type: "planner",
  prompt: "Sprint <id>. Leia docs/specs/<id>-*/SPEC.md (focus em Outcomes, Scope In, Task breakdown). Produza um draft de CONTRACT.md com items atômicos (2-4h cada), agrupados em waves. Cada item tem acceptance test computacional (comando bash/grep). Dependências explícitas. Saída como tabela markdown. Não toque arquivos — só retorne o draft no chat."
)
```

### 3. Revisar draft

Verificar:
- Items são realmente atômicos (não 8h+)?
- Acceptance tests são computacionais (comandos), não inferenciais ("parece bom")?
- Dependências batem com o que o SPEC pede?
- Cobre 100% dos Outcomes do SPEC?

Se houver gap, refinar (invocar planner de novo OU editar manualmente).

### 4. Escrever CONTRACT.md

Aplicar o draft (revisado) em `docs/specs/<id>-*/CONTRACT.md` mantendo `status: draft` (ainda não locked).

### 5. Próximo

Usar `/negotiate-contract <id>` para validator revisar + lock.

## Anti-patterns

- ❌ Aceitar items 6h+ (não atômicos) — quebrar
- ❌ Acceptance test "rodar testes" (vago) — escrever `bun run test`
- ❌ Pular dependências entre items (vai dar problema na ordem de execução)

## Referências

- [.claude/agents/planner.md](.claude/agents/planner.md)
- [.claude/skills/negotiate-contract/SKILL.md](.claude/skills/negotiate-contract/SKILL.md)
