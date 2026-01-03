import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLocationSearch } from "@/hooks/useLocationSearch";

// Mock the LocationSearchService
const mockSearchLocations = vi.fn();

vi.mock("@/services/LocationSearchService", () => ({
  searchLocations: (...args: unknown[]) => mockSearchLocations(...args),
}));

describe("useLocationSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSearchLocations.mockResolvedValue([
      {
        id: "1",
        name: "New York",
        country: "United States",
        latitude: 40.7128,
        longitude: -74.006,
      },
      {
        id: "2",
        name: "New Orleans",
        country: "United States",
        latitude: 29.9511,
        longitude: -90.0715,
      },
    ]);
  });

  describe("initial state", () => {
    it("should return initial state", () => {
      const { result } = renderHook(() => useLocationSearch());

      expect(result.current.query).toBe("");
      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should have setQuery and clearResults functions", () => {
      const { result } = renderHook(() => useLocationSearch());

      expect(typeof result.current.setQuery).toBe("function");
      expect(typeof result.current.clearResults).toBe("function");
    });
  });

  describe("setQuery", () => {
    it("should update query", () => {
      const { result } = renderHook(() => useLocationSearch());

      act(() => {
        result.current.setQuery("New York");
      });

      expect(result.current.query).toBe("New York");
    });

    it("should set isLoading true when query meets minimum length", () => {
      const { result } = renderHook(() => useLocationSearch({ minQueryLength: 2 }));

      act(() => {
        result.current.setQuery("New");
      });

      expect(result.current.isLoading).toBe(true);
    });

    it("should not set isLoading for short queries", () => {
      const { result } = renderHook(() => useLocationSearch({ minQueryLength: 3 }));

      act(() => {
        result.current.setQuery("ab");
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("search results", () => {
    it("should return search results after debounce", async () => {
      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      }, { timeout: 500 });

      expect(result.current.results[0].name).toBe("New York");
      expect(result.current.results[1].name).toBe("New Orleans");
    });

    it("should set loading state during search", async () => {
      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      // Should be loading after setting query
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 500 });
    });

    it("should call searchLocations with query", async () => {
      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      await waitFor(() => {
        expect(mockSearchLocations).toHaveBeenCalledWith("New");
      }, { timeout: 500 });
    });
  });

  describe("error handling", () => {
    it("should handle search error", async () => {
      mockSearchLocations.mockRejectedValue(new Error("Search failed"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to search locations");
      }, { timeout: 500 });

      consoleSpy.mockRestore();
    });

    it("should ignore AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      mockSearchLocations.mockRejectedValue(abortError);

      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 500 });

      // Should not set error for abort
      expect(result.current.error).toBeNull();
    });
  });

  describe("clearResults", () => {
    it("should clear results and query", async () => {
      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 2 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      await waitFor(() => {
        expect(result.current.results.length).toBeGreaterThan(0);
      }, { timeout: 500 });

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.query).toBe("");
      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("min query length", () => {
    it("should clear results when query is below min length", () => {
      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 3 })
      );

      act(() => {
        result.current.setQuery("ab");
      });

      expect(result.current.results).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it("should search when query meets min length", async () => {
      const { result } = renderHook(() =>
        useLocationSearch({ debounceMs: 50, minQueryLength: 3 })
      );

      act(() => {
        result.current.setQuery("New");
      });

      await waitFor(() => {
        expect(mockSearchLocations).toHaveBeenCalled();
      }, { timeout: 500 });
    });
  });
});
