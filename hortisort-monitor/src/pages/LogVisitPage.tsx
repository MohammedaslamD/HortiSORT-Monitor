import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Machine, Ticket, VisitPurpose } from '../types'
import { useAuth } from '../context/AuthContext'
import { getMachinesByRole } from '../services/machineService'
import { getTicketsByMachineId } from '../services/ticketService'
import { logSiteVisit } from '../services/siteVisitService'
import { Button, Input, Select, TextArea, Toast } from '../components/common'
import { SectionCard } from '../components/dark'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const PURPOSE_OPTIONS = [
  { value: '', label: 'Select purpose...' },
  { value: 'routine', label: 'Routine' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'installation', label: 'Installation' },
  { value: 'training', label: 'Training' },
]

/** Ticket statuses that count as "open" for the linked-ticket dropdown. */
const LINKABLE_STATUSES = new Set(['open', 'in_progress', 'reopened'])

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * Form page for logging a new site visit.
 *
 * Accessible to engineers and admins. Machine picker is role-scoped.
 * When purpose is "ticket", a linked-ticket dropdown shows open tickets
 * for the selected machine.
 *
 * On success, redirects to /visits after brief toast.
 */
export function LogVisitPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Reference data
  const [machines, setMachines] = useState<Machine[]>([])
  const [openTickets, setOpenTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form fields
  const [machineId, setMachineId] = useState('')
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10))
  const [purpose, setPurpose] = useState<VisitPurpose | ''>('')
  const [ticketId, setTicketId] = useState('')
  const [findings, setFindings] = useState('')
  const [actionsTaken, setActionsTaken] = useState('')
  const [partsReplaced, setPartsReplaced] = useState('')
  const [nextVisitDue, setNextVisitDue] = useState('')

  // Submission state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Fetch machines on mount
  useEffect(() => {
    if (!user) return

    getMachinesByRole().then((fetched) => {
      setMachines(fetched)
      setIsLoading(false)
    })
  }, [user])

  // Fetch open tickets when machineId changes
  useEffect(() => {
    if (!machineId) {
      setOpenTickets([])
      return
    }

    getTicketsByMachineId(Number(machineId)).then((tickets) => {
      setOpenTickets(tickets.filter((t) => LINKABLE_STATUSES.has(t.status)))
    })
  }, [machineId])

  // Reset linked ticket when purpose changes away from "ticket"
  useEffect(() => {
    if (purpose !== 'ticket') {
      setTicketId('')
    }
  }, [purpose])

  // Machine dropdown options
  const machineOptions = [
    { value: '', label: 'Select machine...' },
    ...machines.map((m) => ({
      value: String(m.id),
      label: `${m.machine_code} — ${m.machine_name}`,
    })),
  ]

  // Linked ticket dropdown options
  const ticketOptions = [
    { value: '', label: 'Select ticket (optional)...' },
    ...openTickets.map((t) => ({
      value: String(t.id),
      label: `${t.ticket_number} — ${t.title}`,
    })),
  ]

  // Validation
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!machineId) newErrors.machineId = 'Machine is required.'
    if (!visitDate) newErrors.visitDate = 'Visit date is required.'
    if (!purpose) newErrors.purpose = 'Purpose is required.'
    if (!findings.trim()) newErrors.findings = 'Findings are required.'
    if (!actionsTaken.trim()) newErrors.actionsTaken = 'Actions taken are required.'

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
      await logSiteVisit({
        machine_id: Number(machineId),
        engineer_id: user.id,
        visit_date: visitDate,
        visit_purpose: purpose as VisitPurpose,
        ticket_id: ticketId ? Number(ticketId) : undefined,
        findings: findings.trim(),
        actions_taken: actionsTaken.trim(),
        parts_replaced: partsReplaced.trim() || undefined,
        next_visit_due: nextVisitDue || undefined,
      })

      setToastMessage('Site visit logged successfully')
      setToastType('success')
      setShowToast(true)

      /* Redirect to visits list after brief delay */
      setTimeout(() => {
        navigate('/visits')
      }, 1500)
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to log site visit')
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-line-strong border-t-brand-cyan" />
          <p className="mt-3 text-sm text-fg-4">Loading...</p>
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
        <h2 className="text-xl font-semibold text-fg-1">Log Site Visit</h2>
      </div>

      {/* Form inside Phase B SectionCard */}
      <SectionCard title="Visit Details">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Machine picker */}
          <Select
            label="Machine"
            options={machineOptions}
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            error={errors.machineId}
          />

          {/* Visit date */}
          <Input
            label="Visit Date"
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            error={errors.visitDate}
          />

          {/* Purpose */}
          <Select
            label="Purpose"
            options={PURPOSE_OPTIONS}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as VisitPurpose | '')}
            error={errors.purpose}
          />

          {/* Linked ticket — only shown when purpose is "ticket" */}
          {purpose === 'ticket' && (
            <div>
              <Select
                label="Linked Ticket"
                options={ticketOptions}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              />
              {!machineId && (
                <p className="mt-1 text-sm text-fg-4">Select a machine first</p>
              )}
              {machineId && openTickets.length === 0 && (
                <p className="mt-1 text-sm text-fg-4">No open tickets for this machine</p>
              )}
            </div>
          )}

          {/* Findings */}
          <TextArea
            label="Findings"
            placeholder="What was observed during the visit..."
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            error={errors.findings}
            rows={3}
          />

          {/* Actions taken */}
          <TextArea
            label="Actions Taken"
            placeholder="What actions were performed..."
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            error={errors.actionsTaken}
            rows={3}
          />

          {/* Parts replaced (optional) */}
          <Input
            label="Parts Replaced"
            placeholder="e.g. Conveyor belt, Sensor unit"
            value={partsReplaced}
            onChange={(e) => setPartsReplaced(e.target.value)}
            helperText="Optional — list any parts replaced during the visit"
          />

          {/* Next visit due (optional) */}
          <Input
            label="Next Visit Due"
            type="date"
            value={nextVisitDue}
            onChange={(e) => setNextVisitDue(e.target.value)}
            helperText="Optional — recommended date for next visit"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Log Visit
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/visits')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
