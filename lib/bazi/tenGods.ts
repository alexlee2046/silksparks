/**
 * Ten Gods (十神) Calculation
 *
 * Calculates the relationship between the Day Master (日主)
 * and other stems in the BaZi chart.
 *
 * Ten Gods represent different life aspects:
 * - 比肩/劫财 (Parallel/Rob Wealth): Siblings, peers, competition
 * - 食神/伤官 (Eating God/Hurting Officer): Output, creativity, children
 * - 偏财/正财 (Indirect/Direct Wealth): Money, father, desires
 * - 偏官/正官 (Seven Killings/Direct Officer): Power, career, husband
 * - 偏印/正印 (Indirect/Direct Seal): Education, mother, protection
 */

import type {
  HeavenlyStem,
  TenGod,
  FourPillars,
  HiddenStems,
  TenGodInfo,
  TenGodsAnalysis,
  WuXing,
  DayMasterAnalysis,
  DayMasterStrength,
  ElementPreferences,
} from "./types";
import { TEN_GODS } from "./types";
import {
  STEM_ELEMENT,
  STEM_YIN_YANG,
  BRANCH_ELEMENT,
  WU_XING_GENERATES,
  WU_XING_GENERATED_BY,
  WU_XING_CONTROLS,
  WU_XING_CONTROLLED_BY,
  PILLAR_WEIGHTS,
  ELEMENT_RELATIONSHIP_SCORES,
} from "./constants";

// ============ Ten God Calculation ============

/**
 * Determine the Ten God relationship between Day Master and another stem
 *
 * Logic based on Five Elements relationships:
 * - 同我者 (Same as me): 比肩 (same polarity) / 劫财 (opposite polarity)
 * - 我生者 (I generate): 食神 (same polarity) / 伤官 (opposite polarity)
 * - 我克者 (I control): 偏财 (same polarity) / 正财 (opposite polarity)
 * - 克我者 (Controls me): 偏官 (same polarity) / 正官 (opposite polarity)
 * - 生我者 (Generates me): 偏印 (same polarity) / 正印 (opposite polarity)
 */
export function getTenGod(
  dayMaster: HeavenlyStem,
  targetStem: HeavenlyStem
): TenGod {
  const dmElement = STEM_ELEMENT[dayMaster];
  const dmYinYang = STEM_YIN_YANG[dayMaster];
  const targetElement = STEM_ELEMENT[targetStem];
  const targetYinYang = STEM_YIN_YANG[targetStem];

  const samePolarity = dmYinYang === targetYinYang;

  // Same element: 比肩 or 劫财
  if (dmElement === targetElement) {
    return samePolarity ? "比肩" : "劫财";
  }

  // I generate this element: 食神 or 伤官
  if (WU_XING_GENERATES[dmElement] === targetElement) {
    return samePolarity ? "食神" : "伤官";
  }

  // I control this element: 偏财 or 正财
  if (WU_XING_CONTROLS[dmElement] === targetElement) {
    return samePolarity ? "偏财" : "正财";
  }

  // This element controls me: 偏官 or 正官
  if (WU_XING_CONTROLLED_BY[dmElement] === targetElement) {
    return samePolarity ? "偏官" : "正官";
  }

  // This element generates me: 偏印 or 正印
  if (WU_XING_GENERATED_BY[dmElement] === targetElement) {
    return samePolarity ? "偏印" : "正印";
  }

  // Should never reach here with valid inputs
  throw new Error(
    `Invalid Ten God calculation: ${dayMaster} -> ${targetStem}`
  );
}

/**
 * Calculate all Ten Gods in the Four Pillars
 */
