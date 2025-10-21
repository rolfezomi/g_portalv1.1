// =====================================================
// SATIN ALMA MODÜLÜ - JAVASCRIPT
// =====================================================

// Global değişkenler
let purchasingOrders = [];
let purchasingSuppliers = [];
let filteredOrders = [];
let currentSortField = 'siparis_tarihi';
let currentSortDirection = 'desc';
let searchQuery = '';

// =====================================================
// VERİ YÜKLEME FONKSİYONLARI
// =====================================================

async function refreshPurchasingData() {
  console.log('🔄 Satın alma verileri yenileniyor...');

  try {
    // Siparişleri yükle - SADECE EN GÜNCEL REVİZYONLAR (is_latest = true)
    const { data: orders, error: ordersError } = await supabaseClient
      .from('purchasing_orders')
      .select('*')
      .eq('is_latest', true)
      .order('siparis_tarihi', { ascending: false });

    if (ordersError) {
      console.error('Sipariş yükleme hatası:', ordersError);
      showToast('❌ Siparişler yüklenemedi: ' + ordersError.message, 'error');
      return;
    }

    purchasingOrders = orders || [];
    console.log(`📦 ${purchasingOrders.length} güncel sipariş yüklendi`);
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
      <h3>Filtreler & Arama</h3>

      <!-- Arama Kutusu -->
      <div class="filter-row search-row">
        <div class="filter-group search-group">
          <label>🔍 Hızlı Arama (Tedarikçi, Malzeme, Sipariş No)</label>
          <input
            type="text"
            id="purchasing-search"
            placeholder="Ara..."
            value="${searchQuery}"
            oninput="handlePurchasingSearch(this.value)"
            class="search-input"
          >
        </div>
      </div>

      <!-- Filtreler -->
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
          <button class="btn btn-secondary" onclick="clearPurchasingFilters()">Tümünü Temizle</button>
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

function handlePurchasingSearch(value) {
  searchQuery = value.toLowerCase().trim();
  applyPurchasingFilters();
}

function applyPurchasingFilters() {
  const supplier = document.getElementById('filter-supplier')?.value || '';
  const payment = document.getElementById('filter-payment')?.value || '';
  const dateStart = document.getElementById('filter-date-start')?.value || '';
  const dateEnd = document.getElementById('filter-date-end')?.value || '';

  filteredOrders = purchasingOrders.filter(order => {
    // Dropdown filtreler
    if (supplier && order.tedarikci_tanimi !== supplier) return false;
    if (payment && order.odeme_kosulu !== payment) return false;
    if (dateStart && order.siparis_tarihi < dateStart) return false;
    if (dateEnd && order.siparis_tarihi > dateEnd) return false;

    // Arama filtresi
    if (searchQuery) {
      const searchableText = [
        order.siparis_no,
        order.tedarikci_tanimi,
        order.tedarikci_kodu,
        order.malzeme_tanimi,
        order.malzeme,
        order.odeme_kosulu
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableText.includes(searchQuery)) return false;
    }

    return true;
  });

  // Sıralama uygula
  sortPurchasingOrders();

  renderPurchasingTable();
  console.log(`🔍 Filtre uygulandı: ${filteredOrders.length}/${purchasingOrders.length} sipariş`);
}

function clearPurchasingFilters() {
  document.getElementById('filter-supplier').value = '';
  document.getElementById('filter-payment').value = '';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';
  document.getElementById('purchasing-search').value = '';

  searchQuery = '';
  filteredOrders = [...purchasingOrders];
  sortPurchasingOrders();
  renderPurchasingTable();

  showToast('✅ Filtreler temizlendi', 'success');
}

// =====================================================
// SIRALAMA FONKSİYONLARI
// =====================================================

function sortPurchasingOrders() {
  filteredOrders.sort((a, b) => {
    let aVal = a[currentSortField];
    let bVal = b[currentSortField];

    // Null değerleri sona at
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    // Sayısal karşılaştırma
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // String karşılaştırma
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (currentSortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });
}

function handleSort(field) {
  if (currentSortField === field) {
    // Aynı alana tıklanırsa yönü değiştir
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    // Farklı alana tıklanırsa yeni alan ve varsayılan yön
    currentSortField = field;
    currentSortDirection = 'asc';
  }

  sortPurchasingOrders();
  renderPurchasingTable();
}

// =====================================================
// TABLO RENDER
// =====================================================

function renderPurchasingTable() {
  // Sıralama okları oluştur
  const getSortIcon = (field) => {
    if (currentSortField !== field) {
      return '<span class="sort-icon">⇅</span>';
    }
    return currentSortDirection === 'asc'
      ? '<span class="sort-icon active">▲</span>'
      : '<span class="sort-icon active">▼</span>';
  };

  const tableHTML = `
    <div class="purchasing-table-container">
      <h3>Siparişler (${filteredOrders.length})</h3>
      <div class="table-wrapper">
        <table class="purchasing-table">
          <thead>
            <tr>
              <th class="sortable" onclick="handleSort('siparis_no')">
                Sipariş No ${getSortIcon('siparis_no')}
              </th>
              <th class="sortable" onclick="handleSort('siparis_tarihi')">
                Tarih ${getSortIcon('siparis_tarihi')}
              </th>
              <th class="sortable" onclick="handleSort('tedarikci_tanimi')">
                Tedarikçi ${getSortIcon('tedarikci_tanimi')}
              </th>
              <th class="sortable" onclick="handleSort('malzeme_tanimi')">
                Malzeme ${getSortIcon('malzeme_tanimi')}
              </th>
              <th class="sortable" onclick="handleSort('miktar')">
                Miktar ${getSortIcon('miktar')}
              </th>
              <th class="sortable" onclick="handleSort('gelen_miktar')">
                Gelen ${getSortIcon('gelen_miktar')}
              </th>
              <th class="sortable" onclick="handleSort('birim_fiyat')">
                Birim Fiyat ${getSortIcon('birim_fiyat')}
              </th>
              <th class="sortable" onclick="handleSort('tutar_tl')">
                Tutar (TL) ${getSortIcon('tutar_tl')}
              </th>
              <th class="sortable" onclick="handleSort('odeme_kosulu')">
                Ödeme Koşulu ${getSortIcon('odeme_kosulu')}
              </th>
              <th class="sortable" onclick="handleSort('vadeye_gore')">
                Vade Tarihi ${getSortIcon('vadeye_gore')}
              </th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0 ? `
              <tr>
                <td colspan="11" style="text-align:center; padding:40px; color:#999;">
                  ${searchQuery ? '🔍 Arama sonucu bulunamadı' : 'Sipariş bulunamadı'}
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
                <td>${formatVadeDate(order.vadeye_gore)}</td>
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

    // REVIZYON MANTIĞI: Her sipariş için kontrol et ve işle
    const results = await processOrdersWithRevision(orders, userEmail);

    console.log('✅ İşlem tamamlandı:', results);
    showToast(
      `✅ ${results.inserted} yeni, ${results.updated} güncellendi, ${results.unchanged} değişmedi`,
      'success'
    );
    await refreshPurchasingData();

  } catch (error) {
    console.error('CSV işleme hatası:', error);
    console.error('Hata stack:', error.stack);
    showToast('❌ CSV dosyası işlenemedi: ' + error.message, 'error');
  }
}

// Revizyon mantığıyla sipariş işleme
async function processOrdersWithRevision(orders, userEmail) {
  const results = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    errors: []
  };

  // Her sipariş için işle
  for (const order of orders) {
    try {
      const orderKey = `${order.siparis_no}-${order.siparis_kalemi || ''}`;

      // Mevcut en güncel kaydı bul
      const { data: existing, error: fetchError } = await supabaseClient
        .from('purchasing_orders')
        .select('*')
        .eq('siparis_no', order.siparis_no)
        .eq('siparis_kalemi', order.siparis_kalemi || '')
        .eq('is_latest', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = kayıt bulunamadı (normal)
        console.error(`Hata (${orderKey}):`, fetchError);
        results.errors.push({ order: orderKey, error: fetchError.message });
        continue;
      }

      if (!existing) {
        // YENİ SİPARİŞ - İlk kez ekleniyor
        const newOrder = {
          ...order,
          revision_number: 1,
          is_latest: true,
          revision_date: new Date().toISOString(),
          uploaded_by: userEmail,
          created_by: userEmail,
          updated_by: userEmail,
          changes_from_previous: null
        };

        const { error: insertError } = await supabaseClient
          .from('purchasing_orders')
          .insert([newOrder]);

        if (insertError) {
          console.error(`Ekleme hatası (${orderKey}):`, insertError);
          results.errors.push({ order: orderKey, error: insertError.message });
        } else {
          results.inserted++;
          console.log(`➕ Yeni sipariş: ${orderKey}`);
        }

      } else {
        // MEVCUT SİPARİŞ - Değişiklik kontrolü yap
        const changes = detectChanges(existing, order);

        if (Object.keys(changes).length === 0) {
          // DEĞİŞİKLİK YOK - Hiçbir şey yapma
          results.unchanged++;
          console.log(`⏭️ Değişiklik yok: ${orderKey}`);

        } else {
          // DEĞİŞİKLİK VAR - Yeni revizyon oluştur

          // 1. Eski kaydı güncelle (is_latest = false)
          const { error: updateError } = await supabaseClient
            .from('purchasing_orders')
            .update({ is_latest: false })
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Güncelleme hatası (${orderKey}):`, updateError);
            results.errors.push({ order: orderKey, error: updateError.message });
            continue;
          }

          // 2. Yeni revizyon ekle
          const newRevision = {
            ...order,
            revision_number: existing.revision_number + 1,
            is_latest: true,
            revision_date: new Date().toISOString(),
            uploaded_by: userEmail,
            created_by: existing.created_by, // İlk oluşturanı koru
            updated_by: userEmail,
            changes_from_previous: changes
          };

          const { error: revisionError } = await supabaseClient
            .from('purchasing_orders')
            .insert([newRevision]);

          if (revisionError) {
            console.error(`Revizyon hatası (${orderKey}):`, revisionError);
            results.errors.push({ order: orderKey, error: revisionError.message });

            // Rollback: Eski kaydı tekrar latest yap
            await supabaseClient
              .from('purchasing_orders')
              .update({ is_latest: true })
              .eq('id', existing.id);
          } else {
            results.updated++;
            console.log(`🔄 Güncellendi (v${newRevision.revision_number}): ${orderKey}`, changes);
          }
        }
      }

    } catch (err) {
      console.error('Beklenmeyen hata:', err);
      results.errors.push({ order: order.siparis_no, error: err.message });
    }
  }

  return results;
}

// İki sipariş arasındaki farkları tespit et
function detectChanges(oldOrder, newOrder) {
  const changes = {};

  // Kontrol edilecek alanlar
  const fieldsToCheck = [
    'gelen_miktar', 'miktar', 'birim_fiyat', 'tutar_tl', 'net', 'brut',
    'odeme_kosulu', 'vade_gun', 'vadeye_gore', 'teslim_tarihi',
    'kdv_orani', 'kur', 'malzeme_tanimi', 'tedarikci_tanimi',
    'depo', 'aciklama', 'teslimat', 'baslama', 'ozel_stok'
  ];

  for (const field of fieldsToCheck) {
    const oldValue = oldOrder[field];
    const newValue = newOrder[field];

    // Null ve undefined'ı eşit say
    if ((oldValue === null || oldValue === undefined) &&
        (newValue === null || newValue === undefined)) {
      continue;
    }

    // Değerler farklıysa kaydet
    if (oldValue !== newValue) {
      // Sayısal alanlar için tolerans
      if (typeof oldValue === 'number' && typeof newValue === 'number') {
        if (Math.abs(oldValue - newValue) < 0.01) continue; // 1 kuruş farkı ignore et
      }

      changes[field] = {
        from: oldValue,
        to: newValue
      };
    }
  }

  return changes;
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

    // Geçerli sipariş kontrolü - en az sipariş no veya tedarikçi olmalı
    const isValidOrder = (
      (order.siparis_no && order.siparis_no !== '-') ||
      (order.tedarikci_tanimi && order.tedarikci_tanimi !== '-') ||
      (order.malzeme_tanimi && order.malzeme_tanimi !== '-')
    );

    if (isValidOrder) {
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

function formatVadeDate(dateStr) {
  if (!dateStr) return '-';

  const vadeDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  vadeDate.setHours(0, 0, 0, 0);

  // Fark hesapla (gün cinsinden)
  const diffTime = vadeDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Tarih formatı
  const formattedDate = new Intl.DateTimeFormat('tr-TR').format(vadeDate);

  // Renk ve stil belirleme
  let className = 'vade-date';
  let label = '';

  if (diffDays < 0) {
    // Geçmiş - Kırmızı (Acil!)
    className += ' vade-overdue';
    label = `(${Math.abs(diffDays)} gün geçti)`;
  } else if (diffDays === 0) {
    // Bugün - Turuncu
    className += ' vade-today';
    label = '(BUGÜN)';
  } else if (diffDays <= 7) {
    // 1-7 gün - Sarı (Yaklaşıyor)
    className += ' vade-near';
    label = `(${diffDays} gün)`;
  } else if (diffDays <= 30) {
    // 8-30 gün - Açık Yeşil
    className += ' vade-medium';
    label = `(${diffDays} gün)`;
  } else {
    // 30+ gün - Yeşil (Uzak)
    className += ' vade-far';
    label = `(${diffDays} gün)`;
  }

  return `<span class="${className}">${formattedDate} <small>${label}</small></span>`;
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
