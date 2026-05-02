import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/utils'
import { InfoBanner } from '../InfoBanner'

describe('InfoBanner', () => {
  it('renders children', () => {
    render(<InfoBanner>Heads up.</InfoBanner>)
    expect(screen.getByText('Heads up.')).toBeInTheDocument()
  })

  it('applies the cyan tone classes', () => {
    render(<InfoBanner>x</InfoBanner>)
    const el = screen.getByRole('note')
    expect(el.className).toContain('bg-cyan-500/10')
    expect(el.className).toContain('border-cyan-500/30')
    expect(el.className).toContain('text-cyan-200')
  })
})
