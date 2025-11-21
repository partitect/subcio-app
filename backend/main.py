import json
import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, HTTPException, Response
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
PRESET_STYLE_MAP = {
    "fire-storm": {
        "font": "Archivo Black",
        "primary_color": "&H00006DFF", # Orange
        "outline_color": "&H00000000",
        "font_size": 64,
        "id": "fire-storm"
    },
    "cyber-glitch": {
        "font": "Roboto Mono",
        "primary_color": "&H00FFFFFF", # White
        "outline_color": "&H00FF0000", # Blueish
        "font_size": 60,
        "id": "cyber-glitch"
    },
    "neon-pulse": {
        "font": "Inter",
        "primary_color": "&H00FFFC7C", # Cyan
        "outline_color": "&H00FF00FF", # Magenta
        "font_size": 62,
        "id": "neon-pulse"
    },
    "kinetic-bounce": {
        "font": "Sora",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 64,
        "id": "kinetic-bounce"
    },
    "cinematic-blur": {
        "font": "Montserrat",
        "primary_color": "&H00E0E0E0",
        "outline_color": "&H00000000",
        "font_size": 58,
        "id": "cinematic-blur"
    },
    "thunder-strike": {
        "font": "Impact",
        "primary_color": "&H0000FFFF", # Yellow
        "outline_color": "&H00000000",
        "font_size": 66,
        "id": "thunder-strike"
    },
    "typewriter-pro": {
        "font": "Courier New",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 56,
        "id": "typewriter-pro"
    },
    "rainbow-wave": {
        "font": "Fredoka One",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 64,
        "id": "rainbow-wave"
    },
    "earthquake-shake": {
        "font": "Bebas Neue",
        "primary_color": "&H000000FF", # Red
        "outline_color": "&H00FFFFFF",
        "font_size": 70,
        "id": "earthquake-shake"
    },
    "word-pop": {
        "font": "Poppins",
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
        "font": "Montserrat",
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
        "font": "Roboto Mono",
        "primary_color": "&H00FFFFFF",
        "outline_color": "&H00000000",
        "font_size": 48,
        "id": "news-ticker"
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
    vf = f"ass=filename='{ass_path_str}',{scale_filter}"
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
                words.append(
                    {
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                        "text": w.word.strip(),
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
