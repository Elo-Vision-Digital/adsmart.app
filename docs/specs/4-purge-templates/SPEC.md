---
sprint-id: "4"
name: "purge-templates"
status: planning
depends-on: ["3"]
est-days: 1
references:
  - docs//
---

# Sprint 4 — purge-templates — SPEC

> Feedforward artifact. Remoção completa de tudo relacionado ao fluxo antigo de geração de relatórios via Templates.

## Outcomes

- [ ] Arquivos de UI e lógicas de "Templates" deletados do src.
- [ ] Rotas antigas (`/templates` e `/generate-report`) deletadas.
- [ ] Referências de templates removidas de `HomePage`, `ReportsPage`, `Dashboard`, `PaymentSuccessPage` e menus.
- [ ] Entidades de internacionalização (`locales/*.json`) limpas.
- [ ] Zod schema de `report` não tem mais `templateId`.

## Scope

### In
- Deletar `TemplatesPage.tsx` e `GenerateReportPage.tsx`.
- Deletar o diretório `src/components/templates`.
- Remover as rotas do `App.tsx`.
- Remover referências ao longo do código-fonte e schemas.

### Out
- Não criar o NOVO fluxo de relatório (isso é escopo futuro do FLOW-3). Esta sprint é puramente destrutiva/limpeza.

## Constraints

| Tipo | Restrição |
|---|---|
| Segurança | O schema e a validação do banco (firestore rules) devem continuar íntegros sem referências fantasmas. |
| Integridade | O Typecheck e lint não devem quebrar com "imports not found". |

## Task breakdown

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | Deletar arquivos e diretórios | — | `ls` e `git status` |
| 2 | Limpar referências em páginas e rotas | 1 | Typecheck |
| 3 | Limpar Zod Schema e Testes | 2 | Unit tests passando |
| 4 | Limpar Locales | 3 | Arquivos json sem chaves mortas |

## Verification criteria

| Outcome | Sensor | Comando |
|---|---|---|
| All | Computacional | `bun run lint && bun run typecheck && bun run test` |
