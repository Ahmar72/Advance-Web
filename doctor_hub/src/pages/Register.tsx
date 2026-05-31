import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setMessage('Account created. Check your email to confirm access.')
      setTimeout(() => navigate('/login'), 1200)
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
