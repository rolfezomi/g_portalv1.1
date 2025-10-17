-- Daily Measurement Status Check Cron Jobs
-- Günlük ölçüm kontrolü: 12:00 ve 16:35'te çalışır (Türkiye saati)
-- Veri girilen ve girilmeyen kontrol noktalarını raporlar

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing jobs if they exist
DO $$
BEGIN
  PERFORM cron.unschedule('daily-measurement-check-noon');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('daily-measurement-check-afternoon');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- IMPORTANT: Replace YOUR_SUPABASE_SERVICE_ROLE_KEY with your actual service role key
-- Get it from: Supabase Dashboard → Settings → API → service_role key

-- Create cron job for 12:00 (noon check)
-- Cron: '0 9 * * 1-5' = 12:00 Turkish time (09:00 UTC), weekdays only
SELECT cron.schedule(
  'daily-measurement-check-noon',
  '0 9 * * 1-5',
  $$
  SELECT
    net.http_post(
      url:='https://mignlffeyougoefuyayr.supabase.co/functions/v1/check-daily-measurement-status',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- Create cron job for 16:35 (afternoon check)
-- Cron: '35 13 * * 1-5' = 16:35 Turkish time (13:35 UTC), weekdays only
SELECT cron.schedule(
  'daily-measurement-check-afternoon',
  '35 13 * * 1-5',
  $$
  SELECT
    net.http_post(
      url:='https://mignlffeyougoefuyayr.supabase.co/functions/v1/check-daily-measurement-status',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify cron jobs were created
SELECT
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname IN ('daily-measurement-check-noon', 'daily-measurement-check-afternoon')
ORDER BY jobname;

-- NOTLAR:
-- 1. İlk mail: 12:00 (Öğlen kontrolü)
-- 2. İkinci mail: 16:35 (Mesai bitimi kontrolü)
-- 3. Sadece hafta içi çalışır (Pazartesi-Cuma)
-- 4. UTC+3 timezone (Türkiye saati)
-- 5. Mail: ugur.onar@glohe.com
--
-- Cron job'ı manuel test etmek için:
-- SELECT net.http_post(
--   url:='https://mignlffeyougoefuyayr.supabase.co/functions/v1/check-daily-measurement-status',
--   headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
--   body:='{}'::jsonb
-- );
