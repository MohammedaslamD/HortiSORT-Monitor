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

---

## Chunk 2: Machines page (dense dark table)

### Scope

Replace `src/pages/MachinesPage.tsx` (a Phase-A card-grid with search + 3
filters + `MachineCard`) with the Phase-B "Machines" page from
`dark-ui-v2.html` lines 498-521:

- Page header: a plain `<h1>Machines</h1>` plus subtitle line —
  `DashboardPage` does not wrap itself in `PageLayout` (the layout shell
  is applied at App.tsx level), and we follow the same pattern.
- 4-card stat row: **Running**, **Idle**, **Down**, **Offline** with the
  exact numeric values from `MOCK_FLEET_SUMMARY` (6 / 2 / 2 / 2 — must
  reconcile with the dashboard's FleetSummary).
- A `SectionCard` (title `"Fleet"`) wrapping a dense `DataTable` with
  columns `Machine | Site | Fruit | Status | Throughput | Uptime Today | Last Active | Open Tickets | Actions`.
- 12 rows total (mockup shows 7; we extend to 12 to match fleet total).
- `Status` cell renders a `StatBadge` (variants: `running`, `idle`,
  `down`, `offline`).
- `Uptime Today` cell renders a 70-px `ProgressBar` wrapped in a
  fixed-width container plus a small `XX%` label, both tinted by the
  row's status. When status is `idle` or `offline` (no live uptime), the
  cell renders the literal `--`.
- `Throughput` cell shows `tons_per_hour.toFixed(1) + ' t/hr'` or `--`.
- `Last Active` cell uses the shared `formatRelative()` helper (extracted
  in step 2.5 from `DashboardPage.tsx`).
- `Open Tickets` cell shows the integer right-aligned.
- `Actions` cell shows two ghost `Button`s ("Update", "Ticket") at the
  new `xs` size. Click handlers preserve the Phase-A navigation
  (`navigate('/machines/:id/update-status')`,
  `navigate('/tickets/new?machine=:id')`).
- The Phase-A search/filter row is **deleted** for Phase B (mockup shows
  none). Re-introducing filters is in spec §16 (out of scope).
- Phase-A `MachineCard`, `getMachinesByRole`, `machineService` continue
  to exist unchanged — strangler pattern. Removal is a future cleanup
  chunk.

### Pre-flight: actual chunk-1 component signatures

(Verified in code on 2026-04-27.)

| Component | Signature | Path |
|-----------|-----------|------|
| `StatCard` | `accent: 'green'\|'blue'\|'yellow'\|'red'\|'purple'\|'cyan'`, `label`, `value: ReactNode`, `valueColor?: string`, **required** `icon: ReactNode`, `trend?`, `sub?`, `dot?: 'green'\|'red'\|'amber'` | `src/components/dark/StatCard.tsx` |
| `ProgressBar` | `percent: number`, `tone: 'green'\|'red'\|'amber'`, `height?: number`. Has `w-full` internally — width must be controlled by an outer wrapper. **No** `className` pass-through. | `src/components/dark/ProgressBar.tsx` |
| `SectionCard` | **required** `title: string`, optional `link`, `meta`, `children` | `src/components/dark/SectionCard.tsx` |
| `PageLayout` | App-level shell with required `pageTitle`, `userName`, `userRole`, `onLogout`. **Not** consumed inside individual pages. | `src/components/layout/PageLayout.tsx` |
| `Button` (existing common) | `variant: 'primary'\|'secondary'\|'danger'\|'ghost'`, `size: 'sm'\|'md'\|'lg'` | `src/components/common/Button.tsx` |
| `formatRelative` (inline in Dashboard) | `(iso: string, now: number = Date.now()): string` — buckets `<1m "just now"`, `<60m "Xm ago"`, `<24h "Xh ago"`, else `"Xd ago"`. Note the **number** ms-epoch arg, not `Date`. | `src/pages/DashboardPage.tsx` lines 14-22 |

### New / changed files

| File | Change |
|------|--------|
| `src/types/index.ts` | **add** `MachineRow` interface and `MachineStatusTone` type alias |
| `src/data/mockMachineRows.ts` | **new** — 12-row dataset, timestamps relative to `Date.now()` at module load |
| `src/services/liveMetricsService.ts` | **add** `getMachineRows(): Promise<MachineRow[]>` |
| `src/services/__tests__/liveMetricsService.test.ts` | **add** tests for `getMachineRows` |
| `src/components/common/Button.tsx` | **add** `xs` size — additive |
| `src/components/common/__tests__/Button.test.tsx` | **add** test for `xs` |
| `src/components/dark/StatBadge.tsx` | **new** atom — 17 variants |
| `src/components/dark/__tests__/StatBadge.test.tsx` | **new** |
| `src/components/dark/DataTable.tsx` | **new** molecule |
| `src/components/dark/__tests__/DataTable.test.tsx` | **new** |
| `src/components/dark/statusToBadgeVariant.ts` | **new** lint-safe helper file |
| `src/components/dark/__tests__/statusToBadgeVariant.test.ts` | **new** |
| `src/components/dark/index.ts` | **add** `StatBadge`, `DataTable`, `statusToBadgeVariant` exports |
| `src/utils/formatRelative.ts` | **new** — extracted from DashboardPage; **preserves the existing "just now" string** |
| `src/utils/__tests__/formatRelative.test.ts` | **new** |
| `src/pages/DashboardPage.tsx` | **modify** — drop inline `formatRelative`, import shared one |
| `src/pages/MachinesPage.tsx` | **rewrite** |
| `src/pages/__tests__/MachinesPage.test.tsx` | **new** |
| `src/pages/__tests__/dark-mode.test.tsx` | **modify** — append MachinesPage entry to `pages[]` and add `getMachineRows` to the existing `liveMetricsService` mock |
| `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md` | **modify** — line 236 (Button row) to mention `xs` size; add note in §6.1 StatBadge row that 17/21 variants ship in chunk 2; line 3 status |

### Style reminders specific to this chunk

- **No semicolons in new files**, but `Button.tsx` and `types/index.ts`
  are pre-existing with semicolons — match the file's style for any
  added line.
- Helpers exported from a component file fail `react-refresh/only-export-components`
  (chunk-1 lesson). Therefore:
  - `statusToBadgeVariant` lives in its own file
  - The `toneClasses` map for `StatBadge` is module-private (not exported)
  - `formatRelative` lives in `src/utils/`, not in `dark/`
- No `let x; x = …` mutation patterns in component bodies. DataTable uses
  `.map(…)` only.
- No ref writes during render (none expected).
- Render Unicode glyphs as `{'\u25B6'}` etc., not literal characters.
- Test probes likely to multi-match: `"Running"`, `"Idle"`, `"Down"`,
  `"Offline"` (all appear in stat-card label AND status badge cells);
  use `getAllByText` / `findAllByText`.

### Step 2.1: Add `MachineRow` type

- [ ] **2.1.1** Open `src/types/index.ts`. Append (after the existing
      `MachineLiveMetrics` block — line ~441; preserve file-local
      semicolon style):

```ts
/** Status tone for a machine row in the Machines table. */
export type MachineStatusTone = 'running' | 'idle' | 'down' | 'offline';

/**
 * Flat row describing one machine for the Phase-B Machines table.
 * Joins fields from `Machine`, `MachineLiveMetrics`, and per-row
 * aggregates (`open_tickets_count`, `last_active`).
 *
 * `fruit` is always populated from the machine's product assignment,
 * even when the machine is offline/idle (it represents what the
 * machine sorts, not what is currently flowing).
 *
 * `tons_per_hour` and `uptime_percent` are nullable: null indicates
 * "no live signal", rendered as the literal `--` in the table.
 */
export interface MachineRow {
  machine_id: number;
  machine_label: string;
  site: string;
  fruit: string;
  status: MachineStatusTone;
  tons_per_hour: number | null;
  uptime_percent: number | null;
  last_active: string;             // ISO timestamp
  open_tickets_count: number;
}
```

- [ ] **2.1.2** Run `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **2.1.3** Commit `feat(types): add MachineRow + MachineStatusTone for Phase B machines table`.

### Step 2.2: Mock data — `mockMachineRows.ts`

> **Decision (reviewer issue 8):** the mock computes `last_active`
> against `Date.now()` at module load. This means a developer running
> `npm run dev` next month still sees "Now" for the live rows in manual
> smoke. Tests inject explicit ISO strings via the page-level mock so
> they remain hermetic.

- [ ] **2.2.1** Create `src/data/mockMachineRows.ts`:

```ts
import type { MachineRow } from '../types'

const NOW = Date.now()
const minutesAgo = (m: number): string => new Date(NOW - m * 60_000).toISOString()
const hoursAgo = (h: number): string => new Date(NOW - h * 3_600_000).toISOString()
const daysAgo = (d: number): string => new Date(NOW - d * 86_400_000).toISOString()

/**
 * 12 machine rows for the Phase-B Machines table.
 * Tone tally must reconcile with MOCK_FLEET_SUMMARY: 6 running / 2 idle / 2 down / 2 offline.
 * Rows 1-7 are verbatim from dark-ui-v2.html lines 510-516; rows 8-12
 * extend to fleet total while preserving the 6/2/2/2 tally.
 */
export const MOCK_MACHINE_ROWS: MachineRow[] = [
  { machine_id: 1,  machine_label: 'M-001 Banana Sorter A',  site: 'Site 1', fruit: 'Banana',      status: 'running', tons_per_hour: 2.4,  uptime_percent: 90,   last_active: minutesAgo(0),  open_tickets_count: 0 },
  { machine_id: 2,  machine_label: 'M-002 Mango Sorter A',   site: 'Site 1', fruit: 'Mango',       status: 'running', tons_per_hour: 1.9,  uptime_percent: 75,   last_active: minutesAgo(0),  open_tickets_count: 1 },
  { machine_id: 3,  machine_label: 'M-003 Pomegranate A',    site: 'Site 1', fruit: 'Pomegranate', status: 'down',    tons_per_hour: 0,    uptime_percent: 30,   last_active: hoursAgo(2),    open_tickets_count: 2 },
  { machine_id: 4,  machine_label: 'M-004 Grapes Sorter A',  site: 'Site 2', fruit: 'Grapes',      status: 'idle',    tons_per_hour: null, uptime_percent: null, last_active: daysAgo(1),     open_tickets_count: 0 },
  { machine_id: 5,  machine_label: 'M-005 Grapes Sorter B',  site: 'Site 2', fruit: 'Grapes',      status: 'running', tons_per_hour: 3.1,  uptime_percent: 85,   last_active: minutesAgo(0),  open_tickets_count: 0 },
  { machine_id: 6,  machine_label: 'M-006 Pomegranate B',    site: 'Site 2', fruit: 'Pomegranate', status: 'running', tons_per_hour: 2.7,  uptime_percent: 70,   last_active: minutesAgo(0),  open_tickets_count: 1 },
  { machine_id: 7,  machine_label: 'M-007 Mango Sorter B',   site: 'Site 3', fruit: 'Mango',       status: 'offline', tons_per_hour: null, uptime_percent: null, last_active: daysAgo(3),     open_tickets_count: 1 },
  { machine_id: 8,  machine_label: 'M-008 Apple Sorter A',   site: 'Site 3', fruit: 'Apple',       status: 'running', tons_per_hour: 1.5,  uptime_percent: 60,   last_active: minutesAgo(0),  open_tickets_count: 0 },
  { machine_id: 9,  machine_label: 'M-009 Banana Sorter B',  site: 'Site 3', fruit: 'Banana',      status: 'running', tons_per_hour: 2.2,  uptime_percent: 78,   last_active: minutesAgo(2),  open_tickets_count: 0 },
  { machine_id: 10, machine_label: 'M-010 Apple Sorter B',   site: 'Site 4', fruit: 'Apple',       status: 'idle',    tons_per_hour: null, uptime_percent: null, last_active: hoursAgo(5),    open_tickets_count: 0 },
  { machine_id: 11, machine_label: 'M-011 Mango Sorter C',   site: 'Site 4', fruit: 'Mango',       status: 'down',    tons_per_hour: 0,    uptime_percent: 25,   last_active: hoursAgo(8),    open_tickets_count: 1 },
  { machine_id: 12, machine_label: 'M-012 Apple Sorter C',   site: 'Site 4', fruit: 'Apple',       status: 'offline', tons_per_hour: null, uptime_percent: null, last_active: daysAgo(5),     open_tickets_count: 0 },
]
```

> **Reconciliation check (verify before committing):** count tones —
> 6 running, 2 idle, 2 down, 2 offline = 12. Equals
> `MOCK_FLEET_SUMMARY.{running,idle,down,offline}`.

- [ ] **2.2.2** Run `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **2.2.3** Commit `feat(data): add MOCK_MACHINE_ROWS for machines table`.

### Step 2.3: Service — `getMachineRows()` (RED → GREEN)

- [ ] **2.3.1 RED** Append to `src/services/__tests__/liveMetricsService.test.ts`:

```ts
describe('getMachineRows', () => {
  it('resolves with the full mock row set', async () => {
    const rows = await liveMetricsService.getMachineRows()
    expect(rows).toHaveLength(12)
  })

  it('preserves the mockup order — first row is M-001', async () => {
    const rows = await liveMetricsService.getMachineRows()
    expect(rows[0].machine_label).toBe('M-001 Banana Sorter A')
  })

  it('reconciles tone counts with FleetSummary (6/2/2/2)', async () => {
    const rows = await liveMetricsService.getMachineRows()
    const counts = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ running: 6, idle: 2, down: 2, offline: 2 })
  })
})
```

- [ ] **2.3.2** Run `npx vitest run src/services/__tests__/liveMetricsService.test.ts`. Expected: RED.
- [ ] **2.3.3 GREEN** Edit `src/services/liveMetricsService.ts`:
  - Add `import { MOCK_MACHINE_ROWS } from '../data/mockMachineRows'`
  - Extend the type-only import to include `MachineRow`
  - Add to the `liveMetricsService` object:

```ts
async getMachineRows(): Promise<MachineRow[]> {
  return MOCK_MACHINE_ROWS
},
```

- [ ] **2.3.4** Run `npx vitest run src/services/__tests__/liveMetricsService.test.ts`. Expected: GREEN.
- [ ] **2.3.5** Commit `feat(service): add liveMetricsService.getMachineRows`.

### Step 2.4: Extend `Button` with `xs` size + spec update

> **Spec deviation note (reviewer issue 7):** spec §6.1 line 236 says
> `size: 'sm' \| 'md'`, with mini buttons (`padding:4px 8px;font-size:10px`)
> mapping to `sm`. We deviate to `xs` because redefining `sm` would
> change every existing call site (forms, login, modals) silently.
> Adding `xs` is purely additive. We **also update the spec** in step
> 2.4.6 so the design system stays the source of truth.

- [ ] **2.4.1 RED** Append to `src/components/common/__tests__/Button.test.tsx`:

```ts
it('renders xs size with px-2 py-1 text-[10px]', () => {
  render(<Button size="xs" onClick={() => {}}>X</Button>)
  const btn = screen.getByRole('button', { name: 'X' })
  expect(btn.className).toMatch(/px-2/)
  expect(btn.className).toMatch(/py-1\b/)
  expect(btn.className).toMatch(/text-\[10px\]/)
})
```

- [ ] **2.4.2** Run `npx vitest run src/components/common/__tests__/Button.test.tsx`. Expected: RED.
- [ ] **2.4.3 GREEN** Edit `src/components/common/Button.tsx`:
  - `type ButtonSize = 'sm' | 'md' | 'lg';` → `type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';`
  - Add to `sizeClasses`: `xs: 'px-2 py-1 text-[10px]',`
- [ ] **2.4.4** Run `npx vitest run src/components/common/__tests__/Button.test.tsx`. Expected: GREEN.
- [ ] **2.4.5** Run `npm run build`. Expected: GREEN.
- [ ] **2.4.6** Edit spec line 236 — replace `size: 'sm' \| 'md'` with
      `size: 'xs' \| 'sm' \| 'md'` and add a parenthetical:
      `(xs is the table-row mini size at \`px-2 py-1 text-[10px]\`)`.
- [ ] **2.4.7** Commit `feat(button): add xs size for table-row mini buttons`. (Spec edit included in same commit since it's the design-system addendum.)

### Step 2.5: Utility — `formatRelative` (extract; **preserve "just now"**)

> **Decision (reviewer issue 5):** the extracted helper keeps the exact
> behaviour of the chunk-1 inline version — string `"just now"` for
> sub-minute, signature `(iso, now: number = Date.now())`. Mockup
> shows "Now"; we accept the cosmetic divergence to avoid touching
> chunk-1 tests / activity feed strings. Mockup-fidelity rename is a
> Phase-C polish item.

- [ ] **2.5.1 RED** Create `src/utils/__tests__/formatRelative.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatRelative } from '../formatRelative'

describe('formatRelative', () => {
  const NOW_MS = new Date('2026-04-25T10:00:00.000Z').getTime()

  it('returns "just now" for sub-minute timestamps', () => {
    const t = new Date(NOW_MS - 30_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('just now')
  })

  it('returns "Xm ago" for minutes', () => {
    const t = new Date(NOW_MS - 15 * 60_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('15m ago')
  })

  it('returns "Xh ago" for hours', () => {
    const t = new Date(NOW_MS - 3 * 3_600_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('3h ago')
  })

  it('returns "Xd ago" for days', () => {
    const t = new Date(NOW_MS - 2 * 86_400_000).toISOString()
    expect(formatRelative(t, NOW_MS)).toBe('2d ago')
  })
})
```

- [ ] **2.5.2** Run; expect RED.
- [ ] **2.5.3 GREEN** Create `src/utils/formatRelative.ts` — copy the
      inline implementation verbatim from `DashboardPage.tsx:14-22`:

```ts
/**
 * Format an ISO timestamp as a short relative-time string.
 * Buckets: <1m "just now"; <60m "Xm ago"; <24h "Xh ago"; else "Xd ago".
 *
 * @param iso  ISO timestamp string
 * @param now  reference time in ms-epoch (defaults to Date.now())
 */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diffMin = Math.floor((now - new Date(iso).getTime()) / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const h = Math.floor(diffMin / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
```

- [ ] **2.5.4** Run; expect GREEN.
- [ ] **2.5.5 Refactor**: in `src/pages/DashboardPage.tsx`, delete the
      inline `formatRelative` function and add
      `import { formatRelative } from '../utils/formatRelative'`.
- [ ] **2.5.6** Run `npx vitest run src/pages/__tests__/DashboardPage.test.tsx`. Expected: GREEN (string output identical).
- [ ] **2.5.7** Commit `refactor(utils): extract formatRelative for shared use`.

### Step 2.6: Atom — `StatBadge` (RED → GREEN)

> Spec §6.1 enumerates 21 variants; chunk 2 ships **17** with confirmed
> mockup mappings. The remaining 4 (`maint`, `routine`, `emergency`,
> `install`) are added in whichever later chunk first uses them. Spec
> note added in step 2.12.5.

- [ ] **2.6.1 RED** Create `src/components/dark/__tests__/StatBadge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/utils'
import { StatBadge } from '../StatBadge'

describe('StatBadge', () => {
  it('renders children', () => {
    render(<StatBadge variant="running">Running</StatBadge>)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it.each([
    ['running',   'bg-green-500/15',  'text-green-400'],
    ['idle',      'bg-yellow-500/15', 'text-yellow-400'],
    ['down',      'bg-red-500/15',    'text-red-400'],
    ['offline',   'bg-slate-500/15',  'text-slate-400'],
    ['live',      'bg-green-500/15',  'text-green-400'],
    ['critical',  'bg-red-500/15',    'text-red-400'],
    ['high',      'bg-orange-500/15', 'text-orange-400'],
    ['medium',    'bg-yellow-500/15', 'text-yellow-400'],
    ['low',       'bg-blue-500/15',   'text-blue-400'],
    ['open',      'bg-red-500/15',    'text-red-400'],
    ['inprog',    'bg-yellow-500/15', 'text-yellow-400'],
    ['resolved',  'bg-green-500/15',  'text-green-400'],
    ['completed', 'bg-green-500/15',  'text-green-400'],
    ['admin',     'bg-purple-500/15', 'text-purple-400'],
    ['engineer',  'bg-blue-500/15',   'text-blue-400'],
    ['customer',  'bg-cyan-500/15',   'text-cyan-400'],
    ['notrun',    'bg-slate-500/15',  'text-slate-400'],
  ] as const)('variant %s applies bg %s and text %s', (variant, bg, text) => {
    render(<StatBadge variant={variant}>X</StatBadge>)
    const el = screen.getByText('X')
    expect(el.className).toContain(bg)
    expect(el.className).toContain(text)
  })

  it('uppercase modifier applied for variant="live"', () => {
    render(<StatBadge variant="live">LIVE</StatBadge>)
    expect(screen.getByText('LIVE').className).toContain('uppercase')
  })
})
```

- [ ] **2.6.2** Run; expect RED.
- [ ] **2.6.3 GREEN** Create `src/components/dark/StatBadge.tsx`:

```tsx
import type { ReactNode } from 'react'

export type StatBadgeVariant =
  | 'running' | 'idle' | 'down' | 'offline' | 'live'
  | 'critical' | 'high' | 'medium' | 'low'
  | 'open' | 'inprog' | 'resolved' | 'completed'
  | 'admin' | 'engineer' | 'customer'
  | 'notrun'

interface StatBadgeProps {
  variant: StatBadgeVariant
  children: ReactNode
}

const toneClasses: Record<StatBadgeVariant, string> = {
  running:   'bg-green-500/15 text-green-400 border border-green-500/30',
  idle:      'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  down:      'bg-red-500/15 text-red-400 border border-red-500/30',
  offline:   'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  live:      'bg-green-500/15 text-green-400 border border-green-500/30 uppercase',
  critical:  'bg-red-500/15 text-red-400 border border-red-500/30',
  high:      'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  medium:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  low:       'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  open:      'bg-red-500/15 text-red-400 border border-red-500/30',
  inprog:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  resolved:  'bg-green-500/15 text-green-400 border border-green-500/30',
  completed: 'bg-green-500/15 text-green-400 border border-green-500/30',
  admin:     'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  engineer:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  customer:  'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  notrun:    'bg-slate-500/15 text-slate-400 border border-slate-500/30',
}

/**
 * Pill-shaped status badge used across tables, alert rows, and lists.
 * 17/21 spec variants today; extend as future chunks need.
 */
export function StatBadge({ variant, children }: StatBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${toneClasses[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **2.6.4** Run; expect GREEN.
- [ ] **2.6.5** Commit `feat(dark): StatBadge atom with 17 variants`.

### Step 2.7: Helper — `statusToBadgeVariant` (own file)

- [ ] **2.7.1 RED** Create `src/components/dark/__tests__/statusToBadgeVariant.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { statusToBadgeVariant } from '../statusToBadgeVariant'

describe('statusToBadgeVariant', () => {
  it.each([
    ['running', 'running'],
    ['idle', 'idle'],
    ['down', 'down'],
    ['offline', 'offline'],
  ] as const)('%s -> %s', (status, expected) => {
    expect(statusToBadgeVariant(status)).toBe(expected)
  })
})
```

- [ ] **2.7.2** Run; expect RED.
- [ ] **2.7.3 GREEN** Create `src/components/dark/statusToBadgeVariant.ts`:

```ts
import type { MachineStatusTone } from '../../types'
import type { StatBadgeVariant } from './StatBadge'

/** 1:1 mapping today; abstracted so future status values can be remapped. */
export function statusToBadgeVariant(status: MachineStatusTone): StatBadgeVariant {
  return status
}
```

- [ ] **2.7.4** Run; expect GREEN.
- [ ] **2.7.5** Commit `feat(dark): statusToBadgeVariant helper`.

### Step 2.8: Molecule — `DataTable` (RED → GREEN)

- [ ] **2.8.1 RED** Create `src/components/dark/__tests__/DataTable.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/utils'
import userEvent from '@testing-library/user-event'
import { DataTable } from '../DataTable'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'qty', label: 'Qty', align: 'right' as const },
]

