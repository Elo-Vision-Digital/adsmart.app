---
sprint-id: "{ID}"
name: "{NAME}"
negotiated-on: "{YYYY-MM-DD}"
parties:
  implementer: "agent:implementer"  # ou nome humano
  validator: "agent:validator"
status: draft  # draft | locked | satisfied | failed
---

# Sprint {ID} — {NAME} — CONTRACT

> Lista negociada Implementer ↔ Validator. Locked antes da execução. Validator bate item-a-item.

## Items (Implementer commits to delivering)

Cada item é binário: entregue ou não entregue. Sem "parcial".

| # | Item | Acceptance test |
|---|---|---|
| 1 | Criar `packages/shared/src/schemas/foo.ts` exportando `FooSchema` | `bun run test src/schemas/foo.test.ts` verde |
| 2 | Refatorar `bar.ts` para usar `FooSchema` em vez de tipo solto | `bun run typecheck` verde + grep confirma 0 ocorrências de tipo legado |

## Out of scope (explicit)

Items que NÃO fazem parte desta sprint mesmo que pareçam relacionados. Bloqueio de scope creep:

- [ ] Refactor X — sprint Y
- [ ] Otimização Z — fora  atual

## Sensors a rodar

Computacionais (bloqueantes, score binário):

- [ ] `bun run lint` (Biome)
- [ ] `bun run typecheck`
- [ ] `bun run test` (packages relevantes)
- [ ] `bun run build` (functions, se tocou)
- [ ] Pre-commit hooks passam (`.claude/settings.json`)

Inferenciais (caros, seletivos):

- [ ] `pr-review-toolkit:code-reviewer` (pré-merge)
- [ ] `firestore-rules-reviewer` (se tocou `firestore.rules`)
- [ ] `firestore-query-reviewer` (se adicionou query)
- [ ] `functions-security-reviewer` (se tocou função sensível)

## Sign-off

- [ ] Implementer assinou (commit + push)
- [ ] Validator assinou (EVALUATION.md PASS)
- [ ] Human revisou (PR aprovado)
