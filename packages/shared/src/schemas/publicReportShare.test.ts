import { describe, expect, it } from 'vitest'
import {
  CreateReportShareInputSchema,
  PublicReportShareSchema,
} from './publicReportShare'

const validShare = {
  id: 'd1bcad8e-1a4f-4f0c-b3e0-2ad7b6e9b0e1',
  reportId: 'rep-abc-123',
  ownerId: 'uid-owner',
  visibleMetrics: ['revenue', 'roas', 'cpa'],
  visibleSections: ['overview', 'kpis', 'chart'],
  viewCount: 0,
  createdAt: new Date('2026-05-19T10:00:00Z'),
}

describe('PublicReportShareSchema', () => {
  it('parses a valid active share', () => {
    expect(PublicReportShareSchema.safeParse(validShare).success).toBe(true)
  })

  it('parses a revoked share (revokedAt set)', () => {
    const revoked = { ...validShare, revokedAt: new Date('2026-05-20T00:00:00Z') }
    expect(PublicReportShareSchema.safeParse(revoked).success).toBe(true)
  })

  it('parses a share with expiresAt', () => {
    const expiring = { ...validShare, expiresAt: new Date('2026-06-19T00:00:00Z') }
    expect(PublicReportShareSchema.safeParse(expiring).success).toBe(true)
  })

  it('defaults viewCount to 0 when missing', () => {
    const { viewCount: _vc, ...withoutVc } = validShare
    const result = PublicReportShareSchema.safeParse(withoutVc)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.viewCount).toBe(0)
  })

  it('defaults visibleMetrics and visibleSections to empty arrays when missing', () => {
    const { visibleMetrics: _vm, visibleSections: _vs, ...minimal } = validShare
    const result = PublicReportShareSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.visibleMetrics).toEqual([])
      expect(result.data.visibleSections).toEqual([])
    }
  })

  it('rejects negative viewCount', () => {
    const negative = { ...validShare, viewCount: -1 }
    expect(PublicReportShareSchema.safeParse(negative).success).toBe(false)
  })

  it('rejects share with empty reportId', () => {
    const empty = { ...validShare, reportId: '' }
    expect(PublicReportShareSchema.safeParse(empty).success).toBe(false)
  })

  it('rejects share with too short id (anti-low-entropy)', () => {
    const tooShort = { ...validShare, id: 'short' }
    expect(PublicReportShareSchema.safeParse(tooShort).success).toBe(false)
  })
})

describe('CreateReportShareInputSchema', () => {
  it('parses minimal input', () => {
    const input = {
      reportId: 'rep-xyz',
      visibleMetrics: ['revenue'],
      visibleSections: ['overview'],
    }
    expect(CreateReportShareInputSchema.safeParse(input).success).toBe(true)
  })

  it('parses with optional expiresAt', () => {
    const input = {
      reportId: 'rep-xyz',
      visibleMetrics: ['revenue'],
      visibleSections: ['overview'],
      expiresAt: new Date('2026-06-30T00:00:00Z'),
    }
    expect(CreateReportShareInputSchema.safeParse(input).success).toBe(true)
  })

  it('rejects input with empty reportId', () => {
    const input = { reportId: '', visibleMetrics: [], visibleSections: [] }
    expect(CreateReportShareInputSchema.safeParse(input).success).toBe(false)
  })
})
