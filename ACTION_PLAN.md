# 🚀 Subcio Aksiyon Planı

Bu dosya, uygulama analizi sonucunda tespit edilen sorunları ve düzeltme planını içerir.

---

## 📊 Sorun Özeti

| Kategori | Kritik 🔴 | Yüksek 🟠 | Orta 🟡 | Düşük 🟢 |
|----------|-----------|-----------|---------|----------|
| Güvenlik | 8 | 7 | 10 | 4 |
| Eksik Özellikler | 2 | 4 | 6 | - |
| Hata Yönetimi | 1 | 4 | 12 | 3 |
| Input Validation | 3 | 4 | 5 | - |
| Performans | - | 1 | 6 | 3 |
| UI/UX | - | 2 | 8 | 4 |
| i18n/Çeviri | - | 1 | 5 | 2 |
| **TOPLAM** | **14** | **23** | **52** | **16** |

---

## 🔴 KRİTİK SORUNLAR

### 1. CORS Wildcard Güvenlik Açığı
**Dosya:** `backend/main.py` (satır 580-585)
```python
# ❌ Mevcut (Tehlikeli)
allow_origins=["*"]

# ✅ Düzeltme
allow_origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "https://subcio.io",
    "https://app.subcio.io"
]
```
**Risk:** Herhangi bir site API'ye erişebilir.
**Öncelik:** 🔴 Hemen

---

### 2. SECRET_KEY Varsayılan Değer
**Dosya:** `backend/auth/utils.py` (satır 18)
```python
# ❌ Mevcut
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production-2024")

# ✅ Düzeltme
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required!")
```
**Risk:** JWT token'lar kolayca kırılabilir.
**Öncelik:** 🔴 Hemen

---

### 3. Debug Print Production'da
**Dosya:** `backend/auth/routes.py` (satır 199-201)
```python
# ❌ Kaldırılmalı
print(f"Password reset token for {user.email}: {reset_token}")
```
**Risk:** Token'lar log'lara yazılıyor.
**Öncelik:** 🔴 Hemen

---

### 4. Dosya Upload Validasyonu Yok
**Dosya:** `backend/main.py` (satır 693-736)
```python
# ✅ Eklenecek
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".mp3", ".wav"}

@app.post("/api/transcribe")
async def transcribe_video(file: UploadFile = File(...)):
    # Dosya boyutu kontrolü
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Max 500MB allowed.")
    
    # Dosya tipi kontrolü
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Invalid file type. Allowed: {ALLOWED_EXTENSIONS}")
```
**Risk:** Kötü niyetli dosya yüklenebilir.
**Öncelik:** 🔴 Hemen

---

### 5. Path Traversal Açığı
**Dosya:** `backend/main.py` (satır 919-976) - `extract_aas_style`
```python
# ✅ Eklenecek
import os

def is_safe_path(basedir, path):
    """Path traversal saldırısını önle"""
    resolved = os.path.realpath(path)
    return resolved.startswith(os.path.realpath(basedir))

# Kullanım
if not is_safe_path(PROJECTS_DIR, file_path):
    raise HTTPException(403, "Access denied")
```
**Risk:** `../../../etc/passwd` gibi path'ler okunabilir.
**Öncelik:** 🔴 Hemen

---

### 6. OAuth State Parametresi Yok
**Dosya:** `backend/auth/routes.py` (satır 237-250)
```python
# ✅ Eklenecek
import secrets

@router.get("/oauth/{provider}/authorize")
async def oauth_authorize(provider: str, request: Request):
    state = secrets.token_urlsafe(32)
    request.session["oauth_state"] = state
    
    redirect_url = f"https://provider.com/auth?state={state}&..."
    return RedirectResponse(redirect_url)

@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, state: str, request: Request):
    if state != request.session.get("oauth_state"):
        raise HTTPException(403, "Invalid state parameter")
```
**Risk:** CSRF saldırısı yapılabilir.
**Öncelik:** 🔴 Hemen

