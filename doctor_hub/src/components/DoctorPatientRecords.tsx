import { useState, type FormEvent } from 'react'
import { apiRequest } from '../lib/apiClient'
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

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError || !sessionData.session?.access_token) {
      setError('Please sign in again to load records.')
      setHistory([])
      setPrescriptions([])
      setReports([])
      setLoading(false)
      return
    }

    try {
      const response = await apiRequest<{
        history: HistoryRecord[]
        prescriptions: PrescriptionRecord[]
        reports: ReportRecord[]
      }>('/api/history', {
        token: sessionData.session.access_token,
        params: { patientId: patientId.trim() },
      })

      setHistory(response.history ?? [])
      setPrescriptions(response.prescriptions ?? [])
      setReports(response.reports ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed.'
      setError(message)
      setHistory([])
      setPrescriptions([])
      setReports([])
      setLoading(false)
      return
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Patient records</h2>
        <span className="badge">History + reports</span>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Enter the patient user ID from a confirmed appointment.
      </p>
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
        <div style={{ marginTop: '16px' }}>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3>History entries</h3>
              <span className="badge">Read-only</span>
            </div>
            <div className="list">
              {history.length === 0 ? (
                <div className="list-item muted">No history entries found.</div>
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
          </div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3>Prescriptions</h3>
              <span className="badge">Immutable</span>
            </div>
            <div className="list">
              {prescriptions.length === 0 ? (
                <div className="list-item muted">No prescriptions found.</div>
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
          </div>
          <div className="card">
            <div className="card-header">
              <h3>Patient reports</h3>
              <span className="badge">Uploads</span>
            </div>
            <div className="list">
              {reports.length === 0 ? (
                <div className="list-item muted">No reports found.</div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="list-item">
                    <strong>Report</strong>
                    <p className="muted">
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open report
                      </a>
                    </p>
                    {report.description && (
                      <p className="muted">Notes: {report.description}</p>
                    )}
                    {report.appointment_id && (
                      <p className="muted">
                        Appointment: {report.appointment_id}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
