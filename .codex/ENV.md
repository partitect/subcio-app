# Environment Notes
- Python: target 3.10+ (faster_whisper, PyonFX, PIL required)
- Install deps: `cd backend && pip install -r requirements.txt` (ensure PyonFX installed if not in requirements)
- Fonts: place .ttf/.otf in `backend/fonts`; main.py scans and picks deterministic fonts per preset
- External tools: ffmpeg must be available on PATH for burn; Whisper model download on first run (device auto-selects CUDA if nvidia-smi present)
- Data files: presets stored in `backend/presets.json`; effect metadata in `backend/pyonfx_effects.json` (both tracked)
