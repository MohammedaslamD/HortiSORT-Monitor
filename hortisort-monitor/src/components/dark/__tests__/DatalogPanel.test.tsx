import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../test/utils'
import { DatalogPanel } from '../DatalogPanel'
import type { DatalogReport } from '../../../types'

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
      elapsed_time: '0 Hrs 0 Min 9.023 Sec',
      program_start_time: '05-03-2026 : 10:20:17',
      inspection: {
        'Vision Result Count': { lane1: '42', total: '42' },
        'Ejection done': { lane1: '5', total: '5' },
      },
      default_bin: {
        'Lost Fruit': { lane1: '3', total: '3' },
      },
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
    fruits_inspected: '42',
    fruits_ejected: '5',
    fruits_lost: '3',
    double_fruits: '1',
    fruit_exit_count: '42',
    total_errors: 2,
  },
}

const mockGetDatalogReport = vi.fn()
vi.mock('../../../services/datalogService', () => ({
  getDatalogReport: () => mockGetDatalogReport(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DatalogPanel', () => {
  it('shows loading state initially', () => {
    mockGetDatalogReport.mockReturnValue(new Promise(() => {}))
    render(<DatalogPanel />)
    expect(screen.getByText(/loading datalog/i)).toBeInTheDocument()
  })

  it('renders machine name and ID from summary', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<DatalogPanel />)
    expect(await screen.findByText('Compact Inventory Machine1')).toBeInTheDocument()
    expect(screen.getByText('ZLHS')).toBeInTheDocument()
  })

  it('renders total lots count', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<DatalogPanel />)
    await screen.findByText('Compact Inventory Machine1')
    expect(screen.getByText(/lot history \(2 lots\)/i)).toBeInTheDocument()
  })

  it('renders each lot number in the lot table', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<DatalogPanel />)
    expect(await screen.findByText('L260305101959')).toBeInTheDocument()
    expect(screen.getByText('L260305103632')).toBeInTheDocument()
  })

  it('renders elapsed time for lots', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<DatalogPanel />)
    await screen.findByText('L260305101959')
    expect(screen.getByText('0 Hrs 0 Min 9.023 Sec')).toBeInTheDocument()
  })

  it('renders error log section with error count', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<DatalogPanel />)
    await screen.findByText('L260305101959')
    expect(screen.getByText(/error log/i)).toBeInTheDocument()
    expect(screen.getByText('Disk space warning')).toBeInTheDocument()
  })

  it('renders error group and datetime columns', async () => {
    mockGetDatalogReport.mockResolvedValue(REPORT)
    render(<DatalogPanel />)
    await screen.findByText('Disk space warning')
    expect(screen.getByText('SCU')).toBeInTheDocument()
    expect(screen.getByText('05-03-2026 10:20:00')).toBeInTheDocument()
  })

  it('shows error message when fetch fails', async () => {
    mockGetDatalogReport.mockRejectedValue(new Error('fetch failed'))
    render(<DatalogPanel />)
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument()
  })
})
