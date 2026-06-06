import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type PaymentRecord = {
  id: string
  appointment_id: string
  amount: number | null
  screenshot_url: string | null
  status: string
  created_at: string
}

export const PaymentQueue = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadPayments = async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('payments')
      .select('id, appointment_id, amount, screenshot_url, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (queryError) {
      setError(queryError.message)
      setPayments([])
    } else {
      setPayments(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadPayments()
  }, [])

  const verifyPayment = async (paymentId: string) => {
    setUpdatingId(paymentId)
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'verified' })
      .eq('id', paymentId)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    await loadPayments()
    setUpdatingId(null)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Payment verification</h2>
        <div>
          <span className="badge">Assistant queue</span>{' '}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={loadPayments}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Verify payment proof before confirming appointments.
      </p>
      {error && <div className="alert">{error}</div>}
      {loading ? (
        <p className="muted">Loading pending payments...</p>
      ) : (
        <div className="list">
          {payments.length === 0 ? (
            <div className="list-item muted">
              No pending payments right now.
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="list-item">
                <strong>Appointment {payment.appointment_id}</strong>
                <p className="muted">
                  Amount: {payment.amount ?? 'N/A'} | Status: {payment.status}
                </p>
                <p className="muted">
                  Screenshot:{' '}
                  {payment.screenshot_url ? (
                    <a
                      href={payment.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open image
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => verifyPayment(payment.id)}
                  disabled={updatingId === payment.id}
                >
                  {updatingId === payment.id ? 'Verifying...' : 'Verify payment'}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
