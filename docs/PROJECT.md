# HortiSort Monitor — Project Document

> Problem · Solution · AI Usage

---

## 1. Problem

### Industry Context

HortiSort machines are automated fruit grading and sorting systems deployed at farms,
cold storage facilities, and processing units across India. Each machine is owned by a
customer, serviced by a field engineer, and overseen by administrators at HortiSort HQ.

### The Operational Gap

Before this tool existed, managing a fleet of HortiSort machines meant:

- **No single source of truth.** Machine status, production logs, service tickets, and
  site visit records lived in spreadsheets, WhatsApp threads, and engineers' notebooks.
  Admins had no real-time view of what was running, what was down, or what needed
  attention.

- **No role-based visibility.** Customers could not self-serve to check their machine's
  uptime or raise a support ticket without calling HQ. Engineers had no structured way
  to log a shift's output or record a site visit. Admins had to manually aggregate
  reports from multiple sources.

- **No accountability trail.** When a machine broke down, there was no searchable
  history of what changed, who serviced it last, and what the output trends looked like
  before the failure.

- **Communication overhead.** Every status update required a phone call or message.
  Ticket resolution had no formal lifecycle — open, in-progress, resolved.

### Who Is Affected

| Role | Pain |
|------|------|
| **Customer** | No visibility into their own machine's health or ticket status |
| **Engineer** | No structured way to log production, raise tickets, or record visits |
| **Admin** | No dashboard for fleet-wide status, no activity audit trail |

---

## 2. Solution

### What We Built

**HortiSort Monitor** is a full-stack web application that gives each role a tailored,
real-time view of the machine fleet and the tools to act on it.

### Core Features

#### Role-Based Dashboard
Each user sees only what is relevant to them. Customers see their own machines.
Engineers see machines they are assigned to. Admins see the entire fleet.

The dashboard shows:
- Live machine status (Running / Idle / Down / Offline)
- Fleet-wide stats (total machines, open tickets)
- Search and filter by status, model, city

#### Machine Detail
Clicking any machine opens a full detail view with:
- Current status, location, software version, installation date
- Today's production log (fruit type, tons processed, shift times)
- Tabbed history: Production logs, Tickets, Site visits, Machine change history

#### Daily Log (Update Status)
Engineers log each shift's output directly in the app — fruit type, quantity, shift
start/end, machine status, and notes. The backend persists it immediately and the
dashboard reflects it without a page reload.

#### Ticket Management
Any user can raise a support ticket against a machine. Engineers and admins can update
ticket status (open → in-progress → resolved) and add comments. Ticket visibility is
role-scoped: customers see tickets on their machines, engineers see tickets they raised
or are assigned to, admins see all.

#### Site Visits
Engineers log site visits with date, purpose, and notes. Customers and admins can view
visit history per machine.

#### Admin Panel
Admins get a dedicated page with fleet-wide activity feed, user management (activate /
deactivate accounts), and aggregate stats across all machines and tickets.

### Technical Architecture

```
Browser (React 19 + TypeScript + Vite)
        ↕  REST API  (JWT Bearer + sessionStorage refresh token)
Express.js server  (Node.js + TypeScript)
        ↕  Prisma ORM
PostgreSQL database
```

**Frontend** (`hortisort-monitor/`)
- React 19, TypeScript 5.9, Vite 8
- Tailwind CSS v3 for styling
- react-router-dom v7 for client-side routing
- JWT access token held in memory; refresh token in `sessionStorage` (per-tab)
- 92 unit tests (Vitest + React Testing Library)

**Backend** (`server/`)
- Express.js with full middleware stack (CORS, cookie-parser, Zod validation, JWT auth,
  error handler)
- 9 REST resource routers: auth, machines, daily logs, tickets, ticket comments,
  site visits, machine history, activity log, users
- Prisma ORM with a PostgreSQL database (9 enums, 8 models)
- 55 integration tests across all routes

**Auth**
- JWT access tokens (15-minute expiry) held in module memory
- Refresh tokens (7-day expiry) stored in `sessionStorage` per browser tab — enabling
  two different users to be simultaneously logged in across tabs without session
  cross-contamination
- httpOnly cookie retained on the server side as a fallback

### Pages

| Page | Roles |
|------|-------|
| Login | Public |
| Dashboard | All |
| Machines | All |
| Machine Detail | All |
| Update Status | Engineer, Admin |
| Tickets | All |
| Ticket Detail | All |
| Raise Ticket | All |
| Daily Logs | All |
| Site Visits | All |
| Log Visit | Engineer, Admin |
| Admin | Admin only |

---

## 3. AI Usage

The entire application was built in a single hackathon session using
**OpenCode (powered by Claude Sonnet)** as the primary coding agent.
AI was not used just for code snippets — it drove the full engineering process:
architecture, planning, implementation, testing, debugging, and review.

### Planning and Architecture

