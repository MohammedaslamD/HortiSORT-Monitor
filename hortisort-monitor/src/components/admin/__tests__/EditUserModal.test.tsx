import { render, screen, waitFor } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EditUserModal } from '../EditUserModal'
import * as userService from '../../../services/userService'
import * as machineService from '../../../services/machineService'
import type { User, Machine } from '../../../types'

vi.mock('../../../services/userService')
vi.mock('../../../services/machineService')

const mockUser: User = {
  id: 3,
  name: 'Amit Sharma',
  email: 'amit.sharma@hortisort.com',
  phone: '9876543210',
  role: 'engineer',
  is_active: true,
  created_at: '',
  updated_at: '',
  password_hash: '',
}

const mockOnClose = vi.fn()
const mockOnUpdated = vi.fn()

describe('EditUserModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(machineService.getMachines).mockResolvedValue([])
  })

  it('pre-fills form with user data', async () => {
    render(<EditUserModal isOpen user={mockUser} onClose={mockOnClose} onUpdated={mockOnUpdated} />)
    expect(screen.getByDisplayValue('Amit Sharma')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument()
  })

  it('does NOT show machine assignment section for engineer role', async () => {
    render(<EditUserModal isOpen user={mockUser} onClose={mockOnClose} onUpdated={mockOnUpdated} />)
    expect(screen.queryByText(/assigned machines/i)).not.toBeInTheDocument()
  })

  it('shows machine assignment section when role is customer', async () => {
    const customerUser = { ...mockUser, id: 1, role: 'customer' as const }
    const machines: Machine[] = [
      {
        id: 1,
        machine_code: 'HS-001',
        machine_name: 'HS-500 Sorter',
        model: 'HS-500',
        serial_number: 'SN001',
        status: 'running',
        customer_id: 1,
        engineer_id: 3,
        location: 'Warehouse A',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        grading_features: 'Size, Color',
        num_lanes: 4,
        software_version: 'v2.0',
        installation_date: '2024-01-01',
        last_updated: '',
        last_updated_by: 3,
        is_active: true,
        created_at: '',
        updated_at: '',
      },
    ]
    vi.mocked(machineService.getMachines).mockResolvedValue(machines)
    render(<EditUserModal isOpen user={customerUser} onClose={mockOnClose} onUpdated={mockOnUpdated} />)
    await waitFor(() => expect(screen.getByText(/assigned machines/i)).toBeInTheDocument())
  })

  it('calls updateUser and onUpdated on valid submit', async () => {
    const updated = { ...mockUser, name: 'Updated Name' }
    vi.spyOn(userService, 'updateUser').mockResolvedValueOnce(updated)
    const user = userEvent.setup()
    render(<EditUserModal isOpen user={mockUser} onClose={mockOnClose} onUpdated={mockOnUpdated} />)
    await user.clear(screen.getByDisplayValue('Amit Sharma'))
    await user.type(screen.getByLabelText(/full name/i), 'Updated Name')
    await user.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockOnUpdated).toHaveBeenCalledWith(updated))
  })
})
