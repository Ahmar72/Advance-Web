import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

type HistoryRecord = {
  id: string
  entry_type: string
  summary: string
  notes: string | null
  doctor_id: string
  created_at: string
}

type PrescriptionRecord = {
  id: string
  appointment_id: string
  diagnosis: string
  medications: string | null
  instructions: string | null
  doctor_id: string
  created_at: string
}

type ReportRecord = {
  id: string
  appointment_id: string | null
  file_url: string
  description: string | null
  created_at: string
}

export const DoctorPatientRecords = () => {
  const [patientId, setPatientId] = useState('')
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const [historyResult, prescriptionResult, reportResult] = await Promise.all([
      supabase
        .from('medical_history')
        .select('id, entry_type, summary, notes, doctor_id, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('prescriptions')
        .select(
          'id, appointment_id, diagnosis, medications, instructions, doctor_id, created_at',
        )
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('patient_reports')
        .select('id, appointment_id, file_url, description, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
    ])

    const errorMessage =
      historyResult.error?.message ||
      prescriptionResult.error?.message ||
      reportResult.error?.message

    if (errorMessage) {
      setError(errorMessage)
      setHistory([])
      setPrescriptions([])
      setReports([])
      setLoading(false)
      return
    }

    setHistory(historyResult.data ?? [])
    setPrescriptions(prescriptionResult.data ?? [])
    setReports(reportResult.data ?? [])
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Patient records</h2>
        <span className="badge">History + reports</span>
      </div>
      <form className="form" onSubmit={handleSearch}>
        <div className="form-row">
          <label htmlFor="patient-records-id">Patient user ID</label>
          <input
            id="patient-records-id"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Load records'}
        </button>
        {error && <div className="alert">{error}</div>}
      </form>

      {!loading ? (
        <div className="list" style={{ marginTop: '16px' }}>
          <div className="list-item">
            <strong>History entries</strong>
            {history.length === 0 ? (
              <p className="muted">No history entries found.</p>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="list-item">
                  <strong>{entry.summary}</strong>
                  <p className="muted">
                    Type: {entry.entry_type} | Doctor: {entry.doctor_id}
                  </p>
                  {entry.notes && <p className="muted">Notes: {entry.notes}</p>}
                </div>
              ))
            )}
          </div>
          <div className="list-item">
            <strong>Prescriptions</strong>
            {prescriptions.length === 0 ? (
              <p className="muted">No prescriptions found.</p>
            ) : (
              prescriptions.map((rx) => (
                <div key={rx.id} className="list-item">
                  <strong>{rx.diagnosis}</strong>
                  <p className="muted">Doctor: {rx.doctor_id}</p>
                  {rx.medications && (
                    <p className="muted">Meds: {rx.medications}</p>
                  )}
                  {rx.instructions && (
                    <p className="muted">Instructions: {rx.instructions}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="list-item">
            <strong>Patient reports</strong>
            {reports.length === 0 ? (
              <p className="muted">No reports found.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="list-item">
                  <strong>Report</strong>
                  <p className="muted">{report.file_url}</p>
                  {report.description && (
                    <p className="muted">Notes: {report.description}</p>
                  )}
                  {report.appointment_id && (
                    <p className="muted">Appointment: {report.appointment_id}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
