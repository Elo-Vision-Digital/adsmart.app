#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks Edit/Write to packages/shared/src/schemas/*.ts that creates a schema
# without a co-located .test.ts file in the same directory.
#
# Convenção (ADR-009 + packages/shared/AGENTS.md):
#   Schema foo.ts SEMPRE acompanha foo.test.ts ao lado.
#
# Exit 0 = ok; exit 2 = block.
set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')

case "$file_path" in
  *packages/shared/src/schemas/*.ts) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  *.test.ts) exit 0 ;;
  *firestore-converter.ts) exit 0 ;;
  *index.ts) exit 0 ;;
esac

test_path="${file_path%.ts}.test.ts"

if [ -f "$test_path" ]; then
  exit 0
fi

cat >&2 <<EOF
❌ Blocked: novo/editado schema sem teste co-located.

Schema editado: $file_path
Teste esperado: $test_path  (não existe)

Convenção (ADR-009, packages/shared/AGENTS.md):
Todo schema em packages/shared/src/schemas/ tem um .test.ts ao lado.

Crie $test_path antes (ou junto) com vitest cases cobrindo:
  - happy path (parse com objeto válido)
  - pelo menos um rejection (campo inválido / missing)

Use a skill /new-zod-schema ou inicie:

  // packages/shared/src/schemas/$(basename "${file_path%.ts}").test.ts
  import { describe, expect, it } from 'vitest'
  import { ... } from './$(basename "${file_path%.ts}")'

  describe('...', () => {
    it('aceita doc válido', () => { ... })
    it('rejeita doc sem userId', () => { ... })
  })

Refs:
  - packages/shared/AGENTS.md
  - .claude/skills/new-zod-schema/SKILL.md
EOF
exit 2
