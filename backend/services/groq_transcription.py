"""
Groq Whisper API Transcription Service

Uses Groq's fast Whisper API for transcription instead of local model.
Benefits:
- No GPU/RAM requirements on server
- Very fast transcription (hardware accelerated)
- Free tier available (14,400 audio seconds/day)
- Whisper Large-v3 quality
"""
import os
import tempfile
from pathlib import Path
from typing import Optional
from groq import Groq

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_groq_client() -> Optional[Groq]:
    """Get Groq client if API key is configured."""
    if not GROQ_API_KEY:
        return None
    return Groq(api_key=GROQ_API_KEY)


def transcribe_with_groq(
    audio_path: str,
    language: Optional[str] = None,
    response_format: str = "verbose_json"
) -> dict:
    """
    Transcribe audio using Groq's Whisper API.
    
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
    
    with open(audio_path, "rb") as audio_file:
        # Use Groq's Whisper API
        transcription = client.audio.transcriptions.create(
            file=(Path(audio_path).name, audio_file),
            model="whisper-large-v3-turbo",  # Fast and accurate
            response_format=response_format,
            language=language,
            timestamp_granularities=["word", "segment"] if response_format == "verbose_json" else None
        )
    
    return transcription


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
