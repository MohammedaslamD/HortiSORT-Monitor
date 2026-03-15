import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock the entire authService module
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}))

import { authService } from '../../services/authService'

const mockLogin = authService.login as ReturnType<typeof vi.fn>
const mockLogout = authService.logout as ReturnType<typeof vi.fn>
const mockRestoreSession = authService.restoreSession as ReturnType<typeof vi.fn>

const MOCK_USER = {
  id: 1,
  name: 'Rajesh Patel',
  email: 'rajesh.patel@agrifresh.com',
  phone: '+91 98765 43210',
  whatsapp_number: null,
  role: 'customer' as const,
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
}

const ADMIN_USER = {
  id: 5,
  name: 'Aslam Sheikh',
  email: 'aslam@hortisort.com',
  phone: '+91 54321 09876',
  whatsapp_number: '+91 54321 09876',
  role: 'admin' as const,
  is_active: true,
  created_at: '2023-01-01T10:00:00Z',
  updated_at: '2023-01-01T10:00:00Z',
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}

describe('AuthContext + useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: restoreSession resolves to null (no active session)
    mockRestoreSession.mockResolvedValue(null)
    mockLogout.mockResolvedValue(undefined)
  })

  it('starts with isLoading true, then false after restore resolves to null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Initially loading
    expect(result.current.isLoading).toBe(true)

    // Wait for restore to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('restores user from session on mount', async () => {
    mockRestoreSession.mockResolvedValue(ADMIN_USER)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(ADMIN_USER)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('sets user after successful login', async () => {
    mockRestoreSession.mockResolvedValue(null)
    mockLogin.mockResolvedValue(MOCK_USER)

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for initial restore to finish
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('rajesh.patel@agrifresh.com', 'password_123')
    })

    expect(mockLogin).toHaveBeenCalledWith('rajesh.patel@agrifresh.com', 'password_123')
    expect(result.current.user).toEqual(MOCK_USER)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('clears user after logout', async () => {
    mockRestoreSession.mockResolvedValue(MOCK_USER)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toEqual(MOCK_USER)

    await act(async () => {
      await result.current.logout()
    })

    expect(mockLogout).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('sets error on failed login', async () => {
    mockRestoreSession.mockResolvedValue(null)
    mockLogin.mockRejectedValue(new Error('Invalid email or password'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      try {
        await result.current.login('nobody@nowhere.com', 'wrong')
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.error).toBe('Invalid email or password')
    expect(result.current.user).toBeNull()
  })

  it('exposes isLoading true during login, false after', async () => {
    mockRestoreSession.mockResolvedValue(null)

    let resolveLogin!: (user: typeof MOCK_USER) => void
    mockLogin.mockReturnValue(
      new Promise<typeof MOCK_USER>((resolve) => { resolveLogin = resolve })
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for initial restore to settle
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Start login without awaiting
    act(() => {
      void result.current.login('rajesh.patel@agrifresh.com', 'password_123')
    })

    // isLoading should be true while in-flight
    expect(result.current.isLoading).toBe(true)

    // Resolve the login
    await act(async () => {
      resolveLogin(MOCK_USER)
    })

    expect(result.current.isLoading).toBe(false)
  })
})
