import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Toast } from '../Toast'

describe('Toast', () => {
  it('renders nothing when isVisible is false', () => {
    const { container } = render(
      <Toast message="hidden" type="info" isVisible={false} onClose={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message and uses role="alert" when visible', () => {
    render(<Toast message="Saved" type="success" isVisible={true} onClose={() => {}} />)
    const root = screen.getByRole('alert')
    expect(root).toHaveTextContent('Saved')
  })

  it('applies the slide-in animation, stat-gradient surface, and a 4px left accent border', () => {
    render(<Toast message="Saved" type="success" isVisible={true} onClose={() => {}} />)
    const root = screen.getByRole('alert')
    expect(root).toHaveClass('animate-slide-in')
    expect(root).toHaveClass('stat-gradient')
    expect(root).toHaveClass('border-l-4')
  })

  it('uses brand-green accent border for type="success"', () => {
    render(<Toast message="ok" type="success" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-green')
  })

  it('uses brand-red accent border for type="error"', () => {
    render(<Toast message="bad" type="error" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-red')
  })

  it('uses brand-cyan accent border for type="info"', () => {
    render(<Toast message="info" type="info" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-cyan')
  })

  it('uses brand-amber accent border for type="warning"', () => {
    render(<Toast message="warn" type="warning" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-amber')
  })

  it('calls onClose when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Toast message="x" type="info" isVisible={true} onClose={onClose} />)
    await user.click(screen.getByLabelText(/dismiss notification/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('positions itself at the bottom-right of the viewport per Phase B mockup', () => {
    render(<Toast message="m" type="success" isVisible={true} onClose={() => {}} />)
    const root = screen.getByRole('alert')
    expect(root).toHaveClass('bottom-4')
    expect(root).toHaveClass('right-4')
    expect(root).not.toHaveClass('top-4')
  })
})
