import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { MachinesPage } from '../pages/MachinesPage'
import { MachineDetailPage } from '../pages/MachineDetailPage'
import { UpdateStatusPage } from '../pages/UpdateStatusPage'
import { TicketsPage } from '../pages/TicketsPage'
import { TicketDetailPage } from '../pages/TicketDetailPage'
import { RaiseTicketPage } from '../pages/RaiseTicketPage'
import { DailyLogsPage } from '../pages/DailyLogsPage'
import { SiteVisitsPage } from '../pages/SiteVisitsPage'
import { LogVisitPage } from '../pages/LogVisitPage'
import { AdminPage } from '../pages/AdminPage'

/**
 * All application routes.
 * Public routes: /login (redirects to /dashboard if already authenticated)
 * Protected routes: everything else (wrapped in ProtectedRoute).
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public — redirects authenticated users to dashboard */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected — any authenticated user */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/machines"
        element={
          <ProtectedRoute>
            <MachinesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/machines/:id"
        element={
          <ProtectedRoute>
            <MachineDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/machines/:id/update-status"
        element={
          <ProtectedRoute allowedRoles={['engineer', 'admin']}>
            <UpdateStatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute allowedRoles={['engineer', 'admin']}>
            <RaiseTicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <TicketsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <DailyLogsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected — engineer + admin only */}
      <Route
        path="/visits/new"
        element={
          <ProtectedRoute allowedRoles={['engineer', 'admin']}>
            <LogVisitPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visits"
        element={
          <ProtectedRoute allowedRoles={['engineer', 'admin']}>
            <SiteVisitsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected — admin only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all: redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
