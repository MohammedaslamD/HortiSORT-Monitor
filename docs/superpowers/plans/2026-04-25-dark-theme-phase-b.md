# Dark Theme Phase B Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the HortiSort Monitor web app to pixel-perfect parity with `dark-ui-v2.html` while preserving the working light theme from Phase A.

**Architecture:** Strangler-pattern migration on `feature/dark-theme-phase-b` (off Phase A). Two parallel tracks share the branch: (1) build new design-system primitives in `src/components/dark/` driven by semantic Tailwind tokens, (2) migrate pages one at a time to consume them. Mock data services in `src/data/` + `src/services/` feed the new live widgets so a future backend swap is a single-file change per service. "Live" = client-side `setInterval` polling via a single `useLivePolling` hook.

**Tech Stack:** React 19 + TypeScript 5.9 (strict, `verbatimModuleSyntax`) + Vite 8 + Tailwind v3 (`darkMode: 'class'`) + Vitest 4 (happy-dom) + react-router-dom v7. Hand-rolled SVG for `Sparkline` / `DonutChart` (no Recharts addition). No semicolons in new code; named exports only; `import type` for type-only imports.

**Authoritative spec:** `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md`

**Plan-execute sequencing:** Chunks are written and reviewed one at a time, then executed before the next chunk is authored. This keeps later chunks accurate to discoveries made during execution.

**Per-chunk completion gate:** A chunk is only "done" when all of:
- Every checkbox in the chunk is checked
- `npx vitest run <changed test files>` is GREEN
- `npm run test:run` total passes ≥ previous high-water mark (Phase A baseline = 169)
- `npm run build` is GREEN
- `npm run lint` introduces no new errors (pre-existing 9 errors are the budget)
- All changes committed with conventional-commit messages

---

## Chunk 0: Theme tokens + layout shell + restyled Toast

**Outcome of this chunk:** The app's chrome looks like the mockup. CSS variables drive every surface/border/foreground color in both themes. The old `Navbar` + `BottomNav` are replaced by a sectioned `Sidebar` + split-brand `Topbar` (with mobile drawer). The existing `Toast` is restyled with the gradient surface + cyan-green left border + slide-in animation. No page content is migrated yet — pages still render their old bodies inside the new shell. Page titles come from a `PAGE_TITLES` route→title map in `App.tsx` (no per-page churn). NotificationBell + Operator Console button + user-chip + role-aware admin links are deferred to chunks 9 and 10. App is fully working in both themes at the end of this chunk.

**Files in this chunk:**
- Modify: `hortisort-monitor/tailwind.config.js`
- Modify: `hortisort-monitor/src/index.css` (also DELETE the existing `@keyframes slide-in` and `.animate-slide-in` rules at lines 24-37)
- Create: `hortisort-monitor/src/components/dark/index.ts`
- Modify: `hortisort-monitor/src/components/common/Toast.tsx` (preserve `isVisible` prop; convert file to no-semicolons; preserve `role="alert"`)
- Create: `hortisort-monitor/src/components/common/__tests__/Toast.test.tsx` (does not currently exist)
- Create: `hortisort-monitor/src/components/layout/Topbar.tsx`
- Create: `hortisort-monitor/src/components/layout/__tests__/Topbar.test.tsx`
- Modify: `hortisort-monitor/src/components/layout/Sidebar.tsx` (rewrite; keep existing `userRole`/`isOpen`/`onClose` prop API)
- Create: `hortisort-monitor/src/components/layout/__tests__/Sidebar.test.tsx` (does not currently exist)
- Modify: `hortisort-monitor/src/components/layout/PageLayout.tsx` (rewrite; add `pageTitle` prop; keep `userName`/`userRole`/`onLogout`)
- Create: `hortisort-monitor/src/components/layout/__tests__/PageLayout.test.tsx`
- Modify: `hortisort-monitor/src/components/layout/index.ts` (drop `BottomNav` + `Navbar` exports, add `Topbar`)
- Modify: `hortisort-monitor/src/App.tsx` (add `PAGE_TITLES` route map, derive `pageTitle` from `useLocation`, pass to `PageLayout`)
- Delete: `hortisort-monitor/src/components/layout/Navbar.tsx`
- Delete: `hortisort-monitor/src/components/layout/BottomNav.tsx`
- Modify: `hortisort-monitor/src/pages/__tests__/dark-mode.test.tsx` (only if smoke probes regress — likely no change since current probes match `getAllByText(probe)[0]` and topbar adds another match harmlessly)

> **Note on call sites:** No `<PageLayout>` calls exist in `src/pages/` (only one in `App.tsx`), and no test file currently imports `PageLayout`, `Sidebar`, `Navbar`, or `BottomNav` directly. The previous draft's "update every page" task was wrong; ignore.

> **Pre-existing context (verified before authoring):**
> - `Toast.tsx` uses `isVisible: boolean` prop (renders `null` when false) and 5 callers depend on it: `AdminPage.tsx:227`, `LogVisitPage.tsx:182`, `RaiseTicketPage.tsx:158`, `TicketDetailPage.tsx:290`, `UpdateStatusPage.tsx:251`. Plan keeps `isVisible`.
> - `Toast.tsx` already declares `role="alert"`. Plan keeps `alert`.
> - `index.css` already has a hand-written `@keyframes slide-in` + `.animate-slide-in` (lines 24-37). Plan deletes these to avoid collision with the Tailwind-generated `.animate-slide-in` from §0.1.
> - `Sidebar.tsx` already takes `userRole: UserRole`. Plan keeps that prop (do NOT switch to `useAuth()` — saves wrapping `AuthProvider` in tests).
> - `ThemeToggle.tsx` aria-label is `Switch to (light|dark) theme` (not "Toggle theme"). Tests below use the correct regex.
> - No layout test files exist yet (`src/components/layout/__tests__/` is empty); all three are Created.
> - Vitest globals are enabled in `vite.config.ts`; tests do NOT import `describe`/`it`/`expect`/`vi`.

---

### Step 0.1: Extend Tailwind config with semantic tokens, brand colors, animations

- [ ] **0.1.1 Modify `hortisort-monitor/tailwind.config.js`**

Replace the existing `theme.extend` block with the version below. Preserve the existing top-level keys (`darkMode`, `content`, `plugins`):

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT:  'rgb(var(--bg) / <alpha-value>)',
          surface1: 'rgb(var(--bg-surface1) / <alpha-value>)',
          surface2: 'rgb(var(--bg-surface2) / <alpha-value>)',
          surface3: 'rgb(var(--bg-surface3) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong:  'rgb(var(--line-strong) / <alpha-value>)',
        },
        fg: {
          1: 'rgb(var(--fg-1) / <alpha-value>)',
          2: 'rgb(var(--fg-2) / <alpha-value>)',
          3: 'rgb(var(--fg-3) / <alpha-value>)',
          4: 'rgb(var(--fg-4) / <alpha-value>)',
          5: 'rgb(var(--fg-5) / <alpha-value>)',
          6: 'rgb(var(--fg-6) / <alpha-value>)',
        },
        brand: {
          cyan:   '#38bdf8',
          green:  '#4ade80',
          amber:  '#fbbf24',
          red:    '#ef4444',
          purple: '#a78bfa',
          pink:   '#f43f5e',
          orange: '#f97316',
        },
      },
      animation: {
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'slide-in':  'slideIn 0.3s ease',
      },
      keyframes: {
        pulseDot: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        slideIn:  {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```

> **CAUTION:** If the existing config defines a `primary` palette (used today by `Sidebar`/`ThemeToggle` via `bg-primary-50`, `text-primary-700`, etc.), preserve it as-is inside `theme.extend.colors`. Do not delete it. Step 0.6 rewrites the Sidebar to drop `primary-*` references; the config-side cleanup happens after migration is complete.

- [ ] **0.1.2 Verify** by running `npm run build` from `hortisort-monitor/`. Expected: build succeeds.

### Step 0.2: Add CSS variable scopes + stat-gradient utility + reduced-motion override; remove duplicate slide-in

- [ ] **0.2.1 Modify `hortisort-monitor/src/index.css`** — replace the entire file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: rgb(var(--bg));
    color: rgb(var(--fg-2));
  }

  #root {
    min-height: 100vh;
  }

  :root {
    --bg: 248 250 252;
    --bg-surface1: 255 255 255;
    --bg-surface2: 255 255 255;
    --bg-surface3: 241 245 249;
    --line: 229 231 235;
    --line-strong: 209 213 219;
    --fg-1: 15 23 42;
    --fg-2: 30 41 59;
    --fg-3: 71 85 105;
    --fg-4: 100 116 139;
    --fg-5: 148 163 184;
    --fg-6: 203 213 225;
  }

  .dark {
    --bg: 6 10 24;
    --bg-surface1: 10 16 32;
    --bg-surface2: 13 20 36;
    --bg-surface3: 15 23 40;
    --line: 26 37 64;
    --line-strong: 30 45 74;
    --fg-1: 241 245 249;
    --fg-2: 226 232 240;
    --fg-3: 148 163 184;
    --fg-4: 100 116 139;
    --fg-5: 74 85 104;
    --fg-6: 59 72 102;
  }
}

@layer utilities {
  .stat-gradient {
    background: linear-gradient(135deg, rgb(var(--bg-surface2)), rgb(var(--bg-surface1)));
  }

  @media (prefers-reduced-motion: reduce) {
    .animate-pulse-dot { animation: none !important; }
    .animate-slide-in  { animation: none !important; }
  }
}
```

> The previous hand-written `@keyframes slide-in` + `.animate-slide-in` block (old lines 24-37) is deliberately removed. Tailwind now generates `.animate-slide-in` from §0.1's `keyframes.slideIn`.

- [ ] **0.2.2 Verify** with `npm run build`. Expected: GREEN.
- [ ] **0.2.3 Commit:**

```bash
git add hortisort-monitor/tailwind.config.js hortisort-monitor/src/index.css
git commit -m "feat(theme): add semantic tokens, brand palette, animations; drop duplicate slide-in"
```

### Step 0.3: Create the `dark/` barrel (empty placeholder)

- [ ] **0.3.1 Create `hortisort-monitor/src/components/dark/index.ts`** with content:

```ts
// Barrel for Phase B dark/light design-system primitives.
// Components are added incrementally per chunk. Empty barrel until chunk 1.
export {}
```

- [ ] **0.3.2 Commit:**

```bash
git add hortisort-monitor/src/components/dark/index.ts
git commit -m "chore(dark): scaffold dark design-system barrel"
```

### Step 0.4: Restyle `Toast` (TDD)

- [ ] **0.4.1 RED — create `hortisort-monitor/src/components/common/__tests__/Toast.test.tsx`** (this file does NOT currently exist):

```tsx
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Toast } from '../Toast'

describe('Toast', () => {
  it('renders nothing when isVisible is false', () => {
    const { container } = render(
      <Toast message="hidden" type="info" isVisible={false} onClose={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message and uses role="alert" when visible', () => {
    render(<Toast message="Saved" type="success" isVisible={true} onClose={() => {}} />)
    const root = screen.getByRole('alert')
    expect(root).toHaveTextContent('Saved')
  })

  it('applies the slide-in animation, stat-gradient surface, and a 4px left accent border', () => {
    render(<Toast message="Saved" type="success" isVisible={true} onClose={() => {}} />)
    const root = screen.getByRole('alert')
    expect(root).toHaveClass('animate-slide-in')
    expect(root).toHaveClass('stat-gradient')
    expect(root).toHaveClass('border-l-4')
  })

  it('uses brand-green accent border for type="success"', () => {
    render(<Toast message="ok" type="success" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-green')
  })

  it('uses brand-red accent border for type="error"', () => {
    render(<Toast message="bad" type="error" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-red')
  })

  it('uses brand-cyan accent border for type="info"', () => {
    render(<Toast message="info" type="info" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-cyan')
  })

  it('uses brand-amber accent border for type="warning"', () => {
    render(<Toast message="warn" type="warning" isVisible={true} onClose={() => {}} />)
    expect(screen.getByRole('alert')).toHaveClass('border-brand-amber')
  })

  it('calls onClose when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Toast message="x" type="info" isVisible={true} onClose={onClose} />)
    await user.click(screen.getByLabelText(/dismiss notification/i))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **0.4.2 Run** `npx vitest run src/components/common/__tests__/Toast.test.tsx` from `hortisort-monitor/`. Expected: 5 of 8 tests FAIL — specifically the assertions for `animate-slide-in` (passes — already present), `stat-gradient` (FAIL — not yet on Toast), `border-l-4` (passes), and the four variant `border-brand-*` assertions (FAIL — Toast still uses `border-green-400` etc.). Some pass, some fail — that's the RED state.

- [ ] **0.4.3 GREEN — replace `hortisort-monitor/src/components/common/Toast.tsx`** with this no-semicolon, restyled version (preserves `isVisible`, preserves `role="alert"`, preserves auto-dismiss `useEffect`, preserves the close-button SVG, preserves the leading status SVG):

```tsx
import { useEffect } from 'react'

/** Toast notification type — determines accent color and icon. */
type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  isVisible: boolean
  onClose: () => void
  /** Auto-dismiss duration in ms. Defaults to 4000. Set 0 to disable. */
  duration?: number
}

const accentBorder: Record<ToastType, string> = {
  success: 'border-brand-green',
  error: 'border-brand-red',
  warning: 'border-brand-amber',
  info: 'border-brand-cyan',
}

const iconColor: Record<ToastType, string> = {
  success: 'text-brand-green',
  error: 'text-brand-red',
  warning: 'text-brand-amber',
  info: 'text-brand-cyan',
}

const typeIcons: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M6 18L18 6M6 6l12 12',
  warning: 'M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
}

