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
    Tooltip: () => null,
  }
})

import { UsersCard } from './UsersCard'

describe('UsersCard', () => {
  it('renders all three counts', () => {
    render(
      <UsersCard
        data={{
          newCount: 3,
          activeCount: 7,
          totalCount: 42,
          sparkline: [{ date: '2026-04-01', newCount: 1 }],
        }}
      />
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
