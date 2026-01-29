# 空壳功能完整实现设计

> 日期: 2026-01-29
> 状态: 设计完成，待实现

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端改造                                │
├─────────────────────────────────────────────────────────────┤
│  积分兑换页面    │  会员订阅页面   │  12月预测页面           │
│  /rewards        │  /membership    │  /horoscope/yearly      │
├─────────────────────────────────────────────────────────────┤
│                    Stripe Checkout                          │
│            (订阅 + 单次购买 双模式)                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Supabase 后端                            │
├─────────────────────────────────────────────────────────────┤
│  rewards (兑换商品表)      │  user_rewards (兑换记录)       │
│  subscriptions (订阅状态)  │  newsletter_subscribers       │
│  yearly_forecasts (预测缓存)                                │
├─────────────────────────────────────────────────────────────┤
│           Edge Functions (Stripe Webhook 处理)              │
└─────────────────────────────────────────────────────────────┘
```

## 2. 数据库设计

### 2.1 rewards 表 (兑换商品)
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('virtual', 'physical', 'discount')),
  -- virtual: 虚拟权益 (塔罗次数、会员时长等)
  -- physical: 实物商品
  -- discount: 折扣券
  points_cost INTEGER NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 user_rewards 表 (兑换记录)
```sql
CREATE TABLE user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES rewards(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'shipped', 'cancelled')),
  -- 实物商品需要收货地址
  shipping_address JSONB,
  redeemed_at TIMESTAMPTZ DEFAULT now(),
  fulfilled_at TIMESTAMPTZ
);
```

### 2.3 subscriptions 表 (会员订阅)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.4 newsletter_subscribers 表
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  source TEXT DEFAULT 'footer' -- footer, checkout, signup
);
```

### 2.5 yearly_forecasts 表 (12月预测缓存)
```sql
CREATE TABLE yearly_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  sun_sign TEXT NOT NULL,
  forecast_data JSONB NOT NULL,
  -- 包含 12 个月的预测内容
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);
```

### 2.6 profiles 表更新
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  tarot_readings_remaining INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  has_yearly_forecast BOOLEAN DEFAULT false;
```

## 3. 功能模块设计

### 3.1 积分兑换系统

**兑换商品类型：**

| 类型 | 示例 | 积分 |
|------|------|------|
| 虚拟-塔罗 | 5次额外塔罗解读 | 200 |
| 虚拟-会员 | 7天 Premium 体验 | 500 |
| 虚拟-折扣 | 专家咨询 10% 折扣券 | 300 |
| 实物 | 迷你水晶套装 | 1000 |
| 实物 | 塔罗牌入门套装 | 2000 |

**兑换流程：**
1. 用户浏览兑换商品列表
2. 选择商品，确认积分扣除
3. 虚拟权益立即生效，实物需填写地址
4. 记录到 user_rewards 表

### 3.2 会员订阅系统

**会员权益：**
- 无限塔罗解读（免费用户每日 3 次）
- 12 个月运势预测
- 专家咨询 15% 折扣
- 优先客服支持
- 专属徽章显示

**价格：**
- 月付: $9.99/月
- 年付: $79.99/年 (省 $40)

**技术实现：**
- Stripe Checkout 创建订阅
- Webhook 处理订阅状态变更
- 前端通过 subscriptions 表判断会员状态

### 3.3 12个月运势预测

**解锁方式：**
1. Premium 会员自动解锁
2. 非会员可单独购买 ($4.99 一次性)
3. 积分兑换 (800 积分)

**内容生成：**
- 调用 AI 生成 12 个月逐月预测
- 缓存到 yearly_forecasts 表
- 每年初可重新生成

### 3.4 Newsletter 订阅

**实现：**
- 表单提交存入 newsletter_subscribers
- 显示成功提示
- 后续可接入邮件服务

### 3.5 法律页面

创建静态页面：
- /legal/privacy - 隐私政策
- /legal/terms - 服务条款
- /legal/cookies - Cookie 政策

### 3.6 前端修复清单

| 组件 | 文件 | 修复内容 |
|------|------|----------|
| Footer 社交链接 | Footer.tsx | 隐藏或配置化 |
| Footer 法律链接 | Footer.tsx | 链接到真实页面 |
| Newsletter | Footer.tsx | 实现提交逻辑 |
| 专家过滤器 | Experts.tsx | 实现状态管理和过滤 |
| 商品排序 | ShopList.tsx | 实现下拉菜单和排序 |
| 保存 Grimoire | TarotDaily.tsx | 保存到 archives 表 |
| 收藏夹跳转 | Favorites.tsx | 修复 onClick |
| Premium 标签 | UserDashboard.tsx | 读取真实订阅状态 |
| Daily Insight | UserDashboard.tsx | 从 AI 或缓存获取 |
| 塔罗标签 | TarotDaily.tsx | 基于卡牌动态生成 |
| 专家在线状态 | ExpertCard.tsx | 从数据库读取 |

## 4. Edge Functions

### 4.1 create-checkout-session
创建 Stripe Checkout 会话，支持：
- 订阅模式 (会员)
- 一次性支付模式 (12月预测)

### 4.2 stripe-webhook
处理 Stripe 事件：
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed

## 5. 实现任务分解

### Task 1: 数据库迁移
- 创建所有新表
- 更新 profiles 表
- 添加 RLS 策略

### Task 2: Stripe 集成
- Edge Function: create-checkout-session
- Edge Function: stripe-webhook
- 前端 Stripe 集成

### Task 3: 积分兑换页面
- 新建 /rewards 页面
- RewardCard 组件
- 兑换逻辑和确认弹窗

### Task 4: 会员订阅页面
- 新建 /membership 页面
- 价格卡片组件
- 订阅状态显示

### Task 5: 12月预测功能
- 新建 /horoscope/yearly 页面
- AI 生成 12 月预测
- 解锁状态管理

### Task 6: 法律页面 + Newsletter
- 创建 3 个法律页面
- 修复 Footer 链接
- 实现 Newsletter 订阅

### Task 7: 前端修复
- 专家过滤器
- 商品排序
- Grimoire 保存
- 收藏夹跳转
- Premium 标签动态化
- Daily Insight 动态化
- 塔罗标签动态化
- 专家在线状态
