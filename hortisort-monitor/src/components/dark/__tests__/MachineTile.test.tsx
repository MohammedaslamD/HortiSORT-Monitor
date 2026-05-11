import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { MachineTile } from '../MachineTile'

describe('MachineTile', () => {
  it('renders name, badge, value and unit', () => {
    render(
      <MachineTile
        tone="running"
        name="M-001"
        badge={<span>RUNNING</span>}
        value={2.4}
        unit="t/hr"
      />,
    )
    expect(screen.getByText('M-001')).toBeInTheDocument()
    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(screen.getByText('2.4')).toBeInTheDocument()
    expect(screen.getByText('t/hr')).toBeInTheDocument()
  })

  it.each([
    ['running', 'border-brand-green/40'],
    ['idle', 'border-brand-amber/40'],
    ['down', 'border-brand-red/50'],
    ['offline', 'border-line'],
  ] as const)('outer has correct border class for tone=%s', (tone, cls) => {
    render(
      <MachineTile tone={tone} name="M" badge={<span>b</span>} value={1} unit="u" />,
    )
    expect(screen.getByRole('button')).toHaveClass(cls)
  })

  it('renders ProgressBar only when progressPercent provided', () => {
    const { rerender, container } = render(
      <MachineTile tone="running" name="M" badge={<span>b</span>} value={1} unit="u" />,
    )
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    rerender(
      <MachineTile tone="running" name="M" badge={<span>b</span>} value={1} unit="u" progressPercent={50} progressTone="green" />,
    )
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  it('clicking tile calls onClick', async () => {
    const onClick = vi.fn()
    render(
      <MachineTile tone="running" name="M" badge={<span>b</span>} value={1} unit="u" onClick={onClick} />,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
