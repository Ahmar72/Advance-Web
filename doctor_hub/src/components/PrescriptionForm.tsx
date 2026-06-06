import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type PrescriptionFormState = {
  appointmentId: string
  patientId: string
  diagnosis: string
  medications: string
  instructions: string
}

export const PrescriptionForm = () => {
  const { user } = useAuth()
  const [form, setForm] = useState<PrescriptionFormState>({
    appointmentId: '',
    patientId: '',
    diagnosis: '',
    medications: '',
    instructions: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (key: keyof PrescriptionFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm({
      appointmentId: '',
      patientId: '',
      diagnosis: '',
      medications: '',
      instructions: '',
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!user) {
      setError('Please sign in again to add prescriptions.')
      setLoading(false)
      return
    }

    const { error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        appointment_id: form.appointmentId,
        doctor_id: user.id,
        patient_id: form.patientId,
        diagnosis: form.diagnosis,
        medications: form.medications,
        instructions: form.instructions,
      })

    if (prescriptionError) {
      setError(prescriptionError.message)
      setLoading(false)
      return
    }

    const { error: historyError } = await supabase
      .from('medical_history')
      .insert({
        patient_id: form.patientId,
        doctor_id: user.id,
        entry_type: 'prescription',
        summary: form.diagnosis,
        notes: form.instructions,
      })

    if (historyError) {
      setError(historyError.message)
      setLoading(false)
      return
    }

    setMessage('Prescription saved and added to medical history.')
    setForm({
      appointmentId: '',
      patientId: '',
      diagnosis: '',
      medications: '',
      instructions: '',
    })
    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>New prescription</h2>
        <span className="badge">Immutable records</span>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Use the appointment ID from the confirmed booking and the patient user
        ID from the appointment list.
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="appt-id">Appointment ID</label>
          <input
            id="appt-id"
            value={form.appointmentId}
            onChange={(event) => handleChange('appointmentId', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="patient-id">Patient ID</label>
          <input
            id="patient-id"
            value={form.patientId}
            onChange={(event) => handleChange('patientId', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="diagnosis">Diagnosis</label>
          <input
            id="diagnosis"
            value={form.diagnosis}
            onChange={(event) => handleChange('diagnosis', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="medications">Medications</label>
          <textarea
            id="medications"
            value={form.medications}
            onChange={(event) => handleChange('medications', event.target.value)}
            placeholder="Medication list, dosage, frequency"
          />
        </div>
        <div className="form-row">
          <label htmlFor="instructions">Care instructions</label>
          <textarea
            id="instructions"
            value={form.instructions}
            onChange={(event) => handleChange('instructions', event.target.value)}
            placeholder="Lifestyle guidance, follow-up schedule"
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save prescription'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={resetForm}>
            Reset form
          </button>
        </div>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
