---
sprint-id: "3"
name: "ui-dashboard"
negotiated-on: "2026-05-29"
parties:
  implementer: "agent:implementer"
  validator: "agent:validator"
status: locked
---

# Sprint 3 — ui-dashboard — CONTRACT

## Items (Implementer commits to delivering)

| # | Item | Acceptance test |
|---|---|---|
| 1 | Refatorar `Dashboard.tsx` para o design de `DesktopDashboard` | Visual test: Layout em Grid (Two-col), Hero banner e métricas de acordo com os tokens do protótipo. |
| 2 | Preservar as queries de Firestore para relatórios e integrações | Visual test: Listagem preenchida dinamicamente se houver relatórios ou contas. |
| 3 | Refatorar `IntegrationsPage.tsx` para o design de `DesktopIntegrationsV2` | Visual test: Layout Projects-first, Modal Novo Projeto. |
| 4 | Refatorar `TransactionsPage.tsx` para o design de `DesktopTransactions` | Visual test: Balance Hero, Side Stats e Segmented filters. |

## Out of scope (explicit)

- Funcionalidades complexas do ReportDetail.

## Sensors a rodar

- [x] `bun run lint` (Biome)
- [x] `bun run typecheck`
- [x] `bun run build` (vite build pass)

## Sign-off

- [ ] Implementer assinou (commit + push)
- [ ] Validator assinou (EVALUATION.md PASS)
- [ ] Human revisou (PR aprovado)
