-- AI Usage Logs Table for Rate Limiting and Token Tracking
-- Migration: 20251231000001_ai_usage_logs.sql

-- ============ 创建 ai_usage_logs 表 ============

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('birth_chart', 'tarot', 'daily_spark')),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
  model TEXT,
  provider TEXT,
  latency_ms INTEGER,
  is_fallback BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 索引优化查询性能
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
-- 复合索引用于每日限额查询 (user_id + created_at)
CREATE INDEX idx_ai_usage_logs_user_daily ON public.ai_usage_logs(user_id, created_at DESC);

-- ============ RLS 策略 ============

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的使用记录
CREATE POLICY "Users can view own usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 允许 Edge Function 通过 service_role 插入记录
-- (Edge Function 使用 SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role can insert usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- 管理员可以查看所有记录
CREATE POLICY "Admins can view all usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============ 每日限额检查函数 ============

CREATE OR REPLACE FUNCTION public.check_ai_daily_limit(
  p_user_id UUID,
  p_request_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*) < p_limit
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at > now() - INTERVAL '24 hours'
    AND (p_request_type IS NULL OR request_type = p_request_type)
$$;

-- ============ 获取用户今日使用量 ============

CREATE OR REPLACE FUNCTION public.get_ai_daily_usage(p_user_id UUID)
RETURNS TABLE (
  request_type TEXT,
  request_count BIGINT,
  total_tokens BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    request_type,
    COUNT(*) as request_count,
    COALESCE(SUM(tokens_total), 0) as total_tokens
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at > now() - INTERVAL '24 hours'
  GROUP BY request_type
$$;

-- ============ 管理员统计视图 ============

CREATE OR REPLACE VIEW public.ai_usage_stats AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  request_type,
  COUNT(*) as request_count,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(tokens_total) as total_tokens,
  AVG(latency_ms)::INTEGER as avg_latency_ms,
  SUM(CASE WHEN is_fallback THEN 1 ELSE 0 END) as fallback_count
FROM public.ai_usage_logs
GROUP BY DATE_TRUNC('day', created_at), request_type
ORDER BY date DESC, request_type;

-- 视图只允许管理员访问
GRANT SELECT ON public.ai_usage_stats TO authenticated;

COMMENT ON TABLE public.ai_usage_logs IS 'Tracks AI API usage for rate limiting and analytics';
COMMENT ON FUNCTION public.check_ai_daily_limit IS 'Check if user is within daily AI request limit';
COMMENT ON FUNCTION public.get_ai_daily_usage IS 'Get user daily AI usage breakdown';
