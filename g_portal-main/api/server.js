const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Admin Client (Service Role Key ile)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Normal Supabase Client (Anon Key ile - doğrulama için)
const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware: Token doğrulama ve admin kontrolü
async function requireAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Yetkilendirme başlığı bulunamadı' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Token'ı doğrula
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Geçersiz token' });
    }

    // Admin kontrolü
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için admin yetkisi gereklidir' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware hatası:', err);
    res.status(500).json({ error: 'Yetkilendirme hatası' });
  }
}

// ====== API ENDPOINTS ======

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Glohe Portal API çalışıyor' });
});

// Tüm kullanıcıları listele (Sadece Admin)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    // 1. Supabase Auth'dan tüm kullanıcıları al
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Auth kullanıcıları hatası:', authError);
      return res.status(500).json({ error: 'Kullanıcılar yüklenemedi: ' + authError.message });
    }

    // 2. user_roles tablosundan rolleri al
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Roller yüklenemedi:', rolesError);
    }

    // 3. Rolleri email ile eşleştir
    const rolesMap = {};
    (userRoles || []).forEach(ur => {
      rolesMap[ur.email] = { role: ur.role, id: ur.id };
    });

    // 4. Kullanıcıları formatla
    const users = authUsers.map(user => ({
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: rolesMap[user.email]?.role || 'full',
      role_id: rolesMap[user.email]?.id || null
    }));

    res.json({ users });
  } catch (err) {
    console.error('Kullanıcı listesi hatası:', err);
    res.status(500).json({ error: 'Beklenmeyen hata oluştu' });
  }
});

// Kullanıcı rolünü güncelle (Sadece Admin)
app.post('/api/users/update-role', requireAdmin, async (req, res) => {
  try {
    const { email, role, roleId } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email ve rol gereklidir' });
    }

    if (!['admin', 'executive', 'full', 'restricted'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol' });
    }

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
      console.error('Rol güncelleme hatası:', result.error);
      return res.status(500).json({ error: 'Rol güncellenemedi: ' + result.error.message });
    }

    // Log kaydı
    await supabaseAdmin.from('logs').insert([{
      user_email: req.user.email,
      action: 'USER_ROLE_UPDATE',
      category: 'UserManagement',
      details: { target_user: email, new_role: role }
    }]);

    res.json({
      success: true,
      message: `${email} kullanıcısının rolü güncellendi: ${role}`
    });
  } catch (err) {
    console.error('Rol güncelleme hatası:', err);
    res.status(500).json({ error: 'Beklenmeyen hata oluştu' });
  }
});

// Server başlat
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Glohe Portal API ${PORT} portunda çalışıyor`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
