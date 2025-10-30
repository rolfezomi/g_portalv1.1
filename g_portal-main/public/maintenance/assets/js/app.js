/**
 * Glohe Bakım Yönetim Sistemi - Main Application Controller
 * Ana uygulama kontrolcüsü ve router
 */

const App = {
  currentView: null,
  isInitialized: false,

  /**
   * Uygulamayı başlat
   */
  async init() {
    if (this.isInitialized) return;

    console.log('🚀 Glohe Bakım Yönetim Sistemi başlatılıyor...');

    try {
      // Supabase client'ı başlat
      supabaseClient.init();

      // Auth'u başlat
      await authManager.init();

      if (!authManager.isAuthenticated()) {
        console.error('❌ User not authenticated');
        return;
      }

      // Inactivity timer başlat
      authManager.startInactivityTimer();

      // Event listeners kur
      this.setupEventListeners();

      // Default view'ı göster
      const defaultView = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_VIEW) || CONFIG.VIEWS.DASHBOARD;
      await this.showView(defaultView);

      this.isInitialized = true;
      console.log('✅ Uygulama başarıyla başlatıldı');
    } catch (error) {
      console.error('❌ Uygulama başlatma hatası:', error);
      this.showError('Uygulama başlatılamadı: ' + error.message);
    }
  },

  /**
   * Event listeners kur
   */
  setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.showView(view);
      });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    console.log('✅ Event listeners kuruldu');
  },

  /**
   * View göster
   */
  async showView(viewName, params = {}) {
    console.log('📄 View değiştiriliyor:', viewName);

    const container = document.getElementById('main-content');
    if (!container) {
      console.error('main-content container not found');
      return;
    }

    // Cleanup current view
    if (this.currentView && this.currentView.cleanup) {
      this.currentView.cleanup();
    }

    // Update active nav button
    this.updateActiveNav(viewName);

    // Show loading
    container.innerHTML = '<div class="loading-spinner">Yükleniyor...</div>';

    try {
      // Render view
      switch (viewName) {
        case CONFIG.VIEWS.DASHBOARD:
        case 'dashboard':
          this.currentView = DashboardView;
          await DashboardView.render('main-content');
          break;

        case CONFIG.VIEWS.CALENDAR:
        case 'calendar':
          this.currentView = CalendarView;
          await CalendarView.render('main-content');
          break;

        case CONFIG.VIEWS.PENDING_TASKS:
        case 'pending-tasks':
          this.currentView = PendingTasksView;
          await PendingTasksView.render('main-content');
          break;

        case CONFIG.VIEWS.MAINTENANCE_FORM:
        case 'maintenance-form':
          this.currentView = MaintenanceFormView;
          await MaintenanceFormView.render('main-content', params.recordId);
          break;

        case CONFIG.VIEWS.REPORTS:
        case 'reports':
          this.currentView = ReportsView;
          await ReportsView.render('main-content');
          break;

        default:
          console.warn('Unknown view:', viewName);
          await DashboardView.render('main-content');
      }

      // Save last view
      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_VIEW, viewName);

      console.log('✅ View rendered:', viewName);
    } catch (error) {
      console.error('View render error:', error);
      this.showError('View yüklenemedi: ' + error.message);
    }
  },

  /**
   * Bakım formu göster (helper method)
   */
  showMaintenanceForm(recordId = null) {
    this.showView(CONFIG.VIEWS.MAINTENANCE_FORM, { recordId });
  },

  /**
   * Active navigation button'ı güncelle
   */
  updateActiveNav(viewName) {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  },

  /**
   * Hata mesajı göster
   */
  showError(message) {
    const container = document.getElementById('main-content');
    if (container) {
      container.innerHTML = `
        <div class="error-container">
          <div class="error-message">
            <h2>❌ Hata</h2>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
              Sayfayı Yenile
            </button>
          </div>
        </div>
      `;
    }
  },

  /**
   * Logout
   */
  async logout() {
    if (!confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Stop inactivity timer
      authManager.stopInactivityTimer();

      // Logout
      await authManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even on error
      authManager.redirectToLogin();
    }
  },

  /**
   * Theme toggle
   */
  toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');

    // Save preference
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');

    // Update theme icons
    const moonIcon = document.getElementById('icon-moon');
    const sunIcon = document.getElementById('icon-sun');

    if (moonIcon && sunIcon) {
      moonIcon.classList.toggle('hidden');
      sunIcon.classList.toggle('hidden');
    }

    // Update charts if visible
    if (this.currentView === DashboardView && DashboardView.charts) {
      Object.values(DashboardView.charts).forEach(chart => {
        Charts.toggleDarkMode(chart, isDark);
      });
    }

    console.log('Theme toggled:', isDark ? 'dark' : 'light');
  },

  /**
   * Window resize handler
   */
  handleResize() {
    // Resize charts if visible
    if (this.currentView === DashboardView && DashboardView.charts) {
      Object.values(DashboardView.charts).forEach(chart => {
        Charts.resizeChart(chart);
      });
    }

    // Resize calendar if visible
    if (this.currentView === CalendarView && CalendarView.calendar) {
      CalendarView.calendar.updateSize();
    }
  },

  /**
   * View'ı refresh et
   */
  async refreshCurrentView() {
    if (this.currentView && this.currentView.render) {
      await this.currentView.render('main-content');
    }
  }
};

// Global'e bağla
window.App = App;

// DOM ready olduğunda başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.init();
  });
} else {
  App.init();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
