import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as AuthContextModule from '@/contexts/AuthContext'
import { AdminRoute } from './AdminRoute'

function renderWithAuth(authValue: { user: unknown; isAdmin: boolean }, initialPath = '/admin') {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(authValue as never)

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div data-testid="admin-content">ADMIN</div>
            </AdminRoute>
          }
        />
        <Route path="/login" element={<div data-testid="login-page">LOGIN</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">DASHBOARD</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    renderWithAuth({ user: null, isAdmin: false })
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('redirects authenticated non-admin users to /dashboard', () => {
    renderWithAuth({ user: { uid: 'u1' }, isAdmin: false })
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })

  it('renders children for admin users', () => {
    renderWithAuth({ user: { uid: 'u1' }, isAdmin: true })
    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })
})
