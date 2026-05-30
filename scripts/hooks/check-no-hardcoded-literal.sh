#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks Edit/Write to src/**/*.tsx that introduces user-visible literal strings
# in JSX/attributes without going through t('key') (i18n).
#
# Princípio 7: 3 idiomas obrigatórios — pt-BR, en, es.
# Toda string nova vai em src/locales/*.json + via t('key') no JSX.
#
# Exit 0 = ok; exit 2 = block (stderr = razão).
set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

case "$file_path" in
  *.test.tsx|*.stories.tsx|*.config.*) exit 0 ;;
  *src/locales/*) exit 0 ;;
esac

text_in_element=$(echo "$content" | grep -nE ">[A-Z][a-zA-ZÀ-ÿ ]{2,}<" | grep -v "t(" || true)
attr_literal=$(echo "$content" | grep -nE '(title|placeholder|alt|aria-label|aria-description)="[A-Z][^"]+"' || true)

offenders=""
if [ -n "$text_in_element" ]; then
  offenders="${offenders}${text_in_element}
"
fi
if [ -n "$attr_literal" ]; then
  offenders="${offenders}${attr_literal}
"
fi

if [ -z "$offenders" ]; then
  exit 0
fi

cat >&2 <<EOF
❌ Blocked: hardcoded user-visible string in JSX/attribute.

Detected in $file_path:
$(echo "$offenders" | head -5)

Princípio 7: zero literal hardcoded em JSX/TSX. Use t('key') e
adicione a chave em pt-BR + en + es (src/locales/*.json).

Exemplos de fix:

  // ❌ Antes
  <Button>Add credits</Button>
  <input placeholder="Search reports" />

  // ✅ Depois
  <Button>{t('wallet.addCredits')}</Button>
  <input placeholder={t('reports.searchPlaceholder')} />

Use /check-i18n após adicionar a chave para verificar as 3 línguas.

Refs:
  - docs// (princípio 7)
  - src/AGENTS.md § i18n
  - .claude/skills/verify-i18n/SKILL.md
EOF
exit 2
