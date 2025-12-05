"""
Data helpers for presets/effects files.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import os
import shutil

# Determine paths
APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR

if os.getenv("SUBCIO_DESKTOP") == "1":
    app_data = os.getenv("APPDATA")
    if app_data:
        DATA_DIR = Path(app_data) / "subcio-desktop"
    else:
        DATA_DIR = Path.home() / ".subcio-desktop"
    
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def get_writable_file(filename: str) -> Path:
    """Get path to writable file, copying from app dir if needed."""
    target = DATA_DIR / filename
    source = APP_DIR / filename
    
    if DATA_DIR != APP_DIR and not target.exists() and source.exists():
        try:
            shutil.copy2(source, target)
        except Exception as e:
            print(f"Failed to copy {filename} to data dir: {e}")
            return source # Fallback to read-only source
            
    return target

PRESETS_FILE = get_writable_file("presets.json")
EFFECTS_FILE = get_writable_file("pyonfx_effects.json")


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except Exception as exc:
        print(f"Load error for {path}: {exc}")
        return {}


def save_json(path: Path, data: Dict[str, Any]) -> None:
    try:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        print(f"Save error for {path}: {exc}")


def load_presets() -> dict:
    return load_json(PRESETS_FILE)


def save_presets(data: Dict[str, Any]) -> None:
    save_json(PRESETS_FILE, data)


def load_effects() -> dict:
    return load_json(EFFECTS_FILE)