/**
 * Floating toast notification with auto-dismiss.
 * Renders at top-right of the viewport, with a colored left accent border
 * and the gradient surface defined by the .stat-gradient utility.
 */
export function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div
      role="alert"
      className={[
        'fixed top-4 right-4 z-[100] flex items-center gap-3',
        'px-4 py-3 border-l-4 rounded-lg shadow-lg',
        'stat-gradient text-fg-1 animate-slide-in',
        accentBorder[type],
      ].join(' ')}
    >
      <svg
        className={`h-5 w-5 flex-shrink-0 ${iconColor[type]}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[type]} />
      </svg>

      <p className="text-sm font-medium flex-1">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-fg-3 hover:text-fg-1 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
```

> **Style note:** This rewrite drops the previous `border-green-400 dark:border-green-500` Tailwind variant tinting in favor of single-token `border-brand-*` classes. The mockup's toast is uniformly dark with a colored left edge in both themes — matches the spec §6.1 description of "gradient surface + cyan-green left border + slide-in".

- [ ] **0.4.4 Run** `npx vitest run src/components/common/__tests__/Toast.test.tsx`. Expected: all 8 PASS.
- [ ] **0.4.5 Run** `npm run test:run`. Expected: total ≥ 169 + 8 (the 5 existing callers don't change behavior — they still pass an `isVisible` boolean and a message; the auto-dismiss timing is unchanged).
- [ ] **0.4.6 Commit:**

```bash
git add hortisort-monitor/src/components/common/Toast.tsx hortisort-monitor/src/components/common/__tests__/Toast.test.tsx
git commit -m "feat(toast): restyle with gradient surface, accent border, slide-in"
```

### Step 0.5: Build the `Topbar` (TDD)

- [ ] **0.5.1 RED — create `hortisort-monitor/src/components/layout/__tests__/Topbar.test.tsx`:**

```tsx
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Topbar } from '../Topbar'

describe('Topbar', () => {
  it('renders the split brand "Horti" cyan + "Sort" green', () => {
    render(<Topbar pageTitle="Dashboard" onOpenSidebar={() => {}} />)
    const horti = screen.getByText('Horti')
    const sort = screen.getByText('Sort')
    expect(horti).toHaveClass('text-brand-cyan')
    expect(sort).toHaveClass('text-brand-green')
  })

  it('renders the pageTitle prop', () => {
    render(<Topbar pageTitle="Command Center" onOpenSidebar={() => {}} />)
    expect(screen.getByText('Command Center')).toBeInTheDocument()
  })

  it('hamburger button calls onOpenSidebar when clicked', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Topbar pageTitle="X" onOpenSidebar={onOpen} />)
    await user.click(screen.getByLabelText(/open navigation/i))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('mounts the ThemeToggle', () => {
    render(<Topbar pageTitle="X" onOpenSidebar={() => {}} />)
    // ThemeToggle's aria-label is "Switch to dark theme" or "Switch to light theme".
    expect(screen.getByLabelText(/switch to (light|dark) theme/i)).toBeInTheDocument()
  })
})
```

- [ ] **0.5.2 Run** `npx vitest run src/components/layout/__tests__/Topbar.test.tsx`. Expected: FAIL (`Topbar` not found).

- [ ] **0.5.3 GREEN — create `hortisort-monitor/src/components/layout/Topbar.tsx`:**

```tsx
import { ThemeToggle } from '../common/ThemeToggle'

interface TopbarProps {
  pageTitle: string
  onOpenSidebar: () => void
}

export function Topbar({ pageTitle, onOpenSidebar }: TopbarProps) {
  return (
    <header className="h-14 flex items-center gap-4 px-4 bg-bg-surface1 border-b border-line">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
        className="lg:hidden p-2 -ml-2 text-fg-3 hover:text-fg-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <div className="flex items-baseline gap-0.5 select-none">
        <span className="text-brand-cyan font-bold text-lg tracking-tight">Horti</span>
        <span className="text-brand-green font-bold text-lg tracking-tight">Sort</span>
      </div>
      <div className="h-6 w-px bg-line hidden sm:block" />
      <h1 className="text-fg-1 font-semibold text-sm sm:text-base truncate">{pageTitle}</h1>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
```

> NotificationBell, Operator Console button, user chip, and logout button are added in chunks 9, 10. Topbar shipped here is the bare shell.

- [ ] **0.5.4 Run** `npx vitest run src/components/layout/__tests__/Topbar.test.tsx`. Expected: PASS.
- [ ] **0.5.5 Commit:**

```bash
git add hortisort-monitor/src/components/layout/Topbar.tsx hortisort-monitor/src/components/layout/__tests__/Topbar.test.tsx
git commit -m "feat(layout): add Topbar with split brand and mobile hamburger"
```

### Step 0.6: Rewrite `Sidebar` as sectioned nav with mobile drawer (TDD)

- [ ] **0.6.1 RED — create `hortisort-monitor/src/components/layout/__tests__/Sidebar.test.tsx`** (does not currently exist):

```tsx
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  it('renders section labels OVERVIEW, OPERATIONS, ADMIN for an admin user', () => {
    render(<Sidebar userRole="admin" isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('OVERVIEW')).toBeInTheDocument()
    expect(screen.getByText('OPERATIONS')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('shows all seven core nav links for an admin', () => {
    render(<Sidebar userRole="admin" isOpen={true} onClose={() => {}} />)
    for (const label of ['Dashboard', 'Machines', 'Tickets', 'Production', 'Daily Logs', 'Site Visits', 'Users']) {
      expect(screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })).toBeInTheDocument()
    }
  })

  it('hides the ADMIN section and Users link for a customer', () => {
    render(<Sidebar userRole="customer" isOpen={true} onClose={() => {}} />)
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^users$/i })).not.toBeInTheDocument()
  })

  it('clicking a nav link calls onClose (drawer-close behavior on mobile)', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Sidebar userRole="admin" isOpen={true} onClose={onClose} />)
    await user.click(screen.getByRole('link', { name: /^machines$/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('translates off-screen on mobile when isOpen=false', () => {
    const { container } = render(<Sidebar userRole="admin" isOpen={false} onClose={() => {}} />)
    const aside = container.querySelector('aside')
    expect(aside?.className).toMatch(/-translate-x-full/)
  })

  it('renders the mobile backdrop with data-testid="sidebar-backdrop" when open', () => {
    render(<Sidebar userRole="admin" isOpen={true} onClose={() => {}} />)
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('does not render the backdrop when closed', () => {
    render(<Sidebar userRole="admin" isOpen={false} onClose={() => {}} />)
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
```

- [ ] **0.6.2 Run** `npx vitest run src/components/layout/__tests__/Sidebar.test.tsx`. Expected: FAIL (Users link doesn't exist in current Sidebar; OVERVIEW/OPERATIONS/ADMIN section labels don't exist; backdrop has no `data-testid`).

- [ ] **0.6.3 GREEN — replace `hortisort-monitor/src/components/layout/Sidebar.tsx`:**

```tsx
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
```

- [ ] **0.6.4 Run** `npx vitest run src/components/layout/__tests__/Sidebar.test.tsx`. Expected: PASS.
- [ ] **0.6.5 Commit:**

```bash
git add hortisort-monitor/src/components/layout/Sidebar.tsx hortisort-monitor/src/components/layout/__tests__/Sidebar.test.tsx
git commit -m "feat(layout): rewrite Sidebar as sectioned nav with mobile drawer"
```

### Step 0.7: Rewrite `PageLayout` to compose Topbar + Sidebar

- [ ] **0.7.1 RED — create `hortisort-monitor/src/components/layout/__tests__/PageLayout.test.tsx`:**

```tsx
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { PageLayout } from '../PageLayout'

describe('PageLayout', () => {
  it('renders pageTitle in the topbar and children in the main area', () => {
    render(
      <PageLayout pageTitle="Dashboard" userName="Aslam" userRole="admin" onLogout={() => {}}>
        <p>hello body</p>
      </PageLayout>
    )
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('hello body')).toBeInTheDocument()
  })

  it('does not render the sidebar backdrop initially', () => {
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })

  it('opens the sidebar drawer when the hamburger is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    await user.click(screen.getByLabelText(/open navigation/i))
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument()
  })

  it('closes the sidebar drawer when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(
      <PageLayout pageTitle="X" userName="A" userRole="admin" onLogout={() => {}}>
        x
      </PageLayout>
    )
    await user.click(screen.getByLabelText(/open navigation/i))
    await user.click(screen.getByTestId('sidebar-backdrop'))
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument()
  })
})
```

- [ ] **0.7.2 Run** `npx vitest run src/components/layout/__tests__/PageLayout.test.tsx`. Expected: FAIL (current `PageLayout` accepts no `pageTitle` prop).

- [ ] **0.7.3 GREEN — replace `hortisort-monitor/src/components/layout/PageLayout.tsx`:**

```tsx
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
 * `userName` and `onLogout` are passed through for use by chunk-9's
 * NotificationBell / user-chip enhancements; not consumed yet.
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
```

> `userName` and `onLogout` are accepted but not destructured today. TypeScript's `noUnusedParameters` is enabled — so referencing them via destructuring without use would error. The signature destructures only what's used; the unused props are tolerated because they live on the `PageLayoutProps` type interface, not in the destructured parameter list. App.tsx still passes them; chunks 9-10 will consume them.

- [ ] **0.7.4 Run** `npx vitest run src/components/layout/__tests__/PageLayout.test.tsx`. Expected: PASS.
- [ ] **0.7.5 Commit:**

```bash
git add hortisort-monitor/src/components/layout/PageLayout.tsx hortisort-monitor/src/components/layout/__tests__/PageLayout.test.tsx
git commit -m "feat(layout): rewrite PageLayout to compose Topbar + Sidebar drawer"
```

### Step 0.8: Add page-title route map and wire it through `App.tsx`

- [ ] **0.8.1 Modify `hortisort-monitor/src/App.tsx`** — replace its contents:

```tsx
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
```

> **Do NOT add `<ThemeProvider>` here.** It is already mounted in `src/main.tsx` (verified). Adding it again would double-mount and silently fork theme state.

- [ ] **0.8.2 Run** `npx tsc -b --noEmit` from `hortisort-monitor/`. Expected: zero errors.
- [ ] **0.8.3 Run** `npm run test:run`. Expected: GREEN, total ≥ 169.

### Step 0.9: Update layout barrel + delete dead components

- [ ] **0.9.1 Replace `hortisort-monitor/src/components/layout/index.ts`** with:

```ts
export { PageLayout } from './PageLayout'
export { Sidebar } from './Sidebar'
export { Topbar } from './Topbar'
```

- [ ] **0.9.2 Find any remaining importers of the removed components:**

```bash
grep -rn "from.*layout/Navbar\|from.*layout/BottomNav\|layout['\"].*Navbar\|layout['\"].*BottomNav" hortisort-monitor/src
```

If anything is found, edit the file to remove the import (these were always incidental — App.tsx no longer references them).

- [ ] **0.9.3 Delete the dead source files** (no test files exist for them):

```bash
git rm hortisort-monitor/src/components/layout/Navbar.tsx hortisort-monitor/src/components/layout/BottomNav.tsx
```

- [ ] **0.9.4 Run** `npx tsc -b --noEmit`. Expected: zero errors.
- [ ] **0.9.5 Run** `npm run test:run`. Expected: GREEN.
- [ ] **0.9.6 Commit:**

```bash
git add hortisort-monitor/src/App.tsx hortisort-monitor/src/components/layout/index.ts
git commit -m "refactor(layout): wire pageTitle route map; drop Navbar and BottomNav"
```

### Step 0.10: Run the full pre-existing test suite, repair regressions if any

- [ ] **0.10.1 Run** `npm run test:run` from `hortisort-monitor/`. Expected: GREEN total ≥ 169.

- [ ] **0.10.2 If `pages/__tests__/dark-mode.test.tsx` fails** (current probes are `/sign in/i` for LoginPage and `/dashboard/i` for DashboardPage; both should still match since LoginPage doesn't go through PageLayout and DashboardPage's body still contains "dashboard"-related text):
  - The test file mocks `useAuth` so `PageLayout` doesn't show (LoginPage is rendered without layout per App.tsx; DashboardPage is mounted directly inside `render()` with no PageLayout wrapper). Expected: no regression.
  - **If a regression occurs anyway**, switch the failing assertion from `getByText` to `getAllByText(probe)[0]` (already the form used) — and confirm the test mock for `react-router-dom` still provides `useLocation`. The current mock spreads `actual` so `useLocation` is intact.

- [ ] **0.10.3 If any other test regresses**, fix in place. Common patterns:
  - Test imports `PageLayout` and passes legacy props → add `pageTitle="..."` prop, remove `Navbar`/`BottomNav` imports.
  - Test asserts on the bottom-nav text → delete those assertions; the bottom-nav is gone.

- [ ] **0.10.4 Run** `npm run build`. Expected: GREEN.
- [ ] **0.10.5 Run** `npm run lint`. Expected: same 9 pre-existing errors, zero new errors.
- [ ] **0.10.6 If any test files were edited in 0.10.2 / 0.10.3, commit:**

```bash
git add -A
git commit -m "test: adapt suite to Topbar+Sidebar shell"
```

(Skip this commit if no test files needed editing.)

### Step 0.11: Manual smoke check + spec status update

- [ ] **0.11.1 Ensure dev server is running.** Check existing PIDs:

```bash
ps -ef | grep -E 'vite|node.*dev' | grep -v grep
```

If not running, start it (use `workdir`, NOT `cd && `):

Bash tool call: `command: "npm run dev > /tmp/vite-dev.log 2>&1 &"`, `workdir: "/mnt/d/Hackathon web app/hortisort-monitor"`.

- [ ] **0.11.2 Browse manually** to <http://localhost:3000/login>, log in as `aslam@hortisort.com` / `password_123`, and verify each item:
  - Topbar shows split-brand `Horti` (cyan) `Sort` (green) and the resolved page title in both themes
  - Sidebar shows OVERVIEW / OPERATIONS / ADMIN sections; Users link only visible to admin; engineer-only routes (Production, Site Visits) hidden for customers
  - Theme toggle still works; refresh keeps theme; no FOUC
  - Mobile width (DevTools 375 px): hamburger opens drawer, click backdrop closes it, click nav link closes it and navigates
  - Trigger a toast (e.g. submit RaiseTicket form) — shows the new gradient surface + colored left edge + slide-in
  - Browser console: zero errors

- [ ] **0.11.3 Update spec status header** in `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md` line 3 from `Status: draft for review` to `Status: in implementation (chunk 0 complete)`. Commit:

```bash
git add docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md
git commit -m "docs(spec): mark phase B chunk 0 complete"
```

- [ ] **0.11.4 Final per-chunk gate** (all must pass):
  - `npm run test:run` total ≥ 177 (169 baseline + 8 new Toast + Topbar/Sidebar/PageLayout suites — minus zero deletions; concrete floor depends on how many `it` blocks land but must exceed 169)
  - `npm run build` → GREEN
  - `npm run lint` → no new errors beyond the 9 pre-existing
  - Manual smoke list in 0.11.2 fully checked

**End of Chunk 0.**

---

> Chunks 2-10 will be authored after each preceding chunk is fully executed and verified, so each subsequent chunk can incorporate any discoveries from the running app.

---

## Chunk 1: Dashboard "Command Center"

**Outcome of this chunk:** `DashboardPage` is replaced top-to-bottom with the mockup's "Command Center" layout: a 5-card stat row (Total Machines / Running / In Production / Open Tickets / Today Throughput), a fleet section of 8 `MachineTile`s, a `Sparkline` panel with PEAK/AVG/NOW + Actual/Target legend, a combined `DonutChart` + `SeverityBar` card, an Activity timeline, and a Live Alerts feed. All values come from three new mock services (`liveMetricsService`, `alertService`, `activityService`) wired through a single polling hook (`useLivePolling`). Sparkline polls every 5 s; alerts feed polls every 30 s; everything else fetches once on mount. Both light and dark palettes render correctly.

**Files in this chunk:**
- Modify: `hortisort-monitor/src/types/index.ts` (append Phase B types per spec §8)
- Create: `hortisort-monitor/src/data/mockLiveData.ts`
- Create: `hortisort-monitor/src/data/mockAlerts.ts`
- Create: `hortisort-monitor/src/data/mockActivity.ts`
- Create: `hortisort-monitor/src/services/liveMetricsService.ts` + `__tests__/liveMetricsService.test.ts`
- Create: `hortisort-monitor/src/services/alertService.ts` + `__tests__/alertService.test.ts`
- Create: `hortisort-monitor/src/services/activityService.ts` + `__tests__/activityService.test.ts`
- Create: `hortisort-monitor/src/hooks/useLivePolling.ts` + `__tests__/useLivePolling.test.ts`
- Create: `hortisort-monitor/src/components/dark/StatusDot.tsx` + test
- Create: `hortisort-monitor/src/components/dark/IconTile.tsx` + test
- Create: `hortisort-monitor/src/components/dark/TrendPill.tsx` + test
- Create: `hortisort-monitor/src/components/dark/ProgressBar.tsx` + test
- Create: `hortisort-monitor/src/components/dark/Sparkline.tsx` + test
- Create: `hortisort-monitor/src/components/dark/StatCard.tsx` + test
- Create: `hortisort-monitor/src/components/dark/SectionCard.tsx` + test
- Create: `hortisort-monitor/src/components/dark/MachineTile.tsx` + test
- Create: `hortisort-monitor/src/components/dark/AlertRow.tsx` (+ co-located `alertBadgeVariant` helper) + test
- Create: `hortisort-monitor/src/components/dark/TimelineItem.tsx` + test
- Create: `hortisort-monitor/src/components/dark/DonutChart.tsx` + test
- Create: `hortisort-monitor/src/components/dark/SeverityBar.tsx` + test
- Modify: `hortisort-monitor/src/components/dark/index.ts` (populate barrel)
- Modify: `hortisort-monitor/src/pages/DashboardPage.tsx` (full rewrite)
- Modify: `hortisort-monitor/src/pages/__tests__/DashboardPage.test.tsx` (rewrite to match new markup)
- Modify: `hortisort-monitor/src/pages/__tests__/dark-mode.test.tsx` (add mocks for the 3 new services; replace dashboard probe text)

> **Pre-existing context (verified before authoring):**
> - `src/data/` does NOT yet exist as a directory. Created here.
> - `src/hooks/` already exists (contains `useProductionSocket.ts`). Adding `useLivePolling.ts` alongside.
> - `src/services/` already exists. Adding three new services alongside the existing ones; existing services unchanged.
> - The legacy `DashboardPage` uses `getMachinesByRole`, `getTickets`, `getDailyLogs`, `getAllTodaySessions`, `useProductionSocket`. The rewrite drops all of these for the new mock services. The existing services remain untouched (other pages still use them).
> - `dashboard/` components (`StatsCards`, `MachineStatusChart`, `TicketSeverityChart`, `ThroughputChart`) are NOT deleted in this chunk — they stay around dead until later cleanup or until other chunks delete them. Reason: deleting them now would break their existing tests with no upside.
> - `pages/__tests__/DashboardPage.test.tsx` exists and currently asserts on legacy markup (StatsCards labels, machine cards, filter inputs). It will be entirely rewritten.
> - `pages/__tests__/dark-mode.test.tsx` mocks `getMachinesByRole`, `getTickets`, `getDailyLogs`. We add mocks for the 3 new services and update the dashboard probe text from `/dashboard/i` to `/Command Center|TOTAL MACHINES/i` (whichever the new markup actually renders).
> - Vitest globals enabled — tests do not import `describe`/`it`/`expect`/`vi`.
> - Mockup uses `viewBox="0 0 42 42"` for the donut and `viewBox="0 0 340 140"` for the sparkline; we mirror these so the SVG math is identical and any future visual diff stays on rails.

---

### Step 1.1: Append Phase B data types

- [ ] **1.1.1 Modify `hortisort-monitor/src/types/index.ts`** — append (do not replace) the following at end of file. Note: existing file uses semicolons; preserve that within this file (do not flip its style mid-file). New types match spec §8 verbatim:

```ts

// =============================================================================
// Phase B: Live metrics, alerts, activity (mock-data layer)
// =============================================================================

/** Per-machine live metrics for the Command Center fleet section. */
export interface MachineLiveMetrics {
  machine_id: number;
  tons_per_hour: number | null;
  uptime_percent: number;     // 0-100
  progress_percent: number;   // 0-100 vs daily target
  current_fruit: string | null;
}

/** Aggregated fleet snapshot for the Command Center stat row. */
export interface FleetSummary {
  total_machines: number;
  running: number;
  idle: number;
  down: number;
  offline: number;
  in_production: number;
  today_throughput_tons: number;
  trend_running_vs_yesterday: number; // signed delta
  trend_throughput_pct: number;       // signed % vs avg
  open_tickets: { total: number; p1: number; p2: number; p3: number; p4: number };
}

/** A single point on the Live Throughput sparkline. */
export interface ThroughputPoint {
  time: string;   // ISO
  actual: number; // t/hr
  target: number; // t/hr
}

export type AlertSeverity = "critical" | "warn" | "info" | "ok";
export type AlertBadgeLabel = "P1" | "P2" | "P3" | "P4" | "INFO" | "OK";

export interface Alert {
  id: number;
  machine_id: number;
  machine_label: string;
  severity: AlertSeverity;
  badge_label: AlertBadgeLabel;
  message: string;
  created_at: string;
}

export type ActivityIconTone =
  | "red"
  | "green"
  | "blue"
  | "purple"
  | "cyan"
  | "yellow";

export interface ActivityEvent {
  id: number;
  type: "ticket" | "production" | "visit" | "machine" | "user";
  icon_tone: ActivityIconTone;
  title: string;
  meta: string;
  created_at: string;
}
```

- [ ] **1.1.2 Verify** with `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **1.1.3 Commit:**

```bash
git add hortisort-monitor/src/types/index.ts
git commit -m "feat(types): add Phase B live-metrics, alert, activity types"
```

### Step 1.2: Mock data files

- [ ] **1.2.1 Create `hortisort-monitor/src/data/mockLiveData.ts`** — deterministic, hand-authored values. 12 machines (M-001 through M-012) and one fleet summary that matches the mockup's display values (6 running / 2 idle / 2 down / 2 offline / 3 in_production / 18.4 t today / 6 open tickets with 2 P1, 2 P2, 1 P3, 1 P4). Throughput series is a function of `now: Date` returning 30 points spaced 1 minute apart; values use a deterministic pseudo-noise function (e.g. `Math.sin(i * 0.7) * 0.3 + base`) seeded from `now.getMinutes()` so successive 5 s polls smoothly tick.

```ts
import type { MachineLiveMetrics, FleetSummary, ThroughputPoint } from '../types'

export const MOCK_MACHINE_METRICS: MachineLiveMetrics[] = [
  { machine_id: 1, tons_per_hour: 2.4, uptime_percent: 90, progress_percent: 90, current_fruit: 'Banana' },
  { machine_id: 2, tons_per_hour: 1.9, uptime_percent: 75, progress_percent: 75, current_fruit: 'Mango' },
  // M-003: down (sorting halted, tons null, progress < 50)
  { machine_id: 3, tons_per_hour: null, uptime_percent: 30, progress_percent: 30, current_fruit: null },
  // M-004: idle (tons null, progress >= 50 retained from prior shift)
  { machine_id: 4, tons_per_hour: null, uptime_percent: 60, progress_percent: 55, current_fruit: null },
  { machine_id: 5, tons_per_hour: 3.1, uptime_percent: 85, progress_percent: 85, current_fruit: 'Grapes' },
  { machine_id: 6, tons_per_hour: 2.7, uptime_percent: 70, progress_percent: 70, current_fruit: 'Pomegranate' },
  // M-007: offline (tons null AND uptime 0)
  { machine_id: 7, tons_per_hour: null, uptime_percent: 0, progress_percent: 0, current_fruit: null },
  { machine_id: 8, tons_per_hour: 1.5, uptime_percent: 60, progress_percent: 60, current_fruit: 'Mango' },
  // M-009: idle (tons null, progress >= 50)
  { machine_id: 9, tons_per_hour: null, uptime_percent: 55, progress_percent: 50, current_fruit: null },
  // M-010: down (tons null, progress < 50)
  { machine_id: 10, tons_per_hour: null, uptime_percent: 25, progress_percent: 20, current_fruit: null },
  // M-011: offline
  { machine_id: 11, tons_per_hour: null, uptime_percent: 0, progress_percent: 0, current_fruit: null },
  // M-012: offline (note: only first 8 are rendered as tiles per spec; the remaining 4 still need to balance the fleet totals)
  // After the 8-tile slice (ids 1..8): 5 running (1,2,5,6,8) + 1 down (3) + 1 idle (4) + 1 offline (7).
  // Fleet summary aggregates ALL 12, not the slice. With ids 9-12 above:
  // running: 1,2,5,6,8 = 5 → +1 below to reach 6 → swap id 12 to running
  { machine_id: 12, tons_per_hour: 2.0, uptime_percent: 70, progress_percent: 70, current_fruit: 'Apple' },
  // Final tally (ids 1-12): 6 running (1,2,5,6,8,12), 2 idle (4,9), 2 down (3,10), 2 offline (7,11) — matches MOCK_FLEET_SUMMARY.
]

export const MOCK_FLEET_SUMMARY: FleetSummary = {
  total_machines: 12,
  running: 6,
  idle: 2,
  down: 2,
  offline: 2,
  in_production: 3,
  today_throughput_tons: 18.4,
  trend_running_vs_yesterday: 1,
  trend_throughput_pct: 12,
  open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
}

/**
 * Generate 30 throughput points spaced 1 minute apart, ending at `now`.
 * Deterministic: same `now` minute returns same series (so tests can assert).
 * Smooth across calls: 5 s repolls produce nearly-identical curves.
 */
export function generateThroughputSeries(now: Date): ThroughputPoint[] {
  const seed = now.getMinutes()
  const points: ThroughputPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60_000)
    const phase = (seed + (29 - i)) * 0.7
    const actual = Math.max(0, 3.1 + Math.sin(phase) * 0.6 + Math.cos(phase * 0.3) * 0.3)
    const target = 3.5
    points.push({
      time: t.toISOString(),
      actual: Math.round(actual * 100) / 100,
      target,
    })
  }
  return points
}
```

- [ ] **1.2.2 Create `hortisort-monitor/src/data/mockAlerts.ts`** — 12 alerts covering all severities. Use ISO timestamps relative to a fixed reference date (e.g. `new Date('2026-04-23T09:42:00Z')`) so tests are deterministic. Mockup's first 5 alerts (M-003 P1, M-007 P2, M-001 INFO, M-005 OK, M-010 P2) are the first 5 entries. Add 7 more with varying recency.

```ts
import type { Alert } from '../types'

