// --- DECIMAL INPUT FIX (global helpers) ---
const __initedDecimalInputs = new WeakSet();

function initDecimalValueInput(el) {
  if (!el || __initedDecimalInputs.has(el)) return;
  __initedDecimalInputs.add(el);

  // Force text mode to avoid caret reset issues on number inputs
  el.setAttribute('type', 'text');
  el.setAttribute('inputmode', 'decimal');
  el.setAttribute('autocomplete', 'off');

  // Convert dot to comma without breaking caret (beforeinput + setRangeText)
  el.addEventListener('beforeinput', (e) => {
    if (e.inputType === 'insertText' && e.data === '.') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = el;
      el.setRangeText(',', selectionStart, selectionEnd, 'end');
    }
  }, true);

  // Sanitize and keep caret position stable
  el.addEventListener('input', () => {
    let caret = el.selectionStart;
    let v = el.value;

    // Replace any dots with commas (paste, etc.)
    if (v.includes('.')) v = v.replace(/\./g, ',');

    // Keep only first comma
    const firstComma = v.indexOf(',');
    if (firstComma !== -1) {
      const left = v.slice(0, firstComma + 1);
      const right = v.slice(firstComma + 1);
      const commasBeforeCaret = (v.slice(firstComma + 1, caret).match(/,/g) || []).length;
      v = left + right.replace(/,/g, '');
      if (caret > firstComma + 1) caret -= commasBeforeCaret;
    }

    // Max 3 digits after comma
    const commaPos = v.indexOf(',');
    if (commaPos !== -1) {
      const decimals = v.slice(commaPos + 1);
      if (decimals.length > 3) {
        v = v.slice(0, commaPos + 1) + decimals.slice(0, 3);
        if (caret > commaPos + 1 + 3) caret = commaPos + 1 + 3;
      }
    }

    if (el.value !== v) {
      el.value = v;
      requestAnimationFrame(() => el.setSelectionRange(caret, caret));
    }
  });
}

// Clone-and-replace to drop existing listeners, then init our sanitized behavior
function takeOverValueInput() {
  const el = document.getElementById('value');
  if (!el) return;
  const clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
  initDecimalValueInput(clone);
}
// --- /DECIMAL INPUT FIX ---

// --- TR number parser (eklenen yardımcı) ---
function parseTRNumber(val) {
  if (typeof val === 'number') return val;
  if (val == null) return NaN;
  const s = String(val).trim();
  if (!s) return NaN;
  // Binlik noktalarını kaldır, ondalık virgülü noktaya çevir
  const normalized = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  return Number(normalized);
}
// --- /TR number parser ---

// ====== SUPABASE ======
// index.html'den gelen supabase client'ı kullan
const supabaseClient = window.supabaseClient;

