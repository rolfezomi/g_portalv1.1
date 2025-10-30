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

        <div class="export-section">
          <div class="section-header">
            <h2>📊 Export Seçenekleri</h2>
            <p class="section-subtitle">Raporu farklı formatlarda dışa aktarın</p>
          </div>

          <div class="export-grid">
            <div class="export-card" onclick="ReportsView.exportExcel()">
              <div class="export-icon excel">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="8" y1="13" x2="16" y2="13"></line>
                  <line x1="8" y1="17" x2="16" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Excel Dosyası</h3>
              <p>Raporu .xlsx formatında indirin</p>
              <button class="export-btn excel-btn">
                <span>📗 Excel İndir</span>
              </button>
            </div>

            <div class="export-card" onclick="ReportsView.exportPDF()">
              <div class="export-icon pdf">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>PDF Dosyası</h3>
              <p>Raporu PDF formatında indirin</p>
              <button class="export-btn pdf-btn">
                <span>📕 PDF İndir</span>
              </button>
            </div>

            <div class="export-card" onclick="ReportsView.printReport()">
              <div class="export-icon print">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
              </div>
              <h3>Yazdır</h3>
              <p>Raporu doğrudan yazdırın</p>
              <button class="export-btn print-btn">
                <span>🖨️ Yazdır</span>
              </button>
            </div>
          </div>

          <div class="export-info">
            <div class="info-box">
              <strong>💡 İpucu:</strong> Excel formatı veri analizi için, PDF formatı arşivleme için idealdir.
            </div>
          </div>
        </div>

        <style>
          .export-section {
            margin-top: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            color: white;
          }

          .section-header {
            text-align: center;
            margin-bottom: 30px;
          }

          .section-header h2 {
            font-size: 28px;
            margin: 0 0 8px 0;
            font-weight: 600;
          }

          .section-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
          }

          .export-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 24px;
          }

          .export-card {
            background: white;
            color: #1a202c;
            padding: 32px 24px;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .export-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
          }

          .export-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
          }

          .export-card:hover .export-icon {
            transform: scale(1.1) rotate(5deg);
          }

          .export-icon.excel {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .export-icon.pdf {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
          }

          .export-icon.print {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
          }

          .export-card h3 {
            font-size: 22px;
            margin: 0 0 8px 0;
            font-weight: 600;
          }

          .export-card p {
            font-size: 14px;
            color: #64748b;
            margin: 0 0 20px 0;
          }

          .export-btn {
            width: 100%;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .excel-btn {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }

          .excel-btn:hover {
            background: linear-gradient(135deg, #059669, #047857);
          }

          .pdf-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
          }

          .pdf-btn:hover {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
          }

          .print-btn {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
          }

          .print-btn:hover {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
          }

          .export-info {
            margin-top: 24px;
          }

          .info-box {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            padding: 16px 20px;
            border-radius: 8px;
            font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .info-box strong {
            font-weight: 600;
          }
        </style>
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
                <td>${r.performed_by ? 'Atandı' : 'Beklemede'}</td>
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
