import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { DailyLog } from '../../types'

interface ThroughputChartProps {
  /** Daily logs pre-filtered to the last 7 days by DashboardPage. */
  logs: DailyLog[]
}

/** Aggregate tons_processed by date across all machines. */
function aggregateByDate(logs: DailyLog[]): { date: string; tons: number }[] {
  const map = new Map<string, number>()
  for (const log of logs) {
    map.set(log.date, (map.get(log.date) ?? 0) + (log.tons_processed ?? 0))
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tons]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      tons: Math.round(tons * 10) / 10,
    }))
}

/**
 * Area chart showing total tons processed per day over the last 7 days.
 * Receives pre-filtered logs from DashboardPage — no data fetching.
 */
export function ThroughputChart({ logs }: ThroughputChartProps) {
  const data = aggregateByDate(logs)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Throughput — Last 7 Days (tons)</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No throughput data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="throughputGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit=" t" />
            <Tooltip formatter={(value: number | string | readonly (string | number)[] | undefined) => [`${value ?? ''} t`, 'Tons']} />
            <Area
              type="monotone"
              dataKey="tons"
              name="Tons processed"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#throughputGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
