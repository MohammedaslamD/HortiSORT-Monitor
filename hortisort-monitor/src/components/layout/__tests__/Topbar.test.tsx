import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Topbar } from '../Topbar'

const mockUser = { id: 5, name: 'Aslam', email: 'a@x.com', role: 'admin' as const, is_active: true }
let currentUser: typeof mockUser | null = mockUser

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser }),
}))

vi.mock('../../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn().mockResolvedValue({
      total_machines: 0, running: 0, idle: 0, down: 0, offline: 0,
      in_production: 0, today_throughput_tons: 0,
      trend_running_vs_yesterday: 0, trend_throughput_pct: 0,
      open_tickets: { total: 0, p1: 0, p2: 0, p3: 0, p4: 0 },
    }),
    getMachineRows: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../../services/alertService', () => ({
  alertService: { getAlerts: vi.fn().mockResolvedValue([]) },
}))

describe('Topbar', () => {
  beforeEach(() => { currentUser = mockUser })

  it('renders the split brand "Horti" cyan + "Sort" green', () => {
    render(<Topbar pageTitle="Dashboard" onOpenSidebar={() => {}} />)
    expect(screen.getByText('Horti')).toHaveClass('text-brand-cyan')
    expect(screen.getByText('Sort')).toHaveClass('text-brand-green')
  })

  it('renders the pageTitle prop', () => {
    render(<Topbar pageTitle="Command Center" onOpenSidebar={() => {}} />)
    expect(screen.getByText('Command Center')).toBeInTheDocument()
  })

  it('hamburger button calls onOpenSidebar when clicked', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Topbar pageTitle="X" onOpenSidebar={onOpen} />)
    await user.click(screen.getByLabelText(/open navigation/i))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('mounts the ThemeToggle', () => {
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.getByLabelText(/switch to (light|dark) theme/i)).toBeInTheDocument()
  })

  it('shows Operator Console button for admin', () => {
    currentUser = { ...mockUser, role: 'admin' }
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.getByRole('button', { name: /operator console/i })).toBeInTheDocument()
  })

  it('shows Operator Console button for engineer', () => {
    currentUser = { ...mockUser, role: 'engineer' }
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.getByRole('button', { name: /operator console/i })).toBeInTheDocument()
  })

  it('hides Operator Console button for customer', () => {
    currentUser = { ...mockUser, role: 'customer' }
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.queryByRole('button', { name: /operator console/i })).not.toBeInTheDocument()
  })

  it('opens the overlay when Operator Console button is clicked', async () => {
    const user = userEvent.setup()
    currentUser = { ...mockUser, role: 'admin' }
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    await user.click(screen.getByRole('button', { name: /operator console/i }))
    expect(await screen.findByText(/HortiSort Operator Console/i)).toBeInTheDocument()
  })

  it('shows the NotificationBell for admin', () => {
    currentUser = { ...mockUser, role: 'admin' }
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('hides the NotificationBell for customer', () => {
    currentUser = { ...mockUser, role: 'customer' }
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.queryByLabelText('Notifications')).not.toBeInTheDocument()
  })
})
