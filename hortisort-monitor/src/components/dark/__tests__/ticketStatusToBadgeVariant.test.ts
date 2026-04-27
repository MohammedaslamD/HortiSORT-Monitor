import { describe, it, expect } from 'vitest'
import { ticketStatusToBadgeVariant } from '../ticketStatusToBadgeVariant'

describe('ticketStatusToBadgeVariant', () => {
  it.each([
    ['open',         'open'],
    ['in_progress',  'inprog'],
    ['resolved',     'resolved'],
    ['closed',       'resolved'],
    ['reopened',     'open'],
  ] as const)('%s -> %s', (status, expected) => {
    expect(ticketStatusToBadgeVariant(status)).toBe(expected)
  })
})
