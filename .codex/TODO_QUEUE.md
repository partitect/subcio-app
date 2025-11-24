# Short-Term TODO
- Finish PyonFX renderers for: falling_heart, thunder_storm, ice_crystal, cosmic_stars, ocean_wave, butterfly_dance (insert _render_* before _build_effect_tags in backend/styles/effects/pyonfx_effects.py).
- Tag remaining legacy presets in backend/presets.json with effect_type/effect_config; add corresponding entries to backend/pyonfx_effects.json; ensure main.py dispatch list includes new effect_types.
- Consider splitting pyonfx_effects.py into modules/helpers to keep size manageable after remaining ports.
