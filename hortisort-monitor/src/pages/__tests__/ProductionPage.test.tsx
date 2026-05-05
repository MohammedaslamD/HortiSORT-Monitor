import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { ProductionPage } from '../ProductionPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', role: 'admin' as const, is_active: true },
  }),
}))
vi.mock('../../hooks/useProductionSocket', () => ({
  useProductionSocket: () => ({ lastSession: null, lastStatusUpdate: null }),
}))
vi.mock('../../services/apiClient', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../services/apiClient'
const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const TODAY = new Date().toISOString().slice(0, 10)

const MACHINES = [
  { id: 1, machine_code: 'HS-2024-0001', machine_name: 'HortiSort Pro 500', city: 'Pune', state: 'MH', status: 'running', last_updated: new Date().toISOString() },
]
const SESSIONS = [
  {
    id: 1, machine_id: 1, lot_number: 'L260505001', session_date: TODAY,
    status: 'running', quantity_kg: 21802, weighed_count: 22299,
    lot_start_time: `${TODAY}T08:00:00.000Z`, lot_stop_time: null,
    raw_tdms_rows: null, created_at: new Date().toISOString(),
  },
]

beforeEach(() => {
  mockNavigate.mockReset()
  mockGet.mockReset()
  // ProductionPage calls: sessions, machines (parallel), then machine-errors per machine
  mockGet
    .mockResolvedValueOnce({ data: SESSIONS })   // /production-sessions?date=...
    .mockResolvedValueOnce({ data: MACHINES })   // /machines
    .mockResolvedValue({ data: [] })             // /machine-errors (any subsequent)
})

describe('ProductionPage', () => {
  it('renders the Live Production heading', async () => {
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/live production/i)
  })

  it('renders four stat cards', async () => {
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/machines running/i)).toBeInTheDocument())
    expect(screen.getByText(/total lots today/i)).toBeInTheDocument()
    expect(screen.getByText(/total qty today/i)).toBeInTheDocument()
    expect(screen.getByText(/errors today/i)).toBeInTheDocument()
  })

  it('renders filter pills', async () => {
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('All Machines')).toBeInTheDocument())
    const buttons = screen.getAllByRole('button')
    const labels = buttons.map((b) => b.textContent)
    expect(labels).toContain('Running')
    expect(labels).toContain('Completed')
    expect(labels).toContain('Errors')
  })

  it('renders machine row with machine name from API', async () => {
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getAllByText(/HortiSort Pro 500/i).length).toBeGreaterThan(0)
    )
  })

  it('renders machine code from API', async () => {
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getAllByText(/HS-2024-0001/i).length).toBeGreaterThan(0)
    )
  })

  it('shows empty state when no sessions found', async () => {
    mockGet.mockReset()
    mockGet
      .mockResolvedValueOnce({ data: [] })       // /production-sessions (empty)
      .mockResolvedValueOnce({ data: MACHINES }) // /machines
      .mockResolvedValue({ data: [] })
    render(<ProductionPage />)
    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes('No production sessions found for today'))
      ).toBeInTheDocument()
    )
  })

  it('renders machine code from API', async () => {
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getAllByText(/HS-2024-0001/).length).toBeGreaterThan(0)
    )
  })

  it('renders a date picker', async () => {
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getByDisplayValue(TODAY)).toBeInTheDocument()
    )
  })

  it('shows empty state when no sessions found', async () => {
    mockGet.mockReset()
    mockGet
      .mockResolvedValueOnce({ data: [] })       // /production-sessions (empty)
      .mockResolvedValueOnce({ data: MACHINES }) // /machines
      .mockResolvedValue({ data: [] })
    render(<ProductionPage />)
    await waitFor(() =>
      expect(
        screen.getByText((content) => content.includes('No production sessions found for today'))
      ).toBeInTheDocument()
    )
  })
})
