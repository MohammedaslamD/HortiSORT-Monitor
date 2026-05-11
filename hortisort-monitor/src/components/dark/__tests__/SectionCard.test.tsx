import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { SectionCard } from '../SectionCard'

describe('SectionCard', () => {
  it('renders the title and children', () => {
    render(<SectionCard title="Fleet"><p>kids</p></SectionCard>)
    expect(screen.getByText('Fleet')).toBeInTheDocument()
    expect(screen.getByText('kids')).toBeInTheDocument()
  })

  it('renders a link button that calls onClick', async () => {
    const onClick = vi.fn()
    render(
      <SectionCard title="X" link={{ label: 'View all', onClick }}>
        <span>body</span>
      </SectionCard>,
    )
    const btn = screen.getByRole('button', { name: 'View all' })
    await userEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders meta text when no link', () => {
    render(<SectionCard title="X" meta="LAST 30 MIN"><span>b</span></SectionCard>)
    expect(screen.getByText('LAST 30 MIN')).toBeInTheDocument()
  })

  it('outer has stat-gradient, border-line, rounded-xl', () => {
    const { container } = render(<SectionCard title="X"><span>b</span></SectionCard>)
    const section = container.querySelector('section')
    expect(section).toHaveClass('stat-gradient')
    expect(section).toHaveClass('border-line')
    expect(section).toHaveClass('rounded-xl')
  })
})
