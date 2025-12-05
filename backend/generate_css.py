import os
import re
from pathlib import Path
from PIL import ImageFont

FONTS_DIR = Path(__file__).resolve().parent / "fonts"

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

def generate_css():
    entries = load_font_name_list()
    css_lines = ["/* Auto-generated from backend/fonts with correct Display Names */"]
    
    for entry in entries:
        name = entry["name"]
        file = entry["file"]
        
        # Quote header to handle spaces in names
        css_block = f"""
@font-face {{
  font-family: "{name}";
  src: url("./fonts/{file}") format("truetype");
  font-weight: normal;
  font-style: normal;
}}
"""
        css_lines.append(css_block.strip())

    return "\n\n".join(css_lines)

if __name__ == "__main__":
    try:
        css_content = generate_css()
        out_path = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fonts.css"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(css_content)
        print(f"Successfully wrote {len(css_content)} bytes to {out_path}")
    except Exception as e:
        print(f"Error: {e}")
