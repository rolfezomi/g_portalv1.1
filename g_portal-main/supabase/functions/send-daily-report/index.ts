// Supabase Edge Function - Günlük Su Kalitesi Mail Raporu
// Deno runtime kullanır

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Measurement {
  id: number
  category?: string
  point?: string
  value?: string
  unit?: string
  date?: string
  time?: string
  user?: string
  note?: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase client oluştur
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verileri çek - id'ye göre sırala (daha güvenilir)
    const { data: measurements, error } = await supabase
      .from('measurements')
      .select('id, category, point, value, unit, date, time, user, note')
      .order('id', { ascending: false })
      .limit(1000) // Performans için limit

    if (error) throw error
    if (!measurements || measurements.length === 0) {
      throw new Error('Veritabanında hiç ölçüm verisi bulunamadı.')
    }

    // Tarih hesaplamaları (Turkish Time - UTC+3)
    const now = new Date()
    now.setHours(now.getHours() + 3)  // UTC+3 Turkish time
    const today = now.toISOString().split('T')[0]
    const thisMonth = today.substring(0, 7)

    const thirtyDaysAgoDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split('T')[0]

    // Helper function: Güvenli tarih karşılaştırma
    const getDateString = (m: Measurement): string => {
      if (m.date) return m.date
      return ''
    }

    // KPI hesaplamaları - Null kontrolü ile
    const todayMeasurements = measurements.filter((m: Measurement) => {
      const dateStr = getDateString(m)
      return dateStr === today
    })

    const monthMeasurements = measurements.filter((m: Measurement) => {
      const dateStr = getDateString(m)
      return dateStr.startsWith(thisMonth)
    })

    const last30DaysMeasurements = measurements.filter((m: Measurement) => {
      const dateStr = getDateString(m)
      return dateStr >= thirtyDaysAgo
    })

    // Önceki gün ile karşılaştırma
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const yesterdayMeasurements = measurements.filter((m: Measurement) => {
      const dateStr = getDateString(m)
      return dateStr === yesterday
    })

    const diff = todayMeasurements.length - yesterdayMeasurements.length
    const trendIcon = diff > 0 ? '▲' : diff < 0 ? '▼' : '━'
    const trendColor = diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : '#6b7280'

    // Kategori dağılımı - Null kontrolü ve Türkçe isimler
    const categoryNames: Record<string, string> = {
      'klor': 'Klor',
      'sertlik': 'Sertlik',
      'ph': 'pH',
      'iletkenlik': 'İletkenlik',
      'mikro': 'Mikrobiyoloji',
      'kazan-mikser': 'Kazan Mikser',
      'dolum-makinalari': 'Dolum Makinaları'
    }

    const categoryIcons: Record<string, string> = {
      'klor': '🧪',
      'sertlik': '🌊',
      'ph': '📊',
      'iletkenlik': '⚡',
      'mikro': '🦠',
      'kazan-mikser': '🏭',
      'dolum-makinalari': '🧴',
      'default': '📋'
    }

    const categoryCounts: Record<string, number> = {}
    measurements.forEach((m: Measurement) => {
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

    // En çok ölçüm yapılan noktalar - sadece point kullan
    const pointCounts: Record<string, number> = {}
    measurements.forEach((m: Measurement) => {
      const pointName = m.point
      if (pointName && pointName !== 'N/A' && pointName.trim() !== '') {
        pointCounts[pointName] = (pointCounts[pointName] || 0) + 1
      }
    })

    const topPoints = Object.entries(pointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    // Son 10 aktivite - Sadece geçerli verileri al
    const recentActivities = measurements
      .filter((m: Measurement) => {
        const dateStr = getDateString(m)
        const pointName = m.point
        return dateStr && pointName && pointName !== 'N/A'
      })
      .slice(0, 10)

    // HTML email şablonu
    const reportDate = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const htmlContent = `
<!DOCTYPE html>
<html lang="tr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>Günlük Su Kalitesi Raporu</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .kpi-card { width: 100% !important; display: block !important; margin-bottom: 12px !important; }
      .mobile-hide { display: none !important; }
      table[class="body"] { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" class="body" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table role="presentation" style="max-width: 680px; width: 100%; border-collapse: collapse; border-spacing: 0; background: #ffffff;">

          <!-- Header -->
          <tr>
            <td style="background-color: #667eea; padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📊 Günlük Su Kalitesi Raporu
              </h1>
              <p style="margin: 12px 0 0; color: #ffffff; font-size: 16px; font-weight: 500;">
                ${reportDate}
              </p>
            </td>
          </tr>

          <!-- KPI Cards -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
                <tr>
                  <!-- Bugünkü Ölçümler -->
                  <td class="kpi-card" style="width: 33.33%; padding: 0 6px; vertical-align: top;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: #3b82f6;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Bugünkü Ölçümler
                          </p>
                          <p style="margin: 12px 0 0; color: #ffffff; font-size: 42px; font-weight: 800; line-height: 1;">
                            ${todayMeasurements.length.toLocaleString('tr-TR')}
                          </p>
                          <p style="margin: 8px 0 0; font-size: 13px; font-weight: 600; color: #ffffff;">
                            <span style="color: ${trendColor};">${trendIcon} ${diff > 0 ? '+' : ''}${diff}</span> dün
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Aylık Toplam -->
                  <td class="kpi-card" style="width: 33.33%; padding: 0 6px; vertical-align: top;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: #10b981;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Bu Ay Toplam
                          </p>
                          <p style="margin: 12px 0 0; color: #ffffff; font-size: 42px; font-weight: 800; line-height: 1;">
                            ${monthMeasurements.length.toLocaleString('tr-TR')}
                          </p>
                          <p style="margin: 8px 0 0; color: #ffffff; font-size: 13px; font-weight: 600;">
                            ${new Date().toLocaleDateString('tr-TR', { month: 'long' })}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>

                  <!-- Günlük Ortalama -->
                  <td class="kpi-card" style="width: 33.33%; padding: 0 6px; vertical-align: top;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: #f59e0b;">
                      <tr>
                        <td style="padding: 20px; text-align: center;">
                          <p style="margin: 0; color: #ffffff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                            Günlük Ortalama
                          </p>
                          <p style="margin: 12px 0 0; color: #ffffff; font-size: 42px; font-weight: 800; line-height: 1;">
                            ${Math.round(last30DaysMeasurements.length / 30).toLocaleString('tr-TR')}
                          </p>
                          <p style="margin: 8px 0 0; color: #ffffff; font-size: 13px; font-weight: 600;">
                            Son 30 Gün
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Kategori Dağılımı -->
          <tr>
            <td style="padding: 0 24px 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 700;">
                📈 Kategori Dağılımı
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: #f9fafb;">
                ${categories.length === 0 ? `
                  <tr>
                    <td style="padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">
                      Henüz kategori verisi yok.
                    </td>
                  </tr>
                ` : categories.map((cat, idx) => `
                  <tr>
                    <td style="padding: 14px 16px; border-bottom: ${idx === categories.length - 1 ? 'none' : '1px solid #e5e7eb'};">
                      <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
                        <tr>
                          <td style="width: 36px; font-size: 22px; vertical-align: middle;">${cat.icon}</td>
                          <td style="font-size: 14px; font-weight: 600; color: #374151; vertical-align: middle;">
                            ${cat.name}
                          </td>
                          <td style="text-align: right; font-size: 16px; font-weight: 800; color: #111827; vertical-align: middle; padding-right: 8px;">
                            ${cat.count.toLocaleString('tr-TR')}
                          </td>
                          <td style="text-align: right; width: 55px; font-size: 13px; font-weight: 600; color: #6b7280; vertical-align: middle;">
                            ${cat.percent}%
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- En Çok Ölçüm Yapılan Noktalar -->
          <tr>
            <td style="padding: 0 24px 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 700;">
                🏆 En Çok Ölçüm Yapılan Noktalar (Top 5)
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
                ${topPoints.length === 0 ? `
                  <tr>
                    <td style="padding: 24px; text-align: center; color: #6b7280; font-size: 14px; background-color: #f9fafb;">
                      Henüz kontrol noktası verisi yok.
                    </td>
                  </tr>
                ` : topPoints.map(([point, count], index) => {
                  const rankColors = ['#f59e0b', '#94a3b8', '#c2410c', '#64748b', '#71717a']
                  const rankBgColors = ['#fef3c7', '#e2e8f0', '#fee2e2', '#f3f4f6', '#f9fafb']
                  const rankLabels = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
                  return `
                    <tr>
                      <td style="padding: 0; ${index < topPoints.length - 1 ? 'padding-bottom: 8px;' : ''}">
                        <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: ${rankBgColors[index]};">
                          <tr>
                            <td style="padding: 12px 16px;">
                              <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0;">
                                <tr>
                                  <td style="width: 36px; font-size: 24px; vertical-align: middle;">${rankLabels[index]}</td>
                                  <td style="font-size: 14px; font-weight: 600; color: #111827; vertical-align: middle;">
                                    ${point}
                                  </td>
                                  <td style="text-align: right; font-size: 20px; font-weight: 800; color: ${rankColors[index]}; vertical-align: middle;">
                                    ${count.toLocaleString('tr-TR')}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  `
                }).join('')}
              </table>
            </td>
          </tr>

          <!-- Son Aktiviteler -->
          <tr>
            <td style="padding: 0 24px 32px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 700;">
                📋 Son Aktiviteler (Son 10 Ölçüm)
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; background-color: #ffffff; border: 1px solid #e5e7eb;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                      Tarih/Saat
                    </th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                      Kontrol Noktası
                    </th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                      Kategori
                    </th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                      Sonuç
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${recentActivities.length === 0 ? `
                    <tr>
                      <td colspan="4" style="padding: 24px; text-align: center; color: #6b7280; font-size: 14px;">
                        Bugün henüz ölçüm yapılmamış.
                      </td>
                    </tr>
                  ` : recentActivities.map((activity: Measurement, index: number) => {
                    // Güvenli veri çekme
                    const dateStr = activity.date || '-'
                    const timeStr = activity.time || '-'
                    const pointName = activity.point || '-'
                    const categoryName = activity.category ? (categoryNames[activity.category.toLowerCase()] || activity.category) : '-'
                    const resultValue = String(activity.value || '-')

                    // Sonuç renklendirmesi - String garantisi
                    const resultLower = String(resultValue).toLowerCase()
                    const isPass = resultLower.includes('uygun') ||
                                   resultLower.includes('pass') ||
                                   resultLower.includes('başarılı')
                    const isFail = resultLower.includes('uygun değil') ||
                                   resultLower.includes('fail') ||
                                   resultLower.includes('başarısız')

                    let bgColor = '#e5e7eb'
                    let textColor = '#374151'

                    if (isPass) {
                      bgColor = '#d1fae5'
                      textColor = '#065f46'
                    } else if (isFail) {
                      bgColor = '#fee2e2'
                      textColor = '#991b1b'
                    }

                    return `
                      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#fafafa'};">
                        <td style="padding: 12px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                          ${dateStr}<br/>
                          <span style="color: #9ca3af; font-size: 12px;">${timeStr}</span>
                        </td>
                        <td style="padding: 12px 16px; font-size: 13px; color: #111827; font-weight: 600; border-bottom: 1px solid #f3f4f6;">
                          ${pointName}
                        </td>
                        <td style="padding: 12px 16px; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                          ${categoryName}
                        </td>
                        <td style="padding: 12px 16px; text-align: center; border-bottom: 1px solid #f3f4f6;">
                          <span style="display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 700; background-color: ${bgColor}; color: ${textColor};">
                            ${resultValue}
                          </span>
                        </td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; border-spacing: 0; margin-bottom: 16px;">
                <tr>
                  <td style="text-align: center; padding: 8px;">
                    <table role="presentation" style="display: inline-block; background-color: #ffffff; padding: 12px 20px; border: 1px solid #e5e7eb;">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #374151; font-size: 13px; font-weight: 600;">
                            📊 Toplam ${measurements.length.toLocaleString('tr-TR')} ölçüm analiz edildi
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.6;">
                Bu rapor otomatik olarak oluşturulmaktadır.<br/>
                Raporla ilgili sorularınız için lütfen bizimle iletişime geçin.
              </p>

              <!-- İletişim Bilgileri -->
              <table role="presentation" style="width: 100%; max-width: 400px; margin: 16px auto 0; border-collapse: collapse; border-spacing: 0; background-color: #ffffff; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0 0 8px; color: #111827; font-size: 13px; font-weight: 700;">
                      İletişim
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 13px; font-weight: 600;">
                      Uğur Onar
                    </p>
                    <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">
                      <a href="mailto:ugur.onar@glohe.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
                        ugur.onar@glohe.com
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} Glohe Portal - Su Kalitesi Kontrol Sistemi
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

    // Resend ile mail gönder (Supabase entegre)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const recipientEmail = Deno.env.get('RECIPIENT_EMAIL')

    if (!resendApiKey || !recipientEmail) {
      throw new Error('❌ RESEND_API_KEY veya RECIPIENT_EMAIL environment variable tanımlı değil!')
    }

    console.log('📧 Mail gönderiliyor...', {
      recipient: recipientEmail,
      date: reportDate,
      todayCount: todayMeasurements.length,
      totalMeasurements: measurements.length
    })

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Glohe Portal <onboarding@resend.dev>', // Resend test domain
        to: [recipientEmail],
        subject: `📊 Günlük Su Kalitesi Raporu - ${reportDate}`,
        html: htmlContent,
      }),
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('❌ Email gönderimi başarısız:', emailResult)
      throw new Error(`Email gönderimi başarısız: ${JSON.stringify(emailResult)}`)
    }

    console.log('✅ Email başarıyla gönderildi!', {
      emailId: emailResult.id,
      recipient: recipientEmail
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Günlük rapor başarıyla gönderildi!',
        stats: {
          todayCount: todayMeasurements.length,
          monthCount: monthMeasurements.length,
          avgDaily: Math.round(last30DaysMeasurements.length / 30),
          totalMeasurements: measurements.length,
          categoriesCount: categories.length,
          topPointsCount: topPoints.length,
          emailId: emailResult.id,
          recipient: recipientEmail
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Hata oluştu:', error)

    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata'
    const errorName = error instanceof Error ? error.name : 'Error'
    const errorStack = error instanceof Error ? error.stack : undefined

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        details: {
          name: errorName,
          stack: errorStack
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
