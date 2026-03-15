import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authService } from '../services/authService'
import type { AuthUser } from '../services/authService'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  /** True while the initial session restore is in flight. */
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Provides authentication state to the component tree.
 * On mount, attempts to restore a session via the refresh token cookie.
 * isLoading is true until the restore attempt completes.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  // Start as true — we don't know yet whether there is a session
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // On mount: attempt to restore session from httpOnly refresh token cookie
  useEffect(() => {
    let cancelled = false
    authService.restoreSession().then((restored) => {
      if (!cancelled) {
        setUser(restored)
        setIsLoading(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const authUser = await authService.login(email, password)
      setUser(authUser)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      // Re-throw so callers (e.g. LoginPage) can distinguish success from failure
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout()
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
