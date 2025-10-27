# Bakım Yönetim Sistemi - Kullanım Kılavuzu

## 📋 Genel Bakış

Supabase PostgreSQL database'indeki bakım yönetimi verilerini analiz etmek, yönetmek ve raporlamak için kapsamlı CLI araçları.

## 🎯 Özellikler

### ✅ Makine Yönetimi
- Tüm makineleri listele
- Makine detaylarını görüntüle
- Yeni makine ekle
- Makine bilgilerini güncelle
- Makine sil
- Aktif/pasif durumunu değiştir

### ✅ Periyot Yönetimi
- Makineye bakım periyodu ekle (weekly, monthly, quarterly, semi-annual, annual)
- Periyot güncelle
- Periyot sil
- Makinenin tüm periyotlarını haftalık takvim formatında görüntüle

### ✅ Analiz ve Raporlama
- **Haftalık takvim raporu**: Hangi ayın hangi haftasına bakım düşüyor
- **Aylık yoğunluk analizi**: Hangi ayda kaç bakım var
- **İstatistikler**: Toplam makine, schedule, frequency dağılımı
- **Eksik veri raporu**: Periyodu olmayan makineler

### ✅ Import/Export
- JSON import/export
- CSV import/export
- Dry-run mode (önizleme)

## 📦 Dosyalar

### Ana Programlar

1. **`maintenance_manager.py`** - Tam özellikli CLI yönetim aracı
   - İnteraktif menü sistemi
   - CRUD işlemleri
   - Database bağlantısı gerektirir

2. **`offline_analyzer.py`** - Offline analiz aracı
   - `machines_data.json` dosyasından çalışır
   - Database bağlantısı GEREKTIRMEZ
   - Hızlı analiz ve raporlama

### Kütüphaneler

3. **`db_operations.py`** - Database CRUD sınıfı
   - PostgreSQL bağlantı yönetimi
   - Makine ve schedule işlemleri
   - Transaction desteği

4. **`analysis_tools.py`** - Analiz ve hesaplama fonksiyonları
   - Haftalık takvim hesaplama
   - Aylık yoğunluk analizi
   - İstatistik raporları

5. **`export_import.py`** - Import/Export işlemleri
   - JSON, CSV formatları
   - Veri doğrulama
   - Dry-run desteği

## 🚀 Hızlı Başlangıç

### Yöntem 1: Offline Analiz (ÖNERİLEN)

Database bağlantısı gerektirmez, mevcut JSON dosyasını kullanır:

```bash
cd scripts
python offline_analyzer.py
```

**Menü Seçenekleri:**
```
1) Tüm makinelerin haftalık takvimini göster
2) Belirli bir makineyi göster
3) İstatistikler
4) Aylık yoğunluk analizi
```

**Örnek Kullanım:**
```bash
# İstatistikleri göster
python offline_analyzer.py
> Seçiminiz: 3

# Belirli makineyi göster
python offline_analyzer.py
> Seçiminiz: 2
> Makine No: TD-1010
```

### Yöntem 2: Tam Yönetim Aracı

Database bağlantısı gerektirir:

```bash
cd scripts
python maintenance_manager.py
```

**Ana Menü:**
```
[1] MAKİNE YÖNETİMİ
    1.1 Tüm makineleri listele
    1.2 Makine ara/görüntüle
    1.3 Yeni makine ekle
    1.4 Makine güncelle
    1.5 Makine sil
    1.6 Makine aktif/pasif yap

[2] PERİYOT YÖNETİMİ
    2.1 Makineye periyot ekle
    2.2 Periyot güncelle
    2.3 Periyot sil
    2.5 Makinenin tüm periyotlarını görüntüle

[3] ANALİZ VE RAPORLAR
    3.1 Haftalık takvim raporu (tüm makineler)
    3.2 Belirli makine takvimi
    3.3 Ay bazlı yoğunluk analizi
    3.4 İstatistikler ve özetler
    3.5 Schedule olmayan makineler

[4] TOPLU İŞLEMLER
    4.1 JSON'dan import
    4.3 JSON'a export
    4.4 CSV'ye export
```

## 📊 Örnek Çıktılar

### Makine Haftalık Takvimi

```
================================================================================
MAKİNE: TD-1010 - Kompresör (150 lt)
YIL: 2025
================================================================================

BAKIM 1: DIŞ HİZMET - Yıllık
   ----------------------------------------------------------------------------
   Ağustos    : H1 (1-7) | H2 (8-14) | H3 (15-21) | H4 (22-31)

BAKIM 2: İÇ BAKIM - Haftalık
   ----------------------------------------------------------------------------
   Ocak       : H1 (1-7) | H2 (8-14) | H3 (15-21) | H4 (22-31)
   Şubat      : H1 (1-7) | H2 (8-14) | H3 (15-21) | H4 (22-28)
   Mart       : H1 (1-7) | H2 (8-14) | H3 (15-21) | H4 (22-31)
   ...
```

