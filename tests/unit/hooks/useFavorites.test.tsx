import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFavorites, invalidateFavoritesCache } from "@/hooks/useFavorites";
import React from "react";

// Mock Supabase
const mockSelect = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
    })),
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

describe("useFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateFavoritesCache();
    testUserId = getUniqueUserId();

    // Default mock setup for fetch
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockResolvedValue({
      data: [
        { id: "1", product_id: 101, created_at: "2024-01-01T00:00:00Z" },
        { id: "2", product_id: 102, created_at: "2024-01-02T00:00:00Z" },
      ],
      error: null,
    });

    // Default mock for session
    mockSession.mockReturnValue({ user: { id: "test-user-123" } });
  });

  describe("initial state", () => {
    it("should start with loading true", () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
    });

    it("should return empty favorites initially", () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      expect(result.current.favorites).toEqual([]);
    });
  });

  describe("fetching favorites", () => {
    it("should fetch favorites for logged in user", async () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.favorites).toHaveLength(2);
      expect(result.current.favorites[0].product_id).toBe(101);
      expect(result.current.favorites[1].product_id).toBe(102);
    });

    it("should not fetch when user is not logged in", async () => {
      mockSession.mockReturnValue(null);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.favorites).toEqual([]);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockEq.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      consoleSpy.mockRestore();
    });
  });

  describe("isFavorite", () => {
    it("should return true for favorited products", async () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isFavorite(101)).toBe(true);
      expect(result.current.isFavorite(102)).toBe(true);
    });

    it("should return false for non-favorited products", async () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isFavorite(999)).toBe(false);
    });
  });

  describe("toggleFavorite - remove", () => {
    it("should remove favorite optimistically", async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.favorites).toHaveLength(2);

      await act(async () => {
        await result.current.toggleFavorite(101);
      });

      expect(result.current.favorites).toHaveLength(1);
      expect(result.current.isFavorite(101)).toBe(false);
    });

    it("should rollback on delete error", async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavorite(101);
      });

      // Should rollback
      expect(result.current.isFavorite(101)).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("toggleFavorite - add", () => {
    it("should add favorite optimistically", async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "3", product_id: 999, created_at: "2024-01-03T00:00:00Z" },
            error: null,
          }),
        }),
      });

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isFavorite(999)).toBe(false);

      await act(async () => {
        await result.current.toggleFavorite(999);
      });

      expect(result.current.isFavorite(999)).toBe(true);
    });

    it("should rollback on insert error", async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Insert failed" },
          }),
        }),
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavorite(999);
      });

      // Should rollback
      expect(result.current.isFavorite(999)).toBe(false);
      consoleSpy.mockRestore();
    });

    it("should not toggle when user is not logged in", async () => {
      mockSession.mockReturnValue(null);

      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.toggleFavorite(999);
      });

      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("refetch", () => {
    it("should refetch favorites", async () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update mock to return different data
      mockEq.mockResolvedValue({
        data: [
          { id: "1", product_id: 101, created_at: "2024-01-01T00:00:00Z" },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.favorites).toHaveLength(1);
    });
  });

  describe("caching", () => {
    it("should use cache for same user within TTL", async () => {
      const { result: result1 } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      // Clear mock call count
      mockSelect.mockClear();

      // Second hook should use cache
      const { result: result2 } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe("invalidateFavoritesCache", () => {
    it("should invalidate cache and allow refetch", async () => {
      const { result } = renderHook(() => useFavorites(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockSelect.mockClear();
      invalidateFavoritesCache();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockSelect).toHaveBeenCalled();
    });
  });
});
