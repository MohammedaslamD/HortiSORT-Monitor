# Dark Theme Redesign — Phase A Design Spec

**Date:** 2026-04-23
**Status:** Awaiting user approval
**Scope:** Theme infrastructure + dark-mode styling for existing pages and
components. New widgets from the v2 mockup (donut chart, severity bar, activity
timeline, notification bell, auto-log banner, site-visit card redesign) are
**out of scope** for Phase A and will be specified separately in Phase B.

---

## 1. Vision

Give HortiSort Monitor a modern dark-themed UI suited to the long-running
operator/engineer console use case (dim-lit control rooms, mobile devices used
on the sorting floor), while preserving the existing light theme behind a
user-controlled toggle. Every existing page, component, and interaction must
work identically in both themes with no functional regressions.

Reference mockup: `.superpowers/brainstorm/1957-1776927382/dark-ui-v2.html`
(dashboard / machines / tickets / daily logs / site visits / update-status).

---

## 2. Problem Statement

- The current UI is light-only with hardcoded `bg-white`, `text-gray-900`,
  `border-gray-200`, etc. scattered across every component.
- Operators run the app on-site for entire shifts; a light UI on a bright
  shop-floor tablet or a dim control-room monitor is fatiguing.
- Customers and engineers asked for a "dark console" look matching industrial
  SCADA tools.
- We need a theming foundation before Phase B can layer new dark-only widgets
  (donuts, timelines, etc.) without creating one-off styling.

---

## 3. What's In / Out of Phase A

| In (Phase A) | Out (Phase B) |
|--------------|---------------|
| Tailwind `darkMode: 'class'` config | Fleet-status donut chart widget |
| `ThemeContext` + `ThemeProvider` | Ticket severity bar widget |
| `useTheme()` hook with `theme` + `toggleTheme` | Activity timeline widget |
| `ThemeToggle` common component | Notification bell + dropdown |
| Persisted preference (`localStorage: hortisort.theme`) | Site-visit card redesign |
| System preference detection (first-visit default) | Auto-log info banner on UpdateStatus |
| Dark variants on all existing common components (Button, Badge, Card, Input, Select, TextArea, Modal, Toast) | Dashboard layout restructure (5-col KPI row) |
| Dark variants on layout shell (Navbar, Sidebar, PageLayout, BottomNav) | Toast position / animation changes |
| Dark variants on every existing page | New KPI calculations |
| Dark variants on existing dashboard widgets (StatsCards, MachineCard, ThroughputChart axes/grid) | |
| Regression tests on theme toggle + persistence | |

---

## 4. User-Facing Behaviour

