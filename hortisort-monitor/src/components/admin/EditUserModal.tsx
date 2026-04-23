import { useState, useEffect } from 'react'
import { Modal, Input, Select, Button } from '../common'
import { updateUser, assignMachinesToUser } from '../../services/userService'
import { getMachines } from '../../services/machineService'
import type { User, UserRole, Machine } from '../../types'

interface EditUserModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
  onUpdated: (user: User) => void
}

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'admin', label: 'Admin' },
]

export function EditUserModal({ isOpen, user, onClose, onUpdated }: EditUserModalProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [machines, setMachines] = useState<Machine[]>([])
  const [selectedMachineIds, setSelectedMachineIds] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(user.phone)
      setWhatsapp(user.whatsapp_number ?? '')
      setRole(user.role)
      setErrors({})
      setSubmitError(null)
    }
  }, [user])

  // Load machines when editing a customer
  useEffect(() => {
    if (isOpen && user?.role === 'customer') {
      getMachines()
        .then(all => {
          // Show machines unowned or owned by this customer
          setMachines(all.filter(m => m.customer_id === null || m.customer_id === user.id))
          setSelectedMachineIds(all.filter(m => m.customer_id === user.id).map(m => m.id))
        })
        .catch(() => { /* non-fatal */ })
    }
  }, [isOpen, user])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!phone.trim()) e.phone = 'Phone is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function toggleMachine(id: number) {
    setSelectedMachineIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !validate()) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const updated = await updateUser(user.id, {
        name: name.trim(),
        phone: phone.trim(),
        whatsapp_number: whatsapp.trim() || undefined,
        role,
      })
      if (role === 'customer') {
        await assignMachinesToUser(user.id, selectedMachineIds)
      }
      onUpdated(updated)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update user'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit User — ${user.name}`} size="max-w-lg">
      {submitError && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Email (read-only)"
          value={user.email}
          disabled
          helperText="Email cannot be changed"
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          error={errors.phone}
        />
        <Input
          label="WhatsApp Number (optional)"
          type="tel"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
        />
        <Select
          label="Role"
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          options={ROLE_OPTIONS}
        />
        {/* Machine assignment — customers only */}
        {role === 'customer' && machines.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Machines</p>
            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-800 p-2 space-y-1">
              {machines.map(m => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedMachineIds.includes(m.id)}
                    onChange={() => toggleMachine(m.id)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <span>{m.machine_code} — {m.machine_name} ({m.city})</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