Before writing any code, AI produced full design specifications and implementation
plans for each phase:

- **Phase 2:** Dashboard + Machine Management design spec and 30-task plan
- **Phase 3:** Tickets, Daily Logs & Site Visits design spec and implementation plan
- **Phase 4:** MachinesPage + AdminPage design spec and plan
- **Phase 5:** Backend & Database — a 41-task plan covering Docker, Prisma schema,
  Express server, JWT auth, all 9 API resource routes, and frontend service swaps

Each spec defined data models, component structure, API contracts, and edge cases
before a single line of implementation was written.

### Test-Driven Development

The project followed strict TDD (Red-Green-Refactor) throughout:

1. AI wrote failing tests first
2. Wrote minimum implementation to make them pass
3. Refactored without changing behavior
4. Ran regression after each change

This produced **147 tests** across the codebase (92 frontend unit tests + 55 backend
integration tests), all written by AI alongside the implementation.

### Implementation — Phase by Phase

**Phase 1 — Frontend Foundation**
AI scaffolded the full React + TypeScript + Vite project, implemented the auth flow
with mock data, role-based routing with protected/public route guards, responsive
layout (sidebar + bottom nav), and 8 reusable UI primitives (Button, Badge, Card,
Input, Select, TextArea, Modal, Toast).

**Phase 2 — Dashboard + Machine Management**
AI designed and implemented the complete service layer (6 services, 47 tests),
DashboardPage with stats and filtered machine grid, MachineDetailPage with 4 tabbed
sections, and UpdateStatusPage with full form validation.

**Phase 3 — Tickets, Daily Logs, Site Visits**
AI extended the service layer (ticketService grew to 14 functions), built TicketsPage,
TicketDetailPage, RaiseTicketPage, DailyLogsPage, SiteVisitsPage, and LogVisitPage,
along with all card components and barrel exports.

**Phase 4 — Machines + Admin**
AI added userService, activityLogService, MachinesPage with role-aware filters, and
the full AdminPage (fleet stats, activity feed, user management table).

**Phase 5 — Real Backend**
AI replaced all in-memory mock data with a production-grade backend:
- Wrote the Prisma schema (9 enums, 8 models, all FK relations)
- Wrote the database seed script
- Implemented all 9 Express routers with Zod validation
- Added JWT utilities, auth middleware, error handler
- Rewrote all frontend services to call the real API
- Wrote 55 integration tests

### Debugging

AI diagnosed and fixed every bug encountered, following a systematic root-cause-first
approach (never patching symptoms):

| Bug | Root Cause Identified | Fix |
|-----|-----------------------|-----|
| CORS rejecting frontend requests | Origin regex was `localhost:3000` only | Widened to `localhost:<any port>` |
| Chrome rejecting refresh cookie | `sameSite: 'strict'` blocks cross-site cookie in dev | Changed to `'lax'` |
| UpdateStatusPage not persisting | Form was using a `setTimeout` mock instead of real API calls | Wired to `addDailyLog` + `updateMachineStatus` |
| Engineers seeing empty ticket list | Frontend double-filtered (`?assignedTo` + server `roleWhere` = AND logic returning nothing) | Simplified frontend to `getTickets()` once; server handles scoping |
| Engineer missing self-raised tickets | Backend `roleWhere` only matched `assigned_to`, not `raised_by` | Added `OR [assigned_to, raised_by]` |
| Prisma test client pointing to wrong DB | Singleton reads `DATABASE_URL` before `dotenv` loads in worker forks | Added `envSetup.ts` as `setupFiles`; passed `datasourceUrl` explicitly to constructor |
| Multi-tab users overwriting each other | httpOnly refresh cookie is shared across all tabs; second login overwrites first | Moved refresh token to `sessionStorage` (per-tab); server accepts token from request body |

### AI Tools and Workflow

| Tool / Capability | How It Was Used |
|-------------------|-----------------|
| Architecture planning | Full design specs written before any code |
| TDD enforcement | Failing tests written first, every time |
| Multi-file implementation | Entire feature slices (service + route + tests + frontend) in one pass |
| Systematic debugging | Root cause investigated before any fix was attempted |
| Code review | AI reviewed its own output for consistency with project conventions |
| Git discipline | Conventional commit messages, atomic commits, task.md updated every session |
| AGENTS.md authoring | AI maintained the agent instruction file so future sessions stayed consistent |

### What AI Did Not Do

- AI did not run the PostgreSQL server or apply migrations — that was done manually in
  the developer's terminal
- AI did not make product decisions (what features to build) — those came from the
  human team
- AI did not deploy the application

### Numbers

| Metric | Value |
|--------|-------|
| Total files created/modified | ~80 |
| Lines of production code | ~6,000 |
| Tests written | 147 |
| Phases completed | 5 + post-implementation fixes |
| Bugs diagnosed and fixed | 7 |
| Commits | 15+ |
| Time (approximate) | 1 hackathon session |
