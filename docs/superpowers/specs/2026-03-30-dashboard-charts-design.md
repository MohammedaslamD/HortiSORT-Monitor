# Dashboard Charts — Design Spec

**Date:** 2026-03-30
**Feature:** Graphical charts on the Dashboard page for all roles
**Branch:** feature/dashboard-charts

---

## Overview

Add three Recharts-based chart components to the Dashboard page, inserted between the existing `StatsCards` and the machine card grid. Charts give users an at-a-glance visual summary of fleet health, ticket workload, and production throughput.

---

## Scope

### In scope
- Machine Status donut chart (all roles)
- Ticket Severity/Status bar chart (admin + engineer only)
- 7-day Throughput area chart (all roles)
- Recharts installed as a runtime dependency
- Unit tests for each chart component and updated DashboardPage tests

### Out of scope
- Charts on any page other than Dashboard
- Real-time / auto-refreshing charts
- Chart date-range controls (fixed 7-day window for throughput)
- Exporting chart data

---

## Layout

Option A — charts inserted between stats cards and machine card grid:

```
┌─────────────────────────────────────────┐
│  Stats Cards  (existing, unchanged)     │
├─────────────────────────────────────────┤
│  🍩 Machine Status  │  📊 Ticket Severity│  ← new (2-col on md+)
├─────────────────────────────────────────┤
│  📈 Throughput — Tons Processed (7d)    │  ← new (full width)
├─────────────────────────────────────────┤
│  Search + Status filter bar (existing)  │
│  Machine Cards grid  (existing)         │
└─────────────────────────────────────────┘
```

- Machine Status and Ticket Severity sit side-by-side on `md+` screens, stacked on mobile.
- Throughput chart is full-width beneath them.
- The `TicketSeverityChart` is rendered only when `user.role !== 'customer'`. When hidden, `MachineStatusChart` takes full width on all screen sizes.

---

## Charting Library

**Recharts** — installed as a runtime dependency.

```bash
npm install recharts
```

Recharts ships its own TypeScript declarations since v2 — no `@types/recharts` package is needed or available on npm.

Recharts is composable React components over SVG, has first-class TypeScript support, and adds ~500 KB to the bundle (gzipped ~150 KB). No other charting library is introduced.

---

## Components

### `src/components/dashboard/MachineStatusChart.tsx`

**Purpose:** Visualise the fleet status breakdown as a donut chart.

**Props:**
```typescript
interface MachineStatusChartProps {
  stats: MachineStats  // { total, running, idle, down, offline }
}
```

**Implementation:**
- Recharts `PieChart` + `Pie` with `innerRadius` (donut style)
- 4 slices, fixed colours: running=`#22c55e`, idle=`#eab308`, down=`#ef4444`, offline=`#94a3b8`
- `Tooltip` showing count + percentage
- `Legend` below chart
- Empty state: if `stats.total === 0`, render a placeholder message

---

### `src/components/dashboard/TicketSeverityChart.tsx`

**Purpose:** Show ticket distribution by severity, coloured by status.

**Props:**
```typescript
interface TicketSeverityChartProps {
  tickets: Ticket[]
}
```

**Implementation:**
- Recharts `BarChart` (grouped bars, `layout="vertical"` optional)
- X-axis: severity buckets — P1 Critical, P2 High, P3 Medium, P4 Low
- Each bar split/grouped by ticket status: open, in_progress, resolved+closed
- Colours: open=`#ef4444`, in_progress=`#f97316`, resolved/closed=`#22c55e`
- `Tooltip` + `Legend`
- Empty state: if `tickets.length === 0`, render a placeholder message
- **Visibility:** Only rendered when `user.role !== 'customer'` (controlled in `DashboardPage`)

---

### `src/components/dashboard/ThroughputChart.tsx`

**Purpose:** Show total tons processed per day over the last 7 days.

**Props:**
```typescript
interface ThroughputChartProps {
  logs: DailyLog[]  // pre-filtered to last 7 days by caller
}
```

**Implementation:**
- Recharts `AreaChart` — single aggregated area (sum of `tons_processed` per date)
- X-axis: date labels (e.g. "Mar 24")
- Y-axis: tons processed
- Smooth curve (`type="monotone"`), fill with opacity 0.2, stroke solid
- `Tooltip` showing date + total tons
- Empty state: if `logs.length === 0`, render a placeholder message

---

### `src/components/dashboard/index.ts`

Barrel re-export for all three chart components:

```typescript
export { MachineStatusChart } from './MachineStatusChart'
export { TicketSeverityChart } from './TicketSeverityChart'
export { ThroughputChart } from './ThroughputChart'
```

---

## DashboardPage Changes

### State additions
No new state variables needed — all data is already fetched.

### Data derivation

Add two derived values (computed inline, no new state):

