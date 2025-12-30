/**
 * GeminiService - 兼容层
 *
 * @deprecated 请迁移到 services/ai 模块
 * 此文件保留以确保向后兼容，内部已重定向到新的 AIService
 */

import {
  legacyGenerateBirthChartAnalysis,
  legacyGenerateTarotInterpretation,
  legacyGenerateDailySpark,
  clearAICache,
} from "./ai";

/**
 * @deprecated 使用 `import { AIService } from './ai'` 替代
 */
export const GeminiService = {
  /**
   * 生成每日灵感
   * @deprecated 使用 AIService.generateDailySpark() 替代
   */
  async generateDailySpark(sign: string = "General"): Promise<string> {
    console.warn(
      "[GeminiService] generateDailySpark 已弃用，请迁移到 AIService.generateDailySpark()",
    );
    return legacyGenerateDailySpark(sign);
  },

  /**
   * 生成塔罗解读
   * @deprecated 使用 AIService.generateTarotReading() 替代
   */
  async generateTarotInterpretation(
    cardName: string,
    question: string,
  ): Promise<string> {
    console.warn(
      "[GeminiService] generateTarotInterpretation 已弃用，请迁移到 AIService.generateTarotReading()",
    );
    return legacyGenerateTarotInterpretation(cardName, question);
  },

  /**
   * 生成星盘分析
   * @deprecated 使用 AIService.generateBirthChartAnalysis() 替代
   */
  async generateBirthChartAnalysis(
    name: string,
    planets: any,
    elements: any,
  ): Promise<string> {
    console.warn(
      "[GeminiService] generateBirthChartAnalysis 已弃用，请迁移到 AIService.generateBirthChartAnalysis()",
    );
    return legacyGenerateBirthChartAnalysis(name, planets, elements);
  },

  /**
   * 清除缓存
   * @deprecated 使用 AIService.clearCache() 替代
   */
  clearCache(): void {
    clearAICache();
  },
};
