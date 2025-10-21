# CSV Yükleme Kılavuzu - Satın Alma Modülü

Bu doküman satın alma modülüne CSV dosyası ile toplu sipariş yükleme işlemini açıklar.

---

## 📋 CSV Dosya Formatı

### Desteklenen Kolonlar

CSV dosyanız aşağıdaki kolonlardan **herhangi birini** içerebilir. Tüm kolonları kullanmanız zorunlu değildir:

| CSV Header | Database Kolonu | Veri Tipi | Örnek |
|------------|----------------|-----------|-------|
| Sipariş No | siparis_no | Text | SIP-2025-001 |
| Sipariş Tarihi | siparis_tarihi | Date (YYYY-MM-DD) | 2025-10-21 |
| Tedarikçi Kodu | tedarikci_kodu | Text | TED001 |
| Tedarikçi / Tedarikçi Tanımı | tedarikci_tanimi | Text | Test Tedarikçi A.Ş. |
| Malzeme | malzeme | Text | MAL001 |
| Malzeme Tanımı | malzeme_tanimi | Text | Test Malzeme |
| Miktar | miktar | Numeric | 100 |
| Birim | birim | Text | Adet, KG, Litre |
| Birim Fiyat | birim_fiyat | Numeric | 50.00 |
| Tutar (TL) / Tutar | tutar_tl | Numeric | 5000.00 |
| Ödeme Koşulu | odeme_kosulu | Text | 30 Gün Vadeli |
| Teslim Tarihi | teslim_tarihi | Date (YYYY-MM-DD) | 2025-11-15 |
| Vade Gün | vade_gun | Numeric | 30 |
| KDV Oranı | kdv_orani | Numeric | 20 |
| Kur | kur | Text | TL, USD, EUR |
| Gelen Miktar | gelen_miktar | Numeric | 50 |
| Depo | depo | Text | Merkez Depo |
| Malzeme Grubu | malzeme_grubu | Text | Hammadde |
| Marka | marka | Text | Test Marka |
| Açıklama | aciklama | Text | İsteğe bağlı notlar |

### Ek Kolonlar (Tüm Alan Listesi)

CSV dosyanız aşağıdaki ek alanları da içerebilir:

- Teslimat (`teslimat`)
- Başlama (`baslama`)
- Firma (`firma`)
- Sipariş Tip (`siparis_tip`)
- Sipariş Kalemi (`siparis_kalemi`)
- İstek Teslim Tarihi (`istek_teslim_tarihi`)
- Vadeye Göre (`vadeye_gore`)
- Özel Stok (`ozel_stok`)
- Fark (`fark`)
- Depo Fark (`depo_fark`)
- Brüt (`brut`)
- Net (`net`)
- İstek Tipi (`istek_tipi`)
- İstek No (`istek_no`)
- Bu Hafta (`bu_hafta`)
- Bu Ay (`bu_ay`)
- Tip (`tip`)

---

## ✅ Örnek CSV Dosyası

### Minimum Örnek (Sadece Zorunlu Alanlar)

```csv
Sipariş No,Sipariş Tarihi,Tedarikçi Tanımı,Malzeme Tanımı,Miktar,Tutar (TL)
SIP-001,2025-10-21,Test Tedarikçi,Test Malzeme,100,5000.00
SIP-002,2025-10-22,Örnek Ltd.,Örnek Malzeme,50,7500.00
```

### Tam Örnek (Tüm Önemli Alanlar)

```csv
Sipariş No,Sipariş Tarihi,Tedarikçi Kodu,Tedarikçi Tanımı,Malzeme,Malzeme Tanımı,Miktar,Birim,Birim Fiyat,Tutar (TL),Ödeme Koşulu,Teslim Tarihi,Vade Gün,KDV Oranı,Kur,Gelen Miktar,Depo,Malzeme Grubu,Marka,Açıklama
SIP-2025-001,2025-10-21,TED001,Test Tedarikçi A.Ş.,MAL001,Test Malzeme 1,100,Adet,50.00,5000.00,30 Gün Vadeli,2025-11-15,30,20,TL,0,Merkez Depo,Hammadde,Test Marka,Test açıklama
SIP-2025-002,2025-10-21,TED002,Örnek Tedarikçi Ltd.,MAL002,Örnek Malzeme 2,50,KG,150.00,7500.00,Peşin,2025-11-01,0,20,TL,25,Merkez Depo,Kimyasal,Örnek Marka,Kısmi geldi
```

Örnek dosya: [`sample_purchasing_orders.csv`](./sample_purchasing_orders.csv)

---

## 🚀 CSV Dosyası Yükleme Adımları

### 1. CSV Dosyasını Hazırlayın

- **UTF-8 encoding** kullanın (Türkçe karakterler için)
- Excel'de kaydederken "CSV UTF-8 (Virgülle Ayrılmış)" formatını seçin
- İlk satır **mutlaka header satırı** olmalı

### 2. Dosyayı Yükleyin

1. Satın Alma modülüne gidin
2. "CSV Yükle" butonuna tıklayın
3. CSV dosyanızı seçin
4. Sistem otomatik olarak:
   - Dosyayı okur
   - CSV kolonlarını database kolonlarına eşleştirir
   - Türkçe karakterleri normalize eder
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

### 1. Tarih Formatı

Tarihler **YYYY-MM-DD** formatında olmalı:

✅ **Doğru:**
```
2025-10-21
2025-11-15
```

❌ **Yanlış:**
```
21.10.2025
21/10/2025
10-21-2025
```

### 2. Sayısal Değerler

- Ondalık ayırıcı olarak **nokta (.)** kullanın
- Binlik ayırıcı kullanmayın

✅ **Doğru:**
```
5000.00
150.50
```

❌ **Yanlış:**
```
5.000,00
5,000.00
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
