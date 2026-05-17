import { describe, expect, it } from 'vitest'
import { type DateRangePreset, getDateRangeFromPreset } from './getDateRangeFromPreset'

describe('getDateRangeFromPreset', () => {
  const NOW = new Date('2026-04-26T12:00:00.000Z')

  it('returns same start of day → end of day for "today"', () => {
    const range = getDateRangeFromPreset('today', NOW)
    expect(range.startDate).toBe('2026-04-26T00:00:00.000Z')
    expect(range.endDate).toBe('2026-04-26T23:59:59.999Z')
  })

  const cases: [DateRangePreset, number][] = [
    ['7d', 7],
    ['30d', 30],
    ['60d', 60],
    ['90d', 90],
    ['180d', 180],
    ['365d', 365],
  ]
  for (const [preset, days] of cases) {
    it(`returns a ${days}-day range for "${preset}"`, () => {
      const range = getDateRangeFromPreset(preset, NOW)
      const start = new Date(range.startDate)
      const end = new Date(range.endDate)
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)
      expect(diffDays).toBe(days)
    })
  }
})
