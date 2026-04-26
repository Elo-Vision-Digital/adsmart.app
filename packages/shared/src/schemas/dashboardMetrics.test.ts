import { describe, expect, it } from 'vitest'
import {
  GetDashboardMetricsInputSchema,
  GetDashboardMetricsOutputSchema,
} from './dashboardMetrics'

const validInput = {
  startDate: '2026-04-01T00:00:00.000Z',
  endDate: '2026-04-26T23:59:59.999Z',
}

describe('GetDashboardMetricsInputSchema', () => {
  it('accepts a valid 30-day range', () => {
    const result = GetDashboardMetricsInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('rejects non-ISO dates', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: 'not-a-date',
      endDate: 'also-not',
    })
    expect(result.success).toBe(false)
  })

  it('rejects when endDate is before startDate', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: '2026-04-26T00:00:00.000Z',
      endDate: '2026-04-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects ranges longer than 365 days', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2026-01-01T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('accepts the boundary of exactly 365 days', () => {
    const result = GetDashboardMetricsInputSchema.safeParse({
      startDate: '2025-04-26T00:00:00.000Z',
      endDate: '2026-04-26T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})

const validOutput = {
  range: { startDate: '2026-04-01T00:00:00.000Z', endDate: '2026-04-26T23:59:59.999Z', days: 26 },
  revenue: {
    realCents: 12345,
    creditsCents: 500,
    sparkline: [{ date: '2026-04-01', realCents: 100, creditsCents: 0 }],
  },
  users: {
    newCount: 3,
    activeCount: 7,
    totalCount: 42,
    sparkline: [{ date: '2026-04-01', newCount: 1 }],
  },
  integrations: {
    byPlatform: [
      { platform: 'google_ads', distinctUserCount: 5 },
      { platform: 'meta_ads', distinctUserCount: 2 },
    ],
  },
  generatedAt: '2026-04-26T12:00:00.000Z',
}

describe('GetDashboardMetricsOutputSchema', () => {
  it('accepts a complete valid payload', () => {
    const result = GetDashboardMetricsOutputSchema.safeParse(validOutput)
    expect(result.success).toBe(true)
  })

  it('rejects negative cents', () => {
    const result = GetDashboardMetricsOutputSchema.safeParse({
      ...validOutput,
      revenue: { ...validOutput.revenue, realCents: -1 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects unknown platform values', () => {
    const result = GetDashboardMetricsOutputSchema.safeParse({
      ...validOutput,
      integrations: { byPlatform: [{ platform: 'tiktok_ads', distinctUserCount: 1 }] },
    })
    expect(result.success).toBe(false)
  })
})
