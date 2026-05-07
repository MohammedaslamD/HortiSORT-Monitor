"""
HortiSort Machine Watcher
=========================
Watches a data directory for TDMS files matching real HortiSort machine output:
  - DebugCountersLog*.tdms   → production lots → POST /api/v1/production-sessions
  - ErrorLog*.tdms           → machine errors  → POST /api/v1/machine-errors

Polls every POLL_INTERVAL seconds. Tracks already-posted lots/errors to avoid
duplicates using a local state file (watcher_state.json).

Usage:
  python watcher.py [config.json]

Build to .exe:
  bash build.sh
"""

import json
import os
import sys
import time
import glob
import logging
from datetime import datetime, timezone, timedelta

# HortiSort machines log timestamps in IST (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
# Logging — console + rotating file (watcher.log next to the exe)
# ---------------------------------------------------------------------------
def _setup_logging() -> None:
    if getattr(sys, "frozen", False):
        log_dir = os.path.dirname(os.path.dirname(sys.executable))  # onedir: go up to root
    else:
        log_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(log_dir, "watcher.log")
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setFormatter(fmt)
    sh = logging.StreamHandler()
    sh.setFormatter(fmt)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(fh)
    root.addHandler(sh)

_setup_logging()
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config defaults
# ---------------------------------------------------------------------------
DEFAULT_CONFIG: dict[str, Any] = {
    "backend_url": "http://localhost:4000",
    "api_key": "",
    "machine_id": None,   # required for heartbeat; must match the machine's DB id
    "data_dir": r"C:\DataLogs",
    "poll_interval": 15,
    "state_file": "watcher_state.json",
    # Subfolder inside each date folder that contains the actual TDMS files.
    # HortiSORT machines use "Hortisort"; override per machine if needed.
    "tdms_subfolder": "Hortisort",
    # Seconds of TDMS file inactivity before status transitions:
    #   < running_threshold  → running
    #   < idle_threshold     → idle
    #   >= idle_threshold    → offline
    "running_threshold": 300,   # 5 minutes
    "idle_threshold": 1800,     # 30 minutes
}


def load_config(path: str = "config.json") -> dict[str, Any]:
    """Load configuration from JSON file, falling back to defaults."""
    config = dict(DEFAULT_CONFIG)
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            overrides = json.load(f)
        config.update(overrides)
    return config


# ---------------------------------------------------------------------------
# State tracking (avoid re-posting already sent lots/errors)
# ---------------------------------------------------------------------------

def load_state(path: str) -> dict[str, Any]:
    if os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"posted_lots": [], "posted_error_keys": []}


def save_state(path: str, state: dict[str, Any]) -> None:
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
    except Exception as exc:
        log.error("Failed to save state: %s", exc)


# ---------------------------------------------------------------------------
# TDMS helpers
# ---------------------------------------------------------------------------

def safe(val: Any) -> str:
    return str(val).strip() if val is not None else ""


def read_channel(group: Any, name: str) -> list[str]:
    try:
        return [safe(v) for v in group[name][:]]
    except Exception:
        return []


def find_latest_file(data_dir: str, pattern: str) -> str | None:
    """Return path of the most-recently modified file matching glob pattern."""
    matches = glob.glob(os.path.join(data_dir, pattern))
    if not matches:
        return None
    return max(matches, key=os.path.getmtime)


