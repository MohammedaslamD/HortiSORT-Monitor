# HortiSort Machine Watcher

A lightweight Python watcher that monitors TDMS data log files on a machine PC and POSTs production lot data to the HortiSort backend in real time.

## How It Works

1. Every 15 seconds, the watcher reads today's TDMS file (e.g. `C:\DataLogs\2026-04-23.tdms`)
2. It detects production lots by grouping rows by `lot_number`
3. It POSTs each lot to `POST /api/v1/production-sessions` with an `X-Machine-Key` header
4. The backend stores the data and broadcasts live updates to all connected browsers via Socket.io

## Setup on Machine PC (Windows)

### Prerequisites

- Windows 10/11
- Network access to the HortiSort server

### Installation

1. Copy `hortisort-watcher.exe` and `config.json` to a folder, e.g. `C:\HortiSort\`

2. Edit `config.json`:

```json
{
  "backend_url": "http://192.168.1.100:3001",
  "api_key": "hs-key-machine-001-dev",
  "data_dir": "C:\\DataLogs",
  "poll_interval": 15
}
```

3. Get the `api_key` from your HortiSort admin — each machine has a unique key.

### Running Manually

Double-click `hortisort-watcher.exe`, or run from command prompt:

```cmd
hortisort-watcher.exe config.json
```

### Auto-Start with Task Scheduler

1. Open Task Scheduler → Create Basic Task
2. Name: `HortiSort Watcher`
3. Trigger: At system startup
4. Action: Start a program → `C:\HortiSort\hortisort-watcher.exe`
5. Arguments: `C:\HortiSort\config.json`
6. Start in: `C:\HortiSort\`
7. Check "Run whether user is logged on or not"

## Building the .exe (for developers)

```bash
cd machine-watcher
pip install -r requirements.txt
bash build.sh
# Output: dist/hortisort-watcher.exe
```

## Running Tests

```bash
cd machine-watcher
python -m pytest tests/ -v
```

## TDMS File Format

The watcher expects each row in the TDMS file to have these channel properties:

| Property     | Type   | Required | Description                          |
|--------------|--------|----------|--------------------------------------|
| `LotNumber`  | int    | Yes      | Production lot number (1, 2, 3, ...) |
| `Status`     | string | Yes      | `running`, `completed`, or `error`   |
| `StartTime`  | string | Yes      | ISO 8601 timestamp                   |
| `StopTime`   | string | No       | ISO 8601 timestamp (if completed)    |
| `FruitType`  | string | No       | e.g. `Mango`, `Grapes`               |
| `QuantityKg` | float  | No       | Quantity processed in kg             |

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `Backend unreachable` | Check `backend_url` in config and network connectivity |
| `Invalid machine API key` | Get the correct key from HortiSort admin |
| `No TDMS file for today` | Verify `data_dir` path and that the sorting software is writing files |
| `nptdms not installed` | Run `pip install nptdms` or use the pre-built `.exe` |
