"""
generate_configs.py
-------------------
Run once on the deployment machine to produce one config.json per machine PC.

Edit BACKEND_URL to the server's LAN IP before running.

Usage:
    python generate_configs.py
"""

import json
import os

# ── Edit this before running on site ──────────────────────────────────────────
BACKEND_URL = "http://192.168.1.100:4000"   # LAN IP of the server PC
DATA_DIR    = "C:\\HortiSort\\Datalogs"     # Path on each machine PC where TDMS files live
POLL_INTERVAL = 15                          # seconds between watcher polls
# ──────────────────────────────────────────────────────────────────────────────

MACHINES = [
    {"machine_id": 1,  "api_key": "hs-key-machine-001-dev", "machine_code": "HS-2024-0001"},
    {"machine_id": 2,  "api_key": "hs-key-machine-002-dev", "machine_code": "HS-2024-0002"},
    {"machine_id": 3,  "api_key": "hs-key-machine-003-dev", "machine_code": "HS-2024-0003"},
    {"machine_id": 4,  "api_key": "hs-key-machine-004-dev", "machine_code": "HS-2024-0004"},
    {"machine_id": 5,  "api_key": "hs-key-machine-005-dev", "machine_code": "HS-2024-0005"},
    {"machine_id": 6,  "api_key": "hs-key-machine-006-dev", "machine_code": "HS-2025-0006"},
    {"machine_id": 7,  "api_key": "hs-key-machine-007-dev", "machine_code": "HS-2025-0007"},
    {"machine_id": 8,  "api_key": "hs-key-machine-008-dev", "machine_code": "HS-2025-0008"},
    {"machine_id": 9,  "api_key": "hs-key-machine-009-dev", "machine_code": "HS-2025-0009"},
    {"machine_id": 10, "api_key": "hs-key-machine-010-dev", "machine_code": "HS-2025-0010"},
    {"machine_id": 11, "api_key": "hs-key-machine-011-dev", "machine_code": "HS-2025-0011"},
    {"machine_id": 12, "api_key": "hs-key-machine-012-dev", "machine_code": "HS-2025-0012"},
]

out_dir = os.path.join(os.path.dirname(__file__), "configs")
os.makedirs(out_dir, exist_ok=True)

for m in MACHINES:
    cfg = {
        "backend_url":    BACKEND_URL,
        "api_key":        m["api_key"],
        "machine_id":     m["machine_id"],
        "data_dir":       DATA_DIR,
        "poll_interval":  POLL_INTERVAL,
    }
    filename = f"config_machine_{m['machine_id']:02d}_{m['machine_code']}.json"
    path = os.path.join(out_dir, filename)
    with open(path, "w") as f:
        json.dump(cfg, f, indent=2)
    print(f"  wrote {filename}")

print(f"\nDone — {len(MACHINES)} config files in {out_dir}")
print("\nDeployment steps per machine PC:")
print("  1. Copy watcher.exe + the matching config_machine_NN_*.json to C:\\HortiSort\\watcher\\")
print("  2. Rename the config file to config.json")
print("  3. Edit config.json: set backend_url to server LAN IP, data_dir to TDMS folder path")
print("  4. Run watcher.exe (or set up as a Windows scheduled task / service)")
