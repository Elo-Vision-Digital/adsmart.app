---
name: verify-i18n
description: Valida que toda chave i18n adicionada/modificada está presente nas 3 línguas (pt-BR, en, es) e que não há strings hardcoded em JSX/TSX. Use antes de PR, depois de editar arquivos em src/locales/, ou quando o usuário pedir "checar i18n", "validar traduções", "todas as línguas tão alinhadas?", ou referenciar princípio 7 do roadmap. Verifica também chaves órfãs (existem no JSON mas não são usadas no código).
---

# Verify i18n — AdSmart 3-locale check

Princípio 7 do projeto: **toda string nova existe em pt-BR + en + es**. Esta skill verifica e relata divergências.

## When to invoke

Auto-invoke quando:
- O usuário pedir "checar i18n", "validar traduções", "verificar línguas"
- Antes de abrir PR que toca `src/locales/` ou JSX/TSX
- Após `Edit/Write` em `src/locales/pt-BR.json`, `en.json`, ou `es.json`

NÃO use para: criar tradução nova (use `Edit` direto no JSON). Esta skill VALIDA — não cria.

## Hard rule

- pt-BR é source language. Chave adicionada em pt-BR deve aparecer em en + es na mesma estrutura.
- Nenhum literal hardcoded em JSX/TSX. Use `t('key')` sempre.

## Workflow

### Passo 1 — Diff dos locales

```bash
git diff HEAD src/locales/pt-BR.json src/locales/en.json src/locales/es.json
```

Se diff só toca um dos 3, isso já é uma divergência potencial.

### Passo 2 — Estrutura paralela

Extrair as chaves de cada JSON e comparar:

```bash
# Linhas de chaves (estrutura aninhada via jq)
for lang in pt-BR en es; do
  jq -r 'paths(scalars) | join(".")' "src/locales/${lang}.json" | sort > /tmp/${lang}.keys
done

# Diff
echo "=== pt-BR vs en ==="
diff /tmp/pt-BR.keys /tmp/en.keys | head -30

echo "=== pt-BR vs es ==="
diff /tmp/pt-BR.keys /tmp/es.keys | head -30
```

Cada linha `<` é chave faltando no idioma à direita. Cada `>` é chave extra.

### Passo 3 — Strings hardcoded em JSX/TSX

Padrão: detectar strings de mais de 2 chars dentro de JSX (heurística):

```bash
# Linhas com strings entre > < (texto de elemento)
grep -nE ">[A-Z][a-zA-ZÀ-ÿ ]{2,}<" src/**/*.tsx | grep -v "t('" | head -20

# Atributos comum: title=, placeholder=, alt= com literal
grep -nE 'title="[A-Z][^"]+"|placeholder="[A-Z][^"]+"|alt="[A-Z][^"]+"' src/**/*.tsx | head -20
```

Cada match precisa ser revisado. Se for string user-visible, mover para JSON. Se for chave técnica (ex: `data-testid="login-button"`), ok.

### Passo 4 — Chaves órfãs no JSON

Chave existe no pt-BR.json mas não é usada em src/:

```bash
jq -r 'paths(scalars) | join(".")' src/locales/pt-BR.json | while read -r key; do
  if ! grep -rq "t('${key}')" src/; then
    echo "ORPHAN: $key"
  fi
done
```

Órfãs viram tech debt. Considere remover ou marcar como "intentional fallback".

### Passo 5 — Report

Produzir tabela:

| Chave | pt-BR | en | es | Status |
|---|---|---|---|---|
| `wallet.balance` | ✅ | ✅ | ✅ | OK |
| `wallet.add_funds` | ✅ | ❌ | ✅ | MISSING en |
| `legacy.old_button` | ✅ | ✅ | ✅ | ORPHAN (no usage) |

### Passo 6 — Fix proposals

Para cada MISSING:
- Mostrar valor pt-BR (source)
- Sugerir tradução en/es (não traduzir automaticamente sem confirmação)
- Apresentar diff proposto

Para cada ORPHAN:
- Listar
- Perguntar ao usuário se deve deletar ou manter

Para cada HARDCODED:
- Mostrar arquivo:linha
- Sugerir chave nova (`namespace.descriptiveKey`)
- Apresentar refactor proposto

## Anti-patterns

- ❌ Auto-traduzir sem confirmar (qualidade ruim, perde nuance)
- ❌ Adicionar chave em apenas 1 idioma
- ❌ Deletar órfã sem perguntar (pode ser intentional fallback)

## Referências

- [src/AGENTS.md § i18n](src/AGENTS.md) — regra mandatory
- [docs/I18N.md](docs/I18N.md) — convenção full
- `scripts/hooks/check-no-hardcoded-literal.sh` (Fase 0b) — bloqueio automático
- [src/locales/types.ts](src/locales/types.ts) — typed surfaces
