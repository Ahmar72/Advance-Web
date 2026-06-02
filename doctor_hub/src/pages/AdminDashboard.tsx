import { useEffect, useState, type FormEvent } from 'react'
import { AdminClinicManager } from '../components/AdminClinicManager'
import { AdminAnalyticsPanel } from '../components/AdminAnalyticsPanel'
import { AdminUserManagement } from '../components/AdminUserManagement'
import { DashboardShell } from '../components/DashboardShell'
import { supabase } from '../lib/supabaseClient'
import { Section } from '../components/Section'

type Metrics = {
  doctors: number
  users: number
  clinics: number
}

type DoctorForm = {
  fullName: string
  treatmentType: string
  diseaseFocus: string
  clinicName: string
}

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    doctors: 0,
    users: 0,
    clinics: 0,
  })
  const [form, setForm] = useState<DoctorForm>({
    fullName: '',
    treatmentType: 'allopathic',
    diseaseFocus: '',
    clinicName: '',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = async () => {
    const { count: doctorCount } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
    const { count: userCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    const { count: clinicCount } = await supabase
      .from('clinics')
      .select('id', { count: 'exact', head: true })

    setMetrics({
      doctors: doctorCount ?? 0,
      users: userCount ?? 0,
      clinics: clinicCount ?? 0,
    })
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const handleChange = (key: keyof DoctorForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    const { error: insertError } = await supabase.from('doctors').insert({
      full_name: form.fullName,
      treatment_type: form.treatmentType,
      disease_focus: form.diseaseFocus,
      clinic_name: form.clinicName,
    })

    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('Doctor profile created.')
    setForm({
      fullName: '',
      treatmentType: 'allopathic',
      diseaseFocus: '',
      clinicName: '',
    })
    await loadMetrics()
  }

  return (
    <DashboardShell
      title="Admin dashboard"
      subtitle="Manage doctors, clinics, and user access."
    >
      <Section id="admin-dashboard">
        <div className="card">
          <div className="card-header">
            <h2>Admin overview</h2>
            <span className="badge">Today</span>
          </div>
          <div className="list">
            <div className="list-item">Doctors: {metrics.doctors}</div>
            <div className="list-item">Users: {metrics.users}</div>
            <div className="list-item">Clinics: {metrics.clinics}</div>
          </div>
        </div>
      </Section>
      <Section id="admin-analytics">
        <AdminAnalyticsPanel />
      </Section>
      <Section id="admin-clinics">
        <AdminClinicManager />
      </Section>
      <Section id="admin-doctors">
        <div className="card">
          <div className="card-header">
            <h2>Add doctor</h2>
            <span className="badge">Profile setup</span>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="doctor-name">Full name</label>
              <input
                id="doctor-name"
                value={form.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="doctor-treatment">Treatment type</label>
              <select
                id="doctor-treatment"
                value={form.treatmentType}
                onChange={(event) =>
                  handleChange('treatmentType', event.target.value)
                }
              >
                <option value="allopathic">Allopathic</option>
                <option value="homeopathic">Homeopathic</option>
                <option value="herbal">Herbal</option>
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="doctor-disease">Disease focus</label>
              <input
                id="doctor-disease"
                value={form.diseaseFocus}
                onChange={(event) =>
                  handleChange('diseaseFocus', event.target.value)
                }
              />
            </div>
            <div className="form-row">
              <label htmlFor="doctor-clinic">Clinic</label>
              <input
                id="doctor-clinic"
                value={form.clinicName}
                onChange={(event) =>
                  handleChange('clinicName', event.target.value)
                }
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Save doctor
            </button>
            {error && <div className="alert">{error}</div>}
            {message && <div className="notice">{message}</div>}
          </form>
        </div>
      </Section>
      <Section id="admin-users">
        <AdminUserManagement />
      </Section>
    </DashboardShell>
  )
}
