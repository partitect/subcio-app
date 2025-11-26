# 🚀 PyCaps Development Roadmap

> **Sub Gen AI** - PyonFX Subtitle Studio  
> Son Güncelleme: Kasım 2025

---

## 📋 İçindekiler

1. [UI/UX Geliştirmeleri](#-uiux-geliştirmeleri)
2. [Üretim Geliştirmeleri](#-üretim-geliştirmeleri)
3. [Performans & Hızlandırma](#-performans--hızlandırma)
4. [Refaktör Önerileri](#-refaktör-önerileri)
5. [Kod Kalitesi](#-kod-kalitesi)
6. [Yeni Özellikler](#-yeni-özellikler)
7. [Altyapı & DevOps](#%EF%B8%8F-altyapı--devops)
8. [Dokümantasyon](#-dokümantasyon)

---

## 🎨 UI/UX Geliştirmeleri

### Öncelik: Yüksek 🔴

- [ ] **EditorPage Modülerleştirme**
  - 2000+ satırlık `EditorPage.tsx` dosyasını parçala
  - `StylePanel`, `TranscriptPanel`, `PresetPanel` bileşenlerine ayır
  - Custom hook'lar oluştur: `useStyleEditor`, `useTranscript`, `usePreview`

- [ ] **Responsive Tasarım İyileştirmeleri**
  - Mobil cihazlarda editor layout'u optimize et
  - Touch-friendly slider ve kontroller ekle
  - Tablet görünümü için özel breakpoint'ler

- [ ] **Tema Sistemi**
  - Light/Dark tema geçişi ekle
  - Kullanıcı tema tercihini localStorage'da sakla
  - Sistem temasına otomatik uyum

### Öncelik: Orta 🟡

- [ ] **Preset Galerisi İyileştirmeleri**
  - Grid/List görünüm seçeneği
  - Arama ve filtreleme (kategori, efekt tipi)
  - Preset favorileme sistemi
  - Drag & drop sıralama

- [ ] **Timeline Editörü**
  - Görsel timeline ile kelime timing düzenleme
  - Waveform gösterimi
  - Drag ile timing ayarlama
  - Zoom in/out kontrolü

- [ ] **Klavye Kısayolları**
  - Kapsamlı kısayol sistemi (Ctrl+S kaydet, Space play/pause vb.)
  - Kısayol referans paneli
  - Özelleştirilebilir kısayollar

### Öncelik: Düşük 🟢

- [ ] **Animasyon & Geçişler**
  - Sayfa geçişlerinde animasyonlar (Framer Motion kullanılıyor)
  - Loading skeleton'lar tüm sayfalara
  - Micro-interactions (buton hover efektleri)

- [ ] **Accessibility (A11y)**
  - ARIA label'ları tamamla
  - Keyboard navigation desteği
  - Screen reader uyumluluğu
  - Renk kontrastı kontrolü

---

## 🎬 Üretim Geliştirmeleri

### Öncelik: Yüksek 🔴

- [ ] **Batch Export**
  - Çoklu proje export'u
  - Export kuyruğu sistemi
  - İlerleme takibi

- [ ] **Video Kalite Seçenekleri**
  - 720p, 1080p, 4K seçenekleri (mevcut)
  - Özel çözünürlük girişi
  - Bitrate kontrolü
  - Codec seçimi (H.264, H.265, VP9)

- [ ] **Ses Desteği İyileştirmeleri**
  - Audio-only projeler için özel export (MP3 + SRT)
  - Background music ekleme
  - Ses seviyesi normalize

### Öncelik: Orta 🟡

- [ ] **PyonFX Efekt Genişletmeleri**
  - Mevcut 20+ efekte yeni varyasyonlar
  - Kullanıcı tanımlı efektler (Lua script desteği?)
  - Efekt parametreleri için preset sistemi

- [ ] **Çoklu Dil Altyazı**
  - Aynı projede birden fazla dil
  - Dil seçimi ve geçiş
  - Çeviri API entegrasyonu (Google, DeepL)

- [ ] **Watermark & Branding**
  - Logo overlay desteği
  - Özel intro/outro ekleyebilme
  - Watermark pozisyon ve boyut ayarları

### Öncelik: Düşük 🟢

- [ ] **Social Media Export Presets**
  - YouTube Shorts (9:16, max 60s)
  - TikTok (9:16)
  - Instagram Reels/Stories
  - Twitter/X video formatı

---

## ⚡ Performans & Hızlandırma

### Öncelik: Yüksek 🔴

- [ ] **ASS Preview Caching**
  - Değişmeyen kelimeler için cache
  - Debounce süresini optimize et (şu an 700ms)
  - Diff-based render (sadece değişen satırları güncelle)

- [ ] **Video Streaming Optimizasyonu**
  - Range-based streaming (mevcut)
  - Adaptive bitrate streaming
  - Video preloading stratejisi

- [ ] **Whisper Model Yönetimi**
  - Model warm-up at startup
  - Model memory yönetimi
  - GPU memory optimizasyonu

### Öncelik: Orta 🟡

- [ ] **Frontend Bundle Optimizasyonu**
  - Code splitting (route-based)
  - Lazy loading components
  - Tree shaking kontrolü
  - Bundle size analizi

- [ ] **FFmpeg Pipeline**
  - Hardware acceleration (NVENC, VAAPI)
  - Parallel encoding
  - Progress streaming (SSE/WebSocket)

- [ ] **Database/Storage**
  - SQLite veya PostgreSQL'e geçiş (JSON dosyalarından)
  - File system cleanup (eski export'lar)
  - Proje arşivleme

### Öncelik: Düşük 🟢

- [ ] **Web Worker Kullanımı**
  - Heavy JSON parsing worker'da
  - Image processing worker'da
  - ASS parsing worker'da

---

## 🔧 Refaktör Önerileri

### Kod Yapısı

```
frontend/src/
├── components/
│   ├── common/          # Ortak UI bileşenleri
│   ├── editor/          # Editor spesifik bileşenler
│   │   ├── StylePanel/
│   │   ├── TranscriptPanel/
│   │   ├── PresetGallery/
│   │   └── VideoPlayer/
│   └── layout/          # Header, Sidebar, Footer
├── hooks/
│   ├── useMediaPlayer.ts ✓
│   ├── useStyleEditor.ts  (yeni)
│   ├── useTranscript.ts   (yeni)
│   └── usePresets.ts      (yeni)
├── services/
│   ├── api.ts           # Axios wrapper
│   ├── presets.ts       # Preset işlemleri
│   └── export.ts        # Export işlemleri
├── store/               # Zustand veya Redux
│   ├── projectStore.ts
│   └── uiStore.ts
└── utils/
    ├── colorConvert.ts  # ASS <-> HEX dönüşümleri
    ├── timeFormat.ts    # Timestamp işlemleri
    └── validation.ts    # Form validasyonları
```

### Backend Yapısı

```
backend/
├── api/
│   ├── routes/
│   │   ├── transcribe.py
│   │   ├── export.py
│   │   ├── presets.py
│   │   └── projects.py
│   └── middleware/
├── core/
│   ├── whisper_service.py
│   ├── ffmpeg_service.py
│   └── pyonfx_renderer.py
├── models/
│   ├── project.py
│   ├── preset.py
│   └── style.py
├── storage/
│   ├── file_manager.py
│   └── database.py
└── utils/
    ├── color.py
    └── timestamp.py
```

### Spesifik Refaktör İşleri

- [ ] **main.py Bölünmesi** (850+ satır)
  - Route'ları ayrı dosyalara taşı
  - Service layer oluştur
  - Dependency injection pattern

- [ ] **EditorPage.tsx Bölünmesi** (2000+ satır)
  - State management'ı dışarı çıkar
  - Panel bileşenlerini ayır
  - Event handler'ları hook'lara taşı

- [ ] **Renk Dönüşüm Fonksiyonları**
  - `assToHex`, `hexToAss`, `assToCssColor` fonksiyonlarını tek utility'de topla
  - Backend ve frontend arasında tutarlılık

- [ ] **Type Definitions**
  - `types.ts` dosyasını genişlet
  - Strict TypeScript mode
  - API response type'ları

---

## 🧪 Kod Kalitesi

### Test Coverage

- [ ] **Backend Unit Tests**
  - PyonFX renderer testleri
  - API endpoint testleri
  - Color conversion testleri
  - Timestamp conversion testleri

- [ ] **Frontend Tests**
  - Component testleri (React Testing Library)
  - Hook testleri
  - E2E testleri (Playwright/Cypress)

### Linting & Formatting

- [ ] **ESLint Kuralları Sıkılaştırma**
  - `jsx-a11y` plugin aktifleştir
  - Inline style uyarılarını çöz
  - Unused import temizliği

- [ ] **Backend Linting**
  - `ruff` veya `flake8` ekle
  - `mypy` ile type checking
  - `black` ile formatting

### Code Review Checklist

- [ ] Error handling standardizasyonu
- [ ] Console.log temizliği (debug kodu)
- [ ] Hardcoded değerleri config'e taşı
- [ ] Magic number'ları constant'a çevir

---

## 🌟 Yeni Özellikler

### Kısa Vadeli (1-3 ay)

- [ ] **Undo/Redo Sistemi**
  - Style değişiklikleri için
  - Transcript düzenlemeleri için
  - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)

- [ ] **Preset Import/Export**
  - JSON formatında export
  - Preset paylaşımı
  - Community preset galerisi

- [ ] **Real-time Collaboration**
  - WebSocket ile çoklu kullanıcı
  - Değişiklik senkronizasyonu
  - Conflict resolution

### Orta Vadeli (3-6 ay)

- [ ] **AI-Powered Features**
  - Otomatik kelime gruplandırma
  - Sahne algılama
  - Duygu analizi (renk önerileri)
  - Optimal timing önerileri

- [ ] **Template Sistemi**
  - Hazır video şablonları
  - Intro/outro templateları
  - Sosyal medya formatları

- [ ] **Plugin Sistemi**
  - Üçüncü parti efekt desteği
  - Custom renderer'lar
  - API extension points

### Uzun Vadeli (6+ ay)

- [ ] **Cloud Storage**
  - Proje backup
  - Cross-device sync
  - Team workspace

- [ ] **Mobile App**
  - React Native ile mobil uygulama
  - Basit düzenleme özellikleri
  - Proje görüntüleme

- [ ] **Desktop App**
  - Electron wrapper
  - Offline çalışma
  - Local GPU kullanımı

---

## 🏗️ Altyapı & DevOps

### CI/CD

- [ ] **GitHub Actions**
  - Frontend build & test
  - Backend test
  - Lint checks
  - Auto-deploy (preview & production)

- [ ] **Docker**
  - Multi-stage Dockerfile
  - Docker Compose (backend + frontend + GPU)
  - Volume management

### Monitoring

- [ ] **Error Tracking**
  - Sentry entegrasyonu
  - Frontend error boundary'ler
  - Backend exception handling

- [ ] **Analytics**
  - Usage analytics
  - Performance metrics
  - Export başarı oranları

### Security

- [ ] **Input Validation**
  - File upload güvenliği
  - XSS koruması
  - Rate limiting

- [ ] **API Security**
  - API key authentication (opsiyonel)
  - CORS yapılandırması
  - Request size limits

---

## 📚 Dokümantasyon

### Developer Docs

- [ ] **API Documentation**
  - OpenAPI/Swagger spec
  - Endpoint örnekleri
  - Error codes

- [ ] **Component Storybook**
  - UI component showcase
  - Prop documentation
  - Usage examples

- [ ] **Architecture Docs**
  - System design
  - Data flow diagrams
  - Tech stack decisions

### User Docs

- [ ] **User Guide**
  - Başlangıç rehberi
  - Feature walkthroughs
  - Video tutorials

- [ ] **FAQ**
  - Sık sorulan sorular
  - Troubleshooting
  - Known issues

---

## 📊 Öncelik Matrisi

| Özellik | Etki | Effort | Öncelik |
|---------|------|--------|---------|
| EditorPage modülerleştirme | Yüksek | Yüksek | 🔴 P1 |
| ASS preview caching | Yüksek | Orta | 🔴 P1 |
| Batch export | Yüksek | Orta | 🔴 P1 |
| Tema sistemi | Orta | Düşük | 🟡 P2 |
| Timeline editörü | Yüksek | Yüksek | 🟡 P2 |
| Unit test coverage | Orta | Yüksek | 🟡 P2 |
| Mobile responsive | Orta | Orta | 🟡 P2 |
| Plugin sistemi | Yüksek | Çok Yüksek | 🟢 P3 |
| Real-time collab | Yüksek | Çok Yüksek | 🟢 P3 |

---

## 🎯 Milestone Planı

### v1.1 - Stabilizasyon (Ocak 2026)
- EditorPage refaktör
- Test coverage %50
- Performance optimizasyonları
- Bug fixes

### v1.2 - UX İyileştirmeleri (Mart 2026)
- Timeline editörü
- Tema sistemi
- Preset galerisi v2
- Mobile responsive

### v1.3 - Üretim Özellikleri (Haziran 2026)
- Batch export
- Yeni efektler
- Cloud storage
- API documentation

### v2.0 - Büyük Güncelleme (2026 Q4)
- Plugin sistemi
- AI features
- Real-time collaboration
- Desktop app

---

> 💡 **Katkıda Bulunma**: Bu roadmap canlı bir dokümandır. Önerileriniz için issue açabilir veya pull request gönderebilirsiniz.

