
import re
from pathlib import Path
from PIL import ImageFont

WEIGHT_MAP = {
    "thin": 100, "hairline": 100,
    "extralight": 200, "extra-light": 200, "ultralight": 200, "ultra-light": 200,
    "light": 300,
    "regular": 400, "normal": 400, "book": 400, "medium": 500,
    "semibold": 600, "semi-bold": 600, "demibold": 600,
    "bold": 700,
    "extrabold": 800, "extra-bold": 800, "ultrabold": 800, "ultra-bold": 800, "heavy": 800,
    "black": 900, "extrablack": 950
}

def parse_font_metadata(filename: str) -> dict:
    stem = Path(filename).stem
    family_name = stem
    weight = 400
    style = "normal"
    
    # Mock PIL (skipping for this test, focusing on regex)
    
    # 2. Refine family name
    if re.search(r"italic|oblique", stem, re.I):
        style = "italic"
    
    lower_stem = stem.lower()
    for w_name, w_val in WEIGHT_MAP.items():
        if w_name in lower_stem:
            weight = w_val
            break
            
    clean_name = stem.replace("_", " ").replace("-", " ")
    clean_name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", clean_name)
    clean_name = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", clean_name)
    
    remove_patterns = [r"\bitalic\b", r"\boblique\b", r"\bvariablefont\b", r"\bregular\b"]
    for w_name in WEIGHT_MAP.keys():
        remove_patterns.append(rf"\b{re.escape(w_name)}\b")
        
    temp_name = clean_name
    print(f"DEBUG: Before cleaning: '{temp_name}'")
    for pat in remove_patterns:
        temp_name = re.sub(pat, "", temp_name, flags=re.I)
        
    temp_name = re.sub(r"\s+", " ", temp_name).strip()
    print(f"DEBUG: After cleaning: '{temp_name}'")
    
    if temp_name:
        family_name = temp_name
        
    return {"family": family_name, "weight": weight}

print("--- Testing Lemonada-Bold ---")
print(parse_font_metadata("Lemonada-Bold.ttf"))

print("\n--- Testing Roboto_SemiCondensed-Bold ---")
print(parse_font_metadata("Roboto_SemiCondensed-Bold.ttf"))
