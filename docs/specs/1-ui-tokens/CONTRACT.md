---
sprint-id: "1"
name: "ui-tokens"
negotiated-on: "2026-05-29"
parties:
  implementer: "agent:implementer"
  validator: "agent:validator"
status: locked  # draft | locked | satisfied | failed
---

# Sprint 1 — ui-tokens — CONTRACT

> Lista negociada Implementer ↔ Validator. Locked antes da execução. Validator bate item-a-item.

## Items (Implementer commits to delivering)

Cada item é binário: entregue ou não entregue. Sem "parcial".

| # | Item | Acceptance test |
|---|---|---|
| 1 | Atualizar `@layer base` no `src/index.css` com as cores do `public/prototype/tokens.css` | O arquivo `index.css` inclui as vars como `--bg-elev`, `--text-2`, etc. para modo claro e escuro. |
| 2 | Estender o `tailwind.config.js` para usar as novas variáveis (e remover `primary-blue` se apropriado) | `bun run build` roda com sucesso sem erros. |
| 3 | Incluir utilitários tipográficos `.t-display` a `.t-mono` no CSS | Verificação visual/leitura do CSS do `src/index.css`. |

## Out of scope (explicit)

- [ ] Aplicar essas classes nas views React existentes (ex: Dashboard, Sidebar) — isso é para as Sprints 2 e 3.

## Sensors a rodar

Computacionais (bloqueantes, score binário):

- [x] `bun run lint` (Biome)
- [x] `bun run typecheck`
- [x] `bun run build` (vite build pass)

Inferenciais (caros, seletivos):

- [x] `pr-review-toolkit:code-reviewer` (simulado via prompt)

## Sign-off

- [ ] Implementer assinou (commit + push)
- [ ] Validator assinou (EVALUATION.md PASS)
- [ ] Human revisou (PR aprovado)
