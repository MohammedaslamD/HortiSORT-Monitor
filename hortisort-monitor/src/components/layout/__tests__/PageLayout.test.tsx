import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { PageLayout } from '../PageLayout'

describe('PageLayout', () => {
  it('renders pageTitle in the topbar and children in the main area', () => {
    render(
      <PageLayout pageTitle="Dashboard" userName="Aslam" userRole="admin" onLogout={() => {}}>
        <p>hello body</p>
      </PageLayout>
    )
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('hello body')).toBeInTheDocument()
  })

  it('does not render the sidebar backdrop initially', () => {
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('opens the sidebar drawer when the hamburger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    await user.click(screen.getByLabelText(/open navigation/i))
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('closes the sidebar drawer when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    await user.click(screen.getByLabelText(/open navigation/i))
    await user.click(screen.getByTestId('sidebar-backdrop'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
