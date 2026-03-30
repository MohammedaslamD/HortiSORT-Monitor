# E2E Test Report — HortiSort Monitor

**Date:** 28 Mar 2026 (bugs fixed and live-verified 30 Mar 2026)
**Branch:** `feature/phase5-backend`
**Commit:** `a6f80a8`
**Frontend:** `http://172.28.144.1:3000`
**Backend:** `http://172.28.144.1:4000`

---

## Suite 1 — Authentication

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 1.1 | Unauthenticated redirect to `/login` | ✅ PASS | `/dashboard` → `/login` |
| 1.2 | Invalid credentials shows error message | ✅ PASS | Fixed — `apiClient.ts` now skips refresh-retry for `/api/v1/auth/` endpoints |
| 1.3 | Admin login → `/dashboard` | ✅ PASS | Shows "Aslam Sheikh / admin" |
| 1.4 | Engineer login → dashboard, 6 machines | ✅ PASS | Shows "Amit Sharma / engineer" |
| 1.5 | Customer login → dashboard, 2 machines | ✅ PASS | Shows "Rajesh Patel / customer" |
| 1.6 | Logout clears session, redirects to `/login` | ✅ PASS | |
| 1.7 | Session persists on page refresh | ✅ PASS | Token in sessionStorage |

---

## Suite 2 — Role-Based Access Control

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 2.1 | Customer has no Admin link in sidebar | ✅ PASS | |
| 2.2 | Customer has no Site Visits link in sidebar | ✅ PASS | |
| 2.3 | Customer → `/admin` redirects to `/dashboard` | ✅ PASS | |
| 2.4 | Customer → `/visits` redirects to `/dashboard` | ✅ PASS | |
| 2.5 | Customer can access `/tickets/new` (sees their 2 machines only) | ✅ PASS | |
| 2.6 | Engineer → `/admin` redirects to `/dashboard` | ✅ PASS | |
| 2.7 | Engineer → `/visits` renders Site Visits page | ✅ PASS | Fixed — `SiteVisitsPage` now only calls `GET /api/v1/users` when role is admin |
| 2.8 | Admin sees all nav links | ✅ PASS | Dashboard, Machines, Tickets, Daily Logs, Site Visits, Admin |

---

## Suite 3 — Dashboard

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 3.1 | Stats cards show correct counts | ✅ PASS | Total=12, Running=6, Idle=2, Down=2, Offline=2, Open Tickets=6 |
| 3.2 | Search filter narrows machine cards and updates stats reactively | ✅ PASS | Search "Mumbai" → 1 machine |
| 3.3 | Status filter works | ✅ PASS | Filter "Down" → 2 machines |
| 3.4 | Machine card click navigates to detail page | ✅ PASS | → `/machines/3` |

---

## Suite 4 — Raise Ticket

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 4.1 | Submit valid ticket, navigate to detail with correct data | ✅ PASS | TKT-1774703771708 created, auto-assigned to machine engineer |
| 4.2 | Empty form submission shows validation errors | ✅ PASS | 4 alerts: Machine, Category, Title, Description required |

---

## Suite 5 — Tickets

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 5.1 | Tickets list loads with all tickets and filters | ✅ PASS | 11 tickets (10 seeded + 1 from test), search + 3 filter dropdowns |
| 5.2 | Click ticket navigates to detail with full data and comments | ✅ PASS | TKT-00001: 3 comments, metadata, status update section |
| 5.3 | Add comment → toast + comment count updates | ✅ PASS | Toast "Comment added successfully", count 3→4 |
| 5.4 | Update ticket status → toast + badge updates live | ✅ PASS | Open→In Progress, toast "Status updated to In Progress" |

---

## Suite 6 — Machine Status Update

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 6.1 | Update machine status from Down→Running | ✅ PASS | New production row appears: 28 Mar 2026, Running, Mango, 12.5 t, 06:00–14:00 |

---

## Suite 7 — Site Visits

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 7.1 | Site Visits list loads for admin with filters and visits | ✅ PASS | 6 seeded visits, Machine/Purpose/Engineer filter dropdowns |
| 7.2 | Log new visit → redirected to list, new visit appears at top | ✅ PASS | New visit dated 28 Mar 2026 at top of list |

---

## Suite 8 — Admin Panel

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 8.1 | Admin dashboard loads: stats, recent activity, user table | ✅ PASS | 7 users, 12 machines, 7 open tickets, 7 site visits; activity feed reflects live test actions |
| 8.2 | Deactivate user → status inactive, count drops, button→Activate | ✅ PASS | Toast "User Rajesh Patel deactivated" |
| 8.3 | Activate user → status active, count restores, button→Deactivate | ✅ PASS | Toast "User Rajesh Patel activated" |
| 8.4 | Own account Deactivate button is disabled (self-protection) | ✅ PASS | Aslam Sheikh's Deactivate button is `disabled` |

---

## Suite 9 — Dashboard Charts

| TC | Description | Result | Notes |
|----|-------------|--------|-------|
| 9.1 | Admin: all three chart headings visible on dashboard | ✅ PASS | "Machine Status", "Ticket Severity", "Throughput — Last 7 Days (tons)" all present |
| 9.2 | Admin: Machine Status donut renders with fleet legend | ✅ PASS | Running/Idle/Down/Offline legend items visible; SVG chart rendered |
| 9.3 | Admin: Ticket Severity bar chart renders with axes and legend | ✅ PASS | P1–P4 x-axis labels, Open/In Progress/Resolved legend visible |
| 9.4 | Admin: Throughput area chart renders with data | ✅ PASS | 28 Mar data point present; y-axis labelled in tons |
| 9.5 | Engineer: all three charts visible with role-scoped data | ✅ PASS | 6 machines shown, 2 open tickets shown; all 3 chart headings present |
| 9.6 | Customer: Machine Status & Throughput visible; Ticket Severity absent | ✅ PASS | Machine Status donut rendered; Throughput heading present (no data for customer); Ticket Severity heading not in DOM |

---

## Summary

| | Count |
|---|---|
| Total test cases | 33 |
| ✅ PASS | 33 |
| ❌ FAIL | 0 |

---

## Bugs Fixed

### BUG-1 — Invalid login shows no error message (Medium) — FIXED

- **TC:** 1.2
- **Root cause:** `apiClient.ts` intercepted 401 responses and attempted a token refresh for all endpoints including `/api/v1/auth/login`. When the refresh also failed, it hard-redirected to `/login` and threw `'Session expired'`, losing the original server error message before React could render it.
- **Fix:** `apiClient.ts` — added `isAuthEndpoint` check; the refresh-retry flow is skipped for any request path containing `/api/v1/auth/`. The server's error message (`'Invalid email or password'`) now propagates correctly to the UI.
- **Files changed:** `src/services/apiClient.ts`, `src/services/__tests__/apiClient.test.ts` (3 tests added)

### BUG-2 — Engineer accessing Site Visits gets 403 Forbidden (High) — FIXED

- **TC:** 2.7
- **Root cause:** `SiteVisitsPage.tsx` called `GET /api/v1/users` unconditionally via `Promise.all`, even for engineer users. That endpoint is restricted to `admin` only.
- **Fix:** `SiteVisitsPage.tsx` — `getUsers()` is now only called when `user.role === 'admin'`. Engineers don't need the engineer-filter dropdown (already hidden in JSX), so the call is simply omitted for non-admin roles.
- **Files changed:** `src/pages/SiteVisitsPage.tsx`, `src/pages/__tests__/SiteVisitsPage.test.tsx` (1 test added, existing mock refactored to support role switching)
