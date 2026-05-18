import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextType } from '@/contexts/AuthContext'
import { PrivateRoute } from './PrivateRoute'

function renderWithAuth(ctx: AuthContextType, path = '/private') {
  return render(
    <AuthContext.Provider value={ctx}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/private"
            element={
              <PrivateRoute>
                <div>PROTECTED</div>
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<div>LOGIN</div>} />
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

describe('PrivateRoute', () => {
  it('renders the loading fallback while loading=true', () => {
    renderWithAuth({ ...baseCtx, loading: true })
    expect(screen.queryByText('PROTECTED')).toBeNull()
    expect(screen.queryByText('LOGIN')).toBeNull()
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    renderWithAuth({ ...baseCtx, loading: false, user: null })
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(screen.queryByText('PROTECTED')).toBeNull()
  })

  it('renders children when authenticated', () => {
    const fakeUser = { uid: 'u1', email: 'u@x.com' } as unknown as AuthContextType['user']
    renderWithAuth({ ...baseCtx, loading: false, user: fakeUser })
    expect(screen.getByText('PROTECTED')).toBeInTheDocument()
  })
})
