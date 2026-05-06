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
from datetime import datetime, timezone
from typing import Any

import requests

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()],
)
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
        return datetime.now(timezone.utc).isoformat()
    dt_str = dt_str.strip()
    # Try common formats from TDMS files (old and new HortiSort variants)
    for fmt in (
        "%m/%d/%Y : %I:%M %p",    # new: "3/23/2026 : 8:38 AM"
        "%m/%d/%Y : %I:%M:%S %p", # new: "3/23/2026 : 8:38:10 AM"
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y : %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%m/%d/%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
    ):
        try:
            parsed = datetime.strptime(dt_str, fmt)
            return parsed.replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            continue
    # Already ISO-like — return as-is with Z if no tz
    if "T" in dt_str and (dt_str.endswith("Z") or "+" in dt_str):
        return dt_str
    return datetime.now(timezone.utc).isoformat()


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

def post_session(config: dict[str, Any], lot: dict[str, Any]) -> bool:
    """POST a production lot to the backend. Returns True on success."""
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
        "status": lot.get("status", "completed"),
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
            log.info("Posted lot %s → %d", lot["lot_number"], resp.status_code)
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

    Returns one of: "running", "idle", "offline"
    """
    if not debug_file or not os.path.exists(debug_file):
        return "offline"
    try:
        age_secs = time.time() - os.path.getmtime(debug_file)
    except OSError:
        return "offline"
    running_threshold: int = config.get("running_threshold", 300)
    idle_threshold: int    = config.get("idle_threshold", 1800)
    if age_secs < running_threshold:
        return "running"
    if age_secs < idle_threshold:
        return "idle"
    return "offline"


def post_heartbeat(config: dict[str, Any], status: str) -> bool:
    """
    PATCH /api/v1/machines/:id/heartbeat with the new status.
    Returns True on success.
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
        log.error("Network error sending heartbeat: %s", exc)
        return False


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run(config: dict[str, Any]) -> None:
    """Main polling loop — runs forever until interrupted."""
    data_dir   = config["data_dir"]
    state_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), config.get("state_file", "watcher_state.json"))

    log.info("HortiSort Watcher started")
    log.info("  Data dir   : %s", data_dir)
    log.info("  Backend    : %s", config["backend_url"])
    log.info("  Poll every : %ds", config["poll_interval"])
    log.info("  Machine ID : %s", config.get("machine_id", "not set"))

    if not os.path.isdir(data_dir):
        log.error("Data directory not found: %s", data_dir)

    last_status: str | None = None   # track last reported status to avoid redundant PATCHes

    while True:
        state = load_state(state_path)
        posted_lots: list[str] = state.get("posted_lots", [])
        posted_error_keys: list[str] = state.get("posted_error_keys", [])
        changed = False

        # ── Production sessions ─────────────────────────────────────────────
        debug_file = find_latest_file(data_dir, "DebugCountersLog*.tdms")
        if debug_file:
            log.debug("Reading debug file: %s", os.path.basename(debug_file))
            lots = parse_debug_lots(debug_file)
            for lot in lots:
                lot_key = str(lot["lot_number"])
                if lot_key in posted_lots:
                    continue
                if post_session(config, lot):
                    posted_lots.append(lot_key)
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
        current_status = detect_machine_status(data_dir, debug_file, config)
        if current_status != last_status:
            if post_heartbeat(config, current_status):
                last_status = current_status

        # ── Persist state ───────────────────────────────────────────────────
        if changed:
            state["posted_lots"] = posted_lots
            state["posted_error_keys"] = posted_error_keys
            save_state(state_path, state)

        time.sleep(config["poll_interval"])


if __name__ == "__main__":
    config_path = sys.argv[1] if len(sys.argv) > 1 else "config.json"
    cfg = load_config(config_path)
    try:
        run(cfg)
    except KeyboardInterrupt:
        log.info("Watcher stopped.")
