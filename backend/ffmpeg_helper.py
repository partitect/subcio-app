
import subprocess
import logging
from pathlib import Path
from typing import Optional
import re
import sys
import os

# Logger setup
logger = logging.getLogger(__name__)

def run_ffmpeg_burn_async(
    video_path: Path, 
    ass_path: Path, 
    output_path: Path, 
    resolution="1080p",
    codec="h264",
    bitrate="medium",
    custom_bitrate: Optional[int] = None,
    progress_callback = None,
    fonts_dir: Path = None
):
    """
    Async implementation of ffmpeg burn with progress tracking.
    """
    # Resolution settings
    # We would need access to RESOLUTION_PRESETS etc, but better to pass raw params?
    # For now, duplicate logic or import constants.
    # To avoid circular imports, we'll redefine basic maps here or accept constructed cmd?
    # Re-implementing constraints locally for simplicity.
    
    # Simple resolution map
    res_map = {
        "720p": (1280, 720),
        "1080p": (1920, 1080),
        "1440p": (2560, 1440),
        "4k": (3840, 2160),
    }
    
    w, h = res_map.get(resolution, (1920, 1080))
    if resolution == "original":
        scale_filter = "scale=iw:ih"
    else:
        scale_filter = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:({w}-iw)/2:({h}-ih)/2"

    # Bitrate
    bitrate_map = {
        "low": "2500k",
        "medium": "5000k", 
        "high": "10000k",
        "ultra": "20000k"
    }
    target_bitrate = f"{custom_bitrate}k" if custom_bitrate else bitrate_map.get(bitrate, "5000k")
    audio_bitrate = "192k"

    # Encoder
    encoder_map = {
        "h264": "libx264",
        "h265": "libx265", 
        "vp9": "libvpx-vp9"
    }
    encoder = encoder_map.get(codec, "libx264")

    # Paths - Convert to POSIX (forward slashes) for FFmpeg compatibility
    # And escape colons for filter string
    ass_path_str = ass_path.as_posix()
    fonts_dir_str = fonts_dir.as_posix() if fonts_dir else ""
    
    # Escape colons (C:/ -> C\:/)
    ass_path_str = ass_path_str.replace(":", r"\:")
    if fonts_dir_str:
        fonts_dir_str = fonts_dir_str.replace(":", r"\:")

    vf = f"ass='{ass_path_str}'"
    if fonts_dir:
        vf += f":fontsdir='{fonts_dir_str}'"
    vf += f",{scale_filter}"

    cmd = [
        "ffmpeg",
        "-y",
        "-threads", "0",
        "-i", str(video_path),
        "-vf", vf,
        "-c:v", encoder,
    ]

    # Codec specific
    if codec == "h264":
        cmd.extend(["-preset", "medium", "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p", "-bufsize", "4M"])
        cmd.extend(["-crf", "18"] if not custom_bitrate else ["-b:v", target_bitrate])
    elif codec == "h265":
        cmd.extend(["-preset", "medium", "-tag:v", "hvc1"])
        cmd.extend(["-crf", "23"] if not custom_bitrate else ["-b:v", target_bitrate])
    
    cmd.extend(["-c:a", "aac", "-b:a", audio_bitrate, "-movflags", "+faststart"])
    cmd.append(str(output_path))

    logger.info(f"FFmpeg CMD: {' '.join(cmd)}")

    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
            encoding='utf-8',
            errors='replace'
        )

        duration = 0
        duration_pattern = re.compile(r"Duration: (\d{2}):(\d{2}):(\d{2}).(\d{2})")
        time_pattern = re.compile(r"time=(\d{2}):(\d{2}):(\d{2}).(\d{2})")

        stderr_buffer = []
        while True:
            line = process.stderr.readline()
            if not line and process.poll() is not None:
                break
            
            if line:
                stderr_buffer.append(line)
                # Keep buffer size manageable
                if len(stderr_buffer) > 50:
                    stderr_buffer.pop(0)
                    
                # print(line, end='') # Debug
                if not duration:
                    match = duration_pattern.search(line)
                    if match:
                        h, m, s, cs = map(int, match.groups())
                        duration = h * 3600 + m * 60 + s + cs / 100
                
                if duration and progress_callback:
                    match = time_pattern.search(line)
                    if match:
                        h, m, s, cs = map(int, match.groups())
                        current_time = h * 3600 + m * 60 + s + cs / 100
                        progress = min(99.0, (current_time / duration) * 100.0)
                        progress_callback(progress)

        if process.returncode != 0:
             error_msg = "".join(stderr_buffer)
             logger.error(f"FFmpeg stderr: {error_msg}")
             raise Exception(f"FFmpeg process failed with code {process.returncode}. Error: {error_msg[-300:]}")

        if progress_callback:
            progress_callback(100.0)
            
        return output_path

    except Exception as e:
        logger.error(f"Async FFmpeg Error: {e}")
        if output_path.exists():
            output_path.unlink()
        raise
