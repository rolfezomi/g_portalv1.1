# 📧 Supabase Günlük Mail Raporu Kurulum Rehberi

Bu rehber, günlük su kalitesi raporlarının **Supabase Edge Functions** ve **pg_cron** ile otomatik olarak gönderilmesi için gerekli adımları içerir.

## 🎯 Avantajlar

✅ Supabase dashboard'dan tam kontrol
✅ Supabase Pro lisansı ile ücretsiz (2M invocations/ay)
✅ Deno runtime (modern ve güvenli)
✅ pg_cron ile native PostgreSQL zamanlama
✅ Resend entegrasyonu (profesyonel email)
✅ **YENİ:** Tüm N/A sorunları düzeltildi
✅ **YENİ:** Mobile-responsive tasarım
✅ **YENİ:** Gelişmiş hata yönetimi ve logging

---

## 📋 Gereksinimler

- ✅ Supabase Pro Lisansı (mevcut)
- ✅ Resend API Key (ücretsiz plan yeterli - 3000 email/ay)
- ✅ Supabase CLI kurulu

---

## 🚀 Adım 1: Resend API Key Oluşturma

### 1.1. Resend Hesabı Aç
1. [resend.com](https://resend.com) adresine git
2. GitHub veya email ile ücretsiz hesap oluştur
3. Free plan'de **3,000 email/ay** ücretsiz

### 1.2. API Key Oluştur
1. Dashboard'a giriş yap
2. Sol menüden **API Keys** sekmesine tıkla
3. **Create API Key** butonuna bas
4. İsim ver (örn: "Glohe Portal Daily Report")
5. **Sending access** yetkisi ver
6. **Create** butonuna bas
7. API key'i kopyala ve güvenli bir yere kaydet (bir daha gösterilmez!)

**Örnek API Key formatı:** `re_123abc456def789ghi012jkl345mno678`

### 1.3. Domain Doğrulama (Opsiyonel - Üretim için)
- Test için **onboarding@resend.dev** domain'i kullanılabilir
- Üretim için kendi domain'inizi doğrulatmanız önerilir:
  1. **Domains** sekmesine git
  2. Domain'inizi ekle (örn: gloheportal.com)
  3. DNS kayıtlarını ayarla (SPF, DKIM)
  4. Doğrulama tamamlanınca `from: 'Glohe Portal <noreply@gloheportal.com>'` kullanın

---

## 🔧 Adım 2: Supabase CLI Kurulumu

### 2.1. Supabase CLI'yi Yükle

**Windows (PowerShell):**
```powershell
scoop install supabase
```

**macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**NPM (tüm platformlar):**
```bash
npm install -g supabase
```

### 2.2. Supabase'e Login
```bash
supabase login
```
- Tarayıcı açılacak, Supabase hesabınıza login olun
- CLI token'ı otomatik kaydedilecek

### 2.3. Proje Linkle
```bash
cd g_portal-main
supabase link --project-ref YOUR_PROJECT_REF
```

**Project Ref Nerede?**
- Supabase dashboard → Settings → General → Reference ID
- Veya URL'den: `https://YOUR_PROJECT_REF.supabase.co`

---

## 🌐 Adım 3: Edge Function Deploy

### 3.1. Secrets Tanımla

Supabase dashboard'dan veya CLI ile secrets ekle:

```bash
# Resend API Key
supabase secrets set RESEND_API_KEY=re_your_resend_api_key_here

# Alıcı email adresi
supabase secrets set RECIPIENT_EMAIL=your-email@company.com
```

**Veya Dashboard'dan:**
1. Supabase Dashboard → Project Settings → Edge Functions
2. **Secrets** sekmesine git
3. Her bir secret'i manuel ekle:
   - `RESEND_API_KEY`: Resend API key'iniz
   - `RECIPIENT_EMAIL`: Raporun gönderileceği email

### 3.2. Edge Function Deploy Et

```bash
supabase functions deploy send-daily-report
```

**Başarılı deployment çıktısı:**
```
Deploying function send-daily-report...
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-report
```

### 3.3. Manuel Test

Edge Function'ı test et:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-report \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Başarılı yanıt:**
```json
{
  "success": true,
  "message": "Günlük rapor başarıyla gönderildi!",
  "stats": {
    "todayCount": 42,
    "monthCount": 850,
    "emailId": "abc123..."
  }
}
```

Email'inizi kontrol edin - rapor gelmiş olmalı! 📧

---

## ⏰ Adım 4: Otomatik Zamanlama (pg_cron)

### 4.1. Migration Dosyasını Güncelle

`supabase/migrations/20250116_daily_report_cron.sql` dosyasını aç ve düzenle:

```sql
-- Satır 18'i proje referansınızla güncelle:
url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-report',
```

**YOUR_PROJECT_REF** yerine kendi proje referansınızı yazın!

### 4.2. Migration Çalıştır

**Supabase CLI ile:**
```bash
supabase db push
```

**Veya Dashboard'dan:**
1. Supabase Dashboard → SQL Editor
2. Migration dosyasının içeriğini kopyala-yapıştır
3. **Run** butonuna bas
4. Proje referansını güncellemeyi unutma!

### 4.3. Cron Job'ı Doğrula

SQL Editor'de çalıştır:

```sql
-- Aktif cron job'ları listele
SELECT * FROM cron.job;

-- Son çalışmaları göster
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-water-quality-report')
ORDER BY start_time DESC
LIMIT 10;
```

**Beklenen çıktı:**
| jobid | schedule  | command           | jobname                      |
|-------|-----------|-------------------|------------------------------|
| 1     | 0 6 * * * | SELECT net.http.. | daily-water-quality-report   |

---

## 🕐 Zamanlama Özelleştirme

Cron expression'ı değiştirerek farklı saatlerde çalıştırabilirsiniz:

| Cron Expression | UTC Saat | Türkiye Saati | Açıklama |
|----------------|----------|---------------|----------|
| `0 6 * * *`    | 06:00    | 09:00         | **Varsayılan** - Her gün sabah 9 |
| `0 7 * * *`    | 07:00    | 10:00         | Her gün sabah 10 |
| `0 8 * * *`    | 08:00    | 11:00         | Her gün sabah 11 |
| `30 5 * * *`   | 05:30    | 08:30         | Her gün sabah 8:30 |
| `0 15 * * *`   | 15:00    | 18:00         | Her gün akşam 6 |
| `0 6 * * 1`    | 06:00    | 09:00         | **Sadece Pazartesi** sabah 9 |
| `0 6 1 * *`    | 06:00    | 09:00         | **Her ayın 1'i** sabah 9 |

**Değişiklik için:**
```sql
SELECT cron.unschedule('daily-water-quality-report');

SELECT cron.schedule(
  'daily-water-quality-report',
  '0 7 * * *',  -- YENİ SAAT (UTC 07:00 = TR 10:00)
  $$ ... $$
);
```

---

## 🧪 Test Senaryoları

### Test 1: Manuel Edge Function Çağrısı
```bash
supabase functions invoke send-daily-report
```

### Test 2: Dashboard'dan Test
1. Supabase Dashboard → Edge Functions
2. `send-daily-report` fonksiyonunu seç
3. **Invoke** butonuna bas
4. Email'inizi kontrol et

### Test 3: Cron Job Manuel Tetikleme
```sql
-- Cron job'ı hemen çalıştır (zamanlanmış saatten bağımsız)
SELECT cron.schedule('test-daily-report', '* * * * *',
  $$
    SELECT net.http_post(...);  -- Kopyala migration'dan
  $$
);

-- 1 dakika sonra sil
SELECT cron.unschedule('test-daily-report');
```

---

## 🎨 Son Güncellemeler (v2.0)

### ✨ Düzeltilen Sorunlar

#### 1. **N/A Verileri Sorunu Çözüldü**
- ✅ Null/undefined kontrolü tüm veri noktalarında eklendi
- ✅ `point` ve `control_point` alan isimleri destekleniyor
- ✅ `date` ve `created_at` tarih formatları otomatik handle ediliyor
- ✅ Boş veya geçersiz veriler otomatik filtreleniyor

#### 2. **Tasarım İyileştirmeleri**
- ✅ Mobile-responsive email template
- ✅ Daha büyük ve okunabilir fontlar
- ✅ Geliştirilmiş renk paleti ve kontrast
- ✅ Türkçe kategori isimleri (Klor, pH, Sertlik, vb.)
- ✅ Gradient KPI kartları
- ✅ Renkli Top 5 sıralaması

#### 3. **Veri Güvenilirliği**
- ✅ Çift tarih kontrolü (date veya created_at)
- ✅ Çift nokta adı kontrolü (point veya control_point)
- ✅ Çift sonuç kontrolü (result veya value)
- ✅ Akıllı sonuç renklendirmesi (uygun/uygun değil otomatik tespit)

#### 4. **Hata Yönetimi**
- ✅ Console logging tüm önemli noktalarda
- ✅ Detaylı error messages
- ✅ Email gönderim başarı/hata takibi
- ✅ TypeScript type safety

### 📊 Yeni Email Template Özellikleri

**KPI Kartları:**
- Bugünkü Ölçümler (trend göstergesi ile)
- Bu Ay Toplam
- Günlük Ortalama (Son 30 gün)

**Kategori Dağılımı:**
- Emoji ikonları ile kategoriler
- Yüzde dağılımları
- Türkçe kategori isimleri

**Top 5 Kontrol Noktaları:**
- Renkli madalya sistemi (🥇🥈🥉)
- Arka plan renklendirmesi
- Ölçüm sayıları

**Son 10 Aktivite:**
- Responsive tablo
- Renkli sonuç badges
- Tarih ve saat formatlaması

---

## 🐛 Sorun Giderme

### ❌ Problem: "RESEND_API_KEY is not defined"
**Çözüm:**
```bash
supabase secrets list  # Mevcut secrets'i kontrol et
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase functions deploy send-daily-report  # Yeniden deploy
```

### ❌ Problem: "Email sending failed"
**Olası sebepler:**
1. **Resend API Key yanlış** → resend.com'da key'i kontrol edin
2. **Email quota doldu** → Dashboard'da kullanım limitlerini kontrol edin
3. **Domain doğrulanmamış** → Test için `onboarding@resend.dev` kullanın

### ❌ Problem: Cron job çalışmıyor
**Kontrol adımları:**
```sql
-- 1. Cron job tanımlı mı?
SELECT * FROM cron.job WHERE jobname = 'daily-water-quality-report';

-- 2. Son çalışma ne zaman?
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- 3. Hata var mı?
SELECT status, return_message FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-water-quality-report')
AND status != 'succeeded'
ORDER BY start_time DESC;
```

### ❌ Problem: Migration hata veriyor
**Çözüm:**
```sql
-- pg_cron extension yüklenmiş mi?
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Yüklenmemişse:
CREATE EXTENSION pg_cron;
```

---

## 📊 Maliyet Analizi

### Supabase Pro Plan ($25/ay)
- ✅ 2M Edge Function invocations/ay
- ✅ Günlük 1 email = ayda ~30 çağrı
- ✅ Fazlasıyla yeterli!

### Resend Free Plan (Ücretsiz)
- ✅ 3,000 email/ay
- ✅ 100 email/gün limit
- ✅ Günlük 1 rapor = ayda 30 email
- ✅ Fazlasıyla yeterli!

**Toplam ek maliyet: $0** (zaten Pro lisansınız var)

---

## 🔐 Güvenlik Notları

1. ✅ **Service Role Key** kullanımına gerek yok - Edge Functions kendi context'i var
2. ✅ **Secrets** Supabase vault'ta şifrelenmiş saklanıyor
3. ✅ **CORS** sadece Supabase domain'inden erişime izin veriyor
4. ✅ **Resend API Key** hiçbir zaman client-side'a maruz kalmıyor

---

## 📈 İzleme ve Raporlama

### Edge Function Logları
```bash
supabase functions logs send-daily-report
```

### Resend Dashboard
1. [resend.com/emails](https://resend.com/emails) → Email geçmişini görüntüle
2. Delivery status, open rates, bounces gibi metrikleri takip et

### Supabase Dashboard
1. Project → Edge Functions → `send-daily-report`
2. Invocations, errors, response times grafikleri

---

## 🎨 Özelleştirme

### Email Tasarımını Değiştir
[supabase/functions/send-daily-report/index.ts](supabase/functions/send-daily-report/index.ts) dosyasını düzenle:

```typescript
// Satır 110-400 arası HTML şablon
const htmlContent = `
  <!DOCTYPE html>
  ... // Kendi HTML tasarımınız
`
```

### Alıcı Listesi Genişlet
```typescript
// Tek alıcı
to: [recipientEmail],

// Birden fazla alıcı
to: [recipientEmail, 'manager@company.com', 'team@company.com'],
```

### Farklı Raporlar Ekle
Haftalık/aylık raporlar için yeni Edge Functions oluştur:
```bash
supabase functions new send-weekly-report
supabase functions new send-monthly-report
```

---

## ✅ Kurulum Tamamlandı!

Artık her gün **saat 09:00'da** (Türkiye saati) otomatik olarak günlük su kalitesi raporu email'inize gelecek! 🎉

**Sorun mu yaşıyorsunuz?**
- Edge Function loglarını kontrol edin: `supabase functions logs send-daily-report`
- Cron job geçmişini kontrol edin: `SELECT * FROM cron.job_run_details`
- Resend dashboard'u kontrol edin: [resend.com/emails](https://resend.com/emails)

---

## 📚 Ek Kaynaklar

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Resend Documentation](https://resend.com/docs)
- [Cron Expression Generator](https://crontab.guru/)
