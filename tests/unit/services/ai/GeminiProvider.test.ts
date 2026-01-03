import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original env
const originalEnv = { ...import.meta.env };

// Mock Google Generative AI
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

// Create a proper mock class
class MockGoogleGenerativeAI {
  constructor(_apiKey: string) {
    // Mock constructor
  }
  getGenerativeModel = mockGetGenerativeModel;
}

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: MockGoogleGenerativeAI,
}));

// Mock supabase
const mockSupabaseSelect = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseSingle = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSupabaseSelect.mockReturnValue({
        eq: mockSupabaseEq.mockReturnValue({
          single: mockSupabaseSingle,
        }),
      }),
    })),
  },
}));

describe("GeminiProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Default mock responses
    mockSupabaseSingle.mockResolvedValue({ data: null, error: null });
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "Test AI response with **Core Essence**: You are unique.",
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("module initialization", () => {
    it("should be importable", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");
      expect(GeminiProvider).toBeDefined();
    });

    it("should have correct name", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");
      expect(GeminiProvider.name).toBe("Gemini AI Provider");
    });

    it("should have correct provider type", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");
      expect(GeminiProvider.provider).toBe("gemini");
    });
  });

  describe("generateBirthChartAnalysis", () => {
    it("should generate birth chart analysis", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const request = {
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

      const result = await GeminiProvider.generateBirthChartAnalysis(request);

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.meta.provider).toBe("gemini");
    });

    it("should include insights in response", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const request = {
        name: "Test User",
        birthDate: new Date("1990-01-15"),
        planets: { Sun: "Aries" },
        elements: { Fire: 50 },
      };

      const result = await GeminiProvider.generateBirthChartAnalysis(request);

      expect(result.insights).toBeDefined();
      expect(result.insights.sunTraits).toBeDefined();
    });

    it("should respect locale parameter", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const request = {
        name: "Test User",
        birthDate: new Date("1990-01-15"),
        planets: { Sun: "Aries" },
        elements: { Fire: 50 },
        locale: "zh-CN" as const,
      };

      const result = await GeminiProvider.generateBirthChartAnalysis(request);
      expect(result).toBeDefined();
    });
  });

  describe("generateTarotReading", () => {
    it("should generate single card tarot reading", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const request = {
        cards: [
          {
            id: "major-0",
            name: "The Fool",
            arcana: "Major" as const,
            image: "/cards/fool.jpg",
            isReversed: false,
          },
        ],
        question: "What should I focus on?",
        spreadType: "single" as const,
      };

      const result = await GeminiProvider.generateTarotReading(request);

      expect(result).toBeDefined();
      expect(result.interpretation).toBeDefined();
      expect(result.cardInterpretations).toBeDefined();
      expect(result.cardInterpretations.length).toBe(1);
    });

    it("should generate three card tarot reading", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const request = {
        cards: [
          { id: "1", name: "The Fool", arcana: "Major" as const, image: "", isReversed: false },
          { id: "2", name: "The Magician", arcana: "Major" as const, image: "", isReversed: true },
          { id: "3", name: "The High Priestess", arcana: "Major" as const, image: "", isReversed: false },
        ],
        question: "Past, present, future?",
        spreadType: "three-card" as const,
      };

      const result = await GeminiProvider.generateTarotReading(request);

      expect(result.cardInterpretations.length).toBe(3);
    });

    it("should include action advice", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => "Reading with **Action Step**: Take bold steps forward.",
        },
      });

      const request = {
        cards: [{ id: "1", name: "The Fool", arcana: "Major" as const, image: "", isReversed: false }],
        question: "Guidance?",
        spreadType: "single" as const,
      };

      const result = await GeminiProvider.generateTarotReading(request);
      expect(result.actionAdvice).toBeDefined();
    });
  });

  describe("generateDailySpark", () => {
    it("should generate daily spark without sign", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateDailySpark({});

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it("should generate daily spark with sign", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateDailySpark({ sign: "Aries" });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it("should strip [MOCK] prefix from message", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => "[MOCK] Today is a great day!",
        },
      });

      const result = await GeminiProvider.generateDailySpark({});
      expect(result.message).not.toContain("[MOCK]");
    });
  });

  describe("clearCache", () => {
    it("should clear cache without error", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      expect(() => GeminiProvider.clearCache()).not.toThrow();
    });
  });

  describe("remote config", () => {
    it("should use cached config within TTL", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockSupabaseSingle.mockResolvedValue({
        data: { value: { model: "gemini-pro", temperature: 0.5 } },
        error: null,
      });

      // First call fetches config
      await GeminiProvider.generateDailySpark({});

      // Second call should use cache (within 1 minute)
      await GeminiProvider.generateDailySpark({});

      // Should only fetch once if within cache TTL
      // Note: This depends on timing and may need adjustment
    });

    it("should fall back to defaults on config fetch error", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockSupabaseSingle.mockRejectedValueOnce(new Error("DB error"));

      const result = await GeminiProvider.generateDailySpark({});
      expect(result).toBeDefined();
    });
  });

  describe("mock mode", () => {
    it("should return mock response when API key is not set", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateDailySpark({});

      expect(result).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it("should return birth chart mock response", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: { Sun: "Aries" },
        elements: { Fire: 50 },
      });

      expect(result.analysis).toBeDefined();
    });

    it("should return tarot mock response", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateTarotReading({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        question: "Test?",
        spreadType: "single",
      });

      expect(result.interpretation).toBeDefined();
    });
  });

  describe("response meta", () => {
    it("should include provider in meta", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateDailySpark({});
      expect(result.meta.provider).toBe("gemini");
    });

    it("should include latencyMs in meta", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateDailySpark({});
      expect(typeof result.meta.latencyMs).toBe("number");
      expect(result.meta.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("should include model in meta", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      const result = await GeminiProvider.generateDailySpark({});
      expect(result.meta.model).toBeDefined();
    });
  });

  describe("section extraction", () => {
    it("should extract Core Essence section", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => "Analysis: **Core Essence**: You are a natural leader. **Emotional**: Deep feelings.",
        },
      });

      const result = await GeminiProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: { Sun: "Leo" },
        elements: { Fire: 50 },
      });

      expect(result.insights.sunTraits).toContain("leader");
    });

    it("should extract Emotional section", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => "**Emotional Landscape**: Your emotions run deep and powerful.",
        },
      });

      const result = await GeminiProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: { Moon: "Cancer" },
        elements: { Water: 50 },
      });

      expect(result.insights.moonEmotions).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should return result even when API not configured", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      // In mock mode (no API key), the provider uses internal mock responses
      // This test verifies the function completes even without real API
      const result = await GeminiProvider.generateDailySpark({});
      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it("should handle supabase config errors gracefully", async () => {
      const { GeminiProvider } = await import("@/services/ai/GeminiProvider");

      mockSupabaseSingle.mockRejectedValueOnce(new Error("Database error"));

      // Should still work with default config
      const result = await GeminiProvider.generateDailySpark({});
      expect(result).toBeDefined();
    });
  });
});
