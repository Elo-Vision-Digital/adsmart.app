---
sprint-id: "1"
name: "ui-tokens"
status: shipped  # planning | research | contract | implementing | validating | shipped
depends-on: []    # [{sprint-id}, ...]
est-days: 0
references:
  - docs//
  - docs//
---

# Sprint 1 — ui-tokens — SPEC

> Feedforward artifact (guide). Lido pelos agents ANTES da execução para entender escopo e restrições.

## Outcomes

Lista do que precisa ser verdade quando esta sprint terminar. Cada item é binário (passou/não passou) e verificável.

- [ ] Outcome 1: `src/index.css` contém os novos design tokens (cores, raios, sombras) de acordo com `public/prototype/tokens.css`.
- [ ] Outcome 2: Tipografia (SF Pro/Inter) ajustada para a classe `.t-*` ou utilitários Tailwind definidos no config.
- [ ] Outcome 3: A aplicação roda e compila perfeitamente sem quebrar o layout básico atual.
- [ ] Outcome 4: `tailwind.config.js` estendido com as novas cores e tipografias do protótipo.

## Scope

### In

- Adição de tokens de cor (`--bg`, `--bg-elev`, `--text`, etc.).
- Adição de utilitários css comuns (escala de texto `.t-*`, raios, shadows) descritos em `tokens.css`.
- Atualização do arquivo base do Tailwind (`tailwind.config.js`).

### Out

- Refatoração de componentes React (Headers, Sidebars, Dashboards) - Sprint 2 e 3.
- Funcionalidades complexas ou rotas (fora do escopo UI core).

## Constraints

| Tipo | Restrição |
|---|---|
| Arquitetura CSS | Manter uso do Tailwind e `@layer base` para injetar os tokens. |
| Dark Mode | A classe raiz atual `[data-theme="dark"]` deve coexistir temporariamente com o novo padrão `.theme-dark` ou deve ser refatorado se for trivial. |

## Prior decisions

- A nova identidade visual adota uma paleta restrita preto/branco (light) e monocromática rica com cyan para data viz (dark), conforme definido no bundle do Claude Design (2026-05-28).

## Task breakdown

| # | Task | Depende de | Verifiable as |
|---|---|---|---|
| 1 | Extrair e adaptar vars CSS de `public/prototype/tokens.css` para `src/index.css` (em `@layer base`) | — | Inspeção de código |
| 2 | Mapear essas variáveis no `tailwind.config.js` | 1 | App compila sem erros CSS |
| 3 | Transferir classes de tipografia `.t-*` para `@layer components` ou `.adsmart-scope` | 1 | Inspeção de código |

## Verification criteria

| Outcome | Sensor | Comando / Subagent |
|---|---|---|
| 1 | Computacional | `bun run typecheck` & `bun run build` funcionam sem crashar |
| 2 | Inferencial | `Agent(validator, "verificar index.css e tailwind.config.js em relação ao prototype/tokens.css")` |
