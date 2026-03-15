import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

import type {
  Ticket,
  Machine,
  TicketComment,
  TicketStatus,
  TicketSeverity,
  TicketCategory,
} from '../types'
import { useAuth } from '../context/AuthContext'
import { getTicketById, getTicketComments, addTicketComment, updateTicketStatus } from '../services/ticketService'
import { getMachineById } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { formatRelativeTime, getSeverityBadgeColor } from '../utils/formatters'
import { Badge, Button, TextArea, Select, Input, Toast } from '../components/common'

// -----------------------------------------------------------------------------
// Badge-color helpers
// -----------------------------------------------------------------------------

/** Map TicketStatus to Badge color. */
function getTicketStatusColor(status: TicketStatus): 'red' | 'yellow' | 'green' | 'gray' {
  const map: Record<TicketStatus, 'red' | 'yellow' | 'green' | 'gray'> = {
    open: 'red',
    in_progress: 'yellow',
    resolved: 'green',
    closed: 'gray',
    reopened: 'red',
  }
  return map[status]
}

/** Map TicketCategory to Badge color. */
function getCategoryColor(category: TicketCategory): 'blue' | 'purple' | 'yellow' | 'red' | 'gray' {
  const map: Record<TicketCategory, 'blue' | 'purple' | 'yellow' | 'red' | 'gray'> = {
    hardware: 'blue',
    software: 'purple',
    sensor: 'yellow',
    electrical: 'red',
    other: 'gray',
  }
  return map[category]
}

/** Format an ISO date string to a readable date. */
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Format minutes to hours + minutes. */
function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Render star rating. */
function renderStars(rating: number): string {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating)
}

// Readable labels
const SEVERITY_LABEL: Record<TicketSeverity, string> = {
  P1_critical: 'P1 Critical',
  P2_high: 'P2 High',
  P3_medium: 'P3 Medium',
  P4_low: 'P4 Low',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  reopened: 'Reopened',
}

const CATEGORY_LABEL: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  sensor: 'Sensor',
  electrical: 'Electrical',
  other: 'Other',
}

/** Status options for the update dropdown. */
const STATUS_UPDATE_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
]

// =============================================================================
// Main component
// =============================================================================

/**
 * Detailed view for a single ticket.
 *
 * Shows ticket info, resolution (when resolved), comment thread with add form,
 * and a status update panel for engineers/admins.
 */
