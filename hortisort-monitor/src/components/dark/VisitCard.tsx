import type { ReactNode } from 'react'

interface VisitCardProps {
  /** First line of the header — e.g., "M-003 Pomegranate A — Emergency Repair". */
  title: string
  /** Sub-line of the header — engineer · date · linkage. */
  meta: string
  /** Status badge slot (typically a `<StatBadge variant="...">`). */
  purposeBadge: ReactNode
  /** Free-text findings paragraph. */
  findings: string
  /** Free-text actions-taken paragraph. */
  actions: string
  /** Footer left column — parts replaced or "None". */
  partsReplaced: string
  /** Footer right column — next-visit due-date string. */
  nextVisitDue: string
  /** Optional inline CSS color for `nextVisitDue` (e.g., amber for urgent). */
  nextVisitDueColor?: string
}

/**
 * Phase B visit-card primitive used by `SiteVisitsPage`. Visual
 * reference: `dark-ui-v2.html` lines 646-659. Composition mirrors
 * the mockup exactly: header row (title + meta + badge), body with
 * inline Findings/Actions strongs, and a 2-column stats footer
 * separated by a hairline divider.
 */
export function VisitCard({
  title,
  meta,
  purposeBadge,
  findings,
  actions,
  partsReplaced,
  nextVisitDue,
  nextVisitDueColor,
}: VisitCardProps) {
  return (
    <div className="bg-bg-surface3 border border-line rounded-lg p-3.5 mb-2.5">
      {/* Header */}
      <div className="flex justify-between items-center mb-2 gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-fg-1 truncate">{title}</div>
          <div className="text-[10px] text-fg-5 mt-0.5">{meta}</div>
        </div>
        <div className="shrink-0">{purposeBadge}</div>
      </div>

      {/* Body */}
      <div className="text-[11px] text-fg-3 leading-relaxed">
        <strong className="text-fg-1">Findings:</strong> {findings}
        <br />
        <strong className="text-fg-1">Actions:</strong> {actions}
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-line">
        <div>
          <div className="text-[9px] text-fg-5 uppercase tracking-wider">Parts Replaced</div>
          <div className="text-[11px] text-fg-1 mt-0.5">{partsReplaced}</div>
        </div>
        <div>
          <div className="text-[9px] text-fg-5 uppercase tracking-wider">Next Visit Due</div>
          <div
            className="text-[11px] mt-0.5 text-fg-1"
            style={nextVisitDueColor ? { color: nextVisitDueColor } : undefined}
          >
            {nextVisitDue}
          </div>
        </div>
      </div>
    </div>
  )
}
