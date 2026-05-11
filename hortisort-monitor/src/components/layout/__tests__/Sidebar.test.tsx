import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  it('renders section labels OVERVIEW, OPERATIONS, ADMIN for an admin user', () => {
    render(<Sidebar userRole="admin" isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('OVERVIEW')).toBeInTheDocument()
    expect(screen.getByText('OPERATIONS')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('shows all seven core nav links for an admin', () => {
    render(<Sidebar userRole="admin" isOpen={true} onClose={() => {}} />)
    for (const label of ['Dashboard', 'Machines', 'Tickets', 'Production', 'Daily Logs', 'Site Visits', 'Users']) {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })).toBeInTheDocument()
    }
  })

  it('hides the ADMIN section and Users link for a customer', () => {
    render(<Sidebar userRole="customer" isOpen={true} onClose={() => {}} />)
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^users$/i })).not.toBeInTheDocument()
  })

  it('clicking a nav link calls onClose (drawer-close behavior on mobile)', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Sidebar userRole="admin" isOpen={true} onClose={onClose} />)
    await user.click(screen.getByRole('link', { name: /^machines$/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('translates off-screen on mobile when isOpen=false', () => {
    const { container } = render(<Sidebar userRole="admin" isOpen={false} onClose={() => {}} />)
    const aside = container.querySelector('aside')
    expect(aside?.className).toMatch(/-translate-x-full/)
  })

  it('renders the mobile backdrop with data-testid="sidebar-backdrop" when open', () => {
    render(<Sidebar userRole="admin" isOpen={true} onClose={() => {}} />)
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('does not render the backdrop when closed', () => {
    render(<Sidebar userRole="admin" isOpen={false} onClose={() => {}} />)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
