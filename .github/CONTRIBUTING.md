# Katkıda Bulunma Rehberi

Subcio projesine katkıda bulunmak istediğiniz için teşekkürler! 🎉

## 🚀 Başlangıç

### Gereksinimler

- Node.js 18+
- Python 3.10+
- CUDA destekli GPU (opsiyonel, transcription için önerilir)
- FFmpeg

### Kurulum

```bash
# Repository'yi klonla
git clone https://github.com/subcio/subcio.git
cd subcio

# Backend kurulumu
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend kurulumu
cd ../frontend
npm install
```

### Çalıştırma

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 📝 Commit Mesajları

Semantic commit mesajları kullanıyoruz:

| Prefix | Açıklama |
|--------|----------|
| `feat:` | Yeni özellik |
| `fix:` | Bug düzeltmesi |
| `docs:` | Dokümantasyon değişiklikleri |
| `style:` | Kod formatı (fonksiyonellik değişmez) |
| `refactor:` | Kod yeniden yapılandırma |
| `perf:` | Performans iyileştirmesi |
| `test:` | Test ekleme/düzeltme |
| `chore:` | Build, config değişiklikleri |

### Örnekler

```
feat: preset favorileme sistemi eklendi
fix: timeline seek sorunu düzeltildi
docs: API endpoint'leri dokümante edildi
refactor: EditorPage bileşenlere ayrıldı
```

## 🌿 Branch Stratejisi

```
main
  └── develop
        ├── feature/preset-favorites
        ├── feature/batch-export
        ├── fix/timeline-seek
        └── refactor/editor-page
```

- `main`: Stabil, production-ready kod
- `develop`: Aktif geliştirme branch'i
- `feature/*`: Yeni özellikler
- `fix/*`: Bug düzeltmeleri
- `refactor/*`: Refaktör işleri

## 🔍 Pull Request Süreci

1. `develop` branch'inden yeni branch oluştur
2. Değişikliklerini yap
3. Test yaz (varsa)
4. Lint hatalarını düzelt
5. Pull request aç
6. Code review bekle
7. Merge!

### PR Template

```markdown
## Açıklama
Bu PR ne yapıyor?

## Değişiklikler
- [ ] Özellik 1
- [ ] Özellik 2

## Test
Nasıl test edildi?

## Ekran Görüntüleri
(UI değişiklikleri için)
```

## 🎨 Kod Stili

### TypeScript/React

- Functional components kullan
- Hooks kullan (class components yok)
- TypeScript strict mode
- Named exports tercih et

```tsx
// ✅ Doğru
export function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

// ❌ Yanlış
export default class MyComponent extends React.Component { ... }
```

### Python

- PEP 8 uyumlu
- Type hints kullan
- Docstrings yaz

```python
# ✅ Doğru
def process_subtitle(text: str, effect: str) -> dict:
    """
    Altyazı metnine efekt uygular.
    
    Args:
        text: Altyazı metni
        effect: Uygulanacak efekt adı
        
    Returns:
        İşlenmiş altyazı verisi
    """
    pass
```

## 📁 Proje Yapısı

```
subcio/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── styles/           # PyonFX efektleri
│   └── exports/          # Export edilen dosyalar
├── frontend/
│   ├── src/
│   │   ├── pages/        # Sayfa bileşenleri
│   │   ├── components/   # UI bileşenleri
│   │   └── hooks/        # Custom hooks
│   └── public/           # Statik dosyalar
└── .github/              # GitHub yapılandırma
```

## 🐛 Bug Raporlama

Issue açarken şunları belirt:

1. **Beklenen davranış**: Ne olmalıydı?
2. **Gerçekleşen davranış**: Ne oldu?
3. **Reproduksiyon adımları**: Nasıl tekrarlanır?
4. **Ortam bilgisi**: OS, browser, Node/Python versiyonu
5. **Ekran görüntüleri**: (varsa)

## 💡 Özellik Önerisi

Yeni özellik için:

1. Önce issue aç ve tartış
2. Onay aldıktan sonra geliştirmeye başla
3. [ROADMAP.md](./ROADMAP.md)'e göz at

## ❓ Sorular

Sorularınız için:

- GitHub Discussions kullan
- Discord kanalına katıl (varsa)
- Issue açarak sor

---

Katkılarınız için teşekkürler! 🚀
