import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MachinesPage } from '../pages/MachinesPage';
import { MachineDetailPage } from '../pages/MachineDetailPage';
import { TicketsPage } from '../pages/TicketsPage';
import { DailyLogsPage } from '../pages/DailyLogsPage';
import { SiteVisitsPage } from '../pages/SiteVisitsPage';
import { AdminPage } from '../pages/AdminPage';

/**
 * All application routes.
 * Public routes: /login
 * Protected routes: everything else (wrapped in ProtectedRoute).
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

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
