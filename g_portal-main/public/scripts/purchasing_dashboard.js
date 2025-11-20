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
    setupMobileViewClass(); // New function call
    window.addEventListener('resize', setupMobileViewClass); // Listen for resize to adjust
    switchView('dashboard');
    loadDashboardData();
}

// Function to add/remove mobile-purchasing-view class
function setupMobileViewClass() {
    if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-purchasing-view');
    } else {
        document.body.classList.remove('mobile-purchasing-view');
    }
}

function setupEventListeners() {
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = '/index.html';
        });
    }

    // Filter button (sadece orders view'da var)
    const filterBtn = document.getElementById('filter-button');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const filterModal = document.getElementById('filter-modal');
            if (filterModal) {
                filterModal.style.display = 'flex';
                populateFilterOptions();
            }
        });
    }

    // Filter modal buttons
    const closeFilterBtn = document.getElementById('close-filter-modal');
    if (closeFilterBtn) {
        closeFilterBtn.addEventListener('click', closeFilterModal);
    }

    const applyFiltersBtn = document.getElementById('apply-filters-button');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    const resetFiltersBtn = document.getElementById('reset-filters-button');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }

    console.log('✅ Event listeners kuruldu');
}

function closeFilterModal() {
    document.getElementById('filter-modal').style.display = 'none';
}

function populateFilterOptions() {
    const filterStatus = document.getElementById('filter-status');
    const filterSupplier = document.getElementById('filter-supplier');

    // Clear previous options
    filterStatus.innerHTML = '<option value="">Tümü</option>';
    filterSupplier.innerHTML = '<option value="">Tümü</option>';

    const uniqueStatuses = [...new Set(allPurchasingOrders.map(order => order.teslimat_durumu))].filter(Boolean);
    uniqueStatuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        filterStatus.appendChild(option);
    });

    const uniqueSuppliers = [...new Set(allPurchasingOrders.map(order => order.tedarikci_tanimi))].filter(Boolean);
    uniqueSuppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        filterSupplier.appendChild(option);
    });
}

function applyFilters() {
    const filterSearch = document.getElementById('filter-search').value.toLowerCase();
    const filterStatus = document.getElementById('filter-status').value;
    const filterSupplier = document.getElementById('filter-supplier').value;
    const filterStartDate = document.getElementById('filter-start-date').value;
    const filterEndDate = document.getElementById('filter-end-date').value;

    let filteredOrders = allPurchasingOrders.filter(order => order.is_latest);

    if (filterSearch) {
        filteredOrders = filteredOrders.filter(order =>
            (order.siparis_no && order.siparis_no.toLowerCase().includes(filterSearch)) ||
            (order.tedarikci_tanimi && order.tedarikci_tanimi.toLowerCase().includes(filterSearch)) ||
            (order.malzeme_tanimi && order.malzeme_tanimi.toLowerCase().includes(filterSearch))
        );
    }

    if (filterStatus) {
        filteredOrders = filteredOrders.filter(order => order.teslimat_durumu === filterStatus);
    }

    if (filterSupplier) {
        filteredOrders = filteredOrders.filter(order => order.tedarikci_tanimi === filterSupplier);
    }

    if (filterStartDate) {
        const start = new Date(filterStartDate);
        filteredOrders = filteredOrders.filter(order => new Date(order.siparis_tarihi) >= start);
    }

    if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setDate(end.getDate() + 1); // Include the end date
        filteredOrders = filteredOrders.filter(order => new Date(order.siparis_tarihi) <= end);
    }

    renderOrderList(filteredOrders);
    closeFilterModal();
}

function resetFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-supplier').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    applyFilters(); // Re-apply with empty filters
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
    console.log('📊 Dashboard verileri yükleniyor...');

    const elements = {
        open: document.getElementById('kpi-open-orders'),
        partial: document.getElementById('kpi-partial-orders'),
        amount: document.getElementById('kpi-total-amount'),
        delivery: document.getElementById('kpi-avg-delivery'),
    };
    Object.values(elements).forEach(el => el && el.classList.add('skeleton'));

    try {
        console.log('🔍 Supabase sorgusu başlatılıyor...');
        const { data, error } = await supabaseClient
            .from('purchasing_orders')
            .select('teslimat_durumu, tutar_tl, termin_farki')
            .eq('is_latest', true);

        if (error) {
            console.error('❌ Supabase hatası:', error);
            throw error;
        }

        const allOrders = data || [];
        console.log(`✅ ${allOrders.length} sipariş yüklendi`);
        
        // KPI Hesaplamaları
        const openOrdersCount = allOrders.filter(o => o.teslimat_durumu === 'Açık').length;
        const partialOrdersCount = allOrders.filter(o => o.teslimat_durumu === 'Kısmi').length;
        const totalAmount = allOrders.reduce((sum, o) => sum + (parseFloat(o.tutar_tl) || 0), 0);
        
        const completedOrders = allOrders.filter(o => o.termin_farki !== null);
        const avgTerminFarki = completedOrders.length > 0
            ? completedOrders.reduce((sum, o) => sum + (parseFloat(o.termin_farki) || 0), 0) / completedOrders.length
            : 0;

        // UI Güncelleme
        if(elements.open) elements.open.textContent = openOrdersCount;
        if(elements.partial) elements.partial.textContent = partialOrdersCount;
        if(elements.amount) elements.amount.textContent = formatCurrency(totalAmount);
        if(elements.delivery) elements.delivery.textContent = `${avgTerminFarki.toFixed(1)} gün`;

    } catch (error) {
        console.error('KPI verileri yüklenemedi:', error);
        Object.values(elements).forEach(el => { if(el) el.textContent = 'Hata' });
    } finally {
        Object.values(elements).forEach(el => el && el.classList.remove('skeleton'));
        loadWeeklyOrdersChart(); // Keep the chart loading here
    }
}

