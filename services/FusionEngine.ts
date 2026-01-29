/**
 * Fusion Engine Service
 *
 * Combines Chinese BaZi analysis with Western astrology
 * to provide integrated insights.
 */

import { AstrologyEngine } from "./AstrologyEngine";
import { BaZiEngine } from "./BaZiEngine";
import { LiteratureService } from "./LiteratureService";
import type { BaZiChart, WuXing } from "../lib/bazi/types";
import { WU_XING_NAMES } from "../lib/bazi/types";
import type {
  FusionAnalysis,
  FusionInsight,
  WesternSigns,
  UserTier,
} from "../lib/fusion/types";
import { getMaxQuotes } from "../lib/fusion/tiers";
import {
  getWesternElement,
  getElementHarmonyScore,
} from "../lib/fusion/mappings";
import type { ZodiacSign } from "../lib/ZodiacUtils";

// ============ Types ============

export interface FusionEngineInput {
  birthDate: Date;
  birthHour?: number;
  latitude: number;
  longitude: number;
  tier: UserTier;
}

// ============ Helper Functions ============

/**
 * Get dominant Western element from signs
 */
function getDominantWesternElement(signs: WesternSigns): string {
  const elementCounts: Record<string, number> = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  // Weight: Sun > Moon > others
  const weights: Record<keyof WesternSigns, number> = {
    sun: 3,
    moon: 2,
    mercury: 1,
    venus: 1,
    mars: 1,
    jupiter: 1,
    saturn: 1,
  };

  for (const [planet, sign] of Object.entries(signs) as [
    keyof WesternSigns,
    ZodiacSign
  ][]) {
    const element = getWesternElement(sign);
    const weight = weights[planet] ?? 1;
    elementCounts[element] = (elementCounts[element] ?? 0) + weight;
  }

  // Find dominant
  let dominant = "Fire";
  let maxCount = 0;
  for (const [element, count] of Object.entries(elementCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = element;
    }
  }

  return dominant;
}

/**
 * Generate fusion insights based on both systems
 */
function generateInsights(
  baziChart: BaZiChart,
  westernSigns: WesternSigns,
  tier: UserTier
): FusionInsight[] {
  const insights: FusionInsight[] = [];
  const dayMaster = baziChart.dayMaster;
  const sunElement = getWesternElement(westernSigns.sun);
  const moonElement = getWesternElement(westernSigns.moon);

  // 1. Day Master + Sun Sign harmony
  const sunHarmony = getElementHarmonyScore(
    dayMaster.element,
    sunElement as "Fire" | "Earth" | "Air" | "Water"
  );

  if (sunHarmony >= 75) {
    insights.push({
      id: "dm-sun-harmony",
      title: "日主与太阳星座和谐",
      titleEn: "Day Master-Sun Sign Harmony",
      description: `你的八字日主${dayMaster.stem}(${WU_XING_NAMES[dayMaster.element]})与太阳${westernSigns.sun}(${sunElement})形成和谐共振。这表明你的内在本质与外在表现一致，行事自然流畅。`,
      type: "harmony",
      eastern: { element: dayMaster.element, dayMaster: dayMaster.stem },
      western: { sign: westernSigns.sun, element: sunElement },
      advice: "发挥这份和谐能量，在追求目标时保持真我。",
    });
  } else if (sunHarmony <= 40) {
    insights.push({
      id: "dm-sun-tension",
      title: "日主与太阳星座张力",
      titleEn: "Day Master-Sun Sign Tension",
      description: `你的八字日主${dayMaster.stem}(${WU_XING_NAMES[dayMaster.element]})与太阳${westernSigns.sun}(${sunElement})存在能量差异。这带来内在的丰富性，但也可能需要协调内外。`,
      type: "tension",
      eastern: { element: dayMaster.element, dayMaster: dayMaster.stem },
      western: { sign: westernSigns.sun, element: sunElement },
      advice:
        "学会整合这两种能量，将张力转化为创造力。",
    });
  }

  // 2. Element distribution insight (member+ only)
  if (tier !== "free") {
    const moonHarmony = getElementHarmonyScore(
      dayMaster.element,
      moonElement as "Fire" | "Earth" | "Air" | "Water"
    );

    insights.push({
      id: "dm-moon-emotion",
      title: "日主与月亮情感模式",
      titleEn: "Day Master-Moon Emotional Pattern",
      description: `你的月亮在${westernSigns.moon}(${moonElement})，与日主${WU_XING_NAMES[dayMaster.element]}${moonHarmony >= 60 ? "形成支持" : "有所不同"}。这影响你处理情绪的方式。`,
      type: moonHarmony >= 60 ? "harmony" : "complement",
      eastern: { element: dayMaster.element },
      western: { sign: westernSigns.moon, element: moonElement },
      advice:
        moonHarmony >= 60
          ? "你的情感表达与内在本质协调，信任直觉。"
          : "尝试理解情感需求与理性自我的不同，两者都有价值。",
    });
  }

  // 3. Strength-based insight (member+ only)
  if (tier !== "free" && dayMaster.strength) {
    const strengthAdvice: Record<string, { desc: string; advice: string }> = {
      极旺: {
        desc: "日主极旺，精力充沛",
        advice: "适度释放能量，避免过于强势",
      },
      旺: {
        desc: "日主偏旺，能量充足",
        advice: "保持平衡，用创造力发挥能量",
      },
      中和: { desc: "日主中和，阴阳平衡", advice: "维持平衡，灵活应对" },
      弱: { desc: "日主偏弱，需要支持", advice: "寻找志同道合的伙伴，借力前行" },
      极弱: { desc: "日主极弱，顺势而为", advice: "以柔克刚，借助外力" },
      从强: { desc: "从强格，顺势而为", advice: "发挥优势，乘势而上" },
      从弱: { desc: "从弱格，借力使力", advice: "借助贵人，以退为进" },
    };

    const info = strengthAdvice[dayMaster.strength] || {
      desc: "日主强弱适中",
      advice: "灵活应对各种情况",
    };

    insights.push({
      id: "strength-advice",
      title: "日主强弱建议",
      titleEn: "Day Master Strength Guidance",
      description: info.desc,
      type: "neutral",
      eastern: { aspect: dayMaster.strength },
      western: {},
      advice: info.advice,
    });
  }

  // 4. Seasonal insight
  if (tier !== "free") {
    const favorable = baziChart.elementPreferences.favorable;
    const unfavorable = baziChart.elementPreferences.unfavorable;

    insights.push({
      id: "element-preference",
      title: "五行喜忌指引",
      titleEn: "Element Preferences Guidance",
      description: `根据你的命盘，喜用神为${favorable.map((e) => WU_XING_NAMES[e]).join("、")}，忌神为${unfavorable.map((e) => WU_XING_NAMES[e]).join("、")}。`,
      type: "neutral",
      eastern: {
        aspect: `喜${favorable.join("")}忌${unfavorable.join("")}`,
      },
      western: {},
      advice: `在颜色、方位、职业选择上，可以多考虑${favorable.map((e) => WU_XING_NAMES[e]).join("、")}相关的选项。`,
    });
  }

  return insights;
}

