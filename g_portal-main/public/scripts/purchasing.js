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
let currentFilters = {
  siparisNo: '',
  firma: '',
  durum: '',
  tedarikci: '',
  odemeKosulu: '',
  startDate: '',
  endDate: ''
};

// =====================================================
// VERİ YÜKLEME FONKSİYONLARI
// =====================================================

async function refreshPurchasingData() {
  console.log('🔄 Satın alma verileri yenileniyor...');

  // Yükleme göstergesi
  const contentEl = document.getElementById('purchasing-content');
  if (contentEl) {
    contentEl.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <div style="font-size:48px; margin-bottom:20px;">🔄</div>
        <h3 style="color:#666;">Veriler Yükleniyor...</h3>
        <p style="color:#999;">Lütfen bekleyin</p>
      </div>
    `;
  }

  try {
    // Siparişleri yükle - TÜM KAYITLAR (is_latest filtresi YOK)
    // NOT: Satın alma modülünde her teslimat satırı ayrı gösterilmeli, revizyon kavramı gereksiz
    // NOT: Supabase default limiti 1000'dir, tüm kayıtları çekmek için yüksek limit
    const { data: orders, error: ordersError } = await supabaseClient
      .from('purchasing_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50000); // Maksimum 50.000 kayıt çek

    if (ordersError) {
      console.error('Sipariş yükleme hatası:', ordersError);

      // Hata durumunda boş durum göster
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="text-align:center; padding:60px 20px;">
            <div style="font-size:48px; margin-bottom:20px;">❌</div>
            <h3 style="color:#f44336;">Veriler Yüklenemedi</h3>
            <p style="color:#999;">${ordersError.message}</p>
            <button class="btn btn-primary" onclick="refreshPurchasingData()" style="margin-top:20px;">
              Tekrar Dene
            </button>
          </div>
        `;
      }
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

    // UI'ı güncelle - ÖNCE RENDER ET SONRA TOAST GÖSTER
    if (purchasingOrders.length === 0) {
      // Veri yoksa boş durum göster
      showEmptyState();
    } else {
      // Veri varsa tabloyu göster
      renderPurchasingStats();
      renderPurchasingFilters();
      renderPurchasingTable();
      showToast('✅ Veriler yüklendi', 'success');
    }

  } catch (error) {
    console.error('Beklenmeyen hata:', error);

    // Hata durumunda kullanıcıya bilgi ver
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <div style="font-size:48px; margin-bottom:20px;">⚠️</div>
          <h3 style="color:#ff9800;">Beklenmeyen Hata</h3>
          <p style="color:#999;">${error.message || 'Bilinmeyen hata'}</p>
          <button class="btn btn-primary" onclick="refreshPurchasingData()" style="margin-top:20px;">
            Tekrar Dene
          </button>
        </div>
      `;
    }
    showToast('❌ Beklenmeyen bir hata oluştu', 'error');
  }
}

// =====================================================
// İSTATİSTİK KARTLARI
// =====================================================

function renderPurchasingStats() {
  // Toplam siparişler
  const totalOrders = purchasingOrders.length;

  // Açık siparişler - kalan_miktar kontrolü ile (daha güvenilir)
  const openOrders = purchasingOrders.filter(o => {
    const siparisMiktar = parseFloat(o.miktar) || 0;
    const gelenMiktar = parseFloat(o.toplam_gelen_miktar || o.gelen_miktar) || 0;
    const kalanMiktar = parseFloat(o.kalan_miktar);

    // Eğer kalan_miktar hesaplanmışsa onu kullan
    if (kalanMiktar !== null && kalanMiktar !== undefined && !isNaN(kalanMiktar)) {
      return kalanMiktar > 0 && gelenMiktar === 0; // Hiç gelmemiş
    }

    // Yoksa manuel hesapla
    return siparisMiktar > 0 && gelenMiktar === 0;
  });

  // Kısmi teslimat
  const partialOrders = purchasingOrders.filter(o => {
    const siparisMiktar = parseFloat(o.miktar) || 0;
    const gelenMiktar = parseFloat(o.toplam_gelen_miktar || o.gelen_miktar) || 0;
    const kalanMiktar = parseFloat(o.kalan_miktar);

    if (kalanMiktar !== null && kalanMiktar !== undefined && !isNaN(kalanMiktar)) {
      return kalanMiktar > 0 && gelenMiktar > 0; // Kısmen gelmiş
    }

    return gelenMiktar > 0 && gelenMiktar < siparisMiktar;
  });

  // Toplam tutar (TL) - tüm siparişler
  const totalAmount = purchasingOrders.reduce((sum, o) => sum + (parseFloat(o.tutar_tl) || 0), 0);

  // Ortalama Termin Farkı (sadece tamamlanmış siparişler için)
  const completedOrders = purchasingOrders.filter(o => o.termin_farki !== null && o.termin_farki !== undefined);
  const avgTerminFarki = completedOrders.length > 0
    ? completedOrders.reduce((sum, o) => sum + (parseFloat(o.termin_farki) || 0), 0) / completedOrders.length
    : 0;

  // Debug için
  console.log('📊 Stats hesaplamaları:', {
    total: totalOrders,
    open: openOrders.length,
    partial: partialOrders.length,
    sampleOrder: purchasingOrders[0]
  });

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
          <div class="stat-label">Toplam Sipariş</div>
          <div class="stat-value">${totalOrders}</div>
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
          <div class="stat-label">Açık Siparişler</div>
          <div class="stat-value">${openOrders.length}</div>
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
          <div class="stat-label">Toplam Tutar (TL)</div>
          <div class="stat-value">${formatCurrency(totalAmount)}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon" style="background: ${avgTerminFarki > 0 ? '#ffebee' : avgTerminFarki < 0 ? '#e8f5e9' : '#fff3e0'};">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${avgTerminFarki > 0 ? '#c62828' : avgTerminFarki < 0 ? '#2e7d32' : '#f57c00'}" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-label">Ort. Termin Farkı</div>
          <div class="stat-value" style="color:${avgTerminFarki > 0 ? '#c62828' : avgTerminFarki < 0 ? '#2e7d32' : '#f57c00'};">
            ${avgTerminFarki > 0 ? '+' : ''}${avgTerminFarki.toFixed(1)} gün
          </div>
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
  // Benzersiz sipariş numaraları
  const uniqueOrderNumbers = [...new Set(purchasingOrders.map(o => o.siparis_no).filter(Boolean))].sort();

  // Benzersiz firmalar
  const uniqueFirmas = [...new Set(purchasingOrders.map(o => o.firma).filter(Boolean))].sort();

  // Benzersiz teslimat durumları
  const uniqueStatuses = [...new Set(purchasingOrders.map(o => o.teslimat_durumu).filter(Boolean))].sort();

  // Benzersiz tedarikçiler
  const uniqueSuppliers = [...new Set(purchasingOrders.map(o => o.tedarikci_tanimi || o.tedarikci).filter(Boolean))].sort();

  // Benzersiz ödeme koşulları (AÇIKLAMA kullan, kod değil!)
  const uniquePaymentTerms = [...new Set(purchasingOrders
    .map(o => o.odeme_kosulu_tanimi || o.odeme_kosulu)
    .filter(Boolean)
  )].sort();

  const filtersHTML = `
    <div class="purchasing-filters">
      <h3>Filtreler & Arama</h3>

      <!-- Arama Kutusu -->
      <div class="filter-row search-row">
        <div class="filter-group search-group">
          <label>🔍 Hızlı Arama (Sipariş No, Tip, Tedarikçi, Malzeme)</label>
          <input
            type="text"
            id="purchasing-search"
            placeholder="Sipariş No, Tip, Tedarikçi veya Malzeme ara..."
            value="${searchQuery}"
            oninput="handlePurchasingSearch(this.value)"
            class="search-input"
          >
        </div>
      </div>

      <!-- Filtreler - 1. Satır -->
      <div class="filter-row">
        <div class="filter-group">
          <label>Sipariş No</label>
          <select id="filter-order-no" onchange="applyPurchasingFilters()">
            <option value="">Tümü</option>
            ${uniqueOrderNumbers.map(n => `<option value="${n}">${n}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label>Firma</label>
          <select id="filter-firma" onchange="applyPurchasingFilters()">
            <option value="">Tümü</option>
            ${uniqueFirmas.map(f => `<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>

        <div class="filter-group">
          <label>Teslimat Durumu</label>
          <select id="filter-status" onchange="applyPurchasingFilters()">
            <option value="">Tümü</option>
            ${uniqueStatuses.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </div>

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
      </div>

      <!-- Filtreler - 2. Satır (Tarihler ve Temizle) -->
      <div class="filter-row">
        <div class="filter-group">
          <label>Başlangıç Tarihi</label>
          <input type="date" id="filter-date-start" onchange="applyPurchasingFilters()">
        </div>

        <div class="filter-group">
          <label>Bitiş Tarihi</label>
          <input type="date" id="filter-date-end" onchange="applyPurchasingFilters()">
        </div>

        <div class="filter-group">
          <button class="btn btn-secondary" onclick="clearPurchasingFilters()" style="margin-top: 24px;">
            🗑️ Filtreleri Temizle
          </button>
        </div>

        <div class="filter-group">
          <button class="btn" onclick="clearAllPurchasingData()" style="margin-top: 24px; background: #f44336; color: white;">
            🗑️ Veritabanını Temizle
          </button>
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
  // Global currentFilters objesini güncelle
  currentFilters.siparisNo = document.getElementById('filter-order-no')?.value || '';
  currentFilters.firma = document.getElementById('filter-firma')?.value || '';
  currentFilters.durum = document.getElementById('filter-status')?.value || '';
  currentFilters.tedarikci = document.getElementById('filter-supplier')?.value || '';
  currentFilters.odemeKosulu = document.getElementById('filter-payment')?.value || '';
  currentFilters.startDate = document.getElementById('filter-date-start')?.value || '';
  currentFilters.endDate = document.getElementById('filter-date-end')?.value || '';

  filteredOrders = purchasingOrders.filter(order => {
    // Dropdown filtreler
    if (currentFilters.siparisNo && order.siparis_no !== currentFilters.siparisNo) return false;
    if (currentFilters.firma && order.firma !== currentFilters.firma) return false;
    if (currentFilters.durum && order.teslimat_durumu !== currentFilters.durum) return false;
    if (currentFilters.tedarikci && (order.tedarikci_tanimi !== currentFilters.tedarikci && order.tedarikci !== currentFilters.tedarikci)) return false;
    if (currentFilters.odemeKosulu && (order.odeme_kosulu_tanimi !== currentFilters.odemeKosulu && order.odeme_kosulu !== currentFilters.odemeKosulu)) return false;
    if (currentFilters.startDate && order.siparis_tarihi < currentFilters.startDate) return false;
    if (currentFilters.endDate && order.siparis_tarihi > currentFilters.endDate) return false;

    // Arama filtresi
    if (searchQuery) {
      const searchableText = [
        order.siparis_no,
        order.siparis_tip,
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
  document.getElementById('filter-order-no').value = '';
  document.getElementById('filter-firma').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-supplier').value = '';
  document.getElementById('filter-payment').value = '';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';
  document.getElementById('purchasing-search').value = '';

  // Global filtreleri sıfırla
  currentFilters = {
    siparisNo: '',
    firma: '',
    durum: '',
    tedarikci: '',
    odemeKosulu: '',
    startDate: '',
    endDate: ''
  };

  searchQuery = '';
  filteredOrders = [...purchasingOrders];
  sortPurchasingOrders();
  renderPurchasingTable();

  showToast('✅ Filtreler temizlendi', 'success');
}

/**
 * Veritabanındaki tüm satın alma verilerini temizle
 * NOT: Bu işlem geri alınamaz!
 */
async function clearAllPurchasingData() {
  // Onay iste
  const confirmed = confirm(
    '⚠️ UYARI: Veritabanındaki TÜM satın alma verileri silinecek.\n\n' +
    'Bu işlem geri alınamaz!\n\n' +
    'Emin misiniz?'
  );

  if (!confirmed) {
    return;
  }

  // İkinci onay
  const doubleConfirmed = confirm(
    '⚠️ SON UYARI!\n\n' +
    'Tüm sipariş verileri kalıcı olarak silinecek.\n\n' +
    'Devam etmek istiyor musunuz?'
  );

  if (!doubleConfirmed) {
    return;
  }

  try {
    showToast('🗑️ Veritabanı temizleniyor...', 'info');

    // Tüm kayıtları sil (Supabase'de tüm kayıtları silmek için trick)
    const { error } = await supabaseClient
      .from('purchasing_orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Tüm kayıtları sil

    if (error) {
      throw error;
    }

    showToast('✅ Veritabanı temizlendi. Şimdi Excel\'i tekrar yükleyin.', 'success');

    // Verileri yenile
    await refreshPurchasingData();

  } catch (error) {
    console.error('Veritabanı temizleme hatası:', error);
    showToast('❌ Temizleme hatası: ' + error.message, 'error');
  }
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

  // Sadece son 100 kaydı göster, ama toplam sayıyı belirt
  const displayOrders = filteredOrders.slice(0, 100);
  const totalCount = filteredOrders.length;

  const tableHTML = `
    <div class="purchasing-table-container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">Satın Alma Raporu
          <span style="font-size: 14px; color: #666; font-weight: normal;">
            (${displayOrders.length} / ${totalCount} gösteriliyor)
          </span>
        </h3>
        <button class="btn btn-primary" onclick="exportPurchasingToExcel()" style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Excel İndir (${totalCount} kayıt)
        </button>
      </div>
      <div class="table-wrapper">
        <table class="purchasing-table rapor-format-table">
          <thead>
            <tr>
              <th class="sortable col-firma" onclick="handleSort('firma')" title="Firma">Firma ${getSortIcon('firma')}</th>
              <th class="sortable col-talep-tip" onclick="handleSort('siparis_tip')" title="Talep Tipi">TalepTip ${getSortIcon('siparis_tip')}</th>
              <th class="sortable col-talep-no" onclick="handleSort('talep_no')" title="Talep Numarası">TalepNo ${getSortIcon('talep_no')}</th>
              <th class="sortable col-siparis-no" onclick="handleSort('siparis_no')" title="Sipariş Numarası">Sipariş No ${getSortIcon('siparis_no')}</th>
              <th class="sortable col-malzeme-kod" onclick="handleSort('malzeme')" title="Malzeme Kodu">Malzeme Kodu ${getSortIcon('malzeme')}</th>
              <th class="sortable col-malzeme-tanim" onclick="handleSort('malzeme_tanimi')" title="Malzeme Tanımı">Malzeme Tanım ${getSortIcon('malzeme_tanimi')}</th>
              <th class="sortable col-date" onclick="handleSort('talep_olusturma_tarihi')" title="Talep Oluşturma Tarihi">Talep Oluş.Tar. ${getSortIcon('talep_olusturma_tarihi')}</th>
              <th class="sortable col-date" onclick="handleSort('siparis_olusturma_tarihi')" title="Talebin Siparişe Dönüştürülme Tarihi">Sip.Dönüş.Tar. ${getSortIcon('siparis_olusturma_tarihi')}</th>
              <th class="sortable col-date" onclick="handleSort('ihtiyac_tarihi')" title="Talebin İstenen Teslim Tarihi">İstenen Tes.Tar. ${getSortIcon('ihtiyac_tarihi')}</th>
              <th class="sortable col-termin" onclick="handleSort('standart_termin_suresi')" title="Standart Termin Süresi (Gün)">Std.Termin ${getSortIcon('standart_termin_suresi')}</th>
              <th class="sortable col-date" onclick="handleSort('standart_termin_tarihi')" title="Standart Termine Göre Teslim Tarihi">Std.Termin Tar. ${getSortIcon('standart_termin_tarihi')}</th>
              <th class="sortable col-date" onclick="handleSort('mal_kabul_tarihi')" title="Siparişin Mal Kabul Tarihi (Depo)">Mal Kabul Tar. ${getSortIcon('mal_kabul_tarihi')}</th>
              <th class="sortable col-sapma" onclick="handleSort('planlama_sapmasi')" title="Standart Termine Göre Planlama Sapması (Gün)">Plan.Sapması ${getSortIcon('planlama_sapmasi')}</th>
              <th class="sortable col-sapma" onclick="handleSort('termin_farki')" title="Gerçekleşene Göre Termin Farkı (Satınalma ve Tedarikçi Performansı)">Termin Farkı ${getSortIcon('termin_farki')}</th>
              <th class="sortable col-miktar" onclick="handleSort('miktar')" title="Sipariş Miktarı">Sip.Miktarı ${getSortIcon('miktar')}</th>
              <th class="sortable col-miktar" onclick="handleSort('toplam_gelen_miktar')" title="Gelen Miktarı">Gelen Miktarı ${getSortIcon('toplam_gelen_miktar')}</th>
              <th class="sortable col-miktar" onclick="handleSort('kalan_miktar')" title="Kalan Miktar">Kalan Miktar ${getSortIcon('kalan_miktar')}</th>
              <th class="sortable col-fiyat" onclick="handleSort('birim_fiyat')" title="Birim Fiyat">Birim Fiyat ${getSortIcon('birim_fiyat')}</th>
              <th class="sortable col-fiyat" onclick="handleSort('para_birimi_tutar')" title="Tutar">Tutar ${getSortIcon('para_birimi_tutar')}</th>
              <th class="sortable col-para" onclick="handleSort('para_birimi')" title="Para Birimi">Para Birimi ${getSortIcon('para_birimi')}</th>
              <th class="sortable col-kur" onclick="handleSort('kur_degeri')" title="Kur Değeri">Kur Değeri ${getSortIcon('kur_degeri')}</th>
              <th class="sortable col-fiyat" onclick="handleSort('tutar_tl')" title="Toplam TL">Toplam TL ${getSortIcon('tutar_tl')}</th>
              <th class="sortable col-odeme" onclick="handleSort('odeme_kosulu_tanimi')" title="Ödeme Koşulu">Ödeme Koşulu ${getSortIcon('odeme_kosulu_tanimi')}</th>
              <th class="sortable col-date" onclick="handleSort('siparis_teslim_odeme_vadesi')" title="Ödeme Tarihi">Ödeme Tarihi ${getSortIcon('siparis_teslim_odeme_vadesi')}</th>
              <th class="sortable col-durum" onclick="handleSort('teslimat_durumu')" title="Teslimat Durumu">Teslimat Durumu ${getSortIcon('teslimat_durumu')}</th>
            </tr>
          </thead>
          <tbody>
            ${displayOrders.length === 0 ? `
              <tr>
                <td colspan="25" style="text-align:center; padding:40px; color:#999;">
                  ${searchQuery ? '🔍 Arama sonucu bulunamadı' : 'Sipariş bulunamadı'}
                </td>
              </tr>
            ` : displayOrders.map(order => `
              <tr>
                <td>${order.firma || '-'}</td>
                <td><span class="badge badge-info">${order.siparis_tip || '-'}</span></td>
                <td>${order.talep_no || '-'}</td>
                <td><strong>${order.siparis_no || '-'}</strong></td>
                <td style="font-size:11px;">${order.malzeme || '-'}</td>
                <td>${order.malzeme_tanimi || '-'}</td>
                <td>${formatDate(order.talep_olusturma_tarihi)}</td>
                <td>${formatDate(order.siparis_olusturma_tarihi)}</td>
                <td>${formatDate(order.ihtiyac_tarihi)}</td>
                <td style="text-align:center;">${order.standart_termin_suresi || 30}</td>
                <td>${formatDate(order.standart_termin_tarihi)}</td>
                <td>${formatDate(order.mal_kabul_tarihi)}</td>
                <td style="text-align:center;">${formatSapma(order.planlama_sapmasi)}</td>
                <td style="text-align:center;">${formatTerminFarki(order.termin_farki)}</td>
                <td style="text-align:right;">${formatNumber(order.miktar)} ${order.birim || ''}</td>
                <td style="text-align:right;">${formatNumber(order.toplam_gelen_miktar || order.gelen_miktar)}</td>
                <td style="text-align:right;">${formatKalanMiktar(order.kalan_miktar)}</td>
                <td style="text-align:right;">${formatCurrency(order.birim_fiyat)}</td>
                <td style="text-align:right;">${formatNumber(order.para_birimi_tutar)}</td>
                <td style="text-align:center;">${order.para_birimi || '-'}</td>
                <td style="text-align:right;">${formatNumber(order.kur_degeri)}</td>
                <td style="text-align:right;"><strong>${formatCurrency(order.tutar_tl)}</strong></td>
                <td>${order.odeme_kosulu_tanimi || order.odeme_kosulu || '-'}</td>
                <td>${formatDate(order.siparis_teslim_odeme_vadesi || order.vadeye_gore)}</td>
                <td>${getTeslimatDurumuBadge(order.teslimat_durumu)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:10px; color:#999; font-size:12px; text-align:center;">
        💡 Yatay scroll için fareyi tablo üzerinde hareket ettirin
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

// Geriye dönük uyumluluk için CSV upload fonksiyonunu koru
function openCSVUpload() {
  openFileUpload(); // Yeni fonksiyona yönlendir
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
      // Benzersiz anahtar: SiparisNo + SiparisKalemi + StokBelgeNo + IrsaliyeNo + FaturaNo
      // NOT: Aynı sipariş numarasına sahip farklı teslimat satırlarını ayırt etmek için
      const orderKey = `${order.siparis_no}-${order.siparis_kalemi || ''}-${order.stok_belge_no || ''}-${order.irsaliye_no || ''}-${order.fatura_no || ''}`;

      // Mevcut en güncel kaydı bul
      const { data: existing, error: fetchError } = await supabaseClient
        .from('purchasing_orders')
        .select('*')
        .eq('siparis_no', order.siparis_no)
        .eq('siparis_kalemi', order.siparis_kalemi || '')
        .eq('stok_belge_no', order.stok_belge_no || '')
        .eq('irsaliye_no', order.irsaliye_no || '')
        .eq('fatura_no', order.fatura_no || '')
        .eq('is_latest', true)
        .maybeSingle(); // Kayıt yoksa null döner, hata vermez (406 hatası yok)

      if (fetchError) {
        // Gerçek hata (maybeSingle kullandığımız için PGRST116 olmayacak)
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
    let oldValue = oldOrder[field];
    let newValue = newOrder[field];

    // Sayısal alanlar için null ve 0'ı eşit say
    const numericFields = ['gelen_miktar', 'miktar', 'birim_fiyat', 'tutar_tl',
                          'net', 'brut', 'kdv_orani', 'kur', 'vade_gun'];

    if (numericFields.includes(field)) {
      // null, undefined, boş string veya 0 değerlerini normalize et
      const isOldEmpty = oldValue === null || oldValue === undefined || oldValue === '' || oldValue === 0;
      const isNewEmpty = newValue === null || newValue === undefined || newValue === '' || newValue === 0;

      // Normalize: boş değerleri 0 yap, dolu değerleri parse et
      oldValue = isOldEmpty ? 0 : parseFloat(oldValue);
      newValue = isNewEmpty ? 0 : parseFloat(newValue);

      // NaN kontrolü
      if (isNaN(oldValue)) oldValue = 0;
      if (isNaN(newValue)) newValue = 0;

      // İkisi de 0 ise değişiklik yok
      if (oldValue === 0 && newValue === 0) {
        continue;
      }

      // Sayısal fark toleransı (1 kuruş)
      if (Math.abs(oldValue - newValue) < 0.01) {
        continue;
      }
    } else {
      // String/metin alanlar için null, undefined ve boş string'i eşit say
      const isOldEmpty = oldValue === null || oldValue === undefined || oldValue === '';
      const isNewEmpty = newValue === null || newValue === undefined || newValue === '';

      if (isOldEmpty && isNewEmpty) {
        continue;
      }
    }

    // Değerler farklıysa kaydet
    if (oldValue !== newValue) {
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

/**
 * Planlama sapmasını renkli gösterir
 * Negatif = Erken (Yeşil), Pozitif = Geç (Kırmızı)
 */
function formatSapma(days) {
  if (days === null || days === undefined) return '-';

  const num = parseFloat(days);
  if (isNaN(num)) return '-';

  let color = '#666';
  let icon = '';

  if (num < 0) {
    color = '#2e7d32'; // Yeşil (erken)
    icon = '▼';
  } else if (num > 0) {
    color = '#d32f2f'; // Kırmızı (geç)
    icon = '▲';
  } else {
    color = '#1976d2'; // Mavi (zamanında)
    icon = '●';
  }

  return `<span style="color:${color}; font-weight:600;">${icon} ${Math.abs(num)} gün</span>`;
}

/**
 * Termin farkını renkli gösterir
 * Negatif = Erken (Yeşil), Pozitif = Geç (Kırmızı)
 */
function formatTerminFarki(days) {
  if (days === null || days === undefined) return '-';

  const num = parseFloat(days);
  if (isNaN(num)) return '-';

  let color = '#666';
  let text = '';

  if (num < 0) {
    color = '#2e7d32'; // Yeşil (erken teslim)
    text = `${Math.abs(num)} gün erken`;
  } else if (num > 0) {
    color = '#d32f2f'; // Kırmızı (geç teslim)
    text = `${num} gün geç`;
  } else {
    color = '#1976d2'; // Mavi (zamanında)
    text = 'Zamanında';
  }

  return `<span style="color:${color}; font-weight:600;">${text}</span>`;
}

/**
 * Kalan miktarı renkli gösterir
 * > 0 = Turuncu (bekliyor), = 0 = Yeşil (tamamlandı)
 */
function formatKalanMiktar(miktar) {
  if (miktar === null || miktar === undefined) return '-';

  const num = parseFloat(miktar);
  if (isNaN(num)) return '-';

  let color = '#666';

  if (num > 0) {
    color = '#f57c00'; // Turuncu (bekliyor)
  } else if (num === 0) {
    color = '#2e7d32'; // Yeşil (tamamlandı)
  } else {
    color = '#666'; // Gri (negatif - hata?)
  }

  return `<span style="color:${color}; font-weight:600;">${formatNumber(num)}</span>`;
}

/**
 * Teslimat durumu badge'i
 * Açık = Kırmızı, Kısmi = Turuncu, Kapalı = Yeşil
 */
function getTeslimatDurumuBadge(durum) {
  if (!durum) return '<span class="badge badge-secondary">Bilinmiyor</span>';

  const durumLower = durum.toLowerCase();

  if (durumLower === 'açık') {
    return '<span class="badge badge-danger">Açık</span>';
  } else if (durumLower === 'kısmi') {
    return '<span class="badge badge-warning">Kısmi</span>';
  } else if (durumLower === 'kapalı') {
    return '<span class="badge badge-success">Kapalı</span>';
  } else {
    return `<span class="badge badge-secondary">${durum}</span>`;
  }
}

// Boş durum göster (henüz CSV yüklenmemiş)
function showEmptyState() {
  const contentEl = document.getElementById('purchasing-content');
  if (!contentEl) return;

  contentEl.innerHTML = `
    <div style="text-align:center; padding:80px 20px; max-width:600px; margin:0 auto;">
      <div style="font-size:64px; margin-bottom:20px;">📦</div>
      <h2 style="color:#333; margin-bottom:12px;">Satın Alma Verileri Bulunamadı</h2>
      <p style="color:#666; font-size:16px; line-height:1.6; margin-bottom:30px;">
        Henüz CSV dosyası yüklenmemiş. Başlamak için üst menüden <strong>"CSV Yükle"</strong> butonuna tıklayın.
      </p>
      <button
        class="btn btn-primary"
        onclick="openCSVUpload()"
        style="padding:12px 32px; font-size:16px;"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:8px;">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        İlk CSV Dosyasını Yükle
      </button>

      <div style="margin-top:40px; padding:20px; background:#f5f5f5; border-radius:8px; text-align:left;">
        <h4 style="margin-top:0; color:#555;">💡 Bilgi</h4>
        <ul style="color:#666; line-height:1.8;">
          <li>CSV dosyanız <strong>Canias ERP</strong> formatında olmalıdır (noktalı virgül ayırıcı)</li>
          <li>Tarih formatı: <code>GG.AA.YYYY</code> (örn: 04.10.2025)</li>
          <li>Sayı formatı: <code>1.234,56</code> (Türkçe format)</li>
          <li>Aynı sipariş numarası tekrar yüklenirse <strong>revizyon</strong> olarak kaydedilir</li>
        </ul>
      </div>
    </div>
  `;
}

// =====================================================
// XLSX UPLOAD FONKSİYONLARI (Satınalma360 Formatı)
// =====================================================

/**
 * XLSX dosya yükleme dialog'u aç
 * Hem .csv hem .xlsx formatlarını destekler
 */
function openFileUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv,.xlsx';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Dosya uzantısına göre uygun fonksiyonu çağır
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.xlsx')) {
      await handleXLSXFile(file);
    } else if (fileName.endsWith('.csv')) {
      await handleCSVFile(file);
    } else {
      showToast('❌ Geçersiz dosya formatı. Lütfen .csv veya .xlsx dosyası yükleyin.', 'error');
    }
  };
  input.click();
}

/**
 * XLSX dosyası işleme fonksiyonu
 * @param {File} file - Excel dosyası
 */
async function handleXLSXFile(file) {
  if (!file) return;

  showToast('📤 Excel dosyası işleniyor...', 'info');

  try {
    // Dosyayı ArrayBuffer olarak oku
    const arrayBuffer = await file.arrayBuffer();

    // XLSX parse et
    const orders = parseXLSX(arrayBuffer);

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
    console.error('XLSX işleme hatası:', error);
    console.error('Hata stack:', error.stack);
    showToast('❌ Excel dosyası işlenemedi: ' + error.message, 'error');
  }
}

/**
 * XLSX dosyasını parse eder ve Satınalma360 formatından database formatına dönüştürür
 * @param {ArrayBuffer} arrayBuffer - Excel dosyasının binary içeriği
 * @returns {Array} - Parse edilmiş siparişler dizisi
 */
function parseXLSX(arrayBuffer) {
  // SheetJS kütüphanesini kontrol et
  if (typeof XLSX === 'undefined') {
    throw new Error('SheetJS kütüphanesi yüklenmemiş. Lütfen sayfayı yenileyin.');
  }

  // Excel dosyasını oku
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  // İlk sheet'i al
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Sheet'i JSON'a çevir (başlıkları kullan)
  const rawData = XLSX.utils.sheet_to_json(worksheet, {
    raw: false, // Tarihleri string olarak al
    defval: null // Boş hücreler null olsun
  });

  console.log(`📋 Excel'den ${rawData.length} satır okundu`);

  if (rawData.length === 0) {
    throw new Error('Excel dosyası boş veya okunamadı');
  }

  // İlk satırı kontrol et (örnek)
  console.log('📝 İlk satır örneği:', rawData[0]);

  // Her satırı Satınalma360 formatından database formatına map et
  const orders = rawData.map((row, index) => {
    try {
      return mapSatinalma360ToDatabase(row);
    } catch (error) {
      console.warn(`⚠️ Satır ${index + 2} işlenemedi:`, error.message, row);
      return null;
    }
  }).filter(order => order !== null);

  console.log(`✅ ${orders.length} sipariş başarıyla işlendi`);

  if (orders.length > 0) {
    console.log('📝 İlk sipariş örneği (işlenmiş):', orders[0]);
  }

  return orders;
}

/**
 * Satınalma360 Excel satırını database formatına dönüştürür
 * @param {Object} row - Excel satırı (Satınalma360 formatı, 46 kolon)
 * @returns {Object} - Database formatı
 */
function mapSatinalma360ToDatabase(row) {
  // Satınalma360 → Database Field Mapping
  const mapped = {
    // Firma Bilgileri
    firma: row['Şirket'] || null,
    tedarikci: row['Tedarikçi'] || null,
    tedarikci_kodu: row['Tedarikçi'] || null, // Kod ve isim aynı field'da olabilir
    tedarikci_tanimi: row['TedarikçiTanımı'] || null,

    // Talep Bilgileri
    talep_tipi: row['TalepTipi'] || null,
    talep_no: row['TalepNo'] || null,
    talep_miktari: parseNumber(row['TalepMiktarı']),
    talep_birimi: row['TalepBirimi'] || null,
    talep_olustruran: row['TalepOluşturan'] || null,
    talep_olusturma_tarihi: parseExcelDate(row['TalepOluşturmaTarihi']),
    ihtiyac_tarihi: parseExcelDate(row['İhtiyaçTarihi']),

    // Sipariş Bilgileri
    siparis_tip: row['SiparişTipi'] || null, // NOT: Bu veri TalepTip başlığında gösterilecek
    siparis_no: row['SiparişNo'] || null,
    siparis_kalemi: row['SipKalemNo'] || null,
    siparis_kalem_no: row['SipKalemNo'] || null,
    siparis_tarihi: parseExcelDate(row['SiparişOluşturmaTarihi']),
    siparis_olusturma_tarihi: parseExcelDate(row['SiparişOluşturmaTarihi']),
    siparis_teslim_tarihi: parseExcelDate(row['SiparişTeslimTarihi']),

    // Malzeme Bilgileri
    malzeme: row['MalzemeKod'] || null,
    malzeme_tanimi: row['MalzemeTanım'] || null,
    birim: row['SiparişBirimi'] || null,

    // Miktar Bilgileri
    miktar: parseNumber(row['SiparişMiktarı']),
    gelen_miktar: parseNumber(row['ToplamGelenMiktar']),
    toplam_gelen_miktar: parseNumber(row['ToplamGelenMiktar']),
    toplam_fatura_miktar: parseNumber(row['ToplamFaturaMiktar']),

    // Finansal Bilgiler
    birim_fiyat: parseNumber(row['BirimFiyat']),
    para_birimi: row['ParaBirimi'] || null,
    kur: row['ParaBirimi'] || null, // Para birimi text olarak
    kur_degeri: parseNumber(row['Kur']),
    para_birimi_tutar: parseNumber(row['ParaBirimiTutar']),
    tutar_tl: parseNumber(row['TutarTL']),

    // Ödeme Bilgileri
    odeme_kosulu: row['ÖdemeKoşulu'] || null,
    odeme_kosulu_kod: row['ÖdemeKoşulu'] || null,
    odeme_kosulu_tanimi: row['ÖdemeKoşuluTanımı'] || null,
    siparis_teslim_odeme_vadesi: parseExcelDate(row['SiparisTeslimOdemeVadesi']),
    vadeye_gore: parseExcelDate(row['SiparisTeslimOdemeVadesi']), // Geriye dönük uyumluluk

    // Stok ve Teslimat
    mal_kabul_tarihi: parseExcelDate(row['StokGirişTarihi']),
    stok_giris_tarihi: parseExcelDate(row['StokGirişTarihi']),
    mal_kabul_statu: row['MalKabulStatü'] || null,
    fatura_statu: row['FaturaStatü'] || null,

    // Stok Belge Bilgileri
    irsaliye_no: row['IrsaliyeNo'] || null,
    stok_belge_tipi: row['StokBelgeTipi'] || null,
    stok_belge_no: row['StokBelgeNo'] || null,
    stok_belge_kalem_no: row['StokBelgeKalemNo'] || null,
    stok_belge_miktari: parseNumber(row['StokBelgeMiktarı']),
    stok_belge_birimi: row['StokBelgeBirimi'] || null,

    // Fatura Bilgileri
    fatura_miktar: parseNumber(row['FaturaMiktar']),
    fatura_tutar: parseNumber(row['FaturaTutar']),
    fatura_tipi: row['FaturaTipi'] || null,
    fatura_no: row['FaturaNo'] || null,
    e_fatura_no: row['EFaturaNo'] || null,
    fatura_tarihi: parseExcelDate(row['FaturaTarihi']),
    fatura_vade_tarihi: parseExcelDate(row['FaturaVadeTarihi'])
  };

  // Hesaplanan alanları ekle
  calculatePurchasingFields(mapped);

  // NORMALIZASYON: Case-insensitive eşleşme için belge numaralarını UPPERCASE'e çevir
  // Bu sayede "urt2024..." ve "URT2024..." aynı kabul edilir
  if (mapped.irsaliye_no) {
    mapped.irsaliye_no = mapped.irsaliye_no.toString().toUpperCase();
  }
  if (mapped.stok_belge_no) {
    mapped.stok_belge_no = mapped.stok_belge_no.toString().toUpperCase();
  }
  if (mapped.fatura_no) {
    mapped.fatura_no = mapped.fatura_no.toString().toUpperCase();
  }
  if (mapped.e_fatura_no) {
    mapped.e_fatura_no = mapped.e_fatura_no.toString().toUpperCase();
  }

  // Geçerlilik kontrolü - en az sipariş no veya malzeme olmalı
  const isValid = mapped.siparis_no || mapped.malzeme_tanimi || mapped.talep_no;

  if (!isValid) {
    throw new Error('Geçersiz satır: Sipariş No, Malzeme veya Talep No bulunamadı');
  }

  return mapped;
}

/**
 * Hesaplanan alanları doldurur (client-side hesaplama)
 * NOT: Trigger database'de de aynı hesaplamaları yapıyor, bu yedek
 * @param {Object} order - Sipariş nesnesi (referans olarak değiştirilir)
 */
function calculatePurchasingFields(order) {
  // Standart termin süresi (default: 30 gün, ileride ayarlanabilir)
  if (!order.standart_termin_suresi) {
    order.standart_termin_suresi = 30;
  }

  // Standart termin tarihi hesapla
  if (order.talep_olusturma_tarihi && order.standart_termin_suresi) {
    order.standart_termin_tarihi = addDays(
      order.talep_olusturma_tarihi,
      order.standart_termin_suresi
    );
  }

  // Planlama sapması (gün farkı)
  if (order.standart_termin_tarihi && order.mal_kabul_tarihi) {
    order.planlama_sapmasi = daysDiff(
      order.standart_termin_tarihi,
      order.mal_kabul_tarihi
    );
  }

  // Termin farkı (gün farkı)
  if (order.mal_kabul_tarihi && order.siparis_teslim_tarihi) {
    order.termin_farki = daysDiff(
      order.siparis_teslim_tarihi,
      order.mal_kabul_tarihi
    );
  }

  // Kalan miktar
  if (order.miktar !== null && order.miktar !== undefined) {
    const gelen = order.toplam_gelen_miktar || 0;
    order.kalan_miktar = order.miktar - gelen;
  }

  // Teslimat durumu
  const gelen = order.toplam_gelen_miktar || 0;
  const siparis = order.miktar || 0;

  if (gelen === 0) {
    order.teslimat_durumu = 'Açık';
  } else if (gelen < siparis) {
    order.teslimat_durumu = 'Kısmi';
  } else {
    order.teslimat_durumu = 'Kapalı';
  }
}

// =====================================================
// YARDIMCI FONKSİYONLAR (Helper Functions)
// =====================================================

/**
 * Excel tarih formatını PostgreSQL DATE formatına çevir
 * @param {string|number|Date} excelDate - Excel'den gelen tarih
 * @returns {string|null} - YYYY-MM-DD formatında tarih veya null
 */
function parseExcelDate(excelDate) {
  if (!excelDate) return null;

  try {
    let date;

    // Eğer zaten Date objesi ise
    if (excelDate instanceof Date) {
      date = excelDate;
    }
    // Excel serial number ise (sayı)
    else if (typeof excelDate === 'number') {
      // Excel serial date: 1899-12-30'dan itibaren gün sayısı
      date = XLSX.SSF.parse_date_code(excelDate);
      if (date) {
        date = new Date(date.y, date.m - 1, date.d);
      }
    }
    // String ise (çeşitli formatlar olabilir)
    else if (typeof excelDate === 'string') {
      // Türkçe format: GG.AA.YYYY veya DD.MM.YYYY
      if (excelDate.includes('.')) {
        const parts = excelDate.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          date = new Date(year, month - 1, day);
        }
      }
      // ISO format: YYYY-MM-DD
      else if (excelDate.includes('-')) {
        date = new Date(excelDate);
      }
      // Slash format: MM/DD/YYYY
      else if (excelDate.includes('/')) {
        date = new Date(excelDate);
      }
    }

    if (!date || isNaN(date.getTime())) {
      console.warn('Geçersiz tarih:', excelDate);
      return null;
    }

    // PostgreSQL formatına çevir: YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;

  } catch (error) {
    console.warn('Tarih parse hatası:', excelDate, error);
    return null;
  }
}

/**
 * Sayı parse et (Türkçe ve İngilizce format desteği)
 * @param {string|number} value - Parse edilecek değer
 * @returns {number|null} - Sayı veya null
 */
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  try {
    // String ise temizle
    let str = String(value).trim();

    // Boş veya geçersiz değerler
    if (str === '' || str === '-' || str === 'Hic') return null;

    // Türkçe format: 1.234,56 → 1234.56
    if (str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  } catch (error) {
    console.warn('Sayı parse hatası:', value, error);
    return null;
  }
}

/**
 * İki tarih arasındaki gün farkını hesapla
 * @param {string} date1 - İlk tarih (YYYY-MM-DD)
 * @param {string} date2 - İkinci tarih (YYYY-MM-DD)
 * @returns {number|null} - Gün farkı (date2 - date1) veya null
 */
function daysDiff(date1, date2) {
  if (!date1 || !date2) return null;

  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return null;
    }

    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.warn('Tarih farkı hesaplama hatası:', date1, date2, error);
    return null;
  }
}

/**
 * Tarihe gün ekle
 * @param {string} dateStr - Tarih (YYYY-MM-DD)
 * @param {number} days - Eklenecek gün sayısı
 * @returns {string|null} - Yeni tarih (YYYY-MM-DD) veya null
 */
function addDays(dateStr, days) {
  if (!dateStr || days === null || days === undefined) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Tarih ekleme hatası:', dateStr, days, error);
    return null;
  }
}

// =====================================================
// EXCEL EXPORT - RAPOR FORMATI (25 KOLON)
// =====================================================

/**
 * Tarihi Excel formatına çevir (YYYY-MM-DD → DD.MM.YYYY)
 * @param {string} dateStr - Tarih (YYYY-MM-DD formatında)
 * @returns {string} - Excel için formatlanmış tarih (DD.MM.YYYY)
 */
function formatDateForExcel(dateStr) {
  if (!dateStr) return '';

  try {
    // YYYY-MM-DD formatını parse et
    const parts = dateStr.split('T')[0].split('-'); // T varsa onu at (timestamp)
    if (parts.length !== 3) return dateStr; // Geçersiz format

    const [year, month, day] = parts;
    return `${day}.${month}.${year}`; // DD.MM.YYYY
  } catch (error) {
    console.warn('Tarih formatı hatası:', dateStr, error);
    return dateStr; // Hata durumunda orijinali döndür
  }
}

/**
 * Tüm satın alma verilerini Excel'e export et (Rapor Formatı - 25 kolon)
 */
async function exportPurchasingToExcel() {
  try {
    // SheetJS kontrolü
    if (typeof XLSX === 'undefined') {
      showToast('❌ Excel kütüphanesi yüklenmemiş. Sayfayı yenileyin.', 'error');
      console.error('XLSX kütüphanesi yüklenmemiş');
      return;
    }

    // Veri kontrolü
    if (!purchasingOrders || purchasingOrders.length === 0) {
      showToast('❌ Export edilecek veri yok. Önce Excel yükleyin.', 'warning');
      console.warn('purchasingOrders boş');
      return;
    }

    showToast('📊 Excel hazırlanıyor...', 'info');

    // Tüm verileri çek (filtreli)
    let dataToExport = [...purchasingOrders];

    // Aktif filtreleri uygula (filteredOrders kullan - zaten filtrelenmiş)
    // NOT: filteredOrders zaten applyPurchasingFilters() ile filtrelenmiş durumda
    dataToExport = [...filteredOrders];

    if (dataToExport.length === 0) {
      showToast('⚠️ Export edilecek veri bulunamadı', 'warning');
      return;
    }

    // Rapor Formatı - 25 kolon (Excel için düzenlenmiş veriler)
    const excelData = dataToExport.map(order => ({
      'Firma': order.firma || '',
      'Talep Tipi': order.siparis_tip || '',
      'Talep No': order.talep_no || '',
      'Sipariş No': order.siparis_no || '',
      'Malzeme Kodu': order.malzeme || '',
      'Malzeme Tanımı': order.malzeme_tanimi || '',
      'Talep Oluşturma Tarihi': formatDateForExcel(order.talep_olusturma_tarihi),
      'Sipariş Dönüştürme Tarihi': formatDateForExcel(order.siparis_olusturma_tarihi),
      'İstenen Teslim Tarihi': formatDateForExcel(order.ihtiyac_tarihi),
      'Standart Termin (Gün)': order.standart_termin_suresi || 30,
      'Standart Termin Tarihi': formatDateForExcel(order.standart_termin_tarihi),
      'Mal Kabul Tarihi': formatDateForExcel(order.mal_kabul_tarihi),
      'Planlama Sapması (Gün)': order.planlama_sapmasi ?? '',
      'Termin Farkı (Gün)': order.termin_farki ?? '',
      'Sipariş Miktarı': order.miktar || 0,
      'Gelen Miktarı': order.toplam_gelen_miktar || order.gelen_miktar || 0,
      'Kalan Miktar': order.kalan_miktar ?? '',
      'Birim Fiyat': order.birim_fiyat || 0,
      'Tutar': order.para_birimi_tutar || 0,
      'Para Birimi': order.para_birimi || '',
      'Kur Değeri': order.kur_degeri || 0,
      'Toplam TL': order.tutar_tl || 0,
      'Ödeme Koşulu': order.odeme_kosulu_tanimi || order.odeme_kosulu || '',
      'Ödeme Tarihi': formatDateForExcel(order.siparis_teslim_odeme_vadesi || order.vadeye_gore),
      'Teslimat Durumu': order.teslimat_durumu || ''
    }));

    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Kolon genişliklerini ayarla
    ws['!cols'] = [
      { wch: 15 }, // Firma
      { wch: 12 }, // Talep Tipi
      { wch: 15 }, // Talep No
      { wch: 15 }, // Sipariş No
      { wch: 15 }, // Malzeme Kodu
      { wch: 40 }, // Malzeme Tanımı
      { wch: 12 }, // Talep Oluşturma Tarihi
      { wch: 12 }, // Sipariş Dönüştürme Tarihi
      { wch: 12 }, // İstenen Teslim Tarihi
      { wch: 10 }, // Standart Termin
      { wch: 12 }, // Standart Termin Tarihi
      { wch: 12 }, // Mal Kabul Tarihi
      { wch: 12 }, // Planlama Sapması
      { wch: 12 }, // Termin Farkı
      { wch: 12 }, // Sipariş Miktarı
      { wch: 12 }, // Gelen Miktarı
      { wch: 12 }, // Kalan Miktar
      { wch: 12 }, // Birim Fiyat
      { wch: 12 }, // Tutar
      { wch: 10 }, // Para Birimi
      { wch: 10 }, // Kur Değeri
      { wch: 15 }, // Toplam TL
      { wch: 25 }, // Ödeme Koşulu
      { wch: 12 }, // Ödeme Tarihi
      { wch: 15 }  // Teslimat Durumu
    ];

    // Worksheet'i workbook'a ekle
    XLSX.utils.book_append_sheet(wb, ws, 'Satın Alma Raporu');

    // Dosya adı (tarih ile)
    const today = new Date().toISOString().split('T')[0];
    const fileName = `Satin_Alma_Raporu_${today}.xlsx`;

    // Excel dosyasını indir
    XLSX.writeFile(wb, fileName);

    showToast(`✅ Excel başarıyla indirildi (${dataToExport.length} kayıt)`, 'success');

  } catch (error) {
    console.error('Excel export hatası:', error);
    console.error('Hata detayı:', error.message);
    console.error('Stack trace:', error.stack);
    showToast(`❌ Excel indirme hatası: ${error.message}`, 'error');
  }
}

// =====================================================
// SAYFA AÇILDIĞINDA VERİLERİ YÜKLE
// =====================================================

// showSection('purchasing') çağrıldığında bu fonksiyon otomatik çalışacak
// main.js'deki showSection fonksiyonuna hook eklemek gerekebilir

console.log('✅ Purchasing modülü yüklendi (XLSX desteği aktif)');
