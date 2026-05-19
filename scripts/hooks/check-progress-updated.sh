#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks `git commit` when the current sprint's PROGRESS.md has NOT been
# modified in the last 3 commits, encouraging the "document before advancing"
# rule (memory `feedback_document_before_advancing`).
#
# Heuristic: a sprint with many commits but stale PROGRESS likely lost context.
#
# Exit 0 = ok; exit 2 = block.
set -euo pipefail

input=$(cat)

bash_cmd=$(echo "$input" | jq -r '.tool_input.command // ""')

case "$bash_cmd" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

current_sprint=$(ls -1d docs/specs/*/ 2>/dev/null | grep -v _templates | sort -V | tail -1 || true)

if [ -z "$current_sprint" ]; then
  exit 0
fi

progress_file="${current_sprint}PROGRESS.md"

if [ ! -f "$progress_file" ]; then
  exit 0
fi

progress_modified_recently=$(git log -3 --name-only --pretty=format: HEAD 2>/dev/null | grep -F "$progress_file" || true)

if [ -n "$progress_modified_recently" ]; then
  exit 0
fi

commits_since_progress=$(git rev-list HEAD --not $(git log --all --format="%H" -- "$progress_file" | head -1 || echo HEAD)^ 2>/dev/null | wc -l | tr -d ' ' || echo 0)

if [ "${commits_since_progress:-0}" -lt 3 ]; then
  exit 0
fi

cat >&2 <<EOF
⚠ Warning: PROGRESS.md da sprint atual não atualizado nos últimos 3 commits.

Sprint: ${current_sprint%/}
PROGRESS: $progress_file

Memory rule (feedback_document_before_advancing): checkpoint cada ~3 commits
durante implementação. Mitiga perda de contexto após /compact.

Antes de commitar:
  bash scripts/harness/update-progress.sh "<nota descritiva>"

OU edite PROGRESS.md manualmente registrando o checkpoint atual.

Se a nota já está no commit anterior e você está sequenciando rapidamente,
ok pular este — mas considere se haveria valor em capturar onde você está.

(Este hook é warning, não block. Para forçar block, troque exit 0 abaixo
por exit 2.)
EOF

exit 0
