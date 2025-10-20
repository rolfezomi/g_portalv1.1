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
      .limit(500)

    if (error) throw error
    if (!measurements || measurements.length === 0) {
      throw new Error('Veritabanında hiç ölçüm verisi bulunamadı.')
    }

    console.log(`✅ ${measurements.length} ölçüm verisi çekildi`)

    // Tarih hesaplamaları (Turkish Time - UTC+3)
    const nowTR = new Date()
    nowTR.setHours(nowTR.getHours() + 3)
    const today = nowTR.toISOString().split('T')[0]
    const currentHour = nowTR.getHours()
    const currentTime = `${String(currentHour).padStart(2, '0')}:00`

    const todayMeasurements = measurements.filter(m => m.date === today)

    // Son 1 saatteki ölçümler
    const oneHourAgo = new Date(nowTR.getTime() - 60 * 60 * 1000)
    const oneHourAgoTime = `${String(oneHourAgo.getHours()).padStart(2, '0')}:${String(oneHourAgo.getMinutes()).padStart(2, '0')}`
    const lastHourMeasurements = todayMeasurements.filter(m => {
      if (!m.time) return false
      return m.time >= oneHourAgoTime
    })

    console.log(`📅 Bugün: ${todayMeasurements.length} ölçüm`)
    console.log(`⏱️ Son 1 saat: ${lastHourMeasurements.length} ölçüm`)

    // Rapor tarihi
    const reportDate = nowTR.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // Kategori analizi (son 1 saat)
    const categoryCounts = {}
    lastHourMeasurements.forEach(m => {
      const cat = m.category || 'Diğer'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    const categoryList = Object.entries(categoryCounts)
      .map(([name, count]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
            ${name.charAt(0).toUpperCase() + name.slice(1)}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right; font-size: 14px;">
            ${count}
          </td>
        </tr>
      `).join('')

    // Son 5 ölçüm
    const recentMeasurements = lastHourMeasurements.slice(0, 5).map(m => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
          ${m.time || 'N/A'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 13px;">
          ${(m.category || 'N/A').charAt(0).toUpperCase() + (m.category || 'N/A').slice(1)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 13px;">
          ${m.point || 'N/A'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: 600; font-size: 13px;">
          ${m.value || 'N/A'} ${m.unit || ''}
        </td>
      </tr>
    `).join('')

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saatlik Su Kalitesi Raporu</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse; border-spacing: 0;}
    .outlook-group-fix {width: 100% !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                💧 GLOHE PORTAL • Saatlik Durum Raporu
              </h1>
              <p style="margin: 8px 0 0 0; color: #cffafe; font-size: 14px;">
                ${reportDate} • ${currentTime}
              </p>
            </td>
          </tr>

          <!-- Stats Cards -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; padding: 20px; border-left: 4px solid #10b981;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">
                      SON 1 SAAT
                    </p>
                    <p style="margin: 0; font-size: 32px; font-weight: 900; color: #047857; line-height: 1;">
                      ${lastHourMeasurements.length}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #059669;">
                      Yeni Ölçüm
                    </p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); border-radius: 8px; padding: 20px; border-left: 4px solid #0891b2;">
                    <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 700; color: #164e63; text-transform: uppercase; letter-spacing: 0.5px;">
                      BUGÜN TOPLAM
                    </p>
                    <p style="margin: 0; font-size: 32px; font-weight: 900; color: #155e75; line-height: 1;">
                      ${todayMeasurements.length}
                    </p>
                    <p style="margin: 8px 0 0 0; font-size: 12px; color: #0891b2;">
                      Toplam Ölçüm
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Category Breakdown (if any measurements in last hour) -->
          ${lastHourMeasurements.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #111827;">
                📊 Kategori Dağılımı (Son 1 Saat)
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; overflow: hidden;">
                ${categoryList || '<tr><td style="padding: 20px; text-align: center; color: #9ca3af;">Veri yok</td></tr>'}
              </table>
            </td>
          </tr>

          <!-- Recent Measurements -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #111827;">
                🕐 Son Ölçümler
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Saat
                  </th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kategori
                  </th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Nokta
                  </th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Değer
                  </th>
                </tr>
                ${recentMeasurements || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">Henüz ölçüm yok</td></tr>'}
              </table>
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  ⚠️ Son 1 saatte yeni ölçüm bulunmuyor
                </p>
              </div>
            </td>
          </tr>
          `}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #059669; font-size: 12px; font-weight: 600;">
                💧 GLOHE PORTAL
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Su Kalitesi Kontrol Sistemi
              </p>
              <p style="margin: 8px 0 0 0; color: #d1d5db; font-size: 11px;">
                Otomatik saatlik rapor • Her saat başı gönderilir
              </p>
            </td>
          </tr>

        </table>
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
        subject: `💧 GLOHE PORTAL • Saatlik Durum Raporu - ${reportDate} ${currentTime}`,
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
sendHourlyReport()
