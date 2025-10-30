/**
 * Bakım Yönetimi - Ana Uygulama Script'i
 * View yönetimi ve veri entegrasyonu
 */

// ==================== GLOBAL STATE ====================

let appState = {
  currentView: 'weekly', // weekly, monthly, yearly, pending-list, management
  machines: [],
  schedules: [],
  calendars: [],
  stats: null,
  monthlyDensity: null,
  isLoading: false,
  error: null
};

// ==================== INIT ====================

/**
 * Uygulamayı başlat
 */
async function initMaintenanceApp() {
  console.log('Bakım Yönetimi Uygulaması başlatılıyor...');

  // Button event listeners
  setupEventListeners();

  // İlk veriyi yükle
  await loadData();

  // Default view'ı göster
  showView('weekly');
}

/**
 * Event listeners kurulumu
 */
function setupEventListeners() {
  // View buttons
  const btnWeekly = document.getElementById('btn-weekly');
  const btnMonthly = document.getElementById('btn-monthly');
  const btnYearly = document.getElementById('btn-yearly');
  const btnPendingList = document.getElementById('btn-pending-list');
  const btnManagement = document.getElementById('btn-management');
  const btnCalendar = document.getElementById('btn-calendar');

  if (btnWeekly) {
    btnWeekly.addEventListener('click', () => showView('weekly'));
  }

  if (btnMonthly) {
    btnMonthly.addEventListener('click', () => showView('monthly'));
  }

  if (btnYearly) {
    btnYearly.addEventListener('click', () => showView('yearly'));
  }

  if (btnPendingList) {
    btnPendingList.addEventListener('click', () => showView('pending-list'));
  }

  if (btnManagement) {
    btnManagement.addEventListener('click', () => showView('management'));
  }

  if (btnCalendar) {
    btnCalendar.addEventListener('click', () => showView('calendar'));
  }

  console.log('Event listeners kuruldu');
}

/**
 * Active button'ı güncelle
 */
