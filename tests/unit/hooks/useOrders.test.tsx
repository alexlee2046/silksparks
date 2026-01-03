import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useOrders, invalidateOrdersCache } from "@/hooks/useOrders";
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

describe("useOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateOrdersCache();
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
          id: "order-1",
          created_at: "2024-01-15T10:00:00Z",
          total: 99.99,
          status: "completed",
          order_items: [
            {
              name: "Crystal Ball",
              price: 49.99,
              type: "physical",
              image_url: "https://example.com/crystal.jpg",
            },
            {
              name: "Tarot Deck",
              price: 50.00,
              type: "physical",
              image_url: "https://example.com/tarot.jpg",
            },
          ],
        },
        {
          id: "order-2",
          created_at: "2024-01-10T10:00:00Z",
          total: 25.00,
          status: "pending",
          order_items: [
            {
              name: "Birth Chart Reading",
              price: 25.00,
              type: "digital",
              image_url: null,
            },
          ],
        },
      ],
      error: null,
    });

    mockSession.mockReturnValue({ user: { id: "test-user-123" } });
  });

  describe("initial state", () => {
    it("should start with loading true", () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
    });

    it("should return empty orders initially", () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      expect(result.current.orders).toEqual([]);
    });
  });

  describe("fetching orders", () => {
    it("should fetch orders for logged in user", async () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toHaveLength(2);
      expect(result.current.orders[0].status).toBe("completed");
      expect(result.current.orders[1].status).toBe("pending");
    });

    it("should map order data correctly", async () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const order = result.current.orders[0];
      expect(order.id).toBe("order-1");
      expect(order.id_db).toBe("order-1");
      expect(order.total).toBe(99.99);
      expect(order.date).toBeInstanceOf(Date);
      expect(order.items).toHaveLength(2);
    });

    it("should map order items correctly", async () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const item = result.current.orders[0].items[0];
      expect(item.name).toBe("Crystal Ball");
      expect(item.price).toBe(49.99);
      expect(item.type).toBe("physical");
      expect(item.image).toBe("https://example.com/crystal.jpg");
      expect(item.status).toBe("completed"); // Status comes from order
    });

    it("should not fetch when user is not logged in", async () => {
      mockSession.mockReturnValue(null);

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual([]);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("should handle fetch error", async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useOrders(), {
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

    it("should handle empty orders", async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should handle orders with no items", async () => {
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "order-empty",
            created_at: "2024-01-15T10:00:00Z",
            total: 0,
            status: "cancelled",
            order_items: null,
          },
        ],
        error: null,
      });

      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toHaveLength(1);
      expect(result.current.orders[0].items).toEqual([]);
    });
  });

  describe("refetch", () => {
    it("should refetch orders", async () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update mock to return different data
      mockOrder.mockResolvedValue({
        data: [
          {
            id: "order-new",
            created_at: "2024-01-20T10:00:00Z",
            total: 150.00,
            status: "shipped",
            order_items: [
              {
                name: "New Item",
                price: 150.00,
                type: "physical",
                image_url: null,
              },
            ],
          },
        ],
        error: null,
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.orders).toHaveLength(1);
      expect(result.current.orders[0].status).toBe("shipped");
      expect(result.current.orders[0].total).toBe(150.00);
    });
  });

  describe("caching", () => {
    it("should use cache for same user within TTL", async () => {
      const { result: result1 } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.loading).toBe(false);
      });

      // Clear mock call count
      mockSelect.mockClear();

      // Second hook should use cache
      const { result: result2 } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.loading).toBe(false);
      });

      expect(mockSelect).not.toHaveBeenCalled();
      expect(result2.current.orders).toHaveLength(2);
    });
  });

  describe("invalidateOrdersCache", () => {
    it("should invalidate cache and force refetch", async () => {
      const { result } = renderHook(() => useOrders(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockSelect.mockClear();
      invalidateOrdersCache();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockSelect).toHaveBeenCalled();
    });
  });
});
