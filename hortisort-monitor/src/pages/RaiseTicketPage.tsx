import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import type { Machine, TicketSeverity, TicketCategory } from '../types'
import { useAuth } from '../context/AuthContext'
import { getMachinesByRole } from '../services/machineService'
import { createTicket } from '../services/ticketService'
import { Button, Input, Select, TextArea, Toast } from '../components/common'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Radio options for severity with SLA hint. */
const SEVERITY_OPTIONS: { value: TicketSeverity; label: string; sla: string }[] = [
  { value: 'P1_critical', label: 'P1 Critical', sla: '4 hour SLA' },
  { value: 'P2_high', label: 'P2 High', sla: '8 hour SLA' },
  { value: 'P3_medium', label: 'P3 Medium', sla: '24 hour SLA' },
  { value: 'P4_low', label: 'P4 Low', sla: '72 hour SLA' },
]

/** Category select options. */
const CATEGORY_OPTIONS = [
  { value: '', label: 'Select category...' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'other', label: 'Other' },
]

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Form page for raising a new support ticket.
 *
 * Accessible to all authenticated users. Machine picker is role-scoped.
 * Severity is chosen via radio buttons with SLA hints.
 * On success, redirects to the newly created ticket's detail page.
 * The backend auto-assigns the ticket to the machine's engineer.
 */
export function RaiseTicketPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  // Machine data
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [machineId, setMachineId] = useState('')
  const [severity, setSeverity] = useState<TicketSeverity>('P3_medium')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Fetch machines on mount
  useEffect(() => {
    if (!user) return

    getMachinesByRole().then((fetched) => {
      setMachines(fetched)
      setIsLoading(false)

      /* Pre-select machine from query param if provided (from DashboardPage "Raise Ticket" button) */
      const preselected = searchParams.get('machine')
      if (preselected && fetched.some((m) => m.id === Number(preselected))) {
        setMachineId(preselected)
      }
    })
  }, [user, searchParams])

  // Machine dropdown options
  const machineOptions = [
    { value: '', label: 'Select machine...' },
    ...machines.map((m) => ({
      value: String(m.id),
      label: `${m.machine_code} — ${m.machine_name}`,
    })),
  ]

  // Validation
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!machineId) newErrors.machineId = 'Machine is required.'
    if (!category) newErrors.category = 'Category is required.'
    if (!title.trim()) newErrors.title = 'Title is required.'
    if (!description.trim()) newErrors.description = 'Description is required.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const newTicket = await createTicket({
        machine_id: Number(machineId),
        raised_by: user.id,
        severity,
        category: category as TicketCategory,
        title: title.trim(),
        description: description.trim(),
      })

      setToastMessage('Ticket raised successfully')
      setToastType('success')
      setShowToast(true)

      /* Redirect to the new ticket's detail page after brief delay */
      setTimeout(() => {
        navigate(`/tickets/${newTicket.id}`)
      }, 1500)
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to raise ticket')
      setToastType('error')
      setShowToast(true)
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 dark:border-gray-700 border-t-primary-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Raise Ticket</h2>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-5 space-y-5">
        {/* Machine picker */}
        <Select
          label="Machine"
          options={machineOptions}
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          error={errors.machineId}
        />

        {/* Severity radio buttons */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Severity</legend>
          <div className="space-y-2">
            {SEVERITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${severity === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950'}
                `.trim()}
              >
                <input
                  type="radio"
                  name="severity"
                  value={opt.value}
                  checked={severity === opt.value}
                  onChange={() => setSeverity(opt.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{opt.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 ml-2">{opt.sla}</span>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Category */}
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          error={errors.category}
        />

        {/* Title */}
        <Input
          label="Title"
          placeholder="Brief summary of the issue"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
        />

        {/* Description */}
        <TextArea
          label="Description"
          placeholder="Detailed description of the problem..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          rows={4}
        />

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Raise Ticket
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/tickets')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