describe('DataTable', () => {
  it('renders header cells uppercase + tracking + 10px text', () => {
    render(<DataTable columns={columns} rows={[]} />)
    const nameHeader = screen.getByText('Name')
    expect(nameHeader.className).toContain('uppercase')
    expect(nameHeader.className).toMatch(/tracking-/)
    expect(nameHeader.className).toContain('text-[10px]')
  })

  it('renders all body rows', () => {
    const rows = [
      { id: 1, cells: ['Alpha', '5'] },
      { id: 2, cells: ['Beta',  '7'] },
    ]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('first body cell of each row gets fg-1 + font-semibold', () => {
    const rows = [{ id: 1, cells: ['Alpha', '5'] }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('Alpha').className).toMatch(/font-semibold/)
  })

  it('right-aligns when column.align="right"', () => {
    const rows = [{ id: 1, cells: ['Alpha', '5'] }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByText('5').className).toContain('text-right')
  })

  it('invokes onRowClick with row id', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const rows = [{ id: 42, cells: ['Alpha', '5'] }]
    render(<DataTable columns={columns} rows={rows} onRowClick={onRowClick} />)
    await user.click(screen.getByText('Alpha'))
    expect(onRowClick).toHaveBeenCalledWith(42)
  })

  it('renders ReactNode cells', () => {
    const rows = [{ id: 1, cells: [<span key="x" data-testid="custom">custom</span>, '5'] }]
    render(<DataTable columns={columns} rows={rows} />)
    expect(screen.getByTestId('custom')).toBeInTheDocument()
  })
})
```

- [ ] **2.8.2** Run; expect RED.
- [ ] **2.8.3 GREEN** Create `src/components/dark/DataTable.tsx`:

```tsx
import type { ReactNode } from 'react'

interface ColumnDef {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface RowDef {
  id: string | number
  cells: ReactNode[]
}

interface DataTableProps {
  columns: ColumnDef[]
  rows: RowDef[]
  onRowClick?: (id: string | number) => void
}

const alignClass = (align: ColumnDef['align']): string => {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

/** Dense dark table primitive. Header uppercase 10px; first-col emphasized. */
export function DataTable({ columns, rows, onRowClick }: DataTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line/40">
          {columns.map((col) => (
            <th
              key={col.key}
              className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-fg-6 ${alignClass(col.align)}`}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={`border-b border-line/40 hover:bg-bg-surface3 ${onRowClick ? 'cursor-pointer' : ''}`}
            onClick={onRowClick ? () => onRowClick(row.id) : undefined}
          >
            {row.cells.map((cell, idx) => (
              <td
                key={idx}
                className={`px-3 py-2 ${alignClass(columns[idx]?.align)} ${idx === 0 ? 'text-fg-1 font-semibold' : 'text-fg-3'}`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **2.8.4** Run; expect GREEN.
- [ ] **2.8.5** Commit `feat(dark): DataTable molecule`.

### Step 2.9: Add to barrel

- [ ] **2.9.1** Append to `src/components/dark/index.ts`:

```ts
export { StatBadge } from './StatBadge'
export type { StatBadgeVariant } from './StatBadge'
export { DataTable } from './DataTable'
export { statusToBadgeVariant } from './statusToBadgeVariant'
```

- [ ] **2.9.2** Run `npm run build`. Expected: GREEN.
- [ ] **2.9.3** Commit `chore(dark): export StatBadge + DataTable from barrel`.

### Step 2.10: Rewrite `MachinesPage` (RED → GREEN)

- [ ] **2.10.1 RED** Create `src/pages/__tests__/MachinesPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { MachinesPage } from '../MachinesPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const fleetSummary = {
  total_machines: 12, running: 6, idle: 2, down: 2, offline: 2,
  in_production: 3, today_throughput_tons: 18.4,
  trend_running_vs_yesterday: 1, trend_throughput_pct: 12,
  open_tickets: { total: 6, p1: 2, p2: 2, p3: 1, p4: 1 },
}

const baseRows = [
  { machine_id: 1, machine_label: 'M-001 Banana Sorter A', site: 'Site 1', fruit: 'Banana',      status: 'running' as const, tons_per_hour: 2.4,  uptime_percent: 90,   last_active: new Date().toISOString(),                              open_tickets_count: 0 },
  { machine_id: 3, machine_label: 'M-003 Pomegranate A',   site: 'Site 1', fruit: 'Pomegranate', status: 'down'    as const, tons_per_hour: 0,    uptime_percent: 30,   last_active: new Date(Date.now() - 2 * 3_600_000).toISOString(),     open_tickets_count: 2 },
  { machine_id: 4, machine_label: 'M-004 Grapes Sorter A', site: 'Site 2', fruit: 'Grapes',      status: 'idle'    as const, tons_per_hour: null, uptime_percent: null, last_active: new Date(Date.now() - 86_400_000).toISOString(),         open_tickets_count: 0 },
  { machine_id: 7, machine_label: 'M-007 Mango Sorter B',  site: 'Site 3', fruit: 'Mango',       status: 'offline' as const, tons_per_hour: null, uptime_percent: null, last_active: new Date(Date.now() - 3 * 86_400_000).toISOString(),     open_tickets_count: 1 },
]

vi.mock('../../services/liveMetricsService', () => ({
  liveMetricsService: {
    getFleetSummary: vi.fn(),
    getMachineRows: vi.fn(),
  },
}))

import { liveMetricsService } from '../../services/liveMetricsService'

describe('MachinesPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(liveMetricsService.getFleetSummary).mockResolvedValue(fleetSummary)
    vi.mocked(liveMetricsService.getMachineRows).mockResolvedValue(baseRows)
  })

  it('renders title + subtitle', async () => {
    render(<MachinesPage />)
    expect(await screen.findByText('Machines')).toBeInTheDocument()
    expect(screen.getByText(/All 12 machines across 4 sites/i)).toBeInTheDocument()
  })

  it('renders 4 stat cards reflecting FleetSummary (6/2/2/2)', async () => {
    render(<MachinesPage />)
    await waitFor(() => {
      // "Running" appears in StatCard label AND in row badge — multi-match
      expect(screen.getAllByText('Running').length).toBeGreaterThanOrEqual(2)
    })
    expect(screen.getAllByText('Idle').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Down').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Offline').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(3)
  })

  it('renders one DataTable row per machine with throughput and "--" for null', async () => {
    render(<MachinesPage />)
    expect(await screen.findByText('M-001 Banana Sorter A')).toBeInTheDocument()
    expect(screen.getByText('M-003 Pomegranate A')).toBeInTheDocument()
    expect(screen.getByText('2.4 t/hr')).toBeInTheDocument()
    expect(screen.getAllByText('--').length).toBeGreaterThanOrEqual(2)
  })

  it('renders Update + Ticket buttons per row and navigates on click', async () => {
    const user = userEvent.setup()
    render(<MachinesPage />)
    const updateButtons = await screen.findAllByRole('button', { name: 'Update' })
    expect(updateButtons.length).toBe(4)
    await user.click(updateButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/machines/1/update-status')
    const ticketButtons = screen.getAllByRole('button', { name: 'Ticket' })
    await user.click(ticketButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/new?machine=1')
  })

  it('renders empty state when service resolves to []', async () => {
    vi.mocked(liveMetricsService.getMachineRows).mockResolvedValueOnce([])
    render(<MachinesPage />)
    expect(await screen.findByText(/no machines/i)).toBeInTheDocument()
  })
})
```

- [ ] **2.10.2** Run; expect RED.

- [ ] **2.10.3 GREEN** Replace `src/pages/MachinesPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import type { FleetSummary, MachineRow } from '../types'
import { liveMetricsService } from '../services/liveMetricsService'
import { Button } from '../components/common'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
  ProgressBar,
  statusToBadgeVariant,
} from '../components/dark'
import { formatRelative } from '../utils/formatRelative'

const STAT_ICON = {
  running: '\u25B6',  // ▶
  idle:    '\u23F8',  // ⏸
  down:    '\u26A0',  // ⚠
  offline: '\u26AA',  // ⚪
} as const

const COLUMNS = [
  { key: 'machine',    label: 'Machine' },
  { key: 'site',       label: 'Site' },
  { key: 'fruit',      label: 'Fruit' },
  { key: 'status',     label: 'Status' },
  { key: 'throughput', label: 'Throughput' },
  { key: 'uptime',     label: 'Uptime Today' },
  { key: 'lastActive', label: 'Last Active' },
  { key: 'tickets',    label: 'Open Tickets', align: 'right' as const },
  { key: 'actions',    label: 'Actions' },
]

const TONE_COLOR: Record<MachineRow['status'], string> = {
  running: 'text-green-400',
  idle:    'text-yellow-400',
  down:    'text-red-400',
  offline: 'text-slate-400',
}

const PROGRESS_TONE: Record<'running' | 'down', 'green' | 'red'> = {
  running: 'green',
  down: 'red',
}

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1)

/** Phase-B Machines page — dense dark table per dark-ui-v2.html lines 498-521. */
export function MachinesPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<FleetSummary | null>(null)
  const [rows, setRows] = useState<MachineRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      liveMetricsService.getFleetSummary(),
      liveMetricsService.getMachineRows(),
    ]).then(([s, r]) => {
      if (cancelled) return
      setSummary(s)
      setRows(r)
    })
    return () => { cancelled = true }
  }, [])

  const tableRows = (rows ?? []).map((r) => ({
    id: r.machine_id,
    cells: [
      r.machine_label,
      r.site,
      r.fruit,
      <StatBadge key="s" variant={statusToBadgeVariant(r.status)}>
        {capitalize(r.status)}
      </StatBadge>,
      r.tons_per_hour === null ? '--' : `${r.tons_per_hour.toFixed(1)} t/hr`,
      r.uptime_percent === null || (r.status !== 'running' && r.status !== 'down') ? '--' : (
        <div key="u" className="flex items-center gap-1.5">
          <div className="w-[70px]">
            <ProgressBar percent={r.uptime_percent} tone={PROGRESS_TONE[r.status]} />
          </div>
          <span className={`text-[10px] ${TONE_COLOR[r.status]}`}>{r.uptime_percent}%</span>
        </div>
      ),
      formatRelative(r.last_active),
      r.open_tickets_count,
      <div key="a" className="flex gap-1">
        <Button size="xs" variant="ghost" onClick={() => navigate(`/machines/${r.machine_id}/update-status`)}>Update</Button>
        <Button size="xs" variant="ghost" onClick={() => navigate(`/tickets/new?machine=${r.machine_id}`)}>Ticket</Button>
      </div>,
    ],
  }))

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-fg-1">Machines</h1>
        <p className="text-sm text-fg-4">All 12 machines across 4 sites</p>
      </header>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard accent="green"  label="Running" value={summary.running} valueColor="#4ade80" icon={<>{STAT_ICON.running}</>} dot="green" />
          <StatCard accent="yellow" label="Idle"    value={summary.idle}    valueColor="#fbbf24" icon={<>{STAT_ICON.idle}</>} />
          <StatCard accent="red"    label="Down"    value={summary.down}    valueColor="#ef4444" icon={<>{STAT_ICON.down}</>} dot="red" />
          <StatCard accent="blue"   label="Offline" value={summary.offline} valueColor="#64748b" icon={<>{STAT_ICON.offline}</>} />
        </div>
      )}

      <SectionCard title="Fleet">
        {rows === null ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No machines found.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
```

> **JSX glyph note (chunk-1 lesson):** the icons render via
> `<>{STAT_ICON.running}</>` (a Fragment containing the
> `'\u25B6'`-decoded string). Verify in the Vitest run that
> `findByText('▶')` resolves; if happy-dom round-trips the byte
> differently, fall back to `<span>{STAT_ICON.running}</span>`.

- [ ] **2.10.4** Run `npx vitest run src/pages/__tests__/MachinesPage.test.tsx`. Expected: GREEN.
- [ ] **2.10.5** Run `npx vitest run src/pages/__tests__/DashboardPage.test.tsx`. Expected: GREEN (Dashboard untouched apart from formatRelative refactor in step 2.5).
- [ ] **2.10.6** Commit `feat(machines): rewrite MachinesPage as Phase B dense dark table`.

### Step 2.11: Update dark-mode smoke test

- [ ] **2.11.1** Edit `src/pages/__tests__/dark-mode.test.tsx`:
  - **Append** `import { MachinesPage } from '../MachinesPage'` near the top.
  - In the existing `liveMetricsService` mock factory, **add** the line
    `getMachineRows: vi.fn().mockResolvedValue([]),` next to the existing
    `getMachineMetrics`/`getThroughputSeries` keys.
  - **Append** to the `pages` array:
    `{ name: 'MachinesPage', Component: MachinesPage, probe: /All 12 machines across 4 sites/i },`
- [ ] **2.11.2** Run `npx vitest run src/pages/__tests__/dark-mode.test.tsx`. Expected: GREEN.
- [ ] **2.11.3** Commit `test(dark-mode): cover MachinesPage Phase B markup`.

### Step 2.12: Final per-chunk gate

- [ ] **2.12.1** Run `npm run test:run`. Expected: GREEN.
  - **Test budget**: chunk-1 floor = **263**. New tests added in chunk 2:
    StatBadge ~19 (1 + 17 it.each + 1 live-uppercase), DataTable 6,
    statusToBadgeVariant 4, formatRelative 4, MachinesPage 5,
    Button xs 1, liveMetricsService 3, dark-mode +2 (MachinesPage in
    both themes) = **44 added**.
    **New chunk-2 floor: ≥ 307**.
    Record actual count in plan after run.
- [ ] **2.12.2** Run `npm run build`. Expected: GREEN.
- [ ] **2.12.3** Run `npm run lint`. Expected: ≤ 8 errors (current
      baseline; do not introduce new errors).
- [ ] **2.12.4 Manual smoke** — login as `aslam@hortisort.com / password_123`,
      navigate to `/machines`:
  - Header `Machines` + subtitle `All 12 machines across 4 sites`
  - 4 stat cards with values **6 / 2 / 2 / 2**, accent bars
    green/yellow/red/blue, value colors `#4ade80 / #fbbf24 / #ef4444 / #64748b`
  - Running and Down headers show their dot indicator (chunk-1
    `StatusDot` via `dot` prop)
  - Table renders 12 rows; status pills correct tones
  - Live rows show `formatRelative` output `just now` (sub-minute), older
    rows `Xh ago` / `Xd ago`
  - Inline ProgressBar segments render at the per-row uptime percent in
    a 70-px container
  - Click `Update` on row 1 → navigates to `/machines/1/update-status`
  - Click `Ticket` on row 1 → navigates to `/tickets/new?machine=1`
  - Hover on a row tints background to `bg-bg-surface3`
  - Theme toggle: light mode renders without console errors
  - Mobile width 375 px: stat cards 2-up; table horizontally scrolls
  - Browser console: zero errors
- [ ] **2.12.5** Update spec `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md`:
  - Line 3: `Status: in implementation (chunk 2 complete)`
  - Line 230 (StatBadge row): append parenthetical
    `(chunk 2 ships 17/21 variants; maint, routine, emergency, install added when first consumed)`
  - Commit:

```bash
git add docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md
git commit -m "docs(spec): mark phase B chunk 2 complete; note StatBadge variant coverage"
```

**End of Chunk 2.**

---

## Chunk 3: Tickets page (dense dark table)

> **Spec reference:** §7 row 3 — `TicketsPage` redesign uses
> `StatCard×4`, the `DataTable` molecule from chunk 2, and `StatBadge`
> per row for severity and status. Mockup: `dark-ui-v2.html` lines
> 548-569 (page-tickets section).
>
> **Behaviour deltas vs Phase A `TicketsPage`:** the chunk-3 page **drops** the
> existing search input and the Status / Severity / Category filter
> selects. Mockup section has no filter UI; spec line 300 lists only
> the four stat cards + table. The legacy `TicketCard` component is
> left in `src/components/tickets/` as dead code (mirroring how
> `MachineCard` was handled in chunk 2). The "Raise Ticket" link
> is preserved (engineer/admin only).
>
> **StatBadge variants needed:** `critical`, `high`, `medium`, `low`
> (severity) + `open`, `inprog`, `resolved` (status). All seven were
> shipped in chunk 2's StatBadge atom — no new variants required.
> Note: `closed` and `reopened` `TicketStatus` values map to existing
> variants (`closed → resolved`, `reopened → open`) so the badge set
> stays at 17/21 after chunk 3.
>
> **No new chunk-1 primitives required.** All atoms/molecules
> (`StatCard`, `SectionCard`, `StatBadge`, `DataTable`, `Button` xs)
> already exist.
>
> **Test floor**: chunk-2 floor = **307**. Chunk-3 adds:
> ticketService new methods (3+3 tests = 6), severityToBadgeVariant
> (4 tests), ticketStatusToBadgeVariant (5 tests), TicketsPage page
> tests (5 tests), dark-mode smoke (+2 for both themes) = **22 added**.
> **New chunk-3 floor: ≥ 329**.

### Step 3.1: Add `TicketStats` and `TicketRow` types

- [ ] **3.1.1** Append to `src/types/index.ts` (after `MachineRow`):

```typescript
// -----------------------------------------------------------------------------
// Phase B: Tickets page aggregates and table-row projection
// -----------------------------------------------------------------------------

/** Aggregate counts shown in the four TicketsPage stat cards. */
export interface TicketStats {
  open: number;
  in_progress: number;
  resolved_today: number;
  /** Average resolution time in hours, computed across resolved/closed tickets. */
  avg_resolution_hours: number;
}

/** Denormalized ticket row for the TicketsPage dense table. */
export interface TicketRow {
  /** PK from tickets.id (drives row identity + click target). */
  id: number;
  /** e.g. "TKT-00001" */
  ticket_number: string;
  /** Resolved machine code (e.g. "HS-2024-0003") for display in the Machine column. */
  machine_code: string;
  /** Ticket title, shown in the Issue column. */
  title: string;
  severity: TicketSeverity;
  status: TicketStatus;
  /** Resolved engineer name (e.g. "Amit Sharma") or "Unassigned" when the
   *  user lookup fails. `Ticket.assigned_to` is a non-nullable `number`
   *  today, but the fallback keeps the projection defensive. */
  assigned_to_name: string;
  /** ISO timestamp; rendered with formatRelative. */
  created_at: string;
}
```

- [ ] **3.1.2** Run `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **3.1.3** Commit `feat(types): add TicketStats + TicketRow for Phase B tickets table`.

### Step 3.2: Mock `MOCK_TICKET_STATS`

> Static aggregate matching mockup line 551-554 values. The TicketRow
> data is derived from existing `MOCK_TICKETS` inside the service
> (step 3.3) — no new mock array needed for rows.

- [ ] **3.2.1** Append to `src/data/mockData.ts` (after `MOCK_TICKET_COMMENTS`):

```typescript
import type { TicketStats } from "../types"; // (only if not already imported above)

/** Phase-B tickets page stat-card aggregate. Mockup: dark-ui-v2.html line 551-554. */
export const MOCK_TICKET_STATS: TicketStats = {
  open: 4,
  in_progress: 2,
  resolved_today: 3,
  avg_resolution_hours: 4.2,
};
```

> If `TicketStats` already imports cleanly via the existing import
> block at the top of `mockData.ts`, just add the symbol to that
> existing import line — do not introduce a duplicate import.

- [ ] **3.2.2** Run `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **3.2.3** Commit `feat(data): add MOCK_TICKET_STATS for tickets page header`.

### Step 3.3: Extend `ticketService` with `getTicketStats` + `getTicketRows`

> The current `ticketService.ts` is HTTP-shaped (calls `apiClient`).
> Phase B services in `liveMetricsService` are static-mock-shaped
> (return `Promise.resolve(MOCK_*)`). For consistency with chunk 2,
> the two new methods are **static-mock-shaped** and added as a
> separate exported `liveTicketsService` object in a NEW file
> `src/services/liveTicketsService.ts`. This avoids mixing HTTP and
> static-mock patterns inside a single file and keeps the existing
> apiClient-based methods untouched.

- [ ] **3.3.1 RED** Create `src/services/__tests__/liveTicketsService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { liveTicketsService } from '../liveTicketsService'

describe('liveTicketsService', () => {
  describe('getTicketStats', () => {
    it('returns the static MOCK_TICKET_STATS object', async () => {
      const stats = await liveTicketsService.getTicketStats()
      expect(stats.open).toBe(4)
      expect(stats.in_progress).toBe(2)
      expect(stats.resolved_today).toBe(3)
      expect(stats.avg_resolution_hours).toBe(4.2)
    })

    it('returns a Promise<TicketStats>', async () => {
      const result = liveTicketsService.getTicketStats()
      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toEqual(expect.objectContaining({
        open: expect.any(Number),
      }))
    })
  })

  describe('getTicketRows', () => {
    it('returns one row per ticket in MOCK_TICKETS', async () => {
      const rows = await liveTicketsService.getTicketRows()
      expect(rows.length).toBe(10) // MOCK_TICKETS length
    })

    it('resolves machine_code from MOCK_MACHINES', async () => {
      const rows = await liveTicketsService.getTicketRows()
      // TKT-00001 has machine_id 3 → MOCK_MACHINES id=3 has
      // machine_code = "HS-2024-0003" (verified in src/data/mockData.ts:32).
      const tk1 = rows.find((r) => r.ticket_number === 'TKT-00001')
      expect(tk1?.machine_code).toBe('HS-2024-0003')
    })

    it('resolves assigned_to_name from MOCK_USERS or "Unassigned" when missing', async () => {
      const rows = await liveTicketsService.getTicketRows()
      const tk1 = rows.find((r) => r.ticket_number === 'TKT-00001')
      // MOCK_TICKETS row 1 has assigned_to: 5 → MOCK_USERS id=5 = "Aslam Sheikh"
      expect(tk1?.assigned_to_name).toBe('Aslam Sheikh')
    })
  })
})
```

- [ ] **3.3.2** Run `npx vitest run src/services/__tests__/liveTicketsService.test.ts`. Expected: RED.

- [ ] **3.3.3 GREEN** Create `src/services/liveTicketsService.ts`:

```typescript
import type { TicketRow, TicketStats } from '../types'
import { MOCK_TICKET_STATS, MOCK_TICKETS, MOCK_MACHINES, MOCK_USERS } from '../data/mockData'

/**
 * Phase-B service for the TicketsPage. Returns static mock data today;
 * function bodies are the only thing that changes when a backend lands.
 */
export const liveTicketsService = {
  async getTicketStats(): Promise<TicketStats> {
    return MOCK_TICKET_STATS
  },

  async getTicketRows(): Promise<TicketRow[]> {
    const machineById = new Map(MOCK_MACHINES.map((m) => [m.id, m.machine_code]))
    const userById = new Map(MOCK_USERS.map((u) => [u.id, u.name]))
    return MOCK_TICKETS.map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      machine_code: machineById.get(t.machine_id) ?? '—',
      title: t.title,
      severity: t.severity,
      status: t.status,
      assigned_to_name: userById.get(t.assigned_to) ?? 'Unassigned',
      created_at: t.created_at,
    }))
  },
}
```

> **Pre-flight check (chunk-2 lesson):** field names verified in
> `src/data/mockData.ts` and `src/types/index.ts` before writing this
> file: `Machine.machine_code` (string, e.g. "HS-2024-0003"),
> `User.name` (NOT `full_name`), `Ticket.assigned_to` (non-nullable
> `number`). Re-grep with `grep -n "machine_code\|^  name:" src/data/mockData.ts`
> before starting if anything looks stale.

- [ ] **3.3.4** Run `npx vitest run src/services/__tests__/liveTicketsService.test.ts`. Expected: GREEN.
- [ ] **3.3.5** Commit `feat(service): add liveTicketsService with getTicketStats + getTicketRows`.

### Step 3.4: Helper — `severityToBadgeVariant` (own file)

- [ ] **3.4.1 RED** Create `src/components/dark/__tests__/severityToBadgeVariant.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { severityToBadgeVariant } from '../severityToBadgeVariant'

describe('severityToBadgeVariant', () => {
  it.each([
    ['P1_critical', 'critical'],
    ['P2_high', 'high'],
    ['P3_medium', 'medium'],
    ['P4_low', 'low'],
  ] as const)('%s -> %s', (severity, expected) => {
    expect(severityToBadgeVariant(severity)).toBe(expected)
  })
})
```

- [ ] **3.4.2** Run; expect RED.
- [ ] **3.4.3 GREEN** Create `src/components/dark/severityToBadgeVariant.ts`:

```typescript
import type { TicketSeverity } from '../../types'
import type { StatBadgeVariant } from './StatBadge'

const map: Record<TicketSeverity, StatBadgeVariant> = {
  P1_critical: 'critical',
  P2_high: 'high',
  P3_medium: 'medium',
  P4_low: 'low',
}

export function severityToBadgeVariant(severity: TicketSeverity): StatBadgeVariant {
  return map[severity]
}
```

- [ ] **3.4.4** Run; expect GREEN.
- [ ] **3.4.5** Commit `feat(dark): severityToBadgeVariant helper`.

### Step 3.5: Helper — `ticketStatusToBadgeVariant` (own file)

> **Mapping rationale:** the StatBadge atom shipped in chunk 2 has
> `open / inprog / resolved` variants. `closed` and `reopened` are
> valid `TicketStatus` values not represented by their own
> StatBadge variants — they map to `resolved` and `open`
> respectively (closed = terminal success-like state ⇒ green;
> reopened = needs attention again ⇒ red). This keeps StatBadge at
> 17 variants and avoids touching it in chunk 3.

- [ ] **3.5.1 RED** Create `src/components/dark/__tests__/ticketStatusToBadgeVariant.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ticketStatusToBadgeVariant } from '../ticketStatusToBadgeVariant'

describe('ticketStatusToBadgeVariant', () => {
  it.each([
    ['open',         'open'],
    ['in_progress',  'inprog'],
    ['resolved',     'resolved'],
    ['closed',       'resolved'],
    ['reopened',     'open'],
  ] as const)('%s -> %s', (status, expected) => {
    expect(ticketStatusToBadgeVariant(status)).toBe(expected)
  })
})
```

- [ ] **3.5.2** Run; expect RED.
- [ ] **3.5.3 GREEN** Create `src/components/dark/ticketStatusToBadgeVariant.ts`:

```typescript
import type { TicketStatus } from '../../types'
import type { StatBadgeVariant } from './StatBadge'

const map: Record<TicketStatus, StatBadgeVariant> = {
  open:        'open',
  in_progress: 'inprog',
  resolved:    'resolved',
  closed:      'resolved',
  reopened:    'open',
}

export function ticketStatusToBadgeVariant(status: TicketStatus): StatBadgeVariant {
  return map[status]
}
```

- [ ] **3.5.4** Run; expect GREEN.
- [ ] **3.5.5** Commit `feat(dark): ticketStatusToBadgeVariant helper`.

### Step 3.6: Barrel exports

- [ ] **3.6.1** Append to `src/components/dark/index.ts`:

```typescript
export { severityToBadgeVariant } from './severityToBadgeVariant'
export { ticketStatusToBadgeVariant } from './ticketStatusToBadgeVariant'
```

- [ ] **3.6.2** Run `npx tsc -b --noEmit`. Expected: GREEN (faster than a full
      Vite build for a barrel-only export change).
- [ ] **3.6.3** Commit `chore(dark): export severity + ticket status badge mappers`.

### Step 3.7: Rewrite `TicketsPage` (RED → GREEN)

> The existing `TicketsPage.tsx` has **no test file** today (verified
> via `ls src/pages/__tests__/TicketsPage.test.tsx` — does not exist).
> A brand-new test file is created alongside the rewrite.

#### Severity + status display labels

The mockup renders severity pills as `"P1 Critical"`, `"P2 High"`,
`"P3 Medium"`, `"P4 Low"` and status pills as `"Open"`, `"In Progress"`,
`"Resolved"`, `"Closed"`, `"Reopened"`. These labels live as inline
const maps inside `TicketsPage.tsx` (no separate file — they are not
reused elsewhere yet).

- [ ] **3.7.1 RED** Create `src/pages/__tests__/TicketsPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '../../test/utils'
import { TicketsPage } from '../TicketsPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  }
})

// AuthUser shape mirrors the real `AuthUser` derived from User in src/types/index.ts:129
// (key fields: id, name, email, role, is_active).
const mockEngineer = { id: 5, name: 'Amit Sharma', email: 'amit@hortisort.com', role: 'engineer' as const, is_active: true }
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockEngineer }),
}))

const ticketStats = {
  open: 4, in_progress: 2, resolved_today: 3, avg_resolution_hours: 4.2,
}

const ticketRows = [
  { id: 1, ticket_number: 'TKT-00001', machine_code: 'HS-2024-0003', title: 'Motor overload', severity: 'P1_critical' as const, status: 'open' as const,        assigned_to_name: 'Amit Sharma', created_at: new Date().toISOString() },
  { id: 2, ticket_number: 'TKT-00002', machine_code: 'HS-2025-0007', title: 'Sensor down',    severity: 'P2_high'     as const, status: 'in_progress' as const, assigned_to_name: 'Priya Nair',  created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 3, ticket_number: 'TKT-00003', machine_code: 'HS-2024-0002', title: 'High rejection', severity: 'P2_high'     as const, status: 'open' as const,        assigned_to_name: 'Unassigned',  created_at: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  { id: 4, ticket_number: 'TKT-00004', machine_code: 'HS-2024-0005', title: 'Calibration',    severity: 'P3_medium'   as const, status: 'resolved' as const,    assigned_to_name: 'Amit Sharma', created_at: new Date(Date.now() - 3 * 86_400_000).toISOString() },
]

vi.mock('../../services/liveTicketsService', () => ({
  liveTicketsService: {
    getTicketStats: vi.fn(),
    getTicketRows: vi.fn(),
  },
}))

import { liveTicketsService } from '../../services/liveTicketsService'

describe('TicketsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(liveTicketsService.getTicketStats).mockResolvedValue(ticketStats)
    vi.mocked(liveTicketsService.getTicketRows).mockResolvedValue(ticketRows)
  })

  it('renders title + subtitle', async () => {
    render(<TicketsPage />)
    expect(await screen.findByText('Tickets')).toBeInTheDocument()
    expect(screen.getByText(/Maintenance and fault tracking/i)).toBeInTheDocument()
  })

  it('renders 4 stat cards from TicketStats', async () => {
    render(<TicketsPage />)
    // "Open" appears as a stat-card label and as Open-status pills (rows 1+3).
    // "In Progress" appears as a stat-card label and as one Open-status pill (row 2).
    // Use length-floor assertions to tolerate the multiplicity.
    await waitFor(() => {
      expect(screen.getAllByText('Open').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Resolved Today')).toBeInTheDocument()
    expect(screen.getByText('Avg Resolution')).toBeInTheDocument()
    // Numeric values: 'Open' card shows '4'; 'Resolved Today' shows '3'.
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    // Avg Resolution renders "4.2" and a sized " h" suffix in two children;
    // use textContent matcher across the parent element.
    expect(screen.getByText((_, node) => node?.textContent === '4.2 h')).toBeInTheDocument()
  })

  it('renders one row per ticket with severity + status pills', async () => {
    render(<TicketsPage />)
    expect(await screen.findByText('TKT-00001')).toBeInTheDocument()
    expect(screen.getByText('TKT-00004')).toBeInTheDocument()
    expect(screen.getByText('P1 Critical')).toBeInTheDocument()
    // P2 High appears twice (rows 2 and 3) → use getAllByText
    expect(screen.getAllByText('P2 High').length).toBe(2)
    // "In Progress" status pill in row 2 — already covered by length assertion above
    // Verify the row-2 pill specifically by scoping to its row text:
    const row2 = screen.getByText('TKT-00002').closest('tr')
    expect(row2).not.toBeNull()
    expect(within(row2!).getByText('In Progress')).toBeInTheDocument()
  })

  it('Raise Ticket button visible for engineer/admin and links to /tickets/new', async () => {
    render(<TicketsPage />)
    const link = await screen.findByRole('link', { name: /raise ticket/i })
    expect(link).toHaveAttribute('href', '/tickets/new')
  })

  it('renders empty state when service resolves to []', async () => {
    vi.mocked(liveTicketsService.getTicketRows).mockResolvedValueOnce([])
    render(<TicketsPage />)
    expect(await screen.findByText(/no tickets/i)).toBeInTheDocument()
  })
})
```

- [ ] **3.7.2** Run; expect RED.

> **Deferred — error handling:** the `useEffect` below fires both
> service calls but does not catch rejections. If either rejects,
> `rows` stays `null` and the page shows "Loading..." indefinitely.
> This matches `MachinesPage` (chunk 2) and is acceptable while the
> data layer is purely static mocks. A unified `error` state +
> retry banner is deferred to whichever later chunk first wires
> these pages to the real backend (Phase C scope).

- [ ] **3.7.3 GREEN** Replace `src/pages/TicketsPage.tsx` with:

```tsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import type { TicketStats, TicketRow, TicketSeverity, TicketStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import { liveTicketsService } from '../services/liveTicketsService'
import { Button } from '../components/common'
import {
  StatCard,
  SectionCard,
  StatBadge,
  DataTable,
  severityToBadgeVariant,
  ticketStatusToBadgeVariant,
} from '../components/dark'
import { formatRelative } from '../utils/formatRelative'

const SEVERITY_LABEL: Record<TicketSeverity, string> = {
  P1_critical: 'P1 Critical',
  P2_high:     'P2 High',
  P3_medium:   'P3 Medium',
  P4_low:      'P4 Low',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  open:        'Open',
  in_progress: 'In Progress',
  resolved:    'Resolved',
  closed:      'Closed',
  reopened:    'Reopened',
}

const COLUMNS = [
  { key: 'num',      label: '#' },
  { key: 'machine',  label: 'Machine' },
  { key: 'issue',    label: 'Issue' },
  { key: 'severity', label: 'Severity' },
  { key: 'status',   label: 'Status' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'created',  label: 'Created' },
  { key: 'actions',  label: 'Actions' },
]

/** Phase-B Tickets page — dense dark table per dark-ui-v2.html lines 548-569. */
export function TicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [rows, setRows] = useState<TicketRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      liveTicketsService.getTicketStats(),
      liveTicketsService.getTicketRows(),
    ]).then(([s, r]) => {
      if (cancelled) return
      setStats(s)
      setRows(r)
    })
    return () => { cancelled = true }
  }, [])

  if (!user) return null
  const canRaiseTicket = user.role === 'engineer' || user.role === 'admin'

  const tableRows = (rows ?? []).map((r) => ({
    id: r.id,
    cells: [
      r.ticket_number,
      r.machine_code,
      r.title,
      <StatBadge key="sev" variant={severityToBadgeVariant(r.severity)}>
        {SEVERITY_LABEL[r.severity]}
      </StatBadge>,
      <StatBadge key="st" variant={ticketStatusToBadgeVariant(r.status)}>
        {STATUS_LABEL[r.status]}
      </StatBadge>,
      r.assigned_to_name,
      formatRelative(r.created_at),
      <Button key="a" size="xs" variant="ghost" onClick={() => navigate(`/tickets/${r.id}`)}>
        {r.status === 'resolved' || r.status === 'closed' ? 'View' : 'Update'}
      </Button>,
    ],
  }))

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg-1">Tickets</h1>
          <p className="text-sm text-fg-4">Maintenance and fault tracking</p>
        </div>
        {canRaiseTicket && (
          <Link to="/tickets/new">
            <Button variant="primary">+ Raise Ticket</Button>
          </Link>
        )}
      </header>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard accent="red"    label="Open"           value={stats.open}            valueColor="#f87171" icon={<>{'\u2691'}</>} />
          <StatCard accent="blue"   label="In Progress"    value={stats.in_progress}     valueColor="#60a5fa" icon={<>{'\u2699'}</>} />
          <StatCard accent="green"  label="Resolved Today" value={stats.resolved_today}  valueColor="#4ade80" icon={<>{'\u2714'}</>} />
          <StatCard accent="purple" label="Avg Resolution" value={<>{stats.avg_resolution_hours}<span className="text-sm"> h</span></>} valueColor="#a78bfa" icon={<>{'\u23F1'}</>} />
        </div>
      )}

      <SectionCard title="All Tickets">
        {rows === null ? (
          <p className="text-sm text-fg-6 py-8 text-center">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-fg-6 py-8 text-center">No tickets found.</p>
        ) : (
          <DataTable columns={COLUMNS} rows={tableRows} />
        )}
      </SectionCard>
    </div>
  )
}
```

> **JSX glyph note:** unicode escapes used for icons:
> `\u2691` ⚑ (open flag), `\u2699` ⚙ (gear), `\u2714` ✔ (check),
> `\u23F1` ⏱ (stopwatch). If happy-dom round-trips a glyph
> differently, fall back to `<span>{'\u2691'}</span>` form (chunk-2 lesson).

- [ ] **3.7.4** Run `npx vitest run src/pages/__tests__/TicketsPage.test.tsx`. Expected: GREEN.
- [ ] **3.7.5** Commit `feat(tickets): rewrite TicketsPage as Phase B dense dark table`.

### Step 3.8: Update dark-mode smoke test

- [ ] **3.8.1** Edit `src/pages/__tests__/dark-mode.test.tsx`:
  - **Append** `import { TicketsPage } from '../TicketsPage'` near the top.
  - **Append** a fresh `vi.mock` block for `liveTicketsService`:

    ```typescript
    vi.mock('../../services/liveTicketsService', () => ({
      liveTicketsService: {
        getTicketStats: vi.fn().mockResolvedValue({
          open: 0, in_progress: 0, resolved_today: 0, avg_resolution_hours: 0,
        }),
        getTicketRows: vi.fn().mockResolvedValue([]),
      },
    }))
    ```

  - **Append** to the `pages` array:

    ```typescript
    { name: 'TicketsPage', Component: TicketsPage, probe: /Maintenance and fault tracking/i },
    ```

- [ ] **3.8.2** Run `npx vitest run src/pages/__tests__/dark-mode.test.tsx`. Expected: GREEN.
- [ ] **3.8.3** Commit `test(dark-mode): cover TicketsPage Phase B markup`.

### Step 3.9: Final per-chunk gate

- [ ] **3.9.1** Run `npm run test:run`. Expected: GREEN.
  - **Chunk-3 floor: ≥ 329 tests.** (Chunk-2 floor 307 + 22 new.)
  - Record actual count in plan after run.
- [ ] **3.9.2** Run `npm run build`. Expected: GREEN.
- [ ] **3.9.3** Run `npm run lint`. Expected: ≤ 8 errors (chunk-2 baseline; do
      not introduce new errors).
- [ ] **3.9.4 Manual smoke** — login as `aslam@hortisort.com / password_123`,
      navigate to `/tickets`:
  - Header `Tickets` + subtitle `Maintenance and fault tracking`
  - 4 stat cards with values from `MOCK_TICKET_STATS` (`4 / 2 / 3 / 4.2 h`)
    and accent bars red/blue/green/purple, value colors `#f87171 / #60a5fa /
    #4ade80 / #a78bfa`
  - "+ Raise Ticket" button visible (logged in as admin/engineer); links
    to `/tickets/new`
  - Table renders 10 rows from MOCK_TICKETS; severity pills (P1 Critical, P2
    High, P3 Medium, P4 Low) tones red/orange/yellow/blue; status pills (Open,
    In Progress, Resolved, Closed, Reopened) tones red/yellow/green/green/red
  - Closed/Resolved rows show "View" action button; others show "Update"
  - Click any row's action button → navigates to `/tickets/<id>`
  - Hover on a row tints background to `bg-bg-surface3`
  - Theme toggle: light mode renders without console errors
  - Mobile width 375 px: stat cards 2-up; table horizontally scrolls
  - Browser console: zero errors
- [ ] **3.9.5** Update spec `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md`:
  - Line 3: `Status: in implementation (chunk 3 complete)`
  - Commit:

```bash
git add docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md
git commit -m "docs(spec): mark phase B chunk 3 complete"
```

**End of Chunk 3.**

---

## Chunk 4: Production page (dense dark table + live stats)

> **Spec reference:** §7 row 4 — `ProductionPage` redesign uses
> `StatCard×4`, the `DataTable` molecule from chunk 2, and an animated
> `b-live` `StatBadge` per row. Mockup: `dark-ui-v2.html` lines 524-545
> (page-production section).
>
> **Behaviour deltas vs current `ProductionPage`:** the existing page already
> renders today's sessions through `ProductionLotTable` with a green
> `animate-pulse` "Live — updates every 15 s" indicator. The chunk-4 rewrite
> replaces the old light-theme table with the `DataTable` primitive,
> adds the 4-card stat header (Active Sessions / Lots Today / Items
> Processed / Rejection Rate) **derived from the same `sessions` array**
> (no new mock file), and swaps the inline status bullet for `StatBadge`
> with the `live` and `completed` variants. The "Live — updates every
> 15 s" subtitle is preserved (Socket.io stream is unchanged). Legacy
> `ProductionLotTable` and `ProductionStatusBadge` remain in
> `src/components/production/` as dead code (mirroring how `MachineCard`
> and `TicketCard` were preserved in chunks 2-3).
>
> **Data gap acknowledged:** the mockup shows "Processed" and "Rejected"
> columns. Today's `ProductionSession` type only carries `quantity_kg`.
> Chunk 4 renders these two columns with `'—'` placeholders and a
> `// TODO(phase-c)` comment in the page. The other 7 columns (Lot,
> Machine, Fruit, Status, Start, Stop, Qty) are sourced from existing
> fields. No `ProductionSession` type or mock changes in this chunk.
>
> **StatBadge variants needed:** `live`, `completed`. Both shipped in
> chunk 2 (variant set still 18/21). The `error` ProductionStatus maps
> to existing `down` variant. No new variants required.
>
> **No new chunk-1 primitives required.** All atoms/molecules
> (`StatCard`, `SectionCard`, `StatBadge`, `DataTable`) already exist.
>
> **Test floor**: chunk-3 floor = **329** (per step 3.9.1). Chunk 4 adds:
> derived-stats helper (4 tests), ProductionPage page tests (4 tests),
> dark-mode smoke (+2 for both themes) = **10 added**.
> **New chunk-4 floor: ≥ 339**.

### Step 4.1: Add `ProductionStats` type

- [ ] **4.1.1** Append to `src/types/index.ts` (after `ProductionSessionFilters`):

```typescript
// -----------------------------------------------------------------------------
// Phase B: Production page aggregates derived from ProductionSession[]
// -----------------------------------------------------------------------------

/** Aggregate counts shown in the four ProductionPage stat cards.
 *  Derived live from today's sessions; not persisted, not mocked. */
export interface ProductionStats {
  /** Sessions whose status === 'running'. */
  active_sessions: number
  /** Total session count for the day (any status). */
  lots_today: number
  /** Sum of quantity_kg across all sessions, in kg, integer. Items-processed
   *  is approximated by quantity for now; chunk-c may replace with a real
   *  count if the type grows an `items_processed` field. */
  items_processed_kg: number
  /** Always 0 until the type carries items_rejected; rendered as '—'. */
  rejection_rate_pct: number
}
```

- [ ] **4.1.2** Run `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **4.1.3** Commit `feat(types): add ProductionStats for Phase B production page`.

### Step 4.2: Helper `computeProductionStats(sessions)` (RED → GREEN)

- [ ] **4.2.1** New file `src/utils/productionStats.ts`:

```typescript
import type { ProductionSession, ProductionStats } from '../types'

/** Pure derivation — no I/O, no Date.now(). Test-friendly. */
export function computeProductionStats(sessions: ProductionSession[]): ProductionStats {
  let active = 0
  let qty = 0
  for (const s of sessions) {
    if (s.status === 'running') active++
    if (s.quantity_kg) qty += parseFloat(s.quantity_kg)
  }
  return {
    active_sessions: active,
    lots_today: sessions.length,
    items_processed_kg: Math.round(qty),
    rejection_rate_pct: 0,
  }
}
```

- [ ] **4.2.2** New test file `src/utils/__tests__/productionStats.test.ts` —
      4 cases:
  1. Empty array → `{0, 0, 0, 0}`
  2. Only running sessions → `active_sessions === sessions.length`
  3. Mixed running/completed/error → `active_sessions` counts only `'running'`
  4. `quantity_kg` sums (parseFloat) — including a `null` row that's skipped
- [ ] **4.2.3** Run `npx vitest run src/utils/__tests__/productionStats.test.ts`.
      Expected: GREEN (4 tests pass).
- [ ] **4.2.4** Commit `feat(utils): add computeProductionStats helper`.

### Step 4.3: Build `ProductionRow` projection inline (no new mock)

The dense table renders directly from `ProductionSession[]`. The page
maps each session to the 9 columns in the render path; no new
`ProductionRow` type or mock array is created (sessions are already
fetched on mount). This mirrors how chunk 1 mapped `Machine[]` to
`MachineTile` props in-place.

- [ ] **4.3.1** No file changes; design decision recorded in this section.

### Step 4.4: Rewrite `ProductionPage` (RED → GREEN)

- [ ] **4.4.1** Write the failing tests first, then the page.

New file `src/pages/__tests__/ProductionPage.test.tsx` — 4 cases:
  1. Renders the page header `Production` and the live subtitle
     `Live — updates every 15 s`.
  2. Renders 4 stat cards with labels `ACTIVE SESSIONS`, `LOTS TODAY`,
     `ITEMS PROCESSED`, `REJECTION RATE` — values derived from a
     `getAllTodaySessions` mock returning 3 sessions (1 running, 2
     completed, total quantity 1500.5 kg) → `1 / 3 / 1501 / —`.
  3. Renders the `DataTable` with one `<tr>` per session, status cell
     uses `StatBadge` with text `LIVE` for running and `Completed` for
     completed.
  4. Empty state: when service returns `[]`, table absent and
     `No production data for today yet.` message visible.

Mocks (top of test file):
- `react-router-dom` `useNavigate` (mirrors chunk-3 test).
- `../../context/AuthContext` `useAuth` returns admin.
- `../../services/productionSessionService` `getAllTodaySessions` returns
  a `vi.fn().mockResolvedValue([...])`.
- `../../hooks/useProductionSocket` `useProductionSocket` returns
  `{ lastSession: null }` (a no-op stub so the live-update effect is
  inert during unit tests).

- [ ] **4.4.2** Run page test → expect RED (page still uses old markup).

- [ ] **4.4.3** Rewrite `src/pages/ProductionPage.tsx`. Skeleton:

```tsx
import { useState, useEffect, useCallback } from 'react'
import type { ProductionSession } from '../types'
import { getAllTodaySessions } from '../services/productionSessionService'
import { useProductionSocket } from '../hooks/useProductionSocket'
import { computeProductionStats } from '../utils/productionStats'
import { StatCard, StatBadge, SectionCard, DataTable } from '../components/dark'
import { formatRelative } from '../utils/formatters' // unused; remove if lint flags

export function ProductionPage() {
  const [sessions, setSessions] = useState<ProductionSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      setSessions(await getAllTodaySessions(today))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production data')
    } finally {
      setIsLoading(false)
    }
  }, [today])

  useEffect(() => { void fetchSessions() }, [fetchSessions])

  const { lastSession } = useProductionSocket({ allMachines: true })
  useEffect(() => {
    if (!lastSession) return
    setSessions((prev) => {
      const idx = prev.findIndex(
        (s) => s.machine_id === lastSession.machine_id && s.lot_number === lastSession.lot_number,
      )
      if (idx >= 0) {
        const next = [...prev]; next[idx] = lastSession; return next
      }
      return [lastSession, ...prev]
    })
  }, [lastSession])

  const stats = computeProductionStats(sessions)

  // Header row
  // Stat cards row (4)
  //   ACTIVE SESSIONS (green, dot:'green', value stats.active_sessions, valueColor #4ade80)
  //   LOTS TODAY (blue, value stats.lots_today)
  //   ITEMS PROCESSED (cyan, value stats.items_processed_kg.toLocaleString())
  //   REJECTION RATE (yellow, value '—' until type carries items_rejected)
  // SectionCard wrapping DataTable
  //   columns: Lot, Machine, Fruit, Status, Start, Stop, Processed, Rejected, Qty
  //   rows: sessions.map(s => ({ id: s.id, cells: [...] }))
  //   Status cell: <StatBadge variant={s.status === 'running' ? 'live' : s.status === 'completed' ? 'completed' : 'down'}>{...}</StatBadge>
  //   Processed/Rejected cells: '—' (TODO(phase-c): wire real fields)
  //   Qty cell: parseFloat(s.quantity_kg).toLocaleString() + ' kg' or '—'
  //   Start/Stop: formatTime helper (HH:MM 24h)
  // Empty state when sessions.length === 0 && !isLoading: '<p>No production data for today yet.</p>'
  // Loading state: spinner / skeleton (mirrors DashboardPage Phase B)
  // Error state: red banner if error
}
```

- [ ] **4.4.4** Implement the JSX per the comments above. Use the same
      page padding (`p-6 max-w-7xl mx-auto`) and the same SectionCard
      idiom as chunk 2 MachinesPage.
- [ ] **4.4.5** Run page test → expect GREEN.
- [ ] **4.4.6** Run `npm run test:run` → no regressions vs chunk-3 floor (329).
- [ ] **4.4.7** Commit `feat(production): rewrite ProductionPage as Phase B dense dark table`.

### Step 4.5: Update dark-mode smoke test

- [ ] **4.5.1** In `src/pages/__tests__/dark-mode.test.tsx`:
  - Add import `import { ProductionPage } from '../ProductionPage'`.
  - Add to the `pages` array:
    ```ts
    { name: 'ProductionPage', Component: ProductionPage, probe: /Live — updates every 15 s/i },
    ```
  - Add a service mock for `productionSessionService` returning `[]` and
    `useProductionSocket` returning `{ lastSession: null }`.
- [ ] **4.5.2** Run `npx vitest run src/pages/__tests__/dark-mode.test.tsx`.
      Expected: 10 tests pass (was 8 with 4 pages × 2 themes; now 10
      with 5 pages × 2 themes).
- [ ] **4.5.3** Commit `test(dark-mode): cover ProductionPage Phase B markup`.

### Step 4.6: Final per-chunk gate

- [ ] **4.6.1** `npm run test:run` — Chunk-4 floor ≥ **339**. Record actual.
- [ ] **4.6.2** `npm run build` — GREEN.
- [ ] **4.6.3** `npm run lint` — ≤ 8 errors (no new errors vs chunk-3).
- [ ] **4.6.4** Manual smoke: `/production` route as admin —
  - Header `Production` + subtitle with green pulsing dot + `Live —
    updates every 15 s`.
  - 4 stat cards (green/blue/cyan/yellow accents); values reflect the
    seeded sessions.
  - Table renders with `LIVE` (green) and `Completed` (green)
    StatBadges; running rows visibly differ via uppercase label.
  - Mobile width 375 px: stat cards 2-up; table horizontally scrolls.
  - Light theme toggle: no console errors.
- [ ] **4.6.5** Update spec
      `docs/superpowers/specs/2026-04-25-dark-theme-phase-b-design.md`
      line 3: `Status: in implementation (chunk 4 complete)`.
- [ ] **4.6.6** Commit `docs(spec): mark phase B chunk 4 complete`.

**End of Chunk 4.**

---

## Chunk 5: DailyLogsPage (info-banner + dense dark table)

> **Spec reference:** §7 row 5 — `DailyLogsPage` redesign uses
> `info-banner`, `StatCard×4`, and a row primitive. Mockup:
> `dark-ui-v2.html` lines 572-635 (page-logs section).
>
> **Behaviour deltas vs current `DailyLogsPage`:**
> 1. The three filter inputs (machine `Select`, date `Input`, status
>    `Select`) are **removed** to match the mockup, mirroring the
>    drop-filters precedent set by `MachinesPage` (chunk 2) and
>    `TicketsPage` (chunk 3). The legacy `DailyLogCard` component is
>    left in `src/components/logs/` as dead code.
> 2. An `InfoBanner` atom is added above the stat cards with the copy
>    *"How daily logs work: A log entry is automatically created each
>    time an engineer updates a machine status..."* (mockup line 574).
> 3. The 4 stat cards (Logs This Week / Running Days / Maintenance
>    Days / Not-Running Days) are **derived** live from the role-scoped
>    log array via a new `computeDailyLogStats` helper. No new mock
>    file (matches Chunk 4 pattern).
> 4. Existing role-scoping (admin sees all, engineer sees own,
>    customer sees their machines') is preserved verbatim.
>
> **StatBadge variants:** mockup uses `b-running` (green) and
> `b-notrun` (slate) which already exist, plus `b-maint` (amber) which
> does not. **Add a `maintenance` variant** in this chunk (StatBadge
> total: 18 → **19**/21).
>
> **New atoms in this chunk:**
> - `InfoBanner` (cyan-tinted alert/banner; reused by Chunk 8 modal
>   forms for the Update-Status auto-log notice).
>
> **No new molecules.** `StatCard`, `SectionCard`, `StatBadge`,
> `DataTable` already exist.
>
> **Test floor**: chunk-4 actual = **336**. Chunk 5 adds:
> `computeDailyLogStats` (4 tests), `InfoBanner` (2 tests), StatBadge
> `maintenance` variant (1 test), `DailyLogsPage` page tests (4 tests),
> dark-mode smoke (+2 themes for one new page) = **13 added**.
> **New chunk-5 floor: ≥ 349**.

### Step 5.1: Add `DailyLogStats` type

- [ ] **5.1.1** Append to `src/types/index.ts` (after `ProductionStats`):

```typescript
// -----------------------------------------------------------------------------
// Phase B: Daily logs page aggregates derived from DailyLog[]
// -----------------------------------------------------------------------------

