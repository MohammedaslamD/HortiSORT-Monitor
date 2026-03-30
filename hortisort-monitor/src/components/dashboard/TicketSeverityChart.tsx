import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { Ticket } from '../../types'

interface TicketSeverityChartProps {
  /** Role-scoped tickets from DashboardPage — no data fetching. */
  tickets: Ticket[]
}

const SEVERITIES = [
  { key: 'P1_critical', label: 'P1' },
  { key: 'P2_high',     label: 'P2' },
  { key: 'P3_medium',   label: 'P3' },
  { key: 'P4_low',      label: 'P4' },
]

/**
 * Grouped bar chart showing ticket counts per severity, coloured by status group.
 * Only rendered for admin and engineer roles (controlled by DashboardPage).
 */
export function TicketSeverityChart({ tickets }: TicketSeverityChartProps) {
  const data = SEVERITIES.map(({ key, label }) => {
    const group = tickets.filter((t) => t.severity === key)
    return {
      severity: label,
      open:     group.filter((t) => t.status === 'open' || t.status === 'reopened').length,
      active:   group.filter((t) => t.status === 'in_progress').length,
      resolved: group.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    }
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ticket Severity</h3>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No tickets available</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="severity" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="open"     name="Open"        fill="#ef4444" />
            <Bar dataKey="active"   name="In Progress" fill="#f97316" />
            <Bar dataKey="resolved" name="Resolved"    fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
