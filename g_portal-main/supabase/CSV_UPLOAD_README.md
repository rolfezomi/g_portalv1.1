# CSV Yükleme Kılavuzu - Satın Alma Modülü (Canias ERP)

Bu doküman satın alma modülüne Canias ERP'den alınan CSV dosyası ile toplu sipariş yükleme işlemini açıklar.

---

## 🏢 Canias ERP Format Özellikleri

- **Dosya Formatı:** CSV (Semicolon Delimited)
- **Ayırıcı Karakter:** Noktalı virgül (;)
- **Encoding:** UTF-8 with BOM
- **Tarih Formatı:** GG.AA.YYYY (örn: 21.10.2025)
- **Sayı Formatı:** Nokta binlik ayırıcı, virgül ondalık ayırıcı (örn: 1.234,56)

---

## 📋 CSV Dosya Formatı

### Desteklenen Kolonlar (Canias ERP Standart)

CSV dosyanız aşağıdaki kolonlardan **herhangi birini** içerebilir. Tüm kolonları kullanmanız zorunlu değildir:

| CSV Header (Canias) | Database Kolonu | Veri Tipi | Örnek |
|---------------------|----------------|-----------|-------|
| **Sipariş Bilgileri** |
| Teslimat | teslimat | Text | Hic, Kismen |
| Baslama | baslama | Text | Baslamadi |
| Firma | firma | Text | 01 |
| SiparisTip | siparis_tip | Text | O1 |
| SiparisNo | siparis_no | Text | 25100010 |
| SiparisTarihi | siparis_tarihi | Date | 21.10.2025 |
| SiparisKalemi | siparis_kalemi | Text | 10, 20, 30 |
| **Malzeme Bilgileri** |
| Malzeme | malzeme | Text | AMB2-00087 |
| MalzemeTanimi | malzeme_tanimi | Text | Test Malzeme |
| Birim | birim | Text | AD, KG, LT |
| Depo | depo | Text | AMD |
| MalzemeGrubu | malzeme_grubu | Text | BASKISIZ |
| Marka | marka | Text | INCIA |
| **Tedarikçi Bilgileri** |
| TedarikciKodu | tedarikci_kodu | Text | T001 |
| TedarikciTanimi | tedarikci_tanimi | Text | UNİSON A.Ş. |
| **Tarih Bilgileri** |
| TeslimTarihi | teslim_tarihi | Date | 21.11.2025 |
| IstekTeslimTarihi | istek_teslim_tarihi | Date | 21.11.2025 |
| VADEYEGORE | vadeye_gore | Date | 20.12.2025 |
| **Miktar Bilgileri** |
| OzelStok | ozel_stok | Text | 1, 0 |
| Miktar | miktar | Numeric | 1.000 |
| GelenMiktar | gelen_miktar | Numeric | 500 |
| Fark | fark | Numeric | 0 |
| DepoFark | depo_fark | Numeric | 1.000 |
| **Finansal Bilgiler** |
| BirimFiyat | birim_fiyat | Numeric | 50,00 |
| Brut | brut | Numeric | 50.000,00 |
| NET | net | Numeric | 50.000,00 |
| Kur | kur | Text | TL, EUR, USD |
| KDVOrani | kdv_orani | Numeric | 20 |
| TutarTL | tutar_tl | Numeric | 50.000,00 |
| VADEGUN | vade_gun | Numeric | 30 |
| **Ödeme ve İstek** |
| OdemeKosulu | odeme_kosulu | Text | 30 Gün Vadeli |
| IstekTipi | istek_tipi | Text | IN |
| IstekNo | istek_no | Text | 00001 |
| **Diğer** |
| Aciklama | aciklama | Text | Notlar |
| Bu hafta | bu_hafta | Text | - |
| Bu Ay | bu_ay | Text | Bu Ay |
| Tip | tip | Text | AMB |

---

## ✅ Örnek CSV Dosyası (Canias Format)

### Canias ERP'den Export Edilen Format

**Önemli:** Canias ERP'den export ettiğinizde dosya otomatik olarak doğru formatta gelecektir. Bu örnek sadece formatı anlamanız içindir.

```csv
Teslimat;Baslama;Firma;SiparisTip;SiparisNo;SiparisTarihi;SiparisKalemi;Malzeme;MalzemeTanimi;Birim;Depo;MalzemeGrubu;Marka;TedarikciKodu;TedarikciTanimi;TeslimTarihi;OzelStok;Miktar;GelenMiktar;BirimFiyat;Brut;NET;Kur;KDVOrani;Aciklama;OdemeKosulu;IstekTipi;IstekNo;IstekTeslimTarihi;TutarTL;VADEGUN;VADEYEGORE;Fark;DepoFark;Bu hafta;Bu Ay;Tip
Hic;Baslamadi;01;O1;25100010;21.10.2025;10;TEST-001;Test Malzeme 1;AD;AMD;HAMMADDE;TEST;T001;Test Tedarikçi A.Ş.;21.11.2025;1;1.000;0;50,00;50.000,00;50.000,00;TL;20;Test;30 Gün Vadeli;IN;00001;21.11.2025;50.000,00;30;20.12.2025;0;1.000;;Bu Ay;TEST
Hic;Baslamadi;01;O1;25100011;21.10.2025;20;TEST-002;Test Malzeme 2;KG;AMD;KIMYASAL;ÖRNEK;T002;Örnek Ltd.;25.11.2025;1;500;250;150,50;75.250,00;75.250,00;TL;20;Kısmi geldi;60 Gün Vadeli;IN;00002;25.11.2025;75.250,00;60;24.12.2025;0;250;;Bu Ay;TEST
```

