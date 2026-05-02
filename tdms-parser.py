#!/usr/bin/env python3
"""
HortiSort TDMS Parser
Reads DebugCountersLog and ErrorLog TDMS files from the Raw Datalog folder
and writes a structured JSON to hortisort-monitor/public/datalog.json
"""

import json
import os
import sys
import glob
from datetime import datetime

try:
    from nptdms import TdmsFile
except ImportError:
    print("ERROR: nptdms not installed. Run: python -m pip install nptdms --break-system-packages")
    sys.exit(1)

DATALOG_FOLDER = r"D:\Hackathon web app\Raw Datalog\Hortisort"
OUTPUT_PATH = r"D:\Hackathon web app\hortisort-monitor\public\datalog.json"


def safe(val):
    """Strip and return string, or empty string."""
    return str(val).strip() if val is not None else ""


def read_channel(group, channel_name):
    try:
        return [safe(v) for v in group[channel_name][:]]
    except Exception:
        return []


def zip_rows(group):
    """Zip all channels in a group into a list of dicts keyed by channel name."""
    channels = {ch.name: [safe(v) for v in ch[:]] for ch in group.channels()}
    if not channels:
        return []
    length = max(len(v) for v in channels.values())
    rows = []
    for i in range(length):
        row = {}
        for name, vals in channels.items():
            row[name] = vals[i] if i < len(vals) else ""
        rows.append(row)
    return rows


def parse_debug(path):
    """Parse DebugCountersLog TDMS → list of lot objects."""
    tdms = TdmsFile.read(path)
    lots = {}

    # ── Machine Detail ─────────────────────────────────────────────────────
    try:
        md = tdms["Machine Detail"]
        lot_nums  = read_channel(md, "Lot Number")
        sys_names = read_channel(md, "SystemName")
        sys_ids   = read_channel(md, "SystemID")
        inst_dates= read_channel(md, "InstallationDate")
        starts    = read_channel(md, "Lot Start Date Time")
        stops     = read_channel(md, "Lot Stop Date Time")
        sw_revs   = read_channel(md, "Software Revison No.")

        for i, lot in enumerate(lot_nums):
            if not lot or lot in ("", " "):
                continue
            if lot not in lots:
                lots[lot] = {
                    "lot_number": lot,
                    "system_name": sys_names[i] if i < len(sys_names) else "",
                    "system_id": sys_ids[i] if i < len(sys_ids) else "",
                    "installation_date": inst_dates[i] if i < len(inst_dates) else "",
                    "lot_start": starts[i] if i < len(starts) else "",
                    "lot_stop": stops[i] if i < len(stops) else "",
                    "software_version": sw_revs[i] if i < len(sw_revs) else "",
                }
    except Exception as e:
        print(f"  WARN Machine Detail: {e}")

    # ── System Timings ─────────────────────────────────────────────────────
    try:
        st = tdms["System Timings"]
        lot_nums    = read_channel(st, "LotNumber")
        app_starts  = read_channel(st, "Application Start Time")
        prog_starts = read_channel(st, "Program Start Time")
        elapsed     = read_channel(st, "Elapsed Time")
        boot_times  = read_channel(st, "PC Boot Time")

        for i, lot in enumerate(lot_nums):
            if not lot or lot in ("", " "):
                continue
            if lot in lots:
                lots[lot]["app_start_time"]     = app_starts[i] if i < len(app_starts) else ""
                lots[lot]["program_start_time"] = prog_starts[i] if i < len(prog_starts) else ""
                lots[lot]["elapsed_time"]       = elapsed[i] if i < len(elapsed) else ""
                lots[lot]["pc_boot_time"]       = boot_times[i] if i < len(boot_times) else ""
    except Exception as e:
        print(f"  WARN System Timings: {e}")

    # ── SGR - Fruit counts ──────────────────────────────────────────────────
    try:
        sgr = tdms["SGR"]
        categories = read_channel(sgr, "Category")
        lane1      = read_channel(sgr, "Lane 1")
        totals     = read_channel(sgr, "Total")
        lot_nums   = read_channel(sgr, "LotNumber")

        for i, lot in enumerate(lot_nums):
            if not lot or lot in ("", " "):
                continue
            if lot in lots:
                if "sgr" not in lots[lot]:
                    lots[lot]["sgr"] = {}
                cat = categories[i] if i < len(categories) else ""
                if cat and cat != " ":
                    lots[lot]["sgr"][cat] = {
                        "lane1": lane1[i] if i < len(lane1) else "0",
                        "total": totals[i] if i < len(totals) else "0",
                    }
    except Exception as e:
        print(f"  WARN SGR: {e}")

    # ── Inspection Results (Inspected Fruits) ───────────────────────────────
    try:
        ir = tdms["Inspection Results (Inspected Fruits)"]
        categories = read_channel(ir, "Category")
        lane1      = read_channel(ir, "Lane 1")
        totals     = read_channel(ir, "Total")
        lot_nums   = read_channel(ir, "LotNumber")

        for i, lot in enumerate(lot_nums):
            if not lot or lot in ("", " "):
                continue
            if lot in lots:
                if "inspection" not in lots[lot]:
                    lots[lot]["inspection"] = {}
                cat = categories[i] if i < len(categories) else ""
                if cat and cat != " ":
                    lots[lot]["inspection"][cat] = {
                        "lane1": lane1[i] if i < len(lane1) else "0",
                        "total": totals[i] if i < len(totals) else "0",
                    }
    except Exception as e:
        print(f"  WARN Inspection Results: {e}")

    # ── Inspection Results (Default Bin Count) ──────────────────────────────
    try:
        idb = tdms["Inspection Results (Default Bin Count)"]
        categories = read_channel(idb, "Category")
        lane1      = read_channel(idb, "Lane 1")
        totals     = read_channel(idb, "Total")
        lot_nums   = read_channel(idb, "LotNumber")

        for i, lot in enumerate(lot_nums):
            if not lot or lot in ("", " "):
                continue
            if lot in lots:
                if "default_bin" not in lots[lot]:
                    lots[lot]["default_bin"] = {}
                cat = categories[i] if i < len(categories) else ""
                if cat and cat != " ":
                    lots[lot]["default_bin"][cat] = {
                        "lane1": lane1[i] if i < len(lane1) else "0",
                        "total": totals[i] if i < len(totals) else "0",
                    }
    except Exception as e:
        print(f"  WARN Default Bin: {e}")

    # ── MITU 2 - Outlet breakdown ────────────────────────────────────────────
    try:
        m2 = tdms["MITU 2"]
        categories = read_channel(m2, "Category")
        lot_nums   = read_channel(m2, "LotNumber")
        outlets = {}
        for j in range(1, 11):
            try:
                outlets[f"Outlet {j}"] = read_channel(m2, f"Outlet {j}")
            except Exception:
                pass

        for i, lot in enumerate(lot_nums):
            if not lot or lot in ("", " "):
                continue
            if lot in lots:
                if "outlets" not in lots[lot]:
                    lots[lot]["outlets"] = {}
                cat = categories[i] if i < len(categories) else ""
                if cat and cat != " ":
                    lots[lot]["outlets"][cat] = {
                        f"outlet_{j}": outlets[f"Outlet {j}"][i]
                        if f"Outlet {j}" in outlets and i < len(outlets[f"Outlet {j}"])
                        else "0"
                        for j in range(1, 11)
                    }
    except Exception as e:
        print(f"  WARN MITU 2: {e}")

    return list(lots.values())


