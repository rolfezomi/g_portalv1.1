# GLOHE PORTAL - TEKNİK DOKÜMANTASYON

## PROJE GENEL BİLGİLERİ

**Proje Adı:** Glohe Portal - Su Kalitesi Kontrol Sistemi
**Canlı Site:** https://glohe.netlify.app
**GitHub Repo:** https://github.com/rolfezomi/g_portalv1.1
**Ana Branch:** main
**Deployment Platform:** Netlify
**Backend:** Supabase (PostgreSQL + Auth + Real-time)
**Frontend:** Vanilla JavaScript, HTML, CSS

---

## MİMARİ YAPISI

### 1. DEPLOYMENT MİMARİSİ

```
┌─────────────────────────────────────────────────────────────┐
│                         NETLIFY                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Static Files (HTML, CSS, JS)                         │  │
│  │  - index.html                                          │  │
│  │  - script.js                                           │  │
│  │  - style.css                                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Netlify Functions (Serverless)                       │  │
│  │  - /.netlify/functions/users (GET)                    │  │
│  │  - /.netlify/functions/update-role (POST)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
                    API Calls (HTTPS)
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                   │  │
│  │  - measurements (su kalitesi ölçümleri)               │  │
│  │  - user_roles (kullanıcı yetkileri)                   │  │
│  │  - logs (sistem logları)                               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Supabase Auth                                         │  │
│  │  - Kullanıcı kimlik doğrulama                         │  │
│  │  - JWT token yönetimi                                  │  │
│  │  - Admin listUsers() API                              │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Supabase Edge Functions                              │  │
│  │  - send-daily-report (email gönderimi)                │  │
│  │  - check-daily-measurement-status                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## SUPABASE YAPISI

### Supabase Project Bilgileri
- **Project Ref:** mignlffeyougoefuyayr
- **URL:** https://mignlffeyougoefuyayr.supabase.co
- **Region:** Varsayılan (US East olabilir)

### Environment Variables (Netlify'de Tanımlı)
```env
SUPABASE_URL=https://mignlffeyougoefuyayr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzM4NDUsImV4cCI6MjA3NDcwOTg0NX0.WOvAMx4L3IzovJILgwCG7lRZeHhvOl_n7J1LR5A8SX0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEzMzg0NSwiZXhwIjoyMDc0NzA5ODQ1fQ.HiFKb2UY8VfzDjQHfRrBlcxqznSPQd5K_ea6iQf55Ek
RESEND_API_KEY=re_CMLybm5j_HrqsFZruALwPFYPACRAahjho
RECIPIENT_EMAIL=[email adresi - Supabase secrets'ta]
```

### Database Tabloları

#### 1. measurements
Su kalitesi ölçüm verileri
```sql
Sütunlar:
- id (uuid, primary key)
- created_at (timestamp)
- ph (numeric)
- temperature (numeric)
- turbidity (numeric)
- tds (numeric)
- user_email (text)
```

#### 2. user_roles
Kullanıcı yetki yönetimi
```sql
Sütunlar:
- id (uuid, primary key)
- email (text, unique)
- role (text) -- 'admin', 'executive', 'full', 'restricted'
- created_at (timestamp)
- updated_at (timestamp)
```

**Roller:**
- **admin:** Tüm yetkilere sahip, kullanıcı yönetimi yapabilir
- **executive:** Raporları görebilir, yönetim işlevleri
- **full:** Tüm ölçüm işlemleri yapabilir
- **restricted:** Sadece okuma yetkisi

#### 3. logs
Sistem aktivite kayıtları
```sql
Sütunlar:
- id (uuid, primary key)
- created_at (timestamp)
- user_email (text)
- action (text) -- 'USER_ROLE_UPDATE', 'MEASUREMENT_ADD', vb.
- category (text) -- 'UserManagement', 'Measurement', vb.
- details (jsonb) -- İşlem detayları
```

---

## NETLIFY FUNCTIONS (SERVERLESS API)

### Dosya Konumu
```
g_portal-main/
  netlify/
    functions/
      users.js
      update-role.js
```

### 1. users.js - Kullanıcı Listesi API

**Endpoint:** `GET /.netlify/functions/users`

**Authentication:** Bearer Token (JWT) gerekli

**Akış:**
1. Authorization header'dan JWT token alınır
2. Token Supabase Auth ile doğrulanır
3. Kullanıcının admin yetkisi kontrol edilir (user_roles tablosundan)
4. Admin değilse 403 Forbidden döner
5. Admin ise Supabase Auth Admin API'den tüm kullanıcılar alınır
6. user_roles tablosu ile eşleştirilerek roller eklenir
7. JSON response döndürülür

**Request:**
```javascript
GET /.netlify/functions/users
Headers:
  Authorization: Bearer <JWT_TOKEN>
```

**Response (Success):**
```json
{
  "users": [
    {
      "email": "user@example.com",
      "created_at": "2025-01-15T10:30:00Z",
      "last_sign_in_at": "2025-01-20T08:15:00Z",
      "role": "admin",
      "role_id": "uuid-here"
    }
  ]
}
```

**Response (Error):**
```json
{
  "error": "Yetkilendirme başlığı bulunamadı"
}
```

**Kod Yapısı:**
```javascript
// users.js yapısı:
- getSupabaseAdmin() → Service Role Key ile admin client
- getSupabaseClient() → Anon Key ile normal client
- requireAdmin(token) → Token doğrulama ve admin kontrolü
- exports.handler → Ana function handler
  - OPTIONS request için CORS
  - GET request için kullanıcı listesi
  - Admin kontrolü
  - Supabase Auth Admin API çağrısı
  - user_roles ile birleştirme
```

### 2. update-role.js - Kullanıcı Rolü Güncelleme API

**Endpoint:** `POST /.netlify/functions/update-role`

**Authentication:** Bearer Token (JWT) gerekli

**Akış:**
1. Authorization header'dan JWT token alınır
2. Token Supabase Auth ile doğrulanır
3. Kullanıcının admin yetkisi kontrol edilir
4. Admin değilse 403 Forbidden döner
5. Request body'den email, role, roleId alınır
6. Role validasyonu yapılır (admin, executive, full, restricted)
7. roleId varsa UPDATE, yoksa INSERT yapılır
8. İşlem logs tablosuna kaydedilir

**Request:**
```javascript
POST /.netlify/functions/update-role
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
Body:
{
  "email": "user@example.com",
  "role": "full",
  "roleId": "uuid-here-or-null"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "user@example.com kullanıcısının rolü güncellendi: full"
}
```

**Response (Error):**
```json
{
  "error": "Bu işlem için admin yetkisi gereklidir"
}
```

---

## FRONTEND (SCRIPT.JS)

### API URL Yapılandırması

```javascript
// index.html içinde tanımlı:
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8888/.netlify/functions'
  : '/.netlify/functions';
```

**Önemli:** Production'da (glohe.netlify.app) API_URL = `/.netlify/functions`

### Kullanıcı Yönetimi Fonksiyonları

**1. initUsersPage() - Sayfa başlatma**
```javascript
async function initUsersPage() {
  // 1. Oturum kontrolü
  const { data: session } = await supabaseClient.auth.getSession();

  // 2. Token ile API'ye istek
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${session.session.access_token}`
    }
  });

  // 3. Kullanıcı kartlarını render et
  const { users } = await response.json();
  users.forEach(user => {
    // Her kullanıcı için kart oluştur
    // Role dropdown ekle
  });
}
```

**2. updateUserRoleByEmail() - Rol güncelleme**
```javascript
async function updateUserRoleByEmail(email, existingRoleId) {
  const newRole = document.querySelector(`select[data-email="${email}"]`).value;

  const { data: session } = await supabaseClient.auth.getSession();

  const response = await fetch(`${API_URL}/update-role`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      role: newRole,
      roleId: existingRoleId
    })
  });

  // Başarı mesajı göster
  // Sayfayı yenile
}
```

---

## AUTHENTICATION AKIŞI

### 1. Login Süreci
```
User → Supabase Auth (email/password)
  ↓
JWT Token + Refresh Token
  ↓
LocalStorage'da saklanır
  ↓
Her API çağrısında Authorization header'da gönderilir
```

### 2. Token Doğrulama (Netlify Functions)
```
Client → Bearer Token gönderir
  ↓
Netlify Function → Token'ı alır
  ↓
Supabase Auth → getUser(token)
  ↓
User bilgisi döner
  ↓
user_roles tablosu → User'ın rolü kontrol edilir
  ↓
Admin kontrolü → role === 'admin'
  ↓
İşlem devam eder veya 403 döner
```

### 3. Supabase Client Kullanımı

**Frontend (script.js):**
```javascript
// Anon Key ile - sadece public işlemler
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kullanım:
await supabaseClient.auth.signInWithPassword({ email, password });
await supabaseClient.auth.getSession();
await supabaseClient.from('measurements').select('*');
```

**Backend (Netlify Functions):**
```javascript
// Service Role Key ile - admin işlemleri
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Kullanım:
await supabaseAdmin.auth.admin.listUsers(); // Tüm kullanıcıları listele
await supabaseAdmin.from('user_roles').update(...); // Herhangi bir tabloya yazma
```

---

## DEPLOYMENT SÜRECI

### 1. Netlify Konfigürasyonu (netlify.toml)

```toml
[build]
  # Build komutu
  command = "npm install"
  # Publish edilecek klasör
  publish = "."
  # Functions klasörü
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[dev]
  # Local development
  command = "npx netlify dev"
  port = 8888

# Headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Redirects
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 2. package.json (Ana Dizin)

**ÖNEMLİ:** Sadece `@supabase/supabase-js` bağımlılığı olmalı!

```json
{
  "name": "glohe-portal",
  "version": "1.0.0",
  "description": "Glohe Portal - Su Kalitesi Kontrol Sistemi",
  "main": "api/server.js",
  "scripts": {
    "start": "node api/server.js",
    "dev": "nodemon api/server.js",
    "daily-report": "node scripts/send-daily-report.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.55.1",
    "nodemon": "^3.0.2"
  }
}
```

**NEDEN SADECE SUPABASE?**
- Express, cors, nodemailer gibi paketler eski backend için kullanılıyordu
- Şimdi sadece Netlify Functions kullanıyoruz
- Netlify Functions sadece @supabase/supabase-js'e ihtiyaç duyuyor
- Gereksiz paketler build hatalarına neden oluyordu

### 3. Git Push → Netlify Auto Deploy

```bash
# Değişiklikleri commit et
git add .
git commit -m "Fix: Açıklama"

# GitHub'a push et
git push origin main

# Netlify otomatik deploy başlatır:
# 1. Repo'yu klonlar
# 2. npm install çalıştırır (sadece @supabase/supabase-js yüklenir)
# 3. esbuild ile Functions'ları bundle eder
# 4. Static files'ları publish eder
# 5. Functions'ları deploy eder
# 6. https://glohe.netlify.app canlıya alır
```

### 4. Environment Variables (Netlify Dashboard)

**Site Settings → Environment Variables:**
```
SUPABASE_URL = https://mignlffeyougoefuyayr.supabase.co
SUPABASE_ANON_KEY = eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGci...
RESEND_API_KEY = re_CMLy...
RECIPIENT_EMAIL = [email adresi]
```

**Import Etme:**
1. Site Settings → Environment Variables
2. "Import from .env file" butonu
3. .env dosyasının içeriğini yapıştır
4. "Import variables" tıkla
5. Netlify otomatik redeploy başlatır

---

## SORUN GİDERME

### Sık Karşılaşılan Hatalar

#### 1. "Invalid API key" Hatası
**Neden:** Netlify environment variables eksik veya yanlış
**Çözüm:**
- Netlify Dashboard → Site Settings → Environment variables
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY kontrol et
- Supabase Dashboard'dan doğru değerleri kopyala
- Redeploy et

#### 2. "Failed to upload file: users" Hatası
**Neden:** package.json'da gereksiz bağımlılıklar var
**Çözüm:**
- package.json'da SADECE @supabase/supabase-js olmalı
- express, cors, nodemailer vb. SİL
- git commit + push
- Netlify otomatik deploy edecek

#### 3. "Yetkilendirme başlığı bulunamadı"
**Neden:** Frontend'den token gönderilmiyor
**Çözüm:**
- script.js'de getSession() kontrolü yap
- Authorization header'ı doğru gönder:
  ```javascript
  headers: {
    'Authorization': `Bearer ${session.session.access_token}`
  }
  ```

#### 4. "Bu işlem için admin yetkisi gereklidir"
**Neden:** Kullanıcının user_roles tablosunda 'admin' rolü yok
**Çözüm:**
- Supabase Dashboard → Table Editor → user_roles
- Kullanıcının email'ini bul
- role = 'admin' olarak güncelle

#### 5. Functions 404 Hatası
**Neden:** API_URL yanlış veya Functions deploy olmamış
**Çözüm:**
- Production'da API_URL = `/.netlify/functions` olmalı
- Netlify Dashboard → Functions sekmesi → users ve update-role fonksiyonları var mı kontrol et
- Yoksa redeploy et

---

## EMAIL RAPORLAMA SİSTEMİ

### Supabase Edge Functions

#### 1. send-daily-report
**Konum:** Supabase Edge Functions (Deno runtime)
**Çalışma Zamanı:** Cron job ile otomatik (pg_cron)
**İşlevi:** Günlük su kalitesi raporlarını email ile gönderir

**Kullanılan Servis:** Resend API (https://resend.com)

**Deployment:**
```bash
# Environment variable ayarla (Windows PowerShell)
cmd.exe /c "set SUPABASE_ACCESS_TOKEN=sbp_5912092397fcfa37b5c7474a023f9a6c39de04e5 && C:\Users\Onars\scoop\shims\supabase.exe functions deploy send-daily-report --project-ref mignlffeyougoefuyayr"

# Secret ayarla (Resend API Key)
cmd.exe /c "set SUPABASE_ACCESS_TOKEN=sbp_5912092397fcfa37b5c7474a023f9a6c39de04e5 && C:\Users\Onars\scoop\shims\supabase.exe secrets set RESEND_API_KEY=re_CMLybm5j_HrqsFZruALwPFYPACRAahjho --project-ref mignlffeyougoefuyayr"
```

#### 2. check-daily-measurement-status
**İşlevi:** Günlük ölçüm yapılıp yapılmadığını kontrol eder

---

## PROJE DOSYA YAPISI

```
g_portalv1.1/
├── g_portal-main/
│   ├── index.html           # Ana sayfa (Frontend)
│   ├── script.js            # JavaScript kodu
│   ├── style.css            # CSS stilleri
│   ├── package.json         # Sadece @supabase/supabase-js
│   ├── netlify.toml         # Netlify konfigürasyonu
│   ├── .env                 # Environment variables (local)
│   ├── netlify/
│   │   └── functions/
│   │       ├── users.js            # GET /users API
│   │       └── update-role.js      # POST /update-role API
│   ├── supabase/
│   │   └── functions/
│   │       ├── send-daily-report/
│   │       └── check-daily-measurement-status/
│   └── api/
│       └── server.js        # Eski Express backend (kullanılmıyor)
└── PROJE_DOKUMANTASYONU.md  # Bu dosya
```

---

## GELİŞTİRME ORTAMI

### Local Development

```bash
# 1. Dependencies yükle
npm install

# 2. Netlify Dev başlat
npx netlify dev

# 3. Browser'da aç
http://localhost:8888
```

**Netlify Dev Ne Yapar?**
- Local'de Netlify Functions'ları çalıştırır
- http://localhost:8888/.netlify/functions/users endpoint'i oluşturur
- Production environment'ı simüle eder

### Supabase CLI Kullanımı

**Windows (Scoop ile kurulu):**
```powershell
# Access token ayarla
$env:SUPABASE_ACCESS_TOKEN="sbp_5912092397fcfa37b5c7474a023f9a6c39de04e5"

# Veya cmd.exe ile:
cmd.exe /c "set SUPABASE_ACCESS_TOKEN=sbp_... && supabase.exe [komut]"

# Functions listele
supabase.exe functions list --project-ref mignlffeyougoefuyayr

# Function deploy et
supabase.exe functions deploy send-daily-report --project-ref mignlffeyougoefuyayr
```

---

## ÖNEMLİ NOKTALAR

### 1. ASLA YAPILMAMASI GEREKENLER

❌ package.json'a express, cors, nodemailer ekleme
❌ netlify/functions/ klasörüne ayrı package.json ekleme
❌ Service Role Key'i frontend'de kullanma
❌ .env dosyasını git'e commit etme
❌ Production'da console.log ile debug yapma

### 2. HER ZAMAN YAPILMASI GEREKENLER

✅ package.json'da SADECE @supabase/supabase-js bulundur
✅ Environment variables'ı Netlify Dashboard'dan ayarla
✅ Service Role Key'i sadece Netlify Functions'da kullan
✅ Frontend'den API çağrılarında Bearer token gönder
✅ Git commit'lerden önce .env'yi .gitignore'a ekle
✅ Her deploy sonrası Functions sekmesinden kontrol et

### 3. HABERLEŞİV KURALLARı

1. **Frontend → Netlify Functions:**
   - Authorization: Bearer <JWT_TOKEN> header'ı ZORUNLU
   - Content-Type: application/json (POST isteklerinde)
   - API_URL production'da `/.netlify/functions` olmalı

2. **Netlify Functions → Supabase:**
   - Admin işlemler: SERVICE_ROLE_KEY kullan
   - Token doğrulama: ANON_KEY kullan
   - Auth API: supabaseAdmin.auth.admin.*
   - Database: supabaseAdmin.from('table').*

3. **Token Akışı:**
   ```
   Login → JWT Token (Frontend LocalStorage)
     ↓
   API Call → Authorization Header
     ↓
   Netlify Function → Token Validation (Supabase Auth)
     ↓
   Admin Check → user_roles tablosu
     ↓
   İşlem → Success/Error Response
   ```

---

## GEÇMİŞ SORUNLAR VE ÇÖZÜMLERİ

### Sorun 1: Kullanıcı Yönetimi "Invalid API key" Hatası
**Tarih:** 20 Ocak 2025
**Neden:** Netlify environment variables eksikti
**Çözüm:**
- .env dosyasından Supabase credentials'ları aldık
- Netlify Dashboard → Import from .env ile yükledik
- Redeploy ettik

### Sorun 2: "Failed to upload file: users" Deploy Hatası
**Tarih:** 20 Ocak 2025
**Neden:** package.json'da express, cors vb. gereksiz paketler vardı
**Çözüm:**
- package.json'ı temizledik, sadece @supabase/supabase-js bıraktık
- netlify/functions/package.json'ı sildik
- netlify.toml'u basitleştirdik
- Build command: `npm install`
- Bundler: `esbuild`

### Sorun 3: Netlify CLI "No project id found" Hatası
**Tarih:** 20 Ocak 2025
**Neden:** Netlify link çalıştırılmamıştı
**Çözüm:**
- CLI yerine Netlify Dashboard UI kullandık
- Manual olarak environment variables import ettik

---

## YARDIMCI KOMUTLAR

### Git İşlemleri
```bash
# Status kontrol
git status

# Değişiklikleri stage et
git add .

# Commit et
git commit -m "Fix: Açıklama"

# Push et
git push origin main

# Son commit'leri göster
git log --oneline -10

# Belirli tarihteki commit'e bak
git log --since="2025-01-17" --until="2025-01-18"
```

### Netlify CLI
```bash
# Login
netlify login

# Site link
netlify link

# Environment variables listele
netlify env:list

# Local dev server başlat
netlify dev

# Manual deploy
netlify deploy --prod
```

### Supabase CLI
```bash
# Windows'ta her komut için:
cmd.exe /c "set SUPABASE_ACCESS_TOKEN=sbp_... && supabase.exe [komut]"

# Functions listele
supabase.exe functions list --project-ref mignlffeyougoefuyayr

# Function deploy
supabase.exe functions deploy [function-name] --project-ref mignlffeyougoefuyayr

# Secrets ayarla
supabase.exe secrets set KEY=VALUE --project-ref mignlffeyougoefuyayr

# Secrets listele
supabase.exe secrets list --project-ref mignlffeyougoefuyayr
```

---

## SONUÇ

Bu dokümantasyon, Glohe Portal projesinin tüm teknik detaylarını içermektedir.

**Önemli:** Yeni bir oturumda çalışmaya başlarken bu dokümantasyonu oku ve mevcut durumu anla. Herhangi bir değişiklik yapmadan önce bu kuralları takip et.

**Sorun Çözme Sırası:**
1. Bu dokümantasyonu oku
2. Hata mesajını analiz et
3. "SORUN GİDERME" bölümünü kontrol et
4. Environment variables'ları doğrula
5. package.json'ı kontrol et
6. Netlify build logs'ları incele
7. Çözüm uygula ve test et

---

**Son Güncelleme:** 20 Ocak 2025
**Durum:** Sistem çalışıyor ✅
**Test Edildi:** Kullanıcı yönetimi sayfası başarıyla çalışıyor
