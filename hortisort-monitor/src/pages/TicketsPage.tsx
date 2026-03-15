import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import type { Ticket, Machine, TicketStatus, TicketSeverity, TicketCategory } from '../types'
import { useAuth } from '../context/AuthContext'
import { getTickets, getTicketsByAssignedTo, getTicketsByRaisedBy, getTicketsByMachineIds } from '../services/ticketService'
import { getMachinesByRole } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { TicketCard } from '../components/tickets'
import { Input, Select, Button } from '../components/common'

// -----------------------------------------------------------------------------
// Filter options
// -----------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'reopened', label: 'Reopened' },
]

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'P1_critical', label: 'P1 Critical' },
  { value: 'P2_high', label: 'P2 High' },
  { value: 'P3_medium', label: 'P3 Medium' },
  { value: 'P4_low', label: 'P4 Low' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'other', label: 'Other' },
]

/**
 * Tickets list page with role-scoped data, search, and status/severity/category filters.
 *
 * - admin: sees all tickets
 * - engineer: sees tickets assigned to or raised by them (deduplicated)
 * - customer: sees tickets for their machines
 */
export function TicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Data state
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [severityFilter, setSeverityFilter] = useState<TicketSeverity | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('')

  // Fetch data on mount, scoped by role
  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const fetchedMachines = await getMachinesByRole(user!.role, user!.id)

        let fetchedTickets: Ticket[]

        if (user!.role === 'admin') {
          fetchedTickets = await getTickets()
        } else if (user!.role === 'engineer') {
          /* Engineer sees tickets assigned to or raised by them */
          const [assigned, raised] = await Promise.all([
            getTicketsByAssignedTo(user!.id),
            getTicketsByRaisedBy(user!.id),
          ])
          const seen = new Set<number>()
          fetchedTickets = []
          for (const t of [...assigned, ...raised]) {
            if (!seen.has(t.id)) {
              seen.add(t.id)
              fetchedTickets.push(t)
            }
          }
        } else {
          /* Customer sees tickets for their machines */
          const machineIds = fetchedMachines.map((m) => m.id)
          fetchedTickets = await getTicketsByMachineIds(machineIds)
        }

        if (cancelled) return

        setMachines(fetchedMachines)
        setTickets(fetchedTickets)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load tickets.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [user])

  // Machine name lookup map
  const machineNameMap: Record<number, string> = {}
  for (const m of machines) {
    machineNameMap[m.id] = `${m.machine_code} — ${m.machine_name}`
  }

  // Client-side filtering
  const filteredTickets = tickets
    .filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (severityFilter && t.severity !== severityFilter) return false
      if (categoryFilter && t.category !== categoryFilter) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matches =
          t.title.toLowerCase().includes(term) ||
          t.ticket_number.toLowerCase().includes(term)
        if (!matches) return false
      }
      return true
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  // Navigation
  const handleTicketClick = useCallback(
    (ticketId: number) => navigate(`/tickets/${ticketId}`),
    [navigate],
  )

  if (!user) return null

  const canRaiseTicket = user.role === 'engineer' || user.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Tickets</h2>
        {canRaiseTicket && (
          <Link to="/tickets/new">
            <Button variant="primary">Raise Ticket</Button>
          </Link>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <>
          {/* Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by title or ticket number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                type="search"
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={SEVERITY_OPTIONS}
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as TicketSeverity | '')}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={CATEGORY_OPTIONS}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | '')}
              />
            </div>
          </div>

          {/* Results or empty state */}
          {filteredTickets.length === 0 ? (
            <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
              <p className="text-gray-500 text-sm">No tickets found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  machineName={machineNameMap[ticket.machine_id] ?? 'Unknown Machine'}
                  assignedToName={getUserName(ticket.assigned_to)}
                  onClick={() => handleTicketClick(ticket.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
