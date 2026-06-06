import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

type MessageRecord = {
  id: string
  sender_id: string
  receiver_id: string
  appointment_id: string | null
  body: string
  created_at: string
}

type MessageForm = {
  receiverId: string
  appointmentId: string
  body: string
}

type MessageCenterProps = {
  title: string
  subtitle: string
}

export const MessageCenter = ({ title, subtitle }: MessageCenterProps) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [form, setForm] = useState<MessageForm>({
    receiverId: '',
    appointmentId: '',
    body: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadMessages = async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, appointment_id, body, created_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (queryError) {
      setError(queryError.message)
      setMessages([])
    } else {
      setMessages(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadMessages()
  }, [user])

  const handleChange = (key: keyof MessageForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!user) {
      setError('Please sign in again to send messages.')
      return
    }

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: form.receiverId,
      appointment_id: form.appointmentId || null,
      body: form.body,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('Message sent.')
    setForm({ receiverId: '', appointmentId: '', body: '' })
    await loadMessages()
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>{title}</h2>
        <div>
          <span className="badge">Messaging</span>{' '}
          <button
            className="btn btn-ghost"
            type="button"
            onClick={loadMessages}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: '12px' }}>
        {subtitle}
      </p>
      <p className="muted" style={{ marginBottom: '12px' }}>
        Use the receiver's user ID from appointments or the user list.
      </p>
      {loading ? (
        <p className="muted">Loading messages...</p>
      ) : (
        <div className="list">
          {messages.length === 0 ? (
            <div className="list-item muted">No messages yet.</div>
          ) : (
            messages.map((item) => (
              <div key={item.id} className="list-item">
                <strong>{item.body}</strong>
                <p className="muted">
                  From: {item.sender_id} | To: {item.receiver_id}
                </p>
                <p className="muted">
                  {item.sender_id === user?.id ? 'Sent' : 'Received'} |{' '}
                  {new Date(item.created_at).toLocaleString()}
                </p>
                {item.appointment_id && (
                  <p className="muted">
                    Appointment: {item.appointment_id}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="msg-receiver">Receiver user ID</label>
          <input
            id="msg-receiver"
            value={form.receiverId}
            onChange={(event) => handleChange('receiverId', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="msg-appointment">Appointment ID (optional)</label>
          <input
            id="msg-appointment"
            value={form.appointmentId}
            onChange={(event) =>
              handleChange('appointmentId', event.target.value)
            }
          />
        </div>
        <div className="form-row">
          <label htmlFor="msg-body">Message</label>
          <textarea
            id="msg-body"
            value={form.body}
            onChange={(event) => handleChange('body', event.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Send message
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
