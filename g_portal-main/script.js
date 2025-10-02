// ====== SUPABASE ======
const supabaseClient = window.supabase.createClient(
  'https://mignlffeyougoefuyayr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzM4NDUsImV4cCI6MjA3NDcwOTg0NX0.WOvAMx4L3IzovJILgwCG7lRZeHhvOl_n7J1LR5A8SX0'
);

let cachedRecords = [];
let currentSection = 'home';
let trendChart = null;
let currentUserEmail = '';
const ADMIN_EMAIL = 'ugur.onar@glohe.com';

// ====== INIT ======
window.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const loginScreen = document.getElementById('login-screen');
  const portalScreen = document.getElementById('portal-screen');

  if (isLoggedIn && loginScreen && portalScreen) {
    document.body.classList.remove('login-active');
    loginScreen.style.display = 'none';
    portalScreen.style.display = 'block';

    const username = localStorage.getItem('username');
    currentUserEmail = username;
    const userEl = document.getElementById('logged-user');
    if (userEl && username) userEl.textContent = username;

    // Admin ise logs menüsünü göster
    if (username === ADMIN_EMAIL) {
      showAdminMenu();
    }

    showHomepage();
    await loadRecent();
    updateTrendFromStorage();
  }

  initClock();
  initMobileMenuScrim();
});

// ====== SAAT ======
function initClock() {
  const timeEl = document.getElementById('current-time');
  if (!timeEl) return;
  
  const tick = () => {
    timeEl.textContent = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  setInterval(tick, 1000);
  tick();
}

// ====== LOGIN ======
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const msg = document.getElementById('message');

    if (!email || !pass) {
      if (msg) msg.textContent = 'Lütfen email ve şifre giriniz.';
      return;
    }

    try {
      // Supabase ile giriş yap
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: pass
      });

      if (error) {
        if (msg) {
          msg.style.color = '#d32f2f';
          msg.textContent = 'Giriş başarısız: ' + (error.message === 'Invalid login credentials' ? 'Geçersiz email veya şifre' : error.message);
        }
        console.error('Login hatası:', error);
        return;
      }

      // Başarılı giriş
      currentUserEmail = email;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', email);

      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('portal-screen').style.display = 'block';
      document.body.classList.remove('login-active');

      const userEl = document.getElementById('logged-user');
      if (userEl) userEl.textContent = email;

      // Admin ise logs menüsünü göster
      if (email === ADMIN_EMAIL) {
        showAdminMenu();
      }

      await logActivity('LOGIN', 'Auth', { email });
      showHomepage();
      loadRecent();
    } catch (err) {
      if (msg) {
        msg.style.color = '#d32f2f';
        msg.textContent = 'Beklenmeyen bir hata oluştu.';
      }
      console.error('Login hatası:', err);
    }
  });
}

async function logout() {
  await logActivity('LOGOUT', 'Auth', { email: currentUserEmail });
  await supabaseClient.auth.signOut();
  localStorage.clear();
  location.reload();
}

// ====== LOG SİSTEMİ ======
async function logActivity(action, category, details = {}) {
  try {
    const { error } = await supabaseClient.from('logs').insert([{
      user_email: currentUserEmail || localStorage.getItem('username'),
      action: action,
      category: category || currentSection,
      details: details
    }]);

    if (error) console.error('Log kaydı hatası:', error);
  } catch (err) {
    console.error('Log kaydı beklenmeyen hata:', err);
  }
}

function showAdminMenu() {
  const menu = document.querySelector('.menu ul');
  if (!menu) return;

  const logsItem = document.createElement('li');
  logsItem.innerHTML = `
    <a href="#" onclick="showSection('logs'); setActive(this); return false;" data-section-link="logs" data-tooltip="Sistem Logları">
      <span class="icon-wrap">📋</span>
      <span>Sistem Logları</span>
    </a>
  `;
  menu.appendChild(logsItem);
}

// ====== NAVİGASYON ======
function setActive(a) {
  document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
  a.classList.add('active');
  activateMobileTab(a.getAttribute('data-section-link') || 'home');
}

function toggleMenu() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  document.body.classList.toggle(isMobile ? 'mobile-menu-open' : 'menu-collapsed');
}

function showHomepage() {
  showSection('home');
  updateStatistics();
}

