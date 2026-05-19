---
description: Spawna agents researcher em paralelo para preencher a seção "Prior decisions" do SPEC.md de uma sprint. Cada researcher investiga um tópico em fresh 200k context (Context7 + WebSearch + repo grep).
argument-hint: <sprint-id>
---

Você vai disparar Researchers em paralelo para uma sprint específica.

## Args

- `<sprint-id>`: ID da sprint existente (ex: `0c`, `1`, `2.5`).

Verificar existência:

```bash
test -d "docs/specs/<id>-"* && ls docs/specs/<id>-*/SPEC.md
```

## Passos

### 1. Ler SPEC

Abrir `docs/specs/<sprint-id>-*/SPEC.md`. Identificar tópicos que precisam de research (geralmente listados em `## Prior decisions` como "TODO" ou em `## Constraints` como "verificar 2026 best practices").

### 2. Enumerar tópicos

Listar 2-5 tópicos investigáveis. Exemplos típicos:

- "Padrão atual do framework X versão Y" (Context7)
- "Best practice 2026 para Z" (WebSearch + Context7)
- "Como o repo trata pattern W hoje" (grep interno)
- "Quais ADRs/research existentes tocam este tema"

### 3. Spawn paralelo

Para cada tópico, invocar o researcher agent:

```
Agent(
  subagent_type: "researcher",
  prompt: "Investigue: [TÓPICO]. Contexto: sprint <id> em docs/specs/<id>-*/SPEC.md. Retorne em até 300 palavras com: (1) o que o repo faz hoje (grep), (2) o que docs oficiais 2026 recomendam (Context7), (3) sua recomendação concreta para o SPEC. Cite fontes com versão + data."
)
```

**Em paralelo** — múltiplos `Agent(researcher, ...)` no mesmo turno.

### 4. Sintetizar

Coletar respostas. Para cada uma:
- Verificar fontes citadas (não confiar cego — visitar URL se dúvida)
- Identificar conflitos entre researchers (se houver, perguntar usuário)
- Extrair decisão única para o SPEC

### 5. Update SPEC

Editar `docs/specs/<sprint-id>-*/SPEC.md` § `Prior decisions`:

```markdown
- **Decisão sobre [tópico]** (fonte: [Context7 lib version 2026-MM-DD | research/NN-name.md]): [decisão concreta]
```

### 6. Commit

```bash
git add docs/specs/<sprint-id>-*/SPEC.md
git commit -m "docs(specs): research findings for sprint <id> — prior decisions filled"
```

## Anti-patterns

- ❌ Pesquisar SEM Context7 (depende de training data — pode estar stale)
- ❌ Não citar versão + data da doc consultada
- ❌ Decisão na resposta sem aterrar no SPEC (perde-se)

## Referências

- [.claude/agents/researcher.md](.claude/agents/researcher.md)
- [docs/research/](docs/research/) — research notes anteriores
- [docs/HARNESS-RUNBOOK.md](docs/HARNESS-RUNBOOK.md) § Typical sprint flow