Örnek dosya: [`sample_canias_purchasing.csv`](./sample_canias_purchasing.csv)

### Format Detayları

- **Ayırıcı:** Noktalı virgül (;)
- **Tarih:** GG.AA.YYYY (örn: 21.10.2025)
- **Sayı:** Nokta binlik, virgül ondalık (örn: 1.000,00)
- **Encoding:** UTF-8 with BOM (﻿)

---

## 🚀 CSV Dosyası Yükleme Adımları

### 1. Canias ERP'den CSV Export Edin

**Önemli:** Canias ERP'den direkt export ettiğiniz dosyayı kullanın. Formatı değiştirmeyin!

1. Canias ERP'de Satın Alma raporunu açın
2. Export/Dışa Aktar seçeneğini kullanın
3. CSV formatını seçin
4. Dosyayı indirin (örn: `ugur-Satınalma Raporu-(Canias).csv`)

### 2. Dosyayı Yükleyin

1. Satın Alma modülüne gidin
2. "CSV Yükle" butonuna tıklayın
3. Canias'tan indirdiğiniz CSV dosyasını seçin
4. Sistem otomatik olarak:
   - BOM karakterini temizler
   - Noktalı virgül ayırıcısını tanır
   - Tarihleri dönüştürür (21.10.2025 → 2025-10-21)
   - Sayıları dönüştürür (1.234,56 → 1234.56)
   - CSV kolonlarını database kolonlarına eşleştirir
   - Verileri Supabase'e kaydeder

### 3. Sonucu Kontrol Edin

- ✅ **Başarılı:** "X sipariş başarıyla yüklendi" mesajı görünür
- ❌ **Hatalı:** Hata mesajı ve detayı console'da görünür (F12 Developer Tools)

---

## 🔧 Otomatik Eklenen Alanlar

CSV dosyanıza eklemenize gerek olmayan alanlar:

- `id` - Otomatik UUID oluşturulur
- `created_at` - Yükleme zamanı
- `updated_at` - Yükleme zamanı
- `created_by` - Yükleyen kullanıcının email'i
- `updated_by` - Yükleyen kullanıcının email'i

---

## 🛡️ Güvenlik ve Yetkilendirme

### Kimin CSV Yükleyebilir?

- **Admin** kullanıcılar ✅
- **Purchasing** rolü olan kullanıcılar ✅
- **Operator** kullanıcılar ❌

### RLS (Row Level Security)

Yüklenen siparişler:
- Sadece **admin** ve **purchasing** rolündeki kullanıcılar tarafından görülebilir
- Sadece **admin** kullanıcılar silebilir
- **Admin** ve **purchasing** kullanıcılar güncelleyebilir

---

## ⚠️ Önemli Notlar

### 1. Canias Dosyasını Değiştirmeyin!

**ÇOK ÖNEMLİ:** Canias ERP'den export ettiğiniz CSV dosyasını Excel'de açıp düzenlemeyin!

❌ **Yapmamanız Gerekenler:**
- Excel'de açıp kaydetmek (format bozulur!)
- Tarihleri elle değiştirmek
- Sayıları elle düzenlemek
- Ayırıcıyı virgülden noktalı virgüle çevirmek

✅ **Yapmanız Gerekenler:**
- Canias'tan indirdiğiniz dosyayı direkt yükleyin
- Sistem her şeyi otomatik halleder

### 2. Otomatik Format Dönüşümleri

Sistem aşağıdaki dönüşümleri otomatik yapar:

**Tarihler:**
```
Canias:     21.10.2025 (GG.AA.YYYY)
Database:   2025-10-21 (YYYY-MM-DD)
```

**Sayılar:**
```
Canias:     1.234,56 (Nokta binlik, virgül ondalık)
Database:   1234.56  (PostgreSQL formatı)
```

**Boş Değerler:**
```
Canias:     "Hic", "-", ""
Database:   null
```

### 3. Türkçe Karakterler

- Türkçe karakterler (ö, ü, ş, ı, ğ, ç) desteklenir
- UTF-8 encoding kullanın
- Excel'de "UTF-8 CSV" olarak kaydedin

### 4. Boş Alanlar

- Boş alanlar `null` olarak kaydedilir
- Tire (-) işareti de `null` olarak işlenir
- Tamamen boş satırlar otomatik olarak atlanır

