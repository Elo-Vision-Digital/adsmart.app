#!/usr/bin/env bash

# Ensures no direct commits are made to the main branch locally.
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "❌ Error: Commits to 'main' are blocked by the harness."
  echo "👉 All changes to main must come via a PR from 'develop'."
  exit 1
fi
exit 0
