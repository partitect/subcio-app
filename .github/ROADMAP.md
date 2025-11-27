# 🚀 PyCaps Development Roadmap

> **Sub Gen AI** - PyonFX Subtitle Studio  
> Son Güncelleme: 27 Kasım 2025

---

## 📋 İçindekiler

1. [UI/UX Geliştirmeleri](#-uiux-geliştirmeleri)
2. [Internationalization (i18n)](#-internationalization-i18n)
3. [SaaS & Subscription](#-saas--subscription)
4. [Üretim Geliştirmeleri](#-üretim-geliştirmeleri)
5. [Performans & Hızlandırma](#-performans--hızlandırma)
6. [Refaktör Önerileri](#-refaktör-önerileri)
7. [Kod Kalitesi](#-kod-kalitesi)
8. [Yeni Özellikler](#-yeni-özellikler)
9. [Altyapı & DevOps](#%EF%B8%8F-altyapı--devops)
10. [Dokümantasyon](#-dokümantasyon)

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

- [ ] **Responsive Tasarım İyileştirmeleri** ✅ *Kısmen Tamamlandı - Kasım 2025*
  - [x] Timeline mobil layout (breakpoint'ler, kontroller)
  - [x] EditorPage Grid sistem iyileştirmesi (order, spacing)
  - [x] Touch-friendly slider ve kontroller ✅ *Tamamlandı - Kasım 2025*
    - TouchSlider bileşeni (daha büyük thumb, haptic feedback)
    - TouchButton bileşeni (48x48 min touch target)
    - SwipeableArea bileşeni (gesture desteği)
    - TouchProgressBar bileşeni (drag-to-seek)
    - Timeline touch seeking
    - Mobil oynatma kontrolleri büyütüldü (56x56)
  - [ ] Tablet görünümü için özel breakpoint'ler

- [x] **Tema Sistemi** ✅ *Tamamlandı - Kasım 2025*
  - ~~Light/Dark tema geçişi ekle~~ → `ThemeContext.tsx` ile tam uygulama
  - ~~Kullanıcı tema tercihini localStorage'da sakla~~ → Otomatik persistence
  - ~~Sistem temasına otomatik uyum~~ → prefers-color-scheme desteği
  - Tüm bileşenler MUI dinamik tema sistemi kullanıyor
  - Tema toggle butonu tüm sayfalarda mevcut

### Öncelik: Orta 🟡

- [x] **Preset Galerisi İyileştirmeleri** ✅ *Tamamlandı - Kasım 2025*
  - [x] Grid/List görünüm seçeneği
  - [x] ~~Arama ve filtreleme (kategori, efekt tipi)~~ → 11 kategori ile filtreleme eklendi
  - [x] Preset favorileme sistemi (localStorage persistence)
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
  - [x] Kısayol referans paneli → `KeyboardShortcutsDialog.tsx` (Shift + ? ile açılır)
  - [ ] Özelleştirilebilir kısayollar

### Öncelik: Düşük 🟢

- [x] **Animasyon & Geçişler**
  - Sayfa geçişlerinde animasyonlar (Framer Motion kullanılıyor)
  - Loading skeleton'lar tüm sayfalara
  - Micro-interactions (buton hover efektleri)

- [x] **Accessibility (A11y)** ✅ *Tamamlandı - Kasım 2025*
  - [x] ARIA label'ları tamamla
    - VideoPlayer: region, play/pause buton
    - TranscriptPanel: region, listbox, listitem
    - PresetGallery: listbox, roving tabindex
  - [x] Keyboard navigation desteği
    - Play/pause için Enter ve Space
    - Preset seçimi için arrow keys
    - useRovingTabIndex hook
  - [x] Screen reader uyumluluğu
    - announceToScreenReader utility
    - Preset seçim bildirimleri
    - Favori ekleme/çıkarma bildirimleri
  - [x] Focus visible styles
  - [x] 4 dil desteği (EN, TR, ES, DE)

---

## 🌍 Internationalization (i18n)

### Öncelik: Yüksek 🔴 ✅ *Tamamlandı - Kasım 2025*

- [x] **i18n Altyapısı** ✅
  - ~~i18next, react-i18next, i18next-browser-languagedetector kurulumu~~
  - ~~`src/i18n/index.ts` konfigürasyonu~~
  - ~~Dil tercihini localStorage'da saklama~~
  - ~~Browser dil algılama~~

- [x] **Çeviri Dosyaları** ✅
  - ~~4 dil desteği: İngilizce (varsayılan), Türkçe, İspanyolca, Almanca~~
  - ~~`src/i18n/locales/en.json` - English~~
  - ~~`src/i18n/locales/tr.json` - Türkçe~~
  - ~~`src/i18n/locales/es.json` - Español~~
  - ~~`src/i18n/locales/de.json` - Deutsch~~
  - Her dosyada 400+ çeviri key'i

- [x] **LanguageSelector Bileşeni** ✅
  - ~~SVG bayrak ikonları (Windows uyumluluğu için emoji yerine)~~
  - ~~Dropdown menü ile dil seçimi~~
  - ~~Seçili dil göstergesi (CheckIcon)~~
  - ~~Fixed width ile layout shift önleme~~

- [x] **Landing Page i18n** ✅
  - ~~Navbar (menü linkleri, auth butonları)~~
  - ~~HeroSection (başlık, alt başlık, CTA butonları)~~
  - ~~FeaturesSection (özellik kartları)~~
  - ~~PricingSection (fiyat, plan özellikleri)~~
  - ~~CTASection (call-to-action)~~
  - ~~Footer (linkler, copyright)~~

- [x] **Auth Pages i18n** ✅
  - ~~LoginPage (form labels, hatalar, butonlar)~~
  - ~~RegisterPage (form labels, hatalar, butonlar)~~

- [x] **Dashboard i18n** ✅
  - ~~Hoşgeldin mesajı~~
  - ~~İstatistikler~~
  - ~~Proje listesi~~
  - ~~Menü seçenekleri~~

- [x] **Upload Page i18n** ✅
  - ~~Sayfa başlığı ve açıklama~~
  - ~~Dropzone metinleri~~
  - ~~Desteklenen formatlar~~
  - ~~Ayarlar bölümü (AI model, dil seçimi)~~
  - ~~İşlem adımları~~
  - ~~Kullanım bilgisi~~
  - ~~Son yüklemeler~~
  - ~~Pro ipuçları~~

### Öncelik: Orta 🟡 (Devam Edecek)

- [x] **Editor Page i18n** ✅ *Tamamlandı - Kasım 2025*
  - ~~StylePanel etiketleri~~ → Font, size, colors, border/shadow labels
  - ~~TranscriptPanel metinleri~~ → Title, lines, duration, tooltips
  - ~~PresetGallery kategorileri~~ → 11 kategori çevirisi
  - ~~Timeline kontrolleri~~ → Play/pause, skip, mute/unmute tooltips
  - ~~Klavye kısayolları referansı~~ → Tooltip metinleri

- [ ] **Export/Settings i18n**
  - Export dialog metinleri
  - Settings sayfası (profil, şifre, bildirimler)

- [ ] **Yeni Dil Ekleme**
  - Fransızca (fr)
  - Japonca (ja)
  - Portekizce (pt)

### Öncelik: Düşük 🟢

- [ ] **RTL Dil Desteği**
  - Arapça (ar)
  - İbranice (he)
  - RTL layout ayarlamaları

- [ ] **Çeviri Yönetimi**
  - Crowdin veya Lokalise entegrasyonu
  - Topluluk çevirileri
  - Otomatik eksik çeviri algılama

---

## 💳 SaaS & Subscription

### Öncelik: Yüksek 🔴

- [x] **Landing Page Redesign** ✅ *Tamamlandı - Kasım 2025*
  - ~~Profesyonel SaaS landing page~~ → 8 yeni bileşen oluşturuldu:
    - `HeroSection.tsx` - Ana hero bölümü
    - `FeaturesSection.tsx` - 6 özellik kartı
    - `PricingSection.tsx` - 4 plan (Free/Creator/Pro/Enterprise)
    - `TestimonialsSection.tsx` - Müşteri yorumları
    - `FAQSection.tsx` - Sık sorulan sorular
    - `CTASection.tsx` - Son çağrı
    - `Footer.tsx` - Site footer
    - `Navbar.tsx` - Responsive navigasyon
  - ~~Monthly/Yearly toggle~~ → %20 yearly indirim
  - ~~Feature comparison table~~ → Plan karşılaştırma

- [x] **Upload Page Redesign** ✅ *Tamamlandı - Kasım 2025*
  - ~~Navbar entegrasyonu~~ → Landing page ile tutarlı
  - ~~Lottie animasyonları~~ → Upload, processing, success animasyonları
  - ~~Desteklenen formatlar~~ → Renkli ikonlarla gösterim
  - ~~Usage limit gösterimi~~ → Progress bar ile dakika kullanımı
  - ~~Recent uploads~~ → Son yüklemeler listesi
  - ~~Step-by-step progress~~ → 5 adımlı ilerleme göstergesi
  - ~~Pro Tips~~ → Kullanıcı ipuçları kartı

- [x] **Pricing Configuration** ✅ *Tamamlandı - Kasım 2025*
  - ~~Plan tanımları~~ → `config/pricing.ts`
  - 4 plan: Starter ($0), Creator ($19/mo), Professional ($49/mo), Enterprise ($149/mo)
  - Video limitleri, storage, özellik setleri

- [x] **Authentication Pages** ✅ *Tamamlandı - Kasım 2025*
  - ~~Login sayfası~~ → `LoginPage.tsx`
  - ~~Register sayfası~~ → `RegisterPage.tsx` (plan seçimi desteği)
  - ~~Forgot password~~ → `ForgotPasswordPage.tsx`
  - ~~OAuth butonları~~ → Google, GitHub (hazır UI)

- [x] **Dashboard Page** ✅ *Tamamlandı - Kasım 2025*
  - ~~Kullanıcı projeler listesi~~ → `DashboardPage.tsx`
  - ~~Usage stats~~ → Dakika kullanımı, proje sayısı
  - ~~Quick actions~~ → Yeni proje, son projeler

### Öncelik: Orta 🟡 (Devam Edecek)

- [x] **Backend Authentication** ✅ *Tamamlandı - Kasım 2025*
  - ~~JWT token sistemi~~ → python-jose ile access/refresh token
  - ~~User model~~ → SQLAlchemy ile SQLite (OAuth alanları eklendi)
  - ~~Password hashing~~ → bcrypt kullanımı
  - ~~OAuth integration~~ → Google ve GitHub OAuth routes
  - ~~Refresh token flow~~ → `/api/auth/refresh` endpoint
  - OAuth callback page → `OAuthCallbackPage.tsx`
  - Environment config → `.env.example` oluşturuldu

- [ ] **Payment Integration**
  - Stripe veya Paddle entegrasyonu
  - Subscription management
  - Usage-based billing
  - Invoice generation
  - Webhook handling

- [x] **User Management** ✅ *Tamamlandı - Kasım 2025*
  - ~~Profile settings~~ → `SettingsPage.tsx` tam kapsamlı sayfa
  - ~~Password change~~ → OAuth kullanıcıları için de şifre ayarlama
  - ~~Email verification~~ → Doğrulama durumu gösterimi
  - ~~Account deletion~~ → Delete account dialog (API bekliyor)
  - ~~Usage history~~ → Usage tab ile kullanım istatistikleri
  - 5 sekme: Profile, Security, Preferences, Billing, Usage
  - Tema ve dil tercihleri
  - 4 dil desteği (EN, TR, ES, DE)

### Öncelik: Düşük 🟢

- [ ] **Team Features**
  - Team workspace
  - Member invitations
  - Role-based permissions
  - Shared projects

- [ ] **Admin Dashboard**
  - User management
  - Subscription analytics
  - Usage reports
  - System health

---

## 🎬 Üretim Geliştirmeleri

### Öncelik: Yüksek 🔴

- [x] **Batch Export** ✅ *Tamamlandı - Kasım 2025*
  - ~~Çoklu proje export'u~~ → `BatchExportDialog.tsx` ile proje seçimi
  - ~~Export kuyruğu sistemi~~ → Backend `BatchExportQueue` class
  - ~~İlerleme takibi~~ → Real-time polling, job-level progress
  - API: `/api/batch-export`, `/api/batch-export/{id}`, `/api/batch-export/{id}/cancel`
  - Maksimum 20 proje per batch

- [x] **Video Kalite Seçenekleri** ✅ *Tamamlandı - Kasım 2025*
  - ~~720p, 1080p, 1440p, 4K seçenekleri~~ → Resolution presets
  - ~~Bitrate kontrolü~~ → Low (2M), Medium (5M), High (10M), Ultra (20M)
  - ~~Codec seçimi~~ → H.264, H.265/HEVC, VP9, ProRes
  - `/api/export-options` endpoint ile dinamik seçenekler
  - Batch export dialog'a advanced options eklendi
  - 4 dil desteği (EN, TR, ES, DE)

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

- [x] **Backend Unit Tests** ✅ *Tamamlandı - Kasım 2025*
  - [x] API endpoint testleri (auth routes) → 15 test
  - [x] Color conversion testleri → 15 test
  - [x] Timestamp conversion testleri → 28 test
  - **Toplam: 58 test, %100 passed**
  - [ ] PyonFX renderer testleri (gelecek)

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
| Batch export | Yüksek | Orta | 🔴 P1 | ✅ Tamamlandı |
| **Video Kalite Seçenekleri** | Yüksek | Orta | 🔴 P1 | ✅ Tamamlandı |
| **Responsive Touch Controls** | Orta | Orta | 🟡 P2 | ✅ Tamamlandı |
| **Accessibility (A11y)** | Orta | Orta | 🟡 P2 | ✅ Tamamlandı |
| **Landing Page Redesign** | Yüksek | Yüksek | 🔴 P1 | ✅ Tamamlandı |
| **Upload Page Redesign** | Orta | Orta | 🔴 P1 | ✅ Tamamlandı |
| **Auth Pages (UI)** | Yüksek | Orta | 🔴 P1 | ✅ Tamamlandı |
| **Dashboard Page** | Orta | Orta | 🔴 P1 | ✅ Tamamlandı |
| **Pricing Config** | Orta | Düşük | 🔴 P1 | ✅ Tamamlandı |
| **i18n (4 Dil)** | Yüksek | Orta | 🔴 P1 | ✅ Tamamlandı |
| Backend Auth | Yüksek | Yüksek | 🔴 P1 | ✅ Tamamlandı |
| Payment Integration | Yüksek | Yüksek | 🔴 P1 | ⏳ Bekliyor |
| Editor Page i18n | Orta | Orta | 🟡 P2 | ⏳ Bekliyor |
| Unit test coverage | Orta | Yüksek | 🟡 P2 | ✅ Tamamlandı |
| Mobile responsive | Orta | Orta | 🟡 P2 | ✅ Kısmen |
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
- [x] ASS preview caching
- [x] Batch export

### v1.2 - SaaS Foundation ✅ *Kasım 2025 - TAMAMLANDI*

- [x] Landing Page Redesign (8 bileşen)
- [x] Pricing Configuration (4 plan)
- [x] Upload Page Redesign (Lottie animasyonları)
- [x] Auth Pages UI (Login, Register, Forgot Password)
- [x] Dashboard Page
- [x] i18n - Çoklu dil desteği (EN, TR, ES, DE)
- [x] Backend Authentication (JWT, OAuth) ✅ *Kasım 2025*
- [ ] Payment Integration (Stripe/Paddle)

### v1.3 - SaaS Complete (Aralık 2025)

- [ ] Backend Auth sistemi
- [ ] Stripe/Paddle entegrasyonu
- [ ] User profile & settings
- [ ] Usage tracking & limits
- [ ] Email notifications

### v1.4 - UX İyileştirmeleri (Ocak 2026)

- [ ] Mobile responsive
- [ ] Preset galerisi v2 (favoriler)
- [ ] Kısayol referans paneli
- [ ] Test coverage %50

### v2.0 - Büyük Güncelleme (2026 Q2)

- [ ] **PWA (Progressive Web App)** ⭐
  - [ ] manifest.json yapılandırması
  - [ ] Service Worker (offline desteği)
  - [ ] App icons (192x192, 512x512, maskable)
  - [ ] TWA ile Google Play Store yayını
- [ ] Plugin sistemi
- [ ] AI features
- [ ] Team features
- [ ] Real-time collaboration

> 📱 **Not:** React Native mobil uygulama değerlendirildi ancak ASS/PyonFX render için libass gereksinimi nedeniyle uygun görülmedi. PWA + TWA ile Play Store'da yayın daha mantıklı çözüm.

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
| ⚡ Performance | ASS Preview Caching | Diff-based, debounced updates |
| 📤 Export | Batch Export | Queue system, progress tracking |
| 🎬 Export | Video Kalite Seçenekleri | Codec (H.264/H.265/VP9/ProRes), Bitrate, Resolution |
| 📱 Touch | Responsive Touch Controls | TouchSlider, TouchButton, haptic feedback |
| ♿ A11y | Accessibility | ARIA labels, keyboard nav, screen reader support |
| 🌐 Landing | Landing Page Redesign | 8 profesyonel SaaS bileşeni |
| 📤 Upload | Upload Page Redesign | Lottie, progress steps, usage |
| 🔐 Auth | Auth Pages UI | Login, Register, Forgot Password |
| 📊 Dashboard | Dashboard Page | Projects, usage stats |
| 💰 Pricing | Pricing Config | 4 plan, feature comparison |
| 🌍 i18n | Çoklu Dil Desteği | 4 dil (EN, TR, ES, DE), 600+ çeviri, Editor Page dahil |

### Oluşturulan Yeni Dosyalar

```plaintext
frontend/src/
├── components/
│   ├── editor/
│   │   ├── EditorHeader.tsx     # Header ve navigasyon
│   │   ├── VideoPlayer.tsx      # Video/audio player
│   │   ├── Timeline.tsx         # Profesyonel timeline
│   │   ├── StylePanel.tsx       # Stil düzenleme
│   │   ├── TranscriptPanel.tsx  # Transcript düzenleme
│   │   ├── PresetGallery.tsx    # Preset galerisi
│   │   └── EffectConfig.tsx     # Efekt konfigürasyonu
│   ├── landing/                  # YENİ - Landing page bileşenleri
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── FAQSection.tsx
│   │   ├── CTASection.tsx
│   │   ├── Footer.tsx
│   │   └── index.ts
│   ├── LanguageSelector.tsx      # YENİ - Dil seçici
│   ├── BatchExportDialog.tsx
│   └── ui/
│       ├── index.tsx             # UI Component Library
│       ├── TouchSlider.tsx       # YENİ - Touch-friendly slider
│       └── TouchControls.tsx     # YENİ - Touch buttons ve gestures
├── config/
│   └── pricing.ts               # YENİ - Plan tanımları
├── i18n/                        # YENİ - Çoklu dil desteği
│   ├── index.ts                 # i18n konfigürasyonu
│   └── locales/
│       ├── en.json              # İngilizce
│       ├── tr.json              # Türkçe
│       ├── es.json              # İspanyolca
│       └── de.json              # Almanca
├── pages/
│   ├── LandingPage.tsx          # Yeniden tasarlandı
│   ├── UploadPage.tsx           # Yeniden tasarlandı + i18n
│   ├── DashboardPage.tsx        # YENİ + i18n
│   ├── PricingPage.tsx          # YENİ
│   ├── LoginPage.tsx            # YENİ + i18n
│   ├── RegisterPage.tsx         # YENİ + i18n
│   └── ForgotPasswordPage.tsx   # YENİ
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   └── useAssPreview.ts
├── utils/
│   └── assCache.ts
├── ThemeContext.tsx
└── App.tsx                      # Yeni route'lar + i18n init
    
frontend/public/lottie/          # YENİ - Lottie animasyonları
├── upload-animation.json
├── processing-dots.json
└── success-check.json
```

### Sonraki Adımlar

1. ⏳ Backend Authentication (JWT, user model, OAuth)
2. ⏳ Payment Integration (Stripe/Paddle)
3. ⏳ User profile & settings
4. ⏳ Usage tracking & billing

---

> 💡 **Katkıda Bulunma**: Bu roadmap canlı bir dokümandır. Önerileriniz için issue açabilir veya pull request gönderebilirsiniz.