export function calculateTenGods(
  fourPillars: FourPillars,
  hiddenStems: Record<"year" | "month" | "day" | "hour", HiddenStems>
): TenGodsAnalysis {
  const dayMaster = fourPillars.day.stem;
  const gods: TenGodInfo[] = [];
  const distribution: Record<TenGod, number> = {} as Record<TenGod, number>;

  // Initialize distribution
  for (const god of TEN_GODS) {
    distribution[god] = 0;
  }

  const positions = ["year", "month", "hour"] as const; // Exclude day stem (it's the Day Master)

  // Process visible stems (天干)
  for (const pos of positions) {
    const stem = fourPillars[pos].stem;
    const god = getTenGod(dayMaster, stem);

    gods.push({
      god,
      stem,
      position: pos,
      isHidden: false,
    });

    distribution[god] += 1;
  }

  // Process hidden stems (藏干)
  const allPositions = ["year", "month", "day", "hour"] as const;
  for (const pos of allPositions) {
    const hidden = hiddenStems[pos];

    // Main hidden stem
    const mainGod = getTenGod(dayMaster, hidden.main);
    gods.push({
      god: mainGod,
      stem: hidden.main,
      position: pos,
      isHidden: true,
    });
    distribution[mainGod] += 0.6; // Weight hidden stems less

    // Sub hidden stem
    if (hidden.sub) {
      const subGod = getTenGod(dayMaster, hidden.sub);
      gods.push({
        god: subGod,
        stem: hidden.sub,
        position: pos,
        isHidden: true,
      });
      distribution[subGod] += 0.3;
    }

    // 余气
    if (hidden.余气) {
      const yuqiGod = getTenGod(dayMaster, hidden.余气);
      gods.push({
        god: yuqiGod,
        stem: hidden.余气,
        position: pos,
        isHidden: true,
      });
      distribution[yuqiGod] += 0.1;
    }
  }

  // Find dominant god
  let dominant: TenGod | undefined;
  let maxCount = 0;
  for (const god of TEN_GODS) {
    if (distribution[god] > maxCount) {
      maxCount = distribution[god];
      dominant = god;
    }
  }

  // Find missing gods (count < 0.5 threshold)
  const missing = TEN_GODS.filter((god) => distribution[god] < 0.5);

  return {
    gods,
    distribution,
    dominant,
    missing,
  };
}

// ============ Day Master Strength Analysis ============

/**
 * Calculate Day Master strength score
 *
 * Factors:
 * 1. 月令得令: Is the Day Master in season? (+/- 30 points)
 * 2. 地支支持: Support from earthly branches
 * 3. 天干支持: Support from heavenly stems
 * 4. 藏干支持: Support from hidden stems
 */
export function calculateDayMasterStrength(
  fourPillars: FourPillars,
  hiddenStems: Record<"year" | "month" | "day" | "hour", HiddenStems>,
  monthSeasonElement: WuXing
): DayMasterAnalysis {
  const dayMaster = fourPillars.day.stem;
  const dmElement = STEM_ELEMENT[dayMaster];
  const dmYinYang = STEM_YIN_YANG[dayMaster];

  let strengthScore = 0;

  // 1. Month season influence (月令)
  const generatingElement = WU_XING_GENERATED_BY[dmElement];
  const controllingElement = WU_XING_CONTROLLED_BY[dmElement];
  const inSeason =
    monthSeasonElement === dmElement ||
    monthSeasonElement === generatingElement;

  let seasonBonus = 0;
  if (monthSeasonElement === dmElement) {
    seasonBonus = 30; // In season (当令)
  } else if (monthSeasonElement === generatingElement) {
    seasonBonus = 20; // Generated by season (相生)
  } else if (monthSeasonElement === controllingElement) {
    seasonBonus = -30; // Controlled by season (受克)
  } else if (WU_XING_GENERATES[dmElement] === monthSeasonElement) {
    seasonBonus = -10; // Draining to season (泄气)
  }
  strengthScore += seasonBonus;

  // 2. Count support from pillars
  let supportCount = 0;
  let drainingCount = 0;

  const positions = ["year", "month", "day", "hour"] as const;

  for (const pos of positions) {
    const pillar = fourPillars[pos];
    const weight = PILLAR_WEIGHTS[pos];

    // Stem support (except day master itself)
    if (pos !== "day") {
      const stemElement = STEM_ELEMENT[pillar.stem];
      if (stemElement === dmElement || stemElement === generatingElement) {
        supportCount++;
        strengthScore += ELEMENT_RELATIONSHIP_SCORES.SAME * weight * 2;
      } else if (stemElement === controllingElement) {
        drainingCount++;
        strengthScore += ELEMENT_RELATIONSHIP_SCORES.CONTROLS * weight * 2;
      }
    }

    // Branch support
    const branchElement = BRANCH_ELEMENT[pillar.branch];
    if (branchElement === dmElement || branchElement === generatingElement) {
      supportCount++;
      strengthScore += ELEMENT_RELATIONSHIP_SCORES.GENERATES * weight * 2;
    } else if (branchElement === controllingElement) {
      drainingCount++;
      strengthScore += ELEMENT_RELATIONSHIP_SCORES.CONTROLS * weight * 2;
    }

    // Hidden stems support
    const hidden = hiddenStems[pos];
    const hiddenElements = [
      STEM_ELEMENT[hidden.main],
      hidden.sub ? STEM_ELEMENT[hidden.sub] : null,
      hidden.余气 ? STEM_ELEMENT[hidden.余气] : null,
    ].filter(Boolean) as WuXing[];

    for (const he of hiddenElements) {
      if (he === dmElement || he === generatingElement) {
        supportCount += 0.5;
        strengthScore += ELEMENT_RELATIONSHIP_SCORES.SAME * weight * 0.5;
      } else if (he === controllingElement) {
        drainingCount += 0.5;
        strengthScore += ELEMENT_RELATIONSHIP_SCORES.CONTROLS * weight * 0.5;
      }
    }
  }

  // Clamp score to -100 to +100
  strengthScore = Math.max(-100, Math.min(100, Math.round(strengthScore)));

  // Determine strength category
  let strength: DayMasterStrength;
  if (strengthScore >= 60) {
    strength = "极旺";
  } else if (strengthScore >= 20) {
    strength = "旺";
  } else if (strengthScore >= -20) {
    strength = "中和";
  } else if (strengthScore >= -60) {
    strength = "弱";
  } else {
    strength = "极弱";
  }

  // Check for special patterns (从格)
  // 从强: Very strong with little opposition
  if (strengthScore >= 70 && drainingCount < 1) {
    strength = "从强";
  }
  // 从弱: Very weak with overwhelming opposition
  if (strengthScore <= -70 && supportCount < 1) {
    strength = "从弱";
  }

  return {
    stem: dayMaster,
    element: dmElement,
    yinYang: dmYinYang,
    strength,
    strengthScore,
    seasonalInfluence: {
      inSeason,
      seasonElement: monthSeasonElement,
      bonus: seasonBonus,
    },
    supportCount: Math.round(supportCount),
    drainingCount: Math.round(drainingCount),
  };
}