const REF = new Date('2026-04-23T09:42:00Z').getTime()
const minutesAgo = (m: number) => new Date(REF - m * 60_000).toISOString()

export const MOCK_ALERTS: Alert[] = [
  { id: 1, machine_id: 3, machine_label: 'M-003 Pomegranate', severity: 'critical', badge_label: 'P1', message: 'Motor overload - sorting halted', created_at: minutesAgo(2) },
  { id: 2, machine_id: 7, machine_label: 'M-007 Mango',       severity: 'warn',     badge_label: 'P2', message: 'Rejection rate above 15%',         created_at: minutesAgo(8) },
  { id: 3, machine_id: 1, machine_label: 'M-001 Banana',      severity: 'info',     badge_label: 'INFO', message: 'New lot LOT-042 started',        created_at: minutesAgo(12) },
  { id: 4, machine_id: 5, machine_label: 'M-005 Grapes',      severity: 'ok',       badge_label: 'OK',  message: 'Sensor recalibrated',             created_at: minutesAgo(25) },
  { id: 5, machine_id: 10, machine_label: 'M-010 Banana',     severity: 'warn',     badge_label: 'P2', message: 'Conveyor belt speed fluctuation', created_at: minutesAgo(60) },
  { id: 6, machine_id: 4, machine_label: 'M-004 Apple',       severity: 'info',     badge_label: 'INFO', message: 'Idle for 30 minutes',           created_at: minutesAgo(90) },
  { id: 7, machine_id: 8, machine_label: 'M-008 Mango',       severity: 'warn',     badge_label: 'P3', message: 'Vibration sensor drift',          created_at: minutesAgo(120) },
  { id: 8, machine_id: 6, machine_label: 'M-006 Pomegranate', severity: 'ok',       badge_label: 'OK',  message: 'Daily calibration completed',     created_at: minutesAgo(180) },
  { id: 9, machine_id: 2, machine_label: 'M-002 Mango',       severity: 'warn',     badge_label: 'P3', message: 'Belt tension low',                created_at: minutesAgo(240) },
  { id: 10, machine_id: 11, machine_label: 'M-011 Grapes',    severity: 'critical', badge_label: 'P1', message: 'Power supply failure',            created_at: minutesAgo(300) },
  { id: 11, machine_id: 9, machine_label: 'M-009 Apple',      severity: 'info',     badge_label: 'P4', message: 'Software update pending',         created_at: minutesAgo(360) },
  { id: 12, machine_id: 12, machine_label: 'M-012 Pomegranate', severity: 'ok',     badge_label: 'OK',  message: 'Maintenance window completed',    created_at: minutesAgo(480) },
]
```

- [ ] **1.2.3 Create `hortisort-monitor/src/data/mockActivity.ts`** — 18 events. First 5 mirror the mockup verbatim; remaining 13 are realistic varied entries.

```ts
import type { ActivityEvent } from '../types'