/**
 * Calculate element harmony score between Eastern and Western charts
 */
function calculateElementHarmony(
  baziChart: BaZiChart,
  westernSigns: WesternSigns
): { score: number; description: string; easternDominant: WuXing[]; westernDominant: string[] } {
  // Get dominant Eastern elements
  const eastDist = baziChart.wuXingDistribution;
  const eastDominant: WuXing[] = [];
  for (const [el, pct] of Object.entries(eastDist) as [WuXing, number][]) {
    if (pct > 25) eastDominant.push(el);
  }
  if (eastDominant.length === 0) {
    // Take top 2
    const sorted = (Object.entries(eastDist) as [WuXing, number][]).sort(
      (a, b) => b[1] - a[1]
    );
    if (sorted[0]) eastDominant.push(sorted[0][0]);
    if (sorted[1]) eastDominant.push(sorted[1][0]);
  }

  // Get Western element counts
  const westCounts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const sign of Object.values(westernSigns)) {
    const element = getWesternElement(sign);
    westCounts[element] = (westCounts[element] ?? 0) + 1;
  }
  const westDominant: string[] = Object.entries(westCounts)
    .filter(([, c]) => c >= 2)
    .map(([e]) => e);
  if (westDominant.length === 0) {
    const sorted = Object.entries(westCounts).sort((a, b) => b[1] - a[1]);
    if (sorted[0]) westDominant.push(sorted[0][0]);
  }

  // Calculate harmony score
  let totalScore = 0;
  let comparisons = 0;
  for (const east of eastDominant) {
    for (const west of westDominant) {
      totalScore += getElementHarmonyScore(east, west as "Fire" | "Earth" | "Air" | "Water");
      comparisons++;
    }
  }
  const score = comparisons > 0 ? Math.round(totalScore / comparisons) : 50;

  let description: string;
  if (score >= 80) {
    description = "你的东西方命盘元素高度和谐，能量流动顺畅";
  } else if (score >= 60) {
    description = "你的东西方命盘有良好的元素共振，整体协调";
  } else if (score >= 40) {
    description = "你的东西方命盘元素互补，带来多样性";
  } else {
    description = "你的东西方命盘元素差异较大，需要整合";
  }

  return {
    score,
    description,
    easternDominant: eastDominant,
    westernDominant: westDominant,
  };
}

// ============ Main Engine ============