/** Aggregate counts shown in the four DailyLogsPage stat cards.
 *  Derived live from the role-scoped log list. */
export interface DailyLogStats {
  /** Total log entries within the past 7 days (inclusive of today). */
  logs_this_week: number
  /** Distinct (machine_id, date) pairs whose status === 'running'. */
  running_days: number
  /** Distinct (machine_id, date) pairs whose status === 'maintenance'. */
  maintenance_days: number
  /** Distinct (machine_id, date) pairs whose status === 'not_running'. */
  not_running_days: number
}
```

- [ ] **5.1.2** Run `npx tsc -b --noEmit`. Expected: GREEN.
- [ ] **5.1.3** Commit `feat(types): add DailyLogStats for Phase B daily logs page`.

### Step 5.2: `computeDailyLogStats(logs, now)` helper (RED → GREEN)

> Pure function — `now` is injected so tests can use a fixed reference
> date instead of relying on `Date.now()`.

- [ ] **5.2.1** New test file `src/utils/__tests__/dailyLogStats.test.ts`
      — 4 cases:
  1. Empty array → `{0, 0, 0, 0}`.
  2. `logs_this_week` counts only logs whose `date` is within the past
     7 days inclusive (>= now-6d). Logs older than 7 days are excluded.
  3. `running_days` / `maintenance_days` / `not_running_days` each
     count distinct `(machine_id, date)` pairs by status — duplicate
     entries on the same day for the same machine collapse to 1.
  4. Mixed-status logs across multiple machines compute all four
     fields independently.

- [ ] **5.2.2** New file `src/utils/dailyLogStats.ts`:

```typescript
import type { DailyLog, DailyLogStats } from '../types'