def resolve_data_dir(base_dir: str, tdms_subfolder: str = "Hortisort") -> str:
    """
    Resolve the actual TDMS data directory for today (IST).

    HortiSORT creates date-based subfolders each day, e.g.:
      <base>/2026/May-2026/07-May-2026/Hortisort/

    The TDMS files live inside a named subfolder (default: "Hortisort")
    inside each date folder.  This is configurable via "tdms_subfolder"
    in config.json so any machine can override it without code changes.

    Resolution order:
      1. base_dir itself has *.tdms files → use as-is (static/legacy config)
      2. Today's date folder + subfolder exists → use it
      3. Today's date folder exists but no subfolder → use date folder directly
      4. Yesterday's date folder + subfolder → fallback (early-morning startup)
      5. Walk base_dir (max 4 levels) → most recently modified dir with *.tdms
      6. base_dir itself → last resort
    """
    today_ist = datetime.now(IST)

    def date_subpath(dt: datetime) -> str:
        year      = dt.strftime("%Y")       # "2026"
        month_dir = dt.strftime("%b-%Y")    # "May-2026"
        day_dir   = dt.strftime("%d-%b-%Y") # "07-May-2026"
        return os.path.join(base_dir, year, month_dir, day_dir)

    def with_subfolder(date_path: str) -> str:
        """Return date_path/tdms_subfolder if it exists, else date_path itself."""
        if tdms_subfolder:
            sub = os.path.join(date_path, tdms_subfolder)
            if os.path.isdir(sub):
                return sub
        return date_path

    # 1. base_dir already has TDMS files → static config pointing directly at files
    if glob.glob(os.path.join(base_dir, "*.tdms")):
        return base_dir

    # 2 & 3. Today's date folder
    today_path = date_subpath(today_ist)
    if os.path.isdir(today_path):
        return with_subfolder(today_path)

    # 4. Yesterday's date folder (handles early-morning before today's folder exists)
    yesterday_path = date_subpath(today_ist - timedelta(days=1))
    if os.path.isdir(yesterday_path):
        resolved = with_subfolder(yesterday_path)
        log.info("Today's folder not found — using yesterday: %s", resolved)
        return resolved

    # 5. Walk base_dir up to 4 levels deep → most recently modified dir with *.tdms
    best_dir: str | None = None
    best_mtime: float = 0.0
    for root, dirs, files in os.walk(base_dir):
        depth = root.replace(base_dir, "").count(os.sep)
        if depth > 4:
            dirs.clear()
            continue
        tdms_files = [f for f in files if f.lower().endswith(".tdms")]
        if tdms_files:
            mtime = max(os.path.getmtime(os.path.join(root, f)) for f in tdms_files)
            if mtime > best_mtime:
                best_mtime = mtime
                best_dir = root

    if best_dir:
        log.info("Auto-detected data dir: %s", best_dir)
        return best_dir

    # 6. Nothing found — return base_dir and let the caller handle the empty case
    log.warning("No TDMS files found under %s — returning base dir", base_dir)
    return base_dir


# ---------------------------------------------------------------------------
# Parse DebugCountersLog TDMS → list of lot dicts
# ---------------------------------------------------------------------------

def parse_debug_lots(filepath: str) -> list[dict[str, Any]]:
    """
    Parse a DebugCountersLog TDMS file.
    Returns a list of lot summary dicts keyed by lot_number.
    """
    try:
        from nptdms import TdmsFile  # type: ignore[import]
    except ImportError:
        log.warning("nptdms not installed — cannot read TDMS files")
        return []

    lots: dict[str, dict[str, Any]] = {}

    try:
        tdms = TdmsFile.read(filepath)

        # ── Machine Detail → lot start/stop times, system info ──────────────
        try:
            md = tdms["Machine Detail"]
            lot_nums   = read_channel(md, "Lot Number")
            sys_names  = read_channel(md, "SystemName")
            sys_ids    = read_channel(md, "SystemID")
            starts     = read_channel(md, "Lot Start Date Time")
            stops      = read_channel(md, "Lot Stop Date Time")
            sw_revs    = read_channel(md, "Software Revison No.")

            for i, lot in enumerate(lot_nums):
                if not lot or lot.strip() in ("", " "):
                    continue
                if lot not in lots:
                    lots[lot] = {
                        "lot_number": lot,
                        "system_name": sys_names[i] if i < len(sys_names) else "",
                        "system_id": sys_ids[i] if i < len(sys_ids) else "",
                        "lot_start": starts[i] if i < len(starts) else "",
                        "lot_stop": stops[i] if i < len(stops) else "",
                        "software_version": sw_revs[i] if i < len(sw_revs) else "",
                        "fruit_type": None,
                        "quantity_kg": None,
                        "status": "completed",
                    }
        except Exception as exc:
            log.debug("Machine Detail parse warn: %s", exc)

        # ── DU → UI Result Update Count (quantity) + Weighing Result Count ────
        # The LotNumber column in DU only has a value on the first row of each
        # lot block; subsequent rows are blank. We forward-fill the lot number
        # so every row inside the block is attributed to the correct lot.
        try:
            du = tdms["DU"]
            du_categories = read_channel(du, "Category")
            du_totals     = read_channel(du, "Total")
            du_lot_nums   = read_channel(du, "LotNumber")

            current_lot = ""
            for i, raw_lot in enumerate(du_lot_nums):
                if raw_lot and raw_lot.strip() not in ("", " "):
                    current_lot = raw_lot.strip()
                if not current_lot:
                    continue
                cat = du_categories[i] if i < len(du_categories) else ""
                if current_lot not in lots:
                    continue
                try:
                    val = float(du_totals[i]) if i < len(du_totals) else None
                except (ValueError, TypeError):
                    val = None
                if val is None:
                    continue

                if cat == "UI Result Update Count":
                    # Keep the highest value seen (cumulative total in the file)
                    prev = lots[current_lot].get("quantity_kg")
                    if prev is None or val > prev:
                        lots[current_lot]["quantity_kg"] = val

                elif cat == "Weighing Result Count":
                    # Keep the highest value seen
                    prev = lots[current_lot].get("weighed_count")
                    if prev is None or val > prev:
                        lots[current_lot]["weighed_count"] = val

        except Exception as exc:
            log.debug("DU parse warn: %s", exc)

        # ── System Timings → app_start_time, program_start_time, elapsed_time, pc_boot_time
        try:
            st = tdms["System Timings"]
            st_lot_nums  = read_channel(st, "LotNumber")
            st_app_start = read_channel(st, "Application Start Time")
            st_prog_start= read_channel(st, "Program Start Time")
            st_elapsed   = read_channel(st, "Elapsed Time")
            st_pc_boot   = read_channel(st, "PC Boot Time")

            current_lot = ""
            for i, raw_lot in enumerate(st_lot_nums):
                if raw_lot and raw_lot.strip() not in ("", " "):
                    current_lot = raw_lot.strip()
                if not current_lot or current_lot not in lots:
                    continue
                # Only set once per lot (first row = the start of the lot)
                if "app_start_time" not in lots[current_lot]:
                    lots[current_lot]["app_start_time"]   = st_app_start[i]  if i < len(st_app_start)  else ""
                    lots[current_lot]["program_start_time"]= st_prog_start[i] if i < len(st_prog_start) else ""
                    lots[current_lot]["elapsed_time"]     = st_elapsed[i]    if i < len(st_elapsed)    else ""
                    lots[current_lot]["pc_boot_time"]     = st_pc_boot[i]    if i < len(st_pc_boot)    else ""
        except Exception as exc:
            log.debug("System Timings parse warn: %s", exc)

    except Exception as exc:
        log.error("Error reading debug TDMS %s: %s", filepath, exc)

    return list(lots.values())


