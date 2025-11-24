import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from PIL import ImageFont

from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from faster_whisper import WhisperModel
import uvicorn

# PyonFX Effects Integration
from styles.effects import PyonFXRenderer, PyonFXStyleBuilder

def ms_to_ass_timestamp(ms: int) -> str:
    """Converts milliseconds to ASS timestamp format H:MM:SS.cc"""
    s = ms / 1000.0
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    cs = int((s - int(s)) * 100)
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"

# -----------------------------------------------------------------------------
# Whisper model bootstrap (cached globally to avoid repeated loads)
# -----------------------------------------------------------------------------
DEFAULT_MODEL = os.getenv("WHISPER_MODEL", "medium")
DEVICE = "cuda" if shutil.which("nvidia-smi") else "cpu"
MODEL_CACHE: dict[str, WhisperModel] = {}
OUTPUT_DIR = Path(__file__).resolve().parent / "exports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FONTS_DIR = Path(__file__).resolve().parent / "fonts"
FONTS_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR = Path(__file__).resolve().parent / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)


_WEIGHT_PATTERNS = [
    r"extrabold", r"extra-bold", r"extra bold", r"extrablack", r"ultrabold", r"ultra-bold",
    r"bold", r"semibold", r"semi-bold", r"semi bold", r"black", r"heavy",
    r"regular", r"book", r"medium", r"light", r"thin", r"hairline", r"extralight", r"extra light", r"ultralight",
]
_WIDTH_PATTERNS = [
    r"expanded", r"condensed", r"compressed", r"extended", r"narrow", r"wide",
    r"semi\s*expanded", r"semi\s*condensed", r"semi\s*compressed",
    r"ultraexpanded", r"extraexpanded", r"ultracondensed", r"extracondensed",
    r"\d+pt",
]


def _base_font_name(stem: str) -> str:
    base = stem.replace("_", " ").replace(",", "-")
    # Insert spaces between camel-case boundaries so "AdventPro" -> "Advent Pro"
    base = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", base)
    base = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", base)
    for pat in _WIDTH_PATTERNS:
        base = re.sub(pat, "", base, flags=re.I)
    for pat in _WEIGHT_PATTERNS:
        base = re.sub(pat, "", base, flags=re.I)
    base = re.sub(r"italic|oblique|variablefont.*", "", base, flags=re.I)
    base = re.sub(r"-+", " ", base)
    base = re.sub(r"\s+", " ", base).strip()
    return base or stem


def sanitize_font_name_from_path(p: Path) -> tuple[str, str]:
    """Return (display_name, filename) normalized from path."""
    try:
        font = ImageFont.truetype(str(p), 10)
        name = font.getname()[0]
        if name:
             return name, p.name
    except Exception:
        pass
    return _base_font_name(p.stem), p.name


def load_font_name_list() -> list[dict]:
    fonts = list(FONTS_DIR.glob("*.ttf")) + list(FONTS_DIR.glob("*.otf"))
    entries = []
    seen = set()
    for f in fonts:
        name, filename = sanitize_font_name_from_path(f)
        if name in seen:
            continue
        seen.add(name)
        entries.append({"name": name, "file": filename})
    return sorted(entries, key=lambda x: x["name"])


FONT_ENTRIES: list[dict] = load_font_name_list()
FONT_NAME_LIST: list[str] = [e["name"] for e in FONT_ENTRIES]

def _normalize_font_token(val: str) -> str:
    return re.sub(r"[\s_-]+", "", (val or "")).lower()

# Map normalized tokens to display names for consistent ASS font values
_FONT_TOKEN_MAP = {(_normalize_font_token(e["name"])): e["name"] for e in FONT_ENTRIES}

def resolve_font_name(name: str) -> str:
    return _FONT_TOKEN_MAP.get(_normalize_font_token(name), name or "Sans")


def font_in_pool(name: str) -> bool:
    token = _normalize_font_token(name)
    return token in _FONT_TOKEN_MAP


def pick_font_for_preset(preset_id: str) -> str:
    """Deterministically pick a font for a preset id so assignments are stable."""
    if not FONT_NAME_LIST:
        return "Sans"
    digest = hashlib.sha256(preset_id.encode("utf-8")).digest()
    idx = int.from_bytes(digest[:4], "big") % len(FONT_NAME_LIST)
    return FONT_NAME_LIST[idx]


