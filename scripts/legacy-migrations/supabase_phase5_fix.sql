-- Phase 5: AI & Tags Fix

-- 1. Create Tags table (if not exists)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Product Tags table (Many-to-Many)
-- Ensure 'products' table exists (it should from init)
CREATE TABLE IF NOT EXISTS public.product_tags (
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- 3. AI Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tags" ON public.tags;
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read product_tags" ON public.product_tags;
CREATE POLICY "Public read product_tags" ON public.product_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read settings" ON public.system_settings;
CREATE POLICY "Public read settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage tags" ON public.tags;
CREATE POLICY "Admins manage tags" ON public.tags FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

DROP POLICY IF EXISTS "Admins manage product_tags" ON public.product_tags;
CREATE POLICY "Admins manage product_tags" ON public.product_tags FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

DROP POLICY IF EXISTS "Admins manage settings" ON public.system_settings;
CREATE POLICY "Admins manage settings" ON public.system_settings FOR ALL USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- 5. Seed Data
-- Tags
INSERT INTO public.tags (name) VALUES 
('Love'), ('Wealth'), ('Protection'), ('Healing'), ('Anxiety'), ('Clarity'), ('Spirituality'), ('Grounding')
ON CONFLICT (name) DO NOTHING;

-- Seed AI Settings
INSERT INTO public.system_settings (key, value) VALUES
('ai_config', '{"model": "gemini-pro", "temperature": 0.7, "max_tokens": 1000}'),
('ai_prompts', '{
  "daily_spark": "Act as a mystical astrology expert. Give me a short, one-sentence daily spark for {{sign}}. Max 20 words.",
  "tarot_interpretation": "You are an expert Tarot reader. Question: {{question}}. Card: {{cardName}}. Provide 3-sentence interpretation.",
  "birth_chart_analysis": "Analyze the birth chart for {{name}}. Planets: {{planets}}. Elements: {{elements}}. Provide 2-paragraph insight."
}')
ON CONFLICT (key) DO NOTHING;

-- Seed Product Tags
DO $$
DECLARE
    p_id INTEGER;
    t_id1 UUID;
    t_id2 UUID;
BEGIN
    -- Amethyst Cluster: Spirituality, Protection
    SELECT id INTO p_id FROM public.products WHERE title = 'Amethyst Cluster' LIMIT 1;
    SELECT id INTO t_id1 FROM public.tags WHERE name = 'Spirituality' LIMIT 1;
    SELECT id INTO t_id2 FROM public.tags WHERE name = 'Protection' LIMIT 1;
    
    IF p_id IS NOT NULL AND t_id1 IS NOT NULL THEN
        INSERT INTO public.product_tags (product_id, tag_id) VALUES (p_id, t_id1) ON CONFLICT DO NOTHING;
    END IF;
    
    IF p_id IS NOT NULL AND t_id2 IS NOT NULL THEN
        INSERT INTO public.product_tags (product_id, tag_id) VALUES (p_id, t_id2) ON CONFLICT DO NOTHING;
    END IF;

    -- Rose Quartz: Love, Healing
    SELECT id INTO p_id FROM public.products WHERE title = 'Rose Quartz Heart' LIMIT 1;
    SELECT id INTO t_id1 FROM public.tags WHERE name = 'Love' LIMIT 1;
    SELECT id INTO t_id2 FROM public.tags WHERE name = 'Healing' LIMIT 1;
    
    IF p_id IS NOT NULL AND t_id1 IS NOT NULL THEN
        INSERT INTO public.product_tags (product_id, tag_id) VALUES (p_id, t_id1) ON CONFLICT DO NOTHING;
    END IF;
    
    IF p_id IS NOT NULL AND t_id2 IS NOT NULL THEN
        INSERT INTO public.product_tags (product_id, tag_id) VALUES (p_id, t_id2) ON CONFLICT DO NOTHING;
    END IF;
END $$;
