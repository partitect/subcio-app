import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
import hashlib
import sys
import asyncio
import threading
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import ImageFont
from enum import Enum
from dataclasses import dataclass, field, asdict

from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, HTTPException, Response, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import mimetypes
# Lazy import for faster_whisper to avoid numpy compatibility issues at startup
# from faster_whisper import WhisperModel
import uvicorn

# Import and setup logging system
try:
    from .logging_config import (
        setup_logging, get_logger, RequestLoggingMiddleware,
        api_logger, auth_logger, transcription_logger, export_logger
    )
except ImportError:
    from logging_config import (
        setup_logging, get_logger, RequestLoggingMiddleware,
        api_logger, auth_logger, transcription_logger, export_logger
    )

# Setup main logger
logger = setup_logging("subcio")

# Ensure package imports work when run as script (uvicorn main:app)
if __package__ in (None, ""):
    sys.path.append(str(Path(__file__).resolve().parent))
    sys.path.append(str(Path(__file__).resolve().parent.parent))

# PyonFX Effects Integration
# PyonFX Effects Integration
try:
    from .styles.effects import PyonFXRenderer, PyonFXStyleBuilder
    from .data_store import load_presets, save_presets, load_effects
except ImportError:
    from styles.effects import PyonFXRenderer, PyonFXStyleBuilder
    from data_store import load_presets, save_presets, load_effects
PYONFX_EFFECT_TYPES = set(PyonFXRenderer.EFFECTS.keys())

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
DEFAULT_MODEL = os.getenv("WHISPER_MODEL", "small")  # Use 'small' for lower memory usage
DEVICE = "cuda" if shutil.which("nvidia-smi") else "cpu"
MODEL_CACHE: dict[str, Any] = {}  # WhisperModel instances, lazy loaded
OUTPUT_DIR = Path(__file__).resolve().parent / "exports"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
FONTS_DIR = Path(__file__).resolve().parent / "fonts"
FONTS_DIR.mkdir(parents=True, exist_ok=True)
PROJECTS_DIR = Path(__file__).resolve().parent / "projects"
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# Batch Export System
# -----------------------------------------------------------------------------
class ExportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

# Video export codecs and their settings
VIDEO_CODECS = {
    "h264": {
        "encoder": "libx264",
        "preset": "veryfast",
        "profile": "high",
        "format": "mp4",
    },
    "h265": {
        "encoder": "libx265",
        "preset": "medium",
        "profile": "main",
        "format": "mp4",
    },
    "vp9": {
        "encoder": "libvpx-vp9",
        "preset": None,
        "profile": None,
        "format": "webm",
    },
}

# Resolution presets
RESOLUTION_PRESETS = {
    "original": {"width": None, "height": None, "label": "Original"},
    "720p": {"width": 1280, "height": 720, "label": "HD 720p"},
    "1080p": {"width": 1920, "height": 1080, "label": "Full HD 1080p"},
    "1440p": {"width": 2560, "height": 1440, "label": "QHD 1440p"},
    "4k": {"width": 3840, "height": 2160, "label": "4K UHD"},
}

# Bitrate presets (in kbps)
BITRATE_PRESETS = {
    "low": {"video": 2500, "audio": 128, "label": "Low (2.5 Mbps)"},
    "medium": {"video": 5000, "audio": 192, "label": "Medium (5 Mbps)"},
    "high": {"video": 10000, "audio": 256, "label": "High (10 Mbps)"},
    "ultra": {"video": 20000, "audio": 320, "label": "Ultra (20 Mbps)"},
    "custom": {"video": None, "audio": None, "label": "Custom"},
}

@dataclass
class ExportJob:
    id: str
    project_id: str
    project_name: str
    status: ExportStatus = ExportStatus.PENDING
    progress: float = 0.0
    output_path: Optional[str] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    resolution: str = "1080p"
    codec: str = "h264"
    bitrate: str = "medium"
    custom_bitrate: Optional[int] = None

@dataclass
class BatchExportQueue:
    id: str
    jobs: List[ExportJob] = field(default_factory=list)
    status: ExportStatus = ExportStatus.PENDING
    current_job_index: int = 0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    @property
    def completed_count(self) -> int:
        return sum(1 for j in self.jobs if j.status == ExportStatus.COMPLETED)
    
    @property
    def failed_count(self) -> int:
        return sum(1 for j in self.jobs if j.status == ExportStatus.FAILED)
    
    @property
    def total_progress(self) -> float:
        if not self.jobs:
            return 0.0
        completed = sum(1 for j in self.jobs if j.status in [ExportStatus.COMPLETED, ExportStatus.FAILED])
        current_progress = 0.0
        for j in self.jobs:
            if j.status == ExportStatus.PROCESSING:
                current_progress = j.progress
                break
        return ((completed + current_progress / 100) / len(self.jobs)) * 100

# Global batch export storage
BATCH_EXPORTS: Dict[str, BatchExportQueue] = {}
BATCH_EXPORT_LOCK = threading.Lock()


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


PRESET_STYLE_MAP = load_presets()

def build_style(incoming_style: dict) -> dict:
    """Merge preset defaults with incoming style and normalize font."""
    style_id = incoming_style.get("id")
    merged = {**PRESET_STYLE_MAP.get(style_id, {}), **incoming_style}
    if not merged.get("font") or not font_in_pool(merged["font"]):
        merged["font"] = pick_font_for_preset(style_id or "default")
    merged["font"] = resolve_font_name(merged["font"])
    return merged


def render_ass_content(words: list, style: dict) -> str:
    """Render ASS using PyonFX renderer."""
    renderer = PyonFXRenderer(words, style)
    return renderer.render()



# Normalize preset fonts to current pool only if missing/invalid so manual choices stick
for _pid, _pstyle in PRESET_STYLE_MAP.items():
    if not _pstyle.get("font") or not font_in_pool(_pstyle["font"]):
        _pstyle["font"] = pick_font_for_preset(_pid)


