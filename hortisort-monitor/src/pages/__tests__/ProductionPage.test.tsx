import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { ProductionPage } from '../ProductionPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 5, name: 'Aslam', email: 'a@a.com', role: 'admin', is_active: true } }),
}))

vi.mock('../../services/productionSessionService', () => ({
  getAllTodaySessions: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../hooks/useProductionSocket', () => ({
  useProductionSocket: vi.fn().mockReturnValue({ lastSession: null }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProductionPage', () => {
  it('renders the page heading', async () => {
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /production/i })).toBeInTheDocument()
    })
  })

  it('shows empty state when no sessions returned', async () => {
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByText(/no production data/i)).toBeInTheDocument()
    })
  })
})