```typescript
// Full fleet stats — always unfiltered, for MachineStatusChart
const allMachinesStats: MachineStats = {
  total: machines.length,
  running: machines.filter((m) => m.status === 'running').length,
  idle: machines.filter((m) => m.status === 'idle').length,
  down: machines.filter((m) => m.status === 'down').length,
  offline: machines.filter((m) => m.status === 'offline').length,
}

// Last 7 days of logs for ThroughputChart
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
const last7DaysLogs = allDailyLogs.filter(
  (log) => new Date(log.date) >= sevenDaysAgo
)
```

`allDailyLogs` replaces the current `todayLogs` variable — `getDailyLogs()` is already called; just stop filtering to today only, keep all returned logs, and filter to 7 days client-side for the chart.

**Note:** The existing `stats` variable (derived from `filteredMachines`) is unchanged and continues to drive `StatsCards`. `MachineStatusChart` receives `allMachinesStats` so it always reflects the full fleet regardless of any active search/status filter.

### JSX additions

Between `<StatsCards />` and the filter bar, add:

```tsx
{/* Charts section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <MachineStatusChart stats={allMachinesStats} />
  {user.role !== 'customer' && (
    <TicketSeverityChart tickets={allTickets} />
  )}
</div>
<ThroughputChart logs={last7DaysLogs} />
```

When `user.role === 'customer'`, the grid collapses to 1 column and `MachineStatusChart` spans full width automatically.

---

## Data Flow

```
DashboardPage (fetches once on mount)
  ├── getMachinesByRole()  →  machines[]      →  allMachinesStats (derived)  →  MachineStatusChart
  ├── getTickets()         →  allTickets[]    →  TicketSeverityChart (admin/eng only)
  └── getDailyLogs()       →  allDailyLogs[]  →  last7DaysLogs (filtered) → ThroughputChart
```

No new API endpoints or service calls are required.

---

## File Changes Summary

| File | Change |
|------|--------|
| `package.json` | Add `recharts` runtime dependency |
| `src/components/dashboard/MachineStatusChart.tsx` | **New** |
| `src/components/dashboard/TicketSeverityChart.tsx` | **New** |
| `src/components/dashboard/ThroughputChart.tsx` | **New** |
| `src/components/dashboard/index.ts` | Add 3 new exports |
| `src/pages/DashboardPage.tsx` | Rename `todayLogs` → `allDailyLogs` (no other consumers), add `allMachinesStats` derived value, add chart section to JSX |
| `src/components/dashboard/__tests__/MachineStatusChart.test.tsx` | **New** |
| `src/components/dashboard/__tests__/TicketSeverityChart.test.tsx` | **New** |
| `src/components/dashboard/__tests__/ThroughputChart.test.tsx` | **New** |
| `src/pages/__tests__/DashboardPage.test.tsx` | Update: chart visibility by role |

---

## Testing

### Chart component tests (`.test.tsx`)
Each chart gets its own test file with:
- Renders without crashing with typical data
- Renders empty-state when given empty/zero data
- `TicketSeverityChart`: correct number of bar groups rendered for given tickets

### DashboardPage tests
- Admin: all three chart sections are present in the DOM
- Engineer: all three chart sections are present
- Customer: `MachineStatusChart` and `ThroughputChart` present, `TicketSeverityChart` absent

### Mocking Recharts in tests
Recharts renders SVG; tests use happy-dom. Mock recharts at the module level to avoid SVG rendering issues. Each chart uses `ResponsiveContainer` as an outer wrapper — mock it too. Full set of components used across all three charts:

```typescript
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}))
```

---

## E2E Playwright Verification

After implementation, manually verify the charts in the live browser using the Playwright MCP tool. Results are recorded in `E2E_TEST_REPORT.md` as a new **Suite 9 — Dashboard Charts** section.

### Test cases

| TC | Role | Steps | Expected |
|----|------|--------|----------|
| 9.1 | Admin | Login as `aslam@hortisort.com`, navigate to `/dashboard` | Machine Status donut, Ticket Severity bar, and Throughput area charts all visible |
| 9.2 | Admin | Inspect Machine Status chart | Shows all 12 machines split by status (running/idle/down/offline) |
| 9.3 | Admin | Inspect Ticket Severity chart | Shows ticket bars grouped by P1–P4 severity |
| 9.4 | Admin | Inspect Throughput chart | Shows area chart with last 7 days of data |
| 9.5 | Engineer | Login as `amit.sharma@hortisort.com`, navigate to `/dashboard` | All three charts visible, scoped to engineer's machines |
| 9.6 | Customer | Login as `rajesh.patel@agrifresh.com`, navigate to `/dashboard` | Machine Status and Throughput charts visible; Ticket Severity chart absent |

---

## Acceptance Criteria

1. Admin dashboard shows all three charts with real data
2. Engineer dashboard shows all three charts with role-scoped data
3. Customer dashboard shows Machine Status and Throughput charts; Ticket chart is absent
4. All three charts render an empty/placeholder state gracefully when data is empty
5. All existing 104 tests continue to pass
6. At least 9 new tests added (3 per chart component) + DashboardPage role tests updated
7. `npm run build` passes with no TypeScript errors
8. E2E Suite 9 (6 test cases) recorded in `E2E_TEST_REPORT.md`
9. Implementation committed to git with conventional commit message
