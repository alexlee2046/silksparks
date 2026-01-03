import { describe, it, expect } from "vitest";
import {
  PROMPTS,
  wrapWithLocale,
  buildPrompt,
} from "@/services/ai/prompts";
import type {
  BirthChartAnalysisRequest,
  TarotReadingRequest,
  DailySparkRequest,
} from "@/services/ai/types";

describe("AI prompts", () => {
  describe("PROMPTS.SYSTEM", () => {
    it("should have ASTROLOGER role", () => {
      expect(PROMPTS.SYSTEM.ASTROLOGER).toBeDefined();
      expect(PROMPTS.SYSTEM.ASTROLOGER).toContain("astrology");
    });

    it("should have TAROT_READER role", () => {
      expect(PROMPTS.SYSTEM.TAROT_READER).toBeDefined();
      expect(PROMPTS.SYSTEM.TAROT_READER).toContain("Tarot");
    });

    it("should have DAILY_ORACLE role", () => {
      expect(PROMPTS.SYSTEM.DAILY_ORACLE).toBeDefined();
      expect(PROMPTS.SYSTEM.DAILY_ORACLE).toContain("oracle");
    });

    it("should include language instruction in ASTROLOGER", () => {
      expect(PROMPTS.SYSTEM.ASTROLOGER).toContain(
        "Respond in the same language"
      );
    });

    it("should include language instruction in TAROT_READER", () => {
      expect(PROMPTS.SYSTEM.TAROT_READER).toContain(
        "Respond in the same language"
      );
    });

    it("should include language instruction in DAILY_ORACLE", () => {
      expect(PROMPTS.SYSTEM.DAILY_ORACLE).toContain(
        "Respond in the same language"
      );
    });

    it("should have exactly 3 system roles", () => {
      expect(Object.keys(PROMPTS.SYSTEM).length).toBe(3);
    });
  });

  describe("PROMPTS.BIRTH_CHART", () => {
    const mockRequest: BirthChartAnalysisRequest = {
      name: "Test User",
      birthDate: new Date("1990-01-15"),
      planets: {
        Sun: "Capricorn",
        Moon: "Aries",
        Mercury: "Capricorn",
        Venus: "Pisces",
        Mars: "Sagittarius",
        Jupiter: "Cancer",
        Saturn: "Capricorn",
      },
      elements: {
        Wood: 20,
        Fire: 30,
        Earth: 25,
        Metal: 15,
        Water: 10,
      },
    };

    it("should have FULL_ANALYSIS prompt generator", () => {
      expect(PROMPTS.BIRTH_CHART.FULL_ANALYSIS).toBeDefined();
      expect(typeof PROMPTS.BIRTH_CHART.FULL_ANALYSIS).toBe("function");
    });

    it("should generate FULL_ANALYSIS with name", () => {
      const prompt = PROMPTS.BIRTH_CHART.FULL_ANALYSIS(mockRequest);
      expect(prompt).toContain("Test User");
    });

    it("should generate FULL_ANALYSIS with planets", () => {
      const prompt = PROMPTS.BIRTH_CHART.FULL_ANALYSIS(mockRequest);
      expect(prompt).toContain("Sun: Capricorn");
      expect(prompt).toContain("Moon: Aries");
      expect(prompt).toContain("Mars: Sagittarius");
    });

    it("should generate FULL_ANALYSIS with elements", () => {
      const prompt = PROMPTS.BIRTH_CHART.FULL_ANALYSIS(mockRequest);
      expect(prompt).toContain("Wood: 20%");
      expect(prompt).toContain("Fire: 30%");
      expect(prompt).toContain("Water: 10%");
    });

    it("should include structured sections in FULL_ANALYSIS", () => {
      const prompt = PROMPTS.BIRTH_CHART.FULL_ANALYSIS(mockRequest);
      expect(prompt).toContain("Core Essence");
      expect(prompt).toContain("Emotional Landscape");
      expect(prompt).toContain("Life Path Guidance");
      expect(prompt).toContain("Balance Recommendations");
    });

    it("should have QUICK_INSIGHT prompt generator", () => {
      expect(PROMPTS.BIRTH_CHART.QUICK_INSIGHT).toBeDefined();
      expect(typeof PROMPTS.BIRTH_CHART.QUICK_INSIGHT).toBe("function");
    });

    it("should generate QUICK_INSIGHT with name and signs", () => {
      const prompt = PROMPTS.BIRTH_CHART.QUICK_INSIGHT(mockRequest);
      expect(prompt).toContain("Test User");
      expect(prompt).toContain("Sun in Capricorn");
      expect(prompt).toContain("Moon in Aries");
    });

    it("should identify dominant element in QUICK_INSIGHT", () => {
      const prompt = PROMPTS.BIRTH_CHART.QUICK_INSIGHT(mockRequest);
      expect(prompt).toContain("dominant element is Fire");
    });
  });

  describe("PROMPTS.TAROT", () => {
    const singleCardRequest: TarotReadingRequest = {
      cards: [
        {
          id: "major-0",
          name: "The Fool",
          arcana: "Major",
          image: "/cards/fool.jpg",
          isReversed: false,
        },
      ],
      question: "What should I focus on?",
      spreadType: "single",
    };

    const reversedCardRequest: TarotReadingRequest = {
      cards: [
        {
          id: "major-1",
          name: "The Magician",
          arcana: "Major",
          image: "/cards/magician.jpg",
          isReversed: true,
        },
      ],
      question: "What is blocking me?",
      spreadType: "single",
    };

    const threeCardRequest: TarotReadingRequest = {
      cards: [
        {
          id: "major-2",
          name: "The High Priestess",
          arcana: "Major",
          image: "/cards/priestess.jpg",
          isReversed: false,
        },
        {
          id: "major-3",
          name: "The Empress",
          arcana: "Major",
          image: "/cards/empress.jpg",
          isReversed: true,
        },
        {
          id: "major-4",
          name: "The Emperor",
          arcana: "Major",
          image: "/cards/emperor.jpg",
          isReversed: false,
        },
      ],
      question: "How will my project evolve?",
      spreadType: "three-card",
    };

    it("should have SINGLE_CARD prompt generator", () => {
      expect(PROMPTS.TAROT.SINGLE_CARD).toBeDefined();
      expect(typeof PROMPTS.TAROT.SINGLE_CARD).toBe("function");
    });

    it("should generate SINGLE_CARD with question", () => {
      const prompt = PROMPTS.TAROT.SINGLE_CARD(singleCardRequest);
      expect(prompt).toContain("What should I focus on?");
    });

    it("should generate SINGLE_CARD with card name", () => {
      const prompt = PROMPTS.TAROT.SINGLE_CARD(singleCardRequest);
      expect(prompt).toContain("The Fool");
    });

    it("should show Upright for non-reversed card", () => {
      const prompt = PROMPTS.TAROT.SINGLE_CARD(singleCardRequest);
      expect(prompt).toContain("(Upright)");
      expect(prompt).not.toContain("(Reversed)");
    });

    it("should show Reversed for reversed card", () => {
      const prompt = PROMPTS.TAROT.SINGLE_CARD(reversedCardRequest);
      expect(prompt).toContain("(Reversed)");
    });

    it("should include structured sections in SINGLE_CARD", () => {
      const prompt = PROMPTS.TAROT.SINGLE_CARD(singleCardRequest);
      expect(prompt).toContain("Card Message");
      expect(prompt).toContain("Shadow Aspect");
      expect(prompt).toContain("Action Step");
    });

    it("should have THREE_CARD_SPREAD prompt generator", () => {
      expect(PROMPTS.TAROT.THREE_CARD_SPREAD).toBeDefined();
      expect(typeof PROMPTS.TAROT.THREE_CARD_SPREAD).toBe("function");
    });

    it("should generate THREE_CARD_SPREAD with question", () => {
      const prompt = PROMPTS.TAROT.THREE_CARD_SPREAD(threeCardRequest);
      expect(prompt).toContain("How will my project evolve?");
    });

    it("should generate THREE_CARD_SPREAD with all three cards", () => {
      const prompt = PROMPTS.TAROT.THREE_CARD_SPREAD(threeCardRequest);
      expect(prompt).toContain("Past: The High Priestess");
      expect(prompt).toContain("Present: The Empress");
      expect(prompt).toContain("Future: The Emperor");
    });

    it("should show reversed status for middle card", () => {
      const prompt = PROMPTS.TAROT.THREE_CARD_SPREAD(threeCardRequest);
      expect(prompt).toContain("The Empress (Reversed)");
    });

    it("should include structured sections in THREE_CARD_SPREAD", () => {
      const prompt = PROMPTS.TAROT.THREE_CARD_SPREAD(threeCardRequest);
      expect(prompt).toContain("Story Arc");
      expect(prompt).toContain("Key Insight");
      expect(prompt).toContain("Empowering Action");
    });
  });

  describe("PROMPTS.DAILY_SPARK", () => {
    it("should have GENERAL prompt generator", () => {
      expect(PROMPTS.DAILY_SPARK.GENERAL).toBeDefined();
      expect(typeof PROMPTS.DAILY_SPARK.GENERAL).toBe("function");
    });

    it("should generate GENERAL without sign", () => {
      const req: DailySparkRequest = {};
      const prompt = PROMPTS.DAILY_SPARK.GENERAL(req);
      expect(prompt).toContain("daily spark message");
      expect(prompt).not.toContain("for undefined");
    });

    it("should generate GENERAL with sign", () => {
      const req: DailySparkRequest = { sign: "Aries" };
      const prompt = PROMPTS.DAILY_SPARK.GENERAL(req);
      expect(prompt).toContain("for Aries");
    });

    it("should mention maximum words in GENERAL", () => {
      const req: DailySparkRequest = {};
      const prompt = PROMPTS.DAILY_SPARK.GENERAL(req);
      expect(prompt).toContain("Maximum 25 words");
    });

    it("should have PERSONALIZED prompt generator", () => {
      expect(PROMPTS.DAILY_SPARK.PERSONALIZED).toBeDefined();
      expect(typeof PROMPTS.DAILY_SPARK.PERSONALIZED).toBe("function");
    });

    it("should generate PERSONALIZED without sign", () => {
      const req: DailySparkRequest = {};
      const prompt = PROMPTS.DAILY_SPARK.PERSONALIZED(req);
      expect(prompt).toContain("personalized daily guidance");
    });

    it("should generate PERSONALIZED with sign", () => {
      const req: DailySparkRequest = { sign: "Leo" };
      const prompt = PROMPTS.DAILY_SPARK.PERSONALIZED(req);
      expect(prompt).toContain("Leo Sun sign");
    });

    it("should mention maximum words in PERSONALIZED", () => {
      const req: DailySparkRequest = {};
      const prompt = PROMPTS.DAILY_SPARK.PERSONALIZED(req);
      expect(prompt).toContain("Maximum 30 words");
    });
  });

  describe("wrapWithLocale", () => {
    const testPrompt = "This is a test prompt.";

    it("should return original prompt for en-US", () => {
      const result = wrapWithLocale(testPrompt, "en-US");
      expect(result).toBe(testPrompt);
    });

    it("should add Chinese instruction for zh-CN", () => {
      const result = wrapWithLocale(testPrompt, "zh-CN");
      expect(result).toContain(testPrompt);
      expect(result).toContain("请用中文回复");
      expect(result).toContain("诗意");
    });

    it("should default to en-US when no locale provided", () => {
      const result = wrapWithLocale(testPrompt);
      expect(result).toBe(testPrompt);
    });

    it("should handle empty prompt", () => {
      const result = wrapWithLocale("", "en-US");
      expect(result).toBe("");
    });

    it("should handle empty prompt with zh-CN", () => {
      const result = wrapWithLocale("", "zh-CN");
      expect(result).toContain("请用中文回复");
    });
  });

  describe("buildPrompt", () => {
    it("should build prompt with ASTROLOGER role", () => {
      const result = buildPrompt("ASTROLOGER", "Tell me about stars");
      expect(result.system).toBe(PROMPTS.SYSTEM.ASTROLOGER);
      expect(result.user).toBe("Tell me about stars");
    });

    it("should build prompt with TAROT_READER role", () => {
      const result = buildPrompt("TAROT_READER", "What do the cards say?");
      expect(result.system).toBe(PROMPTS.SYSTEM.TAROT_READER);
      expect(result.user).toBe("What do the cards say?");
    });

    it("should build prompt with DAILY_ORACLE role", () => {
      const result = buildPrompt("DAILY_ORACLE", "Give me guidance");
      expect(result.system).toBe(PROMPTS.SYSTEM.DAILY_ORACLE);
      expect(result.user).toBe("Give me guidance");
    });

    it("should wrap user prompt with zh-CN locale", () => {
      const result = buildPrompt("ASTROLOGER", "Tell me about stars", "zh-CN");
      expect(result.system).toBe(PROMPTS.SYSTEM.ASTROLOGER);
      expect(result.user).toContain("Tell me about stars");
      expect(result.user).toContain("请用中文回复");
    });

    it("should not wrap user prompt with en-US locale", () => {
      const result = buildPrompt("ASTROLOGER", "Tell me about stars", "en-US");
      expect(result.user).toBe("Tell me about stars");
    });

    it("should return object with system and user keys", () => {
      const result = buildPrompt("ASTROLOGER", "Test");
      expect(result).toHaveProperty("system");
      expect(result).toHaveProperty("user");
      expect(Object.keys(result).length).toBe(2);
    });
  });

  describe("prompt content quality", () => {
    it("should have ASTROLOGER mentioning both Western and Eastern elements", () => {
      expect(PROMPTS.SYSTEM.ASTROLOGER).toContain("Western zodiac");
      expect(PROMPTS.SYSTEM.ASTROLOGER).toContain("Five Elements");
    });

    it("should have TAROT_READER mentioning intuition", () => {
      expect(PROMPTS.SYSTEM.TAROT_READER).toContain("intuition");
    });

    it("should have TAROT_READER mentioning free will", () => {
      expect(PROMPTS.SYSTEM.TAROT_READER).toContain("free will");
    });

    it("should have DAILY_ORACLE mentioning poetic", () => {
      expect(PROMPTS.SYSTEM.DAILY_ORACLE).toContain("poetic");
    });

    it("should have DAILY_ORACLE mentioning concise", () => {
      expect(PROMPTS.SYSTEM.DAILY_ORACLE).toContain("concise");
    });
  });
});
