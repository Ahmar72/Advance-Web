import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type AppointmentRecord = {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  status: string
  created_at: string
}

type PaymentRecord = {
  appointment_id: string
  status: string
}

export const AssistantAppointmentQueue = () => {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [paymentMap, setPaymentMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAppointments = async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('appointments')
      .select(
        'id, patient_id, doctor_id, appointment_date, appointment_time, status, created_at',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

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
  }, [])

  const confirmAppointment = async (appointmentId: string) => {
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    await loadAppointments()
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Confirm appointments</h2>
        <span className="badge">Assistant queue</span>
      </div>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading pending appointments...</p>
      ) : (
        <div className="list">
          {appointments.length === 0 ? (
            <div className="list-item muted">No pending appointments.</div>
          ) : (
            appointments.map((appointment) => {
              const paymentStatus = paymentMap[appointment.id]
              const canConfirm = paymentStatus === 'verified'
              return (
                <div key={appointment.id} className="list-item">
                  <strong>{appointment.appointment_date}</strong>
                  <p className="muted">
                    Time: {appointment.appointment_time} | Payment:{' '}
                    {paymentStatus ?? 'pending'}
                  </p>
                  <p className="muted">Patient: {appointment.patient_id}</p>
                  <p className="muted">Doctor: {appointment.doctor_id}</p>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => confirmAppointment(appointment.id)}
                    disabled={!canConfirm}
                  >
                    {canConfirm ? 'Confirm appointment' : 'Await payment'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