PRESET_STYLE_MAP = {
    "fire-storm": {
        "font": "Asimovian",
        "primary_color": "&H0000d5ff",
        "secondary_color": "&H00c431a4",
        "outline_color": "&H00000000",
        "shadow_color": "&H00ffffff",
        "font_size": 150,
        "letter_spacing": 10,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 1,
        "shadow": 3,
        "blur": 1,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": -1,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "fire-storm"
    },
    "cyber-glitch": {
        "font": "Oslla",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H000000FF",
        "shadow_color": "&H000000F5",
        "font_size": 100,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 2,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "cyber-glitch"
    },
    "neon-pulse": {
        "font": "Matemasie",
        "primary_color": "&H00F5F5F5",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00ff0aff",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "neon-pulse"
    },
    "kinetic-bounce": {
        "font": "Luckiest Guy",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "kinetic-bounce"
    },
    "cinematic-blur": {
        "font": "BlackCaps",
        "primary_color": "&H00E0E0E0",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 35,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 2,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "cinematic-blur"
    },
    "thunder-strike": {
        "font": "Komika Axis",
        "primary_color": "&H0000FFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 35,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 2,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "thunder-strike"
    },
    "typewriter-pro": {
        "font": "OverHeat Regular",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 35,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 2,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "typewriter-pro"
    },
    "rainbow-wave": {
        "font": "Brown Beige",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 64,
        "id": "rainbow-wave"
    },
    "earthquake-shake": {
        "font": "Thoge",
        "primary_color": "&H000000FF",
        "outline_color": "&H00FFFFFF",
        "font_size": 70,
        "id": "earthquake-shake"
    },
    "word-pop": {
        "font": "Patrick Hand",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00333333",
        "shadow_color": "&H00000000",
        "font_size": 150,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "word-pop"
    },
    "retro-arcade": {
        "font": "Viaoda Libre",
        "primary_color": "&H0000FF00",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 150,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "retro-arcade"
    },
    "horror-creepy": {
        "font": "Loved by the King",
        "primary_color": "&H000000FF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000033",
        "shadow_color": "&H00000000",
        "font_size": 200,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "horror-creepy"
    },
    "luxury-gold": {
        "font": "Capriola",
        "primary_color": "&H0000D7FF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "luxury-gold"
    },
    "comic-book": {
        "font": "Loved by the King",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 250,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "comic-book"
    },
    "news-ticker": {
        "font": "Denk One",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 150,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "news-ticker"
    },
    "pulse": {
        "font": "Original Surfer",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00FF00FF",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "pulse"
    },
    "bubble-floral": {
        "font": "Love Ya Like A Sister",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00FFBD00",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "bubble-floral"
    },
    "falling-heart": {
        "font": "Just Another Hand",
        "primary_color": "&H00000000",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00A5907E",
        "shadow_color": "&H00000000",
        "font_size": 250,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "falling-heart"
    },
    "colorful": {
        "font": "Winky Rough",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 8,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "colorful"
    },
    "ghost-star": {
        "font": "Bricolage Grotesque",
        "primary_color": "&H00cc00fa",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H0000FFFF",
        "shadow_color": "&H00000000",
        "font_size": 110,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 0,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "ghost-star"
    },
    "tiktok-group": {
        "font": "Proxima Nova",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 54,
        "id": "tiktok-group"
    },
    "3d-spin": {
        "font": "Denk One",
        "primary_color": "&H0000FFFF",
        "secondary_color": "&H000000FF",
        "outline_color": "&H00FFFFFF",
        "shadow_color": "&H00000000",
        "font_size": 150,
        "letter_spacing": 6,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 3,
        "shadow": 5,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "3d-spin"
    },
    "shear-force": {
        "font": "Nunito",
        "primary_color": "&H0000FF00",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 1,
        "underline": 0,
        "strikeout": 0,
        "border": 3,
        "shadow": 5,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "shear-force"
    },
    "double-shadow": {
        "font": "Advent Pro",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00FF00FF",
        "shadow_color": "&H00FFFF00",
        "font_size": 110,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 6,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "double-shadow"
    },

    "matrix-rain": {
        "font": "Rubik Wet Paint",
        "primary_color": "&H0000FF00",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 110,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 6,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "matrix-rain"
    },
    "electric-shock": {
        "font": "NovaMono",
        "primary_color": "&H0000FFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 6,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "electric-shock"
    },
    "smoke-trail": {
        "font": "Coiny",
        "primary_color": "&H00CCCCCC",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00666666",
        "shadow_color": "&H00000000",
        "font_size": 80,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 6,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "smoke-trail"
    },
    "pixel-glitch": {
        "font": "Bahiana",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00FF0000",
        "shadow_color": "&H00000000",
        "font_size": 150,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 4,
        "shadow": 6,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 10,
        "rotation_y": 20,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "pixel-glitch"
    },
    "neon-sign": {
        "font": "Patrick Hand",
        "primary_color": "&H00ffffff",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "shadow_color": "&H008e8ecc",
        "font_size": 120,
        "letter_spacing": 5,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 0,
        "shadow": 6,
        "blur": 1,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": -1,
        "shear": -30,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "neon-sign"
    },
    "karaoke-classic": {
        "font": "Marble",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 62,
        "id": "karaoke-classic"
    },
    "fade-in-out": {
        "font": "Folkies Vantage",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00333333",
        "font_size": 56,
        "id": "fade-in-out"
    },
    "slide-up": {
        "font": "Sink",
        "primary_color": "&H00FFAA00",
        "outline_color": "&H00000000",
        "font_size": 60,
        "id": "slide-up"
    },
    "zoom-burst": {
        "font": "RoseMask",
        "primary_color": "&H00FF69B4",
        "outline_color": "&H00000000",
        "font_size": 64,
        "id": "zoom-burst"
    },
    "bounce-in": {
        "font": "Might Night",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00FF0000",
        "font_size": 68,
        "id": "bounce-in"
    },
    "tiktok-yellow-box": {
        "font": "Poppins",
        "primary_color": "&H00000000",
        "outline_color": "&H00000000",
        "font_size": 62,
        "id": "tiktok-yellow-box"
    },
    "tiktok-box-group": {
        "font": "Poppins",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 58,
        "id": "tiktok-box-group"
    },
    "sakura-dream": {
        "font": "Brume",
        "primary_color": "&H00FF69B4",
        "outline_color": "&H00FFFFFF",
        "font_size": 68,
        "id": "sakura-dream"
    },
    "phoenix-flames": {
        "font": "Marble",
        "primary_color": "&H0000FF",
        "outline_color": "&H00FFFF00",
        "font_size": 70,
        "id": "phoenix-flames"
    },
    "ice-crystal": {
        "font": "Monigue",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00DDFFFF",
        "font_size": 66,
        "id": "ice-crystal"
    },
    "thunder-storm": {
        "font": "Chunko Bold",
        "primary_color": "&H0000FFFF",
        "outline_color": "&H000000FF",
        "font_size": 72,
        "id": "thunder-storm"
    },
    "ocean-wave": {
        "font": "Oslla",
        "primary_color": "&H00FF8800",
        "outline_color": "&H000088FF",
        "font_size": 64,
        "id": "ocean-wave"
    },
    "cosmic-stars": {
        "font": "Tallica",
        "primary_color": "&H00FF00FF",
        "outline_color": "&H00FFFFFF",
        "font_size": 68,
        "id": "cosmic-stars"
    },
    "butterfly-dance": {
        "font": "Nunito",
        "primary_color": "&H009A4C73",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00FFFFFF",
        "shadow_color": "&H00000000",
        "font_size": 100,
        "letter_spacing": 0,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 1.5,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 13,
        "margin_r": 13,
        "id": "butterfly-dance"
    },
    "welcome-my-life": {
        "font": "Bangers",
        "primary_color": "&H006CB1DD",
        "secondary_color": "&H000000FF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 180,
        "letter_spacing": 0,
        "bold": 0,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 1.5,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 47,
        "margin_l": 13,
        "margin_r": 13,
        "id": "welcome-my-life"
    },
    "dynamic-highlight": {
        "font": "Poppins",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "font_size": 60,
        "alignment": 2,
        "id": "dynamic-highlight"
    },
    "karaoke-pro": {
        "font": "Poppins",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "color_future": "&H00808080",
        "color_past": "&H00808080",
        "outline_future": "&H00000000",
        "outline_past": "&H00000000",
        "font_size": 60,
        "alignment": 2,
        "id": "karaoke-pro"
    },
    "karaoke-sentence": {
        "font": "Poppins",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "font_size": 60,
        "alignment": 2,
        "id": "karaoke-sentence"
    },
    "mademyday": {
        "font": "Original Surfer",
        "primary_color": "&H00888888",
        "secondary_color": "&H003DD8FF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 64,
        "letter_spacing": 4,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 2,
        "shadow": 0,
        "blur": 0,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": 0,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 5,
        "margin_v": 40,
        "margin_l": 10,
        "margin_r": 10,
        "id": "mademyday"
    },
    # PyonFX Effects Presets
    "pyonfx-bulge": {
        "font": "Arial",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "secondary_color": "&H00000000",
        "shadow_color": "&H80000000",
        "font_size": 72,
        "bold": 1,
        "border": 2,
        "shadow_blur": 0,
        "alignment": 5,
        "margin_l": 10,
        "margin_r": 10,
        "margin_v": 10,
        "opacity": 100,
        "letter_spacing": 0,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "effect_type": "bulge",
        "effect_config": {
            "intensity": 1.5,
            "blur": 0.2
        },
        "id": "pyonfx-bulge"
    },
    "pyonfx-shake": {
        "font": "Arial",
        "primary_color": "&H00FF0000",
        "outline_color": "&H00FFFFFF",
        "secondary_color": "&H00000000",
        "shadow_color": "&H80000000",
        "font_size": 64,
        "bold": 1,
        "border": 3,
        "shadow_blur": 0,
        "alignment": 5,
        "margin_l": 10,
        "margin_r": 10,
        "margin_v": 10,
        "opacity": 100,
        "letter_spacing": 0,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "effect_type": "shake",
        "effect_config": {
            "intensity": 10.0,
            "frequency": 20.0
        },
        "id": "pyonfx-shake"
    },
    "pyonfx-wave": {
        "font": "Arial",
        "primary_color": "&H0000FF00",
        "outline_color": "&H00000000",
        "secondary_color": "&H00000000",
        "shadow_color": "&H80000000",
        "font_size": 60,
        "bold": 0,
        "border": 1,
        "shadow_blur": 0,
        "alignment": 5,
        "margin_l": 10,
        "margin_r": 10,
        "margin_v": 10,
        "opacity": 100,
        "letter_spacing": 0,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "effect_type": "wave",
        "effect_config": {
            "amplitude": 25.0,
            "wavelength": 80.0
        },
        "id": "pyonfx-wave"
    },
    "pyonfx-chromatic": {
        "font": "Ribeye",
        "primary_color": "&H00FFFFFF",
        "secondary_color": "&H00000000",
        "outline_color": "&H00FF00FF",
        "shadow_color": "&H00000000",
        "font_size": 150,
        "bold": 1,
        "border": 2,
        "shadow_blur": 6,
        "alignment": 5,
        "margin_l": 10,
        "margin_r": 10,
        "margin_v": 10,
        "opacity": 100,
        "letter_spacing": 0,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "effect_type": "bulge",
        "effect_config": {},
        "id": "pyonfx-chromatic"
    }
}


