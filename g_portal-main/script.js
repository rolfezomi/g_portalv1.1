// ====== SUPABASE BAĞLANTISI ======
const supabaseClient = window.supabase.createClient(
  'https://mignlffeyougoefuyayr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzM4NDUsImV4cCI6MjA3NDcwOTg0NX0.WOvAMx4L3IzovJILgwCG7lRZeHhvOl_n7J1LR5A8SX0'
);

console.log('Supabase client hazır');

// ====== OTURUM KONTROLÜ ======
function checkSession() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const username = localStorage.getItem('username');
  
  if (!isLoggedIn && window.location.pathname.includes('index.html')) {
    return false;
  }
  
  if (isLoggedIn) {
    const loggedUserEl = document.getElementById('logged-user');
    if (loggedUserEl && username) {
      loggedUserEl.textContent = username;
    }
    return true;
  }
  
  return false;
}

// Sayfa yüklendiğinde oturum kontrolü ve veri yükleme
window.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const loginScreen = document.getElementById('login-screen');
  const portalScreen = document.getElementById('portal-screen');
  
  if (isLoggedIn && loginScreen && portalScreen) {
    document.body.classList.remove('login-active');
    loginScreen.style.display = 'none';
    portalScreen.style.display = 'block';
    
    const username = localStorage.getItem('username');
    const loggedUserEl = document.getElementById('logged-user');
    if (loggedUserEl && username) {
      loggedUserEl.textContent = username;
    }
    
    showHomepage();
    await loadRecent(); // Supabase'den verileri yükle
    updateTrendFromStorage();
  }
});

// ====== ÜST SAAT ======
const timeEl = document.getElementById('current-time');
function tick(){
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
setInterval(tick, 1000); 
tick();

// ====== LOGIN ======
const loginForm = document.getElementById('login-form');
const messageEl = document.getElementById('message');

if (loginForm){
  loginForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    
    if(!userInput || !passInput) {
      console.error('Form elementleri bulunamadı');
      return;
    }
    
    const user = userInput.value.trim();
    const pass = passInput.value.trim();

    if(!user || !pass){
      if(messageEl) messageEl.textContent = 'Lütfen kullanıcı adı ve şifre giriniz.';
      return;
    }

    // Oturumu kaydet
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', user);

    // Ekranları değiştir
    const loginScreen = document.getElementById('login-screen');
    const portalScreen = document.getElementById('portal-screen');
    
    if(loginScreen) loginScreen.style.display = 'none';
    if(portalScreen) portalScreen.style.display = 'block';
    document.body.classList.remove('login-active');
    
    const loggedUserEl = document.getElementById('logged-user');
    if (loggedUserEl) loggedUserEl.textContent = user;

    showHomepage();
    loadRecent();
  });
}

function logout(){ 
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  location.reload(); 
}

// ====== SECTIONS & MENÜ ======
let currentSection = 'home';

function setActive(a){
  document.querySelectorAll('.menu a').forEach(el=> el.classList.remove('active'));
  a.classList.add('active');

  const sec = a.getAttribute('data-section-link') || 'home';
  activateMobileTab(sec);
}

function toggleMenu(){
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile){
    document.body.classList.toggle('mobile-menu-open');
  } else {
    document.body.classList.toggle('menu-collapsed');
  }
}

function showHomepage(){ 
  showSection('home');
  updateStatistics();
}

function showSection(key){
  currentSection = key;

  const sections = ['home','klor','sertlik','ph','iletkenlik','mikro'];
  sections.forEach(s=>{
    const el = document.getElementById(`page-${s}`);
    if(el) el.style.display = (s===key)?'':'none';
  });

  // Init fonksiyonlarını section görünür olduktan SONRA çağır
  if(key==='klor') {
    setTimeout(() => initKlorPage(), 0);
  }
  if(key==='sertlik') {
    setTimeout(() => initSertlikPage(), 0);
  }
  if(key==='ph') {
    setTimeout(() => initPhPage(), 0);
  }
  if(key==='iletkenlik') {
    setTimeout(() => initIletkenlikPage(), 0);
  }

  if (document.body.classList.contains('mobile-menu-open')){
    document.body.classList.remove('mobile-menu-open');
  }

  activateMobileTab(key);
  const link = document.querySelector(`.menu a[data-section-link="${key}"]`);
  if(link){
    document.querySelectorAll('.menu a').forEach(el=> el.classList.remove('active'));
    link.classList.add('active');
  }
  
  if(key==='home') updateStatistics();
}

