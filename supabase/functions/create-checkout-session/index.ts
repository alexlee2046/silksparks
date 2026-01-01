/**
 * Stripe Checkout Session Edge Function
 * Creates a Stripe Checkout session for cart items
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

// SECURITY: Restrict CORS to known origins only
const ALLOWED_ORIGINS = [
  "https://silksparks.com",
  "https://www.silksparks.com",
  "http://localhost:3000", // Development
  "http://localhost:5173", // Vite dev server
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Only allow known origins, default to production domain for invalid origins
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin", // Important for CDN caching
  };
}

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutRequest {
  items: CartItem[];
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate environment
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { items, currency = "usd", successUrl, cancelUrl } = body;

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const finalSuccessUrl = successUrl || `${origin}/dashboard/orders?success=true`;
    const finalCancelUrl = cancelUrl || `${origin}/shop?canceled=true`;

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create pending order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total,
        currency,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Failed to create order:", orderError);
      throw new Error("Failed to create order");
    }

    // Create order items
    const orderItems = items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        order_id: order.id,
        product_id: typeof item.id === "number" ? item.id : null,
        name: item.name,
        price: item.price,
        image_url: item.image || null,
        type: "product",
      }))
    );

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Failed to create order items:", itemsError);
      // Rollback order
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error("Failed to create order items");
    }

    // Create Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Generate idempotency key to prevent duplicate sessions on retry
    // Key is based on user_id + order_id, valid for ~1 hour window
    const idempotencyKey = `checkout_${user.id}_${order.id}_${Math.floor(Date.now() / 3600000)}`;

    // Create Stripe Checkout Session with idempotency key
    const session = await stripe.checkout.sessions.create(
      {
        customer_email: user.email,
        line_items: lineItems,
        mode: "payment",
        success_url: `${finalSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: finalCancelUrl,
        metadata: {
          order_id: order.id,
          user_id: user.id,
        },
        shipping_address_collection: {
          allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "JP", "CN"],
        },
        billing_address_collection: "required",
      },
      {
        idempotencyKey,
      }
    );

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: "processing",
      })
      .eq("id", order.id);

    console.log(`[Checkout] Created session ${session.id} for order ${order.id}`);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
        orderId: order.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Checkout] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
