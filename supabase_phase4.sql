-- Phase 4: Admin & Configuration

-- 1. Create Currencies table
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- USD, EUR, GBP
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  rate DECIMAL(10, 4) DEFAULT 1.0, -- Exchange rate relative to base
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read currencies" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "Admins manage currencies" ON public.currencies FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- 2. Create Shipping Zones & Rates
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "North America", "Europe"
  countries TEXT[], -- Array of country codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Standard", "Express"
  price DECIMAL(10, 2) NOT NULL,
  min_order_price DECIMAL(10, 2),
  max_order_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shipping" ON public.shipping_zones FOR SELECT USING (true);
CREATE POLICY "Public read rates" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "Admins manage zones" ON public.shipping_zones FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
CREATE POLICY "Admins manage rates" ON public.shipping_rates FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- 3. Seed Default Data
INSERT INTO public.currencies (code, name, symbol, rate, is_default) VALUES
('USD', 'US Dollar', '$', 1.0, true),
('EUR', 'Euro', '€', 0.92, false),
('GBP', 'British Pound', '£', 0.79, false)
ON CONFLICT (code) DO NOTHING;

-- Seed Shipping (via DO block to get IDs, or just simple inserts if we don't care about relationships in seed)
-- We'll insert a zone and rate manually if needed, or let Admin UI handle it. 
-- For now, let's insert a "Global" zone.
INSERT INTO public.shipping_zones (name, countries) VALUES ('Global', '{"US", "CA", "UK", "AU"}');

-- Need to get the ID to insert rate, so we use a CTE
WITH zone AS (
  SELECT id FROM public.shipping_zones WHERE name = 'Global' LIMIT 1
)
INSERT INTO public.shipping_rates (zone_id, name, price)
SELECT id, 'Standard Shipping', 15.00 FROM zone;