// ====== MOBİL ÜST SEKMELER ======
function activateMobileTab(sectionKey){
  document.querySelectorAll('.mobile-tabs .tab').forEach(t=>{
    t.classList.toggle('active', t.getAttribute('data-section')===sectionKey);
  });
}

function mobileTabTo(btn){
  const section = btn.getAttribute('data-section');
  if(section === 'home'){ showHomepage(); }
  else { showSection(section); }
  
  const link = document.querySelector('.menu a[data-section-link="'+section+'"]');
  if(link){ setActive(link); }
}

window.mobileTabTo = mobileTabTo;

// ====== İSTATİSTİKLER ======
async function updateStatistics(){
  const { data, error } = await supabaseClient
    .from('measurements')
    .select('*');
  
  if (error) {
    console.error('İstatistik yükleme hatası:', error);
    return;
  }
  
  const allRecords = data || [];
  const totalEl = document.getElementById('total-records');
  const todayEl = document.getElementById('today-records');
  
  if(totalEl) totalEl.textContent = allRecords.length;
  
  if(todayEl){
    const today = new Date().toISOString().slice(0,10);
    const todayCount = allRecords.filter(r => r.date === today).length;
    todayEl.textContent = todayCount;
  }
}

// ====== VERİ İŞLEMLERİ - SUPABASE ======
let cachedRecords = [];

async function loadRecent(){
  try {
    const { data, error } = await supabaseClient
      .from('measurements')
      .select('*')
      .limit(200);
    
    if (error) {
      console.error('Veri yükleme hatası:', error);
      return;
    }
    
    cachedRecords = data || [];
    // Manuel sıralama - tarih ve saate göre
    cachedRecords.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
    
    console.log('Yüklenen kayıt sayısı:', cachedRecords.length);
    renderRecent();
    updateTrendFromStorage();
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
  }
}

function getRecent(){
  return cachedRecords;
}

async function addRecent(entry){
  try {
    const { data, error } = await supabaseClient
      .from('measurements')
      .insert([entry])
      .select();
    
    if (error) {
      console.error('Kayıt hatası:', error);
      showToast('Kayıt başarısız: ' + error.message);
      return;
    }
    
    console.log('Kayıt başarılı:', data);
    showToast('Kayıt başarıyla kaydedildi.');
    
    await loadRecent();
    updateStatistics();
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
    showToast('Bir hata oluştu');
  }
}

