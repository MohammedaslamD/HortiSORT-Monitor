import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { DailyLogsPage } from '../DailyLogsPage'
import type { DailyLog, Machine } from '../../types'

// ---------------------------------------------------------------------------
// Mocks
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

const mockGetAllDailyLogs = vi.fn<() => Promise<DailyLog[]>>()
vi.mock('../../services/dailyLogService', () => ({
  getAllDailyLogs: () => mockGetAllDailyLogs(),
}))

const mockGetMachinesByRole = vi.fn<() => Promise<Machine[]>>()
vi.mock('../../services/machineService', () => ({
  getMachinesByRole: () => mockGetMachinesByRole(),
}))

vi.mock('../../utils/userLookup', () => ({
  getUserName: (id: number) => `User #${id}`,
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

const baseLog = (overrides: Partial<DailyLog>): DailyLog => ({
  id: 1,
  machine_id: 1,
  date: '2026-05-07',
  status: 'running',
  fruit_type: 'Banana',
  tons_processed: 4.2,
  shift_start: '06:00',
  shift_end: '14:00',
  notes: 'Shift went well.',
  updated_by: 2,
  created_at: '2026-05-07T09:00:00Z',
  updated_at: '2026-05-07T09:00:00Z',
  ...overrides,
})

const machines: Machine[] = [
  baseMachine({ id: 1, machine_code: 'M-001', machine_name: 'Banana A' }),
  baseMachine({ id: 2, machine_code: 'M-002', machine_name: 'Mango A' }),
  baseMachine({ id: 3, machine_code: 'M-003', machine_name: 'Pomegr. A' }),
]

const logs: DailyLog[] = [
  baseLog({ id: 1, machine_id: 1, date: '2026-05-07', status: 'running', fruit_type: 'Banana', tons_processed: 4.2 }),
  baseLog({ id: 2, machine_id: 2, date: '2026-05-07', status: 'running', fruit_type: 'Mango', tons_processed: 3.1 }),
  baseLog({ id: 3, machine_id: 3, date: '2026-05-07', status: 'not_running', fruit_type: 'Pomegranate', tons_processed: 0 }),
  baseLog({ id: 4, machine_id: 1, date: '2026-05-06', status: 'maintenance', fruit_type: '', tons_processed: 0 }),
  baseLog({ id: 5, machine_id: 2, date: '2026-05-06', status: 'running', fruit_type: 'Mango', tons_processed: 2.8 }),
  baseLog({ id: 6, machine_id: 3, date: '2026-05-05', status: 'running', fruit_type: 'Pomegranate', tons_processed: 1.5 }),
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DailyLogsPage (Phase B)', () => {
  beforeEach(() => {
    mockGetAllDailyLogs.mockReset()
    mockGetMachinesByRole.mockReset()
    mockGetMachinesByRole.mockResolvedValue(machines)
  })

  it('renders header, subtitle, and the InfoBanner', async () => {
    mockGetAllDailyLogs.mockResolvedValue([])
    render(<DailyLogsPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /daily logs/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Auto-generated from machine status updates/i)).toBeInTheDocument()
    expect(screen.getByText(/How daily logs work/i)).toBeInTheDocument()
  })

  it('renders four stat cards with derived values', async () => {
    mockGetAllDailyLogs.mockResolvedValue(logs)
    render(<DailyLogsPage />)
    await waitFor(() => {
      expect(screen.getByText(/LOGS THIS WEEK/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/^RUNNING DAYS$/i)).toBeInTheDocument()
    expect(screen.getByText(/MAINTENANCE DAYS/i)).toBeInTheDocument()
    expect(screen.getByText(/NOT-RUNNING DAYS/i)).toBeInTheDocument()
  })

  it('renders one row per log with the correct status badge', async () => {
    mockGetAllDailyLogs.mockResolvedValue(logs)
    render(<DailyLogsPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Running').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
    expect(screen.getByText('Not Running')).toBeInTheDocument()
    // M-001 banana 4.2 t row
    expect(screen.getByText(/Banana — 4.2 t/)).toBeInTheDocument()
  })

  it('shows the empty state when no logs', async () => {
    mockGetAllDailyLogs.mockResolvedValue([])
    render(<DailyLogsPage />)
    await waitFor(() => {
      expect(screen.getByText(/No logs found/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
