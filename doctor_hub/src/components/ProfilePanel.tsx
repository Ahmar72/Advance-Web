import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { roleLabels } from '../types/roles'

export const ProfilePanel = () => {
  const { user, role } = useAuth()
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      setError(queryError.message)
    }

    setFullName(
      data?.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        '',
    )
    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
  }, [user])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSaving(true)

    if (!user) {
      setError('Please sign in again to update your profile.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase.from('users').upsert({
      id: user.id,
      full_name: fullName,
      role: role ?? 'patient',
    })

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setMessage('Profile updated.')
    setSaving(false)
  }

  return (
    <div className="card sidebar-card">
      <div className="card-header">
        <h3>Profile</h3>
        <div>
          <span className="badge">Account</span>{' '}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={loadProfile}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Keep your profile name updated for dashboards and messaging.
      </p>
      {loading ? (
        <p className="muted">Loading profile...</p>
      ) : (
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="profile-name">Full name</label>
            <input
              id="profile-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input value={user?.email ?? ''} disabled />
          </div>
          <div className="form-row">
            <label>Role</label>
            <input value={role ? roleLabels[role] : 'User'} disabled />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          {error && <div className="alert">{error}</div>}
          {message && <div className="notice">{message}</div>}
        </form>
      )}
    </div>
  )
}