function showSection(key) {
  currentSection = key;

  ['home', 'klor', 'sertlik', 'ph', 'iletkenlik', 'mikro', 'logs'].forEach(s => {
    const el = document.getElementById(`page-${s}`);
    if (el) el.style.display = s === key ? '' : 'none';
  });

  const initFuncs = {
    klor: initKlorPage,
    sertlik: initSertlikPage,
    ph: initPhPage,
    iletkenlik: initIletkenlikPage,
    logs: initLogsPage
  };

  if (initFuncs[key]) setTimeout(initFuncs[key], 0);

  document.body.classList.remove('mobile-menu-open');
  activateMobileTab(key);

  const link = document.querySelector(`.menu a[data-section-link="${key}"]`);
  if (link) {
    document.querySelectorAll('.menu a').forEach(el => el.classList.remove('active'));
    link.classList.add('active');
  }

  if (key === 'home') updateStatistics();
}

function activateMobileTab(key) {
  document.querySelectorAll('.mobile-tabs .tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-section') === key);
  });
}

function mobileTabTo(btn) {
  const section = btn.getAttribute('data-section');
  section === 'home' ? showHomepage() : showSection(section);
  
  const link = document.querySelector(`.menu a[data-section-link="${section}"]`);
  if (link) setActive(link);
}

window.mobileTabTo = mobileTabTo;

// ====== VERİ İŞLEMLERİ ======
async function updateStatistics() {
  const { data, error } = await supabaseClient.from('measurements').select('*');
  if (error) return console.error('İstatistik hatası:', error);
  
  const records = data || [];
  const totalEl = document.getElementById('total-records');
  const todayEl = document.getElementById('today-records');
  
  if (totalEl) totalEl.textContent = records.length;
  if (todayEl) {
    const today = new Date().toISOString().slice(0, 10);
    todayEl.textContent = records.filter(r => r.date === today).length;
  }
}

async function loadRecent() {
  try {
    const { data, error } = await supabaseClient
      .from('measurements')
      .select('*')
      .limit(200);
    
    if (error) return console.error('Veri yükleme hatası:', error);
    
    cachedRecords = (data || []).sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date);
      return dateComp !== 0 ? dateComp : b.time.localeCompare(a.time);
    });
    
    renderRecent();
    updateTrendFromStorage();
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
  }
}

