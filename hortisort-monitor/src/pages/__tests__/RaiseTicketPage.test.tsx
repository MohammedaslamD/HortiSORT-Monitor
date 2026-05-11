import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'
import { RaiseTicketPage } from '../RaiseTicketPage'

// Mock react-router-dom hooks
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  }
})

// Mock auth context
const mockUser = {
  id: 1, name: 'Rajesh Patel', email: 'rajesh.patel@agrifresh.com',
  role: 'customer' as const, is_active: true,
}
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

// Mock machine service
const mockMachines = [
  {
    id: 10, machine_code: 'HS-001', machine_name: 'Sorter A',
    model: 'X1', serial_number: 'S001', customer_id: 1, engineer_id: 3,
    location: 'Pune', city: 'Pune', state: 'MH', country: 'India',
    grading_features: 'size', num_lanes: 4, software_version: '1.0',
    installation_date: '2023-01-01', status: 'running' as const,
    last_updated: '2024-01-01', last_updated_by: 3,
    is_active: true, created_at: '2023-01-01', updated_at: '2024-01-01',
  },
]
vi.mock('../../services/machineService', () => ({
  getMachinesByRole: vi.fn(),
}))

// Mock ticket service
const mockCreateTicket = vi.fn()
vi.mock('../../services/ticketService', () => ({
  createTicket: (...args: unknown[]) => mockCreateTicket(...args),
}))

import { getMachinesByRole } from '../../services/machineService'
const mockGetMachinesByRole = getMachinesByRole as ReturnType<typeof vi.fn>

describe('RaiseTicketPage — assigned_to not hardcoded', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMachinesByRole.mockResolvedValue(mockMachines)
    mockCreateTicket.mockResolvedValue({
      id: 42, ticket_number: 'TKT-00042', machine_id: 10,
      raised_by: 1, assigned_to: 3, severity: 'P3_medium',
      category: 'hardware', title: 'Test ticket', description: 'Details',
      status: 'open', sla_hours: 24, created_at: '2024-01-01',
      resolved_at: null, resolution_time_mins: null, root_cause: null,
      solution: null, parts_used: null, reopen_count: 0,
      reopened_at: null, customer_rating: null, customer_feedback: null,
      updated_at: '2024-01-01',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls createTicket without assigned_to field', async () => {
    const user = userEvent.setup()
    render(<RaiseTicketPage />)

    // Wait for machines to load (option text format: "HS-001 — Sorter A")
    await waitFor(() => {
      expect(screen.getByText('HS-001 — Sorter A')).toBeTruthy()
    })

    // Select machine
    const machineSelect = screen.getByLabelText('Machine')
    await user.selectOptions(machineSelect, '10')

    // Select category
    const categorySelect = screen.getByLabelText('Category')
    await user.selectOptions(categorySelect, 'hardware')

    // Fill title
    const titleInput = screen.getByLabelText('Title')
    await user.type(titleInput, 'Test ticket')

    // Fill description
    const descInput = screen.getByLabelText('Description')
    await user.type(descInput, 'Detailed description')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /raise ticket/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledTimes(1)
    })

    const callArg = mockCreateTicket.mock.calls[0][0]
    expect(callArg).not.toHaveProperty('assigned_to')
    expect(callArg.machine_id).toBe(10)
    expect(callArg.raised_by).toBe(1)
  }, 15000)

  it('renders Phase B dark header (text-fg-1) and SectionCard form wrapper (stat-gradient)', async () => {
    render(<RaiseTicketPage />)
    await waitFor(() => {
      expect(screen.getByText('HS-001 — Sorter A')).toBeTruthy()
    })
    const heading = screen.getByRole('heading', { name: /raise ticket/i })
    expect(heading.className).toMatch(/text-fg-1/)
    const form = document.querySelector('form')
    // The form's parent wrapper should be a stat-gradient SectionCard
    expect(form).not.toBeNull()
    expect(form!.closest('.stat-gradient')).not.toBeNull()
  }, 15000)
})
