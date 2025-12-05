# Subcio Desktop

Subcio'nun masaüstü uygulaması. Electron + Python backend ile çalışır.

## Gereksinimler

- Node.js 18+
- npm veya yarn
- Git

## Geliştirme Modu

```bash
# Ana klasörde
cd pycaps-main

# Venv oluştur (ilk seferde)
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt

# Başlat
start-desktop-dev.bat
```

## EXE Build (Production)

```bash
# Tek komutla build
build-exe.bat
```

Bu script:
1. Frontend'i build eder
2. Python Embedded 3.11.7 indirir
3. FFmpeg indirir
4. Backend paketlerini kurar
5. Electron ile EXE oluşturur

### Çıktılar

`electron/dist/` klasöründe:
- `Subcio-{version}-x64.exe` - NSIS Installer
- `Subcio-Portable-{version}.exe` - Portable versiyon

## Yapı

```
electron/
├── main.js              # Electron ana process
├── preload.js           # Renderer preload
├── build.js             # Build script
├── package.json         # Electron bağımlılıkları
├── assets/              # Icon ve resimler
├── scripts/
│   └── prepare-python.js  # Python+FFmpeg indirme
├── python-embedded/     # Embedded Python (build sonrası)
├── ffmpeg/              # FFmpeg binary (build sonrası)
├── backend/             # Backend kopyası (build sonrası)
└── frontend-dist/       # Frontend build (build sonrası)
```

## Nasıl Çalışıyor

1. **Electron** uygulamayı başlatır
2. **Python backend** embedded olarak spawn edilir (port 8000)
3. **Frontend** statik dosyalardan serve edilir
4. **FFmpeg** video export için PATH'e eklenir
5. Tüm işlemler kullanıcının bilgisayarında yapılır

## Avantajlar

- ✅ Sunucu maliyeti yok
- ✅ Kullanıcının GPU'su kullanılıyor
- ✅ Offline çalışır
- ✅ Daha hızlı video processing
- ✅ Veri gizliliği (dosyalar local)

## Sorun Giderme

### Python bulunamadı
```
node electron/scripts/prepare-python.js
```

### FFmpeg bulunamadı
```
node electron/scripts/prepare-python.js
```

### Backend başlamıyor
Log dosyasını kontrol edin:
- Windows: `%APPDATA%\Subcio\logs\main.log`

### Port 8000 meşgul
Başka bir uygulama portu kullanıyor olabilir.
```
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```
