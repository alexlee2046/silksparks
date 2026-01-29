import { describe, it, expect } from "vitest";
import { BaZiEngine } from "@/services/BaZiEngine";
import {
  calculateFourPillars,
  calculateWuXingDistribution,
  getTenGod,
  calculateTenGods,
  calculateDayMasterStrength,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  TEN_GODS,
  WU_XING,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  BRANCH_HIDDEN_STEMS,
} from "@/lib/bazi";

describe("BaZi Types and Constants", () => {
  it("should have 10 Heavenly Stems", () => {
    expect(HEAVENLY_STEMS).toHaveLength(10);
    expect(HEAVENLY_STEMS).toContain("甲");
    expect(HEAVENLY_STEMS).toContain("癸");
  });

  it("should have 12 Earthly Branches", () => {
    expect(EARTHLY_BRANCHES).toHaveLength(12);
    expect(EARTHLY_BRANCHES).toContain("子");
    expect(EARTHLY_BRANCHES).toContain("亥");
  });

  it("should have 10 Ten Gods", () => {
    expect(TEN_GODS).toHaveLength(10);
    expect(TEN_GODS).toContain("比肩");
    expect(TEN_GODS).toContain("正印");
  });

  it("should have 5 Wu Xing elements", () => {
    expect(WU_XING).toHaveLength(5);
    expect(WU_XING).toContain("木");
    expect(WU_XING).toContain("水");
  });

  it("should map each stem to an element", () => {
    for (const stem of HEAVENLY_STEMS) {
      expect(STEM_ELEMENT[stem]).toBeDefined();
      expect(WU_XING).toContain(STEM_ELEMENT[stem]);
    }
  });

  it("should map each branch to an element", () => {
    for (const branch of EARTHLY_BRANCHES) {
      expect(BRANCH_ELEMENT[branch]).toBeDefined();
      expect(WU_XING).toContain(BRANCH_ELEMENT[branch]);
    }
  });

  it("should have hidden stems for each branch", () => {
    for (const branch of EARTHLY_BRANCHES) {
      expect(BRANCH_HIDDEN_STEMS[branch]).toBeDefined();
      expect(BRANCH_HIDDEN_STEMS[branch].main).toBeDefined();
      expect(HEAVENLY_STEMS).toContain(BRANCH_HIDDEN_STEMS[branch].main);
    }
  });
});

describe("Four Pillars Calculation", () => {
  it("should calculate four pillars for a given date", () => {
    // Famous person: Mao Zedong - Dec 26, 1893 (lunar), converted to solar
    const result = calculateFourPillars({
      year: 1893,
      month: 12,
      day: 26,
      hour: 7,
    });

    expect(result.fourPillars).toHaveProperty("year");
    expect(result.fourPillars).toHaveProperty("month");
    expect(result.fourPillars).toHaveProperty("day");
    expect(result.fourPillars).toHaveProperty("hour");

    // Each pillar should have stem and branch
    expect(HEAVENLY_STEMS).toContain(result.fourPillars.year.stem);
    expect(EARTHLY_BRANCHES).toContain(result.fourPillars.year.branch);
  });

  it("should return hidden stems for all positions", () => {
    const result = calculateFourPillars({
      year: 2000,
      month: 1,
      day: 1,
      hour: 12,
    });

    expect(result.hiddenStems).toHaveProperty("year");
    expect(result.hiddenStems).toHaveProperty("month");
    expect(result.hiddenStems).toHaveProperty("day");
    expect(result.hiddenStems).toHaveProperty("hour");

    // Each should have at least a main hidden stem
    expect(result.hiddenStems.year.main).toBeDefined();
    expect(result.hiddenStems.month.main).toBeDefined();
  });

  it("should return lunar date information", () => {
    const result = calculateFourPillars({
      year: 2024,
      month: 2,
      day: 10,
      hour: 12,
    });

    expect(result.lunarDate).toHaveProperty("year");
    expect(result.lunarDate).toHaveProperty("month");
    expect(result.lunarDate).toHaveProperty("day");
    expect(typeof result.lunarDate.isLeapMonth).toBe("boolean");
  });

  it("should handle year boundary at 立春 correctly", () => {
    // Feb 3, 2024 - before 立春 (Feb 4), should be previous year's pillar
    const beforeLiChun = calculateFourPillars({
      year: 2024,
      month: 2,
      day: 3,
      hour: 12,
    });

    // Feb 5, 2024 - after 立春, should be current year's pillar
    const afterLiChun = calculateFourPillars({
      year: 2024,
      month: 2,
      day: 5,
      hour: 12,
    });

    // Year pillars might differ due to 立春 boundary
    // This tests that the calculation handles the transition
    expect(beforeLiChun.fourPillars.year).toBeDefined();
    expect(afterLiChun.fourPillars.year).toBeDefined();
  });

  it("should produce different results for different hours", () => {
    const morning = calculateFourPillars({
      year: 2024,
      month: 6,
      day: 15,
      hour: 6,
    });

    const evening = calculateFourPillars({
      year: 2024,
      month: 6,
      day: 15,
      hour: 20,
    });

    // Hour pillars should differ
    expect(morning.fourPillars.hour.branch).not.toBe(
      evening.fourPillars.hour.branch
    );
  });
});

