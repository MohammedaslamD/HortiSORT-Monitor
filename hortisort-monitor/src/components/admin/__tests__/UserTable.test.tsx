import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'

import { UserTable } from '../UserTable'
import type { User } from '../../../types'

const baseUser = (overrides: Partial<User>): User => ({
  id: 1,
  name: 'Aslam Sheikh',
  email: 'aslam@hortisort.com',
  phone: '9000000001',
  password_hash: 'x',
  role: 'admin',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2026-04-25T10:00:00Z',
  ...overrides,
})

const users: User[] = [
  baseUser({ id: 1, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', role: 'admin', is_active: true }),
  baseUser({ id: 2, name: 'Amit Sharma', email: 'amit.sharma@hortisort.com', role: 'engineer', is_active: true }),
  baseUser({ id: 3, name: 'Priya Nair', email: 'priya.nair@hortisort.com', role: 'engineer', is_active: false }),
  baseUser({ id: 4, name: 'Sara Khan', email: 'sara.khan@hortisort.com', role: 'customer', is_active: true }),
]

describe('UserTable (Phase B)', () => {
  it('renders one row per user with name, email, and role badge', () => {
    render(
      <UserTable
        users={users}
        currentUserId={1}
        onToggleActive={vi.fn()}
      />,
    )
    expect(screen.getByText('Aslam Sheikh')).toBeInTheDocument()
    expect(screen.getByText('Amit Sharma')).toBeInTheDocument()
    expect(screen.getByText('Priya Nair')).toBeInTheDocument()
    expect(screen.getByText('Sara Khan')).toBeInTheDocument()
    expect(screen.getByText('aslam@hortisort.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getAllByText('Engineer').length).toBe(2)
    expect(screen.getByText('Customer')).toBeInTheDocument()
  })

  it("renders 'Active' for is_active=true and 'Idle' for is_active=false", () => {
    render(
      <UserTable
        users={users}
        currentUserId={1}
        onToggleActive={vi.fn()}
      />,
    )
    // Three active + one idle
    expect(screen.getAllByText('Active').length).toBe(3)
    expect(screen.getByText('Idle')).toBeInTheDocument()
  })

  it("disables Deactivate and Delete buttons for the current admin's own row", () => {
    render(
      <UserTable
        users={users}
        currentUserId={1}
        onToggleActive={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    // Aslam (id=1) is the current user → his Deactivate + Delete should be disabled.
    // Other users' Deactivate buttons should be enabled.
    const deactivateButtons = screen.getAllByRole('button', { name: /deactivate/i })
    // Aslam is row 1: first deactivate button is his.
    expect(deactivateButtons[0]).toBeDisabled()
    expect(deactivateButtons[1]).not.toBeDisabled()
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
    expect(deleteButtons[0]).toBeDisabled()
    expect(deleteButtons[1]).not.toBeDisabled()
  })

  it('invokes onToggleActive, onEdit, onDelete, onAddUser callbacks', async () => {
    const onToggleActive = vi.fn()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onAddUser = vi.fn()
    const user = userEvent.setup()
    render(
      <UserTable
        users={users}
        currentUserId={1}
        onToggleActive={onToggleActive}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddUser={onAddUser}
      />,
    )
    await user.click(screen.getByRole('button', { name: /\+ add user/i }))
    expect(onAddUser).toHaveBeenCalledTimes(1)

    // Click Amit's (id=2) Edit + Deactivate
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await user.click(editButtons[1])
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))

    const deactivateButtons = screen.getAllByRole('button', { name: /deactivate/i })
    await user.click(deactivateButtons[1])
    expect(onToggleActive).toHaveBeenCalledWith(2)

    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i })
    await user.click(deleteButtons[1])
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }))
  })
})
