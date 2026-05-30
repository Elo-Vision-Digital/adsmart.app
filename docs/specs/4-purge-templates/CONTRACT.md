---
sprint-id: "4"
name: "purge-templates"
negotiated-on: "2026-05-30"
parties:
  implementer: "agent:implementer"
  validator: "agent:validator"
status: locked
---

# Sprint 4 — purge-templates — CONTRACT

> Lista negociada Implementer ↔ Validator.

## Items (Implementer commits to delivering)

| # | Item | Acceptance test |
|---|---|---|
| 1 | Deletar páginas `/templates` e `/generate-report` (`src/pages/*`) e `src/components/templates/` | Não existir os arquivos na árvore. |
| 2 | Remover rotas do React Router em `src/App.tsx` | `bun run typecheck` verde |
| 3 | Remover links e botões em `HomePage`, `Dashboard`, `ReportsPage`, `PaymentSuccessPage` | Sem ocorrência de `navigate('/templates')` no código |
| 4 | Atualizar `ReportSchema` no shared (remover `templateId` e `template`) | `cd packages/shared && bun run test` verde |
| 5 | Limpar dicionários de i18n (`src/locales/*.json`) | Sem chaves `templateCard`, `templatesPage` e afins |
| 6 | Limpar referências residuais (ex: `firestore-rules.test.ts` e `AGENTS.md`) | `bun run test` do functions verde |

## Out of scope

- [ ] Implementação da nova lógica de relatórios.

## Sensors a rodar

Computacionais (bloqueantes, score binário):
- [ ] `bun run lint` (Biome)
- [ ] `bun run typecheck`
- [ ] `bun run test` (packages relevantes e functions)

## Sign-off
- [ ] Implementer assinou (commit + push)
- [ ] Validator assinou (EVALUATION.md PASS)
- [ ] Human revisou (PR aprovado)
