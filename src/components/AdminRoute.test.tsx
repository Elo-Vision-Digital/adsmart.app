import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext'
import { AdminRoute } from './AdminRoute'

function renderWithAuth(ctx: AuthContextType) {
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>ADMIN</div>
              </AdminRoute>
            }
          />
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/dashboard" element={<div>DASH</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

const baseCtx: AuthContextType = {
  user: null,
  loading: false,
  isAdmin: false,
  hasPasswordProvider: false,
  signInWithEmail: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithFacebook: vi.fn(),
  signOut: vi.fn(),
}

const fakeUser = { uid: 'u1', email: 'u@x.com' } as unknown as AuthContextType['user']

describe('AdminRoute', () => {
  it('renders the loading fallback while loading=true', () => {
    renderWithAuth({ ...baseCtx, loading: true })
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()
  })

  it('redirects to /login when no user', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: null })
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
  })

  it('redirects to /dashboard when user is not admin', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: fakeUser, isAdmin: false })
    expect(screen.getByText('DASH')).toBeInTheDocument()
  })

  it('renders children when user is admin', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: fakeUser, isAdmin: true })
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })
})
