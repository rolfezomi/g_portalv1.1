-- ============================================
-- BAKIM MODÜLÜ YETKİ SİSTEMİ
-- ============================================
-- Bu migration bakım yönetimi modülü için yetki sistemini oluşturur

-- =====================================================
-- 1. BAKIM MODÜLÜ ERİŞİM KONTROL FONKSİYONU
-- =====================================================

CREATE OR REPLACE FUNCTION has_maintenance_access()
RETURNS boolean AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  -- Kullanıcının email'ini al
  user_email := auth.jwt() ->> 'email';

  -- Eğer email yoksa erişim yok
  IF user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Kullanıcının rolünü al
  SELECT role INTO user_role
  FROM user_roles
  WHERE email = user_email;

  -- Admin veya maintenance rolü varsa erişim var
  IF user_role = 'admin' OR user_role = 'maintenance' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. BAKIM YÖNETİMİ ERİŞİM KONTROL FONKSİYONU
-- =====================================================
-- Sadece admin kullanıcılar makine ve periyot ekleyebilir

CREATE OR REPLACE FUNCTION has_maintenance_admin_access()
RETURNS boolean AS $$
DECLARE
  user_email text;
  user_role text;
BEGIN
  -- Kullanıcının email'ini al
  user_email := auth.jwt() ->> 'email';

  -- Eğer email yoksa erişim yok
  IF user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Kullanıcının rolünü al
  SELECT role INTO user_role
  FROM user_roles
  WHERE email = user_email;

  -- Sadece admin rolü varsa tam erişim var
  IF user_role = 'admin' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. USER ACCESS INFO VIEW GÜNCELLEMESİ
-- =====================================================

DROP VIEW IF EXISTS user_access_info;

CREATE OR REPLACE VIEW user_access_info AS
SELECT
  ur.id,
  ur.email,
  ur.role,
  CASE
    WHEN ur.role = 'admin' THEN ARRAY['measurements', 'purchasing', 'maintenance', 'admin', 'users']
    WHEN ur.role = 'purchasing' THEN ARRAY['purchasing']
    WHEN ur.role = 'maintenance' THEN ARRAY['maintenance']
    WHEN ur.role = 'operator' THEN ARRAY['measurements']
    ELSE ARRAY[]::text[]
  END as accessible_modules,
  ur.created_at,
  ur.updated_at
FROM user_roles ur;

-- =====================================================
-- 4. ÖRNEK MAINTENANCE KULLANICISI TEMPLATE
-- =====================================================

/*
-- Bakım modülü kullanıcısı eklemek için:
INSERT INTO user_roles (email, role)
VALUES ('bakim@sirketiniz.com', 'maintenance')
ON CONFLICT (email) DO UPDATE
SET role = 'maintenance';

-- Admin kullanıcısı eklemek için:
INSERT INTO user_roles (email, role)
VALUES ('admin@sirketiniz.com', 'admin')
ON CONFLICT (email) DO UPDATE
SET role = 'admin';
*/

-- =====================================================
-- 5. COMMENT'LER
-- =====================================================

COMMENT ON FUNCTION has_maintenance_access IS 'Kullanıcının bakım modülüne erişim yetkisi olup olmadığını kontrol eder (admin ve maintenance rolleri)';
COMMENT ON FUNCTION has_maintenance_admin_access IS 'Kullanıcının bakım yönetimi (makine/periyot ekleme) yetkisi olup olmadığını kontrol eder (sadece admin)';
COMMENT ON VIEW user_access_info IS 'Kullanıcı yetki bilgilerini ve erişilebilir modülleri listeler (maintenance modülü eklendi)';

-- =====================================================
-- 6. ÖRNEK KULLANIM SORGULARI
-- =====================================================

/*
-- Tüm maintenance yetkisi olan kullanıcıları listele
SELECT * FROM user_access_info
WHERE 'maintenance' = ANY(accessible_modules);

-- Bir kullanıcının maintenance modülüne erişimi var mı kontrol et
SELECT has_maintenance_access();

-- Bir kullanıcının maintenance admin yetkisi var mı kontrol et
SELECT has_maintenance_admin_access();

-- Tüm kullanıcıların erişebileceği modülleri gör
SELECT email, role, accessible_modules FROM user_access_info;

-- Mevcut bir kullanıcıya maintenance rolü ver
UPDATE user_roles
SET role = 'maintenance'
WHERE email = 'kullanici@sirketiniz.com';
*/
