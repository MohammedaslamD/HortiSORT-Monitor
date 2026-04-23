import { Link, useLocation } from 'react-router-dom';
import type { UserRole } from '../../types';
import { ThemeToggle } from '../common/ThemeToggle';

interface NavbarProps {
  userName: string;
  userRole: UserRole;
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

/**
 * Top navigation bar with user info, role badge, and logout.
 * Includes hamburger button for mobile sidebar toggle.
 */
export function Navbar({ userName, userRole, onLogout, onToggleSidebar }: NavbarProps) {
  const location = useLocation();

  /** Derive a readable page title from the current path. */
  function getPageTitle(): string {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/machines')) return 'Machines';
    if (path.startsWith('/tickets')) return 'Tickets';
    if (path.startsWith('/logs')) return 'Daily Logs';
    if (path.startsWith('/visits')) return 'Site Visits';
    if (path.startsWith('/admin')) return 'Admin';
    return 'HortiSort';
  }

  const roleBadgeColor: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    engineer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    customer: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Link to="/" className="text-lg font-bold text-primary-600 dark:text-primary-400">
            HortiSort
          </Link>
          <span className="hidden sm:inline text-gray-400 dark:text-gray-600">|</span>
          <h1 className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-400">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right: user info + logout */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeColor[userRole]}`}>
            {userRole}
          </span>
          <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">{userName}</span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Logout"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
