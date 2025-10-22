-- =====================================================
-- TÜM SATIN ALMA VERİLERİNİ TEMİZLE (TAM SIFIRLAMA)
-- =====================================================
-- UYARI: Bu komut tüm satın alma tablolarını sıfırlar!
-- - purchasing_orders (tüm siparişler ve revizyonlar)
-- - purchasing_suppliers (tedarikçiler)
-- - purchasing_revision_stats (VIEW - otomatik temizlenir)

-- 1. Siparişleri temizle
TRUNCATE TABLE purchasing_orders RESTART IDENTITY CASCADE;

-- 2. Tedarikçileri temizle (opsiyonel)
TRUNCATE TABLE purchasing_suppliers RESTART IDENTITY CASCADE;

-- 3. Kontrol: Tümü sıfırlanmalı
SELECT 
  'purchasing_orders' as tablo,
  COUNT(*) as kayit_sayisi 
FROM purchasing_orders
UNION ALL
SELECT 
  'purchasing_suppliers' as tablo,
  COUNT(*) as kayit_sayisi 
FROM purchasing_suppliers;

-- 4. VIEW'ları test et (boş olmalı)
SELECT COUNT(*) as latest_orders FROM purchasing_orders_latest;
SELECT COUNT(*) as revision_stats FROM purchasing_revision_stats;

-- Başarılı mesajı
SELECT '✅ TÜM SATIN ALMA VERİLERİ TEMİZLENDİ! Sıfırdan başlamaya hazırsınız.' as mesaj;
