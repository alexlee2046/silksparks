/**
 * AI Service 类型定义
 * 解耦的类型系统，与具体 AI 提供商无关
 */

// ============ 基础类型 ============

/** AI 提供商枚举 */
export enum AIProvider {
  GEMINI = "gemini",
  SUPABASE = "supabase",
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  MOCK = "mock",
}

/** AI 请求通用配置 */
export interface AIRequestConfig {
  /** 模型名称 */
  model?: string;
  /** 温度参数 (0-1) */
  temperature?: number;
  /** 最大 Token 数 */
  maxTokens?: number;
  /** 系统提示词 */
  systemPrompt?: string;
}

/** AI 响应元数据 */
export interface AIResponseMeta {
  /** 使用的提供商 */
  provider: AIProvider;
  /** 使用的模型 */
  model: string;
  /** Token 使用量 */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** 响应延迟 (ms) */
  latencyMs: number;
  /** 是否来自缓存 */
  cached: boolean;
}

// ============ 命理分析类型 ============

/** 行星位置 */
export interface PlanetaryPositions {
  Sun: string;
  Moon: string;
  Mercury: string;
  Venus: string;
  Mars: string;
  Jupiter: string;
  Saturn: string;
}

/** 五行分布 */
export interface FiveElements {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

/** 星盘分析请求 */
export interface BirthChartAnalysisRequest {
  name: string;
  birthDate: Date;
  birthTime?: string;
  birthPlace?: string;
  planets: PlanetaryPositions;
  elements: FiveElements;
  locale?: "zh-CN" | "en-US";
}

/** 星盘分析响应 */
export interface BirthChartAnalysisResponse {
  /** 主要分析文本 */
  analysis: string;
  /** 核心洞察 */
  insights: {
    /** 太阳星座特质 */
    sunTraits: string;
    /** 月亮星座情感 */
    moonEmotions: string;
    /** 五行建议 */
    elementAdvice: string;
  };
  /** 幸运元素 */
  luckyElements?: {
    color: string;
    number: number;
    direction: string;
  };
  /** 元数据 */
  meta: AIResponseMeta;
}

// ============ 塔罗解读类型 ============

/** 塔罗牌位置 */
export type TarotPosition = "past" | "present" | "future" | "single";

/** 单张塔罗牌 */
export interface TarotCard {
  id: string;
  name: string;
  arcana: "Major" | "Minor";
  suit?: string;
  image: string;
  isReversed: boolean;
  position?: TarotPosition;
}

/** 塔罗解读请求 */
export interface TarotReadingRequest {
  cards: TarotCard[];
  question: string;
  spreadType: "single" | "three-card" | "celtic-cross";
  locale?: "zh-CN" | "en-US";
}

/** 塔罗解读响应 */
export interface TarotReadingResponse {
  /** 综合解读 */
  interpretation: string;
  /** 每张牌的个别解读 */
  cardInterpretations: Array<{
    cardId: string;
    meaning: string;
    advice: string;
  }>;
  /** 行动建议 */
  actionAdvice: string;
  /** 元数据 */
  meta: AIResponseMeta;
}

// ============ 每日灵感类型 ============

/** 每日灵感请求 */
export interface DailySparkRequest {
  sign?: string;
  userBirthDate?: Date;
  locale?: "zh-CN" | "en-US";
}

/** 每日灵感响应 */
export interface DailySparkResponse {
  message: string;
  luckyColor?: string;
  luckyNumber?: number;
  meta: AIResponseMeta;
}

// ============ AI 服务接口 ============

/** AI 服务抽象接口 */
export interface IAIService {
  /** 服务名称 */
  readonly name: string;

  /** 当前使用的提供商 */
  readonly provider: AIProvider;

  /** 生成星盘分析 */
  generateBirthChartAnalysis(
    request: BirthChartAnalysisRequest,
  ): Promise<BirthChartAnalysisResponse>;

  /** 生成塔罗解读 */
  generateTarotReading(
    request: TarotReadingRequest,
  ): Promise<TarotReadingResponse>;

  /** 生成每日灵感 */
  generateDailySpark(request: DailySparkRequest): Promise<DailySparkResponse>;

  /** 清除缓存 */
  clearCache(): void;
}
