import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

type UserRecord = {
  id: string
  full_name: string | null
  role: string
}

type UpdateForm = {
  userId: string
  role: string
}

const roles = ['patient', 'doctor', 'assistant', 'admin', 'super_admin']

export const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [form, setForm] = useState<UpdateForm>({ userId: '', role: 'patient' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .order('created_at', { ascending: false })
      .limit(20)

    if (queryError) {
      setError(queryError.message)
      setUsers([])
    } else {
      setUsers(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleChange = (key: keyof UpdateForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const { error: updateError } = await supabase
      .from('users')
      .update({ role: form.role })
      .eq('id', form.userId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage('User role updated.')
    setForm({ userId: '', role: 'patient' })
    await loadUsers()
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>User access</h2>
        <div>
          <span className="badge">Admin controls</span>{' '}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={loadUsers}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Copy a user ID from the list below to update their role.
      </p>
      {loading ? (
        <p className="muted">Loading users...</p>
      ) : (
        <div className="list">
          {users.length === 0 ? (
            <div className="list-item muted">No users found.</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="list-item">
                <strong>{user.full_name ?? 'Unnamed user'}</strong>
                <p className="muted">
                  {user.id} | Role: {user.role}
                </p>
              </div>
            ))
          )}
        </div>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="admin-user-id">User ID</label>
          <input
            id="admin-user-id"
            value={form.userId}
            onChange={(event) => handleChange('userId', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="admin-user-role">Role</label>
          <select
            id="admin-user-role"
            value={form.role}
            onChange={(event) => handleChange('role', event.target.value)}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" type="submit">
          Update role
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
