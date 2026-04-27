import type { MachineRow } from '../types'

const NOW = Date.now()
const minutesAgo = (m: number): string => new Date(NOW - m * 60_000).toISOString()
const hoursAgo = (h: number): string => new Date(NOW - h * 3_600_000).toISOString()
const daysAgo = (d: number): string => new Date(NOW - d * 86_400_000).toISOString()

/**
 * 12 machine rows for the Phase-B Machines table.
 * Tone tally must reconcile with MOCK_FLEET_SUMMARY: 6 running / 2 idle / 2 down / 2 offline.
 * Rows 1-7 are verbatim from dark-ui-v2.html lines 510-516; rows 8-12
 * extend to fleet total while preserving the 6/2/2/2 tally.
 */
export const MOCK_MACHINE_ROWS: MachineRow[] = [
  { machine_id: 1,  machine_label: 'M-001 Banana Sorter A',  site: 'Site 1', fruit: 'Banana',      status: 'running', tons_per_hour: 2.4,  uptime_percent: 90,   last_active: minutesAgo(0),  open_tickets_count: 0 },
  { machine_id: 2,  machine_label: 'M-002 Mango Sorter A',   site: 'Site 1', fruit: 'Mango',       status: 'running', tons_per_hour: 1.9,  uptime_percent: 75,   last_active: minutesAgo(0),  open_tickets_count: 1 },
  { machine_id: 3,  machine_label: 'M-003 Pomegranate A',    site: 'Site 1', fruit: 'Pomegranate', status: 'down',    tons_per_hour: 0,    uptime_percent: 30,   last_active: hoursAgo(2),    open_tickets_count: 2 },
  { machine_id: 4,  machine_label: 'M-004 Grapes Sorter A',  site: 'Site 2', fruit: 'Grapes',      status: 'idle',    tons_per_hour: null, uptime_percent: null, last_active: daysAgo(1),     open_tickets_count: 0 },
  { machine_id: 5,  machine_label: 'M-005 Grapes Sorter B',  site: 'Site 2', fruit: 'Grapes',      status: 'running', tons_per_hour: 3.1,  uptime_percent: 85,   last_active: minutesAgo(0),  open_tickets_count: 0 },
  { machine_id: 6,  machine_label: 'M-006 Pomegranate B',    site: 'Site 2', fruit: 'Pomegranate', status: 'running', tons_per_hour: 2.7,  uptime_percent: 70,   last_active: minutesAgo(0),  open_tickets_count: 1 },
  { machine_id: 7,  machine_label: 'M-007 Mango Sorter B',   site: 'Site 3', fruit: 'Mango',       status: 'offline', tons_per_hour: null, uptime_percent: null, last_active: daysAgo(3),     open_tickets_count: 1 },
  { machine_id: 8,  machine_label: 'M-008 Apple Sorter A',   site: 'Site 3', fruit: 'Apple',       status: 'running', tons_per_hour: 1.5,  uptime_percent: 60,   last_active: minutesAgo(0),  open_tickets_count: 0 },
  { machine_id: 9,  machine_label: 'M-009 Banana Sorter B',  site: 'Site 3', fruit: 'Banana',      status: 'running', tons_per_hour: 2.2,  uptime_percent: 78,   last_active: minutesAgo(2),  open_tickets_count: 0 },
  { machine_id: 10, machine_label: 'M-010 Apple Sorter B',   site: 'Site 4', fruit: 'Apple',       status: 'idle',    tons_per_hour: null, uptime_percent: null, last_active: hoursAgo(5),    open_tickets_count: 0 },
  { machine_id: 11, machine_label: 'M-011 Mango Sorter C',   site: 'Site 4', fruit: 'Mango',       status: 'down',    tons_per_hour: 0,    uptime_percent: 25,   last_active: hoursAgo(8),    open_tickets_count: 1 },
  { machine_id: 12, machine_label: 'M-012 Apple Sorter C',   site: 'Site 4', fruit: 'Apple',       status: 'offline', tons_per_hour: null, uptime_percent: null, last_active: daysAgo(5),     open_tickets_count: 0 },
]