# Normalize preset fonts to current pool only if missing/invalid so manual choices stick
for _pid, _pstyle in PRESET_STYLE_MAP.items():
    if not _pstyle.get("font") or not font_in_pool(_pstyle["font"]):
        _pstyle["font"] = pick_font_for_preset(_pid)


def get_model(model_name: str) -> WhisperModel:
    if model_name not in MODEL_CACHE:
        MODEL_CACHE[model_name] = WhisperModel(
            model_name,
            device=DEVICE,
            compute_type="float16" if DEVICE == "cuda" else "int8",
        )
    return MODEL_CACHE[model_name]


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
def ms_to_ass_timestamp(ms: float) -> str:
    total_ms = int(ms)
    hours = total_ms // 3_600_000
    minutes = (total_ms % 3_600_000) // 60_000
    seconds = (total_ms % 60_000) // 1_000
    centiseconds = (total_ms % 1_000) // 10
    return f"{hours:d}:{minutes:02d}:{seconds:02d}.{centiseconds:02d}"


def css_hex_to_ass(value: str) -> str:
    """
    Convert CSS hex (#RRGGBB or #AARRGGBB) to ASS (&HAABBGGRR).
    If already ASS format, return as-is.
    """
    if not value:
        return "&H00FFFFFF"
    if value.startswith("&H") or value.startswith("&h"):
        return value
    val = value.lstrip("#")
    if len(val) == 6:
        rr, gg, bb = val[0:2], val[2:4], val[4:6]
        aa = "00"
    elif len(val) == 8:
        aa, rr, gg, bb = val[0:2], val[2:4], val[4:6], val[6:8]
    else:
        return "&H00FFFFFF"
    return f"&H{aa}{bb}{gg}{rr}"


def build_ass(words: List[dict], style: dict) -> str:
    """
    Build an .ass karaoke file using word-level timings with animations.
    Expected style keys: font, primary_color, outline_color, back_color,
    font_size, bold, shadow, shadow_blur, shadow_color, border, alignment, italic, id.
    """
    font = (style.get("font") or "Inter").split(",")[0].strip()
    color_primary = css_hex_to_ass(style.get("primary_color", "&H00FFFFFF"))
    color_outline = css_hex_to_ass(style.get("outline_color", "&H00000000"))
    color_back = css_hex_to_ass(style.get("back_color", "&H00000000"))
    border = style.get("border", 2)
    
    # Use shadow_blur if available (from frontend), otherwise fall back to shadow
    shadow = style.get("shadow_blur") or style.get("shadow", 0)
    
    size = style.get("font_size", 48)
    alignment = style.get("alignment", 2)  # 2 = bottom-center
    italic = style.get("italic", 0)
    bold = style.get("bold", 1)
    border_style = style.get("border_style", 1)
    margin_v = style.get("margin_v", 40)
    style_id = style.get("id", "default")

    # Animation tags based on preset
    anim_tags = get_animation_tags(style_id)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Styled, {font}, {size}, {color_primary}, &H000000FF, {color_outline}, {color_back}, {bold}, {italic}, 0, 0, 100, 100, 0, 0, {border_style}, {border}, {shadow}, {alignment}, 20, 20, {margin_v}, 0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = []
    for word in words:
        start_ms = int(word["start"] * 1000)
        end_ms = int(word["end"] * 1000)
        duration_cs = max(1, (end_ms - start_ms) // 10)
        start_ts = ms_to_ass_timestamp(start_ms)
        end_ts = ms_to_ass_timestamp(end_ms)
        safe_text = word["text"].replace("{", r"\{").replace("}", r"\}")
        
        # Add animation tags to active word
        text = f"{{\\k{duration_cs}{anim_tags}}}{safe_text}"
        lines.append(f"Dialogue: 0,{start_ts},{end_ts},Styled,,0,0,0,,{text}")
    return header + "\n".join(lines)


def get_animation_tags(style_id: str) -> str:
    """
    Returns ASS animation tags for each preset to match frontend animations.
    \t(...) = transform/animation
    \fscx / \fscy = scale X/Y (100 = normal, 120 = 1.2x)
    \frz = rotate Z axis (degrees)
    \1c = primary color
    """
    animations = {
        "neon-glow": r"\t(0,100,\fscx112\fscy112)\t(100,200,\fscx100\fscy100)",  # Scale up then down
        "gradient-bounce": r"\t(0,100,\fscx112\fscy112)\t(100,200,\fscx100\fscy100)",
        "bold-pop": r"\t(0,100,\fscx118\fscy118\frz-1)\t(100,200,\fscx100\fscy100\frz0)",  # Scale + rotate
        "tiktok-pulse": r"\t(0,100,\fscx115\fscy115)\t(100,200,\fscx100\fscy100)",
        "netflix-highlight": r"\t(0,100,\fscx108\fscy108)\t(100,200,\fscx100\fscy100)",
        "fire-text": r"\t(0,100,\fscx120\fscy120)\t(100,200,\fscx100\fscy100)",
        "fast": r"\t(0,80,\fscx108\fscy108)\t(80,150,\fscx100\fscy100)",  # Faster animation
        "explosive": r"\t(0,100,\fscx110\fscy110)\t(100,200,\fscx100\fscy100)",
        "hype": r"\t(0,100,\fscx105\fscy105)\t(100,200,\fscx100\fscy100)",
        "default": r"\t(0,100,\fscx105\fscy105)\t(100,200,\fscx100\fscy100)",
    }
    return animations.get(style_id, "")


def run_ffmpeg_burn(video_path: Path, ass_path: Path, output_path: Path, resolution: str):
    scale_filter = {
        "original": "scale=iw:ih",
        "1080p": "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(1920-iw)/2:(1080-ih)/2",
        "4k": "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(3840-iw)/2:(2160-ih)/2",
    }.get(resolution, "scale=iw:ih")

    # Escape Windows drive colon for ffmpeg ass filter (expects \: in path)
    ass_path_str = ass_path.as_posix().replace(":", r"\:")
    fonts_dir_str = FONTS_DIR.as_posix().replace(":", r"\:")
    vf = f"ass=filename='{ass_path_str}':fontsdir='{fonts_dir_str}',{scale_filter}"
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vf",
        vf,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "18",
        "-c:a",
        "copy",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg failed: {result.stderr}",
        )


