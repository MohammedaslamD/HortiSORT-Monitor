import { render, screen } from '../../../test/utils'
import { AlertRow } from '../AlertRow'
import { alertBadgeVariant } from '../alertBadgeVariant'
import type { Alert } from '../../../types'

const baseAlert: Alert = {
  id: 1,
  machine_id: 3,
  machine_label: 'M-003 Pomegranate',
  severity: 'critical',
  badge_label: 'P1',
  message: 'Motor overload',
  created_at: '2026-04-23T09:40:00Z',
}

describe('AlertRow', () => {
  it('renders machine label, time and message', () => {
    render(<AlertRow alert={baseAlert} timeAgo="2m ago" />)
    expect(screen.getByText('M-003 Pomegranate')).toBeInTheDocument()
    expect(screen.getByText('2m ago')).toBeInTheDocument()
    expect(screen.getByText('Motor overload')).toBeInTheDocument()
    expect(screen.getByText('P1')).toBeInTheDocument()
  })

  it.each([
    ['critical', 'border-l-brand-red'],
    ['warn', 'border-l-brand-amber'],
    ['info', 'border-l-brand-cyan'],
    ['ok', 'border-l-brand-green'],
  ] as const)('outer has %s border for severity=%s', (severity, cls) => {
    const { container } = render(
      <AlertRow alert={{ ...baseAlert, severity }} timeAgo="now" />,
    )
    expect(container.firstChild).toHaveClass(cls)
  })
})

describe('alertBadgeVariant', () => {
  it.each([
    ['P1', 'bg-brand-red/20'],
    ['P2', 'bg-brand-amber/20'],
    ['P3', 'bg-brand-cyan/20'],
    ['P4', 'bg-fg-5/20'],
    ['INFO', 'bg-brand-cyan/20'],
    ['OK', 'bg-brand-green/20'],
  ] as const)('maps %s -> classes containing %s', (label, expected) => {
    const out = alertBadgeVariant(label)
    expect(out.label).toBe(label)
    expect(out.classes).toContain(expected)
  })
})
