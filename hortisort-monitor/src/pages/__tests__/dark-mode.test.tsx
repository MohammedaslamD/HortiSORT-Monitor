import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { LoginPage } from '../LoginPage'
import { DashboardPage } from '../DashboardPage'

// ---------------------------------------------------------------------------
// Router + auth + service mocks (mirrors DashboardPage.test.tsx setup)
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockAdmin = { id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', role: 'admin' as const, is_active: true }
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockAdmin }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn().mockResolvedValue(null),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}))

vi.mock('../../services/machineService', () => ({
  getMachinesByRole: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../services/ticketService', () => ({
  getTickets: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../services/dailyLogService', () => ({
  getDailyLogs: vi.fn().mockResolvedValue([]),
}))

// Minimal Recharts stubs to avoid ResizeObserver in happy-dom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  }
})

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'hortisort.theme'

function setupLocalStorage(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial }
  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length },
    },
  })
}

// ---------------------------------------------------------------------------
// Smoke tests: every page renders in both themes
// ---------------------------------------------------------------------------
const pages = [
  { name: 'LoginPage', Component: LoginPage, probe: /sign in/i },
  { name: 'DashboardPage', Component: DashboardPage, probe: /dashboard/i },
]

describe.each(pages)('$name renders in both themes', ({ Component, probe }) => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    setupLocalStorage()
  })

  it('renders in light theme without the dark class', async () => {
    render(<Component />)
    await waitFor(() => {
      expect(screen.getAllByText(probe)[0]).toBeInTheDocument()
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('renders in dark theme and applies the dark class', async () => {
    setupLocalStorage({ [STORAGE_KEY]: 'dark' })
    render(<Component />)
    await waitFor(() => {
      expect(screen.getAllByText(probe)[0]).toBeInTheDocument()
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
