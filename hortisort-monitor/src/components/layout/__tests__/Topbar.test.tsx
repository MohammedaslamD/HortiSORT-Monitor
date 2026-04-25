import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Topbar } from '../Topbar'

describe('Topbar', () => {
  it('renders the split brand "Horti" cyan + "Sort" green', () => {
    render(<Topbar pageTitle="Dashboard" onOpenSidebar={() => {}} />)
    const horti = screen.getByText('Horti')
    const sort = screen.getByText('Sort')
    expect(horti).toHaveClass('text-brand-cyan')
    expect(sort).toHaveClass('text-brand-green')
  })

  it('renders the pageTitle prop', () => {
    render(<Topbar pageTitle="Command Center" onOpenSidebar={() => {}} />)
    expect(screen.getByText('Command Center')).toBeInTheDocument()
  })

  it('hamburger button calls onOpenSidebar when clicked', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Topbar pageTitle="X" onOpenSidebar={onOpen} />)
    await user.click(screen.getByLabelText(/open navigation/i))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('mounts the ThemeToggle', () => {
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    expect(screen.getByLabelText(/switch to (light|dark) theme/i)).toBeInTheDocument()
  })
})
