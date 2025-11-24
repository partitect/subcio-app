# Dev Workflow (fast path)

1) Start backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2) Edit presets/effects:
   - Presets: `backend/presets.json`
   - Effect metadata: `backend/pyonfx_effects.json`
   - Renderers: `backend/styles/effects/pyonfx_effects.py` (insert `_render_*` before `_build_effect_tags`)
3) Quick preview: use sample words (`backend/examples/words_sample.json`) with `/api/pyonfx/preview` (see `.codex/QUICK_START.md`).
4) If adding new effect_type:
   - Update PyonFX dispatch list in `main.py` (effect_type inclusion).
   - Add Effect class stub + `_render_*`.
   - Add metadata entry to `pyonfx_effects.json`.
   - Set `effect_type` in `presets.json` for the target preset.
5) Validate ASS: inspect generated ASS or burn a short clip; for quick check, just generate `.ass` without ffmpeg.

# Fast checks
- `git status` to ensure presets/effects JSON tracked.
- If colors wrong: ensure `hex_to_ass` used in headers and tags.
- If fallback to legacy: check `effect_type` string matches dispatch list and EFFECTS dict.
