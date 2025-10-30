/**
 * Glohe Bakım Yönetim Sistemi - Export Utilities
 * Excel ve PDF export işlemleri
 */

const ExportUtils = {
  /**
   * Excel'e aktar (SheetJS kullanarak)
   */
  async exportToExcel(data, filename = CONFIG.EXPORT.EXCEL.FILENAME) {
    try {
      if (!window.XLSX) {
        throw new Error('XLSX kütüphanesi yüklenmedi');
      }

      // Workbook oluştur
      const wb = XLSX.utils.book_new();

      // Data'yı worksheet'e çevir
      const ws = XLSX.utils.json_to_sheet(data);

      // Column genişliklerini ayarla
      const colWidths = this.calculateColumnWidths(data);
      ws['!cols'] = colWidths;

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(wb, ws, CONFIG.EXPORT.EXCEL.SHEET_NAME);

      // Dosya adına tarih ekle
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}.xlsx`;

      // Excel dosyasını indir
      XLSX.writeFile(wb, fullFilename);

      console.log('✅ Excel export completed:', fullFilename);
      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      throw error;
    }
  },

  /**
   * Bakım kayıtlarını Excel'e aktar
   */
  async exportMaintenanceRecordsToExcel(records) {
    try {
      // Data'yı formatla
      const formattedData = records.map(record => ({
        'Makine No': record.machine?.machine_no || '-',
        'Makine Adı': record.machine?.machine_name || '-',
        'Bakım Tipi': record.maintenance_type || '-',
        'Planlanan Tarih': DateUtils.formatDate(record.scheduled_date),
        'Tamamlanma Tarihi': record.completed_date ? DateUtils.formatDateTime(record.completed_date) : '-',
        'Durum': this.getStatusLabel(record.status),
        'Süre (dk)': record.duration_minutes || '-',
        'Yapan Kişi': record.performed_by_data?.email || '-',
        'Notlar': record.notes || '-'
      }));

      await this.exportToExcel(formattedData, 'bakim_kayitlari');
      return true;
    } catch (error) {
      console.error('Maintenance records Excel export error:', error);
      throw error;
    }
  },

  /**
   * Takvim etkinliklerini Excel'e aktar
   */
  async exportCalendarToExcel(events, year) {
    try {
      const formattedData = events.map(event => ({
        'Tarih': DateUtils.formatDate(event.start),
        'Saat': DateUtils.formatTime(event.extendedProps.scheduled_time),
        'Makine No': event.extendedProps.machine?.machine_no || '-',
        'Makine Adı': event.extendedProps.machine?.machine_name || '-',
        'Bakım Tipi': event.extendedProps.maintenance_type || '-',
        'Frekans': this.getFrequencyLabel(event.extendedProps.frequency),
        'Durum': this.getStatusLabel(event.extendedProps.status),
        'Ay': CONFIG.MONTHS_TR[event.extendedProps.month],
        'Hafta': event.extendedProps.week || '-'
      }));

      await this.exportToExcel(formattedData, `bakim_takvimi_${year}`);
      return true;
    } catch (error) {
      console.error('Calendar Excel export error:', error);
      throw error;
    }
  },

  /**
   * Column genişliklerini hesapla
   */
  calculateColumnWidths(data) {
    if (!data || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const widths = keys.map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Max 50 karakter
    });

    return widths;
  },

  /**
   * PDF'e aktar (jsPDF kullanarak)
   */
  async exportToPDF(content, filename = CONFIG.EXPORT.PDF.FILENAME) {
    try {
      if (!window.jspdf) {
        throw new Error('jsPDF kütüphanesi yüklenmedi');
      }

      const { jsPDF } = window.jspdf;

      // PDF oluştur
      const doc = new jsPDF({
        orientation: CONFIG.EXPORT.PDF.ORIENTATION,
        unit: CONFIG.EXPORT.PDF.UNIT,
        format: CONFIG.EXPORT.PDF.FORMAT
      });

      // Başlık ekle
      doc.setFontSize(16);
      doc.text(CONFIG.APP.NAME, 15, 15);

      doc.setFontSize(12);
      doc.text(`Rapor Tarihi: ${DateUtils.formatDate(new Date())}`, 15, 25);

      // İçerik ekle
      doc.setFontSize(10);
      doc.text(content, 15, 35);

      // Dosya adına tarih ekle
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}.pdf`;

      // PDF'i indir
      doc.save(fullFilename);

      console.log('✅ PDF export completed:', fullFilename);
      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  },

  /**
   * Bakım kayıtlarını PDF'e aktar (Tablo formatında)
   */
  async exportMaintenanceRecordsToPDF(records) {
    try {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error('jsPDF kütüphanesi yüklenmedi');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Başlık
      doc.setFontSize(16);
      doc.text('Bakım Kayıtları Raporu', 15, 15);

      doc.setFontSize(10);
      doc.text(`Rapor Tarihi: ${DateUtils.formatDate(new Date())}`, 15, 22);
      doc.text(`Toplam Kayıt: ${records.length}`, 15, 28);

      // Tablo başlıkları ve verileri hazırla
      const headers = ['Makine No', 'Makine Adı', 'Bakım Tipi', 'Tarih', 'Durum', 'Yapan'];
      const data = records.map(record => [
        record.machine?.machine_no || '-',
        record.machine?.machine_name || '-',
        record.maintenance_type || '-',
        DateUtils.formatDate(record.scheduled_date),
        this.getStatusLabel(record.status),
        record.performed_by_data?.email?.split('@')[0] || '-'
      ]);

      // autoTable plugin'i varsa kullan
      if (doc.autoTable) {
        doc.autoTable({
          head: [headers],
          body: data,
          startY: 35,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [102, 126, 234] },
          alternateRowStyles: { fillColor: [245, 247, 250] }
        });
      } else {
        // autoTable yoksa basit tablo
        let y = 40;
        doc.setFontSize(8);

        // Headers
        let x = 15;
        headers.forEach((header, i) => {
          doc.text(header, x, y);
          x += 45;
        });

        // Data
        y += 7;
        data.forEach(row => {
          x = 15;
          row.forEach((cell, i) => {
            doc.text(String(cell).substring(0, 20), x, y);
            x += 45;
          });
          y += 6;

          // Sayfa sonu kontrolü
          if (y > 180) {
            doc.addPage();
            y = 15;
          }
        });
      }

      // İndir
      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`bakim_kayitlari_${timestamp}.pdf`);

      console.log('✅ PDF export completed');
      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  },

  /**
   * Yazdırma için HTML oluştur
   */
  generatePrintHTML(title, content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .no-print { display: none; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #667eea; color: white; }
            tr:nth-child(even) { background-color: #f9fafb; }
          }
        </style>
      </head>
      <body>
        <h1>${CONFIG.APP.NAME}</h1>
        <h2>${title}</h2>
        <p><strong>Rapor Tarihi:</strong> ${DateUtils.formatDateTime(new Date())}</p>
        ${content}
      </body>
      </html>
    `;
  },

  /**
   * Yazdır
   */
  print(title, content) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up engelleyici nedeniyle yazdırma penceresi açılamadı');
      return;
    }

    const html = this.generatePrintHTML(title, content);
    printWindow.document.write(html);
    printWindow.document.close();

    // Sayfa yüklenince yazdır
    printWindow.onload = () => {
      printWindow.print();
    };
  },

  /**
   * Bakım kayıtlarını yazdır
   */
  printMaintenanceRecords(records) {
    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Makine No</th>
            <th>Makine Adı</th>
            <th>Bakım Tipi</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th>Yapan Kişi</th>
          </tr>
        </thead>
        <tbody>
    `;

    records.forEach(record => {
      tableHTML += `
        <tr>
          <td>${record.machine?.machine_no || '-'}</td>
          <td>${record.machine?.machine_name || '-'}</td>
          <td>${record.maintenance_type || '-'}</td>
          <td>${DateUtils.formatDate(record.scheduled_date)}</td>
          <td>${this.getStatusLabel(record.status)}</td>
          <td>${record.performed_by_data?.email || '-'}</td>
        </tr>
      `;
    });

    tableHTML += '</tbody></table>';

    this.print('Bakım Kayıtları', tableHTML);
  },

  /**
   * CSV'ye aktar
   */
  exportToCSV(data, filename = 'export') {
    try {
      if (!data || data.length === 0) {
        throw new Error('Aktarılacak veri yok');
      }

      // CSV içeriği oluştur
      const headers = Object.keys(data[0]);
      const csvRows = [];

      // Header satırı
      csvRows.push(headers.join(','));

      // Data satırları
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Virgül veya tırnak içeriyorsa tırnakla sarmal
          if (String(value).includes(',') || String(value).includes('"')) {
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(values.join(','));
      });

      const csvContent = csvRows.join('\n');

      // BOM ekle (Excel için Türkçe karakter desteği)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // İndir
      const timestamp = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}_${timestamp}.csv`;

      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fullFilename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      console.log('✅ CSV export completed:', fullFilename);
      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      throw error;
    }
  },

  /**
   * Status label'ı al
   */
  getStatusLabel(status) {
    const statusObj = Object.values(CONFIG.STATUS).find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  },

  /**
   * Frequency label'ı al
   */
  getFrequencyLabel(frequency) {
    const freqObj = Object.values(CONFIG.FREQUENCY).find(f => f.value === frequency);
    return freqObj ? freqObj.label : frequency;
  }
};

// Global'e bağla
window.ExportUtils = ExportUtils;

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportUtils;
}
