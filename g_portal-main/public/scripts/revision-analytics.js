// =====================================================
// REVİZYON ANALİZ DASHBOARD - JAVASCRIPT
// =====================================================

// Global değişkenler
let revisionStats = null;
let changesReport = [];
let timelineData = [];

// =====================================================
// ANA YÜKLEME FONKSİYONU
// =====================================================

async function refreshRevisionAnalytics() {
  console.log('🔄 Revizyon analiz verileri yenileniyor...');

  try {
    await Promise.all([
      loadRevisionStats(),
      loadChangesReport(),
      loadRecentRevisions()
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
      <button class="revision-tab active" onclick="switchRevisionTab('changes')">
        📝 Değişiklik Raporu
      </button>
      <button class="revision-tab" onclick="switchRevisionTab('timeline')">
        ⏰ Zaman Çizelgesi
      </button>
      <button class="revision-tab" onclick="switchRevisionTab('payment-calendar')">
        💰 Ödeme Takvimi
      </button>
      <button class="revision-tab" onclick="switchRevisionTab('top-revised')">
        🔄 En Çok Revize Edilenler
      </button>
    </div>

    <!-- Tab İçerikleri -->
    <div id="revision-tab-content">
      ${renderChangesReportTab()}
    </div>
  `;
}

// KPI Kartları
function renderKPICards() {
  const totalOrders = timelineData.filter(o => o.revision_number === 1).length;
  const totalRevisions = timelineData.length - totalOrders;
  const avgRevisions = totalOrders > 0 ? (totalRevisions / totalOrders).toFixed(1) : 0;
  const recentChanges = changesReport.length;

  return `
    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        📦
      </div>
      <div class="kpi-content">
        <div class="kpi-label">Toplam Sipariş</div>
        <div class="kpi-value">${totalOrders}</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
        🔄
      </div>
      <div class="kpi-content">
        <div class="kpi-label">Toplam Revizyon</div>
        <div class="kpi-value">${totalRevisions}</div>
      </div>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
        📊
      </div>
      <div class="kpi-content">
        <div class="kpi-label">Ortalama Revizyon</div>
        <div class="kpi-value">${avgRevisions}</div>
        <div class="kpi-sublabel">sipariş başına</div>
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
                  <button class="btn-icon" onclick="showOrderHistory('${order.siparis_no}', '${order.siparis_kalemi || ''}')">
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
        <div class="payment-summary-card overdue">
          <div class="summary-icon">⚠️</div>
          <div class="summary-content">
            <div class="summary-label">Gecikmiş</div>
            <div class="summary-amount" id="payment-overdue">₺0</div>
            <div class="summary-count" id="payment-overdue-count">0 sipariş</div>
          </div>
        </div>

        <div class="payment-summary-card this-week">
          <div class="summary-icon">📅</div>
          <div class="summary-content">
            <div class="summary-label">Bu Hafta</div>
            <div class="summary-amount" id="payment-week">₺0</div>
            <div class="summary-count" id="payment-week-count">0 sipariş</div>
          </div>
        </div>

        <div class="payment-summary-card this-month">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <div class="summary-label">Bu Ay</div>
            <div class="summary-amount" id="payment-month">₺0</div>
            <div class="summary-count" id="payment-month-count">0 sipariş</div>
          </div>
        </div>

        <div class="payment-summary-card future">
          <div class="summary-icon">📈</div>
          <div class="summary-content">
            <div class="summary-label">Gelecek</div>
            <div class="summary-amount" id="payment-future">₺0</div>
            <div class="summary-count" id="payment-future-count">0 sipariş</div>
          </div>
        </div>
      </div>

      <div class="payment-chart-container">
        <canvas id="payment-chart" width="800" height="400"></canvas>
      </div>

      <div id="payment-details-list" class="payment-details-list"></div>
    </div>
  `;
}

// Ödeme verilerini hazırla
async function getPaymentData() {
  try {
    const { data: orders, error } = await supabaseClient
      .from('purchasing_orders')
      .select('*')
      .eq('is_latest', true)
      .not('vadeye_gore', 'is', null)
      .order('vadeye_gore', { ascending: true });

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

    // Tarihe göre gruplama
    const dateGroups = {};

    orders.forEach(order => {
      const vadeDate = new Date(order.vadeye_gore);
      vadeDate.setHours(0, 0, 0, 0);
      const tutar = parseFloat(order.tutar_tl) || 0;

      // Tarih grupları (grafik için)
      const dateKey = order.vadeye_gore;
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = 0;
      }
      dateGroups[dateKey] += tutar;

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
    renderPaymentChart(dateGroups);
    renderPaymentDetails(groups);

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

// Grafik çiz
function renderPaymentChart(dateGroups) {
  const canvas = document.getElementById('payment-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Canvas temizle
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Tarihleri sırala
  const sortedDates = Object.keys(dateGroups).sort();
  const values = sortedDates.map(date => dateGroups[date]);

  if (sortedDates.length === 0) {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('Veri bulunamadı', canvas.width / 2, canvas.height / 2);
    return;
  }

  // Grafik alanı
  const padding = 60;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  // Maksimum değer
  const maxValue = Math.max(...values);
  const barWidth = chartWidth / sortedDates.length;

  // Çubukları çiz
  sortedDates.forEach((date, index) => {
    const value = dateGroups[date];
    const barHeight = (value / maxValue) * chartHeight;
    const x = padding + index * barWidth;
    const y = padding + chartHeight - barHeight;

    // Renk belirleme (geçmiş = kırmızı, yakın = turuncu, uzak = yeşil)
    const vadeDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let color = '#4caf50'; // Yeşil (uzak)
    if (vadeDate < today) {
      color = '#f44336'; // Kırmızı (geçmiş)
    } else if (vadeDate - today < 7 * 24 * 60 * 60 * 1000) {
      color = '#ff9800'; // Turuncu (bu hafta)
    } else if (vadeDate - today < 30 * 24 * 60 * 60 * 1000) {
      color = '#ffc107'; // Sarı (bu ay)
    }

    ctx.fillStyle = color;
    ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

    // Tarih etiketi
    ctx.save();
    ctx.translate(x + barWidth / 2, canvas.height - padding + 20);
    ctx.rotate(-Math.PI / 4);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText(formatDate(date), 0, 0);
    ctx.restore();

    // Tutar etiketi
    if (barHeight > 20) {
      ctx.font = '11px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(formatCurrencyShort(value), x + barWidth / 2, y + barHeight / 2 + 4);
    }
  });

  // Y ekseni
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();

  // Y ekseni etiketleri
  ctx.font = '12px Arial';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const value = (maxValue / 5) * i;
    const y = padding + chartHeight - (chartHeight / 5) * i;
    ctx.fillText(formatCurrencyShort(value), padding - 10, y + 4);
  }

  // Başlık
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('Vade Tarihlerine Göre Ödeme Tutarları', canvas.width / 2, 30);
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
                  <button class="btn-icon" onclick="showOrderHistory('${stat.siparis_no}', '${stat.siparis_kalemi || ''}')">
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

async function showOrderHistory(siparisNo, siparisKalemi) {
  try {
    const { data, error } = await supabaseClient
      .rpc('get_order_revision_history', {
        p_siparis_no: siparisNo,
        p_siparis_kalemi: siparisKalemi || null
      });

    if (error) throw error;

    if (!data || data.length === 0) {
      showToast('⚠️ Revizyon geçmişi bulunamadı', 'warning');
      return;
    }

    // Modal oluştur
    const modal = document.createElement('div');
    modal.className = 'revision-modal-overlay';
    modal.innerHTML = `
      <div class="revision-modal">
        <div class="revision-modal-header">
          <h3>📜 Sipariş Geçmişi: ${siparisNo}</h3>
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

console.log('✅ Revizyon Analytics modülü yüklendi');
