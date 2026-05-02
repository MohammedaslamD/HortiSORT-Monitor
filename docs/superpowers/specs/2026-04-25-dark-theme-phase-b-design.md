# Dark Theme Phase B — Mockup-Fidelity Redesign

> Status: in implementation (chunk 8 complete — all 5 form pages + 2 detail pages dark; remaining: chunks 9, 10)
> Branch: `feature/dark-theme-phase-b` (off `feature/dark-theme-phase-a`)
> Source mockup: `.superpowers/brainstorm/1957-1776927382/dark-ui-v2.html`
> Predecessor: `docs/superpowers/specs/2026-04-23-dark-theme-phase-a-design.md`

---

## 1. Goal

Bring the HortiSort Monitor web app to pixel-perfect parity with the approved
`dark-ui-v2.html` mockup while preserving the working light theme established
in Phase A. Phase A applied generic Tailwind dark variants on the existing
component tree; Phase B replaces the visual language and most page layouts to
match the mockup, introduces the new widgets the mockup specifies (Operator
Console, Live Alerts, Activity Timeline, Notification Bell, Machine Fleet
tiles, Donut + Severity bar combo, Live Throughput sparkline), and introduces
mock data services for the metrics those widgets need.

The light theme remains a first-class citizen: every new widget designed in
Phase B ships with both a dark and a light palette derived from the same
semantic token set.

## 2. Non-goals

- No backend wiring for the new metrics. All new data flows through mock
  services in `src/data/` so a future Phase C can swap implementations
  without touching components.
- No Phase 5 backend integration in this phase. The stashed Phase 5 WIP
  (production tables, real machine status) is unaffected.
- No real-time WebSocket layer. "Live" means client-side `setInterval`
  polling against mock services.
- No new authentication, authorization, or routing changes beyond adding
  routes for any new pages introduced (none planned).
- No accessibility regressions allowed, but no new accessibility scope
  (e.g. screen-reader audit) added.

## 3. Background

Phase A delivered:
- Tailwind `darkMode: 'class'`
- `ThemeContext` + `ThemeToggle` with localStorage persistence and pre-hydration FOUC script
- `dark:*` Tailwind variants on every existing component and page
- 169-test suite passing in both themes

The user reviewed Phase A in the browser and rejected the result on visual
grounds — the mockup describes a navy/cyan design system with gradient
surfaces, colored accent bars, pulsing status dots, a sectioned sidebar, and
several widgets that don't yet exist in the app. Phase A correctly delivered
its scoped goal (theme foundation) but the gap to the mockup is large.

This spec closes that gap.

## 4. Architecture

### 4.1 Strangler-pattern migration

Phase B is delivered as a strangler-pattern migration on a single feature
branch. New design-system primitives are built side-by-side with existing
components. Pages migrate one at a time. Each commit leaves the app fully
working in both themes. No big-bang rewrites.

Two parallel tracks share the branch:

1. **Design-system track** — new primitives in `src/components/dark/` plus
   semantic Tailwind tokens (see §5). Every primitive ships with full
   tests before any page consumes it.
2. **Page-migration track** — replace each page's markup using the new
   primitives in the order documented in §6.

### 4.2 Theme strategy

Phase A's `ThemeContext` + `ThemeToggle` + `darkMode: 'class'` foundation is
preserved. Phase B layers **semantic Tailwind tokens** on top so that markup
references intent (`bg-surface-1`, `text-fg-3`, `border-line`) instead of
hex codes. Each token resolves to a navy palette in dark and a neutral
palette in light. Adding a third theme later is a config change, not a
markup migration.

### 4.3 New mock-data layer

The mockup displays metrics that don't yet exist in our data: per-machine
tons-per-hour, per-machine uptime %, fleet today-throughput, trend deltas,
alerts feed, activity timeline, 30-minute live throughput sparkline.

Phase B adds three new services and three new mock data files:

| Service                | Mock file                  | Returns                              |
|------------------------|----------------------------|--------------------------------------|
| `liveMetricsService`   | `data/mockLiveData.ts`     | `MachineLiveMetrics[]`, `FleetSummary`, `ThroughputPoint[]` |
| `alertService`         | `data/mockAlerts.ts`       | `Alert[]`                            |
| `activityService`      | `data/mockActivity.ts`     | `ActivityEvent[]`                    |

Each service is `async` and typed, matching the existing service contract
(see `AGENTS.md` "Service Layer Contract"). A future backend swap is a
single-file change per service.

### 4.4 Polling

