import { useState } from 'react';
import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import type { UserRole } from '../../types';

interface PageLayoutProps {
  children: ReactNode;
  userName: string;
  userRole: UserRole;
  onLogout: () => void;
}

/**
 * Main application layout shell.
 * - Navbar at top
 * - Sidebar on left (collapsible on mobile)
 * - Content area (scrollable)
 * - BottomNav on mobile
 */
export function PageLayout({ children, userName, userRole, onLogout }: PageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar
        userName={userName}
        userRole={userRole}
        onLogout={onLogout}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex">
        <Sidebar
          userRole={userRole}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content area */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>

      <BottomNav userRole={userRole} />
    </div>
  );
}
