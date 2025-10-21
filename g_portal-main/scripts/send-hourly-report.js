const { createClient } = require('@supabase/supabase-js')

async function sendHourlyReport() {
  try {
    console.log('⏰ Saatlik rapor gönderimi başlıyor...')

    // Supabase client
    console.log('🔐 Supabase URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...')
    console.log('🔑 Service Role Key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0)

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

    if (error) {
      console.error('❌ Supabase error:', error)
      throw error
    }
    if (!measurements || measurements.length === 0) {
      throw new Error('Veritabanında hiç ölçüm verisi bulunamadı.')
    }

    console.log(`✅ ${measurements.length} ölçüm verisi çekildi`)

    // Tarih ve saat hesaplamaları (Turkish Time - UTC+3)
    const now = new Date()
    now.setHours(now.getHours() + 3)
    const today = now.toISOString().split('T')[0]
    const currentHour = now.getHours()

    // Son 1 saatteki ölçümler
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneHourAgoStr = oneHourAgo.toISOString()

    const recentMeasurements = measurements.filter(m => {
      const measurementDateTime = new Date(`${m.date}T${m.time}`)
      return measurementDateTime >= oneHourAgo
    })

    // Bugünkü tüm ölçümler
    const todayMeasurements = measurements.filter(m => m.date === today)

    console.log(`⏰ Son 1 saatte ${recentMeasurements.length} ölçüm yapıldı`)
    console.log(`📅 Bugün toplam ${todayMeasurements.length} ölçüm yapıldı`)

    // Saatlik rapor HTML
    const reportDateTime = new Date().toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Son ölçümlerin listesi
    let recentMeasurementsHTML = ''
    if (recentMeasurements.length > 0) {
      recentMeasurementsHTML = recentMeasurements.slice(0, 10).map(m => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; color: #374151;">${m.time || '-'}</td>
          <td style="padding: 12px 8px; color: #374151;">${m.category || '-'}</td>
          <td style="padding: 12px 8px; color: #374151;">${m.point || '-'}</td>
          <td style="padding: 12px 8px; color: #667eea; font-weight: 600;">${m.value} ${m.unit || ''}</td>
        </tr>
      `).join('')
    } else {
      recentMeasurementsHTML = `
        <tr>
          <td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">
            Son 1 saatte ölçüm yapılmadı
          </td>
        </tr>
      `
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Saatlik Su Kalitesi Raporu</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 700px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h1 style="color: #667eea; margin-top: 0;">⏰ Saatlik Su Kalitesi Raporu</h1>
    <p style="color: #6b7280; font-size: 16px;">${reportDateTime}</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 6px; color: white;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Son 1 Saat</div>
        <div style="font-size: 32px; font-weight: bold;">${recentMeasurements.length}</div>
        <div style="font-size: 12px; opacity: 0.8;">ölçüm</div>
      </div>

      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 6px; color: white;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Bugün Toplam</div>
        <div style="font-size: 32px; font-weight: bold;">${todayMeasurements.length}</div>
        <div style="font-size: 12px; opacity: 0.8;">ölçüm</div>
      </div>
    </div>

    ${recentMeasurements.length > 0 ? `
    <div style="margin: 30px 0;">
      <h2 style="color: #111827; font-size: 18px; margin-bottom: 15px;">📋 Son Ölçümler (Son 1 Saat)</h2>
      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-weight: 600; font-size: 13px;">Saat</th>
            <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-weight: 600; font-size: 13px;">Kategori</th>
            <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-weight: 600; font-size: 13px;">Nokta</th>
            <th style="padding: 12px 8px; text-align: left; color: #6b7280; font-weight: 600; font-size: 13px;">Değer</th>
          </tr>
        </thead>
        <tbody>
          ${recentMeasurementsHTML}
        </tbody>
      </table>
    </div>
    ` : ''}

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      © ${new Date().getFullYear()} Glohe Portal - Su Kalitesi Kontrol Sistemi<br>
      Bu rapor otomatik olarak her saat başı gönderilmektedir.
    </p>
  </div>
</body>
</html>
    `

    // Resend ile mail gönder
    console.log('📧 Email gönderiliyor...')
    console.log('🔑 API Key length:', process.env.RESEND_API_KEY?.length || 0)
    console.log('📨 Recipient:', process.env.RECIPIENT_EMAIL)

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Glohe Portal <onboarding@resend.dev>',
        to: [process.env.RECIPIENT_EMAIL],
        subject: `⏰ Saatlik Rapor - ${reportDateTime}`,
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
    console.log(`⏰ Son 1 saatte ${recentMeasurements.length} ölçüm raporlandı`)

    process.exit(0)

  } catch (error) {
    console.error('❌ Hata:', error.message)
    process.exit(1)
  }
}

sendHourlyReport()