def parse_errors(path):
    """Parse ErrorLog TDMS → list of error entries."""
    tdms = TdmsFile.read(path)
    errors = []

    for group in tdms.groups():
        rows = zip_rows(group)
        for row in rows:
            ec = row.get("Error Code", "").strip()
            dt = row.get("Date/Time", "").strip()
            src = row.get("Error Source", "").strip()
            if not dt and not src:
                continue
            errors.append({
                "group": group.name,
                "run_id": row.get("RunID", "").strip(),
                "error_code": ec,
                "error_source": src[:300],  # cap length
                "datetime": dt,
                "additional_info": row.get("Additional Info", "").strip()[:200],
            })

    # Sort by datetime desc
    errors.sort(key=lambda x: x["datetime"], reverse=True)
    return errors


def find_latest(pattern):
    files = glob.glob(os.path.join(DATALOG_FOLDER, pattern))
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Parsing TDMS files...")

    result = {
        "parsed_at": datetime.now().isoformat(),
        "lots": [],
        "errors": [],
        "summary": {},
    }

    # Find latest debug file
    debug_file = find_latest("DebugCountersLog*.tdms")
    if debug_file:
        print(f"  Debug file: {os.path.basename(debug_file)}")
        try:
            result["lots"] = parse_debug(debug_file)
            print(f"  Parsed {len(result['lots'])} lots")
        except Exception as e:
            print(f"  ERROR parsing debug: {e}")
    else:
        print("  WARN: No DebugCountersLog*.tdms found")

    # Find latest error file
    error_file = find_latest("ErrorLog*.tdms")
    if error_file:
        print(f"  Error file: {os.path.basename(error_file)}")
        try:
            result["errors"] = parse_errors(error_file)
            print(f"  Parsed {len(result['errors'])} error entries")
        except Exception as e:
            print(f"  ERROR parsing errors: {e}")
    else:
        print("  WARN: No ErrorLog*.tdms found")

    # Build summary from latest lot
    if result["lots"]:
        latest = result["lots"][-1]
        sgr = latest.get("sgr", {})
        insp = latest.get("inspection", {})
        defbin = latest.get("default_bin", {})
        result["summary"] = {
            "machine_name": latest.get("system_name", ""),
            "machine_id": latest.get("system_id", ""),
            "software_version": latest.get("software_version", ""),
            "total_lots": len(result["lots"]),
            "latest_lot": latest.get("lot_number", ""),
            "latest_lot_start": latest.get("lot_start", ""),
            "latest_lot_stop": latest.get("lot_stop", ""),
            "latest_elapsed": latest.get("elapsed_time", ""),
            "latest_program_start": latest.get("program_start_time", ""),
            "fruits_inspected": insp.get("Vision Result Count", {}).get("total", "0"),
            "fruits_ejected": insp.get("Ejection done", {}).get("total", "0"),
            "fruits_lost": defbin.get("Lost Fruit", {}).get("total", "0"),
            "double_fruits": defbin.get("Multiple/Double Fruits", {}).get("total", "0"),
            "fruit_exit_count": sgr.get("FruitExitCount", {}).get("total", "0"),
            "total_errors": len(result["errors"]),
        }

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"  Written -> {OUTPUT_PATH}")
    print(f"  Summary: {json.dumps(result['summary'], indent=4)}")


if __name__ == "__main__":
    main()
