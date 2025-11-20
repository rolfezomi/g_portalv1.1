// Supabase İstemcisini Ayarla
const SUPABASE_URL = 'https://mignlffeyougoefuyayr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzM4NDUsImV4cCI6MjA3NDcwOTg0NX0.WOvAMx4L3IzovJILgwCG7lRZeHhvOl_n7J1LR5A8SX0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Global State ---
let allPurchasingOrders = [];
let materialInfoData = {};
window.appInitialized = false;

// --- Main App Logic ---

document.addEventListener('DOMContentLoaded', () => {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
            if (!window.appInitialized) initializeApp(session);
        } else if (event === 'SIGNED_OUT') {
            window.location.href = '/index.html';
        }
    });
});

function initializeApp(session) {
    window.appInitialized = true;
    setupEventListeners();
    switchView('dashboard');
    loadDashboardData();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = '/index.html';
    });
    
    document.getElementById('fab-add-order').addEventListener('click', () => alert('Yeni sipariş formu burada açılacak.'));
    document.getElementById('filter-button').addEventListener('click', () => alert('Filtreleme seçenekleri burada açılacak.'));
}

function switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const activeView = document.getElementById(`view-${viewName}`);
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (activeView) activeView.classList.add('active');
    if (activeNavItem) activeNavItem.classList.add('active');

    document.getElementById('header-title').textContent = activeNavItem.querySelector('.label').textContent;

    const loaderMap = {
        'orders': loadPurchasingOrders,
        'revision-analytics': loadRevisionAnalytics,
    };

    if (loaderMap[viewName] && !activeView.dataset.loaded) {
        loaderMap[viewName]();
        activeView.dataset.loaded = 'true';
    }
}

// --- Data Loading ---

