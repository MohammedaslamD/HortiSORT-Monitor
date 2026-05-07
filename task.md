# TASK.md — HortiSort Monitor Session Log

## Session: Chunk 3 + Chunk 4 + Test Fixes

---

## Chunk 3 — Connect Remaining Pages to Real API

### MachinesPage (`src/pages/MachinesPage.tsx`)
- Removed all `liveMetricsService` (100% mock) usage
- Now fetches `GET /api/v1/machines/stats` + `GET /api/v1/machines` via `apiClient`
- Shows real machine name, city, state, model, software version, last updated
- Auto-refreshes every 30 s
- Navigate buttons route to `/machines/:id/update-status` and `/tickets/new?machine=:id`

### liveTicketsService (`src/services/liveTicketsService.ts`)
- Fully rewritten from 100% mock to real API
- Fetches `GET /api/v1/tickets/stats`, `GET /api/v1/tickets?limit=200`, `GET /api/v1/machines`, `GET /api/v1/users`
- Resolves `machine_code` from embedded `ticket.machine` or fallback machine list
- Resolves `assigned_to_name` from users API

### DailyLogsPage (`src/pages/DailyLogsPage.tsx`)
- Was already using real API for logs + machines
- Fixed: `getUserName()` was reading from `MOCK_USERS`
- Now fetches `GET /api/v1/users` alongside logs/machines and builds local `userNameMap`

### SiteVisitsPage (`src/pages/SiteVisitsPage.tsx`)
- Same fix as DailyLogsPage — `getUserName()` now uses real users from API

---

## Chunk 4 — Multi-Machine Support + watcher.exe

### Config Generator (`machine-watcher/generate_configs.py`)
- Run once on deployment machine to produce `configs/config_machine_NN_HS-XXXX-XXXX.json`
- Edit `BACKEND_URL` and `DATA_DIR` before running

### Per-Machine Configs (`machine-watcher/configs/`)
- 12 config files generated, one per machine
- Each pre-filled with `api_key` and `machine_id` matching the DB

### watcher.exe (`machine-watcher/dist/watcher.exe`)
- Built with PyInstaller 6.20.0, onedir layout, no Python install required
- Identical binary for all 12 machines — only `config.json` differs

### Deployment Packages (`machine-watcher/deploy/machine-001/`)
- `launcher/launcher.exe` — double-click to start everything
- `watcher/watcher.exe` — reads `../config.json`, writes `../watcher.log`, `../watcher_state.json`
- `serve/serve.exe` — self-contained, `dist/` bundled inside `_internal/`
- `config.json` — `data_dir`, `tdms_subfolder`, `api_key`, `machine_id`, `backend_url`

---

## Test Fixes — 435/435 Passing

| Test file | What changed |
|---|---|
| `liveTicketsService.test.ts` | Rewritten: mocks `apiClient`, tests real API behaviour |
| `MachinesPage.test.tsx` | Rewritten: mocks `apiClient` directly, removed `liveMetricsService` mock |
| `DashboardPage.test.tsx` | Rewritten: mocks `apiClient` with correct call order for real DashboardPage |
| `ProductionPage.test.tsx` | Rewritten: mocks `apiClient` + `useProductionSocket`, tests real page shape |
| `dark-mode.test.tsx` | Replaced `liveMetricsService` mock with `apiClient` mock; updated probes |
| `authService.test.ts` | `restoreSession` tests now seed `sessionStorage` before calling |
| `dailyLogService.test.ts` | Added `updated_by` to expected POST body (service sends full input) |
| `vite.config.ts` | Added `exclude: ['e2e/**']` so Playwright specs are not run by Vitest |

---

## Session: Live Machine Status + Running/Completed Sessions

---

## Heartbeat Fix — `last_heartbeat_at` Column

### Problem
- Stale heartbeat job was checking `last_updated` (changes on any DB write) instead of a
  dedicated heartbeat timestamp — machines never went offline even when watcher crashed
- Job also checked `last_heartbeat_at IS NULL` which wrongly marked all seeded machines
  `offline` on every backend restart before any watcher connected

