-- Hourly Weekday Email Report Cron Job Setup
-- This migration creates a cron job that sends water quality reports every hour on weekdays

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- First, remove any existing old cron jobs if they exist
DO $$
BEGIN
  -- Try to unschedule old daily job if it exists
  PERFORM cron.unschedule('daily-water-quality-report');
EXCEPTION
  WHEN OTHERS THEN
    -- If job doesn't exist, ignore the error
    NULL;
END $$;

-- Also try to remove the new job name if it exists (for re-running migration)
DO $$
BEGIN
  PERFORM cron.unschedule('hourly-weekday-water-quality-report');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Create new hourly weekday cron job (Business hours only)
-- Cron expression: '0 6-15 * * 1-5' means:
-- - 0: At minute 0 (top of every hour)
-- - 6-15: Between 06:00-15:00 UTC (09:00-18:00 Turkish time, UTC+3)
-- - *: Every day of month
-- - *: Every month
-- - 1-5: Monday through Friday only
--
-- This will send emails at:
-- 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00 Turkish time
-- (10 times per day on weekdays)

SELECT cron.schedule(
  'hourly-weekday-water-quality-report',
  '0 6-15 * * 1-5', -- Every hour during business hours on weekdays
  $$
  SELECT
    net.http_post(
      url:='https://mignlffeyougoefuyayr.supabase.co/functions/v1/send-daily-report',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEzMzg0NSwiZXhwIjoyMDc0NzA5ODQ1fQ.HiFKb2UY8VfzDjQHfRrBlcxqznSPQd5K_ea6iQf55Ek"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'hourly-weekday-water-quality-report';
