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

-- Create cron job for 12:00 (noon check)
-- Cron: '0 9 * * 1-5' = 12:00 Turkish time (09:00 UTC), weekdays only
SELECT cron.schedule(
  'daily-measurement-check-noon',
  '0 9 * * 1-5',
  $$
  SELECT
    net.http_post(
      url:='https://mignlffeyougoefuyayr.supabase.co/functions/v1/check-daily-measurement-status',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEzMzg0NSwiZXhwIjoyMDc0NzA5ODQ1fQ.HiFKb2UY8VfzDjQHfRrBlcxqznSPQd5K_ea6iQf55Ek"}'::jsonb,
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
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEzMzg0NSwiZXhwIjoyMDc0NzA5ODQ1fQ.HiFKb2UY8VfzDjQHfRrBlcxqznSPQd5K_ea6iQf55Ek"}'::jsonb,
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
