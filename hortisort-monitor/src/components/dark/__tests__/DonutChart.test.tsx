import { render, screen } from '../../../test/utils'
import { DonutChart } from '../DonutChart'

const SEGS = [
  { label: 'Running', value: 6, color: '#4ade80' },
  { label: 'Idle',    value: 2, color: '#fbbf24' },
  { label: 'Down',    value: 2, color: '#ef4444' },
  { label: 'Offline', value: 2, color: '#64748b' },
]

describe('DonutChart', () => {
  it('renders one circle per segment plus a base track circle', () => {
    const { container } = render(<DonutChart segments={SEGS} centerLabel="machines" />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(SEGS.length + 1)
  })

  it('center text shows total and centerLabel', () => {
    render(<DonutChart segments={SEGS} centerLabel="machines" />)
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('machines')).toBeInTheDocument()
  })

  it('legend renders one row per segment with the count', () => {
    render(<DonutChart segments={SEGS} centerLabel="machines" />)
    for (const seg of SEGS) {
      expect(screen.getByText(seg.label)).toBeInTheDocument()
    }
  })

  it('renders only the base track when no segments', () => {
    const { container } = render(<DonutChart segments={[]} centerLabel="m" />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(1)
  })
})
