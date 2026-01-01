/**
 * Stripe Webhook Handler Edge Function
 * Handles Stripe events for payment status updates
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(supabase, session);
        break;
      }

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
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error("[Webhook] No order_id in session metadata");
    return;
  }

  console.log(`[Webhook] Checkout completed for order ${orderId}`);

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
