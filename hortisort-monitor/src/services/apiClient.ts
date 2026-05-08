/**
 * API client with JWT token management and automatic refresh.
 *
 * - Stores the current access token in module scope (not localStorage)
 * - Stores the refresh token in sessionStorage (per-tab, so multiple users
 *   can be simultaneously logged in across different browser tabs)
 * - Attaches Bearer token to every request
 * - On 401 response: attempts to refresh the token once, then retries the original request
 * - If refresh also fails: clears the token and redirects to /login
 */

const REFRESH_TOKEN_KEY = 'hortisort_refresh_token'

// Base URL for all API calls — empty string in dev (Vite proxy handles it),
// set to http://192.168.1.117:4000 in production build via .env.production
export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

let accessToken: string | null = null

// Single in-flight refresh promise shared across all concurrent 401 retries
let refreshPromise: Promise<boolean> | null = null

export function setAccessToken(token: string): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken(): void {
  accessToken = null
}

export function setRefreshToken(token: string): void {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearRefreshToken(): void {
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

// -------------------------------------------------------------------------
// Base fetch wrapper
// -------------------------------------------------------------------------

interface ApiResponse<T = unknown> {
  data: T
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Required when backend is served via ngrok free tier — skips the browser warning page
    'ngrok-skip-browser-warning': '1',
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include', // send cookies (refresh token)
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // If unauthorized and this is the first attempt, try to refresh and retry
  if (res.status === 401 && retry) {
    // Deduplicate concurrent refresh attempts — all share the same promise
    if (!refreshPromise) {
      refreshPromise = tryRefresh().finally(() => { refreshPromise = null })
    }
    const refreshed = await refreshPromise
    if (refreshed) {
      return request<T>(method, path, body, false)
    }
    // Refresh failed — redirect to login
    clearAccessToken()
    clearRefreshToken()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((errorBody as { error?: string }).error ?? res.statusText)
  }

  return res.json() as Promise<ApiResponse<T>>
}

async function tryRefresh(): Promise<boolean> {
  try {
    const storedRefreshToken = getRefreshToken()
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: storedRefreshToken
        ? { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' }
        : { 'ngrok-skip-browser-warning': '1' },
      body: storedRefreshToken ? JSON.stringify({ refreshToken: storedRefreshToken }) : undefined,
    })
    if (!res.ok) return false
    const body = (await res.json()) as ApiResponse<{ accessToken: string }>
    setAccessToken(body.data.accessToken)
    return true
  } catch {
    return false
  }
}

// -------------------------------------------------------------------------
// Public API methods
// -------------------------------------------------------------------------

export const apiClient = {
  get<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>('GET', path)
  },

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('POST', path, body)
  },

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>('PATCH', path, body)
  },

  delete<T>(path: string): Promise<ApiResponse<T>> {
    return request<T>('DELETE', path)
  },
}
