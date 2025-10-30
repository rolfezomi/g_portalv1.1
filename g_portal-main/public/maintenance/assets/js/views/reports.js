/**
 * Glohe Bakım Yönetim Sistemi - Reports View
 * Raporlama ve export modülü
 */

const ReportsView = {
  records: [],

  async render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="reports-view">
        <div class="view-header">
          <h1>Raporlar ve Analizler</h1>
        </div>

        <div class="report-filters">
          <div class="form-row">
            <div class="form-field">
              <label>Başlangıç Tarihi</label>
              <input type="date" id="report-start-date" value="${DateUtils.addDays(DateUtils.getToday(), -30)}">
            </div>
            <div class="form-field">
              <label>Bitiş Tarihi</label>
              <input type="date" id="report-end-date" value="${DateUtils.getToday()}">
            </div>
            <div class="form-field">
              <label>Durum</label>
              <select id="report-status">
                <option value="">Tümü</option>
                ${Object.values(CONFIG.STATUS).map(s => `
                  <option value="${s.value}">${s.label}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-field">
              <button class="btn btn-primary" onclick="ReportsView.generateReport()">
                📊 Rapor Oluştur
              </button>
            </div>
          </div>
        </div>

        <div id="report-results"></div>

        <div class="export-actions">
          <h2>Export Seçenekleri</h2>
          <div class="actions-grid">
            <button class="action-card" onclick="ReportsView.exportExcel()">
              <span class="action-icon">📗</span>
              <span class="action-label">Excel İndir</span>
            </button>
            <button class="action-card" onclick="ReportsView.exportPDF()">
              <span class="action-icon">📕</span>
              <span class="action-label">PDF İndir</span>
            </button>
            <button class="action-card" onclick="ReportsView.printReport()">
              <span class="action-icon">🖨️</span>
              <span class="action-label">Yazdır</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async generateReport() {
    const resultsContainer = document.getElementById('report-results');
    resultsContainer.innerHTML = '<div class="loading-spinner">Rapor oluşturuluyor...</div>';

    try {
      const filters = {
        dateFrom: document.getElementById('report-start-date').value,
        dateTo: document.getElementById('report-end-date').value,
        status: document.getElementById('report-status').value || undefined
      };

      this.records = await supabaseClient.getMaintenanceRecords(filters);

      resultsContainer.innerHTML = `
        <div class="report-summary">
          <h2>Rapor Özeti</h2>
          <p>Tarih Aralığı: ${DateUtils.formatDate(filters.dateFrom)} - ${DateUtils.formatDate(filters.dateTo)}</p>
          <p>Toplam Kayıt: ${this.records.length}</p>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Makine</th>
              <th>Bakım Tipi</th>
              <th>Tarih</th>
              <th>Tamamlanma</th>
              <th>Durum</th>
              <th>Yapan</th>
            </tr>
          </thead>
          <tbody>
            ${this.records.map(r => `
              <tr>
                <td>${r.machine?.machine_no} - ${r.machine?.machine_name}</td>
                <td>${r.maintenance_type}</td>
                <td>${DateUtils.formatDate(r.scheduled_date)}</td>
                <td>${r.completed_date ? DateUtils.formatDateTime(r.completed_date) : '-'}</td>
                <td><span class="status-badge status-${r.status}">${CONFIG.STATUS[r.status.toUpperCase()]?.label}</span></td>
                <td>${r.performed_by_data?.email || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      resultsContainer.innerHTML = `<div class="error-message">Rapor oluşturma hatası: ${error.message}</div>`;
    }
  },

  async exportExcel() {
    if (!this.records.length) {
      alert('Önce rapor oluşturun!');
      return;
    }

    try {
      await ExportUtils.exportMaintenanceRecordsToExcel(this.records);
      alert('Excel dosyası indirildi!');
    } catch (error) {
      alert('Excel export hatası: ' + error.message);
    }
  },

  async exportPDF() {
    if (!this.records.length) {
      alert('Önce rapor oluşturun!');
      return;
    }

    try {
      await ExportUtils.exportMaintenanceRecordsToPDF(this.records);
      alert('PDF dosyası indirildi!');
    } catch (error) {
      alert('PDF export hatası: ' + error.message);
    }
  },

  printReport() {
    if (!this.records.length) {
      alert('Önce rapor oluşturun!');
      return;
    }

    ExportUtils.printMaintenanceRecords(this.records);
  },

  cleanup() {
    this.records = [];
  }
};

window.ReportsView = ReportsView;