const REF = new Date('2026-04-23T09:42:00Z').getTime()
const minutesAgo = (m: number) => new Date(REF - m * 60_000).toISOString()

export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: 1, type: 'ticket', icon_tone: 'red',    title: 'M-003 went DOWN - motor overload', meta: 'TK-0041 raised by Amit Sharma',  created_at: minutesAgo(4) },
  { id: 2, type: 'production', icon_tone: 'green', title: 'LOT-2026-042 started on M-001', meta: 'Banana - 360 kg so far',         created_at: minutesAgo(12) },
  { id: 3, type: 'visit',  icon_tone: 'blue',   title: 'Site visit by Priya Nair at M-005', meta: 'Calibration completed',          created_at: minutesAgo(25) },
  { id: 4, type: 'ticket', icon_tone: 'green',  title: 'TK-0037 resolved - Weight sensor', meta: 'Resolved by Amit Sharma',        created_at: minutesAgo(60) },
  { id: 5, type: 'machine', icon_tone: 'purple', title: 'M-004 status changed to Idle',     meta: 'Daily log auto-created',          created_at: minutesAgo(120) },
  { id: 6, type: 'production', icon_tone: 'cyan', title: 'LOT-2026-041 completed on M-005', meta: '1.2 t graded - 4.2% rejected',   created_at: minutesAgo(180) },
  { id: 7, type: 'ticket', icon_tone: 'yellow', title: 'TK-0040 escalated to P2',           meta: 'Engineer Amit Sharma notified',  created_at: minutesAgo(210) },
  { id: 8, type: 'machine', icon_tone: 'green', title: 'M-008 came back ONLINE',            meta: 'Network restored',                created_at: minutesAgo(260) },
  { id: 9, type: 'visit',  icon_tone: 'blue',   title: 'Routine visit logged at M-002',     meta: 'Belt tension adjusted',           created_at: minutesAgo(310) },
  { id: 10, type: 'user',  icon_tone: 'purple', title: 'New engineer Priya Nair onboarded', meta: 'Assigned to Site 2',              created_at: minutesAgo(420) },
  { id: 11, type: 'production', icon_tone: 'green', title: 'LOT-2026-040 started on M-006', meta: 'Pomegranate - 0 kg',             created_at: minutesAgo(480) },
  { id: 12, type: 'ticket', icon_tone: 'red',   title: 'TK-0039 raised - Sensor fault',     meta: 'M-007 - reported by customer',    created_at: minutesAgo(540) },
  { id: 13, type: 'machine', icon_tone: 'purple', title: 'M-001 software updated to v2.3',  meta: 'Auto-update completed',           created_at: minutesAgo(720) },
  { id: 14, type: 'visit',  icon_tone: 'blue',   title: 'Emergency visit at M-003',         meta: 'Motor replaced',                  created_at: minutesAgo(900) },
  { id: 15, type: 'ticket', icon_tone: 'green',  title: 'TK-0036 closed - Calibration',     meta: 'Resolved by Priya Nair',          created_at: minutesAgo(1080) },
  { id: 16, type: 'production', icon_tone: 'cyan', title: 'Daily throughput: 18.4 t',       meta: 'Across 6 active machines',        created_at: minutesAgo(1260) },
  { id: 17, type: 'machine', icon_tone: 'yellow', title: 'M-010 went IDLE',                  meta: 'No items detected for 30 min',    created_at: minutesAgo(1440) },
  { id: 18, type: 'user',   icon_tone: 'purple',  title: 'Customer Sara Khan logged in',    meta: 'First login this week',           created_at: minutesAgo(1620) },
]
```

- [ ] **1.2.4 Verify** with `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **1.2.5 Commit:**

```bash
git add hortisort-monitor/src/data/
git commit -m "feat(data): add Phase B mock live-metrics, alerts, activity"
```

### Step 1.3: Three new services (TDD)

Service contract (per AGENTS.md §"Service Layer Contract"): each function `async`, returns typed promise, errors throw with descriptive messages. Body simply resolves the mock array.

- [ ] **1.3.1 RED — create `hortisort-monitor/src/services/__tests__/liveMetricsService.test.ts`:**

```ts
import { liveMetricsService } from '../liveMetricsService'

describe('liveMetricsService', () => {
  it('getFleetSummary returns the mock fleet summary', async () => {
    const summary = await liveMetricsService.getFleetSummary()
    expect(summary.total_machines).toBe(12)
    expect(summary.running).toBe(6)
    expect(summary.today_throughput_tons).toBeCloseTo(18.4, 1)
    expect(summary.open_tickets.p1).toBe(2)
  })

  it('getMachineMetrics returns 12 entries', async () => {
    const metrics = await liveMetricsService.getMachineMetrics()
    expect(metrics).toHaveLength(12)
    expect(metrics[0].machine_id).toBe(1)
  })

  it('getThroughputSeries returns 30 points ordered chronologically', async () => {
    const now = new Date('2026-04-23T09:42:00Z')
    const series = await liveMetricsService.getThroughputSeries(now)
    expect(series).toHaveLength(30)
    expect(new Date(series[0].time).getTime()).toBeLessThan(new Date(series[29].time).getTime())
    expect(series[29].actual).toBeGreaterThan(0)
  })

  it('getThroughputSeries is deterministic for the same minute', async () => {
    const now = new Date('2026-04-23T09:42:00Z')
    const a = await liveMetricsService.getThroughputSeries(now)
    const b = await liveMetricsService.getThroughputSeries(now)
    expect(a[0].actual).toBe(b[0].actual)
    expect(a[15].actual).toBe(b[15].actual)
  })
})
```

- [ ] **1.3.2 Run** the test file. Expected: FAIL (service does not exist).

- [ ] **1.3.3 GREEN — create `hortisort-monitor/src/services/liveMetricsService.ts`:**

