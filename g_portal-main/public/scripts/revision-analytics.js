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

  content.innerHTML = `
    <!-- KPI Kartları -->
    <div class="revision-kpi-grid">
      ${renderKPICards()}
    </div>

    <!-- Tab Navigasyon -->
    <div class="revision-tabs">
      <button class="revision-tab" onclick="switchRevisionTab('changes')">
        📝 Değişiklik Raporu
      </button>
      <button class="revision-tab" onclick="switchRevisionTab('timeline')">
        ⏰ Zaman Çizelgesi
      </button>
      <button class="revision-tab active" onclick="switchRevisionTab('payment-calendar')">
        💰 Ödeme Takvimi
      </button>
      <button class="revision-tab" onclick="switchRevisionTab('top-revised')">
        🔄 En Çok Revize Edilenler
      </button>
    </div>

    <!-- Tab İçerikleri -->
    <div id="revision-tab-content">
      ${renderPaymentCalendarTab()}
    </div>
  `;
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
      } else {
        // Vade tarihi hesaplanamıyorsa bu kaydı atla
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
      if (vadeDate < today) {
        groups.overdue.total += tutar;
        groups.overdue.count++;
        groups.overdue.orders.push(order);
      } else if (vadeDate <= oneWeekLater) {
        groups.thisWeek.total += tutar;
        groups.thisWeek.count++;
        groups.thisWeek.orders.push(order);
      } else if (vadeDate <= oneMonthLater) {
        groups.thisMonth.total += tutar;
        groups.thisMonth.count++;
        groups.thisMonth.orders.push(order);
      } else {
        groups.future.total += tutar;
        groups.future.count++;
        groups.future.orders.push(order);
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

console.log('✅ Revizyon Analytics modülü yüklendi');
