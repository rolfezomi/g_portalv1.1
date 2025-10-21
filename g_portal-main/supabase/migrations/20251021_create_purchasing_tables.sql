/*
  # Satın Alma Modülü - Database Migration

  Bu migration dosyası satın alma modülü için gerekli tabloları oluşturur.

  ## Yeni Tablolar

  1. purchasing_orders
    - Satın alma siparişlerini saklar
    - CSV'den yüklenen veya manuel girilen siparişler
    - Tedarikçi, malzeme, finansal bilgiler

  2. purchasing_suppliers
    - Tedarikçi ana bilgilerini saklar
    - purchasing_orders ile ilişkilidir

  ## Güvenlik
    - RLS (Row Level Security) etkin
    - Sadece 'purchasing' ve 'admin' rolü erişebilir
*/

-- =====================================================
-- 1. PURCHASING_ORDERS TABLOSU
-- =====================================================

CREATE TABLE IF NOT EXISTS purchasing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sipariş Bilgileri
  teslimat text,
  baslama text,
  firma text,
  siparis_tip text,
  siparis_no text,
  siparis_tarihi date,
  siparis_kalemi text,

  -- Malzeme Bilgileri
  malzeme text,
  malzeme_tanimi text,
  birim text,
  depo text,
  malzeme_grubu text,
  marka text,

  -- Tedarikçi Bilgileri
  tedarikci_kodu text,
  tedarikci_tanimi text,

  -- Tarih Bilgileri
  teslim_tarihi date,
  istek_teslim_tarihi date,
  vadeye_gore date,

  -- Miktar Bilgileri
  ozel_stok text,
  miktar numeric,
  gelen_miktar numeric,
  fark numeric,
  depo_fark numeric,

  -- Finansal Bilgiler
  birim_fiyat numeric,
  brut numeric,
  net numeric,
  kur text,
  kdv_orani numeric,
  tutar_tl numeric,
  vade_gun numeric,

  -- Ödeme ve İstek Bilgileri
  odeme_kosulu text,
  istek_tipi text,
  istek_no text,

  -- Diğer
  aciklama text,
  bu_hafta text,
  bu_ay text,
  tip text,

  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,  -- Email olarak saklanacak
  updated_by text   -- Email olarak saklanacak
);

-- İndeksler (Performans için)
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_siparis_no ON purchasing_orders(siparis_no);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_tedarikci_kodu ON purchasing_orders(tedarikci_kodu);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_tedarikci_tanimi ON purchasing_orders(tedarikci_tanimi);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_teslim_tarihi ON purchasing_orders(teslim_tarihi);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_vadeye_gore ON purchasing_orders(vadeye_gore);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_odeme_kosulu ON purchasing_orders(odeme_kosulu);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_malzeme ON purchasing_orders(malzeme);
CREATE INDEX IF NOT EXISTS idx_purchasing_orders_created_at ON purchasing_orders(created_at);

-- =====================================================
-- 2. PURCHASING_SUPPLIERS TABLOSU (Tedarikçiler)
-- =====================================================

CREATE TABLE IF NOT EXISTS purchasing_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tedarikçi Bilgileri
  tedarikci_kodu text UNIQUE NOT NULL,
  tedarikci_tanimi text NOT NULL,

  -- İletişim Bilgileri
  vergi_no text,
  telefon text,
  email text,
  adres text,
  sehir text,
  ulke text,

  -- Finansal Bilgiler
  varsayilan_odeme_kosulu text,
  varsayilan_vade_gun integer,

  -- Durum
  aktif boolean DEFAULT true,
  notlar text,

  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,  -- Email olarak saklanacak
  updated_by text   -- Email olarak saklanacak
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_purchasing_suppliers_kodu ON purchasing_suppliers(tedarikci_kodu);
CREATE INDEX IF NOT EXISTS idx_purchasing_suppliers_tanimi ON purchasing_suppliers(tedarikci_tanimi);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLİCİES
-- =====================================================

-- purchasing_orders için RLS
ALTER TABLE purchasing_orders ENABLE ROW LEVEL SECURITY;

