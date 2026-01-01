-- Anonymous Rate Limiting Table
-- Migration: 20251231000003_anonymous_rate_limits.sql
--
-- Purpose: Track AI requests from anonymous users by IP hash
-- to prevent DoS attacks on AI endpoints.

CREATE TABLE IF NOT EXISTS public.anonymous_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('birth_chart', 'tarot', 'daily_spark')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups by IP hash and time window
CREATE INDEX idx_anon_rate_limits_ip_time
  ON public.anonymous_rate_limits(ip_hash, created_at DESC);

-- Auto-cleanup: Delete records older than 24 hours (run via cron)
-- This keeps the table small and performant
CREATE INDEX idx_anon_rate_limits_cleanup
  ON public.anonymous_rate_limits(created_at);

-- RLS: Only service_role can access (Edge Function uses service_role)
ALTER TABLE public.anonymous_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed - service_role bypasses RLS

-- Function to check anonymous rate limit
CREATE OR REPLACE FUNCTION public.check_anon_rate_limit(
  p_ip_hash TEXT,
  p_request_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) < p_limit
  FROM public.anonymous_rate_limits
  WHERE ip_hash = p_ip_hash
    AND (p_request_type IS NULL OR request_type = p_request_type)
    AND created_at > now() - INTERVAL '24 hours'
$$;

-- Function to record anonymous request
CREATE OR REPLACE FUNCTION public.record_anon_request(
  p_ip_hash TEXT,
  p_request_type TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.anonymous_rate_limits (ip_hash, request_type)
  VALUES (p_ip_hash, p_request_type)
$$;

-- Cleanup function (call via pg_cron or scheduled job)
CREATE OR REPLACE FUNCTION public.cleanup_old_anon_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.anonymous_rate_limits
  WHERE created_at < now() - INTERVAL '24 hours';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE public.anonymous_rate_limits IS
  'Rate limiting for anonymous AI requests. Stores hashed IP addresses (not raw IPs) for privacy.';
