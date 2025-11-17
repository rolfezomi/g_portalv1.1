/*
  # Upload History Tracking System

  Bu migration dosyası Excel upload geçmişini takip etmek için
  gerekli tabloyu ve fonksiyonları oluşturur.

  ## Değişiklikler

  1. upload_history tablosu oluştur
  2. Upload history view fonksiyonu
  3. Günlük upload istatistikleri fonksiyonu
  4. RLS politikaları
*/

-- =====================================================
-- 1. UPLOAD_HISTORY TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS upload_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  user_role TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER, -- Bytes cinsinden
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- İstatistikler
  total_rows INTEGER NOT NULL DEFAULT 0,
  inserted_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  unchanged_rows INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,

  -- İşlem detayları
  processing_time_seconds DECIMAL(10, 2), -- Saniye cinsinden
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'failed', 'partial'
  error_message TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. INDEX'LER
-- =====================================================

-- Hızlı arama için index'ler
CREATE INDEX IF NOT EXISTS idx_upload_history_user_email ON upload_history(user_email);
CREATE INDEX IF NOT EXISTS idx_upload_history_upload_date ON upload_history(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON upload_history(status);
CREATE INDEX IF NOT EXISTS idx_upload_history_user_date ON upload_history(user_email, upload_date DESC);

-- =====================================================
-- 3. RLS (ROW LEVEL SECURITY) POLİTİKALARI
-- =====================================================

-- RLS'i etkinleştir
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

-- Admin: Tüm kayıtları görebilir
CREATE POLICY "Admin can view all upload history"
  ON upload_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND user_roles.role = 'admin'
    )
  );

-- Purchasing: Sadece kendi kayıtlarını görebilir
CREATE POLICY "Purchasing users can view own upload history"
  ON upload_history FOR SELECT
  USING (
    user_email = auth.jwt() ->> 'email'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND user_roles.role = 'purchasing'
    )
  );

-- Insert: Authenticated kullanıcılar ekleyebilir
CREATE POLICY "Authenticated users can insert upload history"
  ON upload_history FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'email' IS NOT NULL
  );

-- =====================================================
-- 4. GÜNLÜK UPLOAD İSTATİSTİKLERİ FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION get_today_upload_stats(user_email_param TEXT DEFAULT NULL)
RETURNS TABLE (
  total_uploads BIGINT,
  total_rows_processed BIGINT,
  total_inserted BIGINT,
  total_updated BIGINT,
  total_unchanged BIGINT,
  last_upload_time TIMESTAMPTZ,
  last_file_name TEXT,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_uploads,
    SUM(uh.total_rows)::BIGINT as total_rows_processed,
    SUM(uh.inserted_rows)::BIGINT as total_inserted,
    SUM(uh.updated_rows)::BIGINT as total_updated,
    SUM(uh.unchanged_rows)::BIGINT as total_unchanged,
    MAX(uh.upload_date) as last_upload_time,
    (SELECT file_name FROM upload_history WHERE upload_date = MAX(uh.upload_date) LIMIT 1) as last_file_name,
    ROUND(
      (COUNT(*) FILTER (WHERE uh.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate
  FROM upload_history uh
  WHERE
    -- Bugün yüklenenler
    DATE(uh.upload_date) = CURRENT_DATE
    -- Eğer user_email verilmişse, sadece o kullanıcının kayıtları
    AND (user_email_param IS NULL OR uh.user_email = user_email_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. SON 10 UPLOAD KAYDI FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION get_recent_uploads(limit_count INTEGER DEFAULT 10, user_email_param TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  user_email TEXT,
  file_name TEXT,
  upload_date TIMESTAMPTZ,
  total_rows INTEGER,
  inserted_rows INTEGER,
  updated_rows INTEGER,
  unchanged_rows INTEGER,
  processing_time_seconds DECIMAL,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uh.id,
    uh.user_email,
    uh.file_name,
    uh.upload_date,
    uh.total_rows,
    uh.inserted_rows,
    uh.updated_rows,
    uh.unchanged_rows,
    uh.processing_time_seconds,
    uh.status
  FROM upload_history uh
  WHERE
    -- Eğer user_email verilmişse, sadece o kullanıcının kayıtları
    (user_email_param IS NULL OR uh.user_email = user_email_param)
  ORDER BY uh.upload_date DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. KULLANICI BAZLI UPLOAD İSTATİSTİKLERİ VIEW
-- =====================================================

CREATE OR REPLACE VIEW user_upload_summary AS
SELECT
  uh.user_email,
  ur.role as user_role,
  COUNT(*) as total_uploads,
  SUM(uh.total_rows) as total_rows_processed,
  SUM(uh.inserted_rows) as total_inserted,
  SUM(uh.updated_rows) as total_updated,
  SUM(uh.unchanged_rows) as total_unchanged,
  MAX(uh.upload_date) as last_upload_date,
  AVG(uh.processing_time_seconds) as avg_processing_time,
  ROUND(
    (COUNT(*) FILTER (WHERE uh.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as success_rate
FROM upload_history uh
LEFT JOIN user_roles ur ON ur.email = uh.user_email
WHERE DATE(uh.upload_date) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY uh.user_email, ur.role
ORDER BY total_uploads DESC;

-- =====================================================
-- 7. COMMENT'LER
-- =====================================================

COMMENT ON TABLE upload_history IS 'Excel upload geçmişi ve istatistikleri';
COMMENT ON FUNCTION get_today_upload_stats IS 'Bugünün upload istatistiklerini döner';
COMMENT ON FUNCTION get_recent_uploads IS 'Son N adet upload kaydını döner';
COMMENT ON VIEW user_upload_summary IS 'Son 30 günün kullanıcı bazlı upload özeti';

-- =====================================================
-- 8. ÖRNEK KULLANIM SORGULARI
-- =====================================================

/*
-- Bugünün tüm upload istatistikleri
SELECT * FROM get_today_upload_stats();

-- Belirli bir kullanıcının bugünkü istatistikleri
SELECT * FROM get_today_upload_stats('user@example.com');

-- Son 10 upload kaydı
SELECT * FROM get_recent_uploads(10);

-- Belirli kullanıcının son 5 upload'ı
SELECT * FROM get_recent_uploads(5, 'user@example.com');

-- Tüm kullanıcıların son 30 günlük özeti
SELECT * FROM user_upload_summary;

-- Bugün kaç kez upload yapıldı?
SELECT COUNT(*) as upload_count
FROM upload_history
WHERE DATE(upload_date) = CURRENT_DATE;

-- En çok upload yapan kullanıcılar (son 7 gün)
SELECT
  user_email,
  COUNT(*) as upload_count,
  SUM(total_rows) as total_rows_processed
FROM upload_history
WHERE upload_date >= NOW() - INTERVAL '7 days'
GROUP BY user_email
ORDER BY upload_count DESC;
*/