```ts
import type { MachineLiveMetrics, FleetSummary, ThroughputPoint } from '../types'
import { MOCK_FLEET_SUMMARY, MOCK_MACHINE_METRICS, generateThroughputSeries } from '../data/mockLiveData'

/**
 * Live fleet metrics service.
 * Mock implementation; future Phase C swaps the bodies for real backend calls.
 */
export const liveMetricsService = {
  async getFleetSummary(): Promise<FleetSummary> {
    return MOCK_FLEET_SUMMARY
  },
  async getMachineMetrics(): Promise<MachineLiveMetrics[]> {
    return MOCK_MACHINE_METRICS
  },
  async getThroughputSeries(now: Date = new Date()): Promise<ThroughputPoint[]> {
    return generateThroughputSeries(now)
  },
}
```

- [ ] **1.3.4 Run** the test file. Expected: PASS (4 tests).

- [ ] **1.3.5 RED — create `hortisort-monitor/src/services/__tests__/alertService.test.ts`:**

```ts
import { alertService } from '../alertService'

describe('alertService', () => {
  it('getAlerts returns 12 mock alerts ordered by created_at desc (newest first)', async () => {
    const alerts = await alertService.getAlerts()
    expect(alerts).toHaveLength(12)
    for (let i = 1; i < alerts.length; i++) {
      expect(new Date(alerts[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(alerts[i].created_at).getTime())
    }
  })

  it('the first alert is the P1 critical for M-003', async () => {
    const [first] = await alertService.getAlerts()
    expect(first.severity).toBe('critical')
    expect(first.badge_label).toBe('P1')
    expect(first.machine_label).toContain('M-003')
  })
})
```

- [ ] **1.3.6 GREEN — create `hortisort-monitor/src/services/alertService.ts`:**

```ts
import type { Alert } from '../types'
import { MOCK_ALERTS } from '../data/mockAlerts'

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    return [...MOCK_ALERTS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },
}
```

- [ ] **1.3.7 Run** alertService test. Expected: PASS (2 tests).

- [ ] **1.3.8 RED — create `hortisort-monitor/src/services/__tests__/activityService.test.ts`:**

```ts
import { activityService } from '../activityService'

describe('activityService', () => {
  it('getActivity returns 18 events ordered newest first', async () => {
    const events = await activityService.getActivity()
    expect(events).toHaveLength(18)
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i - 1].created_at).getTime())
        .toBeGreaterThanOrEqual(new Date(events[i].created_at).getTime())
    }
  })

  it('the first event matches the mockup (M-003 went DOWN)', async () => {
    const [first] = await activityService.getActivity()
    expect(first.title).toMatch(/M-003 went DOWN/)
  })
})
```

- [ ] **1.3.9 GREEN — create `hortisort-monitor/src/services/activityService.ts`:**

```ts
import type { ActivityEvent } from '../types'
import { MOCK_ACTIVITY } from '../data/mockActivity'

export const activityService = {
  async getActivity(): Promise<ActivityEvent[]> {
    return [...MOCK_ACTIVITY].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },
}
```

- [ ] **1.3.10 Run** activityService test. Expected: PASS (2 tests).

- [ ] **1.3.11 Commit:**

```bash
git add hortisort-monitor/src/services/liveMetricsService.ts hortisort-monitor/src/services/alertService.ts hortisort-monitor/src/services/activityService.ts hortisort-monitor/src/services/__tests__/liveMetricsService.test.ts hortisort-monitor/src/services/__tests__/alertService.test.ts hortisort-monitor/src/services/__tests__/activityService.test.ts
git commit -m "feat(services): add Phase B live-metrics, alert, activity services"
```

### Step 1.4: `useLivePolling` hook (TDD)

- [ ] **1.4.1 RED — create `hortisort-monitor/src/hooks/__tests__/useLivePolling.test.ts`:**

```ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLivePolling } from '../useLivePolling'

describe('useLivePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    // Restore happy-dom defaults so document accessors don't leak between tests
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible', writable: true })
    Object.defineProperty(document, 'hidden', { configurable: true, value: false, writable: true })
  })

  it('calls the fetcher once on mount and stores data', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    const { result } = renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    expect(result.current.data).toBe('init')
    await act(async () => { await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.data).toBe('A')
  })

  it('re-calls the fetcher on each interval tick', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve() })
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it('pauses while document.hidden = true and resumes when it becomes false', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    const visibilityState = { value: 'visible' as DocumentVisibilityState }
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilityState.value })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => visibilityState.value === 'hidden' })

    renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)

    visibilityState.value = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    await act(async () => { vi.advanceTimersByTime(5000); await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)

    visibilityState.value = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    await act(async () => { await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(2) // resume triggers an immediate refetch
  })

  it('cleans up the interval on unmount', async () => {
    const fetcher = vi.fn().mockResolvedValue('A')
    const { unmount } = renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    unmount()
    await act(async () => { vi.advanceTimersByTime(5000); await Promise.resolve() })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('swallows fetcher errors into the error state and keeps last good data', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce('first')
      .mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useLivePolling(fetcher, 1000, 'init'))
    await act(async () => { await Promise.resolve() })
    expect(result.current.data).toBe('first')
    expect(result.current.error).toBeNull()
    await act(async () => { vi.advanceTimersByTime(1000); await Promise.resolve(); await Promise.resolve() })
    expect(result.current.data).toBe('first')
    expect(result.current.error).toBe('boom')
  })
})
```

- [ ] **1.4.2 Run** the test file. Expected: FAIL (hook does not exist).

- [ ] **1.4.3 GREEN — create `hortisort-monitor/src/hooks/useLivePolling.ts`:**

```ts
import { useEffect, useRef, useState } from 'react'

interface PollingState<T> {
  data: T
  loading: boolean
  error: string | null
}

/**
 * Polls `fetcher` immediately on mount and every `intervalMs` thereafter.
 * Pauses when `document.hidden`; resumes (with an immediate refetch) when visible.
 * Errors are swallowed into `error` state; last-good `data` is preserved.
 *
 * @param fetcher  async function returning the polled value
 * @param intervalMs poll cadence in milliseconds
 * @param initial  initial value of `data` before the first fetch resolves
 */
export function useLivePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  initial: T,
): PollingState<T> {
  const [state, setState] = useState<PollingState<T>>({ data: initial, loading: true, error: null })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function tick() {
      try {
        const data = await fetcherRef.current()
        if (cancelled) return
        setState({ data, loading: false, error: null })
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Polling failed'
        setState((prev) => ({ ...prev, loading: false, error: msg }))
      }
    }

    function start() {
      if (timer !== null) return
      void tick()
      timer = setInterval(() => { void tick() }, intervalMs)
    }
    function stop() {
      if (timer !== null) { clearInterval(timer); timer = null }
    }

    function onVisibility() {
      if (document.hidden) stop()
      else start()
    }

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs])

  return state
}
```

> **Compiler note:** the success path uses `setState({...})` (not the updater form) to avoid `noUnusedParameters` on a `prev` we don't need. The error path keeps the updater because it must preserve last-good `data`.

- [ ] **1.4.4 Run** the hook test file. Expected: PASS (5 tests).
- [ ] **1.4.5 Run** `npm run test:run`. Expected: total ≥ Phase A baseline + chunk 0 (≥ 192) + 13 (4+2+2+5).
- [ ] **1.4.6 Commit:**

```bash
git add hortisort-monitor/src/hooks/useLivePolling.ts hortisort-monitor/src/hooks/__tests__/useLivePolling.test.ts
git commit -m "feat(hooks): add useLivePolling with visibility pause and error swallow"
```

### Step 1.5: Atom — `StatusDot`

A 6×6-px circle that pulses when `pulse=true`. Uses `bg-brand-{tone}` colors mapped from a tone prop. Respects `prefers-reduced-motion` via the existing CSS override (chunk 0 already disabled `.animate-pulse-dot`).

- [ ] **1.5.1 RED — create `src/components/dark/__tests__/StatusDot.test.tsx`:**

```tsx
import { render } from '../../../test/utils'
import { StatusDot } from '../StatusDot'

describe('StatusDot', () => {
  it('renders a green dot for tone="green"', () => {
    const { container } = render(<StatusDot tone="green" />)
    expect(container.firstChild).toHaveClass('bg-brand-green')
  })
  it('does not pulse by default', () => {
    const { container } = render(<StatusDot tone="red" />)
    expect(container.firstChild).not.toHaveClass('animate-pulse-dot')
  })
  it('pulses when pulse=true', () => {
    const { container } = render(<StatusDot tone="amber" pulse />)
    expect(container.firstChild).toHaveClass('animate-pulse-dot')
  })
  it('renders a gray dot for tone="gray"', () => {
    const { container } = render(<StatusDot tone="gray" />)
    expect(container.firstChild).toHaveClass('bg-fg-5')
  })
})
```

- [ ] **1.5.2 GREEN — create `src/components/dark/StatusDot.tsx`:**

```tsx
type StatusDotTone = 'green' | 'red' | 'amber' | 'blue' | 'gray'

interface StatusDotProps {
  tone: StatusDotTone
  pulse?: boolean
}

const TONE_BG: Record<StatusDotTone, string> = {
  green: 'bg-brand-green',
  red:   'bg-brand-red',
  amber: 'bg-brand-amber',
  blue:  'bg-brand-cyan',
  gray:  'bg-fg-5',
}

/** Small status indicator dot, optionally pulsing. */
export function StatusDot({ tone, pulse = false }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        'inline-block w-1.5 h-1.5 rounded-full',
        TONE_BG[tone],
        pulse ? 'animate-pulse-dot' : '',
      ].join(' ').trim()}
    />
  )
}
```

- [ ] **1.5.3 Run** test. PASS. Commit:

```bash
git add hortisort-monitor/src/components/dark/StatusDot.tsx hortisort-monitor/src/components/dark/__tests__/StatusDot.test.tsx
git commit -m "feat(dark): add StatusDot atom"
```

### Step 1.6: Atom — `IconTile`

A 32×32 rounded tile with tinted background and colored icon, used inside `StatCard` headers and `TimelineItem` rows. Children are the icon (consumer passes a literal SVG or unicode glyph).

- [ ] **1.6.1 RED — create `src/components/dark/__tests__/IconTile.test.tsx`:**

```tsx
import { render, screen } from '../../../test/utils'
import { IconTile } from '../IconTile'

describe('IconTile', () => {
  it('renders children with green tint for tone="green"', () => {
    render(<IconTile tone="green"><span>X</span></IconTile>)
    const tile = screen.getByText('X').parentElement
    expect(tile).toHaveClass('bg-brand-green/15')
    expect(tile).toHaveClass('text-brand-green')
  })
  it.each([
    ['red', 'bg-brand-red/15'],
    ['amber', 'bg-brand-amber/15'],
    ['blue', 'bg-brand-cyan/15'],
    ['cyan', 'bg-brand-cyan/15'],
    ['purple', 'bg-brand-purple/15'],
  ] as const)('uses correct tint for tone=%s', (tone, cls) => {
    const { container } = render(<IconTile tone={tone}><span>i</span></IconTile>)
    expect(container.firstChild).toHaveClass(cls)
  })
})
```

- [ ] **1.6.2 GREEN — create `src/components/dark/IconTile.tsx`:**

```tsx
import type { ReactNode } from 'react'

type IconTileTone = 'green' | 'red' | 'amber' | 'blue' | 'cyan' | 'purple'

interface IconTileProps {
  tone: IconTileTone
  children: ReactNode
}

const TONE: Record<IconTileTone, string> = {
  green:  'bg-brand-green/15 text-brand-green',
  red:    'bg-brand-red/15 text-brand-red',
  amber:  'bg-brand-amber/15 text-brand-amber',
  blue:   'bg-brand-cyan/15 text-brand-cyan',
  cyan:   'bg-brand-cyan/15 text-brand-cyan',
  purple: 'bg-brand-purple/15 text-brand-purple',
}

/** Square tinted tile that frames a small icon (32×32). */
export function IconTile({ tone, children }: IconTileProps) {
  return (
    <div
      className={[
        'inline-flex items-center justify-center w-8 h-8 rounded-md text-sm',
        TONE[tone],
      ].join(' ')}
    >
      {children}
    </div>
  )
}
```

- [ ] **1.6.3 Test PASS, commit `feat(dark): add IconTile atom`.**

