# Glohe Bakım Yönetim Sistemi v2.0

🎉 **Profesyonel, modern ve kapsamlı bakım yönetim platformu**

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Teknoloji Stack](#teknoloji-stack)
- [Kurulum](#kurulum)
- [Mimari](#mimari)
- [Kullanım](#kullanım)
- [API Referansı](#api-referansı)

## ✨ Özellikler

### 🎯 Ana Özellikler
- ✅ **Interactive Dashboard** - Gerçek zamanlı istatistikler ve grafikler
- 📅 **Akıllı Takvim** - FullCalendar ile interaktif bakım takvimi
- 📋 **Dinamik Checklist** - Özelleştirilebilir bakım kontrol listeleri
- 📸 **Fotoğraf Yönetimi** - Drag & drop ile fotoğraf yükleme (Supabase Storage)
- 📊 **Gelişmiş Raporlama** - Excel, PDF ve yazdırma desteği
- 🔍 **Filtreleme ve Sıralama** - Bugün, 7 gün, bu ay, gecikmiş
- ⚡ **Otomatik Takvim Oluşturma** - Haftalık bakımlar günlere dağıtılmış
- 🌙 **Dark Mode** - Göz dostu karanlık tema
- 📱 **Responsive Design** - Tüm cihazlarda mükemmel görünüm
- 🔒 **Güvenli** - Supabase RLS ile row-level security

### 📈 Dashboard
- Toplam makine/bakım sayıları
- Bekleyen ve gecikmiş bakım uyarıları
- Aylık bakım dağılım grafiği
- Bakım durumu pie chart
- Makine kategori dağılımı
- Frekans analizi

### 📅 Takvim
- Aylık/haftalık/günlük görünümler
- Yıl seçici
- Renk kodlu durumlar
- Tıklanabilir etkinlikler
- Excel export

### 📋 Bekleyen Bakımlar
- Bugün, 7 gün, bu ay filtreleri
- Gecikmiş öncelik sıralaması
- Durum badge'leri
- Hızlı başlat butonu

### 🛠️ Bakım Formu
- Makine seçimi
- Dinamik checklist
- 2 fotoğrafa kadar yükleme
- Notlar alanı
- Otomatik kullanıcı kaydı

### 📊 Raporlar
- Tarih aralığı filtresi
- Excel export (XLSX)
- PDF export
- Yazdırma desteği
- CSV export

## 🔧 Teknoloji Stack

### Frontend
- **Vanilla JavaScript** - Modern ES6+ syntax
- **FullCalendar.js v6** - Interactive calendar
- **Chart.js v4** - Data visualization
- **SheetJS (XLSX)** - Excel export
- **jsPDF** - PDF generation
- **CSS3** - Custom responsive design

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Storage (photos)
  - Authentication
- **PostgreSQL Functions** - Server-side logic

### CDN Libraries
```html
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- SheetJS -->
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>

<!-- jsPDF -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.7.1/jspdf.plugin.autotable.min.js"></script>

<!-- FullCalendar -->
<script src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"></script>
```

## 🚀 Kurulum

### Adım 1: SQL Migration Çalıştır

Supabase Dashboard'da SQL Editor'ü açın ve `supabase/migrations/20251027_complete_maintenance_system.sql` dosyasını çalıştırın:

```sql
-- 29 yeni makine
-- 3 yeni tablo (maintenance_records, maintenance_calendar, checklist_templates)
-- Indexler ve RLS policies
-- Otomatik takvim fonksiyonları
-- 2025 takvim verisi
```

### Adım 2: Supabase Storage Ayarları

1. Supabase Dashboard > Storage
2. "maintenance-photos" bucket'ı oluşturun
3. Ayarlar:
   - **Public:** No (private)
   - **File size limit:** 5MB
   - **Allowed MIME types:** image/jpeg, image/jpg, image/png, image/gif, image/webp

### Adım 3: Deploy

Dosyalar zaten `g_portal-main/public/maintenance/` klasöründe. Değişiklikleri commit edin:

```bash
git add .
git commit -m "feat: Complete maintenance management system v2.0 with dashboard, calendar, and reporting"
git push
```

## 📁 Mimari

### Klasör Yapısı
```
public/maintenance/
├── assets/
│   ├── css/
│   │   └── main.css                 # Ana CSS
│   └── js/
│       ├── config.js                # Konfigürasyon
│       ├── supabase-client.js       # Supabase wrapper
│       ├── auth.js                  # Authentication
│       ├── app.js                   # Main controller
│       ├── utils/
│       │   ├── date-utils.js        # Tarih işlemleri
│       │   ├── validation.js        # Form validation
│       │   └── export-utils.js      # Excel/PDF export
│       ├── components/
│       │   ├── charts.js            # Chart.js wrapper
│       │   ├── checklist.js         # Dinamik checklist
│       │   └── photo-uploader.js    # Drag & drop uploader
│       └── views/
│           ├── dashboard.js         # Dashboard view
│           ├── calendar.js          # Calendar view
│           ├── pending-tasks.js     # Task list view
│           ├── maintenance-form.js  # Form view
│           └── reports.js           # Reports view
├── index.html                       # Entry point
└── README.md                        # Bu dosya
```

### Database Schema

#### machines
```sql
- id (uuid, PK)
- machine_no (text)
- machine_name (text)
- category (text): ÜK, TD, ÜT, NA
- location (text)
- status (text)
```

#### maintenance_schedules
```sql
- id (uuid, PK)
- machine_id (uuid, FK -> machines)
- maintenance_type (text)
- frequency (text): weekly, monthly, quarterly, semi-annual, annual
- months (text): "{1,4,7,10}"
- description (text)
```

#### maintenance_records ⭐ NEW
```sql
- id (uuid, PK)
- calendar_id (uuid, FK -> maintenance_calendar)
- machine_id (uuid, FK -> machines)
- maintenance_type (text)
- scheduled_date (date)
- completed_date (timestamptz)
- status (text): pending, in_progress, completed, cancelled, overdue
- priority (integer): 0=normal, 1=high, 2=urgent
- performed_by (uuid, FK -> auth.users)
- duration_minutes (integer)
- notes (text)
- checklist_results (jsonb)
- photos (text[])
- materials_used (text)
```

#### maintenance_calendar ⭐ NEW
```sql
- id (uuid, PK)
- schedule_id (uuid, FK -> maintenance_schedules)
- machine_id (uuid, FK -> machines)
- maintenance_type (text)
- frequency (text)
- scheduled_date (date)
- scheduled_time (time)
- year (integer)
- month (integer)
- week (integer): 1-4
- day_of_week (integer): 1=Pzt, 7=Paz
- status (text)
```

#### checklist_templates ⭐ NEW
```sql
- id (uuid, PK)
- name (text)
- description (text)
- maintenance_type (text)
- category (text)
- items (jsonb): [{"id":"1","label":"Kontrol","type":"checkbox","required":true}]
- is_default (boolean)
```

## 📖 Kullanım

### 1. Dashboard
- Sisteme giriş yapıldığında ilk görüntülenen sayfa
- İstatistiklere tıklayarak ilgili view'a geçiş
- Grafikler otomatik yenilenir

### 2. Takvim
- Yıl seçici ile farklı yılları görüntüleyin
- Etkinliklere tıklayın → Detay modalı açılır
- "Bakımı Gerçekleştir" ile form'a geçiş
- Excel indir butonuyla tüm takvimi export edin

### 3. Bekleyen Bakımlar
- Filtreleri kullanarak listeyi daraltın
- Gecikmiş bakımlar kırmızı renkle gösterilir
- "Başlat" butonu ile bakım formuna geçiş

### 4. Bakım Kaydı Oluştur/Düzenle
- Makine ve bakım tipi seçin
- Checklist'i doldurun
- 2'ye kadar fotoğraf yükleyin
- "Kaydet" ile veritabanına kaydedin
- Otomatik olarak kullanıcı bilgisi kaydedilir

### 5. Raporlar
- Tarih aralığı ve durum filtreleri ayarlayın
- "Rapor Oluştur" ile verileri görüntüleyin
- Excel, PDF veya yazdırma seçenekleri

## 🔐 Güvenlik

### Row Level Security (RLS)
Tüm tablolar RLS ile korunur:
```sql
-- Authenticated kullanıcılar tüm kayıtları görebilir/ekleyebilir
CREATE POLICY "Authenticated users can view"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (true);
```

### Authentication
- Supabase Auth ile OAuth/Email
- Auto-logout: 15 dakika inaktivite
- Session yönetimi
- Token refresh

### Photo Storage
- Private bucket
- Authenticated kullanıcılar erişebilir
- 5MB limit
- Sadece image/* MIME types

## 📊 API Referansı

### Supabase Client Methods

```javascript
// Machines
await supabaseClient.getMachines(filters)
await supabaseClient.getMachine(machineId)

// Schedules
await supabaseClient.getMaintenanceSchedules(filters)

// Calendar
await supabaseClient.getCalendarEvents(startDate, endDate, filters)
await supabaseClient.getYearCalendar(year)

// Records
await supabaseClient.getMaintenanceRecords(filters)
await supabaseClient.getPendingMaintenance(filter) // 'today', 'next_7_days', etc.
await supabaseClient.createMaintenanceRecord(record)
await supabaseClient.updateMaintenanceRecord(id, updates)
await supabaseClient.completeMaintenance(id, data)

// Photos
await supabaseClient.uploadPhoto(file, recordId)
await supabaseClient.uploadPhotos(files, recordId)
await supabaseClient.deletePhoto(filePath)

// Stats
await supabaseClient.getDashboardStats()
await supabaseClient.getMonthlyDistribution(year)

// Checklists
await supabaseClient.getChecklistTemplates(filters)
await supabaseClient.getDefaultChecklistTemplate()
```

### Export Utilities

```javascript
// Excel
await ExportUtils.exportMaintenanceRecordsToExcel(records)
await ExportUtils.exportCalendarToExcel(events, year)

// PDF
await ExportUtils.exportMaintenanceRecordsToPDF(records)

// Print
ExportUtils.printMaintenanceRecords(records)

// CSV
ExportUtils.exportToCSV(data, filename)
```

### Date Utilities

```javascript
// Formatting
DateUtils.formatDate(date)           // "30.10.2025"
DateUtils.formatDateTime(date)       // "30.10.2025 14:30"
DateUtils.formatTime(time)           // "14:30"
DateUtils.relativeTime(date)         // "2 gün önce"

// Checks
DateUtils.isToday(date)
DateUtils.isFuture(date)
DateUtils.isPast(date)
DateUtils.isWithinDays(date, days)

// Calculations
DateUtils.daysDifference(date1, date2)
DateUtils.addDays(date, days)
DateUtils.getWeekOfMonth(date)      // 1-4
DateUtils.getDayOfWeek(date)        // 1-7 (Pzt-Paz)
```

## 🎨 Özelleştirme

### Renkler (config.js)
```javascript
CHART_COLORS: {
  PRIMARY: '#667eea',
  SECONDARY: '#764ba2',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444'
}
```

### Status Durumları
```javascript
STATUS: {
  SCHEDULED: { value: 'scheduled', label: 'Planlandı', color: '#3b82f6' },
  PENDING: { value: 'pending', label: 'Bekliyor', color: '#eab308' },
  // ...
}
```

### Fotoğraf Ayarları
```javascript
PHOTO_UPLOAD: {
  MAX_FILES: 2,
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif']
}
```

## 🐛 Sorun Giderme

### Supabase Bağlantı Hatası
- config.js'de SUPABASE_URL ve ANON_KEY'i kontrol edin
- Network tab'da 401/403 hataları varsa token yenileyin

### Fotoğraf Yüklenemiyor
- Supabase Storage bucket'ının oluşturulduğundan emin olun
- Bucket adının "maintenance-photos" olduğunu kontrol edin
- RLS policies'in doğru ayarlandığını kontrol edin

### Takvim Görünmüyor
- FullCalendar CDN'inin yüklendiğini kontrol edin
- Console'da JavaScript hataları var mı kontrol edin
- getYearCalendar() fonksiyonunun veri döndürdüğünü kontrol edin

## 📝 Changelog

### v2.0.0 (2025-10-27)
- ✨ Complete system rebuild
- ✅ Dashboard with real-time stats and charts
- ✅ Interactive FullCalendar
- ✅ Dynamic checklist component
- ✅ Photo upload with Supabase Storage
- ✅ Excel/PDF export
- ✅ 29 new machines added
- ✅ 3 new database tables
- ✅ Automatic calendar generation
- ✅ Dark mode support
- ✅ Responsive design

## 👥 Katkıda Bulunma

Bu proje Glohe şirketi için özel olarak geliştirilmiştir.

## 📄 Lisans

Proprietary - © 2025 Glohe

## 🙏 Teşekkürler

- **Supabase** - Harika BaaS platform
- **FullCalendar** - Mükemmel takvim kütüphanesi
- **Chart.js** - Güzel grafikler
- **SheetJS** - Excel export

---

**Glohe Bakım Yönetim Sistemi v2.0** - Built with ❤️ by Claude
