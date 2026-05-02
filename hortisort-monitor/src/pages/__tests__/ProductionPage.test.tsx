import { screen, waitFor } from '@testing-library/react'
import { render } from '../../test/utils'
import { ProductionPage } from '../ProductionPage'
import type { DatalogReport } from '../../types'

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

const MOCK_ERROR = {
  group: 'SCU',
  run_id: 'L260305101959',
  error_code: 'E001',
  error_source: 'Disk space warning',
  datetime: '05-03-2026 10:20:00',
  additional_info: '',
}

const REPORT: DatalogReport = {
  parsed_at: '2026-03-05T16:53:00.000Z',
  lots: [
    {
      lot_number: 'L260305101959',
      system_name: 'Compact Inventory Machine1',
      system_id: 'ZLHS',
      installation_date: '04-12-2025',
      lot_start: '05-03-2026 : 10:20',
      lot_stop:  '05-03-2026 : 10:20',
      software_version: 'Hortisort V8.10.2601.1305',
      elapsed_time: '0 Hrs 0 Min 9.023 Sec',
      inspection: { 'Vision Result Count': { lane1: '6', total: '6' } },
      default_bin: { 'Lost Fruit': { lane1: '3', total: '3' } },
    },
  ],
  errors: [MOCK_ERROR],
  summary: {
    machine_name: 'Compact Inventory Machine1', machine_id: 'ZLHS',
    software_version: 'Hortisort V8.10.2601.1305', total_lots: 1,
    latest_lot: 'L260305101959', latest_lot_start: '05-03-2026 : 10:20',
    latest_lot_stop: '05-03-2026 : 10:20', latest_elapsed: '0 Hrs 0 Min 9.023 Sec',
    latest_program_start: '05-03-2026 : 10:20:17', fruits_inspected: '6',
    fruits_ejected: '0', fruits_lost: '3', double_fruits: '0',
    fruit_exit_count: '0', total_errors: 1,
  },
  machines: [
    {
      machine_id: 'ZLHS',
      machine_name: 'Compact Inventory Machine1',
      software_version: 'Hortisort V8.10.2601.1305',
      total_lots: 1,
      first_lot_start: '05-03-2026 : 10:20',
      last_lot_stop: '05-03-2026 : 10:20',
      total_inspected: 6,
      total_ejected: 0,
      total_lost: 3,
      lot_ids: ['L260305101959'],
      errors: [MOCK_ERROR],
      error_count: 1,
    },
  ],
}

beforeEach(() => { mockNavigate.mockReset(); mockGetDatalogReport.mockReset() })

describe('ProductionPage', () => {
  it('renders the Live Production heading', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument())
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

  it('renders TDMS machine row with LIVE badge', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getByText('Compact Inventory Machine1')).toBeInTheDocument()
    )
    expect(screen.getAllByText('LIVE').length).toBeGreaterThan(0)
  })

  it('renders mock demo rows with DEMO badge', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getAllByText('DEMO').length).toBeGreaterThan(0))
  })

  it('renders mock machine codes from data folder', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getAllByText(/HS-2024-0001/).length).toBeGreaterThan(0)
    )
  })

  it('shows filter pills', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('All Machines')).toBeInTheDocument())
    const buttons = screen.getAllByRole('button')
    const labels = buttons.map((b) => b.textContent)
    expect(labels).toContain('Running')
    expect(labels).toContain('Completed')
    expect(labels).toContain('Errors')
  })

  it('shows latest error inline for LIVE machine row', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('Disk space warning')).toBeInTheDocument())
  })

  it('shows TDMS lot date in table', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<ProductionPage />)
    await waitFor(() => expect(screen.getByText('05 Mar 2026')).toBeInTheDocument())
  })

  it('shows no errors label when machine has no errors', async () => {
    const emptyMachines = REPORT.machines!.map((m) => ({ ...m, errors: [], error_count: 0 }))
    mockGetDatalogReport.mockResolvedValue({ ...REPORT, errors: [], machines: emptyMachines })
    render(<ProductionPage />)
    await waitFor(() =>
      expect(screen.getByText('Compact Inventory Machine1')).toBeInTheDocument()
    )
    expect(screen.getAllByText('No errors').length).toBeGreaterThan(0)
  })
})