The mockup shows "Live - Auto-refresh 15s" semantics. Phase B implements
this with `setInterval` in a custom `useLivePolling<T>(fn, intervalMs)` hook
that:
- Calls `fn` immediately
- Re-calls every `intervalMs`
- Cleans up on unmount
- Pauses while `document.hidden === true`

§10 is the authoritative list of which widgets poll and at what cadence.

## 5. Design tokens

### 5.1 Tailwind extension

`tailwind.config.js` `theme.extend.colors` adds:

```js
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
}
```

### 5.2 CSS variables

`src/index.css` defines two variable scopes — root (light) and `.dark`:

```css
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
```

(All values stored as `R G B` triplets to compose with Tailwind's
`<alpha-value>` syntax.)

### 5.3 Stat-card gradient backgrounds

Stat cards use a custom utility, not a token, because the gradient mixes two
surfaces:

```css
.stat-gradient {
  background: linear-gradient(135deg,
    rgb(var(--bg-surface2)),
    rgb(var(--bg-surface1)));
}
```

Light mode also gets a subtle gradient (`#ffffff` → `#f8fafc`) so the
shape and depth of the card matches the mockup's visual rhythm.

### 5.4 Animations

`tailwind.config.js`:

```js
animation: {
  'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
  'slide-in':  'slideIn 0.3s ease',
},
keyframes: {
  pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
  slideIn:  { from: { transform: 'translateX(100%)', opacity: 0 },
              to:   { transform: 'translateX(0)',    opacity: 1 } },
}
```

## 6. Components (design system)

All new primitives live in `src/components/dark/` with a barrel
`src/components/dark/index.ts`. Each ships with a `__tests__/Foo.test.tsx`
file and is fully covered before any page consumes it.

### 6.1 Atoms

| Component       | Props (summary)                                      |
|-----------------|------------------------------------------------------|
| `StatusDot`     | `tone: 'green'\|'red'\|'amber'\|'blue'\|'gray'`, `pulse?: boolean` |
| `StatBadge`     | `variant: 'running'\|'idle'\|'down'\|'offline'\|'live'\|'critical'\|'high'\|'medium'\|'low'\|'open'\|'inprog'\|'resolved'\|'completed'\|'admin'\|'engineer'\|'customer'\|'maint'\|'notrun'\|'routine'\|'emergency'\|'install'`, `children: ReactNode` (chunk 2 ships 17/21 variants; maint, routine, emergency, install added when first consumed) |
| `IconTile`      | `tone: 'green'\|'red'\|'amber'\|'blue'\|'cyan'\|'purple'`, `children: ReactNode (icon)` |
| `TrendPill`     | `direction: 'up'\|'down'`, `value: string`           |
| `Sparkline`     | `points: ThroughputPoint[]`, `height?: number`       |
| `ProgressBar`   | `percent: number`, `tone: 'green'\|'red'\|'amber'`, `height?: number` |
| `InfoBanner`    | `tone?: 'info'\|'warn'`, `title?: string`, `children: ReactNode`. Used in Daily Logs page and inside Update Status modal. Renders left-accent-bordered banner with subtle gradient. |
| `Button` (extended) | Existing `common/Button` gains variants `'primary' \| 'ghost' \| 'danger' \| 'yellow' \| 'green'`, plus a `size: 'xs' \| 'sm' \| 'md'` prop (`xs` is the table-row mini size at `px-2 py-1 text-[10px]`, mapping to the mockup's `padding:4px 8px;font-size:10px`). The component is extended, not replaced, so existing call sites continue to work; passing the new variants triggers the new visual styles. |

`StatBadge` replaces the existing `Badge` for these specific variants;
existing `Badge` stays for legacy markup that hasn't migrated yet.

`Toast` (existing `common/Toast`) is restyled in chunk 0 alongside theme
tokens to use the mockup's gradient surface + cyan-green left border + the
`slide-in` animation defined in §5.4. No API change.

### 6.2 Molecules

| Component        | Composition                                                    |
|------------------|----------------------------------------------------------------|
| `StatCard`       | gradient surface, top accent bar, icon tile, label, big value, optional trend pill, optional sub-line. Replaces `dashboard/StatsCards` content. Props: `accent: 'green'\|'blue'\|'yellow'\|'red'\|'purple'\|'cyan'`, `label: string`, `value: ReactNode`, `valueColor?: string` (CSS color override), `icon: ReactNode`, `trend?: { direction, value }`, `sub?: ReactNode`, `dot?: 'green'\|'red'\|'amber'` (renders pulsing `StatusDot` next to label). |
| `SectionCard`    | uppercase title + optional `<sc-link>` slot, gradient surface, padded body. Props: `title: string`, `link?: { label: string; onClick: () => void }`, `meta?: ReactNode` (replaces link slot for non-actionable metadata like "LAST 30 MIN"). |
| `MachineTile`    | status-bordered tile with name+badge header, big metric, unit line, progress bar. Props: `tone: 'running'\|'idle'\|'down'\|'offline'`, `name: string`, `badge: ReactNode`, `value: ReactNode`, `valueColor?: string`, `unit: string`, `progressPercent?: number`, `progressTone?: 'green'\|'red'\|'amber'`, `onClick?: () => void`. |
| `AlertRow`       | severity-coloured left-border, two-line text (machine + meta + message), nested `StatBadge` |
| `TimelineItem`   | icon tile + title/meta lines, separator below                  |
| `VisitCard`      | header (title + badge), body (findings/actions), 2-col stats footer |
| `LogRow`         | grid (date / machine / status / fruit-tons / notes / by) — used in Daily Logs page |
| `DonutChart`     | SVG donut with center metric + right-aligned legend list. Reuses Recharts? No — hand-rolled SVG matches the mockup's exact look (a Recharts donut won't reproduce the centred text + side legend cleanly enough). |
| `SeverityBar`    | stacked horizontal bar (P1/P2/P3/P4) + count footer            |
| `DataTable`      | dense dark table primitive shared by Machines, Tickets, Production, Daily Logs (header row), and Users pages. Props: `columns: { key: string; label: string; align?: 'left'\|'right'\|'center'; width?: string }[]`, `rows: { id: string\|number; cells: ReactNode[] }[]`, `onRowClick?: (id) => void`. Header cells use `text-fg-6 uppercase tracking text-[10px]`; body rows use `bg-bg-surface3` on hover and `border-line/40` between rows; first column gets `text-fg-1 font-semibold`. Cells accept arbitrary `ReactNode` so `ProgressBar`, `StatBadge`, mini `Button`s compose freely. |

