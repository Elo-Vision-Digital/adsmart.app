import { fakeTimestamp } from './test-helpers'
import { describe, expect, it } from 'vitest'
import { ReportSchema, ReportStatusSchema, ReportTypeSchema } from './report'

const validReport = {
  id: 'report-1',
  userId: 'user-abc',
  type: 'meta_ads',
  templateId: 'meta_lancamento',
  name: 'Campanha Q2',
  status: 'completed',
  campaignIds: ['camp-1', 'camp-2'],
  allCampaigns: false,
  dateRange: { startDate: '2026-04-01', endDate: '2026-04-30' },
  lookerStudioUrl: 'https://lookerstudio.google.com/abc',
  cost: 500,
  createdAt: new Date('2026-04-25T10:00:00Z'),
  completedAt: new Date('2026-04-25T10:05:00Z'),
}

describe('ReportSchema', () => {
  it('parses a fully valid report', () => {
    const result = ReportSchema.safeParse(validReport)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('meta_ads')
      expect(result.data.cost).toBe(500)
    }
  })

  it('applies defaults for cost and allCampaigns', () => {
    const { cost, allCampaigns, ...rest } = validReport
    void cost
    void allCampaigns
    const result = ReportSchema.parse(rest)
    expect(result.cost).toBe(0)
    expect(result.allCampaigns).toBe(false)
  })

  it('rejects when a required field is missing', () => {
    const { userId, ...incomplete } = validReport
    void userId
    const result = ReportSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'userId')).toBe(true)
    }
  })

  it('rejects an invalid type literal', () => {
    const result = ReportSchema.safeParse({ ...validReport, type: 'tiktok_ads' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['type'])
    }
  })

  it('rejects a non-integer cost', () => {
    const result = ReportSchema.safeParse({ ...validReport, cost: 5.25 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'cost')).toBe(true)
    }
  })

  it('normalizes a Firestore Timestamp on createdAt', () => {
    const ts = fakeTimestamp('2026-04-25T10:00:00Z')
    const result = ReportSchema.parse({ ...validReport, createdAt: ts })
    expect(result.createdAt).toBeInstanceOf(Date)
    expect(result.createdAt.toISOString()).toBe('2026-04-25T10:00:00.000Z')
  })
})

describe('ReportTypeSchema', () => {
  it('accepts the canonical platform names', () => {
    expect(ReportTypeSchema.parse('google_ads')).toBe('google_ads')
    expect(ReportTypeSchema.parse('meta_ads')).toBe('meta_ads')
  })

  it('rejects the legacy facebook_ads value', () => {
    expect(ReportTypeSchema.safeParse('facebook_ads').success).toBe(false)
  })
})

describe('ReportStatusSchema', () => {
  it('accepts all four statuses', () => {
    for (const s of ['pending', 'processing', 'completed', 'failed'] as const) {
      expect(ReportStatusSchema.parse(s)).toBe(s)
    }
  })
})
