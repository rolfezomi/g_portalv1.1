# Satın Alma Modülü - Database Migration Kılavuzu

Bu klasördeki SQL migration dosyaları satın alma modülünü mevcut projeye entegre eder.

## 📋 Migration Dosyaları

### 1. `20251021_create_purchasing_tables.sql`
**Ne yapar:**
- `purchasing_orders` tablosu oluşturur (sipariş verileri)
- `purchasing_suppliers` tablosu oluşturur (tedarikçi bilgileri)
- Row Level Security (RLS) politikaları ekler
- İndeksler ve performans optimizasyonları yapar
- Otomatik updated_at tetikleyicileri ekler
- Özet raporlar için VIEW'lar oluşturur

**Oluşturulan tablolar:**
- ✅ `purchasing_orders` - 40+ alan içeren sipariş tablosu
- ✅ `purchasing_suppliers` - Tedarikçi ana bilgileri
- ✅ `purchasing_supplier_summary` - Tedarikçi özet raporu (VIEW)
- ✅ `purchasing_monthly_summary` - Aylık özet raporu (VIEW)

### 2. `20251021_update_user_roles.sql`
**Ne yapar:**
- `user_roles` tablosundaki permissions alanını JSONB'ye çevirir
- Admin kullanıcılara purchasing yetkisi ekler
- `has_module_access()` fonksiyonu ekler (yetki kontrolü için)
- `user_access_info` VIEW'i oluşturur (kullanıcı yetkileri görüntüleme)

**Yeni fonksiyonlar:**
- ✅ `has_module_access(module_name)` - Modül erişim kontrolü
- ✅ `user_access_info` VIEW - Kullanıcı yetki özeti

---

## 🚀 Nasıl Çalıştırılır?

### Yöntem 1: Supabase Dashboard (ÖNERİLEN)

1. **Supabase Dashboard'a giriş yapın:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'ü açın:**
   - Sol menüden "SQL Editor" sekmesine tıklayın
   - "New Query" butonuna tıklayın

3. **İlk migration'ı çalıştırın:**
   ```sql
   -- 20251021_create_purchasing_tables.sql dosyasının içeriğini kopyalayıp yapıştırın
   -- RUN butonuna basın
   ```

4. **İkinci migration'ı çalıştırın:**
   ```sql
   -- 20251021_update_user_roles.sql dosyasının içeriğini kopyalayıp yapıştırın
   -- RUN butonuna basın
   ```

5. **Kontrol edin:**
   - Table Editor'den `purchasing_orders` ve `purchasing_suppliers` tablolarını görmelisiniz

### Yöntem 2: Supabase CLI

```bash
# Supabase CLI'yi yükleyin (eğer yoksa)
npm install -g supabase

# Proje dizinine gidin
cd g_portal-main

# Supabase'e login olun
supabase login

# Projenizi link edin
supabase link --project-ref YOUR-PROJECT-REF

# Migration'ları push edin
supabase db push

# Veya tek tek migration çalıştırın
supabase db execute -f supabase/migrations/20251021_create_purchasing_tables.sql
supabase db execute -f supabase/migrations/20251021_update_user_roles.sql
```

---

## 👤 Satın Alma Kullanıcısı Ekleme

Migration çalıştıktan sonra, satın alma yetkisi olan kullanıcı eklemek için:

### Adım 1: Supabase Authentication'dan kullanıcı oluşturun

1. Supabase Dashboard > Authentication > Users
2. "Invite User" veya "Add User" ile yeni kullanıcı ekleyin
3. Kullanıcının UUID'sini kopyalayın

### Adım 2: Kullanıcıya purchasing rolü atayın

SQL Editor'de şu komutu çalıştırın:

```sql
-- USER-UUID-BURAYA yerine Supabase Authentication'dan aldığınız UUID'yi yazın
INSERT INTO user_roles (user_id, role, permissions)
VALUES (
  'USER-UUID-BURAYA',
  'purchasing',
  '{"modules": ["purchasing"]}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE
SET role = 'purchasing',
    permissions = '{"modules": ["purchasing"]}'::jsonb;
```

### Adım 3: Admin kullanıcılara purchasing yetkisi ekleyin

