// =========================
// MERKEZI KONFİGÜRASYON
// =========================

const APP_CONFIG = {
  // Kategori tanımları - Tek kaynak, tüm projede kullanılır
  CATEGORIES: {
    KLOR: {
      key: 'klor',
      name: 'Klor',
      displayName: 'Klor',
      icon: '💧',
      color: { gradient: ['rgba(46,125,50,0.8)', 'rgba(27,94,32,1)'], border: '#1b5e20', point: '#2e7d32', pointHover: '#145214' }
    },
    SERTLIK: {
      key: 'sertlik',
      name: 'Sertlik',
      displayName: 'Sertlik',
      icon: '🔬',
      color: { gradient: ['rgba(33,150,243,0.8)', 'rgba(25,118,210,1)'], border: '#1976d2', point: '#2196f3', pointHover: '#0d47a1' }
    },
    PH: {
      key: 'ph',
      name: 'Ph',
      displayName: 'pH',
      icon: '⚗️',
      color: { gradient: ['rgba(156,39,176,0.8)', 'rgba(123,31,162,1)'], border: '#7b1fa2', point: '#9c27b0', pointHover: '#4a148c' }
    },
    ILETKENLIK: {
      key: 'iletkenlik',
      name: 'İletkenlik',
      displayName: 'İletkenlik',
      icon: '⚡',
      color: { gradient: ['rgba(255,152,0,0.8)', 'rgba(245,124,0,1)'], border: '#f57c00', point: '#ff9800', pointHover: '#e65100' }
    },
    MIKRO: {
      key: 'mikro',
      name: 'Mikro Biyoloji',
      displayName: 'Mikro Biyoloji',
      icon: '🦠',
      color: { gradient: ['rgba(233,30,99,0.8)', 'rgba(194,24,91,1)'], border: '#c2185b', point: '#e91e63', pointHover: '#880e4f' }
    },
    KAZAN_MIKSER: {
      key: 'kazanmikser',
      name: 'kazan-mikser',
      displayName: 'Kazan & Mikser',
      icon: '🌀',
      color: { gradient: ['rgba(96,125,139,0.8)', 'rgba(69,90,100,1)'], border: '#455a64', point: '#607d8b', pointHover: '#263238' },
      controlPoints: [
        '1010 / 3 Tonluk Mikser',
        '1011 / 7 Tonluk Mikser',
        '1012 / 7 Tonluk Mikser',
        '1013 / 2 Tonluk Mikser',
        '1014 / UNIMIX',
        '1015 / Emülsiyon Ünitesi',
        '1018 / 1 Tonluk Seyyar Transfer Kazanı',
        '1019 / 1 Tonluk Seyyar Transfer Kazanı',
        '1020 / 500 Litrelik Seyyar Tip Mikser Kazanı',
        '1021 / 500 Litrelik Seyyar Tip Mikser Kazanı',
        '1022 / 250 Litrelik Seyyar Tip Mikser Kazanı',
        '1023 / 250 Litrelik Seyyar Tip Mikser Kazanı',
        '1061 / 500 Litrelik Seyyar Mikser',
        '1108 / 250 Litrelik Seyyar Kazan',
        '1109 / 250 Litrelik Seyyar Kazan',
        '1135 / 500 Litrelik Seyyar Mikser',
        '1142 / Pilot Mikser - Dolmak'
      ]
    },
    DOLUM_MAKINALARI: {
      key: 'dolummakinalari',
      name: 'dolum-makinalari',
      displayName: 'Dolum Makinaları',
      icon: '🏭',
      color: { gradient: ['rgba(121,85,72,0.8)', 'rgba(93,64,55,1)'], border: '#5d4037', point: '#795548', pointHover: '#3e2723' },
      controlPoints: [
        '1029 / ALTILI LİKİT DOLUM VE KAPAMA MAKİNASI',
        '1148 / ROLL-ON DOLUM VE KAPAMA MAKİNASI'
      ]
    }
  },

  // Helper fonksiyonlar
  getCategoryByKey(key) {
    return Object.values(this.CATEGORIES).find(cat => cat.key === key);
  },

  getCategoryByName(name) {
    return Object.values(this.CATEGORIES).find(cat => cat.name === name);
  },

  getCategoryColor(key) {
    const cat = this.getCategoryByKey(key);
    return cat ? cat.color : this.CATEGORIES.KLOR.color;
  },

  // Legacy uyumluluk için mapping fonksiyonları
  getCategoryMap() {
    return {
      home: 'Anasayfa',
      klor: 'Klor',
      sertlik: 'Sertlik',
      ph: 'Ph',
      iletkenlik: 'İletkenlik',
      mikro: 'Mikro Biyoloji'
    };
  },

  getCategoryKeyToName() {
    return {
      klor: 'Klor',
      sertlik: 'Sertlik',
      ph: 'Ph',
      iletkenlik: 'İletkenlik',
      mikro: 'Mikro Biyoloji',
      kazanmikser: 'kazan-mikser',
      dolummakinalari: 'dolum-makinalari'
    };
  }
};

// Legacy değişkenleri APP_CONFIG'e yönlendir (geriye uyumluluk)
const categoryKeyToName = APP_CONFIG.getCategoryKeyToName();
const colorMap = Object.values(APP_CONFIG.CATEGORIES).reduce((acc, cat) => {
  acc[cat.key] = cat.color;
  return acc;
}, {});
const kazanMikserControlPoints = APP_CONFIG.CATEGORIES.KAZAN_MIKSER.controlPoints;
const dolumMakinalariControlPoints = APP_CONFIG.CATEGORIES.DOLUM_MAKINALARI.controlPoints;

// =========================
// GENERIC UTILITIES
// =========================

/**
 * Generic card filter utility - Tüm kategoriler için kullanılabilir
 * @param {string} gridId - Grid container ID
 * @param {string} searchTerm - Arama terimi
 * @param {string} resultCountId - Sonuç sayısı element ID
 * @param {string} searchInfoId - Search info container ID
 * @param {string} cardSelector - Card seçici (default: '.box, .card')
 * @param {string} itemName - Öğe adı (default: 'kontrol noktası')
 */
function filterCards(gridId, searchTerm, resultCountId, searchInfoId, cardSelector = '.box, .card, .kazan-mikser-card, .dolum-makinalari-card', itemName = 'öğe') {
  const grid = document.getElementById(gridId);
  const searchInfo = document.getElementById(searchInfoId);
  const resultCount = document.getElementById(resultCountId);

  if (!grid) return;

  const cards = grid.querySelectorAll(cardSelector);
  const term = searchTerm.toLowerCase().trim();
  let visibleCount = 0;

  cards.forEach(card => {
    const pointData = (card.getAttribute('data-point') || '').toLowerCase();

    if (term === '' || pointData.includes(term)) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // Sonuç sayısını göster
  if (term !== '') {
    if (searchInfo) searchInfo.style.display = '';
    if (resultCount) {
      if (visibleCount === 0) {
        resultCount.textContent = '❌ Sonuç bulunamadı';
        resultCount.style.color = '#d32f2f';
      } else if (visibleCount === cards.length) {
        resultCount.textContent = `✅ Tüm ${itemName}ler gösteriliyor (${visibleCount})`;
        resultCount.style.color = '#1b5e20';
      } else {
        resultCount.textContent = `🔍 ${visibleCount} ${itemName} bulundu`;
        resultCount.style.color = '#1976d2';
      }
    }
  } else {
    if (searchInfo) searchInfo.style.display = 'none';
  }

  return visibleCount;
}

/**
 * Modal göster/gizle utility - CSS class kullanır (inline style yerine, daha hızlı)
 * @param {string} modalId - Modal element ID
 * @param {boolean} show - true = göster, false = gizle
 */
function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (show) {
    modal.classList.remove('u-hidden');
    modal.classList.add('u-flex');
  } else {
    modal.classList.remove('u-flex');
    modal.classList.add('u-hidden');
  }
}

/**
 * Element göster/gizle utility - CSS class kullanır
 * @param {string} elementId - Element ID
 * @param {boolean} show - true = göster, false = gizle
 * @param {string} displayType - Display tipi ('block', 'flex', 'inline-block')
 */
function toggleElement(elementId, show = true, displayType = 'block') {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (show) {
    element.classList.remove('u-hidden');
    if (displayType === 'flex') element.classList.add('u-flex');
    else if (displayType === 'inline-block') element.classList.add('u-inline-block');
    else element.classList.add('u-block');
  } else {
    element.classList.remove('u-flex', 'u-block', 'u-inline-block');
    element.classList.add('u-hidden');
  }
}

/**
 * Chart update/create helper - Performans için update kullanır, gerekirse yeniden yaratır
 * @param {object} chartInstance - Mevcut chart instance veya null
 * @param {HTMLElement} ctx - Canvas element
 * @param {object} config - Chart.js config
 * @param {object} newData - Yeni data (labels ve datasets)
 * @returns {object} Chart instance
 */
function updateOrCreateChart(chartInstance, ctx, config, newData = null) {
  if (!ctx) return null;

  // Eğer chart yoksa, yeni oluştur
  if (!chartInstance) {
    return new Chart(ctx, config);
  }

  // Chart varsa ve sadece data değişiyorsa, update et (daha hızlı)
  if (newData) {
    chartInstance.data.labels = newData.labels;
    chartInstance.data.datasets = newData.datasets;
    chartInstance.update('none'); // 'none' = animasyon yok, çok hızlı
    return chartInstance;
  }

  // Config tamamen değiştiyse, destroy edip yeniden oluştur
  chartInstance.destroy();
  return new Chart(ctx, config);
}

// =========================
// DECIMAL INPUT FIX (global helpers)
// =========================
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

// ====== REAL-TIME SUBSCRIPTION ======
let realtimeChannel = null;
let realtimeLogsChannel = null;
let isRealtimeConnected = false;
let connectionCheckTimeout = null;

/**
 * Real-time subscription başlat
 * Veritabanındaki measurements ve logs tablolarını dinler ve değişiklikleri otomatik yansıtır
 */
function setupRealtimeSubscription() {
  // Mevcut kanal varsa önce kapat
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  if (realtimeLogsChannel) {
    supabaseClient.removeChannel(realtimeLogsChannel);
    realtimeLogsChannel = null;
  }

  console.log('🔌 Real-time subscription başlatılıyor...');

  // Measurements tablosunu dinle
  realtimeChannel = supabaseClient
    .channel('measurements_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE hepsini dinle
        schema: 'public',
        table: 'measurements'
      },
      (payload) => {
        console.log('✅ Real-time güncelleme alındı:', payload);

        // İlk veri geldiğinde bağlantıyı aktif say
        if (!isRealtimeConnected) {
          isRealtimeConnected = true;
          updateConnectionStatus();
          console.log('🟢 Real-time bağlantı aktif (veri alındı)');
        }

        handleRealtimeChange(payload);
      }
    )
    .subscribe((status) => {
      console.log('📡 Real-time status:', status);

      // SUBSCRIBED durumunda 2 saniye sonra otomatik yeşil yap
      if (status === 'SUBSCRIBED') {
        // Önceki timeout varsa temizle
        if (connectionCheckTimeout) {
          clearTimeout(connectionCheckTimeout);
        }

        // 2 saniye sonra bağlantıyı aktif say (veri gelmese bile)
        connectionCheckTimeout = setTimeout(() => {
          if (!isRealtimeConnected) {
            console.log('🟢 2 saniye geçti - Bağlantı aktif kabul ediliyor');
            isRealtimeConnected = true;
            updateConnectionStatus();
          }
        }, 2000);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('⚠️ Real-time bağlantı hatası:', status);
        isRealtimeConnected = false;
        updateConnectionStatus();
      }
    });

  // Logs tablosunu dinle (LOGIN/LOGOUT için)
  realtimeLogsChannel = supabaseClient
    .channel('logs_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'logs'
      },
      (payload) => {
        console.log('📋 Real-time log alındı:', payload);
        handleRealtimeLogChange(payload);
      }
    )
    .subscribe((status) => {
      console.log('📋 Logs status:', status);
    });
}

/**
 * Real-time değişikliği işle
 */
function handleRealtimeChange(payload) {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  if (eventType === 'INSERT') {
    console.log('✅ REAL-TIME: Yeni ölçüm eklendi -', newRecord.category, newRecord.point, newRecord.value);

    // Cache'e ekle
    cachedRecords.unshift(newRecord);

    // Tüm ilgili görünümleri güncelle
    updateRecentRecordsDisplay();

    if (currentSection === 'home') {
      refreshHomepage();
    } else if (currentSection === newRecord.category) {
      refreshCurrentSection();
    } else if (currentSection === 'executive-dashboard') {
      refreshExecutiveDashboard();
    }

    // Trend analizi her zaman güncelle
    updateTrendFromStorage();

  } else if (eventType === 'UPDATE') {
    console.log('🔄 REAL-TIME: Kayıt güncellendi -', newRecord.id);

    // Cache'i güncelle
    const index = cachedRecords.findIndex(r => r.id === newRecord.id);
    if (index !== -1) {
      cachedRecords[index] = newRecord;
    }

    // Tüm görünümleri yenile
    refreshCurrentSection();
    updateTrendFromStorage();

    if (currentSection === 'executive-dashboard') {
      refreshExecutiveDashboard();
    }

  } else if (eventType === 'DELETE') {
    console.log('❌ REAL-TIME: Kayıt silindi -', oldRecord.id);

    // Cache'den kaldır
    cachedRecords = cachedRecords.filter(r => r.id !== oldRecord.id);

    // Tüm görünümleri yenile
    refreshCurrentSection();
    updateRecentRecordsDisplay();
    updateTrendFromStorage();

    if (currentSection === 'executive-dashboard') {
      refreshExecutiveDashboard();
    }
  }
}

