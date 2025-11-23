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
