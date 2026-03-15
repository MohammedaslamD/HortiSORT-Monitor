import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/authService'
import type { AuthUser } from '../services/authService'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Provides authentication state to the component tree.
 * Restores session from localStorage synchronously on first render
 * so protected routes never see a stale null.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore user synchronously from localStorage so protected routes
  // never see a flash of null on page refresh
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const authUser = await authService.login(email, password)
      setUser(authUser)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    setError(null)
  }, [])

  // Memoize so consumers only re-render when auth state actually changes
  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
  }), [user, isLoading, error, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
