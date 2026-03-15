import type { SiteVisit, VisitPurpose } from '../../types'
import { Badge } from '../common/Badge'

interface SiteVisitCardProps {
  visit: SiteVisit
  machineName: string
  machineCode: string
  engineerName: string
}

/** Map VisitPurpose to Badge color. */
function getPurposeColor(purpose: VisitPurpose): 'green' | 'yellow' | 'blue' | 'purple' {
  const map: Record<VisitPurpose, 'green' | 'yellow' | 'blue' | 'purple'> = {
    routine: 'green',
    ticket: 'yellow',
    installation: 'blue',
    training: 'purple',
  }
  return map[purpose]
}

/** Readable purpose labels. */
const PURPOSE_LABEL: Record<VisitPurpose, string> = {
  routine: 'Routine',
  ticket: 'Ticket',
  installation: 'Installation',
  training: 'Training',
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
 * Card displaying a single site visit record.
 *
 * Shows visit date, purpose badge, machine code/name, engineer name,
 * truncated findings/actions, parts replaced, and next visit due.
 */
export function SiteVisitCard({
  visit,
  machineName,
  machineCode,
  engineerName,
}: SiteVisitCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Top row: date + purpose badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <span className="text-sm font-medium text-gray-900">{formatDate(visit.visit_date)}</span>
        <Badge color={getPurposeColor(visit.visit_purpose)} size="sm">
          {PURPOSE_LABEL[visit.visit_purpose]}
        </Badge>
      </div>

      {/* Machine code + name */}
      <p className="text-sm mb-1">
        <span className="font-mono text-xs text-gray-400 mr-1">{machineCode}</span>
        <span className="font-semibold text-gray-900">{machineName}</span>
      </p>

      {/* Engineer */}
      <p className="text-xs text-gray-500 mb-2">Engineer: {engineerName}</p>

      {/* Findings + Actions */}
      <div className="space-y-1 text-sm mb-2">
        <p className="text-gray-700">
          <span className="font-medium">Findings: </span>
          {truncate(visit.findings, 80)}
        </p>
        <p className="text-gray-700">
          <span className="font-medium">Actions: </span>
          {truncate(visit.actions_taken, 80)}
        </p>
      </div>

      {/* Optional: parts replaced + next visit */}
      {visit.parts_replaced && (
        <p className="text-xs text-gray-500">Parts: {visit.parts_replaced}</p>
      )}
      {visit.next_visit_due && (
        <p className="text-xs text-gray-500">Next visit: {formatDate(visit.next_visit_due)}</p>
      )}
    </div>
  )
}
