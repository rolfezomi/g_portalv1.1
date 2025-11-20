// Supabase İstemcisini Ayarla
const SUPABASE_URL = 'https://mignlffeyougoefuyayr.supabase.co';
// Public anahtarını buraya ekleyin. Güvenli bir yerden (örneğin .env) alınması tavsiye edilir.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc0NzA3ODcsImV4cCI6MjAxMzA0Njc4N30.0_5s2d3mF4m5mH-t2W_4P_4tJ_4m_5t3t_5d_3j2w_8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Oturum kontrolü
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = '/index.html';
        return;
    }

    // Navigasyon ve diğer olayları bağla
    setupEventListeners();
    
    // Başlangıç görünümünü ayarla
    switchView('dashboard');
    loadDashboardData();
});

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

    // Tüm görünümleri ve aktif durumları sıfırla
    views.forEach(view => view.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));

    // İlgili görünümü ve navigasyon butonunu aktif et
    const activeView = document.getElementById(`view-${viewName}`);
    const activeNavItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (activeView) {
        activeView.classList.add('active');
    }
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Başlığı güncelle
    headerTitle.textContent = activeNavItem.querySelector('.label').textContent;

    // Eğer ilgili görünüm için bir yükleme fonksiyonu varsa çağır
    if (viewName === 'orders') {
        // loadOrders(); // Siparişleri yükleme fonksiyonu (henüz eklenmedi)
    }
}

async function loadDashboardData() {
    // KPI verilerini yükle (örnek verilerle)
    loadKpiData();
    // Haftalık sipariş özetini yükle
    loadWeeklyOrdersChart();
}

async function loadKpiData() {
    // Gerçek uygulamada bu veriler Supabase'den çekilmelidir.
    // Şimdilik iskelet yükleyiciyi simüle edip sonra veriyi gösterelim.
    const openOrdersEl = document.getElementById('open-orders-count');
    const pendingApprovalsEl = document.getElementById('pending-approvals-count');

    // İskelet görünümü
    openOrdersEl.classList.add('skeleton');
    pendingApprovalsEl.classList.add('skeleton');

    // Veri yükleniyormuş gibi yap
    setTimeout(() => {
        openOrdersEl.textContent = '12';
        pendingApprovalsEl.textContent = '3';
        openOrdersEl.classList.remove('skeleton');
        pendingApprovalsEl.classList.remove('skeleton');
    }, 1500);
}

async function loadWeeklyOrdersChart() {
    const ctx = document.getElementById('weekly-orders-chart').getContext('2d');
    if (!ctx) return;

    // Örnek veriler
    const data = {
        labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        datasets: [{
            label: 'Bu Hafta Gelen Siparişler',
            data: [5, 9, 7, 12, 8, 4, 2],
            backgroundColor: 'rgba(13, 27, 42, 0.1)',
            borderColor: 'rgba(13, 27, 42, 1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
