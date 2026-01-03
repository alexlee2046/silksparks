import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to properly hoist mock setup
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

// Mock supabase
vi.mock("@/services/supabase", () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

// Import after mocks
import { SupabaseAIProvider, RateLimitError } from "@/services/ai/SupabaseAIProvider";
import { AIProvider } from "@/services/ai/types";

describe("SupabaseAIProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful response
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        data: { text: "Test AI response" },
        meta: {
          provider: "supabase",
          model: "gemini-2.0-flash-exp",
          latencyMs: 500,
        },
      },
      error: null,
    });
  });

  describe("module exports", () => {
    it("should export SupabaseAIProvider", () => {
      expect(SupabaseAIProvider).toBeDefined();
    });

    it("should export RateLimitError", () => {
      expect(RateLimitError).toBeDefined();
    });

    it("should have correct name", () => {
      expect(SupabaseAIProvider.name).toBe("Supabase Edge Function AI Provider");
    });

    it("should have correct provider type", () => {
      expect(SupabaseAIProvider.provider).toBe(AIProvider.SUPABASE);
    });
  });

  describe("RateLimitError", () => {
    it("should be an Error instance", () => {
      const error = new RateLimitError("Rate limit exceeded");
      expect(error).toBeInstanceOf(Error);
    });

    it("should have correct name", () => {
      const error = new RateLimitError("Rate limit exceeded");
      expect(error.name).toBe("RateLimitError");
    });

    it("should preserve message", () => {
      const error = new RateLimitError("Custom message");
      expect(error.message).toBe("Custom message");
    });
  });

  describe("generateBirthChartAnalysis", () => {
    it("should call edge function with correct type", async () => {
      const request = {
        name: "Test User",
        birthDate: new Date("1990-01-15"),
        planets: { Sun: "Capricorn", Moon: "Aries" },
        elements: { Fire: 30, Earth: 25 },
      };

      await SupabaseAIProvider.generateBirthChartAnalysis(request);

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "birth_chart",
            payload: expect.objectContaining({
              name: "Test User",
            }),
          }),
        })
      );
    });

    it("should return analysis response", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "**Core Essence**: You are unique. **Emotional**: Deep. **Balance**: Harmony." },
          meta: { provider: "supabase", model: "gemini-2.0" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: { Sun: "Aries" },
        elements: { Fire: 50 },
      });

      expect(result.analysis).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it("should extract sun traits from response", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "**Core Essence**: You are a natural leader with great vision." },
          meta: { provider: "supabase", model: "gemini-2.0" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: { Sun: "Leo" },
        elements: { Fire: 60 },
      });

      expect(result.insights.sunTraits).toContain("leader");
    });

    it("should pass locale to edge function", async () => {
      await SupabaseAIProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: { Sun: "Aries" },
        elements: { Fire: 50 },
        locale: "zh-CN",
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            locale: "zh-CN",
          }),
        })
      );
    });
  });

  describe("generateTarotReading", () => {
    it("should call edge function with tarot type", async () => {
      const request = {
        cards: [
          { id: "1", name: "The Fool", arcana: "Major" as const, image: "", isReversed: false },
        ],
        question: "What should I focus on?",
        spreadType: "single" as const,
      };

      await SupabaseAIProvider.generateTarotReading(request);

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "tarot",
          }),
        })
      );
    });

    it("should return interpretation", async () => {
      const result = await SupabaseAIProvider.generateTarotReading({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        question: "Guidance?",
        spreadType: "single",
      });

      expect(result.interpretation).toBeDefined();
      expect(result.cardInterpretations).toBeDefined();
    });

    it("should parse JSON response with coreMessage", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            text: JSON.stringify({
              coreMessage: "Embrace new beginnings",
              interpretation: "The Fool suggests...",
              actionAdvice: "Take that leap",
              luckyElements: { color: "Blue", number: 7 },
            }),
          },
          meta: { provider: "supabase", model: "gemini-2.0" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateTarotReading({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        question: "Test?",
        spreadType: "single",
      });

      expect(result.coreMessage).toBe("Embrace new beginnings");
      expect(result.actionAdvice).toBe("Take that leap");
      expect(result.luckyElements).toBeDefined();
    });

    it("should include card data in request", async () => {
      await SupabaseAIProvider.generateTarotReading({
        cards: [
          { id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false, position: "present" },
        ],
        question: "Test?",
        spreadType: "single",
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            payload: expect.objectContaining({
              cards: expect.arrayContaining([
                expect.objectContaining({
                  name: "The Fool",
                  isReversed: false,
                  arcana: "Major",
                }),
              ]),
            }),
          }),
        })
      );
    });
  });

  describe("generateTarotFollowUp", () => {
    it("should call edge function with tarot_followup type", async () => {
      await SupabaseAIProvider.generateTarotFollowUp({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        originalInterpretation: "Original reading...",
        conversationHistory: [],
        followUpQuestion: "What else?",
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "tarot_followup",
          }),
        })
      );
    });

    it("should return answer in response", async () => {
      const result = await SupabaseAIProvider.generateTarotFollowUp({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        originalInterpretation: "Original...",
        conversationHistory: [],
        followUpQuestion: "Tell me more",
      });

      expect(result.answer).toBeDefined();
      expect(result.meta).toBeDefined();
    });

    it("should include conversation history", async () => {
      await SupabaseAIProvider.generateTarotFollowUp({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        originalInterpretation: "Original...",
        conversationHistory: [
          { role: "user", content: "Question 1" },
          { role: "assistant", content: "Answer 1" },
        ],
        followUpQuestion: "Follow up",
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            payload: expect.objectContaining({
              conversationHistory: expect.arrayContaining([
                expect.objectContaining({ role: "user" }),
              ]),
            }),
          }),
        })
      );
    });
  });

  describe("generateDailySpark", () => {
    it("should call edge function with daily_spark type", async () => {
      await SupabaseAIProvider.generateDailySpark({});

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            type: "daily_spark",
          }),
        })
      );
    });

    it("should return trimmed message", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "  Today is your day!  " },
          meta: { provider: "supabase", model: "gemini-2.0" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateDailySpark({});
      expect(result.message).toBe("Today is your day!");
    });

    it("should include sign when provided", async () => {
      await SupabaseAIProvider.generateDailySpark({ sign: "Leo" });

      expect(mockInvoke).toHaveBeenCalledWith(
        "ai-generate",
        expect.objectContaining({
          body: expect.objectContaining({
            payload: expect.objectContaining({
              sign: "Leo",
            }),
          }),
        })
      );
    });
  });

  describe("clearCache", () => {
    it("should not throw when called", () => {
      expect(() => SupabaseAIProvider.clearCache()).not.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle edge function errors", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: "Edge function error" },
      });

      const result = await SupabaseAIProvider.generateDailySpark({});

      // Should return fallback message
      expect(result).toBeDefined();
      expect(result.meta.isFallback).toBe(true);
    });

    it("should handle invalid response data", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { success: false, error: "Invalid data" },
        error: null,
      });

      const result = await SupabaseAIProvider.generateDailySpark({});

      expect(result.meta.isFallback).toBe(true);
    });

    it("should throw RateLimitError for rate limit response", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: false,
          errorCode: "RATE_LIMIT_EXCEEDED",
          error: "Daily limit reached",
          meta: { provider: "supabase", model: "unknown" },
        },
        error: null,
      });

      await expect(
        SupabaseAIProvider.generateDailySpark({})
      ).rejects.toThrow(RateLimitError);
    });

    it("should include error message in fallback meta", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      const result = await SupabaseAIProvider.generateDailySpark({});

      expect(result.meta.errorMessage).toBeDefined();
      expect(result.meta.isFallback).toBe(true);
    });
  });

  describe("response meta", () => {
    it("should include provider in meta", async () => {
      const result = await SupabaseAIProvider.generateDailySpark({});
      expect(result.meta.provider).toBe(AIProvider.SUPABASE);
    });

    it("should include model from response", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "Test" },
          meta: { provider: "supabase", model: "gemini-custom" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateDailySpark({});
      expect(result.meta.model).toBe("gemini-custom");
    });

    it("should include latencyMs", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "Test" },
          meta: { provider: "supabase", model: "gemini", latencyMs: 750 },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateDailySpark({});
      expect(result.meta.latencyMs).toBe(750);
    });

    it("should calculate latencyMs if not provided", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "Test" },
          meta: { provider: "supabase", model: "gemini" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateDailySpark({});
      expect(typeof result.meta.latencyMs).toBe("number");
    });

    it("should include tokenUsage when provided", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "Test" },
          meta: {
            provider: "supabase",
            model: "gemini",
            tokenUsage: { input: 100, output: 50, total: 150 },
          },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateDailySpark({});
      expect(result.meta.tokenUsage).toBeDefined();
      expect(result.meta.tokenUsage?.prompt).toBe(100);
      expect(result.meta.tokenUsage?.completion).toBe(50);
      expect(result.meta.tokenUsage?.total).toBe(150);
    });
  });

  describe("fallback messages", () => {
    it("should return fallback for birth_chart on error", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const result = await SupabaseAIProvider.generateBirthChartAnalysis({
        name: "Test",
        birthDate: new Date(),
        planets: {},
        elements: {},
      });

      expect(result.analysis).toBeDefined();
      expect(result.meta.isFallback).toBe(true);
    });

    it("should return fallback for tarot on error", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const result = await SupabaseAIProvider.generateTarotReading({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        question: "Test?",
        spreadType: "single",
      });

      expect(result.interpretation).toBeDefined();
      expect(result.meta.isFallback).toBe(true);
    });

    it("should return fallback for daily_spark on error", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: "Error" },
      });

      const result = await SupabaseAIProvider.generateDailySpark({});

      expect(result.message).toBeDefined();
      expect(result.meta.isFallback).toBe(true);
    });
  });

  describe("JSON parsing", () => {
    it("should handle non-JSON text response", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "Plain text response without JSON" },
          meta: { provider: "supabase", model: "gemini" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateTarotReading({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        question: "Test?",
        spreadType: "single",
      });

      expect(result.interpretation).toBe("Plain text response without JSON");
    });

    it("should extract action from text when no JSON", async () => {
      mockInvoke.mockResolvedValueOnce({
        data: {
          success: true,
          data: { text: "Response with **Action Step**: Take bold action now." },
          meta: { provider: "supabase", model: "gemini" },
        },
        error: null,
      });

      const result = await SupabaseAIProvider.generateTarotReading({
        cards: [{ id: "1", name: "The Fool", arcana: "Major", image: "", isReversed: false }],
        question: "Test?",
        spreadType: "single",
      });

      expect(result.actionAdvice).toContain("bold action");
    });
  });
});
