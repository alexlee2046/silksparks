/**
 * East-West Fusion Types
 *
 * Types for combining Chinese BaZi with Western astrology.
 */

import type { WuXing, HeavenlyStem, DayMasterStrength } from "../bazi/types";
import type { LiteratureQuote } from "../literature/types";
import type { ZodiacSign } from "../ZodiacUtils";

/**
 * User tier levels for feature gating
 */
export type UserTier = "free" | "member" | "premium";

/**
 * Fusion tier configuration
 */
export interface FusionTierConfig {
  tier: UserTier;
  features: {
    basicDayMaster: boolean;
    westernSigns: boolean;
    briefFusion: boolean;
    fullFourPillars: boolean;
    tenGodsAnalysis: boolean;
    hiddenStems: boolean;
    dayMasterStrength: boolean;
    elementPreferences: boolean;
    literatureQuotes: number; // Max quotes
    detailedFusion: boolean;
    pdfDownload: boolean;
    yearlyForecast: boolean;
    compatibility: boolean;
  };
}

/**
 * Western astrology signs for fusion
 */
export interface WesternSigns {
  sun: ZodiacSign;
  moon: ZodiacSign;
  mercury: ZodiacSign;
  venus: ZodiacSign;
  mars: ZodiacSign;
  jupiter: ZodiacSign;
  saturn: ZodiacSign;
}

/**
 * Solar term to Zodiac mapping entry
 */
export interface SolarTermZodiacMapping {
  solarTerm: string;
  solarTermEn: string;
  zodiacSign: ZodiacSign;
  element: WuXing;
  westernElement: "Fire" | "Earth" | "Air" | "Water";
  startDegree: number;
  seasonalQi: string;
}

/**
 * Element correspondence between East and West
 */
export interface ElementCorrespondence {
  eastern: WuXing;
  western: ("Fire" | "Earth" | "Air" | "Water")[];
  quality: string;
  correspondence: string;
}

/**
 * A single fusion insight
 */
export interface FusionInsight {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  type: "harmony" | "complement" | "tension" | "neutral";
  eastern: {
    element?: WuXing;
    dayMaster?: HeavenlyStem;
    aspect?: string;
  };
  western: {
    sign?: ZodiacSign;
    element?: string;
    aspect?: string;
  };
  advice?: string;
}

/**
 * Complete fusion analysis result
 */
export interface FusionAnalysis {
  // Basics
  dayMasterSummary: {
    stem: HeavenlyStem;
    element: WuXing;
    strength: DayMasterStrength;
    description: string;
  };

  westernSummary: {
    sunSign: ZodiacSign;
    moonSign: ZodiacSign;
    dominantElement: string;
  };

  // Fusion insights
  insights: FusionInsight[];

  // Element harmony analysis
  elementHarmony: {
    score: number; // 0-100
    description: string;
    easternDominant: WuXing[];
    westernDominant: string[];
  };

  // Literature quotes
  quotes: LiteratureQuote[];

  // Recommendations
  recommendations: {
    favorable: string[];
    caution: string[];
    timing: string[];
  };

  // Metadata
  generatedAt: Date;
  tier: UserTier;
}

/**
 * Fusion report for display
 */
export interface FusionReport {
  analysis: FusionAnalysis;
  formattedSections: {
    overview: string;
    eastern: string;
    western: string;
    fusion: string;
    advice: string;
  };
}
