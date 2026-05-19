#!/usr/bin/env bash
# PreToolUse hook. Reads tool input JSON on stdin.
# Blocks Edit/Write to functions/src/*.ts that introduces LLM call (Anthropic,
# DeepSeek, OpenAI) without a structured logger.info call carrying modelId,
# tokensIn, tokensOut, latencyMs.
#
# Princípio 9 + INF-1: toda chamada LLM em produção é logada estruturadamente.
#
# Exit 0 = ok; exit 2 = block.
set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // ""')
content=$(echo "$input" | jq -r '.tool_input.new_string // .tool_input.content // ""')

case "$file_path" in
  functions/src/*.ts) ;;
  *) exit 0 ;;
esac

case "$file_path" in
  *.test.ts|*test/*) exit 0 ;;
esac

has_llm_call=$(echo "$content" | grep -E '\b(Anthropic|deepseek|openai|claude\.messages\.create|anthropic\.messages\.create|\.completions\.create)\b' || true)

if [ -z "$has_llm_call" ]; then
  exit 0
fi

has_structured_log=$(echo "$content" | grep -E 'logger\.(info|error)\(.*\{' || true)
has_model_id=$(echo "$content" | grep -E 'modelId:|modelId =' || true)
has_tokens=$(echo "$content" | grep -E 'tokensIn|tokensOut|input_tokens|output_tokens' || true)

missing=""
[ -z "$has_structured_log" ] && missing="${missing}\n  - logger.info(...) ou logger.error(...) com structured fields"
[ -z "$has_model_id" ] && missing="${missing}\n  - modelId no log"
[ -z "$has_tokens" ] && missing="${missing}\n  - tokensIn / tokensOut no log"

if [ -z "$missing" ]; then
  exit 0
fi

cat >&2 <<EOF
❌ Blocked: callable com chamada LLM sem logging estruturado completo.

Arquivo: $file_path
Detectado: chamada Anthropic/DeepSeek/OpenAI/Claude.

Faltando:$(echo -e "$missing")

Princípio 9 + INF-1 (docs/research/02-llm-strategy.md): toda chamada LLM
em produção tem logger.info estruturado com modelId, tokensIn, tokensOut,
latencyMs, feature.

Padrão correto:

  import { logger } from 'firebase-functions/v2'

  const startedAt = Date.now()
  const response = await client.messages.create({ ... })

  logger.info('llm_call_completed', {
    userId,
    requestId,
    modelId: 'claude-opus-4-7',
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
    latencyMs: Date.now() - startedAt,
    feature: 'report_generation',
  })

Use a skill /validate-llm-call para checklist completo.

Refs:
  - functions/AGENTS.md § Structured logging
  - .claude/skills/validate-llm-call/SKILL.md
  - docs/research/02-llm-strategy.md
EOF
exit 2
