-- Add Stripe payment fields to orders table
-- Migration: 20251231100001_add_stripe_fields.sql

-- Add payment-related columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for Stripe session lookups (used by webhooks)
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session
ON public.orders(stripe_checkout_session_id)
WHERE stripe_checkout_session_id IS NOT NULL;

-- Create index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent
ON public.orders(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Comment on columns
COMMENT ON COLUMN public.orders.stripe_checkout_session_id IS 'Stripe Checkout Session ID (cs_...)';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID (pi_...)';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, processing, succeeded, failed, refunded';
COMMENT ON COLUMN public.orders.currency IS 'ISO 4217 currency code (lowercase)';
COMMENT ON COLUMN public.orders.shipping_address IS 'Shipping address from Stripe Checkout';