// ============ Favorable Elements (喜用神) ============

/**
 * Determine favorable and unfavorable elements based on Day Master strength
 *
 * General principles:
 * - Weak Day Master needs: same element (比劫) and generating element (印)
 * - Strong Day Master needs: controlling element (官杀), draining element (食伤), and wealth (财)
 */
export function calculateElementPreferences(
  dayMasterAnalysis: DayMasterAnalysis
): ElementPreferences {
  const { element: dmElement, strength, strengthScore } = dayMasterAnalysis;

  const generatingElement = WU_XING_GENERATED_BY[dmElement];
  const controllingElement = WU_XING_CONTROLLED_BY[dmElement];
  const drainingElement = WU_XING_GENERATES[dmElement]; // Element I generate
  const controlledElement = WU_XING_CONTROLS[dmElement]; // Element I control (wealth)

  const favorable: WuXing[] = [];
  const unfavorable: WuXing[] = [];
  const neutral: WuXing[] = [];

  if (strength === "从强") {
    // Follow the strength: favor same and generating elements
    favorable.push(dmElement, generatingElement);
    unfavorable.push(controllingElement, controlledElement);
    neutral.push(drainingElement);
  } else if (strength === "从弱") {
    // Follow the weakness: favor controlling and draining
    favorable.push(controllingElement, drainingElement, controlledElement);
    unfavorable.push(dmElement, generatingElement);
  } else if (strengthScore < -10) {
    // Weak: needs support
    favorable.push(dmElement, generatingElement);
    neutral.push(drainingElement);
    unfavorable.push(controllingElement, controlledElement);
  } else if (strengthScore > 10) {
    // Strong: needs to drain/control
    favorable.push(controllingElement, drainingElement, controlledElement);
    neutral.push(dmElement);
    unfavorable.push(generatingElement);
  } else {
    // Balanced: case by case, generally prefer balance
    neutral.push(dmElement, generatingElement, drainingElement);
    // Slight preference for what controls (brings discipline)
    favorable.push(controllingElement);
    unfavorable.push(controlledElement); // Too much wealth can be burden
  }

  return { favorable, unfavorable, neutral };
}

/**
 * Get Ten God category (for grouping)
 */
export function getTenGodCategory(
  god: TenGod
): "parallel" | "output" | "wealth" | "power" | "resource" {
  switch (god) {
    case "比肩":
    case "劫财":
      return "parallel";
    case "食神":
    case "伤官":
      return "output";
    case "偏财":
    case "正财":
      return "wealth";
    case "偏官":
    case "正官":
      return "power";
    case "偏印":
    case "正印":
      return "resource";
  }
}

/**
 * Check if a Ten God is "positive" (正) or "indirect/偏"
 */
export function isTenGodDirect(god: TenGod): boolean {
  return ["比肩", "食神", "正财", "正官", "正印"].includes(god);
}
