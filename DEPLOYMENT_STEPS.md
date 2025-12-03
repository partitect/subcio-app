# 🚀 Subcio Production Deployment - Step by Step

Bu dosya production deployment için sıralı adımları içerir.

---

## ⚠️ Ön Hazırlık

### 1. Gerekli Hesapları Aç

- [ ] Railway.app hesabı (GitHub ile login)
- [ ] Netlify hesabı (GitHub ile login)
- [ ] Google Cloud Console erişimi
- [ ] GitHub Developer Settings erişimi
- [ ] Stripe hesabı (doğrulanmış)

---

## 📦 PHASE 1: Backend Deployment (Railway)

### Adım 1.1: Railway Projesi Oluştur

```bash
# Railway'e git: https://railway.app
# "New Project" → "Deploy from GitHub repo"
# partitect/subcio-app seçin
```

### Adım 1.2: PostgreSQL Ekle

```bash
# Railway Dashboard → "New" → "Database" → "Add PostgreSQL"
# Otomatik olarak DATABASE_URL environment variable eklenir
```

### Adım 1.3: Environment Variables Ayarla

Railway Dashboard → Settings → Variables

**Zorunlu değişkenler** (`.env.production.example` dosyasından):

```env
# Güvenlik
JWT_SECRET_KEY=<openssl rand -hex 32 ile üret>
FRONTEND_URL=https://subcio.netlify.app
ALLOWED_ORIGINS=https://subcio.netlify.app

# Uygulama
APP_ENV=production
LOG_LEVEL=INFO
```

**Şimdilik boş bırakılabilir** (OAuth ve Stripe sonra):
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID
- GITHUB_CLIENT_SECRET
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

### Adım 1.4: Deploy Tetikle

```bash
# Railway otomatik deploy eder
# Deployment başarılı olduğunda URL alırsınız:
# https://subcio-app.up.railway.app
```

### Adım 1.5: Health Check

```bash
curl https://subcio-app.up.railway.app/health

# Beklenen response:
# {"status":"healthy","version":"1.0.0","service":"subcio-api"}
```

**✅ Backend hazır!** Railway URL'ini kaydet: `___________________________`

---

## 🌐 PHASE 2: Frontend Deployment (Netlify)

### Adım 2.1: Netlify Sitesi Oluştur

```bash
# Netlify'e git: https://app.netlify.com
# "Add new site" → "Import an existing project"
# GitHub → partitect/subcio-app seç
```

### Adım 2.2: Build Ayarları

```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
Node version: 18
```

### Adım 2.3: Environment Variables Ekle

Site settings → Environment variables:

```env
VITE_API_URL=https://subcio-app.up.railway.app/api
```

**Stripe key'i sonra eklenecek**

### Adım 2.4: Deploy Tetikle

```bash
# "Deploy site" butonuna tıkla
# Build başarılı olduğunda URL alırsınız:
# https://subcio-xyz123.netlify.app
```

### Adım 2.5: Site Adını Değiştir (Opsiyonel)

```bash
# Site settings → Site details → Change site name
# Örn: subcio → https://subcio.netlify.app
```

**✅ Frontend hazır!** Netlify URL'ini kaydet: `___________________________`

---

## 🔐 PHASE 3: OAuth Configuration

### Adım 3.1: Google Cloud Console

1. Git: https://console.cloud.google.com
2. Yeni proje oluştur: **"Subcio"**
3. APIs & Services → OAuth consent screen
   - User Type: **External**
   - App name: **Subcio**
   - Support email: **your-email@gmail.com**
4. Credentials → Create Credentials → **OAuth client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins:
   ```
   https://subcio.netlify.app
   ```
7. Authorized redirect URIs:
   ```
   https://subcio-app.up.railway.app/api/auth/google/callback
   ```
8. **Client ID ve Secret'ı kaydet:**
   - Client ID: `___________________________`
   - Client Secret: `___________________________`

### Adım 3.2: GitHub OAuth App

1. Git: https://github.com/settings/developers
2. OAuth Apps → **New OAuth App**
3. Bilgileri doldur:
   ```
   Application name: Subcio
   Homepage URL: https://subcio.netlify.app
   Authorization callback URL: https://subcio-app.up.railway.app/api/auth/github/callback
   ```
4. Register application
5. **Client ID ve Secret'ı kaydet:**
   - Client ID: `___________________________`
   - Client Secret: **Generate a new client secret** (hemen kaydet!)

### Adım 3.3: Railway'e OAuth Credentials Ekle

Railway Dashboard → Variables:

```env
GOOGLE_CLIENT_ID=<Google'dan aldığın>
GOOGLE_CLIENT_SECRET=<Google'dan aldığın>
GITHUB_CLIENT_ID=<GitHub'dan aldığın>
GITHUB_CLIENT_SECRET=<GitHub'dan aldığın>
```

**✅ OAuth yapılandırması tamamlandı!**

---

## 💳 PHASE 4: Stripe Configuration

