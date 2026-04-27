import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/utils'
import { StatBadge } from '../StatBadge'

describe('StatBadge', () => {
  it('renders children', () => {
    render(<StatBadge variant="running">Running</StatBadge>)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it.each([
    ['running',   'bg-green-500/15',  'text-green-400'],
    ['idle',      'bg-yellow-500/15', 'text-yellow-400'],
    ['down',      'bg-red-500/15',    'text-red-400'],
    ['offline',   'bg-slate-500/15',  'text-slate-400'],
    ['live',      'bg-green-500/15',  'text-green-400'],
    ['critical',  'bg-red-500/15',    'text-red-400'],
    ['high',      'bg-orange-500/15', 'text-orange-400'],
    ['medium',    'bg-yellow-500/15', 'text-yellow-400'],
    ['low',       'bg-blue-500/15',   'text-blue-400'],
    ['open',      'bg-red-500/15',    'text-red-400'],
    ['inprog',    'bg-yellow-500/15', 'text-yellow-400'],
    ['resolved',  'bg-green-500/15',  'text-green-400'],
    ['completed', 'bg-green-500/15',  'text-green-400'],
    ['admin',     'bg-purple-500/15', 'text-purple-400'],
    ['engineer',  'bg-blue-500/15',   'text-blue-400'],
    ['customer',  'bg-cyan-500/15',   'text-cyan-400'],
    ['notrun',    'bg-slate-500/15',  'text-slate-400'],
  ] as const)('variant %s applies bg %s and text %s', (variant, bg, text) => {
    render(<StatBadge variant={variant}>X</StatBadge>)
    const el = screen.getByText('X')
    expect(el.className).toContain(bg)
    expect(el.className).toContain(text)
  })

  it('uppercase modifier applied for variant="live"', () => {
    render(<StatBadge variant="live">LIVE</StatBadge>)
    expect(screen.getByText('LIVE').className).toContain('uppercase')
  })
})
