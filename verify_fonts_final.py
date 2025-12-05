
import json
import re
from pathlib import Path
import sys

PRESETS_PATH = Path("backend/presets.json")
FONTS_CSS_PATH = Path("frontend/public/fonts.css")
FONTS_DIR = Path("backend/fonts")

def verify():
    print("--- 1. Checking Font Definitions in CSS ---")
    if not FONTS_CSS_PATH.exists():
        print("FAIL: fonts.css not found!")
        return

    css_content = FONTS_CSS_PATH.read_text(encoding="utf-8")
    # Parse @font-face blocks
    # @font-face {
    #   font-family: "Family Name";
    #   src: url("./fonts/Filename.ttf") ...
    #   font-weight: 400;
    # }
    
    css_families = {} # family -> list of {weight, style, file}
    defined_files = set()
    
    # Simple regex parsing
    blocks = re.split(r"}", css_content)
    for block in blocks:
        if "@font-face" not in block:
            continue
            
        fam_match = re.search(r'font-family:\s*"(.*?)";', block)
        file_match = re.search(r'src:\s*url\("\./fonts/(.*?)"\)', block)
        weight_match = re.search(r'font-weight:\s*(\d+);', block)
        style_match = re.search(r'font-style:\s*(.*?);', block)
        
        if fam_match and file_match:
            fam = fam_match.group(1)
            file = file_match.group(1)
            weight = int(weight_match.group(1)) if weight_match else 400
            style = style_match.group(1) if style_match else "normal"
            
            if fam not in css_families:
                css_families[fam] = []
            css_families[fam].append({
                "file": file,
                "weight": weight,
                "style": style
            })
            defined_files.add(file)
            
    print(f"Found {len(css_families)} unique font families in CSS.")
    print(f"Index of {len(defined_files)} font files.")
    
    print("\n--- 2. Verifying File Existence ---")
    missing_files = []
    for f_name in defined_files:
        if not (FONTS_DIR / f_name).exists():
            missing_files.append(f_name)
    
    if missing_files:
        print(f"FAIL: {len(missing_files)} fonts defined in CSS are missing from disk:")
        for m in missing_files:
            print(f"  - {m}")
    else:
        print("PASS: All CSS font files exist on disk.")

    print("\n--- 3. Checking Presets.json Consistency ---")
    with open(PRESETS_PATH, "r", encoding="utf-8") as f:
        presets = json.load(f)
        
    used_fonts = set()
    missing_in_css = set()
    
    for pid, style in presets.items():
        font = style.get("font")
        if not font:
            continue
        used_fonts.add(font)
        if font not in css_families:
            missing_in_css.add(f"{font} (used in {pid})")

    if missing_in_css:
        print(f"FAIL: {len(missing_in_css)} fonts used in presets are NOT defined in CSS:")
        for m in sorted(missing_in_css):
            print(f"  - {m}")
    else:
        print("PASS: All fonts used in presets are defined in CSS.")

    print("\n--- 4. Checking for Unused Fonts ---")
    css_fam_set = set(css_families.keys())
    unused = css_fam_set - used_fonts
    print(f"INFO: {len(unused)} font families available but not currently used in any preset.")
    # This is not a fail, just info.

    print("\n--- 5. Checking Font Weight Capabilities ---")
    # Check if we have Bold/Italic variants for commonly used fonts
    # Just sampling a few
    sample_check = ["Advent Pro", "Roboto", "Montserrat"]
    for fam in sample_check:
        if fam in css_families:
            variants = css_families[fam]
            weights = set(v['weight'] for v in variants)
            styles = set(v['style'] for v in variants)
            print(f"Family '{fam}': Weights={sorted(weights)}, Styles={sorted(styles)}")
            if len(weights) < 2 and len(styles) < 2:
                print(f"  WARN: '{fam}' seems to have limited variants (maybe only Regular/400).")
                
    print("\n--- 6. Font Naming Sanity Check ---")
    # Check for weird names like "Roboto Semi"
    weird_names = []
    for fam in css_families:
        if fam.lower().endswith(" semi"):
            weird_names.append(fam)
        if "variable" in fam.lower():
            # Variable fonts usually normalized, checking if name is clean
            pass
            
    if weird_names:
        print(f"WARN: Suspected bad font names: {weird_names}")
    else:
        print("PASS: No obviously bad naming patterns detected.")

if __name__ == "__main__":
    verify()
