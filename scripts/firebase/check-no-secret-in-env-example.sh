#!/usr/bin/env bash
# PreToolUse hook helper. Reads tool input JSON on stdin.
# Blocks Edit/Write to any .env.example file if it introduces a real-looking
# value for a key whose name suggests a credential (*_SECRET, *_TOKEN,
# *_PASSWORD, *_API_KEY, *_PRIVATE_KEY).
#
# Real incident 2026-05-18: GOOGLE_ADS_DEVELOPER_TOKEN=wRhu9OHLIWdbht2HY3B9yw
# shipped to functions/.env.example as a "quick-start crib sheet" — value
# still exists in git history.
#
# Rule: .env.example is for KEY= (empty) or KEY=<placeholder>. Never KEY=real-value.
#
# Exit 2 = block; stderr message shown to Claude.
set -euo pipefail

input=$(cat)

content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

# Find candidate lines: credential-shaped key with non-empty value
candidates=$(echo "$content" | grep -E '^[A-Z_]+_(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|CLIENT_SECRET|API_KEY)=[^[:space:]].*$' || true)

if [ -z "$candidates" ]; then
  exit 0
fi

# Filter OUT placeholder-shaped values; what remains is real-looking.
# Placeholder patterns: starts with your-, YOUR_, REPLACE_, TODO, placeholder,
# example, < (angle bracket), or $ (shell var reference). Case-insensitive.
offenders=$(echo "$candidates" | grep -ivE '=(your-|YOUR_|REPLACE_|TODO|placeholder|example|<|\$)' || true)

if [ -z "$offenders" ]; then
  exit 0
fi

cat >&2 <<EOF
❌ Blocked: real-looking credential value in a .env.example file.

Detected:
$(echo "$offenders" | head -3)

.env.example is for KEY=<placeholder>, never KEY=real-value. Real values
belong in:
  - functions/.env (gitignored, NON-secrets only)
  - Cloud Secret Manager via firebase functions:secrets:set (anything sensitive)

Real incident 2026-05-18: GOOGLE_ADS_DEVELOPER_TOKEN was committed verbatim
to functions/.env.example; value still lives in git history. Don't repeat.

If this is intentional, use one of these placeholder forms:
  KEY=
  KEY=your-token-here
  KEY=<REPLACE_ME>
  KEY=\${SECRET_FROM_SOMEWHERE}

Refs:
  - docs/Decisions.md ADR-021 (prepare-deploy hardening)
  - functions/.env.example (current sanitized state)
EOF
exit 2
