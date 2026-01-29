# Silk & Spark 增长留存与动画优化设计方案

> 日期：2026-01-29
> 状态：待实施
> 策略方向：病毒传播 + 产品粘性 + 动画/视频优化

---

## 一、项目背景

### 现状分析

**已有基础设施：**
- 每日塔罗 + AI 解读（TarotDaily.tsx）
- 星盘分析（AstrologyReport.tsx）
- 积分/等级系统（points、tier 字段）
- TarotShareCard 组件（已实现，未接入）
- 商品推荐引擎（RecommendationEngine.ts）
- Framer Motion 动画（57 个文件）

**明显缺口：**
- 分享按钮只显示 toast，未接入 TarotShareCard
- 无病毒传播机制（邀请系统）
- 每日回访理由不够强
- 积分兑换显示 "coming soon"
- 动画风格不统一，缺少仪式感

### 目标指标

| 指标 | 当前基准 | 3个月目标 |
|------|----------|-----------|
| 日活跃用户（DAU） | - | 可追踪 |
| 次日留存率 | - | >30% |
| 7日留存率 | - | >15% |
| 分享率（分享/抽牌） | 0% | >10% |
| 邀请转化率 | - | >5% |

---

## 二、病毒传播系统

### 2.1 分享流程优化（P0）

**问题：** TarotDaily.tsx 第 424 行分享按钮只是 `toast.success()`

**方案：**

1. **接入现有 TarotShareCard 组件**
   ```tsx
   // TarotDaily.tsx 新增状态
   const [showShareCard, setShowShareCard] = useState(false);

   // 分享按钮改为
   onClick={() => setShowShareCard(true)}

   // 渲染 ShareCard
   {showShareCard && card && (
     <TarotShareCard
       card={card}
       coreMessage={coreMessage}
       interpretation={interpretation}
       onClose={() => setShowShareCard(false)}
     />
   )}
   ```

2. **增强分享卡片**
   - 添加二维码（链接到 `silksparks.com/tarot?ref={userId}`）
   - 分享后获得 +15 Spark Points
   - 支持多平台分享（微信、微博、Twitter、Instagram）

3. **AstrologyReport 同样接入分享功能**

**工作量：** 2-4 小时

### 2.2 邀请系统（P1）

**数据库变更：**

```sql
-- profiles 表新增字段
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);

-- 新增邀请奖励表
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) NOT NULL,
  referred_id UUID REFERENCES profiles(id) NOT NULL,
  reward_type TEXT NOT NULL, -- 'signup', 'first_purchase'
  points_awarded INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动生成 referral_code 触发器
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
```

**奖励机制：**

| 事件 | 邀请者奖励 | 被邀请者福利 |
|------|------------|--------------|
| 注册成功 | +50 Points | 首次塔罗解读免费 |
| 首次付费 | +200 Points 或 5% 返现 | - |

**展示位置：**
- Dashboard「邀请好友」卡片
- 分享卡片底部显示邀请码
- 设置页面「我的邀请码」

**工作量：** 2-3 天

---

## 三、产品粘性系统

### 3.1 每日签到（P0）

**数据库变更：**

```sql
-- profiles 表新增字段
ALTER TABLE profiles ADD COLUMN last_checkin_date DATE;
ALTER TABLE profiles ADD COLUMN streak_days INTEGER DEFAULT 0;

-- 签到历史表（可选，用于数据分析）
CREATE TABLE checkin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  checkin_date DATE NOT NULL,
  streak_days INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);
```

**奖励规则：**

| 连续天数 | 积分奖励 | 额外福利 |
|----------|----------|----------|
| 第 1 天 | +5 | - |
| 第 2 天 | +10 | - |
| 第 3 天 | +15 | - |
| 第 7 天 | +50 | 免费塔罗三牌阵 |
| 第 14 天 | +100 | 专家咨询 10% 折扣券 |
| 第 30 天 | +200 | 等级升级 |

**UI 设计：**
- 首次访问弹出签到卡片（可关闭）
- 显示连续签到日历
- 动画：积分数字飞入 + 连击火焰特效

**工作量：** 1-2 天

### 3.2 积分系统完善（P1）

**积分获取渠道：**

| 行为 | 积分 | 频率限制 |
|------|------|----------|
| 每日签到 | 5-200 | 每日 1 次 |
| 完成塔罗解读 | +10 | 每日 3 次 |
| 生成星盘报告 | +20 | 每周 1 次 |
| 分享到社交媒体 | +15 | 每日 2 次 |
| 成功邀请好友 | +50 | 无限制 |
| 购买商品 | 消费额 × 1% | 无限制 |
| 完成专家咨询 | +100 | 无限制 |

**数据库变更：**

