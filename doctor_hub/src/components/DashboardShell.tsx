import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { roleLabels } from '../types/roles'
import { ProfilePanel } from './ProfilePanel'
import { Section } from './Section'
import { SectionProvider } from './SectionContext'

type NavItem = { label: string; id: string }

const roleNav: Record<string, NavItem[]> = {
  patient: [
    { label: 'Dashboard', id: 'patient-dashboard' },
    { label: 'Appointments', id: 'patient-actions' },
    { label: 'History', id: 'patient-status' },
    { label: 'Messages', id: 'patient-messages' },
    { label: 'Profile', id: 'profile' },
  ],
  doctor: [
    { label: 'Dashboard', id: 'doctor-dashboard' },
    { label: 'Schedules', id: 'doctor-schedules' },
    { label: 'Prescriptions', id: 'doctor-prescriptions' },
    { label: 'Patient records', id: 'doctor-records' },
    { label: 'Messages', id: 'doctor-messages' },
    { label: 'Profile', id: 'profile' },
  ],
  assistant: [
    { label: 'Dashboard', id: 'assistant-dashboard' },
    { label: 'Payments', id: 'assistant-payments' },
    { label: 'Confirmations', id: 'assistant-confirmations' },
    { label: 'Profile', id: 'profile' },
  ],
  admin: [
    { label: 'Dashboard', id: 'admin-dashboard' },
    { label: 'Analytics', id: 'admin-analytics' },
    { label: 'Clinics', id: 'admin-clinics' },
    { label: 'Doctors', id: 'admin-doctors' },
    { label: 'Role management', id: 'admin-users' },
    { label: 'Profile', id: 'profile' },
  ],
  super_admin: [
    { label: 'Dashboard', id: 'super-dashboard' },
    { label: 'Insights', id: 'super-insights' },
    { label: 'Analytics', id: 'super-analytics' },
    { label: 'Profile', id: 'profile' },
  ],
}

type DashboardShellProps = {
  title: string
  subtitle: string
  children: React.ReactNode
}

export const DashboardShell = ({
  title,
  subtitle,
  children,
}: DashboardShellProps) => {
  const { role, signOut } = useAuth()
  const navItems = useMemo(() => (role ? roleNav[role] ?? [] : []), [role])
  const [activeSection, setActiveSection] = useState(
    navItems[0]?.id ?? 'profile',
  )
  const [theme, setTheme] = useState(() => {
    const stored = window.localStorage.getItem('doctor-hub-theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    if (navItems.length > 0) {
      setActiveSection(navItems[0].id)
    }
  }, [navItems])

  useEffect(() => {
    document.body.dataset.theme = theme
    window.localStorage.setItem('doctor-hub-theme', theme)
  }, [theme])

  return (
    <SectionProvider value={{ activeSection, setActiveSection }}>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">DH</div>
            <div>
              <p className="brand-title">Doctor Hub</p>
              <p className="brand-subtitle">Consultation command center</p>
            </div>
          </div>
          <div className="sidebar-section">
            <p className="sidebar-title">Navigation</p>
            <div className="sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-link${
                    activeSection === item.id ? ' is-active' : ''
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              ))}
              <Link className="sidebar-link" to="/">
                Switch dashboard
              </Link>
            </div>
          </div>
          <div className="sidebar-section">
            <p className="sidebar-title">Appearance</p>
            <button
              type="button"
              className="sidebar-link"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
          <div className="sidebar-section">
            <p className="sidebar-title">Account</p>
            <div className="sidebar-meta">
              <span className="tag">{role ? roleLabels[role] : 'User'}</span>
              <button className="btn btn-ghost" type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
        </aside>
        <main className="page">
          <div className="topbar main-topbar">
            <div>
              <h1>{title}</h1>
              <p className="muted">{subtitle}</p>
            </div>
          </div>
          <div className="layout">
            {children}
            <Section id="profile">
              <ProfilePanel />
            </Section>
          </div>
        </main>
      </div>
    </SectionProvider>
  )
}
