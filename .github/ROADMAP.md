# 🚀 PyCaps Development Roadmap

> **Sub Gen AI** - PyonFX Subtitle Studio  
> Son Güncelleme: 26 Kasım 2025

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

- [x] **EditorPage Modülerleştirme** ✅ *Tamamlandı - Kasım 2025*
  - ~~2000+ satırlık `EditorPage.tsx` dosyasını parçala~~ → 2061 satırdan 550 satıra düşürüldü
  - ~~`StylePanel`, `TranscriptPanel`, `PresetPanel` bileşenlerine ayır~~ → 7 yeni bileşen oluşturuldu:
    - `EditorHeader.tsx` - Header ve navigasyon
    - `VideoPlayer.tsx` - Video/audio player
    - `Timeline.tsx` - Profesyonel timeline kontrolü
    - `StylePanel.tsx` - Stil düzenleme paneli
    - `TranscriptPanel.tsx` - Transcript düzenleme
    - `PresetGallery.tsx` - Preset galerisi (arama/filtreleme)
    - `EffectConfig.tsx` - Efekt konfigürasyonu
  - ~~Custom hook'lar oluştur~~ → `useMediaPlayer`, `useKeyboardShortcuts` oluşturuldu

- [ ] **Responsive Tasarım İyileştirmeleri**
  - Mobil cihazlarda editor layout'u optimize et
  - Touch-friendly slider ve kontroller ekle
  - Tablet görünümü için özel breakpoint'ler

- [x] **Tema Sistemi** ✅ *Tamamlandı - Kasım 2025*
  - ~~Light/Dark tema geçişi ekle~~ → `ThemeContext.tsx` ile tam uygulama
  - ~~Kullanıcı tema tercihini localStorage'da sakla~~ → Otomatik persistence
  - ~~Sistem temasına otomatik uyum~~ → prefers-color-scheme desteği
  - Tüm bileşenler MUI dinamik tema sistemi kullanıyor
  - Tema toggle butonu tüm sayfalarda mevcut

### Öncelik: Orta 🟡

- [x] **Preset Galerisi İyileştirmeleri** ✅ *Kısmen Tamamlandı*
  - [ ] Grid/List görünüm seçeneği
  - [x] ~~Arama ve filtreleme (kategori, efekt tipi)~~ → 11 kategori ile filtreleme eklendi
  - [ ] Preset favorileme sistemi
  - [ ] Drag & drop sıralama

- [x] **Timeline Editörü** ✅ *Tamamlandı - Kasım 2025*
  - ~~Görsel timeline ile kelime timing düzenleme~~ → Profesyonel timeline bileşeni
  - ~~Waveform gösterimi~~ → CueBlock görselleştirmesi
  - ~~Drag ile timing ayarlama~~ → Playhead sürükle-bırak
  - ~~Zoom in/out kontrolü~~ → 1x-8x zoom desteği

- [x] **Klavye Kısayolları** ✅ *Tamamlandı - Kasım 2025*
  - ~~Kapsamlı kısayol sistemi~~ → `useKeyboardShortcuts` hook'u
    - Space: Oynat/Duraklat
    - ←/→: 5 saniye geri/ileri
    - Ctrl+S: Kaydet
    - Ctrl+E: Export
    - Ctrl+Z/Y: Geri al/Yinele (hazır altyapı)
    - Home/End: Başa/Sona git
  - [ ] Kısayol referans paneli
  - [ ] Özelleştirilebilir kısayollar

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

- [x] **ASS Preview Caching** ✅ *Tamamlandı - Kasım 2025*
  - ~~Değişmeyen kelimeler için cache~~ → `assCache.ts` utility
  - ~~Debounce süresini optimize et~~ → 700ms'den 400ms'e düşürüldü
  - ~~Diff-based render~~ → `hasWordsChanged`, `hasStyleChanged` fonksiyonları
  - `useAssPreview` hook'u ile tam entegrasyon
  - Cache hit/loading göstergesi VideoPlayer'da

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

### Kod Yapısı ✅ *Büyük Ölçüde Tamamlandı*

