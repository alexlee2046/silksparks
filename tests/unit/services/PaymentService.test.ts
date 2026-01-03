import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentService } from "@/services/PaymentService";

// Mock Supabase
const mockGetSession = vi.fn();
const mockInvoke = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockIn = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock Stripe
const mockRedirectToCheckout = vi.fn();
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() =>
    Promise.resolve({
      redirectToCheckout: mockRedirectToCheckout,
    })
  ),
}));

// Mock import.meta.env
const originalEnv = import.meta.env;

describe("PaymentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });

    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      in: mockIn,
      eq: mockEq,
    });
    mockIn.mockResolvedValue({
      data: [],
      error: null,
    });
    mockEq.mockReturnValue({
      single: mockSingle,
    });
    mockSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    // Reset env mock
    vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_123");
  });

  describe("createCheckoutSession", () => {
    const testItems = [
      { id: 1, name: "Crystal Ball", price: 49.99, quantity: 1 },
      { id: 2, name: "Tarot Deck", price: 29.99, quantity: 2 },
    ];

    it("should return error when user is not authenticated", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });

      const result = await PaymentService.createCheckoutSession(testItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please sign in to checkout");
    });

    it("should call edge function with correct parameters", async () => {
      mockInvoke.mockResolvedValue({
        data: { url: "https://checkout.stripe.com/123", sessionId: "sess_123" },
        error: null,
      });

      await PaymentService.createCheckoutSession(testItems, "usd");

      expect(mockInvoke).toHaveBeenCalledWith("create-checkout-session", {
        body: expect.objectContaining({
          items: testItems,
          currency: "usd",
        }),
      });
    });

    it("should return success with URL and session ID", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          url: "https://checkout.stripe.com/123",
          sessionId: "sess_123",
          orderId: "order_456",
        },
        error: null,
      });

      const result = await PaymentService.createCheckoutSession(testItems);

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://checkout.stripe.com/123");
      expect(result.sessionId).toBe("sess_123");
      expect(result.orderId).toBe("order_456");
    });

    it("should handle edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "Internal server error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await PaymentService.createCheckoutSession(testItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Internal server error");
      consoleSpy.mockRestore();
    });

    it("should handle missing URL in response", async () => {
      mockInvoke.mockResolvedValue({
        data: { sessionId: "sess_123" }, // No URL
        error: null,
      });

      const result = await PaymentService.createCheckoutSession(testItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create checkout session");
    });

    it("should handle thrown exceptions", async () => {
      mockInvoke.mockRejectedValue(new Error("Network failure"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await PaymentService.createCheckoutSession(testItems);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network failure");
      consoleSpy.mockRestore();
    });

    it("should default to USD currency", async () => {
      mockInvoke.mockResolvedValue({
        data: { url: "https://checkout.stripe.com/123" },
        error: null,
      });

      await PaymentService.createCheckoutSession(testItems);

      expect(mockInvoke).toHaveBeenCalledWith(
        "create-checkout-session",
        expect.objectContaining({
          body: expect.objectContaining({ currency: "usd" }),
        })
      );
    });
  });

  describe("redirectToCheckout", () => {
    it("should call stripe redirectToCheckout with session ID", async () => {
      mockRedirectToCheckout.mockResolvedValue({ error: null });

      await PaymentService.redirectToCheckout("sess_123");

      expect(mockRedirectToCheckout).toHaveBeenCalledWith({ sessionId: "sess_123" });
    });

    it("should throw error when redirect fails", async () => {
      mockRedirectToCheckout.mockResolvedValue({
        error: { message: "Session expired" },
      });

      await expect(PaymentService.redirectToCheckout("sess_123")).rejects.toThrow(
        "Session expired"
      );
    });
  });

  describe("isConfigured", () => {
    it("should return true when stripe key is set", () => {
      vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "pk_test_123");

      expect(PaymentService.isConfigured()).toBe(true);
    });

    it("should return false when stripe key is not set", () => {
      vi.stubEnv("VITE_STRIPE_PUBLISHABLE_KEY", "");

      expect(PaymentService.isConfigured()).toBe(false);
    });
  });

  describe("checkInventory", () => {
    const testItems = [
      { id: 1, name: "Crystal Ball", price: 49.99, quantity: 1 },
      { id: 2, name: "Tarot Deck", price: 29.99, quantity: 2 },
    ];

    it("should return available for empty product IDs", async () => {
      const items = [{ id: "string-id", name: "Service", price: 10, quantity: 1 }];

      const result = await PaymentService.checkInventory(items);

      expect(result.available).toBe(true);
      expect(result.failedItems).toEqual([]);
    });

    it("should check inventory for numeric IDs only", async () => {
      mockIn.mockResolvedValue({
        data: [
          { id: 1, name: "Crystal Ball", inventory: 10 },
          { id: 2, name: "Tarot Deck", inventory: 5 },
        ],
        error: null,
      });

      const result = await PaymentService.checkInventory(testItems);

      expect(result.available).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("products");
    });

    it("should return failed items when inventory insufficient", async () => {
      mockIn.mockResolvedValue({
        data: [
          { id: 1, name: "Crystal Ball", inventory: 0 },
          { id: 2, name: "Tarot Deck", inventory: 5 },
        ],
        error: null,
      });

      const result = await PaymentService.checkInventory(testItems);

      expect(result.available).toBe(false);
      expect(result.failedItems).toContain("Crystal Ball (only 0 available)");
    });

    it("should return failed items when product not found", async () => {
      mockIn.mockResolvedValue({
        data: [{ id: 1, name: "Crystal Ball", inventory: 10 }],
        error: null,
      });

      const result = await PaymentService.checkInventory(testItems);

      expect(result.available).toBe(false);
      expect(result.failedItems).toContain("Tarot Deck (not found)");
    });

    it("should allow null inventory (unlimited stock)", async () => {
      mockIn.mockResolvedValue({
        data: [
          { id: 1, name: "Crystal Ball", inventory: null },
          { id: 2, name: "Tarot Deck", inventory: null },
        ],
        error: null,
      });

      const result = await PaymentService.checkInventory(testItems);

      expect(result.available).toBe(true);
    });

    it("should fail-safe on database error", async () => {
      mockIn.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await PaymentService.checkInventory(testItems);

      expect(result.available).toBe(true); // Fail-safe allows checkout
      consoleSpy.mockRestore();
    });

    it("should fail-safe on thrown exception", async () => {
      mockIn.mockRejectedValue(new Error("Network error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await PaymentService.checkInventory(testItems);

      expect(result.available).toBe(true); // Fail-safe allows checkout
      consoleSpy.mockRestore();
    });
  });

  describe("getOrderBySessionId", () => {
    it("should query orders table with session ID", async () => {
      mockSingle.mockResolvedValue({
        data: { id: "order_123", status: "completed" },
        error: null,
      });

      await PaymentService.getOrderBySessionId("cs_test_123");

      expect(mockFrom).toHaveBeenCalledWith("orders");
      expect(mockEq).toHaveBeenCalledWith("stripe_checkout_session_id", "cs_test_123");
    });

    it("should return order data on success", async () => {
      const orderData = {
        id: "order_123",
        status: "completed",
        total: 99.99,
      };
      mockSingle.mockResolvedValue({
        data: orderData,
        error: null,
      });

      const result = await PaymentService.getOrderBySessionId("cs_test_123");

      expect(result).toEqual(orderData);
    });

    it("should return null on error", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const result = await PaymentService.getOrderBySessionId("invalid_session");

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});
