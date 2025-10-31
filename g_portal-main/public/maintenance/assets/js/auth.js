/**
 * Glohe Bakım Yönetim Sistemi - Authentication Module
 * Kullanıcı kimlik doğrulama ve yetkilendirme
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.session = null;
    this.initialized = false;
  }

  /**
   * Auth yöneticisini başlat
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // Mevcut oturumu kontrol et
      const { data: { session }, error } = await supabaseClient.getClient().auth.getSession();

      if (error) throw error;

      if (session) {
        this.session = session;
        this.currentUser = session.user;
        console.log('✅ User authenticated:', this.currentUser.email);
      } else {
        console.log('⚠️ No active session in maintenance module');

        // Ana portaldan session olup olmadığını kontrol et
        // Supabase session localStorage'da otomatik saklanır
        // Bir süre bekleyip tekrar deneyelim (async yükleme için)
        await new Promise(resolve => setTimeout(resolve, 500));

        const { data: { session: retrySession } } = await supabaseClient.getClient().auth.getSession();

        if (retrySession) {
          this.session = retrySession;
          this.currentUser = retrySession.user;
          console.log('✅ Session found on retry:', this.currentUser.email);
        } else {
          console.log('❌ No session found, redirecting to login');
          this.redirectToLogin();
          return;
        }
      }

      // Auth state değişikliklerini dinle
      supabaseClient.getClient().auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN') {
          this.session = session;
          this.currentUser = session.user;
          this.saveSession();
        } else if (event === 'SIGNED_OUT') {
          this.clearSession();
          this.redirectToLogin();
        } else if (event === 'TOKEN_REFRESHED') {
          this.session = session;
          this.saveSession();
        }
      });

      this.initialized = true;
      return this.currentUser;
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.redirectToLogin();
    }
  }

  /**
   * Oturum bilgilerini kaydet
   */
  saveSession() {
    if (this.session) {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, this.session.access_token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.currentUser));
      } catch (error) {
        console.error('Session save error:', error);
      }
    }
  }

  /**
   * Oturum bilgilerini temizle
   */
  clearSession() {
    this.currentUser = null;
    this.session = null;
    try {
      // Tüm localStorage'ı temizle
      localStorage.clear();

      // SessionStorage'ı da temizle
      sessionStorage.clear();

      console.log('✅ Tüm session bilgileri temizlendi');
    } catch (error) {
      console.error('Session clear error:', error);
    }
  }

  /**
   * Login sayfasına yönlendir
   */
  redirectToLogin() {
    // Inactivity timer'ı durdur
    this.stopInactivityTimer();

    // Ana portal login sayfasına git (cache'i atla)
    window.location.replace('/');
  }

  /**
   * Çıkış yap
   */
  async logout() {
    try {
      console.log('🚪 Logout işlemi başlatılıyor...');

      // Supabase'den çıkış yap (global scope'tan)
      const { error } = await supabaseClient.getClient().auth.signOut({ scope: 'global' });

      if (error) {
        console.warn('Supabase logout warning:', error);
      }

      // Tüm session bilgilerini temizle
      this.clearSession();

      console.log('✅ Logout başarılı, login sayfasına yönlendiriliyor...');

      // Login sayfasına yönlendir
      this.redirectToLogin();
    } catch (error) {
      console.error('Logout error:', error);
      // Hata olsa bile session'ı temizle ve yönlendir
      this.clearSession();
      this.redirectToLogin();
    }
  }

  /**
   * Mevcut kullanıcıyı al
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Kullanıcı ID'sini al
   */
  getCurrentUserId() {
    return this.currentUser ? this.currentUser.id : null;
  }

  /**
   * Kullanıcı email'ini al
   */
  getCurrentUserEmail() {
    return this.currentUser ? this.currentUser.email : null;
  }

  /**
   * Kullanıcı adını al (metadata'dan)
   */
  getCurrentUserName() {
    if (!this.currentUser) return 'Kullanıcı';

    // Metadata'dan ad al
    const metadata = this.currentUser.user_metadata || {};
    return metadata.full_name || metadata.name || this.currentUser.email.split('@')[0];
  }

  /**
   * Kullanıcı profil resmini al
   */
  getCurrentUserAvatar() {
    if (!this.currentUser) return null;

    const metadata = this.currentUser.user_metadata || {};
    return metadata.avatar_url || null;
  }

  /**
   * Kullanıcının bakım yapma yetkisi var mı?
   */
  canPerformMaintenance() {
    // Şimdilik tüm authenticated kullanıcılar bakım yapabilir
    // İleride role tabanlı kontrol eklenebilir
    return this.currentUser !== null;
  }

  /**
   * Kullanıcının yönetim yetkisi var mı?
   */
  canManage() {
    // Şimdilik tüm authenticated kullanıcılar yönetebilir
    // İleride role tabanlı kontrol eklenebilir
    return this.currentUser !== null;
  }

  /**
   * Authenticated mi kontrol et
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Session token'ı al
   */
  getToken() {
    return this.session ? this.session.access_token : null;
  }

  /**
   * Kullanıcı bilgilerini güncelle
   */
  async updateUserProfile(updates) {
    try {
      const { data, error } = await supabaseClient.getClient().auth.updateUser({
        data: updates
      });

      if (error) throw error;

      this.currentUser = data.user;
      this.saveSession();

      return data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  /**
   * Kullanıcının son aktivitesini kaydet
   */
  recordActivity() {
    if (this.currentUser) {
      const lastActivity = new Date().toISOString();
      try {
        localStorage.setItem('last_activity', lastActivity);
      } catch (error) {
        console.error('Activity record error:', error);
      }
    }
  }

  /**
   * Boşta kalma süresini kontrol et (15 dakika)
   */
  checkInactivity() {
    try {
      const lastActivity = localStorage.getItem('last_activity');
      if (!lastActivity) return false;

      const lastTime = new Date(lastActivity).getTime();
      const now = new Date().getTime();
      const diffMinutes = (now - lastTime) / (1000 * 60);

      // 15 dakika boşta kaldıysa
      if (diffMinutes > 15) {
        console.log('⚠️ User inactive for 15+ minutes');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Inactivity check error:', error);
      return false;
    }
  }

  /**
   * Auto-logout timer başlat (15 dakika inaktivite)
   */
  startInactivityTimer() {
    // Her 1 dakikada bir kontrol et
    this.inactivityInterval = setInterval(() => {
      if (this.checkInactivity()) {
        console.log('🔒 Auto-logout due to inactivity');
        this.logout();
      }
    }, 60000); // 1 dakika

    // Kullanıcı aktivitelerini kaydet
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.recordActivity();
      }, { passive: true });
    });
  }

  /**
   * Inactivity timer'ı durdur
   */
  stopInactivityTimer() {
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
    }
  }
}

// Singleton instance
const authManager = new AuthManager();

// Global'e bağla
window.authManager = authManager;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = authManager;
}
