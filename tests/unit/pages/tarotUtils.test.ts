import { describe, it, expect } from "vitest";
import {
  getRomanNumeral,
  getCardNumberDisplay,
  GOLD_FOIL_FILTER,
} from "@/pages/features/tarotUtils";

describe("tarotUtils", () => {
  describe("getRomanNumeral", () => {
    it("should return 0 for 0", () => {
      expect(getRomanNumeral(0)).toBe("0");
    });

    it("should return I for 1", () => {
      expect(getRomanNumeral(1)).toBe("I");
    });

    it("should return V for 5", () => {
      expect(getRomanNumeral(5)).toBe("V");
    });

    it("should return X for 10", () => {
      expect(getRomanNumeral(10)).toBe("X");
    });

    it("should return XV for 15", () => {
      expect(getRomanNumeral(15)).toBe("XV");
    });

    it("should return XXI for 21", () => {
      expect(getRomanNumeral(21)).toBe("XXI");
    });

    it("should return string of number for numbers outside range", () => {
      expect(getRomanNumeral(22)).toBe("22");
      expect(getRomanNumeral(100)).toBe("100");
    });

    it("should handle all Major Arcana numbers", () => {
      const expected = [
        "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
        "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"
      ];

      for (let i = 0; i <= 21; i++) {
        expect(getRomanNumeral(i)).toBe(expected[i]);
      }
    });
  });

  describe("getCardNumberDisplay", () => {
    describe("Major Arcana", () => {
      it("should return 0 for The Fool (m00)", () => {
        const card = { id: "m00", name: "The Fool", arcana: "Major" };
        expect(getCardNumberDisplay(card)).toBe("0");
      });

      it("should return I for The Magician (m01)", () => {
        const card = { id: "m01", name: "The Magician", arcana: "Major" };
        expect(getCardNumberDisplay(card)).toBe("I");
      });

      it("should return X for Wheel of Fortune (m10)", () => {
        const card = { id: "m10", name: "Wheel of Fortune", arcana: "Major" };
        expect(getCardNumberDisplay(card)).toBe("X");
      });

      it("should return XXI for The World (m21)", () => {
        const card = { id: "m21", name: "The World", arcana: "Major" };
        expect(getCardNumberDisplay(card)).toBe("XXI");
      });
    });

    describe("Minor Arcana", () => {
      it("should return I for Ace cards", () => {
        const card = { id: "wands-01", name: "Ace of Wands", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("I");
      });

      it("should return II for Two cards", () => {
        const card = { id: "cups-02", name: "Two of Cups", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("II");
      });

      it("should return III for Three cards", () => {
        const card = { id: "swords-03", name: "Three of Swords", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("III");
      });

      it("should return IV for Four cards", () => {
        const card = { id: "pent-04", name: "Four of Pentacles", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("IV");
      });

      it("should return V for Five cards", () => {
        const card = { id: "wands-05", name: "Five of Wands", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("V");
      });

      it("should return VI for Six cards", () => {
        const card = { id: "cups-06", name: "Six of Cups", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("VI");
      });

      it("should return VII for Seven cards", () => {
        const card = { id: "swords-07", name: "Seven of Swords", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("VII");
      });

      it("should return VIII for Eight cards", () => {
        const card = { id: "pent-08", name: "Eight of Pentacles", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("VIII");
      });

      it("should return IX for Nine cards", () => {
        const card = { id: "wands-09", name: "Nine of Wands", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("IX");
      });

      it("should return X for Ten cards", () => {
        const card = { id: "cups-10", name: "Ten of Cups", arcana: "Minor" };
        expect(getCardNumberDisplay(card)).toBe("X");
      });

      it("should return empty string for court cards", () => {
        expect(getCardNumberDisplay({ id: "wands-page", name: "Page of Wands", arcana: "Minor" })).toBe("");
        expect(getCardNumberDisplay({ id: "cups-knight", name: "Knight of Cups", arcana: "Minor" })).toBe("");
        expect(getCardNumberDisplay({ id: "swords-queen", name: "Queen of Swords", arcana: "Minor" })).toBe("");
        expect(getCardNumberDisplay({ id: "pent-king", name: "King of Pentacles", arcana: "Minor" })).toBe("");
      });
    });
  });

  describe("GOLD_FOIL_FILTER", () => {
    it("should be a non-empty CSS filter string", () => {
      expect(GOLD_FOIL_FILTER).toBeDefined();
      expect(typeof GOLD_FOIL_FILTER).toBe("string");
      expect(GOLD_FOIL_FILTER.length).toBeGreaterThan(0);
    });

    it("should contain grayscale filter", () => {
      expect(GOLD_FOIL_FILTER).toContain("grayscale");
    });

    it("should contain contrast filter", () => {
      expect(GOLD_FOIL_FILTER).toContain("contrast");
    });

    it("should contain sepia filter", () => {
      expect(GOLD_FOIL_FILTER).toContain("sepia");
    });

    it("should contain hue-rotate filter", () => {
      expect(GOLD_FOIL_FILTER).toContain("hue-rotate");
    });
  });
});
