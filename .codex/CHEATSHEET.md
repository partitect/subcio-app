# Cheatsheet (Dev)
- Run backend: `cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Export (example curl): `curl -F "video=@/path/video.mp4" -F "words_json=$(cat words.json)" -F "style_json={\"id\":\"fire-storm\"}" http://localhost:8000/api/export`
- Preview PyonFX effect: `curl -F "words_json=$(cat words.json)" -F "effect_type=fire_storm" -F "effect_config_json={}" http://localhost:8000/api/pyonfx/preview`
- List presets: `GET /api/presets` (reads backend/presets.json)
- CRUD presets: `/api/presets/create`, `/api/presets/update`, `/api/presets/{id} DELETE`
- PyonFX effects metadata: `GET /api/pyonfx/effects` (reads backend/pyonfx_effects.json)