### İstatistikler

```
================================================================================
İSTATİSTİKLER
================================================================================

Genel:
   Toplam Makine            : 47
   Toplam Bakım Periyodu    : 52
   Periyodu Olmayan Makine  : 3

Frequency Dağılımı:
   annual          :   9 periyot
   monthly         :   2 periyot
   quarterly       :   6 periyot
   semi-annual     :   4 periyot
   weekly          :   8 periyot

Bakım Tipi Dağılımı:
   DIŞ HİZMET      :   6 periyot
   İÇ BAKIM        :  46 periyot
```

### Aylık Yoğunluk Analizi

```
================================================================================
AYLIK BAKIM YOĞUNLUĞU ANALİZİ
================================================================================

Ay           Toplam Bakım    Makine Sayısı      Frequency Dağılımı
--------------------------------------------------------------------------------
Ocak         42              35                 Haftalık:8, Aylık:2, 3 Aylık:6
Şubat        34              27                 Haftalık:8, 6 Aylık:2
Mart         34              27                 Haftalık:8, Aylık:2
Nisan        42              35                 Haftalık:8, Aylık:2, 3 Aylık:6
...
```

## 🔧 Gereksinimler

```bash
pip install psycopg2-binary
```

## ⚙️ Konfigürasyon

### Database Bağlantısı

`db_operations.py` dosyasında connection parametreleri:

```python
self.connection_params = {
    'host': 'db.mignlffeyougoefuyayr.supabase.co',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'YOUR_PASSWORD',
    'sslmode': 'require'
}
```

## 📝 Veri Formatı

### Frequency Türleri

- `weekly`: Haftalık (tüm aylar, tüm haftalar)
- `monthly`: Aylık (belirtilen aylar, tüm haftalar)
- `quarterly`: 3 Aylık (belirtilen aylar, tüm haftalar)
- `semi-annual`: 6 Aylık (belirtilen aylar, tüm haftalar)
- `annual`: Yıllık (belirtilen ay, tüm haftalar)

### Hafta Hesaplama

- Hafta 1: Ayın 1-7'si
- Hafta 2: Ayın 8-14'ü
- Hafta 3: Ayın 15-21'i
- Hafta 4: Ayın 22-31'i

## 🎓 Kullanım Örnekleri

### 1. Yeni Makine Ekleme

```python
from db_operations import MaintenanceDB

db = MaintenanceDB()
machine = db.add_machine(
    machine_no='ÜK-9999',
    machine_name='Test Makinesi',
    location='Üretim Hattı 3'
)
print(f"Eklendi: {machine['id']}")
```

### 2. Periyot Ekleme

```python
schedule = db.add_schedule(
    machine_no='ÜK-9999',
    maintenance_type='İÇ BAKIM',
    frequency='quarterly',
    months=[1, 4, 7, 10]  # Ocak, Nisan, Temmuz, Ekim
)
print(f"Schedule eklendi: {schedule['id']}")
```

### 3. Haftalık Takvim Oluşturma

```python
from analysis_tools import MaintenanceCalendar

machine = db.get_machine('ÜK-9999')
schedules = db.get_machine_schedules('ÜK-9999')

calendar = MaintenanceCalendar.generate_machine_calendar(
    machine, schedules, year=2025
)

MaintenanceCalendar.print_machine_calendar(calendar, compact=False)
```

### 4. Export

```python
from export_import import DataExporter

# JSON export
DataExporter.export_to_json(all_calendars, 'export.json')

# CSV export
DataExporter.export_to_csv(all_calendars, 'export.csv')
```

## 🐛 Sorun Giderme

### Database Bağlantı Hatası

```
OperationalError: could not translate host name
```

**Çözüm:**
- Offline analyzer kullanın: `python offline_analyzer.py`
- Veya database credentials'larını kontrol edin

### Encoding Hatası

```
UnicodeEncodeError: 'charmap' codec can't encode character
```

**Çözüm:**
- Konsol encoding'i UTF-8'e ayarlayın
- Veya emoji içermeyen versiyonları kullanın (mevcut)

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Proje dokümantasyonu

## 📜 Lisans

Bu araçlar Glohe Bakım Yönetim Sistemi için geliştirilmiştir.

---

**Son Güncelleme:** 2025-10-24
**Versiyon:** 1.0.0
