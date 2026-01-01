-- Atomic Rate Limiting Functions
-- Migration: 20260101000001_atomic_rate_limits.sql
--
-- Purpose: Fix race condition in rate limiting by using advisory locks
-- to ensure atomic check-and-record operations.

-- ============ Atomic Check and Record for Authenticated Users ============

CREATE OR REPLACE FUNCTION public.atomic_check_and_record_ai_usage(
  p_user_id UUID,
  p_request_type TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  lock_key BIGINT;
BEGIN
  -- Generate a unique lock key from user_id
  lock_key := hashtext(p_user_id::text || '_ai_limit');

  -- Acquire advisory lock for this user's rate limit check
  -- This prevents concurrent requests from the same user racing
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Count requests in the last 24 hours
  SELECT COUNT(*) INTO current_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at > now() - INTERVAL '24 hours';

  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- Insert placeholder record to reserve the slot
  -- The actual token counts will be updated after AI response
  INSERT INTO public.ai_usage_logs (
    user_id,
    request_type,
    tokens_input,
    tokens_output,
    model,
    provider
  ) VALUES (
    p_user_id,
    p_request_type,
    0,  -- Will be updated after AI call
    0,  -- Will be updated after AI call
    'pending',
    'pending'
  );

  RETURN TRUE;
END;
$$;

-- ============ Atomic Check and Record for Anonymous Users ============

CREATE OR REPLACE FUNCTION public.atomic_check_and_record_anon_usage(
  p_ip_hash TEXT,
  p_request_type TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  lock_key BIGINT;
BEGIN
  -- Generate a unique lock key from IP hash
  lock_key := hashtext(p_ip_hash || '_anon_limit');

  -- Acquire advisory lock
  PERFORM pg_advisory_xact_lock(lock_key);

  -- Count requests in the last 24 hours
  SELECT COUNT(*) INTO current_count
  FROM public.anonymous_rate_limits
  WHERE ip_hash = p_ip_hash
    AND created_at > now() - INTERVAL '24 hours';

  -- Check if limit exceeded
  IF current_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- Insert record
  INSERT INTO public.anonymous_rate_limits (ip_hash, request_type)
  VALUES (p_ip_hash, p_request_type);

  RETURN TRUE;
END;
$$;

-- ============ Update Usage Log After AI Call ============

CREATE OR REPLACE FUNCTION public.update_ai_usage_log(
  p_user_id UUID,
  p_tokens_input INTEGER,
  p_tokens_output INTEGER,
  p_model TEXT,
  p_provider TEXT,
  p_latency_ms INTEGER DEFAULT NULL,
  p_is_fallback BOOLEAN DEFAULT FALSE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the most recent pending log for this user
  UPDATE public.ai_usage_logs
  SET
    tokens_input = p_tokens_input,
    tokens_output = p_tokens_output,
    model = p_model,
    provider = p_provider,
    latency_ms = p_latency_ms,
    is_fallback = p_is_fallback,
    error_message = p_error_message
  WHERE id = (
    SELECT id FROM public.ai_usage_logs
    WHERE user_id = p_user_id
      AND model = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION public.atomic_check_and_record_ai_usage IS
  'Atomically check rate limit and record usage for authenticated users. Uses advisory locks to prevent race conditions.';

COMMENT ON FUNCTION public.atomic_check_and_record_anon_usage IS
  'Atomically check rate limit and record usage for anonymous users. Uses advisory locks to prevent race conditions.';

COMMENT ON FUNCTION public.update_ai_usage_log IS
  'Update a pending usage log with actual token counts after AI call completes.';