### Step 1.7: Atom — `TrendPill`

Tiny inline pill rendering ▲/▼ + value (e.g. `"▲ 12%"`). Green when up, red when down.

- [ ] **1.7.1 RED — `__tests__/TrendPill.test.tsx`:**

```tsx
import { render, screen } from '../../../test/utils'
import { TrendPill } from '../TrendPill'

describe('TrendPill', () => {
  it('shows up arrow + value in green for direction=up', () => {
    render(<TrendPill direction="up" value="12%" />)
    const pill = screen.getByText(/12%/)
    expect(pill).toHaveTextContent('▲')
    expect(pill).toHaveClass('text-brand-green')
  })
  it('shows down arrow + value in red for direction=down', () => {
    render(<TrendPill direction="down" value="3" />)
    const pill = screen.getByText(/3/)
    expect(pill).toHaveTextContent('▼')
    expect(pill).toHaveClass('text-brand-red')
  })
})
```

- [ ] **1.7.2 GREEN — `TrendPill.tsx`:**

```tsx
interface TrendPillProps {
  direction: 'up' | 'down'
  value: string
}

/** Inline trend indicator: arrow + delta value, color-coded by direction. */
export function TrendPill({ direction, value }: TrendPillProps) {
  const arrow = direction === 'up' ? '▲' : '▼'
  const tone = direction === 'up' ? 'text-brand-green' : 'text-brand-red'
  return <span className={`text-xs font-semibold ${tone}`}>{arrow} {value}</span>
}
```

- [ ] **1.7.3 Test PASS, commit `feat(dark): add TrendPill atom`.**

### Step 1.8: Atom — `ProgressBar`

Thin horizontal track with a filled segment; percent-driven width; tone-driven fill color.

- [ ] **1.8.1 RED — `__tests__/ProgressBar.test.tsx`:** assert (a) outer track has `bg-bg-surface3`, (b) inner fill has correct `bg-brand-{tone}` class for tone={'green','amber','red'}, (c) `style.width` matches `${percent}%`, (d) percent is clamped to [0, 100].

- [ ] **1.8.2 GREEN — `ProgressBar.tsx`:**

```tsx
type ProgressTone = 'green' | 'red' | 'amber'

interface ProgressBarProps {
  percent: number
  tone: ProgressTone
  height?: number
}

const TONE: Record<ProgressTone, string> = {
  green: 'bg-brand-green',
  red:   'bg-brand-red',
  amber: 'bg-brand-amber',
}

/** Thin horizontal progress track with a colored fill. */
export function ProgressBar({ percent, tone, height = 4 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div
      className="w-full bg-bg-surface3 rounded-full overflow-hidden"
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${TONE[tone]} h-full transition-all`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
```

- [ ] **1.8.3 Test PASS, commit `feat(dark): add ProgressBar atom`.**

### Step 1.9: Atom — `Sparkline` (hand-rolled SVG)

Fixed `viewBox="0 0 340 140"`. Renders the actual line (cyan, 2px solid), the target line (green, 1.5px dashed), an actual fill gradient under the actual line, three dashed gridlines, and a pulsing endpoint dot at the latest actual value. Width fluid (`w-full`); height set by prop.

- [ ] **1.9.1 RED — `__tests__/Sparkline.test.tsx`:**

```tsx
import { render } from '../../../test/utils'
import { Sparkline } from '../Sparkline'
import type { ThroughputPoint } from '../../../types'

const POINTS: ThroughputPoint[] = Array.from({ length: 30 }, (_, i) => ({
  time: new Date(Date.now() - (29 - i) * 60_000).toISOString(),
  actual: 1 + i * 0.1,
  target: 3.5,
}))

describe('Sparkline', () => {
  it('renders an SVG with the documented viewBox', () => {
    const { container } = render(<Sparkline points={POINTS} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 0 340 140')
  })
  it('renders an actual-series path and a dashed target path', () => {
    const { container } = render(<Sparkline points={POINTS} />)
    const paths = container.querySelectorAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(2)
    // dashed target path has stroke-dasharray
    const dashed = Array.from(paths).find((p) => p.getAttribute('stroke-dasharray'))
    expect(dashed).toBeTruthy()
  })
  it('renders a pulsing endpoint dot', () => {
    const { container } = render(<Sparkline points={POINTS} />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThanOrEqual(2) // small + halo
  })
  it('renders an empty SVG (no paths) when given zero points', () => {
    const { container } = render(<Sparkline points={[]} />)
    expect(container.querySelectorAll('path').length).toBe(0)
  })
})
```

- [ ] **1.9.2 GREEN — `Sparkline.tsx`:**

```tsx
import type { ThroughputPoint } from '../../types'

interface SparklineProps {
  points: ThroughputPoint[]
  height?: number
}

const W = 340
const H = 140

/**
 * Hand-rolled SVG sparkline matching dark-ui-v2.html "Live Throughput".
 * Two series: solid cyan actual + dashed green target, plus actual-fill gradient.
 * `points` first→last is left→right time axis; rightmost point gets the pulsing dot.
 */
export function Sparkline({ points, height = 140 }: SparklineProps) {
  if (points.length === 0) {
    return <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} />
  }
  const max = Math.max(...points.flatMap((p) => [p.actual, p.target]), 1)
  const min = 0
  const xStep = W / (points.length - 1 || 1)
  const yScale = (v: number) => H - ((v - min) / (max - min)) * (H - 10) - 5

  const actualD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${yScale(p.actual)}`).join(' ')
  const targetD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${yScale(p.target)}`).join(' ')
  const fillD = `${actualD} L${W},${H} L0,${H} Z`
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[30, 70, 110].map((y) => (
        <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgb(var(--line))" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      <path d={fillD} fill="url(#sparkline-fill)" />
      <path d={actualD} fill="none" stroke="#38bdf8" strokeWidth="2" />
      <path d={targetD} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,3" />
      <circle cx={(points.length - 1) * xStep} cy={yScale(last.actual)} r="4" fill="#38bdf8" />
      <circle cx={(points.length - 1) * xStep} cy={yScale(last.actual)} r="9" fill="#38bdf8" opacity="0.2" className="animate-pulse-dot" />
    </svg>
  )
}
```

- [ ] **1.9.3 Test PASS, commit `feat(dark): add Sparkline atom`.**

### Step 1.10: Molecule — `SectionCard`

Wrapper card with header (uppercase title + optional `link` button on the right or `meta` text), and body containing children. Padding 16 px, gradient surface, rounded.

- [ ] **1.10.1 RED — `__tests__/SectionCard.test.tsx`:** assert (a) renders title and children; (b) renders `link.label` as a button that calls `link.onClick`; (c) renders `meta` text when no link; (d) outer has `stat-gradient`, `border-line`, `rounded-xl`.

- [ ] **1.10.2 GREEN — `SectionCard.tsx`:**

```tsx
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  link?: { label: string; onClick: () => void }
  meta?: ReactNode
  children: ReactNode
}

/** Titled gradient card used as the primary content container. */
export function SectionCard({ title, link, meta, children }: SectionCardProps) {
  return (
    <section className="stat-gradient border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-wider text-fg-3 uppercase">
          {title}
        </h3>
        {link ? (
          <button
            type="button"
            onClick={link.onClick}
            className="text-xs text-brand-cyan hover:text-brand-green"
          >
            {link.label}
          </button>
        ) : meta ? (
          <span className="text-[10px] tracking-wide text-fg-4">{meta}</span>
        ) : null}
      </div>
      {children}
    </section>
  )
}
```

- [ ] **1.10.3 Commit `feat(dark): add SectionCard molecule`.**

### Step 1.11: Molecule — `StatCard`

Composition (top→bottom): top accent bar (3 px, gradient `from-{accent}` → transparent); header row (label + optional `dot` StatusDot inline + IconTile on right); big value (override color via `valueColor`); optional `trend` TrendPill on the same row as `sub` text; gradient surface.

- [ ] **1.11.1 RED — `__tests__/StatCard.test.tsx`:** assert (a) label + value rendered; (b) accent-bar top div has `from-brand-green` (or whichever accent); (c) `dot` renders a StatusDot with matching tone; (d) `trend` renders TrendPill; (e) `sub` text rendered; (f) outer has `stat-gradient`; (g) `valueColor` applied as inline style.

- [ ] **1.11.2 GREEN — `StatCard.tsx`:**

```tsx
import type { ReactNode } from 'react'
import { StatusDot } from './StatusDot'
import { IconTile } from './IconTile'
import { TrendPill } from './TrendPill'

type StatAccent = 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'cyan'

interface StatCardProps {
  accent: StatAccent
  label: string
  value: ReactNode
  valueColor?: string
  icon: ReactNode
  trend?: { direction: 'up' | 'down'; value: string }
  sub?: ReactNode
  dot?: 'green' | 'red' | 'amber'
}

const ACCENT_BAR: Record<StatAccent, string> = {
  green:  'from-brand-green',
  blue:   'from-brand-cyan',
  yellow: 'from-brand-amber',
  red:    'from-brand-red',
  purple: 'from-brand-purple',
  cyan:   'from-brand-cyan',
}

const ICON_TONE: Record<StatAccent, 'green' | 'red' | 'amber' | 'cyan' | 'purple' | 'blue'> = {
  green: 'green', blue: 'blue', yellow: 'amber', red: 'red', purple: 'purple', cyan: 'cyan',
}

/** Gradient stat card: top accent bar, label+icon row, big value, optional trend/sub. */
export function StatCard({ accent, label, value, valueColor, icon, trend, sub, dot }: StatCardProps) {
  return (
    <div className="relative stat-gradient border border-line rounded-xl p-4 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r to-transparent ${ACCENT_BAR[accent]}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {dot && <StatusDot tone={dot} pulse />}
          <span className="text-[10px] font-semibold tracking-widest text-fg-4 uppercase">
            {label}
          </span>
        </div>
        <IconTile tone={ICON_TONE[accent]}>{icon}</IconTile>
      </div>
      <div className="mt-2 text-4xl font-extrabold text-fg-1 leading-tight" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      {(trend || sub) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-fg-4">
          {trend && <TrendPill direction={trend.direction} value={trend.value} />}
          {sub && <span>{sub}</span>}
        </div>
      )}
    </div>
  )
}
```

> **Tailwind safelist note:** dynamic class names like `from-brand-green` must appear as full strings somewhere Tailwind can scan. Because the literal strings `'from-brand-green'` etc. live in the `ACCENT_BAR` map in this file, Tailwind picks them up via its content scan (`./src/**/*.{ts,tsx}`). No safelist edit needed; verify by grep after build.

- [ ] **1.11.3 Commit `feat(dark): add StatCard molecule`.**

### Step 1.12: Molecule — `MachineTile`

Rectangular tile with status-tinted left/full border, optional dark gradient when `tone='down'`, header (machine name + small badge), big value (with override color), unit line, optional progress bar.

- [ ] **1.12.1 RED — `__tests__/MachineTile.test.tsx`:** assert (a) name + value + unit + badge rendered; (b) outer border class matches tone; (c) progress bar renders only when `progressPercent` provided; (d) clicking tile calls `onClick`.

- [ ] **1.12.2 GREEN — `MachineTile.tsx`:**

```tsx
import type { ReactNode } from 'react'
import { ProgressBar } from './ProgressBar'

type Tone = 'running' | 'idle' | 'down' | 'offline'

interface MachineTileProps {
  tone: Tone
  name: string
  badge: ReactNode
  value: ReactNode
  valueColor?: string
  unit: string
  progressPercent?: number
  progressTone?: 'green' | 'red' | 'amber'
  onClick?: () => void
}

const BORDER: Record<Tone, string> = {
  running: 'border-brand-green/40',
  idle:    'border-brand-amber/40',
  down:    'border-brand-red/50 bg-gradient-to-br from-brand-red/10 to-transparent',
  offline: 'border-line',
}

