# Glohe Portal - Su Kalitesi Kontrol Sistemi

**Versiyon:** 1.1
**Son Güncelleme:** 17 Ekim 2025
**Durum:** ✅ Production'da Aktif

---

## 📋 Genel Bakış

Glohe Portal, üretim tesisindeki **73 kontrol noktasında** su kalitesi ölçümlerini yöneten kapsamlı bir web uygulamasıdır. Klor, Sertlik, pH, İletkenlik, Kazan & Mikser ve Dolum Makinaları ölçümlerini gerçek zamanlı olarak takip eder ve otomatik raporlama yapar.

### Temel Özellikler

- ✅ **Gerçek Zamanlı Veri Takibi** - WebSocket ile anlık güncellemeler
- ✅ **Otomatik Raporlama** - Saatlik ve günlük email raporları
- ✅ **Üst Yönetim Dashboard** - Anlık KPI'lar ve grafikler
- ✅ **Trend Analizi** - İstatistiksel veri analizi ve görselleştirme
- ✅ **Mobil Uyumlu** - Tüm cihazlarda sorunsuz çalışır
- ✅ **Rol Tabanlı Erişim** - Admin, Executive ve User rolleri

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 16+ (opsiyonel - sadece development için)
- Supabase hesabı
- Netlify hesabı (deployment için)

### Canlı URL

**Production:** https://glohemeslek-main-su-poralimiz.netlify.app

---

## 📦 Kurulum

### 1. Repository Klonlama

```bash
git clone https://github.com/rolfezomi/g_portalv1.1.git
cd g_portalv1.1/g_portal-main
```

### 2. Supabase CLI Kurulumu

```bash
# Windows (Scoop ile)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase/supabase

# Mac/Linux
brew install supabase/tap/supabase

# Alternatif: npm ile
npm install -g supabase
```

### 3. Project Bağlantısı

```bash
# Access token ile bağlanma
export SUPABASE_ACCESS_TOKEN="your_access_token_here"
supabase link --project-ref mignlffeyougoefuyayr
```

### 4. Edge Functions Deployment

```bash
# Tüm fonksiyonları deploy et
supabase functions deploy send-daily-report
supabase functions deploy check-daily-measurement-status
```

---

## 🏗️ Proje Yapısı

```
g_portal-main/
├── docs/                              # 📚 Dokümantasyon
│   ├── TEKNIK_DOKUMANTASYON.md       # Detaylı teknik doküman
│   ├── HAFTALIK_GELISMELER.md        # Geliştirme raporu
│   └── DEPLOYMENT_2025-10-17.md      # Son deployment notları
│
├── supabase/                          # ☁️ Supabase Backend
│   ├── functions/                     # Edge Functions
│   │   ├── send-daily-report/        # Saatlik rapor
│   │   └── check-daily-measurement-status/  # Günlük kontrol
│   └── migrations/                    # Database migrations
│
├── assets/                            # 🎨 Statik dosyalar
│   └── favicon/                       # Favicon dosyaları
│
├── index.html                         # 🏠 Ana sayfa (4500+ satır)
├── script.js                          # ⚙️ Ana JavaScript (4600+ satır)
├── styles.css                         # 🎨 Ana CSS
├── auth.js                            # 🔐 Authentication
├── exec_dashboard_new.html            # 📊 Yönetim dashboard
├── exec_dashboard_modern.css          # 🎨 Dashboard CSS
├── mikro.html                         # 🦠 Mikrobiyoloji (WIP)
├── netlify.toml                       # ☁️ Netlify config
└── README.md                          # 📖 Bu dosya
```

---

## 🔧 Teknoloji Stack

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Frontend** | Vanilla JavaScript | Framework yok, saf JS |
| **Styling** | CSS3 + Custom Properties | Modern CSS özellikleri |
| **Backend** | Supabase (PostgreSQL) | BaaS, gerçek zamanlı DB |
| **Serverless** | Supabase Edge Functions (Deno) | Otomatik işlemler |
| **Deployment** | Netlify | CDN, auto-deploy |
| **Email** | Resend API | Transactional emails |
| **Cron Jobs** | pg_cron | Zamanlanmış görevler |
| **Charts** | Chart.js | Grafikler |
| **Version Control** | Git + GitHub | Kod yönetimi |

---

## 📊 Modüller

### 1. Anasayfa Dashboard
- 4 KPI kartı (Toplam, Bugün, Bu Hafta, En Çok Kullanılan)
- Haftalık özet grafiği
- Kategori dağılımı
- Son aktiviteler tablosu
- CANLI göstergesi

### 2. Su Analizi Modülleri
- **Klor** - 7 kontrol noktası
- **Sertlik** - 17 kontrol noktası
- **pH** - 17 kontrol noktası
- **İletkenlik** - 17 kontrol noktası

### 3. Kazan & Mikser
- 17 kontrol noktası
- pH, İletkenlik, Mikrobiyolojik ve Kimyasal testler

### 4. Dolum Makinaları
- 2 makina (Altılı Likit, Roll-on)
- 16 nozul takibi

### 5. Trend Analizi
- Tarih aralığı filtreleme
- İstatistik kartları (Min, Max, Avg, StdDev)
- CSV/Excel export
- Grafik görselleştirme

### 6. Admin Panel
- Kullanıcı yönetimi
- Rol değiştirme
- Sistem logları
- Aktivite takibi