# ---------------------------------------------------------------------------
# Parse ErrorLog TDMS → list of error dicts
# ---------------------------------------------------------------------------

def parse_datetime_to_iso(dt_str: str) -> str:
    """Convert various datetime string formats to ISO 8601 with timezone."""
    if not dt_str or not dt_str.strip():
        return datetime.now(IST).isoformat()
    dt_str = dt_str.strip()
    # Try common formats from TDMS files (old and new HortiSort variants)
    for fmt in (
        "%m/%d/%Y : %I:%M %p",    # new: "3/23/2026 : 8:38 AM"
        "%m/%d/%Y : %I:%M:%S %p", # new: "3/23/2026 : 8:38:10 AM"
        "%d-%m-%Y : %H:%M:%S",    # old with seconds: "06-05-2026 : 12:50:41"
        "%d-%m-%Y : %H:%M",       # old without seconds: "06-05-2026 : 12:50"
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
    ):
        try:
            parsed = datetime.strptime(dt_str, fmt)
            # TDMS files store local IST times — tag as IST so UTC conversion is correct
            return parsed.replace(tzinfo=IST).isoformat()
        except ValueError:
            continue
    # Already ISO-like — return as-is with Z if no tz
    if "T" in dt_str and (dt_str.endswith("Z") or "+" in dt_str):
        return dt_str
    return datetime.now(IST).isoformat()


def parse_error_log(filepath: str) -> list[dict[str, Any]]:
    """
    Parse an ErrorLog TDMS file.
    Returns a list of error dicts.
    """
    try:
        from nptdms import TdmsFile  # type: ignore[import]
    except ImportError:
        return []

    errors: list[dict[str, Any]] = []

    try:
        tdms = TdmsFile.read(filepath)
        for group in tdms.groups():
            channels = {ch.name: [safe(v) for v in ch[:]] for ch in group.channels()}
            if not channels:
                continue
            length = max(len(v) for v in channels.values())
            for i in range(length):
                row = {name: (vals[i] if i < len(vals) else "") for name, vals in channels.items()}
                dt  = row.get("Date/Time", "").strip()
                src = row.get("Error Source", "").strip()
                ec  = row.get("Error Code", "").strip()
                if not dt and not src:
                    continue
                errors.append({
                    "occurred_at": parse_datetime_to_iso(dt),
                    "error_code": ec or "UNKNOWN",
                    "message": src[:300] if src else row.get("Additional Info", "")[:300],
                    "raw_line": json.dumps(row)[:500],
                })
    except Exception as exc:
        log.error("Error reading error TDMS %s: %s", filepath, exc)

    return errors


