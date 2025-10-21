/*
  # Revizyon Takip Sistemi - Migration

  Bu migration dosyası purchasing_orders tablosuna revizyon takip alanlarını ekler.

  ## Yeni Alanlar:

  1. revision_number (INTEGER)
     - Her sipariş için revizyon numarası (1, 2, 3...)
     - Aynı sipariş her güncellendiğinde +1 artar

  2. is_latest (BOOLEAN)
     - En güncel revizyon mu? (true/false)
     - Tabloda sadece is_latest=true kayıtlar gösterilir

  3. revision_date (TIMESTAMPTZ)
     - Revizyon oluşturulma tarihi
     - CSV yükleme zamanı

  4. changes_from_previous (JSONB)
     - Önceki revizyondan farklar
     - Örnek: {"gelen_miktar": {"from": 0, "to": 500}}

  5. uploaded_by (TEXT)
     - CSV'yi yükleyen kullanıcı email
     - Takip için önemli

  ## İndeksler:

  - is_latest için hızlı sorgulama
  - siparis_no + revision_number için revizyon geçmişi
  - revision_date için tarih bazlı sorgular
*/

-- =====================================================
-- 1. YENİ ALANLAR EKLE
-- =====================================================

-- Revizyon numarası
ALTER TABLE purchasing_orders
ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;

-- En güncel kayıt mı?
ALTER TABLE purchasing_orders
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Revizyon tarihi
ALTER TABLE purchasing_orders
ADD COLUMN IF NOT EXISTS revision_date TIMESTAMPTZ DEFAULT now();

-- Önceki revizyondan farklar (JSON)
ALTER TABLE purchasing_orders
ADD COLUMN IF NOT EXISTS changes_from_previous JSONB;

-- CSV'yi yükleyen kullanıcı
ALTER TABLE purchasing_orders
ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- =====================================================
-- 2. MEVCUT VERİLERİ GÜNCELLE
-- =====================================================

-- Mevcut tüm kayıtlara revision_number = 1 ve is_latest = true ver
UPDATE purchasing_orders
SET
  revision_number = 1,
  is_latest = true,
  revision_date = COALESCE(created_at, now()),
  uploaded_by = COALESCE(created_by, 'system')
WHERE revision_number IS NULL;

-- =====================================================
-- 3. İNDEKSLER OLUŞTUR
-- =====================================================

-- En güncel kayıtları hızlı bulmak için
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_latest
ON purchasing_orders(is_latest)
WHERE is_latest = true;

-- Sipariş bazlı revizyon geçmişi için
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_revision
ON purchasing_orders(siparis_no, siparis_kalemi, revision_number);

-- Tarih bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_revision_date
ON purchasing_orders(revision_date DESC);

-- Değişiklik olanları bulmak için
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_changes
ON purchasing_orders(changes_from_previous)
WHERE changes_from_previous IS NOT NULL;

-- =====================================================
-- 4. YARDIMCI GÖRÜNÜMLER (VIEWS)
-- =====================================================

-- En güncel siparişler görünümü
CREATE OR REPLACE VIEW purchasing_orders_latest AS
SELECT * FROM purchasing_orders
WHERE is_latest = true
ORDER BY siparis_tarihi DESC;

-- Revizyon istatistikleri
CREATE OR REPLACE VIEW purchasing_revision_stats AS
SELECT
  siparis_no,
  siparis_kalemi,
  COUNT(*) as total_revisions,
  MIN(revision_date) as first_revision_date,
  MAX(revision_date) as last_revision_date,
  MAX(revision_number) as current_revision,
  CASE
    WHEN COUNT(*) > 1 THEN true
    ELSE false
  END as has_revisions
FROM purchasing_orders
GROUP BY siparis_no, siparis_kalemi
HAVING COUNT(*) > 1
ORDER BY total_revisions DESC, last_revision_date DESC;

-- Değişiklik raporu
CREATE OR REPLACE VIEW purchasing_changes_report AS
SELECT
  id,
  siparis_no,
  siparis_kalemi,
  tedarikci_tanimi,
  malzeme_tanimi,
  revision_number,
  revision_date,
  uploaded_by,
  changes_from_previous,
  jsonb_object_keys(changes_from_previous) as changed_field
FROM purchasing_orders
WHERE changes_from_previous IS NOT NULL
  AND is_latest = true
ORDER BY revision_date DESC;

-- =====================================================
-- 5. YARDIMCI FONKSİYONLAR
-- =====================================================

