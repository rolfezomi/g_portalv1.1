/**
 * Bakım Yönetimi - Haftalık Takvim Analiz Modülü
 * Python'daki analysis_tools.py hesaplamalarının JavaScript implementasyonu
 */

// ==================== SABITLER ====================

const MONTH_NAMES_TR = {
  1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
  5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
  9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
};

const FREQUENCY_LABELS = {
  'weekly': 'Haftalık',
  'monthly': 'Aylık',
  'quarterly': '3 Aylık',
  'semi-annual': '6 Aylık',
  'annual': 'Yıllık'
};

// ==================== HAFTA HESAPLAMA ====================

/**
 * Ayın gününden hafta numarasını hesapla
 * Hafta 1: 1-7
 * Hafta 2: 8-14
 * Hafta 3: 15-21
 * Hafta 4: 22-31
 *
 * @param {number} day - Ayın günü (1-31)
 * @returns {number} Hafta numarası (1-4)
 */
function calculateWeekFromDay(day) {
  if (day >= 1 && day <= 7) return 1;
  if (day >= 8 && day <= 14) return 2;
  if (day >= 15 && day <= 21) return 3;
  return 4;
}

/**
 * Frequency ve month bilgisine göre hangi ayın hangi haftalarına bakım düştüğünü hesapla
 *
 * @param {string} frequency - Bakım frekansı (weekly, monthly, quarterly, semi-annual, annual)
 * @param {number[]} months - Bakım yapılacak aylar (1-12)
 * @returns {Object} {month: [weeks]} dictionary
 */
function getWeeksForFrequency(frequency, months) {
  const weeksByMonth = {};

  if (frequency === 'weekly') {
    // Tüm aylar, tüm haftalar
    for (let month = 1; month <= 12; month++) {
      weeksByMonth[month] = [1, 2, 3, 4];
    }
  } else if (['monthly', 'quarterly', 'semi-annual', 'annual'].includes(frequency)) {
    // Sadece belirtilen aylar, tüm haftalar
    months.forEach(month => {
      weeksByMonth[month] = [1, 2, 3, 4];
    });
  }

  return weeksByMonth;
}

/**
 * Months array'ini parse et
 *
 * @param {string|Array} months - Months string veya array
 * @returns {number[]} Months array
 */
function parseMonths(months) {
  if (Array.isArray(months)) {
    return months;
  }
  if (typeof months === 'string') {
    // "{1,4,7,10}" formatından [1,4,7,10] formatına çevir
    return months
      .replace(/[{}]/g, '')
      .split(',')
      .map(m => parseInt(m.trim()))
      .filter(m => !isNaN(m));
  }
  return [];
}

// ==================== MAKİNE TAKVİMİ ====================

/**
 * Belirli bir makine için tüm bakım schedule'larının haftalık takvimini oluştur
 *
 * @param {Object} machine - Makine objesi {machine_no, machine_name}
 * @param {Array} schedules - Schedule'lar [{schedule_id, maintenance_type, frequency, months}]
 * @returns {Object} Takvim objesi
 */
function getMachineCalendar(machine, schedules) {
  const calendar = {
    machine_no: machine.machine_no,
    machine_name: machine.machine_name,
    maintenances: []
  };

  schedules.forEach(schedule => {
    const months = parseMonths(schedule.months);
    const weeksByMonth = getWeeksForFrequency(schedule.frequency, months);

    calendar.maintenances.push({
      schedule_id: schedule.schedule_id,
      maintenance_type: schedule.maintenance_type,
      frequency: schedule.frequency,
      frequency_label: FREQUENCY_LABELS[schedule.frequency] || schedule.frequency,
      weeks_by_month: weeksByMonth
    });
  });

  return calendar;
}

/**
 * Tüm makineler için haftalık takvim oluştur
 *
 * @param {Array} machines - Makineler listesi
 * @param {Array} allSchedules - Tüm schedule'lar
 * @returns {Array} Takvim listesi
 */
function getAllMachineCalendars(machines, allSchedules) {
  return machines.map(machine => {
    const machineSchedules = allSchedules.filter(
      s => s.machine_no === machine.machine_no
    );
    return getMachineCalendar(machine, machineSchedules);
  });
}

// ==================== AYLIK YOĞUNLUK ANALİZİ ====================

/**
 * Tüm schedule'ların aylık yoğunluğunu hesapla
 *
 * @param {Array} schedules - Tüm schedule'lar
 * @returns {Object} {month: count} dictionary
 */
