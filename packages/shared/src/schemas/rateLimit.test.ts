import { describe, expect, it } from 'vitest'
import { RateLimitSchema } from './rateLimit'
import { fakeTimestamp } from './test-helpers'

const ts = fakeTimestamp('2026-05-17T10:00:00.000Z')

describe('RateLimitSchema', () => {
  it('accepts a counter doc', () => {
    expect(
      RateLimitSchema.parse({
        id: 'uid_123_reserveUserDocument',
        attempts: 3,
        firstAttempt: ts,
        lastAttempt: ts,
        blocked: false,
      }).attempts
    ).toBe(3)
  })

  it('rejects negative attempts', () => {
    const r = RateLimitSchema.safeParse({
      id: 'uid_123_x',
      attempts: -1,
      firstAttempt: ts,
      lastAttempt: ts,
      blocked: false,
    })
    expect(r.success).toBe(false)
  })

  it('rejects non-integer attempts', () => {
    const r = RateLimitSchema.safeParse({
      id: 'uid_123_x',
      attempts: 1.5,
      firstAttempt: ts,
      lastAttempt: ts,
      blocked: false,
    })
    expect(r.success).toBe(false)
  })
})
