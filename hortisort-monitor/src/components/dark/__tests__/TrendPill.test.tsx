import { render, screen } from '../../../test/utils'
import { TrendPill } from '../TrendPill'

describe('TrendPill', () => {
  it('shows up arrow + value in green for direction=up', () => {
    render(<TrendPill direction="up" value="12%" />)
    const pill = screen.getByText(/12%/)
    expect(pill).toHaveTextContent('\u25B2')
    expect(pill).toHaveClass('text-brand-green')
  })
  it('shows down arrow + value in red for direction=down', () => {
    render(<TrendPill direction="down" value="3" />)
    const pill = screen.getByText(/3/)
    expect(pill).toHaveTextContent('\u25BC')
    expect(pill).toHaveClass('text-brand-red')
  })
})
