import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MachineStats } from '../../types'
import { useTheme } from '../../context/ThemeContext'

interface MachineStatusChartProps {
  /** Full unfiltered fleet stats — not affected by dashboard search/filter. */
  stats: MachineStats
}

const STATUS_COLORS: Record<string, string> = {
  running: '#22c55e',
  idle:    '#eab308',
  down:    '#ef4444',
  offline: '#94a3b8',
}

/**
 * Donut chart showing the breakdown of machine statuses across the fleet.
 * Receives pre-derived stats from DashboardPage — no data fetching.
 */
export function MachineStatusChart({ stats }: MachineStatusChartProps) {
  const data = [
    { name: 'Running', value: stats.running },
    { name: 'Idle',    value: stats.idle },
    { name: 'Down',    value: stats.down },
    { name: 'Offline', value: stats.offline },
  ].filter((d) => d.value > 0)

  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    color: isDark ? '#f3f4f6' : '#111827',
  }
  const legendStyle = { color: isDark ? '#d1d5db' : '#374151' }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Machine Status</h3>
      {stats.total === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No machines available</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name.toLowerCase()] ?? '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string | readonly (string | number)[] | undefined) => [`${value ?? ''}`, 'Machines']} />
            <Legend wrapperStyle={legendStyle} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