1. **First visit**: theme defaults to the user's OS preference via
   `prefers-color-scheme: dark`. If the media query is unavailable, default
   is `light` (preserves today's behaviour).
2. **Toggle**: a sun/moon icon button lives in the Navbar (desktop) and
   Sidebar footer (mobile). Clicking toggles instantly with no page reload.
3. **Persistence**: selection is written to `localStorage` under
   `hortisort.theme` (`'light' | 'dark'`). Subsequent visits honour the stored
   value and ignore OS preference.
4. **Cross-tab sync**: `storage` event listener keeps multiple tabs in sync.
5. **No FOUC**: a tiny inline script in `index.html` sets the `dark` class on
   `<html>` before React hydrates, reading `localStorage` + system preference
   synchronously.
6. **Auth-independent**: theme persists across login/logout. It is a device
   preference, not a user-profile preference (no DB column added in Phase A).

---

## 5. Architecture

### 5.1 Files added

| File | Purpose |
|------|---------|
| `src/context/ThemeContext.tsx` | Provider, `useTheme` hook, constants |
| `src/context/__tests__/ThemeContext.test.tsx` | Unit tests |
| `src/components/common/ThemeToggle.tsx` | Sun/moon button |
| `src/components/common/__tests__/ThemeToggle.test.tsx` | Unit tests |

### 5.2 Files modified

| File | Change |
|------|--------|
| `hortisort-monitor/tailwind.config.js` | Add `darkMode: 'class'` |
| `hortisort-monitor/index.html` | Inline pre-hydration theme script |
| `src/main.tsx` | Wrap `<App/>` in `<ThemeProvider>` |
| `src/components/common/index.ts` | Export `ThemeToggle` |
| `src/components/common/{Button,Badge,Card,Input,Select,TextArea,Modal,Toast}.tsx` | Add `dark:` variants |
| `src/components/layout/{Navbar,Sidebar,PageLayout,BottomNav}.tsx` | Add `dark:` variants; mount toggle |
| `src/components/dashboard/{StatsCards,ThroughputChart,…}.tsx` | Add `dark:` variants; pass theme-aware colours to Recharts |
| `src/components/machines/MachineCard.tsx` | Add `dark:` variants |
| `src/pages/*.tsx` | Add `dark:` variants on inline backgrounds/text |
| Component tests touching exact class strings | Update assertions |

### 5.3 Files NOT modified in Phase A

- `src/services/**` — theming is UI-only; no service changes.
- `src/types/index.ts` — no new type fields.
- Backend — no theme column on users.
- Database schema — untouched.

---

## 6. Detailed Design

### 6.1 `ThemeContext`

```ts
export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

export const THEME_STORAGE_KEY = 'hortisort.theme'
```

- `ThemeProvider` reads initial value from `<html class>` (set by the pre-hydration script).
- `setTheme` writes to `localStorage`, applies/removes `dark` class on `document.documentElement`, and updates state.
- `toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')`.
- Listens to `storage` events for cross-tab sync.
- `useTheme` throws if used outside provider (consistent with `useAuth`).

### 6.2 Pre-hydration script (`index.html`)

```html
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
```

Runs before the Vite bundle; prevents a flash of the wrong theme.

### 6.3 `ThemeToggle` component

```tsx
interface ThemeToggleProps {
  className?: string
}
```

- Renders a button with sun icon in dark mode, moon icon in light mode.
- `aria-label` reflects target theme ("Switch to dark theme" / "…light theme").
- Calls `toggleTheme()` on click.
- Uses inline SVGs (no icon-library dependency added in Phase A).

### 6.4 Colour strategy

All existing Tailwind colour utilities stay. Dark variants use this mapping:

| Surface role | Light | Dark |
|--------------|-------|------|
| Page background | `bg-gray-50` | `dark:bg-gray-950` |
| Card surface | `bg-white` | `dark:bg-gray-900` |
| Elevated surface (modal) | `bg-white` | `dark:bg-gray-800` |
| Primary text | `text-gray-900` | `dark:text-gray-100` |
| Secondary text | `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-500` | `dark:text-gray-500` |
| Border | `border-gray-200` | `dark:border-gray-800` |
| Divider | `border-gray-100` | `dark:border-gray-800` |
| Input bg | `bg-white` | `dark:bg-gray-900` |
| Input border | `border-gray-300` | `dark:border-gray-700` |
| Hover row | `hover:bg-gray-50` | `dark:hover:bg-gray-800` |

Status colours (`primary`, `success`, `warning`, `danger`, `offline`) are kept
as-is; the 500/600 shades read correctly on both backgrounds. Badges adjust
only their background alpha (e.g. `bg-red-100 dark:bg-red-900/30`).

### 6.5 Recharts theming

`ThroughputChart` (and any Phase A chart) accepts theme-aware colours via
`useTheme()`:

- Axis / grid stroke: `#e5e7eb` (light) → `#374151` (dark)
- Tooltip bg: `#ffffff` / `#1f2937`
- Tooltip border: `#e5e7eb` / `#374151`
- Line/area fill: unchanged `primary.500`

Implemented by reading `theme` in the component and passing to `<CartesianGrid>`,
`<XAxis>`, `<YAxis>`, `<Tooltip contentStyle={…}>`.

---

## 7. Testing Strategy (TDD)

Order: write failing test → minimum implementation → refactor → commit.

### 7.1 `ThemeContext` tests
- Default theme is `'light'` when no `localStorage` value and `matchMedia` returns false.
- Default theme is `'dark'` when `matchMedia('(prefers-color-scheme: dark)')` matches.
- `localStorage` value wins over system preference.
- `toggleTheme()` flips light↔dark.
- `setTheme('dark')` adds `dark` class to `document.documentElement`.
- `setTheme('light')` removes `dark` class.
- `setTheme` persists to `localStorage` under `hortisort.theme`.
- `storage` event from another tab updates theme.
- `useTheme()` throws when used outside provider.

### 7.2 `ThemeToggle` tests
- Renders moon icon when theme is light.
- Renders sun icon when theme is dark.
- Click toggles theme via context.
- `aria-label` updates with current theme.

### 7.3 Regression coverage
- Existing component tests updated where they assert exact class strings.
- Add one smoke test per page asserting both themes render without error
  (`render(<Page/>)` then `setTheme('dark')` then re-assert key text is present).
- `npm run test:run` must be green before Phase A is considered done.

---

## 8. Accessibility

- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text, in both themes.
  Verified against the palette in §6.4.
- Focus rings visible on both themes (`focus:ring-primary-500` reads on gray-950).
- `ThemeToggle` button has descriptive `aria-label` and visible focus state.
- `prefers-reduced-motion` respected — no theme-switch transition beyond CSS's
  implicit colour change.

---

## 9. Out of Scope (explicit non-goals)

- Per-user theme stored in DB.
- Custom themes beyond light/dark.
- High-contrast accessibility theme.
- Animated theme transition.
- Theme-aware illustrations / logos.
- Any new dashboard widget, page, or data model change.

---

## 10. Success Criteria

1. `npm run build` passes.
2. `npm run test:run` passes (all existing tests + new Phase A tests).
3. `npm run lint` passes.
4. Every existing page renders correctly in both themes (manual verification
   checklist: Login, Dashboard, Machines, Machine Detail, Tickets, Daily Logs,
   Site Visits, Update Status, Admin).
5. Toggle persists across reload and across tabs.
6. No FOUC on a hard reload in either theme.
7. All existing functionality works identically in both themes.

---

## 11. Open Questions

_None — will be filled in if reviewers raise any._

---

## 12. Phase B Preview (not part of this spec)

Phase B will add, on top of Phase A's theme foundation:
- Fleet-status donut chart component.
- Ticket-severity horizontal bar component.
- Activity timeline component.
- Notification bell with dropdown.
- Auto-daily-log info banner on UpdateStatusPage.
- Site-visit card redesign.
- Dashboard layout restructure to the 5-column KPI row from v2 mockup.

Phase B will be specified in a separate design doc after Phase A ships.