/** ms in 7 days (inclusive: now-6d through now). */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function computeDailyLogStats(logs: DailyLog[], now: Date = new Date()): DailyLogStats {
  const cutoff = now.getTime() - WEEK_MS + 1
  let logsThisWeek = 0
  const runningPairs = new Set<string>()
  const maintPairs = new Set<string>()
  const notRunningPairs = new Set<string>()
  for (const l of logs) {
    const t = new Date(l.date).getTime()
    if (!Number.isNaN(t) && t >= cutoff) logsThisWeek++
    const key = `${l.machine_id}|${l.date}`
    if (l.status === 'running') runningPairs.add(key)
    else if (l.status === 'maintenance') maintPairs.add(key)
    else if (l.status === 'not_running') notRunningPairs.add(key)
  }
  return {
    logs_this_week: logsThisWeek,
    running_days: runningPairs.size,
    maintenance_days: maintPairs.size,
    not_running_days: notRunningPairs.size,
  }
}
```

- [ ] **5.2.3** Run test. Expected: GREEN.
- [ ] **5.2.4** Commit `feat(utils): add computeDailyLogStats helper`.

### Step 5.3: Add `maintenance` variant to `StatBadge`

- [ ] **5.3.1** New test in `src/components/dark/__tests__/StatBadge.test.tsx`:
      asserts `<StatBadge variant="maintenance">Maintenance</StatBadge>`
      renders with the amber tone classes (`bg-amber-500/15
      text-amber-400 border-amber-500/30`).
- [ ] **5.3.2** Extend `StatBadge.tsx`:
  - Add `'maintenance'` to the `StatBadgeVariant` union.
  - Add the entry to `toneClasses`:
    `maintenance: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',`
