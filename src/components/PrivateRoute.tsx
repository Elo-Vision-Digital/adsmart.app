import { Navigate } from 'react-router-dom'
import { AuthLoadingFallback } from '@/components/AuthLoadingFallback'
import { useAuth } from '@/contexts/AuthContext'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoadingFallback />
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
