# 🔐 Subcio Security Implementation Guide

Bu doküman, Subcio uygulamasının güvenlik mimarisini ve her bir güvenlik katmanının nasıl çalıştığını açıklar.

---

## 📋 Güvenlik Kontrol Listesi

| # | Güvenlik Özelliği | Durum | Açıklama |
|---|-------------------|-------|----------|
| 1️⃣ | API Key Protection | ✅ | API anahtarları şifreli, client erişemez |
| 2️⃣ | Database Rules | ✅ | Row-level security, kullanıcı izolasyonu |
| 3️⃣ | Auth Enforcement | ✅ | JWT + OAuth, tüm endpoint'lerde kontrol |
| 4️⃣ | Webhook Verification | ✅ | Stripe signature doğrulama |
| 5️⃣ | Input Validation | ✅ | Pydantic + custom sanitization |
| 6️⃣ | Service Blacklist | ✅ | Yasaklı içerik filtreleme |
| 7️⃣ | Audit Logging | ✅ | Tüm kritik işlemler loglanır |
| 8️⃣ | Credit Protection | ✅ | Server-side only credit ops |
| 9️⃣ | Device Mapping | ✅ | Cihaz-hesap eşleştirme |
| 🔟 | Rate Limits | ✅ | Token bucket algoritması |
| 1️⃣1️⃣ | Duplicate Protection | ✅ | Event ID tracking |
| 1️⃣2️⃣ | Data Validation | ✅ | Schema-based validation |

---

## 1️⃣ API Key Protection

### Nasıl Çalışır?
```python
from backend.security import APIKeyManager

# API anahtarı almak (sadece server-side)
stripe_key = APIKeyManager.get_key("STRIPE_SECRET_KEY")

# Loglama için maskeleme
masked = APIKeyManager.mask_key(stripe_key)  # "sk_t...4xYz"
```

### Neden Önemli?
- API anahtarları frontend'e ASLA gönderilmez
- Environment variable'da şifreli saklanır
- Sızma durumunda bile decrypt edilemez

### Konfigürasyon
```bash
# .env dosyası
ENCRYPTION_KEY=your-32-byte-encryption-key-here
STRIPE_SECRET_KEY_ENCRYPTED=encrypted-value-here
```

---

## 2️⃣ Database Rules (Row-Level Security)

### Nasıl Çalışır?
```python
# Her query user_id filtresi içerir
projects = db.query(Project).filter(
    Project.user_id == current_user.id  # ← Zorunlu
).all()
```

### SQLAlchemy Middleware
```python
@event.listens_for(Session, "do_orm_execute")
def filter_by_user(orm_execute_state):
    if orm_execute_state.is_select:
        # Otomatik user_id filtresi ekle
        orm_execute_state.statement = orm_execute_state.statement.filter(
            Model.user_id == current_user_id
        )
```

---

## 3️⃣ Auth Enforcement

### JWT Token Yapısı
```python
{
    "sub": "user-uuid",
    "email": "user@example.com",
    "plan": "pro",
    "exp": 1700000000,
    "iat": 1699000000
}
```

### Korumalı Endpoint'ler
```python
from backend.auth.utils import get_current_user

@router.get("/api/projects")
async def get_projects(
    current_user: User = Depends(get_current_user)  # ← Zorunlu
):
    # current_user None ise 401 döner
    return projects
```

### Yetkilendirme Seviyeleri
| Level | Açıklama |
|-------|----------|
| `public` | Auth gerektirmez |
| `authenticated` | Login zorunlu |
| `owner` | Kendi kaynağı olmalı |
| `admin` | Admin rolü gerekli |

---

## 4️⃣ Webhook Verification

### Stripe Webhook Doğrulama
```python
from backend.security import WebhookVerifier

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    
    # Signature doğrulama
    if not WebhookVerifier.verify_stripe_signature(
        payload, signature, STRIPE_WEBHOOK_SECRET
    ):
        raise HTTPException(400, "Invalid signature")
    
    # Duplicate check (replay attack prevention)
    event_id = event["id"]
    if WebhookVerifier.is_duplicate_event(event_id):
        return {"status": "already processed"}
    
    # İşle ve işlenmiş olarak işaretle
    await process_event(event)
    WebhookVerifier.mark_event_processed(event_id)
```

---

## 5️⃣ Input Validation

### Tehlikeli Patternler
```python
# SQL Injection
"'; DROP TABLE users; --"  ❌ Engellenir

# XSS
"<script>alert('hack')</script>"  ❌ Engellenir

# Path Traversal  
"../../etc/passwd"  ❌ Engellenir
```

### Pydantic Schema Örneği
```python
from backend.security import SecureUserCreate

class UserCreate(SecureUserCreate):
    email: str     # → otomatik lowercase, format check
    password: str  # → min 8 char, büyük/küçük/rakam zorunlu
    name: str      # → XSS/SQL injection check
```

---

## 6️⃣ Service Blacklist

### Yasaklı Kategoriler
```python
BLACKLIST = {
    "gambling": ["casino", "poker", "betting"],
    "adult": ["adult", "porn", "nsfw"],
    "illegal": ["drugs", "weapons"],
    "regulated": ["crypto", "forex"],
}
```

### Kullanım
```python
from backend.security import ServiceBlacklist

is_blocked, category = ServiceBlacklist.is_blacklisted(user_input)
if is_blocked:
    raise HTTPException(400, f"Content not allowed: {category}")
```

