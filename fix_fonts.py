import os
import json
import shutil
import re
from pathlib import Path

# Paths
BASE_DIR = Path(r"C:\Users\TeKa\OneDrive\Desktop\sub-gen-ai")
BACKEND_FONTS_DIR = BASE_DIR / "backend" / "fonts"
UNUSED_DIR = BASE_DIR / "backend" / "unused_fonts"
FRONTEND_FONTS_DIR = BASE_DIR / "frontend" / "public" / "fonts"
PRESETS_FILE = BASE_DIR / "backend" / "presets.json"
CSS_FILE = BASE_DIR / "frontend" / "public" / "fonts.css"

def normalize_name(name: str) -> str:
    """Normalize name for comparison: lowercase, remove spaces/hyphens/underscores"""
    return re.sub(r"[\s_\-]+", "", name).lower()

def main():
    print("Starting Font Cleanup and Sync (Improved)...")

    # 1. Get used fonts from presets
    if not PRESETS_FILE.exists():
        print(f"Error: {PRESETS_FILE} not found!")
        return

    with open(PRESETS_FILE, 'r', encoding='utf-8') as f:
        presets = json.load(f)

    used_font_tokens = set()
    for p in presets.values():
        if "font" in p:
            # Normalize the requested font name
            used_font_tokens.add(normalize_name(p["font"]))

    print(f"Found {len(used_font_tokens)} unique font tokens used in presets.")
    # Debug: print tokens
    # print(used_font_tokens)

    # 2. Scan backend fonts and identify unused
    if not UNUSED_DIR.exists():
        UNUSED_DIR.mkdir(parents=True)

    font_files = list(BACKEND_FONTS_DIR.glob("*.ttf")) + list(BACKEND_FONTS_DIR.glob("*.otf"))
    
    moved_count = 0
    kept_files = []

    for f in font_files:
        file_token = normalize_name(f.stem)
        
        is_used = False
        
        # Check if any used token matches the file token
        # We check if the used token is a PREFIX of the file token
        # e.g. Used: "bricolagegrotesque"
        # File: "bricolagegrotesquebold" -> Match!
        # File: "bricolagegrotesque" -> Match!
        
        # Also check if File token is a PREFIX of used token (unlikely but possible if file is short)
        
        for token in used_font_tokens:
            if file_token.startswith(token):
                is_used = True
                break
            # Special case for "Advent Pro UltraExpanded" requesting "AdventPro_UltraExpanded-Bold"
            # Token: adventproultraexpanded
            # File: adventproultraexpandedbold
            # Match!
            
            # Special case: Preset "Advent Pro", File "AdventPro-Bold" -> Match
            
        if is_used:
            kept_files.append(f)
        else:
            # Move to unused
            try:
                shutil.move(str(f), str(UNUSED_DIR / f.name))
                moved_count += 1
            except Exception as e:
                print(f"Error moving {f.name}: {e}")

    print(f"Moved {moved_count} unused font files to {UNUSED_DIR}")
    print(f"Kept {len(kept_files)} font files.")

    # 3. Sync to frontend/public/fonts
    if not FRONTEND_FONTS_DIR.exists():
        FRONTEND_FONTS_DIR.mkdir(parents=True)

    # Copy ALL kept files to frontend
    copied_count = 0
    for f in kept_files:
        dest = FRONTEND_FONTS_DIR / f.name
        # Copy if not exists or different size
        if not dest.exists() or dest.stat().st_size != f.stat().st_size:
            shutil.copy2(str(f), str(dest))
            copied_count += 1
    
    print(f"Copied {copied_count} files to {FRONTEND_FONTS_DIR}")

    # 4. Generate fonts.css
    # Scan frontend fonts to be sure we only include what's there
    frontend_files = list(FRONTEND_FONTS_DIR.glob("*.ttf")) + list(FRONTEND_FONTS_DIR.glob("*.otf"))
    
    # Group by family is hard without metadata, but we can try to group by stem prefix
    # Actually, we should just generate @font-face for EVERY file, using the filename as family?
    # No, that breaks the mapping.
    # We need to map "Family Name" to the file.
    
    # For now, let's generate a generic CSS that defines a family for EACH file using its stem name
    # AND also try to group them.
    
    # But JASSUB uses the mapping from fontService.ts.
    # fontService.ts maps "Font Name" (from backend) to URL.
    # Backend returns "Font Name" from metadata.
    
    # The CSS is mainly for the HTML preview (if used) or if JASSUB uses system fonts (it doesn't).
    # But `fonts.css` is imported in `index.html`?
    # If JASSUB uses `availableFonts`, it doesn't need CSS.
    # BUT if we want to use these fonts in standard DOM elements (like the preset editor preview), we need CSS.
    
    # Let's generate CSS that includes ALL variants.
    # We will use the stem as the font-family for simplicity, OR try to be smart.
    # Let's just dump all of them.
    
    css_content = "/* Auto-generated from backend/fonts */\n\n"

    for f in frontend_files:
        # Use the stem as the family name for specific files
        # This allows "AdventPro-Bold" to be used if someone asks for it
        family_name = f.stem.replace("-", " ").replace("_", " ")
        
        css_content += f"@font-face {{\n"
        css_content += f"  font-family: \"{family_name}\";\n"
        css_content += f"  src: url(\"./fonts/{f.name}\") format(\"truetype\");\n"
        css_content += f"  font-weight: normal;\n"
        css_content += f"  font-style: normal;\n"
        css_content += f"}}\n\n"
        
        # Also try to generate a cleaner family name (e.g. "Advent Pro")
        # If we have multiple, this will create multiple @font-face with same family
        # which browsers handle by matching weight/style.
        # But we don't know the weight/style easily here without Pillow.
        # So let's stick to specific names for now to avoid conflicts.

    with open(CSS_FILE, 'w', encoding='utf-8') as f:
        f.write(css_content)

    print(f"Updated {CSS_FILE} with {len(frontend_files)} font rules.")

if __name__ == "__main__":
    main()
