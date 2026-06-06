import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/apiClient'
import { supabase } from '../lib/supabaseClient'

export const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await apiRequest<{
        session?: { access_token: string; refresh_token: string } | null
      }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      if (response.session?.access_token && response.session.refresh_token) {
        await supabase.auth.setSession({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token,
        })
      }

      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.'
      setError(message)
    }

    setLoading(false)
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p className="muted">Sign in to manage your Doctor Hub workflow.</p>
        </div>
        <p className="muted" style={{ marginBottom: '16px' }}>
          Use the same email you registered with to access your role dashboard.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          {error && <div className="alert">{error}</div>}
        </form>
        <div style={{ marginTop: '12px' }}>
          <Link className="muted" to="/forgot">
            Forgot password?
          </Link>
        </div>
        <div style={{ marginTop: '12px' }}>
          <span className="muted">No account yet?</span>{' '}
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}
