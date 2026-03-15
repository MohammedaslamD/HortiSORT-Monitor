# Phase 2: Dashboard + Machine Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Dashboard, Machine List, Machine Detail, and Update Status pages with full service layer, role-based data filtering, and responsive mobile-first UI.

**Architecture:** 
- Service layer: Plain async functions wrapping mock data (machineService, ticketService, dailyLogService, machineHistoryService, siteVisitService) with a userLookup utility
- Dashboard: StatsCards row + MachineCard grid + role-based filtering
- Machine List: Search/filter bar + responsive card list
- Machine Detail: Tabbed interface (Production History, Tickets, Site Visits, Machine History)
- Update Status: Form page that creates daily log entries and updates machine status
- All pages use existing common components (Button, Badge, Card, Input, Select, TextArea)

**Tech Stack:** React 19, TypeScript 5.9, Vitest 4, Tailwind CSS v3, react-router-dom v7

---

## Chunk 1: Fix Broken Services + Complete Service Layer

### Task 1: Fix machineService — add model/city/search filters

**Files:**
- Modify: `src/services/machineService.ts`
- Test: `src/services/__tests__/machineService.test.ts`

- [ ] **Step 1: Implement model, city, and search filters in getMachines**
- [ ] **Step 2: Add getMachineById, getMachineStats, getMachinesByRole functions**
- [ ] **Step 3: Write tests for new filters and functions**
- [ ] **Step 4: Run tests — verify all pass**
- [ ] **Step 5: Commit** `feat: complete machineService with all filters and role-based queries`

### Task 2: Create ticketService (missing file)

**Files:**
- Create: `src/services/ticketService.ts`
- Test (exists): `src/services/__tests__/ticketService.test.ts`

- [ ] **Step 1: Create ticketService with getTickets, getTicketsByMachineId, getOpenTicketCount**
- [ ] **Step 2: Add tests for new functions**
- [ ] **Step 3: Run tests — verify all pass (including the existing broken test)**
- [ ] **Step 4: Commit** `feat: add ticketService with getTickets and filtering functions`

### Task 3: Create siteVisitService and machineHistoryService

**Files:**
- Create: `src/services/siteVisitService.ts`
- Create: `src/services/machineHistoryService.ts`
- Create: `src/services/__tests__/siteVisitService.test.ts`
- Create: `src/services/__tests__/machineHistoryService.test.ts`

- [ ] **Step 1: Create siteVisitService with getSiteVisitsByMachineId**
- [ ] **Step 2: Create machineHistoryService with getHistoryByMachineId**
- [ ] **Step 3: Write tests for both services**
- [ ] **Step 4: Run all tests — verify full regression passes**
- [ ] **Step 5: Commit** `feat: add siteVisitService and machineHistoryService`

---

## Chunk 2: Dashboard Components + Page

### Task 4: Build StatsCards component

**Files:**
- Create: `src/components/dashboard/StatsCards.tsx`
- Create: `src/components/dashboard/index.ts`

- [ ] **Step 1: Create StatsCards — a row of status count cards (Total, Running, Idle, Down, Offline, Open Tickets)**
- [ ] **Step 2: Use Badge color coding from spec: green=running, yellow=idle, red=down, gray=offline**
- [ ] **Step 3: Commit** `feat: add StatsCards dashboard component`

### Task 5: Build MachineCard component

**Files:**
- Create: `src/components/machines/MachineCard.tsx`
- Create: `src/components/machines/index.ts`

- [ ] **Step 1: Build MachineCard showing machine_code, model, city/state, status badge, today's log, last updated, open ticket indicator**
- [ ] **Step 2: Add role-based action buttons (engineer: Update Status / Raise Ticket; admin: all)**
- [ ] **Step 3: Make it clickable — navigates to /machines/:id**
- [ ] **Step 4: Commit** `feat: add MachineCard component with role-based actions`

### Task 6: Build DashboardPage

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Replace placeholder with full dashboard: StatsCards + MachineCard grid**
- [ ] **Step 2: Fetch machines via getMachinesByRole, stats via getMachineStats, open tickets via getOpenTicketCount**
- [ ] **Step 3: Add search bar and status/city filters**
- [ ] **Step 4: Role-based filtering: customer sees own machines, engineer sees assigned, admin sees all**
- [ ] **Step 5: Loading state and empty state**
- [ ] **Step 6: Commit** `feat: build DashboardPage with stats cards, machine grid, and filters`

---

## Chunk 3: Machine Detail + Tabs

### Task 7: Build MachineDetailPage

**Files:**
- Create: `src/pages/MachineDetailPage.tsx`
- Modify: `src/routes/AppRoutes.tsx` (add /machines/:id route)

- [ ] **Step 1: Build machine info header section (code, name, model, serial, status badge, customer/engineer names, location, installation date, last updated)**
- [ ] **Step 2: Build "Today's Production" section from dailyLogService**
- [ ] **Step 3: Build tab navigation (Production History, Tickets, Site Visits, Machine History)**
- [ ] **Step 4: Build Production History tab — table of daily logs, sorted by date desc**
- [ ] **Step 5: Build Tickets tab — list of tickets for this machine with severity/status badges**
- [ ] **Step 6: Build Site Visits tab — visit cards with date, engineer, purpose, findings**
- [ ] **Step 7: Build Machine History tab — timeline of changes**
- [ ] **Step 8: Add role-based action buttons at bottom (engineer: Update Status, Raise Ticket, Log Visit; admin: all + Edit Machine)**
- [ ] **Step 9: Handle invalid machine ID with error state**
- [ ] **Step 10: Add route to AppRoutes.tsx**
- [ ] **Step 11: Commit** `feat: build MachineDetailPage with tabs and role-based actions`

---

## Chunk 4: Update Status Page

### Task 8: Build UpdateStatusPage

**Files:**
- Create: `src/pages/UpdateStatusPage.tsx`
- Modify: `src/routes/AppRoutes.tsx` (add /machines/:id/update-status route)

- [ ] **Step 1: Build form: status radio buttons, fruit type dropdown, tons processed, shift start/end, notes**
- [ ] **Step 2: Pre-select machine from URL param**
- [ ] **Step 3: On submit: update mock data state (add daily log, update machine status)**
- [ ] **Step 4: Success toast and redirect back to machine detail**
- [ ] **Step 5: Add route with engineer+admin role guard**
- [ ] **Step 6: Commit** `feat: build UpdateStatusPage with daily log form`

### Task 9: Final wiring + regression

- [ ] **Step 1: Run full test suite — all tests pass**
- [ ] **Step 2: Run build — no TypeScript errors**
- [ ] **Step 3: Update task.md with Phase 2 completion status**
- [ ] **Step 4: Commit** `chore: Phase 2 complete — update task.md`
