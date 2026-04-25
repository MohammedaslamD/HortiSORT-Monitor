import { render } from '../../../test/utils'
import { StatusDot } from '../StatusDot'

describe('StatusDot', () => {
  it('renders a green dot for tone="green"', () => {
    const { container } = render(<StatusDot tone="green" />)
    expect(container.firstChild).toHaveClass('bg-brand-green')
  })
  it('does not pulse by default', () => {
    const { container } = render(<StatusDot tone="red" />)
    expect(container.firstChild).not.toHaveClass('animate-pulse-dot')
  })
  it('pulses when pulse=true', () => {
    const { container } = render(<StatusDot tone="amber" pulse />)
    expect(container.firstChild).toHaveClass('animate-pulse-dot')
  })
  it('renders a gray dot for tone="gray"', () => {
    const { container } = render(<StatusDot tone="gray" />)
    expect(container.firstChild).toHaveClass('bg-fg-5')
  })
})
