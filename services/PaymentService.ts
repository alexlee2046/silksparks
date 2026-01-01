/**
 * Payment Service - Stripe Integration
 * Handles payment processing via Stripe Checkout
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";
import { supabase } from "./supabase";

// Lazy-load Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("[PaymentService] VITE_STRIPE_PUBLISHABLE_KEY not configured");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  orderId?: string;
  error?: string;
}

export interface InventoryCheckResult {
  available: boolean;
  failedItems: string[];
}

export const PaymentService = {
  /**
   * Create a Stripe Checkout session and redirect
   * @param items Cart items to purchase
   * @param currency Currency code (default usd)
   */
  async createCheckoutSession(
    items: CartItem[],
    currency: string = "usd"
  ): Promise<CheckoutResult> {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: "Please sign in to checkout" };
      }

      // Call Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            items,
            currency,
            successUrl: `${window.location.origin}/dashboard/orders?success=true`,
            cancelUrl: `${window.location.origin}/shop?canceled=true`,
          },
        }
      );

      if (error) {
        console.error("[PaymentService] Edge function error:", error);
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        return { success: false, error: "Failed to create checkout session" };
      }

      return {
        success: true,
        sessionId: data.sessionId,
        url: data.url,
        orderId: data.orderId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      console.error("[PaymentService] Checkout error:", error);
      return { success: false, error: message };
    }
  },

  /**
   * Redirect to Stripe Checkout
   * Alternative method using Stripe.js redirect
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error("Stripe not initialized");
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Check if Stripe is properly configured
   */
  isConfigured(): boolean {
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  },

  /**
   * Validate inventory availability
   * In production, this checks against database
   */
  async checkInventory(items: CartItem[]): Promise<InventoryCheckResult> {
    try {
      // Get product IDs that are numeric (real products)
      const productIds = items
        .filter((item) => typeof item.id === "number")
        .map((item) => item.id);

      if (productIds.length === 0) {
        return { available: true, failedItems: [] };
      }

      // Check inventory in database
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, inventory")
        .in("id", productIds);

      if (error) {
        console.error("[PaymentService] Inventory check failed:", error);
        // Fail-safe: allow checkout if inventory check fails
        return { available: true, failedItems: [] };
      }

      const productMap = new Map(products?.map((p) => [p.id, p]) || []);
      const failedItems: string[] = [];

      for (const item of items) {
        if (typeof item.id !== "number") continue;

        const product = productMap.get(item.id);
        if (!product) {
          failedItems.push(`${item.name} (not found)`);
        } else if (product.inventory !== null && product.inventory < item.quantity) {
          failedItems.push(`${item.name} (only ${product.inventory} available)`);
        }
      }

      return {
        available: failedItems.length === 0,
        failedItems,
      };
    } catch (error) {
      console.error("[PaymentService] Inventory check error:", error);
      // Fail-safe: allow checkout
      return { available: true, failedItems: [] };
    }
  },

  /**
   * Get order status by session ID
   * Used after redirect from Stripe Checkout
   */
  async getOrderBySessionId(sessionId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_checkout_session_id", sessionId)
      .single();

    if (error) {
      console.error("[PaymentService] Failed to get order:", error);
      return null;
    }

    return data;
  },
};
