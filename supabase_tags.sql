-- Create Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'Expert', 'ProductCategory', 'Intention', 'Element', 'Zodiac'
  color TEXT, -- Hex color for UI
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Admin Manage Tags" ON public.tags FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));
-- Note: Simplified policy for now, assuming admin checks are handled elsewhere or via service_role for admins

-- Insert Default Data
INSERT INTO public.tags (name, type, color) VALUES
-- Product Categories
('Crystals', 'ProductCategory', '#a855f7'),
('Tarot', 'ProductCategory', '#f59e0b'),
('Cleansing', 'ProductCategory', '#10b981'),
('Jewelry', 'ProductCategory', '#3b82f6'),
('Candles', 'ProductCategory', '#f43f5e'),

-- Expert Specialties
('Astrology', 'Expert', '#8b5cf6'),
('Tarot Reading', 'Expert', '#d97706'),
('Feng Shui', 'Expert', '#059669'),
('Dream Interpretation', 'Expert', '#6366f1'),
('Numerology', 'Expert', '#ec4899'),
('Vedic', 'Expert', '#f97316'),
('Karma', 'Expert', '#64748b'),
('Life Path', 'Expert', '#14b8a6'),
('Relationships', 'Expert', '#e11d48'),
('Clarity', 'Expert', '#0ea5e9'),

-- Elements
('Fire', 'Element', '#ef4444'),
('Water', 'Element', '#3b82f6'),
('Air', 'Element', '#a855f7'),
('Earth', 'Element', '#22c55e'),
('Spirit', 'Element', '#eab308'),

-- Intentions (Vibes)
('Love & Relationships', 'Intention', '#ec4899'),
('Wealth & Career', 'Intention', '#f59e0b'),
('Protection', 'Intention', '#64748b'),
('Healing', 'Intention', '#10b981');
