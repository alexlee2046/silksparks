/**
 * Stripe Webhook Handler Edge Function
 * Handles Stripe events for:
 * - Product orders (checkout.session.completed, payment_intent.*, charge.refunded)
 * - Subscriptions (customer.subscription.*, invoice.payment_failed)
 * - One-time purchases (yearly forecast)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";

// SECURITY: Webhooks are server-to-server calls from Stripe
// No CORS headers needed - Stripe doesn't send preflight requests
const responseHeaders = {
  "Content-Type": "application/json",
};

serve(async (req) => {
  // SECURITY: Block OPTIONS - webhooks should never use preflight
  if (req.method === "OPTIONS") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Validate environment
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // SECURITY: Always require webhook secret in production
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured - rejecting webhook");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: responseHeaders }
      );
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

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // SECURITY: Always require signature header
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 400, headers: responseHeaders }
      );
    }

    let event: Stripe.Event;

    // Verify webhook signature - REQUIRED, no fallback
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: responseHeaders }
      );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // ============ Checkout Events ============
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, stripe, session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(supabase, session);
        break;
      }

      // ============ Payment Events ============
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(supabase, paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(supabase, charge);
        break;
      }

      // ============ Subscription Events ============
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Webhook handler failed" }),
      { status: 500, headers: responseHeaders }
    );
  }
});

/**
 * Handle successful checkout completion
 * Routes to different handlers based on checkout type
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const checkoutType = session.metadata?.type;
  const userId = session.metadata?.user_id;

  console.log(`[Webhook] Checkout completed - type: ${checkoutType}, user: ${userId}`);

  // Route based on checkout type
  switch (checkoutType) {
    case "subscription":
      await handleSubscriptionCheckoutCompleted(supabase, stripe, session);
      break;

    case "yearly_forecast":
      await handleYearlyForecastCheckoutCompleted(supabase, session);
      break;

    case "cart":
    default:
      await handleCartCheckoutCompleted(supabase, session);
      break;
  }
}

/**
 * Handle cart checkout completion (product orders)
 */
async function handleCartCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error("[Webhook] No order_id in session metadata");
    return;
  }

  console.log(`[Webhook] Cart checkout completed for order ${orderId}`);

  // Extract shipping address if available
  const shippingAddress = session.shipping_details?.address
    ? {
        name: session.shipping_details.name,
        line1: session.shipping_details.address.line1,
        line2: session.shipping_details.address.line2,
        city: session.shipping_details.address.city,
        state: session.shipping_details.address.state,
        postal_code: session.shipping_details.address.postal_code,
        country: session.shipping_details.address.country,
      }
    : null;

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "succeeded",
      stripe_payment_intent_id: session.payment_intent as string,
      shipping_address: shippingAddress,
    })
    .eq("id", orderId);

  if (error) {
    console.error(`[Webhook] Failed to update order ${orderId}:`, error);
    throw error;
  }

  console.log(`[Webhook] Order ${orderId} marked as paid`);
}

/**
 * Handle subscription checkout completion
 */
async function handleSubscriptionCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan as "monthly" | "yearly";
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error("[Webhook] Missing user_id or subscription_id in session");
    return;
  }

  console.log(`[Webhook] Subscription checkout completed for user ${userId}, plan: ${plan}`);

  // Fetch subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Upsert subscription record
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      plan: plan,
      status: "active",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id"
    });

  if (subError) {
    console.error(`[Webhook] Failed to create subscription for user ${userId}:`, subError);
    throw subError;
  }

  // Update user profile to premium tier
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      subscription_tier: "premium",
      stripe_customer_id: session.customer as string,
    })
    .eq("id", userId);

  if (profileError) {
    console.error(`[Webhook] Failed to update profile for user ${userId}:`, profileError);
  }

  console.log(`[Webhook] User ${userId} upgraded to premium`);
}

/**
 * Handle yearly forecast one-time purchase completion
 */
async function handleYearlyForecastCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const year = session.metadata?.year;

  if (!userId) {
    console.error("[Webhook] No user_id in session metadata");
    return;
  }

  console.log(`[Webhook] Yearly forecast purchased for user ${userId}, year: ${year}`);

  // Update user profile to unlock yearly forecast
  const { error } = await supabase
    .from("profiles")
    .update({ has_yearly_forecast: true })
    .eq("id", userId);

  if (error) {
    console.error(`[Webhook] Failed to unlock yearly forecast for user ${userId}:`, error);
    throw error;
  }

  console.log(`[Webhook] Yearly forecast unlocked for user ${userId}`);
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutExpired(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error("[Webhook] No order_id in session metadata");
    return;
  }

  console.log(`[Webhook] Checkout expired for order ${orderId}`);

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "expired",
    })
    .eq("id", orderId);

  if (error) {
    console.error(`[Webhook] Failed to update order ${orderId}:`, error);
  }
}

