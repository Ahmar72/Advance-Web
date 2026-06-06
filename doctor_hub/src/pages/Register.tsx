import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/apiClient'
import { supabase } from '../lib/supabaseClient'

export const Register = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const response = await apiRequest<{
        session?: { access_token: string; refresh_token: string } | null
        message?: string
      }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, fullName, role },
      })

      if (response.session?.access_token && response.session.refresh_token) {
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        })
      }

      setMessage(
        response.message ?? 'Account created. Check your email to confirm access.',
      )
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed.'
      setError(message)
    }

    setLoading(false)
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create account</h1>
          <p className="muted">Pick the role you need and set up access.</p>
        </div>
        <p className="muted" style={{ marginBottom: '16px' }}>
          Roles control which dashboard you can access. Admins can update roles
          later if needed.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-role">Role</label>
            <select
              id="register-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="assistant">Assistant</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
          {error && <div className="alert">{error}</div>}
          {message && <div className="notice">{message}</div>}
        </form>
        <div style={{ marginTop: '12px' }}>
          <span className="muted">Already registered?</span>{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
