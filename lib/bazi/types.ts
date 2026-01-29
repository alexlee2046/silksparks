/**
 * BaZi (八字) Type Definitions
 *
 * Core types for Chinese astrology Four Pillars calculation.
 * Based on traditional BaZi theory from《滴天髓》《子平真诠》《穷通宝鉴》
 */

// ============ Heavenly Stems (天干) ============
export const HEAVENLY_STEMS = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
] as const;
export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];

// English names for display
export const STEM_NAMES: Record<HeavenlyStem, string> = {
  甲: "Jia",
  乙: "Yi",
  丙: "Bing",
  丁: "Ding",
  戊: "Wu",
  己: "Ji",
  庚: "Geng",
  辛: "Xin",
  壬: "Ren",
  癸: "Gui",
};

// ============ Earthly Branches (地支) ============
export const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
] as const;
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

// English names
export const BRANCH_NAMES: Record<EarthlyBranch, string> = {
  子: "Zi",
  丑: "Chou",
  寅: "Yin",
  卯: "Mao",
  辰: "Chen",
  巳: "Si",
  午: "Wu",
  未: "Wei",
  申: "Shen",
  酉: "You",
  戌: "Xu",
  亥: "Hai",
};

// Corresponding animals
export const BRANCH_ANIMALS: Record<EarthlyBranch, string> = {
  子: "Rat",
  丑: "Ox",
  寅: "Tiger",
  卯: "Rabbit",
  辰: "Dragon",
  巳: "Snake",
  午: "Horse",
  未: "Goat",
  申: "Monkey",
  酉: "Rooster",
  戌: "Dog",
  亥: "Pig",
};

// ============ Five Elements (五行) ============
export const WU_XING = ["木", "火", "土", "金", "水"] as const;
export type WuXing = (typeof WU_XING)[number];

// English names
export const WU_XING_NAMES: Record<WuXing, string> = {
  木: "Wood",
  火: "Fire",
  土: "Earth",
  金: "Metal",
  水: "Water",
};

// Colors for UI
export const WU_XING_COLORS: Record<WuXing, string> = {
  木: "#22c55e", // green-500
  火: "#ef4444", // red-500
  土: "#a16207", // yellow-700
  金: "#d4d4d8", // zinc-300
  水: "#3b82f6", // blue-500
};

// ============ Yin-Yang (阴阳) ============
export type YinYang = "阳" | "阴";

// ============ Ten Gods (十神) ============
export const TEN_GODS = [
  "比肩", // Bi Jian - Parallel
  "劫财", // Jie Cai - Rob Wealth
  "食神", // Shi Shen - Eating God
  "伤官", // Shang Guan - Hurting Officer
  "偏财", // Pian Cai - Indirect Wealth
  "正财", // Zheng Cai - Direct Wealth
  "偏官", // Pian Guan - Indirect Officer (Seven Killings)
  "正官", // Zheng Guan - Direct Officer
  "偏印", // Pian Yin - Indirect Seal
  "正印", // Zheng Yin - Direct Seal
] as const;
export type TenGod = (typeof TEN_GODS)[number];

// English names
export const TEN_GOD_NAMES: Record<TenGod, string> = {
  比肩: "Parallel",
  劫财: "Rob Wealth",
  食神: "Eating God",
  伤官: "Hurting Officer",
  偏财: "Indirect Wealth",
  正财: "Direct Wealth",
  偏官: "Seven Killings",
  正官: "Direct Officer",
  偏印: "Indirect Seal",
  正印: "Direct Seal",
};

// Aliases (common alternative names)
export const TEN_GOD_ALIASES: Partial<Record<TenGod, string>> = {
  偏官: "七杀", // Qi Sha
  偏印: "枭神", // Xiao Shen
};

// ============ Single Pillar (柱) ============
export interface Pillar {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
}

// ============ Four Pillars (四柱) ============
export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
}

// ============ Hidden Stems (藏干) ============
export interface HiddenStems {
  main: HeavenlyStem; // Main hidden stem
  sub?: HeavenlyStem; // Secondary
  余气?: HeavenlyStem; // Residual qi
}

// ============ Day Master Analysis (日主分析) ============
export type DayMasterStrength =
  | "极旺"
  | "旺"
  | "中和"
  | "弱"
  | "极弱"
  | "从强"
  | "从弱";

export interface DayMasterAnalysis {
  stem: HeavenlyStem;
  element: WuXing;
  yinYang: YinYang;
  strength: DayMasterStrength;
  strengthScore: number; // -100 to +100
  seasonalInfluence: {
    inSeason: boolean;
    seasonElement: WuXing;
    bonus: number;
  };
  supportCount: number; // Count of supporting elements
  drainingCount: number; // Count of draining/controlling elements
}

// ============ Ten God Analysis (十神分析) ============
export interface TenGodInfo {
  god: TenGod;
  stem: HeavenlyStem;
  position: "year" | "month" | "day" | "hour";
  isHidden: boolean;
}

export interface TenGodsAnalysis {
  gods: TenGodInfo[];
  distribution: Record<TenGod, number>;
  dominant?: TenGod;
  missing: TenGod[];
}

// ============ Wu Xing Distribution (五行分布) ============
export interface WuXingDistribution {
  木: number;
  火: number;
  土: number;
  金: number;
  水: number;
}

// ============ Favorable/Unfavorable Elements (喜忌) ============
export interface ElementPreferences {
  favorable: WuXing[]; // 喜用神
  unfavorable: WuXing[]; // 忌神
  neutral: WuXing[];
}

// ============ Complete BaZi Chart ============
export interface BaZiChart {
  // Input
  birthDate: Date;
  birthHour: number; // 0-23
  timezone?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };

  // Core calculations
  fourPillars: FourPillars;
  hiddenStems: Record<"year" | "month" | "day" | "hour", HiddenStems>;

  // Analysis
  dayMaster: DayMasterAnalysis;
  tenGods: TenGodsAnalysis;
  wuXingDistribution: WuXingDistribution;
  elementPreferences: ElementPreferences;

  // Metadata
  calculatedAt: Date;
  version: string;
}

// ============ Solar Term (节气) ============
export const SOLAR_TERMS = [
  "立春",
  "雨水",
  "惊蛰",
  "春分",
  "清明",
  "谷雨",
  "立夏",
  "小满",
  "芒种",
  "夏至",
  "小暑",
  "大暑",
  "立秋",
  "处暑",
  "白露",
  "秋分",
  "寒露",
  "霜降",
  "立冬",
  "小雪",
  "大雪",
  "冬至",
  "小寒",
  "大寒",
] as const;
export type SolarTerm = (typeof SOLAR_TERMS)[number];

// Solar term English names
export const SOLAR_TERM_NAMES: Record<SolarTerm, string> = {
  立春: "Start of Spring",
  雨水: "Rain Water",
  惊蛰: "Awakening of Insects",
  春分: "Spring Equinox",
  清明: "Clear and Bright",
  谷雨: "Grain Rain",
  立夏: "Start of Summer",
  小满: "Grain Buds",
  芒种: "Grain in Ear",
  夏至: "Summer Solstice",
  小暑: "Minor Heat",
  大暑: "Major Heat",
  立秋: "Start of Autumn",
  处暑: "End of Heat",
  白露: "White Dew",
  秋分: "Autumn Equinox",
  寒露: "Cold Dew",
  霜降: "Frost Descent",
  立冬: "Start of Winter",
  小雪: "Minor Snow",
  大雪: "Major Snow",
  冬至: "Winter Solstice",
  小寒: "Minor Cold",
  大寒: "Major Cold",
};
