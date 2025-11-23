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

def get_text_width(text: str, font_path: str, font_size: int) -> int:
    """
    Calculates the exact width of the text in pixels using the actual font file.
    """
    if not text:
        return 0
    
    try:
        font = ImageFont.truetype(font_path, font_size)
        # getlength returns float, we round up to ensure space
        return int(font.getlength(text))
    except Exception as e:
        print(f"Error loading font {font_path}: {e}")
        # Fallback to heuristic if font fails
        return estimate_text_width_heuristic(text, font_size)

def estimate_text_width_heuristic(text: str, font_size: int) -> int:
    """Fallback heuristic"""
    width = 0
    for char in text:
        if char.isupper():
            width += font_size * 0.8
        elif char.islower():
            width += font_size * 0.6
        elif char.isdigit():
            width += font_size * 0.6
        else:
            width += font_size * 0.4
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
