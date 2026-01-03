import { describe, it, expect } from "vitest";
import {
  ZODIAC_SIGNS,
  getZodiacFromDate,
  getZodiacFromLongitude,
  getElementFromZodiac,
  getElementFromDate,
  isValidZodiacSign,
} from "@/lib/ZodiacUtils";

describe("ZodiacUtils", () => {
  describe("ZODIAC_SIGNS constant", () => {
    it("should have 12 signs", () => {
      expect(ZODIAC_SIGNS).toHaveLength(12);
    });

    it("should contain all zodiac signs in order", () => {
      expect(ZODIAC_SIGNS[0]).toBe("Aries");
      expect(ZODIAC_SIGNS[1]).toBe("Taurus");
      expect(ZODIAC_SIGNS[2]).toBe("Gemini");
      expect(ZODIAC_SIGNS[3]).toBe("Cancer");
      expect(ZODIAC_SIGNS[4]).toBe("Leo");
      expect(ZODIAC_SIGNS[5]).toBe("Virgo");
      expect(ZODIAC_SIGNS[6]).toBe("Libra");
      expect(ZODIAC_SIGNS[7]).toBe("Scorpio");
      expect(ZODIAC_SIGNS[8]).toBe("Sagittarius");
      expect(ZODIAC_SIGNS[9]).toBe("Capricorn");
      expect(ZODIAC_SIGNS[10]).toBe("Aquarius");
      expect(ZODIAC_SIGNS[11]).toBe("Pisces");
    });
  });

  describe("getZodiacFromDate", () => {
    it("should return Aries for March 21 - April 19", () => {
      expect(getZodiacFromDate(new Date("2024-03-21"))).toBe("Aries");
      expect(getZodiacFromDate(new Date("2024-04-10"))).toBe("Aries");
      expect(getZodiacFromDate(new Date("2024-04-19"))).toBe("Aries");
    });

    it("should return Taurus for April 20 - May 20", () => {
      expect(getZodiacFromDate(new Date("2024-04-20"))).toBe("Taurus");
      expect(getZodiacFromDate(new Date("2024-05-10"))).toBe("Taurus");
      expect(getZodiacFromDate(new Date("2024-05-20"))).toBe("Taurus");
    });

    it("should return Gemini for May 21 - June 20", () => {
      expect(getZodiacFromDate(new Date("2024-05-21"))).toBe("Gemini");
      expect(getZodiacFromDate(new Date("2024-06-10"))).toBe("Gemini");
      expect(getZodiacFromDate(new Date("2024-06-20"))).toBe("Gemini");
    });

    it("should return Cancer for June 21 - July 22", () => {
      expect(getZodiacFromDate(new Date("2024-06-21"))).toBe("Cancer");
      expect(getZodiacFromDate(new Date("2024-07-15"))).toBe("Cancer");
      expect(getZodiacFromDate(new Date("2024-07-22"))).toBe("Cancer");
    });

    it("should return Leo for July 23 - August 22", () => {
      expect(getZodiacFromDate(new Date("2024-07-23"))).toBe("Leo");
      expect(getZodiacFromDate(new Date("2024-08-15"))).toBe("Leo");
      expect(getZodiacFromDate(new Date("2024-08-22"))).toBe("Leo");
    });

    it("should return Virgo for August 23 - September 22", () => {
      expect(getZodiacFromDate(new Date("2024-08-23"))).toBe("Virgo");
      expect(getZodiacFromDate(new Date("2024-09-15"))).toBe("Virgo");
      expect(getZodiacFromDate(new Date("2024-09-22"))).toBe("Virgo");
    });

    it("should return Libra for September 23 - October 22", () => {
      expect(getZodiacFromDate(new Date("2024-09-23"))).toBe("Libra");
      expect(getZodiacFromDate(new Date("2024-10-15"))).toBe("Libra");
      expect(getZodiacFromDate(new Date("2024-10-22"))).toBe("Libra");
    });

    it("should return Scorpio for October 23 - November 21", () => {
      expect(getZodiacFromDate(new Date("2024-10-23"))).toBe("Scorpio");
      expect(getZodiacFromDate(new Date("2024-11-10"))).toBe("Scorpio");
      expect(getZodiacFromDate(new Date("2024-11-21"))).toBe("Scorpio");
    });

    it("should return Sagittarius for November 22 - December 21", () => {
      expect(getZodiacFromDate(new Date("2024-11-22"))).toBe("Sagittarius");
      expect(getZodiacFromDate(new Date("2024-12-10"))).toBe("Sagittarius");
      expect(getZodiacFromDate(new Date("2024-12-21"))).toBe("Sagittarius");
    });

    it("should return Capricorn for December 22 - January 19", () => {
      expect(getZodiacFromDate(new Date("2024-12-22"))).toBe("Capricorn");
      expect(getZodiacFromDate(new Date("2025-01-10"))).toBe("Capricorn");
      expect(getZodiacFromDate(new Date("2025-01-19"))).toBe("Capricorn");
    });

    it("should return Aquarius for January 20 - February 18", () => {
      expect(getZodiacFromDate(new Date("2024-01-20"))).toBe("Aquarius");
      expect(getZodiacFromDate(new Date("2024-02-10"))).toBe("Aquarius");
      expect(getZodiacFromDate(new Date("2024-02-18"))).toBe("Aquarius");
    });

    it("should return Pisces for February 19 - March 20", () => {
      expect(getZodiacFromDate(new Date("2024-02-19"))).toBe("Pisces");
      expect(getZodiacFromDate(new Date("2024-03-10"))).toBe("Pisces");
      expect(getZodiacFromDate(new Date("2024-03-20"))).toBe("Pisces");
    });

    it("should handle leap year February", () => {
      // 2024 is a leap year with Feb 29
      expect(getZodiacFromDate(new Date("2024-02-29"))).toBe("Pisces");
    });
  });

  describe("getZodiacFromLongitude", () => {
    it("should return Aries for 0-29 degrees", () => {
      expect(getZodiacFromLongitude(0)).toBe("Aries");
      expect(getZodiacFromLongitude(15)).toBe("Aries");
      expect(getZodiacFromLongitude(29.9)).toBe("Aries");
    });

    it("should return correct sign for each 30-degree segment", () => {
      expect(getZodiacFromLongitude(30)).toBe("Taurus");
      expect(getZodiacFromLongitude(60)).toBe("Gemini");
      expect(getZodiacFromLongitude(90)).toBe("Cancer");
      expect(getZodiacFromLongitude(120)).toBe("Leo");
      expect(getZodiacFromLongitude(150)).toBe("Virgo");
      expect(getZodiacFromLongitude(180)).toBe("Libra");
      expect(getZodiacFromLongitude(210)).toBe("Scorpio");
      expect(getZodiacFromLongitude(240)).toBe("Sagittarius");
      expect(getZodiacFromLongitude(270)).toBe("Capricorn");
      expect(getZodiacFromLongitude(300)).toBe("Aquarius");
      expect(getZodiacFromLongitude(330)).toBe("Pisces");
    });

    it("should normalize negative longitudes", () => {
      expect(getZodiacFromLongitude(-30)).toBe("Pisces"); // -30 + 360 = 330
      expect(getZodiacFromLongitude(-60)).toBe("Aquarius"); // -60 + 360 = 300
    });

    it("should normalize longitudes over 360", () => {
      expect(getZodiacFromLongitude(360)).toBe("Aries");
      expect(getZodiacFromLongitude(390)).toBe("Taurus"); // 390 - 360 = 30
      expect(getZodiacFromLongitude(720)).toBe("Aries"); // 720 - 720 = 0
    });
  });

  describe("getElementFromZodiac", () => {
    it("should return fire for fire signs", () => {
      expect(getElementFromZodiac("Aries")).toBe("fire");
      expect(getElementFromZodiac("Leo")).toBe("fire");
      expect(getElementFromZodiac("Sagittarius")).toBe("fire");
    });

    it("should return earth for earth signs", () => {
      expect(getElementFromZodiac("Taurus")).toBe("earth");
      expect(getElementFromZodiac("Virgo")).toBe("earth");
      expect(getElementFromZodiac("Capricorn")).toBe("earth");
    });

    it("should return air for air signs", () => {
      expect(getElementFromZodiac("Gemini")).toBe("air");
      expect(getElementFromZodiac("Libra")).toBe("air");
      expect(getElementFromZodiac("Aquarius")).toBe("air");
    });

    it("should return water for water signs", () => {
      expect(getElementFromZodiac("Cancer")).toBe("water");
      expect(getElementFromZodiac("Scorpio")).toBe("water");
      expect(getElementFromZodiac("Pisces")).toBe("water");
    });
  });

  describe("getElementFromDate", () => {
    it("should return fire for fire sign birth dates", () => {
      expect(getElementFromDate(new Date("2024-04-01"))).toBe("fire"); // Aries
      expect(getElementFromDate(new Date("2024-08-01"))).toBe("fire"); // Leo
      expect(getElementFromDate(new Date("2024-12-01"))).toBe("fire"); // Sagittarius
    });

    it("should return earth for earth sign birth dates", () => {
      expect(getElementFromDate(new Date("2024-05-01"))).toBe("earth"); // Taurus
      expect(getElementFromDate(new Date("2024-09-01"))).toBe("earth"); // Virgo
      expect(getElementFromDate(new Date("2025-01-01"))).toBe("earth"); // Capricorn
    });

    it("should return air for air sign birth dates", () => {
      expect(getElementFromDate(new Date("2024-06-01"))).toBe("air"); // Gemini
      expect(getElementFromDate(new Date("2024-10-01"))).toBe("air"); // Libra
      expect(getElementFromDate(new Date("2024-02-01"))).toBe("air"); // Aquarius
    });

    it("should return water for water sign birth dates", () => {
      expect(getElementFromDate(new Date("2024-07-01"))).toBe("water"); // Cancer
      expect(getElementFromDate(new Date("2024-11-01"))).toBe("water"); // Scorpio
      expect(getElementFromDate(new Date("2024-03-01"))).toBe("water"); // Pisces
    });
  });

  describe("isValidZodiacSign", () => {
    it("should return true for valid signs", () => {
      expect(isValidZodiacSign("Aries")).toBe(true);
      expect(isValidZodiacSign("Taurus")).toBe(true);
      expect(isValidZodiacSign("Gemini")).toBe(true);
      expect(isValidZodiacSign("Cancer")).toBe(true);
      expect(isValidZodiacSign("Leo")).toBe(true);
      expect(isValidZodiacSign("Virgo")).toBe(true);
      expect(isValidZodiacSign("Libra")).toBe(true);
      expect(isValidZodiacSign("Scorpio")).toBe(true);
      expect(isValidZodiacSign("Sagittarius")).toBe(true);
      expect(isValidZodiacSign("Capricorn")).toBe(true);
      expect(isValidZodiacSign("Aquarius")).toBe(true);
      expect(isValidZodiacSign("Pisces")).toBe(true);
    });

    it("should return false for invalid strings", () => {
      expect(isValidZodiacSign("")).toBe(false);
      expect(isValidZodiacSign("aries")).toBe(false); // Case sensitive
      expect(isValidZodiacSign("ARIES")).toBe(false);
      expect(isValidZodiacSign("InvalidSign")).toBe(false);
      expect(isValidZodiacSign("Dragon")).toBe(false);
    });
  });
});
