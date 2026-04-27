import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    BarChart: Stub,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Cell: () => null,
  }
})

import { IntegrationsCard } from './IntegrationsCard'

describe('IntegrationsCard', () => {
  it('renders rows for each platform', () => {
    render(
      <IntegrationsCard
        data={{
          byPlatform: [
            { platform: 'google_ads', distinctUserCount: 5 },
            { platform: 'meta_ads', distinctUserCount: 2 },
          ],
        }}
      />
    )
    expect(
      screen.getByText('admin.dashboard.integrations.platforms.google_ads')
    ).toBeInTheDocument()
    expect(screen.getByText('admin.dashboard.integrations.platforms.meta_ads')).toBeInTheDocument()
  })

  it('renders an empty state when no platforms exist', () => {
    render(<IntegrationsCard data={{ byPlatform: [] }} />)
    expect(screen.getByText('admin.dashboard.integrations.empty')).toBeInTheDocument()
  })
})
