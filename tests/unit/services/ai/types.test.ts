import { describe, it, expect } from "vitest";
import { AIProvider } from "@/services/ai/types";
import type {
  AIRequestConfig,
  AIResponseMeta,
  PlanetaryPositions,
  FiveElements,
  BirthChartAnalysisRequest,
  BirthChartAnalysisResponse,
  TarotPosition,
  TarotCard,
  UserBirthDataSummary,
  TarotReadingRequest,
  LuckyElements,
  TarotReadingResponse,
  TarotFollowUpRequest,
  TarotFollowUpResponse,
  DailySparkRequest,
  DailySparkResponse,
  IAIService,
} from "@/services/ai/types";

describe("AI types", () => {
  describe("AIProvider enum", () => {
    it("should have GEMINI value", () => {
      expect(AIProvider.GEMINI).toBe("gemini");
    });

    it("should have SUPABASE value", () => {
      expect(AIProvider.SUPABASE).toBe("supabase");
    });

    it("should have OPENAI value", () => {
      expect(AIProvider.OPENAI).toBe("openai");
    });

    it("should have ANTHROPIC value", () => {
      expect(AIProvider.ANTHROPIC).toBe("anthropic");
    });

    it("should have MOCK value", () => {
      expect(AIProvider.MOCK).toBe("mock");
    });

    it("should have exactly 5 providers", () => {
      const values = Object.values(AIProvider).filter(
        (v) => typeof v === "string"
      );
      expect(values.length).toBe(5);
    });
  });

  describe("AIRequestConfig interface", () => {
    it("should accept valid config with all fields", () => {
      const config: AIRequestConfig = {
        model: "gemini-pro",
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: "You are a helpful assistant",
      };
      expect(config.model).toBe("gemini-pro");
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(1000);
      expect(config.systemPrompt).toContain("helpful");
    });

    it("should accept config with optional fields omitted", () => {
      const config: AIRequestConfig = {};
      expect(config.model).toBeUndefined();
      expect(config.temperature).toBeUndefined();
    });
  });

  describe("AIResponseMeta interface", () => {
    it("should accept valid meta with all fields", () => {
      const meta: AIResponseMeta = {
        provider: AIProvider.GEMINI,
        model: "gemini-pro",
        tokenUsage: {
          prompt: 100,
          completion: 200,
          total: 300,
        },
        latencyMs: 1500,
        cached: false,
        isFallback: false,
      };
      expect(meta.provider).toBe(AIProvider.GEMINI);
      expect(meta.tokenUsage?.total).toBe(300);
    });

    it("should accept meta without optional tokenUsage", () => {
      const meta: AIResponseMeta = {
        provider: AIProvider.SUPABASE,
        model: "gpt-4",
        latencyMs: 2000,
        cached: true,
      };
      expect(meta.tokenUsage).toBeUndefined();
      expect(meta.cached).toBe(true);
    });
  });

  describe("PlanetaryPositions interface", () => {
    it("should accept valid planetary positions", () => {
      const planets: PlanetaryPositions = {
        Sun: "Aries",
        Moon: "Taurus",
        Mercury: "Gemini",
        Venus: "Cancer",
        Mars: "Leo",
        Jupiter: "Virgo",
        Saturn: "Libra",
      };
      expect(planets.Sun).toBe("Aries");
      expect(planets.Saturn).toBe("Libra");
    });

    it("should require all 7 planets", () => {
      const planets: PlanetaryPositions = {
        Sun: "Capricorn",
        Moon: "Capricorn",
        Mercury: "Capricorn",
        Venus: "Capricorn",
        Mars: "Capricorn",
        Jupiter: "Capricorn",
        Saturn: "Capricorn",
      };
      expect(Object.keys(planets).length).toBe(7);
    });
  });

  describe("FiveElements interface", () => {
    it("should accept valid element distribution", () => {
      const elements: FiveElements = {
        Wood: 20,
        Fire: 25,
        Earth: 15,
        Metal: 20,
        Water: 20,
      };
      expect(elements.Wood + elements.Fire).toBe(45);
    });

    it("should have 5 elements", () => {
      const elements: FiveElements = {
        Wood: 20,
        Fire: 20,
        Earth: 20,
        Metal: 20,
        Water: 20,
      };
      expect(Object.keys(elements).length).toBe(5);
    });
  });

  describe("BirthChartAnalysisRequest interface", () => {
    it("should accept valid request with required fields", () => {
      const request: BirthChartAnalysisRequest = {
        name: "John Doe",
        birthDate: new Date("1990-05-15"),
        planets: {
          Sun: "Taurus",
          Moon: "Scorpio",
          Mercury: "Taurus",
          Venus: "Gemini",
          Mars: "Aries",
          Jupiter: "Cancer",
          Saturn: "Capricorn",
        },
        elements: {
          Wood: 18,
          Fire: 22,
          Earth: 30,
          Metal: 15,
          Water: 15,
        },
      };
      expect(request.name).toBe("John Doe");
      expect(request.planets.Sun).toBe("Taurus");
    });

    it("should accept request with optional fields", () => {
      const request: BirthChartAnalysisRequest = {
        name: "Jane Doe",
        birthDate: new Date("1985-12-01"),
        birthTime: "14:30",
        birthPlace: "New York, USA",
        planets: {
          Sun: "Sagittarius",
          Moon: "Pisces",
          Mercury: "Capricorn",
          Venus: "Aquarius",
          Mars: "Virgo",
          Jupiter: "Aquarius",
          Saturn: "Scorpio",
        },
        elements: {
          Wood: 22,
          Fire: 28,
          Earth: 20,
          Metal: 12,
          Water: 18,
        },
        locale: "zh-CN",
      };
      expect(request.birthTime).toBe("14:30");
      expect(request.locale).toBe("zh-CN");
    });
  });

  describe("TarotCard interface", () => {
    it("should accept valid Major Arcana card", () => {
      const card: TarotCard = {
        id: "major-0",
        name: "The Fool",
        arcana: "Major",
        image: "/cards/fool.jpg",
        isReversed: false,
      };
      expect(card.arcana).toBe("Major");
      expect(card.suit).toBeUndefined();
    });

    it("should accept valid Minor Arcana card with suit", () => {
      const card: TarotCard = {
        id: "wands-1",
        name: "Ace of Wands",
        arcana: "Minor",
        suit: "Wands",
        image: "/cards/wands-1.jpg",
        isReversed: true,
        position: "future",
      };
      expect(card.arcana).toBe("Minor");
      expect(card.suit).toBe("Wands");
      expect(card.isReversed).toBe(true);
      expect(card.position).toBe("future");
    });
  });

  describe("TarotPosition type", () => {
    it("should accept valid positions", () => {
      const positions: TarotPosition[] = ["past", "present", "future", "single"];
      expect(positions.length).toBe(4);
      expect(positions).toContain("past");
      expect(positions).toContain("single");
    });
  });

  describe("UserBirthDataSummary interface", () => {
    it("should accept partial birth data", () => {
      const summary: UserBirthDataSummary = {
        sunSign: "Leo",
      };
      expect(summary.sunSign).toBe("Leo");
      expect(summary.moonSign).toBeUndefined();
    });

    it("should accept full birth data", () => {
      const summary: UserBirthDataSummary = {
        sunSign: "Leo",
        moonSign: "Aquarius",
        risingSign: "Virgo",
      };
      expect(summary.moonSign).toBe("Aquarius");
      expect(summary.risingSign).toBe("Virgo");
    });
  });

  describe("TarotReadingRequest interface", () => {
    it("should accept valid single card request", () => {
      const request: TarotReadingRequest = {
        cards: [
          {
            id: "major-1",
            name: "The Magician",
            arcana: "Major",
            image: "/cards/magician.jpg",
            isReversed: false,
          },
        ],
        question: "What should I focus on today?",
        spreadType: "single",
      };
      expect(request.spreadType).toBe("single");
      expect(request.cards.length).toBe(1);
    });

    it("should accept request with all optional fields", () => {
      const request: TarotReadingRequest = {
        cards: [
          {
            id: "major-2",
            name: "The High Priestess",
            arcana: "Major",
            image: "/cards/priestess.jpg",
            isReversed: false,
          },
        ],
        question: "Career guidance?",
        spreadType: "single",
        locale: "en-US",
        userBirthData: { sunSign: "Scorpio" },
        historyContext: "Previous reading mentioned change",
      };
      expect(request.locale).toBe("en-US");
      expect(request.userBirthData?.sunSign).toBe("Scorpio");
    });
  });

  describe("LuckyElements interface", () => {
    it("should accept valid lucky elements", () => {
      const lucky: LuckyElements = {
        color: "blue",
        number: 7,
        direction: "north",
      };
      expect(lucky.color).toBe("blue");
      expect(lucky.number).toBe(7);
    });

    it("should accept lucky elements with crystal", () => {
      const lucky: LuckyElements = {
        color: "purple",
        number: 3,
        direction: "east",
        crystal: "amethyst",
      };
      expect(lucky.crystal).toBe("amethyst");
    });
  });

  describe("TarotFollowUpRequest interface", () => {
    it("should accept valid follow-up request", () => {
      const request: TarotFollowUpRequest = {
        cards: [
          {
            id: "major-5",
            name: "The Hierophant",
            arcana: "Major",
            image: "/cards/hierophant.jpg",
            isReversed: false,
          },
        ],
        originalInterpretation: "Initial reading about tradition...",
        conversationHistory: [
          { role: "user", content: "What does this mean for my career?" },
          { role: "assistant", content: "This relates to..." },
        ],
        followUpQuestion: "Should I pursue further education?",
      };
      expect(request.conversationHistory.length).toBe(2);
      expect(request.followUpQuestion).toContain("education");
    });
  });

  describe("DailySparkRequest interface", () => {
    it("should accept empty request", () => {
      const request: DailySparkRequest = {};
      expect(request.sign).toBeUndefined();
    });

    it("should accept request with sign", () => {
      const request: DailySparkRequest = {
        sign: "Gemini",
        locale: "zh-CN",
      };
      expect(request.sign).toBe("Gemini");
    });

    it("should accept request with birth date", () => {
      const request: DailySparkRequest = {
        userBirthDate: new Date("1992-07-22"),
      };
      expect(request.userBirthDate).toBeInstanceOf(Date);
    });
  });

  describe("DailySparkResponse interface", () => {
    it("should accept minimal response", () => {
      const response: DailySparkResponse = {
        message: "Today brings new opportunities.",
        meta: {
          provider: AIProvider.GEMINI,
          model: "gemini-pro",
          latencyMs: 500,
          cached: false,
        },
      };
      expect(response.message).toContain("opportunities");
    });

    it("should accept response with lucky elements", () => {
      const response: DailySparkResponse = {
        message: "A day of creativity awaits.",
        luckyColor: "orange",
        luckyNumber: 8,
        meta: {
          provider: AIProvider.SUPABASE,
          model: "gpt-4",
          latencyMs: 800,
          cached: true,
        },
      };
      expect(response.luckyColor).toBe("orange");
      expect(response.luckyNumber).toBe(8);
    });
  });

  describe("TarotReadingResponse interface", () => {
    it("should accept valid response", () => {
      const response: TarotReadingResponse = {
        interpretation: "The cards suggest a time of transformation...",
        cardInterpretations: [
          {
            cardId: "major-13",
            meaning: "Transformation and endings",
            advice: "Embrace change",
          },
        ],
        actionAdvice: "Take time for reflection this week.",
        meta: {
          provider: AIProvider.GEMINI,
          model: "gemini-pro",
          latencyMs: 2000,
          cached: false,
        },
      };
      expect(response.cardInterpretations.length).toBe(1);
      expect(response.actionAdvice).toContain("reflection");
    });

    it("should accept response with optional fields", () => {
      const response: TarotReadingResponse = {
        interpretation: "A reading about love...",
        coreMessage: "Love requires patience",
        detailedReading: "Extended analysis...",
        cardInterpretations: [],
        actionAdvice: "Be patient.",
        luckyElements: {
          color: "pink",
          number: 2,
          direction: "south",
        },
        meta: {
          provider: AIProvider.ANTHROPIC,
          model: "claude-3",
          latencyMs: 1800,
          cached: false,
        },
      };
      expect(response.coreMessage).toContain("patience");
      expect(response.luckyElements?.color).toBe("pink");
    });
  });

  describe("TarotFollowUpResponse interface", () => {
    it("should accept valid follow-up response", () => {
      const response: TarotFollowUpResponse = {
        answer: "Based on the cards, yes pursuing education aligns...",
        meta: {
          provider: AIProvider.GEMINI,
          model: "gemini-pro",
          latencyMs: 1200,
          cached: false,
        },
      };
      expect(response.answer).toContain("education");
    });
  });

  describe("BirthChartAnalysisResponse interface", () => {
    it("should accept valid birth chart response", () => {
      const response: BirthChartAnalysisResponse = {
        analysis: "Your chart reveals a strong Earth influence...",
        insights: {
          sunTraits: "Practical and grounded nature",
          moonEmotions: "Deep emotional sensitivity",
          elementAdvice: "Cultivate more Fire energy",
        },
        meta: {
          provider: AIProvider.SUPABASE,
          model: "gpt-4",
          latencyMs: 3000,
          cached: false,
        },
      };
      expect(response.insights.sunTraits).toContain("Practical");
    });

    it("should accept response with lucky elements", () => {
      const response: BirthChartAnalysisResponse = {
        analysis: "Analysis text...",
        insights: {
          sunTraits: "Traits",
          moonEmotions: "Emotions",
          elementAdvice: "Advice",
        },
        luckyElements: {
          color: "green",
          number: 5,
          direction: "west",
        },
        meta: {
          provider: AIProvider.GEMINI,
          model: "gemini-pro",
          latencyMs: 2500,
          cached: true,
        },
      };
      expect(response.luckyElements?.direction).toBe("west");
    });
  });

  describe("IAIService interface", () => {
    it("should define service structure", () => {
      // Create a mock service to verify the interface shape
      const mockService: IAIService = {
        name: "MockAIService",
        provider: AIProvider.MOCK,
        generateBirthChartAnalysis: async () => ({
          analysis: "Mock analysis",
          insights: {
            sunTraits: "",
            moonEmotions: "",
            elementAdvice: "",
          },
          meta: {
            provider: AIProvider.MOCK,
            model: "mock",
            latencyMs: 0,
            cached: false,
          },
        }),
        generateTarotReading: async () => ({
          interpretation: "Mock interpretation",
          cardInterpretations: [],
          actionAdvice: "Mock advice",
          meta: {
            provider: AIProvider.MOCK,
            model: "mock",
            latencyMs: 0,
            cached: false,
          },
        }),
        generateDailySpark: async () => ({
          message: "Mock spark",
          meta: {
            provider: AIProvider.MOCK,
            model: "mock",
            latencyMs: 0,
            cached: false,
          },
        }),
        clearCache: () => {},
      };

      expect(mockService.name).toBe("MockAIService");
      expect(mockService.provider).toBe(AIProvider.MOCK);
      expect(typeof mockService.generateBirthChartAnalysis).toBe("function");
      expect(typeof mockService.generateTarotReading).toBe("function");
      expect(typeof mockService.generateDailySpark).toBe("function");
      expect(typeof mockService.clearCache).toBe("function");
    });

    it("should allow optional generateTarotFollowUp", () => {
      const mockService: IAIService = {
        name: "BasicService",
        provider: AIProvider.MOCK,
        generateBirthChartAnalysis: async () => ({} as any),
        generateTarotReading: async () => ({} as any),
        generateDailySpark: async () => ({} as any),
        clearCache: () => {},
      };

      expect(mockService.generateTarotFollowUp).toBeUndefined();
    });
  });
});