# ---------------------------------------------------------------------------
# API posting
# ---------------------------------------------------------------------------

def post_session(config: dict[str, Any], lot: dict[str, Any], status: str = "completed") -> bool:
    """POST/upsert a production lot to the backend with the given status.

    status="running"   → first-seen post; stop_time and final qty may be absent
    status="completed" → re-post once lot_stop appears in TDMS
    Returns True on success.
    """
    url = f"{config['backend_url'].rstrip('/')}/api/v1/production-sessions"

    # Parse lot_start as session_date
    session_date = datetime.now().strftime("%Y-%m-%d")
    if lot.get("lot_start"):
        try:
            iso = parse_datetime_to_iso(lot["lot_start"])
            session_date = iso[:10]  # take YYYY-MM-DD prefix
        except Exception:
            pass

    lot_num = str(lot["lot_number"]).strip()
    if not lot_num or lot_num in ("0", ""):
        log.debug("Skipping lot with lot_number=%s", lot["lot_number"])
        return False

    start_iso = parse_datetime_to_iso(lot.get("lot_start", ""))
    stop_iso  = parse_datetime_to_iso(lot.get("lot_stop", "")) if lot.get("lot_stop") else None

    payload = {
        "lot_number": lot_num,
        "session_date": session_date,
        "start_time": start_iso,
        "stop_time": stop_iso,
        "fruit_type": lot.get("fruit_type"),
        "quantity_kg": lot.get("quantity_kg"),
        "status": status,
        "raw_tdms_rows": lot,
    }

    try:
        resp = requests.post(
            url,
            json=payload,
            headers={"X-Machine-Key": config["api_key"]},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            log.info("Posted lot %s [%s] → %d", lot["lot_number"], status, resp.status_code)
            return True
        log.warning("POST session returned %d: %s", resp.status_code, resp.text[:200])
        return False
    except requests.RequestException as exc:
        log.error("Network error posting session: %s", exc)
        return False


def post_error(config: dict[str, Any], error: dict[str, Any]) -> bool:
    """POST a single machine error to the backend. Returns True on success."""
    url = f"{config['backend_url'].rstrip('/')}/api/v1/machine-errors"
    try:
        resp = requests.post(
            url,
            json=error,
            headers={"X-Machine-Key": config["api_key"]},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return True
        log.warning("POST error returned %d: %s", resp.status_code, resp.text[:200])
        return False
    except requests.RequestException as exc:
        log.error("Network error posting error: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Machine status heartbeat
# ---------------------------------------------------------------------------

def detect_machine_status(data_dir: str, debug_file: str | None, config: dict[str, Any]) -> str:
    """
    Derive machine status from the age of the latest TDMS debug file.

    Returns one of: "running", "idle"
    ("offline" is only set by post_heartbeat when the backend is unreachable)

    < running_threshold  → running
    >= running_threshold → idle
    """
    if not debug_file or not os.path.exists(debug_file):
        return "idle"
    try:
        age_secs = time.time() - os.path.getmtime(debug_file)
    except OSError:
        return "idle"
    running_threshold: int = config.get("running_threshold", 300)
    if age_secs < running_threshold:
        return "running"
    return "idle"


def post_heartbeat(config: dict[str, Any], status: str) -> bool:
    """
    PATCH /api/v1/machines/:id/heartbeat with the new status.
    Returns True on success.
    If the backend is unreachable, PATCHes "offline" to signal connectivity loss.
    """
    machine_id = config.get("machine_id")
    if not machine_id:
        log.debug("machine_id not set in config — skipping heartbeat")
        return False
    url = f"{config['backend_url'].rstrip('/')}/api/v1/machines/{machine_id}/heartbeat"
    try:
        resp = requests.patch(
            url,
            json={"status": status},
            headers={"X-Machine-Key": config["api_key"]},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            log.info("Heartbeat sent → status=%s", status)
            return True
        log.warning("Heartbeat PATCH returned %d: %s", resp.status_code, resp.text[:200])
        return False
    except requests.RequestException as exc:
        # Can't reach backend → machine should show as offline
        log.error("Backend unreachable — marking offline: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run(config: dict[str, Any]) -> None:
    """Main polling loop — runs forever until interrupted."""
    base_data_dir = config["data_dir"]
    if getattr(sys, "frozen", False):
        # onedir layout: watcher.exe lives in <root>/watcher/ → go up one level
        _base = os.path.dirname(os.path.dirname(sys.executable))
    else:
        _base = os.path.dirname(os.path.abspath(__file__))
    state_path = os.path.join(_base, config.get("state_file", "watcher_state.json"))

    log.info("HortiSort Watcher started")
    log.info("  Base data dir : %s", base_data_dir)
    log.info("  Backend       : %s", config["backend_url"])
    log.info("  Poll every    : %ds", config["poll_interval"])
    log.info("  Machine ID    : %s", config.get("machine_id", "not set"))

    if not os.path.isdir(base_data_dir):
        log.error("Base data directory not found: %s", base_data_dir)

    last_status: str | None = None   # track last reported status
    last_data_dir: str | None = None

    while True:
        # ── Resolve today's actual data folder (updates at day rollover) ───────
        data_dir = resolve_data_dir(base_data_dir, config.get("tdms_subfolder", "Hortisort"))
        if data_dir != last_data_dir:
            log.info("Data dir resolved to: %s", data_dir)
            last_data_dir = data_dir

        state = load_state(state_path)
        # running_lots  — posted as "running"; awaiting final stop_time
        # completed_lots — fully posted; never re-post
        running_lots: list[str]   = state.get("running_lots", [])
        completed_lots: list[str] = state.get("completed_lots",
                                               state.get("posted_lots", []))  # migrate old key
        posted_error_keys: list[str] = state.get("posted_error_keys", [])
        changed = False

        # ── Production sessions ─────────────────────────────────────────────
        debug_file = find_latest_file(data_dir, "DebugCountersLog*.tdms")
        if debug_file:
            log.debug("Reading debug file: %s", os.path.basename(debug_file))
            lots = parse_debug_lots(debug_file)
            for lot in lots:
                lot_key = str(lot["lot_number"])
                has_stop = bool(lot.get("lot_stop"))

                if lot_key in completed_lots:
                    # Already fully posted — skip
                    continue

                if lot_key not in running_lots:
                    # First time we see this lot → post as "running" immediately
                    if post_session(config, lot, status="running"):
                        running_lots.append(lot_key)
                        changed = True
                else:
                    # Already posted as running — re-post as completed once stop_time is known
                    if has_stop:
                        if post_session(config, lot, status="completed"):
                            completed_lots.append(lot_key)
                            running_lots = [k for k in running_lots if k != lot_key]
                            changed = True
        else:
            log.debug("No DebugCountersLog*.tdms found in %s", data_dir)

        # ── Machine errors ──────────────────────────────────────────────────
        error_file = find_latest_file(data_dir, "ErrorLog*.tdms")
        if error_file:
            log.debug("Reading error file: %s", os.path.basename(error_file))
            errors = parse_error_log(error_file)
            new_errors_this_poll = 0
            for err in errors:
                # Deduplicate by error_code + message — same code+message is the
                # same error regardless of how many times the machine logged it
                err_key = f"{err['error_code']}|{err['message']}"
                if err_key in posted_error_keys:
                    continue
                # Cap at 50 new errors per poll cycle to avoid flooding the backend
                if new_errors_this_poll >= 50:
                    log.debug("Error post cap (50/poll) reached, will continue next cycle")
                    break
                if post_error(config, err):
                    posted_error_keys.append(err_key)
                    changed = True
                    new_errors_this_poll += 1
                    time.sleep(0.05)  # 50 ms gap — prevents DB connection exhaustion
        else:
            log.debug("No ErrorLog*.tdms found in %s", data_dir)

        # ── Heartbeat / idle detection ──────────────────────────────────────
        # Watcher sends a heartbeat EVERY poll cycle so the server can detect
        # network loss. "offline" is only ever set server-side when heartbeats
        # stop arriving — the watcher never sends "offline" itself.
        current_status = detect_machine_status(data_dir, debug_file, config)
        if post_heartbeat(config, current_status):
            last_status = current_status

        # ── Persist state ───────────────────────────────────────────────────
        if changed:
            state["running_lots"]    = running_lots
            state["completed_lots"]  = completed_lots
            state["posted_error_keys"] = posted_error_keys
            save_state(state_path, state)

        time.sleep(config["poll_interval"])


if __name__ == "__main__":
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
    elif getattr(sys, "frozen", False):
        # onedir layout: watcher.exe is in <root>/watcher/ — config.json is at <root>/
        config_path = os.path.join(
            os.path.dirname(os.path.dirname(sys.executable)), "config.json"
        )
    else:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    cfg = load_config(config_path)
    try:
        run(cfg)
    except KeyboardInterrupt:
        log.info("Watcher stopped.")