let cachedRecords = [];
let currentSection = 'home';
let trendChart = null;
let currentUserEmail = '';
let currentUserRole = 'full'; // 'admin', 'full', 'restricted'
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

    // Kullanıcı rolünü al
    await loadUserRole(username);

    // Rol bazlı menü gösterimi
    if (currentUserRole === 'admin') {
      showFullAccessMenu(); // Trend Analizi
      showAdminMenu(); // Logs + User Management
    } else if (currentUserRole === 'full') {
      showFullAccessMenu(); // Sadece Trend Analizi
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

      // Kullanıcı rolünü al
      await loadUserRole(email);

      // Rol bazlı menü gösterimi
      if (currentUserRole === 'admin') {
        showFullAccessMenu(); // Trend Analizi
        showAdminMenu(); // Logs + User Management
      } else if (currentUserRole === 'full') {
        showFullAccessMenu(); // Sadece Trend Analizi
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

// ====== KULLANICI ROL SİSTEMİ ======
async function loadUserRole(email) {
  try {
    const { data, error } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('email', email)
      .single();

    if (error || !data) {
      // Varsayılan olarak 'full' yetkisi ver
      currentUserRole = 'full';
      console.log('Kullanıcı rolü bulunamadı, varsayılan: full');
    } else {
      currentUserRole = data.role;
      console.log('Kullanıcı rolü:', currentUserRole);
    }
  } catch (err) {
    currentUserRole = 'full';
    console.error('Rol yükleme hatası:', err);
  }
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

  const adminPanelItem = document.createElement('li');
  adminPanelItem.className = 'menu-group';
  adminPanelItem.innerHTML = `
    <a href="#" onclick="handleAdminPanelClick(event); return false;" class="menu-parent" data-section-link="admin-panel" data-tooltip="Admin Panel">
      <span class="icon-wrap">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </span>
      <span>Admin Panel</span>
      <span class="menu-arrow">▼</span>
    </a>
    <ul class="submenu" id="admin-panel-submenu">
      <li><a href="#" onclick="showSection('logs'); setActive(this); return false;" data-section-link="logs"><span class="icon-wrap">📋</span><span>Sistem Logları</span></a></li>
      <li><a href="#" onclick="showSection('users'); setActive(this); return false;" data-section-link="users"><span class="icon-wrap">👥</span><span>Kullanıcı Yönetimi</span></a></li>
    </ul>
  `;
  menu.appendChild(adminPanelItem);

  // Mobile tabs'a ekle
  const mobileTabs = document.getElementById('mobile-tabs');
  if (mobileTabs) {
    const adminTab = document.createElement('button');
    adminTab.type = 'button';
    adminTab.className = 'tab';
    adminTab.setAttribute('data-section', 'admin-panel');
    adminTab.setAttribute('onclick', 'mobileTabTo(this)');
    adminTab.innerHTML = '<span class="tab-icon">⚙️</span><span class="tab-text">Admin</span>';
    mobileTabs.appendChild(adminTab);
  }
}

function showFullAccessMenu() {
  const menu = document.querySelector('.menu ul');
  if (!menu) return;

  const trendsItem = document.createElement('li');
  trendsItem.innerHTML = `
    <a href="#" onclick="showSection('trends'); setActive(this); return false;" data-section-link="trends" data-tooltip="Trend Analizi">
      <span class="icon-wrap">📊</span>
      <span>Trend Analizi</span>
    </a>
  `;
  menu.appendChild(trendsItem);

  // Mobile tabs'a da ekle
  const mobileTabs = document.getElementById('mobile-tabs');
  if (mobileTabs) {
    const trendsTab = document.createElement('button');
    trendsTab.type = 'button';
    trendsTab.className = 'tab';
    trendsTab.setAttribute('data-section', 'trends');
    trendsTab.setAttribute('onclick', 'mobileTabTo(this)');
    trendsTab.textContent = 'Trendler';
    mobileTabs.appendChild(trendsTab);
  }
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

// Su Analizi menü toggle fonksiyonu (Masaüstü)
function toggleSuAnaliziMenu(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const menuParent = event.target.closest('.menu-parent');
  const submenu = document.getElementById('su-analizi-submenu');

  if (menuParent && submenu) {
    const isOpen = submenu.classList.contains('open');
    submenu.classList.toggle('open', !isOpen);
    menuParent.classList.toggle('open', !isOpen);
  }
}

// Su Analizi tıklama handler'ı - daraltılmış/açık menü için
function handleSuAnaliziClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const isCollapsed = document.body.classList.contains('menu-collapsed');

  // Menü daraltılmışsa Su Analizi sayfasını aç
  if (isCollapsed) {
    showSection('su-analizi');
    setActive(event.target.closest('a'));
  }
  // Menü açıksa alt menüyü toggle et
  else {
    toggleSuAnaliziMenu(event);
  }
}

// Admin Panel menü toggle fonksiyonu
function toggleAdminPanelMenu(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const menuParent = event.target.closest('.menu-parent');
  const submenu = document.getElementById('admin-panel-submenu');

  if (menuParent && submenu) {
    const isOpen = submenu.classList.contains('open');
    submenu.classList.toggle('open', !isOpen);
    menuParent.classList.toggle('open', !isOpen);
  }
}

// Admin Panel tıklama handler'ı - daraltılmış/açık menü için
function handleAdminPanelClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const isCollapsed = document.body.classList.contains('menu-collapsed');

  // Menü daraltılmışsa Admin Panel ana sayfasını aç (logs)
  if (isCollapsed) {
    showSection('admin-panel');
    setActive(event.target.closest('a'));
  }
  // Menü açıksa alt menüyü toggle et
  else {
    toggleAdminPanelMenu(event);
  }
}

// Global scope'a fonksiyonları ekle
window.toggleSuAnaliziMenu = toggleSuAnaliziMenu;
window.handleSuAnaliziClick = handleSuAnaliziClick;
window.toggleAdminPanelMenu = toggleAdminPanelMenu;
window.handleAdminPanelClick = handleAdminPanelClick;

function showHomepage() {
  showSection('home');
  updateStatistics();
}

function showSection(key) {
  // Sayfa erişim kontrolü
  if (key === 'trends' && currentUserRole === 'restricted') {
    showToast('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
    return;
  }

  if ((key === 'logs' || key === 'users' || key === 'admin-panel') && currentUserRole !== 'admin') {
    showToast('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
    return;
  }

  currentSection = key;

  ['home', 'su-analizi', 'klor', 'sertlik', 'ph', 'iletkenlik', 'mikro', 'admin-panel', 'logs', 'users', 'trends'].forEach(s => {
    const el = document.getElementById(`page-${s}`);
    if (el) el.style.display = s === key ? '' : 'none';
  });

  const initFuncs = {
    klor: initKlorPage,
    sertlik: initSertlikPage,
    ph: initPhPage,
    iletkenlik: initIletkenlikPage,
    mikro: initMikroPage,
    logs: initLogsPage,
    users: initUsersPage,
    trends: initTrendsPage
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
  // Tüm tab'ları kontrol et
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

  // Kısıtlı kullanıcılar için tabloyu ve Excel butonunu gizle
  const savedValuesDiv = document.getElementById('saved-values');
  const excelBtn = document.getElementById('excel-export-btn');

  if (currentUserRole === 'restricted') {
    if (savedValuesDiv) savedValuesDiv.style.display = 'none';
    if (excelBtn) excelBtn.style.display = 'none';
    return;
  }

  // Admin ve Full kullanıcılar için göster
  if (savedValuesDiv) savedValuesDiv.style.display = '';
  if (excelBtn) excelBtn.style.display = 'inline-flex';

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

    // Değer için ondalık formatlama
    let displayValue = '-';
    if (r.value != null && r.value !== '') {
      let numValue = parseTRNumber(r.value); // <— parseFloat yerine TR parse
      if (!isNaN(numValue)) {
        // Virgülden sonra en fazla 3 basamak olacak şekilde kes
        numValue = Math.trunc(numValue * 1000) / 1000;

        displayValue = numValue.toLocaleString('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3
        });
      }
    }

    tr.innerHTML = `
      <td style="padding:10px 12px; font-weight:700; color:#1b5e20;">${r.category}</td>
      <td style="padding:10px 12px;">${r.point || '-'}</td>
      <td style="padding:10px 12px; font-weight:600;">${displayValue}</td>
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
    // ID alanını kaldır (Supabase otomatik oluşturmalı)
    const { id, ...entryWithoutId } = entry;

    console.log('Kaydedilecek veri:', entryWithoutId);

    const { data, error } = await supabaseClient
      .from('measurements')
      .insert([entryWithoutId])
      .select();

    if (error) {
      console.error('Kayıt hatası:', error);
      console.error('Gönderilen veri:', entryWithoutId);
      await logActivity('MEASUREMENT_ERROR', entry.category, { error: error.message, entry: entryWithoutId });
      return showToast('Kayıt başarısız: ' + (error.message || 'Bilinmeyen hata'));
    }

    console.log('Kayıt başarılı:', data);

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
    showToast('Bir hata oluştu: ' + err.message);
  }
}

// ====== KATEGORİ SAYFALARI ======
const pageInits = { klor: false, sertlik: false, ph: false, iletkenlik: false, mikro: false };

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

  boxes.forEach(b => b.addEventListener('click', () => openModal(b.dataset.point, true))); // readonly=true
}

function initKlorPage() { initCategoryPage('klor', 'search', 'klor-grid'); }
function initSertlikPage() { initCategoryPage('sertlik', 'search-sertlik', 'sertlik-grid'); }
function initPhPage() { initCategoryPage('ph', 'search-ph', 'ph-grid'); }
function initIletkenlikPage() { initCategoryPage('iletkenlik', 'search-iletkenlik', 'iletkenlik-grid'); }

let selectedCompactDryPoint = '';

function initMikroPage() {
  if (pageInits.mikro) return;
  pageInits.mikro = true;

  // Ana view'a dön
  document.getElementById('mikro-main-view').style.display = '';
  document.getElementById('mikro-compact-dry-view').style.display = 'none';
  document.getElementById('mikro-compact-dry-tests-view').style.display = 'none';
  document.getElementById('mikro-petri-view').style.display = 'none';
}

// Mikrobiyoloji alt menülerini göster
function showMikroSubMenu(type) {
  document.getElementById('mikro-main-view').style.display = 'none';
  document.getElementById('mikro-compact-dry-tests-view').style.display = 'none';

  if (type === 'compact-dry') {
    document.getElementById('mikro-compact-dry-view').style.display = '';
    document.getElementById('mikro-petri-view').style.display = 'none';
  } else if (type === 'petri') {
    document.getElementById('mikro-compact-dry-view').style.display = 'none';
    document.getElementById('mikro-petri-view').style.display = '';
  }
}

// Mikrobiyoloji ana menüye dön
function backToMikroMain() {
  document.getElementById('mikro-main-view').style.display = '';
  document.getElementById('mikro-compact-dry-view').style.display = 'none';
  document.getElementById('mikro-compact-dry-tests-view').style.display = 'none';
  document.getElementById('mikro-petri-view').style.display = 'none';
}

// Compact Dry kontrol noktası seçildiğinde test seçim ekranını göster
function showCompactDryTests(point) {
  selectedCompactDryPoint = point;
  document.getElementById('compact-dry-test-title').textContent = `Compact Dry - Kontrol Noktası ${point} - Test Seçimi`;
  document.getElementById('mikro-compact-dry-view').style.display = 'none';
  document.getElementById('mikro-compact-dry-tests-view').style.display = '';
}

// Compact Dry test seçiminden kontrol noktalarına geri dön
function backToCompactDryPoints() {
  document.getElementById('mikro-compact-dry-view').style.display = '';
  document.getElementById('mikro-compact-dry-tests-view').style.display = 'none';
}

// Compact Dry test seçildiğinde modal aç
function openCompactDryModal(testType) {
  const pointInfo = `Compact Dry - Kontrol Noktası ${selectedCompactDryPoint} - ${testType}`;
  openModal(pointInfo, true); // readonly=true
}

// Petri (R2A Agar) için doğrudan modal aç
function openPetriModal(point) {
  const pointInfo = `Petri (R2A Agar) - Kontrol Noktası ${point}`;
  openModal(pointInfo, true); // readonly=true
}

window.showMikroSubMenu = showMikroSubMenu;
window.backToMikroMain = backToMikroMain;
window.showCompactDryTests = showCompactDryTests;
window.backToCompactDryPoints = backToCompactDryPoints;
window.openCompactDryModal = openCompactDryModal;
window.openPetriModal = openPetriModal;

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

// ====== KULLANICI YÖNETİMİ SAYFASI ======
async function initUsersPage() {
  const usersContainer = document.getElementById('users-table-container');
  if (!usersContainer) return;

  try {
    // Backend API'den kullanıcı listesini al
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session?.session?.access_token) {
      usersContainer.innerHTML = '<p style="color:#d32f2f; padding:20px;">Oturum bulunamadı. Lütfen yeniden giriş yapın.</p>';
      return;
    }

    const response = await fetch(`${API_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      usersContainer.innerHTML = `<p style="color:#d32f2f; padding:20px;">Kullanıcılar yüklenemedi: ${errorData.error || response.statusText}</p>`;
      return;
    }

    const { users: authUsers } = await response.json();

    if (!authUsers || authUsers.length === 0) {
      usersContainer.innerHTML = '<p style="opacity:0.6; padding:20px;">Henüz kullanıcı kaydı yok.</p>';
      return;
    }

    let html = `
      <table style="width:100%; border-collapse:separate; border-spacing:0 8px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:8px 10px;">Email</th>
            <th style="text-align:left; padding:8px 10px;">Kayıt Tarihi</th>
            <th style="text-align:left; padding:8px 10px;">Son Giriş</th>
            <th style="text-align:left; padding:8px 10px;">Rol</th>
            <th style="text-align:left; padding:8px 10px;">İşlem</th>
          </tr>
        </thead>
        <tbody>
    `;

    authUsers.forEach((user, i) => {
      const email = user.email;
      const createdDate = new Date(user.created_at);
      const createdStr = createdDate.toLocaleDateString('tr-TR') + ' ' + createdDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
      const lastSignInStr = lastSignIn
        ? lastSignIn.toLocaleDateString('tr-TR') + ' ' + lastSignIn.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : '-';

      const currentRole = user.role || 'full';
      const roleId = user.role_id || null;

      const roleOptions = ['admin', 'full', 'restricted'].map(role =>
        `<option value="${role}" ${currentRole === role ? 'selected' : ''}>${getRoleLabel(role)}</option>`
      ).join('');

      html += `
        <tr style="background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.06); border-radius:10px; animation:fadeInRow 0.3s ease ${i * 0.03}s both;">
          <td style="padding:10px 12px; font-weight:600; color:#1b5e20;">${email}</td>
          <td style="padding:10px 12px; font-size:13px;">${createdStr}</td>
          <td style="padding:10px 12px; font-size:13px;">${lastSignInStr}</td>
          <td style="padding:10px 12px;">
            <select id="role-${email.replace(/[@.]/g, '_')}" style="padding:6px 10px; border:1px solid #ddd; border-radius:6px; font-size:14px;">
              ${roleOptions}
            </select>
          </td>
          <td style="padding:10px 12px;">
            <button onclick="updateUserRoleByEmail('${email}', ${roleId})" class="btn btn-primary" style="padding:6px 12px; font-size:13px;">Güncelle</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    usersContainer.innerHTML = html;
  } catch (err) {
    console.error('Kullanıcı yükleme hatası:', err);
    usersContainer.innerHTML = '<p style="color:#d32f2f; padding:20px;">Beklenmeyen hata oluştu: ' + err.message + '</p>';
  }
}

function getRoleLabel(role) {
  const labels = {
    'admin': 'Admin (Tam Yetki + Kullanıcı Yönetimi)',
    'full': 'Tam Yetki',
    'restricted': 'Kısıtlı (Son Değerler ve Grafikler Gizli)'
  };
  return labels[role] || role;
}

async function updateUserRoleByEmail(email, existingRoleId) {
  const selectEl = document.getElementById(`role-${email.replace(/[@.]/g, '_')}`);
  if (!selectEl) return;

  const newRole = selectEl.value;

  try {
    // Backend API'den kullanıcı session'ını al
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session?.session?.access_token) {
      showToast('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
      return;
    }

    // Backend API ile rol güncelle
    const response = await fetch(`${API_URL}/update-role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        role: newRole,
        roleId: existingRoleId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      showToast('Rol güncellenemedi: ' + (result.error || response.statusText));
      return;
    }

    showToast(result.message || `${email} kullanıcısının rolü güncellendi`);

    // Sayfayı yenile
    setTimeout(() => initUsersPage(), 1000);
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
    showToast('Rol güncellenirken hata oluştu.');
  }
}

window.updateUserRoleByEmail = updateUserRoleByEmail;

// ====== MODAL ======
const overlay = document.getElementById('overlay');
const modal = document.getElementById('entry-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel = document.getElementById('btn-cancel');
const form = document.getElementById('entry-form');

const categoryConfig = {
  klor: { title: 'Klor Ölçüm Kaydı', unit: 'ppm', placeholder: 'Örn: 0.50', step: '0.001', min: '0' },
  sertlik: { title: 'Sertlik Ölçüm Kaydı', unit: '°dH(Alman Sertliği)', placeholder: 'Örn: 180.0', step: '0.1', min: '0' },
  ph: { title: 'Ph Ölçüm Kaydı', unit: 'pH', placeholder: 'Örn: 7.0', step: '0.1', min: '0', max: '14' },
  iletkenlik: { title: 'İletkenlik Ölçüm Kaydı', unit: 'µS/cm', placeholder: 'Örn: 250.0', step: '0.1', min: '0' },
  mikro: { title: 'Mikro Biyoloji Kaydı', unit: '', placeholder: '', step: '0.1', min: '0' }
};

function openModal(prefillPoint, readonly = false) {
  try { if (typeof takeOverValueInput === 'function') takeOverValueInput(); } catch(_) {}

  const pointInput = document.getElementById('point');

  if (prefillPoint) {
    pointInput.value = prefillPoint;
  }

  // Readonly parametresi true ise kontrol noktası alanını değiştirilemez yap
  if (readonly) {
    pointInput.readOnly = true;
    pointInput.style.cssText = 'background:#f5f5f5; cursor:not-allowed;';
  } else {
    pointInput.readOnly = false;
    pointInput.style.cssText = '';
  }

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

  // 1) Nokta tuşunu caret bozulmadan virgüle çevir
  document.addEventListener('beforeinput', (e) => {
    const el = e.target;
    if (!el || el.nodeName !== 'INPUT') return;
    if (!el.matches('#value')) return; // yalnızca id="value" olan input

    if (e.inputType === 'insertText' && e.data === '.') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = el;
      el.setRangeText(',', selectionStart, selectionEnd, 'end');
    }
  }, true); // capture=true: dinamik içerik + IME uyumu

  // 2) Temizlik ve caret koruma
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el || el.nodeName !== 'INPUT') return;
    if (!el.matches('#value')) return;

    let caret = el.selectionStart;
    let v = el.value;

    // Fazla virgülleri kaldır (ilk virgül hariç)
    const firstComma = v.indexOf(',');
    if (firstComma !== -1) {
      const left = v.slice(0, firstComma + 1);
      const right = v.slice(firstComma + 1);
      const commasInRight = (right.match(/,/g) || []).length;
      if (commasInRight > 0) {
        const commasBeforeCaret =
          (v.slice(firstComma + 1, caret).match(/,/g) || []).length;
        v = left + right.replace(/,/g, '');
        if (caret > firstComma + 1) caret -= commasBeforeCaret;
      }
    }

    // Virgülden sonra max 3 basamak
    const commaPos = v.indexOf(',');
    if (commaPos !== -1) {
      const decimals = v.slice(commaPos + 1);
      if (decimals.length > 3) {
        v = v.slice(0, commaPos + 1) + decimals.slice(0, 3);
        if (caret > commaPos + 1 + 3) caret = commaPos + 1 + 3;
      }
    }

    // Yapıştırma vb. durumlarda nokta -> virgül
    if (v.includes('.')) v = v.replace(/\./g, ',');

    if (el.value !== v) {
      el.value = v;
      requestAnimationFrame(() => {
        el.setSelectionRange(caret, caret);
      });
    }
  });

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
      value: parseTRNumber(document.getElementById('value').value), // <— parseFloat yerine TR parse
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
      value: parseTRNumber(r.value), // <— parseFloat yerine TR parse
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
  // Kısıtlı kullanıcılar Excel indiremez
  if (currentUserRole === 'restricted') {
    showToast('Bu işlem için yetkiniz bulunmamaktadır.');
    return;
  }

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

// ====== TREND ANALİZİ SAYFASI ======
let trendsChart = null;
const pageInitsExtended = { trends: false };

function initTrendsPage() {
  if (pageInitsExtended.trends) return;
  pageInitsExtended.trends = true;

  // Log sayfa ziyareti
  logActivity('PAGE_VIEW', 'Trends', { page: 'trends' });

  // Kategori değişikliğinde kontrol noktalarını güncelle
  const categorySelect = document.getElementById('trends-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', updateTrendsControlPoints);
    updateTrendsControlPoints(); // İlk yükleme
  }

  // Varsayılan tarih aralığını ayarla (son 30 gün)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const startInput = document.getElementById('trends-start-date');
  const endInput = document.getElementById('trends-end-date');

  if (startInput) startInput.value = startDate.toISOString().slice(0, 10);
  if (endInput) endInput.value = endDate.toISOString().slice(0, 10);
}