---

## 7️⃣ Audit Logging

### Log Yapısı
```python
{
    "timestamp": "2025-11-27T10:30:00Z",
    "user_id": 12345,
    "action": "SUBSCRIPTION_CREATE",
    "resource_type": "subscription",
    "resource_id": "sub_abc123",
    "ip_address": "192.168.1.1",
    "status": "success",
    "details": {
        "plan": "pro",
        "amount": 29.00
    }
}
```

### Loglanan Aksiyonlar
- `LOGIN`, `LOGIN_FAILED`, `LOGOUT`
- `REGISTER`, `PASSWORD_CHANGE`
- `SUBSCRIPTION_CREATE`, `SUBSCRIPTION_CANCEL`
- `PAYMENT_SUCCESS`, `PAYMENT_FAILED`
- `CREDITS_ADD`, `CREDITS_USE`
- `UPLOAD`, `EXPORT`, `DELETE`
- `RATE_LIMIT`, `INVALID_INPUT`

---

## 8️⃣ Credit Manipulation Protection

### Server-Side Only
```python
from backend.security import CreditManager

# ✅ Doğru yol - Server tarafında
CreditManager.add_credits(db, user, amount=100, reason="purchase")

# ❌ Yanlış - Client'tan gelen değer KULLANILMAZ
user.credits = request.credits  # ASLA!
```

### Atomic Operations
```python
# Tüm credit işlemleri transaction içinde
with db.begin():
    CreditManager.use_credits(db, user, amount=10, reason="export")
    # Başarısız olursa rollback
```

---

## 9️⃣ Device Mapping

### Cihaz Kaydı
```python
from backend.security import DeviceManager

success = DeviceManager.register_device(
    db=db,
    user_id=user.id,
    device_id="device-uuid-123",
    device_name="iPhone 15 Pro",
    platform="ios"
)

if not success:
    # Cihaz başka kullanıcıya ait veya limit aşıldı
    raise HTTPException(403, "Device registration failed")
```

### Limitleri
- Kullanıcı başına max 5 cihaz
- Bir cihaz sadece bir hesaba bağlı
- Cihaz transferi admin onayı gerektirir

---

## 🔟 Rate Limiting

### Limit Türleri
```python
LIMITS = {
    "default": 60/dakika,
    "auth": 5/dakika,      # Brute force önleme
    "upload": 10/dakika,
    "export": 5/dakika,
    "api": 100/dakika,
}
```

### Kullanım
```python
from backend.security import rate_limit

@router.post("/login")
@rate_limit("auth")  # 5 deneme/dakika
async def login(request: Request, ...):
    ...
```

### Response
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{
    "detail": "Rate limit exceeded. Try again in 30 seconds."
}
```

---

## 1️⃣1️⃣ Duplicate Protection

### Event ID Tracking
```python
# Webhook geldiğinde
if WebhookVerifier.is_duplicate_event(event_id):
    return {"status": "skipped"}  # Tekrar işlenmiyor

# İşledikten sonra
WebhookVerifier.mark_event_processed(event_id)
```

### TTL
- İşlenmiş event'ler 1 saat saklanır
- Memory limiti: 10,000 event
- LRU eviction

---

## 1️⃣2️⃣ Data Validation

### Schema-Based
```python
class SecureFileUpload(BaseModel):
    filename: str = Field(max_length=255)
    content_type: str
    size: int = Field(gt=0, lt=500*1024*1024)  # Max 500MB
    
    ALLOWED_TYPES = {"video/mp4", "video/webm", "audio/mpeg"}
    
    @validator("content_type")
    def check_type(cls, v):
        if v not in cls.ALLOWED_TYPES:
            raise ValueError("File type not allowed")
        return v
```

---

## 🛡️ Security Headers

Tüm response'lara eklenen güvenlik header'ları:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

---

## 🚨 Incident Response

### Şüpheli Aktivite Tespit Edildiğinde

1. **Rate limit aşımı** → IP otomatik engellenir (1 saat)
2. **Brute force** → Hesap 30 dakika kilitlenir
3. **Device hijacking** → Tüm oturumlar sonlandırılır
4. **Webhook replay** → Event atlanır, alarm loglanır

### Alarm Tetikleyiciler
- 5+ başarısız login (1 dakika içinde)
- Aynı device ID farklı hesaplara bağlanma girişimi
- API key erişim loglarında anomali
- Olağandışı credit artışı

---

## 📊 Monitoring Dashboard

### Metrikler
- Login başarı/başarısızlık oranı
- Rate limit hit sayısı
- Webhook işleme süresi
- Audit log hacmi
- Aktif oturum sayısı

### Alertler
- Error rate > %5
- Response time > 5s
- Failed logins > 10/min
- Disk usage > 90%

---

## 📝 Checklist - Production Deployment

- [ ] Tüm API key'ler encrypted
- [ ] HTTPS zorunlu
- [ ] Rate limit aktif
- [ ] Audit logging çalışıyor
- [ ] Webhook signature verification aktif
- [ ] CORS policy doğru
- [ ] Security headers eklendi
- [ ] Input validation tüm endpoint'lerde
- [ ] Database backup otomatik
- [ ] Error monitoring aktif (Sentry)

---

> 📅 Son Güncelleme: 27 Kasım 2025
> 
> ⚠️ Bu doküman güncel tutulmalıdır. Yeni güvenlik önlemleri eklendikçe güncellenmelidir.
