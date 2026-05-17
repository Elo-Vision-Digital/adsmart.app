import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin } = useAuth()

  if (!user) return <Navigate to="/login" />
  if (!isAdmin) return <Navigate to="/dashboard" />
  return <>{children}</>
}
