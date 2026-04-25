import { activityService } from '../activityService'

describe('activityService', () => {
  it('getActivity returns 18 events ordered newest first', async () => {
    const events = await activityService.getActivity()
    expect(events).toHaveLength(18)
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(events[i].created_at).getTime())
    }
  })

  it('the first event matches the mockup (M-003 went DOWN)', async () => {
    const [first] = await activityService.getActivity()
    expect(first.title).toMatch(/M-003 went DOWN/)
  })
})
