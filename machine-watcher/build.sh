#!/usr/bin/env bash
# Build watcher.py into a standalone Windows .exe using PyInstaller.
# Run from the machine-watcher/ directory on Windows or WSL.
set -e

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Building watcher.exe..."
pyinstaller \
  --onefile \
  --name hortisort-watcher \
  --add-data "config.json;." \
  watcher.py

echo "Done. Executable: dist/hortisort-watcher.exe"
