import type { ActivityLog, EntityType } from '../../types'
import { Badge } from '../common/Badge'
import { formatRelativeTime } from '../../utils/formatters'
import { getUserName } from '../../utils/userLookup'

interface ActivityFeedProps {
  activities: ActivityLog[]
}

/** Maps entity_type to Badge color. */
const ENTITY_COLOR_MAP: Record<EntityType, 'blue' | 'yellow' | 'purple'> = {
  machine: 'blue',
  ticket: 'yellow',
  user: 'purple',
}

/** Formats a snake_case action string for display — replaces underscores with spaces and capitalizes first letter. */
function formatAction(action: string): string {
  const spaced = action.replaceAll('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Vertical timeline of recent activity log entries.
 * Each entry shows: relative time, user name, formatted action, entity type badge.
 */
export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
        <p className="text-gray-500 text-sm">No recent activity.</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activities.map((entry, index) => (
        <div
          key={entry.id}
          className={`flex items-start gap-3 py-3 ${
            index < activities.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          {/* Timeline dot */}
          <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900">
                {getUserName(entry.user_id)}
              </span>
              <Badge color={ENTITY_COLOR_MAP[entry.entity_type]} size="sm">
                {entry.entity_type}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 mt-0.5">
              {formatAction(entry.action)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatRelativeTime(entry.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