function renderRecent() {
  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;
  
  const rows = cachedRecords.slice(0, 5);
  tbody.innerHTML = '';
  
  if (!rows.length) {
    tbody.innerHTML = '<tr class="empty"><td colspan="8" style="padding:12px 10px; opacity:.7;">Henüz kayıt yok.</td></tr>';
    return;
  }
  
  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.style.cssText = 'background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.06); border-radius:10px; overflow:hidden;';
    tr.style.animation = `fadeInRow 0.3s ease ${i * 0.05}s both`;
    tr.innerHTML = `
      <td style="padding:10px 12px; font-weight:700; color:#1b5e20;">${r.category}</td>
      <td style="padding:10px 12px;">${r.point || '-'}</td>
      <td style="padding:10px 12px; font-weight:600;">${r.value || '-'}</td>
      <td style="padding:10px 12px;">${r.unit || '-'}</td>
      <td style="padding:10px 12px;">${r.date || '-'}</td>
      <td style="padding:10px 12px;">${r.time || '-'}</td>
      <td style="padding:10px 12px;">${r.user || '-'}</td>
      <td style="padding:10px 12px; font-size:13px; opacity:0.8;">${r.note || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function addRecent(entry) {
  try {
    const { data, error } = await supabaseClient
      .from('measurements')
      .insert([entry])
      .select();

    if (error) {
      console.error('Kayıt hatası:', error);
      await logActivity('MEASUREMENT_ERROR', entry.category, { error: error.message, entry });
      return showToast('Kayıt başarısız: ' + error.message);
    }

    await logActivity('MEASUREMENT_ADD', entry.category, {
      point: entry.point,
      value: entry.value,
      unit: entry.unit
    });

    showToast('Kayıt başarıyla kaydedildi.');
    await loadRecent();
    updateStatistics();
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
    await logActivity('MEASUREMENT_ERROR', entry.category, { error: err.message, entry });
    showToast('Bir hata oluştu');
  }
}

// ====== KATEGORİ SAYFALARI ======
const pageInits = { klor: false, sertlik: false, ph: false, iletkenlik: false };

function initCategoryPage(category, searchId, gridId) {
  if (pageInits[category]) return;
  pageInits[category] = true;
  
  const search = document.getElementById(searchId);
  const boxes = Array.from(document.querySelectorAll(`#${gridId} .box`));
  
  if (search) {
    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      boxes.forEach(b => {
        b.style.display = (b.dataset.point || '').toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
  
  boxes.forEach(b => b.addEventListener('click', () => openModal(b.dataset.point)));
}

function initKlorPage() { initCategoryPage('klor', 'search', 'klor-grid'); }
function initSertlikPage() { initCategoryPage('sertlik', 'search-sertlik', 'sertlik-grid'); }
function initPhPage() { initCategoryPage('ph', 'search-ph', 'ph-grid'); }
function initIletkenlikPage() { initCategoryPage('iletkenlik', 'search-iletkenlik', 'iletkenlik-grid'); }

// ====== LOGS SAYFASI ======
async function initLogsPage() {
  const logsContainer = document.getElementById('logs-table-container');
  if (!logsContainer) return;

  try {
    const { data, error } = await supabaseClient
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(600);

    if (error) {
      logsContainer.innerHTML = '<p style="color:#d32f2f; padding:20px;">Loglar yüklenemedi: ' + error.message + '</p>';
      return;
    }

    if (!data || data.length === 0) {
      logsContainer.innerHTML = '<p style="opacity:0.6; padding:20px;">Henüz log kaydı yok.</p>';
      return;
    }

    let html = `
      <table style="width:100%; border-collapse:separate; border-spacing:0 8px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px 10px;">Tarih/Saat</th>
            <th style="text-align:left; padding:8px 10px;">Kullanıcı</th>
            <th style="text-align:left; padding:8px 10px;">İşlem</th>
            <th style="text-align:left; padding:8px 10px;">Kategori</th>
            <th style="text-align:left; padding:8px 10px;">Detaylar</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((log, i) => {
      const date = new Date(log.created_at);
      const dateStr = date.toLocaleDateString('tr-TR');
      const timeStr = date.toLocaleTimeString('tr-TR');
      const details = log.details ? JSON.stringify(log.details, null, 2) : '-';

      html += `
        <tr style="background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.06); border-radius:10px; animation:fadeInRow 0.3s ease ${i * 0.03}s both;">
          <td style="padding:10px 12px; font-size:13px;">${dateStr} ${timeStr}</td>
          <td style="padding:10px 12px; font-weight:600; color:#1b5e20;">${log.user_email}</td>
          <td style="padding:10px 12px; font-weight:700;">${log.action}</td>
          <td style="padding:10px 12px;">${log.category || '-'}</td>
          <td style="padding:10px 12px; font-size:12px; font-family:monospace; max-width:300px; overflow:auto;">${details}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    logsContainer.innerHTML = html;
  } catch (err) {
    console.error('Logs yükleme hatası:', err);
    logsContainer.innerHTML = '<p style="color:#d32f2f; padding:20px;">Beklenmeyen hata oluştu.</p>';
  }
}

// ====== MODAL ======
const overlay = document.getElementById('overlay');
const modal = document.getElementById('entry-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const form = document.getElementById('entry-form');

const categoryConfig = {
  klor: { title: 'Klor Ölçüm Kaydı', unit: 'ppm', placeholder: 'Örn: 0.50', step: '0.001', min: '0' },
  sertlik: { title: 'Sertlik Ölçüm Kaydı', unit: 'mg/L CaCO₃', placeholder: 'Örn: 180.0', step: '0.1', min: '0' },
  ph: { title: 'Ph Ölçüm Kaydı', unit: 'pH', placeholder: 'Örn: 7.0', step: '0.1', min: '0', max: '14' },
  iletkenlik: { title: 'İletkenlik Ölçüm Kaydı', unit: 'µS/cm', placeholder: 'Örn: 250.0', step: '0.1', min: '0' },
  mikro: { title: 'Mikro Biyoloji Kaydı', unit: '', placeholder: '', step: '0.1', min: '0' }
};

function openModal(prefillPoint) {
  if (prefillPoint) document.getElementById('point').value = prefillPoint;
  
  const config = categoryConfig[currentSection] || categoryConfig.klor;
  const modalTitle = document.getElementById('modalTitle');
  const unitInput = document.getElementById('unit');
  const valueInput = document.getElementById('value');
  
  if (modalTitle) modalTitle.textContent = config.title;
  
  unitInput.value = config.unit;
  unitInput.readOnly = true;
  unitInput.style.cssText = 'background:#f5f5f5; cursor:not-allowed;';
  
  valueInput.placeholder = config.placeholder;
  valueInput.step = config.step;
  valueInput.min = config.min;
  valueInput.max = config.max || '';
  
  const now = new Date();
  document.getElementById('date').value = now.toISOString().slice(0, 10);
  document.getElementById('time').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  document.getElementById('user').value = (document.getElementById('logged-user')?.textContent || 'Bilinmiyor').replace(/^Kullanıcı:\s*/, '');
  
  overlay.style.display = 'block';
  modal.style.display = 'flex';
  valueInput.focus();
}

function closeModal() {
  overlay.style.display = 'none';
  modal.style.display = 'none';
  if (form) form.reset();
}

if (btnClose) btnClose.addEventListener('click', closeModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);
if (overlay) overlay.addEventListener('click', closeModal);

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const categoryMap = {
      home: 'Anasayfa', klor: 'Klor', sertlik: 'Sertlik', 
      ph: 'Ph', iletkenlik: 'İletkenlik', mikro: 'Mikro Biyoloji'
    };
    
    const entry = {
      category: categoryMap[currentSection] || currentSection,
      point: document.getElementById('point').value,
      value: parseFloat(document.getElementById('value').value),
      unit: document.getElementById('unit').value,
      date: document.getElementById('date').value,
      time: document.getElementById('time').value,
      user: document.getElementById('user').value,
      note: document.getElementById('note').value
    };
    
    await addRecent(entry);
    closeModal();
  });
}

// ====== TOAST ======
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg || 'İşlem başarılı.';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ====== TREND GRAFİĞİ ======
const categoryKeyToName = {
  klor: 'Klor', sertlik: 'Sertlik', ph: 'Ph', 
  iletkenlik: 'İletkenlik', mikro: 'Mikro Biyoloji'
};

const colorMap = {
  klor: { gradient: ['rgba(46,125,50,0.8)', 'rgba(27,94,32,1)'], border: '#1b5e20', point: '#2e7d32', pointHover: '#145214' },
  sertlik: { gradient: ['rgba(33,150,243,0.8)', 'rgba(25,118,210,1)'], border: '#1976d2', point: '#2196f3', pointHover: '#0d47a1' },
  ph: { gradient: ['rgba(156,39,176,0.8)', 'rgba(123,31,162,1)'], border: '#7b1fa2', point: '#9c27b0', pointHover: '#4a148c' },
  iletkenlik: { gradient: ['rgba(255,152,0,0.8)', 'rgba(245,124,0,1)'], border: '#f57c00', point: '#ff9800', pointHover: '#e65100' },
  mikro: { gradient: ['rgba(233,30,99,0.8)', 'rgba(194,24,91,1)'], border: '#c2185b', point: '#e91e63', pointHover: '#880e4f' }
};

function buildTrendData(categoryKey) {
  const name = categoryKeyToName[categoryKey];
  return cachedRecords
    .filter(r => r.category === name && r.value != null && r.value !== '')
    .map(r => ({
      label: `${r.date} ${r.time}`,
      value: parseFloat(r.value),
      unit: r.unit || '',
      user: r.user || '',
      date: r.date,
      time: r.time,
      point: r.point || '',
      note: r.note || ''
    }))
    .filter(r => !isNaN(r.value))
    .sort((a, b) => a.label > b.label ? 1 : -1);
}

function drawTrend(categoryKey) {
  const dataRows = buildTrendData(categoryKey);
  const trendCanvas = document.getElementById('trendChart');
  if (!trendCanvas) return;
  
  if (trendChart) trendChart.destroy();
  
  const colors = colorMap[categoryKey] || colorMap.klor;
  const ctx = trendCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, colors.gradient[0]);
  gradient.addColorStop(1, colors.gradient[1]);
  
  trendChart = new Chart(trendCanvas, {
    type: 'line',
    data: {
      labels: dataRows.map(r => r.label),
      datasets: [{
        label: `${categoryKeyToName[categoryKey]} Trendi`,
        data: dataRows.map(r => r.value),
        borderColor: colors.border,
        backgroundColor: gradient,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: colors.point,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: colors.pointHover,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: true, color: 'rgba(0,0,0,0.05)', drawBorder: false },
          ticks: { maxRotation: 45, minRotation: 0, autoSkip: true, autoSkipPadding: 20, font: { size: 11, weight: '600' }, color: '#666' }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.08)', drawBorder: false },
          ticks: { font: { size: 12, weight: '700' }, color: '#444', padding: 8 }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'start',
          labels: { boxWidth: 0, font: { size: 14, weight: '800' }, color: colors.border, padding: 16 }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          titleFont: { size: 13, weight: '700' },
          bodyFont: { size: 12 },
          padding: 14,
          cornerRadius: 10,
          displayColors: false,
          borderColor: colors.border,
          borderWidth: 2,
          callbacks: {
            title: (ctx) => {
              const r = dataRows[ctx[0].dataIndex];
              return `${r.date} - ${r.time}`;
            },
            label: (ctx) => {
              const r = dataRows[ctx.dataIndex];
              return [`Nokta: ${r.point}`, `Değer: ${r.value}${r.unit ? ' ' + r.unit : ''}`, `Kullanıcı: ${r.user}`];
            },
            afterLabel: (ctx) => {
              const r = dataRows[ctx.dataIndex];
              return r.note ? `Not: ${r.note}` : '';
            }
          }
        }
      },
      animation: { duration: 800, easing: 'easeInOutQuart' }
    }
  });
}

