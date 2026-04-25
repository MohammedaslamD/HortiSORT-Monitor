import { render, screen } from '../../../test/utils'
import { SeverityBar } from '../SeverityBar'

describe('SeverityBar', () => {
  it('renders one segment per non-zero count', () => {
    render(<SeverityBar p1={2} p2={2} p3={1} p4={0} />)
    expect(screen.getByTestId('sev-P1')).toBeInTheDocument()
    expect(screen.getByTestId('sev-P2')).toBeInTheDocument()
    expect(screen.getByTestId('sev-P3')).toBeInTheDocument()
    expect(screen.queryByTestId('sev-P4')).toBeNull()
  })

  it('widths sum to ~100% when total > 0', () => {
    render(<SeverityBar p1={2} p2={2} p3={1} p4={1} />)
    const total = 6
    const w1 = (screen.getByTestId('sev-P1') as HTMLElement).style.width
    const w2 = (screen.getByTestId('sev-P2') as HTMLElement).style.width
    const w3 = (screen.getByTestId('sev-P3') as HTMLElement).style.width
    const w4 = (screen.getByTestId('sev-P4') as HTMLElement).style.width
    const sum = parseFloat(w1) + parseFloat(w2) + parseFloat(w3) + parseFloat(w4)
    expect(sum).toBeCloseTo(100, 1)
    expect(w1).toBe(`${(2 / total) * 100}%`)
  })

  it('footer shows P1/P2/P3/P4 counts', () => {
    render(<SeverityBar p1={2} p2={2} p3={1} p4={1} />)
    expect(screen.getByText('P1: 2')).toBeInTheDocument()
    expect(screen.getByText('P2: 2')).toBeInTheDocument()
    expect(screen.getByText('P3: 1')).toBeInTheDocument()
    expect(screen.getByText('P4: 1')).toBeInTheDocument()
  })
})
