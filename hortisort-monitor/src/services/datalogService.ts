import type { DatalogReport } from '../types'

const DATALOG_URL = '/datalog.json'

const MOCK_REPORT: DatalogReport = {
  parsed_at: new Date().toISOString(),
  lots: [
    {
      lot_number: 'L260305101959',
      system_name: 'Compact Inventory Machine1',
      system_id: 'ZLHS',
      installation_date: '04-12-2025',
      lot_start: '05-03-2026 : 10:20',
      lot_stop: '05-03-2026 : 10:20',
      software_version: 'Hortisort V8.10.2601.1305',
      app_start_time: '05-03-2026 : 10:19:45',
      program_start_time: '05-03-2026 : 10:20:17',
      elapsed_time: '0 Hrs 0 Min 9.023 Sec',
      pc_boot_time: '47 Hrs 0 Min 14.852 Sec',
      sgr: {
        FruitExitCount: { lane1: '42', total: '42' },
        FruitLostCount: { lane1: '3', total: '3' },
        DoubleFruitCount: { lane1: '1', total: '1' },
      },
      inspection: {
        'Vision Result Count': { lane1: '42', total: '42' },
        'Ejection done': { lane1: '5', total: '5' },
        'Cup Tilt Feedback': { lane1: '0', total: '0' },
      },
      default_bin: {
        'Lost Fruit': { lane1: '3', total: '3' },
        'Multiple/Double Fruits': { lane1: '1', total: '1' },
      },
      outlets: {
        'Ejection Msg to MCU': {
          outlet_1: '5', outlet_2: '3', outlet_3: '2', outlet_4: '1',
          outlet_5: '0', outlet_6: '0', outlet_7: '0', outlet_8: '0',
          outlet_9: '0', outlet_10: '0',
        },
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

/**
 * Fetches the latest parsed TDMS datalog report from public/datalog.json.
 * Falls back to mock data when the file is not yet available (demo mode).
 */
export async function getDatalogReport(): Promise<DatalogReport> {
  try {
    const res = await fetch(DATALOG_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as DatalogReport
    return data
  } catch {
    return MOCK_REPORT
  }
}