function updateTrendFromStorage() {
  const trendSelect = document.getElementById('trend-category');
  if (trendSelect) drawTrend(trendSelect.value);
}

const trendSelect = document.getElementById('trend-category');
if (trendSelect) trendSelect.addEventListener('change', () => drawTrend(trendSelect.value));

// ====== MOBİL MENÜ ======
function initMobileMenuScrim() {
  const scrim = document.createElement('div');
  scrim.className = 'menu-scrim';
  document.body.appendChild(scrim);
  
  scrim.addEventListener('click', () => document.body.classList.remove('mobile-menu-open'));
  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 768px)').matches) {
      document.body.classList.remove('mobile-menu-open');
    }
  });
}

// ====== EXCEL EXPORT ======
async function exportToExcel() {
  try {
    const { data, error } = await supabaseClient
      .from('measurements')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false });
    
    if (error) return showToast('Veri yüklenemedi: ' + error.message);
    if (!data || !data.length) return showToast('Dışa aktarılacak veri bulunamadı.');
    
    const csv = convertToCSV(data);
    const now = new Date();
    const fileName = `glohe_veriler_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.csv`;
    
    downloadCSV(csv, fileName);
    showToast(`${data.length} kayıt başarıyla indirildi.`);
  } catch (err) {
    console.error('Export hatası:', err);
    showToast('Dışa aktarma sırasında bir hata oluştu.');
  }
}

function convertToCSV(data) {
  if (!data || !data.length) return '';
  
  const headers = ['ID', 'Kategori', 'Kontrol Noktası', 'Ölçüm Değeri', 'Birim', 'Tarih', 'Saat', 'Kullanıcı', 'Açıklama', 'Kayıt Tarihi'];
  let csv = headers.join(',') + '\n';
  
  data.forEach(r => {
    csv += [
      r.id || '',
      escapeCSV(r.category || ''),
      escapeCSV(r.point || ''),
      r.value || '',
      escapeCSV(r.unit || ''),
      r.date || '',
      r.time || '',
      escapeCSV(r.user || ''),
      escapeCSV(r.note || ''),
      r.created_at || ''
    ].join(',') + '\n';
  });
  
  return '\uFEFF' + csv;
}

function escapeCSV(str) {
  if (str == null) return '';
  str = String(str);
  return str.includes(',') || str.includes('"') || str.includes('\n') 
    ? '"' + str.replace(/"/g, '""') + '"' 
    : str;
}

function downloadCSV(content, fileName) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

window.exportToExcel = exportToExcel;