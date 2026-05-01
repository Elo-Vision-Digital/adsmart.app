#!/usr/bin/env bash
# Safe Firebase deploy wrapper. Confirms target (dev/prod), validates that
# rules are tested if deploying rules, sets ADSMART_SAFE_DEPLOY=1 to bypass
# the rules-tested hook (we already validated), and polls index status if
# deploying indexes. Used by the /firebase-deploy slash command.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

usage() {
  cat <<EOF
Usage: $0 <dev|prod> <only-flags>

  <only-flags> is a comma-separated subset of: rules, indexes, functions, hosting

Examples:
  $0 dev rules
  $0 prod indexes,functions
EOF
  exit 1
}

[ $# -lt 2 ] && usage
target=$1
only=$2

case "$target" in
  dev)  project="adsmart-web-dev" ;;
  prod) project="adsmart-web-prod" ;;
  *)    usage ;;
esac

# Prod confirm gate
if [ "$target" = "prod" ]; then
  echo "⚠️  About to deploy [$only] to PRODUCTION ($project)."
  printf "    Type 'prod' to confirm: "
  read -r confirm
  if [ "$confirm" != "prod" ]; then
    echo "Aborted."
    exit 1
  fi
fi

# Pre-check: rules must be tested if deploying rules
if [[ ",$only," == *",rules,"* ]]; then
  if [ ! -f .firebase/rules-last-tested.txt ]; then
    echo "❌ rules not tested. Run /firestore-rules-test first." >&2
    exit 1
  fi
  ts=$(cat .firebase/rules-last-tested.txt)
  now=$(date -u +%s)
  diff=$((now - ts))
  if [ $diff -gt 600 ]; then
    echo "❌ rules test stale ($((diff / 60)) min ago). Re-run /firestore-rules-test." >&2
    exit 1
  fi
fi

# Bypass the rules-tested PreToolUse hook (we validated above)
export ADSMART_SAFE_DEPLOY=1

echo "→ bunx firebase deploy --only $only --project $project"
bunx firebase deploy --only "$only" --project "$project"

# Poll index status when deploying indexes
if [[ ",$only," == *",indexes,"* ]]; then
  echo "→ Polling indexes until all Enabled (max 5 min, sleep 30s)..."
  attempts=0
  max_attempts=10
  all_enabled=0
  while [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    sleep 30
    # Use firestore:indexes to fetch current status
    if bunx firebase firestore:indexes --project "$project" 2>/dev/null \
        | grep -q '"state": "CREATING"'; then
      echo "  [$attempts/$max_attempts] still building..."
    else
      echo "  [$attempts/$max_attempts] all indexes Enabled."
      all_enabled=1
      break
    fi
  done
  if [ $all_enabled -eq 0 ]; then
    echo "⚠ Indexes still building after 5 min." >&2
    echo "   Check status: bunx firebase firestore:indexes --project $project" >&2
    echo "   Queries hitting these indexes will throw FAILED_PRECONDITION until Enabled." >&2
  fi
fi

echo "✓ Deploy complete."
