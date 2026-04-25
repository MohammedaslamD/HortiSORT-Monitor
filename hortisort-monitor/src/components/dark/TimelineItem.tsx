import type { ActivityIconTone, ActivityEvent } from '../../types'
import { IconTile } from './IconTile'

const ICON_GLYPH: Record<ActivityEvent['type'], string> = {
  ticket: '\u26A0',
  production: '\u2638',
  visit: '\u2691',
  machine: '\u2699',
  user: '\u26FF',
}

const TONE_TO_ICONTILE: Record<ActivityIconTone, 'green' | 'red' | 'amber' | 'blue' | 'cyan' | 'purple'> = {
  red: 'red', green: 'green', blue: 'blue', purple: 'purple', cyan: 'cyan', yellow: 'amber',
}

interface TimelineItemProps {
  event: ActivityEvent
  timeAgo: string
}

/** Activity timeline row with an icon tile and two-line text body. */
export function TimelineItem({ event, timeAgo }: TimelineItemProps) {
  return (
    <div className="flex gap-3 py-2 border-b border-line last:border-b-0">
      <IconTile tone={TONE_TO_ICONTILE[event.icon_tone]}>{ICON_GLYPH[event.type]}</IconTile>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-fg-1 truncate">{event.title}</div>
        <div className="text-[10px] text-fg-4">{event.meta} {'\u00B7'} {timeAgo}</div>
      </div>
    </div>
  )
}
