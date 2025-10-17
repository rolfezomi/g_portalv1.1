# Glohe Portal - Dokümantasyon Dizini

**Son Güncelleme:** 17 Ekim 2025

---

## 📚 İçindekiler

Bu dizin, Glohe Portal projesinin tüm dokümantasyonunu içerir. Proje hakkında detaylı bilgi almak ve geliştirme süreçlerini takip etmek için aşağıdaki dosyalara göz atabilirsiniz.

---

## 📄 Dosyalar

### 1. [TEKNIK_DOKUMANTASYON.md](TEKNIK_DOKUMANTASYON.md)
**1700+ satır | Kapsamlı Teknik Doküman**

Projenin tam teknik dokümantasyonu. Yeni bir geliştirici veya AI asistanı bu dosyayı okuyarak projeye hızlıca adapte olabilir.

**İçerik:**
- Proje genel bakış ve teknoloji stack
- Dosya yapısı ve kod organizasyonu
- Veritabanı şeması (measurements, users, system_logs)
- Tüm modüller ve özelliklerin detayları
- Otomasyon sistemleri (saatlik ve günlük raporlar)
- Güvenlik ve rol yönetimi
- Kodlama kuralları ve standartları
- Deployment ve CI/CD
- Önemli notlar ve hatırlatıcılar

**Hedef Kitle:** Geliştiriciler, Sistem Yöneticileri, AI Asistanları

---

### 2. [HAFTALIK_GELISMELER.md](HAFTALIK_GELISMELER.md)
**220+ satır | Haftalık Geliştirme Raporu**

13-17 Ocak 2025 haftasında yapılan tüm geliştirmelerin detaylı raporu.

**İçerik:**
- Yeni modüller (Üst Yönetim Dashboard, Dolum Makinaları)
- Otomatik e-posta rapor sistemleri
- Kullanıcı arayüzü iyileştirmeleri
- Teknik iyileştirmeler ve performans optimizasyonları
- Güvenlik güncellemeleri
- Rakamlarla haftalık özet
- İş değeri ve faydalar

**Hedef Kitle:** Proje Yöneticileri, Üst Yönetim, İş Sahipleri

---

### 3. [DEPLOYMENT_2025-10-17.md](DEPLOYMENT_2025-10-17.md)
**300+ satır | Son Deployment Raporu**

17 Ekim 2025 tarihinde yapılan Edge Functions deployment'ının detaylı raporu.

**İçerik:**
- Düzeltilen hatalar (timezone, string type error)
- Supabase CLI kurulum adımları
- Edge Functions deployment süreci
- Deployment doğrulama ve test sonuçları
- Etki analizi ve sistem metrikleri
- Teknik detaylar ve rollback planı
- Sonraki adımlar

**Hedef Kitle:** DevOps Mühendisleri, Geliştiriciler, Sistem Yöneticileri

---

## 🗂️ Dokümantasyon Yapısı

```
docs/
├── README.md                      # Bu dosya (dizin rehberi)
├── TEKNIK_DOKUMANTASYON.md       # Kapsamlı teknik doküman
├── HAFTALIK_GELISMELER.md        # Haftalık geliştirme raporu
└── DEPLOYMENT_2025-10-17.md      # Son deployment notları
```

---

## 📖 Nasıl Kullanılır?

### Yeni Geliştiriciler İçin
1. **İlk Adım:** [TEKNIK_DOKUMANTASYON.md](TEKNIK_DOKUMANTASYON.md) dosyasını okuyun
2. **İkinci Adım:** Ana dizindeki [README.md](../README.md) dosyasını inceleyin
3. **Üçüncü Adım:** Kodu incelemeye başlayın

### Proje Yöneticileri İçin
1. **Geliştirmeler:** [HAFTALIK_GELISMELER.md](HAFTALIK_GELISMELER.md) - İş değeri ve faydalar
2. **Son Durum:** [DEPLOYMENT_2025-10-17.md](DEPLOYMENT_2025-10-17.md) - Güncel sistem durumu

