// =====================================================
// SATIN ALMA MODÜLÜ - JAVASCRIPT
// =====================================================

// Global değişkenler
let purchasingOrders = [];
let purchasingSuppliers = [];
let filteredOrders = [];

// =====================================================
// VERİ YÜKLEME FONKSİYONLARI
// =====================================================

async function refreshPurchasingData() {
  console.log('🔄 Satın alma verileri yenileniyor...');

  try {
    // Siparişleri yükle
    const { data: orders, error: ordersError } = await supabaseClient
      .from('purchasing_orders')
      .select('*')
      .order('siparis_tarihi', { ascending: false });

    if (ordersError) {
      console.error('Sipariş yükleme hatası:', ordersError);
      showToast('❌ Siparişler yüklenemedi: ' + ordersError.message, 'error');
      return;
    }

    purchasingOrders = orders || [];
    filteredOrders = [...purchasingOrders];

    console.log(`✅ ${purchasingOrders.length} sipariş yüklendi`);

    // Tedarikçileri yükle
    const { data: suppliers, error: suppliersError } = await supabaseClient
      .from('purchasing_suppliers')
      .select('*')
      .order('tedarikci_tanimi', { ascending: true });

    if (suppliersError) {
      console.error('Tedarikçi yükleme hatası:', suppliersError);
    } else {
      purchasingSuppliers = suppliers || [];
      console.log(`✅ ${purchasingSuppliers.length} tedarikçi yüklendi`);
    }

    // UI'ı güncelle
    renderPurchasingStats();
    renderPurchasingTable();
    renderPurchasingFilters();

    showToast('✅ Veriler yüklendi', 'success');

  } catch (error) {
    console.error('Beklenmeyen hata:', error);
    showToast('❌ Beklenmeyen bir hata oluştu', 'error');
  }
}

// =====================================================
// İSTATİSTİK KARTLARI
// =====================================================

function renderPurchasingStats() {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  // Bugünkü siparişler
  const todayOrders = purchasingOrders.filter(o => o.siparis_tarihi === today);

  // Bu ayki siparişler
  const monthOrders = purchasingOrders.filter(o =>
    o.siparis_tarihi && o.siparis_tarihi.startsWith(thisMonth)
  );

  // Toplam tutar (TL)
  const totalAmount = monthOrders.reduce((sum, o) => sum + (parseFloat(o.tutar_tl) || 0), 0);

  // Bekleyen siparişler (gelen_miktar < miktar)
  const pendingOrders = purchasingOrders.filter(o =>
    (parseFloat(o.gelen_miktar) || 0) < (parseFloat(o.miktar) || 0)
  );

  const statsHTML = `
    <div class="purchasing-stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: #e3f2fd;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Bugünkü Siparişler</div>
          <div class="stat-value">${todayOrders.length}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #f3e5f5;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7b1fa2" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Bu Ay Toplam</div>
          <div class="stat-value">${monthOrders.length}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #e8f5e9;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Bu Ay Tutar</div>
          <div class="stat-value">${formatCurrency(totalAmount)}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: #fff3e0;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f57c00" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Bekleyen Siparişler</div>
          <div class="stat-value">${pendingOrders.length}</div>
        </div>
      </div>
    </div>
  `;

  const contentEl = document.getElementById('purchasing-content');
  if (contentEl) {
    const existingStats = contentEl.querySelector('.purchasing-stats-grid');
    if (existingStats) {
      existingStats.outerHTML = statsHTML;
    } else {
      contentEl.innerHTML = statsHTML + contentEl.innerHTML;
    }
  }
}

// =====================================================
// FİLTRE PANELİ
// =====================================================

function renderPurchasingFilters() {
  // Benzersiz tedarikçileri al
  const uniqueSuppliers = [...new Set(purchasingOrders.map(o => o.tedarikci_tanimi).filter(Boolean))];

  // Benzersiz ödeme koşullarını al
  const uniquePaymentTerms = [...new Set(purchasingOrders.map(o => o.odeme_kosulu).filter(Boolean))];

  const filtersHTML = `
    <div class="purchasing-filters">
      <h3>Filtreler</h3>
      <div class="filter-row">
        <div class="filter-group">
          <label>Tedarikçi</label>
          <select id="filter-supplier" onchange="applyPurchasingFilters()">
            <option value="">Tümü</option>
            ${uniqueSuppliers.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label>Ödeme Koşulu</label>
          <select id="filter-payment" onchange="applyPurchasingFilters()">
            <option value="">Tümü</option>
            ${uniquePaymentTerms.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label>Başlangıç Tarihi</label>
          <input type="date" id="filter-date-start" onchange="applyPurchasingFilters()">
        </div>

        <div class="filter-group">
          <label>Bitiş Tarihi</label>
          <input type="date" id="filter-date-end" onchange="applyPurchasingFilters()">
        </div>

        <div class="filter-group">
          <button class="btn btn-secondary" onclick="clearPurchasingFilters()">Filtreleri Temizle</button>
        </div>
      </div>
    </div>
  `;

  const contentEl = document.getElementById('purchasing-content');
  if (contentEl) {
    const existingFilters = contentEl.querySelector('.purchasing-filters');
    if (existingFilters) {
      existingFilters.outerHTML = filtersHTML;
    } else {
      const statsEl = contentEl.querySelector('.purchasing-stats-grid');
      if (statsEl) {
        statsEl.insertAdjacentHTML('afterend', filtersHTML);
      }
    }
  }
}

