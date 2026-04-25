import { useState } from 'react'
import type { ReactNode } from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import type { UserRole } from '../../types'

interface PageLayoutProps {
  children: ReactNode
  pageTitle: string
  userName: string
  userRole: UserRole
  onLogout: () => void
}

/**
 * Application shell: Topbar + (Sidebar | drawer) + main content area.
 * `userName` and `onLogout` are accepted now and consumed by chunk-9's
 * NotificationBell / user-chip enhancements; they intentionally remain
 * unused here.
 */
export function PageLayout({ children, pageTitle, userRole }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen flex flex-col bg-bg text-fg-2">
      <Topbar pageTitle={pageTitle} onOpenSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar userRole={userRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-w-0 overflow-auto px-5 py-5 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
