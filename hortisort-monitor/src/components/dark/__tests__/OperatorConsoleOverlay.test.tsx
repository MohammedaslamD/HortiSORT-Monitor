import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OperatorConsoleOverlay } from '../OperatorConsoleOverlay'

vi.mock('../../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn().mockResolvedValue({
      total_machines: 12,
      running: 6,
      idle: 2,
      down: 2,
      offline: 2,
      in_production: 3,
      today_throughput_tons: 18.4,
      trend_running_vs_yesterday: 1,
      trend_throughput_pct: 12,
      open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
    }),
    getMachineRows: vi.fn().mockResolvedValue([
      {
        machine_id: 1,
        machine_label: 'M-001',
        site: 'Pune',
        fruit: 'Banana',
        status: 'running',
        tons_per_hour: 2.4,
        uptime_percent: 95,
        last_active: '2026-04-25T10:00:00Z',
      },
      {
        machine_id: 3,
        machine_label: 'M-003',
        site: 'Pune',
        fruit: 'Pomegranate',
        status: 'down',
        tons_per_hour: null,
        uptime_percent: null,
        last_active: '2026-04-25T08:00:00Z',
      },
    ]),
  },
}))

describe('OperatorConsoleOverlay', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(<OperatorConsoleOverlay isOpen={false} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders title and subtitle when open', async () => {
    render(<OperatorConsoleOverlay isOpen onClose={() => {}} />)
    expect(await screen.findByText(/HortiSort Operator Console/i)).toBeInTheDocument()
    expect(screen.getByText(/Live floor view/i)).toBeInTheDocument()
  })

  it('renders fleet KPI labels', async () => {
    render(<OperatorConsoleOverlay isOpen onClose={() => {}} />)
    expect(await screen.findByText('RUNNING')).toBeInTheDocument()
    expect(screen.getAllByText('DOWN').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('IDLE')).toBeInTheDocument()
    expect(screen.getByText('TODAY TONS')).toBeInTheDocument()
  })

  it('renders machine tiles after polling resolves', async () => {
    render(<OperatorConsoleOverlay isOpen onClose={() => {}} />)
    expect(await screen.findByText('M-001')).toBeInTheDocument()
    expect(screen.getByText('M-003')).toBeInTheDocument()
    expect(screen.getByText('2.4')).toBeInTheDocument()
    // M-003 is down — Banana row + Pomegranate appear
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Pomegranate')).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<OperatorConsoleOverlay isOpen onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Exit Console button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<OperatorConsoleOverlay isOpen onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /exit console/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders a clock in HH:MM:SS format', async () => {
    render(<OperatorConsoleOverlay isOpen onClose={() => {}} />)
    const clock = await screen.findByTestId('console-clock')
    expect(clock.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })
})
