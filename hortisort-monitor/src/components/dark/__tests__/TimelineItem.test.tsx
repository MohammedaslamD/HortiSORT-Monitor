import { render, screen } from '../../../test/utils'
import { TimelineItem } from '../TimelineItem'
import type { ActivityEvent } from '../../../types'

const event: ActivityEvent = {
  id: 1,
  type: 'ticket',
  icon_tone: 'red',
  title: 'M-003 went DOWN',
  meta: 'TK-0041',
  created_at: '2026-04-23T09:40:00Z',
}

describe('TimelineItem', () => {
  it('renders title and meta with time', () => {
    render(<TimelineItem event={event} timeAgo="4m ago" />)
    expect(screen.getByText('M-003 went DOWN')).toBeInTheDocument()
    expect(screen.getByText(/TK-0041/)).toBeInTheDocument()
    expect(screen.getByText(/4m ago/)).toBeInTheDocument()
  })

  it('renders an IconTile with correct tone (red)', () => {
    const { container } = render(<TimelineItem event={event} timeAgo="now" />)
    const tile = container.querySelector('.bg-brand-red\\/15')
    expect(tile).toBeInTheDocument()
  })

  it('row has bottom border-line', () => {
    const { container } = render(<TimelineItem event={event} timeAgo="now" />)
    expect(container.firstChild).toHaveClass('border-line')
    expect(container.firstChild).toHaveClass('border-b')
  })
})
