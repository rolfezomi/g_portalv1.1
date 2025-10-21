-- =====================================================
-- REVİZYON GRUPLAMA DÜZELTMESİ
-- =====================================================
-- Aynı sipariş numarası ama farklı tip/tedarikçi olan siparişler
-- artık ayrı siparişler olarak sayılacak, revizyon olarak değil.

-- purchasing_revision_stats VIEW'ini güncelle
-- Artık: siparis_no + siparis_kalemi + siparis_tip + tedarikci_kodu
DROP VIEW IF EXISTS purchasing_revision_stats;

CREATE OR REPLACE VIEW purchasing_revision_stats AS
SELECT
  siparis_no,
  siparis_kalemi,
  siparis_tip,
  tedarikci_kodu,
  tedarikci_tanimi,
  COUNT(*) as total_revisions,
  MIN(revision_date) as first_revision_date,
  MAX(revision_date) as last_revision_date,
  MAX(revision_number) as current_revision,
  CASE
    WHEN COUNT(*) > 1 THEN true
    ELSE false
  END as has_revisions
FROM purchasing_orders
GROUP BY siparis_no, siparis_kalemi, siparis_tip, tedarikci_kodu, tedarikci_tanimi
HAVING COUNT(*) > 1
ORDER BY total_revisions DESC, last_revision_date DESC;

COMMENT ON VIEW purchasing_revision_stats IS 'Sipariş bazlı revizyon istatistikleri (siparis_no + siparis_kalemi + siparis_tip + tedarikci_kodu)';

-- İndeksleri güncelle
DROP INDEX IF EXISTS idx_purchasing_orders_revision;

CREATE INDEX IF NOT EXISTS idx_purchasing_orders_revision_full
ON purchasing_orders(siparis_no, siparis_kalemi, siparis_tip, tedarikci_kodu, revision_number);

-- get_order_revision_history fonksiyonunu güncelle
DROP FUNCTION IF EXISTS get_order_revision_history(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_order_revision_history(TEXT, TEXT, TEXT, TEXT);

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
  ORDER BY po.revision_number DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_order_revision_history IS 'Sipariş revizyon geçmişini getirir (siparis_no + siparis_kalemi + siparis_tip + tedarikci_kodu)';

-- get_orders_at_date fonksiyonunu güncelle
DROP FUNCTION IF EXISTS get_orders_at_date(TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_orders_at_date(
  p_target_date TIMESTAMPTZ
)
RETURNS TABLE (
  siparis_no TEXT,
  siparis_kalemi TEXT,
  siparis_tip TEXT,
  tedarikci_kodu TEXT,
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
      po.siparis_tip,
      po.tedarikci_kodu,
      MAX(po.revision_number) as max_revision
    FROM purchasing_orders po
    WHERE po.revision_date <= p_target_date
    GROUP BY po.siparis_no, po.siparis_kalemi, po.siparis_tip, po.tedarikci_kodu
  )
  SELECT
    po.siparis_no,
    po.siparis_kalemi,
    po.siparis_tip,
    po.tedarikci_kodu,
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
    AND (po.siparis_kalemi = lad.siparis_kalemi OR (po.siparis_kalemi IS NULL AND lad.siparis_kalemi IS NULL))
    AND (po.siparis_tip = lad.siparis_tip OR (po.siparis_tip IS NULL AND lad.siparis_tip IS NULL))
    AND (po.tedarikci_kodu = lad.tedarikci_kodu OR (po.tedarikci_kodu IS NULL AND lad.tedarikci_kodu IS NULL))
    AND po.revision_number = lad.max_revision
  ORDER BY po.siparis_tarihi DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_orders_at_date IS 'Belirli bir tarihteki sipariş durumunu getirir (siparis_no + siparis_kalemi + siparis_tip + tedarikci_kodu)';

-- Son kontrol mesajı
DO $$
BEGIN
  RAISE NOTICE '✅ Revizyon gruplama düzeltmesi tamamlandı!';
  RAISE NOTICE '🔧 purchasing_revision_stats VIEW güncellendi: siparis_no + siparis_kalemi + siparis_tip + tedarikci_kodu';
  RAISE NOTICE '🔧 get_order_revision_history() fonksiyonu güncellendi';
  RAISE NOTICE '🔧 get_orders_at_date() fonksiyonu güncellendi';
  RAISE NOTICE '📝 Artık aynı sipariş no, farklı tip/tedarikçi = ayrı sipariş';
END $$;
