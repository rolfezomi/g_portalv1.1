const { createClient } = require('@supabase/supabase-js')

async function sendDailyReport() {
  try {
    console.log('📊 Günlük rapor gönderimi başlıyor...')

    // Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Verileri çek
    const { data: measurements, error } = await supabase
      .from('measurements')
      .select('id, category, point, value, unit, date, time, user, note')
      .order('id', { ascending: false })
      .limit(2000)

    if (error) throw error
    if (!measurements || measurements.length === 0) {
      throw new Error('Veritabanında hiç ölçüm verisi bulunamadı.')
    }

    console.log(`✅ ${measurements.length} ölçüm verisi çekildi`)

    // Tarih hesaplamaları (Turkish Time - UTC+3)
    const now = new Date()
    now.setHours(now.getHours() + 3)
    const today = now.toISOString().split('T')[0]

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDate = yesterday.toISOString().split('T')[0]

    const thisMonth = today.slice(0, 7)

    // Filtreleme
    const todayMeasurements = measurements.filter(m => m.date === today)
    const yesterdayMeasurements = measurements.filter(m => m.date === yesterdayDate)
    const thisMonthMeasurements = measurements.filter(m => m.date && m.date.startsWith(thisMonth))

    console.log(`📅 Bugün: ${todayMeasurements.length} ölçüm`)
    console.log(`📅 Dün: ${yesterdayMeasurements.length} ölçüm`)
    console.log(`📅 Bu ay: ${thisMonthMeasurements.length} ölçüm`)

    // ===== VERİ ANALİZİ =====

    // Kategori dağılımı
    const categoryStats = {}
    todayMeasurements.forEach(m => {
      const cat = m.category || 'Diğer'
      categoryStats[cat] = (categoryStats[cat] || 0) + 1
    })

    // Kontrol noktası dağılımı
    const pointStats = {}
    todayMeasurements.forEach(m => {
      const point = m.point || 'Belirtilmemiş'
      pointStats[point] = (pointStats[point] || 0) + 1
    })

    // Kullanıcı aktivitesi
    const userStats = {}
    todayMeasurements.forEach(m => {
      const user = m.user || 'Anonim'
      userStats[user] = (userStats[user] || 0) + 1
    })

    // Top 5 kontrol noktası
    const top5Points = Object.entries(pointStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    // Trend hesaplama
    const todayCount = todayMeasurements.length
    const yesterdayCount = yesterdayMeasurements.length
    const diff = todayCount - yesterdayCount
    const trendIcon = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
    const trendColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#6b7280'
    const trendPercent = yesterdayCount > 0
      ? Math.abs(((diff / yesterdayCount) * 100)).toFixed(1)
      : 0

    // Aylık ortalama
    const avgPerDay = (thisMonthMeasurements.length / now.getDate()).toFixed(1)

    // Tarih formatı
    const reportDate = now.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // ===== HTML RAPOR =====
    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Su Kalitesi Raporu</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    td { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px 0;">

        <!-- MAIN CONTAINER -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                📊 Günlük Su Kalitesi Raporu
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                ${reportDate}
              </p>
            </td>
          </tr>

          <!-- KPI CARDS -->
          <tr>
            <td style="padding: 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Bugün -->
                  <td width="48%" style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #10b981;">
                    <div style="font-size: 12px; color: #059669; font-weight: 600; margin-bottom: 8px;">BUGÜN</div>
                    <div style="font-size: 32px; font-weight: bold; color: #047857; margin-bottom: 5px;">${todayCount}</div>
                    <div style="font-size: 11px; color: #059669;">ölçüm</div>
                  </td>
                  <td width="4%"></td>
                  <!-- Dün -->
                  <td width="48%" style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                    <div style="font-size: 12px; color: #1d4ed8; font-weight: 600; margin-bottom: 8px;">DÜN</div>
                    <div style="font-size: 32px; font-weight: bold; color: #1e40af; margin-bottom: 5px;">${yesterdayCount}</div>
                    <div style="font-size: 11px; color: #1d4ed8;">ölçüm</div>
                  </td>
                </tr>
                <tr><td colspan="3" height="12"></td></tr>
                <tr>
                  <!-- Bu Ay -->
                  <td width="48%" style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
                    <div style="font-size: 12px; color: #d97706; font-weight: 600; margin-bottom: 8px;">BU AY</div>
                    <div style="font-size: 32px; font-weight: bold; color: #b45309; margin-bottom: 5px;">${thisMonthMeasurements.length}</div>
                    <div style="font-size: 11px; color: #d97706;">toplam ölçüm</div>
                  </td>
                  <td width="4%"></td>
                  <!-- Ortalama -->
                  <td width="48%" style="background-color: #f5f3ff; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #8b5cf6;">
                    <div style="font-size: 12px; color: #7c3aed; font-weight: 600; margin-bottom: 8px;">GÜN/ORT</div>
                    <div style="font-size: 32px; font-weight: bold; color: #6d28d9; margin-bottom: 5px;">${avgPerDay}</div>
                    <div style="font-size: 11px; color: #7c3aed;">ölçüm/gün</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TREND -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${diff >= 0 ? '#d1fae5' : '#fee2e2'}; padding: 15px; border-radius: 8px;">
                <tr>
                  <td align="center">
                    <span style="font-size: 24px; margin-right: 8px;">${trendIcon}</span>
                    <span style="color: ${trendColor}; font-weight: bold; font-size: 16px;">
                      ${diff > 0 ? '+' : ''}${diff} ölçüm (${diff >= 0 ? '+' : ''}${trendPercent}%) dün'e göre
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${Object.keys(categoryStats).length > 0 ? `
          <!-- KATEGORİ DAĞILIMI -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: bold;">
                📋 Kategori Dağılımı
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Kategori</td>
                  <td align="right" style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Adet</td>
                  <td align="right" style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">%</td>
                </tr>
                ${Object.entries(categoryStats)
                  .sort(([,a], [,b]) => b - a)
                  .map(([cat, count]) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #374151;">${cat}</td>
                  <td align="right" style="padding: 12px; color: #667eea; font-weight: 600;">${count}</td>
                  <td align="right" style="padding: 12px; color: #6b7280;">${((count / todayCount) * 100).toFixed(1)}%</td>
                </tr>
                  `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          ${top5Points.length > 0 ? `
          <!-- TOP 5 KONTROL NOKTALARI -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: bold;">
                🎯 En Çok Ölçüm Yapılan Noktalar
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Sıra</td>
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Kontrol Noktası</td>
                  <td align="right" style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Ölçüm</td>
                </tr>
                ${top5Points.map(([point, count], index) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #6b7280; font-weight: 600;">#${index + 1}</td>
                  <td style="padding: 12px; color: #374151;">${point}</td>
                  <td align="right" style="padding: 12px; color: #667eea; font-weight: 600;">${count}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          ${Object.keys(userStats).length > 0 ? `
          <!-- KULLANICI AKTİVİTESİ -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: bold;">
                👥 Kullanıcı Aktivitesi
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Kullanıcı</td>
                  <td align="right" style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Ölçüm</td>
                </tr>
                ${Object.entries(userStats)
                  .sort(([,a], [,b]) => b - a)
                  .map(([user, count]) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #374151;">${user}</td>
                  <td align="right" style="padding: 12px; color: #667eea; font-weight: 600;">${count}</td>
                </tr>
                  `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Glohe Portal - Su Kalitesi Kontrol Sistemi<br>
                <span style="font-size: 11px;">Bu rapor her gün otomatik olarak gönderilmektedir.</span>
              </p>
            </td>
          </tr>

        </table>
        <!-- END MAIN CONTAINER -->

      </td>
    </tr>
  </table>
</body>
</html>
    `

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
        subject: `📊 Günlük Rapor: ${todayCount} Ölçüm - ${reportDate}`,
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

sendDailyReport()
