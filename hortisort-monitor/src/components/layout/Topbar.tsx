import { ThemeToggle } from '../common/ThemeToggle'

interface TopbarProps {
  pageTitle: string
  onOpenSidebar: () => void
}

/**
 * Top application bar. Holds the split brand mark, a page title fed by route,
 * and trailing controls (theme toggle today; bell + console + user chip later).
 * On `< lg:` viewports a hamburger button opens the Sidebar drawer.
 */
export function Topbar({ pageTitle, onOpenSidebar }: TopbarProps) {
  return (
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
        <ThemeToggle />
      </div>
    </header>
  )
}
