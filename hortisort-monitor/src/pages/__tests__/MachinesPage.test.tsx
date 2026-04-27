import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { MachinesPage } from '../MachinesPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const fleetSummary = {
  total_machines: 12, running: 6, idle: 2, down: 2, offline: 2,
  in_production: 3, today_throughput_tons: 18.4,
  trend_running_vs_yesterday: 1, trend_throughput_pct: 12,
  open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
}

const baseRows = [
  { machine_id: 1, machine_label: 'M-001 Banana Sorter A', site: 'Site 1', fruit: 'Banana',      status: 'running' as const, tons_per_hour: 2.4,  uptime_percent: 90,   last_active: new Date().toISOString(),                              open_tickets_count: 0 },
  { machine_id: 3, machine_label: 'M-003 Pomegranate A',   site: 'Site 1', fruit: 'Pomegranate', status: 'down'    as const, tons_per_hour: 0,    uptime_percent: 30,   last_active: new Date(Date.now() - 2 * 3_600_000).toISOString(),     open_tickets_count: 2 },
  { machine_id: 4, machine_label: 'M-004 Grapes Sorter A', site: 'Site 2', fruit: 'Grapes',      status: 'idle'    as const, tons_per_hour: null, uptime_percent: null, last_active: new Date(Date.now() - 86_400_000).toISOString(),         open_tickets_count: 0 },
  { machine_id: 7, machine_label: 'M-007 Mango Sorter B',  site: 'Site 3', fruit: 'Mango',       status: 'offline' as const, tons_per_hour: null, uptime_percent: null, last_active: new Date(Date.now() - 3 * 86_400_000).toISOString(),     open_tickets_count: 1 },
]

vi.mock('../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn(),
    getMachineRows: vi.fn(),
  },
}))

import { liveMetricsService } from '../../services/liveMetricsService'

describe('MachinesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(liveMetricsService.getFleetSummary).mockResolvedValue(fleetSummary)
    vi.mocked(liveMetricsService.getMachineRows).mockResolvedValue(baseRows)
  })

  it('renders title + subtitle', async () => {
    render(<MachinesPage />)
    expect(await screen.findByText('Machines')).toBeInTheDocument()
    expect(screen.getByText(/All 12 machines across 4 sites/i)).toBeInTheDocument()
  })

  it('renders 4 stat cards reflecting FleetSummary (6/2/2/2)', async () => {
    render(<MachinesPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Running').length).toBeGreaterThanOrEqual(2)
    })
    expect(screen.getAllByText('Idle').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Down').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Offline').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(3)
  })

  it('renders one DataTable row per machine with throughput and "--" for null', async () => {
    render(<MachinesPage />)
    expect(await screen.findByText('M-001 Banana Sorter A')).toBeInTheDocument()
    expect(screen.getByText('M-003 Pomegranate A')).toBeInTheDocument()
    expect(screen.getByText('2.4 t/hr')).toBeInTheDocument()
    expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(2)
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

  it('renders empty state when service resolves to []', async () => {
    vi.mocked(liveMetricsService.getMachineRows).mockResolvedValueOnce([])
    render(<MachinesPage />)
    expect(await screen.findByText(/no machines/i)).toBeInTheDocument()
  })
})
