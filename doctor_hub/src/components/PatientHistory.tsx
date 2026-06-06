import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/apiClient'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

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

export const PatientHistory = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHistory = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError || !sessionData.session?.access_token) {
      setError('Please sign in again to load history.')
      setHistory([])
      setPrescriptions([])
      setLoading(false)
      return
    }

    try {
      const response = await apiRequest<{
        history: HistoryRecord[]
        prescriptions: PrescriptionRecord[]
      }>('/api/history', {
        token: sessionData.session.access_token,
      })

      setHistory(response.history ?? [])
      setPrescriptions(response.prescriptions ?? [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed.'
      setError(message)
      setHistory([])
      setPrescriptions([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadHistory()
  }, [user])

  return (
    <div className="card">
      <div className="card-header">
        <h2>Medical history</h2>
        <span className="badge">Read-only</span>
      </div>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading history...</p>
      ) : (
        <>
          <div className="list">
            {history.length === 0 ? (
              <div className="list-item muted">No history entries yet.</div>
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
          <div className="card" style={{ marginTop: '16px' }}>
            <div className="card-header">
              <h3>Prescriptions</h3>
              <span className="badge">Immutable</span>
            </div>
            <div className="list">
              {prescriptions.length === 0 ? (
                <div className="list-item muted">No prescriptions yet.</div>
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
        </>
      )}
    </div>
  )
}
