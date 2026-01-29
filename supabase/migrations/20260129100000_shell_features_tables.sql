-- Shell Features Migration
-- Create tables for rewards, subscriptions, newsletter, and yearly forecasts
-- Date: 2026-01-29

-- ============================================================================
-- 1. rewards 表 (兑换商品)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('virtual', 'physical', 'discount')),
  -- virtual: 虚拟权益 (塔罗次数、会员时长等)
  -- physical: 实物商品
  -- discount: 折扣券
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  -- 虚拟权益配置
  virtual_config JSONB,
  -- 例: {"type": "tarot_readings", "amount": 5}
  -- 例: {"type": "premium_days", "amount": 30}
  -- 例: {"type": "expert_discount", "percent": 10}
  -- 实物配置
  physical_config JSONB,
  -- 例: {"product_id": "xxx", "requires_shipping": true}
  image_url TEXT,
  stock INTEGER, -- NULL 表示无限
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON public.rewards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rewards_display_order ON public.rewards(display_order);

-- RLS 策略
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- 所有人可读取激活的商品
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards
  FOR SELECT
  USING (is_active = true);

-- 管理员可以管理所有商品
CREATE POLICY "Admins can manage all rewards"
  ON public.rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 2. user_rewards 表 (兑换记录)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'shipped', 'delivered', 'cancelled')),
  -- 实物商品需要收货地址
  shipping_address JSONB,
  -- 例: {"name": "...", "phone": "...", "address": "...", "city": "...", "postal_code": "..."}
  tracking_number TEXT,
  admin_notes TEXT,
  redeemed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  fulfilled_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward_id ON public.user_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON public.user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_rewards_redeemed_at ON public.user_rewards(redeemed_at DESC);

-- RLS 策略
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的兑换记录
CREATE POLICY "Users can view own redemptions"
  ON public.user_rewards
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的兑换记录
CREATE POLICY "Users can create own redemptions"
  ON public.user_rewards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看和管理所有兑换记录
CREATE POLICY "Admins can manage all redemptions"
  ON public.user_rewards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 3. subscriptions 表 (会员订阅)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'expired', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- RLS 策略
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的订阅
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 管理员可以查看和管理所有订阅
CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 4. newsletter_subscribers 表 (邮件订阅)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'footer' CHECK (source IN ('footer', 'checkout', 'signup', 'popup', 'admin')),
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unsubscribed_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmation_token TEXT,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT unique_newsletter_email UNIQUE (email)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_user_id ON public.newsletter_subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON public.newsletter_subscribers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_newsletter_source ON public.newsletter_subscribers(source);

-- RLS 策略
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 匿名用户可以订阅 (INSERT only)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- 用户可以查看自己的订阅记录
CREATE POLICY "Users can view own newsletter subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 用户可以更新自己的订阅记录（退订）
CREATE POLICY "Users can update own newsletter subscription"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 管理员可以管理所有订阅
CREATE POLICY "Admins can manage all newsletter subscriptions"
  ON public.newsletter_subscribers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 5. yearly_forecasts 表 (12月预测缓存)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.yearly_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  sun_sign TEXT NOT NULL CHECK (sun_sign IN (
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  )),
  forecast_data JSONB NOT NULL,
  -- 包含 12 个月的预测内容:
  -- { "months": [
  --   { "month": 1, "title": "...", "overview": "...", "love": "...", "career": "...", "health": "...", "lucky_days": [...] },
  --   ...
  -- ], "yearly_theme": "...", "key_dates": [...] }
  unlock_method TEXT DEFAULT 'premium' CHECK (unlock_method IN ('premium', 'purchase', 'points')),
  purchase_id TEXT, -- Stripe payment ID if purchased
  points_spent INTEGER, -- Points used if redeemed
  generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ, -- When forecast becomes stale (e.g., end of year)
  CONSTRAINT unique_user_year_forecast UNIQUE (user_id, year)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_yearly_forecasts_user_id ON public.yearly_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_yearly_forecasts_year ON public.yearly_forecasts(year);
CREATE INDEX IF NOT EXISTS idx_yearly_forecasts_sun_sign ON public.yearly_forecasts(sun_sign);

-- RLS 策略
ALTER TABLE public.yearly_forecasts ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的预测
CREATE POLICY "Users can view own yearly forecasts"
  ON public.yearly_forecasts
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用户可以创建自己的预测
CREATE POLICY "Users can create own yearly forecasts"
  ON public.yearly_forecasts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有预测
CREATE POLICY "Admins can view all yearly forecasts"
  ON public.yearly_forecasts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- 6. profiles 表更新
-- ============================================================================

