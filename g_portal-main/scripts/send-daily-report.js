const { createClient } = require('@supabase/supabase-js');

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// HTML Email Template
function generateReportHTML(data) {
  const { kpis, categories, topPoints, recentActivities, reportDate } = data;

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Su Kalitesi Raporu</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 32px;
      text-align: center;
      color: white;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 32px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .kpi-card {
      background: linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%);
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    .kpi-card.success {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-left-color: #10b981;
    }
    .kpi-card.warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left-color: #f59e0b;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 32px;
      font-weight: 900;
      color: #111827;
      line-height: 1;
    }
    .kpi-trend {
      font-size: 12px;
      font-weight: 600;
      color: #10b981;
      margin-top: 8px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #f3f4f6;
    }
    .category-list {
      margin-bottom: 32px;
    }
    .category-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .category-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .category-icon {
      font-size: 24px;
    }
    .category-name {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }
    .category-count {
      font-size: 12px;
      color: #6b7280;
    }
    .category-percent {
      font-size: 16px;
      font-weight: 800;
      color: #667eea;
      padding: 4px 12px;
      background: white;
      border-radius: 6px;
    }
    .top-list {
      margin-bottom: 32px;
    }
    .top-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .top-rank {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      color: white;
    }
    .rank-1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
    .rank-2 { background: linear-gradient(135deg, #9ca3af, #6b7280); }
    .rank-3 { background: linear-gradient(135deg, #fb923c, #f97316); }
    .rank-other { background: linear-gradient(135deg, #667eea, #764ba2); }
    .top-name {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    .top-count {
      font-size: 18px;
      font-weight: 800;
      color: #667eea;
    }
    .table-wrapper {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin-bottom: 32px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead {
      background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
    }
    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    td {
      padding: 12px 16px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    tbody tr:hover {
      background: #fafbfc;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 32px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .footer strong {
      color: #111827;
    }
    @media only screen and (max-width: 600px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      .container {
        margin: 0;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Günlük Su Kalitesi Raporu</h1>
      <p>${reportDate}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Bugünkü Ölçümler</div>
          <div class="kpi-value">${kpis.todayCount}</div>
          <div class="kpi-trend">${kpis.todayTrend}</div>
        </div>
        <div class="kpi-card success">
          <div class="kpi-label">Bu Ay Toplam</div>
          <div class="kpi-value">${kpis.monthCount}</div>
          <div class="kpi-trend">Bu ay</div>
        </div>
        <div class="kpi-card warning">
          <div class="kpi-label">Günlük Ortalama</div>
          <div class="kpi-value">${kpis.avgDaily}</div>
          <div class="kpi-trend">Son 30 gün</div>
        </div>
      </div>

      <!-- Kategori Analizi -->
      <h2 class="section-title">Kategori Dağılımı</h2>
      <div class="category-list">
        ${categories.map(cat => `
          <div class="category-item">
            <div class="category-left">
              <div class="category-icon">${cat.icon}</div>
              <div>
                <div class="category-name">${cat.name}</div>
                <div class="category-count">${cat.count} ölçüm</div>
              </div>
            </div>
            <div class="category-percent">${cat.percent}%</div>
          </div>
        `).join('')}
      </div>

      <!-- Top 5 Kontrol Noktaları -->
      <h2 class="section-title">En Çok Kontrol Edilen Noktalar</h2>
      <div class="top-list">
        ${topPoints.map((point, index) => `
          <div class="top-item">
            <div class="top-rank rank-${index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : 'other'}">${index + 1}</div>
            <div class="top-name">${point.name}</div>
            <div class="top-count">${point.count}</div>
          </div>
        `).join('')}
      </div>

      <!-- Son Aktiviteler -->
      <h2 class="section-title">Son 10 Aktivite</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tarih & Saat</th>
              <th>Kategori</th>
              <th>Kontrol Noktası</th>
              <th>Değer</th>
              <th>Kullanıcı</th>
            </tr>
          </thead>
          <tbody>
            ${recentActivities.map(activity => `
              <tr>
                <td>${activity.datetime}</td>
                <td>${activity.category}</td>
                <td>${activity.point}</td>
                <td><strong>${activity.value}</strong></td>
                <td>${activity.user}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Glohe Portal</strong> - Su Kalitesi Kontrol Sistemi</p>
      <p style="margin-top: 8px;">Bu rapor otomatik olarak oluşturulmuştur.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Ana Fonksiyon
async function sendDailyReport() {
  try {
    console.log('📊 Günlük rapor hazırlanıyor...');

    // Bugünün tarihi
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    const reportDate = new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Tüm ölçümleri çek
    const { data: measurements, error } = await supabase
      .from('measurements')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) throw error;

    // KPI Hesaplamaları
    const todayMeasurements = measurements.filter(m => m.date === today);
    const monthMeasurements = measurements.filter(m => m.date && m.date.startsWith(thisMonth));
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const last30DaysMeasurements = measurements.filter(m => m.date >= last30Days);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];
    const yesterdayMeasurements = measurements.filter(m => m.date === yesterdayDate);

    const diff = todayMeasurements.length - yesterdayMeasurements.length;
    const todayTrend = diff > 0
      ? `▲ +${diff} artış`
      : diff < 0
      ? `▼ ${Math.abs(diff)} azalış`
      : 'Değişim yok';

    const kpis = {
      todayCount: todayMeasurements.length,
      monthCount: monthMeasurements.length,
      avgDaily: Math.round(last30DaysMeasurements.length / 30),
      todayTrend
    };

    // Kategori Dağılımı
    const categoryIcons = {
      'klor': '💧',
      'ph': '⚗️',
      'iletkenlik': '⚡',
      'sertlik': '🔬',
      'kazan-mikser': '📊'
    };

    const categoryCounts = {};
    measurements.forEach(m => {
      const cat = m.category || 'Diğer';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const totalMeasurements = measurements.length;
    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
        percent: ((count / totalMeasurements) * 100).toFixed(1),
        icon: categoryIcons[name.toLowerCase()] || '📊'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top 5 Kontrol Noktaları
    const pointCounts = {};
    measurements.forEach(m => {
      const point = m.point || 'Bilinmeyen';
      pointCounts[point] = (pointCounts[point] || 0) + 1;
    });

    const topPoints = Object.entries(pointCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Son 10 Aktivite
    const recentActivities = measurements.slice(0, 10).map(m => ({
      datetime: `${m.date} ${m.time}`,
      category: (m.category || 'N/A').charAt(0).toUpperCase() + (m.category || 'N/A').slice(1),
      point: m.point || 'N/A',
      value: m.value || 'N/A',
      user: m.user || 'Sistem'
    }));

    // HTML Oluştur
    const htmlContent = generateReportHTML({
      kpis,
      categories,
      topPoints,
      recentActivities,
      reportDate
    });

    // Resend ile mail gönder
    console.log('📧 Email gönderiliyor...')

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Glohe Portal <onboarding@resend.dev>',
        to: [process.env.RECIPIENT_EMAIL],
        subject: `📊 Günlük Su Kalitesi Raporu - ${reportDate}`,
        html: htmlContent,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('❌ Email gönderimi başarısız:', emailResult)
      throw new Error(`Email gönderimi başarısız: ${JSON.stringify(emailResult)}`)
    }

    console.log('✅ Email başarıyla gönderildi!')
    console.log(`📬 Email ID: ${emailResult.id}`)
    console.log(`📨 Alıcı: ${process.env.RECIPIENT_EMAIL}`)

    process.exit(0)

  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

// Çalıştır
sendDailyReport();