/**
 * Anasayfa son kayıtları güncelle
 */
function updateRecentRecordsDisplay() {
  const grid = document.getElementById('recent-grid');
  if (!grid) return;

  // Son 20 kaydı göster
  const recentRecords = cachedRecords.slice(0, 20);

  // Mevcut HTML'i temizle
  grid.innerHTML = '';

  // Her kayıt için kart oluştur
  recentRecords.forEach(rec => {
    const cat = APP_CONFIG.getCategoryByKey(rec.category);
    if (!cat) return;

    const box = document.createElement('div');
    box.className = 'box';
    box.setAttribute('data-point', rec.control_point);

    const dateStr = new Date(rec.created_at).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    box.innerHTML = `
      <div class="box-header">
        <span class="icon">${cat.icon}</span>
        <span>${cat.displayName}</span>
      </div>
      <div class="box-body">
        <strong>${rec.control_point}</strong>
        <p>${dateStr}</p>
        <p>${rec.value} ${rec.unit || ''}</p>
      </div>
    `;

    grid.appendChild(box);
  });
}

/**
 * Aktif section'ı yenile
 */
function refreshCurrentSection() {
  if (currentSection && currentSection !== 'home' && currentSection !== 'executive-dashboard') {
    showSection(currentSection);
  }
}

/**
 * Anasayfayı yenile
 */
function refreshHomepage() {
  if (currentSection === 'home') {
    loadRecent();
  }
}

/**
 * Executive dashboard'u yenile
 */
function refreshExecutiveDashboard() {
  if (currentSection === 'executive-dashboard') {
    showExecutiveDashboard();
  }
}

/**
 * Real-time log değişikliğini işle
 */
function handleRealtimeLogChange(payload) {
  const { new: newLog } = payload;

  // LOGIN veya LOGOUT loguysa dashboard'u güncelle
  if (newLog && (newLog.action === 'LOGIN' || newLog.action === 'LOGOUT')) {
    console.log('Yeni kullanıcı aktivitesi:', newLog);

    // Dashboard aktifse hemen güncelle
    if (currentSection === 'executive-dashboard') {
      refreshExecutiveDashboard();
    }
  }
}

/**
 * Bağlantı durumunu göster
 */
function updateConnectionStatus() {
  const statusIndicator = document.getElementById('realtime-status');
  if (statusIndicator) {
    if (isRealtimeConnected) {
      statusIndicator.classList.remove('disconnected');
      statusIndicator.classList.add('connected');
      statusIndicator.title = 'Canlı bağlantı aktif';
    } else {
      statusIndicator.classList.remove('connected');
      statusIndicator.classList.add('disconnected');
      statusIndicator.title = 'Bağlantı kesildi';
    }
  }
}

/**
 * Real-time subscription'ı durdur
 */
function stopRealtimeSubscription() {
  // Timeout'u temizle
  if (connectionCheckTimeout) {
    clearTimeout(connectionCheckTimeout);
    connectionCheckTimeout = null;
  }

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
    isRealtimeConnected = false;
    updateConnectionStatus();
    console.log('Real-time subscription durduruldu');
  }
  if (realtimeLogsChannel) {
    supabaseClient.removeChannel(realtimeLogsChannel);
    realtimeLogsChannel = null;
    console.log('Real-time logs subscription durduruldu');
  }
}

// ====== INIT ======
window.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const loginScreen = document.getElementById('login-screen');
  const portalScreen = document.getElementById('portal-screen');

  if (isLoggedIn && loginScreen && portalScreen) {
    document.body.classList.remove('login-active');
    toggleElement('login-screen', false);
    toggleElement('portal-screen', true, 'block');

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
      showExecutiveMenu(); // Dashboard
      showHomepage();
      await loadRecent();
      updateTrendFromStorage();
    } else if (currentUserRole === 'full') {
      showFullAccessMenu(); // Trend Analizi
      showExecutiveMenu(); // Dashboard (Full access için de göster)
      showHomepage();
      await loadRecent();
      updateTrendFromStorage();
    } else if (currentUserRole === 'executive') {
      showFullAccessMenu(); // Trend Analizi
      showExecutiveMenu(); // Dashboard (Executive menü kısıtlamaları sonrasında uygulanır)
      await loadRecent(); // Verileri yükle (Trend Analizi için gerekli)
      showSection('executive-dashboard'); // Executive için anasayfa Dashboard
    } else {
      showHomepage();
      await loadRecent();
      updateTrendFromStorage();
    }

    // Real-time subscription başlat
    setupRealtimeSubscription();
  }

  initClock();
  initMobileMenuScrim();
});

// Sayfa kapatılırken real-time subscription'ı durdur
window.addEventListener('beforeunload', () => {
  stopRealtimeSubscription();
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

      toggleElement('login-screen', false);
      toggleElement('portal-screen', true, 'block');
      document.body.classList.remove('login-active');

      const userEl = document.getElementById('logged-user');
      if (userEl) userEl.textContent = email;

      // Kullanıcı rolünü al
      await loadUserRole(email);

      // Rol bazlı menü gösterimi
      if (currentUserRole === 'admin') {
        showFullAccessMenu(); // Trend Analizi
        showAdminMenu(); // Logs + User Management
        showExecutiveMenu(); // Dashboard
        await logActivity('LOGIN', 'Auth', { email });
        showHomepage();
        loadRecent();
      } else if (currentUserRole === 'full') {
        showFullAccessMenu(); // Trend Analizi
        showExecutiveMenu(); // Dashboard (Full access için de göster)
        await logActivity('LOGIN', 'Auth', { email });
        showHomepage();
        loadRecent();
      } else if (currentUserRole === 'executive') {
        showFullAccessMenu(); // Trend Analizi
        showExecutiveMenu(); // Dashboard (Executive menü kısıtlamaları sonrasında uygulanır)
        await logActivity('LOGIN', 'Auth', { email });
        loadRecent(); // Verileri yükle (Trend Analizi için gerekli)
        showSection('executive-dashboard'); // Executive için anasayfa Dashboard
      } else {
        await logActivity('LOGIN', 'Auth', { email });
        showHomepage();
        loadRecent();
      }

      // Real-time subscription başlat (login sonrası)
      setupRealtimeSubscription();
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
    trendsTab.innerHTML = `
      <span class="tab-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </span>
      <span class="tab-text">Trendler</span>
    `;
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

  ['home', 'su-analizi', 'klor', 'sertlik', 'ph', 'iletkenlik', 'mikro', 'kazan-mikser', 'dolum-makinalari', 'admin-panel', 'logs', 'users', 'trends', 'executive-dashboard'].forEach(s => {
    const el = document.getElementById(`page-${s}`);
    if (el) el.style.display = s === key ? '' : 'none';
  });

  const initFuncs = {
    klor: initKlorPage,
    sertlik: initSertlikPage,
    ph: initPhPage,
    iletkenlik: initIletkenlikPage,
    mikro: initMikroPage,
    'kazan-mikser': initKazanMikserPage,
    'dolum-makinalari': initDolumMakinalariPage,
    logs: initLogsPage,
    users: initUsersPage,
    trends: initTrendsPage,
    'executive-dashboard': updateExecutiveDashboard
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
  const mostCheckedPointEl = document.getElementById('most-checked-point');
  const mostCheckedCountEl = document.getElementById('most-checked-count');

  if (totalEl) totalEl.textContent = records.length;

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.date === today);

  if (todayEl) {
    todayEl.textContent = todayRecords.length;
  }

  // Bugün en çok kontrol yapılan noktayı hesapla
  if (mostCheckedPointEl && mostCheckedCountEl) {
    if (todayRecords.length === 0) {
      mostCheckedPointEl.textContent = '-';
      mostCheckedCountEl.textContent = '0 ölçüm';
    } else {
      // Kontrol noktalarını say
      const pointCounts = {};
      todayRecords.forEach(r => {
        if (r.point) {
          pointCounts[r.point] = (pointCounts[r.point] || 0) + 1;
        }
      });

      // En çok kontrol edilen noktayı bul
      let maxPoint = '';
      let maxCount = 0;
      Object.entries(pointCounts).forEach(([point, count]) => {
        if (count > maxCount) {
          maxCount = count;
          maxPoint = point;
        }
      });

      if (maxPoint) {
        // Uzun isimler için kısalt
        const displayPoint = maxPoint.length > 25 ? maxPoint.substring(0, 25) + '...' : maxPoint;
        mostCheckedPointEl.textContent = displayPoint;
        mostCheckedPointEl.title = maxPoint; // Tam isim için tooltip
        mostCheckedCountEl.textContent = `${maxCount} ölçüm`;
      } else {
        mostCheckedPointEl.textContent = '-';
        mostCheckedCountEl.textContent = '0 ölçüm';
      }
    }
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
let allLogsData = []; // Tüm logları sakla

// Log tiplerini belirle ve kategorize et
function getLogType(action) {
  if (action === 'LOGIN' || action === 'LOGOUT') return 'auth';
  if (action === 'MEASUREMENT_ADD' || action === 'MEASUREMENT_ERROR') return 'data';
  if (action === 'PAGE_VIEW' || action === 'TRENDS_ANALYSIS') return 'view';
  return 'other';
}

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
      logsContainer.innerHTML = '<p style="opacity:0.6; padding:20px; text-align:center;">Henüz log kaydı yok.</p>';
      return;
    }

    // Tüm logları sakla
    allLogsData = data;

    // Kullanıcı dropdown'unu doldur
    populateUserFilter(data);

    // Logları render et
    renderLogs(data);
  } catch (err) {
    console.error('Logs yükleme hatası:', err);
    logsContainer.innerHTML = '<p style="color:#d32f2f; padding:20px; text-align:center;">Beklenmeyen hata oluştu: ' + err.message + '</p>';
  }
}

function populateUserFilter(logs) {
  const userSelect = document.getElementById('log-filter-user');
  if (!userSelect) return;

  // Benzersiz kullanıcıları topla
  const users = [...new Set(logs.map(log => log.user_email).filter(email => email))].sort();

  // Dropdown'u temizle ve doldur
  userSelect.innerHTML = '<option value="">Tüm Kullanıcılar</option>';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user;
    option.textContent = user;
    userSelect.appendChild(option);
  });
}

function applyLogFilters() {
  const filterType = document.getElementById('log-filter-type')?.value || '';
  const filterUser = document.getElementById('log-filter-user')?.value || '';
  const filterStartDate = document.getElementById('log-filter-start-date')?.value || '';
  const filterEndDate = document.getElementById('log-filter-end-date')?.value || '';

  // Filtreleme uygula
  let filteredData = allLogsData.filter(log => {
    // Tip filtresi
    if (filterType) {
      const logType = getLogType(log.action);
      if (logType !== filterType) return false;
    }

    // Kullanıcı filtresi
    if (filterUser && log.user_email !== filterUser) return false;

    // Tarih filtresi
    if (filterStartDate || filterEndDate) {
      const logDate = new Date(log.created_at).toISOString().slice(0, 10);
      if (filterStartDate && logDate < filterStartDate) return false;
      if (filterEndDate && logDate > filterEndDate) return false;
    }

    return true;
  });

  // Filtrelenmiş logları render et
  renderLogs(filteredData);

  // İstatistik göster
  const statsDiv = document.getElementById('log-filter-stats');
  const statsText = document.getElementById('log-filter-result-text');
  if (statsDiv && statsText) {
    statsDiv.style.display = '';
    statsText.textContent = `${filteredData.length} adet log bulundu (Toplam: ${allLogsData.length})`;
  }
}

function clearLogFilters() {
  // Filtreleri temizle
  const filterType = document.getElementById('log-filter-type');
  const filterUser = document.getElementById('log-filter-user');
  const filterStartDate = document.getElementById('log-filter-start-date');
  const filterEndDate = document.getElementById('log-filter-end-date');

  if (filterType) filterType.value = '';
  if (filterUser) filterUser.value = '';
  if (filterStartDate) filterStartDate.value = '';
  if (filterEndDate) filterEndDate.value = '';

  // İstatistiği gizle
  const statsDiv = document.getElementById('log-filter-stats');
  if (statsDiv) statsDiv.style.display = 'none';

  // Tüm logları göster
  renderLogs(allLogsData);
}