```sql
-- 积分流水表
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL, -- 正数获得，负数消耗
  type TEXT NOT NULL, -- 'checkin', 'tarot', 'share', 'referral', 'purchase', 'redeem'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户优惠券表
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  coupon_type TEXT NOT NULL, -- 'discount_5', 'expert_15min', 'vip_7day'
  value INTEGER, -- 折扣金额或时长
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**奖励兑换选项：**

| 奖励 | 所需积分 | 类型 |
|------|----------|------|
| 免费塔罗三牌阵 | 200 | 功能解锁 |
| 商品 $5 优惠券 | 500 | 折扣 |
| 专家咨询 15 分钟 | 1000 | 服务 |
| 限定版塔罗壁纸包 | 300 | 虚拟商品 |
| VIP 会员 7 天体验 | 800 | 会员特权 |

**等级权益：**

| 等级 | 累计积分 | 专属权益 |
|------|----------|----------|
| Star Walker | 0 | 基础功能 |
| Nebula Navigator | 1000 | 每日塔罗 +1 次、专属徽章 |
| Cosmic Voyager | 5000 | AI 解读优先队列、生日特权 |
| Astral Master | 15000 | 专家咨询 9 折、限定商品优先购 |

**工作量：** 1-2 天

---

## 四、动画优化系统

### 4.1 统一动画系统（P1）

**创建 `lib/animations.ts`：**

```typescript
import { Variants, Transition } from "framer-motion";

// 统一过渡配置
export const transitions = {
  spring: { type: "spring", stiffness: 100, damping: 15 } as Transition,
  smooth: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as Transition,
  snappy: { duration: 0.3, ease: "easeOut" } as Transition,
};

// 通用动画变体
export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.smooth },
  } as Variants,

  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: transitions.smooth },
  } as Variants,

  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: transitions.spring },
  } as Variants,

  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  } as Variants,
};

// 页面切换动画
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: transitions.smooth,
};
```

### 4.2 塔罗动画增强（P2）

**洗牌动画：**

```
阶段 1（0-0.5s）：卡牌从堆叠展开成扇形
阶段 2（0.5-1.5s）：卡牌随机位移 + 轻微旋转
阶段 3（1.5-2s）：卡牌重新排列成可选择的弧形
可选：背景星尘粒子飘散效果
```

**揭牌动画：**

```
阶段 1：选中卡牌上浮 + 其他卡牌淡出
阶段 2：卡牌放大移至屏幕中央
阶段 3：光晕从卡牌中心扩散
阶段 4：翻转揭示（rotateY 180°）
阶段 5：卡牌落定 + 解读区域滑入
```

**工作量：** 2-3 天

### 4.3 微交互增强（P2）

**购物车飞入动画：**

```typescript
// 获取商品图片位置和购物车图标位置
// 创建商品缩略图克隆元素
// 贝塞尔曲线路径动画飞向购物车
// 到达时缩小 + 淡出
// 购物车图标弹跳 + 数字 +1 动画
```

**签到成功动画：**
- 积分数字从签到按钮飞向顶部积分显示
- 连续签到显示火焰/星星 combo 特效

**性能考量：**
- 使用 `will-change` 和 `transform`（GPU 加速）
- 首屏动画延迟加载
- 粒子效果使用 Canvas
- 提供 `prefers-reduced-motion` 降级方案

**工作量：** 0.5-1 天

---

## 五、Remotion 视频分享系统

### 5.1 概述

使用 Remotion 框架为塔罗/占星结果生成**短视频**，大幅提升社交传播力。

**优势对比：**

| 维度 | 静态图片 | 短视频 |
|------|----------|--------|
| 社交平台权重 | 低 | 高（算法偏爱视频） |
| 用户停留时间 | 1-2秒 | 8-15秒 |
| 分享意愿 | 中 | 高（更有仪式感） |

### 5.2 应用场景

| 场景 | 视频内容 | 时长 | 渠道 |
|------|----------|------|------|
| 塔罗抽牌结果 | 翻牌动画 + 牌面 + 解读字幕 | 8-15秒 | 抖音/小红书/Reels |
| 星座运势 | 星座符号动画 + 运势要点 | 10-20秒 | 朋友圈/Stories |
| 年度总结 | 用户数据驱动的个性化回顾 | 30-60秒 | 年终裂变 |

### 5.3 技术架构

```
用户抽牌
    ↓
触发渲染请求
    ↓
Supabase Edge Function
    ↓
Remotion Lambda 渲染
    ↓
生成 MP4 → 存储到 Supabase Storage
    ↓
返回视频 URL
    ↓
前端 Web Share API / 下载
```

**前端预览：** 使用 `@remotion/player` 组件

**视频规格：**
- 分辨率：1080×1920（竖屏）或 1080×1080（方形）
- 帧率：30fps
- 编码：H.264
- 水印：右下角品牌 Logo + 二维码

### 5.4 塔罗视频 Composition 设计

```typescript
// src/remotion/TarotReveal.tsx
import { Composition, Sequence, useCurrentFrame, interpolate, spring } from "remotion";

