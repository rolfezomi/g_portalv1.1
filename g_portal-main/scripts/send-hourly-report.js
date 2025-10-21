const { createClient } = require('@supabase/supabase-js')

async function sendHourlyReport() {
  try {
    console.log('⏰ Saatlik rapor gönderimi başlıyor...')

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
      .limit(1000)

    if (error) throw error
    if (!measurements || measurements.length === 0) {
      throw new Error('Veritabanında hiç ölçüm verisi bulunamadı.')
    }

    console.log(`✅ ${measurements.length} ölçüm verisi çekildi`)

    // Tarih hesaplamaları (Turkish Time - UTC+3)
    const now = new Date()
    now.setHours(now.getHours() + 3)
    const today = now.toISOString().split('T')[0]
    const currentHour = now.getHours()

    // Son 1 saat ve önceki saat
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000)

    // Filtreleme
    const lastHourMeasurements = measurements.filter(m => {
      const measurementDateTime = new Date(`${m.date}T${m.time}`)
      return measurementDateTime >= oneHourAgo && measurementDateTime <= now
    })

    const previousHourMeasurements = measurements.filter(m => {
      const measurementDateTime = new Date(`${m.date}T${m.time}`)
      return measurementDateTime >= twoHoursAgo && measurementDateTime < oneHourAgo
    })

    const todayMeasurements = measurements.filter(m => m.date === today)

    console.log(`⏰ Son 1 saat: ${lastHourMeasurements.length} ölçüm`)
    console.log(`⏰ Önceki saat: ${previousHourMeasurements.length} ölçüm`)
    console.log(`📅 Bugün toplam: ${todayMeasurements.length} ölçüm`)

    // ===== VERİ ANALİZİ =====

    // Kategori dağılımı (son 1 saat)
    const categoryStats = {}
    lastHourMeasurements.forEach(m => {
      const cat = m.category || 'Diğer'
      categoryStats[cat] = (categoryStats[cat] || 0) + 1
    })

    // Kontrol noktası dağılımı (son 1 saat)
    const pointStats = {}
    lastHourMeasurements.forEach(m => {
      const point = m.point || 'Belirtilmemiş'
      pointStats[point] = (pointStats[point] || 0) + 1
    })

    // Kullanıcı aktivitesi (son 1 saat)
    const userStats = {}
    lastHourMeasurements.forEach(m => {
      const user = m.user || 'Anonim'
      userStats[user] = (userStats[user] || 0) + 1
    })

    // Aktif kontrol noktaları
    const activePoints = Object.entries(pointStats)
      .sort(([,a], [,b]) => b - a)

    // Trend hesaplama
    const lastHourCount = lastHourMeasurements.length
    const previousHourCount = previousHourMeasurements.length
    const diff = lastHourCount - previousHourCount
    const trendIcon = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
    const trendColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#6b7280'
    const trendPercent = previousHourCount > 0
      ? Math.abs(((diff / previousHourCount) * 100)).toFixed(1)
      : 0

    // Saatlik ortalama (bugün)
    const avgPerHour = (todayMeasurements.length / currentHour).toFixed(1)

    // Tarih formatı
    const reportDateTime = now.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const currentHourStr = now.toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const previousHourStr = oneHourAgo.toLocaleString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    // ===== HTML RAPOR =====
    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saatlik Su Kalitesi Raporu</title>
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
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ⏰ Saatlik Su Kalitesi Raporu
              </h1>
              <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 16px;">
                ${reportDateTime}
              </p>
            </td>
          </tr>

          <!-- KPI CARDS -->
          <tr>
            <td style="padding: 25px 30px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <!-- Son 1 Saat -->
                  <td width="48%" style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
                    <div style="font-size: 12px; color: #d97706; font-weight: 600; margin-bottom: 8px;">SON 1 SAAT</div>
                    <div style="font-size: 32px; font-weight: bold; color: #b45309; margin-bottom: 5px;">${lastHourCount}</div>
                    <div style="font-size: 11px; color: #d97706;">${previousHourStr} - ${currentHourStr}</div>
                  </td>
                  <td width="4%"></td>
                  <!-- Önceki Saat -->
                  <td width="48%" style="background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                    <div style="font-size: 12px; color: #1d4ed8; font-weight: 600; margin-bottom: 8px;">ÖNCEKİ SAAT</div>
                    <div style="font-size: 32px; font-weight: bold; color: #1e40af; margin-bottom: 5px;">${previousHourCount}</div>
                    <div style="font-size: 11px; color: #1d4ed8;">ölçüm</div>
                  </td>
                </tr>
                <tr><td colspan="3" height="12"></td></tr>
                <tr>
                  <!-- Bugün Toplam -->
                  <td width="48%" style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #10b981;">
                    <div style="font-size: 12px; color: #059669; font-weight: 600; margin-bottom: 8px;">BUGÜN TOPLAM</div>
                    <div style="font-size: 32px; font-weight: bold; color: #047857; margin-bottom: 5px;">${todayMeasurements.length}</div>
                    <div style="font-size: 11px; color: #059669;">ölçüm</div>
                  </td>
                  <td width="4%"></td>
                  <!-- Saatlik Ortalama -->
                  <td width="48%" style="background-color: #f5f3ff; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #8b5cf6;">
                    <div style="font-size: 12px; color: #7c3aed; font-weight: 600; margin-bottom: 8px;">SAAT/ORT</div>
                    <div style="font-size: 32px; font-weight: bold; color: #6d28d9; margin-bottom: 5px;">${avgPerHour}</div>
                    <div style="font-size: 11px; color: #7c3aed;">ölçüm/saat</div>
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
                      ${diff > 0 ? '+' : ''}${diff} ölçüm (${diff >= 0 ? '+' : ''}${trendPercent}%) önceki saate göre
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
                📋 Kategori Dağılımı (Son 1 Saat)
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
                  <td align="right" style="padding: 12px; color: #f59e0b; font-weight: 600;">${count}</td>
                  <td align="right" style="padding: 12px; color: #6b7280;">${((count / lastHourCount) * 100).toFixed(1)}%</td>
                </tr>
                  `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          ${activePoints.length > 0 ? `
          <!-- AKTİF KONTROL NOKTALARI -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: bold;">
                🎯 Aktif Kontrol Noktaları (Son 1 Saat)
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Kontrol Noktası</td>
                  <td align="right" style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Ölçüm</td>
                </tr>
                ${activePoints.map(([point, count]) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #374151;">${point}</td>
                  <td align="right" style="padding: 12px; color: #f59e0b; font-weight: 600;">${count}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          ${Object.keys(userStats).length > 0 ? `
          <!-- KULLANICI AKTİVİTESİ -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: bold;">
                👥 Aktif Kullanıcılar (Son 1 Saat)
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
                  <td align="right" style="padding: 12px; color: #f59e0b; font-weight: 600;">${count}</td>
                </tr>
                  `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          ${lastHourMeasurements.length > 0 ? `
          <!-- DETAYLI ÖLÇÜM LİSTESİ -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: bold;">
                📊 Detaylı Ölçüm Listesi (Son 10)
              </h2>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Saat</td>
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Kategori</td>
                  <td style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Nokta</td>
                  <td align="right" style="padding: 12px; font-weight: 600; font-size: 13px; color: #6b7280;">Değer</td>
                </tr>
                ${lastHourMeasurements.slice(0, 10).map(m => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; color: #6b7280; font-size: 12px;">${m.time || '-'}</td>
                  <td style="padding: 12px; color: #374151; font-size: 12px;">${m.category || '-'}</td>
                  <td style="padding: 12px; color: #374151; font-size: 12px;">${m.point || '-'}</td>
                  <td align="right" style="padding: 12px; color: #f59e0b; font-weight: 600; font-size: 12px;">${m.value} ${m.unit || ''}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : `
          <!-- BOŞ DURUM -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <div style="background-color: #fef3c7; padding: 30px; border-radius: 8px; border: 2px dashed #f59e0b;">
                <p style="margin: 0; color: #d97706; font-size: 18px; font-weight: bold;">
                  ℹ️ Son 1 saatte ölçüm yapılmadı
                </p>
                <p style="margin: 10px 0 0 0; color: #b45309; font-size: 14px;">
                  Sistem aktif, ölçüm bekleniyor...
                </p>
              </div>
            </td>
          </tr>
          `}

          <!-- FOOTER -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Glohe Portal - Su Kalitesi Kontrol Sistemi<br>
                <span style="font-size: 11px;">Bu rapor her saat otomatik olarak gönderilmektedir.</span>
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
        subject: `⏰ Saatlik Rapor: ${lastHourCount} Ölçüm - ${currentHourStr}`,
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

sendHourlyReport()