def get_model(model_name: str) -> Any:
    """Lazy load WhisperModel to avoid numpy compatibility issues at startup."""
    from faster_whisper import WhisperModel
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
    margin_l = style.get("margin_l", 20)
    margin_r = style.get("margin_r", 20)
    style_id = style.get("id", "default")

    # Animation tags based on preset
    anim_tags = get_animation_tags(style_id)
    
    # Calculate Y position based on alignment and margin_v
    # PlayResY = 1080, PlayResX = 1920
    play_res_y = 1080
    play_res_x = 1920
    
    # Calculate Y position for \pos tag
    # Alignment: 1,2,3 = bottom, 4,5,6 = middle, 7,8,9 = top
    if alignment in [1, 2, 3]:  # Bottom
        y_pos = play_res_y - margin_v
    elif alignment in [4, 5, 6]:  # Middle  
        y_pos = (play_res_y // 2) + (margin_v - 150)
    else:  # Top (7, 8, 9)
        y_pos = margin_v
    
    # X position based on horizontal alignment
    if alignment in [1, 4, 7]:  # Left
        x_pos = margin_l + 100
    elif alignment in [3, 6, 9]:  # Right
        x_pos = play_res_x - margin_r - 100
    else:  # Center (2, 5, 8)
        x_pos = play_res_x // 2
    
    pos_tag = f"\\pos({x_pos},{y_pos})"

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Styled, {font}, {size}, {color_primary}, &H000000FF, {color_outline}, {color_back}, {bold}, {italic}, 0, 0, 100, 100, 0, 0, {border_style}, {border}, {shadow}, {alignment}, {margin_l}, {margin_r}, {margin_v}, 0

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
        
        # Add position tag and animation tags
        text = f"{{{pos_tag}\\k{duration_cs}{anim_tags}}}{safe_text}"
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


def run_ffmpeg_burn(
    video_path: Path, 
    ass_path: Path, 
    output_path: Path, 
    resolution: str = "1080p",
    codec: str = "h264",
    bitrate: str = "medium",
    custom_bitrate: Optional[int] = None
):
    """
    Burn subtitles into video with configurable quality settings.
    
    Args:
        video_path: Input video file path
        ass_path: ASS subtitle file path
        output_path: Output video file path
        resolution: Resolution preset (original, 720p, 1080p, 1440p, 4k)
        codec: Video codec (h264, h265, vp9)
        bitrate: Bitrate preset (low, medium, high, ultra, custom)
        custom_bitrate: Custom video bitrate in kbps (when bitrate="custom")
    """
    # Get resolution settings
    res_config = RESOLUTION_PRESETS.get(resolution, RESOLUTION_PRESETS["1080p"])
    if res_config["width"] and res_config["height"]:
        w, h = res_config["width"], res_config["height"]
        scale_filter = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:({w}-iw)/2:({h}-ih)/2"
    else:
        scale_filter = "scale=iw:ih"
    
    # Get codec settings
    codec_config = VIDEO_CODECS.get(codec, VIDEO_CODECS["h264"])
    encoder = codec_config["encoder"]
    
    # Get bitrate settings
    bitrate_config = BITRATE_PRESETS.get(bitrate, BITRATE_PRESETS["medium"])
    video_bitrate = custom_bitrate if bitrate == "custom" and custom_bitrate else bitrate_config["video"]
    audio_bitrate = bitrate_config["audio"] or 192

    # Escape path for ffmpeg ass filter
    # On Windows, colons in drive letters need escaping (C: -> C\:)
    # On Linux, no escaping needed
    import platform
    if platform.system() == "Windows":
        ass_path_str = ass_path.as_posix().replace(":", r"\:")
        fonts_dir_str = FONTS_DIR.as_posix().replace(":", r"\:")
    else:
        ass_path_str = str(ass_path)
        fonts_dir_str = str(FONTS_DIR)
    
    vf = f"ass='{ass_path_str}':fontsdir='{fonts_dir_str}',{scale_filter}"
    
    # Build FFmpeg command with memory-optimized settings for low-RAM environments
    cmd = [
        "ffmpeg",
        "-y",
        "-threads", "1",  # Limit threads to reduce memory usage
        "-i", str(video_path),
        "-vf", vf,
        "-c:v", encoder,
    ]
    
    # Add codec-specific options (memory-optimized for Railway free tier)
    if codec == "h264":
        cmd.extend([
            "-preset", "ultrafast",  # Fastest preset, lowest memory
            "-tune", "fastdecode",   # Optimize for fast decoding
            "-profile:v", "baseline",  # Simpler profile, less memory
            "-level", "3.1",
            "-maxrate", "2M",  # Limit max bitrate
            "-bufsize", "1M",  # Smaller buffer
        ])
    elif codec == "h265":
        cmd.extend([
            "-preset", "ultrafast",
            "-tag:v", "hvc1",
        ])
    elif codec == "vp9":
        cmd.extend([
            "-deadline", "realtime",  # Fastest
            "-cpu-used", "8",  # Max speed
        ])
    
    # Add bitrate settings
    if video_bitrate:
        cmd.extend(["-b:v", f"{video_bitrate}k"])
    else:
        # Use CRF for quality-based encoding (default)
        if codec == "h264":
            cmd.extend(["-crf", "18"])
        elif codec == "h265":
            cmd.extend(["-crf", "23"])
        elif codec == "vp9":
            cmd.extend(["-crf", "30", "-b:v", "0"])
    
    # Audio settings
    if codec == "vp9":
        cmd.extend(["-c:a", "libopus", "-b:a", f"{audio_bitrate}k"])
    else:
        cmd.extend(["-c:a", "aac", "-b:a", f"{audio_bitrate}k"])
    
    # Output path - adjust extension based on codec
    output_ext = codec_config["format"]
    if output_path.suffix.lower() != f".{output_ext}":
        output_path = output_path.with_suffix(f".{output_ext}")
    
    cmd.append(str(output_path))
    
    logger.info(f"Running FFmpeg command: {' '.join(cmd[:10])}...")  # Log first 10 args
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)  # 10 min timeout
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=500,
            detail="FFmpeg timed out after 10 minutes. Try a shorter video or lower resolution.",
        )
    
    if result.returncode != 0:
        # Get the last 500 chars of stderr which contains the actual error
        stderr_tail = result.stderr[-1500:] if len(result.stderr) > 1500 else result.stderr
        # Find actual error lines (usually at the end)
        error_lines = [line for line in stderr_tail.split('\n') if line.strip() and not line.startswith('  ')]
        actual_error = '\n'.join(error_lines[-10:])  # Last 10 meaningful lines
        logger.error(f"FFmpeg failed with return code {result.returncode}")
        logger.error(f"FFmpeg error: {actual_error}")
        raise HTTPException(
            status_code=500,
            detail=f"FFmpeg failed: {actual_error[:500]}",
        )
    
    return output_path


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


