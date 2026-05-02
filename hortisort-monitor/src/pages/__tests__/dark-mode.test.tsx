import { render as rtlRender, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '../../context/ThemeContext'
import { render } from '../../test/utils'
import { LoginPage } from '../LoginPage'
import { DashboardPage } from '../DashboardPage'
import { MachinesPage } from '../MachinesPage'
import { TicketsPage } from '../TicketsPage'
import { ProductionPage } from '../ProductionPage'
import { DailyLogsPage } from '../DailyLogsPage'
import { SiteVisitsPage } from '../SiteVisitsPage'
import { RaiseTicketPage } from '../RaiseTicketPage'
import { LogVisitPage } from '../LogVisitPage'
import { MachineDetailPage } from '../MachineDetailPage'
import { TicketDetailPage } from '../TicketDetailPage'

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
  getMachineById: vi.fn().mockResolvedValue({
    id: 1,
    machine_code: 'HS-001',
    machine_name: 'Smoke Machine',
    model: 'HS-Pro',
    serial_number: 'SN-001',
    status: 'running',
    customer_id: 1,
    engineer_id: 2,
    location: 'Smoke Site',
    city: 'Test City',
    state: 'Test State',
    installation_date: '2025-01-01',
    last_updated: '2026-04-01T00:00:00Z',
    last_updated_by: 1,
  }),
  getMachineStats: vi.fn().mockResolvedValue({ total: 0, running: 0, idle: 0, down: 0, offline: 0 }),
  updateMachineStatus: vi.fn(),
}))

vi.mock('../../services/siteVisitService', () => ({
  getAllSiteVisits: vi.fn().mockResolvedValue([]),
  getSiteVisitsByMachineId: vi.fn().mockResolvedValue([]),
  logSiteVisit: vi.fn(),
}))

vi.mock('../../services/ticketService', () => ({
  getTicketsByMachineId: vi.fn().mockResolvedValue([]),
  createTicket: vi.fn(),
  getTicketById: vi.fn().mockResolvedValue({
    id: 1,
    ticket_number: 'T-2026-0001',
    machine_id: 1,
    raised_by: 5,
    assigned_to: 5,
    title: 'Smoke ticket',
    description: 'Smoke description',
    severity: 'P3_medium',
    status: 'open',
    category: 'hardware',
    sla_hours: 24,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
    resolved_at: null,
    resolution_time_mins: null,
    root_cause: null,
    solution: null,
    parts_used: null,
    customer_rating: null,
    customer_feedback: null,
  }),
  getTicketComments: vi.fn().mockResolvedValue([]),
  addTicketComment: vi.fn(),
  updateTicketStatus: vi.fn(),
}))

vi.mock('../../services/machineHistoryService', () => ({
  getHistoryByMachineId: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../services/productionSessionService', () => ({
  getAllTodaySessions: vi.fn().mockResolvedValue([]),
  getTodaySessions: vi.fn().mockResolvedValue([]),
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
  { name: 'RaiseTicketPage', Component: RaiseTicketPage, probe: /Raise Ticket/i },
  { name: 'LogVisitPage', Component: LogVisitPage, probe: /Log Site Visit/i },
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

// ---------------------------------------------------------------------------
// Detail-page smoke tests (need :id route param + MemoryRouter)
// ---------------------------------------------------------------------------
const routedPages = [
  {
    name: 'MachineDetailPage',
    path: '/machines/:id',
    entry: '/machines/1',
    Component: MachineDetailPage,
    probe: /Smoke Machine/i,
  },
  {
    name: 'TicketDetailPage',
    path: '/tickets/:id',
    entry: '/tickets/1',
    Component: TicketDetailPage,
    probe: /Smoke ticket/i,
  },
]

function renderRouted(Component: () => JSX.Element, path: string, entry: string) {
  return rtlRender(
    <ThemeProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={path} element={<Component />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe.each(routedPages)('$name renders in both themes', ({ Component, path, entry, probe }) => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    setupLocalStorage()
  })

  it('renders in light theme without the dark class', async () => {
    renderRouted(Component, path, entry)
    await waitFor(() => {
      expect(screen.getAllByText(probe)[0]).toBeInTheDocument()
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('renders in dark theme and applies the dark class', async () => {
    setupLocalStorage({ [STORAGE_KEY]: 'dark' })
    renderRouted(Component, path, entry)
    await waitFor(() => {
      expect(screen.getAllByText(probe)[0]).toBeInTheDocument()
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