function updateTrendsControlPoints() {
  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');

  if (!categorySelect || !pointSelect) return;

  const category = categorySelect.value;
  const categoryName = categoryKeyToName[category];

  // Seçili kategoriye ait tüm benzersiz kontrol noktalarını bul
  const points = [...new Set(
    cachedRecords
      .filter(r => r.category === categoryName)
      .map(r => r.point)
      .filter(p => p)
  )].sort();

  // Dropdown'u güncelle
  pointSelect.innerHTML = '<option value="">Tümü</option>';
  points.forEach(point => {
    const option = document.createElement('option');
    option.value = point;
    option.textContent = point;
    pointSelect.appendChild(option);
  });
}

function updateTrendsAnalysis() {
  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');
  const startDateInput = document.getElementById('trends-start-date');
  const endDateInput = document.getElementById('trends-end-date');

  if (!categorySelect || !pointSelect) return;

  const category = categorySelect.value;
  const selectedPoint = pointSelect.value;
  const startDate = startDateInput?.value || '';
  const endDate = endDateInput?.value || '';
  const categoryName = categoryKeyToName[category];

  // Log analiz güncelleme
  logActivity('TRENDS_ANALYSIS', 'Trends', {
    category,
    point: selectedPoint || 'Tümü',
    dateRange: `${startDate} - ${endDate}`
  });

  // Veriyi filtrele
  let filteredData = cachedRecords.filter(r => {
    if (r.category !== categoryName) return false;
    if (selectedPoint && r.point !== selectedPoint) return false;
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return r.value != null && r.value !== '';
  });

  // Tarihe göre sırala
  filteredData = filteredData.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    return dateComp !== 0 ? dateComp : a.time.localeCompare(b.time);
  });

  // İstatistikleri hesapla ve göster
  updateTrendsStats(filteredData);

  // Grafik çiz
  drawTrendsChart(filteredData, category);

  // Tabloyu güncelle
  renderTrendsTable(filteredData);
}