### DevOps Mühendisleri İçin
1. **Deployment:** [DEPLOYMENT_2025-10-17.md](DEPLOYMENT_2025-10-17.md) - Deployment prosedürleri
2. **Teknik Detaylar:** [TEKNIK_DOKUMANTASYON.md](TEKNIK_DOKUMANTASYON.md) - Bölüm 9 (Deployment ve CI/CD)

---

## 🔍 Hızlı Referans

### Veritabanı Şeması
📄 **Dosya:** TEKNIK_DOKUMANTASYON.md - Bölüm 4

**measurements tablosu kolonları:**
- `id`, `category`, `point`, `value`, `unit`, `date`, `time`, `user`, `note`

⚠️ **YOKTUR:** `created_at`, `result`, `control_point`

---

### Timezone Kuralı
📄 **Dosya:** DEPLOYMENT_2025-10-17.md - Hata B & C

**Doğru Kullanım:**
```typescript
const now = new Date()
now.setHours(now.getHours() + 3)  // UTC+3 Turkish time
const today = now.toISOString().split('T')[0]
```

---

### Deployment Komutları
📄 **Dosya:** TEKNIK_DOKUMANTASYON.md - Bölüm 9.3

```bash
# Edge Functions
export SUPABASE_ACCESS_TOKEN="your_token"
supabase functions deploy send-daily-report
supabase functions deploy check-daily-measurement-status

# Database Migrations
supabase db push
```

---

## 📊 Dokümantasyon İstatistikleri

| Dosya | Satır | Kelime | Karakter | Güncelleme |
|-------|-------|--------|----------|------------|
| TEKNIK_DOKUMANTASYON.md | 1700+ | 12000+ | 85000+ | 17 Ocak 2025 |
| HAFTALIK_GELISMELER.md | 220+ | 1800+ | 13000+ | 17 Ocak 2025 |
| DEPLOYMENT_2025-10-17.md | 300+ | 2200+ | 16000+ | 17 Ekim 2025 |
| **TOPLAM** | **2220+** | **16000+** | **114000+** | - |

---

## 🔄 Güncelleme Sıklığı

| Dosya | Güncelleme Sıklığı |
|-------|-------------------|
| TEKNIK_DOKUMANTASYON.md | Her major özellik eklendiğinde |
| HAFTALIK_GELISMELER.md | Her hafta (Cuma günleri) |
| DEPLOYMENT_*.md | Her deployment'ta yeni dosya |

---

## 📝 Dokümantasyon Standartları

### Dosya İsimlendirme
- Büyük harfle başlamalı (UPPERCASE)
- Türkçe karakter kullanılabilir
- Altçizgi ile kelime ayrımı
- Tarih formatı: YYYY-MM-DD

**Örnekler:**
- ✅ `TEKNIK_DOKUMANTASYON.md`
- ✅ `DEPLOYMENT_2025-10-17.md`
- ❌ `teknik-dokumantasyon.md`
- ❌ `deployment_17-10-2025.md`

### İçerik Formatı
- Markdown formatı (.md)
- Başlıklar `#` ile
- Kod blokları ` ```language ` ile
- Emoji kullanımı teşvik edilir (🎯 📊 ✅ ⚠️)
- Tablo formatı desteklenir

---

## 🤝 Katkıda Bulunma

Dokümantasyona katkıda bulunmak için:

1. Yeni özellik eklendiğinde → TEKNIK_DOKUMANTASYON.md güncelle
2. Haftalık gelişmeler → HAFTALIK_GELISMELER.md oluştur
3. Her deployment → DEPLOYMENT_YYYY-MM-DD.md oluştur
4. Bu README.md dosyasını güncelle

---

## 📞 İletişim

Dokümantasyon hakkında sorularınız için:

**Email:** ugur.onar@glohe.com
**Proje:** Glohe Portal v1.1

---

**Son Güncelleme:** 17 Ekim 2025
