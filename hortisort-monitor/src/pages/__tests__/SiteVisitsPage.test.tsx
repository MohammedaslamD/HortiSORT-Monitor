import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { SiteVisitsPage } from '../SiteVisitsPage'

// Mock react-router-dom hooks
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock auth context — admin so engineer filter is shown
const mockAdmin = {
  id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com',
  role: 'admin' as const, is_active: true,
}
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockAdmin }),
}))

// Mock siteVisitService
vi.mock('../../services/siteVisitService', () => ({
  getAllSiteVisits: vi.fn().mockResolvedValue([]),
}))

// Mock machineService
vi.mock('../../services/machineService', () => ({
  getMachinesByRole: vi.fn().mockResolvedValue([]),
}))

// Mock userService — the real live API call
const mockGetUsers = vi.fn()
vi.mock('../../services/userService', () => ({
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
}))

// Mock userLookup utility
vi.mock('../../utils/userLookup', () => ({
  getUserName: (id: number) => `Engineer ${id}`,
}))

const mockEngineers = [
  {
    id: 3, name: 'Amit Sharma', email: 'amit@hortisort.com',
    phone: '123', whatsapp_number: null, password_hash: 'x',
    role: 'engineer' as const, is_active: true,
    created_at: '2023-01-01', updated_at: '2023-01-01',
  },
  {
    id: 4, name: 'Priya Nair', email: 'priya@hortisort.com',
    phone: '456', whatsapp_number: null, password_hash: 'x',
    role: 'engineer' as const, is_active: true,
    created_at: '2023-01-01', updated_at: '2023-01-01',
  },
]

describe('SiteVisitsPage — engineer filter uses live API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUsers.mockResolvedValue([
      ...mockEngineers,
      {
        id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com',
        phone: '789', whatsapp_number: null, password_hash: 'x',
        role: 'admin' as const, is_active: true,
        created_at: '2023-01-01', updated_at: '2023-01-01',
      },
    ])
  })

  it('calls getUsers to populate the engineer filter dropdown', async () => {
    render(<SiteVisitsPage />)

    // Wait for data to load and loading spinner to disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(mockGetUsers).toHaveBeenCalledTimes(1)
  })

  it('shows engineers from live API in the filter dropdown', async () => {
    render(<SiteVisitsPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Engineers from the live API should appear as options
    expect(screen.getByRole('option', { name: 'Amit Sharma' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Priya Nair' })).toBeInTheDocument()
  })
})
