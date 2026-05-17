import { fakeTimestamp } from './test-helpers'
import { describe, expect, it } from 'vitest'
import { CampaignSchema } from './campaign'

const validCampaign = {
  id: 'google_ads_camp_001',
  accountId: '1234567890',
  platform: 'google_ads',
  campaignId: 'camp_001',
  campaignName: 'Brand - Pesquisa',
  status: 'enabled',
  budget: 5000,
  spend: 3421,
  impressions: 145320,
  clicks: 8934,
  lastSyncAt: new Date('2026-04-26T08:00:00Z'),
}

describe('CampaignSchema', () => {
  it('parses a fully valid Google Ads campaign', () => {
    const result = CampaignSchema.safeParse(validCampaign)
    expect(result.success).toBe(true)
  })

  it('parses a Meta Ads campaign with the optional objective field', () => {
    const meta = {
      ...validCampaign,
      id: 'meta_ads_456',
      platform: 'meta_ads',
      campaignId: '456',
      status: 'archived',
      objective: 'OUTCOME_AWARENESS',
    }
    const result = CampaignSchema.safeParse(meta)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.objective).toBe('OUTCOME_AWARENESS')
    }
  })

  it('parses without metric fields (all optional)', () => {
    const { budget, spend, impressions, clicks, ...minimal } = validCampaign
    void budget
    void spend
    void impressions
    void clicks
    const result = CampaignSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.budget).toBeUndefined()
      expect(result.data.spend).toBeUndefined()
    }
  })

  it('accepts permissive status strings (Google: enabled/removed; Meta: archived/with_issues)', () => {
    for (const status of ['enabled', 'paused', 'removed', 'archived', 'with_issues']) {
      const result = CampaignSchema.safeParse({ ...validCampaign, status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects when accountId is missing', () => {
    const { accountId, ...incomplete } = validCampaign
    void accountId
    const result = CampaignSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'accountId')).toBe(true)
    }
  })

  it('rejects an invalid platform', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, platform: 'linkedin_ads' })
    expect(result.success).toBe(false)
  })

  it('rejects negative metric values', () => {
    const result = CampaignSchema.safeParse({ ...validCampaign, spend: -100 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'spend')).toBe(true)
    }
  })

  it('normalizes a Firestore Timestamp on lastSyncAt', () => {
    const ts = fakeTimestamp('2026-04-26T08:00:00Z')
    const result = CampaignSchema.parse({ ...validCampaign, lastSyncAt: ts })
    expect(result.lastSyncAt).toBeInstanceOf(Date)
  })
})
