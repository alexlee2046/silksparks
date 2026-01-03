import { describe, it, expect } from "vitest";
import { AstrologyEngine } from "@/services/AstrologyEngine";
import type { FiveElementsDistribution } from "@/services/AstrologyEngine";

describe("AstrologyEngine", () => {
  describe("getZodiacSign", () => {
    it("should return Aries for longitude 0-29", () => {
      expect(AstrologyEngine.getZodiacSign(0)).toBe("Aries");
      expect(AstrologyEngine.getZodiacSign(15)).toBe("Aries");
      expect(AstrologyEngine.getZodiacSign(29)).toBe("Aries");
    });

    it("should return Taurus for longitude 30-59", () => {
      expect(AstrologyEngine.getZodiacSign(30)).toBe("Taurus");
      expect(AstrologyEngine.getZodiacSign(45)).toBe("Taurus");
      expect(AstrologyEngine.getZodiacSign(59)).toBe("Taurus");
    });

    it("should return Gemini for longitude 60-89", () => {
      expect(AstrologyEngine.getZodiacSign(60)).toBe("Gemini");
      expect(AstrologyEngine.getZodiacSign(75)).toBe("Gemini");
    });

    it("should return Cancer for longitude 90-119", () => {
      expect(AstrologyEngine.getZodiacSign(90)).toBe("Cancer");
    });

    it("should return Leo for longitude 120-149", () => {
      expect(AstrologyEngine.getZodiacSign(120)).toBe("Leo");
    });

    it("should return Virgo for longitude 150-179", () => {
      expect(AstrologyEngine.getZodiacSign(150)).toBe("Virgo");
    });

    it("should return Libra for longitude 180-209", () => {
      expect(AstrologyEngine.getZodiacSign(180)).toBe("Libra");
    });

    it("should return Scorpio for longitude 210-239", () => {
      expect(AstrologyEngine.getZodiacSign(210)).toBe("Scorpio");
    });

    it("should return Sagittarius for longitude 240-269", () => {
      expect(AstrologyEngine.getZodiacSign(240)).toBe("Sagittarius");
    });

    it("should return Capricorn for longitude 270-299", () => {
      expect(AstrologyEngine.getZodiacSign(270)).toBe("Capricorn");
    });

    it("should return Aquarius for longitude 300-329", () => {
      expect(AstrologyEngine.getZodiacSign(300)).toBe("Aquarius");
    });

    it("should return Pisces for longitude 330-359", () => {
      expect(AstrologyEngine.getZodiacSign(330)).toBe("Pisces");
      expect(AstrologyEngine.getZodiacSign(359)).toBe("Pisces");
    });

    it("should handle negative longitudes", () => {
      expect(AstrologyEngine.getZodiacSign(-30)).toBe("Pisces"); // -30 = 330
      expect(AstrologyEngine.getZodiacSign(-90)).toBe("Capricorn"); // -90 = 270
    });

    it("should handle longitudes over 360", () => {
      expect(AstrologyEngine.getZodiacSign(390)).toBe("Taurus"); // 390 = 30
      expect(AstrologyEngine.getZodiacSign(720)).toBe("Aries"); // 720 = 0
    });
  });

  describe("calculatePlanetaryPositions", () => {
    it("should return positions for all 7 planets", () => {
      const date = new Date("2024-01-15T12:00:00Z");
      const positions = AstrologyEngine.calculatePlanetaryPositions(date, 40.7128, -74.006);

      expect(positions).toHaveProperty("Sun");
      expect(positions).toHaveProperty("Moon");
      expect(positions).toHaveProperty("Mercury");
      expect(positions).toHaveProperty("Venus");
      expect(positions).toHaveProperty("Mars");
      expect(positions).toHaveProperty("Jupiter");
      expect(positions).toHaveProperty("Saturn");
    });

    it("should return valid zodiac signs for each planet", () => {
      const date = new Date("2024-06-21T12:00:00Z");
      const positions = AstrologyEngine.calculatePlanetaryPositions(date, 51.5074, -0.1278);

      const validSigns = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
      ];

      Object.values(positions).forEach((sign) => {
        expect(validSigns).toContain(sign);
      });
    });

    it("should calculate different positions for different dates", () => {
      const date1 = new Date("2024-01-15T12:00:00Z");
      const date2 = new Date("2024-07-15T12:00:00Z");

      const positions1 = AstrologyEngine.calculatePlanetaryPositions(date1, 0, 0);
      const positions2 = AstrologyEngine.calculatePlanetaryPositions(date2, 0, 0);

      // Sun position should differ by ~6 months worth of zodiac movement
      expect(positions1.Sun).not.toBe(positions2.Sun);
    });

    it("should work with negative coordinates", () => {
      const date = new Date("2024-03-20T12:00:00Z");
      const positions = AstrologyEngine.calculatePlanetaryPositions(date, -33.8688, 151.2093);

      expect(positions).toHaveProperty("Sun");
      expect(typeof positions.Sun).toBe("string");
    });
  });

  describe("calculateFiveElements", () => {
    it("should return all five elements", () => {
      const date = new Date("2024-06-15T12:00:00");
      const elements = AstrologyEngine.calculateFiveElements(date);

      expect(elements).toHaveProperty("Wood");
      expect(elements).toHaveProperty("Fire");
      expect(elements).toHaveProperty("Earth");
      expect(elements).toHaveProperty("Metal");
      expect(elements).toHaveProperty("Water");
    });

    it("should return numbers for each element", () => {
      const elements = AstrologyEngine.calculateFiveElements(new Date());

      expect(typeof elements.Wood).toBe("number");
      expect(typeof elements.Fire).toBe("number");
      expect(typeof elements.Earth).toBe("number");
      expect(typeof elements.Metal).toBe("number");
      expect(typeof elements.Water).toBe("number");
    });

    it("should have Wood strong in Spring (Feb-Apr)", () => {
      const springDate = new Date("2024-03-15T12:00:00");
      const elements = AstrologyEngine.calculateFiveElements(springDate);

      expect(elements.Wood).toBeGreaterThan(20);
    });

    it("should have Fire strong in Summer (May-Jul)", () => {
      const summerDate = new Date("2024-06-15T12:00:00");
      const elements = AstrologyEngine.calculateFiveElements(summerDate);

      expect(elements.Fire).toBeGreaterThan(20);
    });

    it("should have Metal strong in Autumn (Aug-Oct)", () => {
      const autumnDate = new Date("2024-09-15T12:00:00");
      const elements = AstrologyEngine.calculateFiveElements(autumnDate);

      expect(elements.Metal).toBeGreaterThan(20);
    });

    it("should have Water strong in Winter (Nov-Jan)", () => {
      const winterDate = new Date("2024-12-15T12:00:00");
      const elements = AstrologyEngine.calculateFiveElements(winterDate);

      expect(elements.Water).toBeGreaterThan(20);
    });

    it("should modify elements based on time of day - morning Wood boost", () => {
      const morning = new Date("2024-06-15T05:00:00");
      const elements = AstrologyEngine.calculateFiveElements(morning);

      // Morning (3-7) should boost Wood
      expect(elements.Wood).toBeGreaterThanOrEqual(10);
    });

    it("should modify elements based on time of day - midday Fire boost", () => {
      const midday = new Date("2024-03-15T11:00:00");
      const elements = AstrologyEngine.calculateFiveElements(midday);

      // Midday (9-13) should boost Fire
      expect(elements.Fire).toBeGreaterThanOrEqual(10);
    });

    it("should modify elements based on time of day - afternoon Metal boost", () => {
      const afternoon = new Date("2024-03-15T17:00:00");
      const elements = AstrologyEngine.calculateFiveElements(afternoon);

      // Afternoon (15-19) should boost Metal
      expect(elements.Metal).toBeGreaterThanOrEqual(10);
    });

    it("should modify elements based on time of day - night Water boost", () => {
      const night = new Date("2024-03-15T22:00:00");
      const elements = AstrologyEngine.calculateFiveElements(night);

      // Night (21-1) should boost Water
      expect(elements.Water).toBeGreaterThanOrEqual(20);
    });

    it("should have elements roughly sum to 100%", () => {
      const elements = AstrologyEngine.calculateFiveElements(new Date("2024-05-15T10:00:00"));
      const total = elements.Wood + elements.Fire + elements.Earth + elements.Metal + elements.Water;

      // Due to rounding, allow small variance
      expect(total).toBeGreaterThanOrEqual(98);
      expect(total).toBeLessThanOrEqual(102);
    });

    it("should produce consistent results for same input", () => {
      const date = new Date("2024-08-20T14:30:00");
      const elements1 = AstrologyEngine.calculateFiveElements(date);
      const elements2 = AstrologyEngine.calculateFiveElements(date);

      expect(elements1).toEqual(elements2);
    });

    it("should handle edge case - January month (winter)", () => {
      const januaryDate = new Date("2024-01-15T12:00:00");
      const elements = AstrologyEngine.calculateFiveElements(januaryDate);

      // January should be Winter = Water strong
      expect(elements.Water).toBeGreaterThan(20);
    });

    it("should handle midnight hour", () => {
      const midnight = new Date("2024-06-15T00:00:00");
      const elements = AstrologyEngine.calculateFiveElements(midnight);

      // Midnight is in Water hour (21-1)
      expect(elements.Water).toBeGreaterThanOrEqual(20);
    });
  });
});
