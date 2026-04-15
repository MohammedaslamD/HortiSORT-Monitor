# Real-Time Machine Data Monitoring — Design Spec
**Date:** 2026-04-15
**Status:** Awaiting user approval

---

## 1. Vision

HortiSort Monitor currently tracks machine status, tickets, and daily logs through
manual data entry. This feature closes the loop with the physical world: a tiny
background script on each machine PC reads the sorting application's TDMS data log
files automatically and streams production data in real-time to the web app, visible
to every engineer, admin, and operator — with no browser plugin, no app install, and
no action required from the operator beyond opening a browser tab.

Manual entry (daily logs, tickets, site visits) continues to exist alongside this
feature. The two complement each other: automatic data handles raw production numbers;
manual entry handles qualitative, human-judgment data.

---

## 2. Problem Statement

- Machine sorting data (production lots, start/stop times, fruit type, quantity) lives
  in TDMS files on a Windows PC at the customer site.
- There is currently no automated link between that data and the HortiSort Monitor web
  app — engineers rely on manual daily log entries.
- The goal is to eliminate manual entry for production session data and give everyone
  a live view of what each machine is actually doing, right now.

---

## 3. Full Product Definition

**Who uses it and what they see:**

| Role | Experience |
|------|-----------|
| Operator (machine PC) | Opens browser shortcut → sees their machine's live production lot table |
| Engineer (laptop/phone) | Opens browser URL → sees all assigned machines, live status, lots, errors |
| Admin | Sees all machines across all customers, live counts on dashboard |
| Customer | Sees their own machines' live production data |

**Data split between automatic and manual:**

| Data | Source |
|------|--------|
| Production lots (start/stop, fruit, qty) | Automatic — TDMS watcher |
| Machine status (running/idle/down) | Automatic — derived from live lot data |
| Error events | Automatic — error log folder watcher |
| Tickets | Manual — engineer raises them |
| Daily logs | Manual — engineer/operator fills in notes |
| Site visits | Manual — engineer logs after a visit |

---

## 4. Architecture

### 4.1 Overview

```
CLIENT MACHINE PC (Windows)
  HortiSort Sorting App  →  writes  →  C:\DataLogs\2026-04-15.tdms
                                        C:\DataLogs\Errors\
  hortisort-watcher.exe (silent background)
    - polls every 15 seconds
    - reads new TDMS rows via nptdms
    - detects lot start / lot end
    - reads new error log lines
    - POST JSON → backend over LAN
  Desktop shortcut → operator double-clicks → browser opens

YOUR SERVER (always-on)
  Express.js backend
    POST /api/v1/production-sessions   ← watcher posts here
    GET  /api/v1/production-sessions
    POST /api/v1/machines/:id/errors
    Machine API key auth (X-Machine-Key header)
    Socket.io → broadcasts production:update to all browsers
  PostgreSQL
    production_sessions table (new)
    machine_errors table (new)
    [all existing tables unchanged]

ANY BROWSER (machine PC, engineer laptop, admin phone)
  HortiSort Monitor React app
    /production page — live lot table, all machines user can see
    /machines/:id — gains "Today's Production" section
    /dashboard — gains "In Production Now" live count
    useProductionSocket hook — WebSocket subscription, auto-updates
```

### 4.2 Technology Choices

| Piece | Technology | Reason |
|-------|-----------|--------|
| Watcher script | Python + PyInstaller → `.exe` | `nptdms` reads TDMS natively; PyInstaller bundles all dependencies — zero runtime needed on client PC |
| Real-time browser push | Socket.io | Natural fit with existing Express server; pushes to all browsers simultaneously |
| Database | PostgreSQL (existing) | Consistent with existing stack; Prisma migration |
| Frontend live updates | `useProductionSocket` React hook | Isolates WebSocket logic; reusable across pages |

---

## 5. Component Specifications

### 5.1 hortisort-watcher.exe (Client PC)

- Single self-contained Windows executable (~10 MB), produced by PyInstaller.
- No Python, Node.js, or any runtime required on the client PC.
- Runs silently — no window, no UI.
- Auto-starts via Windows Task Scheduler (one-time setup by HortiSort engineer).
- Reads configuration from `config.json` in the same directory.
- Every `poll_interval_seconds` (default 15):
  - Opens today's TDMS file (`<data_log_path>\YYYY-MM-DD.tdms`).
  - Reads all rows; compares against last known row count.
  - If new rows exist: extracts timestamp, fruit_type, quantity channels.
  - Applies lot detection logic (see Section 6).
  - POSTs new or updated lot data to backend.
  - Scans error log folder for new lines; POSTs any new errors.
- Writes activity to `watcher.log` beside the `.exe` for debugging.

**config.json template:**
```json
{
  "server_url": "http://192.168.1.10:3000",
  "machine_id": 3,
  "machine_api_key": "<random-64-char-token>",
  "data_log_path": "C:\\DataLogs",
  "error_log_path": "C:\\DataLogs\\Errors",
  "poll_interval_seconds": 15,
  "lot_gap_minutes": 5
}
```