function updateTrendsStats(data) {
  const totalEl = document.getElementById('trends-stat-total');
  const avgEl = document.getElementById('trends-stat-avg');
  const maxEl = document.getElementById('trends-stat-max');
  const minEl = document.getElementById('trends-stat-min');

  if (!totalEl || !avgEl || !maxEl || !minEl) return;

  if (!data || data.length === 0) {
    totalEl.textContent = '0';
    avgEl.textContent = '-';
    maxEl.textContent = '-';
    minEl.textContent = '-';
    return;
  }

  const values = data.map(r => parseTRNumber(r.value)).filter(v => !isNaN(v));

  if (values.length === 0) {
    totalEl.textContent = data.length;
    avgEl.textContent = '-';
    maxEl.textContent = '-';
    minEl.textContent = '-';
    return;
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  totalEl.textContent = data.length;
  avgEl.textContent = avg.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  maxEl.textContent = max.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  minEl.textContent = min.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

function drawTrendsChart(data, categoryKey) {
  const canvas = document.getElementById('trendsChart');
  if (!canvas) return;

  if (trendsChart) trendsChart.destroy();

  if (!data || data.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Seçilen filtrelere uygun veri bulunamadı', canvas.width / 2, canvas.height / 2);
    return;
  }

  const colors = colorMap[categoryKey] || colorMap.klor;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, colors.gradient[0]);
  gradient.addColorStop(1, colors.gradient[1]);

  const chartData = data.map(r => ({
    x: `${r.date} ${r.time}`,
    y: parseTRNumber(r.value),
    point: r.point,
    unit: r.unit,
    user: r.user,
    note: r.note
  })).filter(d => !isNaN(d.y));

  trendsChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: chartData.map(d => d.x),
      datasets: [{
        label: `${categoryKeyToName[categoryKey]} Trend Analizi`,
        data: chartData.map(d => d.y),
        borderColor: colors.border,
        backgroundColor: gradient,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 7,
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
          grid: { display: true, color: 'rgba(0,0,0,0.05)' },
          ticks: { maxRotation: 45, minRotation: 0, autoSkip: true, font: { size: 10 }, color: '#666' }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.08)' },
          ticks: { font: { size: 11, weight: '600' }, color: '#444' }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { font: { size: 13, weight: '700' }, color: colors.border, padding: 12 }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          titleFont: { size: 12, weight: '700' },
          bodyFont: { size: 11 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (ctx) => chartData[ctx[0].dataIndex].x,
            label: (ctx) => {
              const d = chartData[ctx.dataIndex];
              return [
                `Nokta: ${d.point || '-'}`,
                `Değer: ${d.y}${d.unit ? ' ' + d.unit : ''}`,
                `Kullanıcı: ${d.user || '-'}`
              ];
            },
            afterLabel: (ctx) => {
              const d = chartData[ctx.dataIndex];
              return d.note ? `Not: ${d.note}` : '';
            }
          }
        }
      }
    }
  });
}

