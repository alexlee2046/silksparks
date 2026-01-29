/**
 * BaZi Four Pillars Calculation
 *
 * Core algorithms for calculating the Four Pillars (四柱)
 * using lunar-javascript library for accurate calendar conversion.
 */

// @ts-expect-error lunar-javascript has no type definitions
import { Solar } from "lunar-javascript";
import type {
  HeavenlyStem,
  EarthlyBranch,
  Pillar,
  FourPillars,
  HiddenStems,
  SolarTerm,
  WuXingDistribution,
} from "./types";
import { HEAVENLY_STEMS, EARTHLY_BRANCHES, WU_XING } from "./types";
import {
  BRANCH_HIDDEN_STEMS,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  DAY_STEM_TO_HOUR_START,
  getHourBranch,
} from "./constants";

// lunar-javascript EightChar interface
interface LunarEightChar {
  getYearGan: () => string;
  getYearZhi: () => string;
  getMonthGan: () => string;
  getMonthZhi: () => string;
  getDayGan: () => string;
  getDayZhi: () => string;
  getTimeGan: () => string;
  getTimeZhi: () => string;
  getLunar: () => LunarDate;
}

interface LunarDate {
  getYear: () => number;
  getMonth: () => number;
  getDay: () => number;
  getJieQi: () => string;
  getPrevJieQi: () => { getName: () => string } | null;
}

interface LunarSolar {
  getLunar: () => {
    getEightChar: () => LunarEightChar;
    getYear: () => number;
    getMonth: () => number;
    getDay: () => number;
    getMonthInChinese: () => string;
    getJieQi: () => string;
    getPrevJieQi: () => { getName: () => string } | null;
  };
}

// ============ Utility Functions ============

/**
 * Get stem index (0-9)
 */
function getStemIndex(stem: HeavenlyStem): number {
  return HEAVENLY_STEMS.indexOf(stem);
}

/**
 * Get stem by index (cycles through 10)
 */
function getStemByIndex(index: number): HeavenlyStem {
  const normalizedIndex = ((index % 10) + 10) % 10;
  return HEAVENLY_STEMS[normalizedIndex] as HeavenlyStem;
}

/**
 * Get branch by index (cycles through 12)
 */
export function getBranchByIndex(index: number): EarthlyBranch {
  const normalizedIndex = ((index % 12) + 12) % 12;
  return EARTHLY_BRANCHES[normalizedIndex] as EarthlyBranch;
}

// ============ Main Calculation Functions ============

export interface CalculateFourPillarsInput {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute?: number;
  timezone?: string;
}

export interface CalculateFourPillarsResult {
  fourPillars: FourPillars;
  hiddenStems: Record<"year" | "month" | "day" | "hour", HiddenStems>;
  solarTerm: SolarTerm | null;
  lunarDate: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  };
}

/**
 * Calculate Four Pillars from birth date/time
 *
 * Key principles:
 * - Year pillar changes at 立春 (Start of Spring), not Jan 1
 * - Month pillar changes at solar terms, not lunar months
 * - Day pillar is based on 甲子 cycle
 * - Hour pillar derived from day stem + hour branch
 */
export function calculateFourPillars(
  input: CalculateFourPillarsInput
): CalculateFourPillarsResult {
  const { year, month, day, hour, minute = 0 } = input;

  // Create Solar date from lunar-javascript
  const solar: LunarSolar = Solar.fromYmdHms(year, month, day, hour, minute, 0);

  // Get the Lunar object
  const lunar = solar.getLunar();

  // Get the EightChar object for proper BaZi calculation
  // This correctly handles 立春 as year boundary and solar terms as month boundaries
  const eightChar = lunar.getEightChar();

  // Extract pillars from EightChar
  const yearStem = eightChar.getYearGan() as HeavenlyStem;
  const yearBranch = eightChar.getYearZhi() as EarthlyBranch;
  const monthStem = eightChar.getMonthGan() as HeavenlyStem;
  const monthBranch = eightChar.getMonthZhi() as EarthlyBranch;
  const dayStem = eightChar.getDayGan() as HeavenlyStem;
  const dayBranch = eightChar.getDayZhi() as EarthlyBranch;
  const hourStem = eightChar.getTimeGan() as HeavenlyStem;
  const hourBranch = eightChar.getTimeZhi() as EarthlyBranch;

  const fourPillars: FourPillars = {
    year: { stem: yearStem, branch: yearBranch },
    month: { stem: monthStem, branch: monthBranch },
    day: { stem: dayStem, branch: dayBranch },
    hour: { stem: hourStem, branch: hourBranch },
  };

  // Get hidden stems for each branch
  const hiddenStems: Record<"year" | "month" | "day" | "hour", HiddenStems> = {
    year: BRANCH_HIDDEN_STEMS[yearBranch],
    month: BRANCH_HIDDEN_STEMS[monthBranch],
    day: BRANCH_HIDDEN_STEMS[dayBranch],
    hour: BRANCH_HIDDEN_STEMS[hourBranch],
  };

  // Get current solar term
  const jieQi = lunar.getJieQi() || lunar.getPrevJieQi()?.getName();
  const solarTerm = (jieQi as SolarTerm) || null;

  // Get lunar date info
  // Check if month name contains "闰" to detect leap month
  const monthInChinese = lunar.getMonthInChinese();
  const isLeapMonth = monthInChinese.includes("闰");

  const lunarDate = {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeapMonth,
  };

  return {
    fourPillars,
    hiddenStems,
    solarTerm,
    lunarDate,
  };
}

