import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { ProductionPage } from '../ProductionPage'
import type { ProductionSession } from '../../types'

// ---------------------------------------------------------------------------
// Router + auth + service mocks
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

const mockGetAllTodaySessions = vi.fn<(date?: string) => Promise<ProductionSession[]>>()
vi.mock('../../services/productionSessionService', () => ({
  getAllTodaySessions: (...args: unknown[]) => mockGetAllTodaySessions(...args as [string?]),
}))

vi.mock('../../hooks/useProductionSocket', () => ({
  useProductionSocket: () => ({ lastSession: null }),
}))

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------
const baseSession = (overrides: Partial<ProductionSession>): ProductionSession => ({
  id: 1,
  machine_id: 1,
  lot_number: 1,
  session_date: '2026-05-01',
  start_time: '2026-05-01T06:00:00Z',
  stop_time: null,
  fruit_type: 'Banana',
  quantity_kg: null,
  status: 'running',
  raw_tdms_rows: null,
  created_at: '2026-05-01T06:00:00Z',
  updated_at: '2026-05-01T06:00:00Z',
  machine: { machine_code: 'HS-2024-0001', machine_name: 'Sorter 1' },
  ...overrides,
})

const threeSessions: ProductionSession[] = [
  baseSession({
    id: 41, lot_number: 41, status: 'completed',
    start_time: '2026-05-01T06:00:00Z', stop_time: '2026-05-01T09:30:00Z',
    fruit_type: 'Banana', quantity_kg: '850.0',
    machine: { machine_code: 'M-001', machine_name: 'Banana sorter' },
  }),
  baseSession({
    id: 42, lot_number: 42, status: 'running',
    start_time: '2026-05-01T10:00:00Z', stop_time: null,
    fruit_type: 'Banana', quantity_kg: '360.5',
    machine: { machine_code: 'M-001', machine_name: 'Banana sorter' },
  }),
  baseSession({
    id: 43, lot_number: 43, status: 'completed',
    start_time: '2026-05-01T07:30:00Z', stop_time: '2026-05-01T11:00:00Z',
    fruit_type: 'Mango', quantity_kg: '290.0',
    machine: { machine_code: 'M-002', machine_name: 'Mango sorter' },
  }),
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ProductionPage (Phase B)', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockGetAllTodaySessions.mockReset()
  })

  it('renders the page header and live subtitle', async () => {
    mockGetAllTodaySessions.mockResolvedValue([])
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /production/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Live — updates every 15 s/i)).toBeInTheDocument()
  })

  it('renders four stat cards with values derived from sessions', async () => {
    mockGetAllTodaySessions.mockResolvedValue(threeSessions)
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByText(/ACTIVE SESSIONS/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/LOTS TODAY/i)).toBeInTheDocument()
    expect(screen.getByText(/ITEMS PROCESSED/i)).toBeInTheDocument()
    expect(screen.getByText(/REJECTION RATE/i)).toBeInTheDocument()
    // active_sessions === 1, lots_today === 3, items_processed_kg === 1501 (rounded from 1500.5)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1,501')).toBeInTheDocument()
  })

  it('renders a row per session with a LIVE badge for running sessions', async () => {
    mockGetAllTodaySessions.mockResolvedValue(threeSessions)
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByText('LIVE')).toBeInTheDocument()
    })
    // All three lot numbers visible in the body
    expect(screen.getByText('LOT-2026-041')).toBeInTheDocument()
    expect(screen.getByText('LOT-2026-042')).toBeInTheDocument()
    expect(screen.getByText('LOT-2026-043')).toBeInTheDocument()
    // Two completed badges (sessions 41 + 43)
    expect(screen.getAllByText('Completed').length).toBe(2)
  })

  it('shows the empty state when there are no sessions', async () => {
    mockGetAllTodaySessions.mockResolvedValue([])
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByText(/No production data for today yet/i)).toBeInTheDocument()
    })
    // No table rendered
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
