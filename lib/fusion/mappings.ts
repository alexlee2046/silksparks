/**
 * East-West Fusion Mappings
 *
 * Astronomical correspondences between Chinese solar terms
 * and Western zodiac signs.
 *
 * Based on the shared astronomical basis:
 * - Both systems divide the solar year into segments
 * - Spring Equinox = Aries 0° = 春分
 * - Summer Solstice = Cancer 0° = 夏至
 * - Autumn Equinox = Libra 0° = 秋分
 * - Winter Solstice = Capricorn 0° = 冬至
 */

import type { WuXing } from "../bazi/types";
import type {
  SolarTermZodiacMapping,
  ElementCorrespondence,
} from "./types";
import type { ZodiacSign } from "../ZodiacUtils";

/**
 * Solar Term to Zodiac mapping
 * Each solar term corresponds to 15° of the zodiac
 */
export const SOLAR_TERM_ZODIAC_MAP: SolarTermZodiacMapping[] = [
  // Spring (春)
  {
    solarTerm: "立春",
    solarTermEn: "Start of Spring",
    zodiacSign: "Aquarius",
    element: "木",
    westernElement: "Air",
    startDegree: 315,
    seasonalQi: "木气初生",
  },
  {
    solarTerm: "雨水",
    solarTermEn: "Rain Water",
    zodiacSign: "Pisces",
    element: "木",
    westernElement: "Water",
    startDegree: 330,
    seasonalQi: "木气渐长",
  },
  {
    solarTerm: "惊蛰",
    solarTermEn: "Awakening of Insects",
    zodiacSign: "Pisces",
    element: "木",
    westernElement: "Water",
    startDegree: 345,
    seasonalQi: "木气盛发",
  },
  {
    solarTerm: "春分",
    solarTermEn: "Spring Equinox",
    zodiacSign: "Aries",
    element: "木",
    westernElement: "Fire",
    startDegree: 0,
    seasonalQi: "木气正盛",
  },
  {
    solarTerm: "清明",
    solarTermEn: "Clear and Bright",
    zodiacSign: "Aries",
    element: "木",
    westernElement: "Fire",
    startDegree: 15,
    seasonalQi: "木气转火",
  },
  {
    solarTerm: "谷雨",
    solarTermEn: "Grain Rain",
    zodiacSign: "Taurus",
    element: "土",
    westernElement: "Earth",
    startDegree: 30,
    seasonalQi: "土气用事",
  },

  // Summer (夏)
  {
    solarTerm: "立夏",
    solarTermEn: "Start of Summer",
    zodiacSign: "Taurus",
    element: "火",
    westernElement: "Earth",
    startDegree: 45,
    seasonalQi: "火气初生",
  },
  {
    solarTerm: "小满",
    solarTermEn: "Grain Buds",
    zodiacSign: "Gemini",
    element: "火",
    westernElement: "Air",
    startDegree: 60,
    seasonalQi: "火气渐长",
  },
  {
    solarTerm: "芒种",
    solarTermEn: "Grain in Ear",
    zodiacSign: "Gemini",
    element: "火",
    westernElement: "Air",
    startDegree: 75,
    seasonalQi: "火气盛发",
  },
  {
    solarTerm: "夏至",
    solarTermEn: "Summer Solstice",
    zodiacSign: "Cancer",
    element: "火",
    westernElement: "Water",
    startDegree: 90,
    seasonalQi: "火气极盛",
  },
  {
    solarTerm: "小暑",
    solarTermEn: "Minor Heat",
    zodiacSign: "Cancer",
    element: "火",
    westernElement: "Water",
    startDegree: 105,
    seasonalQi: "火气转土",
  },
  {
    solarTerm: "大暑",
    solarTermEn: "Major Heat",
    zodiacSign: "Leo",
    element: "土",
    westernElement: "Fire",
    startDegree: 120,
    seasonalQi: "土气用事",
  },

  // Autumn (秋)
  {
    solarTerm: "立秋",
    solarTermEn: "Start of Autumn",
    zodiacSign: "Leo",
    element: "金",
    westernElement: "Fire",
    startDegree: 135,
    seasonalQi: "金气初生",
  },
  {
    solarTerm: "处暑",
    solarTermEn: "End of Heat",
    zodiacSign: "Virgo",
    element: "金",
    westernElement: "Earth",
    startDegree: 150,
    seasonalQi: "金气渐长",
  },
  {
    solarTerm: "白露",
    solarTermEn: "White Dew",
    zodiacSign: "Virgo",
    element: "金",
    westernElement: "Earth",
    startDegree: 165,
    seasonalQi: "金气盛发",
  },
  {
    solarTerm: "秋分",
    solarTermEn: "Autumn Equinox",
    zodiacSign: "Libra",
    element: "金",
    westernElement: "Air",
    startDegree: 180,
    seasonalQi: "金气正盛",
  },
  {
    solarTerm: "寒露",
    solarTermEn: "Cold Dew",
    zodiacSign: "Libra",
    element: "金",
    westernElement: "Air",
    startDegree: 195,
    seasonalQi: "金气转土",
  },
  {
    solarTerm: "霜降",
    solarTermEn: "Frost Descent",
    zodiacSign: "Scorpio",
    element: "土",
    westernElement: "Water",
    startDegree: 210,
    seasonalQi: "土气用事",
  },

  // Winter (冬)
  {
    solarTerm: "立冬",
    solarTermEn: "Start of Winter",
    zodiacSign: "Scorpio",
    element: "水",
    westernElement: "Water",
    startDegree: 225,
    seasonalQi: "水气初生",
  },
  {
    solarTerm: "小雪",
    solarTermEn: "Minor Snow",
    zodiacSign: "Sagittarius",
    element: "水",
    westernElement: "Fire",
    startDegree: 240,
    seasonalQi: "水气渐长",
  },
  {
    solarTerm: "大雪",
    solarTermEn: "Major Snow",
    zodiacSign: "Sagittarius",
    element: "水",
    westernElement: "Fire",
    startDegree: 255,
    seasonalQi: "水气盛发",
  },
  {
    solarTerm: "冬至",
    solarTermEn: "Winter Solstice",
    zodiacSign: "Capricorn",
    element: "水",
    westernElement: "Earth",
    startDegree: 270,
    seasonalQi: "水气极盛",
  },
  {
    solarTerm: "小寒",
    solarTermEn: "Minor Cold",
    zodiacSign: "Capricorn",
    element: "水",
    westernElement: "Earth",
    startDegree: 285,
    seasonalQi: "水气转土",
  },
  {
    solarTerm: "大寒",
    solarTermEn: "Major Cold",
    zodiacSign: "Aquarius",
    element: "土",
    westernElement: "Air",
    startDegree: 300,
    seasonalQi: "土气用事",
  },
];

