
import json
import re
from pathlib import Path
import difflib

PRESETS_PATH = Path("backend/presets.json")
FONTS_CSS_PATH = Path("frontend/public/fonts.css")

def get_valid_families():
    content = FONTS_CSS_PATH.read_text(encoding="utf-8")
    # Extract family names
    families = set(m.group(1) for m in re.finditer(r'font-family: "(.*?)"', content))
    return sorted(families)

def normalize(s):
    return re.sub(r"[\s\-_]+", "", s).lower()

def fix_presets():
    valid_families = get_valid_families()
    valid_map = {normalize(f): f for f in valid_families}
    
    # Add manual overrides for tricky cases or missing fonts
    MANUAL_OVERRIDES = {
        "poppins": "Montserrat",      # Poppins (missing) -> Montserrat (Geometric Sans)
        "couriernew": "Roboto",       # Courier New (missing) -> Roboto (Safe fallback)
    }
    
    with open(PRESETS_PATH, "r", encoding="utf-8") as f:
        presets = json.load(f)
        
    changes = []
    
    for pid, style in presets.items():
        original_font = style.get("font", "Sans")
        if original_font in valid_families:
            continue
            
        # Try normalized match
        norm = normalize(original_font)
        
        # Check Manual Overrides first
        if norm in MANUAL_OVERRIDES:
            match = MANUAL_OVERRIDES[norm]
            style["font"] = match
            changes.append(f"{pid}: '{original_font}' -> '{match}' (Manual Override)")
            continue

        if norm in valid_map:
            match = valid_map[norm]
            style["font"] = match
            changes.append(f"{pid}: '{original_font}' -> '{match}' (Normalized)")
            continue
            
        # Try simple fuzzy match or token match?
        # If "Roboto Semi" -> "Roboto Semi Condensed", normalized is "robotosemi" vs "robotosemicondensed"
        # It won't match.
        
        # Try "startswith" match against valid families?
        possible = []
        for v in valid_families:
            if v.startswith(original_font) or original_font.startswith(v):
                possible.append(v)
        
        if possible:
            # Pick best?
            best = possible[0] # Naive
            style["font"] = best
            changes.append(f"{pid}: '{original_font}' -> '{best}' (StartsWith)")
            continue
            
        # Difflib close variations
        matches = difflib.get_close_matches(original_font, valid_families, n=1, cutoff=0.6)
        if matches:
            style["font"] = matches[0]
            changes.append(f"{pid}: '{original_font}' -> '{matches[0]}' (Fuzzy)")
        else:
            print(f"WARNING: No match found for {pid}: {original_font}")

    if changes:
        print(f"Fixed {len(changes)} preset font names:")
        for c in changes:
            print(c)
        
        with open(PRESETS_PATH, "w", encoding="utf-8") as f:
            json.dump(presets, f, indent=2, ensure_ascii=False)
    else:
        print("No changes needed.")

if __name__ == "__main__":
    fix_presets()
