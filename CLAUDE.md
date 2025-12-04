# CLAUDE.md - AI Development Guidelines for Subcio/PyCaps

> This document captures architectural decisions, patterns, and lessons learned during development. Future AI sessions should consult this document before making changes.

---

## � CRITICAL: Development Environment Setup

### Project Paths
```
Root:     E:\Projeler\ReactProjects\pycaps-main\pycaps-main
Backend:  E:\Projeler\ReactProjects\pycaps-main\pycaps-main\backend
Frontend: E:\Projeler\ReactProjects\pycaps-main\pycaps-main\frontend
Venv:     E:\Projeler\ReactProjects\pycaps-main\pycaps-main\.venv
```

### ⚠️ ALWAYS USE THESE EXACT COMMANDS

#### Starting Backend Server
```powershell
# CORRECT - Always use this exact command:
cd E:\Projeler\ReactProjects\pycaps-main\pycaps-main\backend; E:\Projeler\ReactProjects\pycaps-main\pycaps-main\.venv\Scripts\python.exe -m uvicorn main:app --reload

# WRONG - These will fail:
# uvicorn main:app --reload          # Wrong directory or wrong Python
# python -m uvicorn main:app         # System Python, not venv
# cd backend; uvicorn main:app       # Relative path may fail
```

#### Starting Frontend Server
```powershell
# CORRECT:
cd E:\Projeler\ReactProjects\pycaps-main\pycaps-main\frontend; npm run dev

# Alternative with full path:
Set-Location E:\Projeler\ReactProjects\pycaps-main\pycaps-main\frontend; npm run dev
```

#### Running Python Scripts
```powershell
# CORRECT - Always use venv Python:
cd E:\Projeler\ReactProjects\pycaps-main\pycaps-main\backend; E:\Projeler\ReactProjects\pycaps-main\pycaps-main\.venv\Scripts\python.exe script_name.py

# For pip install:
E:\Projeler\ReactProjects\pycaps-main\pycaps-main\.venv\Scripts\pip.exe install package_name
```

#### Running Tests
```powershell
cd E:\Projeler\ReactProjects\pycaps-main\pycaps-main\backend; E:\Projeler\ReactProjects\pycaps-main\pycaps-main\.venv\Scripts\python.exe -m pytest
```

### Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct | Why |
|----------|-----------|-----|
| `cd backend` | `cd E:\Projeler\...\backend` | Relative paths fail if terminal is in wrong dir |
| `python script.py` | `..\.venv\Scripts\python.exe script.py` | System Python lacks project dependencies |
| `pip install X` | `..\.venv\Scripts\pip.exe install X` | Must install to venv, not system |
| `uvicorn main:app` | `python -m uvicorn main:app` | Module execution is more reliable |

### Stopping Stuck Processes
```powershell
# Kill all Python processes (use when server is stuck):
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Kill specific port (8000 for backend):
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Environment Variables
```powershell
# Set before starting server:
$env:WHISPER_MODEL = "small"  # Options: tiny, base, small, medium, large
```

---

## �📋 Project Overview

**Subcio/PyCaps** is a subtitle generation and styling application with:
- **Backend**: FastAPI (Python) with Whisper transcription
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Core Feature**: Advanced ASS subtitle effects inspired by PyonFX

---

## 🏗️ Architecture

### Backend Structure

```
backend/
├── main.py                    # FastAPI app, endpoints, Whisper integration
├── styles/
│   ├── effects/
│   │   ├── pyonfx_effects.py       # Effect classes + PyonFXRenderer
│   │   ├── pyonfx_render_mixin.py  # Shared rendering logic (header, timestamps)
│   │   ├── pyonfx_render_impls.py  # Individual effect implementations
│   │   └── PYONFX_README.md        # Effect documentation (Turkish)
│   └── utils.py               # Helper functions (hex_to_ass, grouping)
├── auth/                      # Authentication system
├── payments/                  # Stripe integration
├── security/                  # Rate limiting, validation, audit
└── projects/                  # User project storage
```

### Effect System Architecture

The effect system uses a **Strategy + Dispatch Table** pattern:

1. **Effect Classes** (`pyonfx_effects.py`): Define effect metadata and initialization parameters
2. **Render Mixin** (`pyonfx_render_mixin.py`): Shared base functionality
3. **Render Implementations** (`pyonfx_render_impls.py`): Actual rendering logic
4. **Dispatch Table** (`RENDER_DISPATCH`): Maps effect names to render functions

```python
# Pattern: Effect registration
RENDER_DISPATCH = {
    "fire_storm": _render_fire_storm,
    "cyber_glitch": _render_cyber_glitch,
    # ... 80+ effects
}
```

### Why This Architecture?

1. **Separation of Concerns**: Effect metadata vs rendering logic
2. **Easy Extension**: Add new effect = add class + render function + dispatch entry
3. **Single Responsibility**: Each render function handles one effect
4. **Mixin Pattern**: Shared utilities without deep inheritance

---

## 🎨 Patterns

### 1. Effect Implementation Pattern

When adding a new effect:

```python
# Step 1: In pyonfx_effects.py - Add effect class
class MyNewEffect:
    """Description of the effect."""
    def __init__(self):
        pass