-- Admin ve purchasing rolü tüm kayıtları görüntüleyebilir
CREATE POLICY "purchasing_orders_select_policy"
  ON purchasing_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  );

-- Admin ve purchasing rolü yeni kayıt ekleyebilir
CREATE POLICY "purchasing_orders_insert_policy"
  ON purchasing_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  );

-- Admin ve purchasing rolü kayıtları güncelleyebilir
CREATE POLICY "purchasing_orders_update_policy"
  ON purchasing_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  );

-- Sadece admin silebilir
CREATE POLICY "purchasing_orders_delete_policy"
  ON purchasing_orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND user_roles.role = 'admin'
    )
  );

-- purchasing_suppliers için RLS
ALTER TABLE purchasing_suppliers ENABLE ROW LEVEL SECURITY;

-- Admin ve purchasing rolü tedarikçileri görüntüleyebilir
CREATE POLICY "purchasing_suppliers_select_policy"
  ON purchasing_suppliers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  );

-- Admin ve purchasing rolü tedarikçi ekleyebilir
CREATE POLICY "purchasing_suppliers_insert_policy"
  ON purchasing_suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  );

-- Admin ve purchasing rolü tedarikçi güncelleyebilir
CREATE POLICY "purchasing_suppliers_update_policy"
  ON purchasing_suppliers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND (
        user_roles.role = 'admin'
        OR user_roles.role = 'purchasing'
      )
    )
  );

-- Sadece admin tedarikçi silebilir
CREATE POLICY "purchasing_suppliers_delete_policy"
  ON purchasing_suppliers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.email = auth.jwt() ->> 'email'
      AND user_roles.role = 'admin'
    )
  );

-- =====================================================
-- 4. UPDATED_AT TETİKLEYİCİLERİ
-- =====================================================

-- updated_at otomatik güncelleme fonksiyonu (eğer yoksa oluştur)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- purchasing_orders için tetikleyici
CREATE TRIGGER update_purchasing_orders_updated_at
  BEFORE UPDATE ON purchasing_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- purchasing_suppliers için tetikleyici
CREATE TRIGGER update_purchasing_suppliers_updated_at
  BEFORE UPDATE ON purchasing_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. YARDIMCI GÖRÜNÜMLER (VIEWS)
-- =====================================================

-- Tedarikçi bazlı sipariş özeti
CREATE OR REPLACE VIEW purchasing_supplier_summary AS
SELECT
  tedarikci_kodu,
  tedarikci_tanimi,
  COUNT(*) as siparis_sayisi,
  SUM(tutar_tl) as toplam_tutar_tl,
  AVG(vade_gun) as ortalama_vade_gun,
  MAX(teslim_tarihi) as son_teslim_tarihi
FROM purchasing_orders
WHERE tedarikci_kodu IS NOT NULL
GROUP BY tedarikci_kodu, tedarikci_tanimi;

-- Aylık sipariş özeti
CREATE OR REPLACE VIEW purchasing_monthly_summary AS
SELECT
  DATE_TRUNC('month', siparis_tarihi) as ay,
  COUNT(*) as siparis_sayisi,
  SUM(tutar_tl) as toplam_tutar_tl,
  COUNT(DISTINCT tedarikci_kodu) as tedarikci_sayisi
FROM purchasing_orders
WHERE siparis_tarihi IS NOT NULL
GROUP BY DATE_TRUNC('month', siparis_tarihi)
ORDER BY ay DESC;

-- =====================================================
-- 6. COMMENT'LER (Dokümantasyon)
-- =====================================================

COMMENT ON TABLE purchasing_orders IS 'Satın alma siparişleri - CSV yükleme veya manuel giriş';
COMMENT ON TABLE purchasing_suppliers IS 'Tedarikçi ana bilgileri';
COMMENT ON VIEW purchasing_supplier_summary IS 'Tedarikçi bazlı sipariş özet raporu';
COMMENT ON VIEW purchasing_monthly_summary IS 'Aylık sipariş özet raporu';
