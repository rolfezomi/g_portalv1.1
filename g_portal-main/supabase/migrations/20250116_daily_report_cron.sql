-- Günlük Mail Raporu için pg_cron Zamanlama
-- Bu migration pg_cron extension'ını etkinleştirir ve günlük rapor görevini ayarlar

-- pg_cron extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Mevcut günlük rapor görevini sil (varsa)
SELECT cron.unschedule('daily-water-quality-report');

-- Günlük rapor görevini planla
-- Her gün saat 09:00'da (Türkiye saati) Edge Function'ı tetikle
SELECT cron.schedule(
  'daily-water-quality-report',              -- Job adı
  '0 6 * * *',                                -- Cron expression (UTC 06:00 = TR 09:00)
  $$
  SELECT
    net.http_post(
        url := 'https://mignlffeyougoefuyayr.supabase.co/functions/v1/send-daily-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Aktif cron job'ları listele (kontrol için)
SELECT * FROM cron.job;

-- NOTLAR:
-- 1. 'YOUR_PROJECT_REF' kısmını Supabase proje referansınızla değiştirin
-- 2. Cron expression UTC timezone kullanır (Türkiye UTC+3)
-- 3. '0 6 * * *' = Her gün UTC 06:00 (TR 09:00)
-- 4. Farklı saatler için cron expression'ı değiştirin:
--    - '0 7 * * *' = UTC 07:00 (TR 10:00)
--    - '0 8 * * *' = UTC 08:00 (TR 11:00)
--    - '30 5 * * *' = UTC 05:30 (TR 08:30)

-- Cron job'ı silmek için:
-- SELECT cron.unschedule('daily-water-quality-report');

-- Cron job geçmişini görmek için:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-water-quality-report') ORDER BY start_time DESC LIMIT 10;
