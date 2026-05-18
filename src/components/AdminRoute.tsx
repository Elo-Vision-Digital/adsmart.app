import { Navigate } from 'react-router-dom'
import { AuthLoadingFallback } from '@/components/AuthLoadingFallback'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <AuthLoadingFallback />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
