import { useTheme } from '../../context/ThemeContext'

interface ThemeToggleProps {
  className?: string
}

/**
 * Button that toggles between light and dark theme. Shows a moon icon in
 * light mode (indicating the click target) and a sun icon in dark mode.
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className={`
        inline-flex items-center justify-center h-9 w-9 rounded-md
        text-gray-600 hover:bg-gray-100
        dark:text-gray-300 dark:hover:bg-gray-800
        focus:outline-none focus:ring-2 focus:ring-primary-500
        transition-colors
        ${className}
      `.trim()}
    >
      {isDark ? (
        <svg data-testid="sun-icon" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg data-testid="moon-icon" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