export const TarotRevealVideo: React.FC<{
  cardName: string;
  cardImage: string;
  isReversed: boolean;
  coreMessage: string;
}> = ({ cardName, cardImage, isReversed, coreMessage }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* 0-30帧：卡牌背面悬浮 */}
      <Sequence from={0} durationInFrames={30}>
        <CardBack />
      </Sequence>

      {/* 30-60帧：翻牌动画 */}
      <Sequence from={30} durationInFrames={30}>
        <CardFlip cardImage={cardImage} isReversed={isReversed} />
      </Sequence>

      {/* 60-90帧：牌面展示 + 光效 */}
      <Sequence from={60} durationInFrames={30}>
        <CardReveal cardName={cardName} />
      </Sequence>

      {/* 90-150帧：解读文字滚动 */}
      <Sequence from={90} durationInFrames={60}>
        <InterpretationText text={coreMessage} />
      </Sequence>

      {/* 全程：品牌水印 */}
      <BrandWatermark />
    </AbsoluteFill>
  );
};

// Root.tsx 注册
<Composition
  id="TarotReveal"
  component={TarotRevealVideo}
  durationInFrames={150}  // 5秒 @ 30fps
  fps={30}
  width={1080}
  height={1920}
  defaultProps={{
    cardName: "The Fool",
    cardImage: "...",
    isReversed: false,
    coreMessage: "New beginnings await...",
  }}
/>
```

### 5.5 实施阶段

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| Phase 1 | 前端预览 + 本地渲染 | 3-5 天 |
| Phase 2 | 服务端渲染（Lambda） | 2-3 天 |
| Phase 3 | 星座运势视频 | 2-3 天 |
| Phase 4 | 年度总结视频 | 5-7 天 |

**工作量（P2）：** Phase 1-2 约 1 周

---

## 六、Frontend Design 指导原则

### 6.1 设计方向

**品牌调性：** Mystical Luxury（神秘奢华）

**核心特征：**
- 深色背景 + 金色点缀（#F4C025）
- 优雅的衬线字体（Display）+ 现代无衬线（Body）
- 光晕、粒子、星尘等神秘元素
- 流畅的过渡动画，强调仪式感

### 6.2 避免的 AI 通用风格

**禁止使用：**
- 通用字体：Inter、Roboto、Arial、系统字体
- 俗套配色：紫色渐变、过度使用白色背景
- 预测性布局：千篇一律的卡片网格

**应该追求：**
- 独特字体：如 Playfair Display、Cormorant、自定义字体
- 有意图的配色：深色主题 + 金色强调色
- 非对称布局、重叠元素、对角线流动

### 6.3 动画设计原则

**高影响力时刻优先：**
- 页面加载的 staggered reveal
- 塔罗翻牌的仪式感
- 签到成功的庆祝动画

**性能与体验平衡：**
- CSS 动画优先
- 复杂动画使用 Framer Motion
- 3D 效果使用 React Three Fiber（按需加载）
- 始终提供 `prefers-reduced-motion` 降级

---

## 七、实施优先级

| 优先级 | 模块 | 工作量 | 预期收益 |
|--------|------|--------|----------|
| **P0** | 分享流程修复 | 2-4h | 立即启用病毒传播 |
| **P0** | 每日签到系统 | 1-2d | 核心留存钩子 |
| **P1** | 积分兑换页面 | 1-2d | 激活已有积分系统 |
| **P1** | 统一动画系统 | 1d | 提升整体质感 |
| **P1** | 邀请系统 | 2-3d | 裂变增长引擎 |
| **P2** | 塔罗动画增强 | 2-3d | 提升仪式感和分享欲 |
| **P2** | Remotion 视频分享 | 5-7d | 社交传播力跃升 |
| **P2** | 购物车飞入动画 | 0.5d | 提升购买体验 |

---

## 八、数据库变更汇总

```sql
-- ============ profiles 表新增字段 ============
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN last_checkin_date DATE;
ALTER TABLE profiles ADD COLUMN streak_days INTEGER DEFAULT 0;

-- ============ 新增表 ============

-- 签到历史
CREATE TABLE checkin_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  checkin_date DATE NOT NULL,
  streak_days INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 邀请奖励
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) NOT NULL,
  referred_id UUID REFERENCES profiles(id) NOT NULL,
  reward_type TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 积分流水
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户优惠券
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  coupon_type TEXT NOT NULL,
  value INTEGER,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 触发器 ============

-- 自动生成邀请码
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- ============ RLS 策略 ============

ALTER TABLE checkin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据
CREATE POLICY "Users can view own checkins" ON checkin_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own points" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own coupons" ON user_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own referrals" ON referral_rewards
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
```

---

## 九、相关技术文档

实施时参考以下 skills：

- **remotion-video**: Remotion 视频制作完整指南，包含 3D 动画、音频同步、Lambda 渲染
- **frontend-design**: 避免 AI 通用风格，创建独特视觉体验的设计原则

---

## 十、下一步行动

1. **审批本设计方案**
2. **创建实施计划**（使用 `superpowers:writing-plans` skill）
3. **设置 Git Worktree** 隔离开发环境
4. **按 P0 → P1 → P2 顺序实施**

---

*Generated with Claude Code*
