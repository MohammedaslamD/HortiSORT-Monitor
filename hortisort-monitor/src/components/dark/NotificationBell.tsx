import { useEffect, useRef, useState, useCallback } from 'react'
import { alertService } from '../../services/alertService'
import { formatRelativeTime } from '../../utils/formatters'
import { AlertRow } from './AlertRow'
import type { Alert } from '../../types'

const POLL_MS = 30_000
const MAX_PANEL_ROWS = 8

/** Topbar bell with red unread-count badge and dropdown panel of recent alerts. */
export function NotificationBell() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const next = await alertService.getAlerts()
      setAlerts(next)
    } catch {
      // Swallow — bell stays in last-known state on transient errors.
    }
  }, [])

  // Initial fetch + 30s polling. Pauses when document is hidden so an
  // idle tab does not hammer the (eventually real) backend. The first
  // refresh is deferred via setTimeout(0) so React Compiler does not
  // flag it as a synchronous setState inside an effect.
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0)
    const id = setInterval(() => {
      if (!document.hidden) void refresh()
    }, POLL_MS)
    return () => {
      clearTimeout(initial)
      clearInterval(id)
    }
  }, [refresh])

  // Click-outside to close.
  useEffect(() => {
    if (!isOpen) return
    const onMouseDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [isOpen])

  // Esc to close.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  const unreadCount = alerts.filter(
    (a) => a.severity === 'critical' || a.severity === 'warn',
  ).length
  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)
  const visibleAlerts = alerts.slice(0, MAX_PANEL_ROWS)

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        data-testid="notification-bell"
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg bg-bg-surface3 border border-line flex items-center justify-center text-fg-2 hover:text-fg-1 hover:border-line-strong transition"
      >
        {/* Inline bell SVG keeps rendering consistent across OSes */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-red text-[9px] font-bold text-white flex items-center justify-center border-2 border-bg">
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          data-testid="notification-panel"
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-bg-surface2 border border-line-strong rounded-xl shadow-xl z-[150] p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-fg-1">Notifications</h3>
            <span className="text-[10px] text-fg-4 uppercase tracking-wider">
              {unreadCount} new
            </span>
          </div>

          {visibleAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-fg-4">No notifications</div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleAlerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  timeAgo={formatRelativeTime(alert.created_at)}
                />
              ))}
            </div>
          )}

          {alerts.length > MAX_PANEL_ROWS && (
            <div className="mt-2 pt-2 border-t border-line text-center">
              <span className="text-[11px] text-fg-3">
                Showing {MAX_PANEL_ROWS} of {alerts.length}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
