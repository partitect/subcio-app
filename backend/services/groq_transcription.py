"""
Groq Whisper API Transcription Service

Uses Groq's fast Whisper API for transcription instead of local model.
Benefits:
- No GPU/RAM requirements on server
- Very fast transcription (hardware accelerated)
- Free tier available (14,400 audio seconds/day)
- Whisper Large-v3 quality

Groq API Limits:
- Max file size: 25MB
- For larger files, audio is split into chunks
"""
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional
from groq import Groq

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Groq max file size is 25MB, we use 20MB to be safe
MAX_CHUNK_SIZE_MB = 20
MAX_CHUNK_DURATION_SECONDS = 600  # 10 minutes per chunk


def get_groq_client() -> Optional[Groq]:
    """Get Groq client if API key is configured."""
    if not GROQ_API_KEY:
        return None
    return Groq(api_key=GROQ_API_KEY)


def get_audio_duration(audio_path: str) -> float:
    """Get duration of audio file in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audio_path
            ],
            capture_output=True, text=True, timeout=30
        )
        return float(result.stdout.strip())
    except Exception:
        return 0


def split_audio_for_groq(audio_path: str, output_dir: str) -> list[tuple[str, float]]:
    """
    Split audio into chunks that fit Groq's 25MB limit.
    
    Returns:
        List of (chunk_path, start_time_offset) tuples
    """
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    duration = get_audio_duration(audio_path)
    
    # If file is small enough, no need to split
    if file_size_mb <= MAX_CHUNK_SIZE_MB:
        return [(audio_path, 0.0)]
    
    # Calculate chunk duration based on file size ratio
    # Estimate: if file is X times too large, split into X chunks
    num_chunks = int(file_size_mb / MAX_CHUNK_SIZE_MB) + 1
    chunk_duration = min(duration / num_chunks, MAX_CHUNK_DURATION_SECONDS)
    
    chunks = []
    current_time = 0.0
    chunk_index = 0
    
    while current_time < duration:
        chunk_path = os.path.join(output_dir, f"chunk_{chunk_index}.mp3")
        
        # Use ffmpeg to extract chunk with re-encoding to ensure smaller size
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", audio_path,
                "-ss", str(current_time),
                "-t", str(chunk_duration),
                "-ar", "16000",  # 16kHz sample rate (good for speech)
                "-ac", "1",      # Mono
                "-b:a", "64k",   # Lower bitrate for smaller file
                chunk_path
            ],
            capture_output=True, timeout=300
        )
        
        if os.path.exists(chunk_path) and os.path.getsize(chunk_path) > 0:
            chunks.append((chunk_path, current_time))
        
        current_time += chunk_duration
        chunk_index += 1
    
    return chunks


def compress_audio_for_groq(audio_path: str, output_path: str) -> str:
    """
    Compress audio to fit within Groq's 25MB limit.
    Returns path to compressed file.
    """
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", audio_path,
            "-ar", "16000",  # 16kHz sample rate
            "-ac", "1",      # Mono
            "-b:a", "64k",   # 64kbps bitrate
            output_path
        ],
        capture_output=True, timeout=300
    )
    return output_path


def transcribe_with_groq(
    audio_path: str,
    language: Optional[str] = None,
    response_format: str = "verbose_json"
) -> dict:
    """
    Transcribe audio using Groq's Whisper API.
    Handles large files by compressing or splitting.
    
    Args:
        audio_path: Path to the audio file
        language: Optional language code (e.g., 'en', 'tr')
        response_format: 'json', 'text', or 'verbose_json' (includes timestamps)
    
    Returns:
        Transcription result with segments and word-level timestamps
    """
    client = get_groq_client()
    if not client:
        raise ValueError("GROQ_API_KEY not configured")
    
    file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
    
    # If file is too large, compress it first
    if file_size_mb > MAX_CHUNK_SIZE_MB:
        with tempfile.TemporaryDirectory() as temp_dir:
            compressed_path = os.path.join(temp_dir, "compressed.mp3")
            compress_audio_for_groq(audio_path, compressed_path)
            
            # Check if compression was enough
            compressed_size_mb = os.path.getsize(compressed_path) / (1024 * 1024)
            
            if compressed_size_mb > MAX_CHUNK_SIZE_MB:
                # Need to split into chunks
                return transcribe_chunked(audio_path, language, response_format, temp_dir)
            
            # Use compressed file
            return transcribe_single_file(client, compressed_path, language, response_format)
    
    return transcribe_single_file(client, audio_path, language, response_format)


def transcribe_single_file(
    client: Groq,
    audio_path: str,
    language: Optional[str],
    response_format: str
) -> dict:
    """Transcribe a single audio file."""
    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(Path(audio_path).name, audio_file),
            model="whisper-large-v3-turbo",
            response_format=response_format,
            language=language,
            timestamp_granularities=["word", "segment"] if response_format == "verbose_json" else None
        )
    return transcription


def transcribe_chunked(
    audio_path: str,
    language: Optional[str],
    response_format: str,
    temp_dir: str
) -> dict:
    """Transcribe audio by splitting into chunks and merging results."""
    client = get_groq_client()
    if not client:
        raise ValueError("GROQ_API_KEY not configured")
    
    chunks = split_audio_for_groq(audio_path, temp_dir)
    
    all_segments = []
    all_words = []
    total_duration = 0.0
    detected_language = language
    
    for chunk_path, time_offset in chunks:
        try:
            result = transcribe_single_file(client, chunk_path, language, response_format)
            
            # Get language from first chunk
            if detected_language is None:
                detected_language = getattr(result, 'language', None)
            
            # Merge segments with time offset
            if hasattr(result, 'segments') and result.segments:
                for seg in result.segments:
                    start = (seg.get("start") if isinstance(seg, dict) else getattr(seg, 'start', 0)) + time_offset
                    end = (seg.get("end") if isinstance(seg, dict) else getattr(seg, 'end', 0)) + time_offset
                    text = seg.get("text") if isinstance(seg, dict) else getattr(seg, 'text', "")
                    all_segments.append({
                        "start": start,
                        "end": end,
                        "text": text,
                    })
                    
                    # Get words from segment
                    seg_words = seg.get('words', []) if isinstance(seg, dict) else getattr(seg, 'words', [])
                    for word in (seg_words or []):
                        w_start = (word.get("start") if isinstance(word, dict) else getattr(word, 'start', 0)) + time_offset
                        w_end = (word.get("end") if isinstance(word, dict) else getattr(word, 'end', 0)) + time_offset
                        w_text = word.get("word") if isinstance(word, dict) else getattr(word, 'word', "")
                        all_words.append({
                            "start": w_start,
                            "end": w_end,
                            "word": w_text,
                        })
            
            # Also check for top-level words
            if hasattr(result, 'words') and result.words:
                for word in result.words:
                    w_start = (word.get("start") if isinstance(word, dict) else getattr(word, 'start', 0)) + time_offset
                    w_end = (word.get("end") if isinstance(word, dict) else getattr(word, 'end', 0)) + time_offset
                    w_text = word.get("word") if isinstance(word, dict) else getattr(word, 'word', "")
                    all_words.append({
                        "start": w_start,
                        "end": w_end,
                        "word": w_text,
                    })
            
            # Update total duration
            chunk_duration = getattr(result, 'duration', 0)
            total_duration = max(total_duration, time_offset + chunk_duration)
            
        except Exception as e:
            # Log but continue with other chunks
            print(f"Warning: Failed to transcribe chunk at {time_offset}s: {e}")
    
    # Create a result object that mimics Groq's response
    class MergedResult:
        def __init__(self):
            self.segments = all_segments
            self.words = all_words
            self.language = detected_language or 'unknown'
            self.duration = total_duration
            self.text = " ".join(seg.get("text", "") for seg in all_segments)
    
    return MergedResult()


def transcribe_to_segments(
    audio_path: str,
    language: Optional[str] = None
) -> tuple[list[dict], dict]:
    """
    Transcribe audio and return segments with timestamps.
    
    Returns:
        Tuple of (segments, info)
        - segments: List of {"start": float, "end": float, "text": str}
        - info: {"language": str, "duration": float}
    """
    result = transcribe_with_groq(audio_path, language, "verbose_json")
    
    segments = []
    if hasattr(result, 'segments') and result.segments:
        for seg in result.segments:
            segments.append({
                "start": seg.get("start", seg.start) if hasattr(seg, 'start') else seg.get("start", 0),
                "end": seg.get("end", seg.end) if hasattr(seg, 'end') else seg.get("end", 0),
                "text": seg.get("text", seg.text) if hasattr(seg, 'text') else seg.get("text", ""),
            })
    
    info = {
        "language": getattr(result, 'language', language or 'unknown'),
        "duration": getattr(result, 'duration', 0),
    }
    
    return segments, info


def transcribe_to_words(
    audio_path: str,
    language: Optional[str] = None
) -> tuple[list[dict], dict]:
    """
    Transcribe audio and return word-level timestamps.
    
    Returns:
        Tuple of (words, info)
        - words: List of {"start": float, "end": float, "word": str}
        - info: {"language": str, "duration": float}
    """
    result = transcribe_with_groq(audio_path, language, "verbose_json")
    
    words = []
    if hasattr(result, 'words') and result.words:
        for word in result.words:
            words.append({
                "start": word.get("start", getattr(word, 'start', 0)),
                "end": word.get("end", getattr(word, 'end', 0)),
                "word": word.get("word", getattr(word, 'word', "")),
            })
    elif hasattr(result, 'segments') and result.segments:
        # Fallback: Extract words from segments if word-level not available
        for seg in result.segments:
            seg_words = getattr(seg, 'words', None) or seg.get('words', [])
            for word in seg_words:
                words.append({
                    "start": word.get("start", getattr(word, 'start', 0)),
                    "end": word.get("end", getattr(word, 'end', 0)),
                    "word": word.get("word", getattr(word, 'word', "")),
                })
    
    info = {
        "language": getattr(result, 'language', language or 'unknown'),
        "duration": getattr(result, 'duration', 0),
    }
    
    return words, info


def is_groq_available() -> bool:
    """Check if Groq API is configured and available."""
    return GROQ_API_KEY is not None and len(GROQ_API_KEY) > 0
