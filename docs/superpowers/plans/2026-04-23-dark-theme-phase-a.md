# Dark Theme Phase A Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark-theme foundation (Tailwind `darkMode: 'class'` + `ThemeContext` + `ThemeToggle`) and apply `dark:` variants to every existing component and page so the whole app works in both themes with a user-controlled toggle.

**Architecture:** A `ThemeProvider` wraps `<App/>` and manages a `'light' | 'dark'` state, synced to `localStorage` and to the `dark` class on `<html>`. A pre-hydration script in `index.html` sets the class before React mounts to avoid FOUC. Existing components get `dark:*` Tailwind variants on every surface/text/border utility. No service, type, or backend changes.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS v3, Vitest 4 + React Testing Library, happy-dom.

**Spec:** `docs/superpowers/specs/2026-04-23-dark-theme-phase-a-design.md`

**Working directory:** All commands run from `hortisort-monitor/` unless noted.

**Code style reminders:**
- No semicolons in new code (see `AGENTS.md`).
- Named exports only; no default exports.
- `import type` for type-only imports (`verbatimModuleSyntax` is on).
- TDD: Red → Green → Refactor → Commit.
- After each task: run the affected test file, then `npm run test:run` before committing.

---

## Chunk 1: Theme infrastructure (config, context, toggle)

### Task 1: Enable Tailwind dark mode

**Files:**
- Modify: `hortisort-monitor/tailwind.config.js`

- [ ] **Step 1: Add `darkMode: 'class'` to the config**

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // ...unchanged
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

- [ ] **Step 2: Verify build still works**

Run: `npm run build`
Expected: success, no errors.

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/tailwind.config.js
git commit -m "build: enable Tailwind class-based dark mode"
```

---

### Task 2: Add pre-hydration theme script to `index.html`

**Files:**
- Modify: `hortisort-monitor/index.html`

- [ ] **Step 1: Insert the pre-hydration script inside `<head>` before the module script**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>hortisort-monitor</title>
    <script>
      (function () {
        try {
          var stored = localStorage.getItem('hortisort.theme')
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          var theme = stored || (prefersDark ? 'dark' : 'light')
          if (theme === 'dark') document.documentElement.classList.add('dark')
        } catch (e) {}
      })()
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Verify dev server still boots**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/index.html
git commit -m "feat: add pre-hydration theme script to prevent FOUC"
```

---

### Task 3: `ThemeContext` — write failing tests (RED)

**Files:**
- Create: `hortisort-monitor/src/context/__tests__/ThemeContext.test.tsx`

- [ ] **Step 1: Write the test file with all nine cases from spec §7.1**

```tsx
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from '../ThemeContext'

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to light when no storage and system is light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('defaults to dark when system prefers dark and no storage', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
  })

  it('prefers localStorage value over system preference', () => {
    mockMatchMedia(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('light')
  })

  it('toggleTheme flips light to dark and back', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('dark')
    act(() => { result.current.toggleTheme() })
    expect(result.current.theme).toBe('light')
  })

  it('setTheme("dark") adds dark class to documentElement', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.setTheme('dark') })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('setTheme("light") removes dark class from documentElement', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.setTheme('light') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('setTheme persists to localStorage under hortisort.theme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => { result.current.setTheme('dark') })
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('reacts to storage events from another tab', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: THEME_STORAGE_KEY,
        newValue: 'dark',
      }))
    })
    expect(result.current.theme).toBe('dark')
  })

  it('useTheme throws when used outside ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useTheme())).toThrow(
      /useTheme must be used within a ThemeProvider/,
    )
    spy.mockRestore()
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npx vitest run src/context/__tests__/ThemeContext.test.tsx`
Expected: all 9 FAIL with "Cannot find module '../ThemeContext'".

---

### Task 4: `ThemeContext` — minimum implementation (GREEN)

**Files:**
- Create: `hortisort-monitor/src/context/ThemeContext.tsx`

- [ ] **Step 1: Implement the provider + hook**

