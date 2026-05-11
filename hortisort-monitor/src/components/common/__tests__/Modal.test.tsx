import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Modal } from '../Modal'

describe('Modal (Phase B dark shell)', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}}>body</Modal>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('panel uses Phase B dark surface, line-strong border, rounded-2xl', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="X">body</Modal>
    )
    const panel = screen.getByRole('dialog').querySelector('[data-modal-panel]')
    expect(panel).not.toBeNull()
    expect(panel!.className).toMatch(/bg-bg-surface2/)
    expect(panel!.className).toMatch(/border-line-strong/)
    expect(panel!.className).toMatch(/rounded-2xl/)
  })

  it('backdrop uses bg-black/75 with backdrop-blur', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="X">body</Modal>
    )
    const backdrop = screen.getByRole('dialog').querySelector('[data-modal-backdrop]')
    expect(backdrop).not.toBeNull()
    expect(backdrop!.className).toMatch(/bg-black\/75/)
    expect(backdrop!.className).toMatch(/backdrop-blur/)
  })

  it('renders subtitle when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Add User" subtitle="Create a team account">
        body
      </Modal>
    )
    expect(screen.getByText('Create a team account')).toBeInTheDocument()
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Modal isOpen={true} onClose={onClose} title="X">body</Modal>)
    await user.click(screen.getByLabelText(/close modal/i))
    expect(onClose).toHaveBeenCalled()
  })
})