### Adım 4.1: Stripe Hesabını Aktive Et

1. Git: https://dashboard.stripe.com
2. Hesabı doğrula (banka/kimlik bilgileri)
3. **Test Mode → Live Mode** değiştir

### Adım 4.2: API Keys Al

Dashboard → Developers → API keys:

```
Publishable key: pk_live_xxxxx
Secret key: sk_live_xxxxx (Reveal ile göster)
```

**Kaydet:**
- Publishable: `___________________________`
- Secret: `___________________________`

### Adım 4.3: Products Oluştur

Products → Add product:

**1. Starter Plan**
```
Name: Starter
Price: $9.99 USD (veya ₺99 TRY)
Billing period: Monthly
Price ID: price_xxxxx (kaydet)
```

**2. Pro Plan**
```
Name: Pro  
Price: $19.99 USD (veya ₺199 TRY)
Billing period: Monthly
Price ID: price_xxxxx (kaydet)
```

**3. Unlimited Plan**
```
Name: Unlimited
Price: $49.99 USD (veya ₺499 TRY)
Billing period: Monthly
Price ID: price_xxxxx (kaydet)
```

### Adım 4.4: Webhook Oluştur

Developers → Webhooks → Add endpoint:

```
Endpoint URL: https://subcio-app.up.railway.app/api/payments/webhook

Events to send:
✓ checkout.session.completed
✓ customer.subscription.created
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_succeeded
✓ invoice.payment_failed
```

**Webhook Secret kaydet:** `whsec_xxxxx`

### Adım 4.5: Railway ve Netlify'e Stripe Ekle

**Railway Variables:**
```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Netlify Environment Variables:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

**✅ Stripe yapılandırması tamamlandı!**

---

## 🔧 PHASE 5: Final Configuration

### Adım 5.1: netlify.toml Güncelle

Netlify'daki proxy ayarını güncelle:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://subcio-app.up.railway.app/api/:splat"
  status = 200
  force = true
```

**Bu değişikliği GitHub'a push et:**
```bash
git add netlify.toml
git commit -m "chore: update netlify proxy to production backend"
git push
```

### Adım 5.2: CORS Backend'de Kontrol

Railway environment variables'da:
```env
ALLOWED_ORIGINS=https://subcio.netlify.app
```

### Adım 5.3: Site Yeniden Deploy

Netlify → Deploys → **Trigger deploy**

---

## ✅ PHASE 6: Testing

### Test 1: Backend Health
```bash
curl https://subcio-app.up.railway.app/health
```

### Test 2: Frontend Loading
```bash
https://subcio.netlify.app
# Sayfa yüklenmeli
```

### Test 3: Register & Login
1. Git: https://subcio.netlify.app/register
2. Email ile kayıt ol
3. Login yap

### Test 4: Google OAuth
1. "Continue with Google" tıkla
2. Google hesabı seç
3. Dashboard'a yönlenmeli

### Test 5: GitHub OAuth
1. "Continue with GitHub" tıkla
2. Authorize et
3. Dashboard'a yönlenmeli

### Test 6: Stripe Checkout
1. Pricing page → Pro plan seç
2. Checkout sayfası açılmalı
3. Test kartı kullan: `4242 4242 4242 4242`
4. Ödeme başarılı olmalı

### Test 7: File Upload & Transcription
1. Dashboard → Upload video
2. Transcription başlamalı
3. Editor'de subtitle görmeli
4. Export yapabilmeli

---

## 📊 PHASE 7: Monitoring (Opsiyonel)

### Sentry Error Tracking

1. Git: https://sentry.io
2. Create organization → Add project (FastAPI + React)
3. DSN'i al
4. Railway'e ekle:
   ```env
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

### Uptime Monitoring

1. Git: https://uptimerobot.com
2. Add monitor:
   ```
   Type: HTTPS
   URL: https://subcio-app.up.railway.app/health
   Interval: 5 minutes
   ```

---

## 🎉 Deployment Complete!

**Production URLs:**
- Frontend: `https://subcio.netlify.app`
- Backend API: `https://subcio-app.up.railway.app`
- Health: `https://subcio-app.up.railway.app/health`

**Next Steps:**
- [ ] Custom domain ekle (opsiyonel)
- [ ] Analytics ekle (Google Analytics / Plausible)
- [ ] Error tracking aktive et (Sentry)
- [ ] Backup stratejisi oluştur
- [ ] Documentation güncelle

---

## 🆘 Common Issues

### CORS Error
```
Çözüm: Railway'de ALLOWED_ORIGINS'i kontrol et
```

### OAuth Redirect Error
```
Çözüm: Google/GitHub console'da redirect URI'yi kontrol et
```

### Stripe Webhook Fails
```
Çözüm: Webhook endpoint URL ve secret'ı kontrol et
Railway logs: railway logs --tail
```

### Build Fails (Netlify)
```
Çözüm: Build logs'u kontrol et
Node version 18 olduğundan emin ol
```

---

**İyi şanslar! 🚀**
