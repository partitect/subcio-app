# Troubleshooting

- Text color shows black in render: ensure `render_ass_header` uses `hex_to_ass` on primary/secondary/outline/back; add explicit `\1c`/`\3c` in `_render_*` if needed.
- Effect not applied (falls back to legacy): check `effect_type` is set in preset, matches PyonFX dispatch list in main.py, and EFFECTS dict in pyonfx_effects.py.
- Missing preset after reload: confirm `backend/presets.json` saved (CRUD writes there) and file is tracked. Restart dev server if caching.
- Effect metadata not showing in UI: add entry to `backend/pyonfx_effects.json`; ensure JSON is valid; restart if cached.
- Random layout jitter on grouped text: set alignment/pos consistent; escape braces; precompute widths if grouping.
- Heavy particle lag: reduce counts in `effect_config` (particle_count, ring_count, etc.); cap blur; add seed or bounds.
