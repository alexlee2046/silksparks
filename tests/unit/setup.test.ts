import { describe, it, expect, vi } from "vitest";
import {
  createMockUser,
  createMockSession,
  createMockProfile,
  createMockProduct,
  createMockOrder,
  createQueryBuilder,
  resetIdCounter,
} from "../mocks/supabase";
import {
  createMockStripeClient,
  createMockPaymentIntent,
  createMockCheckoutSession,
  resetSessionCounter,
} from "../mocks/stripe";

describe("Test Infrastructure Setup", () => {
  beforeEach(() => {
    resetIdCounter();
    resetSessionCounter();
  });

  describe("Supabase Mock Factories", () => {
    it("should create mock user with defaults", () => {
      const user = createMockUser();
      expect(user.id).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.created_at).toBeDefined();
    });

    it("should create mock user with overrides", () => {
      const user = createMockUser({ email: "custom@test.com" });
      expect(user.email).toBe("custom@test.com");
    });

    it("should create mock session", () => {
      const session = createMockSession();
      expect(session.user).toBeDefined();
      expect(session.access_token).toBeDefined();
      expect(session.refresh_token).toBeDefined();
      expect(session.expires_at).toBeGreaterThan(0);
    });

    it("should create mock profile with birth data", () => {
      const profile = createMockProfile();
      expect(profile.name).toBe("Test User");
      expect(profile.birth_date).toBe("1990-01-15");
      expect(profile.birth_time).toBe("14:30");
      expect(profile.birth_location).toBe("Beijing, China");
      expect(profile.is_admin).toBe(false);
    });

    it("should create admin profile", () => {
      const profile = createMockProfile({ is_admin: true });
      expect(profile.is_admin).toBe(true);
    });

    it("should create mock product", () => {
      const product = createMockProduct();
      expect(product.name).toBe("Test Crystal");
      expect(product.price).toBe(99.99);
      expect(product.is_active).toBe(true);
    });

    it("should create mock order", () => {
      const order = createMockOrder();
      expect(order.status).toBe("pending");
      expect(order.items).toHaveLength(1);
    });

    it("should create query builder with chainable methods", async () => {
      const builder = createQueryBuilder({ data: [{ id: "1", name: "Test" }] });

      const result = await builder
        .select("*")
        .eq("id", "1")
        .order("created_at", { ascending: false })
        .limit(10);

      expect(builder.select).toHaveBeenCalledWith("*");
      expect(builder.eq).toHaveBeenCalledWith("id", "1");
      expect(builder.order).toHaveBeenCalled();
      expect(builder.limit).toHaveBeenCalledWith(10);
    });

    it("should return single result", async () => {
      const data = { id: "1", name: "Test" };
      const builder = createQueryBuilder({ data });

      const result = await builder.select("*").single();
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });

    it("should return error when configured", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "Not found", code: "404" },
      });

      const result = await builder.select("*").single();
      expect(result.error).toEqual({ message: "Not found", code: "404" });
    });
  });

  describe("Stripe Mock Factories", () => {
    it("should create mock payment intent", () => {
      const intent = createMockPaymentIntent();
      expect(intent.id).toContain("pi_test_");
      expect(intent.client_secret).toContain("_secret_");
      expect(intent.status).toBe("requires_payment_method");
      expect(intent.amount).toBe(9999);
      expect(intent.currency).toBe("cny");
    });

    it("should create mock checkout session", () => {
      const session = createMockCheckoutSession();
      expect(session.id).toContain("cs_test_");
      expect(session.url).toContain("checkout.stripe.com");
      expect(session.status).toBe("open");
    });

    it("should create mock stripe client", async () => {
      const stripe = createMockStripeClient();

      expect(stripe.elements).toBeDefined();
      expect(stripe.confirmPayment).toBeDefined();
      expect(stripe.redirectToCheckout).toBeDefined();

      const paymentResult = await stripe.confirmPayment({});
      expect(paymentResult.paymentIntent.status).toBe("succeeded");
    });
  });

  describe("Global Mocks", () => {
    it("should have localStorage mock", () => {
      localStorage.setItem("test", "value");
      expect(localStorage.getItem("test")).toBe("value");
      localStorage.removeItem("test");
      expect(localStorage.getItem("test")).toBeNull();
    });

    it("should have matchMedia mock", () => {
      const result = window.matchMedia("(prefers-color-scheme: dark)");
      expect(result.matches).toBe(false);
      expect(result.media).toBe("(prefers-color-scheme: dark)");
    });

    it("should have ResizeObserver mock", () => {
      const observer = new ResizeObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });

    it("should have IntersectionObserver mock", () => {
      const observer = new IntersectionObserver(() => {});
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });
});
