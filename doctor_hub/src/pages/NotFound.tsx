import { Link } from 'react-router-dom'

export const NotFound = () => (
  <div className="auth-layout">
    <div className="auth-card">
      <div className="auth-header">
        <h1>Page not found</h1>
        <p className="muted">This route does not exist in Doctor Hub.</p>
      </div>
      <Link className="btn btn-outline" to="/">
        Back to dashboard
      </Link>
    </div>
  </div>
)
