import { render, screen } from '../../../test/utils'
import { ProductionStatusBadge } from '../ProductionStatusBadge'

describe('ProductionStatusBadge', () => {
  it('shows "Running" text for running status', () => {
    render(<ProductionStatusBadge status="running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('shows "Completed" text for completed status', () => {
    render(<ProductionStatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('shows "Error" text for error status', () => {
    render(<ProductionStatusBadge status="error" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })
})
