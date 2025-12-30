/**
 * Supabase Edge Function AI Provider
 *
 * 通过 Supabase Edge Function 调用 AI，API Key 安全存储在服务端
 */

import { supabase } from "../supabase";
import type {
  IAIService,
  AIProvider,
  AIResponseMeta,
  BirthChartAnalysisRequest,
  BirthChartAnalysisResponse,
  TarotReadingRequest,
  TarotReadingResponse,
  DailySparkRequest,
  DailySparkResponse,
} from "./types";
import { AIProvider as AIProviderEnum } from "./types";

// ============ 类型定义 ============

interface EdgeFunctionResponse {
  success: boolean;
  data?: { text: string };
  error?: string;
  meta: {
    provider: string;
    model: string;
    latencyMs: number;
  };
}

// ============ 配置 ============

/** Edge Function 名称 */
const FUNCTION_NAME = "ai-generate";

/** 开发环境回退到直接调用（如果本地没有运行 Edge Function） */
const DEV_FALLBACK =
  import.meta.env.DEV && import.meta.env.VITE_AI_DEV_MODE === "direct";

// ============ Supabase Provider 实现 ============

class SupabaseAIProviderImpl implements IAIService {
  readonly name = "Supabase Edge Function AI Provider";
  readonly provider = AIProviderEnum.GEMINI;
  private defaultModel = "google/gemini-2.0-flash-exp:free";

  /**
   * 调用 Edge Function
   */
  private async callEdgeFunction(
    type: "birth_chart" | "tarot" | "daily_spark",
    payload: Record<string, unknown>,
    locale: "zh-CN" | "en-US" = "en-US",
  ): Promise<{ text: string; meta: AIResponseMeta }> {
    const startTime = Date.now();

    try {
      const { data, error } =
        await supabase.functions.invoke<EdgeFunctionResponse>(FUNCTION_NAME, {
          body: { type, payload, locale, model: this.defaultModel },
        });

      if (error) {
        console.error("[SupabaseAIProvider] Edge Function error:", error);
        throw new Error(error.message || "Edge Function 调用失败");
      }

      if (!data?.success || !data.data?.text) {
        throw new Error(data?.error || "无效的响应数据");
      }

      return {
        text: data.data.text,
        meta: {
          provider: AIProviderEnum.GEMINI,
          model: data.meta?.model || "gemini-2.0-flash-exp",
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    } catch (error) {
      console.error("[SupabaseAIProvider] 调用失败:", error);

      // 优雅降级：返回友好的错误消息
      return {
        text: this.getFallbackMessage(type),
        meta: {
          provider: AIProviderEnum.GEMINI,
          model: "fallback",
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      };
    }
  }

  /**
   * 获取降级消息
   */
  private getFallbackMessage(type: string): string {
    const messages: Record<string, string> = {
      birth_chart:
        "宇宙的信号暂时模糊... 请稍后再试，让我们重新连接到星际能量。",
      tarot: "塔罗的帷幕暂时笼罩... 请深呼吸，稍后再次抽取您的牌。",
      daily_spark: "今日的灵感正在酝酿中... 信任直觉，拥抱当下。",
    };
    return messages[type] || "正在连接宇宙能量，请稍后再试...";
  }

  // ============ IAIService 接口实现 ============

  async generateBirthChartAnalysis(
    request: BirthChartAnalysisRequest,
  ): Promise<BirthChartAnalysisResponse> {
    const { text, meta } = await this.callEdgeFunction(
      "birth_chart",
      {
        name: request.name,
        planets: request.planets,
        elements: request.elements,
      },
      request.locale,
    );

    return {
      analysis: text,
      insights: {
        sunTraits:
          this.extractSection(text, "Core Essence") || text.slice(0, 150),
        moonEmotions: this.extractSection(text, "Emotional") || "",
        elementAdvice: this.extractSection(text, "Balance") || "",
      },
      meta,
    };
  }

  async generateTarotReading(
    request: TarotReadingRequest,
  ): Promise<TarotReadingResponse> {
    const { text, meta } = await this.callEdgeFunction(
      "tarot",
      {
        cards: request.cards.map((c) => ({
          name: c.name,
          isReversed: c.isReversed,
        })),
        question: request.question,
        spreadType: request.spreadType,
      },
      request.locale,
    );

    return {
      interpretation: text,
      cardInterpretations: request.cards.map((card) => ({
        cardId: card.id,
        meaning: "",
        advice: "",
      })),
      actionAdvice: this.extractSection(text, "Action") || "",
      meta,
    };
  }

  async generateDailySpark(
    request: DailySparkRequest,
  ): Promise<DailySparkResponse> {
    const { text, meta } = await this.callEdgeFunction(
      "daily_spark",
      { sign: request.sign },
      request.locale,
    );

    return {
      message: text.trim(),
      meta,
    };
  }

  clearCache(): void {
    // 无本地缓存需要清除
  }

  // ============ 辅助方法 ============

  private extractSection(text: string, keyword: string): string | null {
    const regex = new RegExp(`\\*\\*${keyword}[^*]*\\*\\*[:\\s]*([^*]+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }
}

// ============ 导出单例 ============

export const SupabaseAIProvider = new SupabaseAIProviderImpl();
