import { useState } from 'react'
import { Modal, Input, Select, Button } from '../common'
import { createUser } from '../../services/userService'
import type { User, UserRole } from '../../types'
import type { CreateUserPayload } from '../../types'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (user: User) => void
}

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'admin', label: 'Admin' },
]

export function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [role, setRole] = useState<UserRole>('customer')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!phone.trim()) e.phone = 'Phone is required'
    if (!role) e.role = 'Role is required'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleClose() {
    setName('')
    setEmail('')
    setPhone('')
    setWhatsapp('')
    setRole('customer')
    setPassword('')
    setConfirmPassword('')
    setErrors({})
    setSubmitError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const payload: CreateUserPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        whatsapp_number: whatsapp.trim() || undefined,
        role,
        password,
      }
      const created = await createUser(payload)
      onCreated(created)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create user'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New User" size="max-w-lg">
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
          placeholder="Enter full name"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          error={errors.phone}
          placeholder="10-digit phone number"
        />
        <Input
          label="WhatsApp Number (optional)"
          type="tel"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
          placeholder="WhatsApp number"
        />
        <Select
          label="Role"
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          options={ROLE_OPTIONS}
          error={errors.role}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Min 8 characters"
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          placeholder="Re-enter password"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  )
}
