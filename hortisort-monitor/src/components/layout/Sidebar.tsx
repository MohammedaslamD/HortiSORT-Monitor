import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types'

interface SidebarProps {
  userRole: UserRole
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  to: string
  label: string
  roles?: UserRole[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    label: 'OVERVIEW',
    items: [{ to: '/dashboard', label: 'Dashboard' }],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/machines', label: 'Machines' },
      { to: '/tickets', label: 'Tickets' },
      { to: '/production', label: 'Production', roles: ['engineer', 'admin'] },
      { to: '/logs', label: 'Daily Logs' },
      { to: '/visits', label: 'Site Visits', roles: ['engineer', 'admin'] },
    ],
  },
  {
    label: 'ADMIN',
    items: [{ to: '/admin', label: 'Users', roles: ['admin'] }],
  },
]

/**
 * Sectioned sidebar navigation. Persistent on `lg:`, drawer on smaller screens.
 * Active nav item gets a cyan left border and tinted background.
 */
export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-40 w-52 bg-bg-surface1 border-r border-line',
          'flex flex-col py-4 transition-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {SECTIONS.map((section) => {
          const visible = section.items.filter((it) => !it.roles || it.roles.includes(userRole))
          if (visible.length === 0) return null
          return (
            <div key={section.label} className="mb-4">
              <div className="px-4 mb-2 text-[10px] font-semibold tracking-widest text-fg-6">
                {section.label}
              </div>
              <nav className="flex flex-col">
                {visible.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        'px-4 py-2 text-sm border-l-2 transition-colors',
                        isActive
                          ? 'border-brand-cyan text-fg-1 bg-brand-cyan/10'
                          : 'border-transparent text-fg-3 hover:text-fg-1 hover:bg-bg-surface3',
                      ].join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          )
        })}
      </aside>
    </>
  )
}