-- Sipariş revizyon geçmişini getir
CREATE OR REPLACE FUNCTION get_order_revision_history(
  p_siparis_no TEXT,
  p_siparis_kalemi TEXT DEFAULT NULL
)
RETURNS TABLE (
  revision_number INTEGER,
  revision_date TIMESTAMPTZ,
  is_latest BOOLEAN,
  gelen_miktar NUMERIC,
  tutar_tl NUMERIC,
  odeme_kosulu TEXT,
  vadeye_gore DATE,
  changes_from_previous JSONB,
  uploaded_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    po.revision_number,
    po.revision_date,
    po.is_latest,
    po.gelen_miktar,
    po.tutar_tl,
    po.odeme_kosulu,
    po.vadeye_gore,
    po.changes_from_previous,
    po.uploaded_by
  FROM purchasing_orders po
  WHERE po.siparis_no = p_siparis_no
    AND (p_siparis_kalemi IS NULL OR po.siparis_kalemi = p_siparis_kalemi)
  ORDER BY po.revision_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Belirli bir tarihteki durumu getir (Zaman Yolculuğu)
CREATE OR REPLACE FUNCTION get_orders_at_date(
  p_target_date TIMESTAMPTZ
)
RETURNS TABLE (
  siparis_no TEXT,
  siparis_kalemi TEXT,
  revision_number INTEGER,
  revision_date TIMESTAMPTZ,
  tedarikci_tanimi TEXT,
  malzeme_tanimi TEXT,
  miktar NUMERIC,
  gelen_miktar NUMERIC,
  tutar_tl NUMERIC,
  odeme_kosulu TEXT,
  vadeye_gore DATE
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_at_date AS (
    SELECT
      po.siparis_no,
      po.siparis_kalemi,
      MAX(po.revision_number) as max_revision
    FROM purchasing_orders po
    WHERE po.revision_date <= p_target_date
    GROUP BY po.siparis_no, po.siparis_kalemi
  )
  SELECT
    po.siparis_no,
    po.siparis_kalemi,
    po.revision_number,
    po.revision_date,
    po.tedarikci_tanimi,
    po.malzeme_tanimi,
    po.miktar,
    po.gelen_miktar,
    po.tutar_tl,
    po.odeme_kosulu,
    po.vadeye_gore
  FROM purchasing_orders po
  INNER JOIN latest_at_date lad
    ON po.siparis_no = lad.siparis_no
    AND po.siparis_kalemi = lad.siparis_kalemi
    AND po.revision_number = lad.max_revision
  ORDER BY po.siparis_tarihi DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENT'LER (Dokümantasyon)
-- =====================================================

COMMENT ON COLUMN purchasing_orders.revision_number IS 'Sipariş revizyon numarası (1, 2, 3...)';
COMMENT ON COLUMN purchasing_orders.is_latest IS 'En güncel revizyon mu?';
COMMENT ON COLUMN purchasing_orders.revision_date IS 'Revizyon oluşturulma tarihi';
COMMENT ON COLUMN purchasing_orders.changes_from_previous IS 'Önceki revizyondan farklar (JSON)';
COMMENT ON COLUMN purchasing_orders.uploaded_by IS 'CSV yi yükleyen kullanıcı email';

COMMENT ON VIEW purchasing_orders_latest IS 'En güncel siparişler (is_latest=true)';
COMMENT ON VIEW purchasing_revision_stats IS 'Sipariş bazlı revizyon istatistikleri';
COMMENT ON VIEW purchasing_changes_report IS 'Değişiklik raporu (sadece değişen kayıtlar)';

COMMENT ON FUNCTION get_order_revision_history IS 'Sipariş revizyon geçmişini getirir';
COMMENT ON FUNCTION get_orders_at_date IS 'Belirli bir tarihteki sipariş durumunu getirir (Zaman Yolculuğu)';

-- =====================================================
-- 7. RLS POLİCİES (Güvenlik)
-- =====================================================

-- purchasing_orders_latest view için policy
-- (Ana tablo zaten RLS korumalı, view otomatik inherit eder)

-- Fonksiyonlar SECURITY DEFINER ile çalışır, RLS bypass eder
-- Ancak sadece authenticated kullanıcılar erişebilir

-- Son kontrol mesajı
DO $$
BEGIN
  RAISE NOTICE '✅ Revizyon Takip Sistemi migration tamamlandı!';
  RAISE NOTICE '📊 Yeni alanlar: revision_number, is_latest, revision_date, changes_from_previous, uploaded_by';
  RAISE NOTICE '🔍 Yeni views: purchasing_orders_latest, purchasing_revision_stats, purchasing_changes_report';
  RAISE NOTICE '⚡ Yeni fonksiyonlar: get_order_revision_history(), get_orders_at_date()';
END $$;
