---
sprint-id: "0.8"
name: "integrations-refactor"
status: planning  # planning | research | contract | implementing | validating | shipped
depends-on: []    # [{sprint-id}, ...]
est-days: 0
references:
  - docs//
  - docs//
---

# Sprint 0.8 — integrations-refactor — SPEC

> Feedforward artifact (guide). Lido pelos agents ANTES da execução para entender escopo e restrições.

## Outcomes

Lista do que precisa ser verdade quando esta sprint terminar. Cada item é binário (passou/não passou) e verificável.

- [ ] Outcome 1: …
- [ ] Outcome 2: …

## Scope

### In

- Item: …

### Out

Tudo que parece relacionado mas NÃO faz parte. Evita scope creep:

- Item postponed (rota para qual sprint): …

## Constraints

| Tipo | Restrição |
|---|---|
| Stack | … (versões mínimas, libs proibidas) |
| Performance | … (tempos máximos, tamanhos) |
| Segurança | … (rules, secrets, auth) |
| i18n | … (3 idiomas obrigatórios?) |
| Não temos usuários em prod | refactor destrutivo permitido |

## Prior decisions

Decisões já tomadas em fases anteriores que esta sprint herda. Cite ADR ou research:

- Decisão (fonte: ADR-NNN ou docs/research/NN-name.md): …

## Task breakdown

Decomposição em tasks atômicas (2–4h cada). O Planner valida este breakdown.

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | … | — | … |
| 2 | … | 1 | … |

## Verification criteria

Como o Validator confirma cada outcome. Cada critério é uma verificação **computacional** (lint, type, test, build) ou **inferencial** (Validator subagent lê código).

| Outcome | Sensor | Comando / Subagent |
|---|---|---|
| 1 | Computacional | `bun run test --filter=@adsmart/shared` |
| 2 | Inferencial | `Agent(validator, "check item X")` |

## References

- `docs//` § Fase …
- `docs/research/NN-name.md`
- ADR-NNN
