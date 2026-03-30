import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { DashboardPage } from '../DashboardPage'

// ---------------------------------------------------------------------------
// Router + nav mock
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ---------------------------------------------------------------------------
// Auth context mock — default admin; overridden per describe block
// ---------------------------------------------------------------------------
const mockAdmin    = { id: 5, name: 'Aslam Sheikh',  email: 'aslam@hortisort.com',        role: 'admin'    as const, is_active: true }
const mockEngineer = { id: 3, name: 'Amit Sharma',   email: 'amit.sharma@hortisort.com',  role: 'engineer' as const, is_active: true }
const mockCustomer = { id: 1, name: 'Rajesh Patel',  email: 'rajesh.patel@agrifresh.com', role: 'customer' as const, is_active: true }

const mockUseAuth = vi.fn(() => ({ user: mockAdmin }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockUseAuth() }))

// ---------------------------------------------------------------------------
// Service mocks
// ---------------------------------------------------------------------------
vi.mock('../../services/machineService', () => ({
  getMachinesByRole: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../services/ticketService', () => ({
  getTickets: vi.fn().mockResolvedValue([]),
}))
vi.mock('../../services/dailyLogService', () => ({
  getDailyLogs: vi.fn().mockResolvedValue([]),
}))

// ---------------------------------------------------------------------------
// Recharts mock — minimal stubs with testids
// ---------------------------------------------------------------------------
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart:  ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie:       () => <div data-testid="pie" />,
  Cell:      () => null,
  BarChart:  ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar:       () => <div data-testid="bar" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area:      () => <div data-testid="area" />,
  XAxis: () => null, YAxis: () => null, Tooltip: () => null,
  Legend: () => null, CartesianGrid: () => null,
}))

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function renderAndWait() {
  render(<DashboardPage />)
  await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DashboardPage — admin role', () => {
  beforeEach(() => { vi.clearAllMocks(); mockUseAuth.mockReturnValue({ user: mockAdmin }) })

  it('shows Machine Status chart', async () => {
    await renderAndWait()
    expect(screen.getByText('Machine Status')).toBeInTheDocument()
  })

  it('shows Ticket Severity chart', async () => {
    await renderAndWait()
    expect(screen.getByText('Ticket Severity')).toBeInTheDocument()
  })

  it('shows Throughput chart', async () => {
    await renderAndWait()
    expect(screen.getAllByText(/throughput/i).length).toBeGreaterThan(0)
  })
})

describe('DashboardPage — engineer role', () => {
  beforeEach(() => { vi.clearAllMocks(); mockUseAuth.mockReturnValue({ user: mockEngineer }) })

  it('shows Machine Status chart', async () => {
    await renderAndWait()
    expect(screen.getByText('Machine Status')).toBeInTheDocument()
  })

  it('shows Ticket Severity chart', async () => {
    await renderAndWait()
    expect(screen.getByText('Ticket Severity')).toBeInTheDocument()
  })

  it('shows Throughput chart', async () => {
    await renderAndWait()
    expect(screen.getAllByText(/throughput/i).length).toBeGreaterThan(0)
  })
})

describe('DashboardPage — customer role', () => {
  beforeEach(() => { vi.clearAllMocks(); mockUseAuth.mockReturnValue({ user: mockCustomer }) })

  it('shows Machine Status chart', async () => {
    await renderAndWait()
    expect(screen.getByText('Machine Status')).toBeInTheDocument()
  })

  it('does NOT show Ticket Severity chart', async () => {
    await renderAndWait()
    expect(screen.queryByText('Ticket Severity')).not.toBeInTheDocument()
  })

  it('shows Throughput chart', async () => {
    await renderAndWait()
    expect(screen.getAllByText(/throughput/i).length).toBeGreaterThan(0)
  })
})
