import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../common/ThemeToggle'
import { OperatorConsoleOverlay } from '../dark/OperatorConsoleOverlay'
import { NotificationBell } from '../dark/NotificationBell'

interface TopbarProps {
  pageTitle: string
  onOpenSidebar: () => void
}

/**
 * Top application bar. Holds the split brand mark, a page title fed by route,
 * and trailing controls (theme toggle, Operator Console launcher for engineers
 * and admins; bell + user chip later).
 *
 * On `< lg:` viewports a hamburger button opens the Sidebar drawer.
 */
export function Topbar({ pageTitle, onOpenSidebar }: TopbarProps) {
  const { user } = useAuth()
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)

  // Console is restricted to staff roles; customers don't see the launcher.
  const canOpenConsole = user?.role === 'admin' || user?.role === 'engineer'

  return (
    <>
      <header className="h-14 flex items-center gap-4 px-4 bg-bg-surface1 border-b border-line">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-2 text-fg-3 hover:text-fg-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="flex items-baseline gap-0.5 select-none">
          <span className="text-brand-cyan font-bold text-lg tracking-tight">Horti</span>
          <span className="text-brand-green font-bold text-lg tracking-tight">Sort</span>
        </div>
        <div className="h-6 w-px bg-line hidden sm:block" />
        <h1 className="text-fg-1 font-semibold text-sm sm:text-base truncate">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          {canOpenConsole && (
            <button
              type="button"
              onClick={() => setIsConsoleOpen(true)}
              className="bg-gradient-to-br from-blue-900 to-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow hover:from-blue-800 hover:to-blue-500"
            >
              <span aria-hidden className="mr-1">■</span>
              Operator Console
            </button>
          )}
          {canOpenConsole && <NotificationBell />}
          <ThemeToggle />
        </div>
      </header>

      {canOpenConsole && (
        <OperatorConsoleOverlay
          isOpen={isConsoleOpen}
          onClose={() => setIsConsoleOpen(false)}
        />
      )}
    </>
  )
}
