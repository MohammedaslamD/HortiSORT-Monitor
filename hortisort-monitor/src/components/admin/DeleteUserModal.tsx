import { useState } from 'react'
import { Modal, Button } from '../common'
import { deleteUser } from '../../services/userService'
import type { User } from '../../types'

interface DeleteUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onDeleted: (userId: number) => void
}

export function DeleteUserModal({ isOpen, user, onClose, onDeleted }: DeleteUserModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!user) return
    setIsDeleting(true)
    setError(null)
    try {
      await deleteUser(user.id)
      onDeleted(user.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleClose() {
    setError(null)
    onClose()
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete User" subtitle="This action cannot be undone" size="max-w-sm">
      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-950/40 border border-brand-red p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <p className="mb-6 text-sm text-fg-2">
        Are you sure you want to permanently delete{' '}
        <strong className="text-fg-1">{user.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={handleClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button type="button" variant="danger" isLoading={isDeleting} onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </Modal>
  )
}
