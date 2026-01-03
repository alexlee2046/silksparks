import { describe, it, expect } from "vitest";
import {
  EDGE_FUNCTION_NAME,
  AI_CONFIG_KEY,
  REQUEST_TYPES,
  ERROR_CODES,
  CACHE_CONFIG,
  CACHE_KEYS,
  DEFAULTS,
  FALLBACK_MESSAGES,
  LOCALES,
} from "@/services/ai/constants";

describe("AI constants", () => {
  describe("EDGE_FUNCTION_NAME", () => {
    it("should be ai-generate", () => {
      expect(EDGE_FUNCTION_NAME).toBe("ai-generate");
    });
  });

  describe("AI_CONFIG_KEY", () => {
    it("should be ai_config", () => {
      expect(AI_CONFIG_KEY).toBe("ai_config");
    });
  });

  describe("REQUEST_TYPES", () => {
    it("should have BIRTH_CHART type", () => {
      expect(REQUEST_TYPES.BIRTH_CHART).toBe("birth_chart");
    });

    it("should have TAROT type", () => {
      expect(REQUEST_TYPES.TAROT).toBe("tarot");
    });

    it("should have DAILY_SPARK type", () => {
      expect(REQUEST_TYPES.DAILY_SPARK).toBe("daily_spark");
    });

    it("should have exactly 3 types", () => {
      expect(Object.keys(REQUEST_TYPES).length).toBe(3);
    });
  });

  describe("ERROR_CODES", () => {
    it("should have RATE_LIMIT_EXCEEDED code", () => {
      expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should have NO_API_KEY code", () => {
      expect(ERROR_CODES.NO_API_KEY).toBe("NO_API_KEY");
    });

    it("should have INVALID_REQUEST code", () => {
      expect(ERROR_CODES.INVALID_REQUEST).toBe("INVALID_REQUEST");
    });

    it("should have exactly 3 codes", () => {
      expect(Object.keys(ERROR_CODES).length).toBe(3);
    });
  });

  describe("CACHE_CONFIG", () => {
    it("should have MAX_SIZE of 50", () => {
      expect(CACHE_CONFIG.MAX_SIZE).toBe(50);
    });

    it("should have TTL_MS of 7 days in milliseconds", () => {
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(CACHE_CONFIG.TTL_MS).toBe(sevenDaysMs);
    });

    it("should have PREFIX of silk_spark_", () => {
      expect(CACHE_CONFIG.PREFIX).toBe("silk_spark_");
    });
  });

  describe("CACHE_KEYS", () => {
    it("should have DAILY_SPARK key", () => {
      expect(CACHE_KEYS.DAILY_SPARK).toBe("daily_spark");
    });

    it("should have DAILY_SPARK_DATE key", () => {
      expect(CACHE_KEYS.DAILY_SPARK_DATE).toBe("daily_spark_date");
    });

    it("should have REPORT_PREFIX key", () => {
      expect(CACHE_KEYS.REPORT_PREFIX).toBe("silk_spark_report_");
    });
  });

  describe("DEFAULTS", () => {
    it("should have DAILY_LIMIT of 50", () => {
      expect(DEFAULTS.DAILY_LIMIT).toBe(50);
    });

    it("should have REQUEST_TIMEOUT_MS of 30 seconds", () => {
      expect(DEFAULTS.REQUEST_TIMEOUT_MS).toBe(30000);
    });

    it("should have LOCALE of en-US", () => {
      expect(DEFAULTS.LOCALE).toBe("en-US");
    });
  });

  describe("FALLBACK_MESSAGES", () => {
    it("should have birth_chart fallback", () => {
      expect(FALLBACK_MESSAGES.birth_chart).toContain("cosmic");
    });

    it("should have tarot fallback", () => {
      expect(FALLBACK_MESSAGES.tarot).toContain("tarot");
    });

    it("should have daily_spark fallback", () => {
      expect(FALLBACK_MESSAGES.daily_spark).toContain("inspiration");
    });

    it("should have default fallback", () => {
      expect(FALLBACK_MESSAGES.default).toContain("cosmic");
    });

    it("should have 4 fallback messages", () => {
      expect(Object.keys(FALLBACK_MESSAGES).length).toBe(4);
    });
  });

  describe("LOCALES", () => {
    it("should have ZH_CN locale", () => {
      expect(LOCALES.ZH_CN).toBe("zh-CN");
    });

    it("should have EN_US locale", () => {
      expect(LOCALES.EN_US).toBe("en-US");
    });

    it("should have exactly 2 locales", () => {
      expect(Object.keys(LOCALES).length).toBe(2);
    });
  });

  describe("type safety", () => {
    it("should have immutable REQUEST_TYPES", () => {
      // TypeScript ensures these are readonly, but we can verify values exist
      const types: string[] = Object.values(REQUEST_TYPES);
      expect(types).toContain("birth_chart");
      expect(types).toContain("tarot");
      expect(types).toContain("daily_spark");
    });

    it("should have immutable ERROR_CODES", () => {
      const codes: string[] = Object.values(ERROR_CODES);
      expect(codes).toContain("RATE_LIMIT_EXCEEDED");
      expect(codes).toContain("NO_API_KEY");
      expect(codes).toContain("INVALID_REQUEST");
    });
  });
});
