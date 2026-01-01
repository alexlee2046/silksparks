-- Schedule Cleanup Jobs
-- Migration: 20260101000002_schedule_cleanup_jobs.sql
--
-- Purpose: Use pg_cron to schedule automatic cleanup of rate limit tables
-- Note: pg_cron must be enabled in Supabase Dashboard > Database > Extensions

-- Enable pg_cron extension if not already enabled
-- (This may require manual enabling in Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============ Schedule Anonymous Rate Limits Cleanup ============
-- Run every hour to clean up records older than 24 hours

SELECT cron.schedule(
  'cleanup-anon-rate-limits',   -- Job name
  '0 * * * *',                  -- Every hour at minute 0
  $$SELECT public.cleanup_old_anon_rate_limits()$$
);

-- ============ Schedule AI Usage Logs Cleanup (Optional) ============
-- Keep logs for 30 days, clean up older ones
-- Run daily at 3 AM

CREATE OR REPLACE FUNCTION public.cleanup_old_ai_usage_logs(
  p_days_to_keep INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_usage_logs
  WHERE created_at < now() - (p_days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup
  RAISE NOTICE 'Cleaned up % old AI usage logs', deleted_count;

  RETURN deleted_count;
END;
$$;

SELECT cron.schedule(
  'cleanup-ai-usage-logs',      -- Job name
  '0 3 * * *',                  -- Daily at 3:00 AM
  $$SELECT public.cleanup_old_ai_usage_logs(30)$$
);

-- ============ View Scheduled Jobs ============

COMMENT ON FUNCTION public.cleanup_old_ai_usage_logs IS
  'Clean up AI usage logs older than specified days. Default 30 days.';

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('cleanup-anon-rate-limits');
