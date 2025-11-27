# 🔤 Subcio Font Management

Bu klasör, altyazılar için kullanılan tüm özel fontları içerir.

## 📁 Yapı

```
frontend/
├── public/
│   ├── fonts/           # 89 adet .ttf font dosyası
│   │   ├── AdventPro-ExtraBold.ttf
│   │   ├── Bangers-Regular.ttf
│   │   ├── ... (89 font)
│   │   └── README.md    # Bu dosya
│   └── fonts.css        # Font-face tanımları (otomatik oluşturulmuş)
├── src/
│   └── index.css        # Global stiller (Google Fonts import)
└── index.html           # fonts.css'i link eder
```

## 🔄 Font Yükleme Süreci

1. **index.html** → `<link rel="stylesheet" href="/fonts.css" />` ile font-face'ler yüklenir
2. **fonts.css** → Her font için `@font-face` tanımı içerir (backend tarafından oluşturulmuş)
3. **Backend** → `backend/fonts/` klasöründeki fontları kullanır (ASS render için)

## ✅ Mevcut Fontlar (89 adet)

| Kategori | Fontlar |
|----------|---------|
| **Display** | Bangers, Bungee, BungeeInline, LuckiestGuy, Ranchers |
| **Handwriting** | CaveatBrush, PatrickHand, GloriaHallelujah, JustAnotherHand |
| **Decorative** | Eater, Fruktur, RubikWetPaint, RubikSprayPaint, Shojumaru |
| **Sans-serif** | Nunito, BricolageGrotesque, ShantellSans, Truculenta |
| **Serif** | Caudex, UncialAntiqua, Milonga, Risque |
| **Funky** | CherryBombOne, DynaPuff, Gluten, Grandstander, WinkyRough |

## 🆕 Yeni Font Ekleme

1. `.ttf` dosyasını bu klasöre ekle
2. `fonts.css` dosyasına @font-face tanımı ekle:

```css
@font-face {
  font-family: "FontName";
  src: url("/fonts/FontName.ttf");
  font-weight: normal;
  font-style: normal;
}
```

3. Backend'de de aynı fontu `backend/fonts/` klasörüne ekle
4. Frontend'i yeniden build et

## ⚠️ Önemli Notlar

- Font dosya adlarında **boşluk kullanma** (örn: `Font Name.ttf` ❌, `FontName.ttf` ✅)
- Tüm fontlar **TrueType (.ttf)** formatında olmalı
- Font isimleri **case-sensitive** değil (büyük/küçük harf fark etmez)
- Google Fonts'tan gelen fontlar `index.css`'de import edilir

## 📊 Font Boyutu

Toplam font boyutu: ~15 MB

> Not: Production'da fontlar lazy-load edilir, sayfa yüklenme hızını etkilemez.

---

Son güncelleme: 27 Kasım 2025
