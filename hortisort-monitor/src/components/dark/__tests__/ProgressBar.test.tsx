import { render, screen } from '../../../test/utils'
import { ProgressBar } from '../ProgressBar'

describe('ProgressBar', () => {
  it('outer track has bg-bg-surface3', () => {
    const { container } = render(<ProgressBar percent={50} tone="green" />)
    expect(container.firstChild).toHaveClass('bg-bg-surface3')
  })

  it.each([
    ['green', 'bg-brand-green'],
    ['amber', 'bg-brand-amber'],
    ['red', 'bg-brand-red'],
  ] as const)('inner fill has %s class', (tone, cls) => {
    render(<ProgressBar percent={50} tone={tone} />)
    const bar = screen.getByRole('progressbar')
    const fill = bar.firstChild as HTMLElement
    expect(fill).toHaveClass(cls)
  })

  it('width style matches percent', () => {
    render(<ProgressBar percent={42} tone="green" />)
    const fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.width).toBe('42%')
  })

  it('clamps percent to [0, 100]', () => {
    const { rerender } = render(<ProgressBar percent={-50} tone="green" />)
    let fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.width).toBe('0%')
    rerender(<ProgressBar percent={250} tone="green" />)
    fill = screen.getByRole('progressbar').firstChild as HTMLElement
    expect(fill.style.width).toBe('100%')
  })
})
