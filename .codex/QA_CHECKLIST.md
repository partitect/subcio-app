# QA Checklist (quick)
- Preview works: `/api/pyonfx/preview` returns ASS; colors and positions correct.
- Preset list: `/api/presets` includes new/updated preset with correct `effect_type`.
- Effects list: `/api/pyonfx/effects` shows metadata entry.
- Dispatch: style with effect_type renders via PyonFXRenderer (not legacy).
- Visual sanity: text color, outline, alignment correct; no unescaped braces.
- Performance sanity: heavy particle presets respect configured counts; no runaway loops.
- Files tracked: `presets.json`, `pyonfx_effects.json`, renderer changes committed; no unintended files modified.
