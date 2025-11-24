# PyonFX Effects Integration

Bu modül, **PyonFX** kütüphanesinden ilham alarak geliştirilmiş subtitle efektleri PyCaps uygulamasına entegre eder.

## PyonFX Nedir?

PyonFX, Aegisub için Python tabanlı bir kütüphanedir ve gelişmiş subtitle animasyonları oluşturmanıza olanak sağlar. Orijinal kaynaklar:
- **GitHub**: https://github.com/CoffeeStraw/PyonFX
- **Discord Community**: `aaspresets/pyonfx/discord-community/` dizininde örnek kodlar bulunmaktadır.

## Entegre Edilen Efektler

### 1. **Bulge Effect** (Şişme Efekti)
Metni merkez noktasında şişiren/büyüten bir distorsiyon efekti.

**Parametreler:**
- `intensity`: Efektin gücü (0.0 - 2.0, varsayılan: 1.5)
- `blur`: Yumuşatma miktarı (0.0 - 2.0, varsayılan: 0.2)

**Kullanım:**
```python
style = {
    "effect_type": "bulge",
    "font": "Arial",
    "font_size": 72,
    "effect_config": {
        "intensity": 1.5,
        "blur": 0.2
    }
}
```

### 2. **Shake Effect** (Titreme Efekti)
Metni hızlı bir şekilde titreyen/salınan bir efekt.

**Parametreler:**
- `intensity`: Titrenin miktarı (0 - 50, varsayılan: 10.0)
- `frequency`: Titrenin hızı Hz cinsinden (1 - 50, varsayılan: 20.0)

**Kullanım:**
```python
style = {
    "effect_type": "shake",
    "font": "Arial",
    "font_size": 64,
    "effect_config": {
        "intensity": 10.0,
        "frequency": 20.0
    }
}
```

### 3. **Wave Effect** (Dalga Efekti)
Metni dalga şeklinde hareket ettiren bir efekt.

**Parametreler:**
- `amplitude`: Dalganın yüksekliği (0 - 100, varsayılan: 25.0)
- `wavelength`: Dalga tepeleri arasındaki mesafe (20 - 300, varsayılan: 80.0)

**Kullanım:**
```python
style = {
    "effect_type": "wave",
    "font": "Arial",
    "font_size": 60,
    "effect_config": {
        "amplitude": 25.0,
        "wavelength": 80.0
    }
}
```

### 4. **Chromatic Aberration** (Kromatik Aberasyon)
Renk kanallarını ayırarak glitch/distorsiyon efekti oluşturur.

**Parametreler:**
- `shift_amount`: Kanalların kaydırma miktarı (0 - 20, varsayılan: 4.0)

**Kullanım:**
```python
style = {
    "effect_type": "chromatic",
    "font": "Arial",
    "font_size": 56,
    "effect_config": {
        "shift_amount": 4.0
    }
}
```

## Dosya Yapısı

```
backend/
├── styles/
│   ├── effects/
│   │   ├── __init__.py
│   │   └── pyonfx_effects.py        # Ana efekt modülü
│   └── ...
├── main.py                          # FastAPI uygulaması
└── test_pyonfx_effects.py           # Test dosyası
```

## API Endpoints

### 1. **GET /api/pyonfx/effects**
Tüm kullanılabilir PyonFX efektlerini ve konfigürasyonlarını döndürür.

**Response:**
```json
{
  "bulge": {
    "name": "Bulge Effect",
    "description": "...",
    "config": { ... }
  },
  ...
}
```

### 2. **POST /api/pyonfx/preview**
PyonFX efektini video yakmadan önizle.

**Parametreler:**
- `words_json`: Kelime dizisi JSON
- `effect_type`: Efekt türü ("bulge", "shake", "wave", "chromatic")
- `effect_config_json`: Efekt konfigürasyonu JSON

**Response:** ASS subtitle dosya içeriği

### 3. **POST /api/export** (PyonFX Desteği Eklenmiş)
Video'ya PyonFX efektiyle birlikte subtitle ekler.

**Parametreler:**
- `video`: Video dosyası
- `words_json`: Kelime dizisi JSON
- `style_json`: Stil (effect_type ve effect_config içermeli)
- `resolution`: Video çözünürlüğü

## Önceden Tanımlanmış Presetler

Uygulamaya 4 adet PyonFX preset eklenmiştir:

- **pyonfx-bulge**: Bulge efekti (beyaz metin)
- **pyonfx-shake**: Shake efekti (kırmızı metin)
- **pyonfx-wave**: Wave efekti (yeşil metin)
- **pyonfx-chromatic**: Chromatic aberration efekti (mor outline)

## Test Etme

Test dosyası çalıştırın:
```bash
cd backend
python test_pyonfx_effects.py
```

Bu, `test_*_output.ass` dosyalarını oluşturacak ve Aegisub'da açabilirsiniz.

## ASS Animasyon Etiketleri

PyonFX efektler, ASS subtitle formatının animasyon etiketlerini kullanır:

- `\t(start,end,tag)`: Zaman-tabanlı transformasyon
- `\fscx` / `\fscy`: X/Y ekseni ölçekleme
- `\frz`: Z ekseni döndürme
- `\blur`: Bulanıklık efekti
- `\1c`: Birincil renk

Örnek:
```
{\t(0,100,\fscx110\fscy110)\t(100,200,\fscx100\fscy100)\blur0.2}
```

## PyonFX Örnek Dosyalar

Orijinal PyonFX örneklerini incelemek için:
```
aaspresets/pyonfx/discord-community/
```

Özellikle ilginç dosyalar:
- `BulgeFX.py`: Bulge efektinin orijinal implementasyonu
- `Bezier.py`: Bezier eğrileri
- `3D_shape.py`: 3D şekiller

## Genişletme

Yeni bir efekt eklemek için:

1. `pyonfx_effects.py` içinde bir sınıf oluşturun:
```python
class MyEffect:
    def __init__(self, param1: float = 1.0):
        self.param1 = param1
    
    def apply(self, ...):
        return { ... }
```

2. `PyonFXRenderer.EFFECTS` sözlüğüne ekleyin:
```python
EFFECTS = {
    "myeffect": MyEffect,
    ...
}
```

3. `main.py` içindeki PyonFX presets'e yeni preset ekleyin

## Kaynaklar

- **PyonFX GitHub**: https://github.com/CoffeeStraw/PyonFX
- **Aegisub**: http://www.aegisub.org/
- **ASS Subtitle Format**: https://github.com/libass/libass/blob/master/doc/ass-specs.md

## Not

Bu implementasyon PyonFX'in tam bir portu değildir, fakat temel efektleri ASS format'ında kullanılabilir hale getirmiştir. Daha kompleks efektler için orijinal PyonFX kütüphanesini kullanmanız önerilir.
