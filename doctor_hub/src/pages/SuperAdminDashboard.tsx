import { DashboardShell } from '../components/DashboardShell'
import { AdminAnalyticsPanel } from '../components/AdminAnalyticsPanel'
import { SuperAdminInsights } from '../components/SuperAdminInsights'
import { Section } from '../components/Section'

export const SuperAdminDashboard = () => (
  <DashboardShell
    title="Super admin dashboard"
    subtitle="System-wide controls, audits, and configuration."
  >
    <Section id="super-dashboard">
      <div className="card">
        <div className="card-header">
          <h2>Super admin overview</h2>
          <span className="badge">Today</span>
        </div>
        <div className="list">
          <div className="list-item">Review role distribution and trends.</div>
          <div className="list-item">Monitor workflows and audit critical actions.</div>
        </div>
      </div>
    </Section>
    <Section id="super-insights">
      <SuperAdminInsights />
    </Section>
    <Section id="super-analytics">
      <AdminAnalyticsPanel />
    </Section>
  </DashboardShell>
)