```
frontend/src/
├── components/
│   ├── common/          # Ortak UI bileşenleri
│   ├── editor/          # Editor spesifik bileşenler ✅
│   │   ├── EditorHeader.tsx    ✅ YENİ
│   │   ├── VideoPlayer.tsx     ✅ YENİ
│   │   ├── Timeline.tsx        ✅ YENİ
│   │   ├── StylePanel.tsx      ✅ YENİ
│   │   ├── TranscriptPanel.tsx ✅ YENİ
│   │   ├── PresetGallery.tsx   ✅ YENİ
│   │   └── EffectConfig.tsx    ✅ YENİ
│   ├── ui/              # UI Component Library ✅
│   │   └── index.tsx    # GlassCard, GradientButton, vb.
│   └── layout/          # Header, Sidebar, Footer
├── hooks/
│   ├── useMediaPlayer.ts    ✅ MEVCUT
│   ├── useKeyboardShortcuts.ts ✅ YENİ
│   ├── useStyleEditor.ts    (gelecek)
│   └── usePresets.ts        (gelecek)
├── services/
│   ├── api.ts           # Axios wrapper
│   ├── presets.ts       # Preset işlemleri
│   └── export.ts        # Export işlemleri
├── store/               # Zustand veya Redux
│   ├── projectStore.ts
│   └── uiStore.ts
├── ThemeContext.tsx     ✅ YENİ - Light/Dark tema
├── theme.ts             ✅ Design tokens
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

- [x] **EditorPage.tsx Bölünmesi** ✅ *Tamamlandı - Kasım 2025*
  - ~~State management'ı dışarı çıkar~~ → Hook'lara taşındı
  - ~~Panel bileşenlerini ayır~~ → 7 ayrı bileşen oluşturuldu
  - ~~Event handler'ları hook'lara taşı~~ → `useKeyboardShortcuts`, `useMediaPlayer`
  - **Sonuç**: 2061 satır → 550 satır (%73 azalma)

- [ ] **Renk Dönüşüm Fonksiyonları**
  - `assToHex`, `hexToAss`, `assToCssColor` fonksiyonlarını tek utility'de topla
  - Backend ve frontend arasında tutarlılık

- [x] **Type Definitions** ✅ *Kısmen Tamamlandı*
  - ~~`types.ts` dosyasını genişlet~~ → `EffectConfig` genişletildi
  - [ ] Strict TypeScript mode
  - [ ] API response type'ları

- [x] **UI Component Library** ✅ *Tamamlandı*
  - `components/ui/index.tsx` → MUI tema entegrasyonu
  - GlassCard, GradientButton, SectionHeader, FeatureCard vb.
  - Dinamik light/dark tema desteği

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

| Özellik | Etki | Effort | Öncelik | Durum |
|---------|------|--------|---------|-------|
| EditorPage modülerleştirme | Yüksek | Yüksek | 🔴 P1 | ✅ Tamamlandı |
| Tema sistemi | Orta | Düşük | 🟡 P2 | ✅ Tamamlandı |
| Timeline editörü | Yüksek | Yüksek | 🟡 P2 | ✅ Tamamlandı |
| Klavye kısayolları | Orta | Düşük | 🟡 P2 | ✅ Tamamlandı |
| Preset arama/filtreleme | Orta | Düşük | 🟡 P2 | ✅ Tamamlandı |
| UI Component Library | Orta | Orta | 🟡 P2 | ✅ Tamamlandı |
| ASS preview caching | Yüksek | Orta | 🔴 P1 | ✅ Tamamlandı |
| Batch export | Yüksek | Orta | 🔴 P1 | ⏳ Bekliyor |
| Unit test coverage | Orta | Yüksek | 🟡 P2 | ⏳ Bekliyor |
| Mobile responsive | Orta | Orta | 🟡 P2 | ⏳ Bekliyor |
| Plugin sistemi | Yüksek | Çok Yüksek | 🟢 P3 | ⏳ Bekliyor |
| Real-time collab | Yüksek | Çok Yüksek | 🟢 P3 | ⏳ Bekliyor |

---

## 🎯 Milestone Planı

### v1.1 - Stabilizasyon ✅ *Kasım 2025 - TAMAMLANDI*

- [x] EditorPage refaktör (2061 → 550 satır)
- [x] Tema sistemi (Light/Dark)
- [x] Timeline editörü
- [x] Klavye kısayolları
- [x] Preset arama/filtreleme
- [x] UI Component Library güncelleme
- [ ] Test coverage %50
- [ ] Bug fixes

### v1.2 - UX İyileştirmeleri (Mart 2026)

- [x] ~~Timeline editörü~~ ✅
- [x] ~~Tema sistemi~~ ✅
- [ ] Preset galerisi v2 (favoriler, drag & drop)
- [ ] Mobile responsive
- [ ] Kısayol referans paneli

### v1.3 - Üretim Özellikleri (Haziran 2026)

- [ ] Batch export
- [ ] Yeni efektler
- [ ] Cloud storage
- [ ] API documentation

### v2.0 - Büyük Güncelleme (2026 Q4)

- [ ] Plugin sistemi
- [ ] AI features
- [ ] Real-time collaboration
- [ ] Desktop app

---

## 📈 İlerleme Özeti (Kasım 2025)

### Tamamlanan Özellikler

| Kategori | Özellik | Detay |
|----------|---------|-------|
| 🏗️ Refaktör | EditorPage Modülerleştirme | 2061 → 550 satır (%73 azalma) |
| 🎨 UI/UX | Tema Sistemi | Light/Dark + localStorage persistence |
| 🎬 Editor | Timeline Editörü | Zoom, playhead, cue blocks |
| ⌨️ Kısayollar | Klavye Kısayolları | Space, arrows, Ctrl+S/E/Z/Y |
| 🔍 Arama | Preset Filtreleme | 11 kategori, arama fonksiyonu |
| 📦 Bileşenler | UI Component Library | MUI tema entegrasyonu |

### Oluşturulan Yeni Dosyalar

```plaintext
frontend/src/
├── components/editor/
│   ├── EditorHeader.tsx     # Header ve navigasyon
│   ├── VideoPlayer.tsx      # Video/audio player (cache indicator ekli)
│   ├── Timeline.tsx         # Profesyonel timeline
│   ├── StylePanel.tsx       # Stil düzenleme
│   ├── TranscriptPanel.tsx  # Transcript düzenleme
│   ├── PresetGallery.tsx    # Preset galerisi
│   └── EffectConfig.tsx     # Efekt konfigürasyonu
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useAssPreview.ts     # ASS preview caching hook
├── utils/
│   └── assCache.ts          # ASS cache utility
└── ThemeContext.tsx         # Tema yönetimi
```

### Sonraki Adımlar

1. ✅ ASS preview caching optimizasyonu (Tamamlandı)
2. ⏳ Batch export özelliği
3. ⏳ Backend test coverage artırma
4. ⏳ Mobile responsive tasarım

---

> 💡 **Katkıda Bulunma**: Bu roadmap canlı bir dokümandır. Önerileriniz için issue açabilir veya pull request gönderebilirsiniz.

