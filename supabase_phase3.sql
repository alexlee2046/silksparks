-- Phase 3: Consultation & Booking

-- 1. Create Expert Availability table
CREATE TABLE IF NOT EXISTS public.expert_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expert_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read availability" ON public.expert_availability;
CREATE POLICY "Public read availability" ON public.expert_availability FOR SELECT USING (true);

-- 2. Create Consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  intake_form JSONB, -- Stores focus area, questions
  delivery_method TEXT, -- Video, Live
  meeting_link TEXT,
  recording_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Note: user_id column exists in table definition above.
-- If error persists, it might be due to table already existing with old schema (if previous run partially succeeded but failed on policy).
-- We should verify if table exists and has user_id. 
-- Since IF NOT EXISTS is used, table creation is skipped if it exists.
-- So we need to ALTER TABLE to ensure columns exist if we are migrating.
-- Or just DROP TABLE for this dev env since no data yet.

DROP POLICY IF EXISTS "Users view own consultations" ON public.consultations;
CREATE POLICY "Users view own consultations" ON public.consultations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own consultations" ON public.consultations;
CREATE POLICY "Users insert own consultations" ON public.consultations
  FOR INSERT WITH CHECK (auth.uid() = user_id);


