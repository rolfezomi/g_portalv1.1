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
    <button class="revision-tab" onclick="switchRevisionTab('supplier-comparison')">
      📊 Tedarikçi Karşılaştırma
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
    case 'supplier-comparison':
      content.innerHTML = renderSupplierComparisonTab();
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
 * Fiyat Trend Tab
 */
function renderPriceTrendTab() {
  console.log('📈 Fiyat trend tab render ediliyor...');

  // Tüm siparişleri sipariş tarihine göre sırala
  const ordersWithPrice = allPurchasingOrders
    .filter(o => o.birim_fiyat && o.siparis_tarihi && parseFloat(o.birim_fiyat) > 0)
    .map(o => ({
      ...o,
      birim_fiyat: parseFloat(o.birim_fiyat),
      tarih: new Date(o.siparis_tarihi)
    }))
    .sort((a, b) => a.tarih - b.tarih);

  // Malzeme bazında gruplama
  const materialPrices = {};
  ordersWithPrice.forEach(order => {
    const material = order.malzeme_tanimi || 'Bilinmeyen';
    if (!materialPrices[material]) {
      materialPrices[material] = [];
    }
    materialPrices[material].push({
      tarih: order.tarih,
      fiyat: order.birim_fiyat,
      siparis_no: order.siparis_no,
      tedarikci: order.tedarikci_tanimi
    });
  });

  // En fazla revizyon olan ilk 10 malzemeyi al
  const topMaterials = Object.entries(materialPrices)
    .filter(([_, prices]) => prices.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  if (topMaterials.length === 0) {
    return `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <h3 style="color: #666;">Fiyat değişimi olan malzeme bulunamadı</h3>
        <p style="color: #999;">En az 2 farklı fiyat kaydı olan malzeme bulunmuyor.</p>
      </div>
    `;
  }

  // Global değişken olarak sakla
  window.topMaterialsData = topMaterials;
  window.materialPricesData = materialPrices;

  return `
    <div style="padding: 20px;">
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 16px;">Malzeme Seç:</label>
        <select id="material-selector" onchange="updatePriceTrendChart()" style="width: 100%; max-width: 600px; padding: 12px; border: 2px solid #2196f3; border-radius: 8px; font-size: 14px; background: white;">
          ${topMaterials.map(([material, _], idx) =>
            `<option value="${idx}">${material}</option>`
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
  const [materialName, prices] = window.topMaterialsData[selectedIdx];

  // Veriyi hazırla
  const sortedPrices = prices.sort((a, b) => a.tarih - b.tarih);
  const labels = sortedPrices.map(p => p.tarih.toLocaleDateString('tr-TR'));
  const data = sortedPrices.map(p => p.fiyat);

  // İstatistikleri hesapla
  const minPrice = Math.min(...data);
  const maxPrice = Math.max(...data);
  const avgPrice = data.reduce((a, b) => a + b, 0) / data.length;
  const priceChange = ((data[data.length - 1] - data[0]) / data[0]) * 100;

  // En düşük ve en yüksek fiyat bilgilerini bul (tedarikçi ve tarih ile)
  const minPriceEntry = sortedPrices.find(p => p.fiyat === minPrice);
  const maxPriceEntry = sortedPrices.find(p => p.fiyat === maxPrice);
  const firstEntry = sortedPrices[0];
  const lastEntry = sortedPrices[sortedPrices.length - 1];

  // İstatistikleri göster
  document.getElementById('price-stats').innerHTML = `
    <h3 style="margin: 0 0 15px 0; font-size: 16px;">📊 ${materialName} - İstatistikler</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">En Düşük Fiyat</div>
        <div style="font-size: 20px; font-weight: 700; color: #4caf50; margin-bottom: 5px;">₺${minPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        <div style="font-size: 11px; color: #999;">🏢 ${minPriceEntry.tedarikci || 'Bilinmiyor'}</div>
        <div style="font-size: 11px; color: #999;">📅 ${minPriceEntry.tarih.toLocaleDateString('tr-TR')}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f44336;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">En Yüksek Fiyat</div>
        <div style="font-size: 20px; font-weight: 700; color: #f44336; margin-bottom: 5px;">₺${maxPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        <div style="font-size: 11px; color: #999;">🏢 ${maxPriceEntry.tedarikci || 'Bilinmiyor'}</div>
        <div style="font-size: 11px; color: #999;">📅 ${maxPriceEntry.tarih.toLocaleDateString('tr-TR')}</div>
      </div>
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Ortalama Fiyat</div>
        <div style="font-size: 20px; font-weight: 700; color: #2196f3; margin-bottom: 5px;">₺${avgPrice.toLocaleString('tr-TR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
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
        label: 'Birim Fiyat (₺)',
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
              return [
                `Fiyat: ₺${price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}`,
                `Sipariş: ${pointData.siparis_no}`,
                `Tedarikçi: ${pointData.tedarikci || 'Bilinmiyor'}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return '₺' + value.toLocaleString('tr-TR');
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
    if (!order.birim_fiyat || !order.siparis_tarihi || parseFloat(order.birim_fiyat) <= 0) return;
    const material = order.malzeme_tanimi || 'Bilinmeyen';
    const birimFiyat = parseFloat(order.birim_fiyat);
    if (!materialGroups[material]) materialGroups[material] = [];
    materialGroups[material].push({
      fiyat: birimFiyat,
      tarih: new Date(order.siparis_tarihi),
      tedarikci: order.tedarikci_tanimi || 'Bilinmiyor'
    });
  });
  Object.entries(materialGroups).forEach(([material, records]) => {
    if (records.length < 2) return;
    const sorted = records.sort((a, b) => a.tarih - b.tarih);
    priceChanges.push({
      material,
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
    return '<tr style="background:'+bg+'">'+
      '<td style="padding:15px"><strong>'+item.material+'</strong></td>'+
      '<td style="padding:15px">₺'+item.ilkFiyat.toFixed(2)+'<br><span style="font-size:11px;color:#999">📅 '+item.ilkTarih.toLocaleDateString('tr-TR')+'</span><br><span style="font-size:11px;color:#666">🏢 '+item.ilkTedarikci+'</span></td>'+
      '<td style="padding:15px">₺'+item.sonFiyat.toFixed(2)+'<br><span style="font-size:11px;color:#999">📅 '+item.sonTarih.toLocaleDateString('tr-TR')+'</span><br><span style="font-size:11px;color:#666">🏢 '+item.sonTedarikci+'</span></td>'+
      '<td style="padding:15px;color:'+color+';font-weight:600">'+(item.fark>=0?'+':'')+'₺'+item.fark.toFixed(2)+'</td>'+
      '<td style="padding:15px;text-align:center;color:'+color+';font-weight:700;font-size:18px">'+icon+' %'+Math.abs(item.degisim).toFixed(1)+'</td>'+
      '<td style="padding:15px"><span style="background:'+badge+';color:white;padding:4px 12px;border-radius:12px;font-size:12px">'+badgeText+'</span></td>'+
      '</tr>';
  }).join('');
  return '<div style="padding:20px"><table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"><thead><tr style="background:linear-gradient(135deg,#667eea,#764ba2);color:white"><th style="padding:15px">Malzeme</th><th style="padding:15px">İlk Fiyat</th><th style="padding:15px">Son Fiyat</th><th style="padding:15px">Fark</th><th style="padding:15px">Değişim %</th><th style="padding:15px">Durum</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}

function renderSupplierComparisonTab() {
  const materialSuppliers = {};
  allPurchasingOrders.forEach(order => {
    if (!order.birim_fiyat || !order.tedarikci_tanimi || !order.malzeme_tanimi || !order.siparis_tarihi) return;
    if (parseFloat(order.birim_fiyat) <= 0) return;
    const material = order.malzeme_tanimi;
    const supplier = order.tedarikci_tanimi;
    const birimFiyat = parseFloat(order.birim_fiyat);
    const tarih = new Date(order.siparis_tarihi);
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
