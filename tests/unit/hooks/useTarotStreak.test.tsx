import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTarotStreak } from "@/hooks/useTarotStreak";
import React from "react";

// Mock Supabase
const mockRpc = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// Mock UserContext - use unique IDs to avoid cache conflicts
let testUserId = "test-user-123";
const mockSession = vi.fn(() => ({
  user: { id: testUserId },
}));

vi.mock("@/context/UserContext", () => ({
  useUser: () => ({
    session: mockSession(),
  }),
}));

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
}

// Generate unique user ID for each test to bypass cache
let testCounter = 0;
function getUniqueUserId() {
  testCounter++;
  return `test-user-${Date.now()}-${testCounter}`;
}

describe("useTarotStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use a unique user ID for each test to avoid cache interference
    testUserId = getUniqueUserId();

    // Default mock for get_tarot_stats
    mockRpc.mockImplementation((fnName: string) => {
      if (fnName === "get_tarot_stats") {
        return Promise.resolve({
          data: {
            current_streak: 5,
            longest_streak: 10,
            total_readings: 50,
            last_reading_date: "2024-01-15",
            recent_cards: [
              { name: "The Fool", number: 0 },
              { name: "The Magician", number: 1 },
            ],
          },
          error: null,
        });
      }
      if (fnName === "record_tarot_reading") {
        return Promise.resolve({
          data: {
            reading_id: "new-reading-123",
            current_streak: 6,
            longest_streak: 10,
            total_readings: 51,
            is_new_streak: false,
          },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    mockSession.mockReturnValue({ user: { id: testUserId } });
  });

  describe("initial state", () => {
    it("should start with loading true", () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
    });

    it("should return null stats initially", () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      expect(result.current.stats).toBeNull();
    });
  });

  describe("fetching stats", () => {
    it("should fetch stats for logged in user", async () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBeTruthy();
      expect(result.current.stats?.currentStreak).toBe(5);
      expect(result.current.stats?.longestStreak).toBe(10);
      expect(result.current.stats?.totalReadings).toBe(50);
      expect(result.current.stats?.lastReadingDate).toBe("2024-01-15");
      expect(result.current.stats?.recentCards).toHaveLength(2);
    });

    it("should not fetch when user is not logged in", async () => {
      mockSession.mockReturnValue(null);

      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBeNull();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("should handle fetch error and return defaults", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.stats?.currentStreak).toBe(0);
      expect(result.current.stats?.totalReadings).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe("recordReading", () => {
    it("should record a daily reading", async () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let recordResult: Awaited<ReturnType<typeof result.current.recordReading>>;
      await act(async () => {
        recordResult = await result.current.recordReading("daily", [
          { name: "The Sun", number: 19, isReversed: false },
        ]);
      });

      expect(recordResult!).toBeTruthy();
      expect(recordResult!.readingId).toBe("new-reading-123");
      expect(recordResult!.currentStreak).toBe(6);
      expect(recordResult!.totalReadings).toBe(51);
    });

    it("should record a three card reading with options", async () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.recordReading(
          "three_card",
          [
            { name: "The Moon", number: 18, isReversed: false },
            { name: "The Star", number: 17, isReversed: true },
            { name: "The Tower", number: 16, isReversed: false },
          ],
          {
            question: "What does the future hold?",
            interpretation: "A time of change...",
            coreMessage: "Trust the process",
            actionAdvice: "Stay grounded",
          }
        );
      });

      expect(mockRpc).toHaveBeenCalledWith("record_tarot_reading", expect.objectContaining({
        p_reading_type: "three_card",
        p_question: "What does the future hold?",
        p_interpretation: "A time of change...",
      }));
    });

    it("should update local stats after recording", async () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats?.currentStreak).toBe(5);

      await act(async () => {
        await result.current.recordReading("daily", [
          { name: "The Sun", number: 19, isReversed: false },
        ]);
      });

      expect(result.current.stats?.currentStreak).toBe(6);
      expect(result.current.stats?.totalReadings).toBe(51);
    });

    it("should return null when user is not logged in", async () => {
      mockSession.mockReturnValue(null);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let recordResult: Awaited<ReturnType<typeof result.current.recordReading>>;
      await act(async () => {
        recordResult = await result.current.recordReading("daily", [
          { name: "The Sun", number: 19, isReversed: false },
        ]);
      });

      expect(recordResult!).toBeNull();
      consoleSpy.mockRestore();
    });

    it("should handle record error", async () => {
      mockRpc.mockImplementation((fnName: string) => {
        if (fnName === "get_tarot_stats") {
          return Promise.resolve({
            data: { current_streak: 5, longest_streak: 10, total_readings: 50 },
            error: null,
          });
        }
        if (fnName === "record_tarot_reading") {
          return Promise.resolve({
            data: null,
            error: { message: "Record failed" },
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let recordResult: Awaited<ReturnType<typeof result.current.recordReading>>;
      await act(async () => {
        recordResult = await result.current.recordReading("daily", []);
      });

      expect(recordResult!).toBeNull();
      expect(result.current.error).toBeTruthy();

      consoleSpy.mockRestore();
    });
  });

  describe("refetch", () => {
    it("should be callable without error", async () => {
      const { result } = renderHook(() => useTarotStreak(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Refetch should be callable and not throw
      await act(async () => {
        await expect(result.current.refetch()).resolves.not.toThrow();
      });

      // Stats should still be available
      expect(result.current.stats).toBeTruthy();
    });
  });
});