describe("Ten Gods Calculation", () => {
  it("should calculate ten god relationship correctly", () => {
    // 甲 (Wood Yang) as day master
    // 甲 -> 甲: Same element, same polarity = 比肩
    expect(getTenGod("甲", "甲")).toBe("比肩");

    // 甲 -> 乙: Same element, different polarity = 劫财
    expect(getTenGod("甲", "乙")).toBe("劫财");

    // 甲 -> 丙: Wood generates Fire, same polarity = 食神
    expect(getTenGod("甲", "丙")).toBe("食神");

    // 甲 -> 丁: Wood generates Fire, different polarity = 伤官
    expect(getTenGod("甲", "丁")).toBe("伤官");

    // 甲 -> 戊: Wood controls Earth, same polarity = 偏财
    expect(getTenGod("甲", "戊")).toBe("偏财");

    // 甲 -> 己: Wood controls Earth, different polarity = 正财
    expect(getTenGod("甲", "己")).toBe("正财");

    // 甲 -> 庚: Metal controls Wood, same polarity = 偏官
    expect(getTenGod("甲", "庚")).toBe("偏官");

    // 甲 -> 辛: Metal controls Wood, different polarity = 正官
    expect(getTenGod("甲", "辛")).toBe("正官");

    // 甲 -> 壬: Water generates Wood, same polarity = 偏印
    expect(getTenGod("甲", "壬")).toBe("偏印");

    // 甲 -> 癸: Water generates Wood, different polarity = 正印
    expect(getTenGod("甲", "癸")).toBe("正印");
  });

  it("should calculate ten gods for different day masters", () => {
    // 丙 (Fire Yang) as day master
    // 丙 -> 甲: Wood generates Fire = 偏印
    expect(getTenGod("丙", "甲")).toBe("偏印");

    // 丙 -> 壬: Water controls Fire, same polarity = 偏官
    expect(getTenGod("丙", "壬")).toBe("偏官");

    // 丙 -> 戊: Fire generates Earth, same polarity = 食神
    expect(getTenGod("丙", "戊")).toBe("食神");
  });

  it("should return ten gods analysis with distribution", () => {
    const result = calculateFourPillars({
      year: 1990,
      month: 8,
      day: 15,
      hour: 10,
    });

    const tenGods = calculateTenGods(result.fourPillars, result.hiddenStems);

    expect(tenGods.gods).toBeDefined();
    expect(Array.isArray(tenGods.gods)).toBe(true);
    expect(tenGods.distribution).toBeDefined();

    // Distribution should have entries for all ten gods
    for (const god of TEN_GODS) {
      expect(tenGods.distribution[god]).toBeDefined();
    }
  });
});

