import { render, screen } from '../../../test/utils'
import { Select } from '../Select'

const OPTS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

describe('Select (Phase B dark styling)', () => {
  it('select element uses dark surface, line-strong border, fg-1 text', () => {
    render(<Select label="Role" options={OPTS} />)
    const select = screen.getByLabelText('Role')
    expect(select.className).toMatch(/bg-bg-surface1/)
    expect(select.className).toMatch(/border-line-strong/)
    expect(select.className).toMatch(/text-fg-1/)
  })

  it('label uses uppercase Phase B form-label styling', () => {
    render(<Select label="Status" options={OPTS} />)
    const label = screen.getByText('Status')
    expect(label.className).toMatch(/uppercase/)
    expect(label.className).toMatch(/text-fg-4/)
  })

  it('error state uses brand-red border', () => {
    render(<Select label="Type" options={OPTS} error="Required" />)
    const select = screen.getByLabelText('Type')
    expect(select.className).toMatch(/border-brand-red/)
  })
})