### 6.3 Organisms

| Component                  | Notes                                                                  |
|----------------------------|------------------------------------------------------------------------|
| `Sidebar`                  | persistent on `lg:`, drawer on smaller. Section labels (`OVERVIEW`, `OPERATIONS`, `ADMIN`), nav items with icon + label + optional count badge (`warn` variant for alerting counts). Active item gets cyan left border + tinted background. |
| `Topbar`                   | brand (split style: `Horti` in `brand-cyan`, `Sort` in `brand-green`), divider, page-title slot fed from a `pageTitle: string` prop drilled from each page, Operator Console button (admin/engineer only) + `NotificationBell` + user chip + theme toggle |
| `NotificationBell`         | dropdown panel listing unread alerts (mock); red badge count; click-outside closes |
| `OperatorConsoleOverlay`   | `position: fixed inset-0`, ticking clock, fleet KPI row (`StatCard`s), 6-col machine grid (`MachineTile` variant), Esc / Exit button. Polls `liveMetricsService` every 15 s via `useLivePolling`. |
| `Modal` (restyled)         | extends existing `common/Modal` to use new tokens (backdrop blur, rounded-14, navy surface in dark). All form inputs receive new focus ring (`brand-cyan` + 2 px shadow). |

### 6.4 Layout

`PageLayout` is rewritten:

```
┌ Topbar (h-14) ──────────────────────────────────────────┐
│ Brand | Page Title              [Console] [🔔] [User]   │
├──────┬──────────────────────────────────────────────────┤
│ Side │  Page content (max-w-screen, padding 20px 24px)   │
│ bar  │                                                  │
│ 208  │                                                  │
│ px   │                                                  │
└──────┴──────────────────────────────────────────────────┘
```

On `< lg:` the sidebar collapses to a drawer (hamburger in topbar). The
existing bottom-nav is removed — sidebar drawer covers mobile too.

## 7. Page migration plan

Each page lives in `src/pages/`. Existing tests are updated to match the new
markup (TDD: write failing test for new structure, implement, refactor).
Existing service calls are unchanged unless the page uses a new metric;
those wire to the new mock services.

