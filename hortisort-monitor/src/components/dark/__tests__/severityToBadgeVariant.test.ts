import { describe, it, expect } from 'vitest'
import { severityToBadgeVariant } from '../severityToBadgeVariant'

describe('severityToBadgeVariant', () => {
  it.each([
    ['P1_critical', 'critical'],
    ['P2_high', 'high'],
    ['P3_medium', 'medium'],
    ['P4_low', 'low'],
  ] as const)('%s -> %s', (severity, expected) => {
    expect(severityToBadgeVariant(severity)).toBe(expected)
  })
})
