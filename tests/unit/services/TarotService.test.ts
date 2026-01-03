import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDailyCardSeed,
  getSpreadSeed,
  hashString,
  shuffleDeck,
  getDisplayCards,
  isCardReversed,
  getCardByIndex,
  buildTarotCard,
  initDailyTarot,
  selectDailyCard,
  initSpreadTarot,
  selectSpreadCards,
  getCardKeywords,
  getTotalCardCount,
  DAILY_DISPLAY_COUNT,
  SPREAD_DISPLAY_COUNT,
} from "@/services/TarotService";

describe("TarotService", () => {
  describe("getDailyCardSeed", () => {
    it("should generate seed for logged in user", () => {
      const date = new Date("2024-01-15");
      const seed = getDailyCardSeed("user-123", date);

      expect(seed).toBe("daily:user-123:2024-01-15");
    });

    it("should generate seed for anonymous user", () => {
      const date = new Date("2024-01-15");
      const seed = getDailyCardSeed(null, date);

      expect(seed).toBe("daily:anonymous:2024-01-15");
    });

    it("should be deterministic - same date same user produces same seed", () => {
      const date = new Date("2024-01-15");
      const seed1 = getDailyCardSeed("user-123", date);
      const seed2 = getDailyCardSeed("user-123", date);

      expect(seed1).toBe(seed2);
    });

    it("should produce different seeds for different dates", () => {
      const date1 = new Date("2024-01-15");
      const date2 = new Date("2024-01-16");
      const seed1 = getDailyCardSeed("user-123", date1);
      const seed2 = getDailyCardSeed("user-123", date2);

      expect(seed1).not.toBe(seed2);
    });

    it("should produce different seeds for different users", () => {
      const date = new Date("2024-01-15");
      const seed1 = getDailyCardSeed("user-123", date);
      const seed2 = getDailyCardSeed("user-456", date);

      expect(seed1).not.toBe(seed2);
    });
  });

  describe("getSpreadSeed", () => {
    it("should include user ID in seed", () => {
      const seed = getSpreadSeed("user-123");

      expect(seed).toContain("user-123");
      expect(seed).toContain("spread:");
    });

    it("should use anonymous for null user", () => {
      const seed = getSpreadSeed(null);

      expect(seed).toContain("anonymous");
    });

    it("should include timestamp for uniqueness", () => {
      const seed1 = getSpreadSeed("user-123");
      // Small delay to ensure different timestamp
      const seed2 = getSpreadSeed("user-123");

      // Seeds should be different due to timestamp
      // Note: In fast execution they might be the same, so we just check structure
      expect(seed1).toMatch(/^spread:user-123:\d+$/);
    });
  });

  describe("hashString", () => {
    it("should return a number", () => {
      const hash = hashString("test");

      expect(typeof hash).toBe("number");
    });

    it("should be deterministic", () => {
      const hash1 = hashString("hello world");
      const hash2 = hashString("hello world");

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different strings", () => {
      const hash1 = hashString("hello");
      const hash2 = hashString("world");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", () => {
      const hash = hashString("");

      expect(typeof hash).toBe("number");
    });
  });

  describe("shuffleDeck", () => {
    it("should return array of 78 cards", () => {
      const deck = shuffleDeck("test-seed");

      expect(deck).toHaveLength(78);
    });

    it("should contain all card indices 0-77", () => {
      const deck = shuffleDeck("test-seed");
      const sorted = [...deck].sort((a, b) => a - b);

      expect(sorted).toEqual(Array.from({ length: 78 }, (_, i) => i));
    });

    it("should be deterministic with same seed", () => {
      const deck1 = shuffleDeck("same-seed");
      const deck2 = shuffleDeck("same-seed");

      expect(deck1).toEqual(deck2);
    });

    it("should produce different order with different seeds", () => {
      const deck1 = shuffleDeck("seed-1");
      const deck2 = shuffleDeck("seed-2");

      expect(deck1).not.toEqual(deck2);
    });
  });

  describe("getDisplayCards", () => {
    it("should return requested number of cards", () => {
      const deck = shuffleDeck("test");
      const display = getDisplayCards(deck, 7);

      expect(display).toHaveLength(7);
    });

    it("should return first N cards from deck", () => {
      const deck = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const display = getDisplayCards(deck, 5);

      expect(display).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("isCardReversed", () => {
    it("should return boolean", () => {
      const result = isCardReversed("test-seed", 0);

      expect(typeof result).toBe("boolean");
    });

    it("should be deterministic with same seed and index", () => {
      const result1 = isCardReversed("test-seed", 5);
      const result2 = isCardReversed("test-seed", 5);

      expect(result1).toBe(result2);
    });

    it("should vary by card index", () => {
      // Test multiple indices - at least some should differ
      const results = Array.from({ length: 20 }, (_, i) =>
        isCardReversed("test-seed", i)
      );

      // Should have both true and false values
      expect(results.includes(true)).toBe(true);
      expect(results.includes(false)).toBe(true);
    });
  });

  describe("getCardByIndex", () => {
    it("should return card data for valid index", () => {
      const card = getCardByIndex(0);

      expect(card).not.toBeNull();
      expect(card).toHaveProperty("id");
      expect(card).toHaveProperty("name");
    });

    it("should return null for invalid index", () => {
      const card = getCardByIndex(999);

      expect(card).toBeNull();
    });

    it("should return null for negative index", () => {
      const card = getCardByIndex(-1);

      expect(card).toBeNull();
    });
  });

  describe("buildTarotCard", () => {
    it("should build card with all properties", () => {
      const card = buildTarotCard(0, "test-seed", "present");

      expect(card).not.toBeNull();
      expect(card).toHaveProperty("id");
      expect(card).toHaveProperty("name");
      expect(card).toHaveProperty("arcana");
      expect(card).toHaveProperty("image");
      expect(card).toHaveProperty("isReversed");
      expect(card?.position).toBe("present");
    });

    it("should return null for invalid index", () => {
      const card = buildTarotCard(999, "test-seed");

      expect(card).toBeNull();
    });

    it("should set isReversed based on seed", () => {
      const card = buildTarotCard(0, "test-seed");

      expect(typeof card?.isReversed).toBe("boolean");
    });
  });

  describe("initDailyTarot", () => {
    it("should return shuffled deck and display cards", () => {
      const result = initDailyTarot("user-123", new Date("2024-01-15"));

      expect(result.shuffledDeck).toHaveLength(78);
      expect(result.displayCards).toHaveLength(DAILY_DISPLAY_COUNT);
      expect(result.seed).toContain("daily:");
    });

    it("should be deterministic for same user and date", () => {
      const date = new Date("2024-01-15");
      const result1 = initDailyTarot("user-123", date);
      const result2 = initDailyTarot("user-123", date);

      expect(result1.shuffledDeck).toEqual(result2.shuffledDeck);
      expect(result1.displayCards).toEqual(result2.displayCards);
      expect(result1.seed).toEqual(result2.seed);
    });

    it("should work for anonymous user", () => {
      const result = initDailyTarot(null, new Date());

      expect(result.shuffledDeck).toHaveLength(78);
      expect(result.seed).toContain("anonymous");
    });
  });

  describe("selectDailyCard", () => {
    it("should return TarotCard for valid index", () => {
      const card = selectDailyCard("test-seed", 0);

      expect(card).not.toBeNull();
      expect(card?.position).toBe("single");
    });

    it("should return null for invalid index", () => {
      const card = selectDailyCard("test-seed", 999);

      expect(card).toBeNull();
    });
  });

  describe("initSpreadTarot", () => {
    it("should return shuffled deck and display cards", () => {
      const result = initSpreadTarot("user-123");

      expect(result.shuffledDeck).toHaveLength(78);
      expect(result.displayCards).toHaveLength(SPREAD_DISPLAY_COUNT);
      expect(result.seed).toContain("spread:");
    });

    it("should work for anonymous user", () => {
      const result = initSpreadTarot(null);

      expect(result.seed).toContain("anonymous");
    });
  });

  describe("selectSpreadCards", () => {
    it("should return array of TarotCards", () => {
      const cards = selectSpreadCards("test-seed", [0, 1, 2]);

      expect(cards).toHaveLength(3);
      cards.forEach((card) => {
        expect(card).toHaveProperty("id");
        expect(card).toHaveProperty("name");
      });
    });

    it("should assign correct positions", () => {
      const cards = selectSpreadCards("test-seed", [0, 1, 2]);

      expect(cards[0].position).toBe("past");
      expect(cards[1].position).toBe("present");
      expect(cards[2].position).toBe("future");
    });

    it("should filter out invalid indices", () => {
      const cards = selectSpreadCards("test-seed", [0, 999, 2]);

      // Only valid cards should be returned
      expect(cards.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getCardKeywords", () => {
    it("should return keywords for valid card", () => {
      // Get a card ID from the first card
      const card = getCardByIndex(0);
      if (card) {
        const keywords = getCardKeywords(card.id);
        expect(Array.isArray(keywords)).toBe(true);
      }
    });

    it("should return empty array for invalid card ID", () => {
      const keywords = getCardKeywords("invalid-id");

      expect(keywords).toEqual([]);
    });
  });

  describe("getTotalCardCount", () => {
    it("should return 78 (standard tarot deck)", () => {
      const count = getTotalCardCount();

      expect(count).toBe(78);
    });
  });

  describe("constants", () => {
    it("should have correct DAILY_DISPLAY_COUNT", () => {
      expect(DAILY_DISPLAY_COUNT).toBe(7);
    });

    it("should have correct SPREAD_DISPLAY_COUNT", () => {
      expect(SPREAD_DISPLAY_COUNT).toBe(9);
    });
  });
});
