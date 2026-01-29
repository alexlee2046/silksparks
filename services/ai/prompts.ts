/**
 * AI 提示词模板管理
 * 集中管理所有 AI 提示词，便于调优和国际化
 */

import type {
  BirthChartAnalysisRequest,
  TarotReadingRequest,
  DailySparkRequest,
  FusionAnalysisRequest,
} from "./types";

// ============ 提示词模板 ============

export const PROMPTS = {
  // 系统角色定义
  SYSTEM: {
    ASTROLOGER: `You are a mystical astrology expert combining Western zodiac wisdom with Eastern Five Elements (Wu Xing) philosophy. 
Your readings are insightful, compassionate, and actionable. 
You speak with authority but warmth, like a wise mentor guiding someone on their cosmic journey.
Respond in the same language as the user's request.`,

    TAROT_READER: `You are an experienced Tarot reader with deep intuition and psychological insight.
Your interpretations blend traditional card meanings with modern psychological wisdom.
You provide guidance that is practical, empowering, and respects free will.
Respond in the same language as the user's request.`,

    DAILY_ORACLE: `You are a gentle daily oracle providing brief, uplifting cosmic guidance.
Your messages are poetic yet practical, inspiring without being preachy.
Keep responses concise but meaningful.
Respond in the same language as the user's request.`,

    FUSION_MASTER: `你是精通西方占星和中国八字的命理大师。
你的解读遵循以下原则：
1. 尊重两个传统体系，不强行合并，承认它们的独立价值
2. 寻找真实的联系（如节气与黄道的天文对应），而非牵强附会
3. 引用经典文献支持解读，增加可信度
4. 提供实用的、可执行的建议
5. 用温和专业的语气，既有权威感又亲切可近
根据用户的语言偏好回复。`,
  },

  // 星盘分析
  BIRTH_CHART: {
    FULL_ANALYSIS: (req: BirthChartAnalysisRequest) => `
Analyze the birth chart for ${req.name}.

**Planetary Positions:**
${Object.entries(req.planets)
  .map(([planet, sign]) => `- ${planet}: ${sign}`)
  .join("\n")}

**Five Elements Distribution:**
${Object.entries(req.elements)
  .map(([element, value]) => `- ${element}: ${value}%`)
  .join("\n")}

Please provide:
1. **Core Essence** (2-3 sentences): A summary of their primary cosmic identity based on Sun, Moon, and dominant elements.
2. **Emotional Landscape** (2-3 sentences): How their Moon sign and Water/Fire balance affects their emotional nature.
3. **Life Path Guidance** (2-3 sentences): Practical advice based on their Mars, Jupiter positions and elemental strengths.
4. **Balance Recommendations**: What element they should cultivate to achieve better harmony.

Format your response as flowing paragraphs, not bullet points. Be specific to their chart, not generic.
`,

    QUICK_INSIGHT: (req: BirthChartAnalysisRequest) => {
      const sortedElements = Object.entries(req.elements).sort(([, a], [, b]) => b - a);
      const dominantElement = sortedElements[0]?.[0] ?? "Fire";
      return `
Give a brief cosmic insight for ${req.name} with Sun in ${req.planets.Sun} and Moon in ${req.planets.Moon}.
Their dominant element is ${dominantElement}.
2-3 sentences max. Make it personal and actionable.
`;
    },
  },

  // 塔罗解读
  TAROT: {
    SINGLE_CARD: (req: TarotReadingRequest) => {
      const card = req.cards[0]!;
      return `
The seeker asked: "${req.question}"

They drew: **${card.name}** ${card.isReversed ? "(Reversed)" : "(Upright)"}

Provide:
1. **Card Message** (2-3 sentences): What this card reveals about their question.
2. **Shadow Aspect**: What hidden challenge or blind spot the card highlights.
3. **Action Step**: One concrete action they can take based on this guidance.

Be specific to the question asked. Avoid generic meanings.
`;
    },

    THREE_CARD_SPREAD: (req: TarotReadingRequest) => {
      const past = req.cards[0]!;
      const present = req.cards[1]!;
      const future = req.cards[2]!;
      return `
The seeker asked: "${req.question}"

**Three Card Spread:**
- Past: ${past.name} ${past.isReversed ? "(Reversed)" : ""}
- Present: ${present.name} ${present.isReversed ? "(Reversed)" : ""}
- Future: ${future.name} ${future.isReversed ? "(Reversed)" : ""}

Provide:
1. **The Story Arc** (3-4 sentences): Weave the three cards into a cohesive narrative addressing their question.
2. **Key Insight**: The most important realization from this spread.
3. **Empowering Action**: How they can actively shape their future based on this reading.

Connect the cards meaningfully. The future card shows potential, not fixed destiny.
`;
    },
  },

  // 每日灵感
  DAILY_SPARK: {
    GENERAL: (req: DailySparkRequest) => `
Provide a brief daily spark message${req.sign ? ` for ${req.sign}` : ""}.
Maximum 25 words. Poetic but practical. Inspire action or reflection.
Include a lucky color and number if naturally fitting.
`,

    PERSONALIZED: (req: DailySparkRequest) => `
Create a personalized daily guidance for someone ${req.sign ? `with ${req.sign} Sun sign` : ""}.
Today's cosmic energy suggests: [consider current astrological transits].
Maximum 30 words. Make it feel personally crafted.
`,
  },

  // 东西方融合分析
  FUSION: {
    FULL_ANALYSIS: (req: FusionAnalysisRequest) => {
      const quotesSection =
        req.quotes && req.quotes.length > 0
          ? `
**经典引用：**
${req.quotes.map((q) => `《${q.source}》：「${q.originalText}」——${q.translation}`).join("\n")}`
          : "";

      return `
为${req.name}提供东西方命理融合分析。

**八字信息：**
- 四柱：${req.baziData.fourPillars}
- 日主：${req.baziData.dayMaster}（${req.baziData.dayMasterElement}）
- 日主强弱：${req.baziData.strength}
- 五行分布：${Object.entries(req.baziData.wuXingDistribution).map(([e, p]) => `${e}${p}%`).join(" ")}
- 喜用神：${req.baziData.favorableElements.join("、")}
- 忌神：${req.baziData.unfavorableElements.join("、")}

**西方星盘：**
- 太阳星座：${req.westernData.sunSign}
- 月亮星座：${req.westernData.moonSign}
- 主导元素：${req.westernData.dominantElement}
${quotesSection}

请提供${req.tier === "free" ? "简要" : "详细"}的融合分析：

1. **东方视角** (${req.tier === "free" ? "2句" : "3-4句"})：基于八字日主和五行的核心特质分析。

2. **西方视角** (${req.tier === "free" ? "2句" : "3-4句"})：基于太阳月亮星座的性格与情感分析。

3. **融合洞察** (${req.tier === "free" ? "2句" : "4-5句"})：两个体系的共鸣点和互补之处。探讨它们如何共同描绘此人的命理图景。

4. **实用建议**：
   - 幸运色彩：基于喜用神
   - 有利时机：基于五行旺衰
   - 需要注意：基于忌神和挑战

用温和专业的语气，结合经典智慧与现代心理学视角。${req.locale === "zh-CN" ? "请用中文回复。" : ""}
`;
    },

    BRIEF_INSIGHT: (req: FusionAnalysisRequest) => `
为${req.name}提供简短的东西方命理融合洞察。

八字日主：${req.baziData.dayMaster}（${req.baziData.dayMasterElement}）
太阳星座：${req.westernData.sunSign}

3-4句话概述这两个体系的交汇点。要具体、有洞察力。${req.locale === "zh-CN" ? "请用中文回复。" : ""}
`,
  },
} as const;

// ============ 提示词工具函数 ============

/**
 * 根据语言环境包装提示词
 */
export function wrapWithLocale(
  prompt: string,
  locale: "zh-CN" | "en-US" = "en-US",
): string {
  if (locale === "zh-CN") {
    return `${prompt}\n\n请用中文回复。使用优雅、富有诗意的表达。`;
  }
  return prompt;
}

/**
 * 组合系统提示词和用户提示词
 */
export function buildPrompt(
  systemRole: keyof typeof PROMPTS.SYSTEM,
  userPrompt: string,
  locale?: "zh-CN" | "en-US",
): { system: string; user: string } {
  return {
    system: PROMPTS.SYSTEM[systemRole],
    user: wrapWithLocale(userPrompt, locale),
  };
}
