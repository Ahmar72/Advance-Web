import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../types/roles'

type ProtectedRouteProps = {
  allow?: Role[]
  children: ReactNode
}

export const ProtectedRoute = ({ allow, children }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <div className="page">Loading session...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allow && (!role || !allow.includes(role))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
