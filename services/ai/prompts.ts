/**
 * AI 提示词模板管理
 * 集中管理所有 AI 提示词，便于调优和国际化
 */

import type {
  BirthChartAnalysisRequest,
  TarotReadingRequest,
  DailySparkRequest,
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

    QUICK_INSIGHT: (req: BirthChartAnalysisRequest) => `
Give a brief cosmic insight for ${req.name} with Sun in ${req.planets.Sun} and Moon in ${req.planets.Moon}.
Their dominant element is ${Object.entries(req.elements).sort(([, a], [, b]) => b - a)[0][0]}.
2-3 sentences max. Make it personal and actionable.
`,
  },

  // 塔罗解读
  TAROT: {
    SINGLE_CARD: (req: TarotReadingRequest) => {
      const card = req.cards[0];
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
      const [past, present, future] = req.cards;
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