| # | Page                       | Replaces             | New widgets used                               |
|---|----------------------------|----------------------|------------------------------------------------|
| 0 | Topbar + Sidebar shell     | `Navbar`+`BottomNav` | `Sidebar`, `Topbar`, `NotificationBell`        |
| 1 | `DashboardPage` ("Command Center") | `DashboardPage` | `StatCard×5`, `MachineTile×8` (fleet section), `Sparkline` plus the Live-Throughput footer block (PEAK / AVG / NOW + Actual/Target legend, rendered alongside `Sparkline` inside its `SectionCard`), `DonutChart`, `SeverityBar`, `TimelineItem×N`, `AlertRow×N` |
| 2 | `MachinesPage`             | `MachinesPage`       | `StatCard×4`, `SectionCard`, dense table primitive (header row of `text-fg-6 uppercase tracking`, body rows with `bg-surface3` row hover), inline `ProgressBar` for uptime |
| 3 | `TicketsPage`              | `TicketsPage`        | `StatCard×4`, table primitive, `StatBadge` per row    |
| 4 | `ProductionPage`           | `ProductionPage`     | `StatCard×4`, table primitive, `b-live` badge animated |
| 5 | `DailyLogsPage`            | `DailyLogsPage`      | `info-banner`, `StatCard×4`, `LogRow`           |
| 6 | `SiteVisitsPage`           | `SiteVisitsPage`     | `StatCard×4`, `VisitCard`                      |
| 7 | `AdminPage` (Users tab)    | `AdminPage`          | table primitive, `b-admin/b-engineer/b-customer` badges, restyled action buttons |
| 8 | All modal forms restyled (incl. restyled `Toast`) | existing modals + `Toast` | `Modal` primitive, new form-input tokens, `InfoBanner` inside Update Status modal, restyled `Toast` (gradient bg + slide-in animation per §5.4) |
| 9 | `OperatorConsoleOverlay`   | new                  | `OperatorConsoleOverlay`                       |
| 10| `NotificationBell` dropdown | new                 | `NotificationBell`                             |

`MachineDetailPage`, `RaiseTicketPage`, `LogVisitPage`, `UpdateStatusPage`,
`TicketDetailPage` are restyled in the modal-forms chunk.

## 8. Data model additions

`src/types/index.ts`:

```ts
export interface MachineLiveMetrics {
  machine_id: number
  tons_per_hour: number | null
  uptime_percent: number     // 0-100
  progress_percent: number   // 0-100 vs daily target
  current_fruit: string | null
}

export interface FleetSummary {
  total_machines: number
  running: number
  idle: number
  down: number
  offline: number
  in_production: number
  today_throughput_tons: number
  trend_running_vs_yesterday: number  // signed delta vs yesterday
  trend_throughput_pct: number        // signed % vs avg
  open_tickets: { total: number; p1: number; p2: number; p3: number; p4: number }
}

export interface ThroughputPoint {
  time: string      // ISO
  actual: number    // t/hr
  target: number    // t/hr
}

export type AlertSeverity = 'critical' | 'warn' | 'info' | 'ok'
export type AlertBadgeLabel = 'P1' | 'P2' | 'P3' | 'P4' | 'INFO' | 'OK'

export interface Alert {
  id: number
  machine_id: number
  machine_label: string  // denormalised for display
  severity: AlertSeverity
  badge_label: AlertBadgeLabel  // explicit label so 'critical' alerts can show 'P1', 'info' alerts can show 'INFO', etc.
  message: string
  created_at: string     // ISO
}

/**
 * `severity` controls AlertRow's left-border color (`a-crit`, `a-warn`, `a-info`, `a-ok`).
 * `badge_label` controls the nested `StatBadge` text + variant. Mapping:
 *   - 'P1' -> StatBadge variant 'critical'
 *   - 'P2' -> 'high'
 *   - 'P3' -> 'medium'
 *   - 'P4' -> 'low'
 *   - 'INFO' -> 'inprog' (blue)
 *   - 'OK'   -> 'completed' (green)
 * The mapping is implemented in a pure helper `alertBadgeVariant(label)` co-located with `AlertRow`.
 */

export type ActivityIconTone = 'red' | 'green' | 'blue' | 'purple' | 'cyan' | 'yellow'
export interface ActivityEvent {
  id: number
  type: 'ticket' | 'production' | 'visit' | 'machine' | 'user'
  icon_tone: ActivityIconTone
  title: string
  meta: string
  created_at: string
}
```

`Machine` and other existing interfaces are unchanged.

## 9. Mock-data sources

Each mock file is hand-authored at meaningful realistic values, not Lorem
Ipsum. They are deterministic (no `Math.random()` at module top level) so
tests can assert on specific values.

- `mockLiveData.ts` — 12 machine entries; one fleet summary; a function
  `generateThroughputSeries(now: Date)` that returns 30 points spaced 1 min
  apart with deterministic noise (seeded by `now.getMinutes()`), so the
  Sparkline animates believably between polls.
- `mockAlerts.ts` — 12 alerts at varying recency
- `mockActivity.ts` — 18 activity events at varying recency

Services wrap these and return `Promise<T>` to preserve the async contract.

## 10. Polling strategy

`src/hooks/useLivePolling.ts`:

