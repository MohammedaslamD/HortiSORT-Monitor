import { render, screen, waitFor } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { DeleteUserModal } from '../DeleteUserModal'
import * as userService from '../../../services/userService'
import type { User } from '../../../types'

vi.mock('../../../services/userService')

const mockUser: User = {
  id: 5,
  name: 'Rajesh Patel',
  email: 'rajesh@test.com',
  phone: '9876543210',
  role: 'customer',
  is_active: true,
  created_at: '',
  updated_at: '',
  password_hash: '',
}

const mockOnClose = vi.fn()
const mockOnDeleted = vi.fn()

describe('DeleteUserModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the user name in the confirmation message', () => {
    render(<DeleteUserModal isOpen user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />)
    expect(screen.getByText(/rajesh patel/i)).toBeInTheDocument()
  })

  it('calls deleteUser and onDeleted when confirmed', async () => {
    vi.spyOn(userService, 'deleteUser').mockResolvedValueOnce(undefined)
    const user = userEvent.setup()
    render(<DeleteUserModal isOpen user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(mockOnDeleted).toHaveBeenCalledWith(mockUser.id))
  })

  it('shows inline error when server returns 409', async () => {
    vi.spyOn(userService, 'deleteUser').mockRejectedValueOnce(new Error('Cannot delete — user has existing records. Deactivate instead.'))
    const user = userEvent.setup()
    render(<DeleteUserModal isOpen user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />)
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(mockOnDeleted).not.toHaveBeenCalled()
  })
})
