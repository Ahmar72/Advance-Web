import { Link } from 'react-router-dom'

export const Unauthorized = () => (
  <div className="auth-layout">
    <div className="auth-card">
      <div className="auth-header">
        <h1>Access blocked</h1>
        <p className="muted">Your account role does not match this dashboard.</p>
      </div>
      <Link className="btn btn-outline" to="/">
        Return to dashboard selector
      </Link>
    </div>
  </div>
)
