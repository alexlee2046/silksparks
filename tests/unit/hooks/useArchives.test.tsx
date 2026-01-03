import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useArchives, invalidateArchivesCache } from "@/hooks/useArchives";
import React from "react";

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
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

describe("useArchives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateArchivesCache();
    testUserId = getUniqueUserId();

    // Default mock setup
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockResolvedValue({
      data: [
        {
          id: "1",
          type: "tarot",
          created_at: "2024-01-15T10:00:00Z",
          title: "Daily Reading",
          summary: "A good day ahead",
          content: { cards: [] },
          image_url: "https://example.com/image1.jpg",
        },
        {
          id: "2",
          type: "birth_chart",
          created_at: "2024-01-10T10:00:00Z",
          title: "Birth Chart Analysis",
          summary: "Your chart reveals...",
          content: { planets: [] },
          image_url: null,
        },
      ],
      error: null,
    });

    mockSession.mockReturnValue({ user: { id: "test-user-123" } });
  });

  describe("initial state", () => {
    it("should start with loading true", () => {
      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
    });

    it("should return empty archives initially", () => {
      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      expect(result.current.archives).toEqual([]);
    });
  });

  describe("fetching archives", () => {
    it("should fetch archives for logged in user", async () => {
      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.archives).toHaveLength(2);
      expect(result.current.archives[0].type).toBe("tarot");
      expect(result.current.archives[0].title).toBe("Daily Reading");
      expect(result.current.archives[1].type).toBe("birth_chart");
    });

    it("should map archive data correctly", async () => {
      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const archive = result.current.archives[0];
      expect(archive.id).toBe("1");
      expect(archive.id_db).toBe("1");
      expect(archive.title).toBe("Daily Reading");
      expect(archive.summary).toBe("A good day ahead");
      expect(archive.image).toBe("https://example.com/image1.jpg");
      expect(archive.date).toBeInstanceOf(Date);
    });

    it("should not fetch when user is not logged in", async () => {
      mockSession.mockReturnValue(null);

      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.archives).toEqual([]);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      // The hook wraps errors in a generic message
      expect(result.current.error?.message).toContain("fetch");

      consoleSpy.mockRestore();
    });

    it("should handle empty archives", async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.archives).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("refetch", () => {
    it("should refetch archives", async () => {
      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update mock to return different data
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "3",
            type: "tarot",
            created_at: "2024-01-20T10:00:00Z",
            title: "New Reading",
            summary: "Fresh insights",
            content: {},
            image_url: null,
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.archives).toHaveLength(1);
      expect(result.current.archives[0].title).toBe("New Reading");
    });
  });

  describe("caching", () => {
    it("should use cache for same user within TTL", async () => {
      const { result: result1 } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      // Clear mock call count
      mockSelect.mockClear();

      // Second hook should use cache
      const { result: result2 } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      expect(mockSelect).not.toHaveBeenCalled();
      expect(result2.current.archives).toHaveLength(2);
    });
  });

  describe("invalidateArchivesCache", () => {
    it("should invalidate cache and force refetch", async () => {
      const { result } = renderHook(() => useArchives(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockSelect.mockClear();
      invalidateArchivesCache();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockSelect).toHaveBeenCalled();
    });
  });
});