function renderLogs(data) {
  const logsContainer = document.getElementById('logs-table-container');
  if (!logsContainer) return;

  if (!data || data.length === 0) {
    logsContainer.innerHTML = '<p style="opacity:0.6; padding:20px; text-align:center;">Seçilen filtrelere uygun log bulunamadı.</p>';
    return;
  }

    const getLogConfig = (type) => {
      const configs = {
        auth: {
          icon: '🔐',
          color: '#2196f3',
          bgColor: '#e3f2fd',
          borderColor: '#90caf9',
          label: 'Oturum'
        },
        data: {
          icon: '📊',
          color: '#4caf50',
          bgColor: '#e8f5e9',
          borderColor: '#a5d6a7',
          label: 'Veri Kaydı'
        },
        view: {
          icon: '👁️',
          color: '#ff9800',
          bgColor: '#fff3e0',
          borderColor: '#ffcc80',
          label: 'Görüntüleme'
        },
        other: {
          icon: '⚙️',
          color: '#9e9e9e',
          bgColor: '#f5f5f5',
          borderColor: '#e0e0e0',
          label: 'Diğer'
        }
      };
      return configs[type] || configs.other;
    };

    const formatActionText = (action) => {
      const actionMap = {
        'LOGIN': 'Giriş Yaptı',
        'LOGOUT': 'Çıkış Yaptı',
        'MEASUREMENT_ADD': 'Ölçüm Ekledi',
        'MEASUREMENT_ERROR': 'Ölçüm Hatası',
        'PAGE_VIEW': 'Sayfa Görüntüledi',
        'TRENDS_ANALYSIS': 'Trend Analizi Yaptı'
      };
      return actionMap[action] || action;
    };

    const formatDetails = (details, action) => {
      if (!details || Object.keys(details).length === 0) return null;

      let formatted = [];

      if (action === 'MEASUREMENT_ADD') {
        if (details.point) formatted.push(`📍 ${details.point}`);
        if (details.value !== undefined) formatted.push(`📈 ${details.value}${details.unit ? ' ' + details.unit : ''}`);
      } else if (action === 'TRENDS_ANALYSIS') {
        if (details.category) formatted.push(`📊 ${details.category}`);
        if (details.point) formatted.push(`📍 ${details.point}`);
        if (details.dateRange) formatted.push(`📅 ${details.dateRange}`);
      } else if (action === 'PAGE_VIEW') {
        if (details.page) formatted.push(`📄 ${details.page}`);
      }

      return formatted.length > 0 ? formatted : null;
    };

    // Kart bazlı mobil uyumlu tasarım
    let html = '<div class="logs-grid">';

    data.forEach((log, i) => {
      const date = new Date(log.created_at);
      const dateStr = date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const logType = getLogType(log.action);
      const config = getLogConfig(logType);
      const actionText = formatActionText(log.action);
      const detailsList = formatDetails(log.details, log.action);

      html += `
        <div class="log-card log-card-${logType}" style="animation:fadeInRow 0.3s ease ${i * 0.02}s both;">
          <div class="log-card-header">
            <div class="log-icon" style="background:${config.bgColor}; border-color:${config.borderColor};">
              <span style="font-size:24px;">${config.icon}</span>
            </div>
            <div class="log-info-header">
              <div class="log-type-badge" style="background:${config.bgColor}; color:${config.color}; border-color:${config.borderColor};">
                ${config.label}
              </div>
              <div class="log-action">${actionText}</div>
              <div class="log-time">📅 ${dateStr} • ⏰ ${timeStr}</div>
            </div>
          </div>

          <div class="log-card-body">
            <div class="log-user">
              <span class="log-user-label">Kullanıcı:</span>
              <span class="log-user-value">${log.user_email}</span>
            </div>

            ${log.category && log.category !== 'Auth' ? `
              <div class="log-category">
                <span class="log-category-label">Kategori:</span>
                <span class="log-category-value">${log.category}</span>
              </div>
            ` : ''}

            ${detailsList ? `
              <div class="log-details">
                ${detailsList.map(detail => `<div class="log-detail-item">${detail}</div>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    logsContainer.innerHTML = html;
}

// Global scope'a filtre fonksiyonlarını ekle
window.applyLogFilters = applyLogFilters;
window.clearLogFilters = clearLogFilters;

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
      usersContainer.innerHTML = '<p style="opacity:0.6; padding:20px; text-align:center;">Henüz kullanıcı kaydı yok.</p>';
      return;
    }

    // Mobil uyumlu kart bazlı tasarım
    let html = '<div class="users-grid">';

    authUsers.forEach((user, i) => {
      const email = user.email;
      const createdDate = new Date(user.created_at);
      const createdStr = createdDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
      const createdTime = createdDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
      const lastSignInDate = lastSignIn ? lastSignIn.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      const lastSignInTime = lastSignIn ? lastSignIn.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '';

      const currentRole = user.role || 'full';
      const roleId = user.role_id || null;

      const roleColors = {
        'admin': '#d32f2f',
        'executive': '#7b1fa2',
        'full': '#1976d2',
        'restricted': '#f57c00'
      };

      const roleIcons = {
        'admin': '⚙️',
        'executive': '📊',
        'full': '✓',
        'restricted': '◐'
      };

      html += `
        <div class="user-card" style="animation:fadeInRow 0.3s ease ${i * 0.05}s both;">
          <div class="user-card-header">
            <div class="user-avatar">${email.charAt(0).toUpperCase()}</div>
            <div class="user-info-header">
              <div class="user-email">${email}</div>
              <div class="user-meta">
                <span>📅 ${createdStr}</span>
                <span>•</span>
                <span>⏰ ${createdTime}</span>
              </div>
            </div>
          </div>

          <div class="user-card-body">
            <div class="user-stat">
              <span class="stat-label">Son Giriş</span>
              <span class="stat-value">
                ${lastSignInDate}
                ${lastSignInTime ? `<span style="color:#666; font-size:12px; margin-left:6px;">⏰ ${lastSignInTime}</span>` : ''}
              </span>
            </div>

            <div class="user-role-section">
              <label class="role-label">Yetki Seviyesi</label>
              <select id="role-${email.replace(/[@.]/g, '_')}" class="role-select">
                <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>⚙️ Admin - Tam Yetki + Yönetim</option>
                <option value="executive" ${currentRole === 'executive' ? 'selected' : ''}>📊 Üst Yönetim - Dashboard + Raporlar</option>
                <option value="full" ${currentRole === 'full' ? 'selected' : ''}>✓ Tam Yetki</option>
                <option value="restricted" ${currentRole === 'restricted' ? 'selected' : ''}>◐ Kısıtlı Erişim</option>
              </select>
            </div>
          </div>

          <div class="user-card-footer">
            <button onclick="updateUserRoleByEmail('${email}', ${roleId})" class="btn-update">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Kaydet
            </button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    usersContainer.innerHTML = html;
  } catch (err) {
    console.error('Kullanıcı yükleme hatası:', err);
    usersContainer.innerHTML = '<p style="color:#d32f2f; padding:20px; text-align:center;">Beklenmeyen hata oluştu: ' + err.message + '</p>';
  }
}

function getRoleLabel(role) {
  const labels = {
    'admin': 'Admin (Tam Yetki + Kullanıcı Yönetimi)',
    'executive': 'Üst Yönetim (Dashboard + Raporlar)',
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
  
  toggleElement('entry-overlay', true, 'block');
  toggleModal('entry-modal', true);
  valueInput.focus();
}

function closeModal() {
  toggleElement('entry-overlay', false);
  toggleModal('entry-modal', false);
  if (form) form.reset();
}

if (btnClose) btnClose.addEventListener('click', closeModal);
if (btnCancel) btnCancel.addEventListener('click', closeModal);
if (overlay) overlay.addEventListener('click', closeModal);

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const categoryMap = APP_CONFIG.getCategoryMap();

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
// Not: Tüm category tanımları artık APP_CONFIG'de - yukarıda legacy uyumluluk sağlandı

function buildTrendData(categoryKey) {
  const name = categoryKeyToName[categoryKey];

  // pH veya İletkenlik seçildiğinde, hem kendi kategorisinden hem de kazan-mikser kategorisinden verileri al
  let filteredRecords;
  if (categoryKey === 'ph' || categoryKey === 'iletkenlik') {
    filteredRecords = cachedRecords.filter(r => {
      // Kendi kategorisinden veriler
      if (r.category === name && r.value != null && r.value !== '') return true;
      // kazan-mikser kategorisinden, sadece ilgili birime sahip veriler
      if (r.category === 'kazan-mikser' && r.value != null && r.value !== '') {
        // pH için: birim boş, "pH", "ph" veya "PH" olanlar
        if (categoryKey === 'ph') {
          const unit = (r.unit || '').toLowerCase().trim();
          return unit === '' || unit === 'ph' || unit.includes('ph');
        }
        // İletkenlik için: µS/cm veya us/cm içeren birimler
        if (categoryKey === 'iletkenlik') {
          const unit = (r.unit || '').toLowerCase();
          return unit.includes('µs/cm') || unit.includes('us/cm') || unit.includes('μs/cm');
        }
      }
      return false;
    });
  } else {
    // Diğer kategoriler için sadece kendi verilerini al
    filteredRecords = cachedRecords.filter(r => r.category === name && r.value != null && r.value !== '');
  }

  return filteredRecords
    .map(r => ({
      label: `${r.date} ${r.time}`,
      value: parseTRNumber(r.value),
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
let currentQuickFilter = 'month';
const pageInitsExtended = { trends: false };

function initTrendsPage() {
  if (pageInitsExtended.trends) return;
  pageInitsExtended.trends = true;

  // Log sayfa ziyareti
  logActivity('PAGE_VIEW', 'Trends', { page: 'trends' });

  // Kategori değişikliğinde kontrol noktalarını güncelle ve test tipi dropdown'ını göster/gizle
  const categorySelect = document.getElementById('trends-category');
  const testTypeContainer = document.getElementById('trends-test-type-container');

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      updateTrendsControlPoints();

      // Kazan & Mikser veya Dolum Makinaları kategorisi seçiliyse test tipi dropdown'ını göster
      if (testTypeContainer) {
        const showTestType = categorySelect.value === 'kazanmikser' || categorySelect.value === 'dolummakinalari';
        testTypeContainer.style.display = showTestType ? '' : 'none';
      }
    });
    updateTrendsControlPoints(); // İlk yükleme
  }

  // Varsayılan olarak "Bu Ay" filtresi ile başlat
  applyQuickFilter('month');
}

function updateTrendsControlPoints() {
  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');

  if (!categorySelect || !pointSelect) return;

  const category = categorySelect.value;

  console.log('🔍 updateTrendsControlPoints çağrıldı');
  console.log('📊 Kategori:', category);
  console.log('📦 cachedRecords uzunluğu:', cachedRecords.length);

  // Tüm kategorileri göster
  const allCategories = [...new Set(cachedRecords.map(r => r.category))];
  console.log('📋 Veritabanındaki tüm kategoriler:', allCategories);

  // "Tümü" seçiliyse tüm kategorilerden kontrol noktalarını al
  let points;
  if (category === 'all') {
    points = [...new Set(
      cachedRecords
        .map(r => r.point)
        .filter(p => p)
    )].sort();
  } else {
    const categoryName = categoryKeyToName[category];
    console.log('🏷️ categoryName:', categoryName);

    // pH veya İletkenlik seçildiğinde, hem kendi kategorisinden hem de kazan-mikser kategorisinden kontrol noktalarını al
    if (category === 'ph' || category === 'iletkenlik') {
      const dbPoints = cachedRecords
        .filter(r => {
          // Kendi kategorisinden noktalar
          if (r.category === categoryName) return true;
          // kazan-mikser kategorisinden noktalar
          if (r.category === 'kazan-mikser' && r.value != null && r.value !== '') {
            // pH için: birim boş, "pH", "ph" veya "PH" olanlar
            if (category === 'ph') {
              const unit = (r.unit || '').toLowerCase().trim();
              return unit === '' || unit === 'ph' || unit.includes('ph');
            }
            // İletkenlik için: µS/cm veya us/cm içeren birimler
            if (category === 'iletkenlik') {
              const unit = (r.unit || '').toLowerCase();
              return unit.includes('µs/cm') || unit.includes('us/cm') || unit.includes('μs/cm');
            }
          }
          return false;
        })
        .map(r => r.point)
        .filter(p => p);

      // Sabit Kazan & Mikser kontrol noktalarını da ekle
      points = [...new Set([...kazanMikserControlPoints, ...dbPoints])].sort();
    } else if (category === 'kazanmikser') {
      // Kazan & Mikser kategorisi seçildiğinde hem sabit kontrol noktalarını hem de veritabanındakileri göster
      const kazanMikserRecords = cachedRecords.filter(r => r.category === 'kazan-mikser');
      console.log('⚙️ KazanMikser kayıtları:', kazanMikserRecords.length);
      console.log('⚙️ İlk 3 KazanMikser kaydı:', kazanMikserRecords.slice(0, 3));

      // Veritabanındaki kontrol noktaları
      const dbPoints = kazanMikserRecords.map(r => r.point).filter(p => p);

      // Sabit kontrol noktaları + veritabanındaki kontrol noktaları (benzersiz)
      points = [...new Set([...kazanMikserControlPoints, ...dbPoints])].sort();
    } else if (category === 'dolummakinalari') {
      // Dolum Makinaları kategorisi seçildiğinde hem sabit kontrol noktalarını hem de veritabanındakileri göster
      const dolumMakinalariRecords = cachedRecords.filter(r => r.category === 'dolum-makinalari');
      console.log('📦 DolumMakinalari kayıtları:', dolumMakinalariRecords.length);
      console.log('📦 İlk 3 DolumMakinalari kaydı:', dolumMakinalariRecords.slice(0, 3));

      // Veritabanındaki kontrol noktaları - sadece makina ismini al (test tipi ve nozul bilgisi olmadan)
      const dbPoints = dolumMakinalariRecords
        .map(r => (r.point || '').split(' - ')[0]) // "1029 / ALTILI..." kısmını al
        .filter(p => p);

      // Sabit kontrol noktaları + veritabanındaki kontrol noktaları (benzersiz)
      points = [...new Set([...dolumMakinalariControlPoints, ...dbPoints])].sort();
    } else {
      // Diğer kategoriler için sadece kendi kontrol noktalarını al
      points = [...new Set(
        cachedRecords
          .filter(r => r.category === categoryName)
          .map(r => r.point)
          .filter(p => p)
      )].sort();
    }
  }

  console.log('✅ Bulunan kontrol noktaları:', points);

  // Mevcut seçili değeri kaydet
  const currentSelectedPoint = pointSelect.value;

  // Dropdown'u güncelle
  pointSelect.innerHTML = '<option value="">Tüm Noktalar</option>';
  points.forEach(point => {
    const option = document.createElement('option');
    option.value = point;
    option.textContent = point;
    pointSelect.appendChild(option);
  });

  // Eğer önceden seçili bir değer varsa ve hala listede mevcutsa, onu tekrar seç
  if (currentSelectedPoint && points.includes(currentSelectedPoint)) {
    pointSelect.value = currentSelectedPoint;
  }
}

function updateTrendsAnalysis() {
  // Önce kontrol noktalarını güncelle
  updateTrendsControlPoints();

  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');
  const startDateInput = document.getElementById('trends-start-date');
  const endDateInput = document.getElementById('trends-end-date');

  if (!categorySelect || !pointSelect) return;

  const category = categorySelect.value;
  const selectedPoint = pointSelect.value;
  const startDate = startDateInput?.value || '';
  const endDate = endDateInput?.value || '';
  const testTypeSelect = document.getElementById('trends-test-type');
  const testType = testTypeSelect?.value || '';

  // Log analiz güncelleme
  logActivity('TRENDS_ANALYSIS', 'Trends', {
    category,
    point: selectedPoint || 'Tümü',
    dateRange: `${startDate} - ${endDate}`
  });

  // "Tümü" seçiliyse tüm kategorilerden veri al
  let filteredData;
  if (category === 'all') {
    filteredData = cachedRecords.filter(r => {
      if (selectedPoint && r.point !== selectedPoint) return false;
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return r.value != null && r.value !== '';
    });
  } else {
    const categoryName = categoryKeyToName[category];

    // pH veya İletkenlik seçildiğinde, hem kendi kategorisinden hem de kazan-mikser kategorisinden verileri al
    if (category === 'ph' || category === 'iletkenlik') {
      filteredData = cachedRecords.filter(r => {
        // Tarih filtresi
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        if (r.value == null || r.value === '') return false;

        // Kendi kategorisinden veriler
        if (r.category === categoryName) {
          if (selectedPoint && r.point !== selectedPoint) return false;
          return true;
        }

        // kazan-mikser kategorisinden veriler
        if (r.category === 'kazan-mikser') {
          if (selectedPoint && r.point !== selectedPoint) return false;
          // pH için: birim boş, "pH", "ph" veya "PH" olanlar
          if (category === 'ph') {
            const unit = (r.unit || '').toLowerCase().trim();
            return unit === '' || unit === 'ph' || unit.includes('ph');
          }
          // İletkenlik için: µS/cm veya us/cm içeren birimler
          if (category === 'iletkenlik') {
            const unit = (r.unit || '').toLowerCase();
            return unit.includes('µs/cm') || unit.includes('us/cm') || unit.includes('μs/cm');
          }
        }

        return false;
      });
    } else if (category === 'kazanmikser') {
      // Kazan & Mikser kategorisi seçildiğinde kazan-mikser kategorisinden test tipine göre verileri al
      filteredData = cachedRecords.filter(r => {
        if (r.category !== 'kazan-mikser') return false;
        if (selectedPoint && r.point !== selectedPoint) return false;
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        if (r.value == null || r.value === '') return false;

        // Test tipi filtresi
        if (testType) {
          const unit = (r.unit || '').toLowerCase();
          if (testType === 'ph') {
            // pH için: birim boş, "pH", "ph" veya "PH" olanlar
            return unit === '' || unit === 'ph' || unit.includes('ph');
          } else if (testType === 'iletkenlik') {
            // İletkenlik için: µS/cm veya us/cm içeren birimler
            return unit.includes('µs/cm') || unit.includes('us/cm') || unit.includes('μs/cm');
          }
        }

        return true;
      });
    } else if (category === 'dolummakinalari') {
      // Dolum Makinaları kategorisi seçildiğinde dolum-makinalari kategorisinden test tipine göre verileri al
      console.log('🔍 Dolum Makinaları filtreleme başladı');
      console.log('📊 Toplam cached kayıt:', cachedRecords.length);
      console.log('🎯 selectedPoint:', selectedPoint);
      console.log('🧪 testType:', testType);

      filteredData = cachedRecords.filter(r => {
        if (r.category !== 'dolum-makinalari') return false;
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        if (r.value == null || r.value === '') return false;

        // Test tipi filtresi - unit veya point alanında test tipi var
        if (testType) {
          const pointLower = (r.point || '').toLowerCase();
          const unitLower = (r.unit || '').toLowerCase();
          const testTypeLower = testType.toLowerCase();

          if (testTypeLower === 'ph') {
            // pH için: unit'de "ph" var VEYA point'de "ph" var
            const hasPhInUnit = unitLower.includes('ph');
            const hasPhInPoint = pointLower.includes('ph');
            if (!hasPhInUnit && !hasPhInPoint) return false;
          } else if (testTypeLower === 'iletkenlik' || testTypeLower === 'İletkenlik'.toLowerCase()) {
            // İletkenlik için: unit'de "µs/cm" var VEYA point'de "iletkenlik" var
            const hasIletkenlikInUnit = unitLower.includes('µs/cm') || unitLower.includes('us/cm') || unitLower.includes('μs/cm');
            const hasIletkenlikInPoint = pointLower.includes('iletkenlik');
            if (!hasIletkenlikInUnit && !hasIletkenlikInPoint) return false;
          }
        }

        // Kontrol noktası filtresi - seçili nokta point'in başında olmalı
        if (selectedPoint && selectedPoint !== '') {
          const pointStart = (r.point || '').split(' - ')[0]; // "1029 / ALTILI..." kısmını al
          if (pointStart !== selectedPoint) return false;
        }

        return true;
      });

      console.log('✅ Filtrelenmiş veri sayısı:', filteredData.length);
      if (filteredData.length > 0) {
        console.log('📦 İlk 3 kayıt:', filteredData.slice(0, 3).map(r => ({
          point: r.point,
          unit: r.unit,
          value: r.value
        })));
      }
    } else {
      // Diğer kategoriler için sadece kendi verilerini al
      filteredData = cachedRecords.filter(r => {
        if (r.category !== categoryName) return false;
        if (selectedPoint && r.point !== selectedPoint) return false;
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        return r.value != null && r.value !== '';
      });
    }
  }

  // Tarihe göre sırala
  filteredData = filteredData.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    return dateComp !== 0 ? dateComp : a.time.localeCompare(b.time);
  });

  // İstatistikleri hesapla ve göster
  updateTrendsStats(filteredData);

  // "Tümü" seçiliyse grafiği gizle
  const chartContainer = document.getElementById('trends-chart-container');
  if (category === 'all') {
    if (chartContainer) chartContainer.style.display = 'none';
  } else {
    if (chartContainer) chartContainer.style.display = '';
    // Grafik çiz
    drawTrendsChart(filteredData, category);
  }

  // Tabloyu güncelle
  renderTrendsTable(filteredData);
}

function updateTrendsStats(data) {
  const totalEl = document.getElementById('trends-stat-total');
  const avgEl = document.getElementById('trends-stat-avg');
  const maxEl = document.getElementById('trends-stat-max');
  const minEl = document.getElementById('trends-stat-min');
  const stdEl = document.getElementById('trends-stat-std');

  if (!totalEl || !avgEl || !maxEl || !minEl || !stdEl) return;

  if (!data || data.length === 0) {
    totalEl.textContent = '0';
    avgEl.textContent = '-';
    maxEl.textContent = '-';
    minEl.textContent = '-';
    stdEl.textContent = '-';
    return;
  }

  // "Tümü" kategorisi ve "Tüm Noktalar" seçiliyse alternatif istatistikler göster
  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');
  const showAlternativeStats = categorySelect?.value === 'all' && (!pointSelect?.value || pointSelect?.value === '');

  if (showAlternativeStats) {
    showOverviewStats(data, totalEl, avgEl, maxEl, minEl, stdEl);
    return;
  }

  // Normal istatistikler için label'ları güncelle
  updateStatCardLabels(false);

  // Normal sayısal istatistikler
  const values = data.map(r => parseTRNumber(r.value)).filter(v => !isNaN(v));

  if (values.length === 0) {
    totalEl.textContent = data.length;
    avgEl.textContent = '-';
    maxEl.textContent = '-';
    minEl.textContent = '-';
    stdEl.textContent = '-';
    return;
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  // Ortalamanın üstünde ve altında kaç değer var
  const aboveAvg = values.filter(v => v > avg).length;
  const belowAvg = values.filter(v => v < avg).length;
  const equalAvg = values.filter(v => v === avg).length;

  // Yüzde hesaplama
  const abovePercent = ((aboveAvg / values.length) * 100).toFixed(1);
  const belowPercent = ((belowAvg / values.length) * 100).toFixed(1);

  totalEl.textContent = data.length;
  avgEl.textContent = avg.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  maxEl.textContent = max.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  minEl.textContent = min.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

  // Ortalama karşılaştırma gösterimi
  if (aboveAvg > belowAvg) {
    stdEl.textContent = `↑ Üstünde (%${abovePercent})`;
    stdEl.style.color = '#d32f2f'; // Kırmızı - Yüksek değerler
  } else if (belowAvg > aboveAvg) {
    stdEl.textContent = `↓ Altında (%${belowPercent})`;
    stdEl.style.color = '#1976d2'; // Mavi - Düşük değerler
  } else {
    stdEl.textContent = '⚖️ Dengede';
    stdEl.style.color = '#388e3c'; // Yeşil - Dengeli
  }
}

function showOverviewStats(data, totalEl, avgEl, maxEl, minEl, stdEl) {
  // Toplam analiz sayısı
  totalEl.textContent = data.length;

  // Kontrol noktalarına göre grupla
  const pointCounts = {};
  data.forEach(r => {
    const point = r.point || 'Bilinmiyor';
    pointCounts[point] = (pointCounts[point] || 0) + 1;
  });

  // Kategorilere göre grupla
  const categoryCounts = {};
  data.forEach(r => {
    const category = r.category || 'Bilinmiyor';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Kullanıcılara göre grupla
  const userCounts = {};
  data.forEach(r => {
    const user = r.user || 'Bilinmiyor';
    userCounts[user] = (userCounts[user] || 0) + 1;
  });

  // En çok analiz yapılan nokta
  const sortedPoints = Object.entries(pointCounts).sort((a, b) => b[1] - a[1]);
  const topPoint = sortedPoints[0];
  avgEl.textContent = topPoint ? `${topPoint[0]} (${topPoint[1]})` : '-';

  // En az analiz yapılan nokta
  const bottomPoint = sortedPoints[sortedPoints.length - 1];
  maxEl.textContent = bottomPoint ? `${bottomPoint[0]} (${bottomPoint[1]})` : '-';

  // En çok analiz yapılan kategori
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0];
  minEl.textContent = topCategory ? `${topCategory[0]} (${topCategory[1]})` : '-';

  // Aktif kullanıcı sayısı
  const activeUsers = Object.keys(userCounts).length;
  stdEl.textContent = activeUsers.toString();

  // Kart başlıklarını güncelle
  updateStatCardLabels(true);
}

function updateStatCardLabels(isOverview) {
  const statCards = document.querySelectorAll('.stat-card');
  if (!statCards || statCards.length < 5) return;

  if (isOverview) {
    // İkon ve label güncellemeleri
    statCards[0].querySelector('.stat-icon').textContent = '📊';
    statCards[0].querySelector('.stat-label').textContent = 'TOPLAM ANALİZ';

    statCards[1].querySelector('.stat-icon').textContent = '🏆';
    statCards[1].querySelector('.stat-label').textContent = 'EN ÇOK ANALİZ YAPILAN';

    statCards[2].querySelector('.stat-icon').textContent = '⚠️';
    statCards[2].querySelector('.stat-label').textContent = 'EN AZ ANALİZ YAPILAN';

    statCards[3].querySelector('.stat-icon').textContent = '🎯';
    statCards[3].querySelector('.stat-label').textContent = 'EN AKTİF KATEGORİ';

    statCards[4].querySelector('.stat-icon').textContent = '👥';
    statCards[4].querySelector('.stat-label').textContent = 'AKTİF KULLANICI';
  } else {
    // Orijinal ikonlar ve labellar
    statCards[0].querySelector('.stat-icon').textContent = '📊';
    statCards[0].querySelector('.stat-label').textContent = 'TOPLAM ÖLÇÜM';

    statCards[1].querySelector('.stat-icon').textContent = '📈';
    statCards[1].querySelector('.stat-label').textContent = 'ORTALAMA';

    statCards[2].querySelector('.stat-icon').textContent = '⬆️';
    statCards[2].querySelector('.stat-label').textContent = 'MAKSİMUM';

    statCards[3].querySelector('.stat-icon').textContent = '⬇️';
    statCards[3].querySelector('.stat-label').textContent = 'MİNİMUM';

    statCards[4].querySelector('.stat-icon').textContent = '⚖️';
    statCards[4].querySelector('.stat-label').textContent = 'ORTALAMA KARŞILAŞTIRMA';

    // Rengi sıfırla
    statCards[4].querySelector('.stat-value').style.color = '';
  }
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
    tbody.innerHTML = '<tr class="empty"><td colspan="8" style="padding:12px 10px; opacity:.7;">Seçilen filtrelere uygun veri bulunamadı.</td></tr>';
    return;
  }

  // "Tümü" kategorisi seçiliyse kategori sütununu göster
  const categorySelect = document.getElementById('trends-category');
  const showCategory = categorySelect && categorySelect.value === 'all';

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
      ${showCategory ? `<td style="padding:10px 12px; font-weight:700; color:#1b5e20;">${r.category || '-'}</td>` : ''}
      <td style="padding:10px 12px; font-weight:600; color:#1b5e20;">${r.point || '-'}</td>
      <td style="padding:10px 12px; font-weight:700;">${displayValue}</td>
      <td style="padding:10px 12px;">${r.unit || '-'}</td>
      <td style="padding:10px 12px;">${r.user || '-'}</td>
      <td style="padding:10px 12px; font-size:13px; opacity:0.8;">${r.note || '-'}</td>
    `;
    tbody.appendChild(tr);
  });

  // Tablo başlıklarını da güncelle
  updateTableHeaders(showCategory);
}

function updateTableHeaders(showCategory) {
  const table = document.getElementById('trends-table');
  if (!table) return;

  const thead = table.querySelector('thead tr');
  if (!thead) return;

  if (showCategory) {
    thead.innerHTML = `
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Tarih</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Saat</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Kategori</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Kontrol Noktası</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Değer</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Birim</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Kullanıcı</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Açıklama</th>
    `;
  } else {
    thead.innerHTML = `
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Tarih</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Saat</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Kontrol Noktası</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Değer</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Birim</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Kullanıcı</th>
      <th style="text-align:left; padding:10px 12px; color:#666; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Açıklama</th>
    `;
  }
}

window.updateTrendsAnalysis = updateTrendsAnalysis;

// ====== HIZLI FİLTRE FONKSİYONLARI ======
function applyQuickFilter(filterType) {
  currentQuickFilter = filterType;

  // Tüm hızlı filtre butonlarından active sınıfını kaldır
  document.querySelectorAll('.quick-filter-btn').forEach(btn => btn.classList.remove('active'));

  // Tıklanan butona active sınıfını ekle
  event.target.closest('.quick-filter-btn')?.classList.add('active');

  const endDate = new Date();
  let startDate = new Date();

  switch(filterType) {
    case 'today':
      startDate = new Date();
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const startInput = document.getElementById('trends-start-date');
  const endInput = document.getElementById('trends-end-date');

  if (startInput) startInput.value = startDate.toISOString().slice(0, 10);
  if (endInput) endInput.value = endDate.toISOString().slice(0, 10);

  // Otomatik olarak analizi güncelle
  updateTrendsAnalysis();
}

function resetTrendsFilters() {
  // Kategori ve kontrol noktasını sıfırla
  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');

  if (categorySelect) categorySelect.value = 'all';
  if (pointSelect) pointSelect.value = '';

  // Kontrol noktalarını güncelle
  updateTrendsControlPoints();

  // "Bu Ay" filtresini uygula
  applyQuickFilter('month');
}

// ====== EXPORT FONKSİYONLARI ======
function exportTrendsChart() {
  if (!trendsChart) {
    showToast('Önce bir analiz çalıştırın.');
    return;
  }

  const canvas = document.getElementById('trendsChart');
  if (!canvas) return;

  // Canvas'ı PNG olarak indir
  const link = document.createElement('a');
  const now = new Date();
  const fileName = `trend_grafik_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.png`;

  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast('Grafik indirildi.');
  logActivity('CHART_EXPORT', 'Trends', { type: 'chart' });
}

function exportTrendsData() {
  const tbody = document.getElementById('trends-tbody');
  if (!tbody || tbody.querySelector('.empty')) {
    showToast('İndirilecek veri bulunamadı.');
    return;
  }

  // Mevcut filtrelenmiş veriyi al
  const categorySelect = document.getElementById('trends-category');
  const pointSelect = document.getElementById('trends-point');
  const startDateInput = document.getElementById('trends-start-date');
  const endDateInput = document.getElementById('trends-end-date');

  if (!categorySelect) return;

  const category = categorySelect.value;
  const selectedPoint = pointSelect?.value || '';
  const startDate = startDateInput?.value || '';
  const endDate = endDateInput?.value || '';
  const categoryName = categoryKeyToName[category];

  // Veriyi filtrele
  let filteredData = cachedRecords.filter(r => {
    if (r.category !== categoryName) return false;
    if (selectedPoint && r.point !== selectedPoint) return false;
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return r.value != null && r.value !== '';
  });

  if (!filteredData || filteredData.length === 0) {
    showToast('İndirilecek veri bulunamadı.');
    return;
  }

  // CSV'ye dönüştür
  const csv = convertToCSV(filteredData);
  const now = new Date();
  const fileName = `trend_analiz_${category}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;

  downloadCSV(csv, fileName);
  showToast(`${filteredData.length} kayıt indirildi.`);
  logActivity('DATA_EXPORT', 'Trends', { category, records: filteredData.length });
}

// Global scope'a yeni fonksiyonları ekle
window.applyQuickFilter = applyQuickFilter;
window.resetTrendsFilters = resetTrendsFilters;
window.exportTrendsChart = exportTrendsChart;
window.exportTrendsData = exportTrendsData;

// ====== KAZAN VE MİKSER ANALİZLERİ ======
let selectedKazanMikserPoint = '';

function initKazanMikserPage() {
  // Kazan-Mikser kartlarına tıklama olayı ekle
  const kazanMikserGrid = document.getElementById('kazan-mikser-grid');
  if (!kazanMikserGrid) return;

  // Hem eski .box hem de yeni .kazan-mikser-card sınıflarını destekle
  const boxes = kazanMikserGrid.querySelectorAll('.box, .kazan-mikser-card');
  boxes.forEach(box => {
    box.addEventListener('click', function() {
      const point = this.getAttribute('data-point');
      selectedKazanMikserPoint = point;
      openKazanMikserTestModal(point);
    });
  });

  // Log sayfa ziyareti
  logActivity('PAGE_VIEW', 'KazanMikser', { page: 'kazan-mikser' });
}

function openKazanMikserTestModal(point) {
  const modal = document.getElementById('kazan-mikser-test-modal');
  const title = document.getElementById('kazanMikserTestTitle');

  if (!modal || !title) return;

  title.textContent = `Analiz Tipi Seçimi - ${point}`;
  toggleModal('kazan-mikser-test-modal', true);

  logActivity('MODAL_OPEN', 'KazanMikser', { point, action: 'test_selection' });
}

function closeKazanMikserTestModal() {
  toggleModal('kazan-mikser-test-modal', false);
}

function openKazanMikserEntryModal(testType) {
  // Test tipi seçim modalini kapat
  closeKazanMikserTestModal();

  // Entry modalini aç
  const modal = document.getElementById('entry-modal');
  const modalTitle = document.getElementById('modalTitle');
  const pointInput = document.getElementById('point');
  const valueInput = document.getElementById('value');
  const unitInput = document.getElementById('unit');
  const noteInput = document.getElementById('note');
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const userInput = document.getElementById('user');

  if (!modal) return;

  // Başlık ve alanları ayarla
  modalTitle.textContent = `${selectedKazanMikserPoint} - ${testType} Ölçümü`;
  pointInput.value = selectedKazanMikserPoint;
  pointInput.readOnly = true;
  valueInput.value = '';

  // Decimal input kurallarını uygula (virgül kullanımı, max 3 basamak)
  takeOverValueInput();

  valueInput.focus();
  noteInput.value = '';

  // Birim ayarla
  if (testType === 'pH') {
    unitInput.value = 'pH';
  } else if (testType === 'İletkenlik') {
    unitInput.value = 'µS/cm';
  }

  // Tarih ve saat
  const now = new Date();
  dateInput.value = now.toISOString().slice(0, 10);
  timeInput.value = now.toTimeString().slice(0, 5);
  userInput.value = currentUserEmail || 'Bilinmiyor';

  // Kategoriyi gizli alana kaydet
  const form = document.getElementById('entry-form');
  let categoryInput = form.querySelector('#category-hidden');
  if (!categoryInput) {
    categoryInput = document.createElement('input');
    categoryInput.type = 'hidden';
    categoryInput.id = 'category-hidden';
    form.appendChild(categoryInput);
  }
  categoryInput.value = 'kazan-mikser';

  // Test tipini gizli alana kaydet
  let testTypeInput = form.querySelector('#test-type-hidden');
  if (!testTypeInput) {
    testTypeInput = document.createElement('input');
    testTypeInput.type = 'hidden';
    testTypeInput.id = 'test-type-hidden';
    form.appendChild(testTypeInput);
  }
  testTypeInput.value = testType;

  toggleModal('entry-modal', true);

  logActivity('MODAL_OPEN', 'KazanMikser', {
    point: selectedKazanMikserPoint,
    testType,
    action: 'data_entry'
  });
}

// Kazan-Mikser filter - Generic utility kullanıyor
function filterKazanMikserCards(searchTerm) {
  filterCards('kazan-mikser-grid', searchTerm, 'kazan-mikser-result-count', 'kazan-mikser-search-info', '.box, .kazan-mikser-card', 'kontrol noktası');
}

// Global scope'a fonksiyonları ekle
window.openKazanMikserTestModal = openKazanMikserTestModal;
window.closeKazanMikserTestModal = closeKazanMikserTestModal;
window.openKazanMikserEntryModal = openKazanMikserEntryModal;
window.filterKazanMikserCards = filterKazanMikserCards;

// ============================================
// DOLUM MAKİNALARI FONKSİYONLARI
// ============================================

let selectedDolumMakinalariPoint = '';
let selectedDolumMakinalariNozulCount = 0;

function initDolumMakinalariPage() {
  const dolumMakinalariGrid = document.getElementById('dolum-makinalari-grid');
  if (!dolumMakinalariGrid) return;

  const cards = dolumMakinalariGrid.querySelectorAll('.dolum-makinalari-card');
  cards.forEach(card => {
    card.addEventListener('click', function() {
      const point = this.getAttribute('data-point');
      const nozulCount = parseInt(this.getAttribute('data-nozul'));
      selectedDolumMakinalariPoint = point;
      selectedDolumMakinalariNozulCount = nozulCount;
      openDolumMakinalariTestModal(point, nozulCount);
    });
  });

  logActivity('PAGE_VIEW', 'DolumMakinalari', { page: 'dolum-makinalari' });
}

function openDolumMakinalariTestModal(point, nozulCount) {
  const modal = document.getElementById('dolum-makinalari-test-modal');
  const title = document.getElementById('dolumMakinalariTestTitle');

  if (!modal || !title) return;

  title.textContent = `Analiz Tipi Seçimi - ${point}`;
  toggleModal('dolum-makinalari-test-modal', true);

  logActivity('MODAL_OPEN', 'DolumMakinalari', { point, nozulCount, action: 'test_selection' });
}

function closeDolumMakinalariTestModal() {
  toggleModal('dolum-makinalari-test-modal', false);
}

function openDolumMakinalariEntryModal(testType) {
  closeDolumMakinalariTestModal();

  const modal = document.getElementById('dolum-makinalari-nozul-modal');
  const modalTitle = document.getElementById('dolumMakinalariNozulTitle');
  const container = document.getElementById('nozul-inputs-container');
  const pointInput = document.getElementById('dm-point');
  const testTypeInput = document.getElementById('dm-test-type');
  const dateInput = document.getElementById('dm-date');
  const timeInput = document.getElementById('dm-time');
  const userInput = document.getElementById('dm-user');
  const nozulCountInput = document.getElementById('dm-nozul-count');
  const noteInput = document.getElementById('dm-note');

  if (!modal || !container) return;

  // Başlık ve gizli alanları ayarla
  modalTitle.textContent = `${selectedDolumMakinalariPoint} - ${testType} Ölçümü`;
  pointInput.value = selectedDolumMakinalariPoint;
  testTypeInput.value = testType;
  nozulCountInput.value = selectedDolumMakinalariNozulCount;

  const now = new Date();
  dateInput.value = now.toISOString().slice(0, 10);
  timeInput.value = now.toTimeString().slice(0, 5);
  userInput.value = currentUserEmail || 'Bilinmiyor';
  noteInput.value = '';

  // Birim ayarla
  const unit = testType === 'pH' ? 'pH' : 'µS/cm';

  // Nozul input alanlarını oluştur
  container.innerHTML = '';
  const gridStyle = selectedDolumMakinalariNozulCount === 2
    ? 'grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));'
    : 'grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));';

  container.innerHTML = `
    <div style="margin-bottom:16px;">
      <h4 style="margin:0 0 12px; color:#1b5e20; font-size:16px; font-weight:700;">
        ${testType === 'pH' ? '⚗️' : '⚡'} ${testType} Değerleri (${selectedDolumMakinalariNozulCount} Nozul)
      </h4>
      <p style="margin:0; font-size:13px; color:#666;">Her nozul için ${testType} değerini giriniz.</p>
    </div>
    <div style="display:grid; ${gridStyle} gap:14px;">
      ${Array.from({ length: selectedDolumMakinalariNozulCount }, (_, i) => `
        <div style="background:#f9fafb; border:2px solid #e0e7e9; border-radius:12px; padding:16px;">
          <label style="display:block; margin-bottom:8px; font-weight:700; font-size:13px; color:#2e7d32;">
            Nozul ${i + 1}
          </label>
          <div style="position:relative;">
            <input
              type="text"
              id="dm-nozul-${i + 1}"
              class="input dm-nozul-input"
              placeholder="0,000"
              required
              style="width:100%; padding-right:60px; font-size:15px; font-weight:600;"
              data-nozul="${i + 1}"
            />
            <span style="position:absolute; right:14px; top:50%; transform:translateY(-50%); font-size:13px; color:#666; font-weight:600;">
              ${unit}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Decimal input kurallarını tüm nozul inputlarına uygula
  setTimeout(() => {
    const nozulInputs = container.querySelectorAll('.dm-nozul-input');
    nozulInputs.forEach(input => {
      initDecimalValueInput(input);
    });
  }, 100);

  toggleModal('dolum-makinalari-nozul-modal', true);

  logActivity('MODAL_OPEN', 'DolumMakinalari', {
    point: selectedDolumMakinalariPoint,
    testType,
    nozulCount: selectedDolumMakinalariNozulCount,
    action: 'nozul_data_entry'
  });
}

function closeDolumMakinalariNozulModal() {
  toggleModal('dolum-makinalari-nozul-modal', false);
}

async function saveDolumMakinalariData(event) {
  event.preventDefault();

  const point = document.getElementById('dm-point').value;
  const testType = document.getElementById('dm-test-type').value;
  const date = document.getElementById('dm-date').value;
  const time = document.getElementById('dm-time').value;
  const user = document.getElementById('dm-user').value;
  const nozulCount = parseInt(document.getElementById('dm-nozul-count').value);
  const note = document.getElementById('dm-note').value;

  // Tüm nozul verilerini topla
  const nozulData = [];
  for (let i = 1; i <= nozulCount; i++) {
    const input = document.getElementById(`dm-nozul-${i}`);
    if (input) {
      const value = input.value.trim().replace(',', '.');
      if (value) {
        nozulData.push({
          nozul: i,
          value: parseFloat(value)
        });
      }
    }
  }

  if (nozulData.length === 0) {
    alert('En az bir nozul değeri girmelisiniz!');
    return;
  }

  const unit = testType === 'pH' ? 'pH' : 'µS/cm';

  try {
    // Her nozul için ayrı kayıt oluştur
    const promises = nozulData.map(nozul => {
      const record = {
        category: 'dolum-makinalari',
        point: `${point} - ${testType} - Nozul ${nozul.nozul}`,
        value: nozul.value,
        unit: unit,
        date: date,
        time: time,
        user: user,
        note: note || '-'
      };

      return window.supabaseClient
        .from('measurements')
        .insert([record]);
    });

    await Promise.all(promises);

    showToast(`${nozulCount} nozul verisi başarıyla kaydedildi!`);
    closeDolumMakinalariNozulModal();

    logActivity('DATA_SAVED', 'DolumMakinalari', {
      point,
      testType,
      nozulCount,
      totalRecords: nozulData.length
    });

    // Tabloları ve grafikleri güncelle
    await loadRecent();

    // Form'u sıfırla
    document.getElementById('dolum-makinalari-nozul-form').reset();

  } catch (error) {
    console.error('Dolum Makinaları veri kaydetme hatası:', error);
    alert('Veriler kaydedilirken bir hata oluştu: ' + error.message);
  }
}

// Dolum Makinaları filter - Generic utility kullanıyor
function filterDolumMakinalariCards(searchTerm) {
  filterCards('dolum-makinalari-grid', searchTerm, 'dolum-makinalari-result-count', 'dolum-makinalari-search-info', '.dolum-makinalari-card', 'makina');
}

// Global scope'a fonksiyonları ekle
window.openDolumMakinalariTestModal = openDolumMakinalariTestModal;
window.closeDolumMakinalariTestModal = closeDolumMakinalariTestModal;
window.openDolumMakinalariEntryModal = openDolumMakinalariEntryModal;
window.closeDolumMakinalariNozulModal = closeDolumMakinalariNozulModal;
window.saveDolumMakinalariData = saveDolumMakinalariData;
window.filterDolumMakinalariCards = filterDolumMakinalariCards;

// ====== ÜST YÖNETİM DASHBOARD ======
let executiveCharts = {
  monthly: null,
  category: null,
  hourly: null,
  user: null,
  weekly: null
};

let executiveDashboardCache = {
  measurements: null,
  lastFetch: null
};

// Executive dashboard'u göster
async function showExecutiveDashboard() {
  currentSection = 'executive-dashboard';
  await updateExecutiveDashboard(true);
}

// Dashboard verilerini güncelle
async function updateExecutiveDashboard(forceRefresh = false) {
  try {
    // Cache kontrolü - sadece ilk yüklemede veya yenile butonuna basıldığında veriyi çek
    let measurements = executiveDashboardCache.measurements;

    if (forceRefresh || !measurements) {
      // Son güncelleme zamanını göster
      const lastUpdate = document.getElementById('dashboard-last-update');
      if (lastUpdate) {
        lastUpdate.textContent = 'Son güncelleme: ' + new Date().toLocaleString('tr-TR');
      }

      // Tüm measurements verilerini çek
      const { data, error } = await supabaseClient
        .from('measurements')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        console.error('Measurements yükleme hatası:', error);
        showToast('Veriler yüklenirken hata oluştu.');
        return;
      }

      measurements = data;
      executiveDashboardCache.measurements = measurements;
      executiveDashboardCache.lastFetch = new Date();

      // Logs tablosundan kullanıcı aktivitelerini çek (sadece ilk yüklemede)
      const { data: logs, error: logsError } = await supabaseClient
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) {
        console.error('Logs yükleme hatası:', logsError);
      }

      // KPI'ları hesapla ve güncelle
      updateExecutiveKPIs(measurements, logs || []);
    } else {
      // Cache'den KPI'ları güncelle
      updateExecutiveKPIs(measurements, []);
    }

    // Grafikleri güncelle
    updateExecutiveCharts(measurements);

    // En çok kontrol edilen noktaları göster
    updateTopPoints(measurements);

    // Son aktiviteleri göster
    updateRecentActivity(measurements);

  } catch (err) {
    console.error('Dashboard güncelleme hatası:', err);
    showToast('Dashboard güncellenirken hata oluştu.');
  }
}

// KPI'ları güncelle
function updateExecutiveKPIs(measurements, logs) {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Toplam ölçüm (bu ay)
  const thisMonthMeasurements = measurements.filter(m => m.date && m.date.startsWith(thisMonth));
  document.getElementById('exec-total-measurements').textContent = thisMonthMeasurements.length.toLocaleString('tr-TR');
  document.getElementById('exec-total-trend').textContent = 'Bu ay';

  // Bugünkü ölçüm
  const todayMeasurements = measurements.filter(m => m.date === today);
  const todayCount = todayMeasurements.length;

  // Önceki günün ölçümü
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];
  const yesterdayMeasurements = measurements.filter(m => m.date === yesterdayDate);
  const yesterdayCount = yesterdayMeasurements.length;

  // Değişimi hesapla
  const diff = todayCount - yesterdayCount;
  const trendElement = document.getElementById('exec-today-trend');

  document.getElementById('exec-today-measurements').textContent = todayCount.toLocaleString('tr-TR');

  // Trend göstergesini güncelle (sadece değişiklik varsa)
  if (diff !== 0 && yesterdayCount > 0) {
    const percentage = Math.abs(Math.round((diff / yesterdayCount) * 100));
    const trendIcon = diff > 0 ? '↑' : '↓';
    const trendColor = diff > 0 ? '#10b981' : '#ef4444';
    const trendText = diff > 0 ? 'artış' : 'azalış';

    trendElement.innerHTML = `
      <span style="color: ${trendColor}; font-weight: 600;">
        ${trendIcon} ${Math.abs(diff)} (${percentage}% ${trendText})
      </span>
    `;
    trendElement.style.fontSize = '12px';
  } else if (yesterdayCount === 0 && todayCount > 0) {
    trendElement.innerHTML = '<span style="color: #10b981; font-weight: 600;">↑ Yeni</span>';
    trendElement.style.fontSize = '12px';
  } else {
    trendElement.textContent = 'Bugün';
    trendElement.style.fontSize = '';
  }

  // Ortalama günlük ölçüm (son 30 gün)
  const last30DaysMeasurements = measurements.filter(m => m.date >= last30Days);
  const avgDaily = Math.round(last30DaysMeasurements.length / 30);
  document.getElementById('exec-avg-daily').textContent = avgDaily.toLocaleString('tr-TR');
  document.getElementById('exec-avg-trend').textContent = 'Son 30 gün';
}

// Grafikleri güncelle
function updateExecutiveCharts(measurements) {
  // Aylık trend grafiği (kategori filtrelemeli)
  updateMonthlyChartWithFilter(measurements);

  // Kategori dağılımı
  updateCategoryChart(measurements);

  // IBC Kontrol Noktası
  updateIBCCount(measurements);

  // Saatlik aktivite
  updateHourlyChart(measurements);

  // Kullanıcı aktivitesi
  updateUserChart(measurements);

  // Haftalık özet
  updateWeeklyChart(measurements);
}

// IBC Kontrol Noktası sayısını güncelle
function updateIBCCount(measurements) {
  const today = new Date().toISOString().split('T')[0];
  const ibcMeasurements = measurements.filter(m =>
    m.date === today &&
    m.point &&
    m.point.toLowerCase().includes('ibc')
  );

  const countElement = document.getElementById('ibc-measurement-count');
  if (countElement) {
    countElement.textContent = ibcMeasurements.length;
  }
}

// Aylık trend grafiğini kategori filtresiyle güncelle
function updateMonthlyChartWithFilter(measurements) {
  const selectedCategory = document.getElementById('exec-monthly-category')?.value || 'all';

  // Kategori filtresi uygula
  let filteredData = measurements;
  if (selectedCategory !== 'all') {
    filteredData = measurements.filter(m => m.category === selectedCategory);
  }

  updateMonthlyChart(filteredData);
}

// Aylık trend grafiği
function updateMonthlyChart(measurements) {
  const ctx = document.getElementById('exec-monthly-chart');
  if (!ctx) return;

  // Son 12 ayın verilerini hesapla
  const monthlyData = {};
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7);
    monthlyData[key] = 0;
  }

  measurements.forEach(m => {
    if (m.date) {
      const monthKey = m.date.slice(0, 7);
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    }
  });

  const labels = Object.keys(monthlyData).map(key => {
    const [y, m] = key.split('-');
    return new Date(y, m - 1).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
  });
  const data = Object.values(monthlyData);

  if (executiveCharts.monthly) {
    executiveCharts.monthly.destroy();
  }

  executiveCharts.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ölçüm Sayısı',
        data: data,
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

