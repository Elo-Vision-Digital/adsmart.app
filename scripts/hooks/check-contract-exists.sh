#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks Edit/Write inside docs/specs/{id}-{name}/ folder when CONTRACT.md
# is missing OR status != locked, UNLESS the file being edited is one of the
# sprint artifacts themselves (SPEC, CONTRACT, PROGRESS, EVALUATION).
#
# Princípio 14: contracts antes da execução. CONTRACT locked = green light
# para implementar items declarados.
#
# Exit 0 = ok; exit 2 = block.
set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

case "$file_path" in
  *docs/specs/*) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  *_templates/*) exit 0 ;;
  *SPEC.md|*CONTRACT.md|*PROGRESS.md|*EVALUATION.md) exit 0 ;;
esac

sprint_dir=$(echo "$file_path" | sed -E 's|(.*docs/specs/[^/]+).*|\1|')
contract_path="$sprint_dir/CONTRACT.md"

if [ ! -f "$contract_path" ]; then
  cat >&2 <<EOF
❌ Blocked: tentativa de Edit/Write em sprint sem CONTRACT.md.

Sprint folder: $sprint_dir
Arquivo: $file_path

Princípio 14: nenhum Edit/Write em arquivos de sprint antes
do CONTRACT.md estar criado e com status: locked.

Próximos passos:
  1. /new-sprint <id> <name>  (se ainda não existe)
  2. Preencher SPEC.md
  3. /plan-sprint <id>
  4. /negotiate-contract <id>  (lock o CONTRACT)
  5. Daí sim, Edit/Write nos arquivos da sprint

Refs:
  - docs/HARNESS-RUNBOOK.md
  - .claude/skills/negotiate-contract/SKILL.md
EOF
  exit 2
fi

status=$(grep -E '^status:' "$contract_path" | head -1 | awk '{print $2}')

if [ "$status" != "locked" ]; then
  cat >&2 <<EOF
❌ Blocked: CONTRACT.md existe mas status = '$status' (esperado: locked).

CONTRACT: $contract_path
Arquivo tentando editar: $file_path

CONTRACT precisa estar status: locked antes de Edit/Write em arquivos
implementados pela sprint.

Use /negotiate-contract <id> para fechar o lock.

Refs:
  - .claude/skills/negotiate-contract/SKILL.md
EOF
  exit 2
fi

exit 0
