import math

def ms_to_ass(ms: int) -> str:
    """Converts milliseconds to ASS timestamp format H:MM:SS.cc"""
    s = ms / 1000.0
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    cs = int((s - int(s)) * 100)
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"

def hex_to_ass(val: str) -> str:
    """Converts #RRGGBB to ASS &H00BBGGRR format."""
    if not val: return "&H00FFFFFF"
    if val.startswith("&H"): return val
    val = val.lstrip("#")
    if len(val) == 6:
        r, g, b = val[0:2], val[2:4], val[4:6]
        return f"&H00{b}{g}{r}" # Note BGR order
    return "&H00FFFFFF"

def group_words_by_sentence(words: list, max_gap: float = 1.0) -> list:
    """
    Groups words into sentences based on punctuation or long gaps.
    Returns a list of dicts, where each dict is a "sentence" event containing:
    - start: start time of first word
    - end: end time of last word
    - text: full sentence text
    - words: list of words in this sentence (with relative timings if needed)
    """
    sentences = []
    if not words:
        return sentences

    current_sentence = []
    
    for i, word in enumerate(words):
        current_sentence.append(word)
        
        # Check for sentence endings
        text = word['text']
        is_end_of_sentence = text.endswith(('.', '!', '?'))
        
        # Check for long gaps to next word
        is_long_gap = False
        if i < len(words) - 1:
            next_start = words[i+1]['start']
            curr_end = word['end']
            if next_start - curr_end > max_gap:
                is_long_gap = True
        else:
            is_long_gap = True # Last word always ends a group

        if is_end_of_sentence or is_long_gap:
            if current_sentence:
                s_start = current_sentence[0]['start']
                s_end = current_sentence[-1]['end']
                s_text = " ".join([w['text'] for w in current_sentence])
                sentences.append({
                    "start": s_start,
                    "end": s_end,
                    "text": s_text,
                    "words": current_sentence
                })
                current_sentence = []
    
    # Add any remaining words
    if current_sentence:
        s_start = current_sentence[0]['start']
        s_end = current_sentence[-1]['end']
        s_text = " ".join([w['text'] for w in current_sentence])
        sentences.append({
            "start": s_start,
            "end": s_end,
            "text": s_text,
            "words": current_sentence
        })
        
    return sentences

from PIL import ImageFont
import os

# Font cache to avoid reloading fonts
_font_cache = {}

def get_font_path(font_name: str, fonts_dir: str = None) -> str:
    """
    Find the font file path for a given font name.
    Searches multiple naming conventions.
    """
    if fonts_dir is None:
        fonts_dir = os.path.join(os.path.dirname(__file__), "fonts")
    
    if not os.path.exists(fonts_dir):
        # Try parent directory
        fonts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
    
    # Clean font name for file matching
    clean_name = font_name.replace(" ", "")
    
    # Try various naming conventions
    variants = [
        f"{clean_name}-Bold.ttf",
        f"{clean_name}-ExtraBold.ttf",
        f"{clean_name}-Regular.ttf",
        f"{clean_name}.ttf",
        f"{font_name}-Bold.ttf",
        f"{font_name}-ExtraBold.ttf",
        f"{font_name}-Regular.ttf",
        f"{font_name}.ttf",
    ]
    
    for variant in variants:
        candidate = os.path.join(fonts_dir, variant)
        if os.path.exists(candidate):
            return candidate
    
    # Try case-insensitive search
    if os.path.exists(fonts_dir):
        for filename in os.listdir(fonts_dir):
            lower_filename = filename.lower()
            lower_clean = clean_name.lower()
            if lower_filename.startswith(lower_clean) and filename.endswith('.ttf'):
                return os.path.join(fonts_dir, filename)
    
    return None

def get_font(font_path: str, font_size: int) -> ImageFont.FreeTypeFont:
    """
    Get a font object, using cache to avoid reloading.
    """
    cache_key = f"{font_path}_{font_size}"
    if cache_key not in _font_cache:
        try:
            _font_cache[cache_key] = ImageFont.truetype(font_path, font_size)
        except Exception as e:
            print(f"Error loading font {font_path}: {e}")
            return None
    return _font_cache[cache_key]