function updateActiveButton(viewName) {
  // Tüm button'lardan active class'ını kaldır
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // İlgili button'a active class ekle
  let btnId;
  switch (viewName) {
    case 'weekly':
      btnId = 'btn-weekly';
      break;
    case 'monthly':
      btnId = 'btn-monthly';
      break;
    case 'yearly':
      btnId = 'btn-yearly';
      break;
    case 'pending-list':
      btnId = 'btn-pending-list';
      break;
    case 'management':
      btnId = 'btn-management';
      break;
    case 'calendar':
      btnId = 'btn-calendar';
      break;
    default:
      btnId = 'btn-weekly';
  }

  const activeBtn = document.getElementById(btnId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// ==================== DATA LOADING ====================

/**
 * Veriyi yükle ve analiz et
 */
async function loadData() {
  const mainContent = document.getElementById('main-content');

  if (!mainContent) {
    console.error('main-content elementi bulunamadı!');
    return;
  }

  try {
    appState.isLoading = true;
    appState.error = null;

    // Loading göster
    mainContent.innerHTML = '<div class="loading-spinner">Veriler yükleniyor...</div>';

    // Supabase'den veri çek ve analiz et
    if (typeof window.MaintenanceData === 'undefined') {
      throw new Error('MaintenanceData modülü yüklenmemiş!');
    }

    const data = await window.MaintenanceData.fetchAndAnalyze();

    appState.machines = data.machines;
    appState.schedules = data.schedules;
    appState.calendars = data.calendars;
    appState.stats = data.stats;
    appState.monthlyDensity = data.monthlyDensity;

    console.log('Veriler yüklendi:', {
      machines: appState.machines.length,
      schedules: appState.schedules.length,
      calendars: appState.calendars.length
    });

    appState.isLoading = false;

  } catch (error) {
    console.error('Veri yükleme hatası:', error);
    appState.isLoading = false;
    appState.error = error.message;

    mainContent.innerHTML = `
      <div class="error-message">
        <strong>Hata:</strong> ${error.message}
        <br><br>
        <button class="btn btn-primary" onclick="loadData()">Tekrar Dene</button>
      </div>
    `;
  }
}

/**
 * Veriyi yenile
 */
async function refreshData() {
  await loadData();
  showView(appState.currentView);
}

// ==================== VIEW MANAGEMENT ====================

/**
 * Belirtilen view'ı göster
 */
function showView(viewName) {
  console.log('View değiştiriliyor:', viewName);

  appState.currentView = viewName;
  updateActiveButton(viewName);

  const mainContent = document.getElementById('main-content');

  if (!mainContent) {
    console.error('main-content elementi bulunamadı!');
    return;
  }

  // Veri yüklenmemişse hata göster
  if (appState.isLoading) {
    mainContent.innerHTML = '<div class="loading-spinner">Veriler yükleniyor...</div>';
    return;
  }

  if (appState.error) {
    mainContent.innerHTML = `
      <div class="error-message">
        <strong>Hata:</strong> ${appState.error}
        <br><br>
        <button class="btn btn-primary" onclick="loadData()">Tekrar Dene</button>
      </div>
    `;
    return;
  }

  // View'a göre içerik render et
  switch (viewName) {
    case 'calendar':
      renderCalendarView(mainContent);
      break;
    case 'weekly':
      renderWeeklyView(mainContent);
      break;
    case 'monthly':
      renderMonthlyView(mainContent);
      break;
    case 'yearly':
      renderYearlyView(mainContent);
      break;
    case 'pending-list':
      renderPendingListView(mainContent);
      break;
    case 'management':
      renderManagementView(mainContent);
      break;
    default:
      renderWeeklyView(mainContent);
  }
}

// ==================== VIEW RENDERERS ====================

/**
 * Takvim view - İstatistikler + Aylık Yoğunluk
 */
function renderCalendarView(container) {
  const MA = window.MaintenanceAnalysis;

  let html = '<div class="maintenance-content">';
  html += '<h2>Bakım Takvimi - Genel Bakış</h2>';

  // İstatistikler
  html += MA.renderStatisticsCards(appState.stats);

  // Aylık Yoğunluk
  html += '<h3 style="margin-top: 40px; margin-bottom: 20px;">Aylık Bakım Yoğunluğu</h3>';
  html += MA.renderMonthlyDensityTable(appState.monthlyDensity);

  html += '</div>';

  container.innerHTML = html;
}

/**
 * Haftalık view - Tüm makinelerin haftalık takvimleri
 */
function renderWeeklyView(container) {
  const MA = window.MaintenanceAnalysis;

  let html = '<div class="maintenance-content">';
  html += '<h2>Haftalık Bakım Takvimi - Tüm Makineler</h2>';

  // Search bar
  html += `
    <div class="search-bar">
      <input
        type="text"
        id="machine-search"
        class="search-input"
        placeholder="Makine ara (No veya Ad)..."
        onkeyup="filterMachines(this.value)"
      >
      <button class="btn btn-secondary" onclick="resetFilter()">Sıfırla</button>
    </div>
  `;

  // Tüm makine takvimleri
  html += '<div id="calendars-container">';
  html += MA.renderAllMachinesCalendar(appState.calendars);
  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}

/**
 * Aylık view - Aylara göre makinelerin listesi
 */
function renderMonthlyView(container) {
  const MA = window.MaintenanceAnalysis;

  let html = '<div class="maintenance-content">';
  html += '<h2>Aylık Bakım Planı</h2>';

  // Ay seçici
  html += `
    <div class="search-bar">
      <select id="month-selector" class="filter-select" onchange="filterByMonth(this.value)">
        <option value="all">Tüm Aylar</option>
  `;

  for (let month = 1; month <= 12; month++) {
    html += `<option value="${month}">${MA.MONTH_NAMES_TR[month]}</option>`;
  }

  html += `
      </select>
    </div>
  `;

  html += '<div id="monthly-content">';

  // Her ay için makine listesi
  for (let month = 1; month <= 12; month++) {
    const machinesInMonth = [];

    appState.calendars.forEach(calendar => {
      calendar.maintenances.forEach(maintenance => {
        if (maintenance.weeks_by_month[month]) {
          machinesInMonth.push({
            machine_no: calendar.machine_no,
            machine_name: calendar.machine_name,
            maintenance_type: maintenance.maintenance_type,
            frequency_label: maintenance.frequency_label
          });
        }
      });
    });

    html += `
      <div class="month-section" data-month="${month}">
        <h3>${MA.MONTH_NAMES_TR[month]} (${machinesInMonth.length} bakım)</h3>
    `;

    if (machinesInMonth.length > 0) {
      html += `
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
      `;

      machinesInMonth.forEach(m => {
        html += `
          <tr>
            <td>${m.machine_no}</td>
            <td>${m.machine_name}</td>
            <td>${m.maintenance_type}</td>
            <td>${m.frequency_label}</td>
          </tr>
        `;
      });

      html += '</tbody></table>';
    } else {
      html += '<p class="no-data">Bu ay için bakım planlanmamış.</p>';
    }

    html += '</div>';
  }

  html += '</div></div>';

  container.innerHTML = html;
}

/**
 * Yıllık view - Yıllık bakım planı özeti
 */
function renderYearlyView(container) {
  const MA = window.MaintenanceAnalysis;

  const html = `
    <div class="maintenance-content">
      ${MA.renderYearlyCalendar(appState.calendars)}
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Bekleyen bakımlar view
 */
function renderPendingListView(container) {
  let html = '<div class="maintenance-content">';
  html += '<h2>Bekleyen Bakımlar</h2>';
  html += '<p class="no-data">Bu özellik yakında eklenecek...</p>';
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Yönetim view
 */
function renderManagementView(container) {
  let html = '<div class="maintenance-content">';
  html += '<h2>Bakım Yönetimi</h2>';
  html += '<p class="no-data">Bu özellik yakında eklenecek...</p>';
  html += '</div>';

  container.innerHTML = html;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Makine filtreleme
 */
function filterMachines(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const containers = document.querySelectorAll('.machine-calendar');

  containers.forEach(container => {
    const h3 = container.querySelector('h3');
    if (h3) {
      const text = h3.textContent.toLowerCase();
      if (text.includes(term)) {
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
    }
  });
}

/**
 * Filtreyi sıfırla
 */
function resetFilter() {
  const searchInput = document.getElementById('machine-search');
  if (searchInput) {
    searchInput.value = '';
  }

  const containers = document.querySelectorAll('.machine-calendar');
  containers.forEach(container => {
    container.style.display = 'block';
  });
}

/**
 * Aya göre filtrele
 */
function filterByMonth(month) {
  const sections = document.querySelectorAll('.month-section');

  if (month === 'all') {
    sections.forEach(section => {
      section.style.display = 'block';
    });
  } else {
    sections.forEach(section => {
      const sectionMonth = section.getAttribute('data-month');
      if (sectionMonth === month) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });
  }
}

// ==================== GLOBAL EXPORTS ====================

window.MaintenanceApp = {
  initMaintenanceApp,
  loadData,
  refreshData,
  showView,
  filterMachines,
  resetFilter,
  filterByMonth
};

// ==================== AUTO INIT ====================

// DOM hazır olduğunda otomatik başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMaintenanceApp);
} else {
  initMaintenanceApp();
}