# Step 2: In pyonfx_effects.py - Register in EFFECTS dict
class PyonFXRenderer(PyonFXRenderMixin):
    EFFECTS = {
        # ...existing effects...
        "my_new_effect": MyNewEffect,
    }

# Step 3: In pyonfx_render_impls.py - Add render function
def _render_my_new_effect(self) -> str:
    """Implement the effect."""
    lines: List[str] = [self.render_ass_header()]
    cx, cy = self._get_center_coordinates()
    
    for word in self.words:
        start_ms = int(word.get("start", 0) * 1000)
        end_ms = int(word.get("end", start_ms / 1000) * 1000)
        duration = max(1, end_ms - start_ms)
        safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
        
        # Build dialogue line with ASS tags
        lines.append(
            f"Dialogue: 0,{self._ms_to_timestamp(start_ms)},{self._ms_to_timestamp(end_ms)},Default,,0,0,0,,"
            f"{{\\an5\\pos({cx},{cy})\\fad(100,100)}}{safe_text}"
        )
    
    return "\n".join(lines)

# Step 4: In pyonfx_render_impls.py - Add to RENDER_DISPATCH
RENDER_DISPATCH = {
    # ...existing...
    "my_new_effect": _render_my_new_effect,
}
```

### 2. ASS Subtitle Tag Reference

Common ASS override tags used in effects:

| Tag | Description | Example |
|-----|-------------|---------|
| `\an5` | Anchor point (5=center) | `{\an5}` |
| `\pos(x,y)` | Absolute position | `{\pos(960,540)}` |
| `\move(x1,y1,x2,y2)` | Movement animation | `{\move(0,0,100,100)}` |
| `\t(t1,t2,tags)` | Transform over time | `{\t(0,500,\fscx120)}` |
| `\fscx`, `\fscy` | Scale X/Y | `{\fscx110\fscy110}` |
| `\frz` | Z-rotation (degrees) | `{\frz45}` |
| `\blur` | Blur amount | `{\blur5}` |
| `\1c`, `\3c` | Primary/Outline color | `{\1c&H00FF00&}` |
| `\fad(in,out)` | Fade in/out (ms) | `{\fad(100,100)}` |
| `\p1` | Drawing mode on | `{\p1}shape{\p0}` |

### 3. Color Format Pattern

ASS uses BGR format with `&H` prefix:

```python
# In utils.py
def hex_to_ass(val: str) -> str:
    """Converts #RRGGBB to ASS &H00BBGGRR format."""
    if not val: return "&H00FFFFFF"
    if val.startswith("&H"): return val
    val = val.lstrip("#")
    if len(val) == 6:
        r, g, b = val[0:2], val[2:4], val[4:6]
        return f"&H00{b}{g}{r}"  # Note: BGR order!
    return "&H00FFFFFF"
```

### 4. Vertical Position Pattern

The `margin_v` style parameter uses a non-intuitive mapping:

```python
# margin_v: -100 (bottom) → 0 (center) → +100 (top)
# Screen coordinates: Y increases downward
def _get_center_coordinates(self):
    margin_v = int(self.style.get("margin_v", 0))
    center_y = 540  # Middle of 1080p
    
    if margin_v >= 0:
        # Positive = move up (decrease Y)
        cy = center_y - int((margin_v / 100) * (center_y - 80))
    else:
        # Negative = move down (increase Y)
        cy = center_y + int((abs(margin_v) / 100) * (1000 - center_y))
```

### 5. Safe Text Escaping

Always escape ASS special characters:

```python
safe_text = (word.get("text") or "").replace("{", r"\{").replace("}", r"\}")
```

---

## 🧪 Testing

### Running Effect Tests

```bash
cd backend
python test_pyonfx_effects.py
```

This generates `test_*_output.ass` files that can be opened in Aegisub for visual inspection.

### Testing Individual Effects

```python
from styles.effects import PyonFXRenderer

words = [
    {"text": "Hello", "start": 0.0, "end": 1.0},
    {"text": "World", "start": 1.0, "end": 2.0},
]

style = {
    "effect_type": "fire_storm",
    "font": "Arial",
    "font_size": 72,
    "primary_color": "#FFFFFF",
}