### 5.2 Desktop Shortcut (Client PC)

- A standard Windows `.url` or `.lnk` shortcut file on the desktop.
- Points to `http://<server_url>` (the HortiSort Monitor web app).
- Operator double-clicks → default browser opens → live dashboard loads.
- No software installed. No additional login steps required.

### 5.3 Backend: New REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/production-sessions` | X-Machine-Key | Watcher posts new/updated lot |
| `GET` | `/api/v1/production-sessions` | JWT | Fetch sessions (filter by machineId, date) |
| `GET` | `/api/v1/production-sessions/:machineId/today` | JWT | Today's lots for one machine |
| `POST` | `/api/v1/machines/:id/errors` | X-Machine-Key | Watcher posts new error event |

On receiving a `POST /api/v1/production-sessions` with `status: 'running'`, the
backend also calls the existing `updateMachineStatus(machineId, 'running')` logic.
When status is `'completed'`, it calls `updateMachineStatus(machineId, 'idle')`.

### 5.4 Backend: Socket.io

- Socket.io is added to the existing Express server.
- When a production session is saved (created or updated), the server emits:
  `production:update` with payload `{ machineId, sessions: ProductionSession[] }`
- All connected browsers subscribed to that machine's room receive the event and
  re-render without polling.

### 5.5 Backend: Machine API Key Auth Middleware

- New middleware `machineAuth.ts` validates the `X-Machine-Key` request header.
- Keys are stored in a `machine_api_keys` table: `{ machine_id, api_key, is_active }`.
- Invalid or missing key returns `401 Unauthorized`.
- Admin can rotate keys via the existing admin panel (future phase).

### 5.6 Database: New Tables

**production_sessions**
```sql
CREATE TABLE production_sessions (
  id               SERIAL PRIMARY KEY,
  machine_id       INTEGER NOT NULL REFERENCES machines(id),
  lot_number       INTEGER NOT NULL,
  session_date     DATE NOT NULL,
  start_time       TIMESTAMPTZ NOT NULL,
  stop_time        TIMESTAMPTZ,           -- NULL while running
  fruit_type       VARCHAR(100),
  quantity_kg      NUMERIC(10, 2),
  status           VARCHAR(20) NOT NULL
    CHECK (status IN ('running', 'completed', 'error')),
  raw_tdms_rows    JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (machine_id, session_date, lot_number)
);
```

