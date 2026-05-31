import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type AppointmentFormState = {
  doctorId: string
  date: string
  time: string
  notes: string
  paymentUrl: string
}

export const AppointmentForm = () => {
  const { user } = useAuth()
  const [form, setForm] = useState<AppointmentFormState>({
    doctorId: '',
    date: '',
    time: '',
    notes: '',
    paymentUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        doctor_id: form.doctorId,
        appointment_date: form.date,
        appointment_time: form.time,
        status: 'pending',
        notes: form.notes,
      })
      .select('id')
      .single()

    if (appointmentError) {
      setError(appointmentError.message)
      setLoading(false)
      return
    }

    if (form.paymentUrl.trim()) {
      const { error: paymentError } = await supabase.from('payments').insert({
        appointment_id: appointment?.id,
        screenshot_url: form.paymentUrl,
        status: 'pending',
      })

      if (paymentError) {
        setError(paymentError.message)
        setLoading(false)
        return
      }
    }

    setMessage('Appointment requested. Awaiting assistant verification.')
    setForm({ doctorId: '', date: '', time: '', notes: '', paymentUrl: '' })
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Book appointment</h2>
        <span className="badge">Payment proof required</span>
      </div>
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
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Request appointment'}
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