renderer = PyonFXRenderer(words, style)
ass_content = renderer.render()
print(ass_content)
```

### Validation Checklist for New Effects

- [ ] Effect class exists in `pyonfx_effects.py`
- [ ] Effect registered in `PyonFXRenderer.EFFECTS`
- [ ] Render function exists in `pyonfx_render_impls.py`
- [ ] Effect added to `RENDER_DISPATCH`
- [ ] Effect uses `self.render_ass_header()` for consistent header
- [ ] Text is escaped with `replace("{", r"\{").replace("}", r"\}")`
- [ ] Timestamps use `self._ms_to_timestamp(ms)`
- [ ] Duration calculated with `max(1, end_ms - start_ms)` to avoid zero

---

## ⚠️ Gotchas

### 1. Time Units Mismatch

**Problem**: Words come in **seconds** (float), ASS uses **milliseconds** (int) with centisecond precision.

```python
# WRONG
start = word.get("start", 0)  # This is seconds!

# CORRECT
start_ms = int(word.get("start", 0) * 1000)
```

### 2. Zero Duration Prevention

**Problem**: If start == end, duration is 0, causing division errors or invisible text.

```python
# Always use max(1, ...)
duration = max(1, end_ms - start_ms)
```

### 3. Layer Ordering

**Problem**: Effects with particles/shadows need proper layering.

```python
# Lower layer = behind, Higher layer = front
"Dialogue: 0,..."  # Background particles
"Dialogue: 1,..."  # Shadow
"Dialogue: 2,..."  # Main text
```

### 4. Particle Effects Performance

**Problem**: Too many particles = slow rendering in video players.

```python
# Limit particle count
particle_count = int(self.effect_config.get("particle_count", 12))
particle_count = min(particle_count, 20)  # Cap at 20
```

### 5. Color String Normalization

**Problem**: Colors can come in various formats: `#FFFFFF`, `&H00FFFFFF`, `&HFFFFFF&`, `FFFFFF`

```python
# Normalize before use
color = color.replace("&", "").replace("H", "").replace("#", "").replace("h", "")
color = f"&H{color.upper()}&"
```

### 6. BorderStyle=3 for Box Effects

**Problem**: Creating opaque box behind text requires special style.

```python
# BorderStyle=3 uses Outline as box padding, BackColour as box color
# Style: ...,BorderStyle=3,Outline=15,Shadow=0,...
```

### 7. Effect Config Access Pattern

**Problem**: Effect config can be missing or have different sources.

```python
# Safe pattern: check effect_config first, then effect object, then default
particle_count = int(self.effect_config.get(
    "particle_count",
    getattr(self.effect, "particle_count", 12)
))
```

### 8. Python Import Context

**Problem**: Module can run as script or package, imports fail differently.

```python
# Pattern used in main.py
try:
    from .styles.effects import PyonFXRenderer  # As package
except ImportError:
    from styles.effects import PyonFXRenderer    # As script
```

---

## 📝 Adding New Effect Categories

When adding a batch of related effects (e.g., "Party Effects"):

1. **Group with comment headers** in `pyonfx_render_impls.py`:
   ```python
   # ============== GROUP 9: PARTY / FUN ==============
   ```

2. **Document the category** in `PYONFX_README.md`

3. **Test all effects in group** before committing

4. **Update presets.json** if adding user-selectable presets

---

## 🔧 Common Debugging

### Effect Not Rendering

1. Check effect name matches in all three places:
   - `EFFECTS` dict key
   - `RENDER_DISPATCH` key
   - API/frontend calling code

2. Check the render function is returning a string, not None

### Text Not Visible

1. Check layer ordering (main text should be highest layer)
2. Check alpha values in colors (`&H00FFFFFF` = opaque, `&HFF000000` = transparent)
3. Verify position is within screen bounds (1920x1080)

### Animation Not Working

1. Check `\t()` tag syntax
2. Verify time values are positive integers
3. Ensure transform end time <= dialogue end time

---

## 🎛️ Admin Preset Management

### Architecture Overview

The admin preset system allows CRUD operations on subtitle presets with advanced features.

### Key Files
- **Backend**: `backend/main.py` - Preset CRUD endpoints
- **Backend**: `backend/presets.json` - Preset storage
- **Backend**: `backend/preset_categories.json` - Category definitions
- **Backend**: `backend/pyonfx_effects.json` - Effect configs with schemas
- **Frontend**: `frontend/src/pages/admin/AdminPresets.tsx` - Admin UI

### Available Features

