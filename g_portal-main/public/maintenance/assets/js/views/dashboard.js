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
      <div class="stat-card" data-card-type="${type}" style="border-left: 4px solid ${color}; cursor: pointer; transition: all 0.2s;">
        <div class="stat-icon" style="background-color: ${color}20;">
          ${icon}
        </div>
        <div class="stat-content">
          <p class="stat-title">${title}</p>
          <p class="stat-value" style="color: ${color};">${value}</p>
        </div>
        <div class="stat-arrow" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 24px; color: ${color}; opacity: 0.5;">›</div>
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
      const cardType = card.getAttribute('data-card-type');

      // Hover efekti
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '';
      });

      // Tıklama
      card.addEventListener('click', () => {
        this.showDetailModal(cardType);
      });
    });
  },

  /**
   * Detay modalını göster
   */
  async showDetailModal(type) {
    let title, data, columns;

    switch(type) {
      case 'machines':
        title = 'Tüm Makineler';
        data = this.data.machines;
        columns = [
          { key: 'machine_no', label: 'Makine No' },
          { key: 'machine_name', label: 'Makine Adı' },
          { key: 'category', label: 'Kategori' },
          { key: 'location', label: 'Lokasyon' },
          { key: 'status', label: 'Durum', format: (val) => val === 'active' ? '✅ Aktif' : '⏸️ Pasif' }
        ];
        break;

      case 'schedules':
        title = 'Bakım Periyotları';
        data = this.data.schedules;
        columns = [
          { key: 'machine.machine_no', label: 'Makine No' },
          { key: 'machine.machine_name', label: 'Makine' },
          { key: 'maintenance_type', label: 'Bakım Tipi' },
          { key: 'frequency', label: 'Frekans', format: (val) => CONFIG.FREQUENCY[val.toUpperCase()]?.label || val }
        ];
        break;

      case 'pending':
        title = 'Bekleyen Bakımlar';
        data = await supabaseClient.getMaintenanceRecords({ status: 'pending' });
        columns = [
          { key: 'machine.machine_no', label: 'Makine No' },
          { key: 'machine.machine_name', label: 'Makine' },
          { key: 'maintenance_type', label: 'Bakım Tipi' },
          { key: 'scheduled_date', label: 'Planlanan Tarih', format: (val) => DateUtils.formatDate(val) }
        ];
        break;

      case 'overdue':
        title = 'Gecikmiş Bakımlar';
        data = await supabaseClient.getMaintenanceRecords({ status: 'overdue' });
        columns = [
          { key: 'machine.machine_no', label: 'Makine No' },
          { key: 'machine.machine_name', label: 'Makine' },
          { key: 'maintenance_type', label: 'Bakım Tipi' },
          { key: 'scheduled_date', label: 'Planlanan Tarih', format: (val) => DateUtils.formatDate(val) },
          { key: 'scheduled_date', label: 'Gecikme', format: (val) => {
            const overdue = DateUtils.getOverdueDays(val);
            return `<span style="color: ${overdue.color};">${overdue.text}</span>`;
          }}
        ];
        break;

      case 'completed':
        title = 'Bu Ay Tamamlanan Bakımlar';
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        data = await supabaseClient.getMaintenanceRecords({
          status: 'completed',
          dateRange: { start: startOfMonth, end: endOfMonth }
        });
        columns = [
          { key: 'machine.machine_no', label: 'Makine No' },
          { key: 'machine.machine_name', label: 'Makine' },
          { key: 'maintenance_type', label: 'Bakım Tipi' },
          { key: 'scheduled_date', label: 'Planlanan', format: (val) => DateUtils.formatDate(val) },
          { key: 'completed_date', label: 'Tamamlandı', format: (val) => DateUtils.formatDate(val) }
        ];
        break;
    }

    this.renderModal(title, data, columns);
  },

  /**
   * Modal render et
   */
  renderModal(title, data, columns) {
    // Mevcut modalı kaldır
    const existingModal = document.getElementById('detail-modal');
    if (existingModal) existingModal.remove();

    // Modal HTML
    const modalHTML = `
      <div id="detail-modal" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
      " onclick="if(event.target.id === 'detail-modal') this.remove()">
        <div style="
          background: white;
          border-radius: 12px;
          max-width: 1200px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        " onclick="event.stopPropagation()">
          <div style="
            padding: 24px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <h2 style="margin: 0; font-size: 24px; color: #1f2937;">${title}</h2>
            <button onclick="document.getElementById('detail-modal').remove()" style="
              background: none;
              border: none;
              font-size: 28px;
              cursor: pointer;
              color: #6b7280;
              line-height: 1;
            ">×</button>
          </div>
          <div style="padding: 24px; overflow-y: auto; max-height: calc(80vh - 100px);">
            ${this.renderDetailTable(data, columns)}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  /**
   * Detay tablosu render et
   */
  renderDetailTable(data, columns) {
    if (!data || data.length === 0) {
      return '<p style="text-align: center; color: #6b7280; padding: 40px;">Veri bulunamadı.</p>';
    }

    const getValue = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    return `
      <table style="
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      ">
        <thead>
          <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            ${columns.map(col => `
              <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">
                ${col.label}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, index) => `
            <tr style="border-bottom: 1px solid #f3f4f6; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
              ${columns.map(col => {
                let value = getValue(row, col.key);
                if (col.format) value = col.format(value);
                return `<td style="padding: 12px; color: #1f2937;">${value || '-'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="margin-top: 16px; text-align: right; color: #6b7280; font-size: 13px;">
        Toplam ${data.length} kayıt
      </div>
    `;
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
