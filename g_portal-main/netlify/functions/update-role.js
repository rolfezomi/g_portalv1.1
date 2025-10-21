const { createClient } = require('@supabase/supabase-js');

// Supabase Admin Client
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

// Normal Supabase Client
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
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return { error: 'Geçersiz token', status: 401 };
    }

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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Yetkilendirme başlığı bulunamadı' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const authResult = await requireAdmin(token);

    if (authResult.error) {
      return {
        statusCode: authResult.status,
        headers,
        body: JSON.stringify({ error: authResult.error })
      };
    }

    const { email, role, roleId } = JSON.parse(event.body);

    if (!email || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email ve rol gereklidir' })
      };
    }

    if (!['admin', 'purchasing', 'executive', 'full', 'restricted'].includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Geçersiz rol' })
      };
    }

    const supabaseAdmin = getSupabaseAdmin();

    let result;
    if (roleId) {
      // Güncelle
      result = await supabaseAdmin
        .from('user_roles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', roleId);
    } else {
      // Yeni kayıt ekle
      result = await supabaseAdmin
        .from('user_roles')
        .insert([{ email, role }]);
    }

    if (result.error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Rol güncellenemedi: ' + result.error.message })
      };
    }

    // Log kaydı
    await supabaseAdmin.from('logs').insert([{
      user_email: authResult.user.email,
      action: 'USER_ROLE_UPDATE',
      category: 'UserManagement',
      details: { target_user: email, new_role: role }
    }]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `${email} kullanıcısının rolü güncellendi: ${role}`
      })
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
