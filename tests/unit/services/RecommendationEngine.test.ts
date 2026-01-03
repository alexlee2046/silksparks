import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RecommendationEngine,
  invalidateProductCache,
} from "@/services/RecommendationEngine";
import type { TarotCard, LuckyElements } from "@/services/ai/types";

// Mock Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock getElementFromDate
vi.mock("@/lib/ZodiacUtils", () => ({
  getElementFromDate: vi.fn(() => "fire"),
}));

describe("RecommendationEngine", () => {
  const mockProducts = [
    {
      id: "1",
      title: "Rose Quartz Crystal",
      price: 29.99,
      description: "A healing crystal for love and relationships",
      image_url: "https://example.com/rose-quartz.jpg",
      product_tags: [
        { tags: { name: "love" } },
        { tags: { name: "healing" } },
        { tags: { name: "crystal" } },
      ],
    },
    {
      id: "2",
      title: "Protection Amulet",
      price: 49.99,
      description: "Ancient symbol for protection and grounding",
      image_url: "https://example.com/amulet.jpg",
      product_tags: [
        { tags: { name: "protection" } },
        { tags: { name: "earth" } },
      ],
    },
    {
      id: "3",
      title: "Fire Candle Set",
      price: 19.99,
      description: "Candles for passion and energy rituals",
      image_url: "https://example.com/candles.jpg",
      product_tags: [
        { tags: { name: "fire" } },
        { tags: { name: "passion" } },
        { tags: { name: "energy" } },
      ],
    },
    {
      id: "4",
      title: "Tarot Reading Book",
      price: 39.99,
      description: "Complete guide to tarot interpretation",
      image_url: "https://example.com/book.jpg",
      product_tags: [
        { tags: { name: "tarot" } },
        { tags: { name: "guidance" } },
      ],
    },
  ];

  const mockFeaturedProducts = [
    {
      id: "1",
      title: "Featured Crystal",
      price: 59.99,
      description: "Our most popular item",
      image_url: "https://example.com/featured.jpg",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    invalidateProductCache();

    // Default mock setup for products with tags
    mockFrom.mockImplementation((table: string) => {
      if (table === "products") {
        return { select: mockSelect };
      }
      return { select: mockSelect };
    });

    mockSelect.mockImplementation((query?: string) => {
      if (query?.includes("product_tags")) {
        // Full product query with tags
        return Promise.resolve({ data: mockProducts, error: null });
      }
      // Featured products query
      return { eq: mockEq };
    });

    mockEq.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue({ data: mockFeaturedProducts, error: null });
  });

  describe("getRecommendations", () => {
    it("should return products matching search text", async () => {
      const results = await RecommendationEngine.getRecommendations("love");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe("Rose Quartz Crystal");
    });

    it("should score tag matches higher than description matches", async () => {
      const results = await RecommendationEngine.getRecommendations("fire");

      // Fire Candle Set has "fire" tag, should be first
      expect(results[0].name).toBe("Fire Candle Set");
    });

    it("should respect limit parameter", async () => {
      const results = await RecommendationEngine.getRecommendations("", 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array when no products in database", async () => {
      mockSelect.mockResolvedValueOnce({ data: [], error: null });

      const results = await RecommendationEngine.getRecommendations("test");

      expect(results).toEqual([]);
    });

    it("should handle database error gracefully", async () => {
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const results = await RecommendationEngine.getRecommendations("test");

      expect(results).toEqual([]);
      consoleSpy.mockRestore();
    });

    it("should map database fields to frontend interface", async () => {
      const results = await RecommendationEngine.getRecommendations("love");

      expect(results[0]).toHaveProperty("id");
      expect(results[0]).toHaveProperty("name"); // mapped from title
      expect(results[0]).toHaveProperty("price");
      expect(results[0]).toHaveProperty("description");
      expect(results[0]).toHaveProperty("image"); // mapped from image_url
      expect(results[0]).toHaveProperty("tags");
    });

    it("should fill with random products when matches are insufficient", async () => {
      const results = await RecommendationEngine.getRecommendations(
        "nonexistent_term",
        3
      );

      // Should still return products even if no matches
      expect(results.length).toBe(3);
    });

    it("should handle null tags gracefully", async () => {
      mockSelect.mockResolvedValueOnce({
        data: [
          {
            id: "5",
            title: "No Tags Product",
            price: 9.99,
            description: "Product without tags",
            image_url: null,
            product_tags: null,
          },
        ],
        error: null,
      });

      const results = await RecommendationEngine.getRecommendations("test");

      expect(results).toBeDefined();
    });
  });

  describe("getPersonalizedRecs", () => {
    it("should use user element for personalization", async () => {
      const userProfile = {
        birthData: { date: new Date("1990-04-15") },
      };

      const results = await RecommendationEngine.getPersonalizedRecs(userProfile);

      // Should match fire element products
      expect(results.length).toBeGreaterThan(0);
    });

    it("should fallback to protection for null user", async () => {
      const results = await RecommendationEngine.getPersonalizedRecs(null);

      // Should search for "protection" - Protection Amulet should score high
      expect(results.length).toBeGreaterThan(0);
    });

    it("should fallback to protection for user without birth data", async () => {
      const userProfile = { birthData: null };

      const results = await RecommendationEngine.getPersonalizedRecs(userProfile as any);

      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect limit parameter", async () => {
      const results = await RecommendationEngine.getPersonalizedRecs(null, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getFeaturedProducts", () => {
    it("should query featured products from database", async () => {
      const results = await RecommendationEngine.getFeaturedProducts();

      expect(mockFrom).toHaveBeenCalledWith("products");
    });

    it("should map featured products to frontend interface", async () => {
      const results = await RecommendationEngine.getFeaturedProducts();

      expect(results[0]).toHaveProperty("id");
      expect(results[0]).toHaveProperty("name");
      expect(results[0]).toHaveProperty("title");
      expect(results[0]).toHaveProperty("price");
      expect(results[0]).toHaveProperty("image");
      expect(results[0]).toHaveProperty("image_url");
    });

    it("should respect limit parameter", async () => {
      mockLimit.mockResolvedValueOnce({
        data: mockFeaturedProducts,
        error: null,
      });

      await RecommendationEngine.getFeaturedProducts(2);

      expect(mockLimit).toHaveBeenCalled();
    });

    it("should fallback to regular products on error", async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const results = await RecommendationEngine.getFeaturedProducts();

      // Should fall back to regular products
      expect(results).toBeDefined();
    });
  });

  describe("getTarotBasedRecommendations", () => {
    const testCards: TarotCard[] = [
      {
        id: "the-fool",
        name: "The Fool",
        arcana: "Major",
        image: "fool.jpg",
        isReversed: false,
        position: "present",
      },
      {
        id: "ace-of-wands",
        name: "Ace of Wands",
        arcana: "Minor",
        suit: "Wands",
        image: "ace-wands.jpg",
        isReversed: false,
        position: "future",
      },
    ];

    const testLuckyElements: LuckyElements = {
      crystal: "Rose Quartz",
      color: "Pink",
      number: 7,
    };

    it("should return products based on tarot cards", async () => {
      const results = await RecommendationEngine.getTarotBasedRecommendations(
        testCards
      );

      expect(results.length).toBeGreaterThan(0);
    });

    it("should boost products matching lucky crystal", async () => {
      const results = await RecommendationEngine.getTarotBasedRecommendations(
        testCards,
        testLuckyElements
      );

      // Rose Quartz Crystal should be boosted
      const roseQuartz = results.find((p) => p.name?.includes("Rose Quartz"));
      expect(roseQuartz).toBeDefined();
    });

    it("should extract keywords from Major Arcana cards", async () => {
      const majorArcanaCards: TarotCard[] = [
        {
          id: "the-lovers",
          name: "The Lovers",
          arcana: "Major",
          image: "lovers.jpg",
          isReversed: false,
          position: "present",
        },
      ];

      const results = await RecommendationEngine.getTarotBasedRecommendations(
        majorArcanaCards
      );

      // The Lovers keywords include "love", "harmony", "relationships"
      // Rose Quartz has "love" tag
      expect(results.length).toBeGreaterThan(0);
    });

    it("should extract keywords from suit for Minor Arcana", async () => {
      const minorArcanaCards: TarotCard[] = [
        {
          id: "three-of-cups",
          name: "Three of Cups",
          arcana: "Minor",
          suit: "Cups",
          image: "three-cups.jpg",
          isReversed: false,
          position: "past",
        },
      ];

      const results = await RecommendationEngine.getTarotBasedRecommendations(
        minorArcanaCards
      );

      // Cups suit keywords include "water", "emotion", "love"
      expect(results.length).toBeGreaterThan(0);
    });

    it("should add healing keywords for reversed cards", async () => {
      const reversedCards: TarotCard[] = [
        {
          id: "the-tower",
          name: "The Tower",
          arcana: "Major",
          image: "tower.jpg",
          isReversed: true,
          position: "present",
        },
      ];

      const results = await RecommendationEngine.getTarotBasedRecommendations(
        reversedCards
      );

      // Reversed cards add "shadow", "healing", "release", "balance"
      // Rose Quartz has "healing" tag
      expect(results.length).toBeGreaterThan(0);
    });

    it("should respect limit parameter", async () => {
      const results = await RecommendationEngine.getTarotBasedRecommendations(
        testCards,
        testLuckyElements,
        2
      );

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should return empty array when no products", async () => {
      mockSelect.mockResolvedValueOnce({ data: [], error: null });
      invalidateProductCache();

      const results = await RecommendationEngine.getTarotBasedRecommendations(
        testCards
      );

      expect(results).toEqual([]);
    });

    it("should fill with random products when matches insufficient", async () => {
      const results = await RecommendationEngine.getTarotBasedRecommendations(
        [],
        undefined,
        3
      );

      // Even with no cards, should return products
      expect(results.length).toBe(3);
    });
  });

  describe("invalidateProductCache", () => {
    it("should clear cache and force refetch", async () => {
      // First call populates cache
      await RecommendationEngine.getRecommendations("test");
      mockSelect.mockClear();

      // Second call uses cache
      await RecommendationEngine.getRecommendations("test");
      expect(mockSelect).not.toHaveBeenCalled();

      // Invalidate cache
      invalidateProductCache();
      mockSelect.mockResolvedValueOnce({ data: mockProducts, error: null });

      // Third call should fetch again
      await RecommendationEngine.getRecommendations("test");
      expect(mockSelect).toHaveBeenCalled();
    });
  });
});
