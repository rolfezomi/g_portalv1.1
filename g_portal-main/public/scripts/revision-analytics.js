// =====================================================
// REVİZYON ANALİZ DASHBOARD - JAVASCRIPT
// =====================================================

// Global değişkenler
let revisionStats = null;
let changesReport = [];
let timelineData = [];
let allPurchasingOrders = [];

// =====================================================
// ANA YÜKLEME FONKSİYONU
// =====================================================

async function refreshRevisionAnalytics() {
  console.log('🔄 Revizyon analiz verileri yenileniyor...');

  try {
    await Promise.all([
      loadRevisionStats(),
      loadChangesReport(),
      loadRecentRevisions(),
      loadAllPurchasingOrders()
    ]);

    renderRevisionDashboard();
    console.log('✅ Revizyon analiz dashboard yüklendi');

  } catch (error) {
    console.error('Revizyon analiz yükleme hatası:', error);
    showToast('❌ Veriler yüklenemedi: ' + error.message, 'error');
  }
}

// =====================================================
// VERİ YÜKLEME FONKSİYONLARI
// =====================================================

async function loadRevisionStats() {
  const { data, error } = await supabaseClient
    .from('purchasing_revision_stats')
    .select('*')
    .order('total_revisions', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Revizyon istatistik hatası:', error);
    throw error;
  }

  revisionStats = data || [];
  console.log(`📊 ${revisionStats.length} sipariş revizyon istatistiği yüklendi`);
}

async function loadChangesReport() {
  const { data, error } = await supabaseClient
    .from('purchasing_orders')
    .select('*')
    .not('changes_from_previous', 'is', null)
    .eq('is_latest', true)
    .order('revision_date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Değişiklik raporu hatası:', error);
    throw error;
  }

  changesReport = data || [];
  console.log(`📝 ${changesReport.length} değişiklik kaydı yüklendi`);
}

async function loadRecentRevisions() {
  const { data, error } = await supabaseClient
    .from('purchasing_orders')
    .select('*')
    .order('revision_date', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Revizyon timeline hatası:', error);
    throw error;
  }

  timelineData = data || [];
  console.log(`⏰ ${timelineData.length} revizyon kaydı yüklendi`);
}

async function loadAllPurchasingOrders() {
  console.log('📦 Tüm satın alma siparişleri yükleniyor (pagination ile)...');

  let allOrders = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error: pageError } = await supabaseClient
      .from('purchasing_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (pageError) {
      console.error(`Sayfa ${page + 1} yükleme hatası:`, pageError);
      throw pageError;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allOrders = [...allOrders, ...data];

      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  allPurchasingOrders = allOrders;
  console.log(`✅ Toplam ${allPurchasingOrders.length} sipariş yüklendi (${page + 1} sayfa)`);
}

// =====================================================
// DASHBOARD RENDER
// =====================================================

function renderRevisionDashboard() {
  const content = document.getElementById('revision-analytics-content');
  if (!content) return;

  // Kullanıcı rolünü al (main.js'den)
  const userRole = window.currentUserRole || 'full';
  const isAdmin = userRole === 'admin' || userRole === 'full';

  // Tab'ları role göre filtrele
  let tabs = '';

  // Admin'e özel tablar
  if (isAdmin) {
    tabs += `
      <button class="revision-tab" onclick="switchRevisionTab('changes')">
        📝 Değişiklik Raporu
      </button>
      <button class="revision-tab" onclick="switchRevisionTab('timeline')">
        ⏰ Zaman Çizelgesi
      </button>
    `;
  }

  // Herkesin görebileceği tablar
  tabs += `
    <button class="revision-tab active" onclick="switchRevisionTab('price-trend')">
      📈 Fiyat Trendi
    </button>
    <button class="revision-tab" onclick="switchRevisionTab('price-changes')">
      🔥 Fiyat Değişimleri
    </button>
    <button class="revision-tab" onclick="switchRevisionTab('supplier-balance')">
      💼 Tedarikçi Genel Bakiye
    </button>
    <button class="revision-tab" onclick="switchRevisionTab('payment-calendar')">
      💰 Ödeme Takvimi
    </button>
  `;

  // Admin'e özel tab
  if (isAdmin) {
    tabs += `
      <button class="revision-tab" onclick="switchRevisionTab('top-revised')">
        🔄 En Çok Revize Edilenler
      </button>
    `;
  }

  content.innerHTML = `
    <!-- KPI Kartları -->
    <div class="revision-kpi-grid">
      ${renderKPICards()}
    </div>

    <!-- Tab Navigasyon -->
    <div class="revision-tabs">
      ${tabs}
    </div>

    <!-- Tab İçerikleri -->
    <div id="revision-tab-content">
      ${renderPriceTrendTab()}
    </div>
  `;

  // İlk tab'ı otomatik aç
  setTimeout(() => {
    initPriceTrendChart();
  }, 100);
}

// KPI Kartları
function renderKPICards() {
  // Toplam sipariş sayısı (tüm satırlar)
  const totalOrders = allPurchasingOrders.length;

  // Malzeme bazında gruplama (en çok talep edilen kalemler)
  const materialCounts = {};
  allPurchasingOrders.forEach(order => {
    const material = order.malzeme_tanimi || 'Bilinmeyen';
    if (!materialCounts[material]) {
      materialCounts[material] = 0;
    }
    materialCounts[material]++;
  });

  // En çok talep edilen malzeme
  const sortedMaterials = Object.entries(materialCounts)
    .sort((a, b) => b[1] - a[1]);
  const topMaterial = sortedMaterials[0] || ['Veri yok', 0];
  const topMaterialName = topMaterial[0];
  const topMaterialCount = topMaterial[1];

  // En yüksek bedele sahip kalem
  const ordersWithAmount = allPurchasingOrders
    .filter(o => o.tutar_tl && !isNaN(parseFloat(o.tutar_tl)))
    .sort((a, b) => parseFloat(b.tutar_tl) - parseFloat(a.tutar_tl));

  const highestOrder = ordersWithAmount[0];
  const highestMaterial = highestOrder?.malzeme_tanimi || 'Veri yok';
  const highestAmount = highestOrder?.tutar_tl || 0;

  // Son değişiklikler
  const recentChanges = changesReport.length;

  return `
    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        📦
      </div>
      <div class="kpi-content">
        <div class="kpi-label">Toplam Sipariş</div>
        <div class="kpi-value">${totalOrders.toLocaleString('tr-TR')}</div>
        <div class="kpi-sublabel">tüm satırlar</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        🔥
      </div>
      <div class="kpi-content">
        <div class="kpi-label">En Çok Talep Edilen</div>
        <div class="kpi-value" style="font-size: 16px; line-height: 1.3;" title="${topMaterialName}">
          ${topMaterialName.length > 25 ? topMaterialName.substring(0, 25) + '...' : topMaterialName}
        </div>
        <div class="kpi-sublabel">${topMaterialCount} sipariş satırı</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        💎
      </div>
      <div class="kpi-content">
        <div class="kpi-label">En Yüksek Bedel</div>
        <div class="kpi-value" style="font-size: 16px; line-height: 1.3;" title="${highestMaterial}">
          ${highestMaterial.length > 25 ? highestMaterial.substring(0, 25) + '...' : highestMaterial}
        </div>
        <div class="kpi-sublabel">${formatCurrency(highestAmount)}</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
        📝
      </div>
      <div class="kpi-content">
        <div class="kpi-label">Son Değişiklikler</div>
        <div class="kpi-value">${recentChanges}</div>
        <div class="kpi-sublabel">son 50 kayıt</div>
      </div>
    </div>
  `;
}

// =====================================================
// TAB FONKSİYONLARI
// =====================================================