function renderTrendsTable(data) {
  const tbody = document.getElementById('trends-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr class="empty"><td colspan="7" style="padding:12px 10px; opacity:.7;">Seçilen filtrelere uygun veri bulunamadı.</td></tr>';
    return;
  }

  data.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.style.cssText = 'background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.06); border-radius:10px;';
    tr.style.animation = `fadeInRow 0.3s ease ${i * 0.02}s both`;

    let displayValue = '-';
    if (r.value != null && r.value !== '') {
      let numValue = parseTRNumber(r.value);
      if (!isNaN(numValue)) {
        numValue = Math.trunc(numValue * 1000) / 1000;
        displayValue = numValue.toLocaleString('tr-TR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3
        });
      }
    }

    tr.innerHTML = `
      <td style="padding:10px 12px;">${r.date || '-'}</td>
      <td style="padding:10px 12px;">${r.time || '-'}</td>
      <td style="padding:10px 12px; font-weight:600; color:#1b5e20;">${r.point || '-'}</td>
      <td style="padding:10px 12px; font-weight:700;">${displayValue}</td>
      <td style="padding:10px 12px;">${r.unit || '-'}</td>
      <td style="padding:10px 12px;">${r.user || '-'}</td>
      <td style="padding:10px 12px; font-size:13px; opacity:0.8;">${r.note || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.updateTrendsAnalysis = updateTrendsAnalysis;

// --- DECIMAL INPUT FIX (eklenen yardımcı) ---