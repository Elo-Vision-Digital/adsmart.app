---
sprint-id: "2"
name: "ui-shell"
negotiated-on: "2026-05-29"
parties:
  implementer: "agent:implementer"
  validator: "agent:validator"
status: locked
---

# Sprint 2 — ui-shell — CONTRACT

## Items (Implementer commits to delivering)

| # | Item | Acceptance test |
|---|---|---|
| 1 | `Sidebar.tsx` recebe as novas cores, tipografia `.t-small` e navegação baseada no array do protótipo | Inspeção visual do componente |
| 2 | `Header.tsx` adquire o visual de TopBar (com input de busca e cards) | Inspeção visual do componente |
| 3 | `MainLayout.tsx` passa a envolver a aplicação usando flexbox com overflow root e Sidebar side-by-side | `bun run build` roda com sucesso sem erros. |

## Out of scope (explicit)

- Refatoração da DashboardPage
- Suporte a Mobile (será mantido o código antigo oculto na versão desktop, e o desktop oculto no mobile)

## Sensors a rodar

- [x] `bun run lint` (Biome)
- [x] `bun run typecheck`
- [x] `bun run build` (vite build pass)

## Sign-off

- [ ] Implementer assinou (commit + push)
- [ ] Validator assinou (EVALUATION.md PASS)
- [ ] Human revisou (PR aprovado)
