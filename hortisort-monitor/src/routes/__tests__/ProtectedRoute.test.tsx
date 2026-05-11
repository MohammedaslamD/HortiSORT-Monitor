import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { render } from '../../test/utils'
import { ProtectedRoute } from '../ProtectedRoute'
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

// Mock Navigate and useNavigate from react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  }
})

const mockCustomer = {
  id: 1, name: 'Rajesh Patel', email: 'rajesh.patel@agrifresh.com',
  phone: '+91 98765 43210', whatsapp_number: null, role: 'customer' as const,
  is_active: true, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
}

const mockAdmin = {
  id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com',
  phone: '+91 54321 09876', whatsapp_number: '+91 54321 09876', role: 'admin' as const,
  is_active: true, created_at: '2023-01-01T10:00:00Z', updated_at: '2023-01-01T10:00:00Z',
}

const mockEngineer = {
  id: 3, name: 'Amit Sharma', email: 'amit.sharma@hortisort.com',
  phone: '+91 76543 21098', whatsapp_number: null, role: 'engineer' as const,
  is_active: true, created_at: '2023-06-01T10:00:00Z', updated_at: '2023-06-01T10:00:00Z',
}

function renderWithAuth(children: ReactNode, sessionUser: object | null = null) {
  mockRestoreSession.mockResolvedValue(sessionUser)
  return render(<AuthProvider>{children}</AuthProvider>)
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a loading spinner while session is being restored', () => {
    // Never resolves during this test
    mockRestoreSession.mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    )

    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to /login when session restore returns null', async () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      null
    )

    const navigateEl = await screen.findByTestId('navigate')
    expect(navigateEl).toHaveAttribute('data-to', '/login')
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children when session restore returns a user', async () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      mockCustomer
    )

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('redirects to /dashboard when user role is not in allowedRoles', async () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Only Content</div>
      </ProtectedRoute>,
      mockCustomer
    )

    const navigateEl = await screen.findByTestId('navigate')
    expect(navigateEl).toHaveAttribute('data-to', '/dashboard')
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
  })

  it('renders children when user role is in allowedRoles', async () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Only Content</div>
      </ProtectedRoute>,
      mockAdmin
    )

    await waitFor(() => {
      expect(screen.getByText('Admin Only Content')).toBeInTheDocument()
    })
  })

  it('allows engineer access to engineer+admin routes', async () => {
    renderWithAuth(
      <ProtectedRoute allowedRoles={['engineer', 'admin']}>
        <div>Engineer Content</div>
      </ProtectedRoute>,
      mockEngineer
    )

    await waitFor(() => {
      expect(screen.getByText('Engineer Content')).toBeInTheDocument()
    })
  })

  it('renders children for any authenticated user when no allowedRoles specified', async () => {
    renderWithAuth(
      <ProtectedRoute>
        <div>Any User Content</div>
      </ProtectedRoute>,
      mockEngineer
    )

    await waitFor(() => {
      expect(screen.getByText('Any User Content')).toBeInTheDocument()
    })
  })
})
