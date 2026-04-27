import { describe, it, expect } from 'vitest'
import { statusToBadgeVariant } from '../statusToBadgeVariant'

describe('statusToBadgeVariant', () => {
  it.each([
    ['running', 'running'],
    ['idle', 'idle'],
    ['down', 'down'],
    ['offline', 'offline'],
  ] as const)('%s -> %s', (status, expected) => {
    expect(statusToBadgeVariant(status)).toBe(expected)
  })
})