// Kategori dağılımı - Profesyonel liste görünümü
function updateCategoryChart(measurements) {
  const container = document.getElementById('exec-category-breakdown');
  if (!container) return;

  const categoryCount = {};
  measurements.forEach(m => {
    const cat = m.category || 'Diğer';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const total = measurements.length;
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1]);

  // Kategori ikonları ve renk sınıfları
  const categoryIcons = {
    'Ph': '💧',
    'Klor': '🧪',
    'İletkenlik': '⚡',
    'Sertlik': '🔬',
    'Mikro': '🦠',
    'Mikrobiyoloji': '🦠',
    'Kazan Mikser': '🌀',
    'Kazan & Mikser': '🌀',
    'Dolum': '🏭',
    'Dolum Makinaları': '🏭'
  };

  const categoryClasses = {
    'Ph': 'category-ph',
    'Klor': 'category-klor',
    'İletkenlik': 'category-iletkenlik',
    'Sertlik': 'category-sertlik',
    'Mikro': 'category-mikro',
    'Mikrobiyoloji': 'category-mikro',
    'Kazan Mikser': 'category-kazan',
    'Kazan & Mikser': 'category-kazan',
    'Dolum': 'category-dolum',
    'Dolum Makinaları': 'category-dolum'
  };

  container.innerHTML = sortedCategories.map(([category, count]) => {
    const percentage = ((count / total) * 100).toFixed(1);
    const icon = categoryIcons[category] || '📊';
    const colorClass = categoryClasses[category] || 'category-ph';

    return `
      <div class="category-item">
        <div class="category-item-header">
          <div class="category-item-left">
            <div class="category-item-icon ${colorClass}">
              ${icon}
            </div>
            <div class="category-item-info">
              <div class="category-item-name">${category}</div>
              <div class="category-item-stats">
                ${count} ölçüm
              </div>
            </div>
          </div>
          <div class="category-item-right">
            <div class="category-item-count">${count.toLocaleString('tr-TR')}</div>
            <div class="category-item-percentage">${percentage}%</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Saatlik aktivite grafiği - Bugün 06:00-22:00
function updateHourlyChart(measurements) {
  const ctx = document.getElementById('exec-hourly-chart');
  if (!ctx) return;

  // Bugünün tarihini al
  const today = new Date().toISOString().split('T')[0];

  // Sadece bugünün verilerini filtrele
  const todayMeasurements = measurements.filter(m => m.date === today);

  // 06:00 - 22:00 arası 30 dakikalık dilimler (33 dilim: 6:00, 6:30, 7:00, ..., 22:00)
  const timeSlots = [];
  const hourlyData = [];

  for (let hour = 6; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 22 && min > 0) break; // 22:00'da dur
      const timeLabel = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      timeSlots.push(timeLabel);
      hourlyData.push(0);
    }
  }

  // Ölçümleri 30 dakikalık dilimlere ayır
  todayMeasurements.forEach(m => {
    if (m.time) {
      const [hour, minute] = m.time.split(':').map(Number);
      if (hour >= 6 && hour <= 22) {
        // Hangi 30 dakikalık dilime düşüyor?
        const slotMinute = minute < 30 ? 0 : 30;
        const slotLabel = `${String(hour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
        const index = timeSlots.indexOf(slotLabel);
        if (index !== -1) {
          hourlyData[index]++;
        }
      }
    }
  });

  // Optimized: Data update
  if (executiveCharts.hourly) {
    executiveCharts.hourly.data.labels = timeSlots;
    executiveCharts.hourly.data.datasets[0].data = hourlyData;
    executiveCharts.hourly.update('none');
    return;
  }

  executiveCharts.hourly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: timeSlots,
      datasets: [{
        label: 'Ölçüm Sayısı',
        data: hourlyData,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderRadius: 6,
        barThickness: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              const label = context[0].label;
              const [hour, minute] = label.split(':');
              const nextMinute = parseInt(minute) + 30;
              const nextHour = nextMinute >= 60 ? (parseInt(hour) + 1) : parseInt(hour);
              const displayNextMin = nextMinute >= 60 ? '00' : String(nextMinute).padStart(2, '0');
              return `${label} - ${String(nextHour).padStart(2, '0')}:${displayNextMin}`;
            },
            label: function(context) {
              return `${context.parsed.y} ölçüm`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 },
            callback: function(value) {
              // Her 2. etiketi göster (saat başlarını)
              const label = this.getLabelForValue(value);
              return label.endsWith(':00') ? label : '';
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: { size: 11 }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.06)'
          }
        }
      }
    }
  });
}