### 5. Virgüllü Metinler

Eğer bir alan virgül içeriyorsa, tırnak içine alın:

```csv
Açıklama
"Bu malzeme, özel bir sipariş içindir"
"Test, örnek, deneme"
```

---

## 🆘 Hata Giderme

### Hata: "CSV dosyası boş"

**Sebep:** Dosyanız boş veya sadece header satırı içeriyor

**Çözüm:** En az 2 satır olmalı (1 header + 1 veri)

---

### Hata: "CSV yüklenemedi: permission denied"

**Sebep:** Kullanıcı yetkisi yok

**Çözüm:**
```sql
-- Kullanıcıya purchasing rolü atayın
UPDATE user_roles
SET role = 'purchasing'
WHERE email = 'kullanici@email.com';
```

---

### Hata: "Kullanıcı bilgisi alınamadı"

**Sebep:** Oturum süresi dolmuş

**Çözüm:** Çıkış yapıp tekrar giriş yapın

---

### Hata: "invalid input syntax for type numeric"

**Sebep:** Sayısal alanlarda geçersiz format

**Çözüm:**
- Ondalık ayırıcı olarak nokta (.) kullanın
- Binlik ayırıcı kullanmayın
- Boş bırakın veya geçerli sayı girin

---

### Hata: "invalid input syntax for type date"

**Sebep:** Tarih formatı yanlış

**Çözüm:** Tarihleri YYYY-MM-DD formatında yazın (örn: 2025-10-21)

---

## 📊 Console'da Detaylı Hata Kontrolü

CSV yükleme sırasında hata alırsanız:

1. **F12** tuşuna basın (Developer Tools)
2. **Console** sekmesine gidin
3. Şu mesajları arayın:
   - 🔄 "CSV dosyası işleniyor..."
   - 📦 "X sipariş parse edildi"
   - 📋 "CSV Headers: [...]"
   - 📝 "İlk sipariş örneği: {...}"
   - 📤 "Supabase'e yükleniyor..."
   - ❌ "CSV yükleme hatası:" (hata detayı ile birlikte)

---

## 💡 İpuçları

### Excel'den CSV Oluşturma

1. Excel'de verilerinizi hazırlayın
2. **Dosya > Farklı Kaydet**
3. **Dosya türü:** "CSV UTF-8 (Virgülle Ayrılmış) (*.csv)"
4. Kaydet

### Google Sheets'ten CSV Oluşturma

1. Google Sheets'te verilerinizi hazırlayın
2. **Dosya > İndir > Virgülle Ayrılmış Değerler (.csv)**

### LibreOffice Calc'ten CSV Oluşturma

1. Verilerinizi hazırlayın
2. **Dosya > Farklı Kaydet**
3. **Dosya türü:** "Metin CSV (.csv)"
4. **Karakter kümesi:** UTF-8
5. **Alan ayırıcı:** , (virgül)

---

## 📚 Örnek Kullanım Senaryoları

### Senaryo 1: Sadece Temel Bilgiler

CSV içeriği:
```csv
Sipariş No,Tedarikçi Tanımı,Malzeme Tanımı,Miktar,Tutar (TL)
SIP-001,ABC Ltd.,Kimyasal A,100,5000
SIP-002,XYZ A.Ş.,Hammadde B,200,10000
```

Sonuç: Diğer alanlar `null` olarak kaydedilir.

---

### Senaryo 2: Kısmi Gelmiş Siparişler

CSV içeriği:
```csv
Sipariş No,Tedarikçi Tanımı,Malzeme Tanımı,Miktar,Gelen Miktar,Tutar (TL)
SIP-001,ABC Ltd.,Kimyasal A,100,50,5000
SIP-002,XYZ A.Ş.,Hammadde B,200,200,10000
```

Sonuç:
- SIP-001 → "Kısmi Geldi" durumu
- SIP-002 → "Tamamlandı" durumu

---

### Senaryo 3: Farklı Header İsimleri

Sistem şu header varyasyonlarını otomatik tanır:

- "Tedarikçi" = "Tedarikçi Tanımı"
- "Tutar" = "Tutar (TL)"
- "Malzeme" veya "Malzeme Tanımı"

---

## 🔄 Toplu Güncelleme

**ÖNEMLİ:** CSV yükleme her zaman **yeni kayıt ekler**, mevcut kayıtları güncellemez.

Mevcut kayıtları güncellemek için:
1. Satın Alma tablosundan manuel olarak düzenleyin
2. Veya SQL sorgularını kullanın (admin yetkisi gerekir)

---

## 📞 Destek

Sorun yaşıyorsanız:
1. Console'daki hata mesajlarını kontrol edin (F12)
2. CSV formatınızı `sample_purchasing_orders.csv` ile karşılaştırın
3. Database yöneticinize başvurun

---

**Son Güncelleme:** 2025-10-21
**Versiyon:** 1.1.0