/**
 * Element correspondence between Eastern and Western systems
 *
 * This is based on symbolic/archetypal correspondence,
 * not direct equation (since the systems are different)
 */
export const ELEMENT_CORRESPONDENCES: ElementCorrespondence[] = [
  {
    eastern: "木",
    western: ["Air", "Water"],
    quality: "Growth, flexibility, creativity",
    correspondence:
      "Wood's expansive, growth-oriented nature corresponds to Air's intellectual expansion and Water's emotional depth",
  },
  {
    eastern: "火",
    western: ["Fire"],
    quality: "Passion, transformation, illumination",
    correspondence:
      "Fire in both systems represents passion, energy, and transformative power",
  },
  {
    eastern: "土",
    western: ["Earth"],
    quality: "Stability, nourishment, centeredness",
    correspondence:
      "Earth in both systems represents grounding, practicality, and material matters",
  },
  {
    eastern: "金",
    western: ["Air", "Earth"],
    quality: "Precision, structure, refinement",
    correspondence:
      "Metal's precision corresponds to Air's clarity of thought and Earth's structured approach",
  },
  {
    eastern: "水",
    western: ["Water"],
    quality: "Wisdom, adaptability, depth",
    correspondence:
      "Water in both systems represents emotion, intuition, and flowing adaptability",
  },
];

/**
 * Get zodiac sign for a solar term
 */
export function getZodiacForSolarTerm(
  solarTerm: string
): SolarTermZodiacMapping | undefined {
  return SOLAR_TERM_ZODIAC_MAP.find((m) => m.solarTerm === solarTerm);
}

/**
 * Get element correspondence
 */
export function getElementCorrespondence(
  eastern: WuXing
): ElementCorrespondence | undefined {
  return ELEMENT_CORRESPONDENCES.find((c) => c.eastern === eastern);
}

/**
 * Check if Eastern and Western elements have correspondence
 */
export function elementsHaveHarmony(
  eastern: WuXing,
  western: "Fire" | "Earth" | "Air" | "Water"
): boolean {
  const correspondence = getElementCorrespondence(eastern);
  return correspondence?.western.includes(western) ?? false;
}

/**
 * Get harmony score between Eastern element and Western sign
 */
export function getElementHarmonyScore(
  eastern: WuXing,
  westernElement: "Fire" | "Earth" | "Air" | "Water"
): number {
  if (elementsHaveHarmony(eastern, westernElement)) {
    // Direct correspondence
    if (
      (eastern === "火" && westernElement === "Fire") ||
      (eastern === "土" && westernElement === "Earth") ||
      (eastern === "水" && westernElement === "Water")
    ) {
      return 100; // Perfect match
    }
    return 75; // Partial correspondence
  }

  // Check for complementary relationships
  // Fire and Air feed each other
  if (
    (eastern === "火" && westernElement === "Air") ||
    (eastern === "木" && westernElement === "Fire")
  ) {
    return 60;
  }

  // Earth and Water can complement
  if (
    (eastern === "土" && westernElement === "Water") ||
    (eastern === "水" && westernElement === "Earth")
  ) {
    return 50;
  }

  // Neutral
  return 40;
}

/**
 * Zodiac sign to Western element mapping
 */
export const ZODIAC_WESTERN_ELEMENT: Record<
  ZodiacSign,
  "Fire" | "Earth" | "Air" | "Water"
> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

/**
 * Get Western element for a zodiac sign
 */
export function getWesternElement(
  sign: ZodiacSign
): "Fire" | "Earth" | "Air" | "Water" {
  return ZODIAC_WESTERN_ELEMENT[sign];
}
