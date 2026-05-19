import { describe, expect, it } from 'vitest'
import { ProcessedRequestSchema, ProcessedRequestSourceSchema } from './processedRequest'

const validRequest = {
  id: 'd1bcad8e-1a4f-4f0c-b3e0-2ad7b6e9b0e1',
  source: 'callable' as const,
  handler: 'createReport',
  userId: 'uid-abc',
  processedAt: new Date('2026-05-19T12:00:00Z'),
}

describe('ProcessedRequestSourceSchema', () => {
  it.each(['callable', 'stripe_webhook', 'scheduled'])('parses canonical source %s', (s) => {
    expect(ProcessedRequestSourceSchema.safeParse(s).success).toBe(true)
  })

  it('rejects unknown source', () => {
    expect(ProcessedRequestSourceSchema.safeParse('cron').success).toBe(false)
  })
})

describe('ProcessedRequestSchema', () => {
  it('parses a minimal valid request', () => {
    expect(ProcessedRequestSchema.safeParse(validRequest).success).toBe(true)
  })

  it('parses with optional result payload (any JSON-serializable shape)', () => {
    const withResult = { ...validRequest, result: { reportId: 'rep-123', cost: 1 } }
    expect(ProcessedRequestSchema.safeParse(withResult).success).toBe(true)
  })

  it('parses scheduled request without userId', () => {
    const scheduled = {
      id: 'scheduled-2026-05-19-1200',
      source: 'scheduled' as const,
      handler: 'refreshActiveReports',
      processedAt: new Date(),
    }
    expect(ProcessedRequestSchema.safeParse(scheduled).success).toBe(true)
  })

  it('rejects request without id', () => {
    const { id: _id, ...rest } = validRequest
    expect(ProcessedRequestSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects request without handler', () => {
    const { handler: _handler, ...rest } = validRequest
    expect(ProcessedRequestSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects id longer than 128 characters', () => {
    const tooLong = { ...validRequest, id: 'a'.repeat(129) }
    expect(ProcessedRequestSchema.safeParse(tooLong).success).toBe(false)
  })
})
