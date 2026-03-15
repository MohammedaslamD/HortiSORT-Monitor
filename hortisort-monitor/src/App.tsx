import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PageLayout } from './components/layout/PageLayout'
import { AppRoutes } from './routes/AppRoutes'

/**
 * Inner app that decides whether to show the layout shell.
 * LoginPage is rendered without the sidebar/navbar.
 */
function AppContent() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const isLoginRoute = location.pathname === '/login'
  const showLayout = isAuthenticated && user && !isLoginRoute

  // Always render AppRoutes in the same tree position to avoid
  // unmount/remount flicker when auth state changes
  if (!showLayout) {
    return <AppRoutes />
  }

  return (
    <PageLayout userName={user.name} userRole={user.role} onLogout={logout}>
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
