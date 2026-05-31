import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type AppointmentRecord = {
  id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: string
  notes: string | null
  created_at: string
}

type PaymentRecord = {
  appointment_id: string
  status: string
}

export const AppointmentStatusList = () => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [paymentMap, setPaymentMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('appointments')
      .select(
        'id, doctor_id, appointment_date, appointment_time, status, notes, created_at',
      )
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setAppointments([])
      setPaymentMap({})
      setLoading(false)
      return
    }

    const ids = (data ?? []).map((appointment) => appointment.id)

    if (ids.length > 0) {
      const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('appointment_id, status')
        .in('appointment_id', ids)

      if (paymentError) {
        setError(paymentError.message)
        setPaymentMap({})
      } else {
        const nextMap: Record<string, string> = {}
        ;(payments ?? []).forEach((payment: PaymentRecord) => {
          nextMap[payment.appointment_id] = payment.status
        })
        setPaymentMap(nextMap)
      }
    } else {
      setPaymentMap({})
    }

    setAppointments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadAppointments()
  }, [user])

  return (
    <div className="card">
      <div className="card-header">
        <h2>Appointment status</h2>
        <span className="badge">Tracking</span>
      </div>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading appointments...</p>
      ) : (
        <div className="list">
          {appointments.length === 0 ? (
            <div className="list-item muted">No appointments yet.</div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="list-item">
                <strong>{appointment.appointment_date}</strong>
                <p className="muted">
                  Time: {appointment.appointment_time} | Status:{' '}
                  {appointment.status}
                </p>
                <p className="muted">Doctor ID: {appointment.doctor_id}</p>
                <p className="muted">
                  Payment: {paymentMap[appointment.id] ?? 'pending'}
                </p>
                {appointment.notes && (
                  <p className="muted">Notes: {appointment.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
