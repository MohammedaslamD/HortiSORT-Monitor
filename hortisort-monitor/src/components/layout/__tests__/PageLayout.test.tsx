import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { PageLayout } from '../PageLayout'

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'A', email: 'a@x.com', role: 'admin', is_active: true } }),
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

describe('PageLayout', () => {
  it('renders pageTitle in the topbar and children in the main area', () => {
    render(
      <PageLayout pageTitle="Dashboard" userName="Aslam" userRole="admin" onLogout={() => {}}>
        <p>hello body</p>
      </PageLayout>
    )
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('hello body')).toBeInTheDocument()
  })

  it('does not render the sidebar backdrop initially', () => {
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('opens the sidebar drawer when the hamburger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    await user.click(screen.getByLabelText(/open navigation/i))
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('closes the sidebar drawer when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    await user.click(screen.getByLabelText(/open navigation/i))
    await user.click(screen.getByTestId('sidebar-backdrop'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
