import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface PrivateRouteProps {
  children: React.ReactNode
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  const { user } = useAuth()

  return user ? <>{children}</> : <Navigate to="/login" />
}