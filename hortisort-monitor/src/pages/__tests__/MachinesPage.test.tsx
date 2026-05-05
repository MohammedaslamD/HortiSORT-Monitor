import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { MachinesPage } from '../MachinesPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '../../services/apiClient'
const mockGet = apiClient.get as ReturnType<typeof vi.fn>

const STATS = { total: 12, running: 6, idle: 2, down: 2, offline: 2 }

const MACHINES = [
  { id: 1,  machine_code: 'HS-2024-0001', machine_name: 'M-001 Banana Sorter A',  model: 'Pro 500', city: 'Pune',      state: 'MH', status: 'running', software_version: 'v2.1', last_updated: new Date().toISOString() },
  { id: 3,  machine_code: 'HS-2024-0003', machine_name: 'M-003 Pomegranate A',    model: 'Pro 500', city: 'Mumbai',    state: 'MH', status: 'down',    software_version: 'v2.1', last_updated: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  { id: 4,  machine_code: 'HS-2024-0004', machine_name: 'M-004 Grapes Sorter A',  model: '300',     city: 'Kolhapur', state: 'MH', status: 'idle',    software_version: 'v2.0', last_updated: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 7,  machine_code: 'HS-2025-0007', machine_name: 'M-007 Mango Sorter B',   model: '300',     city: 'Chennai',  state: 'TN', status: 'offline', software_version: 'v1.9', last_updated: new Date(Date.now() - 3 * 86_400_000).toISOString() },
]

describe('MachinesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockGet.mockReset()
    // First call = stats, second call = machines list
    mockGet
      .mockResolvedValueOnce({ data: STATS })
      .mockResolvedValueOnce({ data: MACHINES })
  })

  it('renders title + subtitle', async () => {
    render(<MachinesPage />)
    expect(await screen.findByText('Machines')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText(/12 machines across all sites/i)).toBeInTheDocument()
    )
  })

  it('renders 4 stat cards reflecting stats (6/2/2/2)', async () => {
    render(<MachinesPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Running').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('Idle').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Down').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Offline').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(3)
  })

  it('renders one DataTable row per machine', async () => {
    render(<MachinesPage />)
    expect(await screen.findByText('M-001 Banana Sorter A')).toBeInTheDocument()
    expect(screen.getByText('M-003 Pomegranate A')).toBeInTheDocument()
    expect(screen.getByText('Pune')).toBeInTheDocument()
  })

  it('renders Update + Ticket buttons per row and navigates on click', async () => {
    const user = userEvent.setup()
    render(<MachinesPage />)
    const updateButtons = await screen.findAllByRole('button', { name: 'Update' })
    expect(updateButtons.length).toBe(4)
    await user.click(updateButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/machines/1/update-status')
    const ticketButtons = screen.getAllByRole('button', { name: 'Ticket' })
    await user.click(ticketButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/new?machine=1')
  })

  it('renders empty state when machines list is empty', async () => {
    mockGet.mockReset()
    mockGet
      .mockResolvedValueOnce({ data: STATS })
      .mockResolvedValueOnce({ data: [] })
    render(<MachinesPage />)
    expect(await screen.findByText(/no machines found/i)).toBeInTheDocument()
  })
})
