---
sprint-id: "3"
name: "ui-dashboard"
status: contract
depends-on: ["2"]
est-days: 0
references:
  - docs/redesign/EXECUTION-CHECKLIST.md
---

# Sprint 3 — ui-dashboard — SPEC

> Refatoração da página principal `Dashboard.tsx` para seguir o layout de `DesktopDashboard`.

## Outcomes

- [ ] Outcome 1: `Dashboard.tsx` refatorada para possuir a estrutura em grid do protótipo (Greeting, Hero Balance Card, Quick Metrics Row, Two-col de relatórios e integrações).
- [ ] Outcome 2: Layout com classes css (tokens) inseridos via `style` tag (ou conversões p/ tailwind/tokens) de acordo com o protótipo.
- [ ] Outcome 3: Estado de hooks persistidos, preservando a lógica de query do firestore para accounts e reports, injetando nos componentes adequados.

## Scope

### In

- `src/pages/Dashboard.tsx`.
- Refazer a interface baseando-se no `screens-desktop.jsx`.
- Ícones importados do lucide-react com tamanhos e strokeWidths equivalentes.

### Out

- Lógica do Firebase (já existe e será mantida).
- O backend de pagamentos de créditos. Apenas exibiremos os botões de UI e um mock provisório ou hooks já existentes da wallet (`useWallet` se houver).

## Constraints

- O CSS e visual deve bater 100% com o protótipo, mas precisamos mesclar isso com os dados reais mapeados nos hooks.

## Task breakdown

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | Extrair e aplicar DOM de `DesktopDashboard` em `Dashboard.tsx` | — | Code review |
| 2 | Substituir dados mockados por variávies dos hooks | 1 | Code review |

## Verification criteria

| Outcome | Sensor | Comando / Subagent |
|---|---|---|
| 1-3 | Computacional | `bun run typecheck && bun run build` passa |
| 1-3 | Inferencial | Inspeção visual atestando correspondência total |
