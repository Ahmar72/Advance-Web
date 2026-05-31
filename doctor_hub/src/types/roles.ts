export type Role = 'patient' | 'doctor' | 'assistant' | 'admin' | 'super_admin'

export const roleLabels: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  assistant: 'Assistant',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

export const rolePaths: Record<Role, string> = {
  patient: '/patient',
  doctor: '/doctor',
  assistant: '/assistant',
  admin: '/admin',
  super_admin: '/super-admin',
}
