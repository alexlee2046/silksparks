/**
 * Supabase Edge Function AI Provider
 *
 * 通过 Supabase Edge Function 调用 AI，API Key 安全存储在服务端
 */

import { supabase } from "../supabase";
import type {
  IAIService,
  AIResponseMeta,
  BirthChartAnalysisRequest,
  BirthChartAnalysisResponse,
  TarotReadingRequest,
  TarotReadingResponse,
  TarotFollowUpRequest,
  TarotFollowUpResponse,
  DailySparkRequest,
  DailySparkResponse,
  LuckyElements,
} from "./types";
import { AIProvider as AIProviderEnum } from "./types";
import { extractSection, parseJSONFromText } from "./utils";
import { EDGE_FUNCTION_NAME, FALLBACK_MESSAGES } from "./constants";

// ============ 类型定义 ============

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

interface EdgeFunctionResponse {
  success: boolean;
  data?: { text: string };
  error?: string;
  errorCode?: string;
  meta: {
    provider: string;
    model: string;
    latencyMs?: number;
    isFallback?: boolean;
    tokenUsage?: TokenUsage;
  };
}

interface ExtendedAIResponseMeta extends AIResponseMeta {
  isFallback?: boolean;
  errorMessage?: string;
}

// ============ 自定义错误类 ============

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ============ Supabase Provider 实现 ============

class SupabaseAIProviderImpl implements IAIService {
  readonly name = "Supabase Edge Function AI Provider";
  readonly provider = AIProviderEnum.SUPABASE;

  /**
   * 调用 Edge Function
   * 模型由 Edge Function 从 system_settings 配置获取
   */
  private async callEdgeFunction(
    type: "birth_chart" | "tarot" | "tarot_followup" | "daily_spark",
    payload: Record<string, unknown>,
    locale: "zh-CN" | "en-US" = "en-US",
  ): Promise<{ text: string; meta: ExtendedAIResponseMeta }> {
    const startTime = Date.now();

    try {
      const { data, error } =
        await supabase.functions.invoke<EdgeFunctionResponse>(EDGE_FUNCTION_NAME, {
          body: { type, payload, locale },
        });

      if (error) {
        console.error("[SupabaseAIProvider] Edge Function error:", error);
        throw new Error(error.message || "Edge Function 调用失败");
      }

      // 处理速率限制错误
      if (data?.errorCode === "RATE_LIMIT_EXCEEDED") {
        throw new RateLimitError(data.error || "Daily AI request limit exceeded");
      }

      if (!data?.success || !data.data?.text) {
        throw new Error(data?.error || "无效的响应数据");
      }

      // 解析 token 使用量 (匹配 AIResponseMeta.tokenUsage 接口)
      const tokenUsage = data.meta?.tokenUsage
        ? {
            prompt: data.meta.tokenUsage.input,
            completion: data.meta.tokenUsage.output,
            total: data.meta.tokenUsage.total,
          }
        : undefined;

      return {
        text: data.data.text,
        meta: {
          provider: AIProviderEnum.SUPABASE,
          model: data.meta?.model || "unknown",
          latencyMs: data.meta?.latencyMs ?? (Date.now() - startTime),
          cached: false,
          isFallback: data.meta?.isFallback ?? false,
          tokenUsage,
        },
      };
    } catch (error) {
      // 重新抛出 RateLimitError 让调用方处理
      if (error instanceof RateLimitError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("[SupabaseAIProvider] 调用失败:", errorMessage);

      // 优雅降级：返回友好的错误消息，但标记为 fallback
      return {
        text: this.getFallbackMessage(type),
        meta: {
          provider: AIProviderEnum.SUPABASE,
          model: "fallback",
          latencyMs: Date.now() - startTime,
          cached: false,
          isFallback: true,
          errorMessage,
        },
      };
    }
  }

  /**
   * 获取降级消息
   */
  private getFallbackMessage(type: string): string {
    return (
      FALLBACK_MESSAGES[type as keyof typeof FALLBACK_MESSAGES] ||
      FALLBACK_MESSAGES.default
    );
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
          extractSection(text, "Core Essence") || text.slice(0, 150),
        moonEmotions: extractSection(text, "Emotional") || "",
        elementAdvice: extractSection(text, "Balance") || "",
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
          position: c.position,
          arcana: c.arcana,
        })),
        question: request.question,
        spreadType: request.spreadType,
        userBirthData: request.userBirthData,
        historyContext: request.historyContext,
      },
      request.locale,
    );

    // Try to parse JSON response from AI
    const parsed = parseJSONFromText<{
      coreMessage?: string;
      interpretation?: string;
      actionAdvice?: string;
      luckyElements?: LuckyElements;
    }>(text);

    // If parsed successfully, use structured data
    if (parsed) {
      return {
        interpretation: parsed.interpretation || text,
        coreMessage: parsed.coreMessage,
        actionAdvice: parsed.actionAdvice || "",
        luckyElements: parsed.luckyElements,
        cardInterpretations: request.cards.map((card) => ({
          cardId: card.id,
          meaning: "",
          advice: "",
        })),
        meta,
      };
    }

    // Fallback: use raw text with section extraction
    return {
      interpretation: text,
      cardInterpretations: request.cards.map((card) => ({
        cardId: card.id,
        meaning: "",
        advice: "",
      })),
      actionAdvice: extractSection(text, "Action") || "",
      meta,
    };
  }

  async generateTarotFollowUp(
    request: TarotFollowUpRequest,
  ): Promise<TarotFollowUpResponse> {
    const { text, meta } = await this.callEdgeFunction(
      "tarot_followup",
      {
        cards: request.cards.map((c) => ({
          name: c.name,
          isReversed: c.isReversed,
          position: c.position,
          arcana: c.arcana,
        })),
        originalInterpretation: request.originalInterpretation,
        conversationHistory: request.conversationHistory,
        followUpQuestion: request.followUpQuestion,
        userBirthData: request.userBirthData,
      },
      request.locale,
    );

    return {
      answer: text,
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
}

// ============ 导出单例 ============

export const SupabaseAIProvider = new SupabaseAIProviderImpl();
