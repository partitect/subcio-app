# Subcio Video Export - Durum Raporu ve Yol Haritası

## 📋 Mevcut Durum

### Sorunlar

1. **FFmpeg.wasm SharedArrayBuffer Sorunu**
   - FFmpeg.wasm multi-threaded versiyon (`@ffmpeg/core@0.12.6`) SharedArrayBuffer gerektiriyor
   - SharedArrayBuffer için COOP/COEP header'ları gerekli
   - Bu header'lar dış kaynaklardan (i.pravatar.cc gibi avatar resimleri) içerik yüklemeyi engelliyor

2. **Font Dosyaları Sorunu**
   - Netlify'da font dosyaları (`*.ttf`) HTML olarak serve ediliyor
   - `OTS parsing error: invalid sfntVersion: 1008821359` hatası
   - SPA redirect kuralı static dosyaları da yakalıyor olabilir
   - `_redirects` dosyası eklendi ama çözüm olmadı

3. **Console Logları Görünmüyor**
   - FFmpeg export logları console'da görünmüyor
   - Hata initFFmpeg aşamasında oluşuyor olabilir

---

## 🛣️ Alternatif Yaklaşımlar

### Seçenek 1: Server-Side Export (Harici Servis)
**Tavsiye Edilen** ⭐

Cloudflare Workers veya AWS Lambda ile hafif bir video işleme servisi.

**Avantajları:**
- Railway'de memory sorunu olmaz (export işi dışarıda)
- Güvenilir ve ölçeklenebilir
- CORS/header sorunları yok

**Dezavantajları:**
- Ek maliyet (ama düşük - kullanım başına ödeme)
- Setup gerekli

**Uygulama:**
```
1. Cloudflare Workers + R2 Storage
2. Kullanıcı export isteği → Worker video + ASS alır → İşler → R2'ye yükler → Link döner
3. Maliyet: ~$5/ay (düşük kullanımda)
```

---

### Seçenek 2: Sadece ASS/SRT Export
**En Basit Çözüm** ⭐

Video export'u tamamen kaldırıp sadece altyazı dosyası export et.

**Avantajları:**
- Sıfır maliyet
- Anında çalışır
- Hiçbir external dependency yok

**Dezavantajları:**
- Kullanıcı videoyu kendi birleştirmeli (CapCut, Premiere, vb.)

**Uygulama:**
```typescript
// Sadece ASS dosyası download
const assContent = generateASSContent(words, style);
const blob = new Blob([assContent], { type: 'text/plain' });
downloadBlob(blob, 'subtitles.ass');
```

---

### Seçenek 3: FFmpeg.wasm Single-Threaded (0.11.x)
**Eski Versiyon**

Eski FFmpeg.wasm versiyonu SharedArrayBuffer gerektirmez.

**Avantajları:**
- Client-side çalışır
- Ek maliyet yok

**Dezavantajları:**
- Eski API, maintenance yok
- Daha yavaş
- Bazı codec'ler eksik olabilir

**Uygulama:**
```bash
npm install @ffmpeg/ffmpeg@0.11.6 @ffmpeg/core@0.11.0
```

---

### Seçenek 4: Remotion ile Cloud Render
**Premium Çözüm**

Remotion kullanarak profesyonel video render servisi.

**Avantajları:**
- Yüksek kalite
- React tabanlı (kolay entegrasyon)
- Cloud render seçeneği

**Dezavantajları:**
- Öğrenme eğrisi
- Cloud render maliyetli (~$0.05/dakika video)

---

### Seçenek 5: Creatomate / Shotstack API
**Hazır Çözüm**

3rd party video API servisleri.

**Avantajları:**
- Hazır, hızlı entegrasyon
- Güvenilir

**Dezavantajları:**
- Maliyet: ~$0.10-0.50/video
- Vendor lock-in

---

## 📊 Karşılaştırma Tablosu

| Seçenek | Maliyet | Zorluk | Güvenilirlik | Hız |
|---------|---------|--------|--------------|-----|
| 1. Cloudflare Workers | $5-20/ay | Orta | ⭐⭐⭐⭐⭐ | Hızlı |
| 2. Sadece ASS Export | $0 | Kolay | ⭐⭐⭐⭐⭐ | Anında |
| 3. FFmpeg 0.11.x | $0 | Orta | ⭐⭐⭐ | Yavaş |
| 4. Remotion | $50+/ay | Zor | ⭐⭐⭐⭐ | Orta |
| 5. Creatomate | $30+/ay | Kolay | ⭐⭐⭐⭐⭐ | Hızlı |

---

## 🎯 Önerilen Strateji

### Kısa Vadeli (Hemen)
1. **Seçenek 2: ASS/SRT Export** ekle
   - Kullanıcılar hemen altyazı dosyası indirebilsin
   - "Video export yakında" mesajı göster
   - 1 saatlik iş

### Orta Vadeli (1-2 Hafta)
2. **Seçenek 3: FFmpeg 0.11.x** dene
   - Eski ama çalışan versiyon
   - SharedArrayBuffer gerektirmez
   - Test et, çalışırsa kullan

### Uzun Vadeli (Premium Özellik)
3. **Seçenek 1: Cloudflare Workers** 
   - Pro/Premium kullanıcılar için video export
   - Subscription modeli için değerli özellik

---

## 📝 Yapılacaklar Listesi

- [ ] ASS/SRT export butonu ekle (hızlı çözüm)
- [ ] FFmpeg 0.11.x test et
- [ ] Font sorununu araştır (Netlify build output kontrol)
- [ ] Cloudflare Workers POC yap
- [ ] Export modal'ına seçenekler ekle:
  - [ ] "Download Subtitle File (ASS)" 
  - [ ] "Download Subtitle File (SRT)"
  - [ ] "Export Video (Coming Soon)" / "Export Video (Pro)"

---

## 🔧 Acil Düzeltme - ASS Export

Şu anki export butonuna hızlı ASS download eklemek için:

```typescript
// EditorPage.tsx'e eklenecek
const handleDownloadASS = () => {
  const assContent = generateASSContent(words, {
    fontFamily: style.font,
    fontSize: style.font_size,
    // ... diğer stiller
  });
  
  const blob = new Blob([assContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${exportName}.ass`;
  a.click();
  URL.revokeObjectURL(url);
};
```

---

*Son Güncelleme: 4 Aralık 2025*
