import { describe, it, expect } from 'vitest'
import { formatRelative } from '../formatRelative'

describe('formatRelative', () => {
  const NOW_MS = new Date('2026-04-25T10:00:00.000Z').getTime()

  it('returns "just now" for sub-minute timestamps', () => {
    const t = new Date(NOW_MS - 30_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('just now')
  })

  it('returns "Xm ago" for minutes', () => {
    const t = new Date(NOW_MS - 15 * 60_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('15m ago')
  })

  it('returns "Xh ago" for hours', () => {
    const t = new Date(NOW_MS - 3 * 3_600_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('3h ago')
  })

  it('returns "Xd ago" for days', () => {
    const t = new Date(NOW_MS - 2 * 86_400_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('2d ago')
  })
})