// Kullanıcı aktivitesi grafiği
function updateUserChart(measurements) {
  const ctx = document.getElementById('exec-user-chart');
  if (!ctx) return;

  const userCount = {};
  measurements.forEach(m => {
    const user = m.user || 'Bilinmeyen';
    userCount[user] = (userCount[user] || 0) + 1;
  });

  const sortedUsers = Object.entries(userCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sortedUsers.map(u => u[0].split('@')[0]);
  const data = sortedUsers.map(u => u[1]);

  // Optimized: Data update
  if (executiveCharts.user) {
    executiveCharts.user.data.labels = labels;
    executiveCharts.user.data.datasets[0].data = data;
    executiveCharts.user.update('none');
    return;
  }

  executiveCharts.user = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ölçüm Sayısı',
        data: data,
        backgroundColor: 'rgba(79, 172, 254, 0.8)',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

// Haftalık özet grafiği
function updateWeeklyChart(measurements) {
  const ctx = document.getElementById('exec-weekly-chart');
  if (!ctx) return;

  const weeklyData = Array(7).fill(0);
  const today = new Date();
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  measurements.forEach(m => {
    if (m.date) {
      const mDate = new Date(m.date);
      const diffDays = Math.floor((today - mDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        weeklyData[6 - diffDays]++;
      }
    }
  });

  const labels = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return dayNames[d.getDay()];
  });

  // Optimized: Update yerine destroy (eğer chart varsa data update et)
  if (executiveCharts.weekly) {
    executiveCharts.weekly.data.labels = labels;
    executiveCharts.weekly.data.datasets[0].data = weeklyData;
    executiveCharts.weekly.update('none');
    return;
  }

  executiveCharts.weekly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Ölçüm Sayısı',
        data: weeklyData,
        borderColor: 'rgba(94, 114, 228, 1)',
        backgroundColor: (context) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(94, 114, 228, 0.02)');
          gradient.addColorStop(0.5, 'rgba(94, 114, 228, 0.12)');
          gradient.addColorStop(1, 'rgba(94, 114, 228, 0.25)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'rgba(94, 114, 228, 1)',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgba(94, 114, 228, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 8,
        shadowColor: 'rgba(94, 114, 228, 0.3)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 15,
            font: {
              size: 12,
              weight: '600',
              family: "'Inter', -apple-system, sans-serif"
            },
            color: '#666'
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#333',
          bodyColor: '#666',
          borderColor: 'rgba(94, 114, 228, 0.2)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          titleFont: {
            size: 13,
            weight: '600'
          },
          bodyFont: {
            size: 14,
            weight: '700'
          },
          callbacks: {
            title: (items) => items[0].label,
            label: (context) => `${context.parsed.y} ölçüm`
          },
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11,
              weight: '500',
              family: "'Inter', -apple-system, sans-serif"
            },
            color: '#999'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: {
              size: 11,
              weight: '500',
              family: "'Inter', -apple-system, sans-serif"
            },
            color: '#999',
            padding: 8
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.04)',
            drawBorder: false
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    }
  });
}

