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
  lots: [
    {
      lot_number: 'L260305101959',
      system_name: 'Compact Inventory Machine1',
      system_id: 'ZLHS',
      installation_date: '04-12-2025',
      lot_start: '05-03-2026 : 10:20',
      lot_stop: '05-03-2026 : 10:20',
      software_version: 'Hortisort V8.10.2601.1305',
      elapsed_time: '0 Hrs 2 Min 9.023 Sec',
      program_start_time: '05-03-2026 : 10:20:17',
      inspection: {
        'Vision Result Count': { lane1: '42', total: '42' },
        'Ejection done': { lane1: '5', total: '5' },
      },
      default_bin: { 'Lost Fruit': { lane1: '3', total: '3' } },
    },
    {
      lot_number: 'L260305103632',
      system_name: 'Compact Inventory Machine1',
      system_id: 'ZLHS',
      installation_date: '04-12-2025',
      lot_start: '05-03-2026 : 10:36',
      lot_stop: '05-03-2026 : 10:37',
      software_version: 'Hortisort V8.10.2601.1305',
      elapsed_time: '0 Hrs 0 Min 4.823 Sec',
      inspection: {
        'Vision Result Count': { lane1: '10', total: '10' },
      },
    },
  ],
  errors: [
    {
      group: 'SCU',
      run_id: 'L260305101959',
      error_code: 'E001',
      error_source: 'Disk space warning',
      datetime: '05-03-2026 10:20:00',
      additional_info: '',
    },
    {
      group: 'SegmentAndRegroupUnit',
      run_id: 'L260305101959',
      error_code: 'W002',
      error_source: 'Lost fruit image detected',
      datetime: '05-03-2026 10:21:00',
      additional_info: '',
    },
  ],
  summary: {
    machine_name: 'Compact Inventory Machine1',
    machine_id: 'ZLHS',
    software_version: 'Hortisort V8.10.2601.1305',
    total_lots: 2,
    latest_lot: 'L260305103632',
    latest_lot_start: '05-03-2026 : 10:36',
    latest_lot_stop: '05-03-2026 : 10:37',
    latest_elapsed: '0 Hrs 0 Min 4.823 Sec',
    latest_program_start: '05-03-2026 : 10:36:34',
    fruits_inspected: '52',
    fruits_ejected: '5',
    fruits_lost: '3',
    double_fruits: '0',
    fruit_exit_count: '52',
    total_errors: 2,
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

  it('renders the page header', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
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

  it('shows total lots count from TDMS data', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/total lots today/i)).toBeInTheDocument())
    // The Total Lots Today card value should show 2
    const card = screen.getByText(/total lots today/i).closest('div')
    expect(card?.textContent).toContain('2')
  })

  it('renders a row per lot with lot number', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('101959')).toBeInTheDocument())
    expect(screen.getByText('103632')).toBeInTheDocument()
  })

  it('renders machine name in the table', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => {
      expect(screen.getAllByText('Compact Inventory Machine1').length).toBeGreaterThan(0)
    })
  })

  it('shows the error log section with error entries', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/error log/i)).toBeInTheDocument())
    expect(screen.getByText('Disk space warning')).toBeInTheDocument()
    expect(screen.getByText('Lost fruit image detected')).toBeInTheDocument()
  })

  it('shows the error count badge', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText(/error log/i)).toBeInTheDocument())
    // badge shows error count
    const badges = screen.getAllByText('2')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows loading state initially', () => {
    mockGetDatalogReport.mockReturnValue(new Promise(() => {}))
    render(<ProductionPage />)
    expect(screen.getByText(/loading production data/i)).toBeInTheDocument()
  })

  it('shows empty state message when no lots match filter', async () => {
    mockGetDatalogReport.mockResolvedValue({ ...REPORT, lots: [] })
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getByText(/no lots match/i)).toBeInTheDocument()
    )
  })
})
