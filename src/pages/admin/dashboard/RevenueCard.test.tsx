import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  }
})

import { RevenueCard } from './RevenueCard'

const data = {
  realCents: 12345,
  creditsCents: 500,
  sparkline: [
    { date: '2026-04-01', realCents: 100, creditsCents: 0 },
    { date: '2026-04-02', realCents: 12245, creditsCents: 500 },
  ],
}

describe('RevenueCard', () => {
  it('renders both values formatted in BRL', () => {
    render(<RevenueCard data={data} />)
    expect(screen.getByText(/R\$\s?123,45/)).toBeInTheDocument()
    expect(screen.getByText(/R\$\s?5,00/)).toBeInTheDocument()
  })

  it('renders with zero data without crashing', () => {
    render(<RevenueCard data={{ realCents: 0, creditsCents: 0, sparkline: [] }} />)
    expect(screen.getAllByText(/R\$\s?0,00/).length).toBeGreaterThanOrEqual(2)
  })
})