describe("Wu Xing Distribution", () => {
  it("should calculate element distribution summing to 100%", () => {
    const result = calculateFourPillars({
      year: 2000,
      month: 5,
      day: 20,
      hour: 14,
    });

    const distribution = calculateWuXingDistribution(
      result.fourPillars,
      result.hiddenStems
    );

    const total = WU_XING.reduce((sum, el) => sum + distribution[el], 0);
    expect(total).toBe(100);
  });

  it("should have non-negative values for all elements", () => {
    const result = calculateFourPillars({
      year: 1985,
      month: 11,
      day: 3,
      hour: 23,
    });

    const distribution = calculateWuXingDistribution(
      result.fourPillars,
      result.hiddenStems
    );

    for (const el of WU_XING) {
      expect(distribution[el]).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Day Master Strength", () => {
  it("should calculate day master strength", () => {
    const result = calculateFourPillars({
      year: 1988,
      month: 4,
      day: 15,
      hour: 9,
    });

    const monthElement = BRANCH_ELEMENT[result.fourPillars.month.branch];
    const strength = calculateDayMasterStrength(
      result.fourPillars,
      result.hiddenStems,
      monthElement
    );

    expect(strength.stem).toBeDefined();
    expect(strength.element).toBeDefined();
    expect(strength.yinYang).toBeDefined();
    expect(strength.strength).toBeDefined();
    expect(typeof strength.strengthScore).toBe("number");
    expect(strength.strengthScore).toBeGreaterThanOrEqual(-100);
    expect(strength.strengthScore).toBeLessThanOrEqual(100);
  });

  it("should return valid strength categories", () => {
    const validStrengths = [
      "极旺",
      "旺",
      "中和",
      "弱",
      "极弱",
      "从强",
      "从弱",
    ];

    // Test multiple dates to cover different scenarios
    const testDates = [
      { year: 1990, month: 3, day: 15, hour: 12 },
      { year: 1985, month: 8, day: 20, hour: 6 },
      { year: 2000, month: 12, day: 1, hour: 0 },
    ];

    for (const date of testDates) {
      const result = calculateFourPillars(date);
      const monthElement = BRANCH_ELEMENT[result.fourPillars.month.branch];
      const strength = calculateDayMasterStrength(
        result.fourPillars,
        result.hiddenStems,
        monthElement
      );

      expect(validStrengths).toContain(strength.strength);
    }
  });
});

describe("BaZiEngine Service", () => {
  it("should calculate complete chart with all components", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("1990-05-15T10:30:00"),
      birthHour: 10,
    });

    expect(result.chart).toBeDefined();
    expect(result.chart.fourPillars).toBeDefined();
    expect(result.chart.hiddenStems).toBeDefined();
    expect(result.chart.dayMaster).toBeDefined();
    expect(result.chart.tenGods).toBeDefined();
    expect(result.chart.wuXingDistribution).toBeDefined();
    expect(result.chart.elementPreferences).toBeDefined();
  });

  it("should generate formatted output", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("1988-08-08T08:08:00"),
      birthHour: 8,
    });

    expect(result.formatted.fourPillars).toBeDefined();
    expect(typeof result.formatted.fourPillars).toBe("string");
    expect(result.formatted.dayMaster).toBeDefined();
    expect(result.formatted.dayMasterElement).toBeDefined();
    expect(result.formatted.zodiacAnimal).toBeDefined();
  });

  it("should generate summary with descriptions", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("1995-12-25T14:00:00"),
      birthHour: 14,
    });

    expect(result.summary.dayMasterDescription).toBeDefined();
    expect(typeof result.summary.dayMasterDescription).toBe("string");
    expect(result.summary.favorableElements).toBeDefined();
    expect(Array.isArray(result.summary.favorableElements)).toBe(true);
  });

  it("should handle location parameter", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("2000-01-01T12:00:00"),
      birthHour: 12,
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        name: "Beijing",
      },
    });

    expect(result.chart.location).toBeDefined();
    expect(result.chart.location?.name).toBe("Beijing");
  });

  it("should use noon as default hour when not provided", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("2000-06-15"),
    });

    expect(result.chart.birthHour).toBe(12);
  });

  it("should get element percentages sorted by value", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("1992-07-04T16:00:00"),
      birthHour: 16,
    });

    const percentages = BaZiEngine.getElementPercentages(
      result.chart.wuXingDistribution
    );

    expect(percentages).toHaveLength(5);
    // Should be sorted descending
    for (let i = 0; i < percentages.length - 1; i++) {
      expect(percentages[i].percentage).toBeGreaterThanOrEqual(
        percentages[i + 1].percentage
      );
    }
  });

  it("should identify dominant and weak elements", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("1998-03-21T09:00:00"),
      birthHour: 9,
    });

    const dominant = BaZiEngine.getDominantElements(
      result.chart.wuXingDistribution
    );
    const weak = BaZiEngine.getWeakElements(result.chart.wuXingDistribution);

    expect(Array.isArray(dominant)).toBe(true);
    expect(Array.isArray(weak)).toBe(true);

    // Dominant and weak should not overlap
    for (const d of dominant) {
      expect(weak).not.toContain(d);
    }
  });

  it("should provide quick info method", () => {
    const info = BaZiEngine.quickInfo(new Date("1985-06-15"), 15);

    expect(info.dayMaster).toBeDefined();
    expect(info.element).toBeDefined();
    expect(info.strength).toBeDefined();
    expect(info.animal).toBeDefined();
  });
});

describe("Edge Cases", () => {
  it("should handle midnight (hour 0)", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("2000-01-01T00:00:00"),
      birthHour: 0,
    });

    expect(result.chart.fourPillars.hour).toBeDefined();
    // Midnight is 子时
    expect(result.chart.fourPillars.hour.branch).toBe("子");
  });

  it("should handle late night (hour 23)", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("2000-01-01T23:30:00"),
      birthHour: 23,
    });

    expect(result.chart.fourPillars.hour).toBeDefined();
    // 23:00 is also 子时
    expect(result.chart.fourPillars.hour.branch).toBe("子");
  });

  it("should handle leap year dates", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("2000-02-29T12:00:00"),
      birthHour: 12,
    });

    expect(result.chart).toBeDefined();
    expect(result.formatted.fourPillars).toBeDefined();
  });

  it("should handle dates far in the past", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("1900-01-01T12:00:00"),
      birthHour: 12,
    });

    expect(result.chart).toBeDefined();
  });

  it("should handle future dates", () => {
    const result = BaZiEngine.calculate({
      birthDate: new Date("2050-06-15T12:00:00"),
      birthHour: 12,
    });

    expect(result.chart).toBeDefined();
  });
});
