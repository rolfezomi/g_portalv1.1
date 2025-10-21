/*
  # User Roles Güncelleme - Satın Alma Modülü

  Bu migration dosyası user_roles tablosuna satın alma modülü için
  gerekli güncellemeleri yapar.

  ## Değişiklikler

  1. Yeni 'purchasing' rolü örnekleri ekle
  2. Admin kullanıcılara 'admin' role değerini ayarla

  ## Güvenlik
    - Mevcut veriler korunur
*/

-- =====================================================
-- 1. YENİ PURCHASING ROLÜ İÇİN ÖRNEKLER
-- =====================================================

-- Örnek purchasing kullanıcısı ekleme
-- NOT: Email adresini gerçek kullanıcınızın email'i ile değiştirin

/*
-- Satın alma kullanıcısı eklemek için:
INSERT INTO user_roles (email, role)
VALUES ('satinalma@sirketiniz.com', 'purchasing')
ON CONFLICT (email) DO UPDATE
SET role = 'purchasing';
*/

-- =====================================================
-- 2. MEVCUT ADMIN KULLANICILARI KONTROL ET
-- =====================================================

-- Admin kullanıcıları listele (kontrol için)
-- SELECT * FROM user_roles WHERE role = 'admin';

-- =====================================================
-- 3. YETKİ KONTROL FONKSİYONU
-- =====================================================

-- Kullanıcının bir modüle erişimi olup olmadığını kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION has_purchasing_access()
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

  -- Admin veya purchasing rolü varsa erişim var
  IF user_role = 'admin' OR user_role = 'purchasing' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. KULLANICI ROL BİLGİLERİNİ DÖNEN GÖRÜNÜM
-- =====================================================

CREATE OR REPLACE VIEW user_access_info AS
SELECT
  ur.id,
  ur.email,
  ur.role,
  CASE
    WHEN ur.role = 'admin' THEN ARRAY['measurements', 'purchasing', 'admin', 'users']
    WHEN ur.role = 'purchasing' THEN ARRAY['purchasing']
    WHEN ur.role = 'operator' THEN ARRAY['measurements']
    ELSE ARRAY[]::text[]
  END as accessible_modules,
  ur.created_at,
  ur.updated_at
FROM user_roles ur;

-- =====================================================
-- 5. COMMENT'LER
-- =====================================================

COMMENT ON FUNCTION has_purchasing_access IS 'Kullanıcının satın alma modülüne erişim yetkisi olup olmadığını kontrol eder';
COMMENT ON VIEW user_access_info IS 'Kullanıcı yetki bilgilerini ve erişilebilir modülleri listeler';

-- =====================================================
-- 6. ÖRNEK KULLANIM SORGULARI
-- =====================================================

/*
-- Tüm purchasing yetkisi olan kullanıcıları listele
SELECT * FROM user_access_info
WHERE 'purchasing' = ANY(accessible_modules);

-- Bir kullanıcının purchasing modülüne erişimi var mı kontrol et
SELECT has_purchasing_access();

-- Tüm kullanıcıların erişebileceği modülleri gör
SELECT email, role, accessible_modules FROM user_access_info;

-- Yeni purchasing kullanıcısı ekle
INSERT INTO user_roles (email, role)
VALUES ('yeni_kullanici@sirketiniz.com', 'purchasing')
ON CONFLICT (email) DO UPDATE
SET role = 'purchasing';

-- Mevcut bir kullanıcıya admin rolü ver
UPDATE user_roles
SET role = 'admin'
WHERE email = 'admin@sirketiniz.com';
*/
