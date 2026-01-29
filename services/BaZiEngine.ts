/**
 * BaZi Engine Service
 *
 * High-level service for Chinese Four Pillars astrology calculations.
 * Provides a clean API for generating complete BaZi charts.
 */

import {
  calculateFourPillars,
  calculateWuXingDistribution,
  calculateTenGods,
  calculateDayMasterStrength,
  calculateElementPreferences,
  formatFourPillars,
  formatPillar,
  BRANCH_ELEMENT,
  type BaZiChart,
  type WuXingDistribution,
  type WuXing,
  type HeavenlyStem,
  type SolarTerm,
  WU_XING_NAMES,
  STEM_NAMES,
  BRANCH_ANIMALS,
  SOLAR_TERM_NAMES,
} from "../lib/bazi";

// ============ Engine Interface ============

export interface BaZiInput {
  birthDate: Date;
  birthHour?: number; // 0-23, defaults to 12 (noon) if not provided
  timezone?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
}

export interface BaZiEngineResult {
  chart: BaZiChart;
  formatted: {
    fourPillars: string;
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    hourPillar: string;
    dayMaster: string;
    dayMasterElement: string;
    dayMasterStrength: string;
    zodiacAnimal: string;
    solarTerm: string | null;
  };
  summary: {
    dayMasterDescription: string;
    strengthDescription: string;
    favorableElements: string[];
    unfavorableElements: string[];
  };
}

// ============ Engine Implementation ============

export const BaZiEngine = {
  /**
   * Calculate complete BaZi chart from birth data
   */
  calculate(input: BaZiInput): BaZiEngineResult {
    const { birthDate, birthHour = 12, timezone, location } = input;

    // Extract date components
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1; // 1-12
    const day = birthDate.getDate();
    const hour = birthHour;
    const minute = birthDate.getMinutes();

    // Calculate four pillars
    const { fourPillars, hiddenStems, solarTerm } = calculateFourPillars({
      year,
      month,
      day,
      hour,
      minute,
      timezone,
    });

    // Get month season element for strength calculation
    const monthSeasonElement = BRANCH_ELEMENT[fourPillars.month.branch];

    // Calculate analysis
    const dayMasterAnalysis = calculateDayMasterStrength(
      fourPillars,
      hiddenStems,
      monthSeasonElement
    );

    const tenGodsAnalysis = calculateTenGods(fourPillars, hiddenStems);

    const wuXingDistribution = calculateWuXingDistribution(
      fourPillars,
      hiddenStems
    );

    const elementPreferences = calculateElementPreferences(dayMasterAnalysis);

    // Build chart
    const chart: BaZiChart = {
      birthDate,
      birthHour: hour,
      timezone,
      location,
      fourPillars,
      hiddenStems,
      dayMaster: dayMasterAnalysis,
      tenGods: tenGodsAnalysis,
      wuXingDistribution,
      elementPreferences,
      calculatedAt: new Date(),
      version: "1.0.0",
    };

    // Generate formatted strings
    const formatted = this.formatChart(chart, solarTerm);

    // Generate summary descriptions
    const summary = this.generateSummary(chart);

    return { chart, formatted, summary };
  },

  /**
   * Format chart data for display
   */
  formatChart(
    chart: BaZiChart,
    solarTerm: SolarTerm | null
  ): BaZiEngineResult["formatted"] {
    const { fourPillars, dayMaster } = chart;

    return {
      fourPillars: formatFourPillars(fourPillars),
      yearPillar: formatPillar(fourPillars.year),
      monthPillar: formatPillar(fourPillars.month),
      dayPillar: formatPillar(fourPillars.day),
      hourPillar: formatPillar(fourPillars.hour),
      dayMaster: `${dayMaster.stem} (${STEM_NAMES[dayMaster.stem]})`,
      dayMasterElement: `${dayMaster.element} (${WU_XING_NAMES[dayMaster.element]})`,
      dayMasterStrength: dayMaster.strength,
      zodiacAnimal: BRANCH_ANIMALS[fourPillars.year.branch],
      solarTerm: solarTerm ? SOLAR_TERM_NAMES[solarTerm] : null,
    };
  },

  /**
   * Generate human-readable summary
   */
  generateSummary(chart: BaZiChart): BaZiEngineResult["summary"] {
    const { dayMaster, elementPreferences } = chart;

    // Day master description
    const dmDescriptions: Record<HeavenlyStem, string> = {
      甲: "如参天大树，正直刚健，有领导才能",
      乙: "如藤蔓花草，柔韧灵活，适应力强",
      丙: "如烈日当空，热情开朗，光明磊落",
      丁: "如烛光星火，温和细腻，洞察力强",
      戊: "如高山大地，稳重可靠，包容心强",
      己: "如田园沃土，踏实务实，善于滋养",
      庚: "如刀剑利器，果断刚毅，执行力强",
      辛: "如珠宝美玉，精致敏感，追求完美",
      壬: "如江河大海，智慧深邃，变化无穷",
      癸: "如雨露清泉，细腻聪慧，滋润万物",
    };

    // Strength description
    const strengthDescriptions: Record<string, string> = {
      极旺: "日主极旺，精力充沛，宜泄不宜补，适合开拓进取",
      旺: "日主偏旺，能量充足，需要适当发泄才能平衡",
      中和: "日主中和，阴阳平衡，处事灵活，随遇而安",
      弱: "日主偏弱，需要扶持，宜静不宜动，稳扎稳打",
      极弱: "日主极弱，宜顺势而为，避免过度消耗",
      从强: "从强格，顺势而为，以强为用，不宜受制",
      从弱: "从弱格，借力使力，以弱为用，不宜扶持",
    };

    return {
      dayMasterDescription: dmDescriptions[dayMaster.stem],
      strengthDescription:
        strengthDescriptions[dayMaster.strength] || "日主强弱适中",
      favorableElements: elementPreferences.favorable.map(
        (e) => WU_XING_NAMES[e]
      ),
      unfavorableElements: elementPreferences.unfavorable.map(
        (e) => WU_XING_NAMES[e]
      ),
    };
  },

  /**
   * Get element distribution as percentages
   */
  getElementPercentages(
    distribution: WuXingDistribution
  ): { element: string; elementCn: WuXing; percentage: number }[] {
    return (Object.keys(distribution) as WuXing[])
      .map((el) => ({
        element: WU_XING_NAMES[el],
        elementCn: el,
        percentage: distribution[el],
      }))
      .sort((a, b) => b.percentage - a.percentage);
  },

  /**
   * Get dominant elements (above average)
   */
  getDominantElements(distribution: WuXingDistribution): WuXing[] {
    const average = 20; // 100 / 5 elements
    return (Object.keys(distribution) as WuXing[]).filter(
      (el) => distribution[el] > average + 5
    );
  },

  /**
   * Get weak elements (below average)
   */
  getWeakElements(distribution: WuXingDistribution): WuXing[] {
    const average = 20;
    return (Object.keys(distribution) as WuXing[]).filter(
      (el) => distribution[el] < average - 5
    );
  },

  /**
   * Quick calculation for basic info (for previews)
   */
  quickInfo(birthDate: Date, birthHour?: number) {
    const result = this.calculate({ birthDate, birthHour });
    return {
      dayMaster: result.formatted.dayMaster,
      element: result.formatted.dayMasterElement,
      strength: result.formatted.dayMasterStrength,
      animal: result.formatted.zodiacAnimal,
    };
  },
};

export default BaZiEngine;
