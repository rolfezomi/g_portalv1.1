# Glohe Portal - Detaylı Teknik Dokümantasyon

**Son Güncelleme:** 17 Ocak 2025
**Proje:** Glohe Su Kalitesi Kontrol Sistemi (g_portalv1.1)
**Hazırlayan:** Claude AI Asistanı

---

## 📋 İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
2. [Teknik Mimari](#2-teknik-mimari)
3. [Dosya Yapısı](#3-dosya-yapısı)
4. [Veritabanı Şeması](#4-veritabanı-şeması)
5. [Modüller ve Özellikler](#5-modüller-ve-özellikler)
6. [Otomasyon Sistemleri](#6-otomasyon-sistemleri)
7. [Güvenlik ve Rol Yönetimi](#7-güvenlik-ve-rol-yönetimi)
8. [Kodlama Kuralları ve Standartları](#8-kodlama-kuralları-ve-standartları)
9. [Deployment ve CI/CD](#9-deployment-ve-cicd)
10. [Önemli Notlar ve Hatırlatıcılar](#10-önemli-notlar-ve-hatırlatıcılar)

---

## 1. Proje Genel Bakış

### 1.1 Amaç
Glohe Portal, üretim tesisindeki su kalitesi kontrolü için geliştirilmiş kapsamlı bir web uygulamasıdır. 73 kontrol noktasında Klor, Sertlik, pH, İletkenlik, Kazan & Mikser ve Dolum Makinaları ölçümlerini yönetir.

### 1.2 Teknoloji Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Supabase (PostgreSQL)
- **Deployment:** Netlify
- **Email:** Resend API
- **Otomasyon:** Supabase pg_cron + Edge Functions (Deno)
- **Charts:** Chart.js
- **Version Control:** Git / GitHub

### 1.3 Canlı URL
- **Production:** https://glohemeslek-main-su-poralimiz.netlify.app
- **Supabase Project ID:** mignlffeyougoefuyayr
- **GitHub Repository:** rolfezomi/g_portalv1.1

---

## 2. Teknik Mimari

### 2.1 Uygulama Mimarisi

```
┌─────────────────────────────────────────────────────┐
│                   USER BROWSER                       │
│  (HTML + CSS + Vanilla JavaScript - No Framework)   │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTPS
                   │
┌──────────────────▼──────────────────────────────────┐
│              NETLIFY CDN                             │
│  - Static File Hosting                               │
│  - _redirects için SPA routing                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ API Calls
                   │
┌──────────────────▼──────────────────────────────────┐
│          SUPABASE BACKEND                            │
│  ┌────────────────────────────────────────────┐    │
│  │  PostgreSQL Database                        │    │
│  │  - measurements (ana veri tablosu)          │    │
│  │  - users (kullanıcı yönetimi)              │    │
│  │  - system_logs (aktivite logları)          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Edge Functions (Deno Runtime)              │    │
│  │  - send-daily-report                        │    │
│  │  - check-daily-measurement-status           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  pg_cron (Zamanlanmış Görevler)            │    │
│  │  - Saatlik raporlar (09:00-18:00)          │    │
│  │  - Günlük kontroller (12:00, 16:35)        │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  Real-time Subscriptions                    │    │
│  │  - measurements tablosu değişiklikleri      │    │
│  │  - Anında UI güncellemeleri                │    │
│  └────────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTPS POST
                   │
┌──────────────────▼──────────────────────────────────┐
│              RESEND API                              │
│  - E-posta gönderimi (ugur.onar@glohe.com)          │
└─────────────────────────────────────────────────────┘
```

### 2.2 Veri Akışı

#### A) Kullanıcı Veri Girişi
```
1. Kullanıcı login (Supabase Auth)
   ↓
2. Kategori seçimi (Klor, Sertlik, pH, vb.)
   ↓
3. Kontrol noktası seçimi
   ↓
4. Değer girişi + validasyon (client-side)
   ↓
5. Supabase.insert() → measurements tablosu
   ↓
6. Real-time subscription tetiklenir
   ↓
7. Tüm açık tarayıcılarda anında güncelleme
```

#### B) Otomatik Raporlama
```
1. pg_cron zamanı geldiğinde tetiklenir
   ↓
2. pg_net ile Edge Function'a HTTP POST
   ↓
3. Edge Function verileri çeker (son 24 saat)
   ↓
4. HTML email render edilir
   ↓
5. Resend API'ye POST request
   ↓
6. Email gönderimi (ugur.onar@glohe.com)
```

---

## 3. Dosya Yapısı

### 3.1 Root Dizin Yapısı

```
g_portalv1.1/g_portal-main/
│
├── index.html                          # Ana sayfa (4500+ satır)
├── script.js                           # Ana JavaScript dosyası (4600+ satır)
├── styles.css                          # Ana CSS dosyası
├── auth.js                             # Supabase authentication
│
├── exec_dashboard_new.html             # Üst Yönetim Dashboard
├── exec_dashboard_modern.css           # Dashboard özel CSS (600+ satır)
│
├── mikro.html                          # Mikrobiyoloji modülü
│
├── package.json                        # Node.js bağımlılıkları
├── package-lock.json
├── netlify.toml                        # Netlify konfigürasyonu
│
├── README.md                           # Genel proje açıklaması
├── HAFTALIK_GELISMELER_RAPORU.md       # Haftalık geliştirmeler
├── PROJE_TEKNIK_DOKUMANTASYON_2025-01-17.md  # Bu dosya
│
├── assets/                             # Statik dosyalar
│   ├── favicon/
│   │   ├── favicon.ico
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   └── apple-touch-icon.png
│   └── glohe-logo.png
│
├── netlify/
│   └── functions/
│       └── users.js                    # Netlify Functions (deprecated)
│
└── supabase/
    ├── functions/
    │   ├── send-daily-report/
    │   │   └── index.ts                # Saatlik rapor Edge Function
    │   └── check-daily-measurement-status/
    │       └── index.ts                # Günlük kontrol Edge Function
    │
    └── migrations/
        ├── 20250116_daily_report_cron.sql
        ├── 20250116_daily_report_cron_fixed.sql
        ├── 20250118_hourly_weekday_report_cron.sql
        └── 20250119_daily_measurement_check_cron.sql
```

### 3.2 Önemli Dosyalar Detayı

#### 3.2.1 index.html (4500+ satır)
**Sorumluluklar:**
- Tüm kontrol modüllerinin HTML yapısı
- Modal ve form tanımları
- Inline SVG ikonlar
- Chart.js canvas elementleri

**Ana Bölümler:**
- Login ekranı
- Sol menü (sidebar)
- Anasayfa dashboard (KPI kartları, grafikler, Son Aktiviteler)
- Su Analizi modülleri (Klor, Sertlik, pH, İletkenlik)
- Kazan & Mikser
- Dolum Makinaları
- Mikrobiyoloji
- Trend Analizi
- Admin Panel (Kullanıcı Yönetimi, Sistem Logları)
- Üst Yönetim Dashboard

#### 3.2.2 script.js (4600+ satır)
**Sorumluluklar:**
- Supabase client initialization
- Authentication logic
- Tüm CRUD operasyonları
- Real-time subscriptions
- Chart.js konfigürasyonları
- Form validasyonları
- Filtreleme ve arama fonksiyonları
- Export (CSV/Excel) fonksiyonları

**Önemli Fonksiyonlar:**
```javascript
// Authentication
checkAuth()                    // Sayfa yüklendiğinde auth kontrolü
logout()                       // Çıkış işlemi

// Data Operations
loadData(category)             // Kategori bazlı veri yükleme
saveData(data)                 // Yeni ölçüm kaydetme
deleteData(id)                 // Ölçüm silme

// Real-time
setupRealtimeSubscription()    // WebSocket bağlantısı
handleRealtimeUpdate(payload)  // Güncelleme handle etme

// Dashboard
loadDashboard()                // Anasayfa verileri
updateCharts()                 // Grafik güncellemeleri
updateRecentActivity()         // Son aktiviteler tablosu

// Trend Analysis
loadTrendData()                // Trend verilerini çek
generateTrendChart()           // Trend grafiği oluştur
exportTrendData()              // CSV/Excel export

// Admin
loadUsers()                    // Kullanıcı listesi
updateUserRole()               // Rol güncelleme
loadSystemLogs()               // Sistem logları
```

#### 3.2.3 exec_dashboard_modern.css (600+ satır)
**Sorumluluklar:**
- Üst Yönetim Dashboard stil tanımları
- Modern gradient ve animasyonlar
- Responsive grid layouts
- Ultra-modern table styles
- Pulse animations

**Önemli CSS Class'ları:**
```css
.exec-kpi-modern              // KPI kartları
.exec-chart-card-modern       // Grafik konteynerleri
.exec-category-item-modern    // Kategori listeleri
.exec-top-item-modern         // Top 10 listeleri
.exec-table-ultra             // Ultra-modern tablo
.live-indicator               // CANLI badge
.live-dot                     // Pulse animasyonu
```

---

## 4. Veritabanı Şeması

### 4.1 measurements Tablosu (Ana Veri Tablosu)

```sql
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,           -- 'klor', 'sertlik', 'ph', 'iletkenlik', 'kazan-mikser', 'dolum-makinalari'
  point TEXT NOT NULL,               -- Kontrol noktası adı (ör: "Kontrol Noktası 0")
  value NUMERIC,                     -- Ölçüm değeri
  unit TEXT,                         -- Birim (mg/L, µS/cm, vb.)
  date TEXT NOT NULL,                -- YYYY-MM-DD formatında
  time TEXT NOT NULL,                -- HH:MM formatında
  user TEXT,                         -- Kullanıcı email
  note TEXT,                         -- Opsiyonel not
  created_at TIMESTAMP DEFAULT NOW()
);

-- İndeksler (Performans için)
CREATE INDEX idx_measurements_date ON measurements(date);
CREATE INDEX idx_measurements_category ON measurements(category);
CREATE INDEX idx_measurements_point ON measurements(point);
CREATE INDEX idx_measurements_user ON measurements(user);
```

**ÖNEMLİ NOT:**
- `created_at` kolonu YOKTUR! Sadece `date` ve `time` TEXT kolonları kullanılıyor.
- `result` kolonu YOKTUR!
- `control_point` kolonu YOKTUR! Sadece `point` kullanılıyor.

### 4.2 users Tablosu (Kullanıcı Yönetimi)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',         -- 'admin', 'executive', 'user'
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Rol Tanımları:**
- **admin:** Tüm yetkilere sahip, tüm menüleri görür
- **executive:** Üst Yönetim Dashboard erişimi, veri girişi yapamaz
- **user:** Normal kullanıcı, veri girişi yapabilir, trend analizi görür

### 4.3 system_logs Tablosu (Aktivite Logları)

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  action TEXT,                       -- 'login', 'logout', 'insert', 'update', 'delete'
  category TEXT,                     -- Hangi modülde
  details TEXT,                      -- JSON formatında detaylar
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Modüller ve Özellikler

### 5.1 Anasayfa Dashboard

**Dosya:** index.html (satır 1-1500)
**JavaScript:** script.js (satır 1-800)

**Özellikler:**
- 4 KPI Kartı (Toplam Ölçüm, Bugün, Bu Hafta, En Çok Kullanılan Nokta)
- Haftalık Özet Grafiği (Chart.js line chart)
- Kategori Dağılımı (Yüzdelik)
- En Çok Kontrol Edilen 10 Nokta
- Son Aktiviteler Tablosu (Ultra-modern tasarım)
- CANLI göstergesi (pulse animation)

**KPI Hesaplamaları:**
```javascript
// Toplam Ölçüm
SELECT COUNT(*) FROM measurements

// Bugünkü Ölçümler
SELECT COUNT(*) FROM measurements WHERE date = TODAY

// Bu Haftaki Ölçümler
SELECT COUNT(*) FROM measurements WHERE date >= THIS_WEEK_START

// En Çok Kullanılan Nokta
SELECT point, COUNT(*) as count
FROM measurements
GROUP BY point
ORDER BY count DESC
LIMIT 1
```

### 5.2 Su Analizi Modülleri

#### A) Klor (7 kontrol noktası)
- Kontrol Noktası 0-4
- IBC Kontrol Noktası
- Kaynamış Su Kontrol Noktası

**Validasyon:**
- Değer aralığı: 0-10 mg/L
- Hedef: 1-3 mg/L (yeşil)
- Düşük: < 1 mg/L (sarı)
- Yüksek: > 3 mg/L (kırmızı)

#### B) Sertlik (17 kontrol noktası)
- Kontrol Noktası 0-14
- IBC Kontrol Noktası
- Kaynamış Su Kontrol Noktası

**Validasyon:**
- Değer aralığı: 0-500 mg/L CaCO3
- Hedef: 50-150 mg/L

#### C) pH (17 kontrol noktası)
- Kontrol Noktası 0-14
- IBC Kontrol Noktası
- Kaynamış Su Kontrol Noktası

**Validasyon:**
- Değer aralığı: 0-14
- Hedef: 6.5-8.5
- Decimal precision: 2 hane

#### D) İletkenlik (17 kontrol noktası)
- Kontrol Noktası 0-14
- IBC Kontrol Noktası
- Kaynamış Su Kontrol Noktası

**Validasyon:**
- Değer aralığı: 0-2000 µS/cm
- Hedef: < 500 µS/cm

### 5.3 Kazan & Mikser (17 nokta)

**Dosya:** index.html (satır 2500-2800)
**JavaScript:** script.js (satır 2000-2300)

**Kontrol Noktaları:**
- 1010 / 3 Tonluk Mikser
- 1011 / 7 Tonluk Mikser
- 1012 / 1 Tonluk Mikser
- 1013 / 0.5 Tonluk Mikser
- 1014-1024 / Kazanlar (10 adet)
- 1025 / IBC Tankları için Mikser

**Test Tipleri:**
- pH
- İletkenlik
- Mikrobiyolojik Analiz
- Kimyasal Analiz

**Decimal Kuralları:**
```javascript
if (testType === 'ph') {
  value = parseFloat(value).toFixed(2)  // 2 hane
} else if (testType === 'iletkenlik') {
  value = Math.round(value)              // Tam sayı
}
```

### 5.4 Dolum Makinaları (2 makina)

**Dosya:** index.html (satır 2800-3100)
**JavaScript:** script.js (satır 2300-2600)

**Makinalar:**
1. **1029 / ALTILI LİKİT DOLUM VE KAPAMA MAKİNASI**
   - 6 nozul (Nozul 1-6)

2. **1148 / ROLL-ON DOLUM VE KAPAMA MAKİNASI**
   - 10 nozul (Nozul 1-10)

**Özellikler:**
- Nozul bazlı veri girişi
- Makina bazlı trend analizi
- Arama ve filtreleme
- Geçmiş kayıt görüntüleme

### 5.5 Mikrobiyoloji Modülü

**Dosya:** mikro.html
**JavaScript:** Embedded in mikro.html

**Testler:**
- Toplam Koloni Sayısı
- E. coli
- Koliform
- Salmonella
- Listeria

**Not:** Bu modül henüz tam entegre edilmemiş, placeholder olarak duruyor.

### 5.6 Trend Analizi

**Dosya:** index.html (satır 3500-3800)
**JavaScript:** script.js (satır 3000-3400)

**Özellikler:**
- Kategori seçimi (Tümü dahil)
- Kontrol noktası filtreleme
- Tarih aralığı seçimi
- Hızlı filtreler (Son 7 gün, 30 gün, 90 gün)
- İstatistik kartları:
  - Minimum değer
  - Maximum değer
  - Ortalama
  - Standart sapma
  - Ortalama karşılaştırma (Tümü kategorisi için)
- Line chart (Chart.js)
- CSV/Excel export

**Export Formatı:**
```csv
Tarih,Saat,Kategori,Kontrol Noktası,Değer,Birim,Kullanıcı
2025-01-17,10:30,Klor,Kontrol Noktası 0,2.5,mg/L,ugur.onar@glohe.com
```

### 5.7 Admin Panel

#### A) Kullanıcı Yönetimi

**Dosya:** index.html (satır 3800-4000)
**JavaScript:** script.js (satır 3400-3600)

**Özellikler:**
- Kullanıcı listesi (kart bazlı, mobil uyumlu)
- Rol değiştirme (admin, executive, user)
- Son giriş saati takibi
- Email ve isim bilgileri

**Rol Değiştirme:**
```javascript
async updateUserRole(email, newRole) {
  await supabase
    .from('users')
    .update({ role: newRole })
    .eq('email', email)
}
```

#### B) Sistem Logları

**Dosya:** index.html (satır 4000-4200)
**JavaScript:** script.js (satır 3600-3800)

**Özellikler:**
- Filtreleme sistemi (Kullanıcı, Aksiyon, Kategori, Tarih)
- Görsel kategorilendirme (renk kodları)
- Liste görünümü (tablo değil)
- Sayfalama (100 kayıt/sayfa)

**Log Tipleri:**
- 🔵 Login
- 🟢 Insert
- 🟡 Update
- 🔴 Delete
- ⚫ Logout

### 5.8 Üst Yönetim Dashboard

**Dosya:** exec_dashboard_new.html
**CSS:** exec_dashboard_modern.css
**JavaScript:** Embedded in exec_dashboard_new.html

**Özellikler:**
- 3 KPI Kartı (Toplam Ölçüm, Bugün, Bu Hafta)
- Haftalık Performans Grafiği (7 günlük trend)
- Kategori Dağılımı (yüzdelik)
- En Çok Kontrol Edilen 10 Nokta
- Real-time veri güncellemeleri
- Tam ekran (kiosk) modu (F11)
- ESC ile çıkış
- Son güncelleme zamanı

**Tam Ekran Modu:**
```javascript
// F11 ile tam ekran
document.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault()
    toggleFullscreen()
  }
})

// ESC ile çıkış
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.fullscreenElement) {
    exitFullscreen()
  }
})
```

---

## 6. Otomasyon Sistemleri

### 6.1 Saatlik Su Kalitesi Raporları

**Edge Function:** supabase/functions/send-daily-report/index.ts (549 satır)
**Cron Job:** supabase/migrations/20250118_hourly_weekday_report_cron.sql
**Schedule:** Hafta içi her saat başı (09:00-18:00 Turkish time = 06:00-15:00 UTC)

**Cron Expression:**
```sql
'0 6-15 * * 1-5'  -- Her saat başı, 06:00-15:00 UTC, Pazartesi-Cuma
```

**Çalışma Akışı:**
1. pg_cron zamanı geldiğinde tetiklenir
2. pg_net ile Edge Function'a HTTP POST:
   ```sql
   SELECT net.http_post(
     url:='https://mignlffeyougoefuyayr.supabase.co/functions/v1/send-daily-report',
     headers:='{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
   )
   ```
3. Edge Function son 24 saatteki tüm ölçümleri çeker:
   ```typescript
   const { data: measurements } = await supabase
     .from('measurements')
     .select('category, point, value, unit, date, time')
     .gte('date', yesterday)
     .order('date', { ascending: false })
     .order('time', { ascending: false })
   ```
4. HTML email render edilir (responsive design)
5. Resend API'ye gönderilir:
   ```typescript
   await fetch('https://api.resend.com/emails', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${RESEND_API_KEY}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       from: 'Glohe Portal <onboarding@resend.dev>',
       to: [RECIPIENT_EMAIL],
       subject: 'Su Kalitesi Raporu - ' + new Date().toLocaleDateString('tr-TR'),
       html: emailHTML
     })
   })
   ```

**Email İçeriği:**
- Header (gradient mavi)
- Özet istatistikler (toplam ölçüm, kategori sayısı)
- Kategori bazlı son ölçümler tablosu
- İletişim bilgileri (ugur.onar@glohe.com)
- Footer (tarih/saat)

**ÖNEMLI NOTLAR:**
- Veritabanında `created_at`, `result`, `control_point` kolonları YOKTUR!
- Sadece `date`, `time`, `point`, `value`, `unit`, `category`, `user` kolonları kullanılır
- Timezone: Turkish Time (UTC+3)

### 6.2 Günlük Ölçüm Kontrol Sistemi

**Edge Function:** supabase/functions/check-daily-measurement-status/index.ts (549 satır)
**Cron Job:** supabase/migrations/20250119_daily_measurement_check_cron.sql
**Schedule:** Her gün 12:00 ve 16:35 (Turkish time)

**Cron Expressions:**
```sql
-- Öğle raporu (12:00 Turkish = 09:00 UTC)
'0 9 * * 1-5'

-- Öğleden sonra raporu (16:35 Turkish = 13:35 UTC)
'35 13 * * 1-5'
```

**Kontrol Edilen Noktalar:**
```typescript
const ALL_CONTROL_POINTS = {
  'Klor': [
    'Kontrol Noktası 0', 'Kontrol Noktası 1', 'Kontrol Noktası 2',
    'Kontrol Noktası 3', 'Kontrol Noktası 4', 'IBC Kontrol Noktası',
    'Kaynamış Su Kontrol Noktası'
  ],  // 7 nokta

  'Sertlik': [
    'Kontrol Noktası 0', ..., 'Kontrol Noktası 14',
    'IBC Kontrol Noktası', 'Kaynamış Su Kontrol Noktası'
  ],  // 17 nokta

  'Ph': [...],  // 17 nokta

  'İletkenlik': [...],  // 17 nokta

  'Kazan & Mikser': [
    '1010 / 3 Tonluk Mikser', '1011 / 7 Tonluk Mikser', ...,
    '1025 / IBC Tankları için Mikser'
  ],  // 17 nokta

  'Dolum Makinaları': [
    '1029 / ALTILI LİKİT DOLUM VE KAPAMA MAKİNASI',
    '1148 / ROLL-ON DOLUM VE KAPAMA MAKİNASI'
  ]  // 2 nokta (16 nozul)
}

// TOPLAM: 73 kontrol noktası
```

**Çalışma Akışı:**
1. pg_cron zamanı geldiğinde tetiklenir
2. Edge Function bugünün tarihini alır:
   ```typescript
   const now = new Date()
   now.setHours(now.getHours() + 3)  // UTC+3 Turkish time
   const today = now.toISOString().split('T')[0]  // YYYY-MM-DD
   ```
3. Bugünkü tüm ölçümleri çeker:
   ```typescript
   const { data: measurements } = await supabase
     .from('measurements')
     .select('category, point, date, time, value')
     .eq('date', today)
   ```
4. Her kategori için tamamlanan/eksik noktaları belirler:
   ```typescript
   for (const [category, points] of Object.entries(ALL_CONTROL_POINTS)) {
     const completed = points.filter(point =>
       measurements.some(m =>
         m.category.toLowerCase() === categoryMap[category] &&
         m.point === point
       )
     )

     const missing = points.filter(point => !completed.includes(point))
   }
   ```
5. Minimalist HTML email render edilir
6. Resend API'ye gönderilir

**Email İçeriği:**
- Header (yeşil, sade)
- İstatistik kartları:
  - 📊 Toplam Nokta: 73
  - ✅ Tamamlanan: X
  - ⚠️ Eksik: Y
  - 📈 Tamamlanma: Z%
- Kategori bazlı detaylar:
  - ✅ Tamamlanan noktalar listesi
  - ⚠️ Eksik kalan noktalar listesi
- İletişim bilgileri
- Footer

**Design Kuralları:**
- Minimalist ve profesyonel
- Renkli gradientler yok
- Sade başlıklar (emoji yok)
- Table-based layout (email client uyumluluğu)
- Subtle shadow ve border-radius

---

## 7. Güvenlik ve Rol Yönetimi

### 7.1 Authentication (Supabase Auth)

**Dosya:** auth.js

**Login Akışı:**
```javascript
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  // Session storage'a kaydet
  localStorage.setItem('supabase.auth.token', data.session.access_token)

  // Kullanıcı bilgilerini al
  const user = await getUserProfile(email)

  // Rol bazlı yönlendirme
  if (user.role === 'executive') {
    window.location.href = '/exec_dashboard_new.html'
  } else {
    window.location.href = '/index.html'
  }
}
```

**Session Kontrolü:**
```javascript
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    window.location.href = '/login.html'
    return
  }

  // Kullanıcı rolünü kontrol et
  const user = await getUserProfile(session.user.email)

  // Sayfa erişim kontrolü
  if (currentPage === 'exec_dashboard' && user.role !== 'executive' && user.role !== 'admin') {
    alert('Bu sayfaya erişim yetkiniz yok!')
    window.location.href = '/index.html'
  }
}
```

### 7.2 Rol Bazlı Erişim Kontrolü (RBAC)

**Roller:**

| Rol | Erişim Yetkileri |
|-----|-----------------|
| **admin** | - Tüm menüler <br> - Veri girişi ✅ <br> - Trend analizi ✅ <br> - Admin panel ✅ <br> - Üst Yönetim Dashboard ✅ <br> - Kullanıcı yönetimi ✅ |
| **executive** | - Üst Yönetim Dashboard ✅ <br> - Veri girişi ❌ <br> - Trend analizi ❌ <br> - Admin panel ❌ |
| **user** | - Anasayfa ✅ <br> - Veri girişi ✅ <br> - Trend analizi ✅ <br> - Admin panel ❌ <br> - Üst Yönetim Dashboard ❌ |

**Menü Görünürlük Kontrolü:**
```javascript
function showExecutiveMenu() {
  const userRole = currentUser.role

  if (userRole === 'admin') {
    // Admin tüm menüleri görür
    document.querySelectorAll('.menu-item').forEach(item => {
      item.style.display = 'block'
    })
  } else if (userRole === 'executive') {
    // Executive sadece dashboard görür
    document.querySelectorAll('.menu-item').forEach(item => {
      item.style.display = 'none'
    })
    document.querySelector('.menu-item[data-page="exec-dashboard"]').style.display = 'block'
  } else {
    // User admin panel görmez
    document.querySelector('.menu-item[data-page="admin"]').style.display = 'none'
  }
}
```

### 7.3 Güvenlik Önlemleri

**1. API Key Yönetimi:**
```javascript
// ❌ YANLIŞ: Hardcoded keys
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// ✅ DOĞRU: Environment variables
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
```

**2. Service Role Key:**
- Migration dosyalarında `YOUR_SUPABASE_SERVICE_ROLE_KEY` placeholder kullanılır
- Gerçek key Supabase dashboard'dan alınır ve manuel replace edilir
- Git'e commit edilmez

**3. Row Level Security (RLS):**
```sql
-- measurements tablosu için RLS
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "measurements_select" ON measurements
  FOR SELECT USING (true);

-- Sadece authenticated kullanıcılar yazabilir
CREATE POLICY "measurements_insert" ON measurements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Sadece kendi kayıtlarını güncelleyebilir
CREATE POLICY "measurements_update" ON measurements
  FOR UPDATE USING (user = auth.email());
```

**4. Input Validation:**
```javascript
function validateInput(category, value) {
  // Client-side validation
  if (category === 'klor') {
    if (value < 0 || value > 10) {
      alert('Klor değeri 0-10 arasında olmalıdır!')
      return false
    }
  }

  // XSS prevention
  value = DOMPurify.sanitize(value)

  return true
}
```

---

## 8. Kodlama Kuralları ve Standartları

### 8.1 Genel Kurallar

**1. Dosya Yapısı:**
- Tek HTML dosyası (index.html) - 4500+ satır
- Tek JavaScript dosyası (script.js) - 4600+ satır
- Modüler CSS dosyaları (styles.css, exec_dashboard_modern.css)
- No bundler, no build process
- Vanilla JavaScript (No React, Vue, Angular)

**2. Naming Conventions:**
```javascript
// camelCase for variables and functions
const userEmail = 'ugur.onar@glohe.com'
function loadDashboard() { }

// PascalCase for classes (nadiren kullanılır)
class DataManager { }

// kebab-case for CSS classes
.menu-item-active { }

// SCREAMING_SNAKE_CASE for constants
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://...'
```

**3. Fonksiyon İsimlendirme:**
```javascript
// ✅ DOĞRU: Fiil ile başlayan anlamlı isimler
loadData()
saveData()
updateChart()
deleteRecord()
checkAuth()

// ❌ YANLIŞ: Belirsiz isimler
data()
handle()
process()
do()
```

**4. Yorum Satırları:**
```javascript
// Tek satır yorumlar için //

/*
  Çok satırlı yorumlar için
  bu format kullanılır
*/

/**
 * JSDoc formatı (fonksiyon dokümantasyonu)
 * @param {string} email - Kullanıcı email adresi
 * @param {string} role - Kullanıcı rolü (admin/executive/user)
 * @returns {Promise<Object>} Kullanıcı objesi
 */
async function getUserProfile(email, role) { }
```

### 8.2 JavaScript Standartları

**1. Async/Await Kullanımı:**
```javascript
// ✅ DOĞRU: Modern async/await
async function loadData() {
  try {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error:', err)
    alert('Veri yüklenirken hata oluştu!')
  }
}

// ❌ YANLIŞ: Callback hell
function loadData(callback) {
  supabase.from('measurements').select('*').then(result => {
    if (result.error) {
      callback(result.error, null)
    } else {
      callback(null, result.data)
    }
  })
}
```

**2. Error Handling:**
```javascript
// ✅ DOĞRU: Try-catch ve kullanıcı dostu mesajlar
async function saveData(data) {
  try {
    const { error } = await supabase
      .from('measurements')
      .insert(data)

    if (error) throw error

    alert('✅ Veri başarıyla kaydedildi!')
    loadData()  // Refresh
  } catch (err) {
    console.error('Save error:', err)
    alert('❌ Veri kaydedilirken hata oluştu: ' + err.message)
  }
}
```

**3. Data Validation:**
```javascript
// Client-side validation her zaman yapılmalı
function validateMeasurement(category, value) {
  // Null/undefined kontrolü
  if (!value || value === '') {
    return { valid: false, message: 'Lütfen bir değer girin!' }
  }

  // Tip kontrolü
  const numValue = parseFloat(value)
  if (isNaN(numValue)) {
    return { valid: false, message: 'Geçersiz sayı formatı!' }
  }

  // Aralık kontrolü
  const ranges = {
    'klor': { min: 0, max: 10 },
    'ph': { min: 0, max: 14 },
    'sertlik': { min: 0, max: 500 },
    'iletkenlik': { min: 0, max: 2000 }
  }

  const range = ranges[category]
  if (numValue < range.min || numValue > range.max) {
    return {
      valid: false,
      message: `Değer ${range.min}-${range.max} arasında olmalıdır!`
    }
  }

  return { valid: true }
}
```

**4. Real-time Subscription:**
```javascript
// Subscription setup (sayfa yüklendiğinde bir kez)
function setupRealtimeSubscription() {
  const subscription = supabase
    .channel('measurements-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'measurements' },
      (payload) => {
        console.log('Real-time update:', payload)
        handleRealtimeUpdate(payload)
      }
    )
    .subscribe()

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    subscription.unsubscribe()
  })
}

// Update handler
function handleRealtimeUpdate(payload) {
  if (payload.eventType === 'INSERT') {
    // Yeni kayıt eklendi, UI'ı güncelle
    addRowToTable(payload.new)
    updateKPICards()
    updateChart()
  } else if (payload.eventType === 'DELETE') {
    // Kayıt silindi
    removeRowFromTable(payload.old.id)
    updateKPICards()
  }
}
```

### 8.3 CSS Standartları

**1. CSS Class İsimlendirme (BEM-benzeri):**
```css
/* Block */
.menu { }

/* Element */
.menu-item { }
.menu-item-icon { }
.menu-item-text { }

/* Modifier */
.menu-item--active { }
.menu-item--disabled { }

/* State */
.menu-item.is-active { }
.menu-item.is-loading { }
```

**2. CSS Değişkenler (Custom Properties):**
```css
:root {
  /* Colors */
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;

  /* Typography */
  --font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-base: 14px;
  --font-size-small: 12px;
  --font-size-large: 18px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

**3. Responsive Design:**
```css
/* Mobile First Approach */

/* Base styles (mobile) */
.container {
  padding: 16px;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
}

/* Large Desktop */
@media (min-width: 1400px) {
  .container {
    max-width: 1400px;
  }
}
```

**4. Animations:**
```css
/* Smooth transitions */
.button {
  transition: all 0.3s ease;
}

/* Keyframe animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

.live-dot {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Performance tip: Use transform instead of top/left */
/* ✅ DOĞRU */
.slide-in {
  transform: translateX(100%);
  transition: transform 0.3s ease;
}
.slide-in.active {
  transform: translateX(0);
}

/* ❌ YANLIŞ (daha yavaş) */
.slide-in {
  right: -100%;
  transition: right 0.3s ease;
}
.slide-in.active {
  right: 0;
}
```

### 8.4 HTML Standartları

**1. Semantic HTML:**
```html
<!-- ✅ DOĞRU: Semantic tags kullan -->
<header></header>
<nav></nav>
<main>
  <section></section>
  <article></article>
</main>
<aside></aside>
<footer></footer>

<!-- ❌ YANLIŞ: Her şey div -->
<div class="header"></div>
<div class="nav"></div>
<div class="main"></div>
```

**2. Accessibility (a11y):**
```html
<!-- Alt text for images -->
<img src="logo.png" alt="Glohe Logo">

<!-- ARIA labels for icons -->
<button aria-label="Menüyü kapat">
  <svg>...</svg>
</button>

<!-- Form labels -->
<label for="email">Email:</label>
<input type="email" id="email" name="email" required>

<!-- Semantic table structure -->
<table>
  <thead>
    <tr>
      <th scope="col">Tarih</th>
      <th scope="col">Değer</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2025-01-17</td>
      <td>2.5 mg/L</td>
    </tr>
  </tbody>
</table>
```

**3. Form Best Practices:**
```html
<form id="measurement-form">
  <!-- Required field -->
  <input type="number" name="value" required min="0" max="10" step="0.1">

  <!-- Select with default option -->
  <select name="category" required>
    <option value="">Seçiniz...</option>
    <option value="klor">Klor</option>
    <option value="ph">pH</option>
  </select>

  <!-- Textarea with character limit -->
  <textarea name="note" maxlength="500" placeholder="Opsiyonel not..."></textarea>

  <!-- Submit button -->
  <button type="submit">Kaydet</button>
</form>
```

---

## 9. Deployment ve CI/CD

### 9.1 Netlify Konfigürasyonu

**Dosya:** netlify.toml

```toml
[build]
  publish = "g_portal-main"
  functions = "g_portal-main/netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Özellikler:**
- Static site hosting
- SPA (Single Page Application) routing
- Auto-deploy on git push
- HTTPS by default
- CDN caching

### 9.2 Deployment Süreci

**Manuel Deployment:**
```bash
# 1. Git commit
git add .
git commit -m "Feature: Yeni özellik eklendi"

# 2. Git push
git push origin main

# 3. Netlify otomatik deploy eder (1-2 dakika)
```

**Netlify Build Log:**
```
9:00 AM: Deploy request from GitHub (branch: main)
9:01 AM: Building site...
9:02 AM: Deploy published!
```

### 9.3 Supabase Deployment

**Edge Functions:**
```bash
# Supabase CLI kurulumu (ilk defa)
npm install -g supabase

# Project link (ilk defa)
supabase link --project-ref mignlffeyougoefuyayr

# Edge Function deploy
supabase functions deploy send-daily-report
supabase functions deploy check-daily-measurement-status
```

**Database Migrations:**
```bash
# Migration dosyası oluştur
supabase migration new migration_name

# SQL'i yaz
# supabase/migrations/20250117_migration_name.sql

# Apply migration
supabase db push

# VEYA Supabase Dashboard'dan SQL Editor'de manuel çalıştır
```

### 9.4 Environment Variables

**Netlify Environment Variables:**
```
VITE_SUPABASE_URL=https://mignlffeyougoefuyayr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Supabase Secrets (Edge Functions):**
```bash
# Secret ekle
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set RECIPIENT_EMAIL=ugur.onar@glohe.com

# Secrets listele
supabase secrets list
```

**Kod içinde kullanım:**
```typescript
// Edge Function içinde
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RECIPIENT_EMAIL = Deno.env.get('RECIPIENT_EMAIL')
```

---

## 10. Önemli Notlar ve Hatırlatıcılar

### 10.1 Veritabanı Kolonu MUTLAKA BİL!

**❌ Bu kolonlar YOKTUR:**
- `created_at` (timestamp) - Kullanma!
- `result` - Kullanma!
- `control_point` - Kullanma!

**✅ Kullanılması gereken kolonlar:**
```sql
-- measurements tablosu
id          UUID
category    TEXT      -- 'klor', 'sertlik', 'ph', 'iletkenlik', 'kazan-mikser', 'dolum-makinalari'
point       TEXT      -- Kontrol noktası adı
value       NUMERIC   -- Ölçüm değeri
unit        TEXT      -- Birim
date        TEXT      -- YYYY-MM-DD formatında
time        TEXT      -- HH:MM formatında
user        TEXT      -- Email
note        TEXT      -- Opsiyonel
```

**Doğru kullanım:**
```typescript
// ✅ DOĞRU
const { data } = await supabase
  .from('measurements')
  .select('category, point, value, unit, date, time, user, note')
  .eq('date', '2025-01-17')

// ❌ YANLIŞ (hata verir!)
const { data } = await supabase
  .from('measurements')
  .select('*')
  .eq('created_at', '2025-01-17')  // created_at yok!
```

### 10.2 Timezone Hesaplaması

**Turkish Time = UTC+3**

```javascript
// ❌ YANLIŞ: Direkt new Date() kullanımı (UTC verir)
const now = new Date()
const today = now.toISOString().split('T')[0]  // UTC tarihi

// ✅ DOĞRU: UTC+3 ekleme
const now = new Date()
now.setHours(now.getHours() + 3)  // Turkish time
const today = now.toISOString().split('T')[0]  // Turkish tarihi
```

**Cron Job Timezone:**
```sql
-- Turkish 12:00 = UTC 09:00
'0 9 * * 1-5'

-- Turkish 16:35 = UTC 13:35
'35 13 * * 1-5'

-- Turkish 09:00-18:00 = UTC 06:00-15:00
'0 6-15 * * 1-5'
```

### 10.3 Service Role Key Güvenliği

**ASLA yapma:**
```javascript
// ❌ YANLIŞ: Hardcoded service role key
const supabase = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIs...')
```

**✅ Doğru yaklaşım:**
```sql
-- Migration dosyasında placeholder
headers:='{"Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'

-- Deploy ederken manuel değiştir
-- Ya da Supabase Dashboard'dan SQL Editor'de değiştir
```

**Service role key sadece:**
- Edge Functions içinde (environment variable olarak)
- pg_cron jobs içinde (manuel replace edilmiş)
- Server-side işlemlerde

**Asla:**
- Client-side JavaScript'te
- Git'e commit edilmemeli
- Public olarak paylaşılmamalı

### 10.4 Real-time Subscription

**Önemli:**
- Sayfa yüklendiğinde bir kez setup edilmeli
- Sayfa kapatılınca unsubscribe edilmeli
- Her update'te tüm sayfayı reload etme!

```javascript
// ✅ DOĞRU: Sadece gerekli kısmı güncelle
function handleRealtimeUpdate(payload) {
  if (payload.eventType === 'INSERT') {
    addRowToTable(payload.new)  // Sadece yeni satırı ekle
    updateKPICard('total', +1)  // Sadece KPI'ı artır
  }
}

// ❌ YANLIŞ: Her güncellemede tüm veriyi yeniden yükle
function handleRealtimeUpdate(payload) {
  loadAllData()  // Gereksiz, yavaş!
}
```

### 10.5 Chart.js Performance

**Büyük veri setleri için:**
```javascript
// Veri setini sınırla
const limitedData = data.slice(0, 100)  // Son 100 kayıt

// Animasyonu devre dışı bırak
const chartConfig = {
  animation: {
    duration: 0  // Animasyon yok
  },
  responsive: true,
  maintainAspectRatio: false
}

// Chart'ı destroy et ve yeniden oluştur (güncelleme yerine)
if (existingChart) {
  existingChart.destroy()
}
const newChart = new Chart(ctx, chartConfig)
```

### 10.6 Email HTML Best Practices

**Email client uyumluluğu için:**
```html
<!-- ✅ DOĞRU: Table-based layout -->
<table role="presentation" style="width: 100%;">
  <tr>
    <td style="padding: 20px;">Content</td>
  </tr>
</table>

<!-- ❌ YANLIŞ: Flexbox (bazı email clientlerde çalışmaz) -->
<div style="display: flex;">Content</div>

<!-- ✅ DOĞRU: Inline styles -->
<p style="color: #333; font-size: 14px;">Text</p>

<!-- ❌ YANLIŞ: CSS class (email clientlerde desteklenmez) -->
<p class="text-gray">Text</p>
```

### 10.7 Validasyon Kuralları

**Kategori bazlı validasyon:**
```javascript
const VALIDATION_RULES = {
  'klor': {
    min: 0,
    max: 10,
    unit: 'mg/L',
    decimal: 1,
    target: { min: 1, max: 3 }
  },
  'ph': {
    min: 0,
    max: 14,
    unit: '',
    decimal: 2,
    target: { min: 6.5, max: 8.5 }
  },
  'sertlik': {
    min: 0,
    max: 500,
    unit: 'mg/L CaCO3',
    decimal: 0,
    target: { min: 50, max: 150 }
  },
  'iletkenlik': {
    min: 0,
    max: 2000,
    unit: 'µS/cm',
    decimal: 0,
    target: { min: 0, max: 500 }
  }
}

function validateValue(category, value) {
  const rule = VALIDATION_RULES[category]
  const numValue = parseFloat(value)

  if (numValue < rule.min || numValue > rule.max) {
    return {
      valid: false,
      message: `Değer ${rule.min}-${rule.max} ${rule.unit} arasında olmalıdır!`
    }
  }

  // Decimal kontrolü
  const rounded = numValue.toFixed(rule.decimal)
  if (parseFloat(rounded) !== numValue) {
    return {
      valid: false,
      message: `Değer en fazla ${rule.decimal} ondalık basamak içerebilir!`
    }
  }

  return { valid: true, value: rounded, unit: rule.unit }
}
```

### 10.8 Commit Message Standartları

**Format:**
```
<type>: <subject>

<body> (opsiyonel)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `Feature:` Yeni özellik
- `Fix:` Bug düzeltme
- `Improve:` İyileştirme
- `Refactor:` Kod refactoring
- `Design:` UI/UX değişiklikleri
- `MAJOR:` Büyük değişiklik
- `Security:` Güvenlik güncellemesi

**Örnekler:**
```
Feature: Dolum Makinaları modülü eklendi

Fix: Son Aktiviteler tablosu header-data alignment düzeltildi

Improve: Dashboard layout optimizasyonu

Security: Remove exposed service role keys from migration files
```

### 10.9 Test Checklist

**Yeni özellik eklerken kontrol et:**

- [ ] Desktop'ta çalışıyor mu?
- [ ] Mobil'de çalışıyor mu? (responsive)
- [ ] Tablet'te çalışıyor mu?
- [ ] Farklı tarayıcılarda test edildi mi? (Chrome, Firefox, Safari)
- [ ] Real-time subscription çalışıyor mu?
- [ ] Validasyonlar doğru çalışıyor mu?
- [ ] Error handling var mı?
- [ ] Loading state var mı?
- [ ] Accessibility düşünüldü mü? (alt text, aria-label, vb.)
- [ ] Console'da error var mı?
- [ ] Network tab'de failed request var mı?
- [ ] Git commit message standardına uygun mu?

### 10.10 Acil Durum Komutları

**Supabase Edge Function Logları:**
```bash
# Function loglarını görüntüle
supabase functions logs send-daily-report

# Canlı log takibi
supabase functions logs send-daily-report --tail
```

**PostgreSQL Cron Job Kontrolü:**
```sql
-- Tüm cron jobları listele
SELECT * FROM cron.job;

-- Cron job geçmişi
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Belirli bir job'ı sil
SELECT cron.unschedule('hourly-weekday-water-quality-report');

-- Yeni job ekle
SELECT cron.schedule(
  'job-name',
  '0 9 * * 1-5',
  $$SELECT net.http_post(...)$$
);
```

**Netlify Deploy Rollback:**
```
1. Netlify Dashboard > Deploys
2. Eski deploy'u seç
3. "Publish deploy" butonuna tıkla
```

**Supabase Database Reset (DIKKAT: Tüm veriyi siler!):**
```bash
# ASLA production'da kullanma!
supabase db reset
```

---

## 📞 İletişim ve Destek

**Proje Sahibi:** Uğur Onar
**Email:** ugur.onar@glohe.com
**GitHub:** rolfezomi/g_portalv1.1
**Supabase Project:** mignlffeyougoefuyayr
**Netlify Site:** glohemeslek-main-su-poralimiz.netlify.app

---

## 📝 Değişiklik Geçmişi

**17 Ocak 2025:**
- İlk dokümantasyon oluşturuldu
- Tüm modüller ve özellikler detaylandırıldı
- Veritabanı şeması ve kurallar belirlendi
- Kodlama standartları tanımlandı
- Otomasyon sistemleri dokümante edildi

---

**NOT:** Bu dokümantasyon, projeyi sıfırdan anlayabilmek ve yeni özellikleri doğru şekilde ekleyebilmek için tüm gerekli bilgileri içerir. Yeni bir AI asistanı veya geliştirici bu dokümanı okuyarak projeye hızlıca adapte olabilir.