function getMonthlyDensity(schedules) {
  const density = {};

  // Her ayı 0 ile başlat
  for (let month = 1; month <= 12; month++) {
    density[month] = 0;
  }

  schedules.forEach(schedule => {
    const months = parseMonths(schedule.months);
    const weeksByMonth = getWeeksForFrequency(schedule.frequency, months);

    Object.keys(weeksByMonth).forEach(month => {
      density[parseInt(month)]++;
    });
  });

  return density;
}

/**
 * Aylık yoğunluk için HTML tablosu oluştur
 *
 * @param {Object} density - Aylık yoğunluk
 * @returns {string} HTML string
 */
function renderMonthlyDensityTable(density) {
  let html = '<div class="monthly-density-table">';
  html += '<table>';
  html += '<thead><tr><th>Ay</th><th>Bakım Sayısı</th><th>Yoğunluk</th></tr></thead>';
  html += '<tbody>';

  const maxCount = Math.max(...Object.values(density));

  for (let month = 1; month <= 12; month++) {
    const count = density[month];
    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
    const barColor = percentage > 75 ? '#ef4444' : percentage > 50 ? '#f59e0b' : '#10b981';

    html += '<tr>';
    html += `<td><strong>${MONTH_NAMES_TR[month]}</strong></td>`;
    html += `<td>${count}</td>`;
    html += `<td><div class="density-bar" style="width: ${percentage}%; background-color: ${barColor};"></div></td>`;
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

// ==================== İSTATİSTİKLER ====================

/**
 * Genel istatistikleri hesapla
 *
 * @param {Array} machines - Makineler
 * @param {Array} schedules - Schedule'lar
 * @returns {Object} İstatistikler
 */
function calculateStatistics(machines, schedules) {
  const stats = {
    total_machines: machines.length,
    total_schedules: schedules.length,
    machines_without_schedule: 0,
    frequency_distribution: {},
    type_distribution: {}
  };

  // Frequency dağılımı
  schedules.forEach(schedule => {
    const freq = schedule.frequency;
    stats.frequency_distribution[freq] = (stats.frequency_distribution[freq] || 0) + 1;
  });

  // Type dağılımı
  schedules.forEach(schedule => {
    const type = schedule.maintenance_type;
    stats.type_distribution[type] = (stats.type_distribution[type] || 0) + 1;
  });

  // Schedule olmayan makineler
  machines.forEach(machine => {
    const hasSchedule = schedules.some(s => s.machine_no === machine.machine_no);
    if (!hasSchedule) {
      stats.machines_without_schedule++;
    }
  });

  return stats;
}

/**
 * İstatistikler için HTML card'ları oluştur
 *
 * @param {Object} stats - İstatistikler
 * @returns {string} HTML string
 */
function renderStatisticsCards(stats) {
  let html = '<div class="stats-grid">';

  // Genel İstatistikler
  html += `
    <div class="stat-card">
      <h3>Genel</h3>
      <div class="stat-item">
        <span>Toplam Makine:</span>
        <strong>${stats.total_machines}</strong>
      </div>
      <div class="stat-item">
        <span>Toplam Bakım Periyodu:</span>
        <strong>${stats.total_schedules}</strong>
      </div>
      <div class="stat-item ${stats.machines_without_schedule > 0 ? 'warning' : ''}">
        <span>Schedule Olmayan Makine:</span>
        <strong>${stats.machines_without_schedule}</strong>
      </div>
    </div>
  `;

  // Frequency Dağılımı
  html += '<div class="stat-card"><h3>Frequency Dağılımı</h3>';
  Object.entries(stats.frequency_distribution)
    .sort(([,a], [,b]) => b - a)
    .forEach(([freq, count]) => {
      html += `
        <div class="stat-item">
          <span>${FREQUENCY_LABELS[freq] || freq}:</span>
          <strong>${count}</strong>
        </div>
      `;
    });
  html += '</div>';

  // Type Dağılımı
  html += '<div class="stat-card"><h3>Bakım Tipi Dağılımı</h3>';
  Object.entries(stats.type_distribution)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      html += `
        <div class="stat-item">
          <span>${type}:</span>
          <strong>${count}</strong>
        </div>
      `;
    });
  html += '</div>';

  html += '</div>';
  return html;
}

// ==================== HAFTALIK TAKVİM RENDER ====================