def get_text_width(text: str, font_path: str, font_size: int, scale_x: int = 100) -> int:
    """
    Calculates the exact width of the text in pixels using the actual font file.
    Applies scale_x percentage to the result.
    """
    if not text:
        return 0
    
    try:
        font = get_font(font_path, font_size)
        if font is None:
            return estimate_text_width_heuristic(text, font_size, scale_x)
        
        # getlength returns the exact advance width
        width = font.getlength(text)
        
        # Apply scale_x percentage
        width = width * scale_x / 100
        
        return int(width)
    except Exception as e:
        print(f"Error calculating text width: {e}")
        return estimate_text_width_heuristic(text, font_size, scale_x)

def get_text_bbox(text: str, font_path: str, font_size: int) -> tuple:
    """
    Get the bounding box of text (left, top, right, bottom).
    This gives more accurate dimensions than getlength for some fonts.
    """
    if not text:
        return (0, 0, 0, 0)
    
    try:
        font = get_font(font_path, font_size)
        if font is None:
            return (0, 0, estimate_text_width_heuristic(text, font_size), font_size)
        
        bbox = font.getbbox(text)
        return bbox  # (left, top, right, bottom)
    except Exception as e:
        print(f"Error getting text bbox: {e}")
        return (0, 0, estimate_text_width_heuristic(text, font_size), font_size)

def get_text_metrics(text: str, font_path: str, font_size: int, scale_x: int = 100) -> dict:
    """
    Get comprehensive text metrics including width, height, and offsets.
    """
    if not text:
        return {"width": 0, "height": font_size, "left": 0, "top": 0}
    
    try:
        font = get_font(font_path, font_size)
        if font is None:
            width = estimate_text_width_heuristic(text, font_size, scale_x)
            return {"width": width, "height": font_size, "left": 0, "top": 0}
        
        # Get bounding box for accurate dimensions
        bbox = font.getbbox(text)
        left, top, right, bottom = bbox
        
        # Calculate actual width and height
        width = (right - left) * scale_x / 100
        height = bottom - top
        
        return {
            "width": int(width),
            "height": int(height),
            "left": left,
            "top": top,
            "advance": int(font.getlength(text) * scale_x / 100)
        }
    except Exception as e:
        print(f"Error getting text metrics: {e}")
        width = estimate_text_width_heuristic(text, font_size, scale_x)
        return {"width": width, "height": font_size, "left": 0, "top": 0}

def estimate_text_width_heuristic(text: str, font_size: int, scale_x: int = 100) -> int:
    """Fallback heuristic with scale_x support"""
    width = 0
    for char in text:
        if char.isupper():
            width += font_size * 0.75
        elif char.islower():
            width += font_size * 0.55
        elif char.isdigit():
            width += font_size * 0.6
        elif char == ' ':
            width += font_size * 0.3
        elif char in 'iIlL1|':
            width += font_size * 0.35
        elif char in 'mMwW':
            width += font_size * 0.9
        else:
            width += font_size * 0.5
    
    # Apply scale_x
    width = width * scale_x / 100
    return int(width)

def group_words_smart(words: list, max_per_group: int = 3, max_gap: float = 1.0) -> list:
    """
    Groups words into chunks of max_per_group (default 2-3).
    Tries to respect sentence boundaries and pauses.
    """
    groups = []
    if not words:
        return groups

    current_group = []
    
    for i, word in enumerate(words):
        current_group.append(word)
        
        # Check for forced breaks
        text = word['text']
        is_end_of_sentence = text.endswith(('.', '!', '?'))
        
        # Check for long gaps
        is_long_gap = False
        if i < len(words) - 1:
            next_start = words[i+1]['start']
            curr_end = word['end']
            if next_start - curr_end > max_gap:
                is_long_gap = True
        
        # Check group size
        is_full = len(current_group) >= max_per_group
        
        if is_end_of_sentence or is_long_gap or is_full:
            if current_group:
                s_start = current_group[0]['start']
                s_end = current_group[-1]['end']
                s_text = " ".join([w['text'] for w in current_group])
                groups.append({
                    "start": s_start,
                    "end": s_end,
                    "text": s_text,
                    "words": current_group
                })
                current_group = []
    
    # Add remaining
    if current_group:
        s_start = current_group[0]['start']
        s_end = current_group[-1]['end']
        s_text = " ".join([w['text'] for w in current_group])
        groups.append({
            "start": s_start,
            "end": s_end,
            "text": s_text,
            "words": current_group
        })
        
    return groups
