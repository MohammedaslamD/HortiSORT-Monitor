import { alertService } from '../alertService'

describe('alertService', () => {
  it('getAlerts returns 12 mock alerts ordered by created_at desc (newest first)', async () => {
    const alerts = await alertService.getAlerts()
    expect(alerts).toHaveLength(12)
    for (let i = 1; i < alerts.length; i++) {
      expect(new Date(alerts[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(alerts[i].created_at).getTime())
    }
  })

  it('the first alert is the P1 critical for M-003', async () => {
    const [first] = await alertService.getAlerts()
    expect(first.severity).toBe('critical')
    expect(first.badge_label).toBe('P1')
    expect(first.machine_label).toContain('M-003')
  })
})
