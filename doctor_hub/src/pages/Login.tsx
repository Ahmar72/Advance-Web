import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/')
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
