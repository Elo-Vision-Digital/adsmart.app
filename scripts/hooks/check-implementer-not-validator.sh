#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Best-effort guard against the same agent doing both Edit/Write AND validation
# in a single session — princípio 13 (multi-process agents).
#
# Heuristic: when a Bash command tries to invoke "validator" agent OR write to
# EVALUATION.md with verdict: pass, check whether the current session has Edit
# operations recorded. If yes, warn.
#
# Strict enforcement is impossible from a hook (we can't see who called what).
# This hook serves as a reminder + audit log.
#
# Exit 0 = ok; warn only (no block).
set -euo pipefail

input=$(cat)

tool_name=$(echo "$input" | jq -r '.tool_name // ""')
file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

is_evaluation_pass=""
case "$file_path" in
  *EVALUATION.md)
    if echo "$content" | grep -qE "^verdict: pass"; then
      is_evaluation_pass="yes"
    fi
    ;;
esac

if [ -z "$is_evaluation_pass" ]; then
  exit 0
fi

session_marker="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/.lefthook-cache/session-edits"

if [ -f "$session_marker" ]; then
  edit_count=$(wc -l < "$session_marker" | tr -d ' ')
  if [ "${edit_count:-0}" -gt 5 ]; then
    cat >&2 <<EOF
⚠ Warning: tentativa de gravar verdict: pass em $file_path após múltiplas
operações de Edit/Write na mesma sessão (${edit_count} edits registrados).

Princípio 13: Implementer ≠ Validator. O mesmo agente que
editou os arquivos não deve julgar o próprio output (bias inevitável).

Padrão correto:
  - Implementer (main session ou .claude/agents/implementer.md): edita.
  - Validator (.claude/agents/validator.md, sem Edit/Write): julga.

Antes de gravar verdict: pass, invoque o validator agent em processo
separado:

  Agent(
    subagent_type: "validator",
    prompt: "Avalie a sprint <id> contra CONTRACT.md. Score binário."
  )

Use a saída do validator para preencher EVALUATION.md.

(Este hook é warning, não block.)
EOF
  fi
fi

mkdir -p "$(dirname "$session_marker")"
echo "$(date +%s) $tool_name $file_path" >> "$session_marker"

exit 0