- [ ] **5.3.3** Run test. Expected: GREEN.
- [ ] **5.3.4** Commit `feat(dark): add maintenance variant to StatBadge`.

### Step 5.4: New `InfoBanner` atom (RED → GREEN)

> A cyan-tinted banner used at the top of pages and inside Chunk 8
> modals. Mockup `info-banner` class lines 168-170 in `dark-ui-v2.html`.

- [ ] **5.4.1** New test `src/components/dark/__tests__/InfoBanner.test.tsx`
      — 2 cases:
  1. Renders `children` text inside the banner role.
  2. Applies the cyan tone classes (`bg-cyan-500/10`,
     `border-cyan-500/30`, `text-cyan-200`).

- [ ] **5.4.2** New file `src/components/dark/InfoBanner.tsx`:

```typescript
import type { ReactNode } from 'react'

interface InfoBannerProps {
  children: ReactNode
}

/** Cyan-tinted informational banner (mockup `info-banner`). */
export function InfoBanner({ children }: InfoBannerProps) {
  return (
    <div
      role="note"
      className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 px-4 py-3 text-xs leading-relaxed"
    >
      {children}
    </div>
  )
}
```

- [ ] **5.4.3** Add `export { InfoBanner } from './InfoBanner'` to
      `src/components/dark/index.ts`.
