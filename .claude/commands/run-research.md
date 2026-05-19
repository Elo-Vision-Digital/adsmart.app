---
description: Dispara research focado em um tópico via Context7 + WebSearch + grep interno. Produz nota em docs/research/{NN}-{topic}.md com fontes citadas (versão + data).
argument-hint: <topic-kebab-case>
---

Você vai conduzir uma research sobre UM tópico.

## Args

- `<topic-kebab-case>`: ex: `react-19-migration`, `tailwind-v4-config`, `playwright-pdf-rendering`.

## Passos

### 1. Próximo número

```bash
ls docs/research/ | grep -E "^[0-9]+-" | sort -V | tail -1
# Se XX-name.md é o último, próximo é (XX+1)-<topic>.md
```

### 2. Invocar researcher agent

```
Agent(
  subagent_type: "researcher",
  prompt: "
  Tópico: <topic>.

  Investigue na ordem:
  1. **Repo grep**: o que o repo AdSmart faz hoje com isto? (`packages/shared/`, `functions/src/`, `src/`, `docs/research/`)
  2. **Context7**: docs oficiais 2026 da lib/framework relevante. Cite versão + data.
  3. **WebSearch** (se Context7 não cobre): best practices 2026 da comunidade. Prefira fontes oficiais.

  Estruture sua resposta como:
  - **Estado atual no repo** (1 parágrafo)
  - **O que docs oficiais dizem** (3-5 bullets com refs)
  - **Pegadinhas conhecidas** (3 bullets do que comumente quebra)
  - **Recomendação para AdSmart** (1 parágrafo com decisão concreta + tradeoffs)

  Retorne em até 600 palavras.
  "
)
```

### 3. Salvar como nota

Criar `docs/research/{NN}-{topic}.md`:

```markdown
# Research: {topic}

**Data**: YYYY-MM-DD
**Sprint trigger**: <id> (se aplicável)
**Pesquisador**: researcher agent (fresh 200k context)

## Estado atual no repo
...

## O que docs oficiais dizem
- [Context7: lib v8.2.0, 2026-04-15]: ...
- [Vercel docs, 2026-04-20]: ...

## Pegadinhas conhecidas
- ...

## Recomendação para AdSmart
...

## Próximos passos
- [ ] [Decisão concreta — ex: "criar ADR-XXX"]
- [ ] [Aplicação em sprint Y]
```

### 4. Cross-link

Se a research informa uma decisão de sprint, adicionar link no `docs/specs/<id>-*/SPEC.md § Prior decisions`.

### 5. Commit

```bash
git add docs/research/{NN}-{topic}.md
git commit -m "docs(research): {topic} — sources + recommendation"
```

## Anti-patterns

- ❌ Pesquisar sem citar versão + data da fonte (decisão fica frágil)
- ❌ Decidir sem ler o que o repo já faz (reinventa roda)
- ❌ Pular Context7 e ir só pra WebSearch (training data pode estar stale)

## Referências

- [.claude/agents/researcher.md](.claude/agents/researcher.md)
- [docs/research/](docs/research/) — research notes anteriores
- Memory `feedback_consult_context7_before_proposing`
