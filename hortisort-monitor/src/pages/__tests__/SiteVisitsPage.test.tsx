import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { SiteVisitsPage } from '../SiteVisitsPage'
import type { SiteVisit, Machine } from '../../types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockEngineer = {
  id: 2,
  name: 'Amit Sharma',
  email: 'amit.sharma@hortisort.com',
  role: 'engineer' as const,
  is_active: true,
}
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockEngineer }),
}))

const mockGetAllSiteVisits = vi.fn<() => Promise<SiteVisit[]>>()
vi.mock('../../services/siteVisitService', () => ({
  getAllSiteVisits: () => mockGetAllSiteVisits(),
}))

const mockGetMachinesByRole = vi.fn<() => Promise<Machine[]>>()
vi.mock('../../services/machineService', () => ({
  getMachinesByRole: () => mockGetMachinesByRole(),
}))

vi.mock('../../utils/userLookup', () => ({
  getUserName: (id: number) => (id === 2 ? 'Amit Sharma' : `User #${id}`),
  getUserById: (id: number) => ({ id, name: `User #${id}` }),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const baseMachine = (overrides: Partial<Machine>): Machine => ({
  id: 1,
  machine_code: 'M-001',
  machine_name: 'Sorter',
  model: 'HS-2024',
  serial_number: 'SN1',
  installation_date: '2024-01-01',
  customer_id: 1,
  assigned_engineer_id: 2,
  status: 'running',
  city: 'Pune',
  state: 'MH',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const baseVisit = (overrides: Partial<SiteVisit>): SiteVisit => ({
  id: 1,
  machine_id: 1,
  engineer_id: 2,
  visit_date: '2026-04-20',
  visit_purpose: 'routine',
  findings: 'All systems nominal.',
  actions_taken: 'Cleaned optical sensors.',
  parts_replaced: 'None',
  next_visit_due: '2026-07-20',
  created_at: '2026-04-20T10:00:00Z',
  ...overrides,
})

const machines: Machine[] = [
  baseMachine({ id: 1, machine_code: 'M-001', machine_name: 'Banana A' }),
  baseMachine({ id: 3, machine_code: 'M-003', machine_name: 'Pomegranate A' }),
  baseMachine({ id: 5, machine_code: 'M-005', machine_name: 'Grapes B' }),
]

const visits: SiteVisit[] = [
  baseVisit({
    id: 101,
    machine_id: 3,
    visit_date: '2026-04-25',
    visit_purpose: 'ticket',
    findings: 'Motor bearing worn out.',
    actions_taken: 'Replaced motor bearing (MB-4412).',
    parts_replaced: 'Motor bearing MB-4412 ×1',
    next_visit_due: '2026-05-23',
  }),
  baseVisit({
    id: 102,
    machine_id: 5,
    visit_date: '2026-04-22',
    visit_purpose: 'routine',
    findings: 'Weight sensor reading 3% high.',
    actions_taken: 'Cleaned load cell.',
    parts_replaced: 'None',
    next_visit_due: '2026-10-22',
  }),
  baseVisit({
    id: 103,
    machine_id: 1,
    visit_date: '2026-04-20',
    visit_purpose: 'installation',
    findings: 'New unit delivered.',
    actions_taken: 'Commissioned and installed.',
    parts_replaced: 'Full install (new unit)',
    next_visit_due: '2026-05-15',
  }),
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SiteVisitsPage (Phase B)', () => {
  beforeEach(() => {
    mockGetAllSiteVisits.mockReset()
    mockGetMachinesByRole.mockReset()
    mockNavigate.mockReset()
    mockGetMachinesByRole.mockResolvedValue(machines)
  })

  it('renders title "Site Visits" and subtitle', async () => {
    mockGetAllSiteVisits.mockResolvedValue([])
    render(<SiteVisitsPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /site visits/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Engineer on-site visit records/i)).toBeInTheDocument()
  })

  it('renders 4 stat cards with derived values', async () => {
    mockGetAllSiteVisits.mockResolvedValue(visits)
    render(<SiteVisitsPage />)
    await waitFor(() => {
      expect(screen.getByText('Visits This Month')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Emergency').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Routine').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Due This Week')).toBeInTheDocument()
  })

  it('renders one VisitCard per visit with the correct purpose badge', async () => {
    mockGetAllSiteVisits.mockResolvedValue(visits)
    render(<SiteVisitsPage />)
    // Wait until the table data has loaded
    await waitFor(() => {
      expect(screen.getByText(/Motor bearing MB-4412/)).toBeInTheDocument()
    })
    // Emergency: label + visit-card title + badge → at least 2
    expect(screen.getAllByText('Emergency').length).toBeGreaterThanOrEqual(2)
    // Routine: stat-card label + badge → at least 2
    expect(screen.getAllByText('Routine').length).toBeGreaterThanOrEqual(2)
    // Installation: visit-card badge (no stat-card with same name)
    expect(screen.getByText('Installation')).toBeInTheDocument()
    expect(screen.getByText(/Full install \(new unit\)/)).toBeInTheDocument()
  })

  it('"+ Log Visit" button navigates to /visits/new for engineer', async () => {
    mockGetAllSiteVisits.mockResolvedValue([])
    render(<SiteVisitsPage />)
    const btn = await screen.findByRole('button', { name: /log visit/i })
    btn.click()
    expect(mockNavigate).toHaveBeenCalledWith('/visits/new')
  })
})