```tsx
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
      // ignore
    }
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback((): void => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Cross-tab sync.
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

/** Hook to access theme state and actions. Must be used within a ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

- [ ] **Step 2: Run tests, confirm all pass**

Run: `npx vitest run src/context/__tests__/ThemeContext.test.tsx`
Expected: 9 PASS.

- [ ] **Step 3: Run full test suite to confirm no regressions**

Run: `npm run test:run`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/context/ThemeContext.tsx hortisort-monitor/src/context/__tests__/ThemeContext.test.tsx
git commit -m "feat: add ThemeContext with localStorage persistence and cross-tab sync"
```

---

### Task 5: Mount `ThemeProvider` in `main.tsx`

**Files:**
- Modify: `hortisort-monitor/src/main.tsx`

- [ ] **Step 1: Wrap `<App/>`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Run full test suite + build**

Run: `npm run test:run && npm run build`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add hortisort-monitor/src/main.tsx
git commit -m "feat: mount ThemeProvider at app root"
```

---

### Task 6: `ThemeToggle` — failing tests (RED)

**Files:**
- Create: `hortisort-monitor/src/components/common/__tests__/ThemeToggle.test.tsx`

- [ ] **Step 1: Write tests**

```tsx
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../../test/utils'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('shows moon icon and "Switch to dark theme" label when theme is light', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(button.querySelector('[data-testid="moon-icon"]')).toBeInTheDocument()
  })

  it('shows sun icon and "Switch to light theme" label when theme is dark', () => {
    localStorage.setItem('hortisort.theme', 'dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /switch to light theme/i })
    expect(button.querySelector('[data-testid="sun-icon"]')).toBeInTheDocument()
  })

  it('toggles theme on click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await user.click(screen.getByRole('button', { name: /switch to dark theme/i }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
```

- [ ] **Step 2: Verify `src/test/utils.tsx` already wraps with providers**

Open `src/test/utils.tsx`. If it does NOT wrap with `ThemeProvider`, update it so theme-dependent components work in tests:

```tsx
// inside the AllProviders wrapper, add:
import { ThemeProvider } from '../context/ThemeContext'
// ...
<ThemeProvider>
  {/* existing wrappers */}
</ThemeProvider>
```

- [ ] **Step 3: Run tests, confirm they fail**

Run: `npx vitest run src/components/common/__tests__/ThemeToggle.test.tsx`
Expected: FAIL with "Cannot find module '../ThemeToggle'".

---

### Task 7: `ThemeToggle` — implementation (GREEN)

**Files:**
- Create: `hortisort-monitor/src/components/common/ThemeToggle.tsx`
- Modify: `hortisort-monitor/src/components/common/index.ts`

- [ ] **Step 1: Implement component**

```tsx
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
```

- [ ] **Step 2: Export from barrel**

Add to `src/components/common/index.ts`:

```ts
export { ThemeToggle } from './ThemeToggle'
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/components/common/__tests__/ThemeToggle.test.tsx`
Expected: 3 PASS.

- [ ] **Step 4: Run full test suite**

Run: `npm run test:run`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add hortisort-monitor/src/components/common/ThemeToggle.tsx hortisort-monitor/src/components/common/__tests__/ThemeToggle.test.tsx hortisort-monitor/src/components/common/index.ts hortisort-monitor/src/test/utils.tsx
git commit -m "feat: add ThemeToggle common component"
```

---

## Chunk 2: Dark variants on common components

> For each component in this chunk: open the file, add `dark:*` Tailwind variants on every surface/text/border utility per the palette table in spec §6.4. Preserve existing light classes. No behaviour change. If a component test asserts exact class strings, update it.

### Task 8: Add dark variants to `Button`

**Files:**
- Modify: `hortisort-monitor/src/components/common/Button.tsx`
- Modify (if needed): `hortisort-monitor/src/components/common/__tests__/Button.test.tsx`

- [ ] **Step 1: Update `variantClasses`**

```ts
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 dark:focus:ring-offset-gray-900',
  secondary:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-900',
  danger:
    'bg-danger text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-400 dark:focus:ring-offset-gray-900',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900',
}
```

- [ ] **Step 2: Run Button tests**

Run: `npx vitest run src/components/common/__tests__/Button.test.tsx`
Expected: all PASS. If any fail because of exact class-string assertions, loosen the assertion (`toContain` instead of `toBe`) rather than removing the dark class.

- [ ] **Step 3: Run full suite**

Run: `npm run test:run`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/components/common/Button.tsx hortisort-monitor/src/components/common/__tests__/Button.test.tsx
git commit -m "feat: add dark variants to Button"
```

---

### Task 9: Add dark variants to `Badge`

**Files:**
- Modify: `hortisort-monitor/src/components/common/Badge.tsx`
- Modify (if needed): `src/components/common/__tests__/Badge.test.tsx`

- [ ] **Step 1: For each colour variant, add a dark counterpart using `bg-{color}-900/30 text-{color}-300` pattern**

Example for a success badge:
- Light: `bg-green-100 text-green-800`
- Dark:  `dark:bg-green-900/30 dark:text-green-300`

Apply the pattern across all variants (info/success/warning/danger/neutral).

- [ ] **Step 2: Run Badge tests, fix class-string assertions if any**

Run: `npx vitest run src/components/common/__tests__/Badge.test.tsx`
Expected: all PASS.

- [ ] **Step 3: Run full suite**

Run: `npm run test:run`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/components/common/Badge.tsx hortisort-monitor/src/components/common/__tests__/Badge.test.tsx
git commit -m "feat: add dark variants to Badge"
```

---

### Task 10: Add dark variants to `Card`

**Files:**
- Modify: `hortisort-monitor/src/components/common/Card.tsx`
- Modify (if needed): `src/components/common/__tests__/Card.test.tsx`

- [ ] **Step 1: Update surface/text/border classes**

Replace (conceptually):
- `bg-white` → `bg-white dark:bg-gray-900`
- `border-gray-200` → `border-gray-200 dark:border-gray-800`
- `text-gray-900` → `text-gray-900 dark:text-gray-100`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`

- [ ] **Step 2: Run Card tests**

Run: `npx vitest run src/components/common/__tests__/Card.test.tsx`
Expected: all PASS.

- [ ] **Step 3: Full suite**

Run: `npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/components/common/Card.tsx hortisort-monitor/src/components/common/__tests__/Card.test.tsx
git commit -m "feat: add dark variants to Card"
```

---

### Task 11: Add dark variants to `Input`, `Select`, `TextArea`

**Files:**
- Modify: `hortisort-monitor/src/components/common/{Input,Select,TextArea}.tsx`
- Modify (if needed): corresponding tests in `src/components/common/__tests__/`

- [ ] **Step 1: For each form field, apply**

- Field bg: `bg-white dark:bg-gray-900`
- Field border: `border-gray-300 dark:border-gray-700`
- Field text: `text-gray-900 dark:text-gray-100`
- Placeholder: `placeholder-gray-400 dark:placeholder-gray-500`
- Label text: `text-gray-700 dark:text-gray-300`
- Help text: `text-gray-500 dark:text-gray-400`
- Error text: `text-danger dark:text-red-400`
- Disabled bg: `disabled:bg-gray-100 dark:disabled:bg-gray-800`

- [ ] **Step 2: Run each component's tests**

```bash
npx vitest run src/components/common/__tests__/Input.test.tsx
npx vitest run src/components/common/__tests__/Select.test.tsx
npx vitest run src/components/common/__tests__/TextArea.test.tsx
```

Expected: all PASS.

- [ ] **Step 3: Full suite**

Run: `npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/components/common/Input.tsx hortisort-monitor/src/components/common/Select.tsx hortisort-monitor/src/components/common/TextArea.tsx hortisort-monitor/src/components/common/__tests__/Input.test.tsx hortisort-monitor/src/components/common/__tests__/Select.test.tsx hortisort-monitor/src/components/common/__tests__/TextArea.test.tsx
git commit -m "feat: add dark variants to form field components"
```

---

### Task 12: Add dark variants to `Modal`

**Files:**
- Modify: `hortisort-monitor/src/components/common/Modal.tsx`
- Modify (if needed): `src/components/common/__tests__/Modal.test.tsx`

- [ ] **Step 1: Apply**

- Backdrop: unchanged (`bg-black/50` reads on both themes)
- Dialog surface: `bg-white dark:bg-gray-800` (elevated)
- Header border: `border-gray-200 dark:border-gray-700`
- Title: `text-gray-900 dark:text-gray-100`
- Close icon button: `text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300`

- [ ] **Step 2: Run Modal tests**

Run: `npx vitest run src/components/common/__tests__/Modal.test.tsx`
Expected: all PASS.

- [ ] **Step 3: Full suite**

Run: `npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/components/common/Modal.tsx hortisort-monitor/src/components/common/__tests__/Modal.test.tsx
git commit -m "feat: add dark variants to Modal"
```

---

### Task 13: Add dark variants to `Toast`

**Files:**
- Modify: `hortisort-monitor/src/components/common/Toast.tsx`
- Modify (if needed): `src/components/common/__tests__/Toast.test.tsx`

- [ ] **Step 1: For each toast variant (info/success/warning/error), add dark counterpart**

Use the same `bg-{c}-900/40 text-{c}-200 border-{c}-800` pattern.

- [ ] **Step 2: Tests**

Run: `npx vitest run src/components/common/__tests__/Toast.test.tsx`

- [ ] **Step 3: Full suite**

Run: `npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/components/common/Toast.tsx hortisort-monitor/src/components/common/__tests__/Toast.test.tsx
git commit -m "feat: add dark variants to Toast"
```

---

## Chunk 3: Dark variants on layout and feature components

### Task 14: Dark variants on layout shell + mount `ThemeToggle`

**Files:**
- Modify: `hortisort-monitor/src/components/layout/Navbar.tsx`
- Modify: `hortisort-monitor/src/components/layout/Sidebar.tsx`
- Modify: `hortisort-monitor/src/components/layout/PageLayout.tsx`
- Modify: `hortisort-monitor/src/components/layout/BottomNav.tsx`
- Modify (if needed): corresponding tests in `src/components/layout/__tests__/`

- [ ] **Step 1: Apply palette per §6.4**

- Page bg in `PageLayout`: `bg-gray-50 dark:bg-gray-950`
- Navbar surface: `bg-white dark:bg-gray-900` + bottom border `dark:border-gray-800`
- Sidebar surface: `bg-white dark:bg-gray-900` + `dark:border-gray-800`
- Sidebar nav item hover: `hover:bg-gray-100 dark:hover:bg-gray-800`
- Sidebar active item: keep primary; ensure text contrast (`text-primary-700 dark:text-primary-300`)
- BottomNav: `bg-white dark:bg-gray-900` + icon text `dark:text-gray-400`

- [ ] **Step 2: Mount `<ThemeToggle />` in Navbar (desktop) near the user menu, and in Sidebar footer for mobile**

- [ ] **Step 3: Run layout tests**

```bash
npx vitest run src/components/layout/__tests__
```

- [ ] **Step 4: Full suite**

Run: `npm run test:run`

- [ ] **Step 5: Commit**

```bash
git add hortisort-monitor/src/components/layout/
git commit -m "feat: dark variants on layout shell; mount ThemeToggle in Navbar and Sidebar"
```

---

### Task 15: Dark variants on dashboard + machines feature components

**Files:**
- Modify: `hortisort-monitor/src/components/dashboard/StatsCards.tsx`
- Modify: `hortisort-monitor/src/components/dashboard/ThroughputChart.tsx`
- Modify: any other files in `src/components/dashboard/`
- Modify: `hortisort-monitor/src/components/machines/MachineCard.tsx`
- Modify (if needed): corresponding tests

- [ ] **Step 1: StatsCards / MachineCard — apply palette per §6.4**

- [ ] **Step 2: ThroughputChart — theme-aware Recharts colours**

Inside the component:

```tsx
import { useTheme } from '../../context/ThemeContext'

// inside the component body
const { theme } = useTheme()
const isDark = theme === 'dark'
const gridStroke = isDark ? '#374151' : '#e5e7eb'
const axisStroke = isDark ? '#9ca3af' : '#6b7280'
const tooltipStyle = {
  backgroundColor: isDark ? '#1f2937' : '#ffffff',
  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
  color: isDark ? '#f3f4f6' : '#111827',
}
```

Pass to `<CartesianGrid stroke={gridStroke} />`, `<XAxis stroke={axisStroke} />`, `<YAxis stroke={axisStroke} />`, `<Tooltip contentStyle={tooltipStyle} />`.

- [ ] **Step 3: Run feature tests**

```bash
npx vitest run src/components/dashboard/__tests__
npx vitest run src/components/machines/__tests__
```

- [ ] **Step 4: Full suite**

Run: `npm run test:run`

- [ ] **Step 5: Commit**

```bash
git add hortisort-monitor/src/components/dashboard/ hortisort-monitor/src/components/machines/
git commit -m "feat: dark variants on dashboard and machine components"
```

---

## Chunk 4: Dark variants on pages + verification

### Task 16: Dark variants on every page

**Files:**
- Modify: every file under `hortisort-monitor/src/pages/*.tsx`
- Modify (if needed): corresponding tests

Pages to cover (verify list against `src/pages/`): LoginPage, DashboardPage, MachineDetailPage, DailyLogsPage, SiteVisitsPage, AdminPage, UpdateStatusPage, ProductionPage, plus any others in the folder.

- [ ] **Step 1: For each page, add `dark:*` variants on any inline Tailwind classes on backgrounds, text, borders, dividers, table rows**

Use the palette table in spec §6.4.

- [ ] **Step 2: Run all page tests**

```bash
npx vitest run src/pages
```

- [ ] **Step 3: Full suite**

Run: `npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/pages/
git commit -m "feat: dark variants across all pages"
```

---

### Task 17: Page-level dark-mode smoke tests

**Files:**
- Create: `hortisort-monitor/src/pages/__tests__/dark-mode.test.tsx`

- [ ] **Step 1: Write a parameterised smoke test**

```tsx
import { describe, expect, it, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../../test/utils'
import { DashboardPage } from '../DashboardPage'
// import additional pages as needed; import only those that render without required URL params / network

const pages = [
  { name: 'DashboardPage', Component: DashboardPage, probe: /dashboard/i },
  // Add more as the test is expanded
]

describe.each(pages)('$name renders in both themes', ({ Component, probe }) => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders in light theme', () => {
    render(<Component />)
    expect(screen.getByText(probe)).toBeInTheDocument()
  })

  it('renders in dark theme', () => {
    localStorage.setItem('hortisort.theme', 'dark')
    render(<Component />)
    expect(screen.getByText(probe)).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
```

Note: the executor should expand `pages` to cover every page that can render without route params or live network. Pages that require params (e.g. `MachineDetailPage`) can be skipped here if already covered by their existing tests.

- [ ] **Step 2: Run**

Run: `npx vitest run src/pages/__tests__/dark-mode.test.tsx`
Expected: all PASS.

- [ ] **Step 3: Full suite**

Run: `npm run test:run`

- [ ] **Step 4: Commit**

```bash
git add hortisort-monitor/src/pages/__tests__/dark-mode.test.tsx
git commit -m "test: page-level smoke tests for both themes"
```

---

### Task 18: Final verification

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: zero errors.

- [ ] **Step 3: Full test run**

Run: `npm run test:run`
Expected: all green.

- [ ] **Step 4: Manual smoke check with dev server**

Run: `npm run dev`

Walk through (in both themes — click the toggle between each):
- Login → Dashboard → Machines → Machine Detail → Tickets → Daily Logs → Site Visits → Update Status → Admin.

Verify:
- Toggle flips instantly.
- Reload preserves theme.
- Open a second tab, toggle there, confirm the first tab updates.
- Hard reload in dark mode — no white flash.

- [ ] **Step 5: No extra commit (all work already committed). If manual QA surfaces issues, fix them in a new commit referencing the task that introduced the regression.**

---

## Done Criteria (from spec §10)

1. `npm run build` passes.
2. `npm run test:run` passes.
3. `npm run lint` passes.
4. Every page renders correctly in both themes.
5. Toggle persists across reload and across tabs.
6. No FOUC on hard reload in either theme.
7. All existing functionality works identically in both themes.
