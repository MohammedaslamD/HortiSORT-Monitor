import { render, screen } from '../../test/utils'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Aslam', role: 'admin', email: 'a@a', is_active: true } }),
}))

vi.mock('../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn().mockResolvedValue({
      total_machines: 12, running: 6, idle: 2, down: 2, offline: 2,
      in_production: 3, today_throughput_tons: 18.4,
      trend_running_vs_yesterday: 1, trend_throughput_pct: 12,
      open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
    }),
    getMachineMetrics: vi.fn().mockResolvedValue([
      { machine_id: 1, tons_per_hour: 2.4, uptime_percent: 90, progress_percent: 90, current_fruit: 'Banana' },
      { machine_id: 2, tons_per_hour: 1.8, uptime_percent: 85, progress_percent: 70, current_fruit: 'Mango' },
      { machine_id: 3, tons_per_hour: null, uptime_percent: 50, progress_percent: 30, current_fruit: 'Pomegranate' },
      { machine_id: 4, tons_per_hour: null, uptime_percent: 80, progress_percent: 60, current_fruit: 'Apple' },
      { machine_id: 5, tons_per_hour: 3.0, uptime_percent: 95, progress_percent: 85, current_fruit: 'Grapes' },
      { machine_id: 6, tons_per_hour: 2.1, uptime_percent: 88, progress_percent: 75, current_fruit: 'Pomegranate' },
      { machine_id: 7, tons_per_hour: 1.9, uptime_percent: 80, progress_percent: 65, current_fruit: 'Mango' },
      { machine_id: 8, tons_per_hour: 2.5, uptime_percent: 92, progress_percent: 80, current_fruit: 'Mango' },
    ]),
    getThroughputSeries: vi.fn().mockResolvedValue([
      { time: new Date().toISOString(), actual: 3, target: 3.5 },
      { time: new Date().toISOString(), actual: 3.5, target: 3.5 },
    ]),
  },
}))
vi.mock('../../services/alertService', () => ({
  alertService: { getAlerts: vi.fn().mockResolvedValue([
    { id: 1, machine_id: 3, machine_label: 'M-003 Pomegranate', severity: 'critical', badge_label: 'P1', message: 'Motor overload - sorting halted', created_at: new Date().toISOString() },
  ]) },
}))
vi.mock('../../services/activityService', () => ({
  activityService: { getActivity: vi.fn().mockResolvedValue([
    { id: 1, type: 'ticket', icon_tone: 'red', title: 'M-003 went DOWN - motor overload', meta: 'TK-0041', created_at: new Date().toISOString() },
  ]) },
}))

import { DashboardPage } from '../DashboardPage'

describe('DashboardPage (Command Center)', () => {
  it('renders all 5 stat-card labels', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText(/TOTAL MACHINES/i)).toBeInTheDocument()
    expect((await screen.findAllByText(/RUNNING/i)).length).toBeGreaterThan(0)
    expect(await screen.findByText(/IN PRODUCTION/i)).toBeInTheDocument()
    expect(await screen.findByText(/OPEN TICKETS/i)).toBeInTheDocument()
    expect(await screen.findByText(/TODAY THROUGHPUT/i)).toBeInTheDocument()
  })

  it('renders 8 machine tiles', async () => {
    render(<DashboardPage />)
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(await screen.findByText(`M-${String(id).padStart(3, '0')}`)).toBeInTheDocument()
    }
  })

  it('renders the alert feed message', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('Motor overload - sorting halted')).toBeInTheDocument()
  })

  it('renders the activity title', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('M-003 went DOWN - motor overload')).toBeInTheDocument()
  })

  it('renders the severity counts in the bottom row', async () => {
    render(<DashboardPage />)
    expect(await screen.findByText('P1: 2')).toBeInTheDocument()
    expect(await screen.findByText('P2: 2')).toBeInTheDocument()
    expect(await screen.findByText('P3: 1')).toBeInTheDocument()
    expect(await screen.findByText('P4: 1')).toBeInTheDocument()
  })

  it('renders Sparkline SVG with viewBox 0 0 340 140', async () => {
    const { container } = render(<DashboardPage />)
    expect(await screen.findByText(/LAST 30 MIN/i)).toBeInTheDocument()
    const svg = container.querySelector('svg[viewBox="0 0 340 140"]')
    expect(svg).toBeInTheDocument()
  })
})
