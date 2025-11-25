"""
Data helpers for presets/effects files.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

PRESETS_FILE = Path(__file__).resolve().parent / "presets.json"
EFFECTS_FILE = Path(__file__).resolve().parent / "pyonfx_effects.json"


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

