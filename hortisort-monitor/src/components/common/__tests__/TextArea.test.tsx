import { render, screen } from '../../../test/utils'
import { TextArea } from '../TextArea'

describe('TextArea (Phase B dark styling)', () => {
  it('textarea uses dark surface, line-strong border, fg-1 text', () => {
    render(<TextArea label="Notes" />)
    const ta = screen.getByLabelText('Notes')
    expect(ta.className).toMatch(/bg-bg-surface1/)
    expect(ta.className).toMatch(/border-line-strong/)
    expect(ta.className).toMatch(/text-fg-1/)
  })

  it('label uses uppercase Phase B form-label styling', () => {
    render(<TextArea label="Description" />)
    const label = screen.getByText('Description')
    expect(label.className).toMatch(/uppercase/)
    expect(label.className).toMatch(/text-fg-4/)
  })

  it('error state uses brand-red border', () => {
    render(<TextArea label="Comment" error="Required" />)
    const ta = screen.getByLabelText('Comment')
    expect(ta.className).toMatch(/border-brand-red/)
  })
})