function renderRecent(){
  const tbody = document.getElementById('recent-tbody');
  if(!tbody) return;
  const rows = cachedRecords.slice(0, 5);

  tbody.innerHTML = '';
  if(!rows.length){
    const tr = document.createElement('tr');
    tr.className = 'empty';
    tr.innerHTML = `<td colspan="8" style="padding:12px 10px; opacity:.7;">Henüz kayıt yok.</td>`;
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((r, index)=>{
    const tr = document.createElement('tr');
    tr.style.background   = '#fff';
    tr.style.boxShadow    = '0 2px 8px rgba(0,0,0,.06)';
    tr.style.borderRadius = '10px';
    tr.style.overflow     = 'hidden';
    tr.style.animation    = `fadeInRow 0.3s ease ${index * 0.05}s both`;

    tr.innerHTML = `
      <td style="padding:10px 12px; font-weight:700; color:#1b5e20;">${r.category}</td>
      <td style="padding:10px 12px;">${r.point || '-'}</td>
      <td style="padding:10px 12px; font-weight:600;">${r.value || '-'}</td>
      <td style="padding:10px 12px;">${r.unit  || '-'}</td>
      <td style="padding:10px 12px;">${r.date  || '-'}</td>
      <td style="padding:10px 12px;">${r.time  || '-'}</td>
      <td style="padding:10px 12px;">${r.user  || '-'}</td>
      <td style="padding:10px 12px; font-size:13px; opacity:0.8;">${r.note  || '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ====== KLOR SAYFASI ======
let klorInitialized = false;
function initKlorPage(){
  if(klorInitialized) return;
  klorInitialized = true;

  const search = document.getElementById('search');
  const boxes  = Array.from(document.querySelectorAll('#klor-grid .box'));

  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase().trim();
      boxes.forEach(b=>{
        const hit = (b.dataset.point||'').toLowerCase().includes(q);
        b.style.display = hit ? '' : 'none';
      });
    });
  }

  boxes.forEach(b=> b.addEventListener('click', ()=> openModal(b.dataset.point)));
}

// ====== SERTLİK SAYFASI ======
let sertlikInitialized = false;
function initSertlikPage(){
  if(sertlikInitialized) return;
  sertlikInitialized = true;

  const search = document.getElementById('search-sertlik');
  const boxes  = Array.from(document.querySelectorAll('#sertlik-grid .box'));

  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase().trim();
      boxes.forEach(b=>{
        const hit = (b.dataset.point||'').toLowerCase().includes(q);
        b.style.display = hit ? '' : 'none';
      });
    });
  }

  boxes.forEach(b=> {
    b.addEventListener('click', ()=> openModal(b.dataset.point));
  });
  
  console.log('Sertlik sayfası init edildi, kutu sayısı:', boxes.length);
}

// ====== PH SAYFASI ======
let phInitialized = false;
function initPhPage(){
  if(phInitialized) return;
  phInitialized = true;

  const search = document.getElementById('search-ph');
  const boxes  = Array.from(document.querySelectorAll('#ph-grid .box'));

  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase().trim();
      boxes.forEach(b=>{
        const hit = (b.dataset.point||'').toLowerCase().includes(q);
        b.style.display = hit ? '' : 'none';
      });
    });
  }

  boxes.forEach(b=> {
    b.addEventListener('click', ()=> openModal(b.dataset.point));
  });
  
  console.log('Ph sayfası init edildi, kutu sayısı:', boxes.length);
}

// ====== İLETKENLİK SAYFASI ======
let iletkenlikInitialized = false;
function initIletkenlikPage(){
  if(iletkenlikInitialized) return;
  iletkenlikInitialized = true;

  const search = document.getElementById('search-iletkenlik');
  const boxes  = Array.from(document.querySelectorAll('#iletkenlik-grid .box'));

  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase().trim();
      boxes.forEach(b=>{
        const hit = (b.dataset.point||'').toLowerCase().includes(q);
        b.style.display = hit ? '' : 'none';
      });
    });
  }

  boxes.forEach(b=> {
    b.addEventListener('click', ()=> openModal(b.dataset.point));
  });
  
  console.log('İletkenlik sayfası init edildi, kutu sayısı:', boxes.length);
}

// ====== MODAL & TOAST ======
const overlay  = document.getElementById('overlay');
const modal    = document.getElementById('entry-modal');
const btnClose = document.getElementById('btn-close-modal');
const btnCancel= document.getElementById('btn-cancel');
const toast    = document.getElementById('toast');
const form     = document.getElementById('entry-form');

function openModal(prefillPoint){
  if(prefillPoint) document.getElementById('point').value = prefillPoint;

  const modalTitle = document.getElementById('modalTitle');
  const unitInput = document.getElementById('unit');
  const valueInput = document.getElementById('value');
  
  const categoryTitles = {
    'klor': 'Klor Ölçüm Kaydı',
    'sertlik': 'Sertlik Ölçüm Kaydı',
    'ph': 'Ph Ölçüm Kaydı',
    'iletkenlik': 'İletkenlik Ölçüm Kaydı',
    'mikro': 'Mikro Biyoloji Kaydı'
  };
  
  if(modalTitle) modalTitle.textContent = categoryTitles[currentSection] || 'Ölçüm Kaydı';
  
  if(currentSection === 'klor'){
    unitInput.value = 'ppm';
    unitInput.readOnly = true;
    unitInput.style.background = '#f5f5f5';
    unitInput.style.cursor = 'not-allowed';
    valueInput.placeholder = 'Örn: 0.50';
    valueInput.step = '0.001';
    valueInput.min = '0';
    valueInput.max = '';
  } else if(currentSection === 'sertlik'){
    unitInput.value = 'mg/L CaCO₃';
    unitInput.readOnly = true;
    unitInput.style.background = '#f5f5f5';
    unitInput.style.cursor = 'not-allowed';
    valueInput.placeholder = 'Örn: 180.0';
    valueInput.step = '0.1';
    valueInput.min = '0';
    valueInput.max = '';
  } else if(currentSection === 'ph'){
    unitInput.value = 'pH';
    unitInput.readOnly = true;
    unitInput.style.background = '#f5f5f5';
    unitInput.style.cursor = 'not-allowed';
    valueInput.placeholder = 'Örn: 7.0';
    valueInput.step = '0.1';
    valueInput.min = '0';
    valueInput.max = '14';
  } else if(currentSection === 'iletkenlik'){
    unitInput.value = 'µS/cm';
    unitInput.readOnly = true;
    unitInput.style.background = '#f5f5f5';
    unitInput.style.cursor = 'not-allowed';
    valueInput.placeholder = 'Örn: 250.0';
    valueInput.step = '0.1';
    valueInput.min = '0';
    valueInput.max = '';
  }

  const now = new Date();
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  
  const hh = String(now.getHours()).padStart(2,"0");
  const mm = String(now.getMinutes()).padStart(2,"0");
  const ss = String(now.getSeconds()).padStart(2,"0");
  
  if(dateInput) dateInput.value = now.toISOString().slice(0,10);
  if(timeInput) timeInput.value = `${hh}:${mm}:${ss}`;

  const userHidden = document.getElementById('user');
  const userText   = (document.getElementById('logged-user')?.textContent || '').replace(/^Kullanıcı:\s*/,'');
  userHidden.value = userText || 'Bilinmiyor';

  overlay.style.display = 'block';
  modal.style.display   = 'flex';
  document.getElementById('value').focus();
}

function closeModal(){
  overlay.style.display = 'none';
  modal.style.display   = 'none';
  if(form) form.reset();
}

if(btnClose)  btnClose.addEventListener('click', closeModal);
if(btnCancel) btnCancel.addEventListener('click', closeModal);
if(overlay)   overlay.addEventListener('click', closeModal);

if(form){
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const payload = {
      point : document.getElementById('point').value,
      value : parseFloat(document.getElementById('value').value),
      unit  : document.getElementById('unit').value,
      date  : document.getElementById('date').value,
      time  : document.getElementById('time').value,
      note  : document.getElementById('note').value,
      user  : document.getElementById('user').value
    };

    const categoryMap = {
      home:'Anasayfa', klor:'Klor', sertlik:'Sertlik', ph:'Ph',
      iletkenlik:'İletkenlik', mikro:'Mikro Biyoloji'
    };
    
    const entry = {
      category: categoryMap[currentSection] || currentSection,
      point: payload.point,
      value: payload.value,
      unit : payload.unit,
      date : payload.date,
      time : payload.time,
      user : payload.user,
      note : payload.note
    };

    await addRecent(entry);
    closeModal();
  });
}

function showToast(msg){
  if(!toast) return;
  toast.textContent = msg || 'İşlem başarılı.';
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 3000);
}

// ====== TREND (Chart.js) ======
const trendSelect = document.getElementById('trend-category');
const trendCanvas = document.getElementById('trendChart');
let trendChart = null;

const categoryKeyToName = {
  klor:'Klor', sertlik:'Sertlik', ph:'Ph', iletkenlik:'İletkenlik', mikro:'Mikro Biyoloji'
};

function buildTrendData(categoryKey){
  const name = categoryKeyToName[categoryKey];
  const all  = getRecent();
  const rows = all.filter(r => r.category === name && r.value !== undefined && r.value !== null && r.value !== '')
                  .map(r => ({
                    label: `${r.date} ${r.time}`,
                    value: parseFloat(r.value),
                    unit : r.unit || '',
                    user : r.user || '',
                    date : r.date,
                    time : r.time,
                    point: r.point || '',
                    note : r.note || ''
                  }))
                  .filter(r => !Number.isNaN(r.value));

  rows.sort((a,b)=> (a.label > b.label ? 1 : -1));
  return rows;
}

function drawTrend(categoryKey){
  const dataRows = buildTrendData(categoryKey);
  const labels   = dataRows.map(r => r.label);
  const values   = dataRows.map(r => r.value);

  if(trendChart){ trendChart.destroy(); }

  const colorMap = {
    klor: { 
      gradient: ['rgba(46, 125, 50, 0.8)', 'rgba(27, 94, 32, 1)'],
      border: '#1b5e20',
      point: '#2e7d32',
      pointHover: '#145214'
    },
    sertlik: { 
      gradient: ['rgba(33, 150, 243, 0.8)', 'rgba(25, 118, 210, 1)'],
      border: '#1976d2',
      point: '#2196f3',
      pointHover: '#0d47a1'
    },
    ph: { 
      gradient: ['rgba(156, 39, 176, 0.8)', 'rgba(123, 31, 162, 1)'],
      border: '#7b1fa2',
      point: '#9c27b0',
      pointHover: '#4a148c'
    },
    iletkenlik: { 
      gradient: ['rgba(255, 152, 0, 0.8)', 'rgba(245, 124, 0, 1)'],
      border: '#f57c00',
      point: '#ff9800',
      pointHover: '#e65100'
    },
    mikro: { 
      gradient: ['rgba(233, 30, 99, 0.8)', 'rgba(194, 24, 91, 1)'],
      border: '#c2185b',
      point: '#e91e63',
      pointHover: '#880e4f'
    }
  };

  const colors = colorMap[categoryKey] || colorMap.klor;

  const ctx = trendCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, colors.gradient[0]);
  gradient.addColorStop(1, colors.gradient[1]);

  trendChart = new Chart(trendCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${categoryKeyToName[categoryKey]} Trendi`,
        data: values,
        borderColor: colors.border,
        backgroundColor: gradient,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: colors.point,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: colors.pointHover,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { 
        mode: 'index', 
        intersect: false 
      },
      scales: {
        x: { 
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: { 
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true, 
            autoSkipPadding: 20,
            font: { size: 11, weight: '600' },
            color: '#666'
          }
        },
        y: { 
          beginAtZero: false,
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
            drawBorder: false
          },
          ticks: {
            font: { size: 12, weight: '700' },
            color: '#444',
            padding: 8
          }
        }
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          align: 'start',
          labels: {
            boxWidth: 0,
            font: { size: 14, weight: '800' },
            color: colors.border,
            padding: 16
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          titleFont: { size: 13, weight: '700' },
          bodyFont: { size: 12 },
          padding: 14,
          cornerRadius: 10,
          displayColors: false,
          borderColor: colors.border,
          borderWidth: 2,
          callbacks: {
            title: (ctx) => {
              const idx = ctx[0].dataIndex;
              const r = buildTrendData(categoryKey)[idx];
              return `${r.date} - ${r.time}`;
            },
            label: (ctx) => {
              const idx = ctx.dataIndex;
              const r = buildTrendData(categoryKey)[idx];
              return [
                `Nokta: ${r.point}`,
                `Değer: ${r.value}${r.unit ? ' ' + r.unit : ''}`,
                `Kullanıcı: ${r.user}`
              ];
            },
            afterLabel: (ctx) => {
              const idx = ctx.dataIndex;
              const r = buildTrendData(categoryKey)[idx];
              if (r.note) return `Not: ${r.note}`;
              return '';
            }
          }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeInOutQuart'
      }
    }
  });
}

if(trendSelect){
  trendSelect.addEventListener('change', ()=> drawTrend(trendSelect.value));
}

function updateTrendFromStorage(){
  if(trendSelect) drawTrend(trendSelect.value);
}

// ====== MOBİL MENÜ SCRIM ======
(function initMobileMenuScrim(){
  const scrim = document.createElement('div');
  scrim.className = 'menu-scrim';
  document.body.appendChild(scrim);

  scrim.addEventListener('click', ()=>{
    document.body.classList.remove('mobile-menu-open');
  });

  window.addEventListener('resize', ()=>{
    if (!window.matchMedia('(max-width: 768px)').matches){
      document.body.classList.remove('mobile-menu-open');
    }
  });
})();