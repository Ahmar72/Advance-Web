import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type AnalyticsCounts = {
  pendingAppointments: number
  confirmedAppointments: number
  pendingPayments: number
  verifiedPayments: number
  prescriptions: number
  historyEntries: number
  messages: number
  scheduleSlots: number
}

export const AdminAnalyticsPanel = () => {
  const [counts, setCounts] = useState<AnalyticsCounts>({
    pendingAppointments: 0,
    confirmedAppointments: 0,
    pendingPayments: 0,
    verifiedPayments: 0,
    prescriptions: 0,
    historyEntries: 0,
    messages: 0,
    scheduleSlots: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const loadCounts = async () => {
    setError(null)

    const [pendingAppointments, confirmedAppointments, pendingPayments, verifiedPayments, prescriptions, historyEntries, messages, scheduleSlots] =
      await Promise.all([
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed'),
        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'verified'),
        supabase.from('prescriptions').select('id', { count: 'exact', head: true }),
        supabase
          .from('medical_history')
          .select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase
          .from('doctor_schedules')
          .select('id', { count: 'exact', head: true }),
      ])

    const errorMessage =
      pendingAppointments.error?.message ||
      confirmedAppointments.error?.message ||
      pendingPayments.error?.message ||
      verifiedPayments.error?.message ||
      prescriptions.error?.message ||
      historyEntries.error?.message ||
      messages.error?.message ||
      scheduleSlots.error?.message

    if (errorMessage) {
      setError(errorMessage)
      return
    }

    setCounts({
      pendingAppointments: pendingAppointments.count ?? 0,
      confirmedAppointments: confirmedAppointments.count ?? 0,
      pendingPayments: pendingPayments.count ?? 0,
      verifiedPayments: verifiedPayments.count ?? 0,
      prescriptions: prescriptions.count ?? 0,
      historyEntries: historyEntries.count ?? 0,
      messages: messages.count ?? 0,
      scheduleSlots: scheduleSlots.count ?? 0,
    })
  }

  useEffect(() => {
    loadCounts()
  }, [])

  return (
    <div className="card">
      <div className="card-header">
        <h2>Operations analytics</h2>
        <span className="badge">Live metrics</span>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="list">
        <div className="list-item">Pending appointments: {counts.pendingAppointments}</div>
        <div className="list-item">Confirmed appointments: {counts.confirmedAppointments}</div>
        <div className="list-item">Pending payments: {counts.pendingPayments}</div>
        <div className="list-item">Verified payments: {counts.verifiedPayments}</div>
        <div className="list-item">Prescriptions issued: {counts.prescriptions}</div>
        <div className="list-item">History entries: {counts.historyEntries}</div>
        <div className="list-item">Messages sent: {counts.messages}</div>
        <div className="list-item">Schedule slots: {counts.scheduleSlots}</div>
      </div>
    </div>
  )
}
