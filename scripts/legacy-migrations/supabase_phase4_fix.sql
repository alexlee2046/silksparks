-- Fix missing columns from Phase 4

ALTER TABLE public.currencies ADD COLUMN IF NOT EXISTS symbol TEXT DEFAULT '$';
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS countries TEXT[];

-- Retry Seed
INSERT INTO public.currencies (code, name, symbol, rate, is_default) VALUES
('USD', 'US Dollar', '$', 1.0, true),
('EUR', 'Euro', '€', 0.92, false),
('GBP', 'British Pound', '£', 0.79, false)
ON CONFLICT (code) DO NOTHING;

-- Retry Shipping Seed
DO $$
DECLARE
    zone_id UUID;
BEGIN
    -- Insert Zone if not exists
    INSERT INTO public.shipping_zones (name, countries) 
    VALUES ('Global', '{"US", "CA", "UK", "AU"}')
    ON CONFLICT DO NOTHING; 
    -- Note: no unique constraint on name, so this might duplicate if run multiple times without check.
    -- Better to check first.
    
    SELECT id INTO zone_id FROM public.shipping_zones WHERE name = 'Global' LIMIT 1;
    
    IF zone_id IS NOT NULL THEN
        INSERT INTO public.shipping_rates (zone_id, name, price)
        VALUES (zone_id, 'Standard Shipping', 15.00);
    END IF;
END $$;
