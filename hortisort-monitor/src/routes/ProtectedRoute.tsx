import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  children: ReactNode
  /** If specified, only users with one of these roles can access. */
  allowedRoles?: UserRole[]
}

/**
 * Route guard that renders a spinner while session is being restored,
 * redirects unauthenticated users to /login, and unauthorized users
 * to /dashboard.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Wait for session restore before making routing decisions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" aria-label="Loading" />
      </div>
    )
  }

  // Not logged in → redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but wrong role → redirect to dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
