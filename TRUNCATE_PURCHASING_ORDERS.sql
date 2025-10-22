-- =====================================================
-- SATIN ALMA VERİLERİNİ TEMİZLE
-- =====================================================
-- UYARI: Bu komut tüm purchasing_orders tablosunu temizler!
-- Tüm siparişler ve revizyonlar silinecek.

-- Tüm kayıtları sil
TRUNCATE TABLE purchasing_orders RESTART IDENTITY CASCADE;

-- Kontrol et
SELECT COUNT(*) as toplam_kayit FROM purchasing_orders;

-- Başarılı mesajı
SELECT '✅ Tüm satın alma verileri silindi. Temiz başlangıç hazır!' as mesaj;
