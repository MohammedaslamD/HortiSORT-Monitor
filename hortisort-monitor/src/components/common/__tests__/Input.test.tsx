import { render, screen } from '../../../test/utils'
import { Input } from '../Input'

describe('Input (Phase B dark styling)', () => {
  it('input element uses dark surface, line-strong border, fg-1 text', () => {
    render(<Input label="Name" placeholder="x" />)
    const input = screen.getByLabelText('Name')
    expect(input.className).toMatch(/bg-bg-surface1/)
    expect(input.className).toMatch(/border-line-strong/)
    expect(input.className).toMatch(/text-fg-1/)
  })

  it('label uses uppercase Phase B form-label styling', () => {
    render(<Input label="Email" />)
    const label = screen.getByText('Email')
    expect(label.className).toMatch(/uppercase/)
    expect(label.className).toMatch(/text-fg-4/)
  })

  it('error state uses brand-red border', () => {
    render(<Input label="Phone" error="Required" />)
    const input = screen.getByLabelText('Phone')
    expect(input.className).toMatch(/border-brand-red/)
  })
})
