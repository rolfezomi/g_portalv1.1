/**
 * Glohe Bakım Yönetim Sistemi - Dashboard View
 * Ana dashboard görünümü (istatistikler, grafikler, özet)
 */

const DashboardView = {
  charts: {},
  data: null,

  /**
   * Dashboard'ı render et
   */
  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Dashboard container not found');
      return;
    }

    // Loading göster
    container.innerHTML = '<div class="loading-spinner">Dashboard yükleniyor...</div>';

    try {
      // Veriyi yükle
      await this.loadData();

      // HTML oluştur
      container.innerHTML = this.getHTML();

      // Grafikleri oluştur
      this.renderCharts();

      // Event listeners ekle
      this.attachEventListeners();

      console.log('✅ Dashboard rendered');
    } catch (error) {
      console.error('Dashboard render error:', error);
      container.innerHTML = `
        <div class="error-message">
          Dashboard yüklenirken hata oluştu: ${error.message}
          <br><br>
          <button class="btn btn-primary" onclick="DashboardView.render('${containerId}')">
            Tekrar Dene
          </button>
        </div>
      `;
    }
  },

  /**
   * Veri yükle
   */
  async loadData() {
    try {
      const [
        stats,
        machines,
        schedules,
        pendingTasks,
        monthlyDistribution
      ] = await Promise.all([
        supabaseClient.getDashboardStats(),
        supabaseClient.getMachines(),
        supabaseClient.getMaintenanceSchedules(),
        supabaseClient.getPendingMaintenance('next_7_days'),
        supabaseClient.getMonthlyDistribution(new Date().getFullYear())
      ]);

      this.data = {
        stats,
        machines,
        schedules,
        pendingTasks,
        monthlyDistribution
      };

      console.log('Dashboard data loaded:', this.data);
    } catch (error) {
      console.error('Dashboard data load error:', error);
      throw error;
    }
  },

  /**
   * HTML oluştur
   */
  getHTML() {
    const { stats, pendingTasks } = this.data;

    return `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Bakım Yönetimi Dashboard</h1>
          <p class="dashboard-subtitle">Hoş geldiniz, ${authManager.getCurrentUserName()}</p>
        </div>

        <!-- İstatistik Kartları -->
        <div class="stats-grid">
          ${this.renderStatsCard('Toplam Makine', stats.totalMachines, 'machines', '#3b82f6', '🏭')}
          ${this.renderStatsCard('Bakım Periyodu', stats.totalSchedules, 'schedules', '#8b5cf6', '📋')}
          ${this.renderStatsCard('Bekleyen Bakım', stats.pendingCount, 'pending', '#f59e0b', '⏳')}
          ${this.renderStatsCard('Gecikmiş Bakım', stats.overdueCount, 'overdue', '#ef4444', '⚠️')}
          ${this.renderStatsCard('Bu Ay Tamamlanan', stats.completedThisMonth, 'completed', '#22c55e', '✅')}
        </div>

        <!-- Grafikler -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>Aylık Bakım Dağılımı</h3>
            <div class="chart-container">
              <canvas id="monthly-distribution-chart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>Bakım Durumu</h3>
            <div class="chart-container">
              <canvas id="status-distribution-chart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>Makine Kategorileri</h3>
            <div class="chart-container">
              <canvas id="category-distribution-chart"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <h3>Bakım Frekansları</h3>
            <div class="chart-container">
              <canvas id="frequency-distribution-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Yaklaşan Bakımlar -->
        <div class="upcoming-maintenance">
          <div class="section-header">
            <h2>Sonraki 7 Günün Bakımları</h2>
            <button class="btn btn-secondary" onclick="App.showView('pending-tasks')">
              Tümünü Gör
            </button>
          </div>

          ${this.renderPendingTasksTable(pendingTasks.slice(0, 5))}
        </div>

        <!-- Hızlı Aksiyonlar -->
        <div class="quick-actions">
          <h2>Hızlı Erişim</h2>
          <div class="actions-grid">
            <button class="action-card" onclick="App.showView('calendar')">
              <span class="action-icon">📅</span>
              <span class="action-label">Takvim</span>
            </button>
            <button class="action-card" onclick="App.showView('pending-tasks')">
              <span class="action-icon">📋</span>
              <span class="action-label">Bekleyen Bakımlar</span>
            </button>
            <button class="action-card" onclick="App.showView('maintenance-form')">
              <span class="action-icon">➕</span>
              <span class="action-label">Yeni Bakım Kaydı</span>
            </button>
            <button class="action-card" onclick="App.showView('reports')">
              <span class="action-icon">📊</span>
              <span class="action-label">Raporlar</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * İstatistik kartı render et
   */
  renderStatsCard(title, value, type, color, icon) {
    return `
      <div class="stat-card" style="border-left: 4px solid ${color};">
        <div class="stat-icon" style="background-color: ${color}20;">
          ${icon}
        </div>
        <div class="stat-content">
          <p class="stat-title">${title}</p>
          <p class="stat-value" style="color: ${color};">${value}</p>
        </div>
      </div>
    `;
  },

  /**
   * Pending tasks tablosu
   */
  renderPendingTasksTable(tasks) {
    if (!tasks || tasks.length === 0) {
      return '<p class="no-data">Sonraki 7 gün içinde bakım planlanmamış.</p>';
    }

    return `
      <table class="data-table">
        <thead>
          <tr>
            <th>Makine</th>
            <th>Bakım Tipi</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(task => `
            <tr class="${task.status === 'overdue' ? 'row-overdue' : ''}">
              <td>
                <strong>${task.machine?.machine_no || '-'}</strong>
                <br>
                <span class="text-muted">${task.machine?.machine_name || '-'}</span>
              </td>
              <td>${task.maintenance_type || '-'}</td>
              <td>
                ${DateUtils.formatDate(task.scheduled_date)}
                <br>
                <span class="text-muted">${DateUtils.relativeTime(task.scheduled_date)}</span>
              </td>
              <td>
                <span class="status-badge status-${task.status}">
                  ${CONFIG.STATUS[task.status.toUpperCase()]?.label || task.status}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-primary"
                  onclick="App.showMaintenanceForm('${task.id}')"
                >
                  Detay
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  /**
   * Grafikleri render et
   */
  renderCharts() {
    const { stats, machines, schedules, monthlyDistribution } = this.data;

    // Destroy existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });

    this.charts = {};

    // Monthly distribution chart
    this.charts.monthly = Charts.createMonthlyDistributionChart(
      'monthly-distribution-chart',
      monthlyDistribution
    );

    // Status distribution chart
    this.charts.status = Charts.createStatusDistributionChart(
      'status-distribution-chart',
      stats
    );

    // Category distribution chart
    this.charts.category = Charts.createCategoryDistributionChart(
      'category-distribution-chart',
      machines
    );

    // Frequency distribution chart
    this.charts.frequency = Charts.createFrequencyDistributionChart(
      'frequency-distribution-chart',
      schedules
    );

    console.log('Charts rendered');
  },

  /**
   * Event listeners ekle
   */
  attachEventListeners() {
    // Stat kartlarına tıklama
    document.querySelectorAll('.stat-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // TODO: Stat kartına göre ilgili view'a git
        console.log('Stat card clicked');
      });
    });
  },

  /**
   * Dashboard'ı yenile
   */
  async refresh(containerId = 'main-content') {
    await this.render(containerId);
  },

  /**
   * Cleanup
   */
  cleanup() {
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};
    this.data = null;
  }
};

// Global'e bağla
window.DashboardView = DashboardView;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardView;
}
