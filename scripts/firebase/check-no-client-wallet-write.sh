#!/usr/bin/env bash
# PreToolUse hook helper. Reads tool input JSON on stdin.
# Blocks Edit/Write in src/ if it introduces a client-side setDoc to
# wallet/current or transactions/. Phase 3 firestore.rules rejects these
# at runtime (see firestore.rules:51-58 and ADR-010); this hook surfaces
# the failure at dev-time instead.
set -euo pipefail

input=$(cat)
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

# Pattern A: string-path setDoc
patternA='setDoc\([^)]*['"'"'"][^'"'"'"]*\b(wallet/current|transactions/)'
# Pattern B: modular SDK doc(db, ..., 'wallet', 'current')
patternB='setDoc\(\s*doc\([^)]*['"'"'"]wallet['"'"'"][[:space:]]*,[[:space:]]*['"'"'"]current['"'"'"]'
# Pattern C: modular SDK doc(db, ..., 'transactions', ...)
patternC='setDoc\(\s*doc\([^)]*['"'"'"]transactions['"'"'"][[:space:]]*,'

if echo "$content" | grep -qE "$patternA" \
  || echo "$content" | grep -qE "$patternB" \
  || echo "$content" | grep -qE "$patternC"; then
  cat >&2 <<'EOF'
❌ Blocked: client-side setDoc on wallet/current or transactions/.

Phase 3 firestore.rules reject these writes at runtime
(firestore.rules:51-58 and ADR-010).

Wallet and transactions are write-only via Cloud Functions (Admin SDK).

Use instead:
  - For users/{uid} name/phone: updateDoc (allowed by rules)
  - For wallet credit/debit: call a callable function (e.g., admin path
    via adminWalletManager, or a new callable using defineSecret + transaction)
  - For transactions: callable that writes via Admin SDK

Refs:
  - docs/Decisions.md → ADR-010 (per-user state bootstrap)
  - firestore.rules
EOF
  exit 2
fi

exit 0
