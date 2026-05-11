import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * Route guard for public pages like /login.
 * Renders a spinner while session is being restored.
 * Once loaded, redirects authenticated users to /dashboard.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  // Wait for session restore before making routing decisions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" aria-label="Loading" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
