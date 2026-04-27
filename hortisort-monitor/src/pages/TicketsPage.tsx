import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import type { TicketRow, TicketStats, TicketSeverity, TicketStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { liveTicketsService } from '../services/liveTicketsService'
import { Button } from '../components/common'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
  severityToBadgeVariant,
  ticketStatusToBadgeVariant,
} from '../components/dark'
import { formatRelative } from '../utils/formatRelative'

const SEVERITY_LABEL: Record<TicketSeverity, string> = {
  P1_critical: 'P1 Critical',
  P2_high:     'P2 High',
  P3_medium:   'P3 Medium',
  P4_low:      'P4 Low',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  closed:      'Closed',
  reopened:    'Reopened',
}

const COLUMNS = [
  { key: 'ticket',   label: 'Ticket' },
  { key: 'machine',  label: 'Machine' },
  { key: 'issue',    label: 'Issue' },
  { key: 'severity', label: 'Severity' },
  { key: 'status',   label: 'Status' },
  { key: 'assigned', label: 'Assigned To' },
  { key: 'created',  label: 'Created' },
  { key: 'actions',  label: 'Actions' },
]

/** Phase-B Tickets page — dense dark table per dark-ui-v2.html lines 548-569. */
export function TicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [rows, setRows] = useState<TicketRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      liveTicketsService.getTicketStats(),
      liveTicketsService.getTicketRows(),
    ]).then(([s, r]) => {
      if (cancelled) return
      setStats(s)
      setRows(r)
    })
    return () => { cancelled = true }
  }, [])

  if (!user) return null

  const canRaiseTicket = user.role === 'engineer' || user.role === 'admin'

  const tableRows = (rows ?? []).map((r) => {
    const isClosed = r.status === 'resolved' || r.status === 'closed'
    return {
      id: r.id,
      cells: [
        r.ticket_number,
        r.machine_code,
        r.title,
        <StatBadge key="sev" variant={severityToBadgeVariant(r.severity)}>
          {SEVERITY_LABEL[r.severity]}
        </StatBadge>,
        <StatBadge key="st" variant={ticketStatusToBadgeVariant(r.status)}>
          {STATUS_LABEL[r.status]}
        </StatBadge>,
        r.assigned_to_name,
        formatRelative(r.created_at),
        <Button key="a" size="xs" variant="ghost" onClick={() => navigate(`/tickets/${r.id}`)}>
          {isClosed ? 'View' : 'Update'}
        </Button>,
      ],
    }
  })

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg-1">Tickets</h1>
          <p className="text-sm text-fg-4">Maintenance and fault tracking</p>
        </div>
        {canRaiseTicket && (
          <Link to="/tickets/new">
            <Button variant="primary">+ Raise Ticket</Button>
          </Link>
        )}
      </header>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard accent="red"    label="Open"           value={stats.open}            valueColor="#f87171" icon={<>{'\u2691'}</>} dot="red" />
          <StatCard accent="blue"   label="In Progress"    value={stats.in_progress}     valueColor="#60a5fa" icon={<>{'\u2699'}</>} />
          <StatCard accent="green"  label="Resolved Today" value={stats.resolved_today}  valueColor="#4ade80" icon={<>{'\u2714'}</>} />
          <StatCard accent="purple" label="Avg Resolution" value={<>{stats.avg_resolution_hours}<span className="text-sm"> h</span></>} valueColor="#a78bfa" icon={<>{'\u23F1'}</>} />
        </div>
      )}

      <SectionCard title="All Tickets">
        {rows === null ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading...</p>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950">
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">No tickets found.</p>
          </div>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
