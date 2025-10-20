// Supabase Edge Function - Günlük Ölçüm Kontrol Raporu
// Her gün 12:00 ve 16:35'te çalışır
// Veri girilen ve girilmeyen kontrol noktalarını raporlar

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tüm kontrol noktaları tanımları (script.js'den alındı)
const ALL_CONTROL_POINTS = {
  'Klor': [
    'Kontrol Noktası 0',
    'Kontrol Noktası 1',
    'Kontrol Noktası 2',
    'Kontrol Noktası 3',
    'Kontrol Noktası 4',
    'IBC Kontrol Noktası',
    'Kaynamış Su Kontrol Noktası'
  ],
  'Sertlik': [
    'Kontrol Noktası 0', 'Kontrol Noktası 1', 'Kontrol Noktası 2', 'Kontrol Noktası 3',
    'Kontrol Noktası 4', 'Kontrol Noktası 5', 'Kontrol Noktası 6', 'Kontrol Noktası 7',
    'Kontrol Noktası 8', 'Kontrol Noktası 9', 'Kontrol Noktası 10', 'Kontrol Noktası 11',
    'Kontrol Noktası 12', 'Kontrol Noktası 13', 'Kontrol Noktası 14',
    'IBC Kontrol Noktası',
    'Kaynamış Su Kontrol Noktası'
  ],
  'Ph': [
    'Kontrol Noktası 0', 'Kontrol Noktası 1', 'Kontrol Noktası 2', 'Kontrol Noktası 3',
    'Kontrol Noktası 4', 'Kontrol Noktası 5', 'Kontrol Noktası 6', 'Kontrol Noktası 7',
    'Kontrol Noktası 8', 'Kontrol Noktası 9', 'Kontrol Noktası 10', 'Kontrol Noktası 11',
    'Kontrol Noktası 12', 'Kontrol Noktası 13', 'Kontrol Noktası 14',
    'IBC Kontrol Noktası',
    'Kaynamış Su Kontrol Noktası'
  ],
  'İletkenlik': [
    'Kontrol Noktası 0', 'Kontrol Noktası 1', 'Kontrol Noktası 2', 'Kontrol Noktası 3',
    'Kontrol Noktası 4', 'Kontrol Noktası 5', 'Kontrol Noktası 6', 'Kontrol Noktası 7',
    'Kontrol Noktası 8', 'Kontrol Noktası 9', 'Kontrol Noktası 10', 'Kontrol Noktası 11',
    'Kontrol Noktası 12', 'Kontrol Noktası 13', 'Kontrol Noktası 14',
    'IBC Kontrol Noktası',
    'Kaynamış Su Kontrol Noktası'
  ],
  'Kazan & Mikser': [
    '1010 / 3 Tonluk Mikser',
    '1011 / 7 Tonluk Mikser',
    '1012 / 7 Tonluk Mikser',
    '1013 / 2 Tonluk Mikser',
    '1014 / UNIMIX',
    '1015 / Emülsiyon Ünitesi',
    '1018 / 1 Tonluk Seyyar Transfer Kazanı',
    '1019 / 1 Tonluk Seyyar Transfer Kazanı',
    '1020 / 500 Litrelik Seyyar Tip Mikser Kazanı',
    '1021 / 500 Litrelik Seyyar Tip Mikser Kazanı',
    '1022 / 250 Litrelik Seyyar Tip Mikser Kazanı',
    '1023 / 250 Litrelik Seyyar Tip Mikser Kazanı',
    '1061 / 500 Litrelik Seyyar Mikser',
    '1108 / 250 Litrelik Seyyar Kazan',
    '1109 / 250 Litrelik Seyyar Kazan',
    '1135 / 500 Litrelik Seyyar Mikser',
    '1142 / Pilot Mikser - Dolmak'
  ],
  'Dolum Makinaları': [
    '1029 / ALTILI LİKİT DOLUM VE KAPAMA MAKİNASI',
    '1020 / 8\'Lİ LİKİT DOLUM VE KAPAMA MAKİNASI',
    '1148 / ROLL-ON DOLUM VE KAPAMA MAKİNASI'
  ]
}

// Kategori mapping (veritabanındaki kategori isimleri)
const CATEGORY_MAPPING: Record<string, string> = {
  'Klor': 'Klor',
  'Sertlik': 'Sertlik',
  'Ph': 'Ph',
  'İletkenlik': 'İletkenlik',
  'Kazan & Mikser': 'kazan-mikser',
  'Dolum Makinaları': 'dolum-makinalari'
}

interface MeasurementCheck {
  category: string
  point: string
  hasData: boolean
  lastMeasurementTime?: string
  lastValue?: string
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    // Bugünün tarihi (Turkish Time - UTC+3)
    const now = new Date()
    now.setHours(now.getHours() + 3)  // UTC+3 Turkish time
    const today = now.toISOString().split('T')[0]

    console.log('Checking measurements for date:', today)

    // Bugünkü tüm ölçümleri çek (date kolonuna göre filtrele)
    const { data: measurements, error } = await supabase
      .from('measurements')
      .select('category, point, date, time, value')
      .eq('date', today)

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    console.log(`Found ${measurements?.length || 0} measurements today`)

    // Her kontrol noktasını kontrol et
    const results: MeasurementCheck[] = []

    for (const [categoryName, points] of Object.entries(ALL_CONTROL_POINTS)) {
      const dbCategoryName = CATEGORY_MAPPING[categoryName] || categoryName

      for (const point of points) {
        // Bu noktaya bugün veri girilmiş mi?
        const pointMeasurements = measurements?.filter(m => {
          // Kategori ve nokta eşleşmesi
          const categoryMatch = m.category === dbCategoryName || m.category === categoryName
          const pointMatch = m.point === point

          return categoryMatch && pointMatch
        }) || []

        const hasData = pointMeasurements.length > 0
        const lastMeasurement = pointMeasurements[0]

        results.push({
          category: categoryName,
          point: point,
          hasData: hasData,
          lastMeasurementTime: lastMeasurement ? `${lastMeasurement.date || ''} ${lastMeasurement.time || ''}`.trim() : undefined,
          lastValue: lastMeasurement ? (lastMeasurement.value || '') : undefined
        })
      }
    }

    // Veri girilen ve girilmeyen noktaları ayır
    const withData = results.filter(r => r.hasData)
    const withoutData = results.filter(r => !r.hasData)

    // Kategoriye göre grupla
    const groupByCategory = (items: MeasurementCheck[]) => {
      const grouped: Record<string, MeasurementCheck[]> = {}
      items.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = []
        }
        grouped[item.category].push(item)
      })
      return grouped
    }

    const withDataGrouped = groupByCategory(withData)
    const withoutDataGrouped = groupByCategory(withoutData)

    // Mail içeriği oluştur
    const currentTime = now.toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const totalPoints = results.length
    const completedPoints = withData.length
    const missingPoints = withoutData.length
    const completionRate = ((completedPoints / totalPoints) * 100).toFixed(1)

    // HTML mail template - Minimalist & Professional Design
    const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Ölçüm Kontrol Raporu</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
  <div style="max-width: 680px; margin: 32px auto; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">

    <!-- Header - Minimalist -->
    <div style="background: #1b5e20; padding: 24px; border-bottom: 3px solid #2e7d32;">
      <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 600; letter-spacing: -0.3px;">
        Günlük Ölçüm Kontrol Raporu
      </h1>
      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; font-weight: 400;">
        ${currentTime}
      </p>
    </div>

    <!-- Summary Stats - Clean Grid -->
    <div style="padding: 32px 24px 24px;">
      <table role="presentation" style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
        <tr>
          <!-- Toplam -->
          <td style="width: 33.33%; text-align: center; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
            <div style="font-size: 32px; font-weight: 700; color: #111827; margin-bottom: 6px; line-height: 1;">
              ${totalPoints}
            </div>
            <div style="font-size: 11px; color: #6b7280; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              Toplam
            </div>
          </td>

          <!-- Tamamlanan -->
          <td style="width: 33.33%; text-align: center; padding: 20px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px;">
            <div style="font-size: 32px; font-weight: 700; color: #166534; margin-bottom: 6px; line-height: 1;">
              ${completedPoints}
            </div>
            <div style="font-size: 11px; color: #16a34a; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              Tamamlanan
            </div>
          </td>

          <!-- Eksik -->
          <td style="width: 33.33%; text-align: center; padding: 20px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px;">
            <div style="font-size: 32px; font-weight: 700; color: #991b1b; margin-bottom: 6px; line-height: 1;">
              ${missingPoints}
            </div>
            <div style="font-size: 11px; color: #dc2626; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
              Eksik
            </div>
          </td>
        </tr>
      </table>

      <!-- Progress Bar - Simplified -->
      <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 12px; font-weight: 500; color: #374151;">Tamamlanma</span>
          <span style="font-size: 18px; font-weight: 700; color: #166534;">${completionRate}%</span>
        </div>
        <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
          <div style="width: ${completionRate}%; height: 100%; background: #16a34a;"></div>
        </div>
      </div>
    </div>

    <!-- Veri Girilen Noktalar - Compact Table -->
    ${completedPoints > 0 ? `
    <div style="padding: 24px; border-top: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
        ✓ Veri Girilen Noktalar (${completedPoints})
      </h2>

      ${Object.entries(withDataGrouped).map(([category, points]) => `
        <div style="margin-bottom: 20px;">
          <div style="padding: 8px 12px; background: #f0fdf4; border-left: 3px solid #16a34a; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 600; color: #166534;">${category}</span>
            <span style="font-size: 12px; color: #16a34a; margin-left: 6px;">(${points.length})</span>
          </div>
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            ${points.map(p => `
              <tr>
                <td style="padding: 6px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #f3f4f6;">
                  ${p.point}
                </td>
                <td style="padding: 6px 12px; font-size: 11px; color: #9ca3af; text-align: right; border-bottom: 1px solid #f3f4f6;">
                  ${p.lastMeasurementTime || ''}
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Veri Girilmeyen Noktalar - Compact -->
    ${missingPoints > 0 ? `
    <div style="padding: 24px; background: #fafafa; border-top: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">
        ⚠ Veri Girilmeyen Noktalar (${missingPoints})
      </h2>

      ${Object.entries(withoutDataGrouped).map(([category, points]) => `
        <div style="margin-bottom: 20px;">
          <div style="padding: 8px 12px; background: #fef2f2; border-left: 3px solid #dc2626; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 600; color: #991b1b;">${category}</span>
            <span style="font-size: 12px; color: #dc2626; margin-left: 6px;">(${points.length})</span>
          </div>
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            ${points.map(p => `
              <tr>
                <td style="padding: 6px 12px; font-size: 12px; color: #374151; border-bottom: 1px solid #f3f4f6; background: white;">
                  ${p.point}
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Footer - Minimal -->
    <div style="padding: 20px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #6b7280;">
        <strong>İletişim:</strong> Uğur Onar ·
        <a href="mailto:ugur.onar@glohe.com" style="color: #1b5e20; text-decoration: none;">ugur.onar@glohe.com</a>
      </p>
      <p style="margin: 0; color: #9ca3af; font-size: 10px;">
        Glohe Portal · Otomatik Rapor Sistemi · © 2025
      </p>
    </div>

  </div>
</body>
</html>
`

    // Resend ile mail gönder
    const recipientEmail = Deno.env.get('RECIPIENT_EMAIL')
    if (!recipientEmail) {
      throw new Error('RECIPIENT_EMAIL environment variable is not set')
    }

    const emailPayload = {
      from: 'Glohe Portal <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: `📊 Günlük Ölçüm Kontrol Raporu - ${completionRate}% Tamamlandı`,
      html: htmlContent
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily measurement check report sent successfully',
        stats: {
          total: totalPoints,
          completed: completedPoints,
          missing: missingPoints,
          completionRate: completionRate
        },
        emailId: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in check-daily-measurement-status function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
