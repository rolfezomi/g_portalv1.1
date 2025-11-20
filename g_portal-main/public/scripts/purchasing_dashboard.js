// Supabase İstemcisini Ayarla
const SUPABASE_URL = 'https://mignlffeyougoefuyayr.supabase.co';
// Public anahtarını buraya ekleyin. Güvenli bir yerden (örneğin .env) alınması tavsiye edilir.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc0NzA3ODcsImV4cCI6MjAxMzA0Njc4N30.0_5s2d3mF4m5mH-t2W_4P_4tJ_4m_5t3t_5d_3j2w_8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Main App Logic ---

document.addEventListener('DOMContentLoaded', () => {
    // Oturum durumundaki değişiklikleri dinle
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event);
        if (event === 'INITIAL_SESSION' && session) {
            initializeApp(session);
        } else if (event === 'SIGNED_IN' && session) {
            initializeApp(session);
        } else if (event === 'SIGNED_OUT') {
            window.location.href = '/index.html';
        }
    });

    // Mevcut oturumu manuel olarak da kontrol et, onAuthStateChange'in yavaş kalma ihtimaline karşı
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            window.location.href = '/index.html';
        } else {
             // Eğer onAuthStateChange henüz tetiklenmediyse, buradan başlat
            if (!window.appInitialized) {
                initializeApp(session);
            }
        }
    });
});

function initializeApp(session) {
    // Uygulamanın tekrar tekrar başlatılmasını engelle
    if (window.appInitialized) return;
    window.appInitialized = true;

    console.log('Uygulama başlatılıyor, kullanıcı:', session.user.email);
    setupEventListeners();
    switchView('dashboard');
    loadDashboardData();
}


function setupEventListeners() {
    // Alt navigasyon barı
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });

    // Çıkış butonu
    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = '/index.html';
    });

    // Floating Action Button
    document.getElementById('fab-add-order').addEventListener('click', () => {
        alert('Yeni sipariş oluşturma formu burada açılacak.');
    });
}

function switchView(viewName) {
    const views = document.querySelectorAll('.app-view');
    const navItems = document.querySelectorAll('.nav-item');
    const headerTitle = document.getElementById('header-title');

    views.forEach(view => view.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));

    const activeView = document.getElementById(`view-${viewName}`);
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (activeView) activeView.classList.add('active');
    if (activeNavItem) activeNavItem.classList.add('active');

    headerTitle.textContent = activeNavItem.querySelector('.label').textContent;

    if (viewName === 'orders' && !activeView.dataset.loaded) {
        // loadOrders(); // Bu fonksiyon henüz tanımlanmadı
        activeView.dataset.loaded = 'true';
    }
}

async function loadDashboardData() {
    loadKpiData();
    loadWeeklyOrdersChart();
}

async function loadKpiData() {
    const openOrdersEl = document.getElementById('open-orders-count');
    const pendingApprovalsEl = document.getElementById('pending-approvals-count');
    const totalSuppliersEl = document.getElementById('total-suppliers-count');

    const elements = [openOrdersEl, pendingApprovalsEl, totalSuppliersEl];
    elements.forEach(el => el.classList.add('skeleton'));

    try {
        const [ordersResponse, suppliersResponse] = await Promise.all([
            supabase.from('purchasing_orders').select('teslimat_durumu').eq('is_latest', true),
            supabase.from('purchasing_suppliers').select('id', { count: 'exact', head: true })
        ]);

        if (ordersResponse.error) throw ordersResponse.error;
        if (suppliersResponse.error) throw suppliersResponse.error;

        const allOrders = ordersResponse.data || [];
        
        const openOrdersCount = allOrders.filter(o => o.teslimat_durumu === 'Açık').length;
        const partialOrdersCount = allOrders.filter(o => o.teslimat_durumu === 'Kısmi').length;
        const totalSuppliersCount = suppliersResponse.count;
        
        openOrdersEl.textContent = openOrdersCount;
        pendingApprovalsEl.textContent = partialOrdersCount;
        totalSuppliersEl.textContent = totalSuppliersCount;

    } catch (error) {
        console.error('KPI verileri yüklenirken hata:', error);
        elements.forEach(el => el.textContent = 'Hata');
    } finally {
        elements.forEach(el => el.classList.remove('skeleton'));
    }
}

async function loadWeeklyOrdersChart() {
    const ctx = document.getElementById('weekly-orders-chart').getContext('2d');
    if (!ctx) return;
    
    // Gerçek veri çekme (opsiyonel, şimdilik örnek veri)
    const labels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const data = [5, 9, 7, 12, 8, 4, 2];

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bu Hafta Gelen Siparişler',
                data: data,
                backgroundColor: 'rgba(13, 27, 42, 0.1)',
                borderColor: 'rgba(13, 27, 42, 1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}
