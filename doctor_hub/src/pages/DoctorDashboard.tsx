import { DashboardShell } from '../components/DashboardShell'
import { DoctorPatientRecords } from '../components/DoctorPatientRecords'
import { DoctorScheduleManager } from '../components/DoctorScheduleManager'
import { MessageCenter } from '../components/MessageCenter'
import { PrescriptionForm } from '../components/PrescriptionForm'
import { Section } from '../components/Section'

export const DoctorDashboard = () => (
  <DashboardShell
    title="Doctor dashboard"
    subtitle="Confirm schedules, add prescriptions, and update patient history."
  >
    <Section id="doctor-dashboard">
      <div className="card">
        <div className="card-header">
          <h2>Doctor overview</h2>
          <span className="badge">Today</span>
        </div>
        <div className="list">
          <div className="list-item">Manage clinic schedules and sessions.</div>
          <div className="list-item">Write prescriptions and update history.</div>
          <div className="list-item">Communicate with patients securely.</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2>Prescription policy</h2>
          <span className="badge">Immutable</span>
        </div>
        <p className="muted">
          Once saved, prescriptions and history entries cannot be edited or
          removed. Add follow-up notes as new records instead.
        </p>
      </div>
    </Section>
    <Section id="doctor-schedules">
      <DoctorScheduleManager />
    </Section>
    <Section id="doctor-prescriptions">
      <PrescriptionForm />
    </Section>
    <Section id="doctor-records">
      <DoctorPatientRecords />
    </Section>
    <Section id="doctor-messages">
      <MessageCenter
        title="Patient communication"
        subtitle="Share updates, questions, and follow-ups securely."
      />
    </Section>
  </DashboardShell>
)
