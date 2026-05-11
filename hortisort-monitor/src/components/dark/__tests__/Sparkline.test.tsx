import { render } from '../../../test/utils'
import { Sparkline } from '../Sparkline'
import type { ThroughputPoint } from '../../../types'

const POINTS: ThroughputPoint[] = Array.from({ length: 30 }, (_, i) => ({
  time: new Date(Date.now() - (29 - i) * 60_000).toISOString(),
  actual: 1 + i * 0.1,
  target: 3.5,
}))

describe('Sparkline', () => {
  it('renders an SVG with the documented viewBox', () => {
    const { container } = render(<Sparkline points={POINTS} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 340 140')
  })
  it('renders an actual-series path and a dashed target path', () => {
    const { container } = render(<Sparkline points={POINTS} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(2)
    const dashed = Array.from(paths).find((p) => p.getAttribute('stroke-dasharray'))
    expect(dashed).toBeTruthy()
  })
  it('renders a pulsing endpoint dot', () => {
    const { container } = render(<Sparkline points={POINTS} />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThanOrEqual(2)
  })
  it('renders an empty SVG (no paths) when given zero points', () => {
    const { container } = render(<Sparkline points={[]} />)
    expect(container.querySelectorAll('path').length).toBe(0)
  })
})
