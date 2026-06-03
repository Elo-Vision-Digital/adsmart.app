import { Navigate } from 'react-router-dom'
import { AuthLoadingFallback } from '@/components/AuthLoadingFallback'
import { useAuth } from '@/contexts/AuthContext'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <AuthLoadingFallback />

  // If user is already authenticated, redirect to the dashboard
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}
