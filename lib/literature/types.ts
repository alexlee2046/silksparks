/**
 * Literature Quote Types
 *
 * Types for classical Chinese astrology literature references.
 */

import type { HeavenlyStem, WuXing, TenGod, DayMasterStrength } from "../bazi/types";

/**
 * Classical literature source
 */
export type LiteratureSource =
  | "滴天髓"
  | "子平真诠"
  | "穷通宝鉴"
  | "三命通会"
  | "渊海子平"
  | "神峰通考";

/**
 * Quote category for filtering
 */
export type QuoteCategory =
  | "day_master" // 日主论
  | "ten_gods" // 十神论
  | "wu_xing" // 五行论
  | "strength" // 旺衰论
  | "season" // 季节论
  | "general"; // 通论

/**
 * A single literature quote
 */
export interface LiteratureQuote {
  id: string;
  source: LiteratureSource;
  chapter?: string;
  originalText: string;
  translation: string;
  context?: string;
  category: QuoteCategory;
  /** Applicable day masters (if specific to certain stems) */
  applicableDayMasters?: HeavenlyStem[];
  /** Applicable elements (if specific to certain Wu Xing) */
  applicableElements?: WuXing[];
  /** Applicable ten gods (if specific to certain ten gods) */
  applicableTenGods?: TenGod[];
  /** Applicable strength levels */
  applicableStrengths?: DayMasterStrength[];
  /** Applicable seasons (month branches) */
  applicableSeasons?: ("spring" | "summer" | "autumn" | "winter")[];
}

/**
 * Quote selection criteria
 */
export interface QuoteSelectionCriteria {
  dayMaster?: HeavenlyStem;
  element?: WuXing;
  tenGod?: TenGod;
  strength?: DayMasterStrength;
  season?: "spring" | "summer" | "autumn" | "winter";
  category?: QuoteCategory;
  maxQuotes?: number;
}
