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

> Chunks 1-10 will be authored after chunk 0 is fully executed and verified, so each subsequent chunk can incorporate any discoveries from the running app.
