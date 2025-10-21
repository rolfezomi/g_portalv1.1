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

    // Kullanıcı email'ini al
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userEmail = user?.email;

    if (!userEmail) {
      showToast('❌ Kullanıcı bilgisi alınamadı', 'error');
      return;
    }

    // Her siparişe created_by bilgisini ekle
    const ordersWithMetadata = orders.map(order => ({
      ...order,
      created_by: userEmail,
      updated_by: userEmail
    }));

    console.log('📤 Supabase\'e yükleniyor...', ordersWithMetadata);

    // Supabase'e yükle
    const { data, error } = await supabaseClient
      .from('purchasing_orders')
      .insert(ordersWithMetadata);

    if (error) {
      console.error('CSV yükleme hatası:', error);
      console.error('Hata detayı:', JSON.stringify(error, null, 2));
      showToast('❌ CSV yüklenemedi: ' + error.message, 'error');
      return;
    }

    console.log('✅ Supabase yanıtı:', data);
    showToast(`✅ ${orders.length} sipariş başarıyla yüklendi`, 'success');
    await refreshPurchasingData();

  } catch (error) {
    console.error('CSV işleme hatası:', error);
    console.error('Hata stack:', error.stack);
    showToast('❌ CSV dosyası işlenemedi: ' + error.message, 'error');
  }
}

function parseCSV(text) {
  // Canias ERP CSV format'ı için özelleştirilmiş parsing
  // Ayırıcı: noktalı virgül (;)

  function parseCSVLine(line, delimiter = ';') {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // BOM karakterini temizle (UTF-8 BOM: ﻿)
  text = text.replace(/^\uFEFF/, '');

  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('CSV dosyası boş');
  }

  // Canias formatı - noktalı virgül ile ayrılmış
  const headers = parseCSVLine(lines[0], ';').map(h => h.trim().replace(/^"|"$/g, ''));
  console.log('📋 CSV Headers:', headers);

  const orders = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], ';');
    const order = {};

    headers.forEach((header, index) => {
      let value = values[index]?.trim().replace(/^"|"$/g, '') || null;

      // Canias ERP field mapping
      const fieldMapping = {
        'Teslimat': 'teslimat',
        'Baslama': 'baslama',
        'Firma': 'firma',
        'SiparisTip': 'siparis_tip',
        'SiparisNo': 'siparis_no',
        'SiparisTarihi': 'siparis_tarihi',
        'SiparisKalemi': 'siparis_kalemi',
        'Malzeme': 'malzeme',
        'MalzemeTanimi': 'malzeme_tanimi',
        'Birim': 'birim',
        'Depo': 'depo',
        'MalzemeGrubu': 'malzeme_grubu',
        'Marka': 'marka',
        'TedarikciKodu': 'tedarikci_kodu',
        'TedarikciTanimi': 'tedarikci_tanimi',
        'TeslimTarihi': 'teslim_tarihi',
        'OzelStok': 'ozel_stok',
        'Miktar': 'miktar',
        'GelenMiktar': 'gelen_miktar',
        'BirimFiyat': 'birim_fiyat',
        'Brut': 'brut',
        'NET': 'net',
        'Kur': 'kur',
        'KDVOrani': 'kdv_orani',
        'Aciklama': 'aciklama',
        'OdemeKosulu': 'odeme_kosulu',
        'IstekTipi': 'istek_tipi',
        'IstekNo': 'istek_no',
        'IstekTeslimTarihi': 'istek_teslim_tarihi',
        'TutarTL': 'tutar_tl',
        'VADEGUN': 'vade_gun',
        'VADEYEGORE': 'vadeye_gore',
        'Fark': 'fark',
        'DepoFark': 'depo_fark',
        'Bu hafta': 'bu_hafta',
        'Bu Ay': 'bu_ay',
        'Tip': 'tip'
      };

      const dbField = fieldMapping[header] || header.toLowerCase()
        .replace(/ /g, '_')
        .replace(/[öÖ]/g, 'o')
        .replace(/[üÜ]/g, 'u')
        .replace(/[şŞ]/g, 's')
        .replace(/[ıİI]/g, 'i')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[çÇ]/g, 'c');

      // Boş string'leri null yap
      if (value === '' || value === '-' || value === 'Hic') {
        value = null;
      }

      // Tarih formatını dönüştür (Canias: 4.10.2025 -> PostgreSQL: 2025-10-04)
      if ((dbField === 'siparis_tarihi' || dbField === 'teslim_tarihi' ||
           dbField === 'istek_teslim_tarihi' || dbField === 'vadeye_gore') && value) {
        const dateParts = value.split('.');
        if (dateParts.length === 3) {
          const day = dateParts[0].padStart(2, '0');
          const month = dateParts[1].padStart(2, '0');
          const year = dateParts[2];
          value = `${year}-${month}-${day}`;
        }
      }

      // Sayısal değerleri dönüştür (Canias: 3,9031 -> PostgreSQL: 3.9031)
      if ((dbField === 'miktar' || dbField === 'gelen_miktar' || dbField === 'birim_fiyat' ||
           dbField === 'brut' || dbField === 'net' || dbField === 'tutar_tl' ||
           dbField === 'kdv_orani' || dbField === 'vade_gun' || dbField === 'fark' ||
           dbField === 'depo_fark') && value) {
        value = value.replace(/\./g, '').replace(',', '.');
      }

      order[dbField] = value;
    });

    // En az bir alan dolu ise ekle
    const hasData = Object.values(order).some(v => v !== null && v !== '');
    if (hasData) {
      orders.push(order);
    }
  }

  console.log(`📦 ${orders.length} adet sipariş parse edildi`);
  if (orders.length > 0) {
    console.log('📝 İlk sipariş örneği:', orders[0]);
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
