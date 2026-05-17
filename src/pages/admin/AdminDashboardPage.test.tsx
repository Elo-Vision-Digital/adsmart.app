import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const callableMock = vi.fn()

vi.mock('firebase/functions', () => ({
  httpsCallable: () => (data: unknown) => callableMock(data),
}))
vi.mock('@/firebase/config', () => ({ functions: {} }))
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, language: 'pt', setLanguage: () => {} }),
}))
vi.mock('recharts', async () => {
  const Stub: React.FC<{ children?: React.ReactNode }> = ({ children }) => <div>{children}</div>
  return {
    ResponsiveContainer: Stub,
    AreaChart: Stub,
    Area: () => null,
    BarChart: Stub,
    Bar: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Cell: () => null,
  }
})

const okPayload = {
  data: {
    range: {
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-04-26T23:59:59.999Z',
      days: 26,
    },
    revenue: { realCents: 12345, creditsCents: 500, sparkline: [] },
    users: { newCount: 3, activeCount: 7, totalCount: 42, sparkline: [] },
    integrations: { byPlatform: [] },
    generatedAt: '2026-04-26T12:00:00.000Z',
  },
}

import { AdminDashboardPage } from './AdminDashboardPage'

describe('AdminDashboardPage', () => {
  it('shows the three cards once data loads', async () => {
    callableMock.mockResolvedValue(okPayload)
    render(<AdminDashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('admin.dashboard.revenue.title')).toBeInTheDocument()
      expect(screen.getByText('admin.dashboard.users.title')).toBeInTheDocument()
      expect(screen.getByText('admin.dashboard.integrations.title')).toBeInTheDocument()
    })
  })

  it('shows error banner with retry when callable fails', async () => {
    callableMock.mockRejectedValueOnce(new Error('boom'))
    render(<AdminDashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('admin.dashboard.errors.loadFailed')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'admin.dashboard.errors.retry' })).toBeInTheDocument()
  })
})
