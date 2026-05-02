import { render, screen, waitFor } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from '../NotificationBell'
import type { Alert } from '../../../types'

const mockAlerts: Alert[] = [
  {
    id: 1,
    machine_id: 3,
    machine_label: 'M-003 Pomegranate',
    severity: 'critical',
    badge_label: 'P1',
    message: 'Motor overload - sorting halted',
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    machine_id: 7,
    machine_label: 'M-007 Mango',
    severity: 'warn',
    badge_label: 'P2',
    message: 'Rejection rate above 15%',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    machine_id: 1,
    machine_label: 'M-001 Banana',
    severity: 'info',
    badge_label: 'INFO',
    message: 'New lot LOT-042 started',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
]

const getAlertsMock = vi.fn<() => Promise<Alert[]>>()

vi.mock('../../../services/alertService', () => ({
  alertService: {
    getAlerts: () => getAlertsMock(),
  },
}))

describe('NotificationBell', () => {
  beforeEach(() => {
    getAlertsMock.mockReset()
    getAlertsMock.mockResolvedValue(mockAlerts)
  })

  it('renders bell button with aria-label', async () => {
    render(<NotificationBell />)
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument()
  })

  it('hides the panel by default', async () => {
    render(<NotificationBell />)
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalled())
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument()
  })

  it('shows red unread badge with critical+warn count', async () => {
    render(<NotificationBell />)
    // 1 critical + 1 warn = 2 unread
    expect(await screen.findByText('2')).toBeInTheDocument()
  })

  it('hides the badge when there are no unread alerts', async () => {
    getAlertsMock.mockResolvedValue([])
    render(<NotificationBell />)
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalled())
    // No '0' badge should be rendered
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
  })

  it('opens the panel when bell is clicked and lists alert messages', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalled())
    await user.click(screen.getByLabelText('Notifications'))
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()
    expect(screen.getByText('Motor overload - sorting halted')).toBeInTheDocument()
    expect(screen.getByText('Rejection rate above 15%')).toBeInTheDocument()
  })

  it('shows an empty state when there are no alerts', async () => {
    getAlertsMock.mockResolvedValue([])
    const user = userEvent.setup()
    render(<NotificationBell />)
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalled())
    await user.click(screen.getByLabelText('Notifications'))
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument()
  })

  it('closes the panel when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <NotificationBell />
        <button data-testid="outside">outside</button>
      </div>,
    )
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalled())
    await user.click(screen.getByLabelText('Notifications'))
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()
    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument()
  })

  it('closes the panel when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)
    await waitFor(() => expect(getAlertsMock).toHaveBeenCalled())
    await user.click(screen.getByLabelText('Notifications'))
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument()
  })

  it('caps the badge at 99+', async () => {
    const many: Alert[] = Array.from({ length: 120 }, (_, i) => ({
      ...mockAlerts[0],
      id: i + 1,
    }))
    getAlertsMock.mockResolvedValue(many)
    render(<NotificationBell />)
    expect(await screen.findByText('99+')).toBeInTheDocument()
  })
})