def generate_thumbnail(video_path: Path, thumb_path: Path):
    """Grab the first frame as a thumbnail for project cards."""
    thumb_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-frames:v",
        "1",
        "-q:v",
        "2",
        str(thumb_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[WARN] Thumbnail generation failed: {result.stderr}")


def persist_project(
    video_path: Path,
    words: List[dict],
    language: str,
    model: str,
    style: Optional[dict] = None,
    project_id: Optional[str] = None,
    name: Optional[str] = None,
):
    """Persist a project folder with media + metadata and return its manifest."""
    pid = project_id or uuid.uuid4().hex
    project_dir = PROJECTS_DIR / pid
    project_dir.mkdir(parents=True, exist_ok=True)

    stored_video = project_dir / "video.mp4"
    if video_path.resolve() != stored_video.resolve():
        shutil.copy(video_path, stored_video)

    transcript_payload = {"language": language, "model": model, "words": words}
    (project_dir / "transcript.json").write_text(
        json.dumps(transcript_payload, indent=2), encoding="utf-8"
    )
    (project_dir / "subtitles.json").write_text(
        json.dumps({"segments": words}, indent=2), encoding="utf-8"
    )

    created_at = datetime.utcnow().isoformat()
    config = {
        "id": pid,
        "name": name or video_path.stem,
        "created_at": created_at,
        "style": style or {},
        "language": language,
        "model": model,
    }
    (project_dir / "config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    thumb_path = project_dir / "thumb.jpg"
    try:
        generate_thumbnail(stored_video, thumb_path)
    except Exception as thumb_err:
        print(f"[WARN] Failed to create thumbnail for {pid}: {thumb_err}")

    return {
        "id": pid,
        "name": config["name"],
        "created_at": created_at,
        "video_url": f"/projects/{pid}/{stored_video.name}",
        "thumb_url": f"/projects/{pid}/thumb.jpg",
        "config": config,
    }


def list_projects() -> List[dict]:
    projects = []
    for path in PROJECTS_DIR.iterdir():
        if not path.is_dir():
            continue
        config_path = path / "config.json"
        config = {}
        if config_path.exists():
            try:
                config = json.loads(config_path.read_text(encoding="utf-8"))
            except Exception:
                config = {}
        thumb = path / "thumb.jpg"
        video = path / "video.mp4"
        projects.append(
            {
                "id": path.name,
                "name": config.get("name", path.name),
                "created_at": config.get("created_at"),
                "thumb_url": f"/projects/{path.name}/thumb.jpg" if thumb.exists() else None,
                "video_url": f"/projects/{path.name}/video.mp4" if video.exists() else None,
            }
        )
    return sorted(projects, key=lambda x: x.get("created_at") or "", reverse=True)


def load_project(project_id: str) -> dict:
    project_dir = PROJECTS_DIR / project_id
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")

    transcript_path = project_dir / "transcript.json"
    subtitles_path = project_dir / "subtitles.json"
    config_path = project_dir / "config.json"
    video_path = project_dir / "video.mp4"
    thumb_path = project_dir / "thumb.jpg"

    subtitles = []
    transcript = {}
    config = {}

    if subtitles_path.exists():
        try:
            subtitles = json.loads(subtitles_path.read_text(encoding="utf-8")).get("segments", [])
        except Exception:
            subtitles = []

    if transcript_path.exists():
        try:
            transcript = json.loads(transcript_path.read_text(encoding="utf-8"))
        except Exception:
            transcript = {}

    if config_path.exists():
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
        except Exception:
            config = {}

    return {
        "id": project_id,
        "name": config.get("name", project_id),
        "created_at": config.get("created_at"),
        "words": subtitles,
        "transcript": transcript,
        "config": config,
        "video_url": f"/projects/{project_id}/video.mp4" if video_path.exists() else None,
        "thumb_url": f"/projects/{project_id}/thumb.jpg" if thumb_path.exists() else None,
    }


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(title="PyCaps API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_methods=["*"],
    allow_credentials=False,
    allow_headers=["*"],
)
projects_static = StaticFiles(directory=PROJECTS_DIR)
projects_cors = CORSMiddleware(
    app=projects_static,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)
app.mount("/projects", projects_cors, name="projects")

@app.middleware("http")
async def enforce_projects_cors(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/projects/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers.setdefault("Access-Control-Allow-Headers", "*")
        response.headers.setdefault("Access-Control-Allow-Methods", "GET, OPTIONS")
    return response


@app.post("/api/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    model_name: str = Form(DEFAULT_MODEL),
    language: str | None = Form(None),
    use_vad: bool = Form(False),
    beam_size: int = Form(5),
    best_of: int = Form(5),
    temperature: float = Form(0.0),
):
    """
    Accepts video/audio file and returns word-level timestamps with confidence.
    """
    model = get_model(model_name)
    with tempfile.TemporaryDirectory() as tmpdir:
        in_path = Path(tmpdir) / file.filename
        with in_path.open("wb") as f:
            f.write(await file.read())

        segments, info = model.transcribe(
            str(in_path),
            language=language if language else None,
            word_timestamps=True,
            vad_filter=use_vad,
            vad_parameters={"min_silence_duration_ms": 200} if use_vad else None,
            beam_size=beam_size,
            best_of=best_of,
            temperature=temperature,
        )
        words = []
        for seg in segments:
            for w in seg.words:
                # Remove punctuation from word text
                clean_text = w.word.strip()
                # Remove common punctuation marks
                clean_text = clean_text.strip('.,!?;:"\'-()[]{}')
                
                # Skip if text becomes empty after cleaning
                if not clean_text:
                    continue
                    
                words.append(
                    {
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                        "text": clean_text,
                        "confidence": round(getattr(w, "probability", 0) or 0, 3),
                    }
                )
        project_meta = persist_project(
            in_path,
            words,
            info.language or (language or "auto"),
            model_name,
            name=file.filename,
        )
    return JSONResponse(
        {
            "language": info.language,
            "device": DEVICE,
            "model": model_name,
            "words": words,
            "projectId": project_meta["id"],
            "project": project_meta,
        }
    )


@app.get("/api/fonts")
async def list_fonts():
    """
    Returns a list of all available font names from the fonts directory.
    """
    try:
        return JSONResponse({"fonts": FONT_ENTRIES})
    except Exception as e:
        return JSONResponse({"fonts": [], "error": str(e)}, status_code=500)



@app.post("/api/export")
async def export_subtitled_video(
    background_tasks: BackgroundTasks = None,
    video: UploadFile | None = File(None),
    words_json: str | None = Form(None),
    style_json: str | None = Form(None),
    project_id: str | None = Form(None),
    resolution: str = Form("1080p"),
):
    """
    Burns .ass subtitles with provided style and edited words; returns processed video.
    - words_json: JSON list of dicts with start/end/text
    - style_json: JSON object with style parameters
    """
    if not words_json and not project_id:
        raise HTTPException(status_code=400, detail="words_json or project_id is required")

    if not video and not project_id:
        raise HTTPException(status_code=400, detail="video file or project_id is required")

    words = json.loads(words_json) if words_json else load_project(project_id).get("words", [])
    incoming_style = json.loads(style_json) if style_json else {}
    if project_id and not incoming_style:
        incoming_style = load_project(project_id).get("config", {}).get("style", {})
    style_id = incoming_style.get("id")
    # Merge: preset -> incoming (UI overrides preset), then normalize colors.
    style = {**PRESET_STYLE_MAP.get(style_id, {}), **incoming_style}
    # Ensure font exists in current pool
    if not style.get("font") or not font_in_pool(style["font"]):
        style["font"] = pick_font_for_preset(style_id or "default")
    style["font"] = resolve_font_name(style["font"])
    
    # Debug: Print style_id
    print(f"[DEBUG] Export style_id: {style_id}")
    print(f"[DEBUG] Full style: {style}")

    # Persist artifacts inside backend/exports to avoid Temp cleanup races.
    uid = uuid.uuid4().hex
    cleanup_upload = True
    if project_id and not video:
        in_path = PROJECTS_DIR / project_id / "video.mp4"
        if not in_path.exists():
            raise HTTPException(status_code=404, detail="Project video not found")
        cleanup_upload = False
    else:
        suffix = Path(video.filename).suffix or ".mp4"
        in_path = OUTPUT_DIR / f"upload_{uid}{suffix}"
        with in_path.open("wb") as f:
            f.write(await video.read())

    ass_path = OUTPUT_DIR / f"subtitles_{uid}.ass"
    
    # Check if using PyonFX effects
    effect_type = style.get("effect_type")
    if effect_type and effect_type in ["bulge", "shake", "wave", "chromatic"]:
        # Use PyonFX Renderer for effects-based presets
        renderer = PyonFXRenderer(words, style)
        ass_content = renderer.render()
    else:
        # Use AdvancedRenderer for standard presets
        from render_engine import AdvancedRenderer
        renderer = AdvancedRenderer(words, style)
        ass_content = renderer.render()
        
    ass_path.write_text(ass_content, encoding="utf-8")

    out_path = OUTPUT_DIR / f"export_{uid}.mp4"
    try:
        run_ffmpeg_burn(in_path, ass_path, out_path, resolution)
    except Exception as exc:  # return JSON so CORS headers still attach
        background_tasks.add_task(lambda: in_path.unlink(missing_ok=True))
        raise HTTPException(status_code=500, detail=str(exc))

    if not out_path.exists():
        if cleanup_upload:
            background_tasks.add_task(lambda: in_path.unlink(missing_ok=True))
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: output file missing at {out_path}",
        )

    # Keep .ass and .mp4 for inspection; only remove uploaded source after response.
    if cleanup_upload:
        background_tasks.add_task(lambda: in_path.unlink(missing_ok=True))

    return FileResponse(
        path=out_path,
        media_type="video/mp4",
        filename="pycaps_export.mp4",
        headers={
            "Content-Disposition": "attachment; filename=pycaps_export.mp4"
        },
        background=background_tasks,
    )


@app.post("/api/preview-ass")
async def preview_ass(
    words_json: str = Form(...),
    style_json: str = Form(...),
    project_id: str | None = Form(None),
):
    """
    Generates ASS subtitle content for preview without burning video.
    Returns plain text ASS content.
    """
    try:
        words = json.loads(words_json)
        incoming_style = json.loads(style_json)
        if project_id and not words:
            words = load_project(project_id).get("words", [])
            if not incoming_style:
                incoming_style = load_project(project_id).get("config", {}).get("style", {})
        style_id = incoming_style.get("id")
        
        # Merge: preset -> incoming (UI overrides preset)
        style = {**PRESET_STYLE_MAP.get(style_id, {}), **incoming_style}
        if not style.get("font") or not font_in_pool(style["font"]):
            style["font"] = pick_font_for_preset(style_id or "default")
        style["font"] = resolve_font_name(style["font"])

        # Check if using PyonFX effects
        effect_type = style.get("effect_type")
        if effect_type and effect_type in ["bulge", "shake", "wave", "chromatic"]:
            # Use PyonFX Renderer for effects-based presets
            renderer = PyonFXRenderer(words, style)
            ass_content = renderer.render()
        else:
            # Use AdvancedRenderer for standard presets
            from render_engine import AdvancedRenderer
            renderer = AdvancedRenderer(words, style)
            ass_content = renderer.render()
            
        return Response(content=ass_content, media_type="text/plain")
    except Exception as e:
        print(f"Preview Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects")
async def get_projects():
    """List saved projects with metadata."""
    return JSONResponse(list_projects())


@app.get("/api/projects/{project_id}")
async def get_project_detail(project_id: str):
    return JSONResponse(load_project(project_id))


@app.post("/api/projects")
async def create_project(
    video: UploadFile = File(...),
    words_json: str | None = Form(None),
    language: str | None = Form(None),
    model_name: str = Form(DEFAULT_MODEL),
    style_json: str | None = Form(None),
    project_name: str | None = Form(None),
):
    """
    Create a new project by transcribing (if words not provided) and persisting assets.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        in_path = Path(tmpdir) / video.filename
        with in_path.open("wb") as f:
            f.write(await video.read())

        incoming_words = json.loads(words_json) if words_json else []
        detected_language = language or "auto"

        if not incoming_words:
            model = get_model(model_name)
            segments, info = model.transcribe(
                str(in_path),
                language=language if language else None,
                word_timestamps=True,
                vad_filter=False,
            )
            words = []
            for seg in segments:
                for w in seg.words:
                    clean_text = w.word.strip().strip('.,!?;:"\'-()[]{}')
                    if not clean_text:
                        continue
                    words.append(
                        {
                            "start": round(w.start, 3),
                            "end": round(w.end, 3),
                            "text": clean_text,
                            "confidence": round(getattr(w, "probability", 0) or 0, 3),
                        }
                    )
            incoming_words = words
            detected_language = info.language or language or "auto"

        incoming_style = json.loads(style_json) if style_json else {}
        project_meta = persist_project(
            in_path,
            incoming_words,
            detected_language,
            model_name,
            style=incoming_style,
            name=project_name or video.filename,
        )
    return JSONResponse(
        {
            "projectId": project_meta["id"],
            "project": project_meta,
            "words": incoming_words,
        }
    )


@app.get("/api/presets")
async def get_presets():
    """
    Returns all available presets with their configuration.
    """
    try:
        presets_list = []
        # Default color values for presets missing them
        defaults = {
            "primary_color": "&H00FFFFFF",
            "secondary_color": "&H0000FFFF",
            "outline_color": "&H00000000",
            "shadow_color": "&H00000000",
            "back_color": "&H00000000",
            "alignment": 2,
            "margin_v": 40,
            "bold": 1,
            "italic": 0
        }
        
        for preset_id, preset_data in PRESET_STYLE_MAP.items():
            # Merge defaults with preset data (preset data takes precedence)
            complete_preset = {**defaults, **preset_data}
            complete_preset["font"] = pick_font_for_preset(preset_id)
            presets_list.append(complete_preset)
        return JSONResponse(content=presets_list)
    except Exception as e:
        print(f"Get Presets Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presets/update")
async def update_preset(preset_data: dict):
    """
    Updates a preset configuration and persists to main.py
    """
    try:
        preset_id = preset_data.get("id")
        if not preset_id or preset_id not in PRESET_STYLE_MAP:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        # Update in-memory preset
        PRESET_STYLE_MAP[preset_id] = preset_data
        
        # Persist to file
        try:
            update_main_py_preset(preset_id, preset_data)
            message = f"Preset '{preset_id}' updated and saved to main.py"
        except Exception as e:
            message = f"Preset '{preset_id}' updated in memory, but failed to save to file: {str(e)}"
        
        return JSONResponse(content={
            "success": True,
            "message": message
        })
    except Exception as e:
        print(f"Update Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presets/create")
async def create_preset(preset_data: dict):
    """
    Creates a new preset (Save As functionality)
    """
    try:
        preset_id = preset_data.get("id")
        if not preset_id:
            raise HTTPException(status_code=400, detail="Preset ID is required")
        
        if preset_id in PRESET_STYLE_MAP:
            raise HTTPException(status_code=409, detail=f"Preset '{preset_id}' already exists")
        
        # Add to in-memory map
        PRESET_STYLE_MAP[preset_id] = preset_data
        
        # Persist to file
        try:
            add_preset_to_main_py(preset_id, preset_data)
            message = f"Preset '{preset_id}' created and saved to main.py"
        except Exception as e:
            message = f"Preset '{preset_id}' created in memory, but failed to save to file: {str(e)}"
        
        return JSONResponse(content={
            "success": True,
            "message": message
        })
    except Exception as e:
        print(f"Create Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def update_main_py_preset(preset_id: str, preset_data: dict):
    """Update a preset in main.py file"""
    main_py_path = Path(__file__).resolve()
    content = main_py_path.read_text(encoding='utf-8')
    
    # For PyonFX presets, include effect_type and effect_config
    is_pyonfx = preset_id.startswith("pyonfx-") or preset_data.get("effect_type")
    
    # Create new preset block with all parameters
    if is_pyonfx:
        effect_config = preset_data.get('effect_config', {})
        # Convert effect_config dict to proper JSON string
        import json
        effect_config_str = json.dumps(effect_config)
        
        new_preset = f'''"{preset_id}": {{
        "font": "{preset_data.get('font', 'Arial')}",
        "primary_color": "{preset_data.get('primary_color', '&H00FFFFFF')}",
        "secondary_color": "{preset_data.get('secondary_color', '&H00000000')}",
        "outline_color": "{preset_data.get('outline_color', '&H00000000')}",
        "shadow_color": "{preset_data.get('shadow_color', '&H80000000')}",
        "font_size": {preset_data.get('font_size', 64)},
        "bold": {preset_data.get('bold', 1)},
        "border": {preset_data.get('border', 2)},
        "shadow_blur": {preset_data.get('shadow_blur', 0)},
        "alignment": {preset_data.get('alignment', 5)},
        "margin_l": {preset_data.get('margin_l', 10)},
        "margin_r": {preset_data.get('margin_r', 10)},
        "margin_v": {preset_data.get('margin_v', 10)},
        "opacity": {preset_data.get('opacity', 100)},
        "letter_spacing": {preset_data.get('letter_spacing', 0)},
        "italic": {preset_data.get('italic', 0)},
        "underline": {preset_data.get('underline', 0)},
        "strikeout": {preset_data.get('strikeout', 0)},
        "effect_type": "{preset_data.get('effect_type', 'bulge')}",
        "effect_config": {effect_config_str},
        "id": "{preset_id}"
    }}'''
    else:
        new_preset = f'''"{preset_id}": {{
        "font": "{preset_data.get('font', 'Poppins')}",
        "primary_color": "{preset_data.get('primary_color', '&H00FFFFFF')}",
        "secondary_color": "{preset_data.get('secondary_color', '&H0000FFFF')}",
        "outline_color": "{preset_data.get('outline_color', '&H00000000')}",
        "shadow_color": "{preset_data.get('shadow_color', '&H00000000')}",
        "font_size": {preset_data.get('font_size', 64)},
        "letter_spacing": {preset_data.get('letter_spacing', 0)},
        "bold": {preset_data.get('bold', 1)},
        "italic": {preset_data.get('italic', 0)},
        "underline": {preset_data.get('underline', 0)},
        "strikeout": {preset_data.get('strikeout', 0)},
        "border": {preset_data.get('border', 2)},
        "shadow": {preset_data.get('shadow', 0)},
        "blur": {preset_data.get('blur', 0)},
        "opacity": {preset_data.get('opacity', 100)},
        "rotation": {preset_data.get('rotation', 0)},
        "rotation_x": {preset_data.get('rotation_x', 0)},
        "rotation_y": {preset_data.get('rotation_y', 0)},
        "shear": {preset_data.get('shear', 0)},
        "scale_x": {preset_data.get('scale_x', 100)},
        "scale_y": {preset_data.get('scale_y', 100)},
        "alignment": {preset_data.get('alignment', 2)},
        "margin_v": {preset_data.get('margin_v', 40)},
        "margin_l": {preset_data.get('margin_l', 10)},
        "margin_r": {preset_data.get('margin_r', 10)},
        "id": "{preset_id}"
    }}'''
    
    # Find and replace the preset - use a more robust pattern that handles multi-line
    # Search for the preset definition with regex
    pattern = rf'"{preset_id}":\s*\{{[^{{]*?(?:\{{[^{{]*?\}})*[^{{]*?\}}'
    updated_content = re.sub(pattern, new_preset, content, flags=re.DOTALL)
    
    # Write back
    main_py_path.write_text(updated_content, encoding='utf-8')


def add_preset_to_main_py(preset_id: str, preset_data: dict):
    """Add a new preset to main.py file"""
    main_py_path = Path(__file__).resolve()
    content = main_py_path.read_text(encoding='utf-8')
    
    # For PyonFX presets, include effect_type and effect_config
    is_pyonfx = preset_id.startswith("pyonfx-") or preset_data.get("effect_type")
    
    # Create new preset block with all parameters
    if is_pyonfx:
        effect_config = preset_data.get('effect_config', {})
        import json
        effect_config_str = json.dumps(effect_config)
        
        new_preset = f''',
    "{preset_id}": {{
        "font": "{preset_data.get('font', 'Arial')}",
        "primary_color": "{preset_data.get('primary_color', '&H00FFFFFF')}",
        "secondary_color": "{preset_data.get('secondary_color', '&H00000000')}",
        "outline_color": "{preset_data.get('outline_color', '&H00000000')}",
        "shadow_color": "{preset_data.get('shadow_color', '&H80000000')}",
        "font_size": {preset_data.get('font_size', 64)},
        "bold": {preset_data.get('bold', 1)},
        "border": {preset_data.get('border', 2)},
        "shadow_blur": {preset_data.get('shadow_blur', 0)},
        "alignment": {preset_data.get('alignment', 5)},
        "margin_l": {preset_data.get('margin_l', 10)},
        "margin_r": {preset_data.get('margin_r', 10)},
        "margin_v": {preset_data.get('margin_v', 10)},
        "opacity": {preset_data.get('opacity', 100)},
        "letter_spacing": {preset_data.get('letter_spacing', 0)},
        "italic": {preset_data.get('italic', 0)},
        "underline": {preset_data.get('underline', 0)},
        "strikeout": {preset_data.get('strikeout', 0)},
        "effect_type": "{preset_data.get('effect_type', 'bulge')}",
        "effect_config": {effect_config_str},
        "id": "{preset_id}"
    }}'''
    else:
        new_preset = f''',
    "{preset_id}": {{
        "font": "{preset_data.get('font', 'Poppins')}",
        "primary_color": "{preset_data.get('primary_color', '&H00FFFFFF')}",
        "secondary_color": "{preset_data.get('secondary_color', '&H0000FFFF')}",
        "outline_color": "{preset_data.get('outline_color', '&H00000000')}",
        "shadow_color": "{preset_data.get('shadow_color', '&H00000000')}",
        "font_size": {preset_data.get('font_size', 64)},
        "letter_spacing": {preset_data.get('letter_spacing', 0)},
        "bold": {preset_data.get('bold', 1)},
        "italic": {preset_data.get('italic', 0)},
        "underline": {preset_data.get('underline', 0)},
        "strikeout": {preset_data.get('strikeout', 0)},
        "border": {preset_data.get('border', 2)},
        "shadow": {preset_data.get('shadow', 0)},
        "blur": {preset_data.get('blur', 0)},
        "opacity": {preset_data.get('opacity', 100)},
        "rotation": {preset_data.get('rotation', 0)},
        "rotation_x": {preset_data.get('rotation_x', 0)},
        "rotation_y": {preset_data.get('rotation_y', 0)},
        "shear": {preset_data.get('shear', 0)},
        "scale_x": {preset_data.get('scale_x', 100)},
        "scale_y": {preset_data.get('scale_y', 100)},
        "alignment": {preset_data.get('alignment', 2)},
        "margin_v": {preset_data.get('margin_v', 40)},
        "margin_l": {preset_data.get('margin_l', 10)},
        "margin_r": {preset_data.get('margin_r', 10)},
        "id": "{preset_id}"
    }}'''
    
    # Find the end of PRESET_STYLE_MAP and insert before closing brace
    pattern = r'(PRESET_STYLE_MAP\s*=\s*\{.*?)(\n\})'
    updated_content = re.sub(pattern, rf'\1{new_preset}\2', content, flags=re.DOTALL)
    
    # Write back
    main_py_path.write_text(updated_content, encoding='utf-8')


@app.get("/api/aaspresets/list")
async def list_aaspresets():
    """
    List all available AASPresets
    """
    try:
        aaspresets_dir = Path(__file__).resolve().parent.parent / "aaspresets"
        if not aaspresets_dir.exists():
            return JSONResponse(content=[])
        
        presets = []
        for ass_file in aaspresets_dir.rglob("*.ass"):
            relative_path = str(ass_file.relative_to(aaspresets_dir))
            presets.append({
                "name": ass_file.stem,
                "path": relative_path,
                "full_path": str(ass_file)
            })
        
        return JSONResponse(content=sorted(presets, key=lambda x: x['name']))
    except Exception as e:
        print(f"List AASPresets Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/aaspresets/extract-style")
async def extract_aas_style(request: Request):
    """
    Extract style from an AAS file and convert to PyCaps preset format
    """
    try:
        data = await request.json()
        file_path = data.get("path")
        
        if not file_path:
            raise HTTPException(status_code=400, detail="File path is required")
            
        # Construct full path
        aaspresets_dir = Path(__file__).resolve().parent.parent / "aaspresets"
        full_path = aaspresets_dir / file_path
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
            
        content = full_path.read_text(encoding='utf-8')
        
        # Parse ASS content
        style_section = re.search(r'\[V4\+ Styles\](.*?)(?:\[|$)', content, re.DOTALL)
        if not style_section:
            raise HTTPException(status_code=400, detail="No [V4+ Styles] section found")
            
        section_content = style_section.group(1)
        
        # Get format line
        format_match = re.search(r'Format:\s*(.*)', section_content)
        if not format_match:
            raise HTTPException(status_code=400, detail="No Format line found")
            
        format_cols = [c.strip() for c in format_match.group(1).split(',')]
        
        # Get first style line (assuming we want the first style found, usually Default or specific)
        # We look for a Style: line that is NOT Default if possible, or just the first one
        style_matches = list(re.finditer(r'Style:\s*(.*)', section_content))
        
        if not style_matches:
            raise HTTPException(status_code=400, detail="No Style definitions found")
            
        # Prefer non-Default style if available, otherwise take the last one (often the most specific)
        target_style_line = style_matches[-1].group(1)
        style_values = [v.strip() for v in target_style_line.split(',')]
        
        # Map columns to values
        style_map = {}
        if len(format_cols) == len(style_values):
            style_map = dict(zip(format_cols, style_values))
        else:
            # Handle potential mismatch if commas in font name etc (basic handling)
            # For now assume standard ASS format
            style_map = dict(zip(format_cols, style_values[:len(format_cols)]))
            
        # Convert to PyCaps preset format
        preset = {
            "font": style_map.get("Fontname", "Arial"),
            "font_size": float(style_map.get("Fontsize", 64)),
            "primary_color": style_map.get("PrimaryColour", "&H00FFFFFF"),
            "secondary_color": style_map.get("SecondaryColour", "&H0000FFFF"),
            "outline_color": style_map.get("OutlineColour", "&H00000000"),
            "shadow_color": style_map.get("BackColour", "&H00000000"),
            "bold": 1 if style_map.get("Bold") == "-1" or style_map.get("Bold") == "1" else 0,
            "italic": 1 if style_map.get("Italic") == "-1" or style_map.get("Italic") == "1" else 0,
            "underline": -1 if style_map.get("Underline") == "-1" or style_map.get("Underline") == "1" else 0,
            "strikeout": -1 if style_map.get("StrikeOut") == "-1" or style_map.get("StrikeOut") == "1" else 0,
            "scale_x": float(style_map.get("ScaleX", 100)),
            "scale_y": float(style_map.get("ScaleY", 100)),
            "letter_spacing": float(style_map.get("Spacing", 0)),
            "rotation": float(style_map.get("Angle", 0)),
            "border": float(style_map.get("Outline", 2)),
            "shadow": float(style_map.get("Shadow", 0)),
            "alignment": int(style_map.get("Alignment", 2)),
            "margin_l": int(style_map.get("MarginL", 10)),
            "margin_r": int(style_map.get("MarginR", 10)),
            "margin_v": int(style_map.get("MarginV", 10)),
            # Default values for properties not in standard ASS Style but supported by PyCaps
            "blur": 0,
            "rotation_x": 0,
            "rotation_y": 0,
            "shear": 0
        }
        
        return JSONResponse(content=preset)
        
    except Exception as e:
        print(f"Extract Style Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/pyonfx/effects")
async def get_pyonfx_effects():
    """
    Returns available PyonFX effects and their configurations
    """
    try:
        effects = {
            "bulge": {
                "name": "Bulge Effect",
                "description": "Creates a bulging/magnifier distortion on text",
                "config": {
                    "intensity": {
                        "type": "number",
                        "min": 0,
                        "max": 2.0,
                        "default": 1.5,
                        "description": "How strong the bulge effect is"
                    },
                    "blur": {
                        "type": "number",
                        "min": 0,
                        "max": 2.0,
                        "default": 0.2,
                        "description": "Blur amount for smoothness"
                    }
                }
            },
            "shake": {
                "name": "Shake Effect",
                "description": "Makes text shake/vibrate rapidly",
                "config": {
                    "intensity": {
                        "type": "number",
                        "min": 0,
                        "max": 50.0,
                        "default": 10.0,
                        "description": "How far the text shakes (pixels)"
                    },
                    "frequency": {
                        "type": "number",
                        "min": 1,
                        "max": 50.0,
                        "default": 20.0,
                        "description": "How fast it shakes (Hz)"
                    }
                }
            },
            "wave": {
                "name": "Wave Effect",
                "description": "Creates a wave/ripple motion across text",
                "config": {
                    "amplitude": {
                        "type": "number",
                        "min": 0,
                        "max": 100.0,
                        "default": 25.0,
                        "description": "Height of wave (pixels)"
                    },
                    "wavelength": {
                        "type": "number",
                        "min": 20,
                        "max": 300.0,
                        "default": 80.0,
                        "description": "Distance between wave peaks (pixels)"
                    }
                }
            },
            "chromatic": {
                "name": "Chromatic Aberration",
                "description": "Splits color channels creating glitch/distortion effect",
                "config": {
                    "shift_amount": {
                        "type": "number",
                        "min": 0,
                        "max": 20.0,
                        "default": 4.0,
                        "description": "How much channels are shifted (pixels)"
                    }
                }
            }
        }
        return JSONResponse(content=effects)
    except Exception as e:
        print(f"Get PyonFX Effects Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pyonfx/preview")
async def preview_pyonfx_effect(
    words_json: str = Form(...),
    effect_type: str = Form("bulge"),
    effect_config_json: str = Form("{}"),
):
    """
    Preview a PyonFX effect without burning video
    """
    try:
        words = json.loads(words_json)
        effect_config = json.loads(effect_config_json)
        
        style = {
            "effect_type": effect_type,
            "font": "Arial",
            "font_size": 64,
            "primary_color": "&H00FFFFFF",
            "outline_color": "&H00000000",
            "bold": 1,
            "border": 2,
            "effect_config": effect_config,
        }
        
        renderer = PyonFXRenderer(words, style)
        ass_content = renderer.render()
        
        return Response(content=ass_content, media_type="text/plain")
    except Exception as e:
        print(f"PyonFX Preview Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import base64

@app.delete("/api/presets/{preset_id}")
async def delete_preset(preset_id: str):
    """
    Delete a preset from main.py
    """
    try:
        main_py_path = Path(__file__).resolve()
        content = main_py_path.read_text(encoding='utf-8')
        
        # Regex to find the preset block
        # Matches "preset_id": { ... }
        # We need to be careful to match the correct block including nested braces
        # A simple regex might fail if there are nested braces, but our presets are simple dicts
        # We'll assume standard formatting as generated by this script
        
        # Pattern: "preset_id":\s*\{[^}]+\},?
        pattern = rf'"{re.escape(preset_id)}":\s*\{{[^}}]+\}},?\s*'
        
        if not re.search(pattern, content):
            raise HTTPException(status_code=404, detail="Preset not found")
            
        # Remove the preset
        updated_content = re.sub(pattern, '', content)
        
        # Clean up potential double commas or trailing commas if needed
        # (Simple cleanup, might need more robust parsing if file is messy)
        
        main_py_path.write_text(updated_content, encoding='utf-8')
        
        return {"message": f"Preset {preset_id} deleted successfully"}
        
    except Exception as e:
        print(f"Delete Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/presets/screenshot")
async def save_preset_screenshot(request: Request):
    """
    Save a screenshot of the preset preview
    """
    try:
        data = await request.json()
        preset_id = data.get("id")
        image_data = data.get("image")
        
        if not preset_id or not image_data:
            raise HTTPException(status_code=400, detail="ID and image data required")
            
        # Remove header if present (data:image/png;base64,...)
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
            
        # Decode image
        image_bytes = base64.b64decode(image_data)
        
        # Define path: frontend/public/presets-image
        # Assuming backend is in backend/ and frontend is in frontend/
        frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
        images_dir = frontend_dir / "public" / "sspresets"
        images_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = images_dir / f"{preset_id}.png"
        
        file_path.write_bytes(image_bytes)
        
        return {"message": f"Screenshot saved to {file_path}", "path": f"/sspresets/{preset_id}.png"}
        
    except Exception as e:
        print(f"Screenshot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