/** Compact machine status tile for the dashboard fleet section. */
export function MachineTile({
  tone, name, badge, value, valueColor, unit, progressPercent, progressTone, onClick,
}: MachineTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left bg-bg-surface3 rounded-lg p-3 border transition-all',
        'hover:border-brand-cyan hover:-translate-y-px',
        BORDER[tone],
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-fg-1">{name}</span>
        {badge}
      </div>
      <div className="text-2xl font-extrabold text-fg-1" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      <div className="text-[10px] text-fg-4 mb-2">{unit}</div>
      {progressPercent !== undefined && progressTone && (
        <ProgressBar percent={progressPercent} tone={progressTone} height={3} />
      )}
    </button>
  )
}
```

- [ ] **1.12.3 Commit `feat(dark): add MachineTile molecule`.**

### Step 1.13: Molecule — `AlertRow` + `alertBadgeVariant` helper

Severity-tinted left border, two-line text. Badge + message on bottom row. Helper maps `AlertBadgeLabel` → existing `Badge` (or a small inline pill — we use a styled `<span>` here since `StatBadge` is a chunk-3 deliverable per spec).

- [ ] **1.13.1 RED — `__tests__/AlertRow.test.tsx`:** assert (a) machine label + time + message rendered; (b) outer has `border-brand-{red|amber|cyan|green}` per severity; (c) `alertBadgeVariant('P1')` returns `{label:'P1', tone:'red'}` etc; export the helper from the same file.

- [ ] **1.13.2 GREEN — `AlertRow.tsx`:**

```tsx
import type { Alert, AlertBadgeLabel } from '../../types'

interface AlertRowProps {
  alert: Alert
  timeAgo: string  // formatted upstream so component is pure
}

const SEVERITY_BORDER = {
  critical: 'border-l-brand-red',
  warn:     'border-l-brand-amber',
  info:     'border-l-brand-cyan',
  ok:       'border-l-brand-green',
} as const

const BADGE_TONE: Record<AlertBadgeLabel, string> = {
  P1:   'bg-brand-red/20 text-brand-red',
  P2:   'bg-brand-amber/20 text-brand-amber',
  P3:   'bg-brand-cyan/20 text-brand-cyan',
  P4:   'bg-fg-5/20 text-fg-3',
  INFO: 'bg-brand-cyan/20 text-brand-cyan',
  OK:   'bg-brand-green/20 text-brand-green',
}

/** Pure helper: maps a badge label to the visual tone classes used by AlertRow. */
export function alertBadgeVariant(label: AlertBadgeLabel): { label: AlertBadgeLabel; classes: string } {
  return { label, classes: BADGE_TONE[label] }
}

/** Live Alerts feed entry with severity-tinted left border. */
export function AlertRow({ alert, timeAgo }: AlertRowProps) {
  return (
    <div
      className={[
        'bg-bg-surface3 rounded-lg p-3 border-l-[3px]',
        SEVERITY_BORDER[alert.severity],
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-fg-1">{alert.machine_label}</span>
        <span className="text-[10px] text-fg-4">{timeAgo}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-fg-2">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${BADGE_TONE[alert.badge_label]}`}>
          {alert.badge_label}
        </span>
        <span>{alert.message}</span>
      </div>
    </div>
  )
}
```

- [ ] **1.13.3 Commit `feat(dark): add AlertRow molecule and alertBadgeVariant helper`.**

### Step 1.14: Molecule — `TimelineItem`

Icon tile + title/meta lines, with separator below (border on container row).

- [ ] **1.14.1 RED — `__tests__/TimelineItem.test.tsx`:** assert (a) title + meta rendered; (b) IconTile rendered with passed tone; (c) bottom border `border-line` present.

- [ ] **1.14.2 GREEN — `TimelineItem.tsx`:**

```tsx
import type { ActivityIconTone, ActivityEvent } from '../../types'
import { IconTile } from './IconTile'

const ICON_GLYPH: Record<ActivityEvent['type'], string> = {
  ticket: '\u26A0',     // ⚠
  production: '\u2638',  // ☸
  visit: '\u2691',       // ⚑
  machine: '\u2699',     // ⚙
  user: '\u26FF',
}

const TONE_TO_ICONTILE: Record<ActivityIconTone, 'green' | 'red' | 'amber' | 'blue' | 'cyan' | 'purple'> = {
  red: 'red', green: 'green', blue: 'blue', purple: 'purple', cyan: 'cyan', yellow: 'amber',
}

interface TimelineItemProps {
  event: ActivityEvent
  timeAgo: string
}

/** Activity timeline row with an icon tile and two-line text body. */
export function TimelineItem({ event, timeAgo }: TimelineItemProps) {
  return (
    <div className="flex gap-3 py-2 border-b border-line last:border-b-0">
      <IconTile tone={TONE_TO_ICONTILE[event.icon_tone]}>{ICON_GLYPH[event.type]}</IconTile>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-fg-1 truncate">{event.title}</div>
        <div className="text-[10px] text-fg-4">{event.meta} · {timeAgo}</div>
      </div>
    </div>
  )
}
```

- [ ] **1.14.3 Commit `feat(dark): add TimelineItem molecule`.**

### Step 1.15: Molecule — `DonutChart` (hand-rolled SVG)

`viewBox="0 0 42 42"` with `r=15.915` (so circumference ≈ 100, making `stroke-dasharray` directly readable as percentage). Up to N segments with absolute count → percentage internally. Center text shows total + label. Right-side legend.

- [ ] **1.15.1 RED — `__tests__/DonutChart.test.tsx`:** assert (a) renders one circle per segment + a base track circle; (b) center text shows `total` and `centerLabel`; (c) legend renders one row per segment with the count; (d) renders nothing extra when no segments.

- [ ] **1.15.2 GREEN — `DonutChart.tsx`:**

```tsx
interface DonutSegment {
  label: string
  value: number
  color: string  // raw hex; donut is intentionally outside the token system because mockup pins exact stroke colors
}

interface DonutChartProps {
  segments: DonutSegment[]
  centerLabel: string
}

const C = 100 // r=15.915 → circumference ≈ 100

/** Hand-rolled SVG donut + legend, matching dark-ui-v2.html "Fleet Breakdown". */
export function DonutChart({ segments, centerLabel }: DonutChartProps) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  let offset = 25  // start at 12 o'clock when rotated -90deg
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="w-32 h-32 flex-shrink-0">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgb(var(--line))" strokeWidth="5" />
        {segments.map((seg, i) => {
          const pct = total === 0 ? 0 : (seg.value / total) * C
          const dasharray = `${pct} ${C - pct}`
          const dashoffset = offset
          offset = offset - pct
          return (
            <circle
              key={i}
              cx="21" cy="21" r="15.915" fill="transparent"
              stroke={seg.color} strokeWidth="5"
              strokeDasharray={dasharray} strokeDashoffset={dashoffset}
              transform="rotate(-90 21 21)"
            />
          )
        })}
        <text x="21" y="20" textAnchor="middle" fill="rgb(var(--fg-1))" fontSize="7" fontWeight="800">{total}</text>
        <text x="21" y="26" textAnchor="middle" fill="rgb(var(--fg-4))" fontSize="3">{centerLabel}</text>
      </svg>
      <div className="flex-1 flex flex-col gap-1.5 text-xs">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="flex-1 text-fg-2">{seg.label}</span>
            <span className="font-semibold text-fg-1">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

> **Note on `dashoffset` math:** the running `offset` accumulator follows the mockup's pattern (each subsequent segment starts where the prior one ended). The reviewer should confirm this produces the exact mockup ordering (Running 50, Idle 16.67, Down 16.67, Offline 16.66 — adds to ~100 with `transform="rotate(-90 21 21)"` rotating zero to 12 o'clock).

- [ ] **1.15.3 Commit `feat(dark): add DonutChart molecule`.**

### Step 1.16: Molecule — `SeverityBar`

Stacked horizontal bar showing P1/P2/P3/P4 proportions with a count footer. Track 24 px tall.

- [ ] **1.16.1 RED — `__tests__/SeverityBar.test.tsx`:** assert (a) one segment per non-zero count; (b) widths sum to 100% when total > 0; (c) footer shows `P1: n / P2: n / P3: n / P4: n`.

- [ ] **1.16.2 GREEN — `SeverityBar.tsx`:**

```tsx
interface SeverityBarProps {
  p1: number
  p2: number
  p3: number
  p4: number
}

/** Stacked severity bar with P1-P4 counts (mockup: tickets-by-severity). */
export function SeverityBar({ p1, p2, p3, p4 }: SeverityBarProps) {
  const total = p1 + p2 + p3 + p4
  const segments: Array<{ key: string; n: number; color: string }> = [
    { key: 'P1', n: p1, color: '#ef4444' },
    { key: 'P2', n: p2, color: '#fbbf24' },
    { key: 'P3', n: p3, color: '#60a5fa' },
    { key: 'P4', n: p4, color: '#94a3b8' },
  ]
  return (
    <div>
      <div className="bg-line h-6 rounded overflow-hidden flex" role="img" aria-label={`Severity totals P1=${p1} P2=${p2} P3=${p3} P4=${p4}`}>
        {segments.map((s) =>
          s.n > 0 ? (
            <div
              key={s.key}
              style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }}
              data-testid={`sev-${s.key}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-fg-4">
        {segments.map((s) => <span key={s.key}>{s.key}: {s.n}</span>)}
      </div>
    </div>
  )
}
```

- [ ] **1.16.3 Commit `feat(dark): add SeverityBar molecule`.**

### Step 1.17: Populate `dark/index.ts` barrel

- [ ] **1.17.1 Replace `src/components/dark/index.ts`:**

```ts
export { StatusDot } from './StatusDot'
export { IconTile } from './IconTile'
export { TrendPill } from './TrendPill'
export { ProgressBar } from './ProgressBar'
export { Sparkline } from './Sparkline'
export { StatCard } from './StatCard'
export { SectionCard } from './SectionCard'
export { MachineTile } from './MachineTile'
export { AlertRow, alertBadgeVariant } from './AlertRow'
export { TimelineItem } from './TimelineItem'
export { DonutChart } from './DonutChart'
export { SeverityBar } from './SeverityBar'
```

- [ ] **1.17.2 Run** `npx tsc -b --noEmit` and `npm run test:run`. Both GREEN.
- [ ] **1.17.3 Commit `chore(dark): populate dark barrel with chunk 1 primitives`.**

### Step 1.18: Rewrite `DashboardPage`

The new page composes the primitives + 3 services + `useLivePolling`. Layout per mockup §dashboard (lines 363-495 of `dark-ui-v2.html`):

```
[ Stat row: 5x StatCard ]
[ Fleet section (8 MachineTile) | Live Throughput section (Sparkline + footer) ]    grid 2fr 1fr at lg
[ Fleet Breakdown (Donut+SeverityBar) | Recent Activity (TimelineItem×N) | Live Alerts (AlertRow×N) ]   grid 1fr 1fr 1fr at lg
```

Polling cadences (per spec §10):
- Sparkline: 5 s
- Alerts: 30 s
- Stat row + machine tiles + activity: one-shot fetch (no polling)

Time formatting: a small inline helper `formatRelative(iso)` that returns "Nm ago" / "Nh ago" / etc. We do NOT introduce `date-fns`. Define it at top of the file.

- [ ] **1.18.1 RED — replace `src/pages/__tests__/DashboardPage.test.tsx`** entirely. Mock the three new services with `vi.mock(...)`. Cover:
  - renders the 5 stat-card labels (`TOTAL MACHINES`, `RUNNING`, `IN PRODUCTION`, `OPEN TICKETS`, `TODAY THROUGHPUT`)
  - renders 12 machine tiles (or first 8 — pick based on layout decision; spec says 8, so render only `metrics.slice(0, 8)`)
  - renders the alert feed messages (e.g. `Motor overload - sorting halted`)
  - renders activity titles (e.g. `M-003 went DOWN`)
  - renders the donut center total `12` and severity counts `P1: 2`, `P2: 2`, `P3: 1`, `P4: 1`
  - renders Sparkline (assert SVG present with viewBox `0 0 340 140`)
  - hides the Open-Tickets stat card and Live-Alerts section for users with role `customer` (NOTE: spec doesn't explicitly require this; check the mockup — mockup shows everything to all roles. Treat all 5 cards as universal. Drop this test bullet unless reviewer requests role gating.)

  Skeleton:

```tsx
import { render, screen } from '../../test/utils'

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, name: 'Aslam', role: 'admin', email: 'a@a', is_active: true } }),
}))

