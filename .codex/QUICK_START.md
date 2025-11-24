# Quick Start (Dev)

## Run backend (PowerShell)
```
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Sample preview (PyonFX)
```
$words = Get-Content ../backend/examples/words_sample.json -Raw
curl -Method POST -Uri http://localhost:8000/api/pyonfx/preview `
  -Form @{ words_json=$words; effect_type="fire_storm"; effect_config_json="{}" } `
  -OutFile preview.ass
```

## Sample export
```
$words = Get-Content ../backend/examples/words_sample.json -Raw
curl -Method POST -Uri http://localhost:8000/api/export `
  -Form @{ video="@C:/path/video.mp4"; words_json=$words; style_json="{\"id\":\"fire-storm\"}" } `
  -OutFile export.mp4
```

Adjust paths as needed; words_sample.json is a tiny fixture for smoke tests.
