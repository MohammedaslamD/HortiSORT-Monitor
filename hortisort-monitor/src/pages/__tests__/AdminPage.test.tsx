import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import { AdminPage } from '../AdminPage'
import * as userServiceModule from '../../services/userService'
import type { User } from '../../types'

// ---------------------------------------------------------------------------
// Router mock
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// ---------------------------------------------------------------------------
// Auth context mock
// ---------------------------------------------------------------------------
const mockAdmin = { id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', role: 'admin' as const, is_active: true }
const mockUseAuth = vi.fn(() => ({ user: mockAdmin }))
vi.mock('../../context/AuthContext', () => ({ useAuth: () => mockUseAuth() }))

// ---------------------------------------------------------------------------
// Service mocks
// ---------------------------------------------------------------------------
const mockUsers: User[] = [
  { id: 1, name: 'Rajesh Patel', email: 'rajesh@agrifresh.com', phone: '9000000001', role: 'customer', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01', password_hash: '' },
  { id: 3, name: 'Amit Sharma', email: 'amit@hortisort.com', phone: '9000000003', role: 'engineer', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01', password_hash: '' },
  { id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', phone: '9000000005', role: 'admin', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01', password_hash: '' },
]

vi.mock('../../services/userService', () => ({
  getUsers: vi.fn(),
  toggleUserActive: vi.fn().mockResolvedValue(undefined),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  assignMachinesToUser: vi.fn(),
  deleteUser: vi.fn(),
}))

vi.mock('../../services/machineService', () => ({
  getMachines: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../services/ticketService', () => ({
  getOpenTicketCount: vi.fn().mockResolvedValue(0),
}))

vi.mock('../../services/siteVisitService', () => ({
  getAllSiteVisits: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../services/activityLogService', () => ({
  getRecentActivity: vi.fn().mockResolvedValue([]),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockAdmin })
    vi.mocked(userServiceModule.getUsers).mockResolvedValue(mockUsers)
  })

  it('renders user table after loading', async () => {
    render(<AdminPage />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    expect(screen.getByText('Rajesh Patel')).toBeInTheDocument()
  })

  it('opens CreateUserModal when "+ Add User" button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /\+ add user/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/add new user/i)).toBeInTheDocument()
  })

  it('opens EditUserModal when "Edit" button is clicked on a user row', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    const editButtons = screen.getAllByRole('button', { name: /^edit$/i })
    await user.click(editButtons[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens DeleteUserModal when "Delete" button is clicked on a user row', async () => {
    const user = userEvent.setup()
    render(<AdminPage />)
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument())
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
    // Find an enabled one (not own row)
    const enabledDelete = deleteButtons.find(b => !b.hasAttribute('disabled'))
    if (!enabledDelete) throw new Error('No enabled delete button found')
    await user.click(enabledDelete)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
