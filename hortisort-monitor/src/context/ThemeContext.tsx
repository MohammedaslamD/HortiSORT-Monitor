import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const THEME_STORAGE_KEY = 'hortisort.theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage may be unavailable (SSR, privacy mode)
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyThemeClass(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * Provides theme state to the component tree. Reads initial theme from
 * localStorage, falls back to the OS `prefers-color-scheme` media query, then
 * to 'light'. Persists every change to localStorage and syncs across tabs via
 * the `storage` event.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readInitialTheme())

  // Keep the <html> class in sync whenever theme changes.
  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme): void => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // ignore persistence failures
    }
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback((): void => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // ignore persistence failures
      }
      return next
    })
  }, [])

  // Cross-tab sync: respond to writes from other tabs.
  useEffect(() => {
    function handleStorage(event: StorageEvent): void {
      if (event.key !== THEME_STORAGE_KEY) return
      if (event.newValue === 'light' || event.newValue === 'dark') {
        setThemeState(event.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme state and actions. Must be used within a ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
