-- Check-in System Migration
-- Add daily check-in tracking, streak management, and point transactions

-- ============ 扩展 profiles 表 ============

-- Add check-in tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
  ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- Add index for check-in date queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_checkin ON public.profiles(last_checkin_date);

-- ============ 创建 checkin_history 表 ============

CREATE TABLE IF NOT EXISTS public.checkin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_days INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate check-ins per day
  CONSTRAINT unique_user_checkin_date UNIQUE (user_id, checkin_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkin_history_user_id ON public.checkin_history(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_history_date ON public.checkin_history(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_history_user_date ON public.checkin_history(user_id, checkin_date DESC);

-- ============ 创建 point_transactions 表 ============

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount != 0),
  type TEXT NOT NULL CHECK (type IN ('checkin', 'streak_bonus', 'share', 'purchase', 'refund', 'admin_adjust', 'reward')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON public.point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON public.point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON public.point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_timeline ON public.point_transactions(user_id, created_at DESC);

-- ============ RLS 策略 - checkin_history ============

ALTER TABLE public.checkin_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own check-in history
CREATE POLICY "Users can view own checkin history"
  ON public.checkin_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert own checkins"
  ON public.checkin_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all check-in history
CREATE POLICY "Admins can view all checkin history"
  ON public.checkin_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============ RLS 策略 - point_transactions ============

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own point transactions
CREATE POLICY "Users can view own point transactions"
  ON public.point_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own point transactions
CREATE POLICY "Users can insert own point transactions"
  ON public.point_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all point transactions
CREATE POLICY "Admins can view all point transactions"
  ON public.point_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============ 辅助函数 ============

-- Function to calculate check-in streak
CREATE OR REPLACE FUNCTION public.calculate_checkin_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_last_date DATE;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  -- Get the most recent check-in date
  SELECT checkin_date INTO v_last_date
  FROM public.checkin_history
  WHERE user_id = p_user_id
  ORDER BY checkin_date DESC
  LIMIT 1;

  -- If no check-ins, streak is 0
  IF v_last_date IS NULL THEN
    RETURN 0;
  END IF;

  -- If last check-in was today, use existing streak
  IF v_last_date = v_current_date THEN
    SELECT streak_days INTO v_streak
    FROM public.checkin_history
    WHERE user_id = p_user_id AND checkin_date = v_current_date;
    RETURN COALESCE(v_streak, 0);
  END IF;

  -- If last check-in was yesterday, continue streak
  IF v_last_date = v_current_date - INTERVAL '1 day' THEN
    SELECT streak_days INTO v_streak
    FROM public.checkin_history
    WHERE user_id = p_user_id AND checkin_date = v_last_date;
    RETURN COALESCE(v_streak, 0);
  END IF;

  -- Otherwise, streak is broken
  RETURN 0;
END;
$$;

-- Function to get user's point balance
CREATE OR REPLACE FUNCTION public.get_point_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER
  FROM public.point_transactions
  WHERE user_id = p_user_id
$$;

-- ============ 统计视图 ============

-- Check-in statistics view for admins
CREATE OR REPLACE VIEW public.checkin_stats AS
SELECT
  DATE_TRUNC('day', checkin_date) as date,
  COUNT(DISTINCT user_id) as unique_checkins,
  AVG(streak_days)::INTEGER as avg_streak,
  MAX(streak_days) as max_streak,
  SUM(points_earned) as total_points_earned
FROM public.checkin_history
GROUP BY DATE_TRUNC('day', checkin_date)
ORDER BY date DESC;

-- Grant access to authenticated users (RLS will limit to admins)
GRANT SELECT ON public.checkin_stats TO authenticated;

-- ============ 注释 ============

COMMENT ON TABLE public.checkin_history IS 'Tracks daily user check-ins and streak progress';
COMMENT ON TABLE public.point_transactions IS 'Ledger for all point earning and spending activities';
COMMENT ON FUNCTION public.calculate_checkin_streak IS 'Calculate current check-in streak for a user';
COMMENT ON FUNCTION public.get_point_balance IS 'Get total point balance for a user';
COMMENT ON COLUMN public.profiles.last_checkin_date IS 'Date of user last check-in';
COMMENT ON COLUMN public.profiles.streak_days IS 'Current consecutive check-in streak';