```ts
export function useLivePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  initial: T,
): { data: T; loading: boolean; error: string | null } {
  // - fetch once on mount
  // - schedule setInterval
  // - pause when document.hidden
  // - clean up on unmount
  // - swallow errors into error state, keep last good data
}
```

Used by:
- `OperatorConsoleOverlay` — 15 s, polls fleet summary + machine metrics
- Dashboard `Sparkline` — 5 s, polls throughput series
- Dashboard alerts feed — 30 s, polls `alertService`

Other widgets are non-polling.

## 11. Tests

Strict TDD per AGENTS.md. Each new primitive ships with at minimum:
- A render test (smoke)
- A variant/prop test for every meaningful branch (e.g. all `StatBadge`
  variants render)
- An interaction test where applicable (e.g. `NotificationBell` opens on
  click, closes on outside click, count updates)

Existing tests adapt to new markup as their pages migrate. No test is
deleted unless the corresponding component is removed; tests for kept
components only get assertions tweaked.

`useLivePolling` gets dedicated unit tests with `vi.useFakeTimers()`
covering: initial fetch, interval ticks, document.hidden pause/resume,
unmount cleanup, error handling.

Page-level smoke tests in `pages/__tests__/dark-mode.test.tsx` are
extended to cover every page in both themes.

Final coverage target: same or better than Phase A's 169 tests. Concrete
minimum: **200 passing tests** at the close of Phase B; expected range
~230-260.

## 12. Accessibility

- All interactive elements remain keyboard-navigable.
- Sidebar drawer traps focus when open on mobile.
- Operator Console overlay traps focus and returns focus to opener on
  close. Esc closes.
- `aria-label` on icon-only buttons (bell, theme toggle, console open,
  modal close).
- Pulsing animation respects `prefers-reduced-motion: reduce` (animation
  disabled via media query in `index.css`).
- Color-only signal forbidden: every status badge has a label, every
  severity has both color and icon/text.

## 13. Performance budget

- Per-page bundle size growth ≤ 30 KB gzipped from current Phase A
  baseline.
- Sparkline and DonutChart hand-rolled in SVG (no extra recharts
  dependency for these — Recharts stays only for what already uses it).
- Polling intervals are conservative; no widget polls below 5 s.

## 14. Migration safety

- All work on `feature/dark-theme-phase-b` off Phase A.
- `npm run build`, `npm run test:run`, `npm run lint` (pre-existing
  errors aside) green at every commit.
- No removal of existing components until all callers are migrated.
- Stashed Phase 5 WIP untouched; Phase B does not require it and does not
  block returning to Phase 5 work.

## 15. Done criteria

1. `npm run build` passes.
2. `npm run test:run` passes; total test count ≥ Phase A's count.
3. `npm run lint` passes (within pre-existing error budget; no new
   errors introduced by Phase B work).
4. Every page in §7 visually matches the mockup in dark mode at desktop
   width (1440 × 900).
5. Every page renders correctly in light mode using the mirrored token
   palette.
6. Theme toggle still works; cross-tab sync still works; no FOUC on
   reload in either theme.
7. Operator Console opens, ticks, polls, closes; reachable from Topbar
   button.
8. Notification Bell shows count, opens dropdown, closes on outside
   click.
9. Dashboard "Command Center" renders all widgets without console
   errors and without dropped data.
10. Mobile breakpoint (`< lg`) is functional: sidebar drawer opens,
    closes; all pages scroll without horizontal overflow.

## 16. Out of scope (revisit in Phase C)

- Real backend wiring for live metrics, alerts, activity stream.
- WebSocket-driven live updates.
- Reduced-motion-only static fallback design (we use the `prefers-
  reduced-motion` media query but no separate static assets).
- Per-user customisable dashboards.
- Dark+light theme system-preference detection beyond current `prefers-
  color-scheme` initial value (already in Phase A).

## 17. Open risks

| Risk                                                                | Mitigation                                                                 |
|---------------------------------------------------------------------|----------------------------------------------------------------------------|
| 5-day estimate slips on visual polish                                | Each chunk is independently mergeable; we can ship partial Phase B.       |
| Hand-rolled DonutChart loses Recharts' tooltip a11y                  | Add focusable legend items + visible value column; Recharts isn't pixel-perfect anyway. |
| Polling causes test flakes                                           | `useLivePolling` accepts an injectable timer for tests; default `setInterval`. |
| Light palette for new widgets feels uncanny                          | Iterate after first migrated page lands; tokens make tweaks one-file.     |
| Sidebar removal breaks test assertions on bottom-nav text            | Migrate `BottomNav` test file as part of chunk 0; delete obsolete asserts. |

---

End of spec.
