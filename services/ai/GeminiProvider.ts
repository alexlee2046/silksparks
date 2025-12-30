/**
 * Gemini AI 提供商实现
 * 封装 Google Gemini SDK，实现 IAIService 接口
 */

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
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
  AIRequestConfig,
} from "./types";
import { PROMPTS, buildPrompt } from "./prompts";

// ============ 配置 ============

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/** 默认配置 */
const DEFAULT_CONFIG: AIRequestConfig = {
  model: "gemini-2.0-flash-exp",
  temperature: 0.7,
  maxTokens: 2048,
};

/** 缓存时间 (1 分钟) */
const CACHE_TTL = 60 * 1000;

// ============ Gemini Provider 实现 ============

class GeminiProviderImpl implements IAIService {
  readonly name = "Gemini AI Provider";
  readonly provider = "gemini" as AIProvider;

  private genAI: GoogleGenerativeAI | null;
  private configCache: AIRequestConfig | null = null;
  private lastConfigFetch = 0;

  constructor() {
    this.genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

    if (!API_KEY) {
      console.warn("[GeminiProvider] API Key 未配置，将使用 Mock 模式。");
    }
  }

  /**
   * 获取远程配置 (从 Supabase system_settings)
   */
  private async getRemoteConfig(): Promise<AIRequestConfig> {
    const now = Date.now();
    if (this.configCache && now - this.lastConfigFetch < CACHE_TTL) {
      return this.configCache;
    }

    try {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "ai_config")
        .single();

      if (data?.value) {
        this.configCache = { ...DEFAULT_CONFIG, ...data.value };
        this.lastConfigFetch = now;
        return this.configCache;
      }
    } catch (err) {
      console.warn("[GeminiProvider] 获取远程配置失败，使用默认配置:", err);
    }

    return DEFAULT_CONFIG;
  }

  /**
   * 获取 Gemini 模型实例
   */
  private async getModel(): Promise<GenerativeModel | null> {
    if (!this.genAI) return null;

    const config = await this.getRemoteConfig();
    return this.genAI.getGenerativeModel({
      model: config.model || DEFAULT_CONFIG.model!,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    });
  }

  /**
   * 执行 AI 生成
   */
  private async generate(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ text: string; meta: AIResponseMeta }> {
    const startTime = Date.now();
    const config = await this.getRemoteConfig();

    // Mock 模式
    if (!this.genAI) {
      await this.simulateDelay();
      return {
        text: this.getMockResponse(userPrompt),
        meta: this.buildMeta(startTime, config.model!, true),
      };
    }

    try {
      const model = await this.getModel();
      if (!model) throw new Error("无法初始化模型");

      // Gemini 使用 contents 格式
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
      });

      const response = await result.response;
      const text = response.text();

      return {
        text,
        meta: this.buildMeta(startTime, config.model!, false),
      };
    } catch (error) {
      console.error("[GeminiProvider] 生成失败:", error);
      throw error;
    }
  }

  /**
   * 构建响应元数据
   */
  private buildMeta(
    startTime: number,
    model: string,
    cached: boolean,
  ): AIResponseMeta {
    return {
      provider: this.provider,
      model,
      latencyMs: Date.now() - startTime,
      cached,
    };
  }

  /**
   * 模拟延迟 (Mock 模式)
   */
  private async simulateDelay(): Promise<void> {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
  }

  /**
   * 获取 Mock 响应
   */
  private getMockResponse(prompt: string): string {
    if (prompt.includes("birth chart") || prompt.includes("Planetary")) {
      return `[MOCK] 您的星盘显示出独特的宇宙能量组合。您的太阳星座赋予您核心的生命力，而月亮星座则塑造了您的情感世界。五行中的主导元素为您提供了天然的优势领域。建议您在日常生活中多接触能够平衡不足元素的事物，以达到更和谐的能量状态。`;
    }
    if (prompt.includes("Tarot") || prompt.includes("card")) {
      return `[MOCK] 这张塔罗牌揭示了当前能量场中的重要信息。它暗示着转变正在发生，您需要信任内在的智慧。建议您保持开放的心态，允许新的可能性进入生活。`;
    }
    return `[MOCK] 今日宇宙能量提示：信任直觉，拥抱变化。幸运色：紫色，幸运数字：7。`;
  }

  // ============ 接口实现 ============

  async generateBirthChartAnalysis(
    request: BirthChartAnalysisRequest,
  ): Promise<BirthChartAnalysisResponse> {
    const { system, user } = buildPrompt(
      "ASTROLOGER",
      PROMPTS.BIRTH_CHART.FULL_ANALYSIS(request),
      request.locale,
    );

    const { text, meta } = await this.generate(system, user);

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
    const promptFn =
      request.spreadType === "single"
        ? PROMPTS.TAROT.SINGLE_CARD
        : PROMPTS.TAROT.THREE_CARD_SPREAD;

    const { system, user } = buildPrompt(
      "TAROT_READER",
      promptFn(request),
      request.locale,
    );

    const { text, meta } = await this.generate(system, user);

    return {
      interpretation: text,
      cardInterpretations: request.cards.map((card) => ({
        cardId: card.id,
        meaning: this.extractCardMeaning(text, card.name) || "",
        advice: "",
      })),
      actionAdvice: this.extractSection(text, "Action") || "",
      meta,
    };
  }

  async generateDailySpark(
    request: DailySparkRequest,
  ): Promise<DailySparkResponse> {
    const { system, user } = buildPrompt(
      "DAILY_ORACLE",
      PROMPTS.DAILY_SPARK.GENERAL(request),
      request.locale,
    );

    const { text, meta } = await this.generate(system, user);

    return {
      message: text.replace(/\[MOCK\]\s*/g, "").trim(),
      meta,
    };
  }

  clearCache(): void {
    this.configCache = null;
    this.lastConfigFetch = 0;
    console.log("[GeminiProvider] 缓存已清除");
  }

  // ============ 辅助方法 ============

  private extractSection(text: string, keyword: string): string | null {
    const regex = new RegExp(`\\*\\*${keyword}[^*]*\\*\\*[:\\s]*([^*]+)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractCardMeaning(text: string, cardName: string): string | null {
    const regex = new RegExp(`${cardName}[^.]*\\.`, "i");
    const match = text.match(regex);
    return match ? match[0] : null;
  }
}

// ============ 导出单例 ============

export const GeminiProvider = new GeminiProviderImpl();
