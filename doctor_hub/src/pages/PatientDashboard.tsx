import { useState } from 'react'
import { AppointmentForm } from '../components/AppointmentForm'
import { AppointmentStatusList } from '../components/AppointmentStatusList'
import { DashboardShell } from '../components/DashboardShell'
import { DoctorSearch } from '../components/DoctorSearch'
import { MessageCenter } from '../components/MessageCenter'
import { PatientHistory } from '../components/PatientHistory'
import { PatientReportUpload } from '../components/PatientReportUpload'
import { Section } from '../components/Section'

export const PatientDashboard = () => {
  const [selectedDoctorId, setSelectedDoctorId] = useState('')

  return (
    <DashboardShell
      title="Patient dashboard"
      subtitle="Search doctors, request appointments, and track your history."
    >
      <Section id="patient-dashboard">
      <div className="card">
        <div className="card-header">
          <h2>Patient overview</h2>
          <span className="badge">Today</span>
        </div>
        <div className="list">
          <div className="list-item">Search doctors by disease and treatment.</div>
          <div className="list-item">Book appointments and upload payment proof.</div>
          <div className="list-item">Track confirmations and read history.</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2>Medical history rules</h2>
          <span className="badge">Protected records</span>
        </div>
        <div className="list">
          <div className="list-item">Medical history cannot be deleted.</div>
          <div className="list-item">
            Doctors can only add new records to your history.
          </div>
          <div className="list-item">Previous prescriptions cannot be edited.</div>
          <div className="list-item">
            Patients cannot remove doctor prescriptions.
          </div>
        </div>
      </div>
    </Section>
      <Section id="patient-actions">
        <div className="grid">
          <DoctorSearch onSelectDoctor={setSelectedDoctorId} />
          <AppointmentForm selectedDoctorId={selectedDoctorId} />
        </div>
      </Section>
      <Section id="patient-status">
        <div className="grid">
          <AppointmentStatusList />
          <PatientHistory />
        </div>
        <div style={{ marginTop: '20px' }}>
          <PatientReportUpload />
        </div>
      </Section>
      <Section id="patient-messages">
        <MessageCenter
          title="Doctor communication"
          subtitle="Send updates and questions to your doctor."
        />
      </Section>
    </DashboardShell>
  )
}
