-- Fix overly permissive INSERT policy on ai_usage_logs
-- Migration: 20251231000002_fix_ai_usage_logs_rls.sql
--
-- Problem: The original "Service role can insert usage logs" policy used
-- WITH CHECK (true) which allows ANY authenticated user to insert logs,
-- not just the service role. This could be exploited to:
--   1. Pollute analytics data
--   2. Cause rate limit exhaustion for other users
--   3. Inject false usage records
--
-- Solution: Remove the policy entirely since service_role key bypasses RLS.
-- The Edge Function uses SUPABASE_SERVICE_ROLE_KEY which is not subject to RLS.

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert usage logs" ON public.ai_usage_logs;

-- Optional: If we ever need authenticated users to insert their own logs
-- (e.g., for client-side tracking), use this more restrictive policy:
-- CREATE POLICY "Users can insert own usage logs"
--   ON public.ai_usage_logs
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.ai_usage_logs IS
  'AI usage logs for rate limiting and analytics. INSERT operations should only
   be performed by Edge Functions using the service_role key (which bypasses RLS).';
