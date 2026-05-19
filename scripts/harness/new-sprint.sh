#!/usr/bin/env bash
# Scaffold a new sprint folder under docs/specs/{id}-{name}/ with the 4
# canonical templates (SPEC, CONTRACT, PROGRESS, EVALUATION).
#
# Usage:
#   bash scripts/harness/new-sprint.sh <sprint-id> <sprint-name-kebab>
#   bash scripts/harness/new-sprint.sh 1 design-system

set -euo pipefail

ID="${1:-}"
NAME="${2:-}"
if [ -z "$ID" ] || [ -z "$NAME" ]; then
  echo "Usage: $0 <sprint-id> <sprint-name-kebab>" >&2
  echo "Example: $0 1 design-system" >&2
  exit 1
fi

REPO="$(git rev-parse --show-toplevel)"
cd "$REPO"

DEST="docs/specs/${ID}-${NAME}"
if [ -d "$DEST" ]; then
  echo "Sprint folder already exists: $DEST" >&2
  exit 1
fi

TEMPLATES="docs/specs/_templates"
if [ ! -d "$TEMPLATES" ]; then
  echo "Templates not found at $TEMPLATES — restore them from git." >&2
  exit 1
fi

mkdir -p "$DEST"
TODAY="$(date +%Y-%m-%d)"

for tpl in SPEC.md CONTRACT.md PROGRESS.md EVALUATION.md; do
  if [ ! -f "$TEMPLATES/$tpl" ]; then
    echo "Missing template: $TEMPLATES/$tpl" >&2
    exit 1
  fi
  sed -e "s|{ID}|${ID}|g" \
      -e "s|{NAME}|${NAME}|g" \
      -e "s|{YYYY-MM-DD}|${TODAY}|g" \
      "$TEMPLATES/$tpl" > "$DEST/$tpl"
done

cat <<EOF
Sprint scaffold created: $DEST
  - SPEC.md
  - CONTRACT.md
  - PROGRESS.md
  - EVALUATION.md

Next steps:
  1. Fill $DEST/SPEC.md (Outcomes, Scope, Constraints, Prior decisions)
  2. Spawn Orchestrator: it dispatches Researchers/Planner/etc.
  3. Track progress with: bash scripts/harness/update-progress.sh "<note>"
  4. Refer to docs/HARNESS-RUNBOOK.md for the full workflow
EOF