// En çok kontrol edilen noktalar
function updateTopPoints(measurements) {
  const pointCount = {};

  measurements.forEach(m => {
    const point = m.point || 'Bilinmeyen';
    const category = m.category || 'Diğer';
    const key = `${point}|${category}`;

    if (!pointCount[key]) {
      pointCount[key] = { point, category, count: 0 };
    }
    pointCount[key].count++;
  });

  const topPoints = Object.values(pointCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const container = document.getElementById('exec-top-points');
  if (!container) return;

  if (topPoints.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:24px; color:#999;">Henüz veri yok</div>';
    return;
  }

  container.innerHTML = topPoints.map((item, index) => {
    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
    return `
      <div class="top-point-item">
        <div class="top-point-rank ${rankClass}">${index + 1}</div>
        <div class="top-point-info">
          <div class="top-point-name">${item.point}</div>
          <div class="top-point-category">${item.category}</div>
        </div>
        <div class="top-point-count">${item.count.toLocaleString('tr-TR')}</div>
      </div>
    `;
  }).join('');
}

// Son aktiviteleri göster - Sadece measurements (10 satır, yatay)
function updateRecentActivity(measurements) {
  const tbody = document.getElementById('exec-activity-tbody');
  if (!tbody) return;

  // Son 10 ölçümü göster
  const recent = measurements.slice(0, 10);

  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#999;">Henüz aktivite yok</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(m => {
    // Değer ve birimi profesyonel formatta göster
    let valueDisplay = '-';
    if (m.value) {
      const value = typeof m.value === 'number' ? m.value.toLocaleString('tr-TR') : m.value;
      const unit = m.unit ? `<span style="color:#666; font-size:12px; margin-left:4px;">${m.unit}</span>` : '';
      valueDisplay = `<strong style="color:#1976d2;">${value}</strong>${unit}`;
    }

    return `
      <tr>
        <td>${m.date || '-'}</td>
        <td>${m.time || '-'}</td>
        <td><strong>${m.category || '-'}</strong></td>
        <td>${m.point || '-'}</td>
        <td>${valueDisplay}</td>
        <td>${(m.user || '').split('@')[0]}</td>
      </tr>
    `;
  }).join('');
}

