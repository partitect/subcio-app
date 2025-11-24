# Porting a legacy render_engine preset to PyonFXRenderer

1) Identify effect logic in `backend/styles/advanced.py` or `backend/styles/particles.py`.
2) Add an Effect class stub + map entry in `backend/styles/effects/pyonfx_effects.py` (EFFECTS dict).
3) Implement `_render_<effect>` (insert before `_build_effect_tags`) that emits ASS lines:
   - Use `self._get_center_coordinates()` and `self.render_ass_header()`.
   - Escape text: `(word.get("text") or "").replace("{", r"\{").replace("}", r"\}")`.
   - Convert colors via `hex_to_ass` if config-sourced.
4) Wire preset:
   - Set `effect_type`/`effect_config` in `backend/presets.json` for the preset ID.
   - Add metadata entry to `backend/pyonfx_effects.json` (name/description/config schema).
   - Ensure `main.py` PyonFX dispatch list contains the new effect_type.
5) Quick test:
   - Use `backend/examples/words_sample.json` with `/api/pyonfx/preview` (see `.codex/QUICK_START.md`).
   - Visually inspect ASS or burn to video for sanity.