function applyPurchasingFilters() {
  const supplier = document.getElementById('filter-supplier')?.value || '';
  const payment = document.getElementById('filter-payment')?.value || '';
  const dateStart = document.getElementById('filter-date-start')?.value || '';
  const dateEnd = document.getElementById('filter-date-end')?.value || '';

  filteredOrders = purchasingOrders.filter(order => {
    if (supplier && order.tedarikci_tanimi !== supplier) return false;
    if (payment && order.odeme_kosulu !== payment) return false;
    if (dateStart && order.siparis_tarihi < dateStart) return false;
    if (dateEnd && order.siparis_tarihi > dateEnd) return false;
    return true;
  });

  renderPurchasingTable();
  console.log(`🔍 Filtre uygulandı: ${filteredOrders.length}/${purchasingOrders.length} sipariş`);
}

function clearPurchasingFilters() {
  document.getElementById('filter-supplier').value = '';
  document.getElementById('filter-payment').value = '';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';

  filteredOrders = [...purchasingOrders];
  renderPurchasingTable();

  showToast('✅ Filtreler temizlendi', 'success');
}

// =====================================================
// TABLO RENDER
// =====================================================

function renderPurchasingTable() {
  const tableHTML = `
    <div class="purchasing-table-container">
      <h3>Siparişler (${filteredOrders.length})</h3>
      <div class="table-wrapper">
        <table class="purchasing-table">
          <thead>
            <tr>
              <th>Sipariş No</th>
              <th>Tarih</th>
              <th>Tedarikçi</th>
              <th>Malzeme</th>
              <th>Miktar</th>
              <th>Gelen</th>
              <th>Birim Fiyat</th>
              <th>Tutar (TL)</th>
              <th>Ödeme Koşulu</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0 ? `
              <tr>
                <td colspan="10" style="text-align:center; padding:40px; color:#999;">
                  Sipariş bulunamadı
                </td>
              </tr>
            ` : filteredOrders.map(order => `
              <tr>
                <td>${order.siparis_no || '-'}</td>
                <td>${formatDate(order.siparis_tarihi)}</td>
                <td>${order.tedarikci_tanimi || '-'}</td>
                <td>${order.malzeme_tanimi || '-'}</td>
                <td>${formatNumber(order.miktar)} ${order.birim || ''}</td>
                <td>${formatNumber(order.gelen_miktar)}</td>
                <td>${formatCurrency(order.birim_fiyat)}</td>
                <td>${formatCurrency(order.tutar_tl)}</td>
                <td>${order.odeme_kosulu || '-'}</td>
                <td>${getOrderStatus(order)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  const contentEl = document.getElementById('purchasing-content');
  if (contentEl) {
    const existingTable = contentEl.querySelector('.purchasing-table-container');
    if (existingTable) {
      existingTable.outerHTML = tableHTML;
    } else {
      const filtersEl = contentEl.querySelector('.purchasing-filters');
      if (filtersEl) {
        filtersEl.insertAdjacentHTML('afterend', tableHTML);
      }
    }
  }
}

// =====================================================
// CSV UPLOAD
// =====================================================

function openCSVUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = (e) => handleCSVFile(e.target.files[0]);
  input.click();
}

async function handleCSVFile(file) {
  if (!file) return;

  showToast('📤 CSV dosyası işleniyor...', 'info');

  try {
    const text = await file.text();
    const orders = parseCSV(text);

    console.log(`📦 ${orders.length} sipariş parse edildi`);

    // Supabase'e yükle
    const { data, error } = await supabaseClient
      .from('purchasing_orders')
      .insert(orders);

    if (error) {
      console.error('CSV yükleme hatası:', error);
      showToast('❌ CSV yüklenemedi: ' + error.message, 'error');
      return;
    }

    showToast(`✅ ${orders.length} sipariş başarıyla yüklendi`, 'success');
    await refreshPurchasingData();

  } catch (error) {
    console.error('CSV işleme hatası:', error);
    showToast('❌ CSV dosyası işlenemedi', 'error');
  }
}

function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const orders = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const order = {};

    headers.forEach((header, index) => {
      const value = values[index]?.trim() || null;

      // Alan adlarını eşleştir (CSV header'ları ile database kolonları)
      const fieldMapping = {
        'Sipariş No': 'siparis_no',
        'Sipariş Tarihi': 'siparis_tarihi',
        'Tedarikçi Kodu': 'tedarikci_kodu',
        'Tedarikçi': 'tedarikci_tanimi',
        'Malzeme': 'malzeme_tanimi',
        'Miktar': 'miktar',
        'Birim': 'birim',
        'Birim Fiyat': 'birim_fiyat',
        'Tutar (TL)': 'tutar_tl',
        'Ödeme Koşulu': 'odeme_kosulu',
        // Diğer alanları buraya ekleyebilirsiniz
      };

      const dbField = fieldMapping[header] || header.toLowerCase().replace(/ /g, '_');
      order[dbField] = value;
    });

    orders.push(order);
  }

  return orders;
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

function formatCurrency(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(value);
}

function formatNumber(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('tr-TR').format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR').format(date);
}

function getOrderStatus(order) {
  const miktar = parseFloat(order.miktar) || 0;
  const gelen = parseFloat(order.gelen_miktar) || 0;

  if (gelen === 0) {
    return '<span style="color:#f57c00; font-weight:600;">Beklemede</span>';
  } else if (gelen < miktar) {
    return '<span style="color:#1976d2; font-weight:600;">Kısmi Geldi</span>';
  } else {
    return '<span style="color:#2e7d32; font-weight:600;">Tamamlandı</span>';
  }
}

// =====================================================
// SAYFA AÇILDIĞINDA VERİLERİ YÜKLE
// =====================================================

// showSection('purchasing') çağrıldığında bu fonksiyon otomatik çalışacak
// main.js'deki showSection fonksiyonuna hook eklemek gerekebilir

console.log('✅ Purchasing modülü yüklendi');
