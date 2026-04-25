import { render, screen } from '../../../test/utils'
import { IconTile } from '../IconTile'

describe('IconTile', () => {
  it('renders children with green tint for tone="green"', () => {
    render(<IconTile tone="green"><span>X</span></IconTile>)
    const tile = screen.getByText('X').parentElement
    expect(tile).toHaveClass('bg-brand-green/15')
    expect(tile).toHaveClass('text-brand-green')
  })
  it.each([
    ['red', 'bg-brand-red/15'],
    ['amber', 'bg-brand-amber/15'],
    ['blue', 'bg-brand-cyan/15'],
    ['cyan', 'bg-brand-cyan/15'],
    ['purple', 'bg-brand-purple/15'],
  ] as const)('uses correct tint for tone=%s', (tone, cls) => {
    const { container } = render(<IconTile tone={tone}><span>i</span></IconTile>)
    expect(container.firstChild).toHaveClass(cls)
  })
})
