import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { ProductionPage } from '../ProductionPage'
import type { DatalogReport } from '../../types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', role: 'admin' as const, is_active: true },
  }),
}))

const mockGetDatalogReport = vi.fn()
vi.mock('../../services/datalogService', () => ({
  getDatalogReport: () => mockGetDatalogReport(),
}))

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------
const REPORT: DatalogReport = {
  parsed_at: '2026-03-05T16:53:00.000Z',
  lots: [],
  errors: [
    {
      group: 'SCU',
      run_id: 'L260305101959',
      error_code: 'E001',
      error_source: 'Disk space warning',
      datetime: '05-03-2026 10:20:00',
      additional_info: '',
    },
  ],
  summary: {
    machine_name: 'Compact Inventory Machine1',
    machine_id: 'ZLHS',
    software_version: 'Hortisort V8.10.2601.1305',
    total_lots: 0,
    latest_lot: '',
    latest_lot_start: '',
    latest_lot_stop: '',
    latest_elapsed: '',
    latest_program_start: '',
    fruits_inspected: '0',
    fruits_ejected: '0',
    fruits_lost: '0',
    double_fruits: '0',
    fruit_exit_count: '0',
    total_errors: 1,
  },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('ProductionPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockGetDatalogReport.mockReset()
  })

  it('renders the Live Production heading', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/live production/i)
  })

  it('renders four stat cards', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/machines running/i)).toBeInTheDocument())
    expect(screen.getByText(/total lots today/i)).toBeInTheDocument()
    expect(screen.getByText(/total qty today/i)).toBeInTheDocument()
    expect(screen.getByText(/errors today/i)).toBeInTheDocument()
  })

  it('renders machine codes from mock data in the table', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getAllByText(/HS-2024-0001/).length).toBeGreaterThan(0)
    )
    expect(screen.getAllByText(/HS-2024-0002/).length).toBeGreaterThan(0)
  })

  it('renders fruit types from mock daily logs', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getAllByText('Mango').length).toBeGreaterThan(0))
  })

  it('renders city locations in the table', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getAllByText('Pune').length).toBeGreaterThan(0))
  })

  it('shows filter pills', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('All Machines')).toBeInTheDocument())
    // Use role=button to target the filter pill specifically, not the status badges
    const buttons = screen.getAllByRole('button')
    const labels = buttons.map((b) => b.textContent)
    expect(labels).toContain('Running')
    expect(labels).toContain('Completed')
    expect(labels).toContain('Errors')
  })

  it('shows the error log section with TDMS error entries', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('Disk space warning')).toBeInTheDocument())
    expect(screen.getByText(/error log/i)).toBeInTheDocument()
  })

  it('shows no errors message when error list is empty', async () => {
    mockGetDatalogReport.mockResolvedValue({ ...REPORT, errors: [] })
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/no errors recorded/i)).toBeInTheDocument())
  })

  it('shows Qty (KG) column header', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/qty \(kg\)/i)).toBeInTheDocument())
  })
})
