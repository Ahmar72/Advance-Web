import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const roles = ['patient', 'doctor', 'assistant', 'admin', 'super_admin']

type RoleCount = Record<string, number>

type SuperAdminStats = {
  usersByRole: RoleCount
  totalUsers: number
}

export const SuperAdminInsights = () => {
  const [stats, setStats] = useState<SuperAdminStats>({
    usersByRole: {},
    totalUsers: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setError(null)

    const { data, error: queryError } = await supabase
      .from('users')
      .select('role')

    if (queryError) {
      setError(queryError.message)
      return
    }

    const counts: RoleCount = {}
    roles.forEach((role) => {
      counts[role] = 0
    })

    ;(data ?? []).forEach((row) => {
      if (!counts[row.role]) {
        counts[row.role] = 0
      }
      counts[row.role] += 1
    })

    setStats({
      usersByRole: counts,
      totalUsers: data?.length ?? 0,
    })
  }

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="card">
      <div className="card-header">
        <h2>Role distribution</h2>
        <span className="badge">Super admin</span>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="list">
        <div className="list-item">Total users: {stats.totalUsers}</div>
        {roles.map((role) => (
          <div key={role} className="list-item">
            {role}: {stats.usersByRole[role] ?? 0}
          </div>
        ))}
      </div>
    </div>
  )
}
