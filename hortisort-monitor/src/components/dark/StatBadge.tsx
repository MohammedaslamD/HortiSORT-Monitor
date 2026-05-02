import type { ReactNode } from 'react'

export type StatBadgeVariant =
  | 'running' | 'idle' | 'down' | 'offline' | 'live'
  | 'critical' | 'high' | 'medium' | 'low'
  | 'open' | 'inprog' | 'resolved' | 'completed'
  | 'admin' | 'engineer' | 'customer'
  | 'notrun' | 'maintenance'

interface StatBadgeProps {
  variant: StatBadgeVariant
  children: ReactNode
}

const toneClasses: Record<StatBadgeVariant, string> = {
  running:   'bg-green-500/15 text-green-400 border border-green-500/30',
  idle:      'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  down:      'bg-red-500/15 text-red-400 border border-red-500/30',
  offline:   'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  live:      'bg-green-500/15 text-green-400 border border-green-500/30 uppercase',
  critical:  'bg-red-500/15 text-red-400 border border-red-500/30',
  high:      'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  medium:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  low:       'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  open:      'bg-red-500/15 text-red-400 border border-red-500/30',
  inprog:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  resolved:  'bg-green-500/15 text-green-400 border border-green-500/30',
  completed: 'bg-green-500/15 text-green-400 border border-green-500/30',
  admin:     'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  engineer:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  customer:  'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  notrun:    'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  maintenance: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}

/**
 * Pill-shaped status badge used across tables, alert rows, and lists.
 * 17/21 spec variants today; extend as future chunks need.
 */
export function StatBadge({ variant, children }: StatBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${toneClasses[variant]}`}>
      {children}
    </span>
  )
}
