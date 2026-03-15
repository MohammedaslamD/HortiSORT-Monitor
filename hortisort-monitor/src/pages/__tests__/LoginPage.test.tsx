import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { render } from '../../test/utils'
import { AuthProvider } from '../../context/AuthContext'
import { LoginPage } from '../LoginPage'

// Mock authService so tests don't make real network calls
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

const mockLogin = authService.login as ReturnType<typeof vi.fn>
const mockRestoreSession = authService.restoreSession as ReturnType<typeof vi.fn>

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const MOCK_CUSTOMER = {
  id: 1, name: 'Rajesh Patel', email: 'rajesh.patel@agrifresh.com',
  phone: '+91 98765 43210', whatsapp_number: null, role: 'customer' as const,
  is_active: true, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
}

function renderLoginPage() {
  function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>
  }
  return render(<LoginPage />, { wrapper: Wrapper })
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // No active session by default
    mockRestoreSession.mockResolvedValue(null)
    ;(authService.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
  })

  it('renders email and password fields', async () => {
    renderLoginPage()

    // Wait for loading state to clear
    await waitFor(() => expect(screen.queryByLabelText(/email/i)).toBeInTheDocument())

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders a submit button', async () => {
    renderLoginPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sign in|log in|login/i })).toBeInTheDocument()
    )
  })

  it('shows error message on invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'))
    const user = userEvent.setup()
    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/email/i), 'nobody@nowhere.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('navigates to /dashboard on successful login', async () => {
    mockLogin.mockResolvedValue(MOCK_CUSTOMER)
    const user = userEvent.setup()
    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/email/i), 'rajesh.patel@agrifresh.com')
    await user.type(screen.getByLabelText(/password/i), 'password_123')
    await user.click(screen.getByRole('button', { name: /sign in|log in|login/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('disables submit button while loading', async () => {
    // Never resolves during this test
    mockLogin.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument())

    await user.type(screen.getByLabelText(/email/i), 'rajesh.patel@agrifresh.com')
    await user.type(screen.getByLabelText(/password/i), 'password_123')

    const button = screen.getByRole('button', { name: /sign in|log in|login/i })
    await user.click(button)

    expect(button).toBeDisabled()
  })

  it('requires email field', async () => {
    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument())

    expect(screen.getByLabelText(/email/i)).toBeRequired()
  })

  it('requires password field', async () => {
    renderLoginPage()

    await waitFor(() => expect(screen.getByLabelText(/password/i)).toBeInTheDocument())

    expect(screen.getByLabelText(/password/i)).toBeRequired()
  })
})
