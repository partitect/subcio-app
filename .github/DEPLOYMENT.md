# 🚀 Subcio Deployment Guide

Bu döküman, Subcio uygulamasını production ortamına deploy etmek için adım adım kılavuz içerir.

---

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Maliyet Karşılaştırması](#maliyet-karşılaştırması)
3. [Backend Deployment (Railway)](#backend-deployment-railway)
4. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
5. [OAuth Yapılandırması](#oauth-yapılandırması)
6. [Stripe Yapılandırması](#stripe-yapılandırması)
7. [Domain & SSL](#domain--ssl)
8. [Monitoring & Logging](#monitoring--logging)

---

## 🔧 Gereksinimler

### Hesaplar (Ücretsiz Tier Mevcut)
- [x] GitHub hesabı
- [ ] [Railway.app](https://railway.app) hesabı (backend)
- [ ] [Netlify](https://netlify.com) veya [Vercel](https://vercel.com) hesabı (frontend)
- [ ] [Google Cloud Console](https://console.cloud.google.com) (OAuth)
- [ ] [GitHub Developer Settings](https://github.com/settings/developers) (OAuth)
- [ ] [Stripe Dashboard](https://dashboard.stripe.com) (ödeme)

---

## 💰 Maliyet Karşılaştırması

### Backend Hosting Seçenekleri

| Platform | Ücretsiz Tier | Ücretli | PostgreSQL | Önerilen |
|----------|---------------|---------|------------|----------|
| **Railway** | $5 kredi/ay | $5-20/ay | ✅ Dahil | ⭐ En iyi |
| **Render** | 750 saat/ay | $7/ay | ✅ Ayrı | İyi |
| **Fly.io** | 3 VM/ay | $5-15/ay | ✅ Ayrı | Orta |
| **Heroku** | ❌ Yok | $7-25/ay | ✅ Ayrı | Pahalı |

### Frontend Hosting Seçenekleri

| Platform | Ücretsiz Tier | Ücretli | Bandwidth | Önerilen |
|----------|---------------|---------|-----------|----------|
| **Netlify** | 100GB/ay | $19/ay | Sınırsız | ⭐ En iyi |
| **Vercel** | 100GB/ay | $20/ay | Sınırsız | İyi |
| **Cloudflare Pages** | Sınırsız | $20/ay | Sınırsız | Hızlı |

### Tahmini Toplam Maliyet

| Kullanım | Aylık Maliyet |
|----------|---------------|
| Başlangıç (düşük trafik) | **$0** (ücretsiz tier) |
| Orta (1000 kullanıcı) | **$10-15/ay** |
| Yüksek (10000+ kullanıcı) | **$50-100/ay** |

---

## 🚂 Backend Deployment (Railway)

### Adım 1: Railway'e Kaydol
1. [railway.app](https://railway.app) adresine git
2. GitHub ile giriş yap

### Adım 2: Yeni Proje Oluştur
```bash
# Railway CLI kurulumu (opsiyonel)
npm install -g @railway/cli
railway login
```

### Adım 3: GitHub Repo Bağla
1. Railway Dashboard → "New Project"
2. "Deploy from GitHub repo"
3. `partitect/subcio-app` seç

### Adım 4: PostgreSQL Ekle
1. Proje içinde "New" → "Database" → "PostgreSQL"
2. Otomatik olarak `DATABASE_URL` eklenir

### Adım 5: Environment Variables
Railway Dashboard → Variables sekmesinde ekle:

```env
# Zorunlu
JWT_SECRET_KEY=<32+ karakter rastgele string>
FRONTEND_URL=https://your-app.netlify.app
ALLOWED_ORIGINS=https://your-app.netlify.app

# OAuth (Google)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# OAuth (GitHub)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# OpenAI (transkripsiyon için)
OPENAI_API_KEY=sk-xxx

# Opsiyonel
APP_ENV=production
LOG_LEVEL=INFO
RATE_LIMIT_ENABLED=true
```

### Adım 6: Deploy
Railway otomatik deploy eder. URL alırsın:
`https://subcio-api-production.up.railway.app`

### Adım 7: Health Check
```bash
curl https://subcio-api-production.up.railway.app/health
# {"status": "healthy", "version": "1.0.0", "service": "subcio-api"}
```

---

## 🌐 Frontend Deployment (Netlify)

### Adım 1: Netlify'a Kaydol
1. [netlify.com](https://netlify.com) adresine git
2. GitHub ile giriş yap

### Adım 2: Yeni Site Oluştur
1. "Add new site" → "Import an existing project"
2. GitHub → `partitect/subcio-app` seç

### Adım 3: Build Ayarları
```
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

### Adım 4: Environment Variables
Netlify Dashboard → Site settings → Environment variables:

```env
VITE_API_URL=https://subcio-api-production.up.railway.app/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Adım 5: Deploy Trigger
"Deploy site" butonuna tıkla

### Adım 6: Custom Domain (Opsiyonel)
1. Domain settings → Add custom domain
2. DNS ayarlarını yap (CNAME veya A record)

---

## 🔐 OAuth Yapılandırması

### Google OAuth Setup

1. [Google Cloud Console](https://console.cloud.google.com) git
2. Yeni proje oluştur: "Subcio"
3. APIs & Services → Credentials → Create Credentials → OAuth client ID
4. Application type: "Web application"
5. Ayarlar:
   ```
   Authorized JavaScript origins:
   - https://your-app.netlify.app
   - https://subcio.com (varsa)
   
   Authorized redirect URIs:
   - https://your-backend.railway.app/api/auth/google/callback
   ```
6. Client ID ve Secret'ı kaydet

### GitHub OAuth Setup

1. [GitHub Developer Settings](https://github.com/settings/developers) git
2. OAuth Apps → New OAuth App
3. Ayarlar:
   ```
   Application name: Subcio
   Homepage URL: https://your-app.netlify.app
   Authorization callback URL: https://your-backend.railway.app/api/auth/github/callback
   ```
4. Client ID ve Secret'ı kaydet

---

## 💳 Stripe Yapılandırması

### Adım 1: Stripe Hesabı
1. [Stripe Dashboard](https://dashboard.stripe.com) git
2. Hesap oluştur ve doğrula

### Adım 2: API Keys
Dashboard → Developers → API keys:
- `Publishable key`: Frontend için
- `Secret key`: Backend için

### Adım 3: Products & Prices
Products → Add product:

```
1. Starter Plan
   - Price: $9.99/month (veya TRY)
   - Billing: Monthly recurring
   
2. Pro Plan
   - Price: $19.99/month
   - Billing: Monthly recurring
   
3. Unlimited Plan
   - Price: $49.99/month
   - Billing: Monthly recurring
```

Her price için `price_xxx` ID'sini al ve backend'e ekle.

### Adım 4: Webhook
Developers → Webhooks → Add endpoint:
```
Endpoint URL: https://your-backend.railway.app/api/payments/webhook
Events:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

Webhook secret'ı (`whsec_xxx`) kaydet.

---

## 🌍 Domain & SSL

### Custom Domain (Opsiyonel)

#### Netlify (Frontend)
1. Domain settings → Add custom domain
2. DNS provider'da ekle:
   ```
   CNAME: www → your-site.netlify.app
   A: @ → 75.2.60.5
   ```

#### Railway (Backend - API)
1. Settings → Domains → Add custom domain
2. DNS provider'da ekle:
   ```
   CNAME: api → your-project.up.railway.app
   ```

### SSL
- Netlify: Otomatik Let's Encrypt
- Railway: Otomatik Let's Encrypt
- Vercel: Otomatik Let's Encrypt

---

## 📊 Monitoring & Logging

### Railway Logs
```bash
railway logs
# veya Dashboard → Deployments → Logs
```

### Netlify Logs
Dashboard → Functions → Logs

### Önerilen Monitoring Araçları

| Araç | Amaç | Ücretsiz |
|------|------|----------|
| [Sentry](https://sentry.io) | Error tracking | ✅ 5K events/ay |
| [Logtail](https://logtail.com) | Log aggregation | ✅ 1GB/ay |
| [UptimeRobot](https://uptimerobot.com) | Uptime monitoring | ✅ 50 monitor |
| [Plausible](https://plausible.io) | Analytics | $9/ay |

---

## ✅ Deployment Checklist

### Pre-deployment
- [ ] Tüm testler geçiyor
- [ ] Environment variables hazır
- [ ] OAuth credentials alındı
- [ ] Stripe products oluşturuldu
- [ ] `.env` dosyaları `.gitignore`'da

### Backend (Railway)
- [ ] PostgreSQL eklendi
- [ ] Environment variables ayarlandı
- [ ] Health endpoint çalışıyor
- [ ] CORS doğru ayarlandı
- [ ] Stripe webhook eklendi

### Frontend (Netlify)
- [ ] Build başarılı
- [ ] API URL doğru
- [ ] Redirect rules çalışıyor
- [ ] Custom domain (opsiyonel)

### Post-deployment
- [ ] Login/Register çalışıyor
- [ ] OAuth (Google/GitHub) çalışıyor
- [ ] Stripe checkout çalışıyor
- [ ] Dosya upload çalışıyor
- [ ] Monitoring kuruldu

---

## 🆘 Troubleshooting

### CORS Errors
```
Backend ALLOWED_ORIGINS'e frontend URL'i ekle
```

### OAuth Redirect Mismatch
```
Google/GitHub console'da redirect URI'yi güncelle
```

### Database Connection
```
Railway DATABASE_URL otomatik eklenmeli
postgres:// → postgresql:// dönüşümü kod'da yapılıyor
```

### Build Fails
```bash
# Netlify: Build logs'u kontrol et
# Node version: 18 olmalı
```

---

## 📞 Destek

Sorun yaşarsan:
1. Railway/Netlify logs kontrol et
2. Browser DevTools Network tab
3. GitHub Issues aç

---

*Son güncelleme: Kasım 2025*
