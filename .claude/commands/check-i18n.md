---
description: Valida que toda chave i18n adicionada/modificada está nas 3 línguas (pt-BR, en, es) e nenhuma string hardcoded em JSX/TSX. Reporta divergências e propõe fixes.
argument-hint: (sem args — opera no diff atual)
---

Você vai validar i18n no diff atual.

## Passos

### 1. Auto-invoke skill

A skill `.claude/skills/verify-i18n/SKILL.md` cobre o workflow.

### 2. Diff dos locales

```bash
git diff HEAD src/locales/pt-BR.json src/locales/en.json src/locales/es.json
```

Se diff só toca um, é divergência potencial.

### 3. Estrutura paralela (chaves)

```bash
for lang in pt-BR en es; do
  jq -r 'paths(scalars) | join(".")' "src/locales/${lang}.json" | sort > "/tmp/${lang}.keys"
done
diff /tmp/pt-BR.keys /tmp/en.keys
diff /tmp/pt-BR.keys /tmp/es.keys
```

### 4. Strings hardcoded em JSX

```bash
grep -nE ">[A-Z][a-zA-ZÀ-ÿ ]{2,}<" src/**/*.tsx | grep -v "t('" | head -20
```

Cada match é candidato a refactor.

### 5. Chaves órfãs

```bash
jq -r 'paths(scalars) | join(".")' src/locales/pt-BR.json | while read -r key; do
  if ! grep -rq "t('${key}')" src/; then
    echo "ORPHAN: $key"
  fi
done
```

### 6. Report

Tabela:

| Chave | pt-BR | en | es | Status |
|---|---|---|---|---|
| `wallet.balance` | ✅ | ✅ | ✅ | OK |
| `wallet.add_funds` | ✅ | ❌ | ✅ | MISSING en |

### 7. Fix proposals

- MISSING: mostrar valor pt-BR + sugerir tradução en/es (perguntar usuário)
- ORPHAN: perguntar se delete ou keep
- HARDCODED: sugerir chave nova + apresentar refactor

## Anti-patterns

- ❌ Auto-traduzir sem perguntar (qualidade)
- ❌ Adicionar chave em só 1 idioma
- ❌ Deletar órfã sem checar uso indireto (template strings, refs dinâmicas)

## Referências

- [.claude/skills/verify-i18n/SKILL.md](.claude/skills/verify-i18n/SKILL.md)
- [docs/I18N.md](docs/I18N.md)
- Hook `scripts/hooks/check-no-hardcoded-literal.sh` (Wave 4 da Fase 0b)
