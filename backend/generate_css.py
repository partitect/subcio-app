import os
import re
from pathlib import Path
from PIL import ImageFont

FONTS_DIR = Path(__file__).resolve().parent / "fonts"

# Mapping for standard weights
WEIGHT_MAP = {
    "thin": 100, "hairline": 100,
    "extralight": 200, "extra-light": 200, "ultralight": 200, "ultra-light": 200,
    "light": 300,
    "regular": 400, "normal": 400, "book": 400, "medium": 500, # Medium is often 500
    "semibold": 600, "semi-bold": 600, "demibold": 600,
    "bold": 700,
    "extrabold": 800, "extra-bold": 800, "ultrabold": 800, "ultra-bold": 800, "heavy": 800,
    "black": 900, "extrablack": 950
}

# Regex components
WEIGHT_PATTERN = "|".join(sorted(WEIGHT_MAP.keys(), key=len, reverse=True))
WIDTH_PATTERN = r"expanded|condensed|compressed|extended|narrow|wide|semi\s*expanded|semi\s*condensed"

def parse_font_metadata(path: Path) -> dict:
    """
    Extract family name, weight, and style from filename and internal metadata.
    Returns: {
        'family': str,
        'subfamily': str,  # e.g., 'Regular', 'Bold Italic'
        'weight': int,
        'style': str,      # 'normal' or 'italic'
        'filename': str
    }
    """
    filename = path.name
    stem = path.stem
    
    # Defaults
    weight = 400
    style = "normal"
    family_name = stem
    
    # 1. Try to get metadata from PIL
    try:
        font = ImageFont.truetype(str(path), 10)
        # font.getname() returns (font_family, font_subfamily) usually
        # but sometimes it's (display_name, style_name) depending on platform/font
        pil_names = font.getname()
        if pil_names and len(pil_names) >= 1:
            pil_family = pil_names[0]
            pil_style = pil_names[1] if len(pil_names) > 1 else ""
            
            # Use PIL family if it looks reasonable (not just "Regular")
            if pil_family and pil_family.lower() not in ["regular", "bold", "italic"]:
                family_name = pil_family
    except Exception:
        pass

    # 2. Refine family name using regex cleanup on the stem (fallback or cleanup)
    # If PIL failed or gave a messy name, we process the filename stem
    # We strip standard weight/width/style keywords to find the "Base" name.
    
    # Detect Italic in filename
    if re.search(r"italic|oblique", stem, re.I):
        style = "italic"
    
    # Detect Weight in filename
    lower_stem = stem.lower()
    found_weight = False
    for w_name, w_val in WEIGHT_MAP.items():
        # Match standalone or as part of camelCase/hyphenated
        # We look for the weight name preceded/followed by non-az chars or boundaries
        if w_name in lower_stem:
            # Simple check: is it actually that weight?
            # A more robust regex would be better but this covers most standard cases
            weight = w_val
            found_weight = True
            break
            
    # Cleaning up the Family Name from stem
    # Remove underscores, hyphens
    clean_name = stem.replace("_", " ").replace("-", " ")
    # Insert spaces in CamelCase (AdventPro -> Advent Pro)
    clean_name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", clean_name)
    clean_name = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", clean_name)
    
    # Remove weight/style keywords to isolate the Family Name
    remove_patterns = [
        r"\bitalic\b", r"\boblique\b",
        r"\bvariablefont\b", r"\bregular\b",
    ]
    
    # Add weights to remove patterns
    for w_name in WEIGHT_MAP.keys():
        remove_patterns.append(rf"\b{re.escape(w_name)}\b")

    # We do NOT remove width patterns (Condensed, Expanded etc.) because they usually constitute a separate Family in CSS
    # e.g. "Roboto Condensed" is a family. "Roboto" is a family.
    # If we removed "Condensed", they would merge, which might be desired if we had a variable font,
    # but with static files, it's safer to treat them as distinct families.
        
    temp_name = clean_name
    for pat in remove_patterns:
        temp_name = re.sub(pat, "", temp_name, flags=re.I)
        
    # Clean up extra spaces
    temp_name = re.sub(r"\s+", " ", temp_name).strip()
    
    # Correction for "Semi" leftover
    # If a name ends in " Semi", strip it.
    if temp_name.lower().endswith(" semi"):
        temp_name = temp_name[:-5]
    
    # Final cleanup of dangling special chars
    temp_name = temp_name.strip(" -_")

    if temp_name:
        family_name = temp_name
        
    return {
        "family": family_name,
        "weight": weight,
        "style": style,
        "filename": filename,
    }

def generate_css():
    font_files = list(FONTS_DIR.glob("*.ttf")) + list(FONTS_DIR.glob("*.otf"))
    
    # Group by family
    families = {}
    
    for f in font_files:
        meta = parse_font_metadata(f)
        fam = meta["family"]
        if fam not in families:
            families[fam] = []
        families[fam].append(meta)
        
    lines = ["/* Auto-generated from backend/fonts - Smart Grouping */"]
    
    # Sort families alphabetically
    for fam_name in sorted(families.keys()):
        variants = families[fam_name]
        
        # Sort variants by weight then style
        variants.sort(key=lambda x: (x['weight'], x['style']))
        
        for v in variants:
            css_block = f"""
@font-face {{
  font-family: "{fam_name}";
  src: url("./fonts/{v['filename']}") format("truetype");
  font-weight: {v['weight']};
  font-style: {v['style']};
}}
""".strip()
            lines.append(css_block)
            
    return "\n\n".join(lines)

if __name__ == "__main__":
    try:
        css_content = generate_css()
        out_path = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fonts.css"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(css_content)
        print(f"Successfully wrote {len(css_content)} bytes to {out_path}")
    except Exception as e:
        print(f"Error: {e}")