- [ ] **5.4.4** Run test. Expected: GREEN.
- [ ] **5.4.5** Commit `feat(dark): add InfoBanner atom`.

### Step 5.5: Rewrite `DailyLogsPage` (RED → GREEN)

- [ ] **5.5.1** New test file `src/pages/__tests__/DailyLogsPage.test.tsx`
      — 4 cases (mock `dailyLogService`, `machineService`,
      `userLookup.getUserName`, `useAuth`):
  1. Renders header `Daily Logs`, subtitle `Auto-generated from
     machine status updates`, and the InfoBanner copy `How daily logs
     work:`.
  2. Renders 4 stat cards — labels `LOGS THIS WEEK`, `RUNNING DAYS`,
     `MAINTENANCE DAYS`, `NOT-RUNNING DAYS` with values derived from
     a fixture of 6 logs (e.g. 6/2/1/1).
  3. Renders one `<tr>` per log; status cell uses correct StatBadge
     (Running / Maintenance / Not Running) per row.
  4. Empty state: when service returns `[]`, table absent and
     `No logs found.` visible.

- [ ] **5.5.2** Rewrite `src/pages/DailyLogsPage.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { DailyLog, Machine } from '../types'
import { useAuth } from '../context/AuthContext'
import { getAllDailyLogs } from '../services/dailyLogService'
import { getMachinesByRole } from '../services/machineService'
import { getUserName } from '../utils/userLookup'
import { computeDailyLogStats } from '../utils/dailyLogStats'
import {
  StatCard, SectionCard, StatBadge, DataTable, InfoBanner,
  type StatBadgeVariant,
} from '../components/dark'

const COLUMNS = [
  { key: 'date',    label: 'Date' },
  { key: 'machine', label: 'Machine' },
  { key: 'status',  label: 'Status' },
  { key: 'fruit',   label: 'Fruit / Tons' },
  { key: 'notes',   label: 'Notes' },
  { key: 'by',      label: 'By' },
]

const STATUS_BADGE: Record<DailyLogStatus, { variant: StatBadgeVariant; label: string }> = {
  running:     { variant: 'running',     label: 'Running' },
  maintenance: { variant: 'maintenance', label: 'Maintenance' },
  not_running: { variant: 'notrun',      label: 'Not Running' },
}

// header (h1 + subtitle)
// InfoBanner with the copy
// 4 StatCards (blue/green/yellow/red, dot:'green' on running)
// SectionCard "Recent Daily Logs" wrapping DataTable
// preserve role-scoping logic from existing page
// formatDate(l.date) → '23 Apr 2026' style
// formatAuto(l.created_at) → 'auto - HH:MM' string under the date cell
```

- [ ] **5.5.3** Implement the JSX. Date cell renders two stacked spans
      (top: formatted date in `text-fg-1 font-semibold`; bottom:
      `auto · HH:MM` in `text-[10px] text-fg-6`).
- [ ] **5.5.4** Run page test. Expected: GREEN.
- [ ] **5.5.5** Run `npm run test:run`. Expected: ≥ 349.
- [ ] **5.5.6** Commit `feat(logs): rewrite DailyLogsPage as Phase B dense dark table`.

### Step 5.6: Update dark-mode smoke test

- [ ] **5.6.1** In `src/pages/__tests__/dark-mode.test.tsx`:
  - Import `DailyLogsPage`.
  - Add to the `pages` array:
    ```ts
    { name: 'DailyLogsPage', Component: DailyLogsPage, probe: /Auto-generated from machine status updates/i },
    ```
  - Add service mocks: `dailyLogService.getAllDailyLogs` →
    `[]`; `machineService.getMachinesByRole` → `[]`.
- [ ] **5.6.2** Run smoke. Expected: 12 tests pass (6 pages × 2).
- [ ] **5.6.3** Commit `test(dark-mode): cover DailyLogsPage Phase B markup`.

### Step 5.7: Final per-chunk gate

- [ ] **5.7.1** `npm run test:run` — Chunk-5 floor ≥ **349**.
- [ ] **5.7.2** `npm run build` — GREEN.
- [ ] **5.7.3** `npm run lint` — ≤ 8 errors (no new errors).
- [ ] **5.7.4** Manual smoke `/daily-logs`: header + subtitle, info
      banner, 4 stat cards (blue/green/yellow/red), table with
      Running/Maintenance/Not Running badges, mobile 375px stat cards
      2-up, light theme toggle no console errors.
- [ ] **5.7.5** Update spec line 3 → `Status: in implementation
      (chunk 5 complete)`.
- [ ] **5.7.6** Append Chunk 5 entry to `task.md`.
- [ ] **5.7.7** Commit `docs: mark phase B chunk 5 complete (DailyLogsPage)`.

**End of Chunk 5.**

## Chunk 6: SiteVisitsPage (StatCard×4 + VisitCard list)

> **Spec reference:** §7 row 6 — `SiteVisitsPage` redesign uses
> `StatCard×4` plus a new `VisitCard` molecule. Mockup:
> `dark-ui-v2.html` lines 636-703 (page-visits section).
>
> **Behaviour deltas vs current `SiteVisitsPage`:**
> 1. The three filter inputs (machine `Select`, purpose `Select`, and
>    admin-only engineer `Select`) are **removed** to match the mockup,
>    continuing the drop-filters precedent set by chunks 2/3/5. The
>    legacy light-theme `SiteVisitCard` is left in
>    `src/components/visits/` as dead code.
> 2. Four stat cards (Visits This Month / Emergency / Routine /
>    Due This Week) are **derived** live from the role-scoped visit
>    array via a new `computeSiteVisitStats(visits, now)` helper. No
>    new mock file (matches chunks 4 + 5).
> 3. Existing role-scoping (admin sees all; engineer sees own) is
>    preserved verbatim. Customer-role gating is not added in this
>    chunk — `SiteVisitsPage` is admin/engineer only today and remains
>    so.
> 4. The page header keeps its "+ Log Visit" button (hidden for
>    customer per spec, but customer can't reach this page anyway via
>    routing, so visibility is governed by `user.role !== 'customer'`).
>
> **StatBadge variants:** mockup uses three new badge tones —
> `b-emergency` (red), `b-routine` (blue), `b-install` (purple) —
> mapped from `VisitPurpose`:
> - `routine`      → `routine`     blue   ("Routine")
> - `ticket`       → `emergency`   red    ("Emergency")
> - `installation` → `install`     purple ("Installation")
> - `training`     → `engineer`    blue   ("Training") *(reuse existing
>   `engineer` cyan-blue tone — matches "training" connotation; spec
>   does not provide a dedicated training tone)*
>
> **Add `emergency`, `routine` (badge), `install` variants** to
> `StatBadge` in this chunk (StatBadge total: 19 → **22**/22, which
> exceeds the spec's 21-variant target by one — reconcile by treating
> `routine` as the same blue tone as the existing `low`/`engineer`
> badges but with its own semantic name; this is acceptable per spec
> §3 which says "extend the variant union as Phase B chunks need").
>
> **New molecules in this chunk:**
> - `VisitCard` — visit-card from mockup lines 646-659. Composition:
>   header row (title + meta + StatBadge), free-text body
>   (Findings/Actions inline), 2-col stats footer (Parts Replaced /
>   Next Visit Due). Reused only on this page; lives in
>   `src/components/dark/`.
>
> **No new atoms.** `StatCard`, `SectionCard`, `StatBadge` (with new
> variants) are sufficient.
>
> **Test floor**: chunk-5 actual = **349**. Chunk 6 adds:
> `computeSiteVisitStats` (4 tests), StatBadge variant tests
> (3 cases), `VisitCard` (4 tests), `SiteVisitsPage` page tests
> (4 tests but file pre-exists with 2 tests, so net +2),
> dark-mode smoke (+2 themes for one new page) = **15 added net**.
> **New chunk-6 floor: ≥ 364**.

### Step 6.1: Add `SiteVisitStats` type + `computeSiteVisitStats` helper

- [ ] **6.1.1** Append to `src/types/index.ts` (after `DailyLogStats`):
      `SiteVisitStats { visits_this_month, emergency_count,
      routine_count, due_this_week }`. All `number`.
- [ ] **6.1.2** New test file
      `src/utils/__tests__/siteVisitStats.test.ts` — 4 cases:
  1. Empty array → all zeros.
  2. `visits_this_month` counts visits whose `visit_date` is in the
     **current calendar month** of `now`.
  3. `emergency_count` counts `visit_purpose === 'ticket'`;
     `routine_count` counts `visit_purpose === 'routine'`. Other
     purposes (installation, training) are excluded from both.
  4. `due_this_week` counts visits whose `next_visit_due` falls in
     the next 7 days (inclusive of today, exclusive of day +7);
     undefined `next_visit_due` is excluded.
- [ ] **6.1.3** New file `src/utils/siteVisitStats.ts` — pure helper.
- [ ] **6.1.4** Run tests. Expected: 4/4 GREEN.
- [ ] **6.1.5** Commit `feat(utils): add computeSiteVisitStats helper`.

### Step 6.2: Add `emergency` / `routine` (badge) / `install` variants to `StatBadge`

- [ ] **6.2.1** Extend `StatBadgeVariant` union in
      `src/components/dark/StatBadge.tsx` with `'emergency'`,
      `'routine'` (badge — distinct semantic from existing
      `'running'`), `'install'`.
- [ ] **6.2.2** Tone classes:
  - `emergency` → `bg-red-500/15 text-red-400 border border-red-500/30`
  - `routine`   → `bg-blue-500/15 text-blue-400 border border-blue-500/30`
  - `install`   → `bg-purple-500/15 text-purple-400 border border-purple-500/30`
- [ ] **6.2.3** Add 3 cases to
      `src/components/dark/__tests__/StatBadge.test.tsx`.
- [ ] **6.2.4** Run tests. Expected: GREEN.
- [ ] **6.2.5** Commit `feat(dark): add emergency/routine/install StatBadge variants`.

### Step 6.3: New `VisitCard` molecule (RED → GREEN)

- [ ] **6.3.1** New test file
      `src/components/dark/__tests__/VisitCard.test.tsx` — 4 cases:
  1. Renders title and meta line.
  2. Renders the badge passed via `purposeBadge` slot.
  3. Renders Findings + Actions in body section.
  4. Renders Parts Replaced + Next Visit Due in stats footer.
- [ ] **6.3.2** New file `src/components/dark/VisitCard.tsx`. Props:
      `title`, `meta`, `purposeBadge` (`ReactNode`), `findings`,
      `actions`, `partsReplaced`, `nextVisitDue`,
      `nextVisitDueColor?` (optional string for amber-tint warning).
