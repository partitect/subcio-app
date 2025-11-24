# App Overview
- FastAPI backend that generates ASS subtitles (karaoke/effect-heavy) and burns to video via ffmpeg. Words/timings come from Whisper pipeline; output is .ass then ffmpeg burn.
- Two render paths: custom render_engine (legacy StyleRenderer/AdvancedRenderer) and PyonFXRenderer (custom ASS builder inspired by PyonFX). Migration in progress toward PyonFXRenderer based on `effect_type`.
- Fonts scanned from `backend/fonts`; deterministic font pick per preset if missing/invalid. Uses PIL for text width in legacy code.

# Key Files
- `backend/main.py`: FastAPI app, export/preview endpoints, preset CRUD (now reads/writes `backend/presets.json`), pyonfx effects list from `backend/pyonfx_effects.json`. Dispatch: if style has `effect_type` in known list -> PyonFXRenderer, else AdvancedRenderer.
- `backend/styles/effects/pyonfx_effects.py`: Custom PyonFXRenderer and many `_render_*` functions emitting ASS. Already ported effects: fire_storm, cyber_glitch, bubble_floral, thunder_strike, rainbow_wave, earthquake_shake, horror_creepy, luxury_gold, comic_book, pulse, colorful, ghost_star, matrix_rain, electric_shock, smoke_trail, pixel_glitch, neon_sign, fade_in_out, slide_up, zoom_burst, bounce_in, tiktok_yellow_box. Effect stubs exist for falling_heart, thunder_storm, ice_crystal, cosmic_stars, ocean_wave, butterfly_dance (need implementations).
- Legacy renderers for reference: `backend/styles/advanced.py`, `backend/styles/particles.py`, `backend/styles/text_effects.py`.
- Data files: `backend/presets.json` (all presets; many now have `effect_type`/`effect_config`), `backend/pyonfx_effects.json` (UI metadata for effects), roadmaps/notes: `backend/PORTING_TODO.txt`, `backend/ROADMAP_PYONFX.txt`, `backend/ROADMAP_APP.txt`, `backend/ROADMAP_UI_UX.txt`.

# Pending PyonFX Ports
- Implement `_render_*` in pyonfx_effects.py for: falling_heart, thunder_storm, ice_crystal, cosmic_stars, ocean_wave, butterfly_dance. Logic is in legacy particles/advanced files.
- Update `presets.json` with `effect_type`/`effect_config` for remaining legacy presets (e.g., neon-pulse, kinetic-bounce, cinematic-blur, typewriter-pro, word-pop, retro-arcade, news-ticker, tiktok-group, 3d-spin, shear-force, double-shadow, karaoke-classic/pro/sentence, tiktok-box-group, sakura-dream, phoenix-flames, welcome-my-life, dynamic-highlight, mademyday).
- Add metadata entries to `pyonfx_effects.json` for new effect_types and ensure main.py dispatch list includes them.

# Testing/Notes
- No automated visual regression; consider ASS snapshot or image diff for critical presets.
- main.py no longer rewrites itself; presets/effects are edited via JSON files.
- `git status` (last noted): modified main.py, pyonfx_effects.py; new tracked presets.json, pyonfx_effects.json; render_engine_backup.py untracked (leave untouched).
