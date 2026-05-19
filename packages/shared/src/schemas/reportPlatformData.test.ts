import { describe, expect, it } from 'vitest'
import {
  CampaignBreakdownSchema,
  PlatformKPIsSchema,
  ReportPlatformDataSchema,
  TimeSeriesPointSchema,
} from './reportPlatformData'

describe('TimeSeriesPointSchema', () => {
  it('parses ISO date YYYY-MM-DD', () => {
    expect(TimeSeriesPointSchema.safeParse({ date: '2026-05-19', value: 100 }).success).toBe(true)
  })

  it('rejects invalid date format', () => {
    expect(TimeSeriesPointSchema.safeParse({ date: '19/05/2026', value: 100 }).success).toBe(false)
    expect(TimeSeriesPointSchema.safeParse({ date: '2026-5-19', value: 100 }).success).toBe(false)
  })
})

describe('CampaignBreakdownSchema', () => {
  it('parses minimal breakdown', () => {
    const b = { campaignId: 'c1', campaignName: 'Search · Brand', invested: 8400 }
    expect(CampaignBreakdownSchema.safeParse(b).success).toBe(true)
  })

  it('parses full breakdown with all KPIs', () => {
    const b = {
      campaignId: 'c1',
      campaignName: 'Performance Max',
      invested: 12400,
      revenue: 124380,
      roas: 10.03,
      cpa: 24.8,
      clicks: 4500,
      impressions: 89000,
      conversions: 500,
      ctr: 5.05,
    }
    expect(CampaignBreakdownSchema.safeParse(b).success).toBe(true)
  })

  it('rejects negative invested', () => {
    expect(
      CampaignBreakdownSchema.safeParse({
        campaignId: 'c1',
        campaignName: 'x',
        invested: -100,
      }).success,
    ).toBe(false)
  })
})

describe('PlatformKPIsSchema', () => {
  it('parses minimal (only invested)', () => {
    expect(PlatformKPIsSchema.safeParse({ invested: 10000 }).success).toBe(true)
  })

  it('parses with full KPIs', () => {
    const kpis = {
      invested: 10000,
      revenue: 68000,
      roas: 6.8,
      cpa: 28,
      clicks: 3000,
      impressions: 60000,
      conversions: 357,
      ctr: 5.0,
    }
    expect(PlatformKPIsSchema.safeParse(kpis).success).toBe(true)
  })
})

describe('ReportPlatformDataSchema', () => {
  const valid = {
    id: 'google_ads' as const,
    platform: 'google_ads' as const,
    accountId: 'acc-google-001',
    campaignIds: ['c1', 'c2'],
    kpis: { invested: 10000, revenue: 68000, roas: 6.8 },
    revenueOverTime: [
      { date: '2026-05-01', value: 4500 },
      { date: '2026-05-02', value: 4800 },
    ],
    campaigns: [{ campaignId: 'c1', campaignName: 'Search · Brand', invested: 8400 }],
    fetchedAt: new Date('2026-05-19T15:00:00Z'),
  }

  it('parses a valid platform data document', () => {
    expect(ReportPlatformDataSchema.safeParse(valid).success).toBe(true)
  })

  it('parses meta_ads platform', () => {
    const meta = { ...valid, id: 'meta_ads' as const, platform: 'meta_ads' as const }
    expect(ReportPlatformDataSchema.safeParse(meta).success).toBe(true)
  })

  it('defaults revenueOverTime and campaigns to empty when missing', () => {
    const { revenueOverTime: _r, campaigns: _c, ...rest } = valid
    const result = ReportPlatformDataSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.revenueOverTime).toEqual([])
      expect(result.data.campaigns).toEqual([])
    }
  })

  it('parses with optional dataFingerprint', () => {
    const withFp = { ...valid, dataFingerprint: 'abc123def456' }
    expect(ReportPlatformDataSchema.safeParse(withFp).success).toBe(true)
  })

  it('rejects unknown platform value', () => {
    const invalid = { ...valid, id: 'tiktok_ads', platform: 'tiktok_ads' }
    expect(ReportPlatformDataSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects empty campaignIds', () => {
    const empty = { ...valid, campaignIds: [] }
    expect(ReportPlatformDataSchema.safeParse(empty).success).toBe(false)
  })

  it('rejects empty accountId', () => {
    const empty = { ...valid, accountId: '' }
    expect(ReportPlatformDataSchema.safeParse(empty).success).toBe(false)
  })
})