### 7. Üst Yönetim Dashboard
- Gerçek zamanlı KPI'lar
- Haftalık performans grafikleri
- Tam ekran (kiosk) modu
- Kategori dağılımı

---

## 🤖 Otomasyon Sistemleri

### Saatlik Su Kalitesi Raporları
- **Schedule:** Hafta içi 09:00-18:00, her saat başı
- **Cron:** `0 6-15 * * 1-5` (UTC)
- **İçerik:** Son 24 saatin tüm ölçümleri
- **Alıcı:** ugur.onar@glohe.com

### Günlük Ölçüm Kontrol Raporları
- **Schedule:** Her gün 12:00 ve 16:35 (Turkish Time)
- **Cron:** `0 9 * * 1-5` ve `35 13 * * 1-5` (UTC)
- **İçerik:** 73 kontrol noktasının tamamlanma durumu
- **Alıcı:** ugur.onar@glohe.com

---

## 🔐 Güvenlik

### Kimlik Doğrulama
- Supabase Auth ile email/password
- Session bazlı oturum yönetimi
- Rol tabanlı erişim kontrolü (RBAC)

### Roller ve Yetkiler

| Rol | Yetkileri |
|-----|-----------|
| **admin** | Tüm erişim + kullanıcı yönetimi |
| **executive** | Sadece yönetim dashboard görüntüleme |
| **user** | Veri girişi + trend analizi |

### Güvenlik Önlemleri
- ✅ Row Level Security (RLS) aktif
- ✅ Service role key backend'de
- ✅ HTTPS zorunlu
- ✅ Input validation
- ✅ XSS koruması

---

## 🌐 Deployment

### Netlify Deployment (Frontend)

```bash
# Otomatik deployment (git push ile)
git add .
git commit -m "Feature: Yeni özellik"
git push origin main

# Netlify otomatik olarak deploy eder (1-2 dakika)
```

### Supabase Deployment (Edge Functions)

```bash
# Fonksiyonları deploy et
export SUPABASE_ACCESS_TOKEN="your_token"
supabase functions deploy send-daily-report
supabase functions deploy check-daily-measurement-status

# Logları kontrol et
supabase functions list
```

### Database Migrations

```bash
# Yeni migration oluştur
supabase migration new migration_name

# Migration'ı uygula
supabase db push

# VEYA Supabase Dashboard'dan SQL Editor'de çalıştır
```

---

## 📚 Dokümantasyon

Detaylı dokümantasyon için `docs/` klasörüne bakın:

- **[TEKNIK_DOKUMANTASYON.md](docs/TEKNIK_DOKUMANTASYON.md)** - Kapsamlı teknik doküman (1700+ satır)
- **[HAFTALIK_GELISMELER.md](docs/HAFTALIK_GELISMELER.md)** - Haftalık geliştirme raporu
- **[DEPLOYMENT_2025-10-17.md](docs/DEPLOYMENT_2025-10-17.md)** - Son deployment notları

---

## 🐛 Bilinen Sorunlar ve Çözümler

### Timezone Sorunu ✅ ÇÖZÜLDÜ (2025-10-17)
Edge Functions UTC timezone kullanıyordu, Turkish Time'a (UTC+3) çevrildi.

### String TypeError ✅ ÇÖZÜLDÜ (2025-10-17)
Email raporlarında tip dönüşüm hatası düzeltildi.

---

## 🚧 Geliştirme Ortamı

### Local Development

```bash
# Frontend'i serve et
python -m http.server 8000
# VEYA
npx serve .

# Tarayıcıda aç
http://localhost:8000
```

### Supabase Local Development

```bash
# Supabase'i local başlat
supabase start

# Edge Functions'ı local test et
supabase functions serve send-daily-report
```

---

## 📈 Performans Metrikleri

| Metrik | Değer |
|--------|-------|
| Sayfa Yükleme | < 2 saniye |
| First Contentful Paint | < 1.5 saniye |
| Real-time Update Latency | < 500ms |
| API Response Time | < 200ms |
| Email Delivery | < 30 saniye |

---

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Feature: Amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

### Commit Message Standartları

```
Feature: Yeni özellik ekleme
Fix: Bug düzeltme
Improve: İyileştirme
Refactor: Kod refactoring
Design: UI/UX değişiklikleri
Security: Güvenlik güncellemesi
MAJOR: Büyük değişiklik
```

---

## 📞 İletişim ve Destek

**Proje Sahibi:** Uğur Onar
**Email:** ugur.onar@glohe.com
**GitHub:** [rolfezomi/g_portalv1.1](https://github.com/rolfezomi/g_portalv1.1)

**Supabase Project ID:** mignlffeyougoefuyayr
**Netlify Site:** glohemeslek-main-su-poralimiz

---

## 📄 Lisans

© 2025 Glohe Portal - Su Kalitesi Kontrol Sistemi
Tüm hakları saklıdır.

---

## 🎯 Changelog

### [v1.1] - 2025-10-17
- ✅ Edge Functions timezone düzeltmeleri (UTC → UTC+3)
- ✅ String type error düzeltmesi
- ✅ Dokümantasyon yeniden organize edildi
- ✅ Deployment guide eklendi

### [v1.0] - 2025-01-17
- ✅ İlk production release
- ✅ Tüm modüller devreye alındı
- ✅ Otomatik raporlama sistemleri
- ✅ Üst yönetim dashboard

---

**Son Güncelleme:** 17 Ekim 2025
**Durum:** ✅ Canlı ve Aktif
