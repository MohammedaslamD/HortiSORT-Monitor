import type { ActivityEvent } from '../types'

const REF = new Date('2026-04-23T09:42:00Z').getTime()
const minutesAgo = (m: number) => new Date(REF - m * 60_000).toISOString()

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 1, type: 'ticket', icon_tone: 'red',    title: 'M-003 went DOWN - motor overload', meta: 'TK-0041 raised by Amit Sharma',  created_at: minutesAgo(4) },
  { id: 2, type: 'production', icon_tone: 'green', title: 'LOT-2026-042 started on M-001', meta: 'Banana - 360 kg so far',         created_at: minutesAgo(12) },
  { id: 3, type: 'visit',  icon_tone: 'blue',   title: 'Site visit by Priya Nair at M-005', meta: 'Calibration completed',          created_at: minutesAgo(25) },
  { id: 4, type: 'ticket', icon_tone: 'green',  title: 'TK-0037 resolved - Weight sensor', meta: 'Resolved by Amit Sharma',        created_at: minutesAgo(60) },
  { id: 5, type: 'machine', icon_tone: 'purple', title: 'M-004 status changed to Idle',     meta: 'Daily log auto-created',          created_at: minutesAgo(120) },
  { id: 6, type: 'production', icon_tone: 'cyan', title: 'LOT-2026-041 completed on M-005', meta: '1.2 t graded - 4.2% rejected',   created_at: minutesAgo(180) },
  { id: 7, type: 'ticket', icon_tone: 'yellow', title: 'TK-0040 escalated to P2',           meta: 'Engineer Amit Sharma notified',  created_at: minutesAgo(210) },
  { id: 8, type: 'machine', icon_tone: 'green', title: 'M-008 came back ONLINE',            meta: 'Network restored',                created_at: minutesAgo(260) },
  { id: 9, type: 'visit',  icon_tone: 'blue',   title: 'Routine visit logged at M-002',     meta: 'Belt tension adjusted',           created_at: minutesAgo(310) },
  { id: 10, type: 'user',  icon_tone: 'purple', title: 'New engineer Priya Nair onboarded', meta: 'Assigned to Site 2',              created_at: minutesAgo(420) },
  { id: 11, type: 'production', icon_tone: 'green', title: 'LOT-2026-040 started on M-006', meta: 'Pomegranate - 0 kg',             created_at: minutesAgo(480) },
  { id: 12, type: 'ticket', icon_tone: 'red',   title: 'TK-0039 raised - Sensor fault',     meta: 'M-007 - reported by customer',    created_at: minutesAgo(540) },
  { id: 13, type: 'machine', icon_tone: 'purple', title: 'M-001 software updated to v2.3',  meta: 'Auto-update completed',           created_at: minutesAgo(720) },
  { id: 14, type: 'visit',  icon_tone: 'blue',   title: 'Emergency visit at M-003',         meta: 'Motor replaced',                  created_at: minutesAgo(900) },
  { id: 15, type: 'ticket', icon_tone: 'green',  title: 'TK-0036 closed - Calibration',     meta: 'Resolved by Priya Nair',          created_at: minutesAgo(1080) },
  { id: 16, type: 'production', icon_tone: 'cyan', title: 'Daily throughput: 18.4 t',       meta: 'Across 6 active machines',        created_at: minutesAgo(1260) },
  { id: 17, type: 'machine', icon_tone: 'yellow', title: 'M-010 went IDLE',                  meta: 'No items detected for 30 min',    created_at: minutesAgo(1440) },
  { id: 18, type: 'user',   icon_tone: 'purple',  title: 'Customer Sara Khan logged in',    meta: 'First login this week',           created_at: minutesAgo(1620) },
]
