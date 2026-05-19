---
name: negotiate-contract
description: Workflow para negociar o CONTRACT.md de uma sprint entre Implementer e Validator antes de lockear. Use quando a sprint já tem SPEC.md preenchido mas CONTRACT.md ainda está em status draft, ou quando o usuário pedir "vamos lockar o contract da sprint X", "negociar items da sprint", "Implementer e Validator alinharem escopo". Cobre extração de items atômicos do SPEC, definição de acceptance tests computacionais, dependências entre items, sensors a rodar, e final lock.
---

# Negotiate contract — AdSmart Implementer↔Validator alignment

A "negociação" do CONTRACT é o ritual onde Implementer e Validator concordam SOBRE O ESCOPO antes do primeiro `Edit/Write`. Sem isso, o ciclo de implementação vira "implementer julgando próprio output" (anti-pattern).

## When to invoke

Auto-invoke quando:
- `SPEC.md` existe e está preenchido (não placeholder)
- `CONTRACT.md` está em `status: draft`
- O usuário pediu "fechar o contract", "lockar a sprint", "alinhar items"

NÃO use para: editar SPEC (use Edit direto) ou executar items (use `implementer` agent direto).

## Pré-requisitos

```bash
# Verificar estado da sprint
SPRINT=docs/specs/{id}-{name}
test -f "$SPRINT/SPEC.md" || echo "SPEC missing"
grep -q "status: draft" "$SPRINT/CONTRACT.md" || echo "CONTRACT not in draft — already locked?"
```

## Workflow

### Passo 1 — Implementer propõe items

A partir do SPEC § Task breakdown, decompor em items atômicos (cada um 2-4h de trabalho):

```markdown
| # | Item | Acceptance test |
|---|---|---|
| 1 | Criar `packages/shared/src/schemas/foo.ts` exportando FooSchema | `cd packages/shared && bun run test foo.test.ts` verde |
| 2 | Refatorar `bar.ts` para usar FooSchema | `bun run typecheck` verde + grep confirma 0 referências antigas |
```

Cada item:
- **Binário** (entregue OU não entregue, sem "parcial")
- Tem **acceptance test computacional** (não inferencial)
- Tem **dependência explícita** (se aplicável)

### Passo 2 — Validator agent revisa

Invocar o validator agent (multi-process):

```
Agent(subagent_type: "validator", prompt: "
Avalie o draft do CONTRACT.md em docs/specs/{id}/CONTRACT.md.
Para cada item, responda:
1. É atômico? (não pode ser dividido em < 4h cada)
2. Acceptance test é computacional/verificável? (não 'parece bom')
3. Dependências estão corretas?
4. Algum item faltando para cumprir os Outcomes do SPEC?

Retorne em até 200 palavras. Score binário por item.
")
```

### Passo 3 — Iterar até PASS

Se Validator apontar problemas:
- **Item não atômico** → quebrar em 2+ items
- **Acceptance test vago** → reescrever como comando bash/grep
- **Dependência errada** → corrigir
- **Item faltando** → adicionar (se cabe no escopo do SPEC)

Repetir Passo 2 até Validator retornar PASS em todos os items.

### Passo 4 — Out of scope explícito

CONTRACT precisa de seção `## Out of scope (explicit)` listando o que NÃO vai entrar. Pega items que parecem relacionados mas ficam para outras sprints/fases. Bloqueio de scope creep.

### Passo 5 — Sensors a rodar

CONTRACT lista os sensores que vão ser rodados ao fim:

```markdown
## Sensors a rodar

### Computacionais (bloqueantes)

- [ ] `cd packages/shared && bun run test` — XXX/XXX verde
- [ ] `bun run typecheck` — verde
- [ ] `bun run lint` — 0 errors
- [ ] Pre-commit hooks (lefthook + Claude PreToolUse) — passam

### Inferenciais (seletivos)

- [ ] `Agent(validator, "verificar entrega da Wave N")` PASS
```

### Passo 6 — Lock

Trocar frontmatter:

```yaml
status: locked  # de draft para locked
negotiated-on: "YYYY-MM-DD"
parties:
  implementer: "..."
  validator: ".claude/agents/validator.md"
```

Commit:

```bash
git add docs/specs/{id}/CONTRACT.md
git commit -m "docs(specs): lock CONTRACT for sprint {id}"
```

A partir deste ponto:
- Hook `check-contract-exists.sh` (Fase 0b) permite `Edit/Write` nos arquivos da sprint
- Implementer começa Wave 1
- Cada wave fecha com sensors + Validator agent

## Anti-patterns

- ❌ Lockear sem Validator revisar (defeats the purpose)
- ❌ Acceptance test `bun run test passa` (vago) — escrever `cd packages/shared && bun run test 2>&1 | grep 'Tests 195 passed'`
- ❌ Items 8+h (não atômicos) — quebrar
- ❌ "Out of scope" vazio — sempre lista algo (regra anti scope-creep)
- ❌ Mesmo agente Implementer + Validator (princípio 13 do roadmap)

## Referências

- [docs/HARNESS-RUNBOOK.md § Typical sprint flow](docs/HARNESS-RUNBOOK.md)
- [docs/research/09-harness-engineering.md § 5 Contracts](docs/research/09-harness-engineering.md)
- [.claude/agents/validator.md](.claude/agents/validator.md)
- [.claude/agents/implementer.md](.claude/agents/implementer.md)
