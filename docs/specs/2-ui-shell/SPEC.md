---
sprint-id: "2"
name: "ui-shell"
status: contract
depends-on: ["1"]
est-days: 0
references:
  - docs/redesign/EXECUTION-CHECKLIST.md
---

# Sprint 2 — ui-shell — SPEC

> Refatoração do layout base (Shell, Sidebar, Header) da aplicação.

## Outcomes

- [ ] Outcome 1: `Sidebar.tsx` substituída pela versão desktop atualizada com a identidade visual nova.
- [ ] Outcome 2: `Header.tsx` convertido em `DesktopTopBar` seguindo o design do protótipo (com barra de busca, notificação e saldo simplificado).
- [ ] Outcome 3: `MainLayout.tsx` refatorado (DesktopShell) para usar 100vh com flexbox, overflow hidden na raiz e scroll interno no `main`.

## Scope

### In

- Modificação dos componentes visuais em `src/components/layout/`.
- Uso restrito dos ícones Lucide atualizados (temporariamente mapeando ícones do protótipo `IconSparkle`, etc para os mais próximos do Lucide-react com os mesmos stroke-widths).
- Preservação da lógica existente de autenticação e navegação (os botões devem continuar redirecionando pros mesmos lugares).

### Out

- Ocultar MobileHeader e BottomNavigation nesta etapa, pois o foco atual é 100% desktop (1280x820). Mobile ficará para uma refatoração separada, sendo mantido `hidden md:block` na arquitetura.
- Telas internas (Dashboard, Configurações).

## Constraints

- O menu lateral tem 248px fixos e fundo igual a `--bg`.
- TopBar usa backdrop filter blur e fica position sticky/relative na parte superior.

## Task breakdown

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | Refatorar Sidebar | — | Code review visual |
| 2 | Refatorar Header | — | Code review visual |
| 3 | Integrar e estruturar MainLayout | 1, 2 | Code review e Build |

## Verification criteria

| Outcome | Sensor | Comando / Subagent |
|---|---|---|
| 1-3 | Computacional | `bun run build` passa |
| 1-3 | Inferencial | Inspeção visual |
