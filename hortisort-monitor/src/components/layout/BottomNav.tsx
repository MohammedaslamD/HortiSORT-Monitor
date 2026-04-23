import { NavLink } from 'react-router-dom';
import type { UserRole } from '../../types';

interface BottomNavProps {
  userRole: UserRole;
}

interface BottomNavItem {
  label: string;
  to: string;
  icon: string;
  roles?: UserRole[];
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  },
  {
    label: 'Machines',
    to: '/machines',
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    label: 'Tickets',
    to: '/tickets',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    label: 'Logs',
    to: '/logs',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
];

/**
 * Bottom tab navigation bar for mobile devices.
 * Shown only below lg breakpoint (hidden on desktop via PageLayout).
 */
export function BottomNav({ userRole: _userRole }: BottomNavProps) {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 py-1 px-2 text-xs font-medium transition-colors ${
      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
    }`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClasses}>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
