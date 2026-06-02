import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

type ClinicRecord = {
  id: string
  name: string | null
  address: string | null
}

type ClinicForm = {
  name: string
  address: string
}

export const AdminClinicManager = () => {
  const [clinics, setClinics] = useState<ClinicRecord[]>([])
  const [form, setForm] = useState<ClinicForm>({ name: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadClinics = async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from('clinics')
      .select('id, name, address')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setClinics([])
    } else {
      setClinics(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadClinics()
  }, [])

  const handleChange = (key: keyof ClinicForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    const { error: insertError } = await supabase.from('clinics').insert({
      name: form.name,
      address: form.address,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('Clinic added.')
    setForm({ name: '', address: '' })
    await loadClinics()
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Clinics</h2>
        <span className="badge">Admin setup</span>
      </div>
      {loading ? (
        <p className="muted">Loading clinics...</p>
      ) : (
        <div className="list">
          {clinics.length === 0 ? (
            <div className="list-item muted">No clinics added yet.</div>
          ) : (
            clinics.map((clinic) => (
              <div key={clinic.id} className="list-item">
                <strong>{clinic.name ?? 'Unnamed clinic'}</strong>
                {clinic.address && <p className="muted">{clinic.address}</p>}
              </div>
            ))
          )}
        </div>
      )}
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="clinic-name">Clinic name</label>
          <input
            id="clinic-name"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <label htmlFor="clinic-address">Address</label>
          <input
            id="clinic-address"
            value={form.address}
            onChange={(event) => handleChange('address', event.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Add clinic
        </button>
        {error && <div className="alert">{error}</div>}
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  )
}