async function fetchAllPurchasingOrders() {
    if (allPurchasingOrders.length > 0) {
        console.log(`♻️ Cache'den ${allPurchasingOrders.length} sipariş döndürülüyor`);
        return allPurchasingOrders;
    }

    console.log('🔍 Tüm siparişler yükleniyor...');
    const { data, error } = await supabaseClient
        .from('purchasing_orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Sipariş yükleme hatası:', error);
        throw error;
    }

    allPurchasingOrders = data || [];
    console.log(`✅ ${allPurchasingOrders.length} sipariş cache'e alındı`);
    return allPurchasingOrders;
}

async function loadPurchasingOrders() {
    console.log('📦 Sipariş listesi yükleniyor...');
    const listEl = document.getElementById('orders-list');

    if (!listEl) {
        console.error('❌ orders-list elementi bulunamadı!');
        return;
    }

    listEl.innerHTML = `<div class="skeleton-card"></div>`.repeat(3);

    try {
        const orders = await fetchAllPurchasingOrders();
        const latestOrders = orders.filter(o => o.is_latest);
        console.log(`📋 ${latestOrders.length} güncel sipariş render ediliyor...`);
        renderOrderList(latestOrders);
    } catch (error) {
        console.error('❌ Sipariş listesi yüklenemedi:', error);
        listEl.innerHTML = `<p class="error">❌ Siparişler yüklenemedi: ${error.message}</p>`;
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
    listEl.innerHTML = orders.length > 0 ? orders.map((order, index) => `
        <div class="order-card" data-order-id="${order.id}">
            <!-- Ana Özet Bölümü (Her Zaman Görünür) -->
            <div class="order-card-header" onclick="toggleOrderDetails(${index})">
                <div class="header-row">
                    <span class="order-no">📦 ${order.siparis_no || 'N/A'}</span>
                    <span class="status status-${order.teslimat_durumu || 'Bilinmiyor'}">${order.teslimat_durumu || 'Bilinmiyor'}</span>
                </div>
                <div class="header-row secondary">
                    <span class="firma">🏢 ${order.firma || '-'}</span>
                    <span class="toggle-icon" id="toggle-icon-${index}">▼</span>
                </div>
            </div>

            <div class="order-card-summary">
                <div class="summary-item">
                    <span class="label">🏭 Tedarikçi</span>
                    <span class="value">${order.tedarikci_tanimi || 'Belirtilmemiş'}</span>
                </div>
                <div class="summary-item highlight">
                    <span class="label">💰 Toplam Tutar</span>
                    <span class="value price">${formatCurrency(order.tutar_tl || 0)} ₺</span>
                </div>
                <div class="summary-item">
                    <span class="label">📅 Sipariş Tarihi</span>
                    <span class="value">${formatDate(order.siparis_tarihi)}</span>
                </div>
            </div>

            <!-- Detay Bölümü (Açılır-Kapanır) -->
            <div class="order-card-details" id="details-${index}" style="display: none;">

                <!-- Talep Bilgileri -->
                <div class="detail-section">
                    <div class="section-title" onclick="toggleSection('request-${index}')">
                        <span>📋 TALEP BİLGİLERİ</span>
                        <span class="section-toggle" id="section-toggle-request-${index}">▼</span>
                    </div>
                    <div class="section-content" id="section-request-${index}">
                        <div class="detail-row">
                            <span class="key">Talep Tipi:</span>
                            <span class="val">${order.siparis_tip || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Talep No:</span>
                            <span class="val">${order.talep_no || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Talep Oluşturma:</span>
                            <span class="val">${formatDate(order.talep_olusturma_tarihi)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Siparişe Dönüşüm:</span>
                            <span class="val">${formatDate(order.siparis_olusturma_tarihi)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">İstenen Teslim:</span>
                            <span class="val">${formatDate(order.ihtiyac_tarihi)}</span>
                        </div>
                    </div>
                </div>

                <!-- Malzeme Bilgileri -->
                <div class="detail-section">
                    <div class="section-title" onclick="toggleSection('material-${index}')">
                        <span>🔧 MALZEME BİLGİLERİ</span>
                        <span class="section-toggle" id="section-toggle-material-${index}">▼</span>
                    </div>
                    <div class="section-content" id="section-material-${index}">
                        <div class="detail-row">
                            <span class="key">Malzeme Kodu:</span>
                            <span class="val">${order.malzeme || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Malzeme Tanımı:</span>
                            <span class="val">${order.malzeme_tanimi || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Sipariş Miktarı:</span>
                            <span class="val highlight">${order.miktar || 0} ${order.birim || ''}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Gelen Miktar:</span>
                            <span class="val ${(order.toplam_gelen_miktar >= order.miktar) ? 'success' : 'warning'}">${order.toplam_gelen_miktar || 0} ${order.birim || ''}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Kalan Miktar:</span>
                            <span class="val ${(order.kalan_miktar > 0) ? 'warning' : 'success'}">${order.kalan_miktar || 0} ${order.birim || ''}</span>
                        </div>
                    </div>
                </div>

                <!-- Termin ve Planlama -->
                <div class="detail-section">
                    <div class="section-title" onclick="toggleSection('schedule-${index}')">
                        <span>⏱️ TERMİN & PLANLAMA</span>
                        <span class="section-toggle" id="section-toggle-schedule-${index}">▼</span>
                    </div>
                    <div class="section-content" id="section-schedule-${index}">
                        <div class="detail-row">
                            <span class="key">Standart Termin:</span>
                            <span class="val">${order.standart_termin_suresi || 0} gün</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Std. Termin Tarihi:</span>
                            <span class="val">${formatDate(order.standart_termin_tarihi)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Mal Kabul Tarihi:</span>
                            <span class="val">${formatDate(order.mal_kabul_tarihi)}</span>
                        </div>
                        <div class="detail-row ${Math.abs(order.planlama_sapmasi || 0) > 3 ? 'warning' : ''}">
                            <span class="key">Planlama Sapması:</span>
                            <span class="val">${order.planlama_sapmasi ? (order.planlama_sapmasi > 0 ? '+' : '') + order.planlama_sapmasi + ' gün' : '-'}</span>
                        </div>
                        <div class="detail-row ${Math.abs(order.termin_farki || 0) > 3 ? 'warning' : ''}">
                            <span class="key">Termin Farkı:</span>
                            <span class="val">${order.termin_farki ? (order.termin_farki > 0 ? '+' : '') + order.termin_farki + ' gün' : '-'}</span>
                        </div>
                    </div>
                </div>

                <!-- Fiyat Bilgileri -->
                <div class="detail-section">
                    <div class="section-title" onclick="toggleSection('price-${index}')">
                        <span>💵 FİYAT BİLGİLERİ</span>
                        <span class="section-toggle" id="section-toggle-price-${index}">▼</span>
                    </div>
                    <div class="section-content" id="section-price-${index}">
                        <div class="detail-row">
                            <span class="key">Birim Fiyat:</span>
                            <span class="val">${formatCurrency(order.birim_fiyat || 0)} ${order.para_birimi || ''}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Tutar:</span>
                            <span class="val">${formatCurrency(order.para_birimi_tutar || 0)} ${order.para_birimi || ''}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Para Birimi:</span>
                            <span class="val">${order.para_birimi || 'TRY'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Kur Değeri:</span>
                            <span class="val">${order.kur_degeri ? order.kur_degeri.toFixed(4) : '-'}</span>
                        </div>
                        <div class="detail-row highlight">
                            <span class="key">Toplam TL:</span>
                            <span class="val price">${formatCurrency(order.tutar_tl || 0)} ₺</span>
                        </div>
                    </div>
                </div>

                <!-- Ödeme Bilgileri -->
                <div class="detail-section">
                    <div class="section-title" onclick="toggleSection('payment-${index}')">
                        <span>💳 ÖDEME BİLGİLERİ</span>
                        <span class="section-toggle" id="section-toggle-payment-${index}">▼</span>
                    </div>
                    <div class="section-content" id="section-payment-${index}">
                        <div class="detail-row">
                            <span class="key">Ödeme Koşulu:</span>
                            <span class="val">${order.odeme_kosulu_tanimi || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="key">Ödeme Tarihi:</span>
                            <span class="val">${formatDate(order.siparis_teslim_odeme_vadesi)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `).join('') : `<p class="no-data">📦 Sipariş bulunamadı.</p>`;
}

// Sipariş kartını açıp kapatma
function toggleOrderDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const icon = document.getElementById(`toggle-icon-${index}`);

    if (details.style.display === 'none' || !details.style.display) {
        details.style.display = 'block';
        icon.textContent = '▲';
    } else {
        details.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Bölüm açıp kapatma
function toggleSection(sectionId) {
    const section = document.getElementById(`section-${sectionId}`);
    const toggle = document.getElementById(`section-toggle-${sectionId}`);

    if (section.style.display === 'none' || !section.style.display) {
        section.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        section.style.display = 'none';
        toggle.textContent = '▼';
    }
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
