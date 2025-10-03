const { createClient } = require('@supabase/supabase-js');

// Supabase Admin Client (Service Role Key ile)
const getSupabaseAdmin = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Normal Supabase Client (Token doğrulama için)
const getSupabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
};

// Token doğrulama ve admin kontrolü
async function requireAdmin(token) {
  const supabaseClient = getSupabaseClient();

  try {
    // Token'ı doğrula
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return { error: 'Geçersiz token', status: 401 };
    }

    // Admin kontrolü
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return { error: 'Bu işlem için admin yetkisi gereklidir', status: 403 };
    }

    return { user, status: 200 };
  } catch (err) {
    console.error('Auth middleware hatası:', err);
    return { error: 'Yetkilendirme hatası', status: 500 };
  }
}

// Main handler
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS request için
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Authorization header kontrolü
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Yetkilendirme başlığı bulunamadı' })
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // Admin kontrolü
    const authResult = await requireAdmin(token);
    if (authResult.error) {
      return {
        statusCode: authResult.status,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const supabaseAdmin = getSupabaseAdmin();

    // GET: Kullanıcı listesi
    if (event.httpMethod === 'GET') {
      // Supabase Auth'dan tüm kullanıcıları al
      const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Kullanıcılar yüklenemedi: ' + authError.message })
        };
      }

      // user_roles tablosundan rolleri al
      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .select('*');

      // Rolleri email ile eşleştir
      const rolesMap = {};
      (userRoles || []).forEach(ur => {
        rolesMap[ur.email] = { role: ur.role, id: ur.id };
      });

      // Kullanıcıları formatla
      const users = authUsers.map(user => ({
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: rolesMap[user.email]?.role || 'full',
        role_id: rolesMap[user.email]?.id || null
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Beklenmeyen hata oluştu' })
    };
  }
};
