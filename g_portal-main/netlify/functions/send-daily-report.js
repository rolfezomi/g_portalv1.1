const { createClient } = require('@supabase/supabase-js')

exports.handler = async function(event, context) {
  try {
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

    // Tarih hesaplamaları (Turkish Time - UTC+3)
    const now = new Date()
    now.setHours(now.getHours() + 3)
    const today = now.toISOString().split('T')[0]
    const thisMonth = today.substring(0, 7)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const todayMeasurements = measurements.filter(m => m.date === today)
    const monthMeasurements = measurements.filter(m => m.date && m.date.startsWith(thisMonth))
    const last30DaysMeasurements = measurements.filter(m => m.date >= thirtyDaysAgo)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterdayMeasurements = measurements.filter(m => m.date === yesterday)

    const diff = todayMeasurements.length - yesterdayMeasurements.length
    const trendIcon = diff > 0 ? '▲' : diff < 0 ? '▼' : '━'
    const trendColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#6b7280'

    // Kategori dağılımı
    const categoryNames = {
      'klor': 'Klor',
      'sertlik': 'Sertlik',
      'ph': 'pH',
      'iletkenlik': 'İletkenlik',
      'mikro': 'Mikrobiyoloji',
      'kazan-mikser': 'Kazan Mikser',
      'dolum-makinalari': 'Dolum Makinaları'
    }

    const categoryIcons = {
      'klor': '🧪',
      'sertlik': '🌊',
      'ph': '📊',
      'iletkenlik': '⚡',
      'mikro': '🦠',
      'kazan-mikser': '🏭',
      'dolum-makinalari': '🧴',
      'default': '📋'
    }

    const categoryCounts = {}
    measurements.forEach(m => {
      if (m.category) {
        const catKey = m.category.toLowerCase()
        categoryCounts[catKey] = (categoryCounts[catKey] || 0) + 1
      }
    })

    const categories = Object.entries(categoryCounts)
      .map(([key, count]) => ({
        name: categoryNames[key] || key.charAt(0).toUpperCase() + key.slice(1),
        count,
        percent: ((count / measurements.length) * 100).toFixed(1),
        icon: categoryIcons[key] || categoryIcons['default']
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // En çok ölçüm yapılan noktalar
    const pointCounts = {}
    measurements.forEach(m => {
      if (m.point && m.point !== 'N/A' && m.point.trim() !== '') {
        pointCounts[m.point] = (pointCounts[m.point] || 0) + 1
      }
    })

    const topPoints = Object.entries(pointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Son 10 aktivite
    const recentActivities = measurements
      .filter(m => m.date && m.point && m.point !== 'N/A')
      .slice(0, 10)

    // HTML email
    const reportDate = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Su Kalitesi Raporu</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table style="width: 100%; max-width: 680px; margin: 20px auto; background: #ffffff;">
    <tr>
      <td style="background-color: #667eea; padding: 40px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📊 Günlük Su Kalitesi Raporu</h1>
        <p style="margin: 12px 0 0; color: #ffffff; font-size: 16px;">${reportDate}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <h2 style="color: #111827;">📈 Özet</h2>
        <p><strong>Bugün:</strong> ${todayMeasurements.length} ölçüm</p>
        <p><strong>Bu Ay:</strong> ${monthMeasurements.length} ölçüm</p>
        <p><strong>Günlük Ortalama:</strong> ${Math.round(last30DaysMeasurements.length / 30)} ölçüm</p>
        <p><strong>Trend:</strong> ${trendIcon} ${diff > 0 ? '+' : ''}${diff} (dün)</p>

        <h2 style="color: #111827; margin-top: 32px;">🏆 En Çok Ölçüm Yapılan Noktalar</h2>
        <ul>
          ${topPoints.map(([point, count]) => `<li><strong>${point}:</strong> ${count} ölçüm</li>`).join('')}
        </ul>

        <p style="margin-top: 32px; color: #6b7280; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Glohe Portal - Su Kalitesi Kontrol Sistemi
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Resend ile mail gönder
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
      console.error('Email gönderimi başarısız:', emailResult)
      throw new Error(`Email gönderimi başarısız: ${JSON.stringify(emailResult)}`)
    }

    console.log('Email başarıyla gönderildi!', emailResult.id)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Günlük rapor başarıyla gönderildi!',
        stats: {
          todayCount: todayMeasurements.length,
          monthCount: monthMeasurements.length,
          avgDaily: Math.round(last30DaysMeasurements.length / 30),
          emailId: emailResult.id
        }
      })
    }

  } catch (error) {
    console.error('Hata:', error)

    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}