/**
 * Belirli bir makine için haftalık takvim tablosu oluştur
 *
 * @param {Object} calendar - Makine takvimi
 * @returns {string} HTML string
 */
function renderMachineWeeklyCalendar(calendar) {
  let html = `
    <div class="machine-calendar">
      <h3>${calendar.machine_no} - ${calendar.machine_name}</h3>
  `;

  if (calendar.maintenances.length === 0) {
    html += '<p class="no-data">Bu makine için bakım periyodu tanımlanmamış.</p>';
    html += '</div>';
    return html;
  }

  calendar.maintenances.forEach((maintenance, idx) => {
    html += `
      <div class="maintenance-section">
        <h4>BAKIM ${idx + 1}: ${maintenance.maintenance_type} - ${maintenance.frequency_label}</h4>
        <table class="weekly-calendar-table">
          <thead>
            <tr>
              <th>Ay</th>
              <th>H1 (1-7)</th>
              <th>H2 (8-14)</th>
              <th>H3 (15-21)</th>
              <th>H4 (22-31)</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (let month = 1; month <= 12; month++) {
      const weeks = maintenance.weeks_by_month[month] || [];

      html += '<tr>';
      html += `<td class="month-cell"><strong>${MONTH_NAMES_TR[month]}</strong></td>`;

      for (let week = 1; week <= 4; week++) {
        const hasWeek = weeks.includes(week);
        html += `<td class="week-cell ${hasWeek ? 'has-maintenance' : ''}">`;
        html += hasWeek ? '✓' : '-';
        html += '</td>';
      }

      html += '</tr>';
    }

    html += '</tbody></table></div>';
  });

  html += '</div>';
  return html;
}

/**
 * Tüm makineler için özet haftalık takvim oluştur
 *
 * @param {Array} calendars - Tüm makine takvimleri
 * @returns {string} HTML string
 */
function renderAllMachinesCalendar(calendars) {
  let html = '<div class="all-machines-calendar">';

  calendars.forEach(calendar => {
    html += renderMachineWeeklyCalendar(calendar);
  });

  html += '</div>';
  return html;
}

// ==================== YILLIK TAKVİM ====================

/**
 * Yıllık bakım planı - hangi ay hangi makine
 *
 * @param {Array} calendars - Tüm makine takvimleri
 * @returns {string} HTML string
 */
function renderYearlyCalendar(calendars) {
  const yearlyData = {};

  // Her ay için boş array oluştur
  for (let month = 1; month <= 12; month++) {
    yearlyData[month] = [];
  }

  // Her makine ve schedule için aylık verileri topla
  calendars.forEach(calendar => {
    calendar.maintenances.forEach(maintenance => {
      Object.keys(maintenance.weeks_by_month).forEach(month => {
        yearlyData[parseInt(month)].push({
          machine_no: calendar.machine_no,
          machine_name: calendar.machine_name,
          maintenance_type: maintenance.maintenance_type,
          frequency: maintenance.frequency_label
        });
      });
    });
  });

  let html = '<div class="yearly-calendar">';
  html += '<h2>Yıllık Bakım Planı</h2>';

  for (let month = 1; month <= 12; month++) {
    const machines = yearlyData[month];

    html += `
      <div class="month-section">
        <h3>${MONTH_NAMES_TR[month]} (${machines.length} bakım)</h3>
        ${machines.length > 0 ? `
          <table class="machines-table">
            <thead>
              <tr>
                <th>Makine No</th>
                <th>Makine Adı</th>
                <th>Bakım Tipi</th>
                <th>Frekans</th>
              </tr>
            </thead>
            <tbody>
              ${machines.map(m => `
                <tr>
                  <td>${m.machine_no}</td>
                  <td>${m.machine_name}</td>
                  <td>${m.maintenance_type}</td>
                  <td>${m.frequency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="no-data">Bu ay için bakım planlanmamış.</p>'}
      </div>
    `;
  }

  html += '</div>';
  return html;
}

// ==================== EXPORT ====================

window.MaintenanceAnalysis = {
  calculateWeekFromDay,
  getWeeksForFrequency,
  parseMonths,
  getMachineCalendar,
  getAllMachineCalendars,
  getMonthlyDensity,
  calculateStatistics,
  renderStatisticsCards,
  renderMonthlyDensityTable,
  renderMachineWeeklyCalendar,
  renderAllMachinesCalendar,
  renderYearlyCalendar,
  MONTH_NAMES_TR,
  FREQUENCY_LABELS
};
