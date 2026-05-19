#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks Edit/Write to firestore.rules that adds a `match /path/{id}` block
# without an explicit `allow ... if false` or restrictive condition.
#
# Princípio 10: toda nova coleção tem default deny + permissions específicas.
#
# Exit 0 = ok; exit 2 = block.
set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

case "$file_path" in
  firestore.rules|*/firestore.rules) ;;
  *) exit 0 ;;
esac

new_matches=$(echo "$content" | grep -nE 'match /[a-zA-Z_]+/\{' || true)

if [ -z "$new_matches" ]; then
  exit 0
fi

has_explicit_deny=$(echo "$content" | grep -E '(allow .* if false|allow read, write: if false)' || true)
has_request_auth=$(echo "$content" | grep -E 'request\.auth' || true)

if [ -n "$has_explicit_deny" ] || [ -n "$has_request_auth" ]; then
  exit 0
fi

cat >&2 <<EOF
❌ Blocked: firestore.rules tem match block sem default deny ou auth-check.

Detected matches:
$(echo "$new_matches" | head -3)

Princípio 10: toda nova coleção precisa ter:
  - allow read, write: if false  (default deny explícito) OU
  - allow ...: if request.auth.uid == ...  (auth-gated)

Sem isso, a rule é "deny by default" do Firestore (que é ok) MAS uma rule
permissiva pode acidentalmente liberar acesso quando outra rule casa.

Padrão recomendado:

  match /reports/{reportId} {
    // server-only: cliente nunca escreve aqui
    allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    allow write: if false;
  }

Use o agent firestore-rules-reviewer pré-deploy:
  Agent(subagent_type: "firestore-rules-reviewer", ...)

Refs:
  - docs/SECURITY.md
  - firestore.rules (Phase 3 baseline)
  - .claude/agents/firestore-rules-reviewer.md
EOF
exit 2
