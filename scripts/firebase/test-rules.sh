#!/usr/bin/env bash
# Runs Firestore rules unit tests inside the emulator and stamps
# .firebase/rules-last-tested.txt on success. Stamp is consumed by
# the rules-no-direct-deploy hook to gate `firebase deploy --only firestore:rules`.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Pre-condition: rules unit test file must exist
if ! ls functions/test/firestore-rules*.test.ts >/dev/null 2>&1; then
  echo "❌ No firestore-rules*.test.ts in functions/test/" >&2
  echo "   Create one before running this script." >&2
  exit 1
fi

# Pre-condition: @firebase/rules-unit-testing must be installed
if ! grep -q '@firebase/rules-unit-testing' functions/package.json; then
  echo "❌ @firebase/rules-unit-testing missing in functions/package.json" >&2
  echo "   Install: cd functions && bun add -d @firebase/rules-unit-testing" >&2
  exit 1
fi

# Run rules tests inside the firestore emulator
bunx firebase emulators:exec --only firestore --project demo-adsmart \
  "cd functions && bunx vitest run firestore-rules"

# Stamp success — consumed by check-rules-tested.sh hook helper
mkdir -p .firebase
date -u +%s > .firebase/rules-last-tested.txt
echo "✓ Rules tested at $(date -u). Stamp written to .firebase/rules-last-tested.txt"
