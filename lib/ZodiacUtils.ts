/**
 * 黄道十二宫工具函数
 * 统一的星座计算逻辑，避免 AstrologyEngine 和 RecommendationEngine 重复
 */

// ============ 常量 ============

/** 黄道十二宫名称 */
export const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

/** 四大元素 */
export type Element = "fire" | "earth" | "air" | "water";

/** 星座到元素的映射 */
const ZODIAC_ELEMENTS: Record<ZodiacSign, Element> = {
  Aries: "fire",
  Taurus: "earth",
  Gemini: "air",
  Cancer: "water",
  Leo: "fire",
  Virgo: "earth",
  Libra: "air",
  Scorpio: "water",
  Sagittarius: "fire",
  Capricorn: "earth",
  Aquarius: "air",
  Pisces: "water",
};

/**
 * 星座日期范围 (月-日格式)
 * 每个条目: [开始月, 开始日, 结束月, 结束日, 星座]
 */
const ZODIAC_DATE_RANGES: [number, number, number, number, ZodiacSign][] = [
  [3, 21, 4, 19, "Aries"],
  [4, 20, 5, 20, "Taurus"],
  [5, 21, 6, 20, "Gemini"],
  [6, 21, 7, 22, "Cancer"],
  [7, 23, 8, 22, "Leo"],
  [8, 23, 9, 22, "Virgo"],
  [9, 23, 10, 22, "Libra"],
  [10, 23, 11, 21, "Scorpio"],
  [11, 22, 12, 21, "Sagittarius"],
  [12, 22, 1, 19, "Capricorn"], // 跨年
  [1, 20, 2, 18, "Aquarius"],
  [2, 19, 3, 20, "Pisces"],
];

// ============ 函数 ============

/**
 * 根据日期获取星座
 * @param date - 出生日期
 * @returns 星座名称
 */
export function getZodiacFromDate(date: Date): ZodiacSign {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  for (const [startMonth, startDay, endMonth, endDay, sign] of ZODIAC_DATE_RANGES) {
    // 处理跨年的星座 (Capricorn)
    if (startMonth > endMonth) {
      if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
        return sign;
      }
    } else {
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay) ||
        (month > startMonth && month < endMonth)
      ) {
        return sign;
      }
    }
  }

  // 默认返回 (理论上不会到达)
  return "Aries";
}

/**
 * 根据黄道经度获取星座
 * 用于天文计算 (astronomy-engine)
 * @param longitude - 黄道经度 (0-360)
 * @returns 星座名称
 */
export function getZodiacFromLongitude(longitude: number): ZodiacSign {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index];
}

/**
 * 获取星座对应的元素
 * @param sign - 星座名称
 * @returns 元素 (fire/earth/air/water)
 */
export function getElementFromZodiac(sign: ZodiacSign): Element {
  return ZODIAC_ELEMENTS[sign];
}

/**
 * 根据日期直接获取元素
 * @param date - 出生日期
 * @returns 元素 (fire/earth/air/water)
 */
export function getElementFromDate(date: Date): Element {
  const sign = getZodiacFromDate(date);
  return getElementFromZodiac(sign);
}

/**
 * 检查字符串是否是有效的星座名称
 */
export function isValidZodiacSign(value: string): value is ZodiacSign {
  return ZODIAC_SIGNS.includes(value as ZodiacSign);
}