# Audio file extensions
AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac", ".wma"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".wmv", ".flv"}

def is_audio_file(file_path: Path) -> bool:
    """Check if file is an audio-only file."""
    return file_path.suffix.lower() in AUDIO_EXTENSIONS

def is_video_file(file_path: Path) -> bool:
    """Check if file is a video file."""
    return file_path.suffix.lower() in VIDEO_EXTENSIONS

def persist_project(
    media_path: Path,
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

    # Determine media type
    is_audio = is_audio_file(media_path)
    media_type = "audio" if is_audio else "video"
    
    # Store media with appropriate extension
    if is_audio:
        stored_media = project_dir / f"audio{media_path.suffix.lower()}"
    else:
        stored_media = project_dir / "video.mp4"
    
    if media_path.resolve() != stored_media.resolve():
        shutil.copy(media_path, stored_media)

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
        "name": name or media_path.stem,
        "created_at": created_at,
        "style": style or {},
        "language": language,
        "model": model,
        "media_type": media_type,
    }
    (project_dir / "config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")

    thumb_path = project_dir / "thumb.jpg"
    if not is_audio:
        try:
            generate_thumbnail(stored_media, thumb_path)
        except Exception as thumb_err:
            print(f"[WARN] Failed to create thumbnail for {pid}: {thumb_err}")

    # Build response based on media type
    media_url = f"/projects/{pid}/{stored_media.name}"
    return {
        "id": pid,
        "name": config["name"],
        "created_at": created_at,
        "media_type": media_type,
        "video_url": media_url if not is_audio else None,
        "audio_url": media_url if is_audio else None,
        "thumb_url": f"/projects/{pid}/thumb.jpg" if not is_audio else None,
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
        
        # Detect audio files
        audio_file = None
        for ext in AUDIO_EXTENSIONS:
            candidate = path / f"audio{ext}"
            if candidate.exists():
                audio_file = candidate
                break
        
        media_type = config.get("media_type", "video" if video.exists() else ("audio" if audio_file else "video"))
        
        projects.append(
            {
                "id": path.name,
                "name": config.get("name", path.name),
                "created_at": config.get("created_at"),
                "media_type": media_type,
                "thumb_url": f"/projects/{path.name}/thumb.jpg" if thumb.exists() else None,
                "video_url": f"/projects/{path.name}/video.mp4" if video.exists() else None,
                "audio_url": f"/projects/{path.name}/{audio_file.name}" if audio_file else None,
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

    # Detect audio files
    audio_file = None
    for ext in AUDIO_EXTENSIONS:
        candidate = project_dir / f"audio{ext}"
        if candidate.exists():
            audio_file = candidate
            break
    
    media_type = config.get("media_type", "video" if video_path.exists() else ("audio" if audio_file else "video"))

    return {
        "id": project_id,
        "name": config.get("name", project_id),
        "created_at": config.get("created_at"),
        "words": subtitles,
        "transcript": transcript,
        "config": config,
        "media_type": media_type,
        "video_url": f"/projects/{project_id}/video.mp4" if video_path.exists() else None,
        "audio_url": f"/projects/{project_id}/{audio_file.name}" if audio_file else None,
        "thumb_url": f"/projects/{project_id}/thumb.jpg" if thumb_path.exists() else None,
    }


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(title="Subcio API", version="1.0.0")

# CORS Configuration for Electron desktop mode
# file:// protocol sends null origin, so we need to allow all origins
ALLOWED_ORIGINS = ["*"]
print(f"[INFO] CORS enabled for Electron desktop mode")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_credentials=False,  # credentials not compatible with *
    allow_headers=["*"],
    expose_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for application status."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "subcio-desktop"
    }

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    # init_db()  # Auth DB removed
    logger.info("Subcio API started")
    logger.info("Security middleware active")
    logger.info("Request logging enabled")

# Request logging middleware
from starlette.middleware.base import BaseHTTPMiddleware
import time as _time
import uuid as _uuid

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(_uuid.uuid4())[:8]
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip static and health endpoints
        if path in ["/health", "/favicon.ico", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        start_time = _time.time()
        logger.info(f"[{request_id}] --> {method} {path} | IP: {client_ip}")
        
        try:
            response = await call_next(request)
            duration = (_time.time() - start_time) * 1000
            
            status = response.status_code
            status_text = "OK" if status < 300 else "REDIRECT" if status < 400 else "WARN" if status < 500 else "ERROR"
            logger.info(f"[{request_id}] <-- {method} {path} | {status_text} {status} | {duration:.1f}ms")
            
            return response
        except Exception as e:
            duration = (_time.time() - start_time) * 1000
            logger.error(f"[{request_id}] !!! {method} {path} | ERROR: {str(e)[:100]} | {duration:.1f}ms")
            raise

app.add_middleware(LoggingMiddleware)

# Security middleware - runs after CORS (middleware order is reversed in starlette)
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Global security middleware for headers."""
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    return response

# Projects static files with CORS
projects_static = StaticFiles(directory=PROJECTS_DIR)
projects_cors = CORSMiddleware(
    app=projects_static,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.mount("/projects", projects_cors, name="projects")

# Rate Limiting setup
# Rate Limiting and Routers removed for Desktop mode

# -----------------------------------------------------------------------------
# Byte-range video streaming endpoint (enables seeking)
# -----------------------------------------------------------------------------
def ranged_file_response(file_path: Path, range_header: str | None, content_type: str):
    """Generate a streaming response with byte-range support for video seeking."""
    file_size = file_path.stat().st_size
    
    if range_header:
        # Parse Range header: "bytes=start-end" or "bytes=start-"
        range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if range_match:
            start = int(range_match.group(1))
            end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            end = min(end, file_size - 1)
            
            chunk_size = end - start + 1
            
            def iterfile():
                with open(file_path, "rb") as f:
                    f.seek(start)
                    remaining = chunk_size
                    while remaining > 0:
                        read_size = min(64 * 1024, remaining)  # 64KB chunks
                        data = f.read(read_size)
                        if not data:
                            break
                        remaining -= len(data)
                        yield data
            
            return StreamingResponse(
                iterfile(),
                status_code=206,
                media_type=content_type,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(chunk_size),
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
                },
            )
    
    # No range header - return full file
    def iterfile():
        with open(file_path, "rb") as f:
            while chunk := f.read(64 * 1024):
                yield chunk
    
    return StreamingResponse(
        iterfile(),
        media_type=content_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
        },
    )


@app.get("/stream/{project_id}/{filename}")
async def stream_media(project_id: str, filename: str, range: str | None = Header(None)):
    """Stream video/audio files with byte-range support for seeking."""
    file_path = PROJECTS_DIR / project_id / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = "application/octet-stream"
    
    return ranged_file_response(file_path, range, content_type)


@app.options("/stream/{project_id}/{filename}")
async def stream_media_options():
    """Handle CORS preflight for stream endpoint."""
    return Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range",
            "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
        }
    )

@app.middleware("http")
async def enforce_projects_cors(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/projects/"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers.setdefault("Access-Control-Allow-Headers", "*")
        response.headers.setdefault("Access-Control-Allow-Methods", "GET, OPTIONS")
    return response


# File upload constraints
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 500 * 1024 * 1024))  # 500MB default
ALLOWED_UPLOAD_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav", ".m4a", ".flac", ".ogg"}


def validate_upload_file(filename: str, content_length: str | int | None = None) -> None:
    """Validate uploaded file type and size."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}"
        )
    # Convert content_length to int if it's a string
    if content_length:
        try:
            size = int(content_length)
            if size > MAX_UPLOAD_SIZE:
                max_mb = MAX_UPLOAD_SIZE // (1024 * 1024)
                raise HTTPException(
                    status_code=413,
                    detail=f"File too large. Maximum size: {max_mb}MB"
                )
        except (ValueError, TypeError):
            pass  # Ignore invalid content-length


@app.post("/api/transcribe")
async def transcribe(
    request: Request,
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
    Uses local Whisper model for transcription (Electron desktop mode).
    """
    # Validate file type
    validate_upload_file(file.filename, request.headers.get("content-length"))
    
    with tempfile.TemporaryDirectory() as tmpdir:
        in_path = Path(tmpdir) / file.filename
        
        # Read file with size check
        content = await file.read()
        if len(content) > MAX_UPLOAD_SIZE:
            max_mb = MAX_UPLOAD_SIZE // (1024 * 1024)
            raise HTTPException(status_code=413, detail=f"File too large. Maximum size: {max_mb}MB")
        
        with in_path.open("wb") as f:
            f.write(content)

        words = []
        detected_language = language or "auto"
        
        # Use local Whisper model (Electron desktop mode)
        logger.info(f"Using local Whisper model: {model_name}")
        model = get_model(model_name)
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
        for seg in segments:
            for w in seg.words:
                clean_text = w.word.strip()
                clean_text = clean_text.strip('.,!?;:"\'-()[]{}')
                if not clean_text:
                    continue
                words.append({
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "text": clean_text,
                    "confidence": round(getattr(w, "probability", 0) or 0, 3),
                })
        detected_language = info.language or language or "auto"
        
        project_meta = persist_project(
            in_path,
            words,
            detected_language,
            model_name,
            name=file.filename,
        )
    return JSONResponse(
        {
            "language": detected_language,
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
    resolution: str = Form("1080p"),  # Default to 1080p for desktop
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
    style = build_style(incoming_style)

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
    
    ass_content = render_ass_content(words, style)
        
    ass_path.write_text(ass_content, encoding="utf-8")

    out_path = OUTPUT_DIR / f"export_{uid}.mp4"
    try:
        logger.info(f"Starting FFmpeg burn: {in_path} -> {out_path}")
        run_ffmpeg_burn(in_path, ass_path, out_path, resolution)
        logger.info(f"FFmpeg burn completed successfully")
    except Exception as exc:  # return JSON so CORS headers still attach
        logger.error(f"FFmpeg burn failed: {exc}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        if cleanup_upload:
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
        filename="subcio_export.mp4",
        headers={
            "Content-Disposition": "attachment; filename=subcio_export.mp4"
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
        style = build_style(incoming_style)
        ass_content = render_ass_content(words, style)
            
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
    Uses local Whisper model for transcription (Electron desktop mode).
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        in_path = Path(tmpdir) / video.filename
        with in_path.open("wb") as f:
            f.write(await video.read())

        incoming_words = json.loads(words_json) if words_json else []
        detected_language = language or "auto"

        if not incoming_words:
            # Use local Whisper model (Electron desktop mode)
            logger.info(f"Using local Whisper model for project: {model_name}")
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
                    words.append({
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                        "text": clean_text,
                        "confidence": round(getattr(w, "probability", 0) or 0, 3),
                    })
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


@app.get("/api/effect-types")
async def get_effect_types():
    """
    Returns all available PyonFX effect types with metadata.
    """
    try:
        # Group effects by category for better organization
        effect_categories = {
            "basic": ["bulge", "shake", "wave", "chromatic", "fade_in_out", "slide_up", "zoom_burst", "bounce_in"],
            "fire": ["fire_storm", "phoenix_flames", "trending_fire"],
            "glitch": ["cyber_glitch", "pixel_glitch", "glitch_teleport", "horror_flicker"],
            "neon": ["neon_pulse", "neon_sign", "neon_flicker"],
            "nature": ["bubble_floral", "ocean_wave", "butterfly_dance", "sakura_dream", "tornado_spin", "underwater", "sand_storm"],
            "weather": ["thunder_strike", "thunder_storm", "ice_crystal", "freeze_crack", "lava_melt"],
            "cosmic": ["cosmic_stars", "matrix_rain", "ghost_star"],
            "electric": ["electric_shock", "rainbow_wave"],
            "smoke": ["smoke_trail"],
            "horror": ["horror_creepy", "earthquake_shake"],
            "luxury": ["luxury_gold"],
            "comic": ["comic_book"],
            "pulse": ["pulse", "colorful"],
            "tiktok": ["tiktok_yellow_box", "tiktok_group", "tiktok_box_group"],
            "karaoke": ["karaoke_classic", "karaoke_pro", "karaoke_sentence", "karaoke_sentence_fill", "underline_sweep", "box_slide", "karaoke_sentence_box", "dynamic_highlight"],
            "kinetic": ["kinetic_bounce", "word_pop", "spin_3d", "shear_force"],
            "cinematic": ["cinematic_blur", "movie_credits", "old_film", "action_impact", "dramatic_reveal"],
            "text": ["typewriter_pro", "news_ticker", "double_shadow", "retro_arcade"],
            "heart": ["falling_heart", "like_burst"],
            "magic": ["magic_spell", "portal_warp", "invisibility_cloak", "summon_appear", "fairy_dust"],
            "optical": ["hypnotic_spiral", "mirror_reflect", "shadow_clone", "echo_trail", "double_vision"],
            "action": ["slam_ground", "speed_lines", "power_up", "punch_hit", "explosion_entry"],
            "artistic": ["paint_brush", "graffiti_spray", "watercolor_bleed", "chalk_write"],
            "gaming": ["pixelate_form", "game_damage", "level_up", "coin_collect"],
            "social": ["story_swipe", "notification_pop", "viral_shake"],
            "party": ["disco_ball", "fireworks", "balloon_pop", "jackpot_spin", "party_mode"],
            "special": ["welcome_my_life", "mademyday"],
        }
        
        # Load effect configs from pyonfx_effects.json
        effect_configs = {}
        effects_json_path = Path(__file__).parent / "pyonfx_effects.json"
        if effects_json_path.exists():
            with open(effects_json_path, 'r', encoding='utf-8') as f:
                effect_configs = json.load(f)
        
        # Build effect list with metadata
        effects_list = []
        all_effect_keys = list(PYONFX_EFFECT_TYPES)
        
        for effect_key in sorted(all_effect_keys):
            # Find category
            category = "other"
            for cat, effects in effect_categories.items():
                if effect_key in effects:
                    category = cat
                    break
            
            # Get config schema from pyonfx_effects.json
            effect_info = effect_configs.get(effect_key, {})
            config_schema = effect_info.get("config", {})
            
            # Format display name
            display_name = effect_info.get("name", effect_key.replace("_", " ").title())
            description = effect_info.get("description", "")
            
            effects_list.append({
                "id": effect_key,
                "name": display_name,
                "category": category,
                "description": description,
                "config_schema": config_schema,
            })
        
        return JSONResponse(content={
            "effects": effects_list,
            "categories": list(effect_categories.keys()) + ["other"],
            "total": len(effects_list)
        })
    except Exception as e:
        print(f"Get Effect Types Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        
        # Check for screenshot thumbnails
        frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
        screenshots_dir = frontend_dir / "public" / "sspresets"
        
        # Load usage statistics
        usage_stats = load_preset_usage()
        
        for preset_id, preset_data in PRESET_STYLE_MAP.items():
            # Merge defaults with preset data (preset data takes precedence)
            complete_preset = {**defaults, **preset_data}
            complete_preset["font"] = pick_font_for_preset(preset_id)
            
            # Check if thumbnail exists
            thumbnail_path = screenshots_dir / f"{preset_id}.png"
            if thumbnail_path.exists():
                complete_preset["thumbnail"] = f"/sspresets/{preset_id}.png"
            
            # Add usage count
            complete_preset["usage_count"] = usage_stats.get(preset_id, 0)
            
            presets_list.append(complete_preset)
        
        # Sort by sort_order if present, then by id
        presets_list.sort(key=lambda p: (p.get("sort_order", 9999), p.get("id", "")))
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
        
        # Persist to presets.json
        save_presets(PRESET_STYLE_MAP)
        message = f"Preset '{preset_id}' updated and saved to presets.json"

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
        
        # Persist to presets.json
        save_presets(PRESET_STYLE_MAP)
        message = f"Preset '{preset_id}' created and saved to presets.json"
        
        return JSONResponse(content={
            "success": True,
            "message": message
        })
    except Exception as e:
        print(f"Create Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/presets/{preset_id}")
async def delete_preset(preset_id: str):
    """
    Deletes a preset by ID
    """
    try:
        if preset_id not in PRESET_STYLE_MAP:
            raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")
        
        # Remove from in-memory map
        del PRESET_STYLE_MAP[preset_id]
        
        # Persist to presets.json
        save_presets(PRESET_STYLE_MAP)
        message = f"Preset '{preset_id}' deleted"
        
        return JSONResponse(content={
            "success": True,
            "message": message
        })
    except Exception as e:
        print(f"Delete Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presets/reorder")
async def reorder_presets(request: Request):
    """
    Update sort_order for multiple presets at once
    """
    try:
        data = await request.json()
        orders = data.get("orders", [])  # List of {id: preset_id, sort_order: number}
        
        if not orders:
            raise HTTPException(status_code=400, detail="Orders list required")
        
        updated_count = 0
        for item in orders:
            preset_id = item.get("id")
            sort_order = item.get("sort_order", 0)
            
            if preset_id in PRESET_STYLE_MAP:
                PRESET_STYLE_MAP[preset_id]["sort_order"] = sort_order
                updated_count += 1
        
        if updated_count > 0:
            save_presets(PRESET_STYLE_MAP)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Updated order for {updated_count} presets"
        })
    except Exception as e:
        print(f"Reorder Presets Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Preset Usage Statistics
PRESET_USAGE_FILE = Path(__file__).parent / "preset_usage.json"

def load_preset_usage() -> dict:
    """Load usage statistics from file"""
    if PRESET_USAGE_FILE.exists():
        try:
            with open(PRESET_USAGE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_preset_usage(usage: dict):
    """Save usage statistics to file"""
    with open(PRESET_USAGE_FILE, 'w', encoding='utf-8') as f:
        json.dump(usage, f, indent=2)


@app.post("/api/presets/{preset_id}/track-usage")
async def track_preset_usage(preset_id: str):
    """
    Increment usage count for a preset
    """
    try:
        usage = load_preset_usage()
        usage[preset_id] = usage.get(preset_id, 0) + 1
        save_preset_usage(usage)
        
        return JSONResponse(content={
            "success": True,
            "preset_id": preset_id,
            "usage_count": usage[preset_id]
        })
    except Exception as e:
        print(f"Track Usage Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/presets/usage-stats")
async def get_preset_usage_stats():
    """
    Get usage statistics for all presets
    """
    try:
        usage = load_preset_usage()
        
        # Sort by usage count descending
        sorted_usage = sorted(usage.items(), key=lambda x: x[1], reverse=True)
        
        return JSONResponse(content={
            "stats": dict(sorted_usage),
            "total_uses": sum(usage.values()),
            "most_popular": sorted_usage[0] if sorted_usage else None
        })
    except Exception as e:
        print(f"Get Usage Stats Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presets/{preset_id}/screenshot")
async def take_preset_screenshot(preset_id: str):
    """
    Generates a screenshot/thumbnail for a preset
    """
    try:
        if preset_id not in PRESET_STYLE_MAP:
            raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")
        
        # TODO: Implement actual screenshot generation
        # This would render the preset style on a sample text and save as image
        
        return JSONResponse(content={
            "success": True,
            "message": f"Screenshot generated for '{preset_id}'",
            "thumbnail_url": f"/api/presets/{preset_id}/thumbnail.png"
        })
    except Exception as e:
        print(f"Screenshot Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    Extract style from an AAS file and convert to Subcio preset format
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
            
        # Convert to Subcio preset format
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
            # Default values for properties not in standard ASS Style but supported by Subcio
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
        effects = load_effects()
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
        
        ass_content = render_ass_content(words, style)
        
        return Response(content=ass_content, media_type="text/plain")
    except Exception as e:
        print(f"PyonFX Preview Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import base64

@app.delete("/api/presets/{preset_id}")
async def delete_preset(preset_id: str):
    """
    Delete a preset from presets.json
    """
    try:
        if preset_id not in PRESET_STYLE_MAP:
            raise HTTPException(status_code=404, detail="Preset not found")

        PRESET_STYLE_MAP.pop(preset_id, None)
        save_presets(PRESET_STYLE_MAP)

        return {"message": f"Preset {preset_id} deleted successfully"}
        
    except Exception as e:
        print(f"Delete Preset Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/presets/export")
async def export_presets():
    """
    Export all presets as JSON for backup/sharing
    """
    try:
        export_data = {
            "version": "1.0",
            "exported_at": datetime.datetime.now().isoformat(),
            "presets": dict(PRESET_STYLE_MAP)
        }
        
        return JSONResponse(
            content=export_data,
            headers={
                "Content-Disposition": "attachment; filename=presets_export.json"
            }
        )
    except Exception as e:
        print(f"Export Presets Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/presets/import")
async def import_presets(request: Request):
    """
    Import presets from JSON backup
    """
    try:
        data = await request.json()
        
        # Validate structure
        presets_data = data.get("presets", data)  # Support both wrapped and unwrapped format
        
        if not isinstance(presets_data, dict):
            raise HTTPException(status_code=400, detail="Invalid presets format. Expected object with preset IDs as keys.")
        
        imported_count = 0
        skipped_count = 0
        overwrite = data.get("overwrite", False)
        
        for preset_id, preset_config in presets_data.items():
            if not isinstance(preset_config, dict):
                continue
                
            # Check if preset already exists
            if preset_id in PRESET_STYLE_MAP and not overwrite:
                skipped_count += 1
                continue
            
            # Ensure preset has required fields
            preset_config["id"] = preset_id
            PRESET_STYLE_MAP[preset_id] = preset_config
            imported_count += 1
        
        # Save to file
        if imported_count > 0:
            save_presets(PRESET_STYLE_MAP)
        
        return JSONResponse(content={
            "success": True,
            "message": f"Imported {imported_count} presets, skipped {skipped_count} existing",
            "imported": imported_count,
            "skipped": skipped_count
        })
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        print(f"Import Presets Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Preset Categories Management
PRESET_CATEGORIES_FILE = Path(__file__).parent / "preset_categories.json"
DEFAULT_PRESET_CATEGORIES = [
    {"id": "tiktok", "label": "TikTok", "order": 1},
    {"id": "karaoke", "label": "Karaoke", "order": 2},
    {"id": "fire", "label": "Fire", "order": 3},
    {"id": "neon", "label": "Neon", "order": 4},
    {"id": "glitch", "label": "Glitch", "order": 5},
    {"id": "nature", "label": "Nature", "order": 6},
    {"id": "cinema", "label": "Cinema", "order": 7},
    {"id": "horror", "label": "Horror", "order": 8},
    {"id": "bounce", "label": "Bounce", "order": 9},
    {"id": "text", "label": "Text", "order": 10},
    {"id": "cosmic", "label": "Cosmic", "order": 11},
    {"id": "party", "label": "Party", "order": 12},
]

def load_preset_categories():
    """Load categories from file or return defaults"""
    if PRESET_CATEGORIES_FILE.exists():
        try:
            with open(PRESET_CATEGORIES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return DEFAULT_PRESET_CATEGORIES

def save_preset_categories(categories):
    """Save categories to file"""
    with open(PRESET_CATEGORIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2)


@app.get("/api/preset-categories")
async def get_preset_categories():
    """Get all preset categories"""
    try:
        categories = load_preset_categories()
        return JSONResponse(content=sorted(categories, key=lambda x: x.get("order", 999)))
    except Exception as e:
        print(f"Get Categories Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/preset-categories")
async def create_preset_category(request: Request):
    """Create a new category"""
    try:
        data = await request.json()
        cat_id = data.get("id")
        label = data.get("label", cat_id)
        
        if not cat_id:
            raise HTTPException(status_code=400, detail="Category ID required")
        
        categories = load_preset_categories()
        
        # Check if exists
        if any(c["id"] == cat_id for c in categories):
            raise HTTPException(status_code=409, detail=f"Category '{cat_id}' already exists")
        
        # Add new category
        max_order = max((c.get("order", 0) for c in categories), default=0)
        categories.append({
            "id": cat_id,
            "label": label,
            "order": max_order + 1
        })
        
        save_preset_categories(categories)
        return JSONResponse(content={"success": True, "message": f"Category '{cat_id}' created"})
    except HTTPException:
        raise
    except Exception as e:
        print(f"Create Category Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/preset-categories/{cat_id}")
async def update_preset_category(cat_id: str, request: Request):
    """Update a category"""
    try:
        data = await request.json()
        categories = load_preset_categories()
        
        for cat in categories:
            if cat["id"] == cat_id:
                cat["label"] = data.get("label", cat["label"])
                cat["order"] = data.get("order", cat.get("order", 0))
                save_preset_categories(categories)
                return JSONResponse(content={"success": True, "message": f"Category '{cat_id}' updated"})
        
        raise HTTPException(status_code=404, detail=f"Category '{cat_id}' not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update Category Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/preset-categories/{cat_id}")
async def delete_preset_category(cat_id: str):
    """Delete a category"""
    try:
        categories = load_preset_categories()
        original_count = len(categories)
        categories = [c for c in categories if c["id"] != cat_id]
        
        if len(categories) == original_count:
            raise HTTPException(status_code=404, detail=f"Category '{cat_id}' not found")
        
        save_preset_categories(categories)
        return JSONResponse(content={"success": True, "message": f"Category '{cat_id}' deleted"})
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete Category Error: {e}")
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


# -----------------------------------------------------------------------------
# Batch Export Endpoints
# -----------------------------------------------------------------------------

def process_batch_export(batch_id: str):
    """Background worker to process batch export jobs sequentially."""
    with BATCH_EXPORT_LOCK:
        batch = BATCH_EXPORTS.get(batch_id)
        if not batch:
            return
        batch.status = ExportStatus.PROCESSING
    
    for idx, job in enumerate(batch.jobs):
        # Check if batch was cancelled
        with BATCH_EXPORT_LOCK:
            if batch.status == ExportStatus.CANCELLED:
                break
            batch.current_job_index = idx
            job.status = ExportStatus.PROCESSING
            job.started_at = datetime.now().isoformat()
        
        try:
            # Load project data
            project_data = load_project(job.project_id)
            if not project_data:
                raise Exception(f"Project {job.project_id} not found")
            
            words = project_data.get("words", [])
            style_data = project_data.get("config", {}).get("style", {})
            style = build_style(style_data)
            
            # Find video path
            project_dir = PROJECTS_DIR / job.project_id
            video_path = project_dir / "video.mp4"
            
            # Also check for audio files if video doesn't exist
            if not video_path.exists():
                for ext in [".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac"]:
                    audio_path = project_dir / f"audio{ext}"
                    if audio_path.exists():
                        # For audio, we'll skip video export or create a video with background
                        raise Exception(f"Audio-only projects not yet supported for batch export")
                raise Exception(f"Media file not found for project {job.project_id}")
            
            # Update progress
            with BATCH_EXPORT_LOCK:
                job.progress = 10.0
            
            # Generate ASS content
            uid = uuid.uuid4().hex
            ass_path = OUTPUT_DIR / f"batch_{batch_id}_{uid}.ass"
            ass_content = render_ass_content(words, style)
            ass_path.write_text(ass_content, encoding="utf-8")
            
            with BATCH_EXPORT_LOCK:
                job.progress = 30.0
            
            # Run FFmpeg
            codec_info = VIDEO_CODECS.get(job.codec, VIDEO_CODECS["h264"])
            out_ext = codec_info["ext"]
            out_path = OUTPUT_DIR / f"batch_{batch_id}_{job.project_id}{out_ext}"
            run_ffmpeg_burn(video_path, ass_path, out_path, job.resolution, job.codec, job.bitrate)
            
            with BATCH_EXPORT_LOCK:
                job.progress = 90.0
            
            if not out_path.exists():
                raise Exception("Export failed: output file not created")
            
            # Cleanup temp ASS file
            ass_path.unlink(missing_ok=True)
            
            with BATCH_EXPORT_LOCK:
                job.status = ExportStatus.COMPLETED
                job.progress = 100.0
                job.output_path = str(out_path)
                job.completed_at = datetime.now().isoformat()
                
        except Exception as e:
            with BATCH_EXPORT_LOCK:
                job.status = ExportStatus.FAILED
                job.error = str(e)
                job.completed_at = datetime.now().isoformat()
            print(f"Batch export job {job.id} failed: {e}")
    
    # Mark batch as complete
    with BATCH_EXPORT_LOCK:
        if batch.status != ExportStatus.CANCELLED:
            if batch.failed_count == len(batch.jobs):
                batch.status = ExportStatus.FAILED
            elif batch.completed_count > 0:
                batch.status = ExportStatus.COMPLETED
            else:
                batch.status = ExportStatus.FAILED


@app.post("/api/batch-export")
async def create_batch_export(request: Request, background_tasks: BackgroundTasks):
    """
    Create a batch export job for multiple projects.
    
    Request body:
    {
        "project_ids": ["id1", "id2", ...],
        "resolution": "1080p",  // optional: 720p, 1080p, 1440p, 4k
        "codec": "h264",        // optional: h264, h265, vp9, prores
        "bitrate": "medium"     // optional: low, medium, high, ultra
    }
    """
    try:
        data = await request.json()
        project_ids = data.get("project_ids", [])
        resolution = data.get("resolution", "1080p")
        codec = data.get("codec", "h264")
        bitrate = data.get("bitrate", "medium")
        
        # Validate options
        if resolution not in RESOLUTION_PRESETS:
            resolution = "1080p"
        if codec not in VIDEO_CODECS:
            codec = "h264"
        if bitrate not in BITRATE_PRESETS:
            bitrate = "medium"
        
        if not project_ids:
            raise HTTPException(status_code=400, detail="project_ids is required")
        
        if len(project_ids) > 20:
            raise HTTPException(status_code=400, detail="Maximum 20 projects per batch")
        
        # Create batch
        batch_id = uuid.uuid4().hex[:12]
        jobs = []
        
        for pid in project_ids:
            project_data = load_project(pid)
            if not project_data:
                continue
            
            job = ExportJob(
                id=uuid.uuid4().hex[:8],
                project_id=pid,
                project_name=project_data.get("name", pid),
                resolution=resolution,
                codec=codec,
                bitrate=bitrate,
            )
            jobs.append(job)
        
        if not jobs:
            raise HTTPException(status_code=400, detail="No valid projects found")
        
        batch = BatchExportQueue(id=batch_id, jobs=jobs)
        
        with BATCH_EXPORT_LOCK:
            BATCH_EXPORTS[batch_id] = batch
        
        # Start background processing
        background_tasks.add_task(process_batch_export, batch_id)
        
        return JSONResponse({
            "batch_id": batch_id,
            "job_count": len(jobs),
            "status": batch.status.value,
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Batch Export Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/batch-export/{batch_id}")
async def get_batch_export_status(batch_id: str):
    """Get the status of a batch export job."""
    with BATCH_EXPORT_LOCK:
        batch = BATCH_EXPORTS.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch export not found")
        
        return JSONResponse({
            "id": batch.id,
            "status": batch.status.value,
            "total_progress": round(batch.total_progress, 1),
            "completed_count": batch.completed_count,
            "failed_count": batch.failed_count,
            "total_count": len(batch.jobs),
            "current_job_index": batch.current_job_index,
            "created_at": batch.created_at,
            "jobs": [
                {
                    "id": j.id,
                    "project_id": j.project_id,
                    "project_name": j.project_name,
                    "status": j.status.value,
                    "progress": round(j.progress, 1),
                    "error": j.error,
                    "output_path": j.output_path,
                }
                for j in batch.jobs
            ],
        })


@app.post("/api/batch-export/{batch_id}/cancel")
async def cancel_batch_export(batch_id: str):
    """Cancel a batch export job."""
    with BATCH_EXPORT_LOCK:
        batch = BATCH_EXPORTS.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch export not found")
        
        if batch.status in [ExportStatus.COMPLETED, ExportStatus.FAILED]:
            raise HTTPException(status_code=400, detail="Batch export already finished")
        
        batch.status = ExportStatus.CANCELLED
        for job in batch.jobs:
            if job.status == ExportStatus.PENDING:
                job.status = ExportStatus.CANCELLED
        
        return JSONResponse({"message": "Batch export cancelled"})


@app.get("/api/batch-export/{batch_id}/download/{project_id}")
async def download_batch_export_file(batch_id: str, project_id: str):
    """Download a single exported file from a batch."""
    with BATCH_EXPORT_LOCK:
        batch = BATCH_EXPORTS.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch export not found")
        
        job = next((j for j in batch.jobs if j.project_id == project_id), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found in batch")
        
        if job.status != ExportStatus.COMPLETED or not job.output_path:
            raise HTTPException(status_code=400, detail="Export not completed")
        
        output_path = Path(job.output_path)
        if not output_path.exists():
            raise HTTPException(status_code=404, detail="Export file not found")
        
        return FileResponse(
            path=output_path,
            media_type="video/mp4",
            filename=f"{job.project_name}.mp4",
        )


@app.delete("/api/batch-export/{batch_id}")
async def delete_batch_export(batch_id: str):
    """Delete a batch export and its files."""
    with BATCH_EXPORT_LOCK:
        batch = BATCH_EXPORTS.get(batch_id)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch export not found")
        
        # Delete output files
        for job in batch.jobs:
            if job.output_path:
                Path(job.output_path).unlink(missing_ok=True)
        
        del BATCH_EXPORTS[batch_id]
        
        return JSONResponse({"message": "Batch export deleted"})


@app.get("/api/batch-exports")
async def list_batch_exports():
    """List all batch exports."""
    with BATCH_EXPORT_LOCK:
        return JSONResponse([
            {
                "id": b.id,
                "status": b.status.value,
                "total_progress": round(b.total_progress, 1),
                "job_count": len(b.jobs),
                "completed_count": b.completed_count,
                "failed_count": b.failed_count,
                "created_at": b.created_at,
            }
            for b in BATCH_EXPORTS.values()
        ])


@app.get("/api/export-options")
async def get_export_options():
    """Get available video export options (codecs, resolutions, bitrates)."""
    return JSONResponse({
        "codecs": [
            {"id": "h264", "name": "H.264 (MP4)", "description": "Most compatible, good quality", "ext": ".mp4"},
            {"id": "h265", "name": "H.265/HEVC (MP4)", "description": "Better compression, smaller files", "ext": ".mp4"},
            {"id": "vp9", "name": "VP9 (WebM)", "description": "Open format, web optimized", "ext": ".webm"},
            {"id": "prores", "name": "ProRes (MOV)", "description": "Professional editing, lossless", "ext": ".mov"},
        ],
        "resolutions": [
            {"id": "720p", "name": "720p HD", "width": 1280, "height": 720},
            {"id": "1080p", "name": "1080p Full HD", "width": 1920, "height": 1080},
            {"id": "1440p", "name": "1440p QHD", "width": 2560, "height": 1440},
            {"id": "4k", "name": "4K Ultra HD", "width": 3840, "height": 2160},
        ],
        "bitrates": [
            {"id": "low", "name": "Low", "value": "2M", "description": "Smaller file size"},
            {"id": "medium", "name": "Medium", "value": "5M", "description": "Balanced quality"},
            {"id": "high", "name": "High", "value": "10M", "description": "High quality"},
            {"id": "ultra", "name": "Ultra", "value": "20M", "description": "Maximum quality"},
        ],
        "defaults": {
            "codec": "h264",
            "resolution": "1080p",
            "bitrate": "medium"
        }
    })


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
