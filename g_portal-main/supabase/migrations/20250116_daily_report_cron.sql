-- Her 2 Saatte Bir Mail Raporu için pg_cron Zamanlama
-- Bu migration pg_cron extension'ını etkinleştirir ve 2 saatlik rapor görevini ayarlar
-- Alıcı: ugur.onar@glohe.com
-- Project REF: mignlfieyougoefuyayr

-- pg_cron extension'ını etkinleştir
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Mevcut rapor görevini sil (varsa - hata verirse yoksay)
DO $$
BEGIN
    PERFORM cron.unschedule('water-quality-report-2hours');
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Job zaten yok, devam ediliyor...';
END $$;

-- Her 2 saatte bir rapor görevini planla
-- Saat: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 (UTC)
SELECT cron.schedule(
  'water-quality-report-2hours',              -- Job adı
  '0 */2 * * *',                               -- Cron expression (Her 2 saatte bir)
  $$
  SELECT
    net.http_post(
        url := 'https://mignlfieyougoefuyayr.supabase.co/functions/v1/send-daily-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Aktif cron job'ları listele (kontrol için)
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job;

-- NOTLAR:
-- 1. Project Reference ID: mignlfieyougoefuyayr ✅
-- 2. Email: ugur.onar@glohe.com (Secrets'te RECIPIENT_EMAIL olarak tanımlanmalı) ✅
-- 3. '0 */2 * * *' = Her 2 saatte bir (UTC: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00)
-- 4. Türkiye saati UTC+3 olduğu için:
--    UTC 00:00 = TR 03:00
--    UTC 02:00 = TR 05:00
--    UTC 04:00 = TR 07:00
--    UTC 06:00 = TR 09:00
--    UTC 08:00 = TR 11:00
--    UTC 10:00 = TR 13:00
--    UTC 12:00 = TR 15:00
--    UTC 14:00 = TR 17:00
--    UTC 16:00 = TR 19:00
--    UTC 18:00 = TR 21:00
--    UTC 20:00 = TR 23:00
--    UTC 22:00 = TR 01:00 (ertesi gün)
-- 5. Farklı aralıklar için cron expression'ı değiştirin:
--    - '0 * * * *' = Her saat başı
--    - '0 */3 * * *' = Her 3 saatte bir
--    - '0 */4 * * *' = Her 4 saatte bir
--    - '0 */6 * * *' = Her 6 saatte bir
--    - '0 6 * * *' = Sadece günde 1 kez (UTC 06:00 = TR 09:00)
--    - '0 8,12,16,20 * * *' = Sadece belirli saatlerde (8:00, 12:00, 16:00, 20:00 UTC)

-- Cron job'ı silmek için:
-- SELECT cron.unschedule('water-quality-report-2hours');

-- Cron job geçmişini görmek için:
-- SELECT * FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'water-quality-report-2hours')
-- ORDER BY start_time DESC LIMIT 10;
