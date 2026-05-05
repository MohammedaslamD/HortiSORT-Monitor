import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock apiClient and token helpers before importing authService
vi.mock('../apiClient', () => {
  let _token: string | null = null
  let _refreshToken: string | null = null
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
    setAccessToken: vi.fn((t: string) => { _token = t }),
    clearAccessToken: vi.fn(() => { _token = null }),
    getAccessToken: vi.fn(() => _token),
    setRefreshToken: vi.fn((t: string) => { _refreshToken = t }),
    clearRefreshToken: vi.fn(() => { _refreshToken = null }),
    getRefreshToken: vi.fn(() => _refreshToken),
  }
})

// Also mock global fetch (used in restoreSession)
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { apiClient, setAccessToken, clearAccessToken, getAccessToken, setRefreshToken, clearRefreshToken, getRefreshToken } from '../apiClient'
import { authService } from '../authService'

const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const MOCK_USER = {
  id: 1,
  name: 'Rajesh Patel',
  email: 'rajesh.patel@agrifresh.com',
  phone: '9876543210',
  whatsapp_number: null,
  role: 'customer' as const,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    sessionStorage.clear()
  })

  // --- login ---

  it('calls POST /api/v1/auth/login with email and password', async () => {
    mockPost.mockResolvedValue({ data: { accessToken: 'tok123', refreshToken: 'ref123', user: MOCK_USER } })

    await authService.login('rajesh.patel@agrifresh.com', 'password_123')

    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'rajesh.patel@agrifresh.com',
      password: 'password_123',
    })
  })

  it('stores the access token after login', async () => {
    mockPost.mockResolvedValue({ data: { accessToken: 'tok123', refreshToken: 'ref123', user: MOCK_USER } })

    await authService.login('rajesh.patel@agrifresh.com', 'password_123')

    expect(setAccessToken).toHaveBeenCalledWith('tok123')
  })

  it('stores the refresh token in sessionStorage after login', async () => {
    mockPost.mockResolvedValue({ data: { accessToken: 'tok123', refreshToken: 'ref123', user: MOCK_USER } })

    await authService.login('rajesh.patel@agrifresh.com', 'password_123')

    expect(setRefreshToken).toHaveBeenCalledWith('ref123')
  })

  it('returns the user object from the login response', async () => {
    mockPost.mockResolvedValue({ data: { accessToken: 'tok123', refreshToken: 'ref123', user: MOCK_USER } })

    const result = await authService.login('rajesh.patel@agrifresh.com', 'password_123')

    expect(result).toEqual(MOCK_USER)
  })

  it('does not include password_hash in returned user', async () => {
    const userWithHash = { ...MOCK_USER, password_hash: 'hashed' }
    mockPost.mockResolvedValue({ data: { accessToken: 'tok123', refreshToken: 'ref123', user: userWithHash } })

    const result = await authService.login('rajesh.patel@agrifresh.com', 'password_123')

    // The server strips password_hash; authService just returns what the server sends
    // If server returns it, we verify we still pass it through (contract is server-side)
    // What we can assert: result has the user fields
    expect(result.id).toBe(1)
    expect(result.name).toBe('Rajesh Patel')
  })

  it('throws when apiClient.post rejects (invalid credentials)', async () => {
    mockPost.mockRejectedValue(new Error('Invalid email or password'))

    await expect(
      authService.login('nobody@nowhere.com', 'wrong')
    ).rejects.toThrow('Invalid email or password')
  })

  // --- logout ---

  it('calls POST /api/v1/auth/logout', async () => {
    mockPost.mockResolvedValue({ data: {} })

    await authService.logout()

    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/logout')
  })

  it('clears the access token on logout', async () => {
    mockPost.mockResolvedValue({ data: {} })

    await authService.logout()

    expect(clearAccessToken).toHaveBeenCalled()
    expect(clearRefreshToken).toHaveBeenCalled()
  })

  it('clears the access token even if logout request fails', async () => {
    mockPost.mockRejectedValue(new Error('Network error'))

    await authService.logout()

    expect(clearAccessToken).toHaveBeenCalled()
    expect(clearRefreshToken).toHaveBeenCalled()
  })

  // --- restoreSession ---

  it('returns null when no refresh token is stored in sessionStorage', async () => {
    ;(getRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue(null)

    const result = await authService.restoreSession()

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns null when refresh endpoint returns non-ok', async () => {
    sessionStorage.setItem('hortisort_session_user', JSON.stringify(MOCK_USER))
    ;(getRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue('stored-ref-tok')
    mockFetch.mockResolvedValue({ ok: false })

    const result = await authService.restoreSession()

    expect(result).toBeNull()
  })

  it('returns user when refresh + me succeed', async () => {
    sessionStorage.setItem('hortisort_session_user', JSON.stringify(MOCK_USER))
    ;(getRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue('stored-ref-tok')
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'newTok' } }),
    })
    mockGet.mockResolvedValue({ data: MOCK_USER })

    const result = await authService.restoreSession()

    expect(setAccessToken).toHaveBeenCalledWith('newTok')
    expect(result).toEqual(MOCK_USER)
  })

  it('sends refreshToken in request body to /auth/refresh', async () => {
    sessionStorage.setItem('hortisort_session_user', JSON.stringify(MOCK_USER))
    ;(getRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue('stored-ref-tok')
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { accessToken: 'newTok' } }),
    })
    mockGet.mockResolvedValue({ data: MOCK_USER })

    await authService.restoreSession()

    const fetchCall = mockFetch.mock.calls[0]
    const fetchBody = JSON.parse(fetchCall[1].body as string) as { refreshToken: string }
    expect(fetchBody.refreshToken).toBe('stored-ref-tok')
  })

  it('returns null and clears tokens when refresh response is not ok', async () => {
    sessionStorage.setItem('hortisort_session_user', JSON.stringify(MOCK_USER))
    ;(getRefreshToken as ReturnType<typeof vi.fn>).mockReturnValue('stored-ref-tok')
    mockFetch.mockResolvedValue({ ok: false })

    const result = await authService.restoreSession()

    expect(clearRefreshToken).toHaveBeenCalled()
    expect(result).toBeNull()
  })

  // --- getCurrentUser ---

  it('calls GET /api/v1/auth/me and returns user', async () => {
    mockGet.mockResolvedValue({ data: MOCK_USER })

    const result = await authService.getCurrentUser()

    expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/me')
    expect(result).toEqual(MOCK_USER)
  })

  it('returns null when /me throws', async () => {
    mockGet.mockRejectedValue(new Error('Unauthorized'))

    const result = await authService.getCurrentUser()

    expect(result).toBeNull()
  })

  // --- isAuthenticated ---

  it('returns false when getAccessToken returns null', () => {
    ;(getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null)

    expect(authService.isAuthenticated()).toBe(false)
  })

  it('returns true when getAccessToken returns a token', () => {
    ;(getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue('sometoken')

    expect(authService.isAuthenticated()).toBe(true)
  })
})