-- 添加订阅相关字段
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tarot_readings_remaining INTEGER DEFAULT 3;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_yearly_forecast BOOLEAN DEFAULT false;

-- 索引
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- ============================================================================
-- 7. 辅助函数
-- ============================================================================

-- 函数：检查用户是否是 Premium 会员
CREATE OR REPLACE FUNCTION public.is_premium_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
    AND (current_period_end IS NULL OR current_period_end > now())
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND subscription_tier = 'premium'
  )
$$;

-- 函数：兑换积分商品
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_user_id UUID,
  p_reward_id UUID,
  p_shipping_address JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward RECORD;
  v_user_points INTEGER;
  v_redemption_id UUID;
BEGIN
  -- 1. 获取商品信息
  SELECT * INTO v_reward
  FROM public.rewards
  WHERE id = p_reward_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  -- 2. 检查库存
  IF v_reward.stock IS NOT NULL AND v_reward.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Out of stock');
  END IF;

  -- 3. 检查用户积分
  SELECT public.get_point_balance(p_user_id) INTO v_user_points;

  IF v_user_points < v_reward.points_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'required', v_reward.points_cost,
      'available', v_user_points
    );
  END IF;

  -- 4. 实物商品需要地址
  IF v_reward.type = 'physical' AND p_shipping_address IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Shipping address required');
  END IF;

  -- 5. 扣除积分
  INSERT INTO public.point_transactions (user_id, amount, type, description, metadata)
  VALUES (
    p_user_id,
    -v_reward.points_cost,
    'reward',
    'Redeemed: ' || v_reward.name,
    jsonb_build_object('reward_id', p_reward_id)
  );

  -- 6. 创建兑换记录
  INSERT INTO public.user_rewards (user_id, reward_id, points_spent, shipping_address, status)
  VALUES (
    p_user_id,
    p_reward_id,
    v_reward.points_cost,
    p_shipping_address,
    CASE WHEN v_reward.type = 'virtual' THEN 'fulfilled' ELSE 'pending' END
  )
  RETURNING id INTO v_redemption_id;

  -- 7. 减少库存
  IF v_reward.stock IS NOT NULL THEN
    UPDATE public.rewards SET stock = stock - 1 WHERE id = p_reward_id;
  END IF;

  -- 8. 处理虚拟权益
  IF v_reward.type = 'virtual' AND v_reward.virtual_config IS NOT NULL THEN
    -- 根据虚拟权益类型更新用户配置
    CASE v_reward.virtual_config->>'type'
      WHEN 'tarot_readings' THEN
        UPDATE public.profiles
        SET tarot_readings_remaining = tarot_readings_remaining + (v_reward.virtual_config->>'amount')::INTEGER
        WHERE id = p_user_id;
      WHEN 'premium_days' THEN
        -- 这里可以创建临时的 premium 订阅
        NULL; -- 需要单独处理
      WHEN 'yearly_forecast' THEN
        UPDATE public.profiles SET has_yearly_forecast = true WHERE id = p_user_id;
      ELSE
        NULL;
    END CASE;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'reward_name', v_reward.name,
    'points_spent', v_reward.points_cost,
    'new_balance', v_user_points - v_reward.points_cost
  );
END;
$$;

-- 授权函数给 authenticated 用户
GRANT EXECUTE ON FUNCTION public.is_premium_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_reward TO authenticated;

-- ============================================================================
-- 8. 触发器：自动更新 updated_at
-- ============================================================================

-- 创建通用的 updated_at 更新函数 (如果不存在)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- rewards 表
CREATE OR REPLACE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON public.rewards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- subscriptions 表
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 9. 注释
-- ============================================================================

COMMENT ON TABLE public.rewards IS 'Redeemable rewards catalog (virtual, physical, discount)';
COMMENT ON TABLE public.user_rewards IS 'User reward redemption history and fulfillment tracking';
COMMENT ON TABLE public.subscriptions IS 'Premium membership subscriptions managed via Stripe';
COMMENT ON TABLE public.newsletter_subscribers IS 'Email newsletter subscription list';
COMMENT ON TABLE public.yearly_forecasts IS 'Cached 12-month horoscope forecasts per user per year';

COMMENT ON COLUMN public.profiles.subscription_tier IS 'User subscription level: free or premium';
COMMENT ON COLUMN public.profiles.tarot_readings_remaining IS 'Number of free tarot readings remaining for non-premium users';
COMMENT ON COLUMN public.profiles.has_yearly_forecast IS 'Whether user has unlocked yearly forecast feature';

COMMENT ON FUNCTION public.is_premium_user IS 'Check if user has active premium subscription';
COMMENT ON FUNCTION public.redeem_reward IS 'Redeem a reward using points, handles stock and virtual rewards';
