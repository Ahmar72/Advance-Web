import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email)

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Password reset email sent. Follow the link to continue.')
    }

    setLoading(false)
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset password</h1>
          <p className="muted">We will send a secure reset link.</p>
        </div>
        <p className="muted" style={{ marginBottom: '16px' }}>
          If you do not receive the email, check spam or try again in a few
          minutes.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset email'}
          </button>
          {error && <div className="alert">{error}</div>}
          {message && <div className="notice">{message}</div>}
        </form>
        <div style={{ marginTop: '12px' }}>
          <Link className="muted" to="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
