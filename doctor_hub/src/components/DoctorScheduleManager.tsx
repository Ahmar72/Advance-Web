import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type ClinicRecord = {
  id: string
  name: string | null
}

type ScheduleRecord = {
  id: string
  clinic_id: string | null
  day_of_week: string
  start_time: string
  end_time: string
  notes: string | null
}

type ScheduleForm = {
  clinicId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  notes: string
}

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export const DoctorScheduleManager = () => {
  const { user } = useAuth()
  const [clinics, setClinics] = useState<ClinicRecord[]>([])
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([])
  const [form, setForm] = useState<ScheduleForm>({
    clinicId: '',
    dayOfWeek: 'Monday',
    startTime: '',
    endTime: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const [clinicResult, scheduleResult] = await Promise.all([
      supabase.from('clinics').select('id, name').order('name'),
      supabase
        .from('doctor_schedules')
        .select('id, clinic_id, day_of_week, start_time, end_time, notes')
        .eq('doctor_id', user.id)
        .order('day_of_week'),
    ])

    if (clinicResult.error) {
      setError(clinicResult.error.message)
    } else {
      setClinics(clinicResult.data ?? [])
    }

    if (scheduleResult.error) {
      setError(scheduleResult.error.message)
    } else {
      setSchedules(scheduleResult.data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleChange = (key: keyof ScheduleForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!user) {
      setError('Please sign in again to update schedules.')
      return
    }

    const { error: insertError } = await supabase
      .from('doctor_schedules')
      .insert({
        doctor_id: user.id,
        clinic_id: form.clinicId || null,
        day_of_week: form.dayOfWeek,
        start_time: form.startTime,
        end_time: form.endTime,
        notes: form.notes,
      })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('Schedule slot added.')
    setForm({
      clinicId: '',
      dayOfWeek: 'Monday',
      startTime: '',
      endTime: '',
      notes: '',
    })
    await loadData()
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Clinic schedules</h2>
        <span className="badge">Doctor-managed</span>
      </div>
      {loading ? (
        <p className="muted">Loading schedules...</p>
      ) : (
        <div className="list">
          {schedules.length === 0 ? (
            <div className="list-item muted">No schedules yet.</div>
          ) : (
            schedules.map((slot) => (
              <div key={slot.id} className="list-item">
                <strong>{slot.day_of_week}</strong>
                <p className="muted">
                  {slot.start_time} - {slot.end_time}
                </p>
                {slot.clinic_id && (
                  <p className="muted">Clinic ID: {slot.clinic_id}</p>
                )}
                {slot.notes && <p className="muted">Notes: {slot.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="schedule-clinic">Clinic</label>
          <select
            id="schedule-clinic"
            value={form.clinicId}
            onChange={(event) => handleChange('clinicId', event.target.value)}
          >
            <option value="">Select clinic</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name ?? clinic.id}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="schedule-day">Day</label>
          <select
            id="schedule-day"
            value={form.dayOfWeek}
            onChange={(event) => handleChange('dayOfWeek', event.target.value)}
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="schedule-start">Start time</label>
          <input
            id="schedule-start"
            type="time"
            value={form.startTime}
            onChange={(event) => handleChange('startTime', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="schedule-end">End time</label>
          <input
            id="schedule-end"
            type="time"
            value={form.endTime}
            onChange={(event) => handleChange('endTime', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="schedule-notes">Notes</label>
          <input
            id="schedule-notes"
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            placeholder="Telehealth, walk-ins, etc."
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Add schedule
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
