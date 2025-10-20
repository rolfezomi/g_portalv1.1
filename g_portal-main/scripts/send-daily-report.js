const { createClient } = require('@supabase/supabase-js')

async function sendDailyReport() {
  try {
    console.log('📊 Detaylı günlük rapor gönderimi başlıyor...')

    // Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Tüm verileri çek
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
    const nowTR = new Date()
    nowTR.setHours(nowTR.getHours() + 3)
    const today = nowTR.toISOString().split('T')[0]
    const currentTime = `${String(nowTR.getHours()).padStart(2, '0')}:${String(nowTR.getMinutes()).padStart(2, '0')}`

    // Bugünkü tüm ölçümler
    const todayMeasurements = measurements.filter(m => m.date === today)

    // Aylık ölçümler (bu ay)
    const currentMonth = today.substring(0, 7) // YYYY-MM
    const monthlyMeasurements = measurements.filter(m => m.date && m.date.startsWith(currentMonth))

    // Son 30 gün
    const thirtyDaysAgo = new Date(nowTR.getTime() - 30 * 24 * 60 * 60 * 1000)
    thirtyDaysAgo.setHours(thirtyDaysAgo.getHours() + 3)
    const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split('T')[0]
    const last30DaysMeasurements = measurements.filter(m => m.date >= thirtyDaysAgoDate)

    console.log(`📅 Bugün: ${todayMeasurements.length} ölçüm`)
    console.log(`📆 Bu Ay: ${monthlyMeasurements.length} ölçüm`)
    console.log(`📊 Son 30 Gün: ${last30DaysMeasurements.length} ölçüm`)

    // Rapor tarihi
    const reportDate = nowTR.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    // 1. BUGÜNKÜ KATEGORİ ANALİZİ
    const categoryAnalysis = {}
    const categoryPoints = {}
    todayMeasurements.forEach(m => {
      const cat = m.category || 'Diğer'
      const point = m.point || 'Bilinmeyen'

      if (!categoryAnalysis[cat]) {
        categoryAnalysis[cat] = 0
        categoryPoints[cat] = new Set()
      }
      categoryAnalysis[cat]++
      categoryPoints[cat].add(point)
    })

    // Kategori ikonları
    const categoryIcons = {
      'ph': '⚗️',
      'klor': '🧪',
      'sıcaklık': '🌡️',
      'bulanıklık': '💧',
      'oksijen': '🫧',
      'iletkenlik': '⚡',
      'diğer': '📊'
    }

    const todayCategories = Object.entries(categoryAnalysis)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const icon = categoryIcons[name.toLowerCase()] || '📊'
        const pointCount = categoryPoints[name].size
        return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 20px; margin-right: 8px;">${icon}</span>
            <span style="color: #374151; font-size: 14px; font-weight: 600;">
              ${name.charAt(0).toUpperCase() + name.slice(1)}
            </span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="color: #059669; font-weight: 700; font-size: 16px;">
              ${count}
            </span>
            <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">ölçüm</span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="color: #0891b2; font-weight: 700; font-size: 16px;">
              ${pointCount}
            </span>
            <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">nokta</span>
          </td>
        </tr>
        `
      }).join('')

    // 2. BUGÜN KONTROL EDİLEN NOKTALAR
    const todayPoints = {}
    todayMeasurements.forEach(m => {
      const point = m.point || 'Bilinmeyen'
      todayPoints[point] = (todayPoints[point] || 0) + 1
    })

    const todayTopPoints = Object.entries(todayPoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([point, count], index) => `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
            <span style="display: inline-block; width: 24px; height: 24px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700; color: #059669; margin-right: 8px;">
              ${index + 1}
            </span>
            <span style="color: #374151; font-size: 14px; font-weight: 600;">
              ${point}
            </span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <span style="color: #059669; font-weight: 700; font-size: 16px;">
              ${count}
            </span>
            <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">kez</span>
          </td>
        </tr>
      `).join('')

    // 3. BUGÜNKÜ KULLANICI PERFORMANSI
    const userPerformance = {}
    const userCategories = {}
    todayMeasurements.forEach(m => {
      const user = m.user || 'Bilinmeyen'
      const cat = m.category || 'Diğer'

      if (!userPerformance[user]) {
        userPerformance[user] = 0
        userCategories[user] = new Set()
      }
      userPerformance[user]++
      userCategories[user].add(cat)
    })

    const sortedUsers = Object.entries(userPerformance)
      .sort((a, b) => b[1] - a[1])

    const topUser = sortedUsers.length > 0 ? sortedUsers[0][0] : null

    const userPerformanceList = sortedUsers.map(([user, count]) => {
      const categoryCount = userCategories[user].size
      const isTop = user === topUser
      return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #374151; font-size: 14px; font-weight: 600;">
              ${user}
            </span>
            ${isTop ? '<span style="margin-left: 8px; font-size: 16px;">🏆</span>' : ''}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="color: #059669; font-weight: 700; font-size: 16px;">
              ${count}
            </span>
            <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">ölçüm</span>
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <span style="color: #0891b2; font-weight: 700; font-size: 16px;">
              ${categoryCount}
            </span>
            <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">kategori</span>
          </td>
        </tr>
      `
    }).join('')

    // 4. EN ÇOK KONTROL EDİLEN NOKTALAR (TÜM ZAMANLAR)
    const allTimePoints = {}
    measurements.forEach(m => {
      const point = m.point || 'Bilinmeyen'
      allTimePoints[point] = (allTimePoints[point] || 0) + 1
    })

    const rankBadges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
    const topAllTimePoints = Object.entries(allTimePoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([point, count], index) => `
        <tr>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb;">
            <span style="font-size: 24px; margin-right: 8px;">
              ${rankBadges[index]}
            </span>
            <span style="color: #111827; font-size: 15px; font-weight: 700;">
              ${point}
            </span>
          </td>
          <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            <span style="color: #059669; font-weight: 800; font-size: 18px;">
              ${count}
            </span>
            <span style="color: #6b7280; font-size: 12px; margin-left: 4px;">toplam</span>
          </td>
        </tr>
      `).join('')

    // 5. SON 10 AKTİVİTE
    const recentActivities = measurements.slice(0, 10).map(m => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          <div style="color: #6b7280; font-size: 12px;">
            ${m.date || 'N/A'}
          </div>
          <div style="color: #374151; font-size: 13px; font-weight: 600; margin-top: 2px;">
            ${m.time || 'N/A'}
          </div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          <span style="background: #ecfdf5; color: #059669; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
            ${(m.category || 'N/A').charAt(0).toUpperCase() + (m.category || 'N/A').slice(1)}
          </span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 13px;">
          ${m.point || 'N/A'}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: #059669; font-weight: 700; font-size: 14px;">
            ${m.value || 'N/A'}
          </span>
          <span style="color: #6b7280; font-size: 11px; margin-left: 2px;">
            ${m.unit || ''}
          </span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          ${m.user || 'N/A'}
        </td>
      </tr>
    `).join('')

    // 30 günlük ortalama hesaplama
    const avgLast30Days = last30DaysMeasurements.length > 0
      ? Math.round(last30DaysMeasurements.length / 30)
      : 0

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Detaylı Su Kalitesi Raporu</title>
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
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #0891b2 100%); padding: 40px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                📊 GLOHE PORTAL • Detaylı Rapor
              </h1>
              <p style="margin: 14px 0 0 0; color: #ffffff; font-size: 16px; font-weight: 500; opacity: 0.95; letter-spacing: 0.3px;">
                ${reportDate} • ${currentTime}
              </p>
            </td>
          </tr>

          <!-- KPI Cards -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Today Card -->
                  <td width="32%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; padding: 20px; border-left: 4px solid #10b981;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px;">
                      BUGÜN
                    </p>
                    <p style="margin: 0; font-size: 32px; font-weight: 900; color: #047857; line-height: 1;">
                      ${todayMeasurements.length}
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 11px; color: #059669; font-weight: 600;">
                      Ölçüm
                    </p>
                  </td>
                  <td width="2%"></td>
                  <!-- Monthly Card -->
                  <td width="32%" style="background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); border-radius: 8px; padding: 20px; border-left: 4px solid #0891b2;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #164e63; text-transform: uppercase; letter-spacing: 0.5px;">
                      BU AY
                    </p>
                    <p style="margin: 0; font-size: 32px; font-weight: 900; color: #155e75; line-height: 1;">
                      ${monthlyMeasurements.length}
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 11px; color: #0891b2; font-weight: 600;">
                      Ölçüm
                    </p>
                  </td>
                  <td width="2%"></td>
                  <!-- Average Card -->
                  <td width="32%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #78350f; text-transform: uppercase; letter-spacing: 0.5px;">
                      ORT. (30 GÜN)
                    </p>
                    <p style="margin: 0; font-size: 32px; font-weight: 900; color: #b45309; line-height: 1;">
                      ${avgLast30Days}
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 11px; color: #d97706; font-weight: 600;">
                      /gün
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Category Analysis -->
          ${todayCategories.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700; color: #111827;">
                📊 Bugünkü Kategori Analizi
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kategori
                  </th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Ölçüm Sayısı
                  </th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Nokta Sayısı
                  </th>
                </tr>
                ${todayCategories}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Today's Top Points -->
          ${todayTopPoints.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700; color: #111827;">
                📍 Bugün Kontrol Edilen Noktalar
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kontrol Noktası
                  </th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kontrol Sayısı
                  </th>
                </tr>
                ${todayTopPoints}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- User Performance -->
          ${userPerformanceList.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700; color: #111827;">
                👥 Bugünkü Kullanıcı Performansı
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kullanıcı
                  </th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Ölçüm Sayısı
                  </th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kategori Çeşitliliği
                  </th>
                </tr>
                ${userPerformanceList}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- All-Time Top Points -->
          ${topAllTimePoints.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700; color: #111827;">
                🏅 En Çok Kontrol Edilen Noktalar (Tüm Zamanlar)
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border: 2px solid #f59e0b; border-radius: 8px; overflow: hidden;">
                ${topAllTimePoints}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Recent Activities -->
          ${recentActivities.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px 30px 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 17px; font-weight: 700; color: #111827;">
                🕐 Son 10 Aktivite
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Tarih/Saat
                  </th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kategori
                  </th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Nokta
                  </th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Değer
                  </th>
                  <th style="padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Kullanıcı
                  </th>
                </tr>
                ${recentActivities}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- No Data Warning -->
          ${todayMeasurements.length === 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                  ⚠️ Bugün henüz ölçüm kaydı bulunmuyor
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #059669; font-size: 13px; font-weight: 700;">
                💧 GLOHE PORTAL
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Su Kalitesi Kontrol Sistemi
              </p>
              <p style="margin: 8px 0 0 0; color: #d1d5db; font-size: 11px;">
                Detaylı günlük rapor • Her gün otomatik olarak gönderilir
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
        subject: `📊 GLOHE PORTAL • Detaylı Su Kalitesi Raporu - ${reportDate} ${currentTime}`,
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
    console.log(`📊 Bugünkü ölçüm: ${todayMeasurements.length}`)
    console.log(`📆 Aylık ölçüm: ${monthlyMeasurements.length}`)
    console.log(`📈 30 günlük ortalama: ${avgLast30Days}/gün`)

    process.exit(0)

  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

// Çalıştır
sendDailyReport()
