import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))

import { DateRangeFilter } from './DateRangeFilter'

describe('DateRangeFilter', () => {
  it('renders all preset buttons + Custom', () => {
    const onChange = vi.fn()
    render(<DateRangeFilter value={null} onChange={onChange} />)
    for (const key of ['today', '7d', '30d', '60d', '90d', '180d', '365d', 'custom']) {
      expect(
        screen.getByRole('button', { name: `admin.dashboard.ranges.${key}` })
      ).toBeInTheDocument()
    }
  })

  it('emits a range when a preset is clicked', () => {
    const onChange = vi.fn()
    render(<DateRangeFilter value={null} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'admin.dashboard.ranges.7d' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const arg = onChange.mock.calls[0][0]
    expect(typeof arg.startDate).toBe('string')
    expect(typeof arg.endDate).toBe('string')
    expect(new Date(arg.endDate).getTime()).toBeGreaterThan(new Date(arg.startDate).getTime())
  })
})
