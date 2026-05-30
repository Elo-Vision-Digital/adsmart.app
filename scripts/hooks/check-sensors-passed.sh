#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks `gh pr create` or `git push` to remote when sensors haven't been run
# recently (lint, typecheck, test).
#
# Princípio 15: score binário — sensors passam ou não passam. PR sem sensors
# verdes recentes força reviewer a rodar do zero ou ficar em dúvida.
#
# Strategy: check if pre-push/pre-commit lefthook has logged a recent green
# run. If not, advise running locally.
#
# Exit 0 = ok; exit 2 = block.
set -euo pipefail

input=$(cat)

bash_cmd=$(echo "$input" | jq -r '.tool_input.command // ""')

case "$bash_cmd" in
  *"gh pr create"*) ;;
  *"git push"*"origin"*) ;;
  *) exit 0 ;;
esac

last_lefthook_run="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/.lefthook-cache/last-run"
max_age_seconds=$((30 * 60))

if [ -f "$last_lefthook_run" ]; then
  last_mtime=$(stat -f %m "$last_lefthook_run" 2>/dev/null || stat -c %Y "$last_lefthook_run" 2>/dev/null || echo 0)
  now=$(date +%s)
  age=$((now - last_mtime))
  if [ "$age" -lt "$max_age_seconds" ]; then
    exit 0
  fi
fi

cat >&2 <<EOF
⚠ Warning: sensors não rodaram nos últimos 30 min antes deste push/PR.

Princípio 15: score binário. Sensors passam ou não passam.

Antes de continuar, rode local:

  bun run typecheck      # exit 0 esperado
  cd packages/shared && bun run test     # 195/195 verde esperado
  bun run lint           # 0 errors esperado

Se sensors verdes, este push/PR estará alinhado com o princípio.

Se houver red, NÃO faça push — corrija primeiro. O lefthook pre-push roda
typecheck automaticamente; deixe ele rodar.

(Este hook é warning, não block. Para forçar block, troque exit 0 abaixo
por exit 2.)

Refs:
  - lefthook.yml
  - docs/HARNESS-RUNBOOK.md § Sensors
EOF

exit 0
