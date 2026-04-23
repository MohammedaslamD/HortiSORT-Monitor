"""
Tests for watcher.py lot detection logic.
Run with: python -m pytest tests/
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from watcher import detect_lots


def make_row(lot, status="running", start="2026-04-23T06:00:00+05:30",
             stop=None, fruit="Mango", qty=100.0):
    return {
        "lot_number": lot,
        "status": status,
        "start_time": start,
        "stop_time": stop,
        "fruit_type": fruit,
        "quantity_kg": qty,
    }


def test_detect_lots_empty_returns_empty():
    assert detect_lots([]) == []


def test_detect_lots_single_running_lot():
    rows = [make_row(1)]
    result = detect_lots(rows)
    assert len(result) == 1
    assert result[0]["lot_number"] == 1
    assert result[0]["status"] == "running"


def test_detect_lots_groups_rows_by_lot_number():
    rows = [make_row(1), make_row(1), make_row(2)]
    result = detect_lots(rows)
    assert len(result) == 2
    lot_numbers = [r["lot_number"] for r in result]
    assert 1 in lot_numbers
    assert 2 in lot_numbers


def test_detect_lots_completed_lot_has_stop_time():
    rows = [make_row(1, status="completed", stop="2026-04-23T08:00:00+05:30")]
    result = detect_lots(rows)
    assert result[0]["status"] == "completed"
    assert result[0]["stop_time"] == "2026-04-23T08:00:00+05:30"


def test_detect_lots_sums_quantity_kg():
    rows = [
        make_row(1, qty=100.0),
        make_row(1, qty=200.0),
    ]
    result = detect_lots(rows)
    assert result[0]["quantity_kg"] == 300.0


def test_detect_lots_uses_earliest_start_time():
    rows = [
        make_row(1, start="2026-04-23T07:00:00+05:30"),
        make_row(1, start="2026-04-23T06:00:00+05:30"),
    ]
    result = detect_lots(rows)
    assert result[0]["start_time"] == "2026-04-23T06:00:00+05:30"
