-- =====================================================
-- REVİZYON BENZERSİZ ANAHTAR GÜNCELLEMESİ
-- =====================================================
-- Sipariş Tip ve Tedarikçi Kodu da benzersiz anahtar parçası olmalı
-- 
-- Önceki: siparis_no + siparis_kalemi
-- Yeni: siparis_no + siparis_kalemi + siparis_tip + tedarikci_kodu
--
-- Örnek:
-- Sipariş #12345, Tip: "Normal", Tedarikçi: "ABC"  -> Ayrı kayıt
-- Sipariş #12345, Tip: "Acil",   Tedarikçi: "ABC"  -> Ayrı kayıt
-- Sipariş #12345, Tip: "Normal", Tedarikçi: "XYZ"  -> Ayrı kayıt

-- =====================================================
-- 1. get_order_revision_history FONKSİYONU GÜNCELLEMESİ
-- =====================================================

DROP FUNCTION IF EXISTS get_order_revision_history(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_order_revision_history(
  p_siparis_no TEXT,
  p_siparis_kalemi TEXT DEFAULT NULL,
  p_siparis_tip TEXT DEFAULT NULL,
  p_tedarikci_kodu TEXT DEFAULT NULL
)
RETURNS TABLE (
  revision_number INTEGER,
  revision_date TIMESTAMPTZ,
  is_latest BOOLEAN,
  siparis_tip TEXT,
  tedarikci_kodu TEXT,
  tedarikci_tanimi TEXT,
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
    po.siparis_tip,
    po.tedarikci_kodu,
    po.tedarikci_tanimi,
    po.gelen_miktar,
    po.tutar_tl,
    po.odeme_kosulu,
    po.vadeye_gore,
    po.changes_from_previous,
    po.uploaded_by
  FROM purchasing_orders po
  WHERE po.siparis_no = p_siparis_no
    AND (p_siparis_kalemi IS NULL OR po.siparis_kalemi = p_siparis_kalemi)
    AND (p_siparis_tip IS NULL OR po.siparis_tip = p_siparis_tip)
    AND (p_tedarikci_kodu IS NULL OR po.tedarikci_kodu = p_tedarikci_kodu)
  ORDER BY po.revision_number ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_order_revision_history IS 
'Belirli bir siparişin tüm revizyonlarını getirir. 
Sipariş No, Kalem, Tip ve Tedarikçi Koduna göre filtreleme yapar.';

-- =====================================================
-- 2. İNDEKS EKLEMELERİ
-- =====================================================

-- Sipariş Tip için indeks
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_siparis_tip 
ON purchasing_orders(siparis_tip) 
WHERE is_latest = true;

-- Tedarikçi Kodu için indeks
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_tedarikci_kodu 
ON purchasing_orders(tedarikci_kodu) 
WHERE is_latest = true;

-- Composite indeks: Benzersiz anahtar için
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_unique_key 
ON purchasing_orders(siparis_no, siparis_kalemi, siparis_tip, tedarikci_kodu, is_latest);

COMMENT ON INDEX idx_purchasing_orders_unique_key IS 
'Benzersiz sipariş anahtarı: No + Kalem + Tip + Tedarikçi + Latest bayrağı';

-- =====================================================
-- 3. VERİ DOĞRULAMA
-- =====================================================

-- Kaç farklı sipariş tipi var?
SELECT 
  'Sipariş Tipleri' as analiz,
  COUNT(DISTINCT siparis_tip) as farkli_tip,
  string_agg(DISTINCT siparis_tip, ', ') as tipler
FROM purchasing_orders
WHERE is_latest = true;

-- Aynı sipariş no'da farklı tipler var mı?
SELECT 
  'Aynı Sipariş No, Farklı Tip' as analiz,
  COUNT(*) as kayit_sayisi
FROM (
  SELECT siparis_no, COUNT(DISTINCT siparis_tip) as tip_sayisi
  FROM purchasing_orders
  WHERE is_latest = true
  GROUP BY siparis_no
  HAVING COUNT(DISTINCT siparis_tip) > 1
) sub;

SELECT '✅ Revizyon benzersiz anahtar güncellendi: siparis_no + kalemi + tip + tedarikci' as mesaj;
