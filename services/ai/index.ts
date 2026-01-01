/**
 * AI 服务统一入口
 * 提供解耦的 AI 服务访问层
 */

import { GeminiProvider } from "./GeminiProvider";
import { SupabaseAIProvider } from "./SupabaseAIProvider";
import {
  AIProvider,
  type IAIService,
  type BirthChartAnalysisRequest,
  type BirthChartAnalysisResponse,
  type TarotReadingRequest,
  type TarotReadingResponse,
  type TarotFollowUpRequest,
  type TarotFollowUpResponse,
  type DailySparkRequest,
  type DailySparkResponse,
  type PlanetaryPositions,
  type FiveElements,
  type TarotCard,
  type LuckyElements,
} from "./types";

// ============ 服务注册 ============

/**
 * 可用的 AI 提供商
 *
 * - GEMINI: 直接调用 Gemini API (需要前端 API Key，不推荐生产使用)
 * - SUPABASE: 通过 Supabase Edge Function 调用 (推荐，API Key 安全)
 */
const providers: Record<AIProvider, IAIService | null> = {
  [AIProvider.GEMINI]: GeminiProvider, // 开发/调试用
  [AIProvider.SUPABASE]: SupabaseAIProvider, // 生产推荐 (Edge Function)
  [AIProvider.OPENAI]: null, // 未来扩展
  [AIProvider.ANTHROPIC]: null, // 未来扩展
  [AIProvider.MOCK]: null, // Mock 实现
};

/**
 * 当前使用的提供商
 * 生产环境默认使用 Supabase Edge Function (安全)
 * 开发环境可通过 VITE_AI_PROVIDER 环境变量覆盖
 */
const getInitialProvider = (): AIProvider => {
  const envProvider = import.meta.env.VITE_AI_PROVIDER;
  if (envProvider === "supabase") return AIProvider.SUPABASE;
  if (envProvider === "gemini") return AIProvider.GEMINI;
  // 默认回退：如果已经部署了 Supabase 就用 Supabase，否则用 Gemini
  return AIProvider.SUPABASE;
};

let currentProvider: AIProvider = getInitialProvider();

// ============ 服务管理 ============

/**
 * 获取当前 AI 服务实例
 */
function getService(): IAIService {
  const service = providers[currentProvider];
  if (!service) {
    throw new Error(`AI 提供商 "${currentProvider}" 不可用`);
  }
  return service;
}

/**
 * 切换 AI 提供商
 */
export function setAIProvider(provider: AIProvider): void {
  if (!providers[provider]) {
    console.warn(`[AIService] 提供商 "${provider}" 未实现，保持当前设置`);
    return;
  }
  currentProvider = provider;
}

/**
 * 获取当前提供商
 */
export function getCurrentProvider(): AIProvider {
  return currentProvider;
}

// ============ 简化 API ============

/**
 * 生成星盘分析
 *
 * @example
 * const result = await generateBirthChartAnalysis({
 *   name: "Alex",
 *   birthDate: new Date("1990-05-15"),
 *   planets: { Sun: "Taurus", Moon: "Cancer", ... },
 *   elements: { Wood: 20, Fire: 30, ... }
 * });
 */
export async function generateBirthChartAnalysis(
  request: BirthChartAnalysisRequest,
): Promise<BirthChartAnalysisResponse> {
  return getService().generateBirthChartAnalysis(request);
}

/**
 * 生成塔罗解读
 *
 * @example
 * const result = await generateTarotReading({
 *   cards: [{ id: "m01", name: "The Fool", isReversed: false, ... }],
 *   question: "What should I focus on today?",
 *   spreadType: "single"
 * });
 */
export async function generateTarotReading(
  request: TarotReadingRequest,
): Promise<TarotReadingResponse> {
  return getService().generateTarotReading(request);
}

/**
 * 生成塔罗追问回答
 *
 * @example
 * const result = await generateTarotFollowUp({
 *   cards: [{ id: "m01", name: "The Fool", isReversed: false, ... }],
 *   originalInterpretation: "...",
 *   conversationHistory: [{ role: "user", content: "..." }],
 *   followUpQuestion: "What about my career?"
 * });
 */
export async function generateTarotFollowUp(
  request: TarotFollowUpRequest,
): Promise<TarotFollowUpResponse> {
  const service = getService();
  if (!service.generateTarotFollowUp) {
    throw new Error("当前 AI 提供商不支持塔罗追问功能");
  }
  return service.generateTarotFollowUp(request);
}

/**
 * 生成每日灵感
 *
 * @example
 * const result = await generateDailySpark({ sign: "Taurus" });
 */
export async function generateDailySpark(
  request: DailySparkRequest,
): Promise<DailySparkResponse> {
  return getService().generateDailySpark(request);
}

/**
 * 清除 AI 服务缓存
 */
export function clearAICache(): void {
  getService().clearCache();
}

// ============ 类型导出 ============

export type {
  IAIService,
  AIProvider,
  BirthChartAnalysisRequest,
  BirthChartAnalysisResponse,
  TarotReadingRequest,
  TarotReadingResponse,
  TarotFollowUpRequest,
  TarotFollowUpResponse,
  DailySparkRequest,
  DailySparkResponse,
  PlanetaryPositions,
  FiveElements,
  TarotCard,
  LuckyElements,
};

// ============ 默认导出 ============

/**
 * AI 服务对象
 */
export const AIService = {
  generateBirthChartAnalysis,
  generateTarotReading,
  generateTarotFollowUp,
  generateDailySpark,
  clearCache: clearAICache,
  setProvider: setAIProvider,
  getProvider: getCurrentProvider,
};

export default AIService;
