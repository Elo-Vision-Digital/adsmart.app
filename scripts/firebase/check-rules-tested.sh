#!/usr/bin/env bash
# PreToolUse hook helper for Bash tool calls matching `firebase deploy --only firestore:rules`.
# Blocks if .firebase/rules-last-tested.txt is missing or >10 min old.
# Skips when invoked indirectly via safe-deploy.sh (which sets ADSMART_SAFE_DEPLOY=1).
set -euo pipefail

# Skip when invoked via safe-deploy.sh wrapper (it already validated)
if [ "${ADSMART_SAFE_DEPLOY:-}" = "1" ]; then
  exit 0
fi

stamp=".firebase/rules-last-tested.txt"

if [ ! -f "$stamp" ]; then
  cat >&2 <<'EOF'
❌ Blocked: `firebase deploy --only firestore:rules` without prior rules test.

Run first:  /firestore-rules-test
(Or: bash scripts/firebase/test-rules.sh)

This hook exists because deploying untested rules has bricked production
in the past. The test stamps a timestamp; this hook reads it.
EOF
  exit 2
fi

ts=$(cat "$stamp")
now=$(date -u +%s)
diff=$((now - ts))

if [ $diff -gt 600 ]; then
  age_min=$((diff / 60))
  cat >&2 <<EOF
❌ Blocked: rules test stamp is stale ($age_min min ago, max 10 min).

Re-run /firestore-rules-test before deploying.
EOF
  exit 2
fi

exit 0