### Fix
- Added `last_heartbeat_at DateTime?` column to `machines` table via raw SQL + `prisma db pull`
- Heartbeat route (`PATCH /machines/:id/heartbeat`) now stamps `last_heartbeat_at` on every ping
- Watcher now sends heartbeat **every poll cycle** (not just on status change) so server can
  detect network loss accurately
- Stale job now only marks machines `offline` if `last_heartbeat_at IS NOT NULL AND < cutoff` —
  machines that never had a watcher keep their seeded/manual status

---

## Two-Phase Lot Posting — Running → Completed

### Problem
- Watcher always posted lots as `status="completed"` — Running tab in ProductionPage was always empty
- No live visibility into which machines were actively sorting

### Fix — Watcher (`machine-watcher/watcher.py`)
- `watcher_state.json` now tracks two separate lists:
  - `running_lots` — posted as `"running"` on first sight; awaiting `lot_stop`
  - `completed_lots` — re-posted as `"completed"` once `lot_stop` appears; never re-posted again
- Migrates old `posted_lots` key → `completed_lots` automatically on first run
- `post_session()` now accepts a `status` parameter (`"running"` or `"completed"`)

### Fix — Backend (`server/src/index.ts`)
- Added 10-minute session staleness job (runs every 60s):
  - Finds `production_sessions` with `status = "running"` and `updated_at < now - 10min`
  - Marks them `"completed"` and broadcasts `session:update` socket event
  - Safety net for lots where watcher never sees a clean `lot_stop`

### End-to-End Flow
```
Watcher sees new lot → POST status="running" → frontend Running tab
Watcher sees lot_stop → POST status="completed" → frontend Completed tab
If no update for 10 min → server job marks completed → socket broadcast
New lot starts → back to "running" immediately
```

---

## Dashboard Live Socket Status

### Problem
- Dashboard only polled every 30s — machine status tiles didn't update live when
  watcher sent a heartbeat

### Fix (`hortisort-monitor/src/pages/DashboardPage.tsx`)
- Added `useProductionSocket({ allMachines: true })` hook
- `lastStatusUpdate` socket events instantly update both `machineStatuses` state
  and the `machines` array — tiles reflect status change within milliseconds

---

## ProductionPage Fixes

### Last Stop + Elapsed Time
- `stopTime` now uses `stop_time` of the **latest lot** (by `start_time`) specifically
- `elapsedTime` now parsed from TDMS `elapsed_time` string (`"3 Hrs 55 Min 27.338 Sec"`)
  instead of computing from timestamps — gives sub-minute precision even when TDMS
  only records minute-precision for `lot_start`/`lot_stop`
- Added `parseTdmsElapsed()` helper; falls back to ISO timestamp diff if string absent

---

## Build Status
- `npm run build` — clean
- Backend: pm2 `hortisort-backend` stable, port 4000
- `watcher.exe` + `serve.exe` rebuilt in `deploy/machine-001/`

---

## Pending Tasks

| # | Task | Notes |
|---|---|---|
| 1 | **Deploy to machine PC** | Replace `watcher/` + `serve/` folders, restart `watcher.exe` |
| 2 | **Cloudflare Tunnel** | Cross-network access — currently same WiFi only |
| 3 | **"Tons processed" column** | Need to identify TDMS channel name for weight data |
| 4 | **Merge dark theme branch** | `feature/dark-theme-phase-b-chunk4` → `main` |

---

## Current Deploy Setup
- Server laptop WiFi IP: `192.168.1.117`
- Backend URL in deploy packages: `http://192.168.1.117:4000`
- Switch to Cloudflare Tunnel URL when cross-network deployment is needed

## Cloudflare Tunnel Setup (when needed)
1. Install: `winget install Cloudflare.cloudflared`
2. Authenticate: `cloudflared tunnel login`
3. Start: `cloudflared tunnel --url http://localhost:4000 run hortisort`
4. Get permanent public URL e.g. `https://hortisort.abc123.cfargotunnel.com`
5. Update `backend_url` in all deploy `config.json` files
6. Rebuild `launcher.exe` + `serve.exe` and redeploy
