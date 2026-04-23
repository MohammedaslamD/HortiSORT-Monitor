"""
HortiSort Machine Watcher
=========================
Reads today's TDMS data log file every POLL_INTERVAL seconds,
detects production lots, and POSTs them to the HortiSort backend.

Usage:
  python watcher.py [config.json]

Build to .exe:
  bash build.sh
"""

import json
import os
import sys
import time
import logging
from datetime import datetime, timezone
from typing import Any
from collections import defaultdict

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
    "backend_url": "http://localhost:3001",
    "api_key": "",
    "data_dir": r"C:\DataLogs",
    "poll_interval": 15,
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
# TDMS reading
# ---------------------------------------------------------------------------

def read_tdms_rows(filepath: str) -> list[dict[str, Any]]:
    """
    Read rows from a TDMS file and return a list of row dicts.
    Each row must contain at minimum: lot_number, status, start_time.

    Falls back gracefully if nptdms is not installed (returns empty list).
    """
    try:
        from nptdms import TdmsFile  # type: ignore[import]
    except ImportError:
        log.warning("nptdms not installed — cannot read TDMS files")
        return []

    rows: list[dict[str, Any]] = []
    try:
        with TdmsFile.open(filepath) as tdms:
            for group in tdms.groups():
                for channel in group.channels():
                    # Each channel is treated as a row source; adapt to actual TDMS layout
                    props = channel.properties
                    rows.append({
                        "lot_number": int(props.get("LotNumber", 0)),
                        "status": str(props.get("Status", "running")),
                        "start_time": str(props.get("StartTime", datetime.now(timezone.utc).isoformat())),
                        "stop_time": props.get("StopTime"),
                        "fruit_type": props.get("FruitType"),
                        "quantity_kg": float(props.get("QuantityKg", 0.0)),
                    })
    except Exception as exc:  # noqa: BLE001
        log.error("Error reading TDMS file %s: %s", filepath, exc)
    return rows


# ---------------------------------------------------------------------------
# Lot detection
# ---------------------------------------------------------------------------

def detect_lots(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Group raw TDMS rows by lot_number and produce one summary dict per lot.

    Each summary contains:
      lot_number, status, start_time (earliest), stop_time (latest),
      fruit_type, quantity_kg (sum).
    """
    if not rows:
        return []

    groups: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        groups[int(row["lot_number"])].append(row)

    result: list[dict[str, Any]] = []
    for lot_number, lot_rows in sorted(groups.items()):
        start_times = [r["start_time"] for r in lot_rows if r.get("start_time")]
        stop_times = [r["stop_time"] for r in lot_rows if r.get("stop_time")]
        quantities = [float(r["quantity_kg"]) for r in lot_rows if r.get("quantity_kg") is not None]

        # Status: if any row is still "running", the lot is running
        statuses = [r.get("status", "running") for r in lot_rows]
        status = "running" if "running" in statuses else (statuses[-1] if statuses else "running")

        result.append({
            "lot_number": lot_number,
            "status": status,
            "start_time": min(start_times) if start_times else datetime.now(timezone.utc).isoformat(),
            "stop_time": max(stop_times) if stop_times else None,
            "fruit_type": lot_rows[-1].get("fruit_type"),
            "quantity_kg": sum(quantities) if quantities else None,
        })
    return result


# ---------------------------------------------------------------------------
# API posting
# ---------------------------------------------------------------------------

def post_session(config: dict[str, Any], session_date: str, lot: dict[str, Any]) -> bool:
    """POST a single production lot to the backend. Returns True on success."""
    url = f"{config['backend_url'].rstrip('/')}/api/v1/production-sessions"
    payload = {
        "lot_number": lot["lot_number"],
        "session_date": session_date,
        "start_time": lot["start_time"],
        "stop_time": lot.get("stop_time"),
        "fruit_type": lot.get("fruit_type"),
        "quantity_kg": lot.get("quantity_kg"),
        "status": lot.get("status", "running"),
    }
    try:
        resp = requests.post(
            url,
            json=payload,
            headers={"X-Machine-Key": config["api_key"]},
            timeout=10,
        )
        if resp.status_code in (200, 201):
            return True
        log.warning("POST %s returned %d: %s", url, resp.status_code, resp.text[:200])
        return False
    except requests.RequestException as exc:
        log.error("Network error posting session: %s", exc)
        return False


def post_errors(config: dict[str, Any], errors: list[dict[str, Any]]) -> None:
    """POST machine errors to the backend."""
    url = f"{config['backend_url'].rstrip('/')}/api/v1/machine-errors"
    for err in errors:
        try:
            resp = requests.post(
                url,
                json=err,
                headers={"X-Machine-Key": config["api_key"]},
                timeout=10,
            )
            if resp.status_code not in (200, 201):
                log.warning("POST errors %s returned %d", url, resp.status_code)
        except requests.RequestException as exc:
            log.error("Network error posting error: %s", exc)


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def run(config: dict[str, Any]) -> None:
    """Main polling loop — runs forever until interrupted."""
    log.info("HortiSort Watcher started. Polling every %ds", config["poll_interval"])
    while True:
        today = datetime.now().strftime("%Y-%m-%d")
        tdms_path = os.path.join(config["data_dir"], f"{today}.tdms")

        if os.path.exists(tdms_path):
            rows = read_tdms_rows(tdms_path)
            lots = detect_lots(rows)
            for lot in lots:
                post_session(config, today, lot)
        else:
            log.debug("No TDMS file for today: %s", tdms_path)

        time.sleep(config["poll_interval"])


if __name__ == "__main__":
    config_path = sys.argv[1] if len(sys.argv) > 1 else "config.json"
    cfg = load_config(config_path)
    try:
        run(cfg)
    except KeyboardInterrupt:
        log.info("Watcher stopped.")
