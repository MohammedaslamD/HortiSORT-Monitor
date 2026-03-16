import { apiClient, setAccessToken, clearAccessToken, getAccessToken } from './apiClient'
import type { User } from '../types'

/** Stored user data (without sensitive fields). */
export type AuthUser = Omit<User, 'password_hash'>

interface LoginResponse {
  accessToken: string
  user: AuthUser
}

/**
 * Authentication service — communicates with the real API.
 * Access token is held in memory (apiClient module scope).
 * Refresh token is stored in an httpOnly cookie managed by the server.
 */
export const authService = {
  /**
   * Authenticate a user by email and password.
   * Stores the returned access token in memory.
   * @throws Error if credentials are invalid or network fails.
   */
  async login(email: string, password: string): Promise<AuthUser> {
    const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password })
    setAccessToken(res.data.accessToken)
    return res.data.user
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
    }
  },

  /**
   * Attempt to restore a session from the httpOnly refresh token cookie.
   * Calls /auth/refresh to get a new access token, then /auth/me to get the user.
   * Returns the user on success, null if no valid session exists.
   */
  async restoreSession(): Promise<AuthUser | null> {
    try {
      const refreshRes = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (!refreshRes.ok) return null
      const refreshBody = (await refreshRes.json()) as { data: { accessToken: string } }
      setAccessToken(refreshBody.data.accessToken)

      const meRes = await apiClient.get<AuthUser>('/api/v1/auth/me')
      return meRes.data
    } catch {
      clearAccessToken()
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
