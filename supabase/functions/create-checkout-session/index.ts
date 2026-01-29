/**
 * Stripe Checkout Session Edge Function
 * Creates a Stripe Checkout session for:
 * - Cart items (products)
 * - Subscription plans (monthly/yearly membership)
 * - One-time purchases (yearly forecast)
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

// Stripe Price IDs - should be configured in Stripe Dashboard
// These are placeholders; actual IDs will be set via environment or DB config
const PRICE_IDS = {
  membership_monthly: "price_membership_monthly", // $9.99/month
  membership_yearly: "price_membership_yearly",   // $79.99/year
  yearly_forecast: "price_yearly_forecast",       // $4.99 one-time
};

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Request type for cart checkout (existing behavior)
interface CartCheckoutRequest {
  mode: "cart";
  items: CartItem[];
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Request type for subscription checkout
interface SubscriptionCheckoutRequest {
  mode: "subscription";
  plan: "monthly" | "yearly";
  successUrl?: string;
  cancelUrl?: string;
}

// Request type for one-time purchase (yearly forecast)
interface OneTimeCheckoutRequest {
  mode: "payment";
  productType: "yearly_forecast";
  successUrl?: string;
  cancelUrl?: string;
}

type CheckoutRequest = CartCheckoutRequest | SubscriptionCheckoutRequest | OneTimeCheckoutRequest;

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
    const requestOrigin = req.headers.get("origin") || "http://localhost:3000";

    // Load Stripe price IDs from system_settings or use defaults
    const { data: stripeConfig } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "stripe_config")
      .single();

    const priceIds = {
      membership_monthly: stripeConfig?.value?.price_membership_monthly || PRICE_IDS.membership_monthly,
      membership_yearly: stripeConfig?.value?.price_membership_yearly || PRICE_IDS.membership_yearly,
      yearly_forecast: stripeConfig?.value?.price_yearly_forecast || PRICE_IDS.yearly_forecast,
    };

    // Route based on checkout mode
    if (body.mode === "subscription") {
      return await handleSubscriptionCheckout(
        stripe,
        supabase,
        user,
        body as SubscriptionCheckoutRequest,
        priceIds,
        requestOrigin,
        corsHeaders
      );
    } else if (body.mode === "payment" && "productType" in body) {
      return await handleOneTimeCheckout(
        stripe,
        supabase,
        user,
        body as OneTimeCheckoutRequest,
        priceIds,
        requestOrigin,
        corsHeaders
      );
    } else {
      // Default: cart checkout (existing behavior)
      return await handleCartCheckout(
        stripe,
        supabase,
        user,
        body as CartCheckoutRequest,
        requestOrigin,
        corsHeaders
      );
    }
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

/**
 * Handle subscription checkout (membership plans)
 */