/**
 * Handle successful payment (backup handler)
 */
async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);

  // Update any orders with this payment intent that aren't already marked paid
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "succeeded",
    })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .neq("payment_status", "succeeded");

  if (error) {
    console.error(`[Webhook] Failed to update payment status:`, error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      status: "payment_failed",
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error(`[Webhook] Failed to update order:`, error);
  }
}

/**
 * Handle refund
 */
async function handleRefund(
  supabase: ReturnType<typeof createClient>,
  charge: Stripe.Charge
) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.log("[Webhook] No payment_intent on charge, skipping");
    return;
  }

  console.log(`[Webhook] Refund processed for payment: ${paymentIntentId}`);

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "refunded",
      status: "refunded",
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    console.error(`[Webhook] Failed to update refund status:`, error);
  }
}

// ============ Subscription Event Handlers ============

/**
 * Handle subscription created (usually triggered after checkout.session.completed)
 */
async function handleSubscriptionCreated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id;
  const plan = subscription.metadata?.plan as "monthly" | "yearly";

  if (!userId) {
    console.log("[Webhook] No user_id in subscription metadata, skipping");
    return;
  }

  console.log(`[Webhook] Subscription created: ${subscription.id} for user ${userId}`);

  // Upsert subscription record (may already exist from checkout.session.completed)
  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan: plan || "monthly",
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id"
    });

  if (error) {
    console.error(`[Webhook] Failed to upsert subscription:`, error);
  }
}

/**
 * Handle subscription updated (plan change, renewal, status change)
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id;

  console.log(`[Webhook] Subscription updated: ${subscription.id}, status: ${subscription.status}`);

  // Find subscription by stripe_subscription_id
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  const targetUserId = userId || existingSub?.user_id;

  if (!targetUserId) {
    console.log("[Webhook] Cannot find user for subscription, skipping");
    return;
  }

  const status = mapStripeStatus(subscription.status);

  // Update subscription record
  const { error: subError } = await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (subError) {
    console.error(`[Webhook] Failed to update subscription:`, subError);
  }

  // Update profile tier based on status
  const tier = ["active", "past_due"].includes(status) ? "premium" : "free";
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", targetUserId);

  if (profileError) {
    console.error(`[Webhook] Failed to update profile tier:`, profileError);
  }

  console.log(`[Webhook] User ${targetUserId} subscription status: ${status}, tier: ${tier}`);
}

/**
 * Handle subscription deleted (canceled or expired)
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  console.log(`[Webhook] Subscription deleted: ${subscription.id}`);

  // Find subscription by stripe_subscription_id
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!existingSub) {
    console.log("[Webhook] Subscription not found in database, skipping");
    return;
  }

  // Update subscription to cancelled
  const { error: subError } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (subError) {
    console.error(`[Webhook] Failed to update subscription:`, subError);
  }

  // Downgrade user to free tier
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ subscription_tier: "free" })
    .eq("id", existingSub.user_id);

  if (profileError) {
    console.error(`[Webhook] Failed to downgrade user:`, profileError);
  }

  console.log(`[Webhook] User ${existingSub.user_id} downgraded to free tier`);
}

/**
 * Handle invoice payment failed (subscription renewal failure)
 */
async function handleInvoicePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("[Webhook] Invoice not for subscription, skipping");
    return;
  }

  console.log(`[Webhook] Invoice payment failed for subscription: ${subscriptionId}`);

  // Update subscription to past_due
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error(`[Webhook] Failed to update subscription to past_due:`, error);
  }
}

/**
 * Handle invoice paid (subscription renewal success)
 */
async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.log("[Webhook] Invoice not for subscription, skipping");
    return;
  }

  console.log(`[Webhook] Invoice paid for subscription: ${subscriptionId}`);

  // Ensure subscription is active
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error(`[Webhook] Failed to update subscription to active:`, error);
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "cancelled";
    case "incomplete":
    case "incomplete_expired":
      return "expired";
    default:
      return "cancelled";
  }
}