// Executive menu'yu göster/gizle (desktop + mobile)
// SADECE Executive rolü için kısıtlı menü (Admin tüm menüleri görür)
function showExecutiveMenu() {
  // Dashboard menüsünü her zaman göster
  const dashboardMenuItem = document.getElementById('executive-dashboard-menu');
  if (dashboardMenuItem) {
    dashboardMenuItem.style.display = 'block';
  }

  // Eğer kullanıcı SADECE executive ise (admin değilse) menüleri kısıtla
  if (currentUserRole === 'executive') {
    // Tüm menü öğelerini gizle
    const allMenuItems = document.querySelectorAll('.menu ul li');
    allMenuItems.forEach(item => {
      item.style.display = 'none';
    });

    // Sadece Trend Analizi ve Dashboard'u göster
    const trendMenuItem = document.querySelector('[data-section-link="trends"]')?.closest('li');

    if (trendMenuItem) {
      trendMenuItem.style.display = 'block';
    }
    if (dashboardMenuItem) {
      dashboardMenuItem.style.display = 'block';
    }

    // Mobile tabs için kısıtlama
    const mobileTabs = document.getElementById('mobile-tabs');
    if (mobileTabs) {
      // Tüm mobile tabs'ı gizle
      const allTabs = mobileTabs.querySelectorAll('.tab');
      allTabs.forEach(tab => {
        tab.style.display = 'none';
      });

      // Dashboard tab'ı ekle (yoksa)
      let dashboardTab = mobileTabs.querySelector('[data-section="executive-dashboard"]');
      if (!dashboardTab) {
        dashboardTab = document.createElement('button');
        dashboardTab.type = 'button';
        dashboardTab.className = 'tab';
        dashboardTab.setAttribute('data-section', 'executive-dashboard');
        dashboardTab.innerHTML = '<span class="tab-icon">📊</span><span class="tab-text">Dashboard</span>';
        dashboardTab.onclick = () => {
          showSection('executive-dashboard');
          activateMobileTab('executive-dashboard');
        };
        mobileTabs.appendChild(dashboardTab);
      }
      dashboardTab.style.display = 'flex';

      // Trend Analizi tab'ı göster (varsa)
      const trendsTab = mobileTabs.querySelector('[data-section="trends"]');
      if (trendsTab) {
        trendsTab.style.display = 'flex';
      }
    }
  } else {
    // Admin veya diğer roller için mobile tabs'a dashboard ekle (kısıtlama YOK)
    const mobileTabs = document.getElementById('mobile-tabs');
    if (mobileTabs) {
      const existingTab = mobileTabs.querySelector('[data-section="executive-dashboard"]');
      if (!existingTab) {
        const dashboardTab = document.createElement('button');
        dashboardTab.type = 'button';
        dashboardTab.className = 'tab';
        dashboardTab.setAttribute('data-section', 'executive-dashboard');
        dashboardTab.innerHTML = '<span class="tab-icon">📊</span><span class="tab-text">Dashboard</span>';
        dashboardTab.onclick = () => {
          showSection('executive-dashboard');
          activateMobileTab('executive-dashboard');
        };
        mobileTabs.appendChild(dashboardTab);
      }
    }
  }
}

// Global fonksiyonları expose et
window.updateExecutiveDashboard = updateExecutiveDashboard;
window.showExecutiveDashboard = showExecutiveDashboard;
window.updateMonthlyChartWithFilter = updateMonthlyChartWithFilter;
window.executiveDashboardCache = executiveDashboardCache;

// ====== FULLSCREEN MODE - KIOSK/PRESENTATION MODE ======
let isFullscreenMode = false;
let fullscreenAnimationTimeout = null;
let chartUpdateHighlights = new Map(); // Hangi kartların güncellediğini takip et

/**
 * Fullscreen değişikliklerini dinle (F11, ESC)
 */
function initFullscreenDetection() {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChangeEvent', handleFullscreenChange);
}

function handleFullscreenChange() {
  const isFullscreen = !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );

  if (isFullscreen && currentSection === 'executive-dashboard') {
    enterFullscreenMode();
  } else if (!isFullscreen && isFullscreenMode) {
    exitFullscreenMode();
  }
}

/**
 * Fullscreen moduna geçiş (F11 basıldığında)
 */
