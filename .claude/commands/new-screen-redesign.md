---
description: Refactor visual de uma tela seguindo DS-1 (novo design system AdSmart). Invoca a skill redesign-screen que cobre análise da tela atual, plano de migração, i18n check, accessibility check, teste mobile/desktop.
argument-hint: <PageName>
---

Você vai refatorar UMA tela existente para o novo Design System.

## Args

- `<PageName>`: nome da tela (ex: `Dashboard`, `ReportsPage`, `TemplatesPage`).

## Passos

### 1. Auto-invoke skill

A skill `.claude/skills/redesign-screen/SKILL.md` cobre o workflow completo. Detecte este command e abra a skill.

### 2. Pré-requisitos

- Fase 1 (Design System) mergeada em `develop`. Verificar:

```bash
git log --oneline develop | grep -i "DS-1\|design system" | head -3
```

Se não, parar e avisar.

### 3. Localizar arquivo

```bash
find src/pages -name "<PageName>*.tsx" 2>/dev/null
```

### 4. Seguir skill

A skill estrutura em 6 passos:

1. Inventariar a tela (componentes, hooks, i18n namespace)
2. Plano de migração (tabela "Antes → Depois (DS-1)")
3. i18n check (strings + 3 idiomas)
4. Refactor wave-by-wave (layout → tokens → interações → a11y)
5. Teste (dev local + Lighthouse + bun test/typecheck/lint)
6. Docs sweep (UI-DESIGN.md + CHANGES.md + API-CONTRACTS.md se aplicável)

### 5. Commit por sub-wave

Não tentar refactor monolítico. Commit por sub-wave para PR review fácil.

## Anti-patterns

- ❌ Mexer em lógica de negócio (só visual)
- ❌ Pular i18n (princípio 7)
- ❌ Tailwind v4 syntax antes da Fase 1
- ❌ Deletar testes sem adaptar

## Referências

- [.claude/skills/redesign-screen/SKILL.md](.claude/skills/redesign-screen/SKILL.md) — workflow completo
- [docs/UI-DESIGN.md](docs/UI-DESIGN.md)
- [docs/redesign/EXECUTION-CHECKLIST.md § FASE 3](docs/redesign/EXECUTION-CHECKLIST.md)
