#!/usr/bin/env bash
# UserPromptSubmit hook helper. Reads prompt from stdin JSON.
# If prompt matches Firebase keywords, emits the contents of context-snippet.txt
# as additionalContext. Otherwise, exits silently.
set -euo pipefail

input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt // ""')

# Match keywords (case-insensitive)
if echo "$prompt" | grep -qiE '(deploy|firestore\.rules|cloud function|callable|firebase-admin|process\.env)'; then
  # Emit the context snippet via the hookSpecificOutput JSON contract.
  # Use jq to safely embed the file content as a JSON string.
  snippet=$(cat "$(git rev-parse --show-toplevel)/scripts/firebase/context-snippet.txt")
  jq -n --arg ctx "$snippet" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$ctx}}'
fi

exit 0
