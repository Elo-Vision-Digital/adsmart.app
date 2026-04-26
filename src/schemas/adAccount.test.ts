import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'
import { AdAccountSchema, AdPlatformSchema } from './adAccount'

const validAdAccount = {
  id: 'google_ads_1234567890',
  platform: 'google_ads',
  accountId: '1234567890',
  accountName: 'Conta Principal',
  email: 'user@example.com',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  isActive: true,
  createdAt: new Date('2026-04-01T00:00:00Z'),
  updatedAt: new Date('2026-04-25T12:00:00Z'),
  lastSyncAt: new Date('2026-04-26T08:00:00Z'),
}

describe('AdAccountSchema', () => {
  it('parses a fully valid ad account', () => {
    const result = AdAccountSchema.safeParse(validAdAccount)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.platform).toBe('google_ads')
      expect(result.data.currency).toBe('BRL')
    }
  })

  it('parses without optional fields (email, timezone, lastSyncAt)', () => {
    const { email, timezone, lastSyncAt, ...minimal } = validAdAccount
    void email
    void timezone
    void lastSyncAt
    const result = AdAccountSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('rejects when currency is missing (regression: was optional before C6.1)', () => {
    const { currency, ...incomplete } = validAdAccount
    void currency
    const result = AdAccountSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'currency')).toBe(true)
    }
  })

  it('rejects an invalid platform', () => {
    const result = AdAccountSchema.safeParse({ ...validAdAccount, platform: 'tiktok_ads' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['platform'])
    }
  })

  it('normalizes Firestore Timestamps on date fields', () => {
    const result = AdAccountSchema.parse({
      ...validAdAccount,
      createdAt: Timestamp.fromDate(new Date('2026-04-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2026-04-25T12:00:00Z')),
    })
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.updatedAt).toBeInstanceOf(Date)
  })
})

describe('AdPlatformSchema', () => {
  it('accepts canonical values', () => {
    expect(AdPlatformSchema.parse('google_ads')).toBe('google_ads')
    expect(AdPlatformSchema.parse('meta_ads')).toBe('meta_ads')
  })
})
