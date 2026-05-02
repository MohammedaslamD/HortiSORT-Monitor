import { apiClient, setAccessToken, clearAccessToken, getAccessToken, setRefreshToken, clearRefreshToken, getRefreshToken } from './apiClient'
import { MOCK_USERS } from '../data/mockData'
import type { User } from '../types'

/** Stored user data (without sensitive fields). */
export type AuthUser = Omit<User, 'password_hash'>

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

/**
 * Authentication service — communicates with the real API.
 * Falls back to mock data when the backend is unavailable (demo mode).
 * Access token is held in memory (apiClient module scope).
 * Refresh token is stored in sessionStorage (per-tab) so that multiple
 * users can be simultaneously logged in across different browser tabs.
 */
export const authService = {
  /**
   * Authenticate a user by email and password.
   * Tries the real API first; falls back to mock data if the API is unreachable.
   * @throws Error if credentials are invalid.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password })
      setAccessToken(res.data.accessToken)
      setRefreshToken(res.data.refreshToken)
      return res.data.user
    } catch {
      // Backend unavailable — fall back to mock data for demo/development
      const found = MOCK_USERS.find((u) => u.email === email)
      if (!found || password !== 'password_123') {
        throw new Error('Invalid email or password')
      }
      const { password_hash: _, ...authUser } = found
      setAccessToken('mock-token-demo')
      setRefreshToken('mock-token-demo')
      // Also persist to localStorage so the session survives page reloads in demo mode
      localStorage.setItem('hortisort_demo_user', JSON.stringify(authUser))
      return authUser
    }
  },

  /**
   * Clear the in-memory access token and notify the server to clear the refresh cookie.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout')
    } catch {
      // Ignore server errors — always clear the local token
    } finally {
      clearAccessToken()
      clearRefreshToken()
      localStorage.removeItem('hortisort_demo_user')
    }
  },

  /**
   * Attempt to restore a session from the httpOnly refresh token cookie.
   * Falls back gracefully when backend is unavailable.
   */
  async restoreSession(): Promise<AuthUser | null> {
    try {
      // Demo mode: user stored in localStorage — restore instantly, no API call
      const demoUser = localStorage.getItem('hortisort_demo_user')
      if (demoUser) {
        const authUser = JSON.parse(demoUser) as AuthUser
        setAccessToken('mock-token-demo')
        return authUser
      }
      const storedRefreshToken = getRefreshToken()
      if (!storedRefreshToken) return null
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!refreshRes.ok) {
        clearRefreshToken()
        return null
      }
      const refreshBody = (await refreshRes.json()) as { data: { accessToken: string } }
      setAccessToken(refreshBody.data.accessToken)
      const meRes = await apiClient.get<AuthUser>('/api/v1/auth/me')
      return meRes.data
    } catch {
      clearAccessToken()
      clearRefreshToken()
      return null
    }
  },

  /**
   * Fetch the currently authenticated user from the server.
   * Returns null if not authenticated.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const res = await apiClient.get<AuthUser>('/api/v1/auth/me')
      return res.data
    } catch {
      return null
    }
  },

  /**
   * Sync check — returns true if an access token is currently held in memory.
   * Does not verify the token with the server.
   */
  isAuthenticated(): boolean {
    return getAccessToken() !== null
  },
}
