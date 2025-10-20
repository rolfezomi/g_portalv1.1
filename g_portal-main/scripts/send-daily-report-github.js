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

    const todayMeasurements = measurements.filter(m => m.date === today)

    console.log(`📅 Bugün ${todayMeasurements.length} ölçüm yapıldı`)

    // Basit HTML rapor
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
  <title>Günlük Su Kalitesi Raporu</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <h1 style="color: #667eea; margin-top: 0;">📊 Günlük Su Kalitesi Raporu</h1>
    <p style="color: #6b7280; font-size: 16px;">${reportDate}</p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #111827;">📈 Özet</h2>
      <p><strong>Bugün:</strong> ${todayMeasurements.length} ölçüm</p>
      <p><strong>Toplam:</strong> ${measurements.length} ölçüm</p>
    </div>

    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
      © ${new Date().getFullYear()} Glohe Portal - Su Kalitesi Kontrol Sistemi
    </p>
  </div>
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

sendDailyReport()
