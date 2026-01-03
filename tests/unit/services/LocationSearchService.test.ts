import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchLocations, DEFAULT_LOCATION } from "@/services/LocationSearchService";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LocationSearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("searchLocations", () => {
    it("should return empty array for empty query", async () => {
      const results = await searchLocations("");
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return empty array for query less than 2 characters", async () => {
      const results = await searchLocations("a");
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should return empty array for whitespace-only query", async () => {
      const results = await searchLocations("   ");
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should call Nominatim API with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await searchLocations("New York");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("nominatim.openstreetmap.org/search");
      expect(callUrl).toContain("q=New+York");
      expect(callUrl).toContain("format=json");
      expect(callUrl).toContain("addressdetails=1");
      expect(callUrl).toContain("limit=8");
    });

    it("should include correct User-Agent header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await searchLocations("Test");

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers["User-Agent"]).toBe("SilkSparks/1.0 (Astrology App)");
    });

    it("should return mapped location results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 123,
              lat: "40.7128",
              lon: "-74.006",
              display_name: "New York, New York, United States",
              address: {
                city: "New York",
                state: "New York",
                country: "United States",
              },
            },
          ]),
      });

      const results = await searchLocations("New York");

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        lat: 40.7128,
        lng: -74.006,
        country: "United States",
        city: "New York",
      });
    });

    it("should format name correctly with city and country", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 123,
              lat: "48.8566",
              lon: "2.3522",
              display_name: "Paris, Île-de-France, France",
              address: {
                city: "Paris",
                state: "Île-de-France",
                country: "France",
              },
            },
          ]),
      });

      const results = await searchLocations("Paris");

      expect(results[0].name).toBe("Paris, Île-de-France");
    });

    it("should handle town instead of city in address", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 456,
              lat: "51.5",
              lon: "-0.1",
              display_name: "Small Town, England, UK",
              address: {
                town: "Small Town",
                country: "UK",
              },
            },
          ]),
      });

      const results = await searchLocations("Small Town");

      expect(results[0].city).toBe("Small Town");
    });

    it("should handle village instead of city in address", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 789,
              lat: "35.0",
              lon: "135.0",
              display_name: "Little Village, Japan",
              address: {
                village: "Little Village",
                country: "Japan",
              },
            },
          ]),
      });

      const results = await searchLocations("Village");

      expect(results[0].city).toBe("Little Village");
    });

    it("should fallback to display_name when no address", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 111,
              lat: "0",
              lon: "0",
              display_name: "Unknown Place, Somewhere, Earth",
            },
          ]),
      });

      const results = await searchLocations("Unknown");

      expect(results[0].name).toBe("Unknown Place, Somewhere");
    });

    it("should remove duplicate parts in name", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 222,
              lat: "39.9042",
              lon: "116.4074",
              display_name: "Beijing, Beijing, China",
              address: {
                city: "Beijing",
                state: "Beijing",
                country: "China",
              },
            },
          ]),
      });

      const results = await searchLocations("Beijing");

      // Should deduplicate "Beijing, Beijing" to "Beijing"
      expect(results[0].name).toBe("Beijing, China");
    });

    it("should handle API error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const results = await searchLocations("Test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle network error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const results = await searchLocations("Test");

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should trim query before sending", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await searchLocations("  New York  ");

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("q=New+York");
      expect(callUrl).not.toContain("++");
    });

    it("should handle multiple results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              place_id: 1,
              lat: "40.7128",
              lon: "-74.006",
              display_name: "New York City, NY, USA",
              address: { city: "New York City", country: "USA" },
            },
            {
              place_id: 2,
              lat: "43.0",
              lon: "-75.5",
              display_name: "New York State, USA",
              address: { state: "New York", country: "USA" },
            },
          ]),
      });

      const results = await searchLocations("New York");

      expect(results).toHaveLength(2);
      expect(results[0].lat).toBe(40.7128);
      expect(results[1].lat).toBe(43.0);
    });
  });

  describe("DEFAULT_LOCATION", () => {
    it("should have name 'Not specified'", () => {
      expect(DEFAULT_LOCATION.name).toBe("Not specified");
    });

    it("should have displayName 'Location not provided'", () => {
      expect(DEFAULT_LOCATION.displayName).toBe("Location not provided");
    });

    it("should have coordinates at 0, 0", () => {
      expect(DEFAULT_LOCATION.lat).toBe(0);
      expect(DEFAULT_LOCATION.lng).toBe(0);
    });
  });
});
