import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

interface PublicRouteProps {
  children: ReactNode
}

/**
 * Route guard for public pages like /login.
 * If the user is already authenticated, redirects to /dashboard
 * so they don't see the login form again.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
