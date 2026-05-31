import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { rolePaths } from '../types/roles'

export const DashboardRedirect = () => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <div className="page">Loading dashboard...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role) {
    return <Navigate to={rolePaths[role]} replace />
  }

  return <Navigate to="/unauthorized" replace />
}
