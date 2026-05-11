import type { MachineLiveMetrics, FleetSummary, ThroughputPoint } from '../types'

/**
 * Per-machine live metrics for the Command Center fleet section.
 * Tone classification (computed in DashboardPage):
 *   tons===null && uptime===0 -> offline
 *   tons===null && progress<50 -> down
 *   tons===null && progress>=50 -> idle
 *   else -> running
 *
 * Final tally (ids 1-12): 6 running / 2 idle / 2 down / 2 offline.
 * First 8 visible tiles match dark-ui-v2.html M-001..M-008.
 */
export const MOCK_MACHINE_METRICS: MachineLiveMetrics[] = [
  { machine_id: 1, tons_per_hour: 2.4, uptime_percent: 90, progress_percent: 90, current_fruit: 'Banana' },
  { machine_id: 2, tons_per_hour: 1.9, uptime_percent: 75, progress_percent: 75, current_fruit: 'Mango' },
  { machine_id: 3, tons_per_hour: null, uptime_percent: 30, progress_percent: 30, current_fruit: null },
  { machine_id: 4, tons_per_hour: null, uptime_percent: 60, progress_percent: 55, current_fruit: null },
  { machine_id: 5, tons_per_hour: 3.1, uptime_percent: 85, progress_percent: 85, current_fruit: 'Grapes' },
  { machine_id: 6, tons_per_hour: 2.7, uptime_percent: 70, progress_percent: 70, current_fruit: 'Pomegranate' },
  { machine_id: 7, tons_per_hour: null, uptime_percent: 0, progress_percent: 0, current_fruit: null },
  { machine_id: 8, tons_per_hour: 1.5, uptime_percent: 60, progress_percent: 60, current_fruit: 'Mango' },
  { machine_id: 9, tons_per_hour: null, uptime_percent: 55, progress_percent: 50, current_fruit: null },
  { machine_id: 10, tons_per_hour: null, uptime_percent: 25, progress_percent: 20, current_fruit: null },
  { machine_id: 11, tons_per_hour: null, uptime_percent: 0, progress_percent: 0, current_fruit: null },
  { machine_id: 12, tons_per_hour: 2.0, uptime_percent: 70, progress_percent: 70, current_fruit: 'Apple' },
]

export const MOCK_FLEET_SUMMARY: FleetSummary = {
  total_machines: 12,
  running: 6,
  idle: 2,
  down: 2,
  offline: 2,
  in_production: 3,
  today_throughput_tons: 18.4,
  trend_running_vs_yesterday: 1,
  trend_throughput_pct: 12,
  open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
}

/**
 * Generate 30 throughput points spaced 1 minute apart, ending at `now`.
 * Deterministic per-minute: same `now.getMinutes()` returns the same series.
 * Smooth across calls so 5 s repolls produce nearly-identical curves.
 */
export function generateThroughputSeries(now: Date): ThroughputPoint[] {
  const seed = now.getMinutes()
  const points: ThroughputPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60_000)
    const phase = (seed + (29 - i)) * 0.7
    const actual = Math.max(0, 3.1 + Math.sin(phase) * 0.6 + Math.cos(phase * 0.3) * 0.3)
    const target = 3.5
    points.push({
      time: t.toISOString(),
      actual: Math.round(actual * 100) / 100,
      target,
    })
  }
  return points
}
