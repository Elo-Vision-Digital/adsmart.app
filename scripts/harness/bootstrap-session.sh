#!/usr/bin/env bash
# Restore working context for a new Claude Code session in < 5k tokens.
# Run at the start of every fresh session to align the agent with prior state
# without forcing it to discover everything from scratch.
#
# Usage: bash scripts/harness/bootstrap-session.sh
# Exit codes: 0 always (best-effort summary; missing pieces print a hint)

set -euo pipefail

REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO"

print_header() { printf '\n═══ %s ═══\n' "$1"; }

print_header "AdSmart Bootstrap — $(date '+%Y-%m-%d %H:%M %Z')"
printf 'Repo: %s\n' "$REPO"

print_header "Git"
printf 'Branch: %s\n' "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
printf 'Last commits:\n'
git log -5 --oneline 2>/dev/null || echo "  (no commits)"
printf '\nWorking tree:\n'
git status -s 2>/dev/null | head -20 || echo "  (clean)"

CURRENT_SPRINT="$(find docs/specs -mindepth 1 -maxdepth 1 -type d 2>/dev/null \
  | grep -v '_templates' | sort | tail -1 | sed 's|docs/specs/||')"

if [ -n "$CURRENT_SPRINT" ]; then
  print_header "Current sprint: $CURRENT_SPRINT"
  SPEC="docs/specs/$CURRENT_SPRINT/SPEC.md"
  PROG="docs/specs/$CURRENT_SPRINT/PROGRESS.md"
  CONTRACT="docs/specs/$CURRENT_SPRINT/CONTRACT.md"
  EVAL="docs/specs/$CURRENT_SPRINT/EVALUATION.md"

  if [ -f "$SPEC" ]; then
    printf '── SPEC.md header ──\n'
    awk '/^---$/{count++; if(count==2){print; exit} } {print}' "$SPEC"
    printf '\n── SPEC.md Outcomes section ──\n'
    awk '/^## Outcomes/{flag=1; next} /^## /{flag=0} flag' "$SPEC" | head -20
  else
    printf '(no SPEC.md — copy from docs/specs/_templates/SPEC.md)\n'
  fi

  if [ -f "$PROG" ]; then
    printf '\n── PROGRESS.md status ──\n'
    awk '/^---$/{count++; if(count==2){print; exit} } {print}' "$PROG"
    printf '\n── PROGRESS.md last session ──\n'
    awk '/^### / {section_start=NR; section=""} NR>=section_start {section = section $0 "\n"} END {printf "%s", section}' "$PROG" | head -30
  else
    printf '(no PROGRESS.md — copy from docs/specs/_templates/PROGRESS.md)\n'
  fi

  [ -f "$CONTRACT" ] && printf '\nContract status: %s\n' "$(grep -E '^status:' "$CONTRACT" | head -1)"
  [ -f "$EVAL" ]     && printf 'Last verdict: %s\n'    "$(grep -E '^verdict:' "$EVAL" | head -1)"
fi

print_header "Memory index"
MEMORY_FILE="$HOME/.claude/projects/-Users-eduardorodrigues-Downloads-Meus-Projetos-adsmart-app/memory/MEMORY.md"
if [ -f "$MEMORY_FILE" ]; then
  head -25 "$MEMORY_FILE"
else
  printf '(no MEMORY.md found at %s)\n' "$MEMORY_FILE"
fi

print_header "Next"
printf 'Read SPEC.md if missing context. Use TodoWrite to plan. See docs/HARNESS-RUNBOOK.md for the full workflow.\n'
