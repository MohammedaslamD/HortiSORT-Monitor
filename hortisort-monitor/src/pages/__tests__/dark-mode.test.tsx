import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { LoginPage } from '../LoginPage'
import { DashboardPage } from '../DashboardPage'
import { MachinesPage } from '../MachinesPage'
import { TicketsPage } from '../TicketsPage'
import { ProductionPage } from '../ProductionPage'
import { DailyLogsPage } from '../DailyLogsPage'
import { SiteVisitsPage } from '../SiteVisitsPage'

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

vi.mock('../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn().mockResolvedValue({
      total_machines: 12, running: 6, idle: 2, down: 2, offline: 2,
      in_production: 3, today_throughput_tons: 18.4,
      trend_running_vs_yesterday: 1, trend_throughput_pct: 12,
      open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
    }),
    getMachineMetrics: vi.fn().mockResolvedValue([]),
    getThroughputSeries: vi.fn().mockResolvedValue([]),
    getMachineRows: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('../../services/alertService', () => ({
  alertService: { getAlerts: vi.fn().mockResolvedValue([]) },
}))
vi.mock('../../services/activityService', () => ({
  activityService: { getActivity: vi.fn().mockResolvedValue([]) },
}))
vi.mock('../../services/liveTicketsService', () => ({
  liveTicketsService: {
    getTicketStats: vi.fn().mockResolvedValue({ open: 0, in_progress: 0, resolved_today: 0, avg_resolution_hours: 0 }),
    getTicketRows: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../services/productionSessionService', () => ({
  getAllTodaySessions: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../hooks/useProductionSocket', () => ({
  useProductionSocket: () => ({ lastSession: null }),
}))

vi.mock('../../services/dailyLogService', () => ({
  getAllDailyLogs: vi.fn().mockResolvedValue([]),
  getDailyLogs: vi.fn().mockResolvedValue([]),
  getDailyLogsByMachineId: vi.fn().mockResolvedValue([]),
  getRecentDailyLogs: vi.fn().mockResolvedValue([]),
  addDailyLog: vi.fn(),
}))

vi.mock('../../services/machineService', () => ({
  getMachinesByRole: vi.fn().mockResolvedValue([]),
  getMachines: vi.fn().mockResolvedValue([]),
  getMachineById: vi.fn().mockResolvedValue(null),
  getMachineStats: vi.fn().mockResolvedValue({ total: 0, running: 0, idle: 0, down: 0, offline: 0 }),
  updateMachineStatus: vi.fn(),
}))

vi.mock('../../services/siteVisitService', () => ({
  getAllSiteVisits: vi.fn().mockResolvedValue([]),
  getSiteVisitsByMachineId: vi.fn().mockResolvedValue([]),
  logSiteVisit: vi.fn(),
}))

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
  { name: 'DashboardPage', Component: DashboardPage, probe: /TOTAL MACHINES/i },
  { name: 'MachinesPage', Component: MachinesPage, probe: /All 12 machines across 4 sites/i },
  { name: 'TicketsPage', Component: TicketsPage, probe: /Maintenance and fault tracking/i },
  { name: 'ProductionPage', Component: ProductionPage, probe: /Live — updates every 15 s/i },
  { name: 'DailyLogsPage', Component: DailyLogsPage, probe: /Auto-generated from machine status updates/i },
  { name: 'SiteVisitsPage', Component: SiteVisitsPage, probe: /Engineer on-site visit records/i },
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