**machine_errors**
```sql
CREATE TABLE machine_errors (
  id           SERIAL PRIMARY KEY,
  machine_id   INTEGER NOT NULL REFERENCES machines(id),
  occurred_at  TIMESTAMPTZ NOT NULL,
  error_code   VARCHAR(100),
  message      TEXT,
  raw_line     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**machine_api_keys**
```sql
CREATE TABLE machine_api_keys (
  id         SERIAL PRIMARY KEY,
  machine_id INTEGER NOT NULL REFERENCES machines(id),
  api_key    VARCHAR(128) NOT NULL UNIQUE,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.7 Frontend: New TypeScript Types

```typescript
// src/types/index.ts additions

export type ProductionSessionStatus = 'running' | 'completed' | 'error'

export interface ProductionSession {
  id: number
  machine_id: number
  lot_number: number
  session_date: string          // 'YYYY-MM-DD'
  start_time: string            // ISO timestamp
  stop_time: string | null
  fruit_type: string | null
  quantity_kg: number | null
  status: ProductionSessionStatus
  created_at: string
  updated_at: string
}

export interface MachineError {
  id: number
  machine_id: number
  occurred_at: string
  error_code: string | null
  message: string | null
  created_at: string
}
```

### 5.8 Frontend: New Files

```
hortisort-monitor/src/
  pages/
    ProductionPage.tsx
  components/
    production/
      ProductionLotTable.tsx
      ProductionStatusBadge.tsx
      index.ts
  services/
    productionSessionService.ts
  hooks/
    useProductionSocket.ts
```

**ProductionPage (`/production`):**
- Accessible to all roles (role-scoping handled by service layer).
- Shows a table of today's production lots for all machines the user can see.
- Columns: `Lot #`, `Machine`, `Start Time`, `Stop Time`, `Fruit`, `Qty (kg)`, `Status`
- WebSocket auto-updates — no manual refresh.

**ProductionLotTable:**
- Receives `sessions: ProductionSession[]` as a prop.
- Renders a table row per session.
- Empty state: "No production data for today yet."

**ProductionStatusBadge:**
- `running` → green badge with a pulsing dot animation
- `completed` → grey badge
- `error` → red badge

**useProductionSocket hook:**
- Connects to Socket.io server on mount.
- Joins a room per machine (or all machines for admin/engineer).
- On `production:update` event: calls a provided callback with the updated sessions.
- Disconnects on unmount.

### 5.9 Frontend: Updated Existing Pages

**MachineDetail page:**
- Adds a "Today's Production" section below machine info.
- Shows `ProductionLotTable` scoped to that machine.
- Shows machine status badge derived from latest session status:
  - Latest session `running` → machine is `Running`
  - Latest session `completed` or no session today → `Idle`
  - Latest session `error` → `Down`

**DashboardPage:**
- `StatsCards` gains a new card: "In Production Now" — count of machines with a
  currently `running` session.

---

## 6. Lot Detection Logic (Watcher Script)

```
On each poll:
  1. Open today's TDMS file at <data_log_path>\YYYY-MM-DD.tdms
  2. Read all rows; get total row count
  3. If row count == last_known_count: no new data, skip
  4. For each new row (from last_known_count to end):
       - Extract: timestamp, fruit_type, quantity_kg
  5. Group consecutive rows into lots using gap detection:
       - If gap between current row timestamp and previous row timestamp
         > lot_gap_minutes (default 5): new lot begins
  6. For each lot:
       - lot_number = sequential index (1, 2, 3...) for today
       - start_time = first row timestamp in the lot
       - stop_time = NULL if this is the last lot and last row is recent
                     (within poll_interval * 3 seconds of now)
                   = last row timestamp otherwise (lot completed)
       - status = 'running' if stop_time is NULL, else 'completed'
       - quantity_kg = sum of quantity channel across all lot rows
       - fruit_type = fruit_type channel value from first row
  7. POST each lot to backend (upsert by machine_id + session_date + lot_number)
  8. Update last_known_count
```

---

## 7. Operator Setup (Step by Step)

**One-time setup by HortiSort engineer (2 minutes per machine):**
1. Copy `hortisort-watcher.exe` and `config.json` to `C:\HortiSort\` on the machine PC.
2. Edit `config.json`: set `server_url`, `machine_id`, `machine_api_key`, `data_log_path`.
3. Open Windows Task Scheduler → New Task → trigger: At startup → action: run
   `C:\HortiSort\hortisort-watcher.exe`. Done.
4. Place `HortiSort Monitor.url` shortcut on the desktop (points to `server_url`).

**Every day thereafter (operator):**
1. Double-click the desktop shortcut.
2. Browser opens, live production dashboard loads.
3. No further action needed — data flows automatically.

---

## 8. Repository Structure Changes

```
/mnt/d/Hackathon web app/
  machine-watcher/               NEW top-level directory
    watcher.py                   Main watcher script (~80 lines)
    config.json                  Template config
    requirements.txt             nptdms, requests, watchdog
    build.sh                     PyInstaller build command
    tests/
      test_lot_detection.py      Unit tests for lot detection logic
    README.md                    Engineer setup guide

  server/src/
    routes/
      productionSessions.ts      NEW
    services/
      productionSessionService.ts NEW
    middleware/
      machineAuth.ts             NEW
    socket/
      productionSocket.ts        NEW
  server/prisma/migrations/
    YYYYMMDD_add_production_tables/  NEW

  hortisort-monitor/src/
    pages/
      ProductionPage.tsx         NEW
    components/
      production/                NEW directory
        ProductionLotTable.tsx
        ProductionStatusBadge.tsx
        index.ts
    services/
      productionSessionService.ts NEW
    hooks/
      useProductionSocket.ts     NEW
    types/index.ts               UPDATED (new interfaces)
```

---

## 9. Build Sequence (8 Phases)

| Phase | What gets built | Deliverable |
|-------|----------------|-------------|
| 1 | DB migration: production_sessions, machine_errors, machine_api_keys | Prisma migration + seed API key |
| 2 | Backend: machine API key auth middleware | machineAuth.ts + tests |
| 3 | Backend: production sessions REST API | 3 endpoints + integration tests |
| 4 | Backend: Socket.io real-time broadcast | productionSocket.ts + tests |
| 5 | Watcher script | watcher.py + lot detection tests + .exe build |
| 6 | Frontend: types, service, socket hook | Types + service + useProductionSocket + tests |
| 7 | Frontend: Production page + components | ProductionPage, ProductionLotTable, badge + tests |
| 8 | Frontend: Update MachineDetail + Dashboard | Updated pages + tests + E2E |

---

## 10. Out of Scope (This Phase)

- Reading CSV or Excel files (TDMS only)
- Remote access over the internet (LAN only)
- Historical TDMS backfill (today's file only)
- Mobile push notifications
- Automated anomaly detection / alerting
- API key rotation UI in admin panel

---

## 11. Success Criteria

1. When the sorting application starts a new lot on the machine PC, the web app's
   production table shows a new `Running` row within 30 seconds on every connected
   browser simultaneously.
2. When the lot stops, the row updates to `Completed` with stop time and quantity
   within 30 seconds.
3. Machine status on the dashboard changes automatically: `idle` → `running` when a
   lot starts, `running` → `idle` when it ends.
4. Engineers and admins on a separate device (same LAN) see identical live updates
   with no install or manual refresh.
5. The watcher `.exe` runs on a fresh Windows machine with no prior software installed.
6. All new backend endpoints have integration tests.
7. All new frontend components have unit tests.
8. TDD workflow followed throughout — failing test written before every implementation.