---

### 7. Rate Limiting Yok
**Dosya:** `backend/auth/routes.py`
```python
# ✅ Eklenecek
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...

@router.post("/register")
@limiter.limit("3/minute")
async def register(request: Request, ...):
    ...
```
**Risk:** Brute-force saldırısı yapılabilir.
**Öncelik:** 🔴 Hemen

---

### 8. Signup Route Tanımlı Değil
**Dosya:** `frontend/src/components/landing/CTASection.tsx`
```typescript
// ❌ Mevcut
navigate("/signup"); // Bu route yok!

// ✅ Düzeltme
navigate("/register");
```
**Risk:** Kullanıcı 404 sayfasına yönlendirilir.
**Öncelik:** 🔴 Hemen

---

## 🟠 YÜKSEK ÖNCELİKLİ SORUNLAR

### Frontend

| # | Sorun | Dosya | Düzeltme |
|---|-------|-------|----------|
| 1 | OAuth Login Eksik | `LoginPage.tsx` | Google/GitHub OAuth implementasyonu |
| 2 | Password Reset API Yok | `ForgotPasswordPage.tsx` | Gerçek API çağrısı ekle |
| 3 | Hardcoded API URL | Birçok dosya | Environment variable kullan |
| 4 | Token localStorage'da | `authService.ts` | httpOnly cookie düşün |
| 5 | ProjectMeta Type Eksik | `types.ts` | Eksik alanları ekle |

### Backend

| # | Sorun | Dosya | Düzeltme |
|---|-------|-------|----------|
| 6 | Stripe Key Boş Kontrolü | `payments/config.py` | Başlangıçta validation |
| 7 | Token Blacklisting Yok | `auth/routes.py` | Redis ile token revocation |
| 8 | Email Gönderimi Eksik | `auth/routes.py` | SMTP veya service entegrasyonu |
| 9 | Batch Export ext Hatası | `main.py:1021` | `"ext"` → `"format"` |

---

## 🟡 ORTA ÖNCELİKLİ SORUNLAR

### Eksik i18n Çevirileri

| Dosya | Hardcoded Metin |
|-------|-----------------|
| `ForgotPasswordPage.tsx` | "Şifre sıfırlama bağlantısı gönderildi" |
| `RegisterPage.tsx` | "veya şununla kayıt ol" |
| `SettingsPage.tsx` | Bazı form etiketleri |

### Erişilebilirlik (A11y)

| Bileşen | Eksik |
|---------|-------|
| VideoPlayer | `aria-label` |
| PresetGallery | `tabIndex`, keyboard navigation |
| Timeline Slider | `aria-label` |
| Dropdown menüler | `aria-expanded`, `aria-haspopup` |

### Loading States

| Sayfa | Durum |
|-------|-------|
| SettingsPage | Profil güncelleme loading yok |
| DashboardPage | İlk yükleme skeleton yok |
| EditorPage | Stats yükleme kısmi |

### Performans

| Dosya | Sorun | Çözüm |
|-------|-------|-------|
| `EditorPage.tsx` | ~650 satır | Alt bileşenlere ayır |
| `SettingsPage.tsx` | ~500 satır | Tab'ları ayrı dosyalara taşı |
| `EditorPage.tsx` | Gereksiz re-render | `useMemo`, `useCallback` kullan |

---

## 🧪 TEST DURUMU

### Mevcut Testler ✅
- `backend/tests/test_auth.py` - Auth akışları
- `backend/test_pyonfx_effects.py` - Efekt testleri

### Eksik Testler ❌

| Modül | Öncelik | Açıklama |
|-------|---------|----------|
| Stripe webhook | 🔴 Kritik | Ödeme akışı testleri |
| Transcribe endpoint | 🔴 Kritik | Upload ve transkripsiyon |
| Export endpoint | 🟠 Yüksek | ASS/SRT export |
| Batch export | 🟠 Yüksek | Toplu dışa aktarım |
| OAuth flow | 🟡 Orta | Google/GitHub login |

