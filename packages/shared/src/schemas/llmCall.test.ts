import { describe, expect, it } from 'vitest'
import { LLMCallSchema, LLMProviderSchema, LLMTaskSchema } from './llmCall'

const validCall = {
  id: 'call-abc-123',
  provider: 'anthropic' as const,
  model: 'claude-sonnet-4-6',
  task: 'analyze_report' as const,
  userId: 'uid-user',
  resourceId: 'rep-xyz',
  promptVersion: 'analyze_report-v1.0',
  inputTokens: 1200,
  outputTokens: 480,
  cachedInputTokens: 800,
  costUsd: 0.0072,
  latencyMs: 1850,
  calledAt: new Date('2026-05-19T15:00:00Z'),
}

describe('LLMProviderSchema', () => {
  it.each(['anthropic', 'deepseek'])('parses provider %s', (p) => {
    expect(LLMProviderSchema.safeParse(p).success).toBe(true)
  })

  it('rejects unknown provider', () => {
    expect(LLMProviderSchema.safeParse('openai').success).toBe(false)
  })
})

describe('LLMTaskSchema', () => {
  it.each([
    'analyze_report',
    'classify',
    'summarize',
    'parse_data',
    'generate_copy',
    'extract_metrics',
  ])('parses task %s', (t) => {
    expect(LLMTaskSchema.safeParse(t).success).toBe(true)
  })
})

describe('LLMCallSchema', () => {
  it('parses a valid LLM call', () => {
    expect(LLMCallSchema.safeParse(validCall).success).toBe(true)
  })

  it('parses scheduled job call without userId', () => {
    const { userId: _u, resourceId: _r, ...scheduled } = validCall
    expect(LLMCallSchema.safeParse(scheduled).success).toBe(true)
  })

  it('defaults cachedInputTokens to 0 when missing', () => {
    const { cachedInputTokens: _c, ...rest } = validCall
    const result = LLMCallSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cachedInputTokens).toBe(0)
  })

  it('parses with errorMessage on partial failure', () => {
    const withError = { ...validCall, errorMessage: 'timeout after 60s' }
    expect(LLMCallSchema.safeParse(withError).success).toBe(true)
  })

  it('rejects negative tokens', () => {
    const negative = { ...validCall, inputTokens: -1 }
    expect(LLMCallSchema.safeParse(negative).success).toBe(false)
  })

  it('rejects negative cost', () => {
    const negative = { ...validCall, costUsd: -0.5 }
    expect(LLMCallSchema.safeParse(negative).success).toBe(false)
  })

  it('rejects negative latency', () => {
    const negative = { ...validCall, latencyMs: -100 }
    expect(LLMCallSchema.safeParse(negative).success).toBe(false)
  })

  it('rejects model name longer than 64 chars', () => {
    const tooLong = { ...validCall, model: 'a'.repeat(65) }
    expect(LLMCallSchema.safeParse(tooLong).success).toBe(false)
  })
})