- [ ] **6.3.3** Export from `src/components/dark/index.ts`.
- [ ] **6.3.4** Run tests. Expected: 4/4 GREEN.
- [ ] **6.3.5** Commit `feat(dark): add VisitCard molecule`.

### Step 6.4: Rewrite `SiteVisitsPage` (RED → GREEN)

- [ ] **6.4.1** New test file
      `src/pages/__tests__/SiteVisitsPage.test.tsx` — 4 cases:
  1. Renders page title "Site Visits" and subtitle.
  2. Renders 4 stat cards with derived values.
  3. Renders one `VisitCard` per visit with the correct purpose badge.
  4. "+ Log Visit" button navigates to `/visits/new` for engineer.
- [ ] **6.4.2** Rewrite `src/pages/SiteVisitsPage.tsx`:
      - Header: title + subtitle + "+ Log Visit" button.
      - 4 StatCards (blue / red / green / purple).
      - `SectionCard "Recent Site Visits"` wrapping a vertical list of
        `VisitCard` instances.
      - `STATUS_BADGE` map for VisitPurpose → variant + label.
      - Date formatting via existing `formatLogDate` style helper
        (same pattern as DailyLogsPage).
      - Drop the 3 filter inputs and the engineer-list fetch.
      - Preserve role-scoped fetch (`engineerId` filter for engineer
        role).
- [ ] **6.4.3** Run page tests. Expected: 4/4 GREEN.
- [ ] **6.4.4** Commit `feat(visits): rewrite SiteVisitsPage as Phase B dark VisitCard list`.

### Step 6.5: Update dark-mode smoke

- [ ] **6.5.1** In `src/pages/__tests__/dark-mode.test.tsx`:
  - Import `SiteVisitsPage`.
  - Add to pages array:
    `{ name: 'SiteVisitsPage', Component: SiteVisitsPage, probe: /Engineer on-site visit records/i }`.
  - Add service mock for `siteVisitService.getAllSiteVisits` → `[]`.
- [ ] **6.5.2** Run smoke. Expected: 14 tests pass (7 × 2).
- [ ] **6.5.3** Commit `test(dark-mode): cover SiteVisitsPage Phase B markup`.

### Step 6.6: Final per-chunk gate

- [ ] **6.6.1** `npm run test:run` — Chunk-6 floor ≥ **364**.
- [ ] **6.6.2** `npm run build` — GREEN.
- [ ] **6.6.3** `npm run lint` — ≤ 8 errors (no new errors).
- [ ] **6.6.4** Update spec line 3 → `Status: in implementation
      (chunk 6 complete)`.
- [ ] **6.6.5** Append Chunk 6 entry to `task.md`.
- [ ] **6.6.6** Commit `docs: mark phase B chunk 6 complete (SiteVisitsPage)`.

**End of Chunk 6.**

## Chunk 7: AdminPage Users table (dense dark-table + role badges)

> **Spec reference:** §7 row 7 — `AdminPage` Users tab uses the dense
> `dark-table` primitive and role pill badges. Mockup:
> `dark-ui-v2.html` lines 706-720 (page-users section).
>
> **Behaviour deltas vs current `UserTable`:**
> 1. The legacy `<table>` markup wrapped by a Tailwind shadow card is
>    replaced by the existing dark `DataTable` molecule, matching the
>    mockup's table density and divider styling.
> 2. Role text → `StatBadge` with `admin` (purple) / `engineer` (blue)
>    / `customer` (cyan) variants. These already exist; no new
>    variants in this chunk.
> 3. Status column shows an `Active` / `Idle` `StatBadge` derived from
>    `is_active` (`true` → `running` variant green; `false` → `idle`
>    variant yellow). Reuses existing variants.
> 4. New "Site" column added per mockup. The `User` type does not have
>    a `site` field today, so render `'—'` with a `// TODO(phase-c)`
>    comment.
> 5. New "Last Login" column added per mockup. The `User` type does
>    not have a `last_login_at` field today; use `updated_at` as a
>    proxy with a relative formatter (`Now`, `Today HH:MM`, `Yesterday`,
>    `N days ago`). Mark with `// TODO(phase-c)`.
> 6. Action buttons keep their existing handlers (Edit / Activate /
>    Deactivate / Delete) but are restyled as ghost buttons matching
>    the mockup's `btn-ghost` style. The currently-logged-in admin's
>    Deactivate/Delete buttons remain disabled.
> 7. Page-header "Users" title + "+ Add User" button continue to be
>    rendered by `UserTable` itself for now (matches existing
>    `AdminPage` composition; chunk 8 will revisit when modals are
>    restyled).
>
> **Out of scope for this chunk** (per the user's "users-table-only"
> directive):
> - `AdminPage` page header, `AdminStatsCards`, `ActivityFeed`,
>   modals, Toast — all keep their current light-theme styling.
> - `AdminPage` itself is not rewritten in this chunk; only its
>   internal `UserTable` is.
>
> **No new atoms or molecules.** `DataTable`, `StatBadge` are
> sufficient.
>
> **Test floor**: chunk-6 actual = **364**. Chunk 7 adds:
> `UserTable` component tests (4 cases) = **4 added**. Dark-mode
> smoke is **not** updated in this chunk because the page-level
> AdminPage smoke would also need restyle work that's out of scope.
> **New chunk-7 floor: ≥ 368**.

### Step 7.1: Rewrite `UserTable` (RED → GREEN)

- [ ] **7.1.1** New test file
      `src/components/admin/__tests__/UserTable.test.tsx` — 4 cases:
  1. Renders one row per user with name, email, role badge.
  2. Renders Active badge for `is_active === true`, Idle for `false`.
  3. Disables Deactivate and Delete buttons for the current admin's
     own row (`currentUserId === user.id`).
  4. Calls `onToggleActive(id)`, `onEdit(user)`, `onDelete(user)`,
     `onAddUser()` when respective buttons are clicked.
- [ ] **7.1.2** Rewrite `src/components/admin/UserTable.tsx`:
      - Drop the legacy Tailwind `<table>` markup.
      - Use `DataTable` with columns: Name, Email, Role, Site,
        Status, Last Login, Actions.
      - Map `user.role` → `StatBadge` variant (`admin` purple,
        `engineer` blue, `customer` cyan).
      - Map `user.is_active` → `StatBadge` variant (`running` green
        with label "Active" or `idle` yellow with label "Idle").
      - Render Site column as `'—'` (TODO).
      - Render Last Login via a small inline `formatRelativeTime`
        helper using `user.updated_at` as a proxy (TODO).
      - Action buttons: small dark ghost buttons inline.
      - Header "Users" + "+ Add User" still rendered above the table.
- [ ] **7.1.3** Run UserTable tests. Expected: 4/4 GREEN.
- [ ] **7.1.4** Commit `feat(admin): rewrite UserTable with DataTable + dark role badges`.

### Step 7.2: Final per-chunk gate

- [ ] **7.2.1** `npm run test:run` — Chunk-7 floor ≥ **368**.
- [ ] **7.2.2** `npm run build` — GREEN.
- [ ] **7.2.3** `npm run lint` — ≤ 8 errors (no new errors).
- [ ] **7.2.4** Update spec line 3 → `Status: in implementation
      (chunk 7 complete)`.
- [ ] **7.2.5** Append Chunk 7 entry to `task.md`.
- [ ] **7.2.6** Commit `docs: mark phase B chunk 7 complete (UserTable)`.

**End of Chunk 7.**

## Chunk 8: Modal forms restyled + Toast (4-way split)

> **Spec reference:** §7 row 8 — all modal forms restyled + Toast.
> Mockup uses overlay modals for forms (`modalRaiseTicket`,
> `modalUpdateStatus`, `modalSiteVisit`, `modalAddUser`); our app
> implements those as routed pages instead. Per user direction
> (chunk-7 question), we **restyle existing pages in place** rather
> than migrating them to overlay modals — this preserves routing,
> deep-links, and browser back-button behaviour.
>
> The chunk is split into four sequential sub-chunks because the
> surface area is uneven (one Toast component, three admin overlay
> modals, three short form pages, two large detail pages) and only
> one of the five form pages (`RaiseTicketPage`) currently has tests.
>
> ### Sub-chunk overview
>
> | Sub | Scope | Existing tests? |
> |-----|-------|-----------------|
> | 8a  | `Toast` component — fix position to bottom-right per mockup; verify mockup-aligned gradient + 4px left accent border are already in place. | yes (8 tests) |
> | 8b  | 3 admin overlay modals: `CreateUserModal`, `EditUserModal`, `DeleteUserModal`. Restyle to `dark-modal` shell with dark `Input/Select` controls and dark footer buttons. | yes (3 files) |
> | 8c  | 3 short form pages: `RaiseTicketPage`, `LogVisitPage`, `UpdateStatusPage`. Restyle headers, form controls, action buttons. | partial (1/3) |
> | 8d  | 2 large detail pages: `MachineDetailPage`, `TicketDetailPage`. Restyle in place; add basic smoke tests. | none (0/2) |

### Chunk 8a: Toast position fix

> The current `Toast` component already uses `stat-gradient`,
> `border-brand-{green/red/amber/cyan}`, and `animate-slide-in`,
> closely matching mockup line 205. The only mockup-divergent detail
> is positioning: mockup specifies `bottom: 20px; right: 20px` while
> the current implementation uses `top-4 right-4`. This sub-chunk
> fixes that.
>
> **Test floor**: chunk-7 actual = **368**. Chunk 8a adds 1 test
> (`bottom-4 right-4` positioning) = **+1 added**.
> **New chunk-8a floor: ≥ 369**.

#### Step 8a.1: Move Toast to bottom-right (RED → GREEN)

- [ ] **8a.1.1** Add a 9th case to
      `src/components/common/__tests__/Toast.test.tsx` asserting the
      alert root has `bottom-4` and `right-4` classes (and does NOT
      have `top-4`).
- [ ] **8a.1.2** Run test. Expected: RED.
- [ ] **8a.1.3** Update `src/components/common/Toast.tsx`: replace
      `top-4 right-4` with `bottom-4 right-4` in the className list.
- [ ] **8a.1.4** Run test. Expected: 9/9 GREEN.
- [ ] **8a.1.5** Final gate (full suite, build, lint).
- [ ] **8a.1.6** Commit `feat(toast): position bottom-right per Phase B mockup`.

**End of Chunk 8a.**

### Chunk 8b: Foundation pass — restyle 5 common primitives + 3 admin modals

> Discovered during 8b research: the legacy primitives in
> `src/components/common/` (`Button`, `Input`, `Select`, `TextArea`,
> `Modal`) all use light-mode Tailwind classes with `dark:`
> variants. Because the app does not toggle Tailwind's `dark` class,
> only the light variants render — meaning every existing usage of
> these primitives shows light controls on the Phase B dark
> background. Per user direction, this chunk does a **single
> foundation pass** restyling all five primitives to Phase B tokens,
> then restyles the three admin modal contents on top.
>
> **Token mapping** (mockup → existing Tailwind token):
>
> | Mockup CSS                          | Token used                     |
> |-------------------------------------|--------------------------------|
> | `.modal` `bg #0d1424`               | `bg-bg-surface2`               |
> | `.modal` `border #1e2d4a`           | `border-line-strong`           |
> | `.modal-backdrop` `rgba(0,0,0,.75)` | `bg-black/75 backdrop-blur-sm` |
> | `.modal-title` `#f1f5f9`            | `text-fg-1`                    |
> | `.modal-sub` `#64748b`              | `text-fg-4`                    |
> | `.modal-close` `bg #1e2d4a`         | `bg-line-strong text-fg-4`     |
> | `.form-input` `bg #0a1020`          | `bg-bg-surface1`               |
> | `.form-input` `border #1e2d4a`      | `border-line-strong`           |
> | `.form-input` `text #e2e8f0`        | `text-fg-1`                    |
> | `.form-input:focus` `#38bdf8`       | `focus:border-brand-cyan focus:ring-brand-cyan/15` |
> | `.form-label` uppercase `#64748b`   | `text-[11px] uppercase tracking-wider text-fg-4` |
> | `.btn-primary` blue gradient        | `bg-gradient-to-br from-blue-600 to-blue-700 text-white` |
> | `.btn-ghost` `bg #172033`           | `bg-bg-surface3 text-fg-3 border border-line-strong` |
> | `.btn-danger` `bg #450a0a`          | `bg-red-950 text-red-300 border border-brand-red` |
>
> **Test floor**: chunk-8a actual = **369**. Each primitive restyle
> is a refactor (visual tokens) — existing behaviour tests stay
> green; we add ≥ 1 new "renders dark Phase B token" test per
> primitive to lock visual contract. Estimated +5 tests.
> **New chunk-8b floor: ≥ 374**.

#### Step 8b.1: Button — dark Phase B variants

- [ ] **8b.1.1** Add a test asserting `variant="primary"` button
      includes `bg-gradient-to-br`, `from-blue-600`, `to-blue-700`,
      `text-white`. Add a `variant="ghost"` test asserting
      `bg-bg-surface3` and `text-fg-3`.
- [ ] **8b.1.2** RED.
- [ ] **8b.1.3** Rewrite `variantClasses` in
      `src/components/common/Button.tsx` to Phase B tokens
      (primary / secondary / danger / ghost). Keep the size map
      unchanged (existing test 5 still asserts xs sizing).
- [ ] **8b.1.4** GREEN. Run full suite.
- [ ] **8b.1.5** Commit `feat(button): dark Phase B variants`.

#### Step 8b.2: Input — dark Phase B styling

- [ ] **8b.2.1** Create `Input.test.tsx` with one test asserting the
      rendered `<input>` has `bg-bg-surface1`, `border-line-strong`,
      `text-fg-1`. RED.
- [ ] **8b.2.2** Rewrite className expression to Phase B tokens.
      Label becomes `text-[11px] uppercase tracking-wider text-fg-4`.
      Error border becomes `border-brand-red`. Helper text becomes
      `text-fg-4`. Keep the `aria-invalid` + `aria-describedby`
      wiring intact.
- [ ] **8b.2.3** GREEN.
- [ ] **8b.2.4** Commit.

#### Step 8b.3: Select — dark Phase B styling

- [ ] **8b.3.1** Create `Select.test.tsx` with token assertion. RED.
- [ ] **8b.3.2** Same restyle pattern as `Input` — apply Phase B
      tokens. Keep `<option>` background readable
      (`bg-bg-surface1 text-fg-1`).
- [ ] **8b.3.3** GREEN.
- [ ] **8b.3.4** Commit.

#### Step 8b.4: TextArea — dark Phase B styling

- [ ] **8b.4.1** Create `TextArea.test.tsx` with token assertion. RED.
- [ ] **8b.4.2** Same pattern as `Input`.
- [ ] **8b.4.3** GREEN.
- [ ] **8b.4.4** Commit.

#### Step 8b.5: Modal — dark Phase B shell

- [ ] **8b.5.1** Create `Modal.test.tsx` with two tests:
      (a) panel has `bg-bg-surface2` + `border-line-strong` +
      `rounded-2xl`; (b) backdrop has `bg-black/75` and
      `backdrop-blur-sm`. RED.
- [ ] **8b.5.2** Rewrite `Modal.tsx`: panel uses Phase B tokens;
      header gains `modal-sub`-style subtitle support via optional
      `subtitle` prop (used by mockup); close button restyled to
      `bg-line-strong text-fg-4 hover:text-fg-1`.
- [ ] **8b.5.3** GREEN.
- [ ] **8b.5.4** Commit.

