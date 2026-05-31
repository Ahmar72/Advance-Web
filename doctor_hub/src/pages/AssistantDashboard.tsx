import { DashboardShell } from '../components/DashboardShell'
import { AssistantAppointmentQueue } from '../components/AssistantAppointmentQueue'
import { PaymentQueue } from '../components/PaymentQueue'
import { Section } from '../components/Section'

export const AssistantDashboard = () => (
  <DashboardShell
    title="Assistant dashboard"
    subtitle="Verify payments, confirm bookings, and coordinate clinics."
  >
    <Section id="assistant-dashboard">
      <div className="card">
        <div className="card-header">
          <h2>Assistant overview</h2>
          <span className="badge">Today</span>
        </div>
        <div className="list">
          <div className="list-item">Verify payment screenshots.</div>
          <div className="list-item">Confirm appointments after verification.</div>
          <div className="list-item">Keep doctors and patients updated.</div>
        </div>
      </div>
    </Section>
    <Section id="assistant-payments">
      <PaymentQueue />
    </Section>
    <Section id="assistant-confirmations">
      <AssistantAppointmentQueue />
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <h2>Appointment workflow</h2>
          <span className="badge">Checklist</span>
        </div>
        <div className="list">
          <div className="list-item">Confirm payment screenshot validity.</div>
          <div className="list-item">Mark payment as verified.</div>
          <div className="list-item">Set appointment status to confirmed.</div>
          <div className="list-item">Notify the patient and doctor.</div>
        </div>
      </div>
    </Section>
  </DashboardShell>
)
