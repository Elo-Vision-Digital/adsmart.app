import { render, screen } from '@testing-library/react'
import type React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'pt' as const,
    setLanguage: () => {},
  }),
}))
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Test Admin', email: 'admin@test.local' },
    loading: false,
    isAdmin: true,
  }),
}))
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}))

import { AdminLayout } from './AdminLayout'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<div>dashboard child</div>} />
          <Route path="security" element={<div>security child</div>} />
          <Route path="prices" element={<div>prices child</div>} />
          <Route path="wallet" element={<div>wallet child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('AdminLayout', () => {
  it('renders four sub-nav links pointing at the admin sub-routes', () => {
    renderAt('/admin/dashboard')
    const links = screen.getAllByRole('link')
    const hrefs = links.map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/admin/dashboard')
    expect(hrefs).toContain('/admin/security')
    expect(hrefs).toContain('/admin/prices')
    expect(hrefs).toContain('/admin/wallet')
  })

  it('renders the active child route content via Outlet', () => {
    renderAt('/admin/prices')
    expect(screen.getByText('prices child')).toBeInTheDocument()
  })

  it('marks the active sub-nav link with aria-current="page"', () => {
    renderAt('/admin/dashboard')
    const link = screen
      .getAllByRole('link')
      .find((a) => a.getAttribute('href') === '/admin/dashboard')
    expect(link).toBeDefined()
    expect(link).toHaveAttribute('aria-current', 'page')
  })
})