export const FusionEngine = {
  /**
   * Generate complete fusion analysis
   */
  analyze(input: FusionEngineInput): FusionAnalysis {
    const { birthDate, birthHour = 12, latitude, longitude, tier } = input;

    // 1. Calculate BaZi chart
    const baziResult = BaZiEngine.calculate({
      birthDate,
      birthHour,
      location: { latitude, longitude },
    });
    const baziChart = baziResult.chart;

    // 2. Calculate Western positions
    const westernPositions = AstrologyEngine.calculatePlanetaryPositions(
      birthDate,
      latitude,
      longitude
    );

    const westernSigns: WesternSigns = {
      sun: westernPositions.Sun,
      moon: westernPositions.Moon,
      mercury: westernPositions.Mercury,
      venus: westernPositions.Venus,
      mars: westernPositions.Mars,
      jupiter: westernPositions.Jupiter,
      saturn: westernPositions.Saturn,
    };

    // 3. Get relevant literature quotes
    const maxQuotes = getMaxQuotes(tier);
    const quotes = LiteratureService.getQuotesForChart(baziChart, maxQuotes);

    // 4. Generate fusion insights
    const insights = generateInsights(baziChart, westernSigns, tier);

    // 5. Calculate element harmony
    const elementHarmony = calculateElementHarmony(baziChart, westernSigns);

    // 6. Generate recommendations
    const favorable = baziChart.elementPreferences.favorable.map(
      (e) => WU_XING_NAMES[e]
    );
    const unfavorable = baziChart.elementPreferences.unfavorable.map(
      (e) => WU_XING_NAMES[e]
    );

    const recommendations = {
      favorable: [
        `多接触${favorable.join("、")}元素相关的事物`,
        ...this.getColorRecommendations(baziChart.elementPreferences.favorable),
      ],
      caution: [
        `注意${unfavorable.join("、")}元素可能带来的挑战`,
      ],
      timing: this.getTimingRecommendations(baziChart),
    };

    // 7. Build result
    const analysis: FusionAnalysis = {
      dayMasterSummary: {
        stem: baziChart.dayMaster.stem,
        element: baziChart.dayMaster.element,
        strength: baziChart.dayMaster.strength,
        description: baziResult.summary.dayMasterDescription,
      },
      westernSummary: {
        sunSign: westernSigns.sun,
        moonSign: westernSigns.moon,
        dominantElement: getDominantWesternElement(westernSigns),
      },
      insights,
      elementHarmony,
      quotes,
      recommendations,
      generatedAt: new Date(),
      tier,
    };

    return analysis;
  },

  /**
   * Get color recommendations based on favorable elements
   */
  getColorRecommendations(favorable: WuXing[]): string[] {
    const elementColors: Record<WuXing, string[]> = {
      木: ["绿色", "青色"],
      火: ["红色", "紫色", "橙色"],
      土: ["黄色", "棕色", "米色"],
      金: ["白色", "银色", "金色"],
      水: ["黑色", "蓝色", "深灰"],
    };

    const colors = favorable.flatMap((e) => elementColors[e]);
    if (colors.length > 0) {
      return [`幸运色彩：${colors.slice(0, 3).join("、")}`];
    }
    return [];
  },

  /**
   * Get timing recommendations
   */
  getTimingRecommendations(chart: BaZiChart): string[] {
    const favorable = chart.elementPreferences.favorable;
    const recommendations: string[] = [];

    // Season recommendations
    const seasonElements: Record<WuXing, string> = {
      木: "春季（2-4月）",
      火: "夏季（5-7月）",
      土: "季节交替时",
      金: "秋季（8-10月）",
      水: "冬季（11-1月）",
    };

    const goodSeasons = favorable
      .map((e) => seasonElements[e])
      .filter((s) => s);
    if (goodSeasons.length > 0) {
      recommendations.push(`有利时节：${goodSeasons.join("、")}`);
    }

    // Time of day recommendations
    const hourElements: Record<WuXing, string> = {
      木: "早晨（5-7点）",
      火: "中午（11-13点）",
      土: "四季交替时段",
      金: "傍晚（17-19点）",
      水: "夜间（21-23点）",
    };

    const goodHours = favorable.map((e) => hourElements[e]).filter((h) => h);
    if (goodHours.length > 0) {
      recommendations.push(`有利时辰：${goodHours.join("、")}`);
    }

    return recommendations;
  },

  /**
   * Quick fusion summary (for previews)
   */
  quickSummary(
    birthDate: Date,
    birthHour: number,
    latitude: number,
    longitude: number
  ): {
    dayMaster: string;
    sunSign: ZodiacSign;
    harmony: string;
  } {
    const baziInfo = BaZiEngine.quickInfo(birthDate, birthHour);
    const positions = AstrologyEngine.calculatePlanetaryPositions(
      birthDate,
      latitude,
      longitude
    );

    return {
      dayMaster: baziInfo.dayMaster,
      sunSign: positions.Sun,
      harmony: "良好", // Simplified for quick view
    };
  },
};

export default FusionEngine;