async function handleSubscriptionCheckout(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string },
  body: SubscriptionCheckoutRequest,
  priceIds: Record<string, string>,
  requestOrigin: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { plan, successUrl, cancelUrl } = body;

  // Validate plan
  if (!["monthly", "yearly"].includes(plan)) {
    return new Response(
      JSON.stringify({ error: "Invalid subscription plan" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if user already has an active subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["active", "past_due"])
    .single();

  if (existingSubscription) {
    return new Response(
      JSON.stringify({
        error: "You already have an active subscription",
        code: "ALREADY_SUBSCRIBED"
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const priceId = plan === "monthly" ? priceIds.membership_monthly : priceIds.membership_yearly;
  const finalSuccessUrl = successUrl || `${requestOrigin}/membership?success=true`;
  const finalCancelUrl = cancelUrl || `${requestOrigin}/membership?canceled=true`;

  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  // Create or retrieve Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    // Save customer ID to profile
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // Generate idempotency key
  const idempotencyKey = `sub_${user.id}_${plan}_${Math.floor(Date.now() / 3600000)}`;

  // Create Stripe Checkout Session for subscription
  const session = await stripe.checkout.sessions.create(
    {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${finalSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: user.id,
        plan: plan,
        type: "subscription",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: plan,
        },
      },
      billing_address_collection: "required",
      allow_promotion_codes: true,
    },
    { idempotencyKey }
  );

  console.log(`[Checkout] Created subscription session ${session.id} for user ${user.id}, plan: ${plan}`);

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      url: session.url,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle one-time payment checkout (yearly forecast)
 */
async function handleOneTimeCheckout(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string },
  body: OneTimeCheckoutRequest,
  priceIds: Record<string, string>,
  requestOrigin: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { productType, successUrl, cancelUrl } = body;

  // Currently only yearly_forecast is supported
  if (productType !== "yearly_forecast") {
    return new Response(
      JSON.stringify({ error: "Invalid product type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if user already has yearly forecast access
  const { data: profile } = await supabase
    .from("profiles")
    .select("has_yearly_forecast, subscription_tier")
    .eq("id", user.id)
    .single();

  // Premium members already have access
  if (profile?.subscription_tier === "premium") {
    return new Response(
      JSON.stringify({
        error: "Premium members already have access to yearly forecasts",
        code: "ALREADY_PREMIUM"
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if already purchased
  if (profile?.has_yearly_forecast) {
    return new Response(
      JSON.stringify({
        error: "You already have access to the yearly forecast",
        code: "ALREADY_PURCHASED"
      }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const priceId = priceIds.yearly_forecast;
  const finalSuccessUrl = successUrl || `${requestOrigin}/horoscope/yearly?success=true`;
  const finalCancelUrl = cancelUrl || `${requestOrigin}/horoscope/yearly?canceled=true`;

  // Generate idempotency key
  const idempotencyKey = `forecast_${user.id}_${new Date().getFullYear()}_${Math.floor(Date.now() / 3600000)}`;

  // Create Stripe Checkout Session for one-time payment
  const session = await stripe.checkout.sessions.create(
    {
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${finalSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: user.id,
        type: "yearly_forecast",
        year: new Date().getFullYear().toString(),
      },
      billing_address_collection: "required",
      allow_promotion_codes: true,
    },
    { idempotencyKey }
  );

  console.log(`[Checkout] Created yearly forecast session ${session.id} for user ${user.id}`);

  return new Response(
    JSON.stringify({
      sessionId: session.id,
      url: session.url,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

/**
 * Handle cart checkout (existing product purchase flow)
 */
async function handleCartCheckout(
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string },
  body: CartCheckoutRequest,
  requestOrigin: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { items, currency = "usd", successUrl, cancelUrl } = body;

  if (!items || items.length === 0) {
    return new Response(
      JSON.stringify({ error: "No items in cart" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // SECURITY: Verify prices from database to prevent price manipulation
  const productIds = items
    .map(item => typeof item.id === "number" ? item.id : parseInt(item.id as string, 10))
    .filter(id => !isNaN(id));

  if (productIds.length !== items.length) {
    return new Response(
      JSON.stringify({ error: "Invalid product IDs in cart" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Query products to verify prices
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, price, title")
    .in("id", productIds);

  if (productsError || !products) {
    console.error("Failed to fetch products:", productsError);
    return new Response(
      JSON.stringify({ error: "Failed to verify product prices" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create a map of verified prices from database
  const priceMap = new Map(products.map(p => [p.id, { price: p.price, name: p.title }]));

  // Validate each item price
  const validatedItems: CartItem[] = [];
  for (const item of items) {
    const productId = typeof item.id === "number" ? item.id : parseInt(item.id as string, 10);
    const dbProduct = priceMap.get(productId);

    if (!dbProduct) {
      return new Response(
        JSON.stringify({ error: `Product not found: ${item.name}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if client price matches database price (allow small floating point tolerance)
    if (Math.abs(dbProduct.price - item.price) > 0.01) {
      console.warn(`[Checkout] Price mismatch for product ${productId}: client=${item.price}, db=${dbProduct.price}`);
      return new Response(
        JSON.stringify({
          error: "Price has changed. Please refresh your cart.",
          code: "PRICE_MISMATCH"
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use verified price from database
    validatedItems.push({
      ...item,
      price: dbProduct.price,
      name: dbProduct.name,
    });
  }

  // Get redirect URLs
  const finalSuccessUrl = successUrl || `${requestOrigin}/dashboard/orders?success=true`;
  const finalCancelUrl = cancelUrl || `${requestOrigin}/shop?canceled=true`;

  // Calculate total using verified prices from database
  const total = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  // Create order items using validated items with verified prices
  const orderItems = validatedItems.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      order_id: order.id,
      product_id: typeof item.id === "number" ? item.id : parseInt(item.id as string, 10),
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

  // Create Stripe line items using validated prices
  const lineItems = validatedItems.map((item) => ({
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

  // Generate idempotency key
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
        type: "cart",
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "JP", "CN"],
      },
      billing_address_collection: "required",
    },
    { idempotencyKey }
  );

  // Update order with Stripe session ID
  await supabase
    .from("orders")
    .update({
      stripe_checkout_session_id: session.id,
      payment_status: "processing",
    })
    .eq("id", order.id);

  console.log(`[Checkout] Created cart session ${session.id} for order ${order.id}`);

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
}
