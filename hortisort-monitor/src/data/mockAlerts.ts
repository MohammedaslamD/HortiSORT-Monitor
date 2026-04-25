import type { Alert } from '../types'

const REF = new Date('2026-04-23T09:42:00Z').getTime()
const minutesAgo = (m: number) => new Date(REF - m * 60_000).toISOString()

export const MOCK_ALERTS: Alert[] = [
  { id: 1, machine_id: 3, machine_label: 'M-003 Pomegranate', severity: 'critical', badge_label: 'P1', message: 'Motor overload - sorting halted', created_at: minutesAgo(2) },
  { id: 2, machine_id: 7, machine_label: 'M-007 Mango',       severity: 'warn',     badge_label: 'P2', message: 'Rejection rate above 15%',         created_at: minutesAgo(8) },
  { id: 3, machine_id: 1, machine_label: 'M-001 Banana',      severity: 'info',     badge_label: 'INFO', message: 'New lot LOT-042 started',        created_at: minutesAgo(12) },
  { id: 4, machine_id: 5, machine_label: 'M-005 Grapes',      severity: 'ok',       badge_label: 'OK',  message: 'Sensor recalibrated',             created_at: minutesAgo(25) },
  { id: 5, machine_id: 10, machine_label: 'M-010 Banana',     severity: 'warn',     badge_label: 'P2', message: 'Conveyor belt speed fluctuation', created_at: minutesAgo(60) },
  { id: 6, machine_id: 4, machine_label: 'M-004 Apple',       severity: 'info',     badge_label: 'INFO', message: 'Idle for 30 minutes',           created_at: minutesAgo(90) },
  { id: 7, machine_id: 8, machine_label: 'M-008 Mango',       severity: 'warn',     badge_label: 'P3', message: 'Vibration sensor drift',          created_at: minutesAgo(120) },
  { id: 8, machine_id: 6, machine_label: 'M-006 Pomegranate', severity: 'ok',       badge_label: 'OK',  message: 'Daily calibration completed',     created_at: minutesAgo(180) },
  { id: 9, machine_id: 2, machine_label: 'M-002 Mango',       severity: 'warn',     badge_label: 'P3', message: 'Belt tension low',                created_at: minutesAgo(240) },
  { id: 10, machine_id: 11, machine_label: 'M-011 Grapes',    severity: 'critical', badge_label: 'P1', message: 'Power supply failure',            created_at: minutesAgo(300) },
  { id: 11, machine_id: 9, machine_label: 'M-009 Apple',      severity: 'info',     badge_label: 'P4', message: 'Software update pending',         created_at: minutesAgo(360) },
  { id: 12, machine_id: 12, machine_label: 'M-012 Pomegranate', severity: 'ok',     badge_label: 'OK',  message: 'Maintenance window completed',    created_at: minutesAgo(480) },
]