export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Data state
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [machine, setMachine] = useState<Machine | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Comment form
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Status update form
  const [statusUpdateStatus, setStatusUpdateStatus] = useState<TicketStatus>('open')
  const [rootCause, setRootCause] = useState('')
  const [solution, setSolution] = useState('')
  const [partsUsed, setPartsUsed] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Toast
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Fetch ticket + machine + comments
  useEffect(() => {
    if (!user || !id) return

    const ticketId = Number(id)
    if (Number.isNaN(ticketId)) {
      setNotFound(true)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchAll() {
      setIsLoading(true)
      setNotFound(false)

      try {
        const foundTicket = await getTicketById(ticketId)

        if (cancelled) return

        if (!foundTicket) {
          setNotFound(true)
          setIsLoading(false)
          return
        }

        setTicket(foundTicket)
        setStatusUpdateStatus(foundTicket.status)

        const [foundMachine, foundComments] = await Promise.all([
          getMachineById(foundTicket.machine_id),
          getTicketComments(foundTicket.id),
        ])

        if (cancelled) return

        setMachine(foundMachine ?? null)
        setComments(foundComments)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void fetchAll()
    return () => { cancelled = true }
  }, [user, id])

  // Handle add comment
  const handleAddComment = useCallback(async () => {
    if (!ticket || !user || !newComment.trim()) return

    setIsSubmittingComment(true)
    try {
      await addTicketComment({
        ticket_id: ticket.id,
        user_id: user.id,
        message: newComment.trim(),
      })
      /* Re-fetch comments to get latest */
      const refreshed = await getTicketComments(ticket.id)
      setComments(refreshed)
      setNewComment('')
      setToastMessage('Comment added successfully')
      setToastType('success')
      setShowToast(true)
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to add comment')
      setToastType('error')
      setShowToast(true)
    } finally {
      setIsSubmittingComment(false)
    }
  }, [ticket, user, newComment])

  // Handle status update
  const handleStatusUpdate = useCallback(async () => {
    if (!ticket || !user) return

    setIsUpdatingStatus(true)
    try {
      const resolution = statusUpdateStatus === 'resolved'
        ? { root_cause: rootCause, solution, parts_used: partsUsed || undefined }
        : undefined

      const updated = await updateTicketStatus(ticket.id, statusUpdateStatus, resolution)
      setTicket(updated)
      setRootCause('')
      setSolution('')
      setPartsUsed('')
      setToastMessage(`Status updated to ${STATUS_LABEL[statusUpdateStatus]}`)
      setToastType('success')
      setShowToast(true)
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to update status')
      setToastType('error')
      setShowToast(true)
    } finally {
      setIsUpdatingStatus(false)
    }
  }, [ticket, user, statusUpdateStatus, rootCause, solution, partsUsed])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600" />
          <p className="mt-3 text-sm text-gray-500">Loading ticket details...</p>
        </div>
      </div>
    )
  }

  // Not-found state
  if (notFound || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="rounded-full bg-red-100 p-4">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Ticket not found</h2>
        <p className="text-sm text-gray-500">
          The ticket you're looking for doesn't exist or you don't have access to it.
        </p>
        <Link
          to="/tickets"
          className="text-sm font-medium text-primary-600 hover:text-primary-700 underline"
        >
          Back to Tickets
        </Link>
      </div>
    )
  }

  const isEngineerOrAdmin = user?.role === 'engineer' || user?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        &larr; Back
      </button>

      {/* Section 1: Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-gray-400 mb-0.5">{ticket.ticket_number}</p>
            <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge color={getSeverityBadgeColor(ticket.severity)} size="md">
              {SEVERITY_LABEL[ticket.severity]}
            </Badge>
            <Badge color={getTicketStatusColor(ticket.status)} size="md">
              {STATUS_LABEL[ticket.status]}
            </Badge>
          </div>
        </div>

        {/* Section 2: Info grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Machine</span>
            {machine ? (
              <p className="font-medium text-gray-900">
                <Link
                  to={`/machines/${machine.id}`}
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  {machine.machine_code} — {machine.machine_name}
                </Link>
              </p>
            ) : (
              <p className="font-medium text-gray-900">Unknown</p>
            )}
          </div>
          <div>
            <span className="text-gray-500">Category</span>
            <p className="mt-0.5">
              <Badge color={getCategoryColor(ticket.category)} size="sm">
                {CATEGORY_LABEL[ticket.category]}
              </Badge>
            </p>
          </div>
          <div>
            <span className="text-gray-500">Raised By</span>
            <p className="font-medium text-gray-900">{getUserName(ticket.raised_by)}</p>
          </div>
          <div>
            <span className="text-gray-500">Assigned To</span>
            <p className="font-medium text-gray-900">{getUserName(ticket.assigned_to)}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium text-gray-900">{formatDate(ticket.created_at)}</p>
          </div>
          <div>
            <span className="text-gray-500">SLA</span>
            <p className="font-medium text-gray-900">{ticket.sla_hours} hours</p>
          </div>
        </div>
      </div>

      {/* Section 3: Resolution (only if resolved_at set) */}
      {ticket.resolved_at && (
        <div className="bg-green-50 rounded-lg shadow-sm border border-green-200 p-5">
          <h3 className="text-sm font-semibold text-green-800 mb-3">Resolution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-green-700">Resolved At</span>
              <p className="font-medium text-green-900">{formatDate(ticket.resolved_at)}</p>
            </div>
            {ticket.resolution_time_mins !== null && (
              <div>
                <span className="text-green-700">Resolution Time</span>
                <p className="font-medium text-green-900">{formatMinutes(ticket.resolution_time_mins)}</p>
              </div>
            )}
            {ticket.root_cause && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-green-700">Root Cause</span>
                <p className="text-green-900">{ticket.root_cause}</p>
              </div>
            )}
            {ticket.solution && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-green-700">Solution</span>
                <p className="text-green-900">{ticket.solution}</p>
              </div>
            )}
            {ticket.parts_used && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-green-700">Parts Used</span>
                <p className="text-green-900">{ticket.parts_used}</p>
              </div>
            )}
            {ticket.customer_rating !== null && (
              <div>
                <span className="text-green-700">Customer Rating</span>
                <p className="font-medium text-green-900 text-lg">{renderStars(ticket.customer_rating)}</p>
              </div>
            )}
            {ticket.customer_feedback && (
              <div className="col-span-2 sm:col-span-3">
                <span className="text-green-700">Customer Feedback</span>
                <p className="text-green-900">{ticket.customer_feedback}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 4: Comment thread */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">No comments yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {getUserName(comment.user_id)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Section 5: Add comment form */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <TextArea
            label="Add a comment"
            placeholder="Type your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
          />
          <div className="mt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddComment}
              isLoading={isSubmittingComment}
              disabled={!newComment.trim()}
            >
              Add Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Section 6: Status update panel (engineer + admin only) */}
      {isEngineerOrAdmin && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h3>

          <div className="space-y-4">
            <Select
              label="New Status"
              options={STATUS_UPDATE_OPTIONS}
              value={statusUpdateStatus}
              onChange={(e) => setStatusUpdateStatus(e.target.value as TicketStatus)}
            />

            {/* Resolution fields (only when resolving) */}
            {statusUpdateStatus === 'resolved' && (
              <div className="space-y-3 border-t border-gray-200 pt-3">
                <TextArea
                  label="Root Cause"
                  placeholder="Describe the root cause..."
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  rows={2}
                />
                <TextArea
                  label="Solution"
                  placeholder="Describe the solution applied..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={2}
                />
                <Input
                  label="Parts Used"
                  placeholder="List parts used (optional)"
                  value={partsUsed}
                  onChange={(e) => setPartsUsed(e.target.value)}
                />
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleStatusUpdate}
              isLoading={isUpdatingStatus}
            >
              Update Status
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
