// Supabase İstemcisini Ayarla
const SUPABASE_URL = 'https://mignlffeyougoefuyayr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc0NzA3ODcsImV4cCI6MjAxMzA0Njc4N30.0_5s2d3mF4m5mH-t2W_4P_4tJ_4m_5t3t_5d_3j2w_8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Global State ---
let purchasingOrders = [];
window.appInitialized = false;

// --- Main App Logic ---

document.addEventListener('DOMContentLoaded', () => {
    supabase.auth.onAuthStateChange((event, session) => {
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session) {
            if (!window.appInitialized) initializeApp(session);
        } else if (event === 'SIGNED_OUT') {
            window.location.href = '/index.html';
        }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            window.location.href = '/index.html';
        } else if (!window.appInitialized) {
            initializeApp(session);
        }
    });
});

function initializeApp(session) {
    window.appInitialized = true;
    console.log('Uygulama başlatılıyor, kullanıcı:', session.user.email);
    setupEventListeners();
    switchView('dashboard');
    loadDashboardData();
}

function setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    document.getElementById('logout-button').addEventListener('click', async () => {
        console.log('Çıkış yapılıyor...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Oturum sonlandırma hatası:', error);
        } finally {
            window.location.href = '/index.html';
        }
    });

    document.getElementById('fab-add-order').addEventListener('click', () => alert('Yeni sipariş oluşturma formu burada açılacak.'));
    document.getElementById('filter-button').addEventListener('click', () => alert('Filtreleme seçenekleri burada açılacak.'));
}

function switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const activeView = document.getElementById(`view-${viewName}`);
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (activeView) activeView.classList.add('active');
    if (activeNavItem) activeNavItem.classList.add('active');

    document.getElementById('header-title').textContent = activeNavItem.querySelector('.label').textContent;

    if (viewName === 'orders' && !activeView.dataset.loaded) {
        loadPurchasingOrders();
        activeView.dataset.loaded = 'true';
    }
}

async function loadDashboardData() {
    loadKpiData();
    loadWeeklyOrdersChart();
}

async function loadKpiData() {
    const elements = {
        open: document.getElementById('open-orders-count'),
        pending: document.getElementById('pending-approvals-count'),
        suppliers: document.getElementById('total-suppliers-count')
    };
    Object.values(elements).forEach(el => el && el.classList.add('skeleton'));

    try {
        const [ordersResponse, suppliersResponse] = await Promise.all([
            supabase.from('purchasing_orders').select('teslimat_durumu').eq('is_latest', true),
            supabase.from('purchasing_suppliers').select('id', { count: 'exact', head: true })
        ]);

        if (ordersResponse.error) throw ordersResponse.error;
        if (suppliersResponse.error) throw suppliersResponse.error;

        const allOrders = ordersResponse.data || [];
        if(elements.open) elements.open.textContent = allOrders.filter(o => o.teslimat_durumu === 'Açık').length;
        if(elements.pending) elements.pending.textContent = allOrders.filter(o => o.teslimat_durumu === 'Kısmi').length;
        if(elements.suppliers) elements.suppliers.textContent = suppliersResponse.count;
    } catch (error) {
        console.error('KPI verileri yüklenirken hata:', error);
        Object.values(elements).forEach(el => { if(el) el.textContent = 'Hata' });
    } finally {
        Object.values(elements).forEach(el => el && el.classList.remove('skeleton'));
    }
}

async function loadPurchasingOrders() {
    const listEl = document.getElementById('orders-list');
    if (!listEl) return;
    listEl.innerHTML = `
        <div class="skeleton-card"><div class="skeleton-line" style="width: 60%;"></div><div class="skeleton-line" style="width: 90%;"></div></div>
        <div class="skeleton-card"><div class="skeleton-line" style="width: 50%;"></div><div class="skeleton-line" style="width: 80%;"></div></div>
        <div class="skeleton-card"><div class="skeleton-line" style="width: 70%;"></div><div class="skeleton-line" style="width: 100%;"></div></div>
    `;

    try {
        const { data, error } = await supabase.from('purchasing_orders').select('*').eq('is_latest', true).order('created_at', { ascending: false });
        if (error) throw error;
        purchasingOrders = data || [];
        renderOrderList(purchasingOrders);
    } catch (error) {
        console.error('Siparişler yüklenemedi:', error);
        listEl.innerHTML = `<p style="text-align:center;color:red;">Siparişler yüklenirken bir hata oluştu.</p>`;
    }
}

function renderOrderList(orders) {
    const listEl = document.getElementById('orders-list');
    if (!listEl) return;
    if (orders.length === 0) {
        listEl.innerHTML = `<p style="text-align:center;">Gösterilecek sipariş bulunamadı.</p>`;
        return;
    }

    listEl.innerHTML = orders.map(order => `
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
    `).join('');

    listEl.querySelectorAll('.order-card').forEach(card => {
        card.addEventListener('click', () => {
            const details = card.querySelector('.order-card-details');
            details.style.display = details.style.display === 'block' ? 'none' : 'block';
        });
    });
}

function formatCurrency(value) {
    if (value === null || isNaN(value)) return '0,00 TL';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
    } catch {
        return '-';
    }
}

function loadWeeklyOrdersChart() {
    const ctx = document.getElementById('weekly-orders-chart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
            datasets: [{
                label: 'Siparişler',
                data: [5, 9, 7, 12, 8, 4, 2],
                backgroundColor: 'rgba(13, 27, 42, 0.1)',
                borderColor: 'rgba(13, 27, 42, 1)',
                borderWidth: 3, tension: 0.4, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}
