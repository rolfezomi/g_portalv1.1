# 📊 Günlük Mail Raporu Kurulum Rehberi

## 🎯 Özellikler

- ✅ Her gün otomatik mail gönderimi (saat 09:00 Türkiye saati)
- ✅ Profesyonel HTML tasarım
- ✅ KPI kartları (Bugünkü, Bu Ay, Ortalama)
- ✅ Kategori dağılımı
- ✅ Top 5 kontrol noktaları
- ✅ Son 10 aktivite tablosu
- ✅ Mobil uyumlu
- ✅ Ücretsiz (GitHub Actions)

---

## 📋 Kurulum Adımları

### 1. Gmail App Password Oluşturma

1. Google hesabınıza giriş yapın
2. [https://myaccount.google.com/security](https://myaccount.google.com/security) adresine gidin
3. "2-Step Verification" aktif olmalı
4. "App passwords" bölümüne tıklayın
5. "Select app" → "Mail" seçin
6. "Select device" → "Other" seçin, "Glohe Portal" yazın
7. "Generate" butonuna tıklayın
8. Oluşan 16 haneli şifreyi kopyalayın (örnek: `abcd efgh ijkl mnop`)

### 2. GitHub Secrets Ekleme

1. GitHub repository'nize gidin
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Aşağıdaki secret'ları ekleyin:

| Secret Name | Değer | Örnek |
|-------------|-------|-------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1Ni...` |
| `EMAIL_USER` | Gmail adresiniz | `your-email@gmail.com` |
| `EMAIL_APP_PASSWORD` | Gmail app password (16 hane) | `abcdefghijklmnop` |
| `RECIPIENT_EMAIL` | Rapor alacak mail adresi | `recipient@company.com` |

**Önemli:** `EMAIL_APP_PASSWORD` arasında boşluk OLMADAN yazın: `abcdefghijklmnop`

### 3. Dependencies Yükleme

```bash
npm install
```

### 4. Manuel Test (Lokal)

Önce bir `.env` dosyası oluşturun:

```bash
# .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
RECIPIENT_EMAIL=recipient@company.com
```

Sonra test edin:

```bash
npm run daily-report
```

Başarılı olursa konsola şu mesaj gelir:
```
✅ Mail başarıyla gönderildi: <message-id>
📧 Alıcı: recipient@company.com
```

### 5. GitHub Actions Manuel Tetikleme (Test)

1. GitHub repository → **Actions** sekmesi
2. Sol menüden **"Günlük Su Kalitesi Raporu"** workflow'u seçin
3. Sağ üstteki **"Run workflow"** butonuna tıklayın
4. **"Run workflow"** onaylayın
5. Workflow çalışırken log'ları takip edin
6. Mail gelmesi 1-2 dakika sürebilir

---

## 🕒 Zamanlama Ayarları

Varsayılan: Her gün **09:00 Türkiye saati** (06:00 UTC)

Değiştirmek için `.github/workflows/daily-report.yml` dosyasında cron değerini düzenleyin:

```yaml
schedule:
  - cron: '0 6 * * *'  # 09:00 TR
```

**Cron Örnekleri:**
- `0 6 * * *` → Her gün 09:00 TR
- `0 9 * * *` → Her gün 12:00 TR
- `0 6 * * 1-5` → Sadece hafta içi 09:00 TR
- `0 6 1 * *` → Her ayın 1'inde 09:00 TR

Cron syntax test: [crontab.guru](https://crontab.guru)

---

## 📧 Mail Görünümü

Mail içeriği:
- **Header:** Gradient başlık + tarih
- **KPI Cards:** 3 kart (mavi/yeşil/sarı)
- **Kategori Dağılımı:** Icon + yüzde çubukları
- **Top 5 Noktalar:** Renkli sıralama (altın/gümüş/bronz)
- **Son 10 Aktivite:** Profesyonel tablo
- **Footer:** Sistem bilgisi

**Responsive:** Mobilde tek sütun, desktop'ta 3 sütun

---

## 🐛 Sorun Giderme

### Mail gelmiyor
1. GitHub Actions log'larını kontrol edin (Actions sekmesi)
2. Gmail spam/junk klasörüne bakın
3. Gmail App Password doğru mu kontrol edin (16 hane, boşluksuz)
4. Supabase secrets doğru mu kontrol edin

### "Invalid login" hatası
- `EMAIL_APP_PASSWORD` boşluksuz yazılmış mı?
- Gmail'de 2-Step Verification aktif mi?
- App password doğru kopyalandı mı?

### "Supabase error"
- `SUPABASE_URL` doğru mu?
- `SUPABASE_ANON_KEY` doğru mu?
- Supabase'de measurements tablosu var mı?

### Cron çalışmıyor
- GitHub Actions enabled mi?
- Repository public mi? (Private için GitHub Pro gerekebilir)
- Workflow dosyası `.github/workflows/` klasöründe mi?

---

## 🎨 Özelleştirme

### Mail başlığını değiştirme
`scripts/send-daily-report.js` dosyasında:
```javascript
subject: `📊 Günlük Su Kalitesi Raporu - ${reportDate}`
```

### Alıcı sayısını artırma
```javascript
to: 'recipient1@company.com, recipient2@company.com'
```

### Veri filtreleme
```javascript
// Sadece bugünkü verileri göster
const todayMeasurements = measurements.filter(m => m.date === today);
```

---

## 📊 Log'ları Görüntüleme

GitHub → **Actions** → Workflow seçin → Son çalıştırma

Başarılı log örneği:
```
✅ Günlük rapor başarıyla gönderildi!
📊 Günlük rapor hazırlanıyor...
✅ Mail başarıyla gönderildi: <1234567890.12345.1234567890@gmail.com>
📧 Alıcı: recipient@company.com
```

---

## 🚀 İleri Seviye

### Çoklu alıcı (CC/BCC)
```javascript
const mailOptions = {
  from: `"Glohe Portal 📊" <${process.env.EMAIL_USER}>`,
  to: process.env.RECIPIENT_EMAIL,
  cc: 'manager@company.com',
  bcc: 'archive@company.com',
  subject: `📊 Günlük Rapor - ${reportDate}`,
  html: htmlContent
};
```

### PDF ekleme
Nodemailer attachment kullanın:
```javascript
attachments: [{
  filename: 'report.pdf',
  path: '/path/to/report.pdf'
}]
```

### Slack entegrasyonu
Slack webhook kullanarak aynı raporu Slack'e de gönderin.

---

## 📞 Destek

Sorun yaşarsanız:
1. GitHub Issues oluşturun
2. Log screenshot'larını ekleyin
3. `.env` değerlerini (hassas bilgiler olmadan) paylaşın

**Not:** Hassas bilgileri (password, key) asla paylaşmayın!

---

## ✅ Kontrol Listesi

- [ ] Gmail App Password oluşturdunuz
- [ ] GitHub Secrets eklediniz (5 adet)
- [ ] `npm install` çalıştırdınız
- [ ] `.env` dosyası oluşturdunuz (lokal test için)
- [ ] `npm run daily-report` ile test ettiniz
- [ ] Mail geldiğini doğruladınız
- [ ] GitHub Actions'da manuel test yaptınız
- [ ] Cron zamanlamasını ayarladınız
- [ ] Spam/junk klasörünü kontrol ettiniz

**Kurulum tamamlandı! 🎉**