---

## 📦 Bağımlılık Güncellemeleri

| Paket | Mevcut | Güncel | Öncelik |
|-------|--------|--------|---------|
| `fastapi` | 0.110.0 | 0.115.x | 🟡 Orta |
| `stripe` | 7.0.0 | 11.x | 🟠 Yüksek |
| `sqlalchemy` | 2.0.25 | 2.0.35 | 🟡 Orta |

### Eksik Paketler

| Paket | Neden | Öncelik |
|-------|-------|---------|
| `python-dotenv` | .env yönetimi | 🟡 Orta |
| `slowapi` | Rate limiting | 🔴 Kritik |
| `cryptography` | APIKeyManager | 🟠 Yüksek |

---

## ✅ HAFTALIK AKSIYON PLANI

### Hafta 1: Kritik Güvenlik Düzeltmeleri

| Gün | Görev | Dosya |
|-----|-------|-------|
| Pzt | CORS düzelt | `main.py` |
| Pzt | SECRET_KEY validation | `auth/utils.py` |
| Sal | Debug print kaldır | `auth/routes.py` |
| Sal | Upload validation | `main.py` |
| Çar | Path traversal koruması | `main.py` |
| Çar | OAuth state ekle | `auth/routes.py` |
| Per | Rate limiting | `auth/routes.py` |
| Per | Signup route düzelt | `CTASection.tsx` |
| Cum | Test & Review | - |

### Hafta 2: Yüksek Öncelikli Sorunlar

| Gün | Görev | Dosya |
|-----|-------|-------|
| Pzt | API URL env variable | Tüm servisler |
| Sal | OAuth login impl. | `LoginPage.tsx` |
| Çar | Password reset email | `auth/routes.py` |
| Per | Stripe key validation | `payments/config.py` |
| Cum | ProjectMeta types | `types.ts` |

### Hafta 3: Orta Öncelikli İyileştirmeler

| Gün | Görev |
|-----|-------|
| Pzt | i18n hardcoded metinler |
| Sal | A11y iyileştirmeleri |
| Çar | Loading states |
| Per | EditorPage refactor |
| Cum | Test yazma |

### Hafta 4: Eksik Sayfalar (Kritik)

| Gün | Görev |
|-----|-------|
| Pzt | 404 Page |
| Sal | Privacy Policy |
| Çar | Terms of Service |
| Per | Cookie Policy |
| Cum | Contact Page |

---

## 🔗 İlgili Dosyalar

- `PAGES_ROADMAP.md` - Eksik sayfalar detayı
- `LOTTIE_ANIMATIONS.md` - Animasyon listesi
- `DEPLOYMENT.md` - Deployment rehberi

---

## 📝 Notlar

1. Kritik güvenlik sorunları production'a çıkmadan önce **mutlaka** düzeltilmeli
2. Rate limiting için Redis kurulumu gerekebilir
3. Email gönderimi için SMTP veya SendGrid/Mailgun entegrasyonu gerekli
4. OAuth için Google/GitHub Developer Console'da app oluşturulmalı

---

## ✅ Tamamlandıkça İşaretle

### 🔴 Kritik
- [ ] CORS wildcard kaldır
- [ ] SECRET_KEY validation
- [ ] Debug print kaldır
- [ ] Upload validation
- [ ] Path traversal koruması
- [ ] OAuth state parametresi
- [ ] Rate limiting
- [ ] Signup route düzelt

### 🟠 Yüksek
- [ ] API URL env variable
- [ ] OAuth login implementasyonu
- [ ] Password reset email
- [ ] Stripe key validation
- [ ] Token blacklisting
- [ ] ProjectMeta types

### 🟡 Orta
- [ ] i18n düzeltmeleri
- [ ] A11y iyileştirmeleri
- [ ] Loading states
- [ ] Performans optimizasyonu
- [ ] Bağımlılık güncellemeleri
