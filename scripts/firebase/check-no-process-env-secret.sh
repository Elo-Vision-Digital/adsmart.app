#!/usr/bin/env bash
# PreToolUse hook helper. Reads tool input JSON on stdin.
# Blocks Edit/Write in functions/src/ if it introduces process.env.XXX_SECRET.
# Exit 2 = block; stderr message shown to Claude.
set -euo pipefail

input=$(cat)

# Extract content from Edit (new_string) or Write (content)
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

# Narrow regex (R8): only _SECRET suffix. _KEY/_TOKEN can be public values
# (FIREBASE_API_KEY, RECAPTCHA_SITE_KEY, GTM_TOKEN).
if echo "$content" | grep -qE 'process\.env\.[A-Z_]+_SECRET\b'; then
  cat >&2 <<'EOF'
❌ Blocked: process.env.<NAME>_SECRET detected in functions/src/.

AdSmart uses defineSecret for ALL secrets in Cloud Functions.

Do this instead:
  1. Add to functions/src/config/index.ts:
     export const mySecret = defineSecret('MY_SECRET')
  2. Import in the function: import { mySecret } from './config'
  3. Pass via onCall options: { secrets: [mySecret] }
  4. Use in body: mySecret.value()

Refs:
  - functions/src/config/index.ts (existing examples)
  - docs/SECURITY.md
  - https://firebase.google.com/docs/functions/config-env
EOF
  exit 2
fi

exit 0
