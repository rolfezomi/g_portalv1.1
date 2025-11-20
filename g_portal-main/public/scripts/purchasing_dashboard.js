// Supabase İstemcisini Ayarla
const SUPABASE_URL = 'https://mignlffeyougoefuyayr.supabase.co';
// Public anahtarını buraya ekleyin. Güvenli bir yerden (örneğin .env) alınması tavsiye edilir.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc0NzA3ODcsImV4cCI6MjAxMzA0Njc4N30.0_5s2d3mF4m5mH-t2W_4P_4tJ_4m_5t3t_5d_3j2w_8';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Kullanıcı bilgilerini ve yetkileri kontrol et
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        console.error('Oturum hatası veya oturum bulunamadı:', error);
        // Oturum yoksa login sayfasına yönlendir
        window.location.href = '/index.html';
        return;
    }

    const user = session.user;
    document.getElementById('user-email').textContent = user.email;

    // Yetki kontrolü (opsiyonel, sayfa erişimi zaten login yönlendirmesi ile yapıldı)
    // hasPurchasingAccess(); // Bu fonksiyonun tanımlanması gerekir

    // Dashboard verilerini yükle
    loadDashboardData();

    // Çıkış butonu
    document.getElementById('logout-button').addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Çıkış yapılamadı:', error);
        } else {
            window.location.href = '/index.html';
        }
    });

    // Hızlı işlem butonları için event listener'lar
    document.getElementById('new-order-button').addEventListener('click', () => {
        alert('Yeni sipariş oluşturma formu burada açılacak.');
        // window.location.href = '/new-order.html'; // Örnek yönlendirme
    });

    document.getElementById('search-supplier-button').addEventListener('click', () => {
        alert('Tedarikçi arama ekranı burada açılacak.');
    });

    document.getElementById('view-reports-button').addEventListener('click', () => {
        alert('Satın alma raporları ekranı burada açılacak.');
    });
});

async function loadDashboardData() {
    // Bu fonksiyonlar, Supabase'den gerçek verileri çekecek şekilde doldurulmalıdır.
    loadKpiData();
    loadWeeklyOrdersChart();
}

async function loadKpiData() {
    // Örnek veriler - Gerçek uygulamada Supabase'den RPC veya view çağrıları ile doldurun.
    document.getElementById('open-orders-count').textContent = '12';
    document.getElementById('pending-approvals-count').textContent = '3';
    document.getElementById('total-suppliers-count').textContent = '87';
}

async function loadWeeklyOrdersChart() {
    const ctx = document.getElementById('weekly-orders-chart').getContext('2d');

    // Örnek veriler
    const data = {
        labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        datasets: [{
            label: 'Bu Hafta Gelen Siparişler',
            data: [5, 9, 7, 12, 8, 4, 2],
            backgroundColor: 'rgba(10, 147, 150, 0.2)',
            borderColor: 'rgba(10, 147, 150, 1)',
            borderWidth: 2,
            tension: 0.3
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
