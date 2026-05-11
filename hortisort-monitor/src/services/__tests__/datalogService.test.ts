import { vi, beforeEach, describe, it, expect } from 'vitest'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { getDatalogReport } from '../datalogService'
import type { DatalogReport } from '../../types'

const MOCK_REPORT: DatalogReport = {
  parsed_at: '2026-03-05T10:20:00.000Z',
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
  ],
  summary: {
    machine_name: 'Compact Inventory Machine1',
    machine_id: 'ZLHS',
    software_version: 'Hortisort V8.10.2601.1305',
    total_lots: 1,
    latest_lot: 'L260305101959',
    latest_lot_start: '05-03-2026 : 10:20',
    latest_lot_stop: '05-03-2026 : 10:20',
    latest_elapsed: '0 Hrs 0 Min 9.023 Sec',
    latest_program_start: '05-03-2026 : 10:20:17',
    fruits_inspected: '42',
    fruits_ejected: '5',
    fruits_lost: '3',
    double_fruits: '1',
    fruit_exit_count: '42',
    total_errors: 1,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getDatalogReport', () => {
  it('returns parsed JSON from fetch when response is OK', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_REPORT,
    })
    const result = await getDatalogReport()
    expect(mockFetch).toHaveBeenCalledWith('/datalog.json')
    expect(result.summary.machine_name).toBe('Compact Inventory Machine1')
    expect(result.lots).toHaveLength(1)
    expect(result.lots[0].lot_number).toBe('L260305101959')
  })

  it('returns mock fallback data when fetch returns non-OK status', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    const result = await getDatalogReport()
    expect(result.summary.machine_name).toBeTruthy()
    expect(result.lots.length).toBeGreaterThan(0)
  })

  it('returns mock fallback data when fetch throws a network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const result = await getDatalogReport()
    expect(result.summary).toBeDefined()
    expect(result.lots.length).toBeGreaterThan(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('returns errors array from the parsed report', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_REPORT,
    })
    const result = await getDatalogReport()
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error_source).toBe('Disk space warning')
  })

  it('returns summary totals correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_REPORT,
    })
    const result = await getDatalogReport()
    expect(result.summary.total_lots).toBe(1)
    expect(result.summary.fruits_inspected).toBe('42')
    expect(result.summary.total_errors).toBe(1)
  })
})
