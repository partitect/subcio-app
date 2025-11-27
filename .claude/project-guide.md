# Subcio Project Guide

Bu doküman, **Subcio** projesinin kapsamlı bir teknik rehberidir. Proje, video içerikleri için otomatik altyazı oluşturma, düzenleme ve animasyonlu efektler uygulama yeteneğine sahip bir web uygulamasıdır.

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Backend Detayları](#backend-detayları)
4. [Frontend Detayları](#frontend-detayları)
5. [PyonFX Efekt Sistemi](#pyonfx-efekt-sistemi)
6. [API Referansı](#api-referansı)
7. [Veri Yapıları](#veri-yapıları)
8. [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
9. [Geliştirme Rehberi](#geliştirme-rehberi)

---

## Proje Genel Bakış

### Amaç
Subcio, kullanıcıların video içeriklerine profesyonel görünümlü, animasyonlu altyazılar eklemesini sağlayan bir araçtır. Temel özellikleri:

- **Otomatik Transkripsiyon**: Faster-Whisper AI modeli ile video/ses dosyalarından kelime düzeyinde zamanlama bilgisi çıkarma
- **Görsel Altyazı Düzenleyici**: Real-time önizleme ile stil ve zamanlama düzenleme
- **50+ Animasyon Efekti**: PyonFX tabanlı profesyonel animasyon presetleri
- **ASS Format Desteği**: Advanced SubStation Alpha formatında altyazı üretimi
- **Video Export**: FFmpeg ile altyazı yakma (burn-in)

### Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 18, TypeScript, Material UI, Vite |
| **Backend** | FastAPI (Python 3.8+) |
| **AI/ML** | Faster-Whisper (OpenAI Whisper tabanlı) |
| **Altyazı Render** | JASSUB (WebAssembly ASS renderer) |
| **Video İşleme** | FFmpeg |
| **Efekt Motoru** | PyonFX |

---

## Mimari Yapı

```
subcio/
├── backend/                     # FastAPI Backend
│   ├── main.py                  # Ana API endpoint'leri
│   ├── data_store.py            # JSON veri yönetimi
│   ├── presets.json             # Preset konfigürasyonları
│   ├── pyonfx_effects.json      # Efekt tanımlamaları
│   ├── requirements.txt         # Python bağımlılıkları
│   ├── fonts/                   # TTF/OTF font dosyaları
│   ├── exports/                 # Geçici export dosyaları
│   ├── projects/                # Kaydedilen projeler
│   └── styles/
│       ├── effects/
│       │   ├── __init__.py
│       │   ├── pyonfx_effects.py      # Efekt sınıfları
│       │   ├── pyonfx_render_mixin.py # Render yardımcıları
│       │   └── pyonfx_render_impls.py # Efekt implementasyonları
│       └── utils.py
│
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── App.tsx              # Router yapılandırması
│   │   ├── main.jsx             # Entry point
│   │   ├── types.ts             # TypeScript tip tanımları
│   │   ├── components/
│   │   │   ├── JSOOverlay.jsx   # JASSUB altyazı overlay
│   │   │   ├── LoadingOverlay.jsx
│   │   │   └── PresetEditor.jsx
│   │   └── pages/
│   │       ├── LandingPage.tsx  # Ana sayfa
│   │       ├── UploadPage.tsx   # Video yükleme
│   │       ├── EditorPage.tsx   # Ana düzenleyici
│   │       └── ExportPage.tsx   # Export sayfası
│   ├── public/
│   │   ├── fonts/               # Frontend fontları
│   │   ├── jassub/              # JASSUB WASM dosyaları
│   │   ├── sspresets/           # Preset önizleme görselleri
│   │   └── test-video/          # Demo videoları
│   └── package.json
│
└── aaspresets/                  # Aegisub ASS preset koleksiyonu
    ├── Aegisub/
    │   ├── ass/                 # .ass template dosyaları
    │   └── lua/                 # Aegisub Lua scriptleri
    └── pyonfx/
```

---

## Backend Detayları

### main.py - Ana Modül

#### Temel Bileşenler

**1. Whisper Model Yönetimi**
```python
DEFAULT_MODEL = os.getenv("WHISPER_MODEL", "medium")
DEVICE = "cuda" if shutil.which("nvidia-smi") else "cpu"
MODEL_CACHE: dict[str, WhisperModel] = {}
```
- Model bir kez yüklenir ve cache'lenir
- CUDA varsa GPU, yoksa CPU kullanılır
- Desteklenen modeller: tiny, base, small, medium, large

**2. Font Yönetimi**
```python
FONTS_DIR = Path(__file__).resolve().parent / "fonts"
FONT_ENTRIES: list[dict] = load_font_name_list()
```
- TTF/OTF fontlar `backend/fonts/` dizininden yüklenir
- Font isimleri PIL ile normalize edilir
- Her preset için deterministic font ataması yapılır

**3. Proje Yönetimi**
```python
PROJECTS_DIR = Path(__file__).resolve().parent / "projects"
```
Proje yapısı:
```
projects/{project_id}/
├── video.mp4          # Kaynak video
├── transcript.json    # Transkripsiyon verisi
├── subtitles.json     # Altyazı segmentleri
├── config.json        # Proje konfigürasyonu
└── thumb.jpg          # Thumbnail
```

### data_store.py - Veri Yönetimi

```python
PRESETS_FILE = Path(__file__).resolve().parent / "presets.json"
EFFECTS_FILE = Path(__file__).resolve().parent / "pyonfx_effects.json"

def load_presets() -> dict:
    """presets.json dosyasından preset'leri yükler"""

def save_presets(data: Dict[str, Any]) -> None:
    """Preset'leri presets.json'a kaydeder"""

def load_effects() -> dict:
    """pyonfx_effects.json'dan efekt tanımlarını yükler"""
```

### PyonFX Efekt Sistemi

#### Efekt Mimarisi

```
PyonFXRenderer (main renderer)
    ├── words: List[Dict]      # Kelime zamanlama verisi
    ├── style: Dict            # Stil konfigürasyonu
    ├── effect_type: str       # Aktif efekt tipi
    └── effect: EffectClass    # Efekt instance'ı

EFFECTS = {
    "bulge": BulgeEffect,
    "shake": ShakeEffect,
    "wave": WaveEffect,
    "fire_storm": FireStormEffect,
    "cyber_glitch": CyberGlitchEffect,
    ... (50+ efekt)
}
```

#### Mevcut Efektler

| Kategori | Efektler |
|----------|----------|
| **Temel Animasyonlar** | bulge, shake, wave, chromatic |
| **Parçacık Efektleri** | fire_storm, bubble_floral, cosmic_stars, sakura_dream |
| **Glitch/Retro** | cyber_glitch, pixel_glitch, matrix_rain, retro_arcade |
| **Karaoke** | karaoke_classic, karaoke_pro, karaoke_sentence, dynamic_highlight |
| **TikTok Style** | tiktok_group, tiktok_yellow_box, tiktok_box_group |
| **Doğa/Hava** | thunder_storm, ice_crystal, ocean_wave, phoenix_flames |
| **Text Animasyonları** | fade_in_out, slide_up, zoom_burst, bounce_in, word_pop |
| **3D/Transform** | spin_3d, shear_force, double_shadow |
| **Özel** | neon_sign, luxury_gold, horror_creepy, news_ticker |

---

## Frontend Detayları

### Sayfa Yapısı

**1. LandingPage** (`/`)
- Proje listesi
- Yeni proje oluşturma
- Demo modu erişimi

**2. UploadPage** (`/upload`)
- Video yükleme
- Transkripsiyon başlatma
- Model ve dil seçenekleri

**3. EditorPage** (`/editor/:projectId`)
- Ana düzenleme arayüzü
- 3 tab: Presets, Style, Transcript
- Real-time ASS önizleme

**4. ExportPage** (`/export/:projectId`)
- Video indirme
- Export ayarları

### Önemli Bileşenler

#### JSOOverlay.jsx
```jsx
// JASSUB WebAssembly renderer ile ASS altyazı görüntüleme
import JASSUB from 'jassub';

export default function JSOOverlay({ videoRef, assContent, fonts }) {
  // Video elementi üzerine ASS overlay render eder
  // WebWorker + WASM ile performanslı render
}
```

#### EditorPage.tsx - Stil Yönetimi

**Renk Dönüşümleri:**
```typescript
// ASS Format: &HAABBGGRR
// CSS Format: #RRGGBB

const assToHex = (ass: string) => {...}  // ASS → CSS
const hexToAss = (hex: string) => {...}  // CSS → ASS
```

**Stil Yapısı:**
```typescript
type StyleConfig = {
  id: string;
  font?: string;
  font_size?: number;
  primary_color?: string;      // Text rengi
  secondary_color?: string;    // Karaoke vurgu rengi
  outline_color?: string;      // Kenar rengi
  shadow_color?: string;       // Gölge rengi
  back_color?: string;         // Arka plan
  border?: number;             // Kenar kalınlığı
  shadow_blur?: number;        // Gölge bulanıklığı
  alignment?: number;          // 1-9 pozisyon
  effect_type?: string;        // Efekt tipi
  effect_config?: EffectConfig;
  // ... diğer özellikler
};
```

---

## API Referansı

### Transkripsiyon

```
POST /api/transcribe
```
| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| file | File | Video/audio dosyası |
| model_name | string | Whisper model (default: medium) |
| language | string? | Dil kodu (auto-detect için boş) |
| use_vad | bool | Voice Activity Detection |

**Response:**
```json
{
  "language": "tr",
  "device": "cuda",
  "model": "medium",
  "words": [
    {"start": 0.5, "end": 1.2, "text": "Merhaba", "confidence": 0.95}
  ],
  "projectId": "abc123",
  "project": {...}
}
```

### Preview & Export

```
POST /api/preview-ass
```
ASS içeriği oluşturur (video burn-in olmadan)

```
POST /api/export
```
Altyazılı video render eder

### Preset Yönetimi

```
GET /api/presets                 # Tüm presetleri listele
POST /api/presets/update         # Preset güncelle
POST /api/presets/create         # Yeni preset oluştur
DELETE /api/presets/{preset_id}  # Preset sil
POST /api/presets/screenshot     # Preset önizleme kaydet
```

### Proje Yönetimi

```
GET /api/projects                # Proje listesi
GET /api/projects/{id}           # Proje detayı
POST /api/projects               # Yeni proje
```

### Yardımcı Endpoint'ler

```
GET /api/fonts                   # Mevcut fontlar
GET /api/pyonfx/effects          # Efekt tanımları
GET /api/aaspresets/list         # Aegisub preset listesi
POST /api/aaspresets/extract-style  # ASS dosyasından stil çıkar
```

---

## Veri Yapıları

### presets.json Yapısı

```json
{
  "fire-storm": {
    "id": "fire-storm",
    "font": "Asimovian",
    "font_size": 150,
    "primary_color": "&H0000d5ff",
    "secondary_color": "&H00c431a4",
    "outline_color": "&H00000000",
    "shadow_color": "&H00ffffff",
    "bold": 1,
    "italic": 0,
    "border": 1,
    "shadow": 3,
    "blur": 1,
    "alignment": 5,
    "margin_v": 40,
    "effect_type": "fire_storm",
    "effect_config": {
      "particle_count": 12,
      "min_speed": 30,
      "max_speed": 120,
      "colors": ["&H0000FF&", "&H00FFFF&", "&HFFFFFF&"]
    }
  }
}
```

### pyonfx_effects.json Yapısı

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
      }
    }
  }
}
```

### ASS Renk Formatı

```
ASS Format:  &HAABBGGRR
             │ │  │  └─ Red (00-FF)
             │ │  └──── Green (00-FF)
             │ └─────── Blue (00-FF)
             └───────── Alpha (00=opak, FF=şeffaf)

Örnek: &H00FFFFFF = Beyaz (opak)
       &HFF000000 = Siyah (şeffaf)
       &H000000FF = Kırmızı (opak)
```

---

## Kurulum ve Çalıştırma

### Gereksinimler

- Python 3.8+
- Node.js 18+
- FFmpeg (PATH'te)
- CUDA (opsiyonel, GPU hızlandırma için)

### Backend Kurulum

```bash
cd backend

# Virtual environment (önerilen)
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Bağımlılıklar
pip install -r requirements.txt

# Çalıştırma
uvicorn main:app --reload --port 8000
```

### Frontend Kurulum

```bash
cd frontend

# Bağımlılıklar
npm install

# Geliştirme sunucusu
npm run dev
```

### Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `WHISPER_MODEL` | medium | Varsayılan Whisper modeli |
| `VITE_API_BASE` | http://localhost:8000/api | Backend API URL |

---

## Geliştirme Rehberi

### Yeni Efekt Ekleme

1. **Efekt Sınıfı Oluştur** (`pyonfx_effects.py`):
```python
class MyNewEffect:
    def __init__(self, param1: float = 1.0):
        self.param1 = param1
```

2. **EFFECTS Dict'e Ekle**:
```python
EFFECTS = {
    ...
    "my_new_effect": MyNewEffect,
}
```

3. **Render Implementasyonu** (`pyonfx_render_impls.py`):
```python
def render_my_new_effect(renderer):
    # ASS içeriği oluştur
    return ass_content

RENDER_DISPATCH["my_new_effect"] = render_my_new_effect
```

4. **Efekt Tanımı** (`pyonfx_effects.json`):
```json
{
  "my_new_effect": {
    "name": "My New Effect",
    "description": "Description here",
    "config": {...}
  }
}
```

5. **Preset Oluştur** (`presets.json`):
```json
{
  "my-new-preset": {
    "id": "my-new-preset",
    "effect_type": "my_new_effect",
    ...
  }
}
```

### Font Ekleme

1. TTF/OTF dosyasını `backend/fonts/` dizinine kopyala
2. Backend'i yeniden başlat (font listesi otomatik güncellenir)
3. Frontend'de `public/fonts/` altına da ekle (JASSUB için)

### Debug İpuçları

- **ASS Önizleme**: `/api/preview-ass` endpoint'i raw ASS içeriği döner
- **JASSUB Console**: Browser console'da JASSUB hataları görünür
- **FFmpeg Hataları**: Backend log'larında detaylı FFmpeg çıktısı

---

## Dosya Referansları

| Dosya | Amaç |
|-------|------|
| `backend/main.py` | Tüm API endpoint'leri |
| `backend/styles/effects/pyonfx_effects.py` | Efekt sınıf tanımları |
| `backend/styles/effects/pyonfx_render_impls.py` | Efekt render kodu |
| `backend/presets.json` | Preset konfigürasyonları |
| `frontend/src/pages/EditorPage.tsx` | Ana düzenleyici UI |
| `frontend/src/components/JSOOverlay.jsx` | ASS render bileşeni |
| `frontend/src/types.ts` | TypeScript tip tanımları |

---

## Notlar

- ASS formatı hakkında detaylı bilgi için `.claude/pyonfx-using-guide.md` dosyasına bakın
- Aegisub preset'leri `aaspresets/` dizininde bulunur
- JASSUB WASM dosyaları `frontend/public/jassub/` altındadır
- Screenshot'lar `frontend/public/sspresets/` dizinine kaydedilir

---

*Bu doküman, projenin mevcut durumunu yansıtmaktadır. Güncellemeler için kod tabanını kontrol edin.*
