import { render, screen, waitFor } from '../../test/utils'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Aslam', role: 'admin', email: 'a@a', is_active: true } }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../../services/apiClient'
import { DashboardPage } from '../DashboardPage'

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const MACHINES = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  machine_code: `HS-2024-000${i + 1}`,
  machine_name: `M-${String(i + 1).padStart(3, '0')} Test Machine`,
  model: 'Pro 500',
  city: 'Pune',
  state: 'MH',
  status: i === 2 ? 'down' : 'running',
  software_version: 'v2.1',
  last_updated: new Date().toISOString(),
}))

const STATS = { total: 12, running: 6, idle: 2, down: 2, offline: 2 }

const TICKETS = [
  {
    id: 1, ticket_number: 'TK-0041', machine_id: 3,
    title: 'Motor overload - sorting halted',
    severity: 'P1_critical', status: 'open',
    raised_by: 1, assigned_to: 1, category: 'hardware',
    sla_hours: 4, created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null, resolution_time_mins: null,
    root_cause: null, solution: null, parts_used: null,
    customer_rating: null, customer_feedback: null,
    description: '',
  },
  ...Array.from({ length: 1 }, (_, i) => ({
    id: i + 2, ticket_number: `TK-004${i + 2}`, machine_id: 1,
    title: 'High vibration', severity: 'P2_high', status: 'open',
    raised_by: 1, assigned_to: 1, category: 'hardware',
    sla_hours: 8, created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolved_at: null, resolution_time_mins: null,
    root_cause: null, solution: null, parts_used: null,
    customer_rating: null, customer_feedback: null,
    description: '',
  })),
]

const ACTIVITY = [
  {
    id: 1, entity_type: 'ticket', entity_id: 41,
    details: 'M-003 went DOWN - motor overload',
    actor_id: 1, created_at: new Date().toISOString(),
  },
]

beforeEach(() => {
  mockGet.mockReset()
  // loadAll calls 4 endpoints in Promise.all, then activity separately
  mockGet
    .mockResolvedValueOnce({ data: STATS })        // /machines/stats
    .mockResolvedValueOnce({ data: MACHINES })     // /machines
    .mockResolvedValueOnce({ data: [] })           // /production-sessions
    .mockResolvedValueOnce({ data: TICKETS })      // /tickets?status=open
    .mockResolvedValueOnce({ data: ACTIVITY })     // /activity-log
})

describe('DashboardPage (Command Center)', () => {
  it('renders all stat-card labels', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText(/TOTAL MACHINES/i)).toBeInTheDocument()
    expect((await screen.findAllByText(/RUNNING/i)).length).toBeGreaterThan(0)
    expect(await screen.findByText(/IN PRODUCTION/i)).toBeInTheDocument()
    expect(await screen.findByText(/OPEN TICKETS/i)).toBeInTheDocument()
  })

  it('renders machine tiles', async () => {
    render(<DashboardPage />)
    // machine_name is 'M-001 Test Machine' etc — find by partial text
    expect(await screen.findByText(/M-001 Test Machine/i)).toBeInTheDocument()
  })

  it('renders P1/P2 severity counts', async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      const p1 = screen.getAllByText(/P1/i)
      expect(p1.length).toBeGreaterThan(0)
    })
    const p2 = screen.getAllByText(/P2/i)
    expect(p2.length).toBeGreaterThan(0)
  })

  it('renders the alert feed message', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('Motor overload - sorting halted')).toBeInTheDocument()
  })

  it('renders the activity title', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('M-003 went DOWN - motor overload')).toBeInTheDocument()
  })

})