vi.mock('../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn().mockResolvedValue({
      total_machines: 12, running: 6, idle: 2, down: 2, offline: 2,
      in_production: 3, today_throughput_tons: 18.4,
      trend_running_vs_yesterday: 1, trend_throughput_pct: 12,
      open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
    }),
    getMachineMetrics: vi.fn().mockResolvedValue([
      { machine_id: 1, tons_per_hour: 2.4, uptime_percent: 90, progress_percent: 90, current_fruit: 'Banana' },
      // ...8 entries
    ]),
    getThroughputSeries: vi.fn().mockResolvedValue([
      { time: new Date().toISOString(), actual: 3, target: 3.5 },
    ]),
  },
}))
vi.mock('../../services/alertService', () => ({
  alertService: { getAlerts: vi.fn().mockResolvedValue([
    { id: 1, machine_id: 3, machine_label: 'M-003', severity: 'critical', badge_label: 'P1', message: 'Motor overload', created_at: new Date().toISOString() },
  ]) },
}))
vi.mock('../../services/activityService', () => ({
  activityService: { getActivity: vi.fn().mockResolvedValue([
    { id: 1, type: 'ticket', icon_tone: 'red', title: 'M-003 went DOWN', meta: 'TK-0041', created_at: new Date().toISOString() },
  ]) },
}))

import { DashboardPage } from '../DashboardPage'

describe('DashboardPage (Command Center)', () => {
  it('renders all 5 stat-card labels', async () => {
    render(<DashboardPage />)
    for (const label of [/TOTAL MACHINES/i, /RUNNING/i, /IN PRODUCTION/i, /OPEN TICKETS/i, /TODAY THROUGHPUT/i]) {
      expect(await screen.findByText(label)).toBeInTheDocument()
    }
  })
  // …additional cases as bullet list above
})
```

- [ ] **1.18.2 GREEN — replace `src/pages/DashboardPage.tsx`:**

```tsx
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLivePolling } from '../hooks/useLivePolling'
import { liveMetricsService } from '../services/liveMetricsService'
import { alertService } from '../services/alertService'
import { activityService } from '../services/activityService'
import {
  StatCard, SectionCard, MachineTile, Sparkline, DonutChart, SeverityBar,
  AlertRow, TimelineItem,
} from '../components/dark'
import type { FleetSummary, MachineLiveMetrics, ThroughputPoint, Alert, ActivityEvent } from '../types'

function formatRelative(iso: string, now: number = Date.now()): string {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const EMPTY_FLEET: FleetSummary = {
  total_machines: 0, running: 0, idle: 0, down: 0, offline: 0,
  in_production: 0, today_throughput_tons: 0,
  trend_running_vs_yesterday: 0, trend_throughput_pct: 0,
  open_tickets: { total: 0, p1: 0, p2: 0, p3: 0, p4: 0 },
}

/** Command Center: live fleet snapshot per dark-ui-v2.html. */
export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // One-shot fetches: fleet summary + machine metrics + activity
  const [fleet, setFleet] = useState<FleetSummary>(EMPTY_FLEET)
  const [metrics, setMetrics] = useState<MachineLiveMetrics[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  useEffect(() => {
    void liveMetricsService.getFleetSummary().then(setFleet)
    void liveMetricsService.getMachineMetrics().then(setMetrics)
    void activityService.getActivity().then(setActivity)
  }, [])

  // Polled fetches: throughput (5 s), alerts (30 s)
  const sparkline = useLivePolling<ThroughputPoint[]>(
    () => liveMetricsService.getThroughputSeries(new Date()), 5_000, [],
  )
  const alerts = useLivePolling<Alert[]>(alertService.getAlerts, 30_000, [])

  const peak = useMemo(() => sparkline.data.reduce((m, p) => Math.max(m, p.actual), 0), [sparkline.data])
  const avg = useMemo(() => {
    if (sparkline.data.length === 0) return 0
    return sparkline.data.reduce((s, p) => s + p.actual, 0) / sparkline.data.length
  }, [sparkline.data])
  const nowVal = sparkline.data[sparkline.data.length - 1]?.actual ?? 0

  if (!user) return null

  const fleetTiles = metrics.slice(0, 8)
  const tilesTone = (m: MachineLiveMetrics) => {
    if (m.tons_per_hour === null && m.uptime_percent === 0) return 'offline' as const
    if (m.tons_per_hour === null && m.progress_percent < 50) return 'down' as const
    if (m.tons_per_hour === null) return 'idle' as const
    return 'running' as const
  }

  return (
    <div className="space-y-4">
      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard accent="blue"  label="TOTAL MACHINES" icon={'\u2699'} value={fleet.total_machines} sub={`Across 4 sites`} />
        <StatCard accent="green" label="RUNNING" dot="green" icon={'\u25B6'} value={fleet.running} valueColor="#4ade80"
          trend={fleet.trend_running_vs_yesterday >= 0 ? { direction: 'up', value: `${fleet.trend_running_vs_yesterday}` } : { direction: 'down', value: `${Math.abs(fleet.trend_running_vs_yesterday)}` }}
          sub="from yesterday" />
        <StatCard accent="green" label="IN PRODUCTION" dot="green" icon={'\u2638'} value={fleet.in_production} valueColor="#4ade80" sub="Live TDMS sessions" />
        <StatCard accent="red"   label="OPEN TICKETS" dot="red" icon={'\u2691'} value={fleet.open_tickets.total} valueColor="#ef4444"
          sub={`${fleet.open_tickets.p1} P1 Critical · ${fleet.open_tickets.total - fleet.open_tickets.p1} open`} />
        <StatCard accent="cyan"  label="TODAY THROUGHPUT" icon={'\u2696'}
          value={<>{fleet.today_throughput_tons}<span className="text-sm text-fg-4"> t</span></>}
          valueColor="#22d3ee"
          trend={{ direction: fleet.trend_throughput_pct >= 0 ? 'up' : 'down', value: `${Math.abs(fleet.trend_throughput_pct)}%` }}
          sub="vs avg" />
      </div>

      {/* Fleet + Throughput row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Machine Fleet" link={{ label: 'View all →', onClick: () => navigate('/machines') }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {fleetTiles.map((m) => (
              <MachineTile
                key={m.machine_id}
                tone={tilesTone(m)}
                name={`M-${String(m.machine_id).padStart(3, '0')}`}
                badge={<span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-bg-surface3 text-fg-3">{tilesTone(m).toUpperCase()}</span>}
                value={m.tons_per_hour ?? '--'}
                valueColor={m.tons_per_hour === null ? '#64748b' : undefined}
                unit={m.tons_per_hour !== null && m.current_fruit ? `t/hr · ${m.current_fruit}` : (m.current_fruit ?? 'Offline')}
                progressPercent={tilesTone(m) === 'offline' ? undefined : m.progress_percent}
                progressTone={tilesTone(m) === 'down' ? 'red' : tilesTone(m) === 'idle' ? 'amber' : 'green'}
                onClick={() => navigate(`/machines/${m.machine_id}`)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Live Throughput" meta="LAST 30 MIN">
          <Sparkline points={sparkline.data} />
          <div className="flex gap-5 mt-2 pt-2 border-t border-line text-xs">
            <div><div className="text-[10px] text-fg-4">PEAK</div><div className="font-extrabold text-brand-cyan">{peak.toFixed(1)} t/hr</div></div>
            <div><div className="text-[10px] text-fg-4">AVG</div><div className="font-extrabold text-fg-3">{avg.toFixed(1)} t/hr</div></div>
            <div><div className="text-[10px] text-fg-4">NOW</div><div className="font-extrabold text-brand-green">{nowVal.toFixed(1)} t/hr</div></div>
            <div className="ml-auto flex items-center gap-2 text-[10px] text-fg-4">
              <span className="text-brand-cyan">━</span>Actual
              <span className="text-brand-green">┊</span>Target
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Fleet Breakdown">
          <DonutChart
            centerLabel="machines"
            segments={[
              { label: 'Running', value: fleet.running, color: '#4ade80' },
              { label: 'Idle',    value: fleet.idle,    color: '#fbbf24' },
              { label: 'Down',    value: fleet.down,    color: '#ef4444' },
              { label: 'Offline', value: fleet.offline, color: '#64748b' },
            ]}
          />
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-xs font-semibold tracking-wider text-fg-3 uppercase mb-2">Tickets by Severity</div>
            <SeverityBar p1={fleet.open_tickets.p1} p2={fleet.open_tickets.p2} p3={fleet.open_tickets.p3} p4={fleet.open_tickets.p4} />
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity" link={{ label: 'View timeline →', onClick: () => { /* future */ } }}>
          <div>
            {activity.slice(0, 5).map((e) => (
              <TimelineItem key={e.id} event={e} timeAgo={formatRelative(e.created_at)} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Live Alerts" link={{ label: 'View all →', onClick: () => navigate('/tickets') }}>
          <div className="space-y-2">
            {alerts.data.slice(0, 5).map((a) => (
              <AlertRow key={a.id} alert={a} timeAgo={formatRelative(a.created_at)} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
```

> **JSX glyph note:** The `icon` prop receives a string via `{'\u2699'}` (an expression containing a unicode-escaped string literal), NOT `<>\u2699</>` (which would render the literal six characters `\u2699`). All five stat cards above already use the correct `{'\u...'}` form.

- [ ] **1.18.3 Run** the DashboardPage test file. Iterate fixes until GREEN.
- [ ] **1.18.4 Run** `npm run test:run`. Expected: GREEN; total ≥ 230 (math: 192 chunk-0 baseline − 9 deleted legacy DashboardPage tests + ~49 new = ~232 floor).
- [ ] **1.18.5 Run** `npm run build`. Expected: GREEN.
- [ ] **1.18.6 Commit `feat(dashboard): rewrite as Command Center using Phase B primitives`.**

### Step 1.19: Update page-level dark-mode smoke test

- [ ] **1.19.1 Modify `src/pages/__tests__/dark-mode.test.tsx`:**
  - **Remove** the legacy service mocks for `machineService`, `ticketService`, `dailyLogService` AND the now-dead `vi.mock('recharts', …)` block — the new `DashboardPage` no longer imports any of them.
  - **Add** mocks for the three new services:

```ts
vi.mock('../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn().mockResolvedValue({ /* same shape as in DashboardPage.test.tsx */ }),
    getMachineMetrics: vi.fn().mockResolvedValue([]),
    getThroughputSeries: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock('../../services/alertService', () => ({ alertService: { getAlerts: vi.fn().mockResolvedValue([]) } }))
vi.mock('../../services/activityService', () => ({ activityService: { getActivity: vi.fn().mockResolvedValue([]) } }))
```

  - Replace the dashboard probe text `/dashboard/i` with `/TOTAL MACHINES/i` (or add — `getAllByText` already handles multiplicity).

- [ ] **1.19.2 Run** `npx vitest run src/pages/__tests__/dark-mode.test.tsx`. Expected: GREEN.
- [ ] **1.19.3 Commit `test: adapt dark-mode smoke to Command Center markup`.**

### Step 1.20: Final per-chunk gate

- [ ] **1.20.1 Run** `npm run test:run`. Expected: GREEN, total ≥ 230. Update Phase B ratchet floor in this plan section if observed number is higher.
- [ ] **1.20.2 Run** `npm run build`. Expected: GREEN.
- [ ] **1.20.3 Run** `npm run lint`. Expected: zero new errors beyond the 8 pre-existing (chunk 0 actually drove the budget down from 9 to 8).
- [ ] **1.20.4 Manual smoke** — login as `aslam@hortisort.com / password_123`, navigate to `/dashboard`:
  - 5 stat cards visible with accent bars and icon tiles
  - 8 machine tiles render with status border + value + unit + progress bar
  - Sparkline animates: open DevTools, watch console.network in 5 s — confirm `getThroughputSeries` is invoked repeatedly
  - Donut + Severity bar render with correct totals (12 / P1=2 P2=2 P3=1 P4=1)
  - Activity timeline shows 5 entries
  - Alerts feed shows 5 entries with severity-tinted left borders; auto-refresh after 30 s (verify first message persists or rotates depending on mock)
  - Toggle theme: every widget renders cleanly in light mode (gradient surfaces still visible, text legible)
  - Mobile width (375 px): stat cards collapse to 2 cols, fleet tiles 2 cols, all sections stack
  - Browser console: zero errors
- [ ] **1.20.5 Update spec status** in `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md` line 3 to `Status: in implementation (chunk 1 complete)`. Commit:

```bash
git add docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md
git commit -m "docs(spec): mark phase B chunk 1 complete"
```

**End of Chunk 1.**
