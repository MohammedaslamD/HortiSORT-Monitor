import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { Ticket } from '../../types'
import { useTheme } from '../../context/ThemeContext'

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

  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const gridStroke = isDark ? '#374151' : '#e5e7eb'
  const axisStroke = isDark ? '#9ca3af' : '#6b7280'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    color: isDark ? '#f3f4f6' : '#111827',
  }
  const legendStyle = { color: isDark ? '#d1d5db' : '#374151' }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ticket Severity</h3>
      {tickets.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No tickets available</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="severity" tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisStroke }} stroke={axisStroke} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={legendStyle} />
            <Bar dataKey="open"     name="Open"        fill="#ef4444" />
            <Bar dataKey="active"   name="In Progress" fill="#f97316" />
            <Bar dataKey="resolved" name="Resolved"    fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