async function loadDashboardData() {
    const elements = {
        open: document.getElementById('kpi-open-orders'),
        partial: document.getElementById('kpi-partial-orders'),
        suppliers: document.getElementById('kpi-total-suppliers'),
        revisions: document.getElementById('kpi-total-revisions'),
    };
    Object.values(elements).forEach(el => el && el.classList.add('skeleton'));

    try {
        const [ordersRes, suppliersRes, revisionsRes] = await Promise.all([
            supabaseClient.from('purchasing_orders').select('teslimat_durumu').eq('is_latest', true),
            supabaseClient.from('purchasing_suppliers').select('id', { count: 'exact', head: true }),
            supabaseClient.from('purchasing_revision_stats').select('total_revisions')
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (suppliersRes.error) throw suppliersRes.error;
        if (revisionsRes.error) throw revisionsRes.error;

        const allOrders = ordersRes.data || [];
        elements.open.textContent = allOrders.filter(o => o.teslimat_durumu === 'Açık').length;
        elements.partial.textContent = allOrders.filter(o => o.teslimat_durumu === 'Kısmi').length;
        elements.suppliers.textContent = suppliersRes.count;
        elements.revisions.textContent = revisionsRes.data.reduce((sum, item) => sum + item.total_revisions, 0);

    } catch (error) {
        console.error('KPI verileri yüklenemedi:', error);
    } finally {
        Object.values(elements).forEach(el => el && el.classList.remove('skeleton'));
        loadWeeklyOrdersChart();
    }
}

async function fetchAllPurchasingOrders() {
    if (allPurchasingOrders.length > 0) return allPurchasingOrders;
    
    const { data, error } = await supabaseClient.from('purchasing_orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    allPurchasingOrders = data || [];
    return allPurchasingOrders;
}

async function loadPurchasingOrders() {
    const listEl = document.getElementById('orders-list');
    listEl.innerHTML = `<div class="skeleton-card"></div>`.repeat(3);

    try {
        const orders = await fetchAllPurchasingOrders();
        renderOrderList(orders.filter(o => o.is_latest));
    } catch (error) {
        listEl.innerHTML = `<p class="error">Siparişler yüklenemedi.</p>`;
    }
}

async function loadRevisionAnalytics() {
    const contentEl = document.getElementById('revision-analytics-content');
    contentEl.innerHTML = `<div class="skeleton-card"></div>`;

    try {
        const orders = await fetchAllPurchasingOrders();
        processRevisionData(orders);
        renderRevisionAnalyticsUI();
    } catch (error) {
        contentEl.innerHTML = `<p class="error">Revizyon verileri yüklenemedi.</p>`;
    }
}

// --- Rendering ---

function renderOrderList(orders) {
    const listEl = document.getElementById('orders-list');
    listEl.innerHTML = orders.length > 0 ? orders.map(order => `
        <div class="order-card" data-order-id="${order.id}">
            <div class="order-card-header">
                <span class="order-no">#${order.siparis_no || 'N/A'}</span>
                <span class="status ${order.teslimat_durumu || ''}">${order.teslimat_durumu || 'Bilinmiyor'}</span>
            </div>
            <div class="order-card-body">
                <div class="supplier">${order.tedarikci_tanimi || 'Tedarikçi Bilgisi Yok'}</div>
                <div class="amount">${formatCurrency(order.tutar_tl)}</div>
            </div>
            <div class="order-card-details">
                <div class="detail-grid">
                    <span><strong>Malzeme:</strong> ${order.malzeme_tanimi || '-'}</span>
                    <span><strong>Miktar:</strong> ${order.miktar || 0} ${order.birim || ''}</span>
                    <span><strong>Sipariş Tarihi:</strong> ${formatDate(order.siparis_tarihi)}</span>
                    <span><strong>Teslim Tarihi:</strong> ${formatDate(order.siparis_teslim_tarihi)}</span>
                </div>
            </div>
        </div>
    `).join('') : `<p>Sipariş bulunamadı.</p>`;

    listEl.querySelectorAll('.order-card').forEach(card => {
        card.addEventListener('click', () => {
            const details = card.querySelector('.order-card-details');
            details.style.display = details.style.display === 'block' ? 'none' : 'block';
        });
    });
}

function processRevisionData(orders) {
    materialInfoData = {};
    orders.forEach(order => {
        let birimFiyat = parseFloat(order.birim_fiyat) || 0;
        if (birimFiyat === 0 && order.tutar_tl && order.miktar) {
            birimFiyat = parseFloat(order.tutar_tl) / parseFloat(order.miktar);
        }
        if (!birimFiyat || !order.siparis_tarihi || !order.malzeme_tanimi) return;

        if (!materialInfoData[order.malzeme_tanimi]) {
            materialInfoData[order.malzeme_tanimi] = {
                kod: order.malzeme, tanim: order.malzeme_tanimi, prices: []
            };
        }
        materialInfoData[order.malzeme_tanimi].prices.push({
            tarih: new Date(order.siparis_tarihi), fiyat: birimFiyat
        });
    });
}

function renderRevisionAnalyticsUI() {
    const contentEl = document.getElementById('revision-analytics-content');
    const materialsWithMultiplePrices = Object.values(materialInfoData)
        .filter(m => m.prices.length > 1)
        .sort((a, b) => b.prices.length - a.prices.length);

    if (materialsWithMultiplePrices.length === 0) {
        contentEl.innerHTML = `<p>Fiyat trendi analizi için yeterli veri yok.</p>`;
        return;
    }

    contentEl.innerHTML = `
        <div class="material-selector-container">
            <label for="material-selector">Malzeme Seçin</label>
            <select id="material-selector">
                ${materialsWithMultiplePrices.map(m => `<option value="${m.tanim}">${m.tanim}</option>`).join('')}
            </select>
        </div>
        <div class="chart-container">
            <canvas id="price-trend-chart"></canvas>
        </div>
        <div class="price-stats-grid" id="price-stats"></div>
    `;

    document.getElementById('material-selector').addEventListener('change', (e) => {
        updatePriceTrendChart(e.target.value);
    });

    updatePriceTrendChart(materialsWithMultiplePrices[0].tanim);
}

function updatePriceTrendChart(materialName) {
    const material = materialInfoData[materialName];
    if (!material) return;

    const sortedPrices = material.prices.sort((a, b) => a.tarih - b.tarih);
    const labels = sortedPrices.map(p => formatDate(p.tarih));
    const data = sortedPrices.map(p => p.fiyat);

    const statsEl = document.getElementById('price-stats');
    const minPrice = Math.min(...data);
    const maxPrice = Math.max(...data);
    statsEl.innerHTML = `
        <div class="stat-card">
            <div class="label">En Düşük Fiyat</div><div class="value">${formatCurrency(minPrice)}</div>
        </div>
        <div class="stat-card">
            <div class="label">En Yüksek Fiyat</div><div class="value">${formatCurrency(maxPrice)}</div>
        </div>
    `;
    
    const ctx = document.getElementById('price-trend-chart').getContext('2d');
    if (window.priceTrendChart) window.priceTrendChart.destroy();
    
    window.priceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Birim Fiyat (TL)', data,
                borderColor: '#2196f3', backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2, tension: 0.1, fill: true
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

// --- Formatters & Helpers ---

function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Intl.DateTimeFormat('tr-TR').format(new Date(dateStr));
}

function loadWeeklyOrdersChart(){/* Placeholder */ }
