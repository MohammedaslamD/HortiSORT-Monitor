import { render, screen } from '../../../test/utils'
import { StatCard } from '../StatCard'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard accent="green" label="RUNNING" value={6} icon={<span>i</span>} />)
    expect(screen.getByText('RUNNING')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('accent bar div has from-brand-green for accent="green"', () => {
    const { container } = render(<StatCard accent="green" label="X" value={1} icon={<span>i</span>} />)
    const bar = container.querySelector('.absolute.inset-x-0')
    expect(bar).toHaveClass('from-brand-green')
  })

  it('renders a green StatusDot when dot="green"', () => {
    const { container } = render(<StatCard accent="green" label="X" value={1} icon={<span>i</span>} dot="green" />)
    const dot = container.querySelector('.bg-brand-green.rounded-full')
    expect(dot).toBeInTheDocument()
  })

  it('renders TrendPill when trend is provided', () => {
    render(<StatCard accent="green" label="X" value={1} icon={<span>i</span>} trend={{ direction: 'up', value: '12%' }} />)
    expect(screen.getByText(/12%/)).toBeInTheDocument()
  })

  it('renders sub text', () => {
    render(<StatCard accent="green" label="X" value={1} icon={<span>i</span>} sub="from yesterday" />)
    expect(screen.getByText('from yesterday')).toBeInTheDocument()
  })

  it('outer has stat-gradient', () => {
    const { container } = render(<StatCard accent="blue" label="X" value={1} icon={<span>i</span>} />)
    expect(container.firstChild).toHaveClass('stat-gradient')
  })

  it('applies valueColor as inline style', () => {
    render(<StatCard accent="red" label="X" value={42} icon={<span>i</span>} valueColor="#ef4444" />)
    const val = screen.getByText('42')
    expect(val).toHaveStyle({ color: '#ef4444' })
  })
})
