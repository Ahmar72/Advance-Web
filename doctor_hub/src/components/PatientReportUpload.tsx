import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type ReportRecord = {
  id: string
  appointment_id: string | null
  file_url: string
  description: string | null
  created_at: string
}

type ReportForm = {
  appointmentId: string
  description: string
}

const REPORT_BUCKET = 'patient-reports'

export const PatientReportUpload = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [form, setForm] = useState<ReportForm>({
    appointmentId: '',
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadReports = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('patient_reports')
      .select('id, appointment_id, file_url, description, created_at')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setReports([])
    } else {
      setReports(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadReports()
  }, [user])

  const handleChange = (key: keyof ReportForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!user) {
      setError('Please sign in again to upload reports.')
      return
    }

    if (!file) {
      setError('Please select a report file to upload.')
      return
    }

    setSaving(true)

    const safeName = file.name.replace(/\s+/g, '-')
    const filePath = `${user.id}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from(REPORT_BUCKET)
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setSaving(false)
      return
    }

    const { data: publicUrl } = supabase.storage
      .from(REPORT_BUCKET)
      .getPublicUrl(filePath)

    const { error: insertError } = await supabase
      .from('patient_reports')
      .insert({
        patient_id: user.id,
        appointment_id: form.appointmentId || null,
        file_path: filePath,
        file_url: publicUrl.publicUrl,
        description: form.description || null,
      })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setMessage('Report uploaded.')
    setForm({ appointmentId: '', description: '' })
    setFile(null)
    await loadReports()
    setSaving(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Upload reports</h2>
        <div>
          <span className="badge">Patient reports</span>{' '}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={loadReports}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Reports are stored in the {REPORT_BUCKET} storage bucket.
      </p>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Upload PDFs or images to share with your doctor.
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="report-file">Report file</label>
          <input
            id="report-file"
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="report-appointment">Appointment ID (optional)</label>
          <input
            id="report-appointment"
            value={form.appointmentId}
            onChange={(event) => handleChange('appointmentId', event.target.value)}
          />
        </div>
        <div className="form-row">
          <label htmlFor="report-notes">Description</label>
          <textarea
            id="report-notes"
            value={form.description}
            onChange={(event) => handleChange('description', event.target.value)}
            placeholder="Lab results, imaging, or prior diagnosis"
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Uploading...' : 'Upload report'}
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
      {loading ? (
        <p className="muted">Loading reports...</p>
      ) : (
        <div className="list" style={{ marginTop: '16px' }}>
          {reports.length === 0 ? (
            <div className="list-item muted">No reports uploaded yet.</div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="list-item">
                <strong>Report</strong>
                <p className="muted">
                  <a href={report.file_url} target="_blank" rel="noreferrer">
                    Open report
                  </a>
                </p>
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
      )}
    </div>
  )
}