/**
 * Calculate hour pillar from day stem and hour
 *
 * Uses 日上起时 method:
 * - 甲己日起甲子时
 * - 乙庚日起丙子时
 * - etc.
 */
export function calculateHourPillar(dayStem: HeavenlyStem, hour: number): Pillar {
  const hourBranch = getHourBranch(hour);
  const branchIndex = EARTHLY_BRANCHES.indexOf(hourBranch);

  // Get the starting stem for 子时 based on day stem
  const startStem = DAY_STEM_TO_HOUR_START[dayStem];
  const startStemIndex = getStemIndex(startStem);

  // Calculate hour stem
  const hourStemIndex = (startStemIndex + branchIndex) % 10;
  const hourStem = getStemByIndex(hourStemIndex);

  return { stem: hourStem, branch: hourBranch };
}

/**
 * Calculate Wu Xing (Five Elements) distribution from Four Pillars
 */
export function calculateWuXingDistribution(
  fourPillars: FourPillars,
  hiddenStems: Record<"year" | "month" | "day" | "hour", HiddenStems>
): WuXingDistribution {
  const distribution: WuXingDistribution = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
  };

  // Weight factors
  const stemWeight = 1.0;
  const branchWeight = 0.8;
  const hiddenMainWeight = 0.6;
  const hiddenSubWeight = 0.3;
  const hiddenYuQiWeight = 0.1;

  // Position weights
  const positionWeights = {
    year: 0.1,
    month: 0.4,
    day: 0.3,
    hour: 0.2,
  };

  const positions = ["year", "month", "day", "hour"] as const;

  for (const pos of positions) {
    const pillar = fourPillars[pos];
    const hidden = hiddenStems[pos];
    const posWeight = positionWeights[pos];

    // Add stem element
    const stemElement = STEM_ELEMENT[pillar.stem];
    distribution[stemElement] += stemWeight * posWeight * 10;

    // Add branch element
    const branchElement = BRANCH_ELEMENT[pillar.branch];
    distribution[branchElement] += branchWeight * posWeight * 10;

    // Add hidden stems
    distribution[STEM_ELEMENT[hidden.main]] += hiddenMainWeight * posWeight * 10;
    if (hidden.sub) {
      distribution[STEM_ELEMENT[hidden.sub]] += hiddenSubWeight * posWeight * 10;
    }
    if (hidden.余气) {
      distribution[STEM_ELEMENT[hidden.余气]] += hiddenYuQiWeight * posWeight * 10;
    }
  }

  // Normalize to percentages
  const total = WU_XING.reduce((sum, el) => sum + distribution[el], 0);
  for (const el of WU_XING) {
    distribution[el] = Math.round((distribution[el] / total) * 100);
  }

  // Ensure total is 100% (handle rounding)
  const currentTotal = WU_XING.reduce((sum, el) => sum + distribution[el], 0);
  if (currentTotal !== 100) {
    // Find the largest and adjust
    const maxEl = WU_XING.reduce((a, b) =>
      distribution[a] > distribution[b] ? a : b
    );
    distribution[maxEl] += 100 - currentTotal;
  }

  return distribution;
}

/**
 * Format pillar as string (e.g., "甲子")
 */
export function formatPillar(pillar: Pillar): string {
  return `${pillar.stem}${pillar.branch}`;
}

/**
 * Format all four pillars as string
 */
export function formatFourPillars(fourPillars: FourPillars): string {
  return [
    formatPillar(fourPillars.year),
    formatPillar(fourPillars.month),
    formatPillar(fourPillars.day),
    formatPillar(fourPillars.hour),
  ].join(" ");
}

/**
 * Get the GanZhi cycle position (1-60)
 */
export function getGanZhiIndex(pillar: Pillar): number {
  const stemIndex = getStemIndex(pillar.stem);
  const branchIndex = EARTHLY_BRANCHES.indexOf(pillar.branch);

  // The cycle: both must have same parity
  // Formula: (stem * 12 + branch) mod 60, but accounting for valid combinations
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIndex && i % 12 === branchIndex) {
      return i + 1;
    }
  }

  // Alternative calculation
  const diff = (branchIndex - stemIndex + 12) % 12;
  if (diff % 2 !== 0) {
    // Invalid combination (odd/even mismatch)
    return -1;
  }
  return ((stemIndex * 6 + diff / 2) % 30) * 2 + (stemIndex % 2) + 1;
}
