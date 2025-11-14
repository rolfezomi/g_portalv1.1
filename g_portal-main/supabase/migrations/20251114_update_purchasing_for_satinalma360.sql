-- ============================================================================
-- Migration: Satınalma360 Excel Formatı İçin Purchasing Orders Güncelleme
-- Tarih: 2025-11-14
-- Açıklama: 46 kolonlu Satınalma360 formatını desteklemek için yeni alanlar
--           ve 25 kolonlu Rapor Formatı çıktısı için hesaplama alanları
-- ============================================================================

-- ============================================================================
-- 1. YENİ KOLONLAR EKLEME (Satınalma360'dan gelen veriler)
-- ============================================================================

-- Talep Bilgileri
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS talep_no text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS talep_tipi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS talep_miktari numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS talep_birimi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS talep_olustruran text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS talep_olusturma_tarihi date;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS ihtiyac_tarihi date;

-- Sipariş Detay Bilgileri
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS siparis_olusturma_tarihi date;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS siparis_teslim_tarihi date;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS siparis_kalem_no text;

-- Ödeme Bilgileri (Detaylı)
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS odeme_kosulu_kod text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS odeme_kosulu_tanimi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS siparis_teslim_odeme_vadesi date;

-- Finansal Bilgiler (Ek)
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS para_birimi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS kur_degeri numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS para_birimi_tutar numeric;

-- Stok ve Teslimat Bilgileri
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS toplam_gelen_miktar numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS toplam_fatura_miktar numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS mal_kabul_tarihi date;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS mal_kabul_statu text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_statu text;

-- Stok Belge Bilgileri
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS irsaliye_no text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS stok_belge_tipi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS stok_belge_no text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS stok_belge_kalem_no text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS stok_belge_miktari numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS stok_belge_birimi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS stok_giris_tarihi date;

-- Fatura Bilgileri
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_miktar numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_tutar numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_tipi text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_no text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS e_fatura_no text;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_tarihi date;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS fatura_vade_tarihi date;

-- Tedarikçi Bilgileri (Ek)
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS tedarikci text;

-- ============================================================================
-- 2. HESAPLANAN ALANLAR (Rapor Formatı için)
-- ============================================================================

-- Standart Termin ve Sapma Hesaplamaları
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS standart_termin_suresi integer DEFAULT 30;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS standart_termin_tarihi date;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS planlama_sapmasi integer;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS termin_farki integer;

-- Miktar ve Durum Hesaplamaları
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS kalan_miktar numeric;
ALTER TABLE purchasing_orders ADD COLUMN IF NOT EXISTS teslimat_durumu text;

-- ============================================================================
-- 3. YORUMLAR (Kolon Açıklamaları)
-- ============================================================================

COMMENT ON COLUMN purchasing_orders.talep_no IS 'Talep numarası (Satınalma360)';
COMMENT ON COLUMN purchasing_orders.talep_tipi IS 'Talep tipi kodu';
COMMENT ON COLUMN purchasing_orders.talep_olusturma_tarihi IS 'Talebin oluşturulma tarihi';
COMMENT ON COLUMN purchasing_orders.ihtiyac_tarihi IS 'Malzemenin ihtiyaç duyulduğu tarih';
COMMENT ON COLUMN purchasing_orders.siparis_olusturma_tarihi IS 'Siparişin oluşturulma tarihi';
COMMENT ON COLUMN purchasing_orders.siparis_teslim_tarihi IS 'Planlanan teslim tarihi';
COMMENT ON COLUMN purchasing_orders.mal_kabul_tarihi IS 'Malın depoya fiilen girdiği tarih';
COMMENT ON COLUMN purchasing_orders.stok_giris_tarihi IS 'Stok girişi kaydedilme tarihi';

COMMENT ON COLUMN purchasing_orders.standart_termin_suresi IS 'Standart termin süresi (gün cinsinden), default: 30';
COMMENT ON COLUMN purchasing_orders.standart_termin_tarihi IS 'Hesaplanmış: talep_olusturma_tarihi + standart_termin_suresi';
COMMENT ON COLUMN purchasing_orders.planlama_sapmasi IS 'Hesaplanmış: standart_termin_tarihi - mal_kabul_tarihi (gün farkı)';
COMMENT ON COLUMN purchasing_orders.termin_farki IS 'Hesaplanmış: mal_kabul_tarihi - siparis_teslim_tarihi (gün farkı)';
COMMENT ON COLUMN purchasing_orders.kalan_miktar IS 'Hesaplanmış: siparis_miktari - toplam_gelen_miktar';
COMMENT ON COLUMN purchasing_orders.teslimat_durumu IS 'Hesaplanmış: Açık/Kısmi/Kapalı (kalan miktara göre)';

-- ============================================================================
-- 4. YENİ İNDEKSLER (Performans İçin)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_purchasing_talep_no ON purchasing_orders(talep_no);
CREATE INDEX IF NOT EXISTS idx_purchasing_talep_tarihi ON purchasing_orders(talep_olusturma_tarihi);
CREATE INDEX IF NOT EXISTS idx_purchasing_siparis_olusturma ON purchasing_orders(siparis_olusturma_tarihi);
CREATE INDEX IF NOT EXISTS idx_purchasing_mal_kabul ON purchasing_orders(mal_kabul_tarihi);
CREATE INDEX IF NOT EXISTS idx_purchasing_teslimat_durumu ON purchasing_orders(teslimat_durumu);
CREATE INDEX IF NOT EXISTS idx_purchasing_tedarikci ON purchasing_orders(tedarikci);
CREATE INDEX IF NOT EXISTS idx_purchasing_siparis_kalem ON purchasing_orders(siparis_kalem_no);
CREATE INDEX IF NOT EXISTS idx_purchasing_fatura_no ON purchasing_orders(fatura_no);

-- ============================================================================
-- 5. TRIGGER: Otomatik Hesaplama Trigger'ı
-- ============================================================================

-- Hesaplanan alanları otomatik güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION calculate_purchasing_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Standart Termin Tarihi hesapla
  IF NEW.talep_olusturma_tarihi IS NOT NULL AND NEW.standart_termin_suresi IS NOT NULL THEN
    NEW.standart_termin_tarihi := NEW.talep_olusturma_tarihi + (NEW.standart_termin_suresi || ' days')::interval;
  END IF;

  -- Planlama Sapması hesapla (negatif = erken, pozitif = geç)
  IF NEW.standart_termin_tarihi IS NOT NULL AND NEW.mal_kabul_tarihi IS NOT NULL THEN
    NEW.planlama_sapmasi := NEW.mal_kabul_tarihi - NEW.standart_termin_tarihi;
  END IF;

  -- Termin Farkı hesapla (negatif = erken, pozitif = geç)
  IF NEW.mal_kabul_tarihi IS NOT NULL AND NEW.siparis_teslim_tarihi IS NOT NULL THEN
    NEW.termin_farki := NEW.mal_kabul_tarihi - NEW.siparis_teslim_tarihi;
  END IF;

  -- Kalan Miktar hesapla
  IF NEW.miktar IS NOT NULL THEN
    NEW.kalan_miktar := COALESCE(NEW.miktar, 0) - COALESCE(NEW.toplam_gelen_miktar, 0);
  END IF;

  -- Teslimat Durumu hesapla
  IF NEW.toplam_gelen_miktar IS NULL OR NEW.toplam_gelen_miktar = 0 THEN
    NEW.teslimat_durumu := 'Açık';
  ELSIF NEW.toplam_gelen_miktar < NEW.miktar THEN
    NEW.teslimat_durumu := 'Kısmi';
  ELSE
    NEW.teslimat_durumu := 'Kapalı';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı tabloya ekle
DROP TRIGGER IF EXISTS trigger_calculate_purchasing_fields ON purchasing_orders;
CREATE TRIGGER trigger_calculate_purchasing_fields
  BEFORE INSERT OR UPDATE ON purchasing_orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_purchasing_fields();

-- ============================================================================
-- 6. VİEW: Rapor Formatı Görünümü (25 Kolon)
-- ============================================================================

CREATE OR REPLACE VIEW purchasing_rapor_formati AS
SELECT
  id,
  firma,
  siparis_tip as talep_tip,  -- NOT: Başlık TalepTip ama veri SiparişTipi'nden
  talep_no,
  siparis_no,
  malzeme as malzeme_kodu,
  malzeme_tanimi,
  talep_olusturma_tarihi,
  siparis_olusturma_tarihi as siparis_donusturme_tarihi,
  ihtiyac_tarihi as istenen_teslim_tarihi,
  standart_termin_suresi,
  standart_termin_tarihi,
  mal_kabul_tarihi,
  planlama_sapmasi,
  termin_farki,
  miktar as siparis_miktari,
  toplam_gelen_miktar as gelen_miktari,
  kalan_miktar,
  birim_fiyat,
  para_birimi_tutar as tutar,
  para_birimi,
  kur_degeri,
  tutar_tl as toplam_tl,
  odeme_kosulu_tanimi as odeme_kosulu,
  siparis_teslim_odeme_vadesi as odeme_tarihi,
  teslimat_durumu,
  -- Meta
  revision_number,
  is_latest,
  uploaded_by,
  created_at,
  updated_at
FROM purchasing_orders
WHERE is_latest = true  -- Sadece en güncel revizyonlar
ORDER BY created_at DESC;

COMMENT ON VIEW purchasing_rapor_formati IS 'Rapor Formatı (25 kolon) görünümü - XLSX çıktısı için';

-- ============================================================================
-- 7. MEVCUT VERİYİ GÜNCELLEME (Varsa)
-- ============================================================================

-- Mevcut kayıtlarda hesaplanan alanları güncelle
UPDATE purchasing_orders
SET
  standart_termin_suresi = COALESCE(standart_termin_suresi, 30),
  toplam_gelen_miktar = COALESCE(toplam_gelen_miktar, gelen_miktar),
  kalan_miktar = COALESCE(miktar, 0) - COALESCE(gelen_miktar, 0),
  teslimat_durumu = CASE
    WHEN COALESCE(gelen_miktar, 0) = 0 THEN 'Açık'
    WHEN COALESCE(gelen_miktar, 0) < COALESCE(miktar, 0) THEN 'Kısmi'
    ELSE 'Kapalı'
  END
WHERE kalan_miktar IS NULL OR teslimat_durumu IS NULL;

-- ============================================================================
-- 8. RLS POLİTİKALARI (Mevcut politikalar korunuyor, yeni kolonlar otomatik dahil)
-- ============================================================================

-- Mevcut RLS politikaları yeni kolonları da kapsıyor, ek işlem gerekmez

-- ============================================================================
-- Migration tamamlandı
-- ============================================================================
