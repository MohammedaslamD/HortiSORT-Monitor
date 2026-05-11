import type { DailyLog, DailyLogStatus } from '../../types'
import { Badge } from '../common/Badge'

interface DailyLogCardProps {
  log: DailyLog
  machineName: string
  machineCode: string
  recordedByName: string
}

/** Map DailyLogStatus to Badge color. */
function getLogStatusColor(status: DailyLogStatus): 'green' | 'red' | 'yellow' {
  const map: Record<DailyLogStatus, 'green' | 'red' | 'yellow'> = {
    running: 'green',
    not_running: 'red',
    maintenance: 'yellow',
  }
  return map[status]
}

/** Readable status labels. */
const STATUS_LABEL: Record<DailyLogStatus, string> = {
  running: 'Running',
  not_running: 'Not Running',
  maintenance: 'Maintenance',
}

/** Format an ISO date string to a readable date. */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Truncate text to a max length with ellipsis. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + '...'
}

/**
 * Card displaying a single daily log entry.
 *
 * Shows date, machine code/name, status badge, fruit type, tons processed,
 * shift times, truncated notes, and who recorded it.
 */
export function DailyLogCard({
  log,
  machineName,
  machineCode,
  recordedByName,
}: DailyLogCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      {/* Top row: date, machine code, status badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(log.date)}</span>
          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{machineCode}</span>
        </div>
        <Badge color={getLogStatusColor(log.status)} size="sm">
          {STATUS_LABEL[log.status]}
        </Badge>
      </div>

      {/* Machine name */}
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{machineName}</p>

      {/* Info: fruit type, tons, shift */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-2">
        {log.fruit_type && <span>Fruit: {log.fruit_type}</span>}
        {log.tons_processed > 0 && <span>{log.tons_processed} t</span>}
        <span>{log.shift_start} – {log.shift_end}</span>
      </div>

      {/* Notes (truncated) */}
      {log.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">{truncate(log.notes, 80)}</p>
      )}

      {/* Footer: recorded by */}
      <p className="text-xs text-gray-400 dark:text-gray-500">Recorded by: {recordedByName}</p>
    </div>
  )
}