| Feature | Status | Description |
|---------|--------|-------------|
| Effect Type Dropdown | ✅ | Select from 80+ effects with categories |
| Dynamic Effect Config | ✅ | Form generated from effect's config_schema |
| Screenshot System | ✅ | html2canvas capture, saves to /sspresets/ |
| Import/Export | ✅ | Bulk backup/restore as JSON |
| Dynamic Categories | ✅ | CRUD endpoints for /api/preset-categories |
| Effect Type Filter | ✅ | Filter presets by effect type |
| Preset Duplication | ✅ | Clone existing presets |
| Live Preview | ✅ | PresetPreview component in edit dialog |

### API Endpoints

```
GET    /api/presets                    - List all presets (includes thumbnail paths)
POST   /api/presets/create             - Create new preset
POST   /api/presets/update             - Update existing preset
DELETE /api/presets/{preset_id}        - Delete preset
GET    /api/presets/export             - Export all presets as JSON
POST   /api/presets/import             - Import presets from JSON
POST   /api/presets/screenshot         - Save screenshot (base64 image)
GET    /api/effect-types               - Get all effects with config_schema
GET    /api/preset-categories          - Get categories
POST   /api/preset-categories          - Create category
PUT    /api/preset-categories/{id}     - Update category
DELETE /api/preset-categories/{id}     - Delete category
```

### Effect Config Schema

Effects can define their configurable parameters in `pyonfx_effects.json`:

```json
{
  "fire_storm": {
    "name": "Fire Storm",
    "description": "Glowing text with outward star particles",
    "config": {
      "particle_count": {
        "type": "number",
        "min": 1,
        "max": 50,
        "default": 12,
        "description": "How many particles to emit per word"
      },
      "colors": {
        "type": "array",
        "default": ["&H0000FF&", "&H00FFFF&"],
        "description": "Particle color palette (ASS BGR hex)"
      }
    }
  }
}
```

The frontend generates forms automatically:
- `type: "number"` → TouchSlider with min/max
- `type: "array"` → Comma-separated text field

### Screenshot Storage

Screenshots are saved to:
```
frontend/public/sspresets/{preset_id}.png
```

And served at:
```
/sspresets/{preset_id}.png
```

The `GET /api/presets` endpoint automatically checks for existing thumbnails.

---

## 📚 Resources

- **ASS Specs**: https://github.com/libass/libass/blob/master/doc/ass-specs.md
- **PyonFX Original**: https://github.com/CoffeeStraw/PyonFX
- **Aegisub**: http://www.aegisub.org/

---

*Last Updated: December 4, 2025*
*Purpose: Guide AI assistants in maintaining and extending the Subcio codebase*

---

## 🖥️ Desktop Application (Electron)

### Overview

Subcio can run as a standalone desktop application using Electron.

### Electron Structure

```
electron/
├── main.js          # Main process - window management, backend spawning
├── preload.js       # Context bridge for renderer
├── package.json     # Electron dependencies and build config
└── assets/
    ├── icon.png     # App icon (256x256)
    ├── icon.ico     # Windows icon
    └── tray-icon.png # System tray icon (32x32)
```

### Running in Development

```bash
# Option 1: Use the batch file
start-desktop-dev.bat

# Option 2: Manual
# Terminal 1: Backend
cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Electron
cd electron && npm start
```

### Building Portable EXE

```bash
# Build everything
build-desktop.bat

# Or manually:
cd frontend && npm run build
cd electron && npm run build:portable

# Output: electron/dist/Subcio-Portable-1.0.0.exe
```

### Build Configuration

The `electron/package.json` uses `electron-builder` with these targets:

| Target | Description | Output |
|--------|-------------|--------|
| `nsis` | Installer EXE | Subcio-1.0.0-x64.exe |
| `portable` | Single EXE, no install | Subcio-Portable-1.0.0.exe |

### How It Works

1. **Startup**: Electron spawns Python backend as child process
2. **Backend**: Runs on `127.0.0.1:8000` 
3. **Frontend**: In dev mode loads Vite server, in prod loads bundled files
4. **System Tray**: App minimizes to tray, double-click to restore
5. **Cleanup**: Backend process killed on app exit

### Key Features

- **Single Instance**: Only one copy can run (uses `app.requestSingleInstanceLock`)
- **Tray Support**: Minimize to system tray
- **Native Menu**: Turkish-localized app menu
- **External Links**: Open in default browser
- **Cross-Origin Isolated**: Enables SharedArrayBuffer for FFmpeg.wasm

### Startup Scripts

| Script | Description |
|--------|-------------|
| `start-subcio.bat` | Simple batch - starts backend + frontend + opens browser |
| `start-desktop-dev.bat` | Electron dev mode with hot reload |
| `build-desktop.bat` | Full production build |
| `stop-subcio.bat` | Kill all related processes |


