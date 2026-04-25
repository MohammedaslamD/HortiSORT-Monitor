import { liveMetricsService } from '../liveMetricsService'

describe('liveMetricsService', () => {
  it('getFleetSummary returns the mock fleet summary', async () => {
    const summary = await liveMetricsService.getFleetSummary()
    expect(summary.total_machines).toBe(12)
    expect(summary.running).toBe(6)
    expect(summary.today_throughput_tons).toBeCloseTo(18.4, 1)
    expect(summary.open_tickets.p1).toBe(2)
  })

  it('getMachineMetrics returns 12 entries', async () => {
    const metrics = await liveMetricsService.getMachineMetrics()
    expect(metrics).toHaveLength(12)
    expect(metrics[0].machine_id).toBe(1)
  })

  it('getThroughputSeries returns 30 points ordered chronologically', async () => {
    const now = new Date('2026-04-23T09:42:00Z')
    const series = await liveMetricsService.getThroughputSeries(now)
    expect(series).toHaveLength(30)
    expect(new Date(series[0].time).getTime()).toBeLessThan(new Date(series[29].time).getTime())
    expect(series[29].actual).toBeGreaterThan(0)
  })

  it('getThroughputSeries is deterministic for the same minute', async () => {
    const now = new Date('2026-04-23T09:42:00Z')
    const a = await liveMetricsService.getThroughputSeries(now)
    const b = await liveMetricsService.getThroughputSeries(now)
    expect(a[0].actual).toBe(b[0].actual)
    expect(a[15].actual).toBe(b[15].actual)
  })
})
