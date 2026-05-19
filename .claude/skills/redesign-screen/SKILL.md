---
name: redesign-screen
description: Workflow para refactor visual de uma tela existente seguindo o novo Design System (DS-1) da AdSmart. Use quando o usuário pedir "redesenhar a página X", "aplicar o novo design system na tela Y", "migrar a tela Z para os novos primitives", ou referenciar DS-1 / Fase 1 / Fase 3 do redesign roadmap. Cobre análise da tela atual, identificação de primitives, plano de migração, checks de i18n e acessibilidade, e teste mobile + desktop.
---

# Redesign screen — AdSmart DS-1 workflow

Esta skill orquestra o refactor de UMA tela existente para o novo Design System (DS-1 + Tailwind v4 + SF Pro + primitives novos). É a unidade de trabalho típica das Fases 1-3 do redesign roadmap.

## When to invoke

Auto-invoke quando o usuário descrever refactor visual de tela:
- "Redesenhar Dashboard / ReportsPage / TemplatesPage / etc."
- "Aplicar DS-1 em [tela]"
- "Migrar [tela] para os novos primitives"
- "Refactor visual da [tela]"

NÃO use para: criar tela NOVA do zero (use `feature-dev:feature-dev`), criar feature que muda lógica de negócio, mudanças de back-end.

## Pré-requisitos

A Fase 1 (Design System) deve ter mergeado para `develop` antes desta skill rodar. Verifique:

```bash
git log --oneline develop | grep -i "DS-1\|design system" | head -5
```

Se não, parar e avisar usuário que Fase 1 ainda não está pronta.

## Workflow

### Passo 1 — Inventariar a tela atual

```bash
# Localizar arquivo
ls src/pages/{ScreenName}*.tsx 2>/dev/null

# Componentes importados
grep -E "^import.*from '@/" src/pages/{ScreenName}.tsx

# Hooks consumidos
grep -E "use(Auth|Language|Theme|Wallet|Reports|ProductPrices)" src/pages/{ScreenName}.tsx
```

Documentar:
- Estrutura visual (header, body, footer, modais)
- Componentes shadcn/ui ainda usados (Button, Card, Dialog, …)
- Translation namespace (`t('screen.key')`)
- Estado (hooks de Context + estado local)

### Passo 2 — Plano de migração

Lista o que muda:

| Antes | Depois (DS-1) | Risco |
|---|---|---|
| `<Button>` shadcn | `<Button>` DS-1 (nova variant API) | API similar — baixo |
| `<Card>` shadcn | `<Card>` DS-1 (novo padding/shadow) | médio |
| Tailwind 3 classes | Tailwind v4 (`@theme`-aware) | baixo (migration auto pelo PostCSS) |
| Inline `style={}` | tokens DS-1 (`bg-surface-2`) | médio |
| Cores hardcoded | tokens semânticos (`text-foreground`) | médio |

### Passo 3 — i18n check

Antes de editar, listar TODAS as strings que aparecem na tela:

```bash
grep -oE "t\('[^']+'\)" src/pages/{ScreenName}.tsx | sort -u
```

Confirmar que cada chave existe em pt-BR, en e es. Se faltar, adicionar ANTES de editar o componente. Se houver string hardcoded, marcar para mover para o JSON.

### Passo 4 — Refactor wave-by-wave

Sub-waves recomendadas:
- **Wave 1**: layout + estrutura (sem mexer em cores/spacings ainda)
- **Wave 2**: tokens DS-1 (substituir cores/spacings hardcoded por tokens)
- **Wave 3**: interações (animations, transitions, focus states)
- **Wave 4**: a11y (tab order, aria-labels, contrast)

Commit por sub-wave.

### Passo 5 — Teste

Manual:
```bash
bun run dev
# abrir em mobile (DevTools responsive) + desktop (≥1024px)
# tab through para a11y
# Lighthouse audit (acessibilidade ≥ 95)
```

Automatizado:
```bash
bun run test    # vitest dos testes co-located
bun run typecheck
bun run lint
```

### Passo 6 — Docs sweep

- Update [docs/UI-DESIGN.md](docs/UI-DESIGN.md) se tela introduzir padrão novo
- Add entry em [docs/CHANGES.md](docs/CHANGES.md) com data
- Se mudou propriedade pública (props de export reutilizado), update [docs/API-CONTRACTS.md](docs/API-CONTRACTS.md)

## Anti-patterns

- ❌ Não mexer em lógica de negócio neste workflow — só visual
- ❌ Não pular i18n (princípio 7) — toda string em pt-BR/en/es
- ❌ Não introduzir Tailwind v4 syntax antes da Fase 1 mergear
- ❌ Não deletar testes existentes — adapte se a estrutura mudou

## Referências

- [docs/UI-DESIGN.md](docs/UI-DESIGN.md) — sistema visual completo
- [docs/redesign/FEATURES-INVENTORY.md § DS-1](docs/redesign/FEATURES-INVENTORY.md) — refundação visual
- [docs/redesign/EXECUTION-CHECKLIST.md § FASE 1 + FASE 3](docs/redesign/EXECUTION-CHECKLIST.md)
- [src/AGENTS.md](src/AGENTS.md) — frontend conventions
