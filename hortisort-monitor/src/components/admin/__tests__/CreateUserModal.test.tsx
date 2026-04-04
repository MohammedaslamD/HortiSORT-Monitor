import { render, screen, waitFor } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { CreateUserModal } from '../CreateUserModal'
import * as userService from '../../../services/userService'

vi.mock('../../../services/userService')

const mockOnClose = vi.fn()
const mockOnCreated = vi.fn()

describe('CreateUserModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields when open', () => {
    render(<CreateUserModal isOpen onClose={mockOnClose} onCreated={mockOnCreated} />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<CreateUserModal isOpen onClose={mockOnClose} onCreated={mockOnCreated} />)
    await user.click(screen.getByRole('button', { name: /create user/i }))
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
  })

  it('calls createUser and onCreated on valid submit', async () => {
    const fakeUser = { id: 99, name: 'Test User', email: 'test@test.com', phone: '9000000099', role: 'engineer' as const, is_active: true, created_at: '', updated_at: '', password_hash: '' }
    vi.spyOn(userService, 'createUser').mockResolvedValueOnce(fakeUser)
    const user = userEvent.setup()
    render(<CreateUserModal isOpen onClose={mockOnClose} onCreated={mockOnCreated} />)
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^phone/i), '9000000099')
    await user.selectOptions(screen.getByLabelText(/role/i), 'engineer')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create user/i }))
    await waitFor(() => expect(mockOnCreated).toHaveBeenCalledWith(fakeUser))
  })
})
