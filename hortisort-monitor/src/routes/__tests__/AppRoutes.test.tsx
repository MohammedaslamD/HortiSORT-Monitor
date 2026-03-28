import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../AppRoutes'
import { AuthProvider } from '../../context/AuthContext'

// Mock authService so AuthProvider uses controlled restoreSession
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    restoreSession: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}))

import { authService } from '../../services/authService'

const mockRestoreSession = authService.restoreSession as ReturnType<typeof vi.fn>

// Mock Navigate so we can assert redirect destinations without real navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  }
})

// Stub all page components to avoid rendering their full dependency trees
vi.mock('../../pages/RaiseTicketPage', () => ({
  RaiseTicketPage: () => <div>Raise Ticket Page</div>,
}))
vi.mock('../../pages/DashboardPage', () => ({
  DashboardPage: () => <div>Dashboard Page</div>,
}))
vi.mock('../../pages/LoginPage', () => ({
  LoginPage: () => <div>Login Page</div>,
}))
vi.mock('../../pages/MachinesPage', () => ({
  MachinesPage: () => <div>Machines Page</div>,
}))
vi.mock('../../pages/MachineDetailPage', () => ({
  MachineDetailPage: () => <div>Machine Detail Page</div>,
}))
vi.mock('../../pages/UpdateStatusPage', () => ({
  UpdateStatusPage: () => <div>Update Status Page</div>,
}))
vi.mock('../../pages/TicketsPage', () => ({
  TicketsPage: () => <div>Tickets Page</div>,
}))
vi.mock('../../pages/TicketDetailPage', () => ({
  TicketDetailPage: () => <div>Ticket Detail Page</div>,
}))
vi.mock('../../pages/DailyLogsPage', () => ({
  DailyLogsPage: () => <div>Daily Logs Page</div>,
}))
vi.mock('../../pages/SiteVisitsPage', () => ({
  SiteVisitsPage: () => <div>Site Visits Page</div>,
}))
vi.mock('../../pages/LogVisitPage', () => ({
  LogVisitPage: () => <div>Log Visit Page</div>,
}))
vi.mock('../../pages/AdminPage', () => ({
  AdminPage: () => <div>Admin Page</div>,
}))

const mockCustomer = {
  id: 1, name: 'Rajesh Patel', email: 'rajesh.patel@agrifresh.com',
  phone: '+91 98765 43210', whatsapp_number: null, role: 'customer' as const,
  is_active: true, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
}

function renderAtPath(path: string, sessionUser: object | null = null) {
  mockRestoreSession.mockResolvedValue(sessionUser)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('AppRoutes — /tickets/new access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows a customer to access /tickets/new', async () => {
    renderAtPath('/tickets/new', mockCustomer)

    await waitFor(() => {
      expect(screen.getByText('Raise Ticket Page')).toBeInTheDocument()
    })
  })

  it('redirects an unauthenticated user from /tickets/new to /login', async () => {
    renderAtPath('/tickets/new', null)

    const navigateEl = await screen.findByTestId('navigate')
    expect(navigateEl).toHaveAttribute('data-to', '/login')
  })
})
