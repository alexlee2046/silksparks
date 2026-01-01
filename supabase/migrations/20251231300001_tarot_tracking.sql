-- Tarot Reading History & Streak Tracking
-- This migration adds tables for tracking tarot readings and user engagement

-- ============ tarot_readings: 塔罗阅读历史记录 ============

CREATE TABLE IF NOT EXISTS tarot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 阅读类型和牌面数据
  reading_type TEXT NOT NULL CHECK (reading_type IN ('daily', 'three_card', 'celtic_cross')),
  cards JSONB NOT NULL,
  question TEXT,

  -- AI 解读内容
  interpretation TEXT,
  core_message TEXT,
  action_advice TEXT,
  lucky_elements JSONB,

  -- 种子信息（用于验证/重放）
  seed TEXT,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 索引：按用户和时间查询
CREATE INDEX IF NOT EXISTS idx_tarot_readings_user_id ON tarot_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_created_at ON tarot_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_type ON tarot_readings(reading_type);

-- RLS 策略
ALTER TABLE tarot_readings ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的阅读记录
CREATE POLICY "Users can view own readings"
  ON tarot_readings FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的阅读记录
CREATE POLICY "Users can insert own readings"
  ON tarot_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有记录
CREATE POLICY "Admins can view all readings"
  ON tarot_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles."isAdmin" = true
    )
  );

-- ============ tarot_streaks: 连续签到追踪 ============

CREATE TABLE IF NOT EXISTS tarot_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 连续记录
  current_streak INT DEFAULT 0 NOT NULL,
  longest_streak INT DEFAULT 0 NOT NULL,
  total_readings INT DEFAULT 0 NOT NULL,

  -- 最后阅读日期（用于判断是否断签）
  last_reading_date DATE,

  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS 策略
ALTER TABLE tarot_streaks ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的streak
CREATE POLICY "Users can view own streak"
  ON tarot_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以插入/更新自己的streak
CREATE POLICY "Users can upsert own streak"
  ON tarot_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON tarot_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- ============ 更新 streak 的函数 ============

CREATE OR REPLACE FUNCTION record_tarot_reading(
  p_user_id UUID,
  p_reading_type TEXT,
  p_cards JSONB,
  p_question TEXT DEFAULT NULL,
  p_interpretation TEXT DEFAULT NULL,
  p_core_message TEXT DEFAULT NULL,
  p_action_advice TEXT DEFAULT NULL,
  p_lucky_elements JSONB DEFAULT NULL,
  p_seed TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_streak RECORD;
  v_new_streak INT;
  v_reading_id UUID;
BEGIN
  -- 1. 插入阅读记录
  INSERT INTO tarot_readings (
    user_id, reading_type, cards, question,
    interpretation, core_message, action_advice, lucky_elements, seed
  ) VALUES (
    p_user_id, p_reading_type, p_cards, p_question,
    p_interpretation, p_core_message, p_action_advice, p_lucky_elements, p_seed
  )
  RETURNING id INTO v_reading_id;

  -- 2. 更新 streak
  SELECT * INTO v_streak FROM tarot_streaks WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- 首次阅读，创建 streak 记录
    INSERT INTO tarot_streaks (user_id, current_streak, longest_streak, total_readings, last_reading_date)
    VALUES (p_user_id, 1, 1, 1, v_today);

    RETURN jsonb_build_object(
      'reading_id', v_reading_id,
      'current_streak', 1,
      'longest_streak', 1,
      'total_readings', 1,
      'is_new_streak', true
    );
  END IF;

  -- 计算新的 streak
  IF v_streak.last_reading_date = v_today THEN
    -- 今天已经读过，只增加总数
    v_new_streak := v_streak.current_streak;
  ELSIF v_streak.last_reading_date = v_today - INTERVAL '1 day' THEN
    -- 连续签到
    v_new_streak := v_streak.current_streak + 1;
  ELSE
    -- 断签，重新开始
    v_new_streak := 1;
  END IF;

  -- 更新 streak 记录
  UPDATE tarot_streaks
  SET
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    total_readings = total_readings + 1,
    last_reading_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'reading_id', v_reading_id,
    'current_streak', v_new_streak,
    'longest_streak', GREATEST(v_streak.longest_streak, v_new_streak),
    'total_readings', v_streak.total_readings + 1,
    'is_new_streak', v_streak.last_reading_date != v_today
  );
END;
$$;

-- 授权函数给 authenticated 用户
GRANT EXECUTE ON FUNCTION record_tarot_reading TO authenticated;

-- ============ 获取用户塔罗统计的函数 ============

CREATE OR REPLACE FUNCTION get_tarot_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_streak RECORD;
  v_recent_cards JSONB;
  v_card_distribution JSONB;
BEGIN
  -- 获取 streak 信息
  SELECT * INTO v_streak FROM tarot_streaks WHERE user_id = p_user_id;

  -- 获取最近30天的牌面统计
  SELECT jsonb_agg(card_data) INTO v_recent_cards
  FROM (
    SELECT
      jsonb_array_elements(cards) as card_data,
      created_at
    FROM tarot_readings
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 100
  ) sub;

  RETURN jsonb_build_object(
    'current_streak', COALESCE(v_streak.current_streak, 0),
    'longest_streak', COALESCE(v_streak.longest_streak, 0),
    'total_readings', COALESCE(v_streak.total_readings, 0),
    'last_reading_date', v_streak.last_reading_date,
    'recent_cards', COALESCE(v_recent_cards, '[]'::jsonb)
  );
END;
$$;

-- 授权函数给 authenticated 用户
GRANT EXECUTE ON FUNCTION get_tarot_stats TO authenticated;
