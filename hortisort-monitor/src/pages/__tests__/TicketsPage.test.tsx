import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '../../test/utils'
import { TicketsPage } from '../TicketsPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  }
})

// AuthUser shape mirrors the real `User` interface in src/types/index.ts:129
// (key fields: id, name, email, role, is_active).
const mockEngineer = { id: 5, name: 'Amit Sharma', email: 'amit@hortisort.com', role: 'engineer' as const, is_active: true }
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockEngineer }),
}))

const ticketStats = {
  open: 4, in_progress: 2, resolved_today: 3, avg_resolution_hours: 4.2,
}

const ticketRows = [
  { id: 1, ticket_number: 'TKT-00001', machine_code: 'HS-2024-0003', title: 'Motor overload', severity: 'P1_critical' as const, status: 'open' as const,        assigned_to_name: 'Amit Sharma', created_at: new Date().toISOString() },
  { id: 2, ticket_number: 'TKT-00002', machine_code: 'HS-2025-0007', title: 'Sensor down',    severity: 'P2_high'     as const, status: 'in_progress' as const, assigned_to_name: 'Priya Nair',  created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 3, ticket_number: 'TKT-00003', machine_code: 'HS-2024-0002', title: 'High rejection', severity: 'P2_high'     as const, status: 'open' as const,        assigned_to_name: 'Unassigned',  created_at: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  { id: 4, ticket_number: 'TKT-00004', machine_code: 'HS-2024-0005', title: 'Calibration',    severity: 'P3_medium'   as const, status: 'resolved' as const,    assigned_to_name: 'Amit Sharma', created_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
]

vi.mock('../../services/liveTicketsService', () => ({
  liveTicketsService: {
    getTicketStats: vi.fn(),
    getTicketRows: vi.fn(),
  },
}))

import { liveTicketsService } from '../../services/liveTicketsService'

describe('TicketsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(liveTicketsService.getTicketStats).mockResolvedValue(ticketStats)
    vi.mocked(liveTicketsService.getTicketRows).mockResolvedValue(ticketRows)
  })

  it('renders title + subtitle', async () => {
    render(<TicketsPage />)
    expect(await screen.findByText('Tickets')).toBeInTheDocument()
    expect(screen.getByText(/Maintenance and fault tracking/i)).toBeInTheDocument()
  })

  it('renders 4 stat cards from TicketStats', async () => {
    render(<TicketsPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Resolved Today')).toBeInTheDocument()
    expect(screen.getByText('Avg Resolution')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === '4.2 h')).toBeInTheDocument()
  })

  it('renders one row per ticket with severity + status pills', async () => {
    render(<TicketsPage />)
    expect(await screen.findByText('TKT-00001')).toBeInTheDocument()
    expect(screen.getByText('TKT-00004')).toBeInTheDocument()
    expect(screen.getByText('P1 Critical')).toBeInTheDocument()
    expect(screen.getAllByText('P2 High').length).toBe(2)
    const row2 = screen.getByText('TKT-00002').closest('tr')
    expect(row2).not.toBeNull()
    expect(within(row2!).getByText('In Progress')).toBeInTheDocument()
  })

  it('Raise Ticket button visible for engineer/admin and links to /tickets/new', async () => {
    render(<TicketsPage />)
    const link = await screen.findByRole('link', { name: /raise ticket/i })
    expect(link).toHaveAttribute('href', '/tickets/new')
  })

  it('renders empty state when service resolves to []', async () => {
    vi.mocked(liveTicketsService.getTicketRows).mockResolvedValueOnce([])
    render(<TicketsPage />)
    expect(await screen.findByText(/no tickets/i)).toBeInTheDocument()
  })
})
