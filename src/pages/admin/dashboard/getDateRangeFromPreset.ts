export type DateRangePreset = 'today' | '7d' | '30d' | '60d' | '90d' | '180d' | '365d'

export interface DateRange {
  startDate: string // ISO
  endDate: string // ISO
}

const DAY_MS = 86_400_000

export function getDateRangeFromPreset(preset: DateRangePreset, now: Date = new Date()): DateRange {
  const endOfToday = new Date(now)
  endOfToday.setUTCHours(23, 59, 59, 999)

  if (preset === 'today') {
    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0)
    return {
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString(),
    }
  }

  const days = Number.parseInt(preset.replace('d', ''), 10)
  const start = new Date(endOfToday.getTime() - days * DAY_MS)
  return {
    startDate: start.toISOString(),
    endDate: endOfToday.toISOString(),
  }
}