```sql
-- Admin kullanıcılara otomatik olarak purchasing yetkisi ekler
UPDATE user_roles
SET permissions = jsonb_set(
  permissions,
  '{modules}',
  permissions->'modules' || '["purchasing"]'::jsonb
)
WHERE role = 'admin'
AND NOT (permissions->'modules' @> '["purchasing"]'::jsonb);
```

---

## 🔐 Yetki Sistemi Nasıl Çalışır?

### Roller:
- **admin**: Tüm modüllere erişim (measurements + purchasing + admin paneli)
- **operator**: Sadece ölçüm modülüne erişim
- **purchasing**: Sadece satın alma modülüne erişim

### Permissions Yapısı:
```json
{
  "modules": ["purchasing", "measurements"]
}
```

### Modül Erişim Kontrolü:
```javascript
// Frontend'de kullanım örneği
const { data: userRole } = await supabase
  .from('user_roles')
  .select('role, permissions')
  .eq('user_id', userId)
  .single();

// Kullanıcı purchasing modülüne erişebilir mi?
const canAccessPurchasing =
  userRole.role === 'admin' ||
  userRole.role === 'purchasing' ||
  userRole.permissions?.modules?.includes('purchasing');
```

---

## 🧪 Test Sorguları

Migration sonrası test etmek için:

```sql
-- 1. Tüm purchasing kullanıcılarını listele
SELECT * FROM user_access_info
WHERE 'purchasing' = ANY(accessible_modules);

-- 2. Bir kullanıcının purchasing erişimi var mı?
-- (auth.uid() yerine test etmek istediğiniz user_id'yi kullanın)
SELECT has_module_access('purchasing');

-- 3. Tabloları kontrol et
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'purchasing%';

-- 4. RLS politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'purchasing%';

-- 5. İndeksleri kontrol et
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename LIKE 'purchasing%';
```

---

## 📊 Örnek Veri Ekleme (Test için)

```sql
-- Test tedarikçisi ekle
INSERT INTO purchasing_suppliers (tedarikci_kodu, tedarikci_tanimi, telefon, email)
VALUES ('TED001', 'Test Tedarikçi A.Ş.', '0212 123 45 67', 'info@test.com');

-- Test siparişi ekle
INSERT INTO purchasing_orders (
  siparis_no,
  siparis_tarihi,
  tedarikci_kodu,
  tedarikci_tanimi,
  malzeme_tanimi,
  miktar,
  birim_fiyat,
  tutar_tl,
  kur,
  odeme_kosulu
)
VALUES (
  'SIP-2025-001',
  '2025-10-21',
  'TED001',
  'Test Tedarikçi A.Ş.',
  'Test Malzeme',
  100,
  50.00,
  5000.00,
  'TL',
  '30 Gün Vadeli'
);
```

---

## ⚠️ Önemli Notlar

1. **Yedek Alın:** Migration öncesi mutlaka database yedeği alın
2. **Test Edin:** Önce test ortamında çalıştırın
3. **RLS Aktif:** Row Level Security varsayılan olarak aktif, yetkisiz erişim engellenmiştir
4. **İndeksler:** Performans için önemli alanlara indeks eklenmiştir
5. **Cascade Delete:** Silme işlemleri sadece admin yapabilir

---

## 🆘 Sorun Giderme

### Hata: "permission denied for table purchasing_orders"
**Çözüm:** RLS politikalarını kontrol edin, kullanıcının doğru role sahip olduğundan emin olun.

```sql
-- Kullanıcı rolünü kontrol et
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

### Hata: "column permissions does not exist"
**Çözüm:** `20251021_update_user_roles.sql` migration'ını çalıştırın.

### Hata: "duplicate key value violates unique constraint"
**Çözüm:** Aynı user_id için birden fazla role kaydı olamaz. Mevcut kaydı güncelleyin:

```sql
UPDATE user_roles
SET role = 'purchasing',
    permissions = '{"modules": ["purchasing"]}'::jsonb
WHERE user_id = 'USER-UUID';
```

---

## 📚 Ek Kaynaklar

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)

---

**Son Güncelleme:** 2025-10-21
**Versiyon:** 1.0.0
