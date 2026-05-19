#!/usr/bin/env bash
# Append a timestamped note to the current sprint's PROGRESS.md.
# Use after meaningful work increments (commit, decision, blocker) so the next
# session can resume from disk without re-deriving state.
#
# Usage:
#   bash scripts/harness/update-progress.sh "<short heading note>"
#   bash scripts/harness/update-progress.sh "<heading>" <<'EOF'
#   - bullet 1
#   - bullet 2
#   EOF
#
# Stdin (optional): body markdown appended under the heading.

set -euo pipefail

NOTE="${1:-}"
if [ -z "$NOTE" ]; then
  echo "Usage: $0 <short heading note> [< body via stdin]" >&2
  exit 1
fi

REPO="$(git rev-parse --show-toplevel)"
cd "$REPO"

CURRENT_SPRINT="$(find docs/specs -mindepth 1 -maxdepth 1 -type d 2>/dev/null \
  | grep -v '_templates' | sort | tail -1 | sed 's|docs/specs/||')"
if [ -z "$CURRENT_SPRINT" ]; then
  echo "No sprint folder found under docs/specs/" >&2
  exit 1
fi

PROGRESS="docs/specs/$CURRENT_SPRINT/PROGRESS.md"
if [ ! -f "$PROGRESS" ]; then
  echo "PROGRESS.md not found at $PROGRESS — create it first from docs/specs/_templates/PROGRESS.md" >&2
  exit 1
fi

STAMP="$(date '+%Y-%m-%d %H:%M')"

{
  printf '\n### %s — %s\n' "$STAMP" "$NOTE"
  if [ ! -t 0 ]; then
    cat
  fi
} >> "$PROGRESS"

echo "Appended to $PROGRESS"
