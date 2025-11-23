import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from faster_whisper import WhisperModel
import uvicorn

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

PRESET_STYLE_MAP = {
    "fire-storm": {
        "font": "Brown Beige",
        "primary_color": "&H00006DFF",
        "secondary_color": "&H00c431a4",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 80,
        "letter_spacing": 10,
        "bold": 1,
        "italic": 0,
        "underline": 0,
        "strikeout": 0,
        "border": 3,
        "shadow": 3,
        "blur": 1,
        "opacity": 100,
        "rotation": 0,
        "rotation_x": 0,
        "rotation_y": -1,
        "shear": 0,
        "scale_x": 100,
        "scale_y": 100,
        "alignment": 2,
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
        "font_size": 35,
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
        "font": "Brown Beige",
        "primary_color": "&H00F5F5F5",
        "secondary_color": "&H0000FFFF",
        "outline_color": "&H00905190",
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
        "id": "neon-pulse"
    },
    "kinetic-bounce": {
        "font": "Press Start 2P",
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
        "font": "Komika Axis",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00333333",
        "font_size": 60,
        "id": "word-pop"
    },
    "retro-arcade": {
        "font": "Press Start 2P",
        "primary_color": "&H0000FF00",
        "outline_color": "&H00000000",
        "font_size": 50,
        "id": "retro-arcade"
    },
    "horror-creepy": {
        "font": "BlackCaps",
        "primary_color": "&H000000FF",
        "outline_color": "&H00000033",
        "font_size": 68,
        "id": "horror-creepy"
    },
    "luxury-gold": {
        "font": "Brown Beige",
        "primary_color": "&H0000D7FF",
        "outline_color": "&H00000000",
        "font_size": 60,
        "id": "luxury-gold"
    },
    "comic-book": {
        "font": "Komika Axis",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 64,
        "id": "comic-book"
    },
    "news-ticker": {
        "font": "Thoge",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 48,
        "id": "news-ticker"
    },
    "pulse": {
        "font": "Brown Beige",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00FF00FF",
        "font_size": 62,
        "id": "pulse"
    },
    "bubble-floral": {
        "font": "Thoge",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00FFBD00",
        "font_size": 58,
        "id": "bubble-floral"
    },
    "falling-heart": {
        "font": "OverHeat Regular",
        "primary_color": "&H00000000",
        "outline_color": "&H00A5907E",
        "font_size": 64,
        "id": "falling-heart"
    },
    "colorful": {
        "font": "Komika Axis",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 60,
        "id": "colorful"
    },
    "ghost-star": {
        "font": "BlackCaps",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H0000FFFF",
        "font_size": 56,
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
        "font": "Komika Axis",
        "primary_color": "&H0000FFFF",
        "secondary_color": "&H000000FF",
        "outline_color": "&H00FFFFFF",
        "shadow_color": "&H80000000",
        "font_size": 70,
        "rotation_y": 20,
        "rotation_x": 10,
        "shadow": 5,
        "border": 3,
        "id": "3d-spin"
    },
    "shear-force": {
        "font": "Impact",
        "primary_color": "&H0000FF00",
        "outline_color": "&H00000000",
        "font_size": 80,
        "shear": -30,
        "letter_spacing": 5,
        "italic": 1,
        "id": "shear-force"
    },
    "double-shadow": {
        "font": "Poppins",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00FF00FF",
        "shadow_color": "&H00FFFF00",
        "font_size": 65,
        "border": 4,
        "shadow": 6,
        "bold": 1,
        "id": "double-shadow"
    },

    "matrix-rain": {
        "font": "Monigue",
        "primary_color": "&H0000FF00",
        "outline_color": "&H00000000",
        "font_size": 54,
        "id": "matrix-rain"
    },
    "electric-shock": {
        "font": "Chunko Bold",
        "primary_color": "&H0000FFFF",
        "outline_color": "&H00000000",
        "font_size": 66,
        "id": "electric-shock"
    },
    "smoke-trail": {
        "font": "Brume",
        "primary_color": "&H00CCCCCC",
        "outline_color": "&H00666666",
        "font_size": 58,
        "id": "smoke-trail"
    },
    "pixel-glitch": {
        "font": "Tallica",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00FF0000",
        "font_size": 60,
        "id": "pixel-glitch"
    },
    "neon-sign": {
        "font": "Oslla",
        "primary_color": "&H00FF00FF",
        "outline_color": "&H00FF00FF",
        "font_size": 64,
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
        "font": "Folkies Vantage",
        "primary_color": "&H009A4C73",
        "outline_color": "&H00FFFFFF",
        "font_size": 120,
        "id": "butterfly-dance"
    },
    "welcome-my-life": {
        "font": "MoolBoran",
        "primary_color": "&H006CB1DD",
        "secondary_color": "&H000000FF",
        "outline_color": "&H00000000",
        "shadow_color": "&H00000000",
        "font_size": 47,
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
        "alignment": 8,
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
    }
}


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


# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(title="PyCaps API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)


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
    return JSONResponse(
        {"language": info.language, "device": DEVICE, "model": model_name, "words": words}
    )


@app.post("/api/export")
async def export_subtitled_video(
    background_tasks: BackgroundTasks = None,
    video: UploadFile = File(...),
    words_json: str = Form(...),
    style_json: str = Form(...),
    resolution: str = Form("1080p"),
):
    """
    Burns .ass subtitles with provided style and edited words; returns processed video.
    - words_json: JSON list of dicts with start/end/text
    - style_json: JSON object with style parameters
    """
    words = json.loads(words_json)
    incoming_style = json.loads(style_json)
    style_id = incoming_style.get("id")
    # Merge: preset -> incoming (UI overrides preset), then normalize colors.
    style = {**PRESET_STYLE_MAP.get(style_id, {}), **incoming_style}
    
    # Debug: Print style_id
    print(f"[DEBUG] Export style_id: {style_id}")
    print(f"[DEBUG] Full style: {style}")

    # Persist artifacts inside backend/exports to avoid Temp cleanup races.
    uid = uuid.uuid4().hex
    suffix = Path(video.filename).suffix or ".mp4"
    in_path = OUTPUT_DIR / f"upload_{uid}{suffix}"
    with in_path.open("wb") as f:
        f.write(await video.read())

    ass_path = OUTPUT_DIR / f"subtitles_{uid}.ass"
    
    # ALWAYS use AdvancedRenderer for these new presets
    # If style_id is in our map (or basically any valid ID now), use AdvancedRenderer
    # We can fallback to build_ass only if really needed, but AdvancedRenderer handles basic pop too.
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
        background_tasks.add_task(lambda: in_path.unlink(missing_ok=True))
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: output file missing at {out_path}",
        )

    # Keep .ass and .mp4 for inspection; only remove uploaded source after response.
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
):
    """
    Generates ASS subtitle content for preview without burning video.
    Returns plain text ASS content.
    """
    try:
        words = json.loads(words_json)
        incoming_style = json.loads(style_json)
        style_id = incoming_style.get("id")
        
        # Merge: preset -> incoming (UI overrides preset)
        style = {**PRESET_STYLE_MAP.get(style_id, {}), **incoming_style}

        # ALWAYS use AdvancedRenderer
        from render_engine import AdvancedRenderer
        renderer = AdvancedRenderer(words, style)
        ass_content = renderer.render()
            
        return Response(content=ass_content, media_type="text/plain")
    except Exception as e:
        print(f"Preview Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/presets")
async def get_presets():
    """
    Returns all available presets with their configuration.
    """
    try:
        presets_list = []
        for preset_id, preset_data in PRESET_STYLE_MAP.items():
            presets_list.append(preset_data)
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
    
    # Find the preset block
    pattern = rf'"{preset_id}":\s*\{{[^}}]+\}}'
    
    # Create new preset block with all parameters
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
    
    # Replace
    updated_content = re.sub(pattern, new_preset, content, flags=re.DOTALL)
    
    # Write back
    main_py_path.write_text(updated_content, encoding='utf-8')


def add_preset_to_main_py(preset_id: str, preset_data: dict):
    """Add a new preset to main.py file"""
    main_py_path = Path(__file__).resolve()
    content = main_py_path.read_text(encoding='utf-8')
    
    # Find the end of PRESET_STYLE_MAP
    pattern = r'(PRESET_STYLE_MAP\s*=\s*\{.*?)(\n\})'
    
    # Create new preset block with all parameters
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
    
    # Insert before closing brace
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
        images_dir = frontend_dir / "public" / "presets-image"
        images_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = images_dir / f"{preset_id}.png"
        
        file_path.write_bytes(image_bytes)
        
        return {"message": f"Screenshot saved to {file_path}", "path": f"/presets-image/{preset_id}.png"}
        
    except Exception as e:
        print(f"Screenshot Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
