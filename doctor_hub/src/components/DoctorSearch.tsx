import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

type DoctorRecord = {
  id: string
  full_name: string
  treatment_type: string
  disease_focus: string
  clinic_name: string
}

type DoctorSearchProps = {
  onSelectDoctor?: (doctorId: string) => void
}

export const DoctorSearch = ({ onSelectDoctor }: DoctorSearchProps) => {
  const [name, setName] = useState('')
  const [disease, setDisease] = useState('')
  const [treatment, setTreatment] = useState('all')
  const [results, setResults] = useState<DoctorRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    let query = supabase
      .from('doctors')
      .select('id, full_name, treatment_type, disease_focus, clinic_name')
      .order('full_name', { ascending: true })

    if (name.trim()) {
      query = query.ilike('full_name', `%${name.trim()}%`)
    }
    if (disease.trim()) {
      query = query.ilike('disease_focus', `%${disease.trim()}%`)
    }
    if (treatment !== 'all') {
      query = query.eq('treatment_type', treatment)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError.message)
      setResults([])
    } else {
      setResults(data ?? [])
    }

    setLoading(false)
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Doctor search</h2>
        <span className="badge">Filter by disease + treatment</span>
      </div>
      <form className="form" onSubmit={handleSearch}>
        <div className="form-row">
          <label htmlFor="doctor-name">Doctor name</label>
          <input
            id="doctor-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Search by name"
          />
        </div>
        <div className="form-row">
          <label htmlFor="doctor-disease">Disease focus</label>
          <input
            id="doctor-disease"
            value={disease}
            onChange={(event) => setDisease(event.target.value)}
            placeholder="Diabetes, asthma, migraine"
          />
        </div>
        <div className="form-row">
          <label htmlFor="doctor-treatment">Treatment type</label>
          <select
            id="doctor-treatment"
            value={treatment}
            onChange={(event) => setTreatment(event.target.value)}
          >
            <option value="all">All</option>
            <option value="allopathic">Allopathic</option>
            <option value="homeopathic">Homeopathic</option>
            <option value="herbal">Herbal</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search doctors'}
        </button>
        {error && <div className="alert">{error}</div>}
      </form>

      <div className="list" style={{ marginTop: '20px' }}>
        {results.length === 0 && !loading ? (
          <div className="list-item muted">No doctors found yet.</div>
        ) : null}
        {results.map((doctor) => (
          <div key={doctor.id} className="list-item">
            <strong>{doctor.full_name}</strong>
            <p className="muted">
              {doctor.treatment_type} care | {doctor.disease_focus}
            </p>
            <p className="muted">Clinic: {doctor.clinic_name}</p>
            {onSelectDoctor ? (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => onSelectDoctor(doctor.id)}
              >
                Use this doctor
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