#### Step 8b.6: Admin modal content polish

> The three admin modals already compose `Modal/Input/Select/Button`
> so they pick up dark styling for free after 8b.1–8b.5. The only
> remaining light-themed surface is the `submitError` banner using
> `bg-red-50 text-red-700`.

- [ ] **8b.6.1** Update `CreateUserModal.tsx` and `EditUserModal.tsx`:
      replace the error banner classes with
      `bg-red-950/40 text-red-300 border border-brand-red`. Use
      mockup's "subtitle" pattern by passing `subtitle="Create a team account"` /
      `subtitle="Update team account"` to `Modal`.
- [ ] **8b.6.2** Update `DeleteUserModal.tsx`: any inline light
      surfaces → Phase B tokens; pass appropriate `subtitle`.
- [ ] **8b.6.3** Run all admin modal tests + dark-mode smoke.
      Existing tests should remain green; if any assert specific
      light-theme classes (`bg-white`, `text-gray-*`), update them
      to the new Phase B equivalents.
- [ ] **8b.6.4** Final gate (full suite, build, lint).
- [ ] **8b.6.5** Commit `feat(admin-modals): Phase B dark styling`.

**End of Chunk 8b.**

### Chunk 8c: 3 short form pages restyled

> Now that the common primitives (`Button`, `Input`, `Select`,
> `TextArea`, `Modal`) are dark, the form pages render dark
> controls automatically. The remaining work is restyling the
> page-level wrappers, headers, loading states, custom radio
> cards, and the inline status badge in `UpdateStatusPage`.
>
> Light surfaces still present in the 3 pages:
>
> | Surface                           | Pages                              | Replacement |
> |-----------------------------------|------------------------------------|-------------|
> | Page header `text-gray-900`       | all 3                              | `text-fg-1` |
> | Form wrapper `bg-white border-gray-200 shadow-sm` | all 3 | `SectionCard` from `components/dark/` |
> | Loading spinner `border-gray-300 border-t-primary-600` | all 3 | `border-line-strong border-t-brand-cyan` |
> | Not-found block (red icon, gray text) | UpdateStatusPage              | dark variant w/ `text-brand-red` icon, `text-fg-3` body |
> | Severity radio cards (`border-primary-500 bg-primary-50` selected, `border-gray-200 hover:bg-gray-50` unselected) | RaiseTicketPage | dark — `border-brand-cyan bg-brand-cyan/10` selected, `border-line-strong hover:bg-bg-surface3` unselected |
> | Status radio cards (same shape)   | UpdateStatusPage                   | same dark mapping |
> | Inline `Badge` for machine status | UpdateStatusPage                   | swap to dark `StatBadge` |
> | "Linked Ticket" helper text       | LogVisitPage                       | `text-fg-4` |
> | Legend `text-gray-700`            | RaiseTicket / UpdateStatus         | `text-[11px] uppercase tracking-wider text-fg-4` |
> | Page-not-found "Back to Dashboard" link `text-primary-600` | UpdateStatusPage     | `text-brand-cyan hover:text-brand-green` |
>
> **Smoke coverage**: only `RaiseTicketPage` has a `*.test.tsx` today.
> The dark-mode smoke (`pages/__tests__/dark-mode.test.tsx`) currently
> tests 7 pages × 2 themes; we'll add `RaiseTicketPage`,
> `LogVisitPage`, and `UpdateStatusPage` to it (3 new pages × 1 theme = +3
> tests since these are dark-only post-Phase-B).
>
> **Test floor**: chunk-8b actual = **385**. Chunk 8c adds:
> - +1 RaiseTicketPage test asserting Phase B header + form wrapper classes
> - +2 new smoke tests (LogVisit / UpdateStatus dark render — RaiseTicketPage already has its own test, no new smoke needed there)
> - Existing `RaiseTicketPage.test.tsx` may need its assertions updated if any check light-theme classes; preserve test count.
>
> Estimated +3 tests. **New chunk-8c floor: ≥ 388**.

#### Step 8c.1: RaiseTicketPage Phase B styling

- [ ] **8c.1.1** Inspect `RaiseTicketPage.test.tsx` for any
      light-theme class assertions; update them to Phase B
      equivalents *only if they assert specific class strings*
      (most likely they assert behaviour, not classes).
- [ ] **8c.1.2** Add a new test asserting the page header
      uses `text-fg-1` and the form wrapper renders inside a
      `stat-gradient` element. RED.
- [ ] **8c.1.3** Edit `RaiseTicketPage.tsx`:
      - Replace loading state classes with dark tokens.
      - Replace `<h2>` and form wrapper `<form>` with `SectionCard`-wrapped form (header outside, form inside SectionCard).
      - Replace severity radio cards with dark token mapping.
      - Replace fieldset legend classes.
- [ ] **8c.1.4** GREEN. Full suite.
- [ ] **8c.1.5** Commit.

#### Step 8c.2: LogVisitPage Phase B styling

- [ ] **8c.2.1** Add LogVisitPage to dark-mode smoke
      (`pages/__tests__/dark-mode.test.tsx`) with one render-doesn't-crash
      assertion. RED (page renders, but contains light surfaces — smoke
      passes today; add the smoke test concurrent with the restyle so
      both go green together).
- [ ] **8c.2.2** Edit `LogVisitPage.tsx`: same wrapper / header /
      loading / helper-text replacements as 8c.1. No radio cards.
- [ ] **8c.2.3** GREEN. Full suite.
- [ ] **8c.2.4** Commit.

#### Step 8c.3: UpdateStatusPage Phase B styling

- [ ] **8c.3.1** Add UpdateStatusPage to dark-mode smoke. RED.
- [ ] **8c.3.2** Edit `UpdateStatusPage.tsx`:
      - Replace loading SVG classes (`text-primary-600` →
        `text-brand-cyan`, paragraph color).
      - Replace not-found block (red icon, gray text, primary-600 link).
      - Replace machine-info header card with `SectionCard` or
        a small `bg-bg-surface2 border border-line-strong rounded-xl`
        block.
      - Swap `Badge` from `getStatusBadgeColor` to dark `StatBadge`
        with mapping (`running`→`running`, `down`→`down`,
        `offline`→`offline`, `idle`→`idle`).
      - Replace radio cards with dark token mapping.
      - Replace form wrapper with `SectionCard`-wrapped form.
- [ ] **8c.3.3** GREEN. Full suite.
- [ ] **8c.3.4** Final gate (build, lint).
- [ ] **8c.3.5** Commit.

**End of Chunk 8c.**

---

## Chunk 8d: 2 large detail pages (`MachineDetailPage`, `TicketDetailPage`)

Both pages are functional but visually inherit too many light tokens
(white panels, gray-* texts, light tab strips, green-tinted resolution
panel). Neither has a test file today. Approach: add a smoke test per
page first (RED), then mechanically swap classes to Phase B tokens.

### 8d.1 — `MachineDetailPage.tsx` (629 lines, 4 tabs)

- [ ] **8d.1.1** Add `MachineDetailPage` to `dark-mode.test.tsx` smoke.
      RED. The smoke renders `<Routes><Route path="/machines/:id"
      element={<MachineDetailPage/>}/></Routes>` inside
      `MemoryRouter initialEntries={['/machines/1']}` and asserts
      `bg-bg`/`bg-bg-surface2` token classes appear after data loads.
      Mock services to return synchronous data so the assertion fires
      without a `waitFor` storm. Mock `useProductionSocket` to
      `{ lastSession: null }`.
- [ ] **8d.1.2** Header section:
      - Wrap in `SectionCard` (or
        `bg-bg-surface2 border border-line-strong rounded-xl p-5`).
      - `text-fg-1` for `machine_name`, `text-fg-4` for code/SN,
        `text-fg-3` for the body text.
      - Swap status `Badge` → dark `StatBadge` (`running|idle|down|offline`).
      - Info-grid labels → `text-fg-4`, values → `text-fg-1`.
- [ ] **8d.1.3** Today's Production card: SectionCard wrapper, "Live"
      indicator → `text-brand-green` with green pulse, status `Badge` →
      `StatBadge` with `DAILY_LOG_STATUS_BADGE_VARIANT` (`running`,
      `notrun`, `maintenance`).
- [ ] **8d.1.4** Tab strip:
      - Container border → `border-line-strong`.
      - Active tab → `border-brand-cyan text-brand-cyan`.
      - Inactive → `border-transparent text-fg-4
        hover:text-fg-1 hover:border-line-strong`.
- [ ] **8d.1.5** Production-history table: thead → `text-fg-4
      border-line-strong`, tbody rows → `border-line/50
      hover:bg-bg-surface3`, cell text → `text-fg-2`/`text-fg-3`.
- [ ] **8d.1.6** Tickets list cards: `bg-bg-surface2 border-line-strong`,
      severity/status `Badge` → `StatBadge` (severity P1/P2/P3/P4 →
      `critical|high|medium|low`, status → 8c map).
- [ ] **8d.1.7** Site Visits cards: same wrapper, visit-purpose `Badge`
      → `StatBadge` (`routine|emergency|install|notrun`+ "training" →
      we'll reuse `medium` for training since no dedicated variant).
- [ ] **8d.1.8** Machine History timeline: dark vertical line
      (`bg-line-strong`), dot border → `bg-bg`, card wrapper dark,
      change-type pill → `StatBadge` (use `medium` for all four types
      to keep simple, with subtle bg).
- [ ] **8d.1.9** Loading + not-found blocks → 8c pattern (cyan spinner,
      red-token icon, fg-1 heading, fg-3 body, brand-cyan link).
- [ ] **8d.1.10** `EmptyState` sub-component → `border-line-strong
      bg-bg-surface2 text-fg-4`.
- [ ] **8d.1.11** Back button → `text-brand-cyan hover:text-brand-cyan/80`
      (matches 8c).
- [ ] **8d.1.12** GREEN. Full suite.
- [ ] **8d.1.13** Final gate (build + lint).
- [ ] **8d.1.14** Commit.

### 8d.2 — `TicketDetailPage.tsx` (513 lines, 6 sections)

- [ ] **8d.2.1** Add `TicketDetailPage` to `dark-mode.test.tsx` smoke.
      RED. Mock `getTicketById`/`getMachineById`/`getTicketComments` to
      return a small fixture; assert dark token classes appear.
- [ ] **8d.2.2** Header section: SectionCard, `text-fg-1` title,
      `text-fg-3` description, `text-fg-4` ticket number, severity +
      status `Badge` → `StatBadge`.
- [ ] **8d.2.3** Info grid: labels → `text-fg-4`, values → `text-fg-1`,
      machine link → `text-brand-cyan`. Category `Badge` → `StatBadge`
      (use `medium` neutral for all categories to stay token-correct;
      or extend `StatBadge` if we need distinct colors — defer
      extension unless mockup requires).
- [ ] **8d.2.4** Resolution panel: replace `bg-green-50 border-green-200
      text-green-*` with **dark green tokens**: `bg-green-950/40
      border border-brand-green/30 text-fg-2`, label color
      `text-brand-green`. Stars stay yellow tone; use `text-yellow-400`.
- [ ] **8d.2.5** Comment thread:
      - Wrapper SectionCard.
      - Each comment → `bg-bg-surface3 border-line-strong rounded-md`,
        author `text-fg-1`, time `text-fg-4`, body `text-fg-2`.
      - Empty-state line → `text-fg-4`.
      - Form `border-line-strong` divider.
- [ ] **8d.2.6** Status update panel (engineer/admin): SectionCard,
      heading → `text-fg-2`, divider → `border-line-strong`. The form
      controls (`Select`/`TextArea`/`Input`) already pick up Phase B
      from chunk 8b.
- [ ] **8d.2.7** Loading + not-found → 8c pattern.
- [ ] **8d.2.8** Back button → `text-brand-cyan`.
- [ ] **8d.2.9** GREEN. Full suite.
- [ ] **8d.2.10** Final gate.
- [ ] **8d.2.11** Commit.

**End of Chunk 8d → end of Chunk 8.**
After 8d, update spec status line and `task.md`, then proceed to
Chunk 9 (`OperatorConsoleOverlay`) and Chunk 10 (`NotificationBell`).

---

## Chunk 9 — `OperatorConsoleOverlay`

Brand-new fullscreen overlay component. Shows a live floor view with
ticking clock, fleet-summary KPI row, and a 6-column machine grid that
auto-refreshes every 15s.

**Trigger**: button in `Topbar` (admin/engineer only). Click opens the
overlay; Esc or "Exit Console" button closes it.

**Data sources** (all already exist in `liveMetricsService`):
- `getFleetSummary()` → `FleetSummary` (running/down/idle/today_throughput_tons)
- `getMachineRows()` → `MachineRow[]` (machine_label, status, t/hr, fruit)

### Steps

- [ ] **9.1** Create `src/components/dark/OperatorConsoleOverlay.tsx`.
      Props: `{ isOpen: boolean; onClose: () => void }`. When `!isOpen`,
      returns `null`. When open, renders fullscreen `fixed inset-0
      bg-bg z-[200] overflow-y-auto p-6`.
- [ ] **9.2** Header: cyan title (`text-brand-cyan text-2xl font-bold`)
      + subtitle ("Live floor view — Auto-refresh 15s") + green ticking
      clock (`text-brand-green text-3xl font-mono tabular-nums`) +
      "Exit Console" button (`bg-bg-surface3 text-fg-3` ghost-style).
- [ ] **9.3** Use `useLivePolling(liveMetricsService.getFleetSummary,
      15_000, initial)` for the KPI row. Render 4 `StatCard`s: RUNNING
      (green), DOWN (red), IDLE (yellow), TODAY TONS (cyan/blue).
- [ ] **9.4** Use `useLivePolling(liveMetricsService.getMachineRows,
      15_000, [])` for the machine grid. Render a 6-col grid of compact
      tiles: `M-NNN`, big tons-per-hour value (or DOWN/IDLE/OFF
      label), unit ("t/hr" / "Motor fault" / "Standby"), fruit name in
      colored text. Color border-left by status: running→cyan, idle→
      yellow, down→red, offline→slate.
- [ ] **9.5** Ticking clock: separate `useEffect` with `setInterval`
      (1s) updating a `now: Date` state. Format as `HH:MM:SS`.
- [ ] **9.6** Esc-to-close: `useEffect` adds `keydown` listener; calls
      `onClose()` when `event.key === 'Escape'`.
- [ ] **9.7** Tests in `__tests__/OperatorConsoleOverlay.test.tsx`:
      - renders nothing when `isOpen=false`
      - renders fleet KPIs when open with mocked service data
      - renders machine grid tiles
      - calls `onClose` on Esc
      - calls `onClose` on Exit button click
      - clock format is `HH:MM:SS` (use `vi.useFakeTimers`)
- [ ] **9.8** Add to `components/dark/index.ts` barrel.
- [ ] **9.9** Add trigger button in `Topbar.tsx`: only for
      `user?.role === 'admin' || user?.role === 'engineer'`. Style:
      `bg-gradient-to-br from-blue-900 to-blue-600 text-white px-3
      py-1.5 rounded-md text-xs font-bold` matching `console-btn` in
      mockup. Manage `isConsoleOpen` state in `Topbar`. Mount
      `<OperatorConsoleOverlay>` next to it.
- [ ] **9.10** Update `Topbar.test.tsx` to assert console button only
      shows for admin/engineer + clicking opens overlay.
- [ ] **9.11** GREEN full suite + lint + build.
- [ ] **9.12** Commit (split into multiple commits if it reads more
      naturally — e.g. component first, integration second).
- [ ] **9.13** Update `task.md` and spec status.