function switchRevisionTab(tabName) {
  // Tab butonlarını güncelle
  document.querySelectorAll('.revision-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // İçeriği render et
  const content = document.getElementById('revision-tab-content');
  if (!content) return;

  switch(tabName) {
    case 'changes':
      content.innerHTML = renderChangesReportTab();
      break;
    case 'timeline':
      content.innerHTML = renderTimelineTab();
      break;
    case 'price-trend':
      content.innerHTML = renderPriceTrendTab();
      initPriceTrendChart();
      break;
    case 'price-changes':
      content.innerHTML = renderPriceChangesTab();
      break;
    case 'supplier-balance':
      content.innerHTML = renderSupplierBalanceTab();
      break;
    case 'payment-calendar':
      content.innerHTML = renderPaymentCalendarTab();
      break;
    case 'top-revised':
      content.innerHTML = renderTopRevisedTab();
      break;
  }
}

// =====================================================
// DEĞİŞİKLİK RAPORU TAB
// =====================================================

function renderChangesReportTab() {
  if (changesReport.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>Henüz değişiklik yok</h3>
        <p>CSV yüklediğinizde ve siparişler güncellendiğinde burada göreceksiniz</p>
      </div>
    `;
  }

  return `
    <div class="changes-report-container">
      <h3>📝 Son Değişiklikler (${changesReport.length})</h3>
      <div class="changes-table-wrapper">
        <table class="changes-table">
          <thead>
            <tr>
              <th>Sipariş No</th>
              <th>Tedarikçi</th>
              <th>Malzeme</th>
              <th>Rev</th>
              <th>Tarih</th>
              <th>Değişiklikler</th>
              <th>Yükleyen</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${changesReport.map(order => `
              <tr>
                <td><strong>${order.siparis_no || '-'}</strong></td>
                <td>${order.tedarikci_tanimi || '-'}</td>
                <td>${order.malzeme_tanimi || '-'}</td>
                <td><span class="revision-badge">v${order.revision_number}</span></td>
                <td>${formatDateTime(order.revision_date)}</td>
                <td>${renderChangesSummary(order.changes_from_previous)}</td>
                <td>${order.uploaded_by || '-'}</td>
                <td>
                  <button class="btn-icon" onclick="showOrderHistory('${order.siparis_no}', '${order.siparis_kalemi || ''}', '${order.siparis_tip || ''}', '${order.tedarikci_kodu || ''}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderChangesSummary(changesJson) {
  if (!changesJson) return '-';

  const changes = typeof changesJson === 'string' ? JSON.parse(changesJson) : changesJson;
  const keys = Object.keys(changes);

  if (keys.length === 0) return '-';

  const summary = keys.slice(0, 2).map(key => {
    const change = changes[key];
    const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `<span class="change-item">${fieldName}: ${change.from} → ${change.to}</span>`;
  }).join('');

  const moreCount = keys.length > 2 ? ` <span class="more-changes">+${keys.length - 2}</span>` : '';

  return summary + moreCount;
}

// =====================================================
// ZAMAN ÇİZELGESİ TAB
// =====================================================

function renderTimelineTab() {
  const groupedByDate = groupRevisionsByDate(timelineData);

  return `
    <div class="timeline-container">
      <h3>⏰ Revizyon Zaman Çizelgesi</h3>
      <div class="timeline">
        ${Object.keys(groupedByDate).map(date => `
          <div class="timeline-day">
            <div class="timeline-date">
              <div class="date-bubble">${formatDayMonth(date)}</div>
            </div>
            <div class="timeline-events">
              ${groupedByDate[date].map(revision => `
                <div class="timeline-event ${revision.revision_number > 1 ? 'revision' : 'new'}">
                  <div class="event-icon">
                    ${revision.revision_number > 1 ? '🔄' : '➕'}
                  </div>
                  <div class="event-content">
                    <div class="event-title">
                      <strong>${revision.siparis_no}</strong>
                      ${revision.revision_number > 1 ? `<span class="revision-badge-small">v${revision.revision_number}</span>` : '<span class="new-badge">YENİ</span>'}
                    </div>
                    <div class="event-description">
                      ${revision.tedarikci_tanimi || 'Tedarikçi belirtilmemiş'}
                    </div>
                    <div class="event-time">${formatTime(revision.revision_date)} • ${revision.uploaded_by || 'Sistem'}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function groupRevisionsByDate(data) {
  const grouped = {};

  data.forEach(item => {
    const date = item.revision_date ? item.revision_date.split('T')[0] : 'unknown';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });

  return grouped;
}

// =====================================================
// ÖDEME TAKVİMİ TAB
// =====================================================

function renderPaymentCalendarTab() {
  // Veri yüklemesini tetikle
  setTimeout(() => getPaymentData(), 0);

  return `
    <div class="payment-calendar-container">
      <h3>💰 Ödeme Takvimi</h3>
      <p class="payment-calendar-description">
        Vade tarihlerine göre ödenecek tutarlar
      </p>

      <div class="payment-summary-cards">
        <div class="payment-summary-card overdue clickable" onclick="filterByStatus('overdue')" id="card-overdue">
          <div class="summary-icon">⚠️</div>
          <div class="summary-content">
            <div class="summary-label">Gecikmiş</div>
            <div class="summary-amount" id="payment-overdue">₺0</div>
            <div class="summary-count" id="payment-overdue-count">0 sipariş</div>
          </div>
        </div>

        <div class="payment-summary-card this-week clickable" onclick="filterByStatus('thisWeek')" id="card-thisWeek">
          <div class="summary-icon">📅</div>
          <div class="summary-content">
            <div class="summary-label">Bu Hafta</div>
            <div class="summary-amount" id="payment-week">₺0</div>
            <div class="summary-count" id="payment-week-count">0 sipariş</div>
          </div>
        </div>

        <div class="payment-summary-card this-month clickable" onclick="filterByStatus('thisMonth')" id="card-thisMonth">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <div class="summary-label">Bu Ay</div>
            <div class="summary-amount" id="payment-month">₺0</div>
            <div class="summary-count" id="payment-month-count">0 sipariş</div>
          </div>
        </div>

        <div class="payment-summary-card future clickable" onclick="filterByStatus('future')" id="card-future">
          <div class="summary-icon">📈</div>
          <div class="summary-content">
            <div class="summary-label">Gelecek</div>
            <div class="summary-amount" id="payment-future">₺0</div>
            <div class="summary-count" id="payment-future-count">0 sipariş</div>
          </div>
        </div>
      </div>

      <!-- Hızlı Arama -->
      <div class="payment-quick-search">
        <input
          type="text"
          id="payment-search-input"
          class="search-input"
          placeholder="🔍 Tedarikçi veya sipariş numarası ara..."
          oninput="quickSearchPayments()"
        />
      </div>

      <!-- Filtre Paneli -->
      <div class="payment-filters">
        <h4>🔍 Filtreler</h4>
        <div class="filter-row">
          <div class="filter-group">
            <label>Tedarikçi</label>
            <select id="payment-filter-supplier" onchange="applyPaymentFilters()">
              <option value="">Tümü</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Durum</label>
            <select id="payment-filter-status" onchange="applyPaymentFilters()">
              <option value="">Tümü</option>
              <option value="overdue">Gecikmiş</option>
              <option value="thisWeek">Bu Hafta</option>
              <option value="thisMonth">Bu Ay</option>
              <option value="future">Gelecek</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Minimum Tutar (₺)</label>
            <input type="number" id="payment-filter-min" placeholder="0" onchange="applyPaymentFilters()">
          </div>

          <div class="filter-group">
            <button class="btn btn-secondary" onclick="clearPaymentFilters()">
              Temizle
            </button>
          </div>
        </div>
      </div>

      <div id="supplier-balances-container" class="supplier-balances-container">
        <h3>Tedarikçi Bakiyeleri</h3>
        <div id="supplier-balances-list"></div>
      </div>

      <div id="payment-details-list" class="payment-details-list"></div>
    </div>
  `;
}

// Ödeme verilerini hazırla
async function getPaymentData() {
  try {
    // Teslimat durumu Açık veya Kısmi olanları getir
    const { data: orders, error } = await supabaseClient
      .from('purchasing_orders')
      .select('*')
      .in('teslimat_durumu', ['Açık', 'Kısmi'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    // Gruplara ayır
    const groups = {
      overdue: { total: 0, count: 0, orders: [] },
      thisWeek: { total: 0, count: 0, orders: [] },
      thisMonth: { total: 0, count: 0, orders: [] },
      future: { total: 0, count: 0, orders: [] }
    };

    // Tedarikçi bazlı gruplama
    const supplierGroups = {};

    orders.forEach(order => {
      // Vade tarihini hesapla: vadeye_gore varsa kullan, yoksa fatura_tarihi + 60 gün
      let vadeDate;
      if (order.vadeye_gore) {
        vadeDate = new Date(order.vadeye_gore);
      } else if (order.fatura_tarihi) {
        vadeDate = new Date(order.fatura_tarihi);
        vadeDate.setDate(vadeDate.getDate() + 60); // Standart termin 60 gün
      } else if (order.siparis_teslim_odeme_vadesi) {
        // Ödeme vadesi varsa onu kullan
        vadeDate = new Date(order.siparis_teslim_odeme_vadesi);
      } else {
        // Vade tarihi hesaplanamıyorsa bu kaydı atla
        console.warn('Vade tarihi hesaplanamadı:', order.siparis_no, order);
        return;
      }

      vadeDate.setHours(0, 0, 0, 0);
      const tutar = parseFloat(order.tutar_tl) || 0;
      const supplier = order.tedarikci_tanimi || 'Bilinmeyen Tedarikçi';

      // Tedarikçi grupları (grafik için)
      if (!supplierGroups[supplier]) {
        supplierGroups[supplier] = {
          total: 0,
          count: 0,
          overdue: 0,
          upcoming: 0,
          orders: []
        };
      }
      supplierGroups[supplier].total += tutar;
      supplierGroups[supplier].count++;
      supplierGroups[supplier].orders.push(order);

      // Gecikmiş vs yaklaşan
      if (vadeDate < today) {
        supplierGroups[supplier].overdue += tutar;
      } else {
        supplierGroups[supplier].upcoming += tutar;
      }

      // Kategori grupları
      let category;
      if (vadeDate < today) {
        groups.overdue.total += tutar;
        groups.overdue.count++;
        groups.overdue.orders.push(order);
        category = 'Gecikmiş';
      } else if (vadeDate <= oneWeekLater) {
        groups.thisWeek.total += tutar;
        groups.thisWeek.count++;
        groups.thisWeek.orders.push(order);
        category = 'Bu Hafta';
      } else if (vadeDate <= oneMonthLater) {
        groups.thisMonth.total += tutar;
        groups.thisMonth.count++;
        groups.thisMonth.orders.push(order);
        category = 'Bu Ay';
      } else {
        groups.future.total += tutar;
        groups.future.count++;
        groups.future.orders.push(order);
        category = 'Gelecek';
      }

      // Debug: 17-23 Kasım arası vadeleri logla
      const vadeStr = vadeDate.toISOString().split('T')[0];
      if (vadeStr >= '2025-11-17' && vadeStr <= '2025-11-23') {
        console.log(`📅 Sipariş: ${order.siparis_no}, Vade: ${vadeStr}, Kategori: ${category}, Tutar: ${formatCurrency(tutar)}`);
      }
    });

    // UI'ı güncelle
    updatePaymentSummary(groups);
    renderSupplierBalances(supplierGroups);
    renderPaymentDetails(groups);

    // Filtreleri doldur
    updatePaymentFilters(supplierGroups, groups);

  } catch (error) {
    console.error('Ödeme verileri yükleme hatası:', error);
    showToast('❌ Ödeme verileri yüklenemedi', 'error');
  }
}

// Özet kartları güncelle
function updatePaymentSummary(groups) {
  document.getElementById('payment-overdue').textContent = formatCurrency(groups.overdue.total);
  document.getElementById('payment-overdue-count').textContent = `${groups.overdue.count} sipariş`;

  document.getElementById('payment-week').textContent = formatCurrency(groups.thisWeek.total);
  document.getElementById('payment-week-count').textContent = `${groups.thisWeek.count} sipariş`;

  document.getElementById('payment-month').textContent = formatCurrency(groups.thisMonth.total);
  document.getElementById('payment-month-count').textContent = `${groups.thisMonth.count} sipariş`;

  document.getElementById('payment-future').textContent = formatCurrency(groups.future.total);
  document.getElementById('payment-future-count').textContent = `${groups.future.count} sipariş`;
}

// Tedarikçi bakiyeleri render et (Modern yatay çubuk grafik)
function renderSupplierBalances(supplierGroups) {
  const container = document.getElementById('supplier-balances-list');
  if (!container) return;

  // Tedarikçileri toplam tutara göre sırala
  const suppliers = Object.keys(supplierGroups).sort((a, b) => {
    return supplierGroups[b].total - supplierGroups[a].total;
  });

  if (suppliers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Veri bulunamadı</p>
      </div>
    `;
    return;
  }

  // Maksimum tutar (ölçeklendirme için)
  const maxTotal = Math.max(...suppliers.map(s => supplierGroups[s].total));

  container.innerHTML = suppliers.map((supplier, index) => {
    const data = supplierGroups[supplier];
    const percentOfMax = (data.total / maxTotal) * 100;
    const overduePercent = (data.overdue / data.total) * 100;
    const upcomingPercent = (data.upcoming / data.total) * 100;

    // Sıralama badge rengi
    const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : 'rank-default';

    return `
      <div class="supplier-balance-item">
        <div class="supplier-rank-badge ${rankClass}">
          <span class="rank-number">#${index + 1}</span>
        </div>

        <div class="supplier-main-content">
          <div class="supplier-header">
            <div class="supplier-title-section">
              <div class="supplier-icon">🏢</div>
              <div class="supplier-info">
                <div class="supplier-name">${supplier}</div>
                <div class="supplier-meta">
                  <span class="meta-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    ${data.count} sipariş
                  </span>
                </div>
              </div>
            </div>
            <div class="supplier-total-amount">
              <div class="amount-label">Toplam Tutar</div>
              <div class="amount-value">${formatCurrency(data.total)}</div>
            </div>
          </div>

          <div class="supplier-balance-visual">
            <div class="balance-stats-row">
              ${data.overdue > 0 ? `
                <div class="stat-item stat-overdue">
                  <div class="stat-icon">⚠️</div>
                  <div class="stat-content">
                    <div class="stat-label">Gecikmiş</div>
                    <div class="stat-value">${formatCurrency(data.overdue)}</div>
                    <div class="stat-percent">${overduePercent.toFixed(1)}%</div>
                  </div>
                </div>
              ` : ''}
              ${data.upcoming > 0 ? `
                <div class="stat-item stat-upcoming">
                  <div class="stat-icon">✅</div>
                  <div class="stat-content">
                    <div class="stat-label">Yaklaşan</div>
                    <div class="stat-value">${formatCurrency(data.upcoming)}</div>
                    <div class="stat-percent">${upcomingPercent.toFixed(1)}%</div>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="balance-bar-section">
              <div class="balance-bar-container">
                <div class="balance-bar-wrapper" style="width: ${percentOfMax}%">
                  ${data.overdue > 0 ? `
                    <div class="balance-bar overdue"
                         style="width: ${overduePercent}%"
                         data-tooltip="Gecikmiş: ${formatCurrency(data.overdue)}">
                      ${overduePercent > 15 ? `<span class="bar-label">${overduePercent.toFixed(0)}%</span>` : ''}
                    </div>
                  ` : ''}
                  ${data.upcoming > 0 ? `
                    <div class="balance-bar upcoming"
                         style="width: ${upcomingPercent}%"
                         data-tooltip="Yaklaşan: ${formatCurrency(data.upcoming)}">
                      ${upcomingPercent > 15 ? `<span class="bar-label">${upcomingPercent.toFixed(0)}%</span>` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
              <div class="progress-percentage">${percentOfMax.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Detay listesi
function renderPaymentDetails(groups) {
  const container = document.getElementById('payment-details-list');
  if (!container) return;

  const allOrders = [
    ...groups.overdue.orders.map(o => ({ ...o, category: 'overdue' })),
    ...groups.thisWeek.orders.map(o => ({ ...o, category: 'thisWeek' })),
    ...groups.thisMonth.orders.map(o => ({ ...o, category: 'thisMonth' })),
    ...groups.future.orders.map(o => ({ ...o, category: 'future' }))
  ];

  if (allOrders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Vade tarihi olan sipariş bulunamadı</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h4>Ödeme Detayları (${allOrders.length} sipariş)</h4>
    <div class="table-wrapper">
      <table class="purchasing-table">
        <thead>
          <tr>
            <th>Sipariş No</th>
            <th>Tedarikçi</th>
            <th>Tutar (TL)</th>
            <th>Vade Tarihi</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          ${allOrders.map(order => {
            const categoryLabels = {
              overdue: '<span style="color:#f44336; font-weight:600;">⚠️ Gecikmiş</span>',
              thisWeek: '<span style="color:#ff9800; font-weight:600;">📅 Bu Hafta</span>',
              thisMonth: '<span style="color:#ffc107; font-weight:600;">📊 Bu Ay</span>',
              future: '<span style="color:#4caf50; font-weight:600;">📈 Gelecek</span>'
            };

            return `
              <tr>
                <td><strong>${order.siparis_no}</strong></td>
                <td>${order.tedarikci_tanimi || '-'}</td>
                <td><strong>${formatCurrency(order.tutar_tl)}</strong></td>
                <td>${formatDate(order.vadeye_gore)}</td>
                <td>${categoryLabels[order.category]}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Kısa para format (grafik için)
function formatCurrencyShort(value) {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `₺${(value / 1000).toFixed(1)}K`;
  }
  return `₺${value.toFixed(0)}`;
}

// =====================================================
// EN ÇOK REVİZE EDİLENLER TAB
// =====================================================

function renderTopRevisedTab() {
  if (revisionStats.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔄</div>
        <h3>Henüz revizyon yok</h3>
        <p>Siparişler güncellendiğinde burada göreceksiniz</p>
      </div>
    `;
  }

  return `
    <div class="top-revised-container">
      <h3>🔄 En Çok Revize Edilen Siparişler</h3>
      <div class="table-wrapper">
        <table class="purchasing-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sipariş No</th>
              <th>Toplam Revizyon</th>
              <th>İlk Kayıt</th>
              <th>Son Güncelleme</th>
              <th>Güncel Rev</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${revisionStats.map((stat, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${stat.siparis_no}</strong></td>
                <td>
                  <div class="revision-count">
                    <div class="revision-bar" style="width: ${(stat.total_revisions / Math.max(...revisionStats.map(s => s.total_revisions))) * 100}%"></div>
                    <span>${stat.total_revisions} revizyon</span>
                  </div>
                </td>
                <td>${formatDate(stat.first_revision_date)}</td>
                <td>${formatDate(stat.last_revision_date)}</td>
                <td><span class="revision-badge">v${stat.current_revision}</span></td>
                <td>
                  <button class="btn-icon" onclick="showOrderHistory('${stat.siparis_no}', '${stat.siparis_kalemi || ''}', '${stat.siparis_tip || ''}', '${stat.tedarikci_kodu || ''}')">
                    📜 Geçmiş
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// =====================================================
// SİPARİŞ GEÇMİŞİ MODAL
// =====================================================

async function showOrderHistory(siparisNo, siparisKalemi, siparisTip, tedarikciKodu) {
  try {
    const { data, error } = await supabaseClient
      .rpc('get_order_revision_history', {
        p_siparis_no: siparisNo,
        p_siparis_kalemi: siparisKalemi || null,
        p_siparis_tip: siparisTip || null,
        p_tedarikci_kodu: tedarikciKodu || null
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      showToast('⚠️ Revizyon geçmişi bulunamadı', 'warning');
      return;
    }

    // Modal oluştur
    const modal = document.createElement('div');
    modal.className = 'revision-modal-overlay';

    // İlk kaydın tedarikçi bilgisini al
    const supplierInfo = data[0]?.tedarikci_tanimi || '';
    const orderType = data[0]?.siparis_tip || '';

    modal.innerHTML = `
      <div class="revision-modal">
        <div class="revision-modal-header">
          <h3>📜 Sipariş Geçmişi: ${siparisNo}</h3>
          ${orderType ? `<p style="margin:5px 0 0 0; font-size:13px; color:#666;"><span style="background:#e3f2fd; padding:2px 6px; border-radius:3px; font-weight:600;">${orderType}</span></p>` : ''}
          ${supplierInfo ? `<p style="margin:5px 0 0 0; font-size:13px; color:#666;">${supplierInfo}</p>` : ''}
          <button class="modal-close" onclick="this.closest('.revision-modal-overlay').remove()">×</button>
        </div>
        <div class="revision-modal-body">
          <div class="revision-history-timeline">
            ${data.map((rev, index) => `
              <div class="history-item ${rev.is_latest ? 'latest' : ''}">
                <div class="history-marker">
                  <div class="marker-dot ${rev.is_latest ? 'active' : ''}"></div>
                  ${index < data.length - 1 ? '<div class="marker-line"></div>' : ''}
                </div>
                <div class="history-content">
                  <div class="history-header">
                    <span class="revision-badge ${rev.is_latest ? 'latest' : ''}">
                      v${rev.revision_number} ${rev.is_latest ? '(GÜNCEL)' : ''}
                    </span>
                    <span class="history-date">${formatDateTime(rev.revision_date)}</span>
                  </div>
                  <div class="history-details">
                    <div class="detail-row">
                      <span class="detail-label">Gelen Miktar:</span>
                      <span class="detail-value">${formatNumber(rev.gelen_miktar)}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">Tutar:</span>
                      <span class="detail-value">${formatCurrency(rev.tutar_tl)}</span>
                    </div>
                    ${rev.odeme_kosulu ? `
                      <div class="detail-row">
                        <span class="detail-label">Ödeme:</span>
                        <span class="detail-value">${rev.odeme_kosulu}</span>
                      </div>
                    ` : ''}
                    ${rev.vadeye_gore ? `
                      <div class="detail-row">
                        <span class="detail-label">Vade:</span>
                        <span class="detail-value">${formatDate(rev.vadeye_gore)}</span>
                      </div>
                    ` : ''}
                  </div>
                  ${rev.changes_from_previous ? `
                    <div class="history-changes">
                      <strong>Değişiklikler:</strong>
                      ${renderDetailedChanges(rev.changes_from_previous)}
                    </div>
                  ` : ''}
                  <div class="history-footer">
                    Yükleyen: <strong>${rev.uploaded_by || 'Sistem'}</strong>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

  } catch (error) {
    console.error('Revizyon geçmişi hatası:', error);
    showToast('❌ Revizyon geçmişi yüklenemedi', 'error');
  }
}

function renderDetailedChanges(changesJson) {
  const changes = typeof changesJson === 'string' ? JSON.parse(changesJson) : changesJson;

  return Object.keys(changes).map(key => {
    const change = changes[key];
    const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return `
      <div class="change-detail">
        <span class="change-field">${fieldName}:</span>
        <span class="change-from">${change.from || 'null'}</span>
        <span class="change-arrow">→</span>
        <span class="change-to">${change.to || 'null'}</span>
      </div>
    `;
  }).join('');
}

// =====================================================
// YARDIMCI FONKSİYONLAR
// =====================================================

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR').format(date);
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDayMonth(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

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

// =====================================================
// ÖDEME TAKVİMİ FİLTRE FONKSİYONLARI
// =====================================================

// Global filtre verileri
let allSupplierGroups = {};
let allPaymentGroups = {};
let activeStatusFilter = '';

// Tedarikçi listesini doldur ve filtrelenmiş verileri sakla
function updatePaymentFilters(supplierGroups, groups) {
  allSupplierGroups = JSON.parse(JSON.stringify(supplierGroups));
  allPaymentGroups = JSON.parse(JSON.stringify(groups));

  // Tedarikçi select'ini doldur
  const supplierSelect = document.getElementById('payment-filter-supplier');
  if (supplierSelect) {
    const suppliers = Object.keys(supplierGroups).sort();
    supplierSelect.innerHTML = '<option value="">Tümü</option>' +
      suppliers.map(s => `<option value="${s}">${s}</option>`).join('');
  }
}

// Kart tıklama ile filtreleme
function filterByStatus(status) {
  // Kartları highlight et
  document.querySelectorAll('.payment-summary-card').forEach(card => {
    card.classList.remove('active');
  });

  // Eğer aynı karta tekrar tıklanırsa filtre kaldırılsın
  if (activeStatusFilter === status) {
    activeStatusFilter = '';
    document.getElementById('payment-filter-status').value = '';
  } else {
    activeStatusFilter = status;
    document.getElementById(`card-${status}`).classList.add('active');
    document.getElementById('payment-filter-status').value = status;
  }

  applyPaymentFilters();
}

// Hızlı arama
function quickSearchPayments() {
  const searchTerm = document.getElementById('payment-search-input')?.value.toLowerCase().trim() || '';

  if (!searchTerm) {
    // Arama boşsa mevcut filtreleri uygula
    applyPaymentFilters();
    return;
  }

  // Tedarikçi ve grup verilerini filtrele
  const filteredSuppliers = {};
  const filteredGroups = {
    overdue: { total: 0, count: 0, orders: [] },
    thisWeek: { total: 0, count: 0, orders: [] },
    thisMonth: { total: 0, count: 0, orders: [] },
    future: { total: 0, count: 0, orders: [] }
  };

  // Tüm siparişleri ara
  Object.keys(allSupplierGroups).forEach(supplierName => {
    const supplier = allSupplierGroups[supplierName];

    const matchingOrders = supplier.orders.filter(order => {
      const searchableText = [
        order.siparis_no,
        order.tedarikci_tanimi,
        order.tedarikci_kodu,
        order.malzeme_tanimi
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });

    if (matchingOrders.length > 0) {
      filteredSuppliers[supplierName] = {
        total: matchingOrders.reduce((sum, o) => sum + (parseFloat(o.tutar_tl) || 0), 0),
        count: matchingOrders.length,
        overdue: 0,
        upcoming: 0,
        orders: matchingOrders
      };

      // Gecikmiş vs yaklaşan hesapla
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      matchingOrders.forEach(order => {
        const vadeDate = new Date(order.vadeye_gore);
        vadeDate.setHours(0, 0, 0, 0);
        const tutar = parseFloat(order.tutar_tl) || 0;

        if (vadeDate < today) {
          filteredSuppliers[supplierName].overdue += tutar;
        } else {
          filteredSuppliers[supplierName].upcoming += tutar;
        }
      });
    }
  });

  // Grupları güncelle
  Object.keys(allPaymentGroups).forEach(category => {
    const matchingOrders = allPaymentGroups[category].orders.filter(order => {
      const searchableText = [
        order.siparis_no,
        order.tedarikci_tanimi,
        order.tedarikci_kodu,
        order.malzeme_tanimi
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });

    filteredGroups[category] = {
      total: matchingOrders.reduce((sum, o) => sum + (parseFloat(o.tutar_tl) || 0), 0),
      count: matchingOrders.length,
      orders: matchingOrders
    };
  });

  // UI'ı güncelle
  updatePaymentSummary(filteredGroups);
  renderSupplierBalances(filteredSuppliers);
  renderPaymentDetails(filteredGroups);

  showToast(`🔍 "${searchTerm}" için ${Object.keys(filteredSuppliers).length} tedarikçi bulundu`, 'info');
}

// Filtre uygula
function applyPaymentFilters() {
  const supplier = document.getElementById('payment-filter-supplier')?.value || '';
  const status = document.getElementById('payment-filter-status')?.value || '';
  const minAmount = parseFloat(document.getElementById('payment-filter-min')?.value) || 0;

  // Tedarikçi filtresi
  let filteredSuppliers = {...allSupplierGroups};
  if (supplier) {
    filteredSuppliers = {[supplier]: allSupplierGroups[supplier]};
  }

  // Minimum tutar filtresi
  if (minAmount > 0) {
    Object.keys(filteredSuppliers).forEach(key => {
      if (filteredSuppliers[key].total < minAmount) {
        delete filteredSuppliers[key];
      }
    });
  }

  // Durum filtresi için grupları filtrele
  let filteredGroups = {...allPaymentGroups};
  if (status) {
    const emptyGroup = { total: 0, count: 0, orders: [] };
    filteredGroups = {
      overdue: status === 'overdue' ? allPaymentGroups.overdue : emptyGroup,
      thisWeek: status === 'thisWeek' ? allPaymentGroups.thisWeek : emptyGroup,
      thisMonth: status === 'thisMonth' ? allPaymentGroups.thisMonth : emptyGroup,
      future: status === 'future' ? allPaymentGroups.future : emptyGroup
    };
  }

  // Tedarikçi filtresi ile grup filtresi kombine et
  if (supplier || minAmount > 0) {
    // Filtrelenmiş tedarikçilerin siparişlerini al
    const validOrders = Object.values(filteredSuppliers)
      .flatMap(s => s.orders.map(o => o.siparis_no));

    // Gruplardan sadece bu siparişleri tut
    Object.keys(filteredGroups).forEach(category => {
      filteredGroups[category].orders = filteredGroups[category].orders
        .filter(o => validOrders.includes(o.siparis_no));
      filteredGroups[category].count = filteredGroups[category].orders.length;
      filteredGroups[category].total = filteredGroups[category].orders
        .reduce((sum, o) => sum + (parseFloat(o.tutar_tl) || 0), 0);
    });
  }

  // DURUM FİLTRESİ İÇİN TEDARİKÇİ BAKİYELERİNİ GÜNCELLE
  if (status) {
    // Seçili duruma ait siparişleri al
    const statusOrders = filteredGroups[status]?.orders || [];

    // Tedarikçileri yeniden grupla (sadece seçili durumdaki siparişler)
    const statusBasedSuppliers = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    statusOrders.forEach(order => {
      const supplier = order.tedarikci_tanimi || 'Bilinmeyen Tedarikçi';
      const tutar = parseFloat(order.tutar_tl) || 0;
      const vadeDate = new Date(order.vadeye_gore);
      vadeDate.setHours(0, 0, 0, 0);

      if (!statusBasedSuppliers[supplier]) {
        statusBasedSuppliers[supplier] = {
          total: 0,
          count: 0,
          overdue: 0,
          upcoming: 0,
          orders: []
        };
      }

      statusBasedSuppliers[supplier].total += tutar;
      statusBasedSuppliers[supplier].count++;
      statusBasedSuppliers[supplier].orders.push(order);

      if (vadeDate < today) {
        statusBasedSuppliers[supplier].overdue += tutar;
      } else {
        statusBasedSuppliers[supplier].upcoming += tutar;
      }
    });

    // Tedarikçi filtresini güncelle
    filteredSuppliers = statusBasedSuppliers;

    // Minimum tutar filtresi varsa uygula
    if (minAmount > 0) {
      Object.keys(filteredSuppliers).forEach(key => {
        if (filteredSuppliers[key].total < minAmount) {
          delete filteredSuppliers[key];
        }
      });
    }

    // Tedarikçi dropdown filtresi varsa uygula
    if (supplier) {
      if (filteredSuppliers[supplier]) {
        filteredSuppliers = {[supplier]: filteredSuppliers[supplier]};
      } else {
        filteredSuppliers = {};
      }
    }
  }

  // UI'ı güncelle
  updatePaymentSummary(filteredGroups);
  renderSupplierBalances(filteredSuppliers);
  renderPaymentDetails(filteredGroups);
}

// Filtreleri temizle
function clearPaymentFilters() {
  document.getElementById('payment-filter-supplier').value = '';
  document.getElementById('payment-filter-status').value = '';
  document.getElementById('payment-filter-min').value = '';
  document.getElementById('payment-search-input').value = '';

  // Aktif kartı kaldır
  activeStatusFilter = '';
  document.querySelectorAll('.payment-summary-card').forEach(card => {
    card.classList.remove('active');
  });

  // Orijinal verileri göster
  updatePaymentSummary(allPaymentGroups);
  renderSupplierBalances(allSupplierGroups);
  renderPaymentDetails(allPaymentGroups);

  showToast('✅ Filtreler temizlendi', 'success');
}

// =====================================================
// FİYAT TAKİP SİSTEMİ - TAB İÇERİKLERİ
// =====================================================

/**
 * Akıllı fiyat formatlama - küçük değerler için daha fazla ondalık
 */
function formatPrice(price, locale = 'tr-TR') {
  const absPrice = Math.abs(price);

  // Fiyat büyüklüğüne göre ondalık basamak sayısı belirle
  let fractionDigits;
  if (absPrice >= 1) {
    fractionDigits = 2; // 1.23, 123.45
  } else if (absPrice >= 0.01) {
    fractionDigits = 4; // 0.0123, 0.9876
  } else if (absPrice >= 0.0001) {
    fractionDigits = 6; // 0.001234, 0.009876
  } else {
    fractionDigits = 8; // Çok küçük değerler
  }

  return price.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits
  });
}

/**
 * Fiyat Trend Tab
 */
function renderPriceTrendTab() {
  console.log('📈 Fiyat trend tab render ediliyor...');
  console.log('📊 Toplam sipariş sayısı:', allPurchasingOrders.length);

  // Debug: Kaç kayıtta birim_fiyat ve siparis_tarihi var?
  const withBirimFiyat = allPurchasingOrders.filter(o => o.birim_fiyat && parseFloat(o.birim_fiyat) > 0);
  const withSiparisTarihi = allPurchasingOrders.filter(o => o.siparis_tarihi);
  const withBoth = allPurchasingOrders.filter(o => o.birim_fiyat && o.siparis_tarihi && parseFloat(o.birim_fiyat) > 0);

  console.log('🔍 birim_fiyat > 0 olan:', withBirimFiyat.length);
  console.log('🔍 siparis_tarihi olan:', withSiparisTarihi.length);
  console.log('🔍 Her ikisi de olan:', withBoth.length);

  // Fallback: Eğer birim_fiyat yoksa hesapla (tutar_tl / miktar)
  const ordersWithPrice = allPurchasingOrders
    .filter(o => {
      const hasBirimFiyat = o.birim_fiyat && parseFloat(o.birim_fiyat) > 0;
      const canCalculate = o.tutar_tl && o.miktar && parseFloat(o.tutar_tl) > 0 && parseFloat(o.miktar) > 0;
      const hasTarih = o.siparis_tarihi || o.created_at;
      return (hasBirimFiyat || canCalculate) && hasTarih;
    })
    .map(o => {
      let birimFiyat;
      if (o.birim_fiyat && parseFloat(o.birim_fiyat) > 0) {
        birimFiyat = parseFloat(o.birim_fiyat);
      } else {
        birimFiyat = parseFloat(o.tutar_tl) / parseFloat(o.miktar);
      }

      // Para birimi normalizasyonu - USD'ye çevir
      const paraBirimi = (o.para_birimi || 'TRY').toUpperCase();
      // TL ve TRY aynı şey
      const normalizedCurrency = paraBirimi === 'TL' ? 'TRY' : paraBirimi;

      let kurDegeri = parseFloat(o.kur_degeri) || 1;

      // TL/TRY için kur kontrolü: Eğer kur 1 ise veya çok düşükse, gerçekçi bir değer kullan
      if ((normalizedCurrency === 'TRY') && kurDegeri < 10) {
        // 2024-2025 için ortalama TL/USD kuru ~34
        kurDegeri = 34;
        console.warn(`⚠️ Sipariş ${o.siparis_no}: TL kur değeri düşük (${o.kur_degeri}), varsayılan 34 kullanılıyor`);
      }

      let normalizedFiyat = birimFiyat;
      let displayCurrency = normalizedCurrency;
      let conversionNote = '';

      if (normalizedCurrency === 'USD') {
        // Zaten USD
        normalizedFiyat = birimFiyat;
        displayCurrency = 'USD';
        conversionNote = 'Zaten USD';
      } else if (normalizedCurrency === 'TRY') {
        // TRY → USD (kur ile)
        normalizedFiyat = birimFiyat / kurDegeri;
        displayCurrency = 'USD';
        conversionNote = `TRY→USD: ${birimFiyat.toFixed(2)} / ${kurDegeri.toFixed(2)} = ${normalizedFiyat.toFixed(2)}`;
      } else if (normalizedCurrency === 'EUR' && kurDegeri > 1) {
        // EUR → USD (EUR/USD ~ 1.1 yaklaşık)
        normalizedFiyat = (birimFiyat / kurDegeri) * 1.1;
        displayCurrency = 'USD';
        conversionNote = `EUR→USD: (${birimFiyat.toFixed(2)} / ${kurDegeri.toFixed(2)}) * 1.1 = ${normalizedFiyat.toFixed(2)}`;
      } else {
        // Diğer para birimleri - olduğu gibi bırak
        normalizedFiyat = birimFiyat;
        displayCurrency = normalizedCurrency;
        conversionNote = `Dönüşüm yok (${normalizedCurrency})`;
      }

      return {
        ...o,
        birim_fiyat: birimFiyat,
        normalized_fiyat: normalizedFiyat,
        display_currency: displayCurrency,
        conversion_note: conversionNote,
        original_para_birimi: o.para_birimi, // Veritabanındaki orijinal para birimi
        para_birimi: normalizedCurrency, // Normalize edilmiş para birimi (TL→TRY)
        kur_degeri: kurDegeri, // Kullanılan kur (düzeltilmiş olabilir)
        original_kur_degeri: o.kur_degeri, // Veritabanındaki orijinal kur
        tarih: new Date(o.siparis_tarihi || o.created_at)
      };
    })
    .sort((a, b) => a.tarih - b.tarih);

  console.log('✅ Fiyatlı sipariş sayısı:', ordersWithPrice.length);

  // Malzeme bazında gruplama (kod + tanım ile)
  const materialInfo = {};
  ordersWithPrice.forEach(order => {
    const materialTanim = order.malzeme_tanimi || 'Bilinmeyen';
    const materialKod = order.malzeme || '';

    if (!materialInfo[materialTanim]) {
      materialInfo[materialTanim] = {
        kod: materialKod,
        tanim: materialTanim,
        prices: [],
        currencies: new Set() // Para birimlerini takip et
      };
    }

    // Para birimini takip et
    materialInfo[materialTanim].currencies.add(order.display_currency);

    materialInfo[materialTanim].prices.push({
      tarih: order.tarih,
      fiyat: order.normalized_fiyat, // Normalized fiyat kullan
      original_fiyat: order.birim_fiyat, // Orijinal birim fiyat
      original_currency: order.original_para_birimi || order.para_birimi || 'TRY', // Veritabanındaki para birimi
      kur_degeri: order.kur_degeri, // Kullanılan kur değeri (düzeltilmiş)
      original_kur_degeri: order.original_kur_degeri, // Veritabanındaki kur
      conversion_note: order.conversion_note, // Dönüşüm açıklaması
      siparis_no: order.siparis_no,
      tedarikci: order.tedarikci_tanimi,
      odeme_kosulu: order.odeme_kosulu_tanimi || order.odeme_kosulu || 'Belirtilmemiş',
      para_birimi: order.display_currency // Display currency (normalized to USD)
    });
  });

  // Her malzeme için dominant para birimini belirle
  Object.values(materialInfo).forEach(info => {
    const currenciesArray = Array.from(info.currencies);

    // Eğer farklı para birimleri varsa veya USD varsa → USD kullan
    if (currenciesArray.length > 1 || currenciesArray.includes('USD')) {
      info.display_currency = 'USD';
    } else {
      info.display_currency = currenciesArray[0] || 'TRY';
    }

    // Set'i kaldır (artık gerek yok)
    delete info.currencies;
  });

  // Tüm malzemeleri al (limit kaldırıldı)
  const allMaterialsWithPrices = Object.entries(materialInfo);
  const materialsWithMultiplePrices = allMaterialsWithPrices.filter(([_, info]) => info.prices.length > 1);

  console.log('📦 Toplam farklı malzeme sayısı:', allMaterialsWithPrices.length);
  console.log('🔄 Birden fazla fiyat kaydı olan malzeme:', materialsWithMultiplePrices.length);

  // En çok fiyat kaydı olandan aza sırala (TÜM malzemeler)
  const topMaterials = materialsWithMultiplePrices
    .sort((a, b) => b[1].prices.length - a[1].prices.length);

  console.log('✅ Dropdown\'da gösterilen malzeme sayısı:', topMaterials.length);

  if (topMaterials.length === 0) {
    return `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <h3 style="color: #666;">Fiyat değişimi olan malzeme bulunamadı</h3>
        <p style="color: #999;">Toplam ${allMaterialsWithPrices.length} farklı malzeme var ancak hiçbirinde birden fazla fiyat kaydı yok.</p>
        <p style="color: #999; margin-top: 10px;">Debug: ${allPurchasingOrders.length} toplam sipariş, ${ordersWithPrice.length} fiyatlı sipariş</p>
      </div>
    `;
  }

  // Global değişken olarak sakla
  window.topMaterialsData = topMaterials;
  window.materialInfoData = materialInfo;

  return `
    <div style="padding: 20px;">
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 16px;">🔍 Malzeme Ara (İsim veya Kod):</label>
        <input
          type="text"
          id="material-search-input"
          placeholder="Malzeme adı veya kodu yazın..."
          oninput="filterMaterialList()"
          style="width: 100%; max-width: 600px; padding: 12px; border: 2px solid #2196f3; border-radius: 8px; font-size: 14px; margin-bottom: 10px;"
        />
        <select
          id="material-selector"
          onchange="updatePriceTrendChart()"
          size="8"
          style="width: 100%; max-width: 600px; padding: 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 13px; background: white; cursor: pointer;">
          ${topMaterials.map(([_, info], idx) =>
            `<option value="${idx}">${info.kod ? info.kod + ' - ' : ''}${info.tanim}</option>`
          ).join('')}
        </select>
      </div>

      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <canvas id="price-trend-chart" style="max-height: 400px;"></canvas>
      </div>

      <div id="price-stats" style="padding: 20px; background: #f8f9fa; border-radius: 12px;">
        <!-- İstatistikler buraya gelecek -->
      </div>
    </div>
  `;
}

function initPriceTrendChart() {
  // Tab render edildikten sonra grafiği çiz
  setTimeout(() => {
    if (window.topMaterialsData && window.topMaterialsData.length > 0) {
      updatePriceTrendChart();
    }
  }, 100);
}

function updatePriceTrendChart() {
  const selector = document.getElementById('material-selector');
  if (!selector) return;

  const selectedIdx = parseInt(selector.value);

  // Guard: Eğer index geçersizse veya data yoksa çık
  if (!window.topMaterialsData || !window.topMaterialsData[selectedIdx]) {
    console.warn('⚠️ Seçilen malzeme verisi bulunamadı:', selectedIdx);
    return;
  }

  const [_, materialInfo] = window.topMaterialsData[selectedIdx];
  const materialName = materialInfo.kod ? `${materialInfo.kod} - ${materialInfo.tanim}` : materialInfo.tanim;
  const prices = materialInfo.prices;
  const displayCurrency = materialInfo.display_currency || 'TRY';
  const currencySymbol = displayCurrency === 'USD' ? '$' : displayCurrency === 'EUR' ? '€' : '₺';

  console.log(`📊 ${materialName} - Para Birimi: ${displayCurrency}`);

  // Veriyi hazırla
  const sortedPrices = prices.sort((a, b) => a.tarih - b.tarih);
  const labels = sortedPrices.map(p => p.tarih.toLocaleDateString('tr-TR'));
  const data = sortedPrices.map(p => p.fiyat);

  // 🔍 DEBUG: Her fiyatın detayını göster
  console.log('🔍 Fiyat Detayları:');
  sortedPrices.forEach((p, idx) => {
    const currSymbol = p.original_currency === 'USD' ? '$' : p.original_currency === 'EUR' ? '€' : '₺';
    console.log(`  ${idx + 1}. ${p.tarih.toLocaleDateString('tr-TR')} | ${p.tedarikci || 'Bilinmiyor'}`);
    console.log(`     Orijinal: ${currSymbol}${p.original_fiyat?.toFixed(2) || '?'} (${p.original_currency || '?'}) | Kur: ${p.kur_degeri || 'yok'}`);
    console.log(`     Normalize: ${displayCurrency === 'USD' ? '$' : displayCurrency === 'EUR' ? '€' : '₺'}${p.fiyat.toFixed(2)} (${displayCurrency}) | ${p.conversion_note || 'Dönüşüm yok'}`);
    console.log(`     Sipariş: ${p.siparis_no} | Ödeme: ${p.odeme_kosulu}`);
  });

  // İstatistikleri hesapla
  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const avgPrice = data.reduce((a, b) => a + b, 0) / data.length;
  const priceChange = ((data[data.length - 1] - data[0]) / data[0]) * 100;

  // 🔍 DEBUG: Hesaplama detayı
  console.log(`\n📊 İstatistikler:`);
  console.log(`  Min: ${currencySymbol}${minPrice.toFixed(2)}`);
  console.log(`  Max: ${currencySymbol}${maxPrice.toFixed(2)}`);
  console.log(`  Avg: ${currencySymbol}${avgPrice.toFixed(2)}`);
  console.log(`  İlk Fiyat: ${currencySymbol}${data[0].toFixed(2)} (${sortedPrices[0].tarih.toLocaleDateString('tr-TR')})`);
  console.log(`  Son Fiyat: ${currencySymbol}${data[data.length - 1].toFixed(2)} (${sortedPrices[sortedPrices.length - 1].tarih.toLocaleDateString('tr-TR')})`);
  console.log(`  Değişim Hesabı: ((${data[data.length - 1].toFixed(2)} - ${data[0].toFixed(2)}) / ${data[0].toFixed(2)}) * 100 = ${priceChange.toFixed(1)}%`);

  // En düşük ve en yüksek fiyat bilgilerini bul (tedarikçi ve tarih ile)
  const minPriceEntry = sortedPrices.find(p => p.fiyat === minPrice);
  const maxPriceEntry = sortedPrices.find(p => p.fiyat === maxPrice);
  const firstEntry = sortedPrices[0];
  const lastEntry = sortedPrices[sortedPrices.length - 1];

  // İstatistikleri göster
  document.getElementById('price-stats').innerHTML = `
    <h3 style="margin: 0 0 15px 0; font-size: 16px;">📊 ${materialName} - İstatistikler (${displayCurrency})</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">En Düşük Fiyat</div>
        <div style="font-size: 20px; font-weight: 700; color: #4caf50; margin-bottom: 5px;">${currencySymbol}${formatPrice(minPrice)}</div>
        <div style="font-size: 11px; color: #999;">🏢 ${minPriceEntry.tedarikci || 'Bilinmiyor'}</div>
        <div style="font-size: 11px; color: #999;">📅 ${minPriceEntry.tarih.toLocaleDateString('tr-TR')}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">En Yüksek Fiyat</div>
        <div style="font-size: 20px; font-weight: 700; color: #f44336; margin-bottom: 5px;">${currencySymbol}${formatPrice(maxPrice)}</div>
        <div style="font-size: 11px; color: #999;">🏢 ${maxPriceEntry.tedarikci || 'Bilinmiyor'}</div>
        <div style="font-size: 11px; color: #999;">📅 ${maxPriceEntry.tarih.toLocaleDateString('tr-TR')}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Ortalama Fiyat</div>
        <div style="font-size: 20px; font-weight: 700; color: #2196f3; margin-bottom: 5px;">${currencySymbol}${formatPrice(avgPrice)}</div>
        <div style="font-size: 11px; color: #999;">📊 ${sortedPrices.length} sipariş ortalaması</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${priceChange >= 0 ? '#f44336' : '#4caf50'};">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Fiyat Değişimi</div>
        <div style="font-size: 20px; font-weight: 700; color: ${priceChange >= 0 ? '#f44336' : '#4caf50'}; margin-bottom: 5px;">
          ${priceChange >= 0 ? '↑' : '↓'} %${Math.abs(priceChange).toFixed(1)}
        </div>
        <div style="font-size: 11px; color: #999;">📅 ${firstEntry.tarih.toLocaleDateString('tr-TR')} → ${lastEntry.tarih.toLocaleDateString('tr-TR')}</div>
      </div>
    </div>
  `;

  // Grafiği çiz
  const ctx = document.getElementById('price-trend-chart');
  if (window.priceTrendChart) {
    window.priceTrendChart.destroy();
  }

  window.priceTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Birim Fiyat (${displayCurrency})`,
        data: data,
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#2196f3',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const price = context.parsed.y;
              const pointData = sortedPrices[context.dataIndex];
              const currencySymbol = pointData.para_birimi === 'USD' ? '$' :
                                     pointData.para_birimi === 'EUR' ? '€' : '₺';
              const originalSymbol = pointData.original_currency === 'USD' ? '$' :
                                     pointData.original_currency === 'EUR' ? '€' : '₺';

              const lines = [
                `Fiyat: ${currencySymbol}${formatPrice(price)} (${pointData.para_birimi})`,
              ];

              // Eğer normalize edildiyse orijinal fiyatı da göster
              if (pointData.original_currency !== pointData.para_birimi) {
                lines.push(`Orijinal: ${originalSymbol}${formatPrice(pointData.original_fiyat)} (${pointData.original_currency})`);
              }

              lines.push(
                `Sipariş: ${pointData.siparis_no}`,
                `Tedarikçi: ${pointData.tedarikci || 'Bilinmiyor'}`,
                `Ödeme: ${pointData.odeme_kosulu}`
              );

              return lines;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => {
              return currencySymbol + formatPrice(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Fiyat Değişimleri Tab
 */
function renderPriceChangesTab() {
  const priceChanges = [];
  const materialGroups = {};
  allPurchasingOrders.forEach(order => {
    // Fallback: birim_fiyat yoksa hesapla
    let birimFiyat;
    if (order.birim_fiyat && parseFloat(order.birim_fiyat) > 0) {
      birimFiyat = parseFloat(order.birim_fiyat);
    } else if (order.tutar_tl && order.miktar && parseFloat(order.tutar_tl) > 0 && parseFloat(order.miktar) > 0) {
      birimFiyat = parseFloat(order.tutar_tl) / parseFloat(order.miktar);
    } else {
      return; // Fiyat hesaplanamıyor
    }

    // Para birimi normalizasyonu (Fiyat Trend ile aynı mantık)
    const paraBirimi = (order.para_birimi || 'TRY').toUpperCase();
    const normalizedCurrency = paraBirimi === 'TL' ? 'TRY' : paraBirimi;
    let kurDegeri = parseFloat(order.kur_degeri) || 1;

    // TL/TRY için kur kontrolü
    if ((normalizedCurrency === 'TRY') && kurDegeri < 10) {
      kurDegeri = 34; // 2024-2025 için ortalama kur
    }

    let normalizedFiyat = birimFiyat;
    let displayCurrency = normalizedCurrency;

    if (normalizedCurrency === 'USD') {
      normalizedFiyat = birimFiyat;
      displayCurrency = 'USD';
    } else if (normalizedCurrency === 'TRY') {
      normalizedFiyat = birimFiyat / kurDegeri;
      displayCurrency = 'USD';
    } else if (normalizedCurrency === 'EUR' && kurDegeri > 1) {
      normalizedFiyat = (birimFiyat / kurDegeri) * 1.1;
      displayCurrency = 'USD';
    }

    const tarih = order.siparis_tarihi || order.created_at;
    if (!tarih) return;

    const material = order.malzeme_tanimi || 'Bilinmeyen';
    if (!materialGroups[material]) {
      materialGroups[material] = {
        records: [],
        currency: displayCurrency // Malzeme için para birimi
      };
    }
    materialGroups[material].records.push({
      fiyat: normalizedFiyat,
      tarih: new Date(tarih),
      tedarikci: order.tedarikci_tanimi || 'Bilinmiyor'
    });
  });
  Object.entries(materialGroups).forEach(([material, data]) => {
    const records = data.records;
    const currency = data.currency;

    if (records.length < 2) return;
    const sorted = records.sort((a, b) => a.tarih - b.tarih);
    priceChanges.push({
      material,
      currency, // Para birimi ekle
      ilkFiyat: sorted[0].fiyat,
      sonFiyat: sorted[sorted.length-1].fiyat,
      ilkTarih: sorted[0].tarih,
      sonTarih: sorted[sorted.length-1].tarih,
      ilkTedarikci: sorted[0].tedarikci,
      sonTedarikci: sorted[sorted.length-1].tedarikci,
      degisim: ((sorted[sorted.length-1].fiyat - sorted[0].fiyat) / sorted[0].fiyat) * 100,
      fark: sorted[sorted.length-1].fiyat - sorted[0].fiyat,
      revizyonSayisi: records.length
    });
  });
  priceChanges.sort((a, b) => Math.abs(b.degisim) - Math.abs(a.degisim));
  if (priceChanges.length === 0) {
    return '<div style="text-align:center;padding:60px"><h3>Fiyat değişimi bulunamadı</h3></div>';
  }
  const rows = priceChanges.slice(0,50).map((item,idx) => {
    const bg = idx % 2 ? '#f9f9f9' : 'white';
    const color = item.degisim > 0 ? '#f44336' : '#4caf50';
    const icon = item.degisim > 0 ? '↑' : '↓';
    const badge = Math.abs(item.degisim) > 50 ? '#f44336' : Math.abs(item.degisim) > 20 ? '#ff9800' : '#4caf50';
    const badgeText = Math.abs(item.degisim) > 50 ? '⚠️ Kritik' : Math.abs(item.degisim) > 20 ? '⚡ Yüksek' : '✓ Normal';

    // Para birimi sembolü
    const currencySymbol = item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : '₺';

    return '<tr style="background:'+bg+'">'+
      '<td style="padding:15px"><strong>'+item.material+'</strong></td>'+
      '<td style="padding:15px">'+currencySymbol+formatPrice(item.ilkFiyat)+'<br><span style="font-size:11px;color:#999">📅 '+item.ilkTarih.toLocaleDateString('tr-TR')+'</span><br><span style="font-size:11px;color:#666">🏢 '+item.ilkTedarikci+'</span></td>'+
      '<td style="padding:15px">'+currencySymbol+formatPrice(item.sonFiyat)+'<br><span style="font-size:11px;color:#999">📅 '+item.sonTarih.toLocaleDateString('tr-TR')+'</span><br><span style="font-size:11px;color:#666">🏢 '+item.sonTedarikci+'</span></td>'+
      '<td style="padding:15px;color:'+color+';font-weight:600">'+(item.fark>=0?'+':'')+currencySymbol+formatPrice(Math.abs(item.fark))+'</td>'+
      '<td style="padding:15px;text-align:center;color:'+color+';font-weight:700;font-size:18px">'+icon+' %'+Math.abs(item.degisim).toFixed(1)+'</td>'+
      '<td style="padding:15px"><span style="background:'+badge+';color:white;padding:4px 12px;border-radius:12px;font-size:12px">'+badgeText+'</span></td>'+
      '</tr>';
  }).join('');
  return '<div style="padding:20px"><table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><thead><tr style="background:linear-gradient(135deg,#667eea,#764ba2);color:white"><th style="padding:15px">Malzeme</th><th style="padding:15px">İlk Fiyat</th><th style="padding:15px">Son Fiyat</th><th style="padding:15px">Fark</th><th style="padding:15px">Değişim %</th><th style="padding:15px">Durum</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderSupplierComparisonTab() {
  const materialSuppliers = {};
  allPurchasingOrders.forEach(order => {
    if (!order.tedarikci_tanimi || !order.malzeme_tanimi) return;

    // Fallback: birim_fiyat yoksa hesapla
    let birimFiyat;
    if (order.birim_fiyat && parseFloat(order.birim_fiyat) > 0) {
      birimFiyat = parseFloat(order.birim_fiyat);
    } else if (order.tutar_tl && order.miktar && parseFloat(order.tutar_tl) > 0 && parseFloat(order.miktar) > 0) {
      birimFiyat = parseFloat(order.tutar_tl) / parseFloat(order.miktar);
    } else {
      return; // Fiyat hesaplanamıyor
    }

    const tarihValue = order.siparis_tarihi || order.created_at;
    if (!tarihValue) return;

    const material = order.malzeme_tanimi;
    const supplier = order.tedarikci_tanimi;
    const tarih = new Date(tarihValue);

    if (!materialSuppliers[material]) materialSuppliers[material] = {};
    if (!materialSuppliers[material][supplier]) materialSuppliers[material][supplier] = [];
    materialSuppliers[material][supplier].push({ fiyat: birimFiyat, tarih: tarih });
  });
  const items = Object.entries(materialSuppliers)
    .filter(([_, suppliers]) => Object.keys(suppliers).length > 1)
    .map(([material, suppliers]) => {
      const supplierAvgs = Object.entries(suppliers).map(([supplier, records]) => {
        const prices = records.map(r => r.fiyat);
        const avgPrice = prices.reduce((a,b) => a+b) / prices.length;
        const lastDate = records.sort((a,b) => b.tarih - a.tarih)[0].tarih;
        return {
          supplier,
          avgPrice,
          count: prices.length,
          lastDate
        };
      }).sort((a,b) => a.avgPrice - b.avgPrice);
      return {
        material,
        suppliers: supplierAvgs,
        priceDiff: ((supplierAvgs[supplierAvgs.length-1].avgPrice - supplierAvgs[0].avgPrice) / supplierAvgs[0].avgPrice) * 100
      };
    })
    .sort((a,b) => b.priceDiff - a.priceDiff)
    .slice(0, 20);
  if (items.length === 0) {
    return '<div style="text-align:center;padding:60px"><h3>Karşılaştırılabilir malzeme yok</h3></div>';
  }
  return '<div style="padding:20px">'+items.map(item => {
    const suppliers = item.suppliers.map((s,i) => {
      const isLowest = i === 0;
      const isHighest = i === item.suppliers.length - 1;
      const bg = isLowest ? '#e8f5e9' : isHighest ? '#ffebee' : '#f5f5f5';
      const border = isLowest ? '#4caf50' : isHighest ? '#f44336' : '#ddd';
      const color = isLowest ? '#4caf50' : isHighest ? '#f44336' : '#333';
      const badge = isLowest ? '<span style="background:#4caf50;color:white;padding:2px 8px;border-radius:12px;font-size:11px">EN UYGUN</span>' : isHighest ? '<span style="background:#f44336;color:white;padding:2px 8px;border-radius:12px;font-size:11px">EN YÜKSEK</span>' : '';
      return '<div style="padding:12px;background:'+bg+';border-left:4px solid '+border+';border-radius:8px;display:flex;justify-content:space-between;align-items:center">'+
        '<div><strong>'+s.supplier+'</strong><br><span style="font-size:11px;color:#666">📦 '+s.count+' sipariş</span> <span style="font-size:11px;color:#999">📅 Son: '+s.lastDate.toLocaleDateString('tr-TR')+'</span><br>'+badge+'</div>'+
        '<div style="font-size:18px;font-weight:700;color:'+color+'">₺'+s.avgPrice.toFixed(2)+'</div>'+
        '</div>';
    }).join('');
    return '<div style="background:white;border:1px solid #ddd;border-radius:12px;padding:20px;margin-bottom:20px"><h3 style="margin:0 0 15px 0">'+item.material+' <span style="float:right;color:'+(item.priceDiff>50?'#f44336':'#ff9800')+'">Fark: %'+item.priceDiff.toFixed(1)+'</span></h3><div style="display:grid;gap:10px">'+suppliers+'</div></div>';
  }).join('')+'</div>';
}

console.log('✅ Revizyon Analytics modülü yüklendi (Fiyat Takip - Tab Bazlı)');

// =====================================================
// MALZEME FİLTRELEME FONKSİYONU
// =====================================================

function filterMaterialList() {
  const searchInput = document.getElementById('material-search-input');
  const selector = document.getElementById('material-selector');
  
  if (!searchInput || !selector) return;
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const options = selector.options;
  
  for (let i = 0; i < options.length; i++) {
    const materialName = options[i].text.toLowerCase();
    
    if (searchTerm === '' || materialName.includes(searchTerm)) {
      options[i].style.display = '';
    } else {
      options[i].style.display = 'none';
    }
  }
  
  // İlk görünen seçeneği seç
  for (let i = 0; i < options.length; i++) {
    if (options[i].style.display !== 'none') {
      selector.selectedIndex = i;
      updatePriceTrendChart();
      break;
    }
  }
}

// =====================================================
// TEDARİKÇİ GENEL BAKİYE TAB
// =====================================================

function renderSupplierBalanceTab() {
  console.log('💼 Tedarikçi genel bakiye tab render ediliyor...');

  // Tedarikçi bazında sipariş toplamları
  const supplierBalances = {};

  allPurchasingOrders.forEach(order => {
    if (!order.tedarikci_tanimi) return;

    const supplier = order.tedarikci_tanimi;
    const tutarTL = parseFloat(order.tutar_tl) || 0; // TL cinsinden (genel toplam için)
    const tutarOriginal = parseFloat(order.para_birimi_tutar) || tutarTL; // Orijinal para biriminde
    const miktar = parseFloat(order.miktar) || 0;
    const gelenMiktar = parseFloat(order.gelen_miktar) || 0;
    const paraBirimi = order.para_birimi || 'TRY';

    if (!supplierBalances[supplier]) {
      supplierBalances[supplier] = {
        totalOrders: 0,
        closedOrders: 0,
        openOrders: 0,
        totalAmount: 0,
        closedAmount: 0,
        openAmount: 0,
        currencies: {}
      };
    }

    supplierBalances[supplier].totalOrders++;
    supplierBalances[supplier].totalAmount += tutarTL;

    // Para birimi bazında topla - ORİJİNAL PARA BİRİMİNDEKİ TUTARI KULLAN
    if (!supplierBalances[supplier].currencies[paraBirimi]) {
      supplierBalances[supplier].currencies[paraBirimi] = {
        total: 0,
        closed: 0,
        open: 0
      };
    }
    supplierBalances[supplier].currencies[paraBirimi].total += tutarOriginal;

    // Kapanan vs Açık sipariş kontrolü
    if (miktar > 0 && gelenMiktar >= miktar) {
      // Kapanan sipariş
      supplierBalances[supplier].closedOrders++;
      supplierBalances[supplier].closedAmount += tutarTL;
      supplierBalances[supplier].currencies[paraBirimi].closed += tutarOriginal;
    } else {
      // Açık sipariş
      supplierBalances[supplier].openOrders++;
      supplierBalances[supplier].openAmount += tutarTL;
      supplierBalances[supplier].currencies[paraBirimi].open += tutarOriginal;
    }
  });

  // Array'e çevir ve toplam tutara göre sırala
  const sortedSuppliers = Object.entries(supplierBalances)
    .sort((a, b) => b[1].totalAmount - a[1].totalAmount);

  console.log('📊 Toplam tedarikçi sayısı:', sortedSuppliers.length);

  if (sortedSuppliers.length === 0) {
    return '<div style="text-align:center;padding:60px"><h3>Tedarikçi bulunamadı</h3></div>';
  }

  // Global olarak sakla (arama için)
  window.allSupplierBalances = sortedSuppliers;
  window.filteredSupplierBalances = sortedSuppliers;

  return `
    <div style="padding: 20px;">
      <!-- Arama ve Filtre -->
      <div style="margin-bottom: 20px;">
        <input
          type="text"
          id="supplier-search-input"
          placeholder="🔍 Tedarikçi ara..."
          oninput="filterSupplierBalances()"
          style="width: 100%; max-width: 400px; padding: 12px; border: 2px solid #2196f3; border-radius: 8px; font-size: 14px;"
        />
      </div>

      <!-- Tedarikçi Listesi -->
      <div id="supplier-balance-list">
        ${renderSupplierBalanceCards(sortedSuppliers)}
      </div>
    </div>
  `;
}

function renderSupplierBalanceCards(suppliers) {
  return suppliers.map(([supplier, data]) => {
    const openPercentage = data.totalOrders > 0 
      ? ((data.openOrders / data.totalOrders) * 100).toFixed(1) 
      : 0;

    // Para birimlerini göster
    const currencyDisplay = Object.entries(data.currencies)
      .map(([currency, amounts]) => {
        const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
        return `
          <div style="display: flex; justify-content: space-between; padding: 8px; background: #f9f9f9; border-radius: 6px; margin-bottom: 5px;">
            <span style="font-weight: 600;">${currency}</span>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: 700;">${symbol}${amounts.total.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</div>
              <div style="font-size: 11px; color: #666;">
                Kapanan: ${symbol}${amounts.closed.toLocaleString('tr-TR', {minimumFractionDigits: 2})} | 
                Açık: ${symbol}${amounts.open.toLocaleString('tr-TR', {minimumFractionDigits: 2})}
              </div>
            </div>
          </div>
        `;
      }).join('');

    return `
      <div class="supplier-balance-card" style="background: white; border: 1px solid #ddd; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">
          🏢 ${supplier}
        </h3>

        <!-- Sipariş İstatistikleri -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
          <div style="text-align: center; padding: 10px; background: #e3f2fd; border-radius: 8px;">
            <div style="font-size: 12px; color: #666;">Toplam Sipariş</div>
            <div style="font-size: 20px; font-weight: 700; color: #2196f3;">${data.totalOrders}</div>
          </div>
          <div style="text-align: center; padding: 10px; background: #e8f5e9; border-radius: 8px;">
            <div style="font-size: 12px; color: #666;">Kapanan</div>
            <div style="font-size: 20px; font-weight: 700; color: #4caf50;">${data.closedOrders}</div>
          </div>
          <div style="text-align: center; padding: 10px; background: #fff3e0; border-radius: 8px;">
            <div style="font-size: 12px; color: #666;">Açık</div>
            <div style="font-size: 20px; font-weight: 700; color: #ff9800;">${data.openOrders}</div>
          </div>
        </div>

        <!-- Para Birimi Bazında Tutarlar -->
        <div style="margin-top: 15px;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #666;">💰 Para Birimi Bazında Bakiye:</div>
          ${currencyDisplay}
        </div>

        <!-- İlerleme Çubuğu -->
        <div style="margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
            <span>Sipariş Durumu</span>
            <span>${openPercentage}% Açık</span>
          </div>
          <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <div style="width: ${100 - openPercentage}%; height: 100%; background: #4caf50; float: left;"></div>
            <div style="width: ${openPercentage}%; height: 100%; background: #ff9800;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterSupplierBalances() {
  const searchInput = document.getElementById('supplier-search-input');
  const listContainer = document.getElementById('supplier-balance-list');
  
  if (!searchInput || !listContainer) return;
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  const filtered = window.allSupplierBalances.filter(([supplier, _]) => 
    supplier.toLowerCase().includes(searchTerm)
  );
  
  window.filteredSupplierBalances = filtered;
  listContainer.innerHTML = renderSupplierBalanceCards(filtered);
  
  console.log(`🔍 "${searchTerm}" araması: ${filtered.length} sonuç`);
}
