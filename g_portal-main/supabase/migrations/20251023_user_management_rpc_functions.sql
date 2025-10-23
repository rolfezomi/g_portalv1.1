-- Kullanıcı Yönetimi RPC Functions
-- Netlify Functions yerine direkt Supabase'den kullanıcıları yönetmek için

-- 1. Tüm kullanıcıları + rolleri getiren function
-- Auth tablosundan tüm kullanıcıları, user_roles ile birleştirerek getirir
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role text,
  role_id bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    COALESCE(ur.role, 'full')::text as role,
    ur.id as role_id
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.email = ur.email
  ORDER BY au.created_at DESC;
END;
$$;

-- 2. Kullanıcı rolünü güncelleyen function
-- Var olan rolü günceller veya yeni rol kaydı oluşturur
CREATE OR REPLACE FUNCTION update_user_role(
  p_email text,
  p_role text,
  p_role_id bigint DEFAULT NULL
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result json;
  v_caller_email text;
  v_caller_role text;
BEGIN
  -- Çağıran kullanıcının email'ini al
  SELECT email INTO v_caller_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Çağıran kullanıcının rolünü kontrol et
  SELECT role INTO v_caller_role
  FROM public.user_roles
  WHERE email = v_caller_email;

  -- Sadece admin kullanıcılar rol güncelleyebilir
  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bu işlem için admin yetkisi gereklidir'
    );
  END IF;

  -- Eğer role_id varsa güncelle, yoksa yeni kayıt ekle
  IF p_role_id IS NOT NULL THEN
    UPDATE public.user_roles
    SET role = p_role, updated_at = now()
    WHERE id = p_role_id;
  ELSE
    INSERT INTO public.user_roles (email, role)
    VALUES (p_email, p_role)
    ON CONFLICT (email)
    DO UPDATE SET role = EXCLUDED.role, updated_at = now();
  END IF;

  v_result := json_build_object(
    'success', true,
    'message', p_email || ' kullanıcısının rolü ' || p_role || ' olarak güncellendi'
  );

  RETURN v_result;
END;
$$;

-- RPC functions için yorum ekle
COMMENT ON FUNCTION get_all_users_with_roles() IS 'Tüm auth kullanıcılarını rolleriyle birlikte getirir. SECURITY DEFINER ile çalışır.';
COMMENT ON FUNCTION update_user_role(text, text, bigint) IS 'Kullanıcı rolünü günceller. Sadece admin kullanıcılar çalıştırabilir.';