function enterFullscreenMode() {
  if (isFullscreenMode) return;

  console.log('🖥️ Fullscreen mode: ENTERING');
  isFullscreenMode = true;

  const portalScreen = document.getElementById('portal-screen');
  const dashboard = document.getElementById('page-executive-dashboard');
  const content = document.querySelector('.content');
  const header = document.querySelector('.header');
  const menu = document.querySelector('.menu');
  const mobileTabs = document.querySelector('.mobile-tabs');

  // 1. HEADER VE MENU GİZLE (INLINE STYLES)
  if (header) {
    header.style.cssText = 'opacity: 0; transform: translateY(-100%); transition: all 0.5s ease; pointer-events: none;';
  }
  if (menu) {
    menu.style.cssText = 'transform: translateX(-100%); transition: all 0.5s ease; opacity: 0; pointer-events: none;';
  }
  if (mobileTabs) {
    mobileTabs.style.cssText = 'opacity: 0; transform: translateY(100%); transition: all 0.5s ease; pointer-events: none;';
  }

  // 2. CONTENT AREA FULLSCREEN LAYOUT
  if (content) {
    content.style.cssText = `
      margin-left: 0 !important;
      margin-top: 0 !important;
      padding: 20px !important;
      width: 100vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      overflow: hidden !important;
      background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
    `;
  }

  // 3. PORTAL SCREEN ARKA PLAN
  if (portalScreen) {
    portalScreen.style.cssText = `
      background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
    `;
  }

  // 4. DASHBOARD CONTAINER - DİNAMİK VIEWPORT HESAPLAMA
  const vh = window.innerHeight;
  const vw = window.innerWidth;

  // Kaç satır var?
  const chartsRows = document.querySelectorAll('.executive-charts-row');
  const totalRows = chartsRows.length + 1; // +1 KPI grid için

  // Dinamik gap hesapla (viewport'a göre)
  const gap = Math.max(8, Math.floor(vh * 0.01)); // Min 8px, max vh * 1%
  const padding = 20;

  if (dashboard) {
    dashboard.style.cssText = `
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: ${gap}px;
    `;
  }

  // 5. KPI GRİD - SABİT YÜKSEK, KOMPAKT
  const kpiGrid = document.querySelector('.executive-kpi-grid');
  const kpiHeight = Math.min(100, vh * 0.12); // Max 100px veya vh * 12%

  if (kpiGrid) {
    kpiGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: ${gap}px;
      height: ${kpiHeight}px;
      flex-shrink: 0;
    `;
  }

  // 6. CHARTS ROW - DİNAMİK YÜKSEK HESAPLA
  // Kalan alan = vh - (padding * 2) - (KPI height) - (gaps)
  const availableHeight = vh - (padding * 2) - kpiHeight - (gap * totalRows);
  const rowHeight = availableHeight / chartsRows.length;

  chartsRows.forEach((row, rowIndex) => {
    const isFullWidth = row.classList.contains('executive-charts-row-full');

    if (isFullWidth) {
      // Haftalık Özet - Tam genişlik, kısa yükseklik
      row.style.cssText = `
        display: grid;
        grid-template-columns: 1fr;
        gap: ${gap}px;
        height: ${rowHeight * 0.8}px;
        flex-shrink: 0;
      `;
    } else if (rowIndex === chartsRows.length - 1) {
      // Son satır: En Çok Kontrol + Aktiviteler
      const leftColumnWidth = Math.min(350, vw * 0.25); // Max 350px veya vw * 25%
      row.style.cssText = `
        display: grid;
        grid-template-columns: ${leftColumnWidth}px 1fr;
        gap: ${gap}px;
        height: ${rowHeight}px;
        flex-shrink: 0;
        overflow: hidden;
      `;
    } else {
      // Diğer satırlar: 2 sütun
      row.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: ${gap}px;
        height: ${rowHeight}px;
        flex-shrink: 0;
      `;
    }
  });

  // 7. CHART CARDLARI - TAM YÜKSEK KULLAN
  const chartCards = document.querySelectorAll('.executive-chart-card');
  chartCards.forEach(card => {
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    `;

    // Chart header
    const chartHeader = card.querySelector('.chart-header');
    if (chartHeader) {
      chartHeader.style.cssText = `
        flex-shrink: 0;
        padding: 14px 18px;
      `;
    }

    // Chart body flex yaparak tüm alanı kapla
    const chartBody = card.querySelector('.chart-body');
    if (chartBody) {
      chartBody.style.cssText = `
        flex: 1;
        min-height: 0;
        padding: 12px 16px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      `;
    }

    // Canvas'a max-height ekle
    const canvas = card.querySelector('canvas');
    if (canvas) {
      canvas.style.cssText = `
        max-height: 100%;
        max-width: 100%;
        width: auto !important;
        height: auto !important;
      `;
    }
  });

  // 8. EN ÇOK KONTROL EDİLEN NOKTALAR - SCROLL
  const topPointsCard = document.querySelector('.executive-top-points-card');
  if (topPointsCard) {
    topPointsCard.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    `;

    const topPointsHeader = topPointsCard.querySelector('.chart-header');
    if (topPointsHeader) {
      topPointsHeader.style.cssText = `
        flex-shrink: 0;
        padding: 14px 18px;
      `;
    }

    const topPointsBody = topPointsCard.querySelector('.chart-body');
    if (topPointsBody) {
      topPointsBody.style.cssText = `
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 8px;
      `;
    }
  }

  // 9. AKTİVİTELER TABLOSU - SCROLL
  const activityCard = document.querySelector('.executive-activity-card-compact');
  if (activityCard) {
    activityCard.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    `;

    const activityHeader = activityCard.querySelector('.chart-header');
    if (activityHeader) {
      activityHeader.style.cssText = `
        flex-shrink: 0;
        padding: 14px 18px;
      `;
    }

    const activityBody = activityCard.querySelector('.chart-body');
    if (activityBody) {
      activityBody.style.cssText = `
        flex: 1;
        min-height: 0;
        padding: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      `;
    }
  }

  const activityWrapper = document.querySelector('.activity-table-wrapper');
  if (activityWrapper) {
    activityWrapper.style.cssText = `
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    `;
  }

  // Aktivite tablosuna kompakt stil
  const activityTable = document.querySelector('.activity-table');
  if (activityTable) {
    activityTable.style.cssText = `
      width: 100%;
      font-size: 12px;
    `;

    // Tablo satırlarını daha kompakt yap
    const activityRows = activityTable.querySelectorAll('tbody tr');
    activityRows.forEach(row => {
      row.style.height = '32px';
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        cell.style.padding = '6px 10px';
      });
    });
  }

  // 10. KPI KARTLARI - KOMPAKT VE OKUNAKLI
  const kpiCards = document.querySelectorAll('.executive-kpi-card');
  kpiCards.forEach(card => {
    const value = card.querySelector('.kpi-value');
    const label = card.querySelector('.kpi-label');
    const trend = card.querySelector('.kpi-trend');

    // Font boyutlarını viewport'a göre ayarla
    const valueFontSize = Math.min(32, kpiHeight * 0.4);
    const labelFontSize = Math.min(12, kpiHeight * 0.14);

    if (value) value.style.fontSize = valueFontSize + 'px';
    if (label) label.style.fontSize = labelFontSize + 'px';
    if (trend) trend.style.fontSize = (labelFontSize - 1) + 'px';

    card.style.cssText = `
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      height: 100%;
      display: flex;
      align-items: center;
      padding: 12px 16px;
    `;
  });

  // 11. KARTLARIN GÖRÜNMESİ - STAGGER ANİMASYON
  setTimeout(() => animateCardsEntry(), 100);

  // Otomatik yenileme başlat (30 saniyede bir)
  startFullscreenAutoRefresh();

  console.log('✅ Fullscreen mode aktif - Kiosk presentation başlatıldı');
}

/**
 * Fullscreen modundan çıkış (ESC basıldığında)
 */
function exitFullscreenMode() {
  if (!isFullscreenMode) return;

  console.log('🖥️ Fullscreen mode: EXITING');
  isFullscreenMode = false;

  const portalScreen = document.getElementById('portal-screen');
  const dashboard = document.getElementById('page-executive-dashboard');
  const content = document.querySelector('.content');
  const header = document.querySelector('.header');
  const menu = document.querySelector('.menu');
  const mobileTabs = document.querySelector('.mobile-tabs');

  // 1. TÜM INLINE STYLE'LARI TEMİZLE
  if (portalScreen) portalScreen.style.cssText = '';
  if (content) content.style.cssText = '';
  if (dashboard) dashboard.style.cssText = '';

  // 2. HEADER VE MENU GERİ GETİR
  if (header) {
    header.style.cssText = 'opacity: 1; transform: translateY(0); transition: all 0.5s ease; pointer-events: auto;';
    setTimeout(() => { header.style.cssText = ''; }, 500);
  }
  if (menu) {
    menu.style.cssText = 'transform: translateX(0); transition: all 0.5s ease; opacity: 1; pointer-events: auto;';
    setTimeout(() => { menu.style.cssText = ''; }, 500);
  }
  if (mobileTabs) {
    mobileTabs.style.cssText = 'opacity: 1; transform: translateY(0); transition: all 0.5s ease; pointer-events: auto;';
    setTimeout(() => { mobileTabs.style.cssText = ''; }, 500);
  }

  // 3. KPI VE CHART KARTLARINI SIFIRLA
  const kpiCards = document.querySelectorAll('.executive-kpi-card');
  kpiCards.forEach(card => {
    card.style.cssText = '';
    const value = card.querySelector('.kpi-value');
    const label = card.querySelector('.kpi-label');
    if (value) value.style.fontSize = '';
    if (label) label.style.fontSize = '';
  });

  const chartCards = document.querySelectorAll('.executive-chart-card');
  chartCards.forEach(card => {
    card.style.cssText = '';
  });

  // 4. GRID VE ROWS SIFIRLA
  const kpiGrid = document.querySelector('.executive-kpi-grid');
  if (kpiGrid) kpiGrid.style.cssText = '';

  const chartsRows = document.querySelectorAll('.executive-charts-row');
  chartsRows.forEach(row => {
    row.style.cssText = '';
  });

  const activityWrapper = document.querySelector('.activity-table-wrapper');
  if (activityWrapper) activityWrapper.style.cssText = '';

  // 5. KARTLARIN OPACITY'SİNİ SIFIRLA (animasyon için kullanılmışsa)
  const allCards = document.querySelectorAll('.executive-kpi-card, .executive-chart-card');
  allCards.forEach(card => {
    card.style.opacity = '';
    card.style.transform = '';
    card.style.transition = '';
  });

  // Otomatik yenilemeyi durdur
  stopFullscreenAutoRefresh();

  console.log('✅ Normal desktop mode');
}

/**
 * Kartların sırayla animasyonlu girişi
 */
function animateCardsEntry() {
  const kpiCards = document.querySelectorAll('#page-executive-dashboard .executive-kpi-card');
  const chartCards = document.querySelectorAll('#page-executive-dashboard .executive-chart-card');

  console.log(`🎬 Animasyon başlıyor: ${kpiCards.length} KPI + ${chartCards.length} Chart kartı`);

  // KPI kartları önce (0-3)
  kpiCards.forEach((card, index) => {
    // Başlangıç durumu
    card.style.opacity = '0';
    card.style.transform = 'translateY(40px) scale(0.9)';
    card.style.transition = 'none';

    // Force reflow
    card.offsetHeight;

    // Animasyon başlat
    setTimeout(() => {
      card.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
      console.log(`✅ KPI ${index + 1} animasyon başladı`);
    }, index * 150);
  });

  // Grafik kartları sonra (daha geç başla)
  chartCards.forEach((card, index) => {
    // Başlangıç durumu
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px) scale(0.95)';
    card.style.transition = 'none';

    // Force reflow
    card.offsetHeight;

    // Animasyon başlat
    setTimeout(() => {
      card.style.transition = 'all 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
      console.log(`📊 Chart ${index + 1} animasyon başladı`);
    }, 500 + index * 180); // KPI'lardan sonra başla
  });
}

/**
 * Grafik güncellendiğinde highlight animasyonu
 */
function highlightUpdatedChart(chartId) {
  const chartCard = document.querySelector(`#${chartId}`)?.closest('.executive-chart-card, .executive-kpi-card');
  if (!chartCard) {
    console.warn(`⚠️ Chart card bulunamadı: ${chartId}`);
    return;
  }

  console.log(`📊 Chart güncelleniyor: ${chartId}`);

  // 1. PULSE ANIMASYONU (inline keyframe)
  const originalBoxShadow = chartCard.style.boxShadow || '';
  const originalTransform = chartCard.style.transform || '';

  // Başlangıç frame
  chartCard.style.transition = 'none';
  chartCard.style.boxShadow = '0 0 0 0 rgba(76, 175, 80, 0)';
  chartCard.style.transform = 'scale(1)';

  // Force reflow
  chartCard.offsetHeight;

  // Animasyon başlat
  let frame = 0;
  const pulseAnimation = setInterval(() => {
    frame++;

    if (frame === 1) {
      // Frame 1: Başlangıç
      chartCard.style.transition = 'all 0.3s ease-out';
      chartCard.style.boxShadow = '0 0 0 10px rgba(76, 175, 80, 0.4), 0 0 0 20px rgba(76, 175, 80, 0.2), 0 8px 32px rgba(76, 175, 80, 0.3)';
      chartCard.style.transform = 'scale(1.03)';
    } else if (frame === 3) {
      // Frame 2: Genişleme
      chartCard.style.boxShadow = '0 0 0 20px rgba(76, 175, 80, 0.2), 0 0 0 40px rgba(76, 175, 80, 0.1), 0 12px 48px rgba(76, 175, 80, 0.2)';
      chartCard.style.transform = 'scale(1.05)';
    } else if (frame === 5) {
      // Frame 3: Geri dönüş
      chartCard.style.boxShadow = '0 0 0 10px rgba(76, 175, 80, 0.1), 0 0 0 20px rgba(76, 175, 80, 0.05), 0 8px 32px rgba(76, 175, 80, 0.1)';
      chartCard.style.transform = 'scale(1.02)';
    } else if (frame === 7) {
      // Frame 4: Normal
      chartCard.style.boxShadow = originalBoxShadow;
      chartCard.style.transform = originalTransform;
      clearInterval(pulseAnimation);

      // Transition'ı kaldır
      setTimeout(() => {
        chartCard.style.transition = '';
      }, 300);
    }
  }, 200); // Her 200ms bir frame

  // 2. GÜNCELLEME BADGE EKLE
  const existingBadge = chartCard.querySelector('.update-badge');
  if (existingBadge) existingBadge.remove();

  const badge = document.createElement('div');
  badge.className = 'update-badge';
  badge.innerHTML = '✨ GÜNCELLENDİ';
  badge.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
    color: white;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
    animation: badgeFadeInOut 3s ease-in-out forwards;
    pointer-events: none;
  `;

  // Keyframe animasyonunu dinamik ekle (eğer yoksa)
  if (!document.getElementById('badge-animation-style')) {
    const style = document.createElement('style');
    style.id = 'badge-animation-style';
    style.innerHTML = `
      @keyframes badgeFadeInOut {
        0% {
          opacity: 0;
          transform: translateY(-10px) scale(0.8);
        }
        15% {
          opacity: 1;
          transform: translateY(0) scale(1.1);
        }
        20% {
          transform: translateY(0) scale(1);
        }
        80% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(-10px) scale(0.8);
        }
      }
    `;
    document.head.appendChild(style);
  }

  chartCard.style.position = 'relative';
  chartCard.appendChild(badge);

  // 3 saniye sonra badge'i kaldır
  setTimeout(() => {
    badge.remove();
  }, 3000);

  console.log(`✅ Highlight tamamlandı: ${chartId}`);
}

let fullscreenRefreshInterval = null;

function startFullscreenAutoRefresh() {
  // Mevcut interval varsa temizle
  if (fullscreenRefreshInterval) {
    clearInterval(fullscreenRefreshInterval);
  }

  // 30 saniyede bir otomatik yenile
  fullscreenRefreshInterval = setInterval(() => {
    if (isFullscreenMode && currentSection === 'executive-dashboard') {
      console.log('🔄 Fullscreen auto-refresh...');
      updateExecutiveDashboard();

      // Tüm grafikleri highlight et (güncelleme göstergesi)
      highlightUpdatedChart('exec-weekly-chart');
      setTimeout(() => highlightUpdatedChart('exec-category-breakdown'), 200);
      setTimeout(() => highlightUpdatedChart('exec-hourly-chart'), 400);
      setTimeout(() => highlightUpdatedChart('exec-user-chart'), 600);
    }
  }, 30000); // 30 saniye
}

function stopFullscreenAutoRefresh() {
  if (fullscreenRefreshInterval) {
    clearInterval(fullscreenRefreshInterval);
    fullscreenRefreshInterval = null;
  }
}

// Fullscreen detection başlat
initFullscreenDetection();

// Test fonksiyonu - Manuel fullscreen tetikleme (Buton toggle)
window.testFullscreenMode = function() {
  if (currentSection !== 'executive-dashboard') {
    console.warn('⚠️ Dashboard açık değil!');
    return;
  }

  // Buton text güncelle
  const btnText = document.getElementById('fullscreen-btn-text');

  if (isFullscreenMode) {
    console.log('🖥️ Normal moda dönülüyor...');
    exitFullscreenMode();
    if (btnText) btnText.textContent = 'Tam Ekran';
  } else {
    console.log('🖥️ Tam ekran moduna geçiliyor...');
    enterFullscreenMode();
    if (btnText) btnText.textContent = 'Çıkış';
  }
};

// Global expose
window.enterFullscreenMode = enterFullscreenMode;
window.exitFullscreenMode = exitFullscreenMode;
window.highlightUpdatedChart = highlightUpdatedChart;

// --- DECIMAL INPUT FIX (eklenen yardımcı) ---