---
description: Detecta strings hardcoded user-visible em JSX/TSX que deveriam estar via t('key'). Princípio 7 do roadmap. Mais agressivo que /check-i18n (não exige diff prévio).
argument-hint: [path] (default src/**/*.tsx)
---

Você vai escanear o repo em busca de strings hardcoded em JSX/TSX.

## Args

- `[path]`: opcional. Default: `src/**/*.tsx`. Exemplos: `src/pages/`, `src/components/ui/`.

## Passos

### 1. Texto entre `>` e `<` (elemento)

```bash
grep -rnE ">[A-Z][a-zA-ZÀ-ÿ ]{2,}<" ${PATH:-src/}**/*.tsx | grep -v "t('" | head -50
```

Padrão: linhas com texto começando em maiúscula entre tags JSX.

### 2. Atributos comuns

```bash
grep -rnE 'title="[A-Z][^"]+"|placeholder="[A-Z][^"]+"|alt="[A-Z][^"]+"|aria-label="[A-Z][^"]+"' ${PATH:-src/}**/*.tsx | head -30
```

Atributos `title`, `placeholder`, `alt`, `aria-label`, `aria-description` com literal.

### 3. Button/anchor com texto

```bash
grep -rnE "<(Button|button|a)[^>]*>[A-Z][^<]+" ${PATH:-src/}**/*.tsx | grep -v "t('" | head -30
```

### 4. Errors/toasts com mensagem

```bash
grep -rnE "(toast\.(error|success|info|warning)|throw new Error)\(['\"][A-Z]" ${PATH:-src/}**/*.tsx | head -30
```

### 5. Excluir falsos positivos

Algumas strings são OK:
- IDs técnicos (`data-testid="login-button"`)
- URLs e paths (`href="/dashboard"`)
- Class names (`className="bg-surface"`)
- Constantes que vão pra Context7-fetched UI (futuro)
- Stripped por filename: `*.test.tsx`, `*.stories.tsx`, `*.config.ts` — esses não passam pela regra

### 6. Para cada match real

Output:
```
src/pages/X.tsx:42  "Add credits"  → propose t('wallet.addCredits')
```

Apresentar refactor concreto + chave nova + valores nos 3 idiomas (perguntar tradução).

### 7. Auto-fix?

NÃO. Sempre perguntar antes de editar. Refactor i18n exige cuidado.

## Anti-patterns

- ❌ Refactor automático (perde nuance de tradução)
- ❌ Ignorar `aria-*` (a11y depende)
- ❌ Tratar template strings sem checar (`{`...`${var}...`}`) — alguns são i18n via `t('k', { var })`

## Referências

- [.claude/skills/verify-i18n/SKILL.md](.claude/skills/verify-i18n/SKILL.md)
- Hook `scripts/hooks/check-no-hardcoded-literal.sh` (Wave 4 da Fase 0b) — bloqueio automático em pre-commit
- Princípio 7 em [docs/redesign/FEATURES-INVENTORY.md](docs/redesign/FEATURES-INVENTORY.md)
