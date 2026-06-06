import { useEffect, useState, type FormEvent } from 'react'
import { apiRequest } from '../lib/apiClient'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type AppointmentFormState = {
  doctorId: string
  date: string
  time: string
  notes: string
  paymentUrl: string
  paymentAmount: string
}

type AppointmentFormProps = {
  selectedDoctorId?: string
}

const PAYMENT_BUCKET = 'payment-screenshots'

export const AppointmentForm = ({ selectedDoctorId }: AppointmentFormProps) => {
  const { user } = useAuth()
  const [form, setForm] = useState<AppointmentFormState>({
    doctorId: selectedDoctorId ?? '',
    date: '',
    time: '',
    notes: '',
    paymentUrl: '',
    paymentAmount: '',
  })
  const [paymentFile, setPaymentFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedDoctorId && selectedDoctorId !== form.doctorId) {
      setForm((prev) => ({ ...prev, doctorId: selectedDoctorId }))
    }
  }, [selectedDoctorId, form.doctorId])

  const handleChange = (
    key: keyof AppointmentFormState,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!user) {
      setError('Please sign in again to book an appointment.')
      setLoading(false)
      return
    }

    if (!paymentFile && !form.paymentUrl.trim()) {
      setError('Please upload a payment screenshot or provide its URL.')
      setLoading(false)
      return
    }

    let screenshotUrl = form.paymentUrl.trim()

    if (paymentFile) {
      const safeName = paymentFile.name.replace(/\s+/g, '-')
      const filePath = `${user.id}/${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from(PAYMENT_BUCKET)
        .upload(filePath, paymentFile)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrl } = supabase.storage
        .from(PAYMENT_BUCKET)
        .getPublicUrl(filePath)

      screenshotUrl = publicUrl.publicUrl
    }

    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (sessionError || !sessionData.session?.access_token) {
      setError('Please sign in again to submit the appointment.')
      setLoading(false)
      return
    }

    try {
      await apiRequest('/api/appointments', {
        method: 'POST',
        token: sessionData.session.access_token,
        body: {
          doctorId: form.doctorId,
          appointmentDate: form.date,
          appointmentTime: form.time,
          notes: form.notes || undefined,
          paymentUrl: screenshotUrl,
          paymentAmount: form.paymentAmount
            ? Number(form.paymentAmount)
            : undefined,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed.'
      setError(message)
      setLoading(false)
      return
    }

    setMessage('Appointment requested. Awaiting assistant verification.')
    setForm({
      doctorId: '',
      date: '',
      time: '',
      notes: '',
      paymentUrl: '',
      paymentAmount: '',
    })
    setPaymentFile(null)
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Book appointment</h2>
        <span className="badge">Payment proof required</span>
      </div>
      {selectedDoctorId ? (
        <p className="muted" style={{ marginBottom: '12px' }}>
          Selected doctor ID: {selectedDoctorId}
        </p>
      ) : null}
      <p className="muted" style={{ marginBottom: '12px' }}>
        Choose a doctor from search or paste the doctor ID, then attach a
        payment screenshot (file or URL).
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="doctor-id">Doctor ID</label>
          <input
            id="doctor-id"
            value={form.doctorId}
            onChange={(event) => handleChange('doctorId', event.target.value)}
            placeholder="Supabase doctors.id"
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="appt-date">Appointment date</label>
          <input
            id="appt-date"
            type="date"
            value={form.date}
            onChange={(event) => handleChange('date', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="appt-time">Appointment time</label>
          <input
            id="appt-time"
            type="time"
            value={form.time}
            onChange={(event) => handleChange('time', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="appt-notes">Notes</label>
          <textarea
            id="appt-notes"
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            placeholder="Reason for visit, key symptoms"
          />
        </div>
        <div className="form-row">
          <label htmlFor="payment-url">Payment screenshot URL</label>
          <input
            id="payment-url"
            value={form.paymentUrl}
            onChange={(event) => handleChange('paymentUrl', event.target.value)}
            placeholder="Upload to storage and paste URL"
          />
        </div>
        <div className="form-row">
          <label htmlFor="payment-file">Payment screenshot file</label>
          <input
            id="payment-file"
            type="file"
            onChange={(event) =>
              setPaymentFile(event.target.files?.[0] ?? null)
            }
          />
        </div>
        <div className="form-row">
          <label htmlFor="payment-amount">Payment amount (optional)</label>
          <input
            id="payment-amount"
            type="number"
            value={form.paymentAmount}
            onChange={(event) =>
              handleChange('paymentAmount', event.target.value)
            }
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Request appointment'}
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
