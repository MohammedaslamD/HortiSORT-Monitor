import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PageLayout } from './components/layout/PageLayout'
import { AppRoutes } from './routes/AppRoutes'

/**
 * Maps route path patterns to the title shown in the Topbar.
 * Order matters: longest/specific patterns first (e.g. /machines/123 before /machines).
 */
const PAGE_TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard$/,           'Command Center'],
  [/^\/machines\/\d+$/,       'Machine Detail'],
  [/^\/machines$/,            'Machines'],
  [/^\/tickets\/raise$/,      'Raise Ticket'],
  [/^\/tickets\/\d+$/,        'Ticket Detail'],
  [/^\/tickets$/,             'Tickets'],
  [/^\/update-status\/\d+$/,  'Update Status'],
  [/^\/production$/,          'Production'],
  [/^\/logs$/,                'Daily Logs'],
  [/^\/visits\/log$/,         'Log Site Visit'],
  [/^\/visits$/,              'Site Visits'],
  [/^\/admin$/,               'Users'],
]

function resolvePageTitle(pathname: string): string {
  for (const [pattern, title] of PAGE_TITLES) {
    if (pattern.test(pathname)) return title
  }
  return 'HortiSort Monitor'
}

/**
 * Inner app that decides whether to show the layout shell.
 * LoginPage is rendered without the sidebar/navbar.
 */
function AppContent() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const isLoginRoute = location.pathname === '/login'
  const showLayout = isAuthenticated && user && !isLoginRoute

  if (!showLayout) {
    return <AppRoutes />
  }

  return (
    <PageLayout
      pageTitle={resolvePageTitle(location.pathname)}
      userName={user.name}
      userRole={user.role}
      onLogout={logout}
    >
      <AppRoutes />
    </PageLayout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
