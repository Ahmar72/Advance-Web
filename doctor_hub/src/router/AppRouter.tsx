import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { rolePaths } from '../types/roles'
import { DashboardRedirect } from '../pages/DashboardRedirect'
import { Login } from '../pages/Login'
import { Register } from '../pages/Register'
import { ForgotPassword } from '../pages/ForgotPassword'
import { Unauthorized } from '../pages/Unauthorized'
import { PatientDashboard } from '../pages/PatientDashboard'
import { DoctorDashboard } from '../pages/DoctorDashboard'
import { AssistantDashboard } from '../pages/AssistantDashboard'
import { AdminDashboard } from '../pages/AdminDashboard'
import { SuperAdminDashboard } from '../pages/SuperAdminDashboard'
import { NotFound } from '../pages/NotFound'

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<DashboardRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path={rolePaths.patient}
        element={
          <ProtectedRoute allow={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={rolePaths.doctor}
        element={
          <ProtectedRoute allow={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={rolePaths.assistant}
        element={
          <ProtectedRoute allow={['assistant']}>
            <AssistantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={rolePaths.admin}
        element={
          <ProtectedRoute allow={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={rolePaths.super_admin}
        element={
          <ProtectedRoute allow={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
)
